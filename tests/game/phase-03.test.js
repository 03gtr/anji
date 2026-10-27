/**
 * Phase 03: the delayed (earned) finale, «خريطة الغد», harder-but-fair puzzles,
 * hints as a deliberate choice, the husky before the ending (both paths), one
 * mission state for journal / map / HUD / guidance, dialogue «التالي», Ryan's
 * directional frames, input release, the evidence notebook, and seven
 * representative SYNTHETIC saves (never a real player's save).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager, SAVE_KEY, SAVE_VERSION, defaultState } from '../../src/game/core/save.js';
import { createInput } from '../../src/game/core/input.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { journalEntries, evidenceView } from '../../src/game/progression/journal-index.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { MISSIONS_SP2, SP2_FINAL_GATE } from '../../src/game/data/missions-sp2.js';
import { worldById } from '../../src/game/data/worlds.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { ACTS, currentObjective } from '../../src/game/data/chapters.js';
import { CINEMATICS } from '../../src/game/data/cinematics.js';
import { solve, replay, runProgram, programSolution } from '../../src/game/puzzles/rules.js';
import { frameTable } from '../../src/game/characters/sprites.js';
import { nextGuidance } from '../../src/game/ui/guide.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

const sp2 = (id) => MISSIONS_SP2.find((m) => m.id === id);
const mission = (id) => MISSIONS.find((m) => m.id === id);
const game = (flags = {}) => createGame({ saveManager: null, initial: { ...defaultState(), flags: { ...flags } } });

function throughAct(n, g) {
  for (const act of ACTS.filter((a) => a.act <= n)) {
    g.setFlag(`act${act.act}-done`);
    for (const o of act.objectives) {
      for (const a of atoms(o.done)) {
        const [kind, ...rest] = a.split(':');
        const id = rest.join(':');
        if (kind === 'flag' && !/^(sp2-|workshop-entered|final-entered)/.test(id)) g.setFlag(id);
        else if (kind === 'record') g.recordResult(id, { completed: true });
        else if (kind === 'item') g.addItem(id);
      }
    }
  }
  g.setFlags(['workshop-open']);
  return g;
}
const SP2_CORE = ['sp2-entered', 'sp2-ledger-read', 'sp2-clue-a', 'sp2-clue-b', 'sp2-clue-c', 'sp2-deduced', 'sp2-archives-done', 'sp2-inner-open', 'sp2-maze-done', 'sp2-letter-1', 'sp2-letter-2', 'sp2-letter-3', 'sp2-letters-ordered', 'sp2-letters-done', 'sp2-plan-studied', 'sp2-done'];
const FINAL = ['sp2-final-read', 'sp2-insc-1', 'sp2-insc-2', 'sp2-insc-3', 'sp2-final-rule', 'sp2-final-done'];

describe('the finale is earned', () => {
  it('Act VII alone no longer opens the hidden garden; «خريطة الغد» does', () => {
    const g = throughAct(7, game());
    g.setFlags([...SP2_CORE, 'workshop-entered']); // an Act VII save has been in the workshop
    expect(check(worldById('final').unlock, g)).toBe(false);
    expect(currentObjective(g)).toEqual({ act: 7, title: ACTS[6].title, text: sp2('sp2-final').steps[0].text });
    g.setFlags(FINAL);
    expect(check(worldById('final').unlock, g)).toBe(true);
    expect(currentObjective(g).act).toBe(8);
  });

  it('the mission opens step by step; the inscriptions only after Act VII and reading the map', () => {
    const g = throughAct(6, game());
    g.setFlags(SP2_CORE);
    expect(missionState(sp2('sp2-final'), g).status).toBe('locked');
    g.setFlag('act7-done');
    expect(missionState(sp2('sp2-final'), g)).toMatchObject({ status: 'active', step: 0 });
    const insc = SCENES.corridor.interact.find((i) => i.id === 'sp2-insc-1');
    expect(check(insc.if, g)).toBe(false); // not before the map is read
    g.setFlag('sp2-final-read');
    expect(check(insc.if, g)).toBe(true);
    // the step that sends her looking does not name or light the places (she must read the icons)
    const step2 = sp2('sp2-final').steps[1];
    expect(step2.world).toBe('workshop');
    expect(step2.text + step2.hint).not.toMatch(/ممر الذكريات|البحيرة|المرصد/);
  });

  it('saves already past the gate keep going (never rolled back)', () => {
    expect(check(SP2_FINAL_GATE, game({ 'final-entered': true }))).toBe(true);
    const done = throughAct(8, game());
    done.setFlags(['workshop-entered', 'final-entered']);
    expect(check(worldById('final').unlock, done)).toBe(true);
    expect(ACTS.every((a) => a.objectives.every((o) => check(o.done, done)))).toBe(true);
  });

  it('the final puzzles: solvable, keys really needed, budgets tight', () => {
    for (const id of ['sp2-final-rule', 'sp2-final-route', 'sp2-maze-expert']) {
      const p = PUZZLES[id];
      expect(replay(p.type, p.config, solve(p.type, p.config)).outcome, id).toBe('solved');
    }
    for (const id of ['sp2-final-route', 'sp2-maze-expert']) {
      for (const st of PUZZLES[id].config.stages) {
        const best = programSolution(st);
        expect(best.length, id).toBeGreaterThanOrEqual(st.max - 2);
        const noKeys = { ...st, grid: st.grid.map((r) => r.replace(/[kq]/g, '.')) };
        expect(programSolution(noKeys), `${id} without keys`).toBeNull();
        expect(runProgram(st, Array(st.max).fill('F')).ok).toBe(false);
      }
    }
  });

  it('the inscription rules are each confirmed by both examples', () => {
    const [fib, inter] = PUZZLES['sp2-final-rule'].config.stages;
    const fibOk = (r) => r.slice(2).every((v, i) => v === r[i] + r[i + 1]);
    for (const ex of fib.examples) expect(fibOk(ex)).toBe(true);
    expect(fibOk([...fib.question.slice(0, 4), fib.answer])).toBe(true);
    const interOk = (r) => r.every((v, i) => (i % 2 ? v === r[1] * ((i + 1) / 2) : v === r[0] + i / 2));
    for (const ex of inter.examples) expect(interOk(ex)).toBe(true);
    expect(interOk([...inter.question.slice(0, 5), inter.answer])).toBe(true);
  });
});

describe('hints help thinking, never give the answer away', () => {
  const answerOf = {
    'sp2-ledger': /المرصد/,
    'sp2-sequence': /٢٤|24/,
    'sp2-letters-order': /الوردة الأولى/,
    'sp2-letters-facts': /يخطط للغد|يوم مهم/,
    'sp2-trail': /البحيرة/,
    'sp2-final-rule': /١٥|15|٢٧|27/,
    'sp1-cipher': /وعد/,
  };
  for (const [id, answer] of Object.entries(answerOf)) {
    it(`${id}: no hint names the answer`, () => {
      for (const h of PUZZLES[id].hints) expect(h).not.toMatch(answer);
    });
  }
  it('mission steps do not restate a puzzle answer', () => {
    expect(sp2('sp2-archives').steps[4].hint).not.toMatch(/السما|الماي|ورد/);
    expect(sp2('sp2-trail').steps[1].hint).not.toMatch(/قارب|البحيرة/);
  });
});

describe('the husky before the ending — both paths', () => {
  const pup = () => SCENES.sanctuary.interact.find((i) => i.id === 'sp2-pup');
  const post = () => SCENES.sanctuary.interact.find((i) => i.id === 'sp2-post');
  const ryanCase = (g) => SCENES.roseclinic.interact.find((i) => i.id === 'ryan').cases.find((c) => check(c.if, g));

  it('new path: the pup at the sanctuary is named during the archive investigation', () => {
    const g = throughAct(4, game());
    g.setFlags(['sp2-entered', 'sp2-ledger-read']);
    expect(check(pup().if, g)).toBe(true);
    expect(check(post().if, g)).toBe(false); // she sits on the post until she has a name
    expect(pup().run.some((a) => a.askName === 'husky')).toBe(true);
    g.setFlag(HUSKY_FLAG, 'سما');
    g.setFlag('sp2-husky-early');
    expect(check(pup().if, g)).toBe(false);
    expect(check(post().if, g)).toBe(true);
    // later, Story Pack 01: a reunion — no second introduction, no renaming
    g.setFlags(['game-complete', 'sp1-embrace', 'sp1-visit-done']);
    const c = ryanCase(g);
    expect(c.run.some((a) => a.say === 'sp1.husky-reunion')).toBe(true);
    expect(c.run.some((a) => a.askName)).toBe(false);
    // she shows up in Story Pack 01 places only after Ryan's scene
    expect(check(SCENES.roseclinic.actors.find((a) => a.id === 'husky').if, g)).toBe(false);
    g.setFlag('sp1-husky-met');
    expect(check(SCENES.roseclinic.actors.find((a) => a.id === 'husky').if, g)).toBe(true);
    expect(missionState(mission('sp1-husky-name'), g).status).not.toBe('locked');
  });

  it('old path: a name chosen in Story Pack 01 is kept; no pup scene, no reunion', () => {
    const g = throughAct(8, game());
    g.setFlags(['sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'sp2-ledger-read']);
    g.setFlag(HUSKY_FLAG, 'لولو');
    expect(check(pup().if, g)).toBe(false);
    expect(ryanCase(g).run).toEqual([{ say: 'sp1.ryan-chat' }]);
    expect(g.flag(HUSKY_FLAG)).toBe('لولو');
    expect(check(sp2('sp2-trail').unlock, { ...g, flag: (k) => (k === 'sp2-archives-done' ? true : g.flag(k)) })).toBe(true);
  });

  it('an interrupted Story Pack 01 naming scene replays its own path (no reunion lines)', () => {
    const g = game({ 'game-complete': true, 'sp1-visit-done': true });
    g.setFlag(HUSKY_FLAG, 'ميرا'); // named, but the scene was closed before it finished
    expect(ryanCase(g).run.some((a) => a.askName === 'husky')).toBe(true);
  });
});

describe('one mission state: journal, map, HUD and guidance agree', () => {
  const states = {
    'Act V, archive open': () => {
      const g = throughAct(4, game());
      g.setFlag('sp2-entered');
      return g;
    },
    'Act VI, seals unlit': () => throughAct(6, game()),
    'Act VII done, map to finish': () => {
      const g = throughAct(7, game());
      g.setFlags([...SP2_CORE, 'workshop-entered']);
      return g;
    },
  };
  for (const [name, make] of Object.entries(states)) {
    it(`${name}: the current entry carries the HUD's text`, () => {
      const g = make();
      const cur = journalEntries(g).filter((e) => e.isCurrent);
      expect(cur).toHaveLength(1);
      expect(cur[0].next).toBe(currentObjective(g).text);
    });
  }

  it('guidance points elsewhere only when the next place is elsewhere', () => {
    const g = throughAct(6, game()); // the seals block Act VII: the archive is the current entry
    g.setFlags(['sp2-entered', 'sp2-ledger-read']);
    const away = nextGuidance(g, 'garden');
    expect(away.elsewhere).toBe(true);
    expect(away.entry.id).toBe('sp2-archives');
    expect(nextGuidance(g, 'house').elsewhere).toBe(false); // the house holds one of the marks
    expect(nextGuidance(game(), 'garden')?.elsewhere ?? false).toBe(false);
  });

  it('the evidence notebook: found facts with their place, unfound only counted, deductions hidden until solved', () => {
    const g = throughAct(4, game());
    for (const id of ['sp2-ledger', 'sp2-clue-a']) g.addJournal(id);
    g.setFlags(['sp2-ledger-read', 'sp2-clue-a']);
    let v = evidenceView(g).find((x) => x.mission.id === 'sp2-archives');
    expect(v.facts.map((f) => f.id)).toEqual(['sp2-ledger', 'sp2-clue-a']);
    expect(v.facts[1].place).toBe('البيت الغامض');
    expect(v.missing).toBe(2);
    expect(JSON.stringify(v)).not.toMatch(/يشوف السما|ولا وردة/); // unfound clues stay unknown
    expect(v.deduction).toMatchObject({ status: 'open', text: null, board: null });
    for (const id of ['sp2-clue-b', 'sp2-clue-c']) g.addJournal(id);
    v = evidenceView(g).find((x) => x.mission.id === 'sp2-archives');
    expect(v.deduction).toMatchObject({ status: 'ready', board: 'sp2-ledger', text: null });
    g.setFlag('sp2-deduced');
    g.addJournal('sp2-key');
    expect(evidenceView(g).find((x) => x.mission.id === 'sp2-archives').deduction.status).toBe('solved');
  });
});

describe('Ryan faces the way he walks; input never sticks', () => {
  it('profile frames for idle and walk, the back view kept for scripted moments', () => {
    const t = frameTable('ryan');
    expect(Object.keys(t)).toEqual(expect.arrayContaining(['idle', 'walk', 'back']));
    expect(t.idle[0]).toMatch(/rgba\(159,215,255,\.2\)/); // the glasses lens in profile
    expect(t.back[0]).not.toMatch(/rgba\(159,215,255,\.2\)/);
    expect(t.walk).toHaveLength(6);
    // waiting at the gate «with his back to her» keeps the back view
    expect(SCENES.roads.actors.find((a) => a.id === 'ryan').view).toBe('back');
    // the silent embrace is untouched: no captions, no dialogue
    for (const s of CINEMATICS['sp1-embrace']) expect(s.silent && !s.caption && !s.say).toBe(true);
  });

  it('a menu releases held keys; a press nobody used does not carry over', () => {
    const target = new EventTarget();
    const input = createInput({ target });
    target.dispatchEvent(Object.assign(new Event('keydown'), { code: 'ArrowRight' }));
    expect(input.down('right')).toBe(true);
    input.setEnabled(false);
    input.setEnabled(true);
    expect(input.down('right')).toBe(false);
    target.dispatchEvent(Object.assign(new Event('keydown'), { code: 'Space' }));
    input.endFrame(); // e.g. the press advanced a dialogue; the world did not take it
    expect(input.take('jump')).toBe(false);
  });
});

/* ── seven representative synthetic saves ─────────────── */
function save(build) {
  const g = build(game());
  return { ...g.state, inventory: { ...g.state.inventory, treat: 2 }, collected: [...g.state.collected, 'star.garden.1'], location: { scene: 'garden', x: 640 } };
}
const SAVES = {
  '1 mid original story (Act II)': () => save((g) => {
    g.setFlags(['intro-done', 'map-open', 'met-snooki', 'act1-done', 'house-entered']);
    return g;
  }),
  '2 end of Act IV': () => save((g) => throughAct(4, g)),
  '3 inside Acts V–VI': () => save((g) => {
    throughAct(5, g);
    g.setFlags(['sp2-entered', 'sp2-ledger-read', 'sp2-clue-a']);
    return g;
  }),
  '4 already entered the workshop': () => save((g) => {
    throughAct(6, g);
    g.setFlags(['workshop-entered', 'wk-stage1']);
    return g;
  }),
  '5 finished game': () => save((g) => {
    throughAct(8, g);
    g.setFlags(['workshop-entered', 'final-entered', 'rose-planted']);
    return g;
  }),
  '6 optional missions done': () => save((g) => {
    throughAct(4, g);
    g.setFlags(['study-done', 'clock-seen', 'build-seen', 'build-fixed', 'symbols-seen', 'drawer-open', 'mission:unfinished-build', 'mission-seen:unfinished-build']);
    g.addItem('shelf-key');
    return g;
  }),
  '7 Story Pack 01 done, husky named': () => save((g) => {
    throughAct(8, g);
    g.setFlags(['workshop-entered', 'final-entered', 'sp1-roads-seen', 'sp1-embrace', 'sp1-clinic-seen', 'sp1-visit-done', 'sp1-husky-met', 'sp1-gift-box', 'sp1-clue-1', 'sp1-clue-2', 'sp1-clue-3', 'sp1-gift-open', 'sp1-return', 'sp1-done']);
    g.setFlag(HUSKY_FLAG, 'لولو');
    g.unlock('collar-rose');
    return g;
  }),
};
const strip = ({ updatedAt, ...rest }) => rest;

describe('seven representative synthetic saves', () => {
  it('the save version is unchanged', () => expect(SAVE_VERSION).toBe(3));

  for (const [name, make] of Object.entries(SAVES)) {
    it(`${name}: loads unchanged, resumes forward, nothing paid twice`, () => {
      const before = make();
      const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(before) });
      const saves = createSaveManager({ storage });
      expect(strip(saves.load().state)).toEqual(strip(before));
      let g = createGame({ saveManager: saves, initial: saves.load().state });
      const objBefore = currentObjective(g);
      syncMissions(g);
      // nothing existing is changed or taken away
      for (const [k, v] of Object.entries(before.flags)) expect(g.state.flags[k], k).toEqual(v);
      for (const [k, v] of Object.entries(before.inventory)) expect(g.state.inventory[k], k).toBeGreaterThanOrEqual(v);
      for (const k of ['collected', 'journal', 'unlocks']) expect(g.state[k]).toEqual(expect.arrayContaining(before[k]));
      expect(g.state.location).toEqual(before.location);
      // a reload pays nothing again
      const snapshot = JSON.stringify({ inv: g.state.inventory, un: g.state.unlocks, col: g.state.collected });
      g = createGame({ saveManager: saves, initial: saves.load().state });
      expect(syncMissions(g).completed).toEqual([]);
      expect(JSON.stringify({ inv: g.state.inventory, un: g.state.unlocks, col: g.state.collected })).toBe(snapshot);
      // never rolled back: the HUD act never goes below where she was
      if (objBefore.act) expect(currentObjective(g).act ?? 9).toBeGreaterThanOrEqual(objBefore.act);
    });
  }

  it('save 5 (finished) keeps its ending and finale access; save 7 keeps the husky name', () => {
    const g5 = createGame({ saveManager: null, initial: SAVES['5 finished game']() });
    expect(g5.flag('game-complete')).toBe(true);
    expect(check(worldById('final').unlock, g5)).toBe(true);
    const g7 = createGame({ saveManager: null, initial: SAVES['7 Story Pack 01 done, husky named']() });
    expect(g7.flag(HUSKY_FLAG)).toBe('لولو');
    expect(missionState(mission('sp1-garden-remembers'), g7).status).toBe('complete');
  });

  it('save 4 (already in the workshop) is not sent back to the archive', () => {
    const g = createGame({ saveManager: null, initial: SAVES['4 already entered the workshop']() });
    expect(check(worldById('workshop').unlock, g)).toBe(true);
    expect(currentObjective(g).act).toBe(7);
  });

  it('export → import keeps everything (save 7)', () => {
    const saves = createSaveManager({ storage: memoryStorage() });
    const s = SAVES['7 Story Pack 01 done, husky named']();
    expect(strip(saves.importText(saves.exportText(s)))).toEqual(strip({ ...s, v: SAVE_VERSION }));
  });
});

/* ── through the real app ─────────────────────────────── */
const noop = () => {};
const fakeContext = () => new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => ({ addColorStop: noop }) : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
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
const $ = (s) => root.querySelector(s);

describe('in the app: «التالي», a deliberate first hint, the evidence tab', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(fakeContext);
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('«التالي» completes the line, then advances; it is hidden while choosing', async () => {
    await app.toTitle();
    const done = app.ui.dialogue([
      { s: 'anji', t: 'سطر أول طويل شوية حتى ينكتب كلمة كلمة.' },
      { s: 'anji', t: 'سطر ثاني.' },
      { s: 'anji', t: 'تختارين؟', choice: [{ t: 'إي', then: [] }, { t: 'لا', then: [] }] },
    ]);
    const next = await until(() => $('.dlg-nextbtn'));
    next.click(); // finishes typing
    expect($('.dlg-text').textContent).toMatch(/سطر أول/);
    next.click(); // advances
    await until(() => /سطر ثاني/.test($('.dlg-text').textContent));
    next.click();
    next.click();
    await until(() => $('.btn-choice'));
    expect(getComputedStyle($('.dlg-nextbtn')).display === 'none' || $('.dlg').classList.contains('has-choices')).toBe(true);
    $('.btn-choice').click();
    await done;
  });

  it('the first hint asks before it shows anything', async () => {
    await app.toTitle();
    const done = app.ui.puzzle('sp2-ledger');
    const hint = await until(() => $('[data-act="hint"]'));
    hint.click();
    expect(root.querySelectorAll('.puzzle-hints li')).toHaveLength(0);
    expect(hint.textContent).toMatch(/متأكدة/);
    hint.click();
    expect(root.querySelectorAll('.puzzle-hints li')).toHaveLength(1);
    $('.puzzle [data-act="close"]').click();
    await done;
  });

  it('the evidence tab lists found facts and offers the board when all are found', async () => {
    const g = throughAct(4, app.game);
    for (const id of ['sp2-ledger', 'sp2-clue-a', 'sp2-clue-b', 'sp2-clue-c']) g.addJournal(id);
    g.setFlags(['sp2-ledger-read', 'sp2-clue-a', 'sp2-clue-b', 'sp2-clue-c', 'notice:sp2']);
    await app.toTitle();
    app.ui.openJournal('evidence');
    const sec = await until(() => $('.evidence[data-evidence="sp2-archives"]'));
    expect(sec.querySelectorAll('.ev-fact')).toHaveLength(4);
    expect(sec.querySelector('[data-board="sp2-ledger"]')).toBeTruthy();
  });
});
