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
/** Keys and doors (Story Pack 02): a lowercase letter is a key, the same letter in uppercase its door. */
const KEY_CHARS = 'kq';
/**
 * Phase 04 — root gates: '1' lets her in only on an odd-numbered command (1st, 3rd…),
 * '2' only on an even-numbered one. Every command is one beat, turns and «⏸ انتظري» too.
 */
export const gateOpen = (cell, beat) => (cell === '1' ? beat % 2 === 1 : cell === '2' ? beat % 2 === 0 : true);
export function runProgram(stage, prog) {
  const rows = stage.grid;
  let { x, y, dir } = stage.start;
  let keys = '';
  const trace = [{ x, y, dir, keys, beat: 0 }];
  const at = (cx, cy) => rows[cy]?.[cx] ?? '#';
  if (at(x, y) === 'B') return { ok: true, trace, crash: false };
  for (const [i, c] of prog.entries()) {
    const beat = i + 1;
    if (c === 'L') dir = (dir + 3) % 4;
    else if (c === 'R') dir = (dir + 1) % 4;
    else if (c === 'F') {
      const nx = x + DIRS[dir][0];
      const ny = y + DIRS[dir][1];
      const cell = at(nx, ny);
      const door = KEY_CHARS.includes(cell.toLowerCase()) && cell !== cell.toLowerCase();
      if (!gateOpen(cell, beat)) {
        trace.push({ x, y, dir, keys, beat, bump: true });
        return { ok: false, trace, crash: true, gate: true };
      }
      if (cell === '#' || (door && !keys.includes(cell.toLowerCase()))) {
        trace.push({ x, y, dir, keys, beat, bump: true });
        return { ok: false, trace, crash: true, door };
      }
      x = nx;
      y = ny;
      if (KEY_CHARS.includes(cell) && !keys.includes(cell)) keys = [...keys, cell].sort().join('');
    }
    trace.push({ x, y, dir, keys, beat });
    if (at(x, y) === 'B') return { ok: true, trace, crash: false };
  }
  return { ok: false, trace, crash: false };
}
/** Commands a program puzzle offers: «⏸ انتظري» (W) only where the config allows waiting. */
export const programCommands = (config) => (config.wait ? ['F', 'L', 'R', 'W'] : ['F', 'L', 'R']);
export const program = {
  /**
   * config: { stages: [{ grid: ['..B'], start: {x,y,dir}, max }],
   *           look?: { actor, goal, wall }, messages?: { crash, short, next } } — optional
   *           wording/emoji for other characters than the robot (`next` may use {n} and {of}).
   */
  init: () => ({ stage: 0, prog: [], runs: 0, mistakes: 0, trace: null }),
  add(config, state, cmd) {
    const stage = config.stages[state.stage];
    if (!programCommands(config).includes(cmd) || state.prog.length >= stage.max) return { state, outcome: 'noop' };
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
        message: res.gate
          ? config.messages?.gate ?? 'البوابة چانت مسدودة بهالنبضة. عدّي الأوامر من الأول.'
          : res.door
          ? config.messages?.door ?? 'الباب مقفول. يحتاج مفتاحه — دوّري عليه بالشبكة.'
          : res.crash
          ? config.messages?.crash ?? 'بوم! الروبوت دگ بالصندوق. شيلي الأمر الغلط وجرّبي.'
          : config.messages?.short ?? 'الروبوت وقف قبل العظمة. يحتاج أوامر أكثر (أو غير).',
      };
    }
    const next = state.stage + 1;
    if (next >= config.stages.length) return { state: { ...state, runs, trace: res.trace }, outcome: 'solved' };
    const of = config.stages.length;
    return {
      state: { ...state, stage: next, prog: [], runs, trace: null },
      outcome: 'progress',
      message: config.messages?.next ? config.messages.next.replace('{n}', next + 1).replace('{of}', of) : `هاو هاو! (بيب) — المستوى ${next + 1} من ${of}.`,
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

/* ── series (Story Pack 02): learn a hidden rule from examples, then complete a new row ──
 * config: { stages: [{ examples: [[…]], question: [… , null], options: [...], answer, rule }] }
 * Tokens are numbers or 'sym:<name>'. Each stage has exactly one option that follows the
 * rule shown by its examples; `rule` explains it once the stage is solved. */
export const series = {
  init: () => ({ stage: 0, mistakes: 0, tried: [] }),
  pick(config, state, value) {
    const stage = config.stages[state.stage];
    if (!stage || !stage.options.some((o) => String(o) === String(value)) || state.tried.includes(String(value))) return { state, outcome: 'noop' };
    if (String(value) !== String(stage.answer)) {
      return { state: { ...state, mistakes: state.mistakes + 1, tried: [...state.tried, String(value)] }, outcome: 'wrong' };
    }
    const next = state.stage + 1;
    if (next >= config.stages.length) return { state, outcome: 'solved' };
    return {
      state: { ...state, stage: next, tried: [] },
      outcome: 'progress',
      message: `✓ ${stage.rule} — المستوى ${next + 1} من ${config.stages.length}.`,
    };
  },
};

/* ── machine (Phase 04): a logic machine with several dials and levers ──
 * config: { dials: [{ label, states: [...] }],
 *           levers: [{ id, label, effects: [{ dial, by, if?: { dial, is | not } }] }],
 *           stages: [{ start: [...], target: [...], hidden?, max? }], messages? }
 * A lever's conditions read the dials as they were BEFORE the pull (all effects at once).
 * Pulling is free experimenting (the log shows what changed); only «شغّلي» checks, and a
 * wrong run keeps the dials. `hidden` targets come from the evidence, not the screen;
 * `max` limits the pulls (then planning matters; «رجّعي» restarts the stage). */
const MACHINE_LOG = 6;
export function machineDials(config, state) {
  return state.dials ?? config.stages[state.stage].start;
}
export function machinePull(config, dials, leverId) {
  const lever = config.levers.find((l) => l.id === leverId);
  if (!lever) return null;
  const next = [...dials];
  for (const e of lever.effects) {
    if (e.if && ('is' in e.if ? dials[e.if.dial] !== e.if.is : dials[e.if.dial] === e.if.not)) continue;
    const n = config.dials[e.dial].states.length;
    next[e.dial] = (((next[e.dial] + e.by) % n) + n) % n;
  }
  return next;
}
export const machine = {
  init: () => ({ stage: 0, dials: null, moves: 0, log: [], mistakes: 0 }),
  pull(config, state, leverId) {
    const stage = config.stages[state.stage];
    const before = machineDials(config, state);
    const dials = machinePull(config, before, leverId);
    if (!dials) return { state, outcome: 'noop' };
    if (stage.max && state.moves >= stage.max) {
      return { state, outcome: 'noop', message: config.messages?.max ?? 'خلصت الحركات. رجّعي الآلة للبداية وخططي.' };
    }
    const log = [{ lever: leverId, from: before, to: dials }, ...state.log].slice(0, MACHINE_LOG);
    return { state: { ...state, dials, moves: state.moves + 1, log }, outcome: 'progress' };
  },
  reset: (config, state) => ({ state: { ...state, dials: null, moves: 0, log: [] }, outcome: 'progress' }),
  run(config, state) {
    const stage = config.stages[state.stage];
    const dials = machineDials(config, state);
    if (!dials.every((d, i) => d === stage.target[i])) {
      return { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong', message: config.messages?.wrong };
    }
    const next = state.stage + 1;
    if (next >= config.stages.length) return { state, outcome: 'solved' };
    return {
      state: { ...state, stage: next, dials: null, moves: 0, log: [] },
      outcome: 'progress',
      message: `${config.messages?.next ?? 'اشتغلت!'} — المستوى ${next + 1} من ${config.stages.length}.`,
    };
  },
  // the dials she has set survive closing the panel (a flag string; no save-schema change)
  draft: {
    save: (state) => JSON.stringify({ stage: state.stage, dials: state.dials, moves: state.moves }),
    load(config, raw, state) {
      const d = JSON.parse(raw);
      const st = config.stages[d.stage];
      if (!st || (d.dials && (!Array.isArray(d.dials) || d.dials.length !== config.dials.length))) return state;
      return { ...state, stage: d.stage, dials: d.dials ?? null, moves: Math.min(Number(d.moves) || 0, st.max ?? Infinity) };
    },
  },
};

/* ── contradict (Phase 04): find the claim each witness got wrong, and the fact that proves it ──
 * config: { evidence: [{ id, label, note, icon }],
 *           stages: [{ who, icon, claims: [text…], answer: { claim: index | -1, evidence?: id | [ids] }, explain }] }
 * (several ids: each of them alone proves it).
 * claim -1 means «ما بيها تناقض»: every claim fits the facts. A wrong pair only says it does
 * not prove anything (no count, no "warmer"), and keeps what she picked. */
export const contradict = {
  init: () => ({ stage: 0, claim: null, evidence: null, mistakes: 0 }),
  pickClaim(config, state, i) {
    const n = config.stages[state.stage].claims.length;
    if (!Number.isInteger(i) || i < -1 || i >= n) return { state, outcome: 'noop' };
    return { state: { ...state, claim: state.claim === i ? null : i }, outcome: 'progress' };
  },
  pickEvidence(config, state, id) {
    if (!config.evidence.some((e) => e.id === id)) return { state, outcome: 'noop' };
    return { state: { ...state, evidence: state.evidence === id ? null : id }, outcome: 'progress' };
  },
  submit(config, state) {
    const stage = config.stages[state.stage];
    if (state.claim == null || (state.claim >= 0 && !state.evidence)) return { state, outcome: 'noop' };
    const { claim, evidence } = stage.answer;
    const ok = state.claim === claim && (claim === -1 || [].concat(evidence).includes(state.evidence));
    if (!ok) {
      const message =
        state.claim === -1 ? config.messages?.none ?? 'لا… أكو دليل يناقض وحدة من هالجمل.' : config.messages?.wrong ?? 'هالدليل ما يثبت إن هالجملة غلط.';
      return { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong', message };
    }
    const next = state.stage + 1;
    if (next >= config.stages.length) return { state, outcome: 'solved' };
    return {
      state: { ...state, stage: next, claim: null, evidence: null },
      outcome: 'progress',
      message: `✓ ${stage.explain} — الشهادة ${next + 1} من ${config.stages.length}.`,
    };
  },
};

/* ── logicgrid (Phase 04): put together pieces of evidence found in different places ──
 * config: { rows: [{ id, label, icon }], cols: [{ id, label, options: [{ id, label }] }],
 *           clues: [{ text, rule }] }
 * Rules: { is: [row, col, opt] }, { notIn: [row, col, [opt…]] }, { next: [rowA, rowB, col] }
 * (rowB's option is the one right after rowA's), { distinct: col }. Checking never counts
 * right cells: it names the first clue the grid breaks, so every answer is argued from the
 * clues, and the clues have exactly one solution, each of them needed (tested). */
const optIndex = (config, col, opt) => config.cols.find((c) => c.id === col).options.findIndex((o) => o.id === opt);
export function clueHolds(config, cells, rule) {
  const val = (row, col) => cells[row]?.[col] ?? null;
  if (rule.is) return val(rule.is[0], rule.is[1]) === rule.is[2];
  if (rule.notIn) return !rule.notIn[2].includes(val(rule.notIn[0], rule.notIn[1]));
  if (rule.next) {
    const [a, b, col] = rule.next;
    return optIndex(config, col, val(b, col)) === optIndex(config, col, val(a, col)) + 1;
  }
  if (rule.distinct) {
    const vals = config.rows.map((r) => val(r.id, rule.distinct));
    return new Set(vals).size === vals.length;
  }
  if (rule.pair) {
    // Team Us: "whoever has A has B": a row has value a in column ca exactly when it has b in cb
    const [ca, a, cb, b] = rule.pair;
    return config.rows.every((r) => (val(r.id, ca) === a) === (val(r.id, cb) === b));
  }
  throw new Error(`Unknown clue rule ${JSON.stringify(rule)}`);
}
export const logicgrid = {
  init: () => ({ cells: {}, broken: null, mistakes: 0 }),
  cycle(config, state, row, col, dir = 1) {
    const c = config.cols.find((x) => x.id === col);
    if (!c || !config.rows.some((r) => r.id === row)) return { state, outcome: 'noop' };
    const n = c.options.length;
    const cur = optIndex(config, col, state.cells[row]?.[col]);
    const nextIdx = cur < 0 ? (dir > 0 ? 0 : n - 1) : (((cur + dir) % n) + n) % n;
    const cells = { ...state.cells, [row]: { ...state.cells[row], [col]: c.options[nextIdx].id } };
    return { state: { ...state, cells, broken: null }, outcome: 'progress' };
  },
  check(config, state) {
    const empty = config.rows.some((r) => config.cols.some((c) => state.cells[r.id]?.[c.id] == null));
    if (empty) return { state, outcome: 'noop', message: 'بعد أكو خانات فارغة.' };
    const broken = config.clues.findIndex((cl) => !clueHolds(config, state.cells, cl.rule));
    if (broken < 0) return { state: { ...state, broken: null }, outcome: 'solved' };
    return {
      state: { ...state, broken, mistakes: state.mistakes + 1 },
      outcome: 'wrong',
      message: `الدليل ${broken + 1} ما ينطبق: «${config.clues[broken].text}»`,
    };
  },
  draft: {
    save: (state) => JSON.stringify(state.cells),
    load(config, raw, state) {
      const saved = JSON.parse(raw);
      const cells = {};
      for (const r of config.rows) {
        for (const c of config.cols) {
          const v = saved?.[r.id]?.[c.id];
          if (c.options.some((o) => o.id === v)) cells[r.id] = { ...cells[r.id], [c.id]: v };
        }
      }
      return { ...state, cells };
    },
  },
};
/** Every grid that satisfies all the clues (content tests: exactly one, and every clue needed). */
export function logicgridSolutions(config, clues = config.clues) {
  // options may repeat in a column unless a clue says otherwise: search every combination
  const colCombos = config.cols.map((c) => {
    const ids = c.options.map((o) => o.id);
    const out = [];
    const rec = (acc) => (acc.length === config.rows.length ? out.push(acc) : ids.forEach((id) => rec([...acc, id])));
    rec([]);
    return out;
  });
  const found = [];
  const rec = (k, cells) => {
    if (k === config.cols.length) {
      if (clues.every((cl) => clueHolds(config, cells, cl.rule))) found.push(cells);
      return;
    }
    for (const combo of colCombos[k]) {
      const next = Object.fromEntries(config.rows.map((r, i) => [r.id, { ...cells[r.id], [config.cols[k].id]: combo[i] }]));
      rec(k + 1, next);
    }
  };
  rec(0, {});
  return found;
}

export const RULES = { sequence, choice, lock, cipher, switches, candles, code, connect, program, arrange, clock, rings, deduction, series, machine, contradict, logicgrid };

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

/** Shortest command list for one program stage (BFS over x, y, dir and the keys she holds). */
export function programSolution(stage, commands = ['F', 'L', 'R']) {
  // with root gates, the beat's parity is part of the state
  const gates = stage.grid.some((r) => /[12]/.test(r));
  const key = (s, n) => `${s.x},${s.y},${s.dir},${s.keys || ''}${gates ? `,${n % 2}` : ''}`;
  const queue = [[stage.start, []]];
  const seen = new Set([key(stage.start, 0)]);
  while (queue.length) {
    const [s, prog] = queue.shift();
    if (prog.length >= stage.max) continue;
    for (const c of commands) {
      const p = [...prog, c];
      const res = runProgram(stage, p);
      if (res.ok) return p;
      if (res.crash) continue;
      const end = res.trace[res.trace.length - 1];
      if (seen.has(key(end, p.length))) continue;
      seen.add(key(end, p.length));
      queue.push([{ x: end.x, y: end.y, dir: end.dir, keys: end.keys }, p]);
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
      const p = programSolution(c.stages[k], programCommands(c));
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
  series: (c, s) => c.stages.slice(s.stage).map((st) => ['pick', st.answer]),
  deduction: (c) => [['pickSuspect', c.answer.suspect], ...c.answer.evidence.slice(0, c.need || 2).map((e) => ['toggleEvidence', e]), ['submit']],
  machine: (c, s) => {
    const moves = [];
    for (let k = s.stage; k < c.stages.length; k++) {
      const st = c.stages[k];
      const fresh = k !== s.stage || !s.moves;
      if (!fresh) moves.push(['reset']);
      const pulls = machineSolution(c, st.start, st.target, st.max);
      if (!pulls) return null;
      moves.push(...pulls.map((id) => ['pull', id]), ['run']);
    }
    return moves;
  },
  contradict: (c, s) =>
    c.stages.slice(s.stage).flatMap((st, k) => {
      const { claim, evidence } = st.answer;
      const cur = k === 0 ? s : { claim: null, evidence: null };
      const proof = [].concat(evidence)[0];
      const moves = cur.claim === claim ? [] : [['pickClaim', claim]];
      if (claim >= 0 && cur.evidence !== proof) moves.push(['pickEvidence', proof]);
      return [...moves, ['submit']];
    }),
  logicgrid: (c, s) => {
    const [sol] = logicgridSolutions(c);
    if (!sol) return null;
    const moves = [];
    for (const r of c.rows) {
      for (const col of c.cols) {
        const n = col.options.length;
        const cur = optIndex(c, col.id, s.cells[r.id]?.[col.id]);
        const want = optIndex(c, col.id, sol[r.id][col.id]);
        const steps = cur < 0 ? want + 1 : (want - cur + n) % n;
        for (let i = 0; i < steps; i++) moves.push(['cycle', r.id, col.id, 1]);
      }
    }
    return [...moves, ['check']];
  },
};

/** Fewest lever pulls from `start` to `target` (BFS: the machines have a few dozen states). */
export function machineSolution(config, start, target, max = Infinity) {
  const key = (d) => d.join(',');
  const queue = [[start, []]];
  const seen = new Set([key(start)]);
  while (queue.length) {
    const [d, pulls] = queue.shift();
    if (key(d) === key(target)) return pulls;
    if (pulls.length >= max) continue;
    for (const l of config.levers) {
      const n = machinePull(config, d, l.id);
      if (seen.has(key(n))) continue;
      seen.add(key(n));
      queue.push([n, [...pulls, l.id]]);
    }
  }
  return null;
}

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
