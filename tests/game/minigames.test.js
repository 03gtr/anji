import { describe, it, expect } from 'vitest';
import { MAZES, parseMaze, createMazeState, moveIn, shortestPath, reachable, mazeMedal } from '../../src/game/minigames/maze-logic.js';
import { COURSES, createChase, stepChase, chaseMedal, CHASE } from '../../src/game/minigames/chase-logic.js';
import { MINIGAMES } from '../../src/game/minigames/registry.js';
import { stepBody, MOVE, followVelocity } from '../../src/game/world/physics.js';
import { GROUND } from '../../src/game/world/props.js';
import { createHunt, tapAt, useHint, huntMedal, hitBox, MIN_HIT } from '../../src/game/minigames/hidden-logic.js';
import { HIDDEN_SCENES } from '../../src/game/minigames/hidden-scenes.js';
import { RECIPES, INGREDIENTS, checkRecipe, exampleSolution } from '../../src/game/minigames/kitchen-logic.js';
import { PIPE_LEVELS, parseLevel, scramble, isSolved, rotateAt, flow } from '../../src/game/minigames/pipes-logic.js';
import { TRACKS, CAR, createRace, stepRace, raceMedal, botInput, createRaceController, beatRival } from '../../src/game/minigames/racing-logic.js';
import { deal, flipCard, hideOpen, cardsMedal } from '../../src/game/minigames/cards-logic.js';
import { createQuiz, answerQuiz, quizMedal } from '../../src/game/minigames/quiz-logic.js';
import { QUIZ_SETS } from '../../src/game/minigames/quiz-sets.js';
import { place, clearCell, roseBudget, rosesUsed, PIECES, COLS, ROWS } from '../../src/game/minigames/garden-logic.js';

describe('hedge maze', () => {
  for (const [name, rows] of Object.entries(MAZES)) {
    it(`${name}: solvable, with every path cell and petal reachable`, () => {
      const m = parseMaze(rows);
      expect(shortestPath(m)).toBeGreaterThan(10);
      const r = reachable(m);
      rows.forEach((row, y) => [...row].forEach((c, x) => c !== '#' && expect(r.has(`${x},${y}`), `${name} ${x},${y}`).toBe(true)));
    });
  }

  it('walls block, petals count once, the exit finishes', () => {
    const m = parseMaze(['#####', '#S*E#', '#####']);
    const s = createMazeState(m);
    expect(moveIn(m, s, 'up')).toEqual({ moved: false, event: null });
    expect(moveIn(m, s, 'right').event).toBe('petal');
    expect(moveIn(m, s, 'right').event).toBe('exit');
    expect(s.done).toBe(true);
    expect(moveIn(m, s, 'left').moved).toBe(false);
    expect(s.petals).toHaveLength(1);
  });

  it('medals reward short routes', () => {
    expect(mazeMedal(42, 42)).toBe('gold');
    expect(mazeMedal(70, 42)).toBe('silver');
    expect(mazeMedal(200, 42)).toBe('bronze');
  });
});

describe('Nurse Needle chase', () => {
  for (const [name, c] of Object.entries(COURSES)) {
    it(`${name}: obstacles leave time to land and jump again`, () => {
      const xs = c.obstacles.map((o) => o.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(260);
      expect(Math.max(...xs)).toBeLessThan(c.length);
    });

    it(`${name}: a player who jumps in time finishes without a single hit (gold is possible)`, () => {
      const s = createChase(c);
      for (let i = 0; i < 20000 && !s.done; i++) {
        const next = c.obstacles.find((o) => o.x + o.w / 2 > s.x - CHASE.half);
        const jump = Boolean(next && next.x - s.x < 55 && next.x - s.x > 0);
        stepChase(c, s, 1 / 60, { jump });
      }
      expect(s.done).toBe(true);
      expect(s.hits).toBe(0);
      expect(chaseMedal(s)).toBe('gold');
    });

    it(`${name}: a player who never jumps is caught, sent back to a checkpoint, and can still finish later`, () => {
      const s = createChase(c);
      let caught = 0;
      for (let i = 0; i < 3000; i++) caught += stepChase(c, s, 1 / 60, {}).caught ? 1 : 0;
      expect(caught).toBeGreaterThan(0);
      expect(c.checkpoints).toContain(s.checkpoint);
    });
  }

  it('every jump is full height (a quick tap is enough)', () => {
    const c = COURSES.conservatory;
    const s = createChase(c);
    stepChase(c, s, 1 / 60, { jump: true });
    let peak = 0;
    for (let i = 0; i < 60; i++) {
      stepChase(c, s, 1 / 60, {});
      peak = Math.max(peak, s.y);
    }
    expect(peak).toBeGreaterThan(Math.max(...Object.values(c.obstacles).map((o) => o.h)) + 20);
  });
});

describe('minigame registry', () => {
  it('every minigame has a title, goal, controls and a loadable module', async () => {
    for (const [id, m] of Object.entries(MINIGAMES)) {
      expect(m.title && m.goal, id).toBeTruthy();
      expect(m.controls?.length, id).toBeGreaterThan(0);
      const mod = await m.load();
      expect(typeof mod.mount, id).toBe('function');
    }
  });
});

describe('exploration physics', () => {
  const world = { minX: 0, maxX: 1000, platforms: [{ x: 300, y: 180, w: 100 }], solids: [{ x: 600, w: 40 }] };
  const body = () => ({ x: 100, y: GROUND, vx: 0, vy: 0, onGround: true, w: 34 });

  it('a jump rises about 105 units and lands back on the ground', () => {
    const b = body();
    stepBody(b, { dir: 0, jump: true }, world, 1 / 60);
    let top = GROUND;
    for (let i = 0; i < 120; i++) {
      stepBody(b, { dir: 0 }, world, 1 / 60);
      top = Math.min(top, b.y);
    }
    expect(GROUND - top).toBeGreaterThan(95);
    expect(GROUND - top).toBeLessThan(MOVE.jumpVelocity ** 2 / (2 * MOVE.gravity) + 5);
    expect(b.onGround).toBe(true);
    expect(b.y).toBe(GROUND);
  });

  it('lands on a one-way platform from above, and walks off its edge', () => {
    const b = { ...body(), x: 340 };
    stepBody(b, { dir: 0, jump: true }, world, 1 / 60);
    for (let i = 0; i < 120; i++) stepBody(b, { dir: 0 }, world, 1 / 60);
    expect(b.y).toBe(180);
    for (let i = 0; i < 120; i++) stepBody(b, { dir: 1 }, world, 1 / 60);
    expect(b.y).toBe(GROUND);
  });

  it('a jump pressed slightly before landing still happens (buffer)', () => {
    const b = { ...body(), y: GROUND - 6, vy: 300, onGround: false };
    stepBody(b, { dir: 0, jump: true }, world, 1 / 120);
    for (let i = 0; i < 4; i++) stepBody(b, { dir: 0 }, world, 1 / 120);
    expect(b.vy).toBeLessThan(0);
  });

  it('solid blockers stop her and scene bounds hold', () => {
    const b = { ...body(), x: 540 };
    for (let i = 0; i < 200; i++) stepBody(b, { dir: 1 }, world, 1 / 60);
    expect(b.x).toBeLessThan(600 - 20);
    const c = { ...body(), x: 30 };
    for (let i = 0; i < 200; i++) stepBody(c, { dir: -1 }, world, 1 / 60);
    expect(c.x).toBeGreaterThanOrEqual(17);
  });

  it('Snooki follows behind her and settles', () => {
    expect(followVelocity({ x: 0 }, { x: 300, facing: 1 })).toBeGreaterThan(0);
    expect(followVelocity({ x: 238 }, { x: 300, facing: 1 })).toBe(0);
  });
});

describe('hidden objects', () => {
  for (const [id, scene] of Object.entries(HIDDEN_SCENES)) {
    it(`${id}: every object can be tapped and found exactly once`, () => {
      const s = createHunt(scene.objects);
      for (const o of scene.objects) {
        const res = tapAt(scene.objects, s, o.x + o.w / 2, o.y + o.h / 2);
        expect(res.hit, o.id).toBe(o.id);
      }
      expect(s.done).toBe(true);
      expect(huntMedal(s)).toBe('gold');
    });
    it(`${id}: hit areas are never smaller than ${MIN_HIT} units and stay inside the scene`, () => {
      for (const o of scene.objects) {
        const b = hitBox(o);
        expect(b.w).toBeGreaterThanOrEqual(MIN_HIT);
        expect(o.x >= 0 && o.y >= 0 && o.x + o.w <= 300 && o.y + o.h <= 420, o.id).toBe(true);
      }
    });
  }
  it('misses and hints are counted; hints never point at found objects', () => {
    const scene = HIDDEN_SCENES.study;
    const s = createHunt(scene.objects);
    expect(tapAt(scene.objects, s, 2, 2).hit).toBeNull();
    for (const o of scene.objects.slice(0, -1)) tapAt(scene.objects, s, o.x + o.w / 2, o.y + o.h / 2);
    expect(useHint(scene.objects, s)).toBe(scene.objects.at(-1).id);
    expect(s.misses).toBe(1);
    expect(huntMedal(s)).toBe('silver');
  });
});

describe('healthy kitchen', () => {
  for (const r of RECIPES) {
    it(`${r.id} has a valid answer`, () => {
      const sol = exampleSolution(r);
      expect(sol).toBeTruthy();
      expect(checkRecipe(r, sol)).toEqual({ ok: true });
    });
  }
  it('chocolate and avocado are rejected for Snooki (unsafe for dogs)', () => {
    const r = RECIPES.find((x) => x.id === 'snooki-dinner');
    expect(checkRecipe(r, ['fish', 'carrot', 'chocolate']).reason).toMatch(/شوكولاتة/);
    expect(checkRecipe(r, ['fish', 'carrot', 'avocado']).reason).toMatch(/الأفوكادو/);
    expect(checkRecipe(r, ['fish', 'carrot', 'egg']).ok).toBe(true);
    expect(checkRecipe(r, ['fish', 'carrot']).ok).toBe(false);
  });
  it("Ryan's snack must match the recipe card exactly", () => {
    const r = RECIPES.find((x) => x.id === 'ryan-snack');
    expect(checkRecipe(r, ['yogurt', 'berries', 'honey']).ok).toBe(true);
    expect(checkRecipe(r, ['yogurt', 'berries', 'apple']).ok).toBe(false);
  });
  it('every ingredient has a name and an icon', () => {
    for (const it2 of Object.values(INGREDIENTS)) expect(it2.name && it2.icon).toBeTruthy();
  });
});

describe('logic machine', () => {
  for (const [id, rows] of Object.entries(PIPE_LEVELS)) {
    it(`${id}: solved as authored, starts unsolved, and every target is reachable`, () => {
      const level = parseLevel(rows);
      const solved = level.grid.map((r) => r.map((c) => c.solved));
      expect(isSolved(level, solved)).toBe(true);
      for (const seed of [1, 5, 11, 99]) expect(isSolved(level, scramble(level, seed))).toBe(false);
    });
  }
  it('sources and fixed tiles cannot be rotated; others turn a quarter', () => {
    const level = parseLevel(PIPE_LEVELS.power);
    const rot = level.grid.map((r) => r.map((c) => c.solved));
    expect(rotateAt(level, rot, 0, 0)).toBe(rot);
    expect(rotateAt(level, rot, 1, 0)[0][1]).toBe((rot[0][1] + 1) % 4);
    expect(flow(level, rot).has('4,2')).toBe(true);
  });
});

describe('racing (pseudo-3D)', () => {
  const run = (track, s, input, max = 60 * 400) => {
    for (let i = 0; i < max && !s.done; i++) stepRace(track, s, 1 / 60, typeof input === 'function' ? input(track, s) : input);
    return s;
  };
  for (const [id, track] of Object.entries(TRACKS)) {
    it(`${id}: a careful driver finishes inside the gold time on every difficulty`, () => {
      for (const difficulty of ['easy', 'normal', 'hard']) {
        const s = run(track, createRace(track, { difficulty }), botInput);
        expect(s.done, difficulty).toBe(true);
        expect(raceMedal(track, s.t), `${difficulty} ${s.t}`).toBe('gold');
      }
    });
    it(`${id}: a driver who never steers still finishes (no game over)`, () => {
      const s = run(track, createRace(track), { steer: 0 });
      expect(s.done).toBe(true);
    });
    it(`${id}: three checkpoints are passed in order and recorded`, () => {
      const s = run(track, createRace(track), botInput);
      expect(s.checkpoint).toBe(3);
      expect(s.splits).toHaveLength(3);
      expect(s.splits[0]).toBeLessThan(s.splits[1]);
    });
  }

  const moon = TRACKS.moon;
  it('steering moves the car sideways, scaled by speed (none when stopped)', () => {
    const s = createRace(moon);
    stepRace(moon, s, 1 / 60, { steer: 1 });
    const slow = s.x;
    expect(slow).toBeGreaterThanOrEqual(0);
    const fast = createRace(moon);
    fast.v = CAR.vmax;
    stepRace(moon, fast, 1 / 60, { steer: 1 });
    expect(fast.x).toBeGreaterThan(slow);
    const stopped = createRace(moon);
    stepRace(moon, stopped, 1 / 60, { brake: true, steer: 1 });
    expect(stopped.x).toBe(0);
  });

  it('speed builds up to the top speed and drops on the verge', () => {
    const s = createRace(moon);
    for (let i = 0; i < 60 * 5; i++) stepRace(moon, s, 1 / 60, botInput(moon, s));
    expect(s.v).toBeGreaterThan(CAR.vmax * 0.6);
    s.x = 1.8;
    for (let i = 0; i < 60; i++) stepRace(moon, s, 1 / 60, { steer: 0 });
    expect(s.v).toBeLessThanOrEqual(CAR.offroadV + 1);
  });

  it('hitting a traffic car costs speed and counts a hit, but never stops the race', () => {
    const s = createRace(moon);
    s.v = CAR.vmax;
    const car = s.traffic[0];
    s.z = car.z - CAR.length * 0.5;
    s.x = car.x;
    const ev = stepRace(moon, s, 1 / 60, { targetX: car.x });
    expect(ev.hit).toBe(true);
    expect(s.hits).toBe(1);
    expect(s.v).toBeLessThan(CAR.vmax * 0.8);
    expect(s.z).toBeLessThan(car.z);
    // no double hit from the same car straight after
    expect(stepRace(moon, s, 1 / 60, { targetX: car.x }).hit).toBe(false);
  });

  it('even at boost speed a car is not driven through (swept collision)', () => {
    const s = createRace(moon);
    s.v = CAR.boostV * 1.5;
    const car = s.traffic[0];
    s.z = car.z - 200;
    s.x = car.x;
    let hit = false;
    for (let i = 0; i < 3; i++) hit = stepRace(moon, s, 1 / 30, { targetX: car.x }).hit || hit;
    expect(hit).toBe(true);
  });

  it('blue lights fill the boost meter; a full meter fires a boost', () => {
    const s = createRace(moon);
    s.meter = 1;
    const ev = stepRace(moon, s, 1 / 60, { boost: true });
    expect(ev.boost).toBe(true);
    expect(s.meter).toBe(0);
    expect(s.boost).toBeGreaterThan(0);
    const t = createRace(moon);
    t.v = CAR.vmax;
    t.z = moon.orbs[0].z - 50;
    t.x = moon.orbs[0].x;
    expect(stepRace(moon, t, 1 / 60, { targetX: t.x }).orb).toBe(true);
    expect(t.meter).toBeCloseTo(0.25);
  });

  it('easy difficulty has fewer cars and helps back onto the road', () => {
    expect(createRace(moon, { difficulty: 'easy' }).traffic.length).toBeLessThan(createRace(moon).traffic.length);
    expect(createRace(moon, { difficulty: 'hard' }).traffic.length).toBeGreaterThan(createRace(moon).traffic.length);
    const s = createRace(moon, { difficulty: 'easy' });
    s.v = CAR.vmax;
    s.x = 1.2;
    stepRace(moon, s, 1 / 60, {});
    expect(s.x).toBeLessThan(1.2);
  });

  it('controller: countdown, pause/resume freezes the race, retry restarts cleanly', () => {
    const c = createRaceController(moon, { countdown: 1 });
    expect(c.phase).toBe('countdown');
    c.tick(0.6, {});
    c.tick(0.6, {});
    expect(c.phase).toBe('racing');
    for (let i = 0; i < 60; i++) c.tick(1 / 60, { steer: 0 });
    const z = c.state.z;
    c.pause();
    expect(c.phase).toBe('paused');
    for (let i = 0; i < 60; i++) expect(c.tick(1 / 60, { steer: 0 })).toBeNull();
    expect(c.state.z).toBe(z);
    c.resume();
    c.tick(1 / 60, {});
    expect(c.state.z).toBeGreaterThan(z);
    c.retry('easy');
    expect(c.phase).toBe('countdown');
    expect(c.state.z).toBe(0);
    expect(c.state.t).toBe(0);
    expect(c.difficulty).toBe('easy');
  });

  it('controller: reaching the finish ends the race', () => {
    const c = createRaceController(moon, { countdown: 0 });
    c.tick(0.01, {});
    let ev = null;
    for (let i = 0; i < 60 * 120 && c.phase !== 'finished'; i++) ev = c.tick(1 / 60, botInput(moon, c.state)) || ev;
    expect(c.phase).toBe('finished');
    expect(c.state.done).toBe(true);
  });

  it('night run: the rival keeps a steady pace and a careful driver can beat it', () => {
    const night = TRACKS.night;
    const s = run(night, createRace(night), botInput);
    expect(beatRival(night, s)).toBe(true);
  });
});

describe('memory cards', () => {
  it('deals each symbol twice, the same way for the same seed', () => {
    const a = deal(['x', 'y', 'z'], 4);
    expect(a.deck.map((c) => c.symbol).sort()).toEqual(['x', 'x', 'y', 'y', 'z', 'z']);
    expect(deal(['x', 'y', 'z'], 4).deck).toEqual(a.deck);
  });
  it('matches stay, misses need hiding, near-perfect play is gold', () => {
    const s = deal(['x', 'y'], 1);
    const pos = (sym) => s.deck.map((c, i) => (c.symbol === sym ? i : -1)).filter((i) => i >= 0);
    const [x1, x2] = pos('x');
    const [y1, y2] = pos('y');
    expect(flipCard(s, x1)).toBe('open');
    expect(flipCard(s, y1)).toBe('miss');
    expect(flipCard(s, y2)).toBe('noop'); // two cards waiting
    hideOpen(s);
    expect(flipCard(s, x1)).toBe('open');
    expect(flipCard(s, x2)).toBe('match');
    expect(flipCard(s, x1)).toBe('noop');
    flipCard(s, y1);
    expect(flipCard(s, y2)).toBe('match');
    expect(s.done).toBe(true);
    expect(cardsMedal(s)).toBe('gold'); // 3 moves for 2 pairs is within 1.6 × pairs
  });
});

describe('clue quiz', () => {
  for (const [id, set] of Object.entries(QUIZ_SETS)) {
    it(`${id}: every round has its answer among the options and an explanation`, () => {
      for (const r of set.rounds) {
        expect(r.options.some((o) => o.id === r.answer)).toBe(true);
        expect(r.explain).toBeTruthy();
      }
    });
    it(`${id}: answering every round correctly finishes with gold`, () => {
      const s = createQuiz();
      for (const r of set.rounds) expect(answerQuiz(set.rounds, s, r.answer).correct).toBe(true);
      expect(s.done).toBe(true);
      expect(quizMedal(s)).toBe('gold');
    });
  }
  it('wrong answers are counted once each and explain why', () => {
    const rounds = QUIZ_SETS.tracks.rounds;
    const s = createQuiz();
    const wrong = rounds[0].options.find((o) => o.id !== rounds[0].answer);
    expect(answerQuiz(rounds, s, wrong.id)).toMatchObject({ correct: false });
    expect(answerQuiz(rounds, s, wrong.id)).toEqual({ correct: false });
    expect(s.mistakes).toBe(1);
  });
});

describe('garden designer', () => {
  it('roses cost seeds (3 per pouch); decorations are free', () => {
    let layout = [];
    for (let cell = 0; cell < 3; cell++) layout = place(layout, cell, 'rose-blue', { seeds: 1 });
    expect(rosesUsed(layout)).toBe(3);
    expect(place(layout, 3, 'rose-pink', { seeds: 1 })).toBeNull();
    expect(place(layout, 3, 'lantern', { seeds: 1 })).toHaveLength(4);
    expect(roseBudget(2)).toBe(6);
  });
  it('replacing a rose with a rose in the same plot is allowed at the limit', () => {
    expect(place([], 0, 'rose-blue', { seeds: 0 })).toBeNull();
    const full = [0, 1, 2].reduce((l, c) => place(l, c, 'rose-blue', { seeds: 1 }), []);
    expect(place(full, 1, 'rose-white', { seeds: 1 })).not.toBeNull();
  });
  it('locked pieces need their condition; out-of-range plots are refused', () => {
    expect(place([], 0, 'fountain', { unlocked: () => false })).toBeNull();
    expect(place([], 0, 'fountain', { unlocked: () => true })).toHaveLength(1);
    expect(place([], COLS * ROWS, 'lantern')).toBeNull();
    expect(place([], 0, 'unicorn')).toBeNull();
    expect(clearCell([{ id: 'bench', cell: 2 }], 2)).toEqual([]);
    expect(Object.values(PIECES).every((p) => p.name && p.icon)).toBe(true);
  });
});
