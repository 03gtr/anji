/**
 * «إحنا فريق» — the first shared activity, «مشية العصر» (the afternoon walk), end to end:
 * who can start it and when (after the ending, with the husky), Anji's plan and route choice,
 * the three stops per route, the fork's logic grid (fair: one answer, every stop needed), the
 * picnic once per route, the dogs' friendship, saves (synthetic only), the map and the app.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager, SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { journalEntries } from '../../src/game/progression/journal-index.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { MISSIONS_TEAM, TEAM_UNLOCK, WALK_ROUTES, PACKS_TEAM } from '../../src/game/data/missions-team.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { PUZZLES_TEAM } from '../../src/game/data/puzzles-team.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { JOURNAL, COLLECTIBLES } from '../../src/game/data/items.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { TEAM_SCENES, TEAM_EXTRAS } from '../../src/game/data/scenes/team.js';
import { WORLDS, worldById, ROUTES } from '../../src/game/data/worlds.js';
import { ACTS, currentObjective } from '../../src/game/data/chapters.js';
import { logicgridSolutions, RULES } from '../../src/game/puzzles/rules.js';
import { dueNotice } from '../../src/game/ui/content-notice.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

const game = (flags = {}) => createGame({ saveManager: null, initial: { ...defaultState(), flags: { ...flags } } });
const walk = MISSIONS.find((m) => m.id === 'tu-walk');
const notebook = () => SCENES.final.interact.find((i) => i.id === 'tu-notebook');
const inWalk = (id) => SCENES.dogwalk.interact.find((i) => i.id === id);
const caseFor = (it, g) => it.cases.find((c) => check(c.if ?? [], g));
const visible = (it, g) => check(it.if ?? [], g);
const STRUCTURAL = (rule) => Boolean(rule.distinct);

/** Every act objective through act n (pack content excluded, as in the other suites). */
function throughAct(n, g) {
  for (const act of ACTS.filter((a) => a.act <= n)) {
    g.setFlag(`act${act.act}-done`);
    for (const o of act.objectives) {
      for (const a of atoms(o.done)) {
        const [kind, ...rest] = a.split(':');
        const id = rest.join(':');
        if (kind === 'flag' && !/^(sp2-|dg-|workshop-entered|final-entered)/.test(id)) g.setFlag(id);
        else if (kind === 'record') g.recordResult(id, { completed: true });
        else if (kind === 'item') g.addItem(id);
      }
    }
  }
  return g;
}
/** A finished game that has met (and named) the husky in Story Pack 01. */
function finished() {
  const g = throughAct(8, game());
  g.setFlags(['intro-done', 'map-open', 'workshop-entered', 'final-entered', 'rose-planted', 'sp1-husky-met', 'notice:sp1', 'notice:sp2']);
  g.setFlag(HUSKY_FLAG, 'لولو');
  return g;
}
/** Run a scripted action list the way the engine does for its data parts (say / fx / if). */
function run(actions, g, said = []) {
  for (const a of actions) {
    if (a.say) said.push(a.say);
    if (a.fx) applyEffects(a.fx, g);
    if (a.if !== undefined && (a.then || a.else)) run(check(a.if, g) ? a.then ?? [] : a.else ?? [], g, said);
  }
  return said;
}
/** What a dialogue key does (its `do` lines, and the chosen branch of a choice). */
function sayDo(key, g, pick = 0) {
  for (const line of DIALOGUE[key]) {
    if (line.do) applyEffects(line.do, g);
    if (line.choice) for (const l of line.choice[pick].then) if (l.do) applyEffects(l.do, g);
  }
}
const OBS = (route) => [1, 2, 3].map((n) => `tu-obs-${route}-${n}`);

describe('who can start it, and when', () => {
  it('only after the ending, and only once she has met the husky', () => {
    const before = throughAct(7, game());
    before.setFlags(['workshop-entered', 'final-entered', 'sp1-husky-met']);
    expect(missionState(walk, before).status).toBe('locked');
    expect(visible(notebook(), before)).toBe(false);
    const noHusky = throughAct(8, game());
    noHusky.setFlags(['workshop-entered', 'final-entered']);
    expect(missionState(walk, noHusky).status).toBe('locked');
    const g = finished();
    expect(missionState(walk, g)).toMatchObject({ status: 'active', step: 0 });
    expect(visible(notebook(), g)).toBe(true);
    // one notice at a time: the deep garden's (Phase 05) is due first, then this one
    expect(dueNotice(g, 'garden')?.id).toBe('deep');
    g.setFlag('notice:deep');
    expect(dueNotice(g, 'garden')?.id).toBe(PACKS_TEAM[0].id);
    g.setFlag(`notice:${PACKS_TEAM[0].id}`);
    expect(dueNotice(g, 'garden')).toBeNull();
  });

  it('is optional: no act, ending, story mission or other pack needs anything from it', () => {
    for (const a of ACTS) for (const o of a.objectives) expect(JSON.stringify(o.done)).not.toMatch(/tu-/);
    for (const m of MISSIONS.filter((x) => x.pack !== 'team')) {
      expect(JSON.stringify([m.unlock, m.steps.map((s) => s.done)]), m.id).not.toMatch(/tu-/);
    }
    for (const w of WORLDS.filter((x) => x.pack !== 'team')) expect(JSON.stringify(w.unlock ?? ''), w.id).not.toMatch(/tu-/);
    expect(walk.kind).toBe('together');
    expect(journalEntries(finished()).find((e) => e.id === 'tu-walk').category).toBe('side');
    // a finished game's objective is not taken over by it
    const g = finished();
    expect(currentObjective(g).text).not.toBe(walk.steps[0].text);
  });
});

describe('Anji plans it', () => {
  it('the notebook: her plan, a route she chooses, then the walk; each route clears the other', () => {
    const g = finished();
    const first = caseFor(notebook(), g);
    expect(run(first.run.filter((a) => !a.goto && !a.fade), game())).toEqual(['tu.plan-first', 'tu.plan-route', 'tu.plan-go']);
    expect(first.run.some((a) => a.goto === 'dogwalk')).toBe(true);
    expect(check(worldById('dogwalk').unlock, g)).toBe(false); // the place appears when she plans it
    run(first.run.filter((a) => a.fx), g);
    sayDo('tu.plan-route', g, 0);
    expect([Boolean(g.flag('tu-route-river')), Boolean(g.flag('tu-route-orchard'))]).toEqual([true, false]);
    expect(check(worldById('dogwalk').unlock, g)).toBe(true);
    expect(missionState(walk, g).step).toBe(1);
    sayDo('tu.plan-route', g, 1); // she changes her mind: the other route
    expect([Boolean(g.flag('tu-route-river')), Boolean(g.flag('tu-route-orchard'))]).toEqual([false, true]);
    expect(run(caseFor(notebook(), g).run.filter((a) => !a.goto && !a.fade), game())).toEqual(['tu.plan-again', 'tu.plan-route', 'tu.plan-go']);
  });
});

describe('the walk', () => {
  it('each route has three stops, shown only on that route; noticing one is a journal fact, given once', () => {
    for (const route of WALK_ROUTES) {
      const g = finished();
      g.setFlags(['tu-walk-plan', `tu-route-${route}`]);
      const other = WALK_ROUTES.find((r) => r !== route);
      for (const n of [1, 2, 3]) {
        expect(visible(inWalk(`stop-${route}-${n}`), g)).toBe(true);
        expect(visible(inWalk(`stop-${other}-${n}`), g)).toBe(false);
        const said = run(caseFor(inWalk(`stop-${route}-${n}`), g).run, g);
        expect(said).toEqual([`tu.obs-${route}-${n}`]);
        expect(g.state.journal).toContain(`tu-obs-${route}-${n}`);
        expect(run(caseFor(inWalk(`stop-${route}-${n}`), g).run, g)).toEqual(['tu.obs-again']);
      }
      expect(missionState(walk, g).step).toBe(2);
    }
  });

  it('the fork waits for all three stops of that route, then opens its own grid', () => {
    const g = finished();
    g.setFlags(['tu-walk-plan', 'tu-route-river', 'tu-obs-river-1', 'tu-obs-river-2', 'tu-obs-orchard-3']);
    const fork = inWalk('fork-river');
    expect(caseFor(fork, g).run).toEqual([{ say: 'tu.fork-wait' }]);
    g.setFlag('tu-obs-river-3');
    expect(caseFor(fork, g).run.find((a) => a.puzzle)?.puzzle).toBe('tu-trail-river');
    expect(visible(inWalk('basket-river'), g)).toBe(false); // no basket before the trail
  });

  it('the grids are fair: one answer, every clue is said at a stop of that route, every stop clue is needed', () => {
    for (const route of WALK_ROUTES) {
      const p = PUZZLES_TEAM[`tu-trail-${route}`];
      expect(PUZZLES[`tu-trail-${route}`]).toBe(p);
      expect(logicgridSolutions(p.config)).toHaveLength(1);
      const facts = OBS(route).map((id) => JOURNAL[id].text).join(' ');
      const lines = OBS(route).map((id) => DIALOGUE[`tu.obs-${route}-${id.slice(-1)}`].map((l) => l.t).join(' ')).join(' ');
      for (const [i, clue] of p.config.clues.entries()) {
        expect(facts, `${route} clue ${i + 1} is in a journal fact`).toContain(`«${clue.text}»`);
        // said out loud too (the note quotes it, or a character says it in other words)
        expect(lines.length).toBeGreaterThan(0);
        if (STRUCTURAL(clue.rule)) continue;
        const without = p.config.clues.filter((_, j) => j !== i);
        expect(logicgridSolutions(p.config, without).length, `${route}: clue ${i + 1} is needed`).toBeGreaterThan(1);
      }
      expect(p.hints).toHaveLength(3);
      expect(p.reward).toContain(`flag:tu-trail-${route}`);
      for (const fx of p.reward.filter((r) => r.startsWith('journal:'))) expect(JOURNAL[fx.slice(8)], fx).toBeTruthy();
    }
  });

  it('pair rule: a row has A exactly when it has B; a wrong check names the first broken clue', () => {
    const p = PUZZLES_TEAM['tu-trail-river'].config;
    const [sol] = logicgridSolutions(p);
    const wrong = { ...sol, fence: { to: 'basket', dog: 'husky' }, bridge: { to: 'tree', dog: 'snooki' } };
    const res = RULES.logicgrid.check(p, { cells: wrong, broken: null, mistakes: 0 });
    expect(res.outcome).toBe('wrong');
    expect(res.message).toMatch(/^الدليل \d+ ما ينطبق/);
    expect(RULES.logicgrid.check(p, { cells: sol, broken: null, mistakes: 0 }).outcome).toBe('solved');
  });

  it('the picnic plays once per route; the dogs go from rivals to a team over two walks; keepsakes once', () => {
    const g = finished();
    g.setFlags(['tu-walk-plan', 'tu-route-river', ...OBS('river'), 'tu-trail-river']);
    const basket = inWalk('basket-river');
    expect(visible(basket, g)).toBe(true);
    const said = run(caseFor(basket, g).run, g);
    expect(said).toEqual(['tu.picnic-river', 'tu.dogs-first', 'tu.picnic-quiet']);
    expect(g.flag('tu-dogs-1')).toBe(true);
    expect(g.flag('tu-dogs-2')).toBeFalsy();
    expect(g.has('keepsake.walk.river')).toBe(true);
    expect(syncMissions(g).completed.map((m) => m.id)).toEqual(['tu-walk']);
    expect(run(caseFor(basket, g).run, g)).toEqual(['tu.picnic-again']);
    // the second walk, the other route
    expect(run(caseFor(notebook(), g).run.filter((a) => !a.goto && !a.fade), game())[0]).toBe('tu.plan-second');
    sayDo('tu.plan-route', g, 1);
    g.setFlags([...OBS('orchard'), 'tu-trail-orchard']);
    expect(run(caseFor(inWalk('basket-orchard'), g).run, g)).toEqual(['tu.picnic-orchard', 'tu.dogs-second', 'tu.picnic-quiet']);
    expect(g.flag('tu-dogs-2')).toBe(true);
    expect(g.has('keepsake.walk.orchard')).toBe(true);
    expect(syncMissions(g).completed).toEqual([]); // nothing paid twice
    expect(run(caseFor(notebook(), g).run, game())).toEqual(['tu.plan-done']);
    for (const k of ['keepsake.walk.river', 'keepsake.walk.orchard']) expect(COLLECTIBLES[k] ?? JOURNAL[k] ?? k).toBeTruthy();
  });
});

describe('content wiring, map and saves', () => {
  it('every dialogue key and puzzle the walk and the notebook use exists; the husky is never renamed', () => {
    const all = [];
    const walkAll = (node) => {
      if (Array.isArray(node)) return node.forEach(walkAll);
      if (!node || typeof node !== 'object') return;
      all.push(node);
      for (const k of ['run', 'cases', 'then', 'else', 'interact', 'triggers']) if (node[k]) walkAll(node[k]);
    };
    walkAll(TEAM_SCENES);
    walkAll(Object.values(TEAM_EXTRAS));
    for (const a of all.filter((x) => x.say)) expect(DIALOGUE[a.say], a.say).toBeTruthy();
    for (const a of all.filter((x) => x.puzzle)) expect(PUZZLES[a.puzzle], a.puzzle).toBeTruthy();
    expect(all.filter((x) => x.askName)).toEqual([]);
    for (const a of all.filter((x) => x.fx)) expect(JSON.stringify(a.fx)).not.toMatch(/husky-name/);
    for (const m of MISSIONS_TEAM) for (const s of m.steps) expect(s.hint, `${m.id}: a hint on request`).toBeTruthy();
  });

  it('the walk sits on a free spot of the garden page, joined to the garden and the sanctuary, marked as shared', () => {
    const w = worldById('dogwalk');
    expect(w.together).toBe(true);
    expect(WORLDS.filter((x) => (x.region ?? 'garden') === 'garden' && x.x === w.x && x.y === w.y)).toHaveLength(1);
    expect(ROUTES.filter((r) => r.includes('dogwalk')).length).toBe(2);
    expect(SCENES.dogwalk).toBeTruthy();
  });

  it('a save half-way through the walk (synthetic) reloads exactly: route, stops, the grid draft', () => {
    const g = finished();
    g.setFlags(['tu-walk-plan', 'tu-route-orchard', 'tu-obs-orchard-1', 'tu-obs-orchard-2']);
    g.setFlag('pdraft:tu-trail-orchard', JSON.stringify({ gate: { to: 'nest' } }));
    applyEffects(['journal:tu-obs-orchard-1', 'journal:tu-obs-orchard-2'], g);
    const before = { ...g.state, location: { scene: 'dogwalk', x: 900 } };
    const saves = createSaveManager({ storage: memoryStorage({ [SAVE_KEY]: JSON.stringify(before) }) });
    const back = createGame({ saveManager: saves, initial: saves.load().state });
    syncMissions(back);
    for (const [k, v] of Object.entries(before.flags)) expect(back.state.flags[k], k).toEqual(v);
    expect(back.state.location).toEqual(before.location);
    expect(missionState(walk, back)).toMatchObject({ status: 'active', step: 1 });
    expect(RULES.logicgrid.draft.load(PUZZLES_TEAM['tu-trail-orchard'].config, back.flag('pdraft:tu-trail-orchard'), RULES.logicgrid.init()).cells).toEqual({ gate: { to: 'nest' } });
    expect(back.flag(HUSKY_FLAG)).toBe('لولو');
  });

  it('no wedding content in Team Us (a future milestone)', () => {
    const text = JSON.stringify([Object.entries(DIALOGUE).filter(([k]) => k.startsWith('tu.')), Object.entries(JOURNAL).filter(([k]) => k.startsWith('tu-')), MISSIONS_TEAM, PUZZLES_TEAM]);
    expect(text).not.toMatch(/زفاف|عرس|نتزوج|تتزوج|زواج|خطوبة|wedding|marri|bride/i);
  });
});

/* ── through the real app ─────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 5000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await wait(10);
  }
  throw new Error('timed out');
}
const $ = (sel) => root.querySelector(sel);

describe('in the app', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('the map shows the walk as a shared place once planned; the grid keeps a draft after closing', async () => {
    const g = finished();
    g.setFlags(['notice:team', 'tu-walk-plan', 'tu-route-river', ...OBS('river')]);
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'dogwalk', x: 300 } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    app.ui.openMap();
    await until(() => $('.map-node[data-world="dogwalk"]'));
    const node = $('.map-node[data-world="dogwalk"]');
    expect(node.classList.contains('is-together')).toBe(true);
    expect(node.classList.contains('is-open')).toBe(true);
    expect(node.getAttribute('aria-label')).toMatch(/نشاط سوا/);
    app.overlays.closeAll();
    app.ui.puzzle('tu-trail-river');
    await until(() => $('.puzzle .lg-cell'));
    $('.puzzle .lg-cell').click();
    await until(() => app.game.flag('pdraft:tu-trail-river'));
    app.overlays.closeAll();
    app.ui.puzzle('tu-trail-river');
    await until(() => $('.puzzle .lg-cell'));
    expect($('.puzzle .lg-cell').textContent.trim()).not.toBe('');
  });
});
