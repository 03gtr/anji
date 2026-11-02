/**
 * Season 3, played as the engine plays it (shared by the season's tests and the final arc's): a player who finished
 * the original game and Season 2, her choices made by a plan (decision key → value), every scene's own data run.
 */
import { expect } from 'vitest';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store, createSeasonStore, S2_KEY, S3_KEY } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions } from '../../src/game/progression/missions.js';
import { solve, replay } from '../../src/game/puzzles/rules.js';
import { resolveConfig } from '../../src/game/puzzles/host.js';
import { createDialogue, walkScript } from '../../src/game/narrative/dialogue.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { memoryStorage } from '../helpers.js';

export const T0 = 1_800_000_000_000;

/** A player who finished the original game and Season 2 (its finale), with the three stores on one storage. */
export function setup() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج', 'sp1-husky-met': true };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  const s2 = createS2Store({ storage, now: () => T0 + 5 });
  const d2 = s2.load(T0).state;
  d2.flags['mission:s2-17'] = true;
  s2.save(d2);
  let clock = T0 + 100;
  const now = () => clock++;
  const saves = createSaveManager({ storage, now });
  const loaded = saves.load();
  const s2Store = createS2Store({ storage, now });
  const s3Store = createSeasonStore({ storage, key: S3_KEY, now });
  const game = createGame({ saveManager: saves, s2Store, s3Store, initial: loaded.state, s2Initial: s2Store.load(T0).state, s3Initial: s3Store.load(T0).state, now });
  syncMissions(game, { season: 's3' });
  const others = () => [SAVE_KEY, `${SAVE_KEY}:backup`, `${SAVE_KEY}:shadow`, S2_KEY, `${S2_KEY}:backup`].map((k) => storage.getItem(k));
  return { game, storage, others, s3Store };
}

/** Plays the scenes' own data as the engine does; her choices are made by `plan` (decision key → value). */
export function player(game, plan) {
  const t = { said: [], heard: [] };
  const pick = (options) => Math.max(0, options.findIndex((o) => [].concat(o.do || []).some((fx) => /^dec3:/.test(fx) && plan[fx.slice(5, fx.indexOf('='))] === fx.slice(fx.indexOf('=') + 1))));
  function say(key) {
    const script = DIALOGUE[key];
    expect(script, key).toBeTruthy();
    t.said.push(key);
    const d = createDialogue(script, { check: (x) => check(x, game), apply: (fx) => applyEffects(fx, game) });
    // the dialogue's own pending options are not exposed with their effects: find the node by its option texts
    const nodes = [];
    walkScript(script, (n) => n.choice && nodes.push(n));
    for (let i = 0; i < 400 && !d.ended; i++) {
      const step = d.next();
      if (step.type === 'choice') {
        const node = nodes.find((n) => {
          const open = n.choice.filter((o) => !('if' in o) || check(o.if, game));
          return open.length === step.options.length && open.every((o, k) => o.t === step.options[k]);
        });
        const open = node.choice.filter((o) => !('if' in o) || check(o.if, game));
        d.choose(pick(open));
      } else if (step.type === 'line') t.heard.push(step.text);
    }
    game.markSeen(`dlg:${key}`);
  }
  function run(actions) {
    for (const a of [].concat(actions || [])) {
      if (!a || typeof a !== 'object') continue;
      if (a.puzzle) {
        const p = PUZZLES[a.puzzle];
        const c = resolveConfig(p.config, game);
        expect(replay(p.type, c, solve(p.type, c)).outcome, a.puzzle).toBe('solved');
        if (game.recordResult(`puzzle:${a.puzzle}`, { completed: true }).firstClear) applyEffects(p.reward, game);
        run(a.then);
      } else if ('then' in a || 'else' in a) run(check(a.if, game) ? a.then : a.else);
      else if (a.say) say(a.say);
      else if (a.fx) applyEffects(a.fx, game);
      else if (a.all) run(a.all);
      syncMissions(game, { season: 's3' });
    }
  }
  function visit(scene) {
    game.setLocation(scene, 150);
    for (const tr of SCENES[scene].triggers || []) {
      // (as world/engine.js: a trigger fires once per save, unless it is `once: false`)
      if (tr.once !== false && game.flag(`t.${scene}.${tr.id}`)) continue;
      if (!check(tr.if, game)) continue;
      if (tr.once !== false) game.setFlag(`t.${scene}.${tr.id}`);
      run(tr.run);
    }
  }
  function tap(scene, id) {
    const it = SCENES[scene].interact.find((i) => i.id === id && check(i.if, game));
    expect(it, `${scene}: ${id} can be tapped`).toBeTruthy();
    const c = it.cases.find((x) => x.if === undefined || check(x.if, game));
    run(c.run);
  }
  return Object.assign(t, { visit, tap });
}

export const done = (game, id) => game.flag(`mission:${id}`) === true;

/** The whole season, as she would play it. `street` false: she walks past the street's details the first time. */
export function playSeason(game, plan, { street = true } = {}) {
  const p = player(game, plan);
  // 01
  p.visit('s3-clinic');
  p.tap('s3-clinic', 'sabri');
  for (const id of ['log', 'lama', 'board', 'printer', 'appointments']) p.tap('s3-clinic', id);
  p.tap('s3-clinic', 'counter');
  p.tap('s3-clinic', 'sabri');
  expect(done(game, 's3-01')).toBe(true);
  // 02
  p.visit('s3-street');
  if (street) for (const id of ['lamp', 'bakery', 'camera', 'plate']) p.tap('s3-street', id);
  expect(done(game, 's3-02')).toBe(true);
  // 03
  p.visit('s3-home');
  p.tap('s3-home', 'marius');
  p.tap('s3-home', 'phone');
  p.tap('s3-home', 'desk');
  if (!street) {
    // the night's anchors are on the street: she is sent back, never stuck
    expect(p.said).toContain('s3.03-desk-street');
    expect(game.flag('s3:03-solved')).toBeFalsy();
    p.visit('s3-street');
    p.tap('s3-street', 'lamp');
    p.tap('s3-street', 'bakery');
    p.visit('s3-home');
    p.tap('s3-home', 'desk');
  }
  // she tells Marius what the recordings say (the step that replaced the removed investigation board)
  p.tap('s3-home', 'marius');
  expect(game.flag('s3:03-told')).toBe(true);
  expect(done(game, 's3-03')).toBe(true);
  // 04
  p.visit('s3-garage');
  p.tap('s3-garage', 'sabri');
  p.tap('s3-garage', 'jalal');
  p.tap('s3-garage', 'board');
  p.tap('s3-garage', 'bin');
  p.tap('s3-garage', 'phone');
  p.tap('s3-garage', 'sabri');
  expect(done(game, 's3-04')).toBe(true);
  // 05
  p.visit('s3-lane');
  p.tap('s3-lane', 'grate');
  for (let i = 0; i < 3; i++) p.tap('s3-lane', 'snooki');
  p.tap('s3-lane', 'marks');
  p.tap('s3-lane', 'oil');
  p.tap('s3-lane', 'street');
  expect(done(game, 's3-05')).toBe(true);
  // 06
  p.visit('s3-archive');
  p.tap('s3-archive', 'wall');
  expect(done(game, 's3-06')).toBe(true);
  // 07: the road she chose
  p.visit('s3-home');
  p.tap('s3-home', 'phone');
  const road = { marius: ['s3-home', 'marius'], lama: ['s3-clinic', 'lama'], sabri: ['s3-garage', 'sabri'] }[plan.road];
  p.visit(road[0]);
  p.tap(road[0], road[1]);
  expect(done(game, 's3-07')).toBe(true);
  // 08
  p.visit('s3-street');
  p.tap('s3-street', 'jalal');
  p.tap('s3-street', 'ryan');
  expect(done(game, 's3-08')).toBe(true);
  return p;
}

// every value of every decision, and every road, at least once
export const PLANS = [
  { 'sabri-reply': 'deny', 'marius-honest': 'honest', 'v8-answer': 'wave', 'ryan-trust': 'trust', 'lama-secret': 'trust', road: 'marius' },
  { 'sabri-reply': 'laugh', 'marius-honest': 'deflect', 'v8-answer': 'walk', 'ryan-trust': 'see', 'lama-secret': 'keep', road: 'lama' },
  { 'sabri-reply': 'confront', 'marius-honest': 'honest', 'v8-answer': 'text', 'ryan-trust': 'see', 'lama-secret': 'trust', road: 'sabri' },
  { 'sabri-reply': 'deny', 'marius-honest': 'deflect', 'v8-answer': 'walk', 'ryan-trust': 'trust', 'lama-secret': 'keep', road: 'sabri' },
];

