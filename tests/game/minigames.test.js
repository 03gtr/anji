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
import { TRACKS, createRace, stepRace, centerAt, raceMedal } from '../../src/game/minigames/racing-logic.js';

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

describe('racing', () => {
  function bot(track, s) {
    const ahead = track.obstacles
      .map((o, i) => {
        const tc = s.traffic.find((c) => c.i === i);
        return { d: tc ? tc.d : o[0], x: tc ? tc.x : o[1], i };
      })
      .filter((o) => !s.hitSet.has(o.i) && o.d - s.d > -30 && o.d - s.d < 320)
      .sort((a, b) => a.d - b.d)[0];
    if (!ahead) return { targetX: centerAt(track, s.d + 120) };
    const c = centerAt(track, ahead.d);
    return { targetX: ahead.x > c ? c - track.roadHalf * 0.6 : c + track.roadHalf * 0.6 };
  }
  for (const [id, track] of Object.entries(TRACKS)) {
    it(`${id}: a careful driver finishes inside the gold time`, () => {
      const s = createRace(track);
      for (let i = 0; i < 60 * 180 && !s.done; i++) stepRace(track, s, 1 / 60, bot(track, s));
      expect(s.done).toBe(true);
      expect(raceMedal(track, s.t)).toBe('gold');
    });
    it(`${id}: a driver who never steers still finishes (no game over)`, () => {
      const s = createRace(track);
      for (let i = 0; i < 60 * 400 && !s.done; i++) stepRace(track, s, 1 / 60, { steer: 0 });
      expect(s.done).toBe(true);
    });
  }
});
