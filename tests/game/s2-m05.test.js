/**
 * Season 2, M2 — Mission 05 «ليلة الفوانيس» (s2-16; src/game/data/m2/m05-night.js, puzzles/rules-shadows.js).
 *
 * - the `shadows` rule: a ray points away from its lantern and grows with distance; every (hook, lantern) pair
 *   throws its own ray, so the photograph has exactly ONE layout (the solver searches them all, and agrees with
 *   brute force); the eighth lantern (never lit) stays in the basket; checking a wrong wall says nothing;
 * - every route keeps it a real search (≥ 20 layouts) and keeps it solvable by reasoning;
 * - no help, and no position in anything she reads before the wall matches;
 * - played through from its own data for every route (office-cover × jojo-confront, tree-tease both ways):
 *   each route changes the play; ids in Season 2's save; the original save byte-identical;
 * - M1's lantern tree is exactly as shipped until Mission 05 opens; the panel works in the real interface.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { RULES, solve, replay } from '../../src/game/puzzles/rules.js';
import { canSkip, resolveConfig, STRICT_WRONG } from '../../src/game/puzzles/host.js';
import { shadows, photoOf, raysOf, castsPhoto, shadowSolutions, allLayouts, shadowGuesses, tipFrom, lanternPos, givensOf, mapOf } from '../../src/game/puzzles/rules-shadows.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { S2_SCENES } from '../../src/game/data/scenes/s2.js';
import { EVIDENCE_S2, DECISIONS_S2 } from '../../src/game/data/evidence-s2.js';
import { EVIDENCE_S2_M2, DECISIONS_S2_M2, CASE_S2_M2, JOURNAL_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import { MISSIONS as GRAPH } from '../../docs/season-2/graph.mjs';
import { createGameApp } from '../../src/game/app.js';
import M05, { SHADOWS_CONFIG as C, NIGHT_LAYOUT } from '../../src/game/data/m2/m05-night.js';
import { memoryStorage } from '../helpers.js';

const SH = PUZZLES['s2-shadows'];
const M = MISSIONS.find((m) => m.id === 's2-16');
const TREE = SCENES['s2-tree']; // M1's place, as extended by the modules
const TREE_M1 = S2_SCENES.find((s) => s.id === 's2-tree'); // as first shipped
const NIGHT_SCENE = SCENES['s2-tree-night'];
const T0 = 1_800_000_000_000;
const OWN = new Set(CASE_S2_M2.find((c) => c.mission === 's2-16').ids);
const ANSWER_WORDS = ['على الحلگة', 'بالحلگة', 'سبع ظلال', 'سبعة ظلال', 'الثامن ما انعلّگ', 'ما چان بالشجرة', 'بقى بالعلّية'];
/** A config as the host resolves it for a player with these decisions. */
const routed = ({ truth = false, gentle = false } = {}) =>
  resolveConfig(C, { flag: (k) => (k === 's2:14-hooks-map' ? gentle : k === 's2:dec:office-cover' ? (truth ? 'truth' : 'cover') : false), has: () => false, seen: () => false });
const ROUTES = [
  { name: 'cover × blunt', truth: false, gentle: false },
  { name: 'cover × gentle', truth: false, gentle: true },
  { name: 'truth × blunt', truth: true, gentle: false },
  { name: 'truth × gentle', truth: true, gentle: true },
];

/* ── the rule ── */
describe('the shadows rule', () => {
  it('eight lanterns, more hooks than lanterns; the photograph shows seven rays (the eighth never lit)', () => {
    expect(C.lanterns).toHaveLength(8);
    expect(C.hooks.length).toBeGreaterThanOrEqual(10);
    expect(C.hooks.length).toBeGreaterThan(C.lanterns.length);
    expect(photoOf(C)).toHaveLength(7);
    expect(C.answer.l8).toBeNull();
    expect(new Set(C.lanterns.map((l) => l.drop)).size).toBe(8); // every cord its own length
  });

  it('a ray points away from its lantern, and is longer the further the lantern hangs', () => {
    for (const h of C.hooks) {
      for (const l of C.lanterns) {
        const p = lanternPos(C, h.id, l.id);
        const t = tipFrom(C, p);
        const toLantern = [p.x - C.peg.x, p.y - C.peg.y];
        const ray = [t.x - C.peg.x, t.y - C.peg.y];
        expect(toLantern[0] * ray[0] + toLantern[1] * ray[1]).toBeLessThan(0); // the opposite way
        expect(Math.hypot(...ray)).toBeCloseTo(C.k * Math.hypot(...toLantern), 6);
      }
    }
    // the same hook, a longer cord: the lantern is lower, nearer the stand — a shorter ray
    const a = raysOf(C, { l1: 'h1' })[0];
    const b = raysOf(C, { l7: 'h1' })[0];
    expect(Math.hypot(b.tip.x - C.peg.x, b.tip.y - C.peg.y)).toBeLessThan(Math.hypot(a.tip.x - C.peg.x, a.tip.y - C.peg.y));
  });

  it('the photograph is readable: its rays are well apart, and every other lantern-on-a-hook throws a visibly different one', () => {
    const photo = photoOf(C);
    for (let i = 0; i < photo.length; i++) for (let j = i + 1; j < photo.length; j++) expect(Math.hypot(photo[i].tip.x - photo[j].tip.x, photo[i].tip.y - photo[j].tip.y)).toBeGreaterThan(30);
    for (const h of C.hooks) {
      for (const l of C.lanterns) {
        if (C.answer[l.id] === h.id) continue;
        const t = tipFrom(C, lanternPos(C, h.id, l.id));
        for (const r of photo) expect(Math.hypot(t.x - r.tip.x, t.y - r.tip.y), `${l.id}@${h.id}`).toBeGreaterThan(12);
      }
    }
    // and the photograph shows only the wall: no lantern hangs inside its frame (it starts at y = 205)
    for (const r of photo) expect(r.pos.y + 14).toBeLessThan(205);
  });

  it('UNIQUE: every (hook, lantern) pair throws its own ray, and exactly one layout casts the photograph', () => {
    const keys = new Set();
    for (const h of C.hooks) for (const l of C.lanterns) keys.add(JSON.stringify(tipFrom(C, lanternPos(C, h.id, l.id))));
    expect(keys.size).toBe(C.hooks.length * C.lanterns.length); // so each of the photograph's rays has one source
    const sols = shadowSolutions(C);
    expect(sols).toEqual([NIGHT_LAYOUT]);
    expect(sols[0].l8).toBeNull(); // the eighth stays in the basket
    // on every route (what she starts with does not change what the night was)
    for (const r of ROUTES) expect(shadowSolutions(routed(r)), r.name).toEqual([NIGHT_LAYOUT]);
  });

  it('the solver’s pruned search finds exactly what brute force finds (a smaller wall, every layout tried)', () => {
    const small = { ...C, hooks: C.hooks.slice(0, 6), lanterns: C.lanterns.slice(0, 5), answer: { l1: 'h2', l2: 'h5', l3: null, l4: 'h1', l5: 'h6' }, stages: [] };
    const brute = allLayouts(small).filter((at) => castsPhoto(small, at));
    expect(allLayouts(small).length).toBeGreaterThan(4000);
    expect(shadowSolutions(small)).toEqual(brute);
    expect(brute).toHaveLength(1);
    // and on the real wall, thousands of random layouts: only the night's casts the photograph
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 20000; i++) {
      const free = [...C.hooks.map((h) => h.id)];
      const at = {};
      for (const l of C.lanterns) at[l.id] = rnd() < 0.15 ? null : free.splice(Math.floor(rnd() * free.length), 1)[0];
      expect(castsPhoto(C, at)).toBe(JSON.stringify(at) === JSON.stringify(NIGHT_LAYOUT));
    }
  });

  it('pick up, hang, swap, take down, put back; checking says only right or nothing (no count, no message)', () => {
    const c = C;
    let s = RULES.shadows.init({ ...c, stages: [] });
    expect(Object.values(s.at).every((h) => h === null)).toBe(true);
    expect(RULES.shadows.hang(c, s, 'h3')).toMatchObject({ outcome: 'noop' }); // nothing in her hand, nothing there
    s = RULES.shadows.take(c, s, 'l1').state;
    expect(s.held).toBe('l1');
    s = RULES.shadows.hang(c, s, 'h3').state;
    expect([s.at.l1, s.held]).toEqual(['h3', null]);
    s = RULES.shadows.take(c, s, 'l2').state;
    s = RULES.shadows.hang(c, s, 'h3').state; // a swap: the one there comes into her hand
    expect([s.at.l2, s.at.l1, s.held]).toEqual(['h3', null, 'l1']);
    expect(RULES.shadows.check(c, s)).toMatchObject({ outcome: 'noop' }); // a lantern in her hand: hang it first
    s = RULES.shadows.down(c, s).state;
    expect(s.held).toBeNull();
    const wrong = RULES.shadows.check(c, s);
    expect(wrong.outcome).toBe('wrong');
    expect(wrong.message).toBeUndefined();
    expect(wrong.state.at).toEqual(s.at); // her wall stays as she hung it
    s = RULES.shadows.hang(c, wrong.state, 'h3').state; // a tap on a hung lantern takes it down
    expect([s.at.l2, s.held]).toEqual([null, 'l2']);
    // the night itself, by hand: right
    let n = RULES.shadows.init({ ...c, stages: [] });
    for (const [l, h] of Object.entries(NIGHT_LAYOUT)) if (h) n = RULES.shadows.hang(c, RULES.shadows.take(c, n, l).state, h).state;
    expect(RULES.shadows.check(c, n).outcome).toBe('solved');
    // all eight hung (the eighth too): eight rays, never the photograph
    for (const h of C.hooks.map((x) => x.id).filter((h) => !Object.values(NIGHT_LAYOUT).includes(h))) {
      const all = RULES.shadows.hang(c, RULES.shadows.take(c, n, 'l8').state, h).state;
      expect(raysOf(c, all.at)).toHaveLength(8);
      expect(RULES.shadows.check(c, all).outcome).toBe('wrong');
    }
  });

  it('the solver finishes from any state (the start, a route’s start, a muddle), replayed through the rule', () => {
    for (const r of ROUTES) {
      const c = routed(r);
      expect(replay('shadows', c, solve('shadows', c)).outcome, r.name).toBe('solved');
    }
    const c = routed({});
    let s = RULES.shadows.init(c);
    for (const [l, h] of [['l8', 'h1'], ['l1', 'h2'], ['l3', 'h11'], ['l2', 'h7']]) s = RULES.shadows.hang(c, RULES.shadows.take(c, s, l).state, h).state;
    s = RULES.shadows.take(c, s, 'l5').state;
    let state = s;
    let outcome;
    for (const [a, ...args] of solve('shadows', c, s)) ({ state, outcome } = RULES.shadows[a](c, state, ...args));
    expect(outcome).toBe('solved');
  });

  it('what she hung is kept when she leaves (a draft); a broken or foreign draft is cleaned, never trusted', () => {
    const c = routed({});
    let s = RULES.shadows.init(c);
    s = RULES.shadows.hang(c, RULES.shadows.take(c, s, 'l4').state, 'h6').state;
    const raw = RULES.shadows.draft.save(s);
    expect(RULES.shadows.draft.load(c, raw, RULES.shadows.init(c)).at.l4).toBe('h6');
    const bad = RULES.shadows.draft.load(c, JSON.stringify({ l1: 'h1', l2: 'h1', l3: 'nowhere', zz: 'h2' }), RULES.shadows.init(c));
    expect(bad.at).toMatchObject({ l1: 'h1', l2: null, l3: null });
    expect(bad.at.zz).toBeUndefined();
  });
});

/* ── routes ── */
describe('earlier decisions change the play', () => {
  it('office-cover=truth: Sabri remembers where Ryan stood — two lanterns hang from the start; cover: none', () => {
    expect(givensOf(routed({ truth: true }))).toEqual({ l6: 'h2', l7: 'h1' });
    expect(RULES.shadows.init(routed({ truth: true })).at).toMatchObject({ l6: 'h2', l7: 'h1' });
    expect(givensOf(routed({ truth: false }))).toEqual({});
    // what he remembers is true (it is the night's own)
    for (const [l, h] of Object.entries(givensOf(routed({ truth: true })))) expect(NIGHT_LAYOUT[l]).toBe(h);
  });

  it('jojo-confront=gentle: Uncle Jojo’s map marks the hooks used that night (only those); blunt: no map', () => {
    const map = mapOf(routed({ gentle: true }));
    expect(new Set(map)).toEqual(new Set(Object.values(NIGHT_LAYOUT).filter(Boolean)));
    expect(mapOf(routed({ gentle: false }))).toBeNull();
  });

  it('every route stays a real search: at least 20 layouts (a blind guess under 5%), most help included', () => {
    const report = {};
    for (const r of ROUTES) {
      report[r.name] = shadowGuesses(routed(r));
      expect(report[r.name], r.name).toBeGreaterThanOrEqual(20);
    }
    expect(report['truth × gentle']).toBe(720); // 6 lanterns for the 5 marked hooks left
    expect(report['cover × blunt']).toBeGreaterThan(1e7);
    console.info('[s2-shadows guess space per route]', JSON.stringify(report));
  });
});

/* ── no help; no answer before it is earned ── */
const lines = (key) => {
  const out = [];
  const walk = (nodes) => {
    for (const n of [].concat(nodes || [])) {
      if (n.t) out.push(n.t);
      for (const o of n.choice || []) {
        out.push(o.t);
        walk(o.then);
      }
      walk(n.then);
      walk(n.else);
    }
  };
  walk(DIALOGUE[key]);
  return out;
};
/** Every line she can hear in this mission before the wall matches. */
const BEFORE = ['s2.16-tree-lama', 's2.16-ryan-day', 's2.16-enter', 's2.16-lama-photo', 's2.16-photo-hand', 's2.16-lama-photo-again', 's2.16-lama-wait', 's2.16-stand', 's2.16-stand-intro', 's2.16-stand-nophoto', 's2.16-basket', 's2.16-sabri', 's2.16-ryan', 's2.16-jojo', 's2.16-table'];

describe('no help with the story', () => {
  it('the puzzle is strict: no hints, no solution, never skipped', () => {
    expect(SH.strict && SH.noSkip && SH.noSolution).toBe(true);
    expect(SH.hints).toBeUndefined();
    expect(SH.solutionText).toBeUndefined();
    expect(canSkip(SH, { mistakes: 99, hintsUsed: 99 })).toBe(false);
  });

  it('REGRESSION: no position in anything she reads before the wall matches (puzzle, mission, every line before, the photograph’s note)', () => {
    const before = [SH.title, SH.goal, SH.intro, M.summary, ...M.steps.map((s) => s.text), EVIDENCE_S2_M2['f-photo'].note, ...BEFORE.flatMap(lines)];
    expect(before.length).toBeGreaterThan(40);
    for (const text of before) for (const word of ANSWER_WORDS) expect(text.includes(word), `«${word}» in «${text}»`).toBe(false);
    // and no hook is named by its number anywhere before (nobody says which hook)
    for (const text of before) expect(text, text).not.toMatch(/حلگة\s*[0-9٠-٩]/);
    // every one of these keys exists
    for (const k of BEFORE) expect(DIALOGUE[k], k).toBeTruthy();
  });
});

/* ── played from the data, as the engine runs it ── */
function setup() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج', 'sp1-husky-met': true };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  const saveManager = createSaveManager({ storage, now: () => T0 + 1 });
  const loaded = saveManager.load();
  const s2Store = createS2Store({ storage, now: () => T0 + 2 });
  const game = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now: () => T0 + 3 });
  const snapshot = () => ['', ':backup', ':shadow'].map((k) => storage.getItem(SAVE_KEY + k));
  return { game, snapshot, heard: [], gotos: [] };
}
function say(t, nodes) {
  for (const n of [].concat(nodes || [])) {
    if ('if' in n && !n.t && !n.choice) {
      say(t, check(n.if, t.game) ? n.then : n.else);
      continue;
    }
    if (n.t) t.heard.push(n.t);
    if (n.do) applyEffects(n.do, t.game);
  }
}
/**
 * A run list as the engine runs it. A puzzle: `t.wall(config)` hangs lanterns as she would (from the config the
 * host resolves for her) and returns the rule's outcome; solved → reward and `then`, else `else`.
 */
function run(t, actions) {
  for (const a of [].concat(actions || [])) {
    if (typeof a === 'function') continue;
    if (a.say) say(t, DIALOGUE[a.say]);
    else if (a.fx) applyEffects(a.fx, t.game);
    else if (a.all) run(t, a.all);
    else if (a.goto) t.gotos.push(a.goto);
    else if (a.puzzle) {
      const p = PUZZLES[a.puzzle];
      const config = resolveConfig(p.config, t.game);
      t.opened = config;
      const outcome = t.wall ? t.wall(config) : 'closed';
      if (outcome === 'solved') {
        if (t.game.recordResult(`puzzle:${a.puzzle}`, { completed: true }).firstClear) applyEffects(p.reward, t.game);
        run(t, a.then);
      } else run(t, a.else);
    } else if ('if' in a && 'then' in a) run(t, check(a.if, t.game) ? a.then : a.else);
    syncMissions(t.game, { season2: true });
  }
}
function tap(t, sceneId, id) {
  const it = SCENES[sceneId].interact.find((i) => i.id === id);
  if (!it || !check(it.if, t.game)) return null;
  const c = it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, t.game)) : it;
  run(t, c.run);
  return c.run;
}
function arrive(t, sceneId) {
  for (const tr of SCENES[sceneId].triggers || []) if (check(tr.if, t.game)) run(t, tr.run);
}
const M1_DONE = ['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11'];
const NEEDS = ['e-drift', 't-jojo-true', 't-rabi', 'e-page', 'e-loft', 'e-logbook', 'e-blank', 'e-moved'];
function toMission05(g, { truth, gentle, tease }) {
  for (const id of [...M1_DONE, 's2-12', 's2-13', 's2-14', 's2-15']) g.setFlag(`mission:${id}`);
  for (const e of NEEDS) g.collect(`s2.ev.${e}`);
  g.setFlag('s2:dec:office-cover', truth ? 'truth' : 'cover');
  g.setFlag('s2:dec:jojo-confront', gentle ? 'gentle' : 'blunt');
  if (gentle) g.setFlag('s2:14-hooks-map', true);
  g.setFlag('s2:dec:tree-tease', tease);
  syncMissions(g, { season2: true });
}
/** She hangs one lantern wrong and checks (nothing said), then rebuilds the night from what the photograph shows. */
const playWall = (t) => (config) => {
  let s = RULES.shadows.init(config);
  t.start = { ...s.at };
  s = RULES.shadows.hang(config, RULES.shadows.take(config, s, 'l8').state, 'h3').state;
  const wrong = RULES.shadows.check(config, s);
  t.wrong = wrong;
  if (wrong.outcome !== 'wrong') return 'closed';
  let state = wrong.state;
  let outcome;
  for (const [a, ...args] of solve('shadows', config, state)) ({ state, outcome } = RULES.shadows[a](config, state, ...args));
  return outcome;
};

describe('Mission 05, played through from its own data', () => {
  for (const [i, r] of ROUTES.entries()) {
    const tease = i % 2 ? 'yes' : 'no';
    it(`a whole playthrough (${r.name}, tree-tease ${tease}): the photograph, the wall, the night in order; the original save byte-identical`, () => {
      const t = setup();
      expect(missionState(M, t.game).status).toBe('locked');
      toMission05(t.game, { ...r, tease });
      expect(missionState(M, t.game).status).toBe('active');
      const before = t.snapshot();

      // by day at the tree, Lama takes her into the night
      expect(tap(t, 's2-tree', 'ryan')).toEqual([{ say: 's2.16-ryan-day' }]);
      tap(t, 's2-tree', 'lama');
      expect(t.gotos).toEqual(['s2-tree-night']);
      arrive(t, 's2-tree-night');
      expect(t.game.flag('s2:in-tree-night')).toBe(true);
      // who takes part: Uncle Jojo comes only if she was kind to him
      const present = (id) => NIGHT_SCENE.actors.some((a) => a.id === id && check(a.if, t.game));
      expect(present('jojo')).toBe(r.gentle);
      expect(present('lama') && present('sabri') && present('ryan')).toBe(true);

      // before the photograph, the stand is only a peg; nothing opens
      tap(t, 's2-tree-night', 'stand');
      expect(t.opened).toBeUndefined();
      // Lama's photograph: in her hand; Sabri remembers (truth) or saw only the ladder (cover)
      t.heard.length = 0;
      tap(t, 's2-tree-night', 'lama');
      expect(t.game.has('s2.ev.f-photo')).toBe(true);
      expect(t.game.flag('s2:hold')).toBe('s2-photo');
      expect(t.heard.some((x) => x.includes('ريان وگف هنا'))).toBe(r.truth);
      expect(t.heard.some((x) => x.includes('ما شفت غير درجات السلّم'))).toBe(!r.truth);
      expect(t.heard.some((x) => x.includes('خريطة الحلگات'))).toBe(r.gentle);

      // a first look, then closed half-way: nothing changes, she still holds the photograph
      t.wall = () => 'closed';
      tap(t, 's2-tree-night', 'stand');
      expect(t.game.flag('s2:16-placed')).toBeFalsy();
      expect(t.game.flag('s2:hold')).toBe('s2-photo');
      // the wall: what she starts with depends on her route; a wrong check; then the night rebuilt
      t.wall = playWall(t);
      t.heard.length = 0;
      tap(t, 's2-tree-night', 'stand');
      expect(Object.values(t.start).filter(Boolean).length).toBe(r.truth ? 2 : 0);
      expect(mapOf(t.opened) !== null).toBe(r.gentle);
      expect(t.wrong).toMatchObject({ outcome: 'wrong' });
      expect(t.wrong.message).toBeUndefined();
      expect(t.game.flag('s2:16-placed')).toBe(true);
      expect(t.game.flag('s2:hold')).toBeFalsy(); // the photograph is put away
      // the night in order: all seven lit, the card, the page, Ryan's "nine"
      expect(t.game.flag('s2:16-lit')).toBe(7);
      expect(t.heard.some((x) => x.includes('بتسعته هو'))).toBe(!r.gentle); // without Jojo: his logbook speaks
      expect(t.heard.some((x) => x.includes('ولّعتها واحد واحد'))).toBe(r.gentle); // with him: he owns it
      expect(t.heard.some((x) => x.includes('يمكن ربيع يحب خطك'))).toBe(tease === 'yes'); // tree-tease, read
      expect(t.heard.some((x) => x.includes('گلتي: «هسه نعرف»'))).toBe(tease === 'no');
      expect(t.game.has('s2.ev.d-timeline') && t.game.has('s2.ev.e-surprise')).toBe(true);
      expect(missionState(M, t.game).status).toBe('complete');
      expect(t.game.inJournal('s2-night')).toBe(true);
      // after: nothing replays; Lama remembers
      expect(tap(t, 's2-tree-night', 'lama')).toEqual([{ say: 's2.16-lama-after' }]);
      expect(tap(t, 's2-tree-night', 'stand')).toEqual([{ say: 's2.16-stand-after' }]);
      expect(tap(t, 's2-tree', 'lama')).toBeNull(); // the mission is done: Lama is no longer waiting by day
      expect(t.snapshot()).toEqual(before);
    });
  }

  it('an interrupted night replays from its start, and a finished one never repeats', () => {
    const t = setup();
    toMission05(t.game, { truth: false, gentle: false, tease: 'no' });
    t.game.setFlag('s2:in-tree-night', true);
    t.game.collect('s2.ev.f-photo');
    t.game.setFlag('s2:16-placed', true); // solved, then the app closed mid-way through the night
    t.game.setFlag('s2:16-lit', 3);
    tap(t, 's2-tree-night', 'lama');
    expect(t.game.flag('s2:16-lit')).toBe(7); // relit from the first, not 3 + 7
    expect(missionState(M, t.game).status).toBe('complete');
  });

  it('every id Mission 05 writes routes to Season 2’s own document; its evidence is registered', () => {
    const ids = ['s2:in-tree-night', 's2:16-placed', 's2:16-lit', 's2:hold', 'pdraft:s2-shadows', 'puzzle:s2-shadows', 'mission:s2-16', 'mission-seen:s2-16', 'visited:s2-tree-night', 't.s2-tree-night.arrive', 'it.s2-tree-night.stand', 'it.s2-tree.lama', 'dlg:s2.16-enter', 's2-night', ...[...OWN].map((e) => `s2.ev.${e}`)];
    for (const id of ids) expect(isS2(id), id).toBe(true);
    for (const e of OWN) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
    for (const e of OWN) expect(EVIDENCE_S2[e], `${e} is not in M1's registry`).toBeUndefined();
    expect(JOURNAL_S2_M2['s2-night']).toBeTruthy();
    for (const k of Object.keys(M05.dialogue)) expect(k.startsWith('s2.16-'), k).toBe(true);
  });

  it('every ev:/dec: it reads or writes is known (Season 2’s registries, or Mission 02’s page)', () => {
    const known = new Set([...Object.keys(EVIDENCE_S2), ...Object.keys(EVIDENCE_S2_M2), 'e-page', 'e-wrapper']);
    const decisions = { ...DECISIONS_S2, ...DECISIONS_S2_M2 };
    const found = [];
    const written = [];
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      for (const [k, v] of Object.entries(x)) {
        if (k === 'if' || k === 'done') found.push(...atoms(v));
        else if (k === 'fx' || k === 'do' || k === 'reward') written.push(...[].concat(v).map((c) => c.replace(/^[!-]/, '')));
        else walk(v);
      }
    };
    walk([M05.missions, M05.scenes.map((s) => [s.actors, s.interact, s.triggers, s.dynamic.map((d) => d.if)]), M05.patches, M05.dialogue, M05.puzzles]);
    expect(found.length).toBeGreaterThan(30);
    expect(written.length).toBeGreaterThan(8);
    // what it writes stays in Season 2 (it may READ the original game's flags, e.g. whether she met her husky)
    for (const fx of written) if (/^(flag|num|journal):/.test(fx)) expect(isS2(fx.split(':').slice(1).join(':')), fx).toBe(true);
    for (const a of [...found, ...written]) {
      const [kind, ...rest] = a.replace(/^!/, '').split(':');
      const arg = rest.join(':');
      if (kind === 'ev') expect(known.has(arg), a).toBe(true);
      if (kind === 'dec') expect(decisions[arg.split('=')[0]], a).toContain(arg.split('=')[1]);
    }
  });

  it('agrees with the approved graph: s2-16 after s2-15; it yields d-timeline and e-surprise', () => {
    const g = GRAPH.find((m) => m.id === 's2-16');
    expect(g.requires).toEqual(['s2-15']);
    expect(M.unlock).toBe('flag:mission:s2-15');
    for (const e of g.yields) expect(OWN.has(e), e).toBe(true);
    // what it needs is what the night is rebuilt from (the clock, Jojo's truth, Rabi's account, the page, the eighth)
    const night = JSON.stringify([M05.dialogue, EVIDENCE_S2_M2['d-timeline']]);
    for (const word of ['ساعة الحديقة', 'العم جوجو', 'ربيع', 'الصفحة', 'الثامن']) expect(night).toContain(word);
  });

  it('M1’s lantern tree is exactly as shipped until Mission 05 opens', () => {
    const g = createGame({ saveManager: null });
    const visible = (scene) => scene.interact.filter((i) => check(i.if, g)).map((i) => i.id).sort();
    const pick = (scene, id) => {
      const it = scene.interact.find((i) => i.id === id);
      return it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, g)).run : it.run;
    };
    const actors = (scene) => (scene.actors || []).filter((a) => check(a.if, g)).map((a) => a.id).sort();
    const same = () => {
      expect(visible(TREE)).toEqual(visible(TREE_M1));
      for (const id of visible(TREE_M1)) expect(pick(TREE, id), id).toEqual(pick(TREE_M1, id));
      expect(actors(TREE)).toEqual(actors(TREE_M1));
    };
    same();
    for (const id of M1_DONE.slice(0, 3)) g.setFlag(`mission:${id}`);
    same();
    for (const id of [...M1_DONE, 's2-12', 's2-13', 's2-14']) g.setFlag(`mission:${id}`);
    same();
    // once it opens: Lama is there, and Ryan has a line for tonight
    g.setFlag('mission:s2-15');
    expect(actors(TREE)).toContain('lama');
    expect(pick(TREE, 'ryan')).toEqual([{ say: 's2.16-ryan-day' }]);
  });
});

describe('decisions are read again later', () => {
  /** Every condition in Season 2's places (as extended by the missions) and dialogue. */
  const reads = () => {
    const read = new Set();
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      for (const [k, v] of Object.entries(x)) {
        if (k === 'if') atoms(v).forEach((c) => read.add(c));
        else walk(v);
      }
    };
    walk([Object.values(SCENES).filter((s) => isS2(s.id)).map((s) => [s.interact, s.actors, s.triggers]), DIALOGUE, Object.values(PUZZLES).filter((p) => p.type === 'shadows').map((p) => p.config)]);
    return read;
  };
  it('tree-tease (M1, assigned to this mission) is read both ways; office-cover both ways; jojo-confront’s map and blunt', () => {
    const read = reads();
    for (const v of ['yes', 'no']) expect(read.has(`dec:tree-tease=${v}`), v).toBe(true);
    for (const v of ['cover', 'truth']) expect(read.has(`dec:office-cover=${v}`), v).toBe(true);
    expect(read.has('flag:s2:14-hooks-map')).toBe(true);
    expect(read.has('dec:jojo-confront=blunt')).toBe(true);
  });
  it('this mission makes no decision of its own (none left unread)', () => {
    expect(M05.decisions).toEqual({});
  });
});

describe('acting, not telling', () => {
  it('the night in order is staged: the camera, people walking, gestures, jolts, the lights coming on one by one', () => {
    const stand = NIGHT_SCENE.interact.find((i) => i.id === 'stand');
    const night = stand.cases.find((c) => c.run?.some?.((a) => a.puzzle)).run.find((a) => a.puzzle).then;
    const flat = [];
    const walk = (l) => [].concat(l || []).forEach((a) => (flat.push(a), walk(a.all), walk(a.then), walk(a.else)));
    walk(night);
    for (const k of ['camera', 'move', 'pose', 'jolt', 'puff']) expect(flat.some((a) => a[k] !== undefined), k).toBe(true);
    expect(flat.filter((a) => a.fx === 'num:s2:16-lit+1')).toHaveLength(7);
    // and the conversations act too: Sabri walks to where Ryan stood
    expect(JSON.stringify(DIALOGUE['s2.16-lama-photo'])).toMatch(/"move":"sabri"/);
  });

  it('REGRESSION: once the wall matches, the world draws the lanterns on their hooks, lit one by one (the drawings read the real flags)', () => {
    const calls = (flags) => {
      let n = 0;
      const grad = { addColorStop: () => {} };
      const ctx = new Proxy({}, { get: (_t, p) => (p === 'createRadialGradient' ? () => grad : () => (p === 'fill' ? n++ : undefined)), set: () => true });
      const game = { flag: (k) => flags[k], has: (k) => Boolean(flags[k]) };
      const tree = NIGHT_SCENE.dynamic.find((d) => d.x === 680);
      tree.draw(ctx, { t: 0, game, world: { reduced: true, actor: () => null } });
      return n;
    };
    const dark = calls({});
    const hung = calls({ 's2:16-placed': true });
    const lit = calls({ 's2:16-placed': true, 's2:16-lit': 7 });
    expect(hung).toBeGreaterThan(dark); // seven lanterns hang
    expect(lit).toBeGreaterThan(hung); // and burn, and throw their rays
    expect(calls({ 's2:16-placed': true, 's2.ev.e-surprise': true })).toBe(lit); // after the night, all lit
  });

  it('REGRESSION: every camera move is one the engine understands (an x, someone’s id, two people, or back to her)', () => {
    // a `{ x }` object once left the camera at NaN: the world stopped drawing after the puzzle
    const cams = [];
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      if ('camera' in x) cams.push(x.camera);
      Object.values(x).forEach(walk);
    };
    walk([M05.scenes.map((s) => [s.interact, s.triggers]), M05.patches, M05.dialogue]);
    expect(cams.length).toBeGreaterThan(5);
    for (const c of cams) expect(c === null || Number.isFinite(c) || typeof c === 'string' || (Array.isArray(c?.between) && Object.keys(c).length === 1), JSON.stringify(c)).toBe(true);
  });
});

it('the module is self-contained: its scene, puzzle, dialogue and evidence are all registered', () => {
  for (const s of M05.scenes) expect(SCENES[s.id], s.id).toBeTruthy();
  for (const id of Object.keys(M05.puzzles)) expect(PUZZLES[id], id).toBeTruthy();
  for (const k of Object.keys(M05.dialogue)) expect(DIALOGUE[k], k).toBeTruthy();
  for (const e of Object.keys(M05.evidence)) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
});

/* ── the real panel (jsdom) ── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
describe('the panel, in the real interface', () => {
  let root;
  let app;
  const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 5000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const v = fn();
      if (v) return v;
      await wait(10);
    }
    throw new Error('timed out');
  };
  const $ = (sel) => root.querySelector(sel);
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
  });
  afterEach(() => {
    app?.destroy();
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('pick up and hang by tapping; the wall draws a ray per lantern; a wrong check is neutral; the night solves it', async () => {
    await app.toTitle();
    const done = app.ui.puzzle('s2-shadows');
    await until(() => $('.puzzle .shd'));
    const rays = () => root.querySelectorAll('.shd-wall polygon').length;
    expect(root.querySelectorAll('.shd-photo polygon')).toHaveLength(7); // the photograph
    expect(rays()).toBe(0);
    expect(root.querySelectorAll('.shd-hook')).toHaveLength(11);
    expect(root.querySelectorAll('.shd-lantern')).toHaveLength(8);
    $('.shd-lantern[data-lantern="l3"]').click();
    expect($('.shd-lantern[data-lantern="l3"]').getAttribute('aria-pressed')).toBe('true');
    $('.shd-hook[data-hook="h4"]').click();
    expect(rays()).toBe(1);
    expect($('.shd-hook[data-hook="h4"]').getAttribute('aria-label')).toMatch(/الفانوس ٣/);
    // a wrong wall: the shared neutral line, no number in it, her lantern still hangs
    $('[data-check]').click();
    await wait(5);
    expect(STRICT_WRONG).toContain($('.puzzle-feedback').textContent);
    expect($('.puzzle-feedback').textContent).not.toMatch(/[0-9٠-٩]/);
    expect(rays()).toBe(1);
    // nothing on the panel marks a hook or a lantern as right
    expect(root.querySelectorAll('.puzzle [class*="solution"], .puzzle [class*="correct"], .puzzle [data-hint]')).toHaveLength(0);
    // take it down (a tap on its hook), back to the basket; then the night, lantern by lantern
    $('.shd-hook[data-hook="h4"]').click();
    $('[data-down]').click();
    expect(rays()).toBe(0);
    for (const [l, h] of Object.entries(NIGHT_LAYOUT)) {
      if (!h) continue;
      $(`.shd-lantern[data-lantern="${l}"]`).click();
      $(`.shd-hook[data-hook="${h}"]`).click();
    }
    expect(rays()).toBe(7);
    $('[data-check]').click();
    await until(() => $('.puzzle.is-solved'));
    expect(app.game.flag('s2:16-placed')).toBe(true);
    $('.panel-foot .btn-primary').click();
    await done;
  });
});
