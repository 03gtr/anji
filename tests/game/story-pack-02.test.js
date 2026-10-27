/**
 * Story Pack 02 «أرشيف الأسرار» + the mission list / map overhaul:
 * where the pack sits in the main story (before the ending), gradual unlocks,
 * the Act VII gate and its grandfathering, puzzle fairness and wrong answers,
 * stage resume, journal numbering / filters / statuses, map focus, and save
 * preservation for mid-story, finished and side-mission saves (test saves).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager, SAVE_KEY, SAVE_VERSION, defaultState } from '../../src/game/core/save.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { journalEntries, filterEntries, displayNo, POST_GAME } from '../../src/game/progression/journal-index.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { MISSIONS_SP2, SP2_GATE, PACKS_SP2 } from '../../src/game/data/missions-sp2.js';
import { WORLDS, worldById } from '../../src/game/data/worlds.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { ACTS, currentObjective } from '../../src/game/data/chapters.js';
import { RULES, solve, replay, runProgram } from '../../src/game/puzzles/rules.js';
import { dueNotice } from '../../src/game/ui/content-notice.js';
import { mapPath } from '../../src/game/ui/menus.js';
import { memoryStorage } from '../helpers.js';

const sp2 = (id) => MISSIONS_SP2.find((m) => m.id === id);
const game = (flags = {}, extra = {}) => createGame({ saveManager: null, initial: { ...defaultState(), ...extra, flags: { ...flags } } });

/** Flags that satisfy every objective of acts 1..n (record/item objectives too), plus each act's end flag. */
function throughAct(n, g) {
  for (const act of ACTS.filter((a) => a.act <= n)) {
    g.setFlag(`act${act.act}-done`);
    for (const o of act.objectives) {
      for (const a of atoms(o.done)) {
        const [kind, ...rest] = a.split(':');
        const id = rest.join(':');
        if (kind === 'flag') g.setFlag(id);
        else if (kind === 'record') g.recordResult(id, { completed: true });
        else if (kind === 'item') g.addItem(id);
      }
    }
  }
  return g;
}

const MAIN_SP2 = ['flag:sp2-entered', 'flag:sp2-ledger-read', 'flag:sp2-clue-a', 'flag:sp2-clue-b', 'flag:sp2-clue-c', 'flag:sp2-deduced', 'flag:sp2-archives-done', 'flag:sp2-inner-open', 'flag:sp2-maze-done', 'flag:sp2-letter-1', 'flag:sp2-letter-2', 'flag:sp2-letter-3', 'flag:sp2-letters-ordered', 'flag:sp2-letters-done', 'flag:sp2-plan-studied', 'flag:sp2-done'].map((f) => f.slice(5));

describe('Story Pack 02 sits inside the main story, before the ending', () => {
  it('no Story Pack 02 mission depends on the ending (the husky can now be met before it)', () => {
    for (const m of MISSIONS_SP2) expect(JSON.stringify([m.unlock, m.steps.map((s) => s.done)]), m.id).not.toMatch(/game-complete/);
    // the trail needs the husky: met at the sanctuary (pre-ending) or in Story Pack 01
    expect(JSON.stringify(sp2('sp2-trail').unlock)).toMatch(/sp2-husky-early/);
  });

  it('nothing opens before Act IV; then only the first mission; the rest open one by one', () => {
    const g = game();
    for (const m of MISSIONS_SP2) expect(missionState(m, g).status, m.id).toBe('locked');
    throughAct(4, g);
    expect(MISSIONS_SP2.filter((m) => missionState(m, g).status !== 'locked').map((m) => m.id)).toEqual(['sp2-archives']);
    g.setFlags(['sp2-entered', 'sp2-ledger-read', 'sp2-clue-a', 'sp2-clue-b', 'sp2-clue-c', 'sp2-deduced', 'sp2-archives-done']);
    expect(missionState(sp2('sp2-maze'), g).status).toBe('active');
    expect(missionState(sp2('sp2-sequence'), g).status).toBe('locked'); // needs the inner door
    g.setFlags(['sp2-inner-open', 'sp2-maze-done']);
    expect(missionState(sp2('sp2-sequence'), g).status).not.toBe('locked');
    expect(missionState(sp2('sp2-letters'), g).status).toBe('locked'); // also needs Act V
    throughAct(5, g);
    expect(missionState(sp2('sp2-letters'), g).status).toBe('active');
    expect(missionState(sp2('sp2-gate'), g).status).toBe('locked');
  });

  it('every place the required missions need is open on the map by the time they open', () => {
    const g = throughAct(4, game());
    expect(check(worldById('archives').unlock, g)).toBe(true);
    for (const w of ['house', 'academy', 'sanctuary', 'observatory']) expect(check(worldById(w).unlock, g), w).toBe(true);
    throughAct(5, g);
    for (const w of ['library', 'lake']) expect(check(worldById(w).unlock, g), w).toBe(true);
  });

  it('Act VII (the workshop) needs the archive seals; the optional puzzles are not needed', () => {
    const g = throughAct(6, game());
    g.setFlag('workshop-open'); // set with act6-done by the lake scene
    g.setFlag('sp2-done', false);
    g.setFlag('workshop-entered', false);
    expect(check(worldById('workshop').unlock, g)).toBe(false);
    const stairs = SCENES.house.interact.find((i) => i.id === 'stairs');
    expect(stairs.cases.find((c) => check(c.if, g)).run).toEqual([{ say: 'sp2.stairs-sealed' }]);
    expect(currentObjective(g)).toMatchObject({ act: 6 });
    for (const f of MAIN_SP2) g.setFlag(f);
    expect(g.flag('sp2-sequence-done')).toBeUndefined();
    expect(check(worldById('workshop').unlock, g)).toBe(true);
    expect(stairs.cases.find((c) => check(c.if, g)).run[0]).toMatchObject({ goto: 'workshop' });
    expect(currentObjective(g).act).toBe(7);
  });

  it('the HUD points at the next archive step while the seals are unlit', () => {
    const g = throughAct(6, game());
    g.setFlag('sp2-done', false);
    g.setFlag('workshop-entered', false);
    expect(currentObjective(g)).toEqual({ act: 6, title: ACTS[5].title, text: sp2('sp2-archives').steps[0].text });
  });

  it('nothing is undone for saves already past it: workshop, finale and the ending stay open', () => {
    const mid7 = game({ 'act6-done': true, 'workshop-open': true, 'workshop-entered': true });
    expect(check(worldById('workshop').unlock, mid7)).toBe(true);
    const done = throughAct(8, game());
    for (const k of ['sp2-done', 'sp2-plan-studied']) done.setFlag(k, false);
    expect(check(worldById('workshop').unlock, done)).toBe(true);
    expect(check(worldById('final').unlock, done)).toBe(true);
    expect(done.flag('game-complete')).toBe(true);
    // the act list still reads as finished
    expect(ACTS.every((a) => a.objectives.every((o) => check(o.done, done)))).toBe(true);
  });

  it('the pack announces itself once Act IV is done (only if it really loaded)', () => {
    const g = throughAct(4, game());
    expect(dueNotice(g, 'garden')?.id).toBe(PACKS_SP2[0].id);
    expect(dueNotice(game(), 'garden')).toBeNull();
  });
});

describe('puzzles: fair, verifiable, forgiving', () => {
  it('every Story Pack 02 puzzle is solvable from its start', () => {
    for (const id of Object.keys(PUZZLES).filter((k) => k.startsWith('sp2-'))) {
      const p = PUZZLES[id];
      const moves = solve(p.type, p.config);
      expect(moves?.length, id).toBeGreaterThan(0);
      expect(replay(p.type, p.config, moves).outcome, id).toBe('solved');
      expect(p.hints.length, id).toBe(3);
      expect(p.success, id).toBeTruthy();
    }
  });

  it('the ledger needs all three clues: any two leave more than one place', () => {
    // what the four places are like (shown on the puzzle cards)
    const places = { lake: { water: true, sky: true, roses: false }, garage: { water: false, sky: false, roses: false }, observatory: { water: false, sky: true, roses: false }, conservatory: { water: false, sky: true, roses: true } };
    const rules = { water: (p) => !p.water, sky: (p) => p.sky, roses: (p) => !p.roses };
    const left = (clues) => Object.keys(places).filter((k) => clues.every((c) => rules[c](places[k])));
    expect(left(['water', 'sky', 'roses'])).toEqual(['observatory']);
    for (const pair of [['water', 'sky'], ['water', 'roses'], ['sky', 'roses']]) expect(left(pair).length, pair.join('+')).toBeGreaterThan(1);
    const { config } = PUZZLES['sp2-ledger'];
    expect(config.need).toBe(3);
    expect(config.answer).toEqual({ suspect: 'observatory', evidence: ['water', 'sky', 'roses'] });
    // an opinion is not evidence
    const s = ['pickSuspect', 'toggleEvidence', 'toggleEvidence', 'toggleEvidence'];
    let st = RULES.deduction.init(config);
    for (const [a, arg] of [[s[0], 'observatory'], [s[1], 'water'], [s[2], 'sky'], [s[3], 'opinion']]) st = RULES.deduction[a](config, st, arg).state;
    expect(RULES.deduction.submit(config, st).outcome).toBe('wrong');
  });

  it('maze: a door without its key is a bump (with its own message), not a soft-lock', () => {
    const { config } = PUZZLES['sp2-shifting-maze'];
    const res = runProgram({ grid: ['.K.B'], start: { x: 0, y: 0, dir: 0 }, max: 4 }, ['F']);
    expect(res).toMatchObject({ ok: false, crash: true, door: true });
    const locked = { ...config, stages: [{ grid: ['.K.B'], start: { x: 0, y: 0, dir: 0 }, max: 4 }] };
    const wrong = RULES.program.run(locked, { ...RULES.program.init(), prog: ['F'] });
    expect(wrong.outcome).toBe('wrong');
    expect(wrong.message).toMatch(/الباب مقفول/);
    // level 1 teaches the idea in a straight line (the key lies on the way); later levels need planning
    expect(runProgram(config.stages[0], ['F', 'F', 'F', 'F']).ok).toBe(true);
    for (const st of config.stages.slice(1)) expect(runProgram(st, Array(st.max).fill('F')).ok).toBe(false);
  });

  it('sequence machine: wrong picks count and can be retried; the last level alternates two rules', () => {
    const { config } = PUZZLES['sp2-sequence'];
    let st = RULES.series.init(config);
    const w = RULES.series.pick(config, st, 12);
    expect(w.outcome).toBe('wrong');
    expect(RULES.series.pick(config, w.state, 12).outcome).toBe('noop'); // same wrong pick is not counted twice
    st = RULES.series.pick(config, w.state, 11).state;
    expect(st.stage).toBe(1);
    const last = config.stages[3];
    const alt = (start, n) => Array.from({ length: n }, (_, i) => i).reduce((acc, i) => [...acc, i % 2 ? acc[i] * 2 : acc[i] + 2], [start]);
    expect(alt(3, 4)).toEqual([...last.question.slice(0, 4), last.answer]);
    for (const ex of last.examples) expect(alt(ex[0], ex.length - 1)).toEqual(ex);
  });

  it('letters: one order only, and facts are kept apart from guesses', () => {
    const order = PUZZLES['sp2-letters-order'].config;
    const bad = { placed: { t1: 'lens', t2: 'seed', t3: 'stars', t4: 'plan' }, sel: null, mistakes: 0 };
    expect(RULES.arrange.check(order, bad).outcome).toBe('wrong');
    const facts = PUZZLES['sp2-letters-facts'].config;
    const mixed = { placed: { f1: 'f-before', f2: 'i-day', i1: 'f-plan', i2: 'i-tomorrow' }, sel: null, mistakes: 0 };
    expect(RULES.arrange.check(facts, mixed).outcome).toBe('wrong');
  });
});

describe('journal: numbering, filters, statuses, the current entry', () => {
  it('acts are main chapters; display numbers are chapter-based and stable', () => {
    const e = journalEntries(game());
    const byId = Object.fromEntries(e.map((x) => [x.id, x]));
    for (const a of ACTS) expect(displayNo(byId[`act:${a.act}`])).toBe(`الفصل ${a.act}`);
    expect(displayNo(byId['sp2-archives'])).toBe('5·2'); // after «تحدي الإطلالة» (also chapter 5)
    expect(displayNo(byId['sp2-gate'])).toBe('6·4');
    expect(displayNo(byId['sp1-two-roads'])).toMatch(/^✦/);
    // ids are unchanged and unique
    expect(new Set(e.map((x) => x.id)).size).toBe(e.length);
    expect(e.filter((x) => !x.id.startsWith('act:')).map((x) => x.id).sort()).toEqual(MISSIONS.map((m) => m.id).sort());
  });

  it('display numbers of older missions do not move when the pack is added', () => {
    const byId = Object.fromEntries(journalEntries(game()).map((x) => [x.id, displayNo(x)]));
    expect(byId['unfinished-build']).toBe('2·1');
    expect(byId['missing-recipe']).toBe('2·3');
    expect(byId['lost-kitten']).toBe('4·1');
  });

  it('filters: main / side / puzzles / completed', () => {
    const g = throughAct(5, game());
    g.setFlags(['mission:unfinished-build']);
    const e = journalEntries(g);
    expect(filterEntries(e, 'main').every((x) => x.category === 'main')).toBe(true);
    // finished entries live only under «المكتملة»; the other filters list what is ahead
    expect(filterEntries(e, 'main').some((x) => x.id === 'act:6')).toBe(true);
    expect(filterEntries(e, 'main').some((x) => x.id === 'act:1')).toBe(false);
    expect(filterEntries(e, 'done').some((x) => x.id === 'act:1')).toBe(true);
    expect(filterEntries(e, 'puzzle').map((x) => x.id)).toEqual(expect.arrayContaining(['sp2-sequence', 'detective-exam', 'wardrobe-challenge']));
    expect(filterEntries(e, 'side').every((x) => x.category === 'side')).toBe(true);
    expect(filterEntries(e, 'done').every((x) => x.status === 'complete')).toBe(true);
    expect(filterEntries(e, 'done').some((x) => x.id === 'unfinished-build')).toBe(true);
    expect(filterEntries(e, 'all')).toHaveLength(e.filter((x) => x.status !== 'complete').length);
  });

  it('statuses: locked, available, active, complete — and exactly one current entry', () => {
    const g = throughAct(4, game());
    let e = Object.fromEntries(journalEntries(g).map((x) => [x.id, x]));
    expect(e['sp2-archives'].status).toBe('available');
    expect(e['sp2-maze'].status).toBe('locked');
    expect(e['sp2-maze'].locked).toMatch(/مفتاح/);
    expect(e['act:4'].status).toBe('complete');
    expect(e['act:5'].isCurrent).toBe(true);
    g.setFlag('sp2-entered');
    e = Object.fromEntries(journalEntries(g).map((x) => [x.id, x]));
    expect(e['sp2-archives'].status).toBe('active');
    expect(e['sp2-archives'].worlds).toEqual(['archives']);
    expect(journalEntries(g).filter((x) => x.isCurrent)).toHaveLength(1);
    expect(journalEntries(g)[0].isCurrent).toBe(true); // the current one is listed first
  });

  it('while the seals block Act VII, the archive mission is the current entry', () => {
    const g = throughAct(6, game());
    g.setFlag('sp2-done', false);
    g.setFlag('workshop-entered', false);
    expect(journalEntries(g).find((x) => x.isCurrent).id).toBe('sp2-archives');
  });

  it('far-future locked entries keep their secrets; locked text never gives a solution', () => {
    const e = journalEntries(game());
    expect(e.find((x) => x.id === 'sp1-two-roads').hidden).toBe(true);
    expect(e.find((x) => x.id === 'act:8').hidden).toBe(true);
    for (const x of e.filter((y) => y.status === 'locked')) expect(x.locked).toBeTruthy();
    expect(JSON.stringify(e.map((x) => x.locked))).not.toMatch(/المرصد|وعد|٢٤/);
  });

  it('map paths connect the current place to the mission place', () => {
    expect(mapPath('garden', 'archives').length).toBeGreaterThan(0);
    const path = mapPath('garden', 'archives');
    expect(path[0][0]).toBe('garden');
    expect(path[path.length - 1][1]).toBe('archives');
    expect(mapPath('garden', 'garden')).toEqual([]);
  });

  it('every mission place exists on the map', () => {
    for (const x of journalEntries(game())) for (const w of x.worlds) expect(worldById(w), `${x.id} → ${w}`).toBeTruthy();
  });
});

/* ── saves (constructed test saves — never a real player's save) ── */
function save(flags, extra = {}) {
  const s = defaultState(1_700_000_000_000);
  Object.assign(s, { flags, inventory: { treat: 2 }, collected: ['star.garden.1'], journal: ['snooki'], records: { 'game:maze': { plays: 3, best: 70, medal: 'silver', completed: true } }, location: { scene: 'house', x: 900 } }, extra);
  return s;
}
const strip = ({ updatedAt, ...rest }) => rest;

describe('save compatibility (mid-story, finished, side missions done)', () => {
  const finished = () => {
    const g = throughAct(8, game());
    return save({ ...g.state.flags }, { records: { ...g.state.records, 'game:maze': { plays: 3, best: 70, medal: 'silver', completed: true } }, inventory: { ...g.state.inventory, treat: 2 } });
  };
  const cases = {
    'mid-story (Act III)': () => save({ 'intro-done': true, 'map-open': true, 'act1-done': true, 'house-entered': true, 'garage-open': true }),
    finished,
    'side missions done': () => save({ 'act1-done': true, 'study-done': true, 'clock-seen': true, 'build-seen': true, 'build-fixed': true, 'symbols-seen': true, 'drawer-open': true, 'mission:unfinished-build': true, 'mission-seen:unfinished-build': true }, { inventory: { 'shelf-key': 1 }, journal: ['build-message'] }),
  };

  it('the save version is unchanged', () => expect(SAVE_VERSION).toBe(3));

  for (const [name, make] of Object.entries(cases)) {
    it(`${name}: loads unchanged, and reloads idempotently`, () => {
      const before = make();
      const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(before) });
      const saves = createSaveManager({ storage });
      const a = saves.load().state;
      expect(strip(a)).toEqual(strip(before));
      saves.save(a);
      expect(strip(saves.load().state)).toEqual(strip(before));
    });

    it(`${name}: syncing missions only adds, and never pays a reward twice`, () => {
      const before = make();
      const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(before) });
      const saves = createSaveManager({ storage });
      let g = createGame({ saveManager: saves, initial: saves.load().state });
      syncMissions(g);
      const items = { ...g.state.inventory };
      const unlocks = [...g.state.unlocks];
      for (const [k, v] of Object.entries(before.flags)) expect(g.state.flags[k], k).toEqual(v);
      g = createGame({ saveManager: saves, initial: saves.load().state });
      expect(syncMissions(g).completed).toEqual([]);
      expect(g.state.inventory).toEqual(items);
      expect(g.state.unlocks).toEqual(unlocks);
    });
  }

  it('a finished game keeps its ending; Story Pack 01 is unaffected', () => {
    const g = createGame({ saveManager: null, initial: finished() });
    expect(g.flag('game-complete')).toBe(true);
    expect(missionState(MISSIONS.find((m) => m.id === 'sp1-two-roads'), g).status).toBe('active');
    expect(currentObjective(g).act).toBeNull();
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
const $$ = (sel) => [...root.querySelectorAll(sel)];

describe('the journal and map in the app', () => {
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

  function start(flags) {
    const g = throughAct(6, game());
    for (const [k, v] of Object.entries(flags)) g.setFlag(k, v);
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'garden', x: 300 } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
  }

  it('filters, numbers, the current marker and the way to the map', async () => {
    start({ 'sp2-done': false, 'workshop-entered': false, 'notice:sp2': true });
    await app.toTitle();
    app.ui.openJournal('missions');
    await until(() => $('.chips'));
    expect($$('.chip').map((c) => c.dataset.filter)).toEqual(['all', 'main', 'side', 'puzzle', 'done']);
    const current = $('.mission.is-current');
    expect(current.dataset.mission).toBe('sp2-archives');
    expect(current.getAttribute('aria-current')).toBe('step');
    expect(current.querySelector('.mission-no').textContent).toMatch(/٥·٢|5·2/);
    $('.chip[data-filter="puzzle"]').click();
    await until(() => $('.chip.is-on')?.dataset.filter === 'puzzle');
    expect($$('.mission').every((m) => m.classList.contains('cat-puzzle'))).toBe(true);
    $('.chip[data-filter="main"]').click();
    await until(() => $('.chip.is-on')?.dataset.filter === 'main');
    $('.mission.is-current [data-mapfocus]').click();
    const target = await until(() => $('.map-node.is-target'));
    expect(target.dataset.world).toBe('archives');
    expect($('.map-focus').textContent).toMatch(/للبدء|الخطوة الجاية/);
    expect($$('.route.is-path').length).toBeGreaterThan(0);
    expect($('.map-focus [data-go]')).toBeTruthy();
  });

  it('a multi-stage puzzle resumes at the stage she reached, and forgets it once solved', async () => {
    start({ 'notice:sp2': true });
    await app.toTitle();
    let done = app.ui.puzzle('sp2-sequence');
    await until(() => $('.puzzle-series'));
    $('[data-v="11"]').click();
    await until(() => app.game.flag('pstage:sp2-sequence') === 1);
    $('.puzzle [data-act="close"]').click();
    await done;
    done = app.ui.puzzle('sp2-sequence');
    await until(() => $('.puzzle-series'));
    expect($('.puzzle-feedback').textContent).toMatch(/رجعتي للمستوى/);
    for (const v of ['40', 'sym:moon-crescent', '24']) {
      (await until(() => $(`[data-v="${v}"]`))).click();
      await wait(5);
    }
    await until(() => app.game.flag('sp2-sequence-done'));
    expect(app.game.flag('pstage:sp2-sequence')).toBeUndefined();
    $('.puzzle .btn-big').click();
    await done;
  });
});
