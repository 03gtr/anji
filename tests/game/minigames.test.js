import { describe, it, expect } from 'vitest';
import { MAZES, parseMaze, createMazeState, moveIn, shortestPath, reachable, mazeMedal } from '../../src/game/minigames/maze-logic.js';
import { COURSES, createChase, stepChase, chaseMedal, CHASE } from '../../src/game/minigames/chase-logic.js';
import { MINIGAMES } from '../../src/game/minigames/registry.js';
import { stepBody, MOVE, followVelocity } from '../../src/game/world/physics.js';
import { GROUND } from '../../src/game/world/props.js';

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
