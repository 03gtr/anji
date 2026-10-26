/**
 * Puzzle rules: pure, deterministic state machines. The UI only calls these
 * and renders the result, so every answer check is unit-tested.
 *
 * Each type: init(config) → state, and actions returning
 *   { state, outcome: 'progress' | 'wrong' | 'solved' | 'noop' }.
 */
import { rng } from '../core/rng.js';

/* ── sequence: press items in the right order ── */
export const sequence = {
  init: () => ({ pressed: [], mistakes: 0 }),
  press(config, state, id) {
    if (!config.items.some((it) => it.id === id)) return { state, outcome: 'noop' };
    const expected = config.answer[state.pressed.length];
    if (id !== expected) return { state: { pressed: [], mistakes: state.mistakes + 1 }, outcome: 'wrong' };
    const pressed = [...state.pressed, id];
    return { state: { ...state, pressed }, outcome: pressed.length === config.answer.length ? 'solved' : 'progress' };
  },
};

/* ── choice: pick the right option ── */
export const choice = {
  init: () => ({ tried: [], mistakes: 0 }),
  pick(config, state, id) {
    const opt = config.options.find((o) => o.id === id);
    if (!opt || state.tried.includes(id)) return { state, outcome: 'noop' };
    if (id === config.answer) return { state: { ...state, picked: id }, outcome: 'solved' };
    return { state: { tried: [...state.tried, id], mistakes: state.mistakes + 1 }, outcome: 'wrong' };
  },
};

/* ── lock: several dials, each cycling through `symbols` ── */
export const lock = {
  init: (config) => ({ dials: config.start ? [...config.start] : config.answer.map(() => 0), mistakes: 0 }),
  turn(config, state, i, dir = 1) {
    if (i < 0 || i >= state.dials.length) return { state, outcome: 'noop' };
    const n = config.symbols.length;
    const dials = [...state.dials];
    dials[i] = (((dials[i] + dir) % n) + n) % n;
    return { state: { ...state, dials }, outcome: 'progress' };
  },
  /** answer: list of symbol indices */
  submit(config, state) {
    const ok = state.dials.every((d, i) => d === config.answer[i]);
    return ok ? { state, outcome: 'solved' } : { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong' };
  },
};

/* ── cipher: substitute symbols with letters to reveal a word ── */
export const cipher = {
  /** config: { word: ['ر','و','ز'], glyphs: ['✶','☾','✿'], given: { glyphIndex: letter } , letters: [...] } */
  init: (config) => ({ guesses: config.word.map((_, i) => config.given?.[i] ?? null), mistakes: 0 }),
  set(config, state, i, letter) {
    if (i < 0 || i >= config.word.length || config.given?.[i] != null) return { state, outcome: 'noop' };
    const guesses = [...state.guesses];
    // the same glyph always stands for the same letter: fill every copy
    config.glyphs.forEach((g, k) => {
      if (g === config.glyphs[i] && config.given?.[k] == null) guesses[k] = letter;
    });
    return { state: { ...state, guesses }, outcome: 'progress' };
  },
  submit(config, state) {
    if (state.guesses.some((g) => g == null)) return { state, outcome: 'noop' };
    const ok = state.guesses.every((g, i) => g === config.word[i]);
    return ok ? { state, outcome: 'solved' } : { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong' };
  },
};

/* ── switches: "lights" grid; a press flips itself and its neighbours ── */
export const switches = {
  /** Start from all-on and apply `scramble` presses: always solvable. */
  init(config) {
    const { size, scramble = 4, seed = 1 } = config;
    let on = Array(size * size).fill(true);
    const r = rng(seed);
    const presses = new Set();
    while (presses.size < scramble) presses.add(Math.floor(r() * size * size));
    for (const p of presses) on = flip(on, size, p);
    if (on.every(Boolean)) on = flip(on, size, 0);
    return { on, moves: 0 };
  },
  press(config, state, i) {
    if (i < 0 || i >= state.on.length) return { state, outcome: 'noop' };
    const on = flip(state.on, config.size, i);
    const next = { on, moves: state.moves + 1 };
    return { state: next, outcome: on.every(Boolean) ? 'solved' : 'progress' };
  },
};
function flip(on, size, i) {
  const out = [...on];
  const x = i % size;
  const y = Math.floor(i / size);
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < size && ny < size) out[ny * size + nx] = !out[ny * size + nx];
  }
  return out;
}

/* ── rings: concentric rings; turning one ring may drag a linked one ── */
export const rings = {
  /** config: { count, steps, start: [..], links: { ringIndex: [otherRing, ...] } } solved when all are 0 */
  init: (config) => ({ pos: [...config.start], moves: 0 }),
  turn(config, state, i, dir = 1) {
    if (i < 0 || i >= state.pos.length) return { state, outcome: 'noop' };
    const pos = [...state.pos];
    const n = config.steps;
    for (const r of [i, ...(config.links?.[i] || [])]) pos[r] = (((pos[r] + dir) % n) + n) % n;
    const next = { pos, moves: state.moves + 1 };
    return { state: next, outcome: pos.every((p) => p === 0) ? 'solved' : 'progress' };
  },
};

/* ── deduction: pick the culprit and the evidence that proves it ── */
export const deduction = {
  init: () => ({ suspect: null, evidence: [], mistakes: 0 }),
  pickSuspect: (config, state, id) => ({ state: { ...state, suspect: id }, outcome: 'progress' }),
  toggleEvidence(config, state, id) {
    const has = state.evidence.includes(id);
    const evidence = has ? state.evidence.filter((e) => e !== id) : [...state.evidence, id].slice(-(config.need || 2));
    return { state: { ...state, evidence }, outcome: 'progress' };
  },
  submit(config, state) {
    if (!state.suspect || state.evidence.length < (config.need || 2)) return { state, outcome: 'noop' };
    const ok = state.suspect === config.answer.suspect && state.evidence.every((e) => config.answer.evidence.includes(e));
    return ok ? { state, outcome: 'solved' } : { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong' };
  },
};

export const RULES = { sequence, choice, lock, cipher, switches, rings, deduction };

/** Next hint to show (hints are revealed one by one, never skipped). */
export function nextHint(hints, used) {
  return used < hints.length ? { text: hints[used], used: used + 1 } : null;
}

/**
 * Solve check used by content tests: replays a known solution through the
 * rules and confirms it ends in 'solved'.
 */
export function replay(type, config, moves) {
  const rules = RULES[type];
  let state = rules.init(config);
  let outcome = 'progress';
  for (const [action, ...args] of moves) {
    const res = rules[action](config, state, ...args);
    state = res.state;
    outcome = res.outcome;
  }
  return { state, outcome };
}
