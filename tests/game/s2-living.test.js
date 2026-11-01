/**
 * Season 2, M2 — the Living Story (docs/season-2/SEASON_2_LIVING_STORY_C1.md). Stage C2: Mission 01 «سر المكتب».
 *
 * - the office's clue grid has exactly one answer, every clue is needed, and guessing is hopeless;
 * - no answer before she earns it (intro, goal, every line said before the board, mission steps); no help at all;
 * - her decision is read again later (Ryan's arrival, Lama, Sabri), each value leading somewhere;
 * - carrying: one thing at a time, back to the printer's tray;
 * - the mission played from its own data (as the engine runs it), from M1's end to «done»; ids go to Season 2's
 *   own save; the original campaign's save stays byte-identical; no private nickname anywhere in M2's text.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store } from '../../src/game/core/s2-store.js';
import { applyEffects, isValidEffect } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { logicgridSolutions } from '../../src/game/puzzles/rules.js';
import { canSkip } from '../../src/game/puzzles/host.js';
import { PUZZLES_S2_M2 } from '../../src/game/data/puzzles-s2-m2.js';
import { MISSIONS_S2_M2 } from '../../src/game/data/missions-s2-m2.js';
import { S2_M2 } from '../../src/game/data/dialogue/s2-m2.js';
import { S2_OFFICE, S2_M2_SCENES } from '../../src/game/data/scenes/s2-m2.js';
import { EVIDENCE_S2_M2, DECISIONS_S2_M2, CASE_S2_M2, JOURNAL_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import { MISSIONS as GRAPH, MILESTONES } from '../../docs/season-2/graph.mjs';
import { WORLDS } from '../../src/game/data/worlds.js';
import { memoryStorage } from '../helpers.js';

const WHO = PUZZLES_S2_M2['s2-who-said'];
const M01 = MISSIONS_S2_M2.find((m) => m.id === 's2-12');
const T0 = 1_800_000_000_000;

describe('Mission 01: the clue grid «منو گال شنو»', () => {
  it('one answer, every clue needed, guessing hopeless', () => {
    const c = WHO.config;
    expect(logicgridSolutions(c)).toHaveLength(1);
    for (let k = 0; k < c.clues.length; k++) expect(logicgridSolutions(c, c.clues.filter((_, j) => j !== k)).length, `clue ${k}`).toBeGreaterThan(1);
    const states = c.cols.reduce((n, col) => n * col.options.length ** c.rows.length, 1);
    expect(1 / states).toBeLessThan(0.05);
  });

  it('every clue is something she finds in the office (no clue comes from nowhere)', () => {
    const notes = Object.values(EVIDENCE_S2_M2).map((e) => e.note).join(' ');
    for (const cl of WHO.config.clues.slice(1)) {
      const quoted = cl.text.match(/«([^»]+)»/)?.[1];
      if (quoted) expect(notes.includes(quoted.replace(/^…\s*/, '')), cl.text).toBe(true);
    }
  });

  it('no hints; no skip; no "show the answer" (strict)', () => {
    expect(WHO.strict).toBe(true);
    expect(WHO.hints).toBeUndefined();
    expect(WHO.noSolution).toBe(true);
    expect(canSkip(WHO, { mistakes: 99, hintsUsed: 99 })).toBe(false);
  });
});

/* ── no answer before she earns it ── */
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
  walk(S2_M2[key]);
  return out;
};
const BEFORE_BOARD = Object.keys(S2_M2).filter((k) => k.startsWith('s2.office') || (k.startsWith('s2.12-') && !['s2.12-board-done', 's2.12-board-again', 's2.12-ryan-arrives'].includes(k)));

describe('Mission 01: no answer before she earns it', () => {
  it('REGRESSION GUARD: nothing she reads before solving the board says who told whom, or on which day', () => {
    const texts = [WHO.goal, WHO.intro, M01.summary, ...M01.steps.map((s) => s.text), ...BEFORE_BOARD.flatMap(lines)];
    // the answer's links, in the words a leak would use
    const answer = ['صبري گال للمى', 'گالها للمى', 'سمعتها من صبري', 'ريان گال لصبري', 'گال لصبري', 'لمى گالت لـ', 'يوم الثلاثاء', 'الثلاثاء لمى'];
    for (const text of texts) for (const word of answer) expect(text.includes(word), `«${word}» in «${text}»`).toBe(false);
  });

  it('the board opens only once every scrap is found (a clue she has not seen is never on it)', () => {
    const board = S2_OFFICE.interact.find((i) => i.id === 'board');
    const opens = board.cases.find((c) => JSON.stringify(c.run).includes('s2-who-said'));
    for (const e of ['ev:f-rota', 'ev:f-calendar', 'ev:f-sticky', 'ev:f-print']) expect(opens.if).toContain(e);
  });
});

describe('Mission 01: decisions and what they change', () => {
  it('office-cover: both values are read later (Ryan, Lama, Sabri), and each leads to the end', () => {
    const src = JSON.stringify(S2_M2);
    for (const v of DECISIONS_S2_M2['office-cover']) {
      expect(src.includes(`"if":"dec:office-cover=${v}"`), v).toBe(true);
      expect(isValidEffect(`dec:office-cover=${v}`)).toBe(true);
    }
  });
});

/* ── the mission, played from its own data ── */
function setup() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج' };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  const saveManager = createSaveManager({ storage, now: () => T0 + 1 });
  const loaded = saveManager.load();
  const s2Store = createS2Store({ storage, now: () => T0 + 2 });
  const game = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now: () => T0 + 3 });
  const snapshot = () => ['', ':backup', ':shadow'].map((k) => storage.getItem(SAVE_KEY + k));
  return { game, snapshot };
}
/** Runs scene actions as the engine does (say → its effects, with a chosen option; puzzle → its reward). */
function run(game, actions, pick = 0) {
  for (const a of [].concat(actions || [])) {
    if (a.if !== undefined && !('then' in a) && !a.puzzle) {
      if (!check(a.if, game)) continue;
    }
    if ('then' in a && !a.puzzle) {
      run(game, check(a.if, game) ? a.then : a.else, pick);
      continue;
    }
    if (a.say) {
      const walk = (nodes) => {
        for (const n of [].concat(nodes || [])) {
          if (n.if !== undefined && ('then' in n || 'else' in n)) {
            walk(check(n.if, game) ? n.then : n.else);
            continue;
          }
          if (n.do) applyEffects(n.do, game);
          if (n.choice) {
            const o = n.choice[Math.min(pick, n.choice.length - 1)];
            if (o.do) applyEffects(o.do, game);
            walk(o.then);
          }
        }
      };
      walk(S2_M2[a.say]);
      game.markSeen(`dlg:${a.say}`);
    } else if (a.fx) applyEffects(a.fx, game);
    else if (a.all) run(game, a.all, pick);
    else if (a.puzzle) {
      applyEffects(PUZZLES_S2_M2[a.puzzle].reward, game);
      run(game, a.then, pick);
    }
    syncMissions(game, { season2: true });
  }
}
/** A tap on something: the first case that holds (`unseenBy`: he is looking away, as she waited for). */
function tap(game, id, pick, { seen = false } = {}) {
  const it = S2_OFFICE.interact.find((i) => i.id === id);
  expect(it, id).toBeTruthy();
  expect(check(it.if, game), `${id} is there`).toBe(true);
  const c = it.cases.find((x) => check(x.if, game) && (!x.unseenBy || !seen) && (!x.seenBy || seen));
  run(game, c.run, pick);
}
function playOffice(game, pick) {
  game.setLocation('s2-office', 140);
  for (const t of S2_OFFICE.triggers) if (check(t.if, game)) run(game, t.run);
  tap(game, 'rota');
  tap(game, 'calendar');
  tap(game, 'sabri');
  tap(game, 'sticky', 0, { seen: true }); // he catches her: nothing happens but his "إيييي!"
  expect(game.has('s2.ev.f-sticky')).toBe(false);
  tap(game, 'lama', 0); // «شغليه بالحچي»
  tap(game, 'sticky'); // while he looks at Lama
  expect(game.flag('s2:12-papers')).toBe(true);
  for (const p of ['paper-1', 'paper-2', 'paper-3', 'paper-4']) {
    tap(game, p);
    expect(check(`hold:${p}`, game)).toBe(true);
    if (p === 'paper-1') {
      // hands full: a second sheet waits
      tap(game, 'paper-2');
      expect(check('hold:paper-1', game)).toBe(true);
    }
    tap(game, 'tray', pick);
    expect(check('hold:', game)).toBe(true);
  }
  tap(game, 'board', pick);
}

describe('Mission 01, played through from its own data', () => {
  it('from M1’s end to «done», both choices; ids in Season 2’s save; the original save byte-identical', () => {
    for (const pick of [0, 1]) {
      const t = setup();
      t.game.setFlag('mission:s2-11');
      syncMissions(t.game, { season2: true });
      expect(missionState(M01, t.game).status).toBe('active');
      const before = t.snapshot();
      playOffice(t.game, pick);
      expect(missionState(M01, t.game).status, `pick ${pick}`).toBe('complete');
      expect(t.game.flag('s2:dec:office-cover')).toBe(pick === 0 ? 'cover' : 'truth');
      expect(Boolean(t.game.flag('s2:12-lama-knows'))).toBe(pick === 1); // what Lama learns depends on her choice
      for (const e of CASE_S2_M2.find((c) => c.mission === 's2-12').ids) expect(t.game.has(`s2.ev.${e}`), e).toBe(true);
      expect(t.game.inJournal('s2-office')).toBe(true);
      expect(t.snapshot()).toEqual(before);
    }
  });

  it('REGRESSION: the dogs’ line counters in a Season 2 place go to Season 2’s save (a tap on her husky wrote the original save)', async () => {
    const { lineKey } = await import('../../src/game/world/engine.js');
    expect(lineKey('s2-office', 'husky-tap')).toBe('s2:husky-tap');
    expect(lineKey('s2-lamphouse', 'husky-ambient')).toBe('s2:husky-ambient');
    expect(lineKey('garden', 'husky-tap')).toBe('husky-tap'); // the original game keeps its own
    const t = setup();
    const before = t.snapshot();
    for (const k of ['husky-tap', 'snooki-tap', 'snooki-ryan-tap', 'husky-ambient']) t.game.nextLine(lineKey('s2-office', k), 6);
    expect(t.snapshot()).toEqual(before);
    expect(Object.keys(t.game.s2State.lines)).toEqual(expect.arrayContaining(['s2:husky-tap', 's2:husky-ambient']));
  });

  it('every id Mission 01 writes routes to Season 2', () => {
    const ids = ['s2:in-office', 's2:12-distract', 's2:12-papers', 's2:12-jam', 's2:12-tidy', 's2:12-done', 's2:12-lama-knows', 's2:hold', 's2:dec:office-cover', 'mission:s2-12', 'puzzle:s2-who-said', 'visited:s2-office', 'it.s2-office.sticky', 'dlg:s2.12-slip', ...CASE_S2_M2.find((c) => c.mission === 's2-12').ids.map((e) => `s2.ev.${e}`), ...Object.keys(JOURNAL_S2_M2), ...S2_OFFICE.interact.filter((i) => i.id.startsWith('paper')).map((i) => `s2:12-${i.id}`)];
    for (const id of ids) expect(isS2(id), id).toBe(true);
  });

  it('agrees with the approved graph (one milestone M2 of six; Mission 01 yields what the case file lists)', () => {
    expect(MILESTONES.map((m) => m.id)).toEqual(['M1', 'M2']);
    expect(MILESTONES.find((m) => m.id === 'M2').terminal).toBe('s2-17');
    const g = GRAPH.find((m) => m.id === 's2-12');
    expect(g.requires).toEqual(['s2-11']);
    for (const e of g.yields) expect(CASE_S2_M2.find((c) => c.mission === 's2-12').ids).toContain(e);
    expect(WORLDS.find((w) => w.id === 's2-office')).toMatchObject({ region: 's2', unlock: 'flag:mission:s2-11' });
    expect(S2_M2_SCENES[0].id).toBe('s2-office'); // (later missions add their own places: data/m2/)
  });

  it('no private nickname anywhere in M2’s text (hashed, as in s2-m1.test.js)', () => {
    const text = JSON.stringify([S2_M2, PUZZLES_S2_M2, MISSIONS_S2_M2, EVIDENCE_S2_M2, JOURNAL_S2_M2, S2_M2_SCENES.map((s) => [s.title, s.ambient, s.interact.map((i) => i.label)])]);
    const sha = (s) => createHash('sha256').update(s).digest('hex');
    for (const { n, h } of [{ n: 6, h: 'def2be71a3c5b311bbee2f8fd0cf7afb25b8cf4b995e5af098cc99827607760e' }, { n: 5, h: '2573ae4737831c12194b4da708064c83f4e4beaca82a6a55db1c9c266bb117b6' }]) {
      for (let i = 0; i + n <= text.length; i++) expect(sha(text.slice(i, i + n)) === h).toBe(false);
    }
    expect(text).not.toMatch(/زفاف|عرس|خطوبة|خطبة|زواج|نتزوج|تتزوج|wedding|marriage/);
  });
});
