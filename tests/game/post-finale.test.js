/**
 * Phase 05: «الحديقة العميقة» is a continuation AFTER the published ending, never a condition
 * of it. One synthetic save per story state (never a real player's save): a new game, the live
 * site's finished game, a game in progress, one inside the finale, a named husky, a Phase 04
 * preview save already inside the deep garden, and one that finished it. Also: the returning-
 * player notice, the planting epilogue (once), and that no wedding content ships.
 */
import { describe, it, expect } from 'vitest';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager, SAVE_KEY, SAVE_VERSION, defaultState } from '../../src/game/core/save.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { journalEntries } from '../../src/game/progression/journal-index.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { MISSIONS_DEEP, DEEP_OPEN, DEEP_UNLOCK, PACKS_DEEP } from '../../src/game/data/missions-deep.js';
import { SP2_FINAL_GATE } from '../../src/game/data/missions-sp2.js';
import { WORLDS, worldById, regionOf } from '../../src/game/data/worlds.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DEEP_SCENES, DEEP_EXTRAS } from '../../src/game/data/scenes/deep.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { JOURNAL } from '../../src/game/data/items.js';
import { ACTS, currentObjective } from '../../src/game/data/chapters.js';
import { dueNotice } from '../../src/game/ui/content-notice.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

const game = (flags = {}) => createGame({ saveManager: null, initial: { ...defaultState(), flags: { ...flags } } });
const mission = (id) => MISSIONS.find((m) => m.id === id);
const DEEP = WORLDS.filter((w) => regionOf(w) === 'deep');
const openDeep = (g) => DEEP.filter((w) => check(w.unlock, g)).map((w) => w.id);
const interact = (scene, id) => SCENES[scene].interact.find((i) => i.id === id);
const visible = (scene, id, g) => check(interact(scene, id).if ?? true, g);
const meet = SCENES.final.triggers.find((t) => t.id === 'meet');
/** What the ending's last line does (the published `a8.ending` effects). */
const ENDING_FX = DIALOGUE['a8.ending'].find((l) => l.do).do;

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
const SP2_CORE = ['sp2-entered', 'sp2-ledger-read', 'sp2-clue-a', 'sp2-clue-b', 'sp2-clue-c', 'sp2-deduced', 'sp2-archives-done', 'sp2-inner-open', 'sp2-maze-done', 'sp2-letter-1', 'sp2-letter-2', 'sp2-letter-3', 'sp2-letters-ordered', 'sp2-letters-done', 'sp2-plan-studied', 'sp2-done'];
const MAP = ['sp2-final-read', 'sp2-insc-1', 'sp2-insc-2', 'sp2-insc-3', 'sp2-final-rule', 'sp2-final-done'];
/** The deep chain in a valid play order. */
const CHAIN = ['dg-box', 'dg-guestbook', 'dg-clock-1', 'dg-clock-2', 'dg-clock-3', 'dg-clock-4', 'dg-letters-read', 'dg-bed', 'dg-log', 'dg-testimony', 'dg-timeline', 'dg-trails', 'dg-pot', 'dg-hypo', 'dg-pattern', 'dg-wheel', 'dg-mirror', 'dg-roots-maze', 'dg-note-water', 'dg-hedge', 'dg-bridge', 'dg-awake', 'dg-done'];

/** A finished game as the LIVE site (main, Story Pack 01) leaves it: no Story Pack 02, no deep garden. */
function liveFinished() {
  const g = throughAct(8, game());
  g.setFlags(['intro-done', 'map-open', 'workshop-entered', 'final-entered', 'rose-planted', 'ending-growing', 'notice:sp1']);
  g.addJournal('ending');
  return g;
}

/** Walk every action list in a scene definition (runs, cases, then/else). */
function actions(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => actions(n, out));
  else if (node && typeof node === 'object') {
    if (node.say || node.fx || node.askName || node.goto || node.puzzle) out.push(node);
    for (const k of ['run', 'cases', 'then', 'else', 'interact', 'triggers']) if (node[k]) actions(node[k], out);
  }
  return out;
}

describe('a new save: the original ending, then the continuation', () => {
  it('the hidden garden opens by its own path («خريطة الغد»), with no deep garden flag anywhere on the way', () => {
    const g = throughAct(6, game());
    g.setFlags([...SP2_CORE, 'workshop-entered', 'wk-stage1', 'wk-stage2', 'act7-done']);
    expect(check(worldById('final').unlock, g)).toBe(false);
    g.setFlags(MAP);
    expect(check(worldById('final').unlock, g)).toBe(true);
    expect(check(meet.if, g)).toBe(true); // the ending scene will play
    expect(currentObjective(g)).toEqual({ act: 8, title: ACTS[7].title, text: ACTS[7].objectives[0].text });
    expect(Object.keys(g.state.flags).filter((f) => f.startsWith('dg-'))).toEqual([]);
    expect(missionState(mission('dg-night'), g).status).toBe('locked');
    expect(openDeep(g)).toEqual([]);
    for (const a of [SP2_FINAL_GATE, worldById('final').unlock, ...ACTS.flatMap((x) => x.objectives.map((o) => o.done))]) expect(JSON.stringify(a)).not.toMatch(/dg-/);
  });

  it('once the ending has played, the deep garden is offered (a notice, Ryan, the box) but nothing is done for her', () => {
    const g = throughAct(7, game());
    g.setFlags([...SP2_CORE, ...MAP, 'workshop-entered', 'final-entered', 'rose-planted', 'notice:sp2', 'notice:sp1']);
    expect(dueNotice(g, 'garden')).toBeNull();
    applyEffects(ENDING_FX, g);
    expect(g.flag('game-complete')).toBe(true);
    expect(check(meet.if, g)).toBe(false); // the ending never replays
    expect(missionState(mission('dg-night'), g)).toMatchObject({ status: 'active', step: 0 });
    expect(dueNotice(g, 'garden')?.id).toBe(PACKS_DEEP[0].id);
    expect(dueNotice(g, 'workshop')?.id ?? null).not.toBe('deep'); // not while she is already there
    expect(visible('workshop', 'dg-seedbox', g)).toBe(true);
    const hook = DIALOGUE['a8.ryan-idle'].find((l) => /علبة/.test(l.t));
    expect(check(hook.if, g)).toBe(true);
    g.setFlag('notice:deep');
    // once; (Team Us adds its own notice after this one, also after the ending)
    expect(dueNotice(g, 'garden')?.id ?? null).not.toBe('deep');
    for (const m of MISSIONS_DEEP) expect(missionState(m, g).status, m.id).not.toBe('complete');
  });
});

describe('the live finished game (synthetic, shaped like the published version)', () => {
  it('loads unchanged, keeps its ending, Acts VII–VIII stay done, and opens the deep garden with no Story Pack 02', () => {
    const before = { ...liveFinished().state, location: { scene: 'final', x: 900 } };
    const saves = createSaveManager({ storage: memoryStorage({ [SAVE_KEY]: JSON.stringify(before) }) });
    const g = createGame({ saveManager: saves, initial: saves.load().state });
    expect(SAVE_VERSION).toBe(3);
    syncMissions(g);
    for (const [k, v] of Object.entries(before.flags)) expect(g.state.flags[k], k).toEqual(v);
    expect(g.state.journal).toEqual(expect.arrayContaining(before.journal));
    expect(g.state.location).toEqual(before.location);
    expect(check(worldById('final').unlock, g)).toBe(true);
    for (const a of ACTS.filter((x) => x.act >= 7)) expect(a.objectives.every((o) => check(o.done, g)), `act ${a.act}`).toBe(true);
    expect(journalEntries(g).filter((e) => e.id.startsWith('act:')).every((e) => e.status === 'complete')).toBe(true);
    expect(missionState(mission('dg-night'), g).status).not.toBe('locked');
    expect(g.flag('sp2-final-done')).toBeFalsy(); // no Story Pack 02 shortcut was taken
    g.setFlag('dg-box');
    expect(openDeep(g).sort()).toEqual(['clockgarden', 'falsetrails', 'letterhall', 'sealedroom']);
  });

  it('plays the whole chain, plants the second rose with Ryan once, and nothing is paid twice', () => {
    const g = liveFinished();
    for (const f of CHAIN) {
      g.setFlag(f);
      syncMissions(g);
    }
    const seed = mission('dg-seed');
    expect(missionState(seed, g)).toMatchObject({ status: 'active', step: 2 });
    // (the HUD points at Story Pack 01 first while that is unplayed; the journal entry still leads here)
    expect(journalEntries(g).find((e) => e.id === 'dg-seed')).toMatchObject({ status: 'active', next: seed.steps[2].text, worlds: ['final'] });
    // the epilogue is offered once, in the hidden garden, next to the first rose
    expect(visible('final', 'dg-second-rose', g)).toBe(true);
    expect(visible('final', 'dg-rose-2', g)).toBe(false);
    for (const fx of interact('final', 'dg-second-rose').run.filter((a) => a.fx)) applyEffects(fx.fx, g);
    expect(syncMissions(g).completed.map((m) => m.id)).toEqual(['dg-seed']);
    expect(visible('final', 'dg-second-rose', g)).toBe(false);
    expect(visible('final', 'dg-rose-2', g)).toBe(true);
    expect(g.state.journal).toContain('dg-planted');
    const snapshot = JSON.stringify(g.state);
    expect(syncMissions(g).completed).toEqual([]);
    expect(JSON.stringify(g.state)).toBe(snapshot);
    // the ending itself was never touched
    for (const f of ['game-complete', 'final-entered', 'rose-planted', 'act8-done', 'ending-growing']) expect(g.flag(f), f).toBe(true);
    // the box in the workshop no longer starts anything
    const box = interact('workshop', 'dg-seedbox');
    expect(box.cases.find((c) => check(c.if, g)).run).toEqual([{ say: 'dg.box-done' }]);
  });
});

describe('saves in progress', () => {
  it('a save mid-story (Act V, Story Pack 02 half done, a puzzle stage kept) continues exactly where it was', () => {
    const g = throughAct(4, game());
    g.setFlags(['sp2-entered', 'sp2-ledger-read', 'sp2-clue-a', 'pstage:sp2-maze', 'library-open']);
    g.setFlag('pstage:sp2-maze', 2);
    const before = JSON.stringify(g.state);
    const obj = currentObjective(g);
    expect(obj.act).toBe(5);
    expect(missionState(mission('dg-night'), g).status).toBe('locked');
    expect(openDeep(g)).toEqual([]);
    expect(dueNotice(g, 'garden')?.id).not.toBe('deep');
    syncMissions(g);
    expect(g.flag('pstage:sp2-maze')).toBe(2);
    expect(currentObjective(g)).toEqual(obj);
    expect(Object.keys(JSON.parse(before).flags).every((k) => k in g.state.flags)).toBe(true);
  });

  it('a save inside the finale (entered, not finished) keeps that distinction: the ending still plays, the deep garden waits', () => {
    const g = throughAct(7, game());
    g.setFlags([...SP2_CORE, ...MAP, 'workshop-entered', 'final-entered']);
    expect(g.flag('game-complete')).toBeFalsy();
    expect(check(worldById('final').unlock, g)).toBe(true);
    expect(check(meet.if, g)).toBe(true);
    expect(currentObjective(g)).toEqual({ act: 8, title: ACTS[7].title, text: ACTS[7].objectives[1].text });
    expect(missionState(mission('dg-night'), g).status).toBe('locked');
    expect(visible('workshop', 'dg-seedbox', g)).toBe(false);
    expect(visible('final', 'dg-second-rose', g)).toBe(false);
  });

  it('a live save that entered the finale before Story Pack 02 existed is not sent back for «خريطة الغد»', () => {
    const g = throughAct(7, game());
    g.setFlags(['workshop-entered', 'final-entered']);
    expect(check(worldById('final').unlock, g)).toBe(true);
    expect(check(meet.if, g)).toBe(true);
  });

  it('a Phase 04 preview save already inside the deep garden before its ending is not shut out, and keeps its steps', () => {
    const g = throughAct(7, game());
    g.setFlags([...SP2_CORE, ...MAP, 'workshop-entered', 'dg-box', 'dg-guestbook', 'dg-clock-1', 'dg-clock-2']);
    g.setFlag('pdraft:dg-testimony', '{"claims":[0]}');
    expect(check(DEEP_UNLOCK, g)).toBe(true);
    expect(check(DEEP_OPEN, g)).toBe(true);
    expect(openDeep(g).length).toBe(4);
    expect(missionState(mission('dg-night'), g)).toMatchObject({ status: 'active', step: 1 });
    expect(check(worldById('final').unlock, g)).toBe(true); // and the ending is reachable as before
    expect(g.flag('pdraft:dg-testimony')).toBe('{"claims":[0]}');
    expect(visible('final', 'dg-second-rose', g)).toBe(false); // the epilogue comes after the ending
  });

  it('a preview save that finished the deep garden keeps its completed missions and is offered the epilogue after the ending', () => {
    const g = liveFinished();
    g.setFlags(CHAIN);
    g.setFlags(['mission:dg-night', 'mission:dg-trails', 'mission:dg-stars', 'mission:dg-roots', 'mission:dg-seed']);
    for (const id of ['dg-night', 'dg-trails', 'dg-stars', 'dg-roots', 'dg-seed']) expect(missionState(mission(id), g).status, id).toBe('complete');
    expect(visible('final', 'dg-second-rose', g)).toBe(true);
  });
});

describe('characters and one-time events', () => {
  it('a named husky keeps her name: nothing in the deep garden or its epilogue asks for it or writes it', () => {
    const g = liveFinished();
    g.setFlags(['sp1-husky-met']);
    g.setFlag(HUSKY_FLAG, 'لولو');
    const all = [...actions(DEEP_SCENES), ...actions(Object.values(DEEP_EXTRAS))];
    expect(all.length).toBeGreaterThan(50);
    expect(all.filter((a) => a.askName)).toEqual([]);
    for (const a of all.filter((x) => x.fx)) expect(JSON.stringify(a.fx)).not.toMatch(/husky-name/);
    for (const f of CHAIN.concat('dg-planted')) applyEffects([`flag:${f}`], g);
    syncMissions(g);
    expect(g.flag(HUSKY_FLAG)).toBe('لولو');
  });

  it('every one-time beat in the epilogue and the box is guarded by its own result flag', () => {
    const plant = interact('final', 'dg-second-rose');
    expect(JSON.stringify(plant.if)).toMatch(/!flag:dg-planted/);
    expect(plant.run.some((a) => a.fx?.includes('flag:dg-planted'))).toBe(true);
    const box = interact('workshop', 'dg-seedbox');
    const first = box.cases[0];
    expect(first.if).toBe('!flag:dg-box');
    expect(first.run.some((a) => a.fx?.includes('flag:dg-box'))).toBe(true);
    for (const key of ['dg.plant-intro', 'dg.plant', 'dg.plant-done', 'dg.rose-2']) expect(DIALOGUE[key], key).toBeTruthy();
    expect(JOURNAL['dg-planted']).toBeTruthy();
  });
});

describe('the wedding stays a future milestone', () => {
  it('no wedding scene, vow, date or marriage flag ships; the published promise is still there', () => {
    const text = JSON.stringify([DIALOGUE, JOURNAL, MISSIONS, ACTS]);
    // «أزواج» (pairs, in the memory game) is not about marriage, so it is excluded
    expect(text).not.toMatch(/زفاف|عرس|نتزوج|تتزوج|(^|[^أ])زواج|خطوبة|wedding|marri|bride/i);
    const flags = new Set(MISSIONS.flatMap((m) => [...atoms(m.unlock ?? true), ...m.steps.flatMap((s) => atoms(s.done))]));
    expect([...flags].filter((f) => /wed|marri|engage/i.test(f))).toEqual([]);
    expect(JOURNAL['sp1-promise']).toBeTruthy(); // «وعد» (Story Pack 01) is kept as it was
  });
});
