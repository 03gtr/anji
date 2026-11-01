/**
 * Season 2, M2 — Mission 04 «ظل الأخت» (s2-15; src/game/data/m2/m04-sister.js, minigames/s2-stealth*.js).
 *
 * - the stealth's rules: her rhythm is fixed (learnable), every look back comes after a tell, the glance cone, the
 *   covers, being heard when too close, losing her when too far, the restart from the last cover (no other cost);
 *   a careful player wins both rhythms without being seen, a reckless one is caught; the wary rhythm (M1: she was
 *   pushed) is harder from the start;
 * - the chain of words: a strict puzzle; a wrong order says nothing about which link is wrong; guessing is hopeless;
 * - no answer in anything she reads before the chain is solved;
 * - played through from its own data for both values of sister-refusal (M1) and of sister-wish (made here):
 *   ids in Season 2's save, the original save byte-identical;
 * - M1's home garden is exactly as shipped until this mission opens;
 * - every decision is read again; the sister is never named by a nickname or an animal (hashed check).
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { RULES, solve, replay } from '../../src/game/puzzles/rules.js';
import { canSkip } from '../../src/game/puzzles/host.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { S2_SCENES } from '../../src/game/data/scenes/s2.js';
import { EVIDENCE_S2 } from '../../src/game/data/evidence-s2.js';
import { EVIDENCE_S2_M2, DECISIONS_S2_M2, CASE_S2_M2, JOURNAL_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import { MINIGAMES } from '../../src/game/minigames/registry.js';
import { MISSIONS as GRAPH } from '../../docs/season-2/graph.mjs';
import M04 from '../../src/game/data/m2/m04-sister.js';
import { STEALTH, COVERS, RHYTHMS, createStealth, stepStealth, stepOf, phaseOf, coverAt, untilLook } from '../../src/game/minigames/s2-stealth-logic.js';
import { careful, reckless, play } from './s2-stealth-bot.js';
import { memoryStorage } from '../helpers.js';

const CHAIN = PUZZLES['s2-chain'];
const M = MISSIONS.find((m) => m.id === 's2-15');
const HOME = SCENES['s2-home']; // M1's place, as extended by the modules
const HOME_M1 = S2_SCENES.find((s) => s.id === 's2-home'); // as first shipped
const T0 = 1_800_000_000_000;
const ROOT = process.cwd() + '/'; // (the repository: vitest runs from it)
const DT = 1 / 30;

/** Steps the rules until a condition holds (or `max` seconds), with a fixed input. */
function until(s, cond, input = {}, max = 60) {
  for (let i = 0; i < max / DT; i++) {
    if (cond(s)) return true;
    stepStealth(s, DT, input);
  }
  return cond(s);
}
/** The first look of her script, reached with Anji standing still where she is. */
const toFirstLook = (s, input = {}) => until(s, (x) => phaseOf(x) === 'look' || Boolean(x.react), input);

describe('the stealth: her rhythm', () => {
  it('is fixed: the same inputs give the same run, every time (never random)', () => {
    const a = play(createStealth('gentle'), careful);
    const b = play(createStealth('gentle'), careful);
    expect(a.s.time).toBe(b.s.time);
    expect(a.s.x).toBe(b.s.x);
    expect(a.events).toEqual(b.events);
  });

  it('every look back (and every glance out of the shed) comes right after a tell of at least 0.6 s', () => {
    for (const [name, r] of Object.entries(RHYTHMS)) {
      expect(r.tell, name).toBeGreaterThanOrEqual(0.6);
      for (const list of [r.script, r.inside]) {
        list.forEach(([kind], i) => {
          if (kind === 'look' || kind === 'peek') expect(list[(i - 1 + list.length) % list.length][0], `${name} #${i}`).toBe('tell');
        });
      }
      // she takes her notes out of the flowerpot on the way, and ends in the shed
      expect(r.script.some(([k]) => k === 'relocate'), name).toBe(true);
      expect(r.script.at(-1)[0], name).toBe('enter');
    }
  });

  it('the wary rhythm (she was pushed in M1) is harder from the start: more looks, sooner, a shorter tell', () => {
    const looks = (r) => RHYTHMS[r].script.filter(([k]) => k === 'look').length;
    expect(looks('wary')).toBeGreaterThan(looks('gentle'));
    expect(RHYTHMS.wary.tell).toBeLessThan(RHYTHMS.gentle.tell);
    expect(untilLook(createStealth('wary'))).toBeLessThan(untilLook(createStealth('gentle')));
  });
});

describe('the stealth: cone, cover, distance, restart', () => {
  it('a look catches her in the open within reach; hidden in a cover she is safe', () => {
    // in the open, close enough
    let s = createStealth('gentle');
    s.hidden = false;
    s.x = 150; // not a cover
    expect(coverAt(150)).toBeNull();
    toFirstLook(s);
    expect(s.react?.kind).toBe('seen');
    // the same place, crouched: still the open — crouching is not hiding
    s = createStealth('gentle');
    s.x = 150;
    s.hidden = true;
    toFirstLook(s);
    expect(s.react?.kind).toBe('seen');
    // in a cover, crouched: the whole look passes
    s = createStealth('gentle');
    until(s, (x) => stepOf(x).kind === 'tell'); // she is well ahead, about to look
    s.x = 320;
    s.hidden = true;
    expect(coverAt(320).id).toBe('pots');
    toFirstLook(s);
    expect(s.react).toBeNull();
    expect(until(s, (x) => phaseOf(x) !== 'look')).toBe(true);
    expect(s.react).toBeNull();
    expect(s.caught).toBe(0);
  });

  it('her look reaches `range` behind her and no farther', () => {
    const at = (gap) => {
      const s = createStealth('gentle');
      until(s, (x) => stepOf(x).kind === 'tell');
      s.x = s.sister.x - gap; // out in the open (between covers), still
      s.hidden = false;
      toFirstLook(s);
      stepStealth(s, DT);
      return s.react?.kind ?? null;
    };
    expect(at(STEALTH.range - 30)).toBe('seen');
    expect(at(STEALTH.range + 30)).toBeNull();
  });

  it('moving gives a hiding place up; she cannot move and stay hidden', () => {
    const s = createStealth('gentle');
    expect(s.hidden).toBe(true);
    stepStealth(s, DT, { dir: 1 });
    expect(s.hidden).toBe(false);
    stepStealth(s, DT, { hide: true });
    expect(s.hidden).toBe(true);
    stepStealth(s, DT, { dir: 1, hide: false });
    expect(s.hidden).toBe(false);
  });

  it('too close, her sister hears her; too far behind while she walks, Anji loses her', () => {
    expect(play(createStealth('gentle'), reckless, { stopAt: 1 }).events).toEqual(['heard']);
    expect(play(createStealth('gentle'), () => ({ dir: 0, hide: false }), { stopAt: 1, max: 60 }).events).toEqual(['lost']);
  });

  it('being caught costs nothing but the way back to the last cover; her sister is rewound to that moment', () => {
    const s = createStealth('gentle');
    // a careful start: through her first look, hidden in the pots
    play(s, (x) => (x.x < 302 && phaseOf(x) === 'walk' && x.sister.step === 0 ? { dir: 1 } : { dir: 0, hide: !x.hidden && Boolean(coverAt(x.x)) }), { max: 7 });
    expect(s.react).toBeNull();
    expect(s.checkpoint.x).toBeGreaterThanOrEqual(300);
    const cp = JSON.parse(JSON.stringify(s.checkpoint));
    // then straight on, into her next look
    const r = play(s, reckless, { stopAt: 1 });
    expect(r.events).toHaveLength(1);
    expect(s.react).toBeTruthy();
    until(s, (x) => !x.react);
    expect(s.x).toBe(cp.x);
    expect(s.hidden).toBe(true);
    expect(s.sister).toEqual(cp.sister);
    expect(s.done).toBe(false);
  });

  it('inside the shed: a glance out of the window catches her in its reach; under the sill, hidden, she is safe and watches', () => {
    const s = createStealth('gentle');
    s.sister = { x: STEALTH.length, step: 0, t: 0, inside: true, facing: 1 };
    s.x = STEALTH.peekFrom + 40; // in the open, in reach of the window
    s.hidden = false;
    until(s, (x) => phaseOf(x) === 'peek' || Boolean(x.react));
    stepStealth(s, DT);
    expect(s.react?.kind).toBe('seen');
    const w = createStealth('gentle');
    w.sister = { x: STEALTH.length, step: 0, t: 0, inside: true, facing: 1 };
    w.x = 1450;
    w.hidden = true;
    expect(coverAt(1450).id).toBe('window');
    until(w, (x) => x.done || Boolean(x.react));
    expect(w.react).toBeNull();
    expect(w.done).toBe(true);
  });

  it('a careful player who reads her tells wins both rhythms without being seen once; nothing is random', () => {
    for (const r of Object.keys(RHYTHMS)) {
      const { s, events } = play(createStealth(r), careful);
      expect(s.done, r).toBe(true);
      expect(events, r).toEqual([]);
      expect(s.time, `${r} takes a while, not forever`).toBeGreaterThan(20);
      expect(s.time, r).toBeLessThan(90);
    }
  });

  it('every cover is a real stretch of the path, and every look has one in reach behind her', () => {
    for (const c of COVERS) expect(c.x2 - c.x1, c.id).toBeGreaterThanOrEqual(40);
    for (const [name, r] of Object.entries(RHYTHMS)) {
      let x = STEALTH.sisterStart;
      for (const [kind, v] of r.script) {
        if (kind === 'walk') x = v;
        if (kind === 'look') expect(COVERS.some((c) => c.x1 <= x - STEALTH.near - 8 && c.x2 >= x - STEALTH.range), `${name} look at ${x}`).toBe(true);
      }
    }
  });
});

describe('the chain of words (a strict puzzle)', () => {
  it('only the true order solves it; a wrong order says nothing about which link is wrong', () => {
    const c = CHAIN.config;
    expect(replay('arrange', c, solve('arrange', c)).outcome).toBe('solved');
    let s = RULES.arrange.init(c);
    for (const [slot, piece] of [['p1', 'quiet'], ['p2', 'clinic'], ['p3', 'whisper'], ['p4', 'heard'], ['p5', 'note']]) {
      s = RULES.arrange.pick(c, s, piece).state;
      s = RULES.arrange.place(c, s, slot).state;
    }
    const wrong = RULES.arrange.check(c, s);
    expect(wrong.outcome).toBe('wrong');
    // (the rule's own message counts; a strict panel never shows it — tests/game/s2-no-help.test.js)
    expect(CHAIN.strict).toBe(true);
    expect(CHAIN.hints).toBeUndefined();
    expect(CHAIN.solutionText).toBeUndefined();
    expect(canSkip(CHAIN, { mistakes: 99, hintsUsed: 99 })).toBe(false);
  });

  it('guessing is hopeless: seven slips for five pegs (2520 orders), two of them no link at all', () => {
    const c = CHAIN.config;
    expect(c.pieces).toHaveLength(7);
    expect(c.slots).toHaveLength(5);
    const used = new Set(c.slots.flatMap((s) => s.accepts));
    expect(c.pieces.filter((p) => !used.has(p.id)).map((p) => p.id).sort()).toEqual(['printer', 'whisper']);
    expect(1 / (7 * 6 * 5 * 4 * 3)).toBeLessThan(0.05);
  });

  it('every slip is something she has by then: the office versions (Mission 01), the note (M1), and what she finds in the shed', () => {
    const labels = Object.fromEntries(CHAIN.config.pieces.map((p) => [p.id, p.label]));
    expect(EVIDENCE_S2_M2['e-versions'].note).toContain('لا تگول لأحد');
    expect(labels.quiet).toContain('لا تگول لأحد');
    expect(labels.clinic).toContain('ريان راح للعيادة بالسر');
    expect(EVIDENCE_S2_M2['f-print'].note).toContain('وگلتلها: ريان يخبي شي');
    expect(labels.note).toContain(EVIDENCE_S2['e-note'].note.match(/«(.+?)»/)[1]);
    const shed = ['s2.15-can', 's2.15-pots'].flatMap((k) => DIALOGUE[k].map((n) => n.t));
    expect(shed.join(' ')).toContain('لمى گالتلي');
    expect(shed.join(' ')).toContain('ريان دا يخبي شي عن أنجي');
  });
});

/* ── what she reads before the chain is solved ── */
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
  it('REGRESSION: nothing she reads before the chain names its order or who wrote the note (mission, puzzle, every line before it)', () => {
    const before = [
      CHAIN.title,
      CHAIN.goal,
      CHAIN.intro,
      M.summary,
      ...M.steps.map((s) => s.text),
      ...MINIGAMES['s2-stealth'].controls,
      MINIGAMES['s2-stealth'].goal,
      ...[
        's2.15-lama-sorry', 's2.15-sister-seen', 's2.15-sister-open', 's2.15-lama-points', 's2.15-lama-again', 's2.15-path-early', 's2.15-follow', 's2.15-follow-later', 's2.15-followed',
        's2.15-shed-enter', 's2.15-tin', 's2.15-tin-again', 's2.15-can', 's2.15-can-again', 's2.15-pots', 's2.15-pots-again', 's2.15-line-empty',
        's2.15-shed-faced', 's2.15-chain-again', 's2.15-chain-later', 's2.15-shed-sister',
      ].flatMap(lines),
    ];
    const answer = ['لمى لأختي', 'ووصلتلچ إنتِ', 'وصلت لأختي', 'أختي كتبت', 'آني كتبتها', 'إنتِ كتبتي', 'آخر حلقة', 'أول حلقة', 'خيط أحمر', 'لمى گالتلچ'];
    for (const text of before) for (const word of answer) expect(text.includes(word), `«${word}» in «${text}»`).toBe(false);
    // and the admission is only ever said after the chain (in the dusk scene, which needs it)
    expect(lines('s2.15-dusk-admit').join(' ')).toContain('آني كتبتها');
    expect(SCENES['s2-dusk'].triggers.find((t) => t.id === 'meet').if).toContain('ev:d-chain');
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
  return { game, snapshot };
}
/** A dialogue as the box plays it: conditions, effects, the chosen option; returns the lines shown. */
function say(game, nodes, choice, shown = []) {
  for (const n of [].concat(nodes || [])) {
    if ('if' in n && !n.t && !n.choice) {
      say(game, check(n.if, game) ? n.then : n.else, choice, shown);
      continue;
    }
    if (n.t) shown.push(n.t);
    if (n.do) applyEffects(n.do, game);
    if (n.choice) {
      const o = n.choice[choice];
      shown.push(o.t);
      applyEffects(o.do || [], game);
      say(game, o.then, choice, shown);
    }
  }
  return shown;
}
/**
 * A run list as the engine runs it. The stealth is played by the careful player on the rhythm the data asks for;
 * a puzzle is closed unsolved the first time (`ctx.closeFirst`), then solved by its own rules.
 */
function run(game, actions, ctx) {
  for (const a of [].concat(actions || [])) {
    if (a.say) ctx.shown.push(...say(game, DIALOGUE[a.say], ctx.choice));
    else if (a.fx) applyEffects(a.fx, game);
    else if (a.all) run(game, a.all, ctx);
    else if (a.game) {
      const s = createStealth(a.options.rhythm);
      const { events } = play(s, careful);
      ctx.rhythms.push(a.options.rhythm);
      expect(s.done && events.length === 0).toBe(true);
      game.recordResult(`game:${a.game}`, { completed: true });
      run(game, a.then, ctx);
    } else if (a.puzzle) {
      const p = PUZZLES[a.puzzle];
      if (ctx.closeFirst-- > 0) run(game, a.else, ctx);
      else {
        expect(replay(p.type, p.config, solve(p.type, p.config)).outcome).toBe('solved');
        applyEffects(p.reward, game);
        game.recordResult(`puzzle:${a.puzzle}`, { completed: true });
        run(game, a.then, ctx);
      }
    } else if ('if' in a && 'then' in a) run(game, check(a.if, game) ? a.then : a.else, ctx);
    else if (a.goto) ctx.at = a.goto;
    syncMissions(game, { season2: true });
  }
}
const newCtx = (choice) => ({ choice, shown: [], rhythms: [], closeFirst: 1, at: null });
/** What tapping a thing does now (or null when it is not there). */
function tap(game, sceneId, id, ctx) {
  const it = SCENES[sceneId].interact.find((i) => i.id === id);
  if (!it || !check(it.if, game)) return null;
  const c = it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, game)) : it;
  run(game, c.run, ctx);
  return c.run;
}
/** A trigger, when she walks into it (null when it would not fire). */
function enter(game, sceneId, id, ctx) {
  const tr = SCENES[sceneId].triggers.find((x) => x.id === id);
  if (!check(tr.if, game)) return null;
  run(game, tr.run, ctx);
  return tr.run;
}
const visibleActor = (game, sceneId, id) => (SCENES[sceneId].actors || []).some((a) => a.id === id && check(a.if, game));
const M1_DONE = ['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11'];
const toMission04 = (g, refusal, cover) => {
  for (const id of [...M1_DONE, 's2-12', 's2-13', 's2-14']) g.setFlag(`mission:${id}`);
  for (const e of ['e-note', 'e-whisper', 't-lama', 'e-imprint', 't-sister', 'h-sister', 'd-elim', 'e-versions', 'f-print', 'f-sticky']) g.collect(`s2.ev.${e}`);
  g.setFlag('s2:dec:sister-refusal', refusal);
  g.setFlag('s2:dec:office-cover', cover);
  syncMissions(g, { season2: true });
};

describe('Mission 04, played through from its own data', () => {
  for (const [refusal, wish, cover] of [['respect', 'read', 'truth'], ['push', 'leave', 'cover'], ['respect', 'leave', 'cover'], ['push', 'read', 'truth']]) {
    const choice = wish === 'read' ? 0 : 1;
    it(`refusal ${refusal}, wish ${wish}: follow her, the shed, the chain, the lantern; the original save byte-identical`, () => {
      const t = setup();
      toMission04(t.game, refusal, cover);
      expect(missionState(M, t.game).status).toBe('active');
      const before = t.snapshot();
      const ctx = newCtx(choice);

      // the home garden: Lama's apology (reads office-cover), her sister's opening (reads sister-refusal); she leaves
      expect(visibleActor(t.game, 's2-home', 'sister')).toBe(true);
      expect(tap(t.game, 's2-home', 's2-15-path', ctx)).toEqual([{ say: 's2.15-path-early' }]);
      enter(t.game, 's2-home', '15-open', ctx);
      expect(t.game.flag('s2:15-start') && t.game.flag('s2:15-away')).toBeTruthy();
      expect(ctx.shown.join(' ')).toContain(cover === 'truth' ? 'إنتِ وريان' : 'قصة الطابعة');
      expect(ctx.shown.join(' ')).toContain(refusal === 'respect' ? 'يمكن بعدين' : 'الجواب نفسه');
      expect(visibleActor(t.game, 's2-home', 'sister')).toBe(false); // gone with her things
      expect(tap(t.game, 's2-home', 'sister', ctx)).toBeNull();
      expect(enter(t.game, 's2-home', '15-open', ctx)).toBeNull(); // once

      // she follows her: the rhythm is the one M1's answer asks for
      tap(t.game, 's2-home', 's2-15-path', ctx);
      expect(ctx.rhythms).toEqual([refusal === 'push' ? 'wary' : 'gentle']);
      expect(t.game.flag('s2:15-tracked')).toBe(true);
      expect(ctx.at).toBe('s2-shed-in');
      expect(t.game.record('game:s2-stealth')?.completed).toBe(true);

      // the shed: the line is empty until she has found what her sister hid
      tap(t.game, 's2-shed-in', 'line', ctx);
      expect(t.game.flag('s2:15-faced')).toBeFalsy();
      for (const id of ['can', 'tin', 'pots']) tap(t.game, 's2-shed-in', id, ctx);
      expect(['heard', 'draft', 'whisper'].every((k) => t.game.flag(`s2:15-slip-${k}`))).toBe(true);
      expect(missionState(M, t.game).step).toBe(3);

      // her sister comes back in; the line; she closes it once (her challenge), then pegs the chain
      ctx.shown.length = 0;
      tap(t.game, 's2-shed-in', 'line', ctx);
      expect(t.game.flag('s2:15-faced')).toBe(true);
      expect(t.game.has('s2.ev.d-chain')).toBe(false);
      expect(ctx.shown.join(' ')).toContain('الأوراق ما تهرب');
      expect(visibleActor(t.game, 's2-shed-in', 'sister')).toBe(true);
      tap(t.game, 's2-shed-in', 'line', ctx);
      expect(t.game.has('s2.ev.d-chain')).toBe(true);
      expect(ctx.at).toBe('s2-dusk');
      expect(visibleActor(t.game, 's2-shed-in', 'sister')).toBe(false);

      // dusk, under the lantern: she owns the note; the card; the choice
      ctx.shown.length = 0;
      enter(t.game, 's2-dusk', 'meet', ctx);
      expect(ctx.shown.join(' ')).toContain('آني كتبتها');
      expect(t.game.flag('s2:dec:sister-wish')).toBe(wish);
      expect(ctx.shown.join(' ').includes('خلّيه عليّ')).toBe(wish === 'read'); // the wish is shown only if she reads it
      expect(missionState(M, t.game).status).toBe('complete');
      expect(t.game.flag('mission:s2-15')).toBe(true);
      expect(t.game.inJournal('s2-sister-shadow')).toBe(true);
      expect(enter(t.game, 's2-dusk', 'meet', ctx)).toBeNull();

      // when she comes back to her (at dusk, or home again by day), her line reads what Anji chose
      for (const [scene, id] of [['s2-dusk', 'sister'], ['s2-home', 'sister']]) {
        ctx.shown.length = 0;
        expect(tap(t.game, scene, id, ctx)).toEqual([{ say: 's2.15-sister-again' }]);
        expect(ctx.shown.join(' ')).toContain(wish === 'read' ? 'كل كلمة بيها' : 'بجيبي بعدها');
      }
      expect(visibleActor(t.game, 's2-home', 'sister')).toBe(true);
      expect(visibleActor(t.game, 's2-home', 'lama')).toBe(false);
      expect(t.snapshot()).toEqual(before);
    });
  }

  it('every id Mission 04 writes routes to Season 2’s own document', () => {
    const ids = [
      's2:15-start', 's2:15-away', 's2:15-tracked', 's2:15-slip-heard', 's2:15-slip-draft', 's2:15-slip-whisper', 's2:15-faced', 's2:15-truth', 's2:in-shed',
      's2:dec:sister-wish', 'puzzle:s2-chain', 'game:s2-stealth', 'mission:s2-15', 'visited:s2-shed-in', 'visited:s2-dusk', 't.s2-home.15-open', 't.s2-dusk.meet',
      't.s2-shed-in.arrive', 'it.s2-shed-in.line', 'it.s2-home.s2-15-path', 'dlg:s2.15-dusk-card', 's2-sister-shadow', 's2.ev.d-chain',
    ];
    for (const id of ids) expect(isS2(id), id).toBe(true);
    for (const k of Object.keys(M04.dialogue)) expect(k.startsWith('s2.15-'), k).toBe(true);
    for (const s of M04.scenes) expect(s.id.startsWith('s2-'), s.id).toBe(true);
    expect(EVIDENCE_S2_M2['d-chain']).toBeTruthy();
    expect(EVIDENCE_S2['d-chain']).toBeUndefined();
    expect(JOURNAL_S2_M2['s2-sister-shadow']).toBeTruthy();
    expect(JOURNAL_S2_M2['s2-sister']).toBeUndefined(); // M1's page («أختي والمسابقة») keeps its own text
  });

  it('M1’s home garden is exactly as shipped until Mission 04 opens', () => {
    const g = createGame({ saveManager: null });
    for (const id of M1_DONE.slice(0, 4)) g.setFlag(`mission:${id}`);
    const visible = (scene) => scene.interact.filter((i) => check(i.if, g)).map((i) => i.id).sort();
    const pick = (scene, id) => {
      const it = scene.interact.find((i) => i.id === id);
      return it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, g)).run : it.run;
    };
    const same = () => {
      expect(visible(HOME)).toEqual(visible(HOME_M1));
      for (const id of visible(HOME_M1)) expect(pick(HOME, id), id).toEqual(pick(HOME_M1, id));
      expect(HOME.actors.filter((a) => check(a.if, g)).map((a) => a.id)).toEqual(HOME_M1.actors.filter((a) => check(a.if, g)).map((a) => a.id));
      expect(HOME.exits.filter((e) => check(e.if, g))).toEqual(HOME_M1.exits);
      expect(HOME.dynamic.filter((d) => check(d.if, g)).length).toBe(HOME_M1.dynamic.length);
      expect(HOME.triggers.filter((tr) => check(tr.if, g)).map((tr) => tr.id)).toEqual(HOME_M1.triggers.map((tr) => tr.id));
    };
    same();
    // after M1 (and Missions 01–02), still: Mission 04 waits for Mission 03
    for (const id of [...M1_DONE, 's2-12', 's2-13']) g.setFlag(`mission:${id}`);
    g.setFlag('s2:09-quiz');
    g.collect('s2.ev.e-imprint');
    same();
  });
});

describe('decisions are read again later', () => {
  /** Every condition anywhere in Season 2's places (as extended by the missions) and dialogue. */
  const reads = () => {
    const read = new Set();
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      for (const [k, v] of Object.entries(x)) {
        if (k === 'if') [].concat(v).forEach((c) => typeof c === 'string' && read.add(c));
        else walk(v);
      }
    };
    walk([Object.values(SCENES).filter((s) => isS2(s.id)).map((s) => [s.interact, s.actors, s.triggers]), DIALOGUE]);
    return read;
  };

  it('sister-wish (made here) is read for both values; sister-refusal (M1) and office-cover (Mission 01) are read in this mission', () => {
    expect(DECISIONS_S2_M2['sister-wish']).toEqual(['read', 'leave']);
    const read = reads();
    for (const v of ['read', 'leave']) expect(read.has(`dec:sister-wish=${v}`), v).toBe(true);
    // in this module's own data
    const mine = JSON.stringify([M04.dialogue, M04.scenes.map((s) => [s.interact, s.triggers]), M04.patches]);
    for (const c of ['dec:sister-refusal=respect', 'dec:sister-refusal=push', 'dec:office-cover=truth', 'dec:office-cover=cover', 'dec:sister-wish=read', 'dec:sister-wish=leave']) {
      expect(mine.includes(`"${c}"`), c).toBe(true);
    }
  });

  it('every value of every decision this mission makes is set by a choice in it', () => {
    const effects = JSON.stringify(M04.dialogue);
    for (const [key, values] of Object.entries(M04.decisions)) for (const v of values) expect(effects.includes(`dec:${key}=${v}`), `${key}=${v}`).toBe(true);
  });
});

describe('the module', () => {
  it('is self-contained: its scenes, puzzle, dialogue, evidence and minigame are all registered', () => {
    for (const s of M04.scenes) expect(SCENES[s.id], s.id).toBeTruthy();
    for (const id of Object.keys(M04.puzzles)) expect(PUZZLES[id], id).toBeTruthy();
    for (const k of Object.keys(M04.dialogue)) expect(DIALOGUE[k], k).toBeTruthy();
    for (const e of Object.keys(M04.evidence)) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
    expect(CASE_S2_M2.find((c) => c.mission === 's2-15').ids).toEqual(['d-chain']);
    expect(MINIGAMES['s2-stealth']).toBeTruthy();
  });

  it('agrees with the approved graph: s2-15 after s2-14, needing what M1 and Mission 01 give, yielding d-chain', () => {
    const g = GRAPH.find((m) => m.id === 's2-15');
    expect(g.requires).toEqual(['s2-14']);
    expect(M.unlock).toBe('flag:mission:s2-14');
    expect(g.yields).toEqual(Object.keys(M04.evidence));
  });

  it('the sister is staged, not told: her big beats move her (sway, rise, lean-in, turn) and the camera frames two', () => {
    const acts = JSON.stringify([M04.scenes, M04.patches, M04.dialogue]);
    expect(acts).toContain('"idleFx":"sway"');
    for (const beat of ['"jolt":"sister","type":"rise"', '"jolt":"sister","type":"lunge"', '"face":"sister","toward":"anji"', '"camera":{"between":["anji","sister"]}']) expect(acts, beat).toContain(beat);
  });

  it('no private nickname, no animal name for the sister, no wedding — in the module, the stealth and these tests (hashed)', () => {
    const sha = (s) => createHash('sha256').update(s).digest('hex');
    const files = ['src/game/data/m2/m04-sister.js', 'src/game/minigames/s2-stealth.js', 'src/game/minigames/s2-stealth-logic.js', 'tests/game/s2-m04.test.js', 'tests/game/s2-stealth-bot.js', 'tests/browser/s2-m04.browser.test.js'];
    const text = files.map((f) => fs.readFileSync(ROOT + f, 'utf8')).join('\n').toLowerCase();
    const banned = [
      { n: 5, h: 'da8575ae360c77ac19d033499678439453e2a06fa2f12e98218cdd0e73908a5f' },
      { n: 5, h: '538d7d9fe78e7baac47a9fbd6f2c68845ecca72dbdc2b47b4c5a0f5620ab8e93' },
      { n: 7, h: 'b6ef5d1ff0d73da95e3db1dc2d8183f97ee86f054eea14dab63f12c5fae5d5da' },
      { n: 5, h: '2573ae4737831c12194b4da708064c83f4e4beaca82a6a55db1c9c266bb117b6' },
      { n: 4, h: '126f9c06a7e69f08d76c32b1d4f5ff7f62147f79f09d6f95204b0ab5f4775286' },
      { n: 4, h: '9518ca35e73c45f79dea5e6637ca7da0411928bd68da8d21d55481276d08ddf6' },
      { n: 5, h: '3c3d3f9d52e95fcb56cba0f6b1faea331d2aa49a7151a2875220b7f42ea72e2f' },
      { n: 6, h: 'def2be71a3c5b311bbee2f8fd0cf7afb25b8cf4b995e5af098cc99827607760e' },
    ];
    const hits = banned.filter(({ n, h }) => {
      for (let i = 0; i + n <= text.length; i++) if (sha(text.slice(i, i + n)) === h) return true;
      return false;
    });
    expect(hits).toEqual([]);
    // (the words themselves are in this file's own pattern below, so this file is left out of that one check)
    const content = files.filter((f) => !f.endsWith('s2-m04.test.js')).map((f) => fs.readFileSync(ROOT + f, 'utf8')).join(' ');
    expect(content).not.toMatch(/زفاف|عرس|خطوبة|خطبة|زواج|نتزوج|تتزوج|wedding|marriage/i);
  });
});
