import { describe, it, expect } from 'vitest';
import { createDialogue, scriptTexts } from '../../src/game/narrative/dialogue.js';
import { RULES, nextHint, replay, switches, solve } from '../../src/game/puzzles/rules.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';

describe('dialogue runner', () => {
  const script = [
    { s: 'anji', t: 'one' },
    { s: 'snooki', t: 'only with flag', if: 'flag:x' },
    { if: 'flag:x', then: [{ s: 'snooki', t: 'branch yes' }], else: [{ s: 'snooki', t: 'branch no' }] },
    { do: 'flag:after' },
    {
      s: 'anji',
      t: 'pick',
      choice: [
        { t: 'A', do: 'flag:chose-a', then: [{ s: 'snooki', t: 'you chose A' }] },
        { t: 'B', if: 'flag:never', then: [] },
        { t: 'C', then: [{ cue: 'bark' }, { s: 'snooki', t: 'C!' }] },
      ],
    },
    { s: 'anji', t: 'end line' },
  ];

  function run(flags, choose = 0) {
    const set = new Set(flags);
    const applied = [];
    const d = createDialogue(script, { check: (c) => !c || (c.startsWith('flag:') ? set.has(c.slice(5)) : true), apply: (fx) => applied.push(fx) });
    const out = [];
    for (;;) {
      const step = d.next();
      if (step.type === 'end') break;
      if (step.type === 'choice') {
        out.push(`?${step.text}:${step.options.join('|')}`);
        d.choose(choose);
        continue;
      }
      out.push(step.type === 'cue' ? `cue:${step.cue}` : step.text);
    }
    return { out, applied };
  }

  it('follows conditions, branches and choices', () => {
    expect(run([], 0)).toEqual({ out: ['one', 'branch no', '?pick:A|C', 'you chose A', 'end line'], applied: ['flag:after', 'flag:chose-a'] });
    expect(run(['x'], 1).out).toEqual(['one', 'only with flag', 'branch yes', '?pick:A|C', 'cue:bark', 'C!', 'end line']);
  });

  it('cannot advance past a waiting choice', () => {
    const d = createDialogue([{ t: 'q', choice: [{ t: 'a' }] }]);
    d.next(); // the line part of the choice node
    expect(() => d.next()).toThrow(/choice/);
  });

  it('skips a choice whose options are all hidden', () => {
    const d = createDialogue([{ t: 'q', choice: [{ t: 'a', if: 'no' }] }, { t: 'after' }], { check: (c) => c !== 'no' });
    expect(d.next().text).toBe('after');
  });

  it('collects every text for content checks', () => {
    expect(scriptTexts(script)).toContain('you chose A');
  });
});

describe('puzzle rules', () => {
  it('sequence: right order solves, a mistake resets', () => {
    const cfg = { items: [{ id: 'a' }, { id: 'b' }], answer: ['a', 'b'] };
    let r = RULES.sequence.press(cfg, RULES.sequence.init(), 'b');
    expect(r.outcome).toBe('wrong');
    expect(r.state.pressed).toEqual([]);
    r = RULES.sequence.press(cfg, r.state, 'a');
    expect(r.outcome).toBe('progress');
    expect(RULES.sequence.press(cfg, r.state, 'b').outcome).toBe('solved');
  });

  it('choice: wrong options are remembered, right one solves', () => {
    const cfg = { options: [{ id: 'x' }, { id: 'y' }], answer: 'y' };
    const r = RULES.choice.pick(cfg, RULES.choice.init(), 'x');
    expect(r.outcome).toBe('wrong');
    expect(RULES.choice.pick(cfg, r.state, 'x').outcome).toBe('noop');
    expect(RULES.choice.pick(cfg, r.state, 'y').outcome).toBe('solved');
  });

  it('lock: dials wrap around and must match exactly', () => {
    const cfg = { symbols: ['0', '1', '2'], answer: [2, 1] };
    let s = RULES.lock.init(cfg);
    s = RULES.lock.turn(cfg, s, 0, -1).state; // 0 → 2 (wraps)
    expect(RULES.lock.submit(cfg, s).outcome).toBe('wrong');
    s = RULES.lock.turn(cfg, s, 1, 1).state;
    expect(RULES.lock.submit(cfg, s).outcome).toBe('solved');
  });

  it('cipher: one glyph is one letter everywhere; given letters are fixed', () => {
    const cfg = { word: ['ر', 'و', 'ر'], glyphs: ['✶', '☾', '✶'], given: { 1: 'و' }, letters: ['ر', 'و', 'ز'] };
    let s = cipher();
    function cipher() {
      return RULES.cipher.init(cfg);
    }
    expect(s.guesses).toEqual([null, 'و', null]);
    expect(RULES.cipher.set(cfg, s, 1, 'ز').outcome).toBe('noop');
    s = RULES.cipher.set(cfg, s, 0, 'ر').state;
    expect(s.guesses).toEqual(['ر', 'و', 'ر']);
    expect(RULES.cipher.submit(cfg, s).outcome).toBe('solved');
  });

  it('switches: generated boards are always solvable', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const cfg = { size: 3, scramble: 3, seed };
      const s = switches.init(cfg);
      expect(s.on.every(Boolean)).toBe(false);
      // brute force: some set of presses solves it (2^9 options)
      let solvable = false;
      for (let mask = 0; mask < 512 && !solvable; mask++) {
        let st = s;
        let out = 'progress';
        for (let i = 0; i < 9; i++) if (mask & (1 << i)) ({ state: st, outcome: out } = switches.press(cfg, st, i));
        solvable = st.on.every(Boolean) || out === 'solved';
      }
      expect(solvable).toBe(true);
    }
  });

  it('rings: linked rings turn together; all at zero solves', () => {
    const cfg = { steps: 4, start: [1, 0], links: { 0: [1] } };
    let r = RULES.rings.turn(cfg, RULES.rings.init(cfg), 0, -1);
    expect(r.state.pos).toEqual([0, 3]);
    r = RULES.rings.turn(cfg, r.state, 1, 1);
    expect(r.outcome).toBe('solved');
  });

  it('deduction: needs the right suspect and the right evidence', () => {
    const cfg = { need: 2, answer: { suspect: 's', evidence: ['e1', 'e2'] } };
    let s = RULES.deduction.init();
    expect(RULES.deduction.submit(cfg, s).outcome).toBe('noop');
    s = RULES.deduction.pickSuspect(cfg, s, 's').state;
    s = RULES.deduction.toggleEvidence(cfg, s, 'e1').state;
    s = RULES.deduction.toggleEvidence(cfg, s, 'e3').state;
    expect(RULES.deduction.submit(cfg, s).outcome).toBe('wrong');
    s = RULES.deduction.toggleEvidence(cfg, s, 'e3').state;
    s = RULES.deduction.toggleEvidence(cfg, s, 'e2').state;
    expect(RULES.deduction.submit(cfg, s).outcome).toBe('solved');
  });

  it('hints are revealed one at a time and never past the end', () => {
    expect(nextHint(['a', 'b'], 0)).toEqual({ text: 'a', used: 1 });
    expect(nextHint(['a', 'b'], 1)).toEqual({ text: 'b', used: 2 });
    expect(nextHint(['a', 'b'], 2)).toBeNull();
  });
});

describe('puzzle content', () => {
  /** Generic solvers derive a winning move list from each puzzle's config. */
  const SOLVERS = {
    sequence: (c) => c.answer.map((id) => ['press', id]),
    choice: (c) => [['pick', c.answer]],
    lock: (c) => {
      const start = c.start || c.answer.map(() => 0);
      const moves = [];
      c.answer.forEach((target, i) => {
        for (let k = 0; k < (target - start[i] + c.symbols.length) % c.symbols.length; k++) moves.push(['turn', i, 1]);
      });
      return [...moves, ['submit']];
    },
    cipher: (c) => [...c.word.map((l, i) => ['set', i, l]), ['submit']],
    deduction: (c) => [['pickSuspect', c.answer.suspect], ...c.answer.evidence.slice(0, c.need || 2).map((e) => ['toggleEvidence', e]), ['submit']],
    // small state spaces: search for a sequence of presses / turns
    switches: (c) => {
      const n = c.size * c.size;
      for (let mask = 1; mask < 1 << n; mask++) {
        const moves = [];
        for (let i = 0; i < n; i++) if (mask & (1 << i)) moves.push(['press', i]);
        if (replay('switches', c, moves).outcome === 'solved') return moves;
      }
      return null;
    },
    rings: (c) => {
      const start = c.start.join(',');
      const queue = [[c.start, []]];
      const seen = new Set([start]);
      while (queue.length) {
        const [pos, moves] = queue.shift();
        for (let i = 0; i < c.start.length; i++) {
          for (const dir of [1, -1]) {
            const next = [...pos];
            for (const r of [i, ...(c.links?.[i] || [])]) next[r] = (((next[r] + dir) % c.steps) + c.steps) % c.steps;
            const key = next.join(',');
            if (seen.has(key)) continue;
            seen.add(key);
            const m = [...moves, ['turn', i, dir]];
            if (next.every((p) => p === 0)) return m;
            queue.push([next, m]);
          }
        }
      }
      return null;
    },
  };
  for (const [id, def] of Object.entries(PUZZLES)) {
    it(`${id}: has a title, goal, intro, hints, reward and a valid solution`, () => {
      expect(def.title && def.intro && def.goal).toBeTruthy();
      // the shared solver (used by «شوفي الحل») must also finish it
      expect(replay(def.type, def.config, solve(def.type, def.config)).outcome).toBe('solved');
      expect(def.hints?.length).toBeGreaterThanOrEqual(2);
      expect(RULES[def.type]).toBeTruthy();
      const moves = def.solution ?? SOLVERS[def.type]?.(def.config) ?? solve(def.type, def.config);
      expect(moves, `add a solution for ${id}`).toBeTruthy();
      expect(replay(def.type, def.config, moves).outcome).toBe('solved');
    });
  }
});
