import { describe, it, expect } from 'vitest';
import { createGame, step, setLane, LANES } from '../src/game-logic.js';
import { seq } from './helpers.js';

describe('delivery game logic', () => {
  it('spawns items that fall down the path', () => {
    const g = createGame({ rng: seq(0.1, 0.5) });
    let spawned = [];
    for (let i = 0; i < 10; i++) spawned = spawned.concat(step(g, 0.05).spawned);
    expect(spawned.length).toBe(1);
    expect(g.items[0].y).toBeGreaterThan(-0.06);
  });

  it('collects an item in the car lane inside the catch band', () => {
    const g = createGame({ rng: seq(0.5, 0.1) }); // lane 1 = the car's starting lane
    let collected = 0;
    for (let i = 0; i < 80 && !collected; i++) collected += step(g, 0.05).collected.length;
    expect(collected).toBe(1);
    expect(g.collected).toBe(1);
  });

  it('moving into the lane of a nearby item collects it (no precise timing needed)', () => {
    const g = createGame();
    g.items.push({ id: 99, lane: 2, y: 0.8, kind: 'rose' });
    const got = setLane(g, 2);
    expect(got.map((x) => x.id)).toEqual([99]);
  });

  it('missed items roll away without any penalty', () => {
    const g = createGame({ rng: seq(0.05, 0.1) }); // always lane 0
    g.lane = 2;
    let missed = 0;
    for (let i = 0; i < 200; i++) missed += step(g, 0.05).missed.length;
    expect(missed).toBeGreaterThan(0);
    expect(g.done).toBe(false);
    expect(g.collected).toBe(0);
  });

  it('never sends three items down the same lane in a row', () => {
    const g = createGame({ rng: seq(0.5, 0.0) });
    const lanes = [];
    for (let i = 0; i < 400 && lanes.length < 9; i++) lanes.push(...step(g, 0.05).spawned.map((x) => x.lane));
    for (let i = 2; i < lanes.length; i++) {
      expect(lanes[i] === lanes[i - 1] && lanes[i] === lanes[i - 2]).toBe(false);
    }
  });

  it('keeps the lane in range', () => {
    const g = createGame();
    setLane(g, -3);
    expect(g.lane).toBe(0);
    setLane(g, 99);
    expect(g.lane).toBe(LANES - 1);
  });

  it('finishes when the goal is reached and then stops', () => {
    const g = createGame({ goal: 2, rng: seq(0.5) });
    for (let i = 0; i < 400 && !g.done; i++) step(g, 0.05);
    expect(g.done).toBe(true);
    expect(g.collected).toBe(2);
    const t = g.time;
    step(g, 0.05);
    expect(g.time).toBe(t);
  });

  it('caps huge time steps (e.g. after a hidden tab)', () => {
    const g = createGame({ rng: seq(0.5) });
    step(g, 30);
    expect(g.time).toBeCloseTo(0.1, 5);
  });
});
