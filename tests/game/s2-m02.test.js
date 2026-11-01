/**
 * Season 2, M2 — Mission 02 «سنوكي ضايع» (s2-13; src/game/data/m2/m02-snooki.js, minigames/s2-chase*.js).
 *
 * - the chase's rules: three legs of 60–90 s; a flawless run is possible on both routes; a fall goes back to the
 *   last checkpoint passed — never earlier — and what she found stays found; the high route is the only way to
 *   the finds; sliding passes under, standing does not; every jump is full height;
 * - Snooki is never random: he waits when she falls behind, bursts ahead when she is close, hides at a cover and
 *   acts innocent when she reaches him, shows off at the big obstacles, and is gone at the end of each leg;
 * - the two trail readings: strict, a large guess space, and what is DRAWN on each path decides its reading
 *   (paw size, wet or dry, which way the toes point) — exactly one path is the way he went;
 * - no answer in anything she reads before a reading is solved;
 * - played from its own data for both stash choices: ids in Season 2's save, the original save byte-identical;
 *   the stash decision is read (Ryan's line, the stash and her husky afterwards); the finds are read;
 * - M1's archive is exactly as shipped until Mission 02 opens, and after it is done;
 * - Snooki is never her companion: Ryan's dog in the story, placed in a scene or away (data/companions.js).
 */
import { describe, it, expect } from 'vitest';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { RULES, solve, replay } from '../../src/game/puzzles/rules.js';
import { canSkip, resolveConfig } from '../../src/game/puzzles/host.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { S2_SCENES } from '../../src/game/data/scenes/s2.js';
import { EVIDENCE_S2 } from '../../src/game/data/evidence-s2.js';
import { EVIDENCE_S2_M2, DECISIONS_S2_M2, CASE_S2_M2, JOURNAL_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import { MISSIONS as GRAPH } from '../../docs/season-2/graph.mjs';
import { dogsIn } from '../../src/game/data/companions.js';
import { MINIGAMES } from '../../src/game/minigames/registry.js';
import { RUN, DOG, LEGS, createRun, stepRun, goodInput, runMedal } from '../../src/game/minigames/s2-chase-logic.js';
import M02, { FORKS } from '../../src/game/data/m2/m02-snooki.js';
import { memoryStorage } from '../helpers.js';

const T0 = 1_800_000_000_000;
const DT = 1 / 60;
const M = MISSIONS.find((m) => m.id === 's2-13');
const M03 = MISSIONS.find((m) => m.id === 's2-14');
const ARCHIVE = SCENES['s2-archive']; // M1's place, as extended by the modules
const ARCHIVE_M1 = S2_SCENES.find((s) => s.id === 's2-archive'); // as first shipped

/** Play a leg to its end with a good runner (or until `steps`); returns the run and what happened. */
function play(c, { high = false, run = createRun(c), steps = 60 * 400, input = goodInput } = {}) {
  const log = { states: new Set(), restarts: 0, maxGap: -Infinity, finds: [] };
  for (let i = 0; i < steps && !run.done; i++) {
    const ev = stepRun(c, run, DT, input(c, run, { high }));
    if (ev.dog) log.states.add(ev.dog);
    if (ev.restart) log.restarts += 1;
    if (ev.found) log.finds.push(ev.found);
    if (!['escape', 'dodge', 'showoff'].includes(run.dog.state)) log.maxGap = Math.max(log.maxGap, run.dog.x - run.x);
  }
  return { run, log };
}

/* ── the chase ── */
describe('the chase (minigames/s2-chase-logic.js)', () => {
  it('is registered, with a title, a goal and controls in Arabic, and its module mounts', async () => {
    const meta = MINIGAMES['s2-chase'];
    expect(meta.title && meta.goal).toBeTruthy();
    expect(meta.controls.length).toBeGreaterThanOrEqual(3);
    for (const t of [meta.title, meta.goal, ...meta.controls]) expect(t).toMatch(/[؀-ۿ]/);
    expect(typeof (await meta.load()).mount).toBe('function');
    expect(LEGS.map((l) => l.id)).toEqual(['archive', 'tree', 'roof']); // three places
    expect(new Set(LEGS.map((l) => l.theme)).size).toBeGreaterThan(1);
  });

  for (const c of LEGS) {
    it(`${c.id}: a flawless run takes 60–90 s, on the low route and on the high one (gold is possible); only the high route finds`, () => {
      const low = play(c);
      expect(low.run.done).toBe(true);
      expect(low.run.t).toBeGreaterThanOrEqual(60);
      expect(low.run.t).toBeLessThanOrEqual(90);
      expect([low.run.stumbles, low.run.falls]).toEqual([0, 0]);
      expect(runMedal(low.run)).toBe('gold');
      expect(low.run.found.size).toBe(0);
      const high = play(c, { high: true });
      expect(high.run.done && high.run.t <= 90).toBe(true);
      expect([high.run.stumbles, high.run.falls]).toEqual([0, 0]);
      expect([...high.run.found]).toEqual(c.finds.map((f) => f.id));
    });

    it(`${c.id}: things leave time to land and act again; nothing right after a checkpoint, a springboard or the end of a high route`, () => {
      const xs = c.hazards.map((h) => h.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1], `${c.id} @${xs[i]}`).toBeGreaterThanOrEqual(220);
      for (const cp of c.checkpoints.slice(1)) for (const h of c.hazards) expect(Math.abs(h.x - cp) > 250 || h.x < cp, `${c.id}: after the checkpoint @${cp}`).toBe(true);
      for (const sp of c.springs) for (const h of c.hazards) expect(Math.abs(h.x - sp.x)).toBeGreaterThan(150);
      const end = Math.max(...c.platforms.map((p) => p.x1));
      for (const h of c.hazards.filter((x) => x.kind === 'pit')) expect(h.x < c.springs[0].x || h.x > end + 200, `${c.id}: no pit under or just after the high route`).toBe(true);
      expect(Math.max(...xs)).toBeLessThan(c.length);
    });
  }

  it('a fall goes back to the last checkpoint she passed, never earlier; what she found stays found', () => {
    const c = LEGS[0];
    // a good runner up the high route to past the second checkpoint, then she stops jumping
    const { run } = play(c, { high: true, steps: 1 });
    let fell = 0;
    for (let i = 0; i < 60 * 120 && !fell; i++) {
      const past = run.cp >= 2;
      const ev = stepRun(c, run, DT, past ? {} : goodInput(c, run, { high: true }));
      if (ev.restart) fell += 1;
    }
    expect(fell).toBe(1);
    expect(run.cp).toBe(2);
    expect(run.x).toBe(c.checkpoints[2]); // the second checkpoint, not the start
    expect(run.falls).toBe(1);
    expect(run.found.has('ball')).toBe(true); // found up on the wall before the fall: still found
    // and the run can still be finished from there
    const after = play(c, { run });
    expect(after.run.done).toBe(true);
  });

  it('a leg left half-way starts again at its last checkpoint (never earlier)', () => {
    const c = LEGS[2];
    const r = createRun(c, { cp: 1 });
    expect(r.x).toBe(c.checkpoints[1]);
    expect(createRun(c, { cp: 9 }).x).toBe(c.checkpoints[c.checkpoints.length - 1]);
    expect(createRun(c, { cp: 'x' }).x).toBe(0);
  });

  it('a runner who never jumps falls into the first pit, again and again — and is never sent before the start', () => {
    const c = LEGS[1];
    const r = createRun(c);
    let restarts = 0;
    for (let i = 0; i < 60 * 30; i++) restarts += stepRun(c, r, DT, {}).restart ? 1 : 0;
    expect(restarts).toBeGreaterThan(2);
    expect(r.cp).toBe(0);
    expect(r.x).toBeGreaterThanOrEqual(0);
  });

  it('sliding passes under an overhead thing; standing (or jumping into it) does not; every jump is full height', () => {
    const c = LEGS[1];
    const duck = c.hazards.find((h) => h.kind === 'duck');
    const at = (x) => Object.assign(createRun(c), { x, cp: 0 });
    let r = at(duck.x - 60);
    for (let i = 0; i < 50; i++) stepRun(c, r, DT, { slide: i === 0 });
    expect(r.stumbles).toBe(0);
    r = at(duck.x - 60);
    for (let i = 0; i < 50; i++) stepRun(c, r, DT, {});
    expect(r.stumbles).toBe(1);
    r = at(duck.x - 60);
    for (let i = 0; i < 50; i++) stepRun(c, r, DT, { jump: i === 0 });
    expect(r.stumbles).toBe(1);
    // a single tap: the full jump (higher than any low thing, lower than a high route)
    r = createRun(c);
    stepRun(c, r, DT, { jump: true });
    let peak = 0;
    for (let i = 0; i < 60; i++) {
      stepRun(c, r, DT, {});
      peak = Math.max(peak, r.y);
    }
    expect(peak).toBeGreaterThan(Math.max(...c.hazards.filter((h) => h.kind === 'low').map((h) => h.h)) + 40);
    expect(peak).toBeLessThan(RUN.high);
  });
});

describe('Snooki in the chase: what he does follows from where she is', () => {
  it('in every leg he runs, hides, acts innocent when she reaches his cover, shows off, waits for her, dodges, and is gone at the end', () => {
    for (const c of LEGS) {
      const { log } = play(c, { high: true });
      for (const s of ['hide', 'innocent', 'showoff', 'tease', 'dodge', 'escape']) expect(log.states.has(s), `${c.id}: ${s}`).toBe(true);
      expect(log.maxGap, `${c.id}: he stays on a phone's screen`).toBeLessThanOrEqual(DOG.tease + 6);
    }
  });

  it('when she stumbles and falls behind, he stops and waits (looking back), then runs on when she is close', () => {
    const c = LEGS[0];
    const r = createRun(c);
    const states = [];
    // she hits the first low thing (no jump), then runs well
    for (let i = 0; i < 60 * 6; i++) {
      const ev = stepRun(c, r, DT, i < 60 * 3 ? {} : goodInput(c, r));
      if (ev.dog) states.push(ev.dog);
    }
    expect(r.stumbles).toBeGreaterThan(0);
    expect(states).toContain('tease');
    expect(states.indexOf('run', states.indexOf('tease'))).toBeGreaterThan(-1);
  });

  it('is deterministic: the same run, the same Snooki', () => {
    const trace = () => {
      const c = LEGS[2];
      const r = createRun(c);
      const out = [];
      for (let i = 0; i < 60 * 40; i++) {
        const ev = stepRun(c, r, DT, goodInput(c, r, { high: i % 2 === 0 }));
        if (ev.dog) out.push(`${ev.dog}@${Math.round(r.dog.x)}`);
      }
      return out;
    };
    expect(trace()).toEqual(trace());
  });

  it('at his cover he is hidden until she reaches it, then sits there, innocent, while she passes', () => {
    const c = LEGS[0];
    const cover = c.hides[0];
    const r = createRun(c);
    let seen = null;
    for (let i = 0; i < 60 * 30 && !seen; i++) {
      stepRun(c, r, DT, goodInput(c, r));
      if (r.dog.state === 'innocent') seen = { dog: r.dog.x, her: r.x };
    }
    expect(seen.dog).toBe(cover.x);
    expect(seen.dog - seen.her).toBeLessThanOrEqual(DOG.caught);
  });
});

/* ── the trail readings ── */
const BIN_OF = (m) => (m.kind !== 'big' ? 'other' : !m.wet ? 'old' : m.lines.length > 1 ? 'back' : m.lines[0] === 'out' ? 'came' : 'went');

describe('the trail readings «المفترق»', () => {
  for (const [i, id] of ['s2-trail-1', 's2-trail-2'].entries()) {
    const p = PUZZLES[id];
    it(`${id}: strict, solvable by its own rules, one stage of six paths into five readings (5^6 guesses)`, () => {
      expect(p.strict && p.noSkip && p.noSolution).toBe(true);
      expect(p.hints).toBeUndefined();
      expect(canSkip(p, { mistakes: 99, hintsUsed: 99 })).toBe(false);
      const c = resolveConfig(p.config, { has: () => true, flag: () => true });
      expect(replay('sort', c, solve('sort', c)).outcome).toBe('solved');
      const st = c.stages[0];
      expect(st.cards).toHaveLength(6);
      expect(st.bins).toHaveLength(5);
      expect(st.bins.length ** st.cards.length).toBeGreaterThanOrEqual(20);
      for (const card of st.cards) expect(card.accepts, card.id).toHaveLength(1);
      // a wrong reading says nothing about how many fit (strict: the shared neutral line)
      let s = RULES.sort.init(c);
      for (const card of st.cards) s = RULES.sort.place(c, RULES.sort.pick(c, s, card.id).state, 'went').state;
      expect(RULES.sort.submit(c, s).outcome).toBe('wrong');
    });

    it(`${id}: what is drawn on each path decides its reading — and exactly one path is the way he went`, () => {
      const st = p.config.stages[0];
      for (const path of FORKS[i]) {
        const card = st.cards.find((x) => x.id === path.id);
        expect(card.label).toBe(path.name);
        expect(card.accepts[0], `${id}/${path.name}`).toBe(BIN_OF(path.marks));
      }
      expect(FORKS[i].filter((path) => BIN_OF(path.marks) === 'went')).toHaveLength(1);
      // and every reading is needed somewhere (no column is a decoy that nothing fits)
      expect(new Set(FORKS[i].map((path) => BIN_OF(path.marks))).size).toBe(5);
    });
  }

  it('the way he went is where the chase goes on: the lantern tree after the first fork, the shed roof after the second', () => {
    const went = (i) => FORKS[i].find((p) => BIN_OF(p.marks) === 'went');
    expect(went(0).name).toBe('ممر الشجرة');
    expect(went(1).name).toBe('كومة الحطب');
    const trail = SCENES['s2-trail'].interact.find((it) => it.id === `path-${went(0).id}`);
    expect(JSON.stringify(trail.cases[0].run)).toContain('"leg":1');
    const shed = SCENES['s2-shed'].interact.find((it) => it.id === `path-${went(1).id}`);
    expect(JSON.stringify(shed.cases[0].run)).toContain('"leg":2');
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
describe('no answer before she earns it', () => {
  it('REGRESSION GUARD: the mission, the readings and every line before a reading never say which way he went', () => {
    const p1 = PUZZLES['s2-trail-1'];
    const p2 = PUZZLES['s2-trail-2'];
    const before1 = [M.summary, ...M.steps.map((s) => s.text), p1.title, p1.goal, p1.intro, ...['s2.13-archive-enter', 's2.13-trail-start', 's2.13-leg1-done', 's2.13-trail-enter', 's2.13-trail-read', 's2.13-sign1-wait', 's2.13-sign1-intro', 's2.13-later', ...FORKS[0].map((p) => `s2.13-m1-${p.id}`)].flatMap(lines)];
    const before2 = [M.summary, ...M.steps.map((s) => s.text), p2.title, p2.goal, p2.intro, ...['s2.13-leg2-done', 's2.13-shed-enter', 's2.13-shed-husky', 's2.13-sign2-intro', 's2.13-gate-locked', ...FORKS[1].map((p) => `s2.13-m2-${p.id}`)].flatMap(lines)];
    const answer1 = ['راح من ممر الشجرة', 'ممر الشجرة هو', 'راح للشجرة', 'دخله ورجع', 'البركة تمويه', 'دخل، وما رجع', 'هناك راح'];
    const answer2 = ['راح للحطب', 'صعد للسطح', 'من الحطب للسطح', 'لأنه صعد', 'البوابة تمويه', 'مو درب سنوكي', 'فوگ السگف', 'السطح'];
    for (const text of before1) for (const w of answer1) expect(text.includes(w), `«${w}» in «${text}»`).toBe(false);
    for (const text of before2) for (const w of answer2) expect(text.includes(w), `«${w}» in «${text}»`).toBe(false);
    // the minigame's own texts (seen before every leg) name no place
    const meta = MINIGAMES['s2-chase'];
    for (const t of [meta.title, meta.goal, ...meta.controls]) for (const w of ['الشجرة', 'السقيفة', 'السطح', 'الحطب']) expect(t.includes(w), `${w} in «${t}»`).toBe(false);
  });

  it('the roof (where he went after the second fork) shows nothing before that reading is solved', () => {
    const shed = SCENES['s2-shed'];
    const g = createGame({ saveManager: null });
    for (const k of ['leg1', 'fork1', 'leg2']) g.setFlag(`s2:13-${k}`);
    expect(shed.actors.filter((a) => check(a.if, g))).toEqual([]);
    expect(shed.dynamic.filter((d) => d.if !== undefined && check(d.if, g))).toEqual([]);
  });
});

/* ── played from the data, as the engine runs it ── */
function setup() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج', 'sp1-husky-met': true, 't.final.meet': true };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  const saveManager = createSaveManager({ storage, now: () => T0 + 1 });
  const loaded = saveManager.load();
  const s2Store = createS2Store({ storage, now: () => T0 + 2 });
  const game = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now: () => T0 + 3 });
  const snapshot = () => ['', ':backup', ':shadow'].map((k) => storage.getItem(SAVE_KEY + k));
  return { game, snapshot, storage };
}
/** A dialogue as the box plays it: conditions, effects, and the chosen option. */
function say(game, nodes, choice, heard) {
  for (const n of [].concat(nodes || [])) {
    if ('if' in n && !n.t && !n.choice) {
      say(game, check(n.if, game) ? n.then : n.else, choice, heard);
      continue;
    }
    if (n.t) heard.push(n.t);
    if (n.do) applyEffects(n.do, game);
    if (n.choice) {
      const o = n.choice[choice];
      applyEffects(o.do || [], game);
      say(game, o.then, choice, heard);
    }
  }
}
/**
 * A run list as the engine runs it. A puzzle is solved by its own rules (its reward applied); a chase leg is run
 * by the real chase rules with a good runner on the high route (what she finds is kept, as the minigame does).
 */
function run(game, actions, ctx) {
  for (const a of [].concat(actions || [])) {
    if (typeof a === 'function') continue;
    if (a.say) {
      ctx.said.push(a.say);
      say(game, DIALOGUE[a.say], ctx.choice, ctx.heard);
    } else if (a.fx) applyEffects(a.fx, game);
    else if (a.all) run(game, a.all, ctx);
    else if (a.puzzle) {
      const p = PUZZLES[a.puzzle];
      const c = resolveConfig(p.config, game);
      expect(replay(p.type, c, solve(p.type, c)).outcome).toBe('solved');
      applyEffects(p.reward, game);
      game.recordResult(`puzzle:${a.puzzle}`, { completed: true });
      ctx.puzzles.push(a.puzzle);
      run(game, a.then, ctx);
    } else if (a.game) {
      const c = LEGS[a.options.leg];
      const { run: r } = play(c, { high: ctx.high });
      expect(r.done).toBe(true);
      for (const id of r.found) game.setFlag(`s2:13-find-${id}`);
      game.recordResult(`game:${a.game}`, { completed: true });
      ctx.legs.push(a.options.leg);
      run(game, a.then, ctx);
    } else if (a.goto) ctx.scene = a.goto;
    else if ('if' in a && 'then' in a) run(game, check(a.if, game) ? a.then : a.else, ctx);
    syncMissions(game, { season2: true });
  }
}
/** Tap a thing in a place: the first case whose condition holds (null when it is not there). */
function tap(game, sceneId, id, ctx) {
  const it = SCENES[sceneId].interact.find((i) => i.id === id && check(i.if, game));
  if (!it) return null;
  const c = it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, game)) : it;
  if (!c) return null;
  run(game, c.run, ctx);
  return c.run;
}
/** Arrive somewhere: its triggers that apply now. */
function enter(game, sceneId, ctx) {
  for (const tr of SCENES[sceneId].triggers || []) if (check(tr.if, game)) run(game, tr.run, ctx);
}
const M1_DONE = ['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11'];
const toMission02 = (g) => {
  for (const id of [...M1_DONE, 's2-12']) g.setFlag(`mission:${id}`);
  g.setFlag('s2:dec:office-cover', 'truth');
  syncMissions(g, { season2: true });
};
const OWN = CASE_S2_M2.find((c) => c.mission === 's2-13').ids;

describe('Mission 02, played through from its own data', () => {
  for (const [choice, value] of [[0, 'return'], [1, 'keep']]) {
    it(`a whole playthrough (${value}): the snatch, three legs, two readings, the stash, Ryan; the original save byte-identical`, () => {
      const t = setup();
      toMission02(t.game);
      expect(missionState(M, t.game).status).toBe('active');
      expect(missionState(M03, t.game).status).toBe('locked'); // Mission 03 waits for this one
      const before = t.snapshot();
      const ctx = { choice, high: choice === 0, said: [], heard: [], puzzles: [], legs: [], scene: 's2-archive' };
      // the archive: Sabri explains (he remembers the office); Snooki snatches the notebook, gives it to Sabri…
      enter(t.game, 's2-archive', ctx);
      expect(ctx.heard.some((l) => l.includes('ما گلت لأحد أي شي'))).toBe(true); // office-cover=truth, read
      expect(tap(t.game, 's2-archive', 'trail', ctx)).toBeNull(); // nothing to follow yet
      tap(t.game, 's2-archive', 'register', ctx);
      expect(t.game.flag('s2:13-gave')).toBe(true);
      expect(t.game.flag('s2:13-nb-sabri')).toBe(true);
      // …and takes it back from Sabri's hand, and runs
      tap(t.game, 's2-archive', 'sabri', ctx);
      expect(t.game.flag('s2:13-stolen')).toBe(true);
      // the chase: the archive path; then the first fork — the reading opens only when every path is read
      tap(t.game, 's2-archive', 'trail', ctx);
      expect(ctx.legs).toEqual([0]);
      expect(ctx.scene).toBe('s2-trail');
      enter(t.game, 's2-trail', ctx);
      tap(t.game, 's2-trail', 'signpost', ctx);
      expect(ctx.puzzles).toEqual([]);
      for (const p of FORKS[0]) tap(t.game, 's2-trail', `path-${p.id}`, ctx);
      tap(t.game, 's2-trail', 'signpost', ctx); // the reading, then the second leg straight away
      expect(ctx.puzzles).toEqual(['s2-trail-1']);
      expect(ctx.legs).toEqual([0, 1]);
      expect(ctx.scene).toBe('s2-shed');
      // the second fork: blocked by the gate until the roof; her husky barks at the wrong path
      enter(t.game, 's2-shed', ctx);
      expect(tap(t.game, 's2-shed', 'stash', ctx)).toBeNull();
      for (const p of FORKS[1]) tap(t.game, 's2-shed', `path-${p.id}`, ctx);
      tap(t.game, 's2-shed', 'signpost', ctx);
      expect(ctx.puzzles).toEqual(['s2-trail-1', 's2-trail-2']);
      expect(ctx.legs).toEqual([0, 1, 2]);
      // behind the shed: her notebook on the husky's stash; the page and the wrapper; her choice; Ryan
      enter(t.game, 's2-shed', ctx);
      tap(t.game, 's2-shed', 'stash', ctx);
      expect(t.game.flag('s2:13-notebook')).toBe(true);
      expect(OWN.every((e) => t.game.has(`s2.ev.${e}`))).toBe(true);
      expect(t.game.flag('s2:dec:stash')).toBe(value);
      expect(missionState(M, t.game).status).toBe('complete');
      expect(t.game.flag('mission:s2-13')).toBe(true);
      // and Mission 03 «قصص جوجو الثلاث» opens, at its first step
      expect(M.leadsTo).toEqual(['s2-14']);
      expect(missionState(M03, t.game)).toMatchObject({ status: 'active', step: 0 });
      expect(t.game.inJournal('s2-snooki')).toBe(true);
      // Ryan reads her choice at once — and what she found up on the high routes
      const ryan = lines('s2.13-ryan');
      expect(ctx.heard.some((l) => (value === 'keep' ? l.includes('ورقة حلويات؟') : l.includes('هاي ورقة حلوياتي؟')))).toBe(true);
      expect(ctx.heard.includes(ryan.find((l) => l.includes('كرته القديمة')))).toBe(value === 'return');
      expect(ctx.heard.includes(ryan.find((l) => l.includes('نظارة صبري')))).toBe(value === 'return');
      // the place after: her husky and the stash still show what she chose
      const later = [];
      tap(t.game, 's2-shed', 'stash', { ...ctx, heard: later });
      expect(later.join(' ')).toMatch(value === 'return' ? /حارستها مثل كنز/ : /الكومة بلا صفحة/);
      // Sabri has gone home; the archive is M1's again
      expect(tap(t.game, 's2-archive', 'sabri', ctx)).toBeNull();
      expect(t.snapshot()).toEqual(before);
    });
  }

  it('every id Mission 02 writes routes to Season 2’s own document', () => {
    const flags = ['met', 'gave', 'stolen', 'leg1', 'fork1', 'leg2', 'fork2', 'leg3', 'at-stash', 'done', 'nb-table', 'nb-dog', 'nb-sabri', 'notebook', 'in-trail', 'in-shed', 'cp-0', 'cp-1', 'cp-2', 'find-ball', 'find-bell', 'find-glasses', ...FORKS[0].map((p) => `m1-${p.id}`), ...FORKS[1].map((p) => `m2-${p.id}`)].map((k) => `s2:13-${k}`);
    const ids = [...flags, 's2:dec:stash', 'mission:s2-13', 'puzzle:s2-trail-1', 'pstage:s2-trail-2', 'game:s2-chase', 'visited:s2-trail', 'visited:s2-shed', 't.s2-shed.behind', 'it.s2-shed.stash', 'it.s2-archive.trail', 'dlg:s2.13-ryan', 's2-snooki', ...OWN.map((e) => `s2.ev.${e}`)];
    for (const id of ids) expect(isS2(id), id).toBe(true);
    for (const e of OWN) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
    for (const e of OWN) expect(EVIDENCE_S2[e], `${e} is not in M1's registry`).toBeUndefined();
    expect(JOURNAL_S2_M2['s2-snooki']).toBeTruthy();
    for (const k of Object.keys(M02.dialogue)) expect(k.startsWith('s2.13-'), k).toBe(true);
    for (const s of M02.scenes) expect(s.id.startsWith('s2-'), s.id).toBe(true);
  });

  it('agrees with the approved graph: s2-13 after s2-12, needs nothing, yields the page and the wrapper', () => {
    const g = GRAPH.find((m) => m.id === 's2-13');
    expect(g.requires).toEqual(['s2-12']);
    expect(g.needs).toEqual([]);
    expect([...g.yields].sort()).toEqual([...OWN].sort());
    expect(M.unlock).toBe('flag:mission:s2-12');
  });
});

describe('M1’s archive', () => {
  const visible = (scene, g) => scene.interact.filter((i) => check(i.if, g)).map((i) => i.id).sort();
  const pick = (scene, id, g) => {
    const it = scene.interact.find((i) => i.id === id);
    return it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, g))?.run : it.run;
  };
  const same = (g) => {
    expect(visible(ARCHIVE, g)).toEqual(visible(ARCHIVE_M1, g));
    for (const id of visible(ARCHIVE_M1, g)) expect(pick(ARCHIVE, id, g), id).toEqual(pick(ARCHIVE_M1, id, g));
    expect(ARCHIVE.actors.filter((a) => check(a.if, g))).toEqual([]);
    expect(ARCHIVE.dynamic.filter((d) => d.if !== undefined && check(d.if, g))).toEqual([]);
    expect(ARCHIVE.triggers.filter((tr) => check(tr.if, g)).map((tr) => tr.id)).toEqual(ARCHIVE_M1.triggers.filter((tr) => check(tr.if, g)).map((tr) => tr.id));
    expect(ARCHIVE.exits.filter((e) => check(e.if, g))).toEqual(ARCHIVE_M1.exits.filter((e) => check(e.if, g)));
  };

  it('is exactly as shipped until Mission 02 opens', () => {
    const g = createGame({ saveManager: null });
    g.setFlag('game-complete');
    same(g);
    for (const id of M1_DONE) g.setFlag(`mission:${id}`);
    same(g);
  });

  it('and is M1’s again once Mission 02 is done (Sabri has gone, nothing of the chase is left)', () => {
    const g = createGame({ saveManager: null });
    g.setFlag('game-complete');
    for (const id of [...M1_DONE, 's2-12', 's2-13']) g.setFlag(`mission:${id}`);
    for (const k of ['met', 'gave', 'stolen']) g.setFlag(`s2:13-${k}`);
    expect(visible(ARCHIVE, g)).toEqual(visible(ARCHIVE_M1, g));
    expect(ARCHIVE.actors.filter((a) => check(a.if, g))).toEqual([]);
    // (the far door to the fork stays open: the places of the chase can be visited again)
    expect(ARCHIVE.exits.filter((e) => check(e.if, g)).map((e) => e.to)).toEqual(['garden']);
    g.setFlag('s2:13-leg1');
    expect(ARCHIVE.exits.filter((e) => check(e.if, g)).map((e) => e.to)).toEqual(['garden', 's2-trail']);
  });
});

describe('decisions and the dogs', () => {
  it('stash: both values are read later (Ryan’s line at once; the stash and her husky when she comes back)', () => {
    expect(DECISIONS_S2_M2.stash).toEqual(['return', 'keep']);
    const conds = JSON.stringify([DIALOGUE['s2.13-ryan'], DIALOGUE['s2.13-stash-again'], SCENES['s2-shed'].interact]);
    for (const v of ['return', 'keep']) expect(conds).toContain(`dec:stash=${v}`);
    // the stash drawing shows the page only when she gave it back
    expect(SCENES['s2-shed'].interact.find((i) => i.id === 'stash').cases.at(-1).run[0].if).toBe('dec:stash=return');
  });

  it('M1’s office-cover is read in Sabri’s first line; the chase’s finds are read at the end', () => {
    const open = DIALOGUE['s2.13-archive-enter'];
    expect(open.some((n) => n.if === 'dec:office-cover=cover')).toBe(true);
    expect(open.some((n) => n.if === 'dec:office-cover=truth')).toBe(true);
    const all = JSON.stringify([DIALOGUE['s2.13-ryan'], DIALOGUE['s2.13-stash-find']]);
    for (const f of LEGS.flatMap((l) => l.finds.map((x) => x.id))) expect(all).toContain(`flag:s2:13-find-${f}`);
  });

  it('Snooki is never her companion: in Mission 02’s places he is placed (or away), and he leaves with Ryan', () => {
    const g = createGame({ saveManager: null });
    for (const k of ['game-complete', 't.final.meet', 'sp1-husky-met']) g.setFlag(k);
    for (const id of [...M1_DONE, 's2-12']) g.setFlag(`mission:${id}`);
    for (const id of ['s2-archive', 's2-trail', 's2-shed']) {
      for (const k of ['', 'stolen', 'leg1', 'fork1', 'leg2', 'fork2', 'leg3']) {
        if (k) g.setFlag(`s2:13-${k}`);
        const d = dogsIn(SCENES[id], g);
        expect(d.snooki, id).toBe('away'); // no Ryan here: never with her
        expect(d.leader).toBeUndefined();
        for (const a of SCENES[id].actors || []) if (a.kind === 'snooki') expect(a.companion, id).toBeFalsy();
      }
    }
    // at the end he goes to Ryan, and they leave together
    const end = JSON.stringify(SCENES['s2-shed'].interact.find((i) => i.id === 'stash').cases[0].run);
    expect(end).toContain('{"move":"snooki","to":"ryan"');
    expect(end).toContain('{"show":"snooki","visible":false}');
  });
});

it('the module is self-contained: its scenes, puzzles, dialogue, evidence and journal are all registered', () => {
  for (const s of M02.scenes) expect(SCENES[s.id], s.id).toBeTruthy();
  for (const id of Object.keys(M02.puzzles)) expect(PUZZLES[id], id).toBeTruthy();
  for (const k of Object.keys(M02.dialogue)) expect(DIALOGUE[k], k).toBeTruthy();
  for (const e of Object.keys(M02.evidence)) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
  expect(MISSIONS.find((m) => m.id === 's2-13')).toBeTruthy();
});
