/**
 * V2 puzzle rules: the redesigned candles, code fixing, constellations and
 * robot programming, the shared solver, and the skip rule of the host.
 */
import { describe, it, expect } from 'vitest';
import { candles, code, connect, program, runProgram, programSolution, solve, replay, flipCandles } from '../../src/game/puzzles/rules.js';
import { canSkip, SKIP_AFTER_MISTAKES } from '../../src/game/puzzles/host.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';

describe('candles (library redesign)', () => {
  const cfg = PUZZLES['library-candles'].config;

  it('starts easy: stage 1 is three candles, solved by one touch in the middle', () => {
    const s = candles.init(cfg);
    expect(s.stage).toBe(0);
    expect(s.on).toEqual([false, false, false]);
    const r = candles.press(cfg, s, 1);
    expect(r.outcome).toBe('progress');
    expect(r.message).toBeTruthy(); // stage-clear feedback
    expect(r.state.stage).toBe(1);
    expect(r.state.on.every((x) => !x || x)).toBe(true);
  });

  it('a touch flips the candle and its neighbours (row) / the plus shape (grid)', () => {
    expect(flipCandles([true, true, true, true, true], { layout: 'row' }, 0)).toEqual([false, false, true, true, true]);
    const grid = flipCandles(Array(9).fill(true), { layout: 'grid', size: 3 }, 4);
    expect(grid).toEqual([true, false, true, false, false, false, true, false, true]);
  });

  it('touching the same candle twice undoes it (no trap states)', () => {
    let s = candles.init(cfg);
    s = candles.press(cfg, s, 0).state;
    s = candles.press(cfg, s, 0).state;
    expect(s).toMatchObject({ stage: 0, on: candles.init(cfg).on });
  });

  it('every stage is short: at most two touches each', () => {
    for (const stage of cfg.stages) expect(stage.presses.length).toBeLessThanOrEqual(2);
    const moves = solve('candles', cfg);
    expect(moves.length).toBe(cfg.stages.reduce((n, st) => n + st.presses.length, 0));
    expect(replay('candles', cfg, moves).outcome).toBe('solved');
  });

  it('the solution can be shown from any mid-puzzle state', () => {
    let s = candles.init(cfg);
    s = candles.press(cfg, s, 1).state; // stage 2 now
    s = candles.press(cfg, s, 4).state; // a wrong-ish touch
    const moves = solve('candles', cfg, s);
    let st = s;
    let out;
    for (const [, i] of moves) ({ state: st, outcome: out } = candles.press(cfg, st, i));
    expect(out).toBe('solved');
  });

  it('has three action hints, a goal and a visual example', () => {
    const def = PUZZLES['library-candles'];
    expect(def.hints).toHaveLength(3);
    expect(def.goal).toBeTruthy();
    expect(def.example).toContain('candle-example');
  });
});

describe('code (unfinished build)', () => {
  const cfg = PUZZLES['build-fix'].config;
  it('reports the line of the first wrong token', () => {
    const r = code.run(cfg, code.init(cfg));
    expect(r.outcome).toBe('wrong');
    expect(r.message).toContain('3');
  });
  it('cycles tokens both ways and runs when every token is right', () => {
    let s = code.init(cfg);
    s = code.cycle(cfg, s, 0, -1).state;
    expect(s.pick[0]).toBe(cfg.slots[0].options.length - 1);
    expect(replay('code', cfg, solve('code', cfg)).outcome).toBe('solved');
  });
  it('the time token is the clock time in 24h (2:30 after the shift → 14:30)', () => {
    expect(cfg.slots[0].options[cfg.slots[0].answer]).toBe('14:30');
  });
});

describe('connect (second sky)', () => {
  const cfg = PUZZLES['sky-paw'].config;
  it('draws and erases lines between two tapped stars', () => {
    let s = connect.init(cfg);
    s = connect.tap(cfg, s, 4).state;
    s = connect.tap(cfg, s, 5).state;
    expect(s.edges).toEqual(['4-5']);
    expect(s.sel).toBe(5);
    s = connect.tap(cfg, s, 4).state; // same line again → erased
    expect(s.edges).toEqual([]);
  });
  it('is solved only by the exact shape', () => {
    for (const id of ['sky-paw', 'sky-car', 'sky-bone']) {
      const c = PUZZLES[id].config;
      expect(replay('connect', c, solve('connect', c)).outcome, id).toBe('solved');
    }
  });
  it('clear removes every line', () => {
    let s = connect.tap(cfg, connect.tap(cfg, connect.init(cfg), 0).state, 4).state;
    s = connect.clear(cfg, s).state;
    expect(s.edges).toEqual([]);
  });
});

describe('program (robo-snooki)', () => {
  const cfg = PUZZLES['robo-code'].config;
  it('runs commands: forward, left, right; walls stop it', () => {
    const st = { grid: ['..#', '..B'], start: { x: 0, y: 0, dir: 0 }, max: 6 };
    expect(runProgram(st, ['F', 'F']).crash).toBe(true);
    expect(runProgram(st, ['F', 'R', 'F', 'L', 'F']).ok).toBe(true);
  });
  it('a failed run is a gentle wrong answer, never a dead end', () => {
    let s = program.init(cfg);
    s = program.add(cfg, s, 'F').state;
    const r = program.run(cfg, s);
    expect(r.outcome).toBe('wrong');
    expect(r.state.prog).toEqual(['F']); // the program is kept so she can fix it
  });
  it('limits the program length per stage', () => {
    let s = program.init(cfg);
    for (let i = 0; i < 10; i++) s = program.add(cfg, s, 'F').state;
    expect(s.prog.length).toBe(cfg.stages[0].max);
  });
  it('every stage has a solution within its limit', () => {
    for (const stage of cfg.stages) {
      const p = programSolution(stage);
      expect(p).toBeTruthy();
      expect(p.length).toBeLessThanOrEqual(stage.max);
    }
    expect(replay('program', cfg, solve('program', cfg)).outcome).toBe('solved');
  });
});

describe('puzzle help ladder', () => {
  const def = { hints: ['a', 'b', 'c'] };
  it('skip appears after all hints or after repeated mistakes', () => {
    expect(canSkip(def, { hintsUsed: 0, mistakes: 0 })).toBe(false);
    expect(canSkip(def, { hintsUsed: 2, mistakes: 0 })).toBe(false);
    expect(canSkip(def, { hintsUsed: 3, mistakes: 0 })).toBe(true);
    expect(canSkip(def, { hintsUsed: 0, mistakes: SKIP_AFTER_MISTAKES })).toBe(true);
  });
  it('with hints turned off, skip appears after the first mistake', () => {
    expect(canSkip(def, { hintsOn: false, mistakes: 1 })).toBe(true);
  });
  it('every story puzzle keeps a hint ladder of at least three steps', () => {
    for (const [id, p] of Object.entries(PUZZLES)) expect(p.hints.length, id).toBeGreaterThanOrEqual(3);
  });
});
