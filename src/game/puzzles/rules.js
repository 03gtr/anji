/**
 * Puzzle rules: pure, deterministic state machines. The UI only calls these
 * and renders the result, so every answer check is unit-tested.
 *
 * Each type: init(config) → state, and actions returning
 *   { state, outcome: 'progress' | 'wrong' | 'solved' | 'noop', message? }.
 * `solve(type, config, state)` returns a move list that finishes the puzzle
 * from the given state: tests use it to prove every puzzle is solvable, and
 * the «شوفي الحل» button uses it to highlight the next moves.
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
    for (const p of presses) on = flipGrid(on, size, p);
    if (on.every(Boolean)) on = flipGrid(on, size, 0);
    return { on, moves: 0 };
  },
  press(config, state, i) {
    if (i < 0 || i >= state.on.length) return { state, outcome: 'noop' };
    const on = flipGrid(state.on, config.size, i);
    const next = { on, moves: state.moves + 1 };
    return { state: next, outcome: on.every(Boolean) ? 'solved' : 'progress' };
  },
};
function flipGrid(on, size, i) {
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

/* ── candles: staged lights puzzle (V2 redesign of the library candles) ──
 * Each stage starts with every candle lit, then `presses` are applied, so
 * the stage is always solvable by pressing exactly those candles again.
 * layout 'row': a press flips itself and its left/right neighbours.
 * layout 'grid': a press flips itself and the four around it (a plus). */
export function flipCandles(on, stage, i) {
  if (stage.layout === 'grid') return flipGrid(on, stage.size, i);
  const out = [...on];
  for (const k of [i - 1, i, i + 1]) if (k >= 0 && k < out.length) out[k] = !out[k];
  return out;
}
const candleCount = (stage) => (stage.layout === 'grid' ? stage.size * stage.size : stage.size);
function candleStart(stage) {
  let on = Array(candleCount(stage)).fill(true);
  for (const p of stage.presses) on = flipCandles(on, stage, p);
  return on;
}
export const candles = {
  init: (config) => ({ stage: 0, on: candleStart(config.stages[0]), moves: 0, mistakes: 0 }),
  press(config, state, i) {
    const stage = config.stages[state.stage];
    if (!stage || i < 0 || i >= state.on.length) return { state, outcome: 'noop' };
    const on = flipCandles(state.on, stage, i);
    if (!on.every(Boolean)) return { state: { ...state, on, moves: state.moves + 1 }, outcome: 'progress' };
    const next = state.stage + 1;
    if (next >= config.stages.length) return { state: { ...state, on, moves: state.moves + 1 }, outcome: 'solved' };
    return {
      state: { ...state, stage: next, on: candleStart(config.stages[next]), moves: state.moves + 1 },
      outcome: 'progress',
      message: config.stageDone?.[state.stage] || `ممتاز! المرحلة ${next + 1} من ${config.stages.length}.`,
    };
  },
};

/* ── code: fix a few tokens in a short program, then run it ── */
export const code = {
  /** config: { lines: ['text {0} text'], slots: [{ options: [...], answer, start? }] } */
  init: (config) => ({ pick: config.slots.map((s) => s.start ?? 0), mistakes: 0 }),
  cycle(config, state, i, dir = 1) {
    const slot = config.slots[i];
    if (!slot) return { state, outcome: 'noop' };
    const n = slot.options.length;
    const pick = [...state.pick];
    pick[i] = (((pick[i] + dir) % n) + n) % n;
    return { state: { ...state, pick }, outcome: 'progress' };
  },
  run(config, state) {
    const bad = config.slots.findIndex((s, i) => state.pick[i] !== s.answer);
    if (bad === -1) return { state, outcome: 'solved' };
    const line = config.lines.findIndex((l) => l.includes(`{${bad}}`));
    return { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong', message: `✗ الكود ما اشتغل: أكو خطأ بالسطر ${line + 1}.` };
  },
};

/* ── connect: join stars to draw a constellation ── */
const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
export const connect = {
  /** config: { points: [{x,y}], edges: [[a,b], …] } — the answer is the edge set */
  init: () => ({ edges: [], sel: null, moves: 0 }),
  tap(config, state, i) {
    if (i < 0 || i >= config.points.length) return { state, outcome: 'noop' };
    if (state.sel == null || state.sel === i) return { state: { ...state, sel: state.sel === i ? null : i }, outcome: 'progress' };
    const key = edgeKey(state.sel, i);
    const edges = state.edges.includes(key) ? state.edges.filter((e) => e !== key) : [...state.edges, key];
    const next = { edges, sel: i, moves: state.moves + 1 };
    const want = new Set(config.edges.map(([a, b]) => edgeKey(a, b)));
    const done = edges.length === want.size && edges.every((e) => want.has(e));
    return { state: done ? { ...next, sel: null } : next, outcome: done ? 'solved' : 'progress' };
  },
  clear: (config, state) => ({ state: { edges: [], sel: null, moves: state.moves }, outcome: 'progress' }),
};

/* ── program: arrange commands so a little robot reaches the bone ── */
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // east, south, west, north (screen)
export function runProgram(stage, prog) {
  const rows = stage.grid;
  let { x, y, dir } = stage.start;
  const trace = [{ x, y, dir }];
  const at = (cx, cy) => rows[cy]?.[cx] ?? '#';
  if (at(x, y) === 'B') return { ok: true, trace, crash: false };
  for (const c of prog) {
    if (c === 'L') dir = (dir + 3) % 4;
    else if (c === 'R') dir = (dir + 1) % 4;
    else if (c === 'F') {
      const nx = x + DIRS[dir][0];
      const ny = y + DIRS[dir][1];
      if (at(nx, ny) === '#') {
        trace.push({ x, y, dir, bump: true });
        return { ok: false, trace, crash: true };
      }
      x = nx;
      y = ny;
    }
    trace.push({ x, y, dir });
    if (at(x, y) === 'B') return { ok: true, trace, crash: false };
  }
  return { ok: false, trace, crash: false };
}
export const program = {
  /** config: { stages: [{ grid: ['..B'], start: {x,y,dir}, max }] } */
  init: () => ({ stage: 0, prog: [], runs: 0, mistakes: 0, trace: null }),
  add(config, state, cmd) {
    const stage = config.stages[state.stage];
    if (!['F', 'L', 'R'].includes(cmd) || state.prog.length >= stage.max) return { state, outcome: 'noop' };
    return { state: { ...state, prog: [...state.prog, cmd], trace: null }, outcome: 'progress' };
  },
  remove(config, state, i = state.prog.length - 1) {
    if (i < 0 || i >= state.prog.length) return { state, outcome: 'noop' };
    return { state: { ...state, prog: state.prog.filter((_, k) => k !== i), trace: null }, outcome: 'progress' };
  },
  clear: (config, state) => ({ state: { ...state, prog: [], trace: null }, outcome: 'progress' }),
  run(config, state) {
    const stage = config.stages[state.stage];
    const res = runProgram(stage, state.prog);
    const runs = state.runs + 1;
    if (!res.ok) {
      return {
        state: { ...state, runs, mistakes: state.mistakes + 1, trace: res.trace },
        outcome: 'wrong',
        message: res.crash ? 'بوم! الروبوت دگ بالصندوق. شيلي الأمر الغلط وجرّبي.' : 'الروبوت وقف قبل العظمة. يحتاج أوامر أكثر (أو غير).',
      };
    }
    const next = state.stage + 1;
    if (next >= config.stages.length) return { state: { ...state, runs, trace: res.trace }, outcome: 'solved' };
    return {
      state: { ...state, stage: next, prog: [], runs, trace: null },
      outcome: 'progress',
      message: `هاو هاو! (بيب) — المستوى ${next + 1} من ${config.stages.length}.`,
    };
  },
};

/* ── arrange: put pieces into slots; each slot accepts certain pieces ──
 * config: { slots: [{ id, label, accepts: [pieceId…] }], pieces: [{ id, label, icon }] }
 * Tap a piece, then a slot. Several pieces may fit a slot (identical sweets). */
export const arrange = {
  init: () => ({ placed: {}, sel: null, mistakes: 0 }),
  pick(config, state, pieceId) {
    if (!config.pieces.some((p) => p.id === pieceId)) return { state, outcome: 'noop' };
    return { state: { ...state, sel: state.sel === pieceId ? null : pieceId }, outcome: 'progress' };
  },
  place(config, state, slotId) {
    if (!state.sel || !config.slots.some((s) => s.id === slotId)) return { state, outcome: 'noop' };
    const placed = { ...state.placed };
    for (const [k, v] of Object.entries(placed)) if (v === state.sel) delete placed[k];
    placed[slotId] = state.sel;
    return { state: { ...state, placed, sel: null }, outcome: 'progress' };
  },
  clear(config, state, slotId) {
    const placed = { ...state.placed };
    delete placed[slotId];
    return { state: { ...state, placed }, outcome: 'progress' };
  },
  check(config, state) {
    if (config.slots.some((s) => !state.placed[s.id])) return { state, outcome: 'noop', message: 'بعد أكو أماكن فارغة.' };
    const right = config.slots.filter((s) => s.accepts.includes(state.placed[s.id])).length;
    if (right === config.slots.length) return { state, outcome: 'solved' };
    return { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong', message: `${right} من ${config.slots.length} بمكانها الصح.` };
  },
};

/* ── clock: set the hands; any time within the tolerance is accepted ──
 * config: { target: [h, m], tolerance (minutes), step (minutes), start: [h, m] } */
const minutesOf = (h, m) => ((h % 12) * 60 + m) % 720;
export const clock = {
  init: (config) => ({ h: config.start?.[0] ?? 12, m: config.start?.[1] ?? 0, mistakes: 0 }),
  turn(config, state, hand, dir = 1) {
    if (hand === 'h') return { state: { ...state, h: ((((state.h - 1 + dir) % 12) + 12) % 12) + 1 }, outcome: 'progress' };
    if (hand === 'm') {
      const step = config.step || 5;
      return { state: { ...state, m: (((state.m + dir * step) % 60) + 60) % 60 }, outcome: 'progress' };
    }
    return { state, outcome: 'noop' };
  },
  submit(config, state) {
    const diff = Math.abs(minutesOf(state.h, state.m) - minutesOf(...config.target));
    const off = Math.min(diff, 720 - diff);
    if (off <= (config.tolerance ?? 0)) return { state, outcome: 'solved' };
    return { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong' };
  },
};

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

export const RULES = { sequence, choice, lock, cipher, switches, candles, code, connect, program, arrange, clock, rings, deduction };

/** Next hint to show (hints are revealed one by one, never skipped). */
export function nextHint(hints, used) {
  return used < hints.length ? { text: hints[used], used: used + 1 } : null;
}

/* ── solvers ─────────────────────────────────────────────── */
/** Minimal set of presses that lights every candle/switch (brute force: ≤ 16 cells). */
function lightsSolution(on, flip) {
  const n = on.length;
  let best = null;
  for (let mask = 0; mask < 1 << n; mask++) {
    let cur = on;
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        cur = flip(cur, i);
        count += 1;
      }
    }
    if (cur.every(Boolean) && (!best || count < best.length)) {
      best = [];
      for (let i = 0; i < n; i++) if (mask & (1 << i)) best.push(i);
    }
  }
  return best;
}

/** Shortest command list for one program stage (BFS over x, y, dir). */
export function programSolution(stage) {
  const key = (s) => `${s.x},${s.y},${s.dir}`;
  const queue = [[stage.start, []]];
  const seen = new Set([key(stage.start)]);
  while (queue.length) {
    const [s, prog] = queue.shift();
    if (prog.length >= stage.max) continue;
    for (const c of ['F', 'L', 'R']) {
      const p = [...prog, c];
      const res = runProgram(stage, p);
      if (res.ok) return p;
      if (res.crash) continue;
      const end = res.trace[res.trace.length - 1];
      if (seen.has(key(end))) continue;
      seen.add(key(end));
      queue.push([{ x: end.x, y: end.y, dir: end.dir }, p]);
    }
  }
  return null;
}

const SOLVE = {
  sequence: (c, s) => c.answer.slice(s.pressed.length).map((id) => ['press', id]),
  choice: (c) => [['pick', c.answer]],
  lock: (c, s) => {
    const moves = [];
    c.answer.forEach((target, i) => {
      for (let k = 0; k < (target - s.dials[i] + c.symbols.length) % c.symbols.length; k++) moves.push(['turn', i, 1]);
    });
    return [...moves, ['submit']];
  },
  cipher: (c) => [...c.word.map((l, i) => (c.given?.[i] != null ? null : ['set', i, l])).filter(Boolean), ['submit']],
  switches: (c, s) => lightsSolution(s.on, (on, i) => flipGrid(on, c.size, i))?.map((i) => ['press', i]) ?? null,
  candles: (c, s) => {
    const moves = [];
    let st = s;
    for (let k = s.stage; k < c.stages.length; k++) {
      const stage = c.stages[k];
      const on = k === s.stage ? st.on : candleStart(stage);
      const presses = lightsSolution(on, (o, i) => flipCandles(o, stage, i));
      if (!presses) return null;
      moves.push(...presses.map((i) => ['press', i]));
    }
    return moves;
  },
  code: (c, s) => {
    const moves = [];
    c.slots.forEach((slot, i) => {
      for (let k = 0; k < (slot.answer - s.pick[i] + slot.options.length) % slot.options.length; k++) moves.push(['cycle', i, 1]);
    });
    return [...moves, ['run']];
  },
  connect: (c, s) => {
    const want = new Set(c.edges.map(([a, b]) => edgeKey(a, b)));
    const moves = [];
    // remove wrong edges, then draw missing ones (each as tap a → tap b → tap b to release)
    for (const e of [...s.edges.filter((x) => !want.has(x)), ...[...want].filter((x) => !s.edges.includes(x))]) {
      const [a, b] = e.split('-').map(Number);
      moves.push(['tap', a], ['tap', b], ['tap', b]);
    }
    if (s.sel != null) moves.unshift(['tap', s.sel]);
    if (moves.length && moves.length % 3 === (s.sel != null ? 1 : 0)) moves.pop(); // no release tap after the last line
    return moves;
  },
  program: (c, s) => {
    const moves = [];
    for (let k = s.stage; k < c.stages.length; k++) {
      const p = programSolution(c.stages[k]);
      if (!p) return null;
      if (k === s.stage && s.prog.length) moves.push(['clear']);
      moves.push(...p.map((cmd) => ['add', cmd]), ['run']);
    }
    return moves;
  },
  rings: (c, s) => {
    const start = s.pos;
    const queue = [[start, []]];
    const seen = new Set([start.join(',')]);
    while (queue.length) {
      const [pos, moves] = queue.shift();
      if (pos.every((p) => p === 0)) return moves;
      for (let i = 0; i < start.length; i++) {
        for (const dir of [1, -1]) {
          const next = [...pos];
          for (const r of [i, ...(c.links?.[i] || [])]) next[r] = (((next[r] + dir) % c.steps) + c.steps) % c.steps;
          const k = next.join(',');
          if (seen.has(k)) continue;
          seen.add(k);
          queue.push([next, [...moves, ['turn', i, dir]]]);
        }
      }
    }
    return null;
  },
  arrange: (c) => {
    const used = new Set();
    const moves = [];
    for (const slot of c.slots) {
      const piece = slot.accepts.find((p) => !used.has(p));
      used.add(piece);
      moves.push(['pick', piece], ['place', slot.id]);
    }
    return [...moves, ['check']];
  },
  clock: (c, s) => {
    const moves = [];
    let h = s.h;
    while (h !== (((c.target[0] - 1) % 12) + 12) % 12 + 1) {
      moves.push(['turn', 'h', 1]);
      h = (h % 12) + 1;
    }
    let m = s.m;
    while (m !== c.target[1]) {
      moves.push(['turn', 'm', 1]);
      m = (m + (c.step || 5)) % 60;
    }
    return [...moves, ['submit']];
  },
  deduction: (c) => [['pickSuspect', c.answer.suspect], ...c.answer.evidence.slice(0, c.need || 2).map((e) => ['toggleEvidence', e]), ['submit']],
};

/** Moves that finish the puzzle from `state` (default: the start). */
export function solve(type, config, state = RULES[type].init(config)) {
  return SOLVE[type]?.(config, state) ?? null;
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
