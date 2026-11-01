/**
 * «ظلال الفوانيس» (Season 2, Mission 05 «ليلة الفوانيس»): a pure rule, its geometry and its solver
 * (tests/game/s2-m05.test.js). The view (view-shadows.js) only draws what these functions compute.
 *
 * The wall (the view's units: 360 × 400, y downward, the ground at 400):
 *  - a hook is a point on a branch; a lantern hangs straight below it on its own cord:
 *        L = (hook.x, hook.y + lantern.drop)
 *  - the wish-card stand is a short peg standing out of the archive wall at P (like a sundial's gnomon).
 *    A light at L throws the peg's shadow on the wall as a ray from P, AWAY from the lantern, k times as
 *    long as the lantern is far:
 *        tip = P + k · (P − L)
 *    so a ray's direction says on which side the lantern hung, and its length how far (and how low) it was.
 *  - every lantern hung on the tree is lit (the night is rebuilt as it was: what hung there, burned);
 *    a lantern left in the basket casts nothing.
 * Lama's photograph is the set of rays the true layout casts. A layout is right exactly when it casts the
 * photograph's rays — no more, no fewer. Checking says only "right" or nothing at all: never how many rays
 * fit, never which lantern (the host answers a wrong try with its shared neutral lines).
 *
 * Route help (Season 2 decisions) comes as `stages[0].cards` with an `if`, which the host keeps only when
 * she has earned it (puzzles/host.js resolveConfig): `given` (lanterns someone remembers, hung at the start)
 * and `hooks` (Uncle Jojo's map of the hooks that were used). The rule itself never reads the game.
 */

const at0 = (config) => Object.fromEntries(config.lanterns.map((l) => [l.id, null]));
const hookOf = (config, id) => config.hooks.find((h) => h.id === id);
const lanternOf = (config, id) => config.lanterns.find((l) => l.id === id);
const cardsOf = (config) => config.stages?.flatMap((s) => s.cards || []) ?? [];

/** Where a lantern hangs on a hook (its flame). */
export function lanternPos(config, hookId, lanternId) {
  const h = hookOf(config, hookId);
  const l = lanternOf(config, lanternId);
  return { x: h.x, y: h.y + l.drop };
}

/** Where the peg's shadow ends on the wall for a light at `pos`. */
export function tipFrom(config, pos) {
  const { peg, k } = config;
  return { x: peg.x + k * (peg.x - pos.x), y: peg.y + k * (peg.y - pos.y) };
}

/** Every ray a layout casts: one per lantern on a hook (lantern order). */
export function raysOf(config, at) {
  const out = [];
  for (const l of config.lanterns) {
    const hook = at[l.id];
    if (!hook) continue;
    const pos = lanternPos(config, hook, l.id);
    out.push({ lantern: l.id, hook, pos, tip: tipFrom(config, pos) });
  }
  return out;
}

const tipKey = (tip) => `${Math.round(tip.x * 10)},${Math.round(tip.y * 10)}`;
const keysOf = (rays) => rays.map((r) => tipKey(r.tip)).sort();

/** Lama's photograph: the rays of the night as it was. */
export const photoOf = (config) => raysOf(config, config.answer);

/** Whether a layout throws exactly the photograph's shadows. */
export function castsPhoto(config, at) {
  const a = keysOf(raysOf(config, at));
  const b = keysOf(photoOf(config));
  return a.length === b.length && a.every((k, i) => k === b[i]);
}

/** Lanterns someone remembers (hung at the start), from the cards she has earned. */
export function givensOf(config) {
  return Object.assign({}, ...cardsOf(config).filter((c) => c.given).map((c) => c.given));
}

/** The hooks Uncle Jojo's map marks (null when she has no map). */
export function mapOf(config) {
  const card = cardsOf(config).find((c) => Array.isArray(c.hooks));
  return card ? card.hooks : null;
}

/** A layout with one lantern per hook at most, every lantern known (anything else is dropped). */
function cleanLayout(config, at) {
  const out = at0(config);
  const used = new Set();
  for (const l of config.lanterns) {
    const h = at?.[l.id];
    if (h && hookOf(config, h) && !used.has(h)) {
      out[l.id] = h;
      used.add(h);
    }
  }
  return out;
}

const occupant = (at, hookId) => Object.keys(at).find((id) => at[id] === hookId) ?? null;

export const shadows = {
  init: (config) => ({ at: cleanLayout(config, givensOf(config)), held: null, mistakes: 0 }),

  /** Pick a lantern up (from the basket, or off its hook). What was in her hand goes back to the basket. */
  take(config, state, lanternId) {
    if (!lanternOf(config, lanternId) || state.held === lanternId) return { state, outcome: 'noop' };
    return { state: { ...state, at: { ...state.at, [lanternId]: null }, held: lanternId }, outcome: 'progress' };
  },

  /** Tap a hook: hang what she holds (a lantern already there comes into her hand), or take one down. */
  hang(config, state, hookId) {
    if (!hookOf(config, hookId)) return { state, outcome: 'noop' };
    const there = occupant(state.at, hookId);
    if (!state.held) {
      if (!there) return { state, outcome: 'noop', message: 'شيلي فانوس من السلة أول، وبعدين المسي الحلگة.' };
      return { state: { ...state, at: { ...state.at, [there]: null }, held: there }, outcome: 'progress' };
    }
    const at = { ...state.at, [state.held]: hookId };
    if (there) at[there] = null;
    return { state: { ...state, at, held: there }, outcome: 'progress' };
  },

  /** Put what she holds back in the basket. */
  down(config, state) {
    if (!state.held) return { state, outcome: 'noop' };
    return { state: { ...state, held: null }, outcome: 'progress' };
  },

  check(config, state) {
    if (state.held) return { state, outcome: 'noop', message: 'بإيدچ فانوس. علّگيه، لو رجّعيه للسلة، وبعدين تحققي.' };
    if (castsPhoto(config, state.at)) return { state, outcome: 'solved' };
    return { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong' };
  },

  // what she hung is kept when she leaves (puzzles/host.js: a draft), never the answer
  draft: {
    save: (state) => JSON.stringify(state.at),
    load: (config, raw, state) => ({ ...state, at: cleanLayout(config, JSON.parse(raw)), held: null }),
  },
};

/**
 * Every layout (each lantern on a hook, or left in the basket) that throws exactly the photograph's rays.
 * Exhaustive: a layout matches only if each hung lantern's ray is one of the photograph's, no two hung
 * lanterns throw the same one, and every one of the photograph's is thrown — so the search may skip every
 * hook whose ray is not in the photograph without missing any layout. The tests require exactly one.
 */
export function shadowSolutions(config) {
  const want = new Map(keysOf(photoOf(config)).map((k) => [k, 0]));
  for (const k of keysOf(photoOf(config))) want.set(k, want.get(k) + 1);
  const found = [];
  const lanterns = config.lanterns.map((l) => l.id);
  const used = new Set();
  const at = at0(config);
  const rec = (i) => {
    if (i === lanterns.length) {
      if ([...want.values()].every((n) => n === 0)) found.push({ ...at });
      return;
    }
    const id = lanterns[i];
    // left in the basket
    rec(i + 1);
    for (const h of config.hooks) {
      if (used.has(h.id)) continue;
      const k = tipKey(tipFrom(config, lanternPos(config, h.id, id)));
      if (!want.get(k)) continue;
      want.set(k, want.get(k) - 1);
      used.add(h.id);
      at[id] = h.id;
      rec(i + 1);
      at[id] = null;
      used.delete(h.id);
      want.set(k, want.get(k) + 1);
    }
  };
  rec(0);
  return found;
}

/** Every layout at all (for tests on small configs: the brute force the pruned search must agree with). */
export function allLayouts(config) {
  const out = [];
  const at = at0(config);
  const used = new Set();
  const rec = (i) => {
    if (i === config.lanterns.length) return out.push({ ...at });
    const id = config.lanterns[i].id;
    rec(i + 1);
    for (const h of config.hooks) {
      if (used.has(h.id)) continue;
      used.add(h.id);
      at[id] = h.id;
      rec(i + 1);
      at[id] = null;
      used.delete(h.id);
    }
  };
  rec(0);
  return out;
}

/**
 * How many different layouts a blind guesser could submit, with the help she has (a resolved config):
 * the remembered lanterns stay where they were hung for her; with Uncle Jojo's map, she fills only the
 * marked hooks (the narrowest she could reason it down to without the photograph); without it, every
 * lantern may go on any free hook or stay in the basket.
 */
export function shadowGuesses(config) {
  const given = givensOf(config);
  const free = config.lanterns.filter((l) => !given[l.id]).length;
  const taken = new Set(Object.values(given));
  const perms = (n, k) => (k <= 0 ? 1 : n * perms(n - 1, k - 1));
  const choose = (n, k) => (k < 0 || k > n ? 0 : perms(n, k) / perms(k, k));
  const map = mapOf(config);
  if (map) return perms(free, map.filter((h) => !taken.has(h)).length);
  const hooks = config.hooks.filter((h) => !taken.has(h.id)).length;
  let n = 0;
  for (let j = 0; j <= Math.min(free, hooks); j++) n += choose(free, j) * perms(hooks, j);
  return n;
}

/** Moves that finish the puzzle from `state` (tests replay them through the rule). */
export function solveShadows(config, state = shadows.init(config)) {
  const moves = [];
  const at = { ...state.at };
  if (state.held) moves.push(['down']);
  // take down every lantern hung where it was not (her hand is empty: a tap on its hook lifts it)
  for (const l of config.lanterns) {
    if (at[l.id] && at[l.id] !== config.answer[l.id]) {
      moves.push(['hang', at[l.id]], ['down']);
      at[l.id] = null;
    }
  }
  for (const l of config.lanterns) {
    const want = config.answer[l.id];
    if (want && at[l.id] !== want) moves.push(['take', l.id], ['hang', want]);
  }
  return [...moves, ['check']];
}
