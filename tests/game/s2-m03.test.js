/**
 * Season 2, M2 — Mission 03 «قصص جوجو الثلاث» (s2-14; src/game/data/m2/m03-jojo.js). This replaces the
 * overhaul's Stage B tests: the testimony prototype that lived in s2-08 now plays here, with a third version,
 * and M1's s2-08 is back to its shipped shape.
 *
 * - the testimony rule over three versions: only the true pair breaks one; a wrong pair says nothing;
 * - every statement is acted out; Jojo reacts physically when a version breaks; each version breaks on
 *   evidence she can actually find by then (M1's, or found in this mission: the can, the logbook);
 * - random guessing rarely works (under 5% per try, holding everything she can hold by then);
 * - no help, and no answer in anything she reads before the break;
 * - the loft: dark without a light; the hand lamp carried up and hung shows the logbook and the eighth lantern;
 * - decisions: jojo-why (M1) is read in his opening line; jojo-confront is made here and read after;
 * - M1's lamphouse behaves exactly as shipped until Mission 03 opens (every addition is gated);
 * - played through from its own data: ids in Season 2's save, the original save byte-identical;
 * - (M1) the garden clock is turned by hand, and every M1 decision outside the Stage C list is read.
 */
import { describe, it, expect } from 'vitest';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { RULES, solve, replay } from '../../src/game/puzzles/rules.js';
import { canSkip } from '../../src/game/puzzles/host.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { PUZZLES_S2 } from '../../src/game/data/puzzles-s2.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { S2_SCENES } from '../../src/game/data/scenes/s2.js';
import { EVIDENCE_S2, DECISIONS_S2, CASE_S2 } from '../../src/game/data/evidence-s2.js';
import { EVIDENCE_S2_M2, DECISIONS_S2_M2, CASE_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import M03 from '../../src/game/data/m2/m03-jojo.js';
import { memoryStorage } from '../helpers.js';

const JV = PUZZLES['s2-jojo-versions'];
const M = MISSIONS.find((m) => m.id === 's2-14');
const LAMP = SCENES['s2-lamphouse']; // M1's place, as extended by the module
const LAMP_M1 = S2_SCENES.find((s) => s.id === 's2-lamphouse'); // as first shipped
const T0 = 1_800_000_000_000;
const OWN = new Set(CASE_S2_M2.find((c) => c.mission === 's2-14').ids);

describe('the testimony rule (three versions)', () => {
  it('only the true pair breaks a version; the last one solves; statements of another version are ignored', () => {
    const c = JV.config;
    const s = RULES.testimony.init(c);
    expect(RULES.testimony.present(c, s, 'c2', 'e-drift').outcome).toBe('noop'); // a later version's statement
    let r = RULES.testimony.present(c, s, 'b1', 'e-oilcan');
    expect(r.outcome).toBe('wrong');
    expect(r.message).toBeUndefined(); // nothing about how close it was
    expect(r.state.v).toBe(0);
    r = RULES.testimony.present(c, r.state, 'b2', 'e-oilcan');
    expect(r.outcome).toBe('progress');
    expect(RULES.testimony.present(c, r.state, 'b2', 'e-oilcan').outcome).toBe('noop'); // that version is over
    r = RULES.testimony.present(c, r.state, 'c2', 'e-drift');
    expect(r.outcome).toBe('progress');
    expect(RULES.testimony.present(c, r.state, 'd3', 'e-logbook').outcome).toBe('wrong'); // the right evidence, the wrong statement
    expect(RULES.testimony.present(c, r.state, 'd2', 'e-loft').outcome).toBe('wrong'); // the right statement, the wrong evidence
    expect(RULES.testimony.present(c, r.state, 'd2', 'e-logbook').outcome).toBe('solved');
    expect(replay('testimony', c, solve('testimony', c)).outcome).toBe('solved');
  });

  it('every statement is acted out; he reacts when a version breaks; each breaks on evidence she can find by then', () => {
    expect(JV.versions).toHaveLength(3);
    const m1 = new Set(CASE_S2.flatMap((c) => c.ids));
    for (const v of JV.versions) {
      expect(v.beats.map((b) => b.id)).toContain(v.breaks[0]);
      expect(m1.has(v.breaks[1]) || OWN.has(v.breaks[1]), `${v.id} breaks on ${v.breaks[1]}`).toBe(true);
      for (const b of v.beats) expect(b.stage?.length, `${v.id}/${b.id} is staged`).toBeGreaterThan(0);
      expect(v.broken.some((a) => a.jolt || a.puff), `${v.id}: he reacts when it breaks`).toBe(true);
    }
  });

  it('random guessing rarely works: under 5% per try, holding everything she can hold by version 3', () => {
    const held = [...CASE_S2.flatMap((c) => c.ids), ...CASE_S2_M2.filter((c) => c.mission <= 's2-14').flatMap((c) => c.ids)].filter((id) => id !== 't-jojo-true');
    for (const v of JV.versions) expect(1 / (v.beats.length * held.length), v.id).toBeLessThan(0.05);
  });
});

/* ── no help; no answer before the break ── */
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

describe('no help with the story', () => {
  it('the testimony and its versions carry no hint; it can never be skipped or shown', () => {
    expect(JV.strict).toBe(true);
    expect(JV.hints).toBeUndefined();
    for (const v of JV.versions) expect(v.hints, v.id).toBeUndefined();
    expect(canSkip(JV, { mistakes: 99, hintsUsed: 99 })).toBe(false);
  });

  it('REGRESSION: no answer in anything she reads before the break (statements, press and deflect lines, his openings, the mission)', () => {
    const before = [
      JV.goal,
      JV.intro,
      M.summary,
      ...M.steps.map((s) => s.text),
      ...JV.versions.flatMap((v) => [...v.beats.map((b) => b.t), ...v.beats.filter((b) => b.press).flatMap((b) => lines(b.press)), ...v.deflect.flatMap(lines)]),
      ...['s2.14-jojo-open', 's2.14-jojo-resume', 's2.14-jojo-later', 's2.14-ladder', 's2.14-loft-enter', 's2.14-logbook', 's2.14-eighth'].flatMap(lines),
    ];
    // what breaks each version: the can is full and sealed; the clock was not put forward; his logbook up there
    const answer = ['مليانة', 'ختم سليم', 'ما انقدّمت', 'ما قدّمت', 'متأخر ساعة', 'چانت عشرة', 'دفترك', 'الدفتر بالعلّية', 'طلع للعلّية'];
    for (const text of before) for (const word of answer) expect(text.includes(word), `«${word}» in «${text}»`).toBe(false);
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
  return { game, snapshot, storage, saveManager, s2Store };
}
/** A dialogue as the box plays it: conditions, effects, and the chosen option. */
function say(game, nodes, choice) {
  for (const n of [].concat(nodes || [])) {
    if ('if' in n && !n.t && !n.choice) {
      say(game, check(n.if, game) ? n.then : n.else, choice);
      continue;
    }
    if (n.do) applyEffects(n.do, game);
    if (n.choice) {
      const o = n.choice[choice];
      applyEffects(o.do || [], game);
      say(game, o.then, choice);
    }
  }
}
/** A run list as the engine runs it. A testimony breaks only the versions whose evidence she HOLDS, and stops at the first she cannot. */
function run(game, actions, choice = 0) {
  for (const a of [].concat(actions || [])) {
    if (a.say) say(game, DIALOGUE[a.say], choice);
    else if (a.fx) applyEffects(a.fx, game);
    else if (a.all) run(game, a.all, choice);
    else if ('if' in a && 'then' in a && !a.testimony) run(game, check(a.if, game) ? a.then : a.else, choice);
    else if (a.testimony) {
      const p = PUZZLES[a.testimony];
      let v = Number(game.flag(`pstage:${a.testimony}`)) || 0;
      for (; v < p.versions.length; v++) {
        if (!game.has(`s2.ev.${p.versions[v].breaks[1]}`)) break;
        run(game, p.versions[v].broken, choice);
      }
      if (v < p.versions.length) {
        game.setFlag(`pstage:${a.testimony}`, v);
        run(game, a.else, choice);
      } else {
        game.setFlag(`pstage:${a.testimony}`, false);
        applyEffects(p.reward, game);
        game.recordResult(`puzzle:${a.testimony}`, { completed: true });
        run(game, a.then, choice);
      }
    }
    syncMissions(game, { season2: true });
  }
}
/** What tapping a thing does now (or null when it is not there). */
function tap(game, sceneId, id, choice) {
  const it = SCENES[sceneId].interact.find((i) => i.id === id);
  if (!it || !check(it.if, game)) return null;
  const c = it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, game)) : it;
  run(game, c.run, choice);
  return c.run;
}
const M1_DONE = ['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11'];
const toMission03 = (g) => {
  for (const id of [...M1_DONE, 's2-12', 's2-13']) g.setFlag(`mission:${id}`);
  for (const e of ['t-jojo', 'h-jojo', 'e-drift']) g.collect(`s2.ev.${e}`);
  g.setFlag('s2:dec:jojo-why', 'ask');
  syncMissions(g, { season2: true });
};

describe('Mission 03, played through from its own data', () => {
  for (const choice of [0, 1]) {
    it(`a whole playthrough (${choice ? 'blunt' : 'gentle'}): the can, the clock, the lamp up to the loft, the logbook; the original save byte-identical`, () => {
      const t = setup();
      toMission03(t.game);
      expect(missionState(M, t.game).status).toBe('active');
      const before = t.snapshot();
      // he tells his first version; she has nothing that breaks it yet
      tap(t.game, 's2-lamphouse', 'jojo', choice);
      expect(t.game.flag('pstage:s2-jojo-versions')).toBe(0);
      expect(t.game.flag('s2:14-v1')).toBeFalsy();
      // no ladder and no lamp before his second story breaks
      expect(tap(t.game, 's2-lamphouse', 'ladder')).toBeNull();
      expect(tap(t.game, 's2-lamphouse', 'lamp')).toBeNull();
      tap(t.game, 's2-lamphouse', 'oil');
      expect(t.game.has('s2.ev.e-oilcan')).toBe(true);
      tap(t.game, 's2-lamphouse', 'jojo', choice); // v1 breaks (the can), v2 breaks (the clock, from M1); v3 waits
      expect(t.game.flag('s2:14-v1') && t.game.flag('s2:14-v2') && t.game.flag('s2:14-sister')).toBeTruthy();
      expect(t.game.flag('pstage:s2-jojo-versions')).toBe(2);
      // the loft is dark: nothing there can be seen without a light
      tap(t.game, 's2-loft', 'logbook');
      tap(t.game, 's2-loft', 'eighth');
      expect(t.game.has('s2.ev.e-logbook') || t.game.has('s2.ev.e-loft')).toBe(false);
      // she takes the hand lamp, climbs, and hangs it on the hook
      tap(t.game, 's2-lamphouse', 'lamp');
      expect(t.game.flag('s2:hold')).toBe('s2-lamp');
      tap(t.game, 's2-loft', 'hook');
      expect(t.game.flag('s2:hold')).toBeFalsy();
      expect(t.game.flag('s2:14-shelf-lit')).toBe(true);
      tap(t.game, 's2-loft', 'logbook');
      tap(t.game, 's2-loft', 'eighth');
      expect(t.game.has('s2.ev.e-logbook') && t.game.has('s2.ev.e-loft')).toBe(true);
      // back to him: the third version breaks; his truth; her answer
      tap(t.game, 's2-lamphouse', 'jojo', choice);
      expect(t.game.has('s2.ev.t-jojo-true')).toBe(true);
      expect(t.game.flag('s2:dec:jojo-confront')).toBe(choice ? 'blunt' : 'gentle');
      expect(Boolean(t.game.flag('s2:14-hooks-map'))).toBe(!choice); // kindly: he lends the hooks map (Mission 05 reads it)
      expect(missionState(M, t.game).status).toBe('complete');
      expect(t.game.inJournal('s2-jojo3')).toBe(true);
      // what she said is read when she comes back to him
      expect(tap(t.game, 's2-lamphouse', 'jojo', choice)).toEqual([{ say: 's2.14-jojo-again' }]);
      expect(t.snapshot()).toEqual(before);
    });
  }

  it('every id Mission 03 writes routes to Season 2’s own document', () => {
    const ids = ['s2:14-met', 's2:14-v1', 's2:14-v2', 's2:14-sister', 's2:14-shelf-lit', 's2:14-truth', 's2:14-hooks-map', 's2:in-loft', 's2:hold', 's2:dec:jojo-confront', 'pstage:s2-jojo-versions', 'puzzle:s2-jojo-versions', 'mission:s2-14', 'visited:s2-loft', 'it.s2-loft.logbook', 's2-jojo3', ...[...OWN].map((e) => `s2.ev.${e}`)];
    for (const id of ids) expect(isS2(id), id).toBe(true);
    for (const e of OWN) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
    for (const e of OWN) expect(EVIDENCE_S2[e], `${e} is not in M1's registry`).toBeUndefined();
  });

  it('M1’s lamphouse is exactly as shipped until Mission 03 opens', () => {
    const g = createGame({ saveManager: null });
    for (const id of M1_DONE.slice(0, 4)) g.setFlag(`mission:${id}`);
    // what she can tap, and what each does, is M1's own
    const visible = (scene) => scene.interact.filter((i) => check(i.if, g)).map((i) => i.id).sort();
    const pick = (scene, id) => {
      const it = scene.interact.find((i) => i.id === id);
      return it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, g)).run : it.run;
    };
    const same = () => {
      expect(visible(LAMP)).toEqual(visible(LAMP_M1));
      for (const id of visible(LAMP_M1)) expect(pick(LAMP, id), id).toEqual(pick(LAMP_M1, id));
    };
    same();
    // and after M1, still: Mission 03 waits for Mission 02
    for (const id of M1_DONE) g.setFlag(`mission:${id}`);
    g.collect('s2.ev.t-jojo');
    same();
  });
});

describe('decisions are read again later', () => {
  // M1 decisions nothing reads yet — the missions still to be built must empty this list
  const NOT_YET_READ = [];
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

  it('every decision of M1 and of the Living Story so far changes something later', () => {
    const read = reads();
    for (const [key, values] of Object.entries({ ...DECISIONS_S2, ...DECISIONS_S2_M2 })) {
      if (NOT_YET_READ.includes(key)) continue;
      if (key === 'rabi-reply') continue; // read by Ryan's reaction (progression/social.js, replyFrom)
      for (const v of values) expect(read.has(`dec:${key}=${v}`), `dec:${key}=${v} is read`).toBe(true);
    }
  });

  it('jojo-why (M1) is read by his opening line in Mission 03', () => {
    const open = DIALOGUE['s2.14-jojo-open'];
    expect(open.some((n) => n.if === 'dec:jojo-why=ask')).toBe(true);
    expect(open.some((n) => n.if === 'dec:jojo-why=accept')).toBe(true);
  });
});

describe('M1: the garden clock', () => {
  it('Season 2 puzzles cannot be skipped and never show the answer, however many mistakes', () => {
    for (const [id, p] of Object.entries(PUZZLES_S2)) {
      expect(p.noSolution, id).toBe(true);
      expect(canSkip(p, { mistakes: 99, hintsUsed: 99, hintsOn: true }), id).toBe(false);
      expect(canSkip(p, { mistakes: 99, hintsOn: false }), id).toBe(false);
    }
  });

  it('is turned by hand (drag), and its reward is only given when it is right', () => {
    const c = PUZZLES_S2['s2-clock'].config;
    expect(c.drag).toBe(true);
    let s = RULES.clock.init(c);
    s = RULES.clock.set(c, s, 9, 52).state; // a drag lands between steps: rounded
    expect([s.h, s.m]).toEqual([9, 50]);
    expect(RULES.clock.submit(c, s).outcome).toBe('wrong');
    s = RULES.clock.set(c, s, 10, 41).state;
    expect(RULES.clock.submit(c, s).outcome).toBe('solved');
  });

  it('half-way through the versions: the version she reached is kept in Season 2’s save only', () => {
    const g = createGame({ saveManager: null });
    g.setFlag('pstage:s2-jojo-versions', 1);
    expect(g.s2State.flags['pstage:s2-jojo-versions']).toBe(1);
    expect(g.state.flags['pstage:s2-jojo-versions']).toBeUndefined();
  });
});

it('the module is self-contained: its scenes, puzzle, dialogue and evidence are all registered', () => {
  for (const s of M03.scenes) expect(SCENES[s.id], s.id).toBeTruthy();
  for (const id of Object.keys(M03.puzzles)) expect(PUZZLES[id], id).toBeTruthy();
  for (const k of Object.keys(M03.dialogue)) expect(DIALOGUE[k], k).toBeTruthy();
  for (const e of Object.keys(M03.evidence)) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
});

describe('save audit (Part 7)', () => {
  const S2_KEYS = ['snooki-game:s2', 'snooki-game:s2:backup', 'snooki-game:s2:shadow', 'snooki-game:s2:previous'];
  /** Plays the whole mission; `between` runs after each step (a reload, say). */
  function play(t, between = (g) => g) {
    let g = t.game;
    const step = (fn) => {
      fn(g);
      g.save?.();
      g = between(g);
    };
    step((x) => tap(x, 's2-lamphouse', 'jojo', 0));
    step((x) => tap(x, 's2-lamphouse', 'oil'));
    step((x) => tap(x, 's2-lamphouse', 'jojo', 0));
    step((x) => tap(x, 's2-lamphouse', 'lamp'));
    step((x) => tap(x, 's2-loft', 'hook'));
    step((x) => tap(x, 's2-loft', 'logbook'));
    step((x) => tap(x, 's2-loft', 'eighth'));
    step((x) => tap(x, 's2-lamphouse', 'jojo', 0));
    return g;
  }

  it('every storage key written while playing Season 2 is Season 2’s own (never the original save, never anything else)', () => {
    const t = setup();
    toMission03(t.game);
    t.game.save?.();
    const written = new Set();
    const set = t.storage.setItem.bind(t.storage);
    t.storage.setItem = (k, v) => {
      written.add(k);
      return set(k, v);
    };
    const g = play(t);
    expect(missionState(M, g).status).toBe('complete');
    expect([...written].length).toBeGreaterThan(0);
    for (const k of written) expect(S2_KEYS, `wrote ${k}`).toContain(k);
  });

  it('a reload after every step (the tab closed mid-mission) carries on to the end; nothing is lost or doubled', () => {
    const t = setup();
    toMission03(t.game);
    t.game.save?.();
    const before = t.snapshot();
    const reload = () => {
      const saveManager = createSaveManager({ storage: t.storage, now: () => T0 + 10 });
      const loaded = saveManager.load();
      const s2Store = createS2Store({ storage: t.storage, now: () => T0 + 11 });
      return createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now: () => T0 + 12 });
    };
    const g = play(t, reload);
    syncMissions(g, { season2: true });
    expect(missionState(M, g).status).toBe('complete');
    for (const e of OWN) expect(g.has(`s2.ev.${e}`), e).toBe(true);
    expect(g.s2State.collected.filter((c) => c === 's2.ev.e-logbook')).toHaveLength(1);
    expect(t.snapshot()).toEqual(before); // the original save, through every reload
  });
});
