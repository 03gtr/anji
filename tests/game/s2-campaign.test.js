/**
 * Season 2, M2 — the whole second half played in ONE save: Missions 01 → 06 (s2-12 … s2-17), from the state M1
 * leaves (its evidence and decisions, from M1's own registries) to the season's last line, with nothing set by hand
 * in between. Each mission's own test starts from a fixture that says what the missions before it left; here those
 * missions really leave it — the evidence each one needs is the evidence the ones before it gave, every decision is
 * the one she made, and every answer of the final defence is a piece she actually holds.
 *
 * Driven by the game's own data and rules: the scenes' interactions and triggers (as the engine fires them), the
 * real dialogue runner (her choices made by the decision planned for the run), each puzzle solved by its own rules,
 * each chase leg by the chase rules, the stealth by its careful player, the testimony broken only by evidence she
 * holds, the defence by its rules. Two runs, every Mission 01–06 decision taken both ways.
 */
import { describe, it, expect } from 'vitest';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { solve, replay } from '../../src/game/puzzles/rules.js';
import { resolveConfig } from '../../src/game/puzzles/host.js';
import { defend } from '../../src/game/puzzles/defend.js';
import { loadDefence } from '../../src/game/ui/defend.js';
import { createDialogue } from '../../src/game/narrative/dialogue.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { CASE_S2, DECISIONS_S2 } from '../../src/game/data/evidence-s2.js';
import { CASE_S2_M2, DECISIONS_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import { LEGS, createRun, stepRun, goodInput } from '../../src/game/minigames/s2-chase-logic.js';
import { createStealth } from '../../src/game/minigames/s2-stealth-logic.js';
import { careful, play as playStealth } from './s2-stealth-bot.js';
import { FORKS } from '../../src/game/data/m2/m02-snooki.js';
import { DEFENCE } from '../../src/game/data/m2/m06-truth.js';
import { memoryStorage } from '../helpers.js';

const T0 = 1_800_000_000_000;
const M1_MISSIONS = ['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11'];
const CAMPAIGN = ['s2-12', 's2-13', 's2-14', 's2-15', 's2-16', 's2-17'];
const mission = (id) => MISSIONS.find((m) => m.id === id);

function setup() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج', 'sp1-husky-met': true };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  const saveManager = createSaveManager({ storage, now: () => T0 + 1 });
  const loaded = saveManager.load();
  const s2Store = createS2Store({ storage, now: () => T0 + 2 });
  const game = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now: () => T0 + 3 });
  const original = () => ['', ':backup', ':shadow'].map((k) => storage.getItem(SAVE_KEY + k));
  return { game, storage, original };
}

/** Where M1 leaves her: its missions done, its places visited, everything its missions give, and her M1 decisions. */
function endOfM1(game, m1) {
  for (const id of M1_MISSIONS) game.setFlag(`mission:${id}`);
  for (const k of ['in-archive', 'in-tree', 'in-caseroom', 'in-lamphouse', 'in-office', 'caseroom-open', 'board-1', 'board-2', '11-talked']) game.setFlag(`s2:${k}`);
  for (const { ids } of CASE_S2) for (const e of ids) game.collect(`s2.ev.${e}`);
  for (const [k, v] of Object.entries(m1)) {
    expect(DECISIONS_S2[k], k).toContain(v);
    game.setFlag(`s2:dec:${k}`, v);
  }
  syncMissions(game, { season2: true });
}

/** A runner over the game's own data, as the engine runs it. `plan`: the decision she makes at each choice. */
function player(game, plan) {
  const t = { scene: null, heard: [], said: [], puzzles: [], games: [], presented: [] };
  // a choice: the option that makes the planned decision; otherwise the first (as a player who reads on)
  const choose = (options) => {
    const i = options.findIndex((o) => [].concat(o.do || []).some((fx) => typeof fx === 'string' && fx.startsWith('dec:') && plan[fx.slice(4, fx.indexOf('='))] === fx.slice(fx.indexOf('=') + 1)));
    return Math.max(0, i);
  };
  function say(key) {
    const script = DIALOGUE[key];
    expect(script, `dialogue ${key}`).toBeTruthy();
    t.said.push(key);
    const d = createDialogue(script, { check: (c) => check(c, game), apply: (fx) => applyEffects(fx, game) });
    for (let n = 0; n < 500; n++) {
      if (d.waitingForChoice) {
        // (the runner keeps the options shown; pick by the original nodes' effects)
        const node = findChoice(script);
        d.choose(choose(node ? node.choice.filter((o) => !('if' in o) || check(o.if, game)) : []));
        continue;
      }
      const step = d.next();
      if (step.type === 'end') break;
      if (step.type === 'line') t.heard.push(step.text);
    }
    expect(d.ended, `${key} ended`).toBe(true);
    game.markSeen(`dlg:${key}`);
  }
  // the choice node the runner is waiting on: the first whose options are all still undecided by plan order
  let lastChoices = [];
  function findChoice(script) {
    const found = [];
    const walk = (nodes) => {
      for (const n of nodes || []) {
        if (n.choice) found.push(n);
        walk(n.then);
        walk(n.else);
        for (const o of n.choice || []) walk(o.then);
      }
    };
    walk(script);
    const next = found.find((n) => !lastChoices.includes(n));
    lastChoices.push(next);
    return next;
  }
  function run(actions) {
    for (const a of [].concat(actions || [])) {
      if (typeof a === 'function') {
        if (a.defence) defence(a);
        continue;
      }
      if (!a || typeof a !== 'object') continue;
      if ('then' in a || 'else' in a) {
        if (a.puzzle) puzzle(a);
        else if (a.testimony) testimony(a);
        else if (a.game) minigame(a);
        else run(check(a.if, game) ? a.then : a.else);
      } else if (a.if !== undefined && !check(a.if, game)) continue;
      else if (a.say) {
        lastChoices = [];
        say(a.say);
      } else if (a.fx) applyEffects(a.fx, game);
      else if (a.all) run(a.all);
      else if (a.puzzle) puzzle(a);
      else if (a.game) minigame(a);
      else if (a.goto) go(a.goto, a.x);
      syncMissions(game, { season2: true });
    }
  }
  function puzzle(a) {
    const p = PUZZLES[a.puzzle];
    expect(p, `puzzle ${a.puzzle}`).toBeTruthy();
    const c = resolveConfig(p.config, game);
    expect(replay(p.type, c, solve(p.type, c)).outcome, `${a.puzzle} solved by its own rules`).toBe('solved');
    t.puzzles.push(a.puzzle);
    if (game.recordResult(`puzzle:${a.puzzle}`, { completed: true }).firstClear !== false) applyEffects(p.reward, game);
    syncMissions(game, { season2: true });
    run(a.then);
  }
  function testimony(a) {
    // a version breaks only on evidence she HOLDS; the testimony stops at the first she cannot break
    const p = PUZZLES[a.testimony];
    let v = Number(game.flag(`pstage:${a.testimony}`)) || 0;
    for (; v < p.versions.length; v++) {
      if (!game.has(`s2.ev.${p.versions[v].breaks[1]}`)) break;
      run(p.versions[v].broken);
    }
    if (v < p.versions.length) {
      game.setFlag(`pstage:${a.testimony}`, v);
      run(a.else);
    } else {
      game.setFlag(`pstage:${a.testimony}`, false);
      t.puzzles.push(a.testimony);
      if (game.recordResult(`puzzle:${a.testimony}`, { completed: true }).firstClear !== false) applyEffects(p.reward, game);
      run(a.then);
    }
  }
  function minigame(a) {
    t.games.push(a.game);
    if (a.game === 's2-chase') {
      const c = LEGS[a.options.leg];
      const r = createRun(c);
      for (let i = 0; i < 60 * 400 && !r.done; i++) stepRun(c, r, 1 / 60, goodInput(c, r, { high: true }));
      expect(r.done, `chase leg ${a.options.leg} finished`).toBe(true);
      for (const id of r.found) game.setFlag(`${a.options.flags ?? 's2:13-'}find-${id}`, true);
    } else if (a.game === 's2-stealth') {
      const s = createStealth(a.options.rhythm);
      const { events } = playStealth(s, careful);
      expect(s.done && events.length === 0, 'the stealth, unseen').toBe(true);
    } else throw new Error(`unknown minigame ${a.game}`);
    game.recordResult(`game:${a.game}`, { completed: true });
    syncMissions(game, { season2: true });
    run(a.then);
  }
  function defence(a) {
    // she defends D: each challenge answered with a piece she HOLDS (the bar offers only those)
    const def = a.defence;
    let s = loadDefence(def, game);
    const moves = [['choose', 'D'], ...def.config.challenges.D.map((ch) => {
      const held = ch.answer.find((e) => game.has(`s2.ev.${e}`));
      expect(held, `challenge ${ch.id}: she holds one of ${ch.answer.join(', ')}`).toBeTruthy();
      t.presented.push(held);
      return ['present', held];
    })];
    let outcome = 'noop';
    for (const [move, ...args] of moves) {
      const r = defend[move](def.config, s, ...args);
      s = r.state;
      outcome = r.outcome;
      for (const hyp of s.broken) game.setFlag(`${def.save}-broke-${hyp.toLowerCase()}`);
      for (const [hyp, n] of Object.entries(s.done)) game.setFlag(`${def.save}-held-${hyp.toLowerCase()}`, n);
    }
    expect(outcome, 'D holds').toBe('solved');
    game.setFlag(def.solved);
    syncMissions(game, { season2: true });
    run(a.then);
  }
  function go(scene, x) {
    expect(SCENES[scene], `scene ${scene}`).toBeTruthy();
    t.scene = scene;
    game.setLocation(scene, x ?? SCENES[scene].spawn);
    if (!game.flag(`visited:${scene}`)) game.setFlag(`visited:${scene}`);
  }
  /**
   * Arriving and walking through the place: its triggers, one at a time as the engine fires them — a once-trigger is
   * remembered in the save; a repeatable one fires once per visit (re-armed only after she leaves its zone).
   */
  function arrive(scene) {
    go(scene);
    const fired = new Set();
    for (let n = 0; n < 20; n++) {
      const tr = (SCENES[scene].triggers || []).find((x) => !fired.has(x.id) && !(x.once !== false && game.flag(`t.${scene}.${x.id}`)) && check(x.if, game));
      if (!tr) return;
      fired.add(tr.id);
      if (tr.once !== false) game.setFlag(`t.${scene}.${tr.id}`);
      run(tr.run);
    }
  }
  /** A tap: the first case that holds, as she is (unseen when it matters). */
  function tap(scene, id) {
    const it = SCENES[scene].interact.find((i) => i.id === id && check(i.if, game));
    expect(it, `${scene}: ${id} is there`).toBeTruthy();
    game.markSeen(`it.${scene}.${id}`);
    const c = it.cases ? it.cases.find((x) => (x.if === undefined || check(x.if, game)) && !x.seenBy) : it;
    expect(c, `${scene}: ${id} does something`).toBeTruthy();
    run(c.run);
  }
  return Object.assign(t, { run, tap, arrive, go });
}

const PLANS = [
  {
    m1: { lead: 'ryan', 'tree-tease': 'yes', 'rabi-reply': 'polite', sabri: 'press', 'jojo-why': 'ask', 'sister-refusal': 'respect', 'jealous-talk': 'reassure' },
    m2: { 'office-cover': 'cover', stash: 'return', 'jojo-confront': 'gentle', 'sister-wish': 'read' },
  },
  {
    m1: { lead: 'anji', 'tree-tease': 'no', 'rabi-reply': 'tease-ryan', sabri: 'let-be', 'jojo-why': 'accept', 'sister-refusal': 'push', 'jealous-talk': 'boundary' },
    m2: { 'office-cover': 'truth', stash: 'keep', 'jojo-confront': 'blunt', 'sister-wish': 'leave' },
  },
];

/** Each mission, played as a player would (the order the missions' own tests play them in). */
const PLAY = {
  's2-12': (p) => {
    p.arrive('s2-office');
    for (const id of ['rota', 'calendar', 'sabri', 'lama', 'sticky']) p.tap('s2-office', id);
    for (const sheet of ['paper-1', 'paper-2', 'paper-3', 'paper-4']) {
      p.tap('s2-office', sheet);
      p.tap('s2-office', 'tray');
    }
    p.tap('s2-office', 'board');
  },
  's2-13': (p) => {
    p.arrive('s2-archive');
    for (const id of ['register', 'sabri', 'trail']) p.tap('s2-archive', id);
    p.arrive('s2-trail');
    for (const path of FORKS[0]) p.tap('s2-trail', `path-${path.id}`);
    p.tap('s2-trail', 'signpost');
    p.arrive('s2-shed');
    for (const path of FORKS[1]) p.tap('s2-shed', `path-${path.id}`);
    p.tap('s2-shed', 'signpost');
    p.arrive('s2-shed');
    p.tap('s2-shed', 'stash');
  },
  's2-14': (p) => {
    p.arrive('s2-lamphouse');
    p.tap('s2-lamphouse', 'jojo');
    p.tap('s2-lamphouse', 'oil');
    p.tap('s2-lamphouse', 'jojo');
    p.tap('s2-lamphouse', 'lamp');
    p.tap('s2-lamphouse', 'ladder');
    p.arrive('s2-loft');
    for (const id of ['hook', 'logbook', 'eighth']) p.tap('s2-loft', id);
    p.arrive('s2-lamphouse');
    p.tap('s2-lamphouse', 'jojo');
  },
  's2-15': (p) => {
    p.arrive('s2-home');
    p.tap('s2-home', 's2-15-path');
    p.arrive('s2-shed-in');
    p.tap('s2-shed-in', 'line');
    for (const id of ['can', 'tin', 'pots']) p.tap('s2-shed-in', id);
    p.tap('s2-shed-in', 'line');
    p.arrive('s2-dusk');
  },
  's2-16': (p) => {
    p.arrive('s2-tree');
    p.tap('s2-tree', 'lama');
    p.arrive('s2-tree-night');
    p.tap('s2-tree-night', 'lama');
    p.tap('s2-tree-night', 'stand');
  },
  's2-17': (p) => {
    p.arrive('s2-caseroom');
    p.tap('s2-caseroom', 'board');
    p.tap('s2-caseroom', 'board');
    p.tap('s2-caseroom', 'garden-door');
    p.arrive('s2-finale');
    p.tap('s2-finale', 'roses');
  },
};

describe('Season 2, Missions 01 → 06 in one save (nothing set by hand after M1)', () => {
  for (const [n, plan] of PLANS.entries()) {
    it(`run ${n + 1}: ${Object.values(plan.m2).join(', ')}`, () => {
      const { game, original } = setup();
      endOfM1(game, plan.m1);
      const before = original();
      const p = player(game, plan.m2);
      for (const [i, id] of CAMPAIGN.entries()) {
        const m = mission(id);
        expect(missionState(m, game).status, `${id} opens after ${i ? CAMPAIGN[i - 1] : 's2-11'}`).toBe('active');
        if (CAMPAIGN[i + 1]) expect(missionState(mission(CAMPAIGN[i + 1]), game).status, `${CAMPAIGN[i + 1]} waits`).toBe('locked');
        PLAY[id](p);
        expect(missionState(m, game).status, `${id} complete`).toBe('complete');
        for (const e of CASE_S2_M2.find((c) => c.mission === id).ids) expect(game.has(`s2.ev.${e}`), `${id} gave ${e}`).toBe(true);
        for (const r of m.reward || []) if (r.startsWith('journal:')) expect(game.inJournal(r.slice(8)), `${id}: ${r}`).toBe(true);
      }
      // every Mission 01–06 decision is the one she made (each read by the missions after it)
      for (const [k, v] of Object.entries(plan.m2)) {
        expect(DECISIONS_S2_M2[k], k).toContain(v);
        expect(game.flag(`s2:dec:${k}`), k).toBe(v);
      }
      // the defence was answered only with pieces she held, and the season ended
      expect(p.presented.length).toBe(DEFENCE.config.challenges.D.length);
      expect(game.flag('s2:17-end')).toBe(true);
      expect(p.games.filter((g) => g === 's2-chase')).toHaveLength(3);
      expect(p.games).toContain('s2-stealth');
      expect(p.puzzles).toEqual(expect.arrayContaining(['s2-who-said', 's2-trail-1', 's2-trail-2', 's2-jojo-versions', 's2-chain', 's2-shadows', 's2-night-order']));
      // Season 2's save holds it all; the original campaign's save never changed
      for (const id of ['s2:dec:stash', 'mission:s2-17', 's2.ev.d-case']) expect(isS2(id), id).toBe(true);
      expect(original()).toEqual(before);
    });
  }
});
