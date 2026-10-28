/**
 * Phase 04 «الحديقة العميقة»: the map's second page, four cross-linked investigations,
 * three new puzzle mechanics (logic machine, testimonies, logic grid), root gates in the
 * program maze, drafts that survive closing a puzzle, the new finale gate, and SYNTHETIC
 * old saves (never a real player's save).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { missionState } from '../../src/game/progression/missions.js';
import { journalEntries, evidenceView } from '../../src/game/progression/journal-index.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { MISSIONS_DEEP, DEEP_OPEN } from '../../src/game/data/missions-deep.js';
import { SP2_FINAL_GATE } from '../../src/game/data/missions-sp2.js';
import { WORLDS, ROUTES, worldById, regionOf } from '../../src/game/data/worlds.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DEEP_SCENES } from '../../src/game/data/scenes/deep.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { JOURNAL } from '../../src/game/data/items.js';
import { ACTS, currentObjective } from '../../src/game/data/chapters.js';
import { RULES, solve, replay, runProgram, programSolution, programCommands, machinePull, machineSolution, logicgridSolutions, clueHolds } from '../../src/game/puzzles/rules.js';
import { mapPath } from '../../src/game/ui/menus.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { memoryStorage } from '../helpers.js';

const game = (flags = {}) => createGame({ saveManager: null, initial: { ...defaultState(), flags: { ...flags } } });
const DEEP = WORLDS.filter((w) => regionOf(w) === 'deep');
const deepIds = DEEP.map((w) => w.id);
const mission = (id) => MISSIONS.find((m) => m.id === id);
/** Every act objective through act n (pack content excluded: each test plays that itself). */
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
/** An Act VII save past «خريطة الغد» (synthetic). */
function afterMap() {
  const g = throughAct(7, game());
  g.setFlags(['workshop-entered', 'map-open', 'sp2-done', 'sp2-final-read', 'sp2-insc-1', 'sp2-insc-2', 'sp2-insc-3', 'sp2-final-rule', 'sp2-final-done']);
  return g;
}
/** Every step of the Story Pack 01 / 02 story missions (so those chapters are finished, not just started). */
const SP1_ATOMS = MISSIONS.filter((m) => ['sp1', 'sp2'].includes(m.pack) && m.kind === 'story').flatMap((m) => m.steps.flatMap((st) => atoms(st.done)));
const SP1_DONE = SP1_ATOMS.filter((a) => a.startsWith('flag:')).map((a) => a.slice(5));
/** A finished game (Phase 05: the deep garden comes after the ending), Story Pack 01 done too (synthetic). */
function afterEnding() {
  const g = afterMap();
  g.setFlags(['final-entered', 'rose-planted', 'game-complete', 'act8-done', ...SP1_DONE]);
  for (const a of SP1_ATOMS) if (a.startsWith('seen:')) g.markSeen(a.slice(5));
  expect(SP1_ATOMS.every((a) => /^(flag|seen):/.test(a))).toBe(true); // nothing else to fake
  return g;
}
/** Main-story flags in a valid play order (each step only after what it needs). */
const PLAY = [
  ['dg-box', 'dg-guestbook'],
  ['dg-clock-1', 'dg-clock-2', 'dg-clock-3', 'dg-clock-4', 'dg-letters-read'],
  ['dg-bed', 'dg-log', 'dg-testimony'],
  ['dg-timeline'],
  ['dg-trails', 'dg-pot'],
  ['dg-hypo', 'dg-pattern', 'dg-wheel', 'dg-mirror'],
  ['dg-roots-maze', 'dg-note-water', 'dg-hedge', 'dg-bridge'],
  ['dg-awake'],
  ['dg-done'],
];
const firstCase = (interact, g) => interact.cases.find((c) => check(c.if, g));
const says = (run) => run.flatMap((a) => (a.say ? [a.say] : a.then ? says(a.then) : []));

describe('the map: a second page that fits', () => {
  it('fourteen new places, each playable, on its own 4 × 6 grid without collisions', () => {
    expect(DEEP.length).toBe(14);
    const xs = [12, 37, 62, 87];
    const ys = [9, 24.5, 40, 55.5, 71, 86.5];
    for (const region of ['garden', 'deep']) {
      const here = WORLDS.filter((w) => regionOf(w) === region);
      expect(new Set(here.map((w) => `${w.x},${w.y}`)).size, region).toBe(here.length);
      for (const w of here) expect(xs.includes(w.x) && ys.includes(w.y), w.id).toBe(true);
    }
    for (const w of DEEP) {
      // the drawn label stays at two words, the size of the garden page's labels (320 px phone)
      expect((w.short ?? w.name).split(' ').length, w.id).toBeLessThanOrEqual(2);
      expect(SCENES[w.scene], w.id).toBeTruthy();
      expect(w.ready && w.pack === 'deep' && w.act === 8, w.id).toBe(true);
      expect(w.locked, w.id).toBeTruthy();
    }
    expect(DEEP_SCENES.map((s) => s.id).sort()).toEqual([...deepIds].sort());
  });

  it('routes join valid places; a drawn deep line never runs through another place', () => {
    for (const [a, b] of ROUTES) expect(worldById(a) && worldById(b), `${a}-${b}`).toBeTruthy();
    for (const [a, b] of ROUTES) {
      const A = worldById(a);
      const B = worldById(b);
      if (regionOf(A) !== 'deep' || regionOf(B) !== 'deep') continue; // entrances between pages are not drawn
      for (const w of WORLDS.filter((x) => regionOf(x) === regionOf(A) && x !== A && x !== B)) {
        // distance from the place to the segment, in board %
        const [dx, dy] = [B.x - A.x, B.y - A.y];
        const t = Math.max(0, Math.min(1, ((w.x - A.x) * dx + (w.y - A.y) * dy) / (dx * dx + dy * dy)));
        const d = Math.hypot(A.x + t * dx - w.x, A.y + t * dy - w.y);
        expect(d, `${a}-${b} crosses ${w.id}`).toBeGreaterThan(6);
      }
    }
  });

  it('every deep place connects back to the garden; entrances name real garden places', () => {
    for (const w of DEEP) expect(mapPath('house', w.id).length, w.id).toBeGreaterThan(0);
    const entrances = DEEP.filter((w) => w.from);
    expect(entrances.map((w) => w.id).sort()).toEqual(['clockgarden', 'falsetrails', 'letterhall', 'roots', 'sealedroom']);
    for (const w of entrances) expect(regionOf(worldById(w.from)), w.id).toBe('garden');
    // each entrance has a real door in its garden place, with the same condition as the map
    const doors = { garden: 'dg-clockgate', house: 'dg-letterdoor', workshop: 'dg-backdoor', observatory: 'dg-hatch' };
    for (const [scene, id] of Object.entries(doors)) {
      const d = SCENES[scene].interact.find((i) => i.id === id);
      expect(d.if, id).toEqual(DEEP_OPEN);
      expect(d.run.find((a) => a.goto), id).toBeTruthy();
    }
  });
});

describe('the investigations: order, cross-links and the gate after the ending', () => {
  it('nothing deep opens before the ending — not even with «خريطة الغد» done — and then only after the empty box', () => {
    const g = throughAct(7, game());
    g.setFlag('workshop-entered');
    expect(DEEP.filter((w) => check(w.unlock, g))).toEqual([]);
    expect(missionState(mission('dg-night'), g).status).toBe('locked');
    g.setFlags(['sp2-final-read', 'sp2-insc-1', 'sp2-insc-2', 'sp2-insc-3', 'sp2-final-rule', 'sp2-final-done', 'final-entered']);
    expect(missionState(mission('dg-night'), g).status).toBe('locked'); // in the finale, not past it
    expect(SCENES.workshop.interact.find((i) => i.id === 'dg-seedbox').if).toBeTruthy();
    expect(check(SCENES.workshop.interact.find((i) => i.id === 'dg-seedbox').if, g)).toBe(false);
    g.setFlags(['game-complete', 'act8-done']);
    expect(missionState(mission('dg-night'), g)).toMatchObject({ step: 0 });
    expect(missionState(mission('dg-night'), g).status).not.toBe('locked');
    expect(check(SCENES.workshop.interact.find((i) => i.id === 'dg-seedbox').if, g)).toBe(true);
    expect(DEEP.filter((w) => check(w.unlock, g))).toEqual([]); // the box first
    g.setFlag('dg-box');
    expect(DEEP.filter((w) => check(w.unlock, g)).map((w) => w.id).sort()).toEqual(['clockgarden', 'falsetrails', 'letterhall', 'sealedroom']);
  });

  it('played in order after the ending, every place and mission opens, it ends with planting; the ending is untouched', () => {
    const g = afterEnding();
    const ending = ['game-complete', 'final-entered', 'rose-planted', 'act8-done'];
    const opened = new Set();
    for (const batch of PLAY) {
      g.setFlags(batch);
      for (const w of DEEP) if (check(w.unlock, g)) opened.add(w.id);
      for (const f of ending) expect(g.flag(f), f).toBe(true);
      expect(check(worldById('final').unlock, g)).toBe(true);
    }
    expect([...opened].sort()).toEqual([...deepIds].sort()); // optional places open too
    const seed = mission('dg-seed');
    expect(missionState(seed, g)).toMatchObject({ status: 'active', step: 2 });
    expect(currentObjective(g).text).toBe(seed.steps[2].text);
    expect(seed.steps[2].world).toBe('final');
    g.setFlag('dg-planted');
    for (const m of MISSIONS_DEEP.filter((x) => x.kind === 'story')) expect(missionState(m, g).status, m.id).toBe('complete');
  });

  it('the original ending never waits for the deep garden, and finishing it never marks the deep garden done', () => {
    const g = afterMap();
    expect(check(SP2_FINAL_GATE, g)).toBe(true);
    expect(check(worldById('final').unlock, g)).toBe(true);
    expect(currentObjective(g).act).toBe(8);
    const done = afterEnding();
    expect(check(DEEP_OPEN, done)).toBe(false);
    expect(done.flag('dg-done')).toBeFalsy();
    for (const m of MISSIONS_DEEP) expect(missionState(m, done).status, m.id).not.toBe('complete');
    for (const a of ACTS) for (const o of a.objectives) expect(JSON.stringify(o.done), `act ${a.act}`).not.toMatch(/dg-/);
  });

  it('the cross-links: B waits for A, D waits for A, C waits for D, the seed waits for B and C', () => {
    const g = afterEnding();
    g.setFlags(['dg-box', 'dg-pattern']);
    const wheel = SCENES.starchamber.interact.find((i) => i.id === 'wheel');
    expect(says(firstCase(wheel, g).run)).toEqual(['dg.wheel-wait']); // the hour comes from the night
    const board = SCENES.hyporoom.interact.find((i) => i.id === 'hypotheses');
    g.setFlag('dg-trails');
    expect(says(firstCase(board, g).run)).toEqual(['dg.board-wait-night']);
    g.setFlag('dg-timeline');
    expect(says(firstCase(board, g).run)).toEqual(['dg.board-wait-pot']); // "what is missing"
    g.setFlag('dg-pot');
    expect(firstCase(board, g).run.some((a) => a.puzzle === 'dg-board')).toBe(true);
    expect(check(worldById('roots').unlock, g)).toBe(false);
    g.setFlag('dg-hypo');
    expect(check(worldById('roots').unlock, g)).toBe(true);
    g.setFlags(['dg-roots-maze', 'dg-hedge', 'dg-bridge']);
    expect(missionState(mission('dg-seed'), g).status).toBe('locked'); // needs the mirror (B) too
    const machine = SCENES.forgottengreen.interact.find((i) => i.id === 'seasons');
    expect(says(firstCase(machine, g).run)).toEqual(['dg.seasons-wait']);
    g.setFlags(['dg-wheel', 'dg-mirror']);
    expect(missionState(mission('dg-seed'), g).status).not.toBe('locked');
    expect(says(firstCase(machine, g).run)).toEqual(['dg.seasons-wait']); // the water note is in the roots
    g.setFlag('dg-note-water');
    expect(firstCase(machine, g).run.some((a) => a.puzzle === 'dg-seasons')).toBe(true);
  });

  it('the last page is made of one strip from each investigation', () => {
    const strips = { 'dg-order': 'dg-strip-a', 'dg-mirror': 'dg-strip-b', 'dg-bridge': 'dg-strip-c', 'dg-seasons': 'dg-strip-d' };
    for (const [p, s] of Object.entries(strips)) expect(PUZZLES[p].reward, p).toContain(`journal:${s}`);
    // the eight rules of the grid are exactly the eight lines on the four strips
    const lines = Object.values(strips).flatMap((s) => JOURNAL[s].text.match(/«[^»]+»/g).map((q) => q.slice(1, -1)));
    expect(PUZZLES['dg-ritual'].config.clues.map((c) => c.text).sort()).toEqual(lines.sort());
  });

  it('optional branches can be skipped: no main step, gate or puzzle needs them', () => {
    const optionalFlags = ['dg-song', 'dg-lights', 'dg-in-musicroom', 'dg-in-lighthouse'];
    for (const m of MISSIONS_DEEP.filter((x) => x.kind === 'story')) {
      const conds = [m.unlock, ...m.steps.map((s) => s.done)];
      for (const a of conds.flatMap((c) => atoms(c))) expect(optionalFlags.some((f) => a === `flag:${f}`), `${m.id}: ${a}`).toBe(false);
    }
    expect(atoms(SP2_FINAL_GATE).some((a) => optionalFlags.some((f) => a.includes(f)))).toBe(false);
    // the hypothesis board is solvable without the optional recording
    const board = PUZZLES['dg-board'].config;
    for (const st of board.stages) if (st.answer.claim >= 0) expect([].concat(st.answer.evidence).some((e) => e !== 'song'), st.who).toBe(true);
    expect(worldById('musicroom').optional && worldById('lighthouse').optional).toBe(true);
  });

  it('every new mission has steps with a text and an asked-for hint; no step text or map name gives an answer', () => {
    for (const m of MISSIONS_DEEP) {
      for (const s of m.steps) {
        expect(s.text && s.hint, m.id).toBeTruthy();
        expect(s.text, m.id).not.toMatch(/١١:٤٠|قمري|سنوكي خبّى|رذاذ|معتدل/);
      }
    }
    for (const w of DEEP) expect(`${w.name} ${w.locked}`, w.id).not.toMatch(/سنوكي|قمري|١١:٤٠/);
  });
});

describe('the new puzzle mechanics', () => {
  const DEEP_PUZZLES = Object.keys(PUZZLES).filter((id) => id.startsWith('dg-'));

  it('every deep puzzle is solvable, gives three graduated hints, and its rewards are known journal entries', () => {
    expect(DEEP_PUZZLES.length).toBe(14);
    for (const id of DEEP_PUZZLES) {
      const p = PUZZLES[id];
      expect(replay(p.type, p.config, solve(p.type, p.config)).outcome, id).toBe('solved');
      expect(p.hints.length, id).toBe(3);
      for (const r of p.reward.filter((x) => x.startsWith('journal:'))) expect(JOURNAL[r.slice(8)], r).toBeTruthy();
    }
  });

  it('logic grid: exactly one solution, and every one of the eight rules is needed', () => {
    const c = PUZZLES['dg-ritual'].config;
    const sols = logicgridSolutions(c);
    expect(sols).toHaveLength(1);
    expect(sols[0]).toEqual({ dig: { who: 'snooki', order: '1' }, seed: { who: 'anji', order: '2' }, water: { who: 'ryan', order: '3' }, light: { who: 'both', order: '4' } });
    c.clues.forEach((cl, i) => {
      const without = c.clues.filter((_, k) => k !== i);
      expect(logicgridSolutions(c, without).length, `without «${cl.text}»`).toBeGreaterThan(1);
    });
  });

  it('logic grid: checking names the first broken rule, never how many cells are right', () => {
    const c = PUZZLES['dg-ritual'].config;
    let s = RULES.logicgrid.init(c);
    expect(RULES.logicgrid.check(c, s).outcome).toBe('noop');
    for (const r of c.rows) for (const col of c.cols) s = RULES.logicgrid.cycle(c, s, r.id, col.id, 1).state; // everything on the first option
    const res = RULES.logicgrid.check(c, s);
    expect(res.outcome).toBe('wrong');
    expect(res.message).toMatch(/^الدليل \S+ ما ينطبق: «/);
    expect(res.message).not.toMatch(/\d+ من \d+/);
    expect(clueHolds(c, s.cells, c.clues[res.state.broken].rule)).toBe(false);
  });

  it('the seasons machine: the hidden target is what the three pieces of evidence say', () => {
    const c = PUZZLES['dg-seasons'].config;
    const [, two, three] = c.stages;
    const named = two.target.map((v, d) => c.dials[d].states[v]);
    expect(named).toEqual(['قمر', 'رذاذ', 'معتدل']);
    expect(JOURNAL['dg-mirror'].text).toMatch(/قمري/);
    expect(JOURNAL['dg-note-water'].text).toMatch(/عطشانة… بس الغرق/); // not dry, not rain
    expect(JOURNAL['dg-note-heat'].text).toMatch(/تحب الدفا… بس مو دفا الصيف/); // not cold, not hot
    expect(two.hidden && three.hidden).toBe(true);
    expect(three.target).toEqual(two.target);
  });

  it('the machines are deep enough: tight budgets, and the conditional lever changes the answer', () => {
    const plain = (c) => ({ ...c, levers: c.levers.map((l) => ({ ...l, effects: l.effects.filter((e) => !e.if) })) });
    for (const id of ['dg-seasons', 'dg-bridge']) {
      const c = PUZZLES[id].config;
      let conditionalMatters = false;
      for (const st of c.stages) {
        const best = machineSolution(c, st.start, st.target);
        expect(best, id).toBeTruthy();
        if (st.max) expect(best.length, `${id} budget`).toBe(st.max);
        const naive = machineSolution(plain(c), st.start, st.target);
        if (!naive || naive.join() !== best.join()) conditionalMatters = true;
      }
      expect(conditionalMatters, id).toBe(true);
    }
    expect(machineSolution(PUZZLES['dg-seasons'].config, [0, 2, 0], [2, 1, 1]).length).toBeGreaterThanOrEqual(5);
  });

  it('machine rules: pulls are free to try, a wrong run keeps the dials, the budget blocks extra pulls', () => {
    const c = PUZZLES['dg-bridge'].config;
    let s = RULES.machine.init(c);
    s = RULES.machine.pull(c, s, 'rock').state;
    expect(s.log[0]).toMatchObject({ lever: 'rock', from: [1, 0, 0, 0], to: [0, 1, 0, 0] });
    const wrong = RULES.machine.run(c, s);
    expect(wrong.outcome).toBe('wrong');
    expect(wrong.state.dials).toEqual(s.dials);
    for (let i = 0; i < 3; i++) s = RULES.machine.pull(c, s, 'tree').state;
    const blocked = RULES.machine.pull(c, s, 'tree');
    expect(blocked.outcome).toBe('noop');
    expect(blocked.message).toMatch(/خلصت/);
    expect(RULES.machine.reset(c, s).state.dials).toBeNull(); // back to the stage's start
    // the bell rope lifts plank 1 only when it is down
    expect(machinePull(c, [1, 0, 0, 0], 'bell')).toEqual([0, 0, 0, 1]);
    expect(machinePull(c, [0, 0, 0, 0], 'bell')).toEqual([0, 0, 0, 1]);
  });

  it('testimonies: the truthful witness has no false claim, ambiguous evidence is not proof, wrong tries keep picks', () => {
    const c = PUZZLES['dg-testimony'].config;
    const [sultan, munther, snooki] = c.stages;
    expect(sultan.answer.claim).toBe(-1); // the obvious suspect is not the liar
    expect([].concat(munther.answer.evidence)).not.toContain('clock2'); // a lens cap is not a name
    expect([].concat(snooki.answer.evidence)).toEqual(['bed']); // white hair: the husky is white too
    let s = RULES.contradict.init(c);
    s = RULES.contradict.pickClaim(c, s, 0).state;
    s = RULES.contradict.pickEvidence(c, s, 'clock3').state;
    const res = RULES.contradict.submit(c, s);
    expect(res.outcome).toBe('wrong');
    expect(res.state.claim).toBe(0);
    expect(res.message).not.toMatch(/قريب|صح|١|٢/);
    expect(RULES.contradict.submit(c, RULES.contradict.pickClaim(c, RULES.contradict.init(c), -1).state).outcome).toBe('progress');
  });

  it('the hypothesis board: three explanations break on a fact, the fourth stands', () => {
    const c = PUZZLES['dg-board'].config;
    expect(c.stages.map((st) => st.answer.claim)).toEqual([0, 0, 0, -1]);
    const ids = new Set(c.evidence.map((e) => e.id));
    for (const st of c.stages) for (const e of [].concat(st.answer.evidence ?? [])) expect(ids.has(e), e).toBe(true);
    // only evidence she has found is offered (each card names its own discovery)
    for (const e of c.evidence) expect(e.if, e.id).toMatch(/^flag:dg-/);
  });

  it('root gates: the wait and the beat really matter, budgets are the shortest route (+1 at most)', () => {
    const withGates = (st) => st.grid.some((r) => /[12]/.test(r));
    for (const id of ['dg-roots-maze', 'dg-hedge']) {
      const p = PUZZLES[id];
      expect(programCommands(p.config)).toContain('W');
      for (const st of p.config.stages) {
        expect(withGates(st), id).toBe(true);
        const best = programSolution(st, programCommands(p.config));
        expect(best, id).toBeTruthy();
        expect(best.length, `${id} budget`).toBeGreaterThanOrEqual(st.max - 1);
        const gatesOff = { ...st, grid: st.grid.map((r) => r.replace(/[12]/g, '.')), max: 40 };
        expect(programSolution(gatesOff, programCommands(p.config)).length, `${id} gates cost beats`).toBeLessThanOrEqual(best.length);
      }
    }
    // at least four of the five levels cannot be done without «انتظري» within the budget
    const stages = ['dg-roots-maze', 'dg-hedge'].flatMap((id) => PUZZLES[id].config.stages);
    expect(stages.filter((st) => !programSolution(st, ['F', 'L', 'R'])).length).toBeGreaterThanOrEqual(4);
    // the rule itself
    // a 🌙 gate (2) lets her in on even beats only: the 2nd command is the first chance
    expect(runProgram({ grid: ['.2B'], start: { x: 0, y: 0, dir: 0 }, max: 4 }, ['F']).gate).toBe(true);
    expect(runProgram({ grid: ['.2B'], start: { x: 0, y: 0, dir: 0 }, max: 4 }, ['W', 'F', 'F']).ok).toBe(true);
    // a ☀ gate (1) on odd beats only: straight in works, a wait first closes it
    expect(runProgram({ grid: ['.1B'], start: { x: 0, y: 0, dir: 0 }, max: 4 }, ['F', 'F']).ok).toBe(true);
    expect(runProgram({ grid: ['.1B'], start: { x: 0, y: 0, dir: 0 }, max: 4 }, ['W', 'F']).gate).toBe(true);
    // older mazes keep three commands and their behaviour
    expect(programCommands(PUZZLES['sp2-shifting-maze'].config)).toEqual(['F', 'L', 'R']);
  });

  it('cross-chain consistency: the wheel is set to the pond clock, the mirror uses the wheel letters and the garden heart', () => {
    expect(PUZZLES['dg-wheel'].config.target).toEqual([11, 40]);
    expect(JOURNAL['dg-clock-3'].text).toMatch(/١١:٤٠/);
    const m = PUZZLES['dg-mirror'].config;
    expect(m.glyphs.map((g, i) => [g, m.word[i]])).toContainEqual(['sym:moon-full', 'ق']);
    expect(m.given).toEqual({ 1: 'ر', 3: 'ق' });
    expect(JOURNAL['dg-key'].text).toMatch(/ق/);
    const coded = PUZZLES['sp2-coded'].config;
    expect(coded.word[coded.glyphs.indexOf('sym:heart')]).toBe(m.word[m.glyphs.indexOf('sym:heart')]); // ي everywhere
    expect([...m.word].reverse().join('')).toBe('قمري'); // read in the mirror
    // the sealed room's last wall teaches the mirror
    expect(PUZZLES['dg-pattern'].config.stages.at(-1).rule).toMatch(/مراية/);
  });
});

describe('content wiring', () => {
  it('every dialogue key a deep scene or extra uses exists; every puzzle it opens exists', () => {
    const keys = [];
    const puzzles = [];
    const walk = (run = []) => {
      for (const a of run) {
        if (typeof a.say === 'string') keys.push(a.say);
        if (a.puzzle) puzzles.push(a.puzzle);
        walk(a.then);
        walk(a.else);
      }
    };
    for (const s of [...DEEP_SCENES, ...['workshop', 'house', 'observatory', 'conservatory', 'garden'].map((id) => SCENES[id])]) {
      for (const i of s.interact || []) {
        walk(i.run);
        for (const c of i.cases || []) walk(c.run);
      }
      for (const t of s.triggers || []) walk(t.run);
    }
    for (const k of keys.filter((x) => x.startsWith('dg.'))) expect(DIALOGUE[k], k).toBeTruthy();
    for (const p of puzzles) expect(PUZZLES[p], p).toBeTruthy();
    expect(new Set(puzzles.filter((p) => p.startsWith('dg-'))).size).toBe(14);
  });

  it('the evidence notebook asks an open question until it is answered, and lists facts by place', () => {
    const g = afterEnding();
    applyEffects(['flag:dg-box', 'journal:dg-box', 'journal:dg-clock-3'], g);
    const night = evidenceView(g, journalEntries(g)).find((v) => v.mission.id === 'dg-night');
    expect(night.question).toMatch(/ليلة/);
    expect(night.facts.map((f) => f.place)).toEqual([worldById('workshop').name, worldById('clockgarden').name]);
    expect(night.missing).toBe(7); // how many, never which
    expect(night.deduction.text).toBeNull();
    g.setFlags(PLAY.flat());
    const solved = evidenceView(g).find((v) => v.mission.id === 'dg-night');
    expect(solved?.question ?? null).toBeNull();
  });
});

describe('old saves (synthetic)', () => {
  it('a finished game keeps the hidden garden and Act VII; the deep garden opens with no Story Pack 02 needed', () => {
    const g = throughAct(8, game());
    g.setFlags(['workshop-entered', 'final-entered', 'game-complete', 'map-open']);
    expect(check(worldById('final').unlock, g)).toBe(true);
    expect(ACTS.find((a) => a.act === 7).objectives.every((o) => check(o.done, g))).toBe(true);
    expect(missionState(mission('dg-night'), g).status).not.toBe('locked'); // the way in is open
    expect(DEEP.filter((w) => check(w.unlock, g))).toEqual([]); // until the box
    g.setFlag('dg-box');
    expect(DEEP.filter((w) => check(w.unlock, g)).length).toBe(4);
  });

  it('a save in the workshop (Act VII) goes on through «خريطة الغد» to the ending; nothing is reset', () => {
    const g = throughAct(6, game());
    g.setFlags(['workshop-entered', 'wk-stage1']);
    const before = JSON.stringify(g.state.flags);
    expect(check(worldById('workshop').unlock, g)).toBe(true);
    expect(check(worldById('final').unlock, g)).toBe(false);
    expect(JSON.stringify(g.state.flags)).toBe(before);
    g.setFlag('act7-done');
    expect(missionState(mission('sp2-final'), g).status).not.toBe('locked');
  });

  it('a save from Phase 03 that finished «خريطة الغد» goes straight on to the ending; the deep garden waits for after it', () => {
    const g = afterMap();
    expect(check(worldById('final').unlock, g)).toBe(true);
    expect(currentObjective(g)).toEqual({ act: 8, title: ACTS[7].title, text: ACTS[7].objectives[0].text });
    expect(missionState(mission('dg-night'), g).status).toBe('locked');
  });

  it('display numbers of older missions do not move (new missions are appended)', () => {
    const at = MISSIONS.findIndex((m) => m.id === 'dg-night');
    // (later packs, e.g. «إحنا فريق», are appended after these, never before)
    expect(MISSIONS.slice(at, at + MISSIONS_DEEP.length).map((m) => m.id)).toEqual(MISSIONS_DEEP.map((m) => m.id));
    expect(MISSIONS.slice(0, at).some((m) => m.id.startsWith('dg-') || m.id.startsWith('tu-'))).toBe(false);
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

  function start(extra = []) {
    const g = afterEnding();
    g.setFlags(['intro-done', 'notice:sp2', 'notice:sp1', 'notice:deep', ...extra]);
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'workshop', x: 300 } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
  }

  it('the map gets a second page once a deep place opens; a new place is marked until visited', async () => {
    start();
    await app.toTitle();
    app.ui.openMap();
    await until(() => $('.map-board .map-node'));
    expect($('.map-regions')).toBeNull(); // the deep garden does not exist for her yet
    app.overlays.closeAll();
    app.game.setFlag('dg-box');
    app.ui.openMap();
    await until(() => $('.map-regions'));
    // it opens on the page of the current objective (the silent clocks)
    expect($('.map-node.is-target')?.dataset.world).toBe('clockgarden');
    expect($('[data-region="deep"]').getAttribute('aria-pressed')).toBe('true');
    $('[data-region="garden"]').click();
    await until(() => $('.map-node[data-world="house"]'));
    expect($$('.map-node').some((n) => n.dataset.world === 'clockgarden')).toBe(false);
    $('[data-region="deep"]').click();
    await until(() => $('.map-node[data-world="clockgarden"]'));
    expect($$('.map-node').length).toBe(14);
    expect($('.map-node[data-world="clockgarden"] .map-new')).toBeTruthy();
    expect($('.map-node[data-world="roots"]').classList.contains('is-locked')).toBe(true);
    expect($('.map-node[data-world="musicroom"]').classList.contains('is-optional')).toBe(true);
    $('.map-node[data-world="clockgarden"]').click();
    await until(() => app.game.flag('visited:clockgarden'));
    app.ui.openMap();
    await until(() => $('.map-node[data-world="clockgarden"]')); // opens on the page she is on
    expect($('.map-node[data-world="clockgarden"] .map-new')).toBeNull();
  });

  it('a logic grid keeps what she set after closing; solving clears the draft', async () => {
    start(PLAY.flat().filter((f) => f !== 'dg-done'));
    await app.toTitle();
    let done = app.ui.puzzle('dg-ritual');
    await until(() => $('.puzzle-logicgrid'));
    $('[data-row="dig"][data-col="who"]').click();
    await until(() => typeof app.game.flag('pdraft:dg-ritual') === 'string');
    $('.puzzle [data-act="close"]').click();
    await done;
    done = app.ui.puzzle('dg-ritual');
    await until(() => $('.puzzle-logicgrid'));
    expect($('.puzzle-feedback').textContent).toMatch(/محفوظ/);
    expect($('[data-row="dig"][data-col="who"]').textContent).toMatch(/سنوكي/);
    const want = { dig: ['snooki', '1'], seed: ['anji', '2'], water: ['ryan', '3'], light: ['both', '4'] };
    const c = PUZZLES['dg-ritual'].config;
    for (const [row, [who, order]] of Object.entries(want)) {
      for (const [col, val] of [['who', who], ['order', order]]) {
        const opts = c.cols.find((x) => x.id === col).options;
        for (let i = 0; i < 6 && !$(`[data-row="${row}"][data-col="${col}"]`).textContent.includes(opts.find((o) => o.id === val).label); i++) {
          $(`[data-row="${row}"][data-col="${col}"]`).click();
          await wait(2);
        }
      }
    }
    $('[data-check]').click();
    await until(() => app.game.flag('dg-done'));
    expect(app.game.flag('pdraft:dg-ritual')).toBeUndefined();
    expect(check(worldById('final').unlock, app.game)).toBe(true);
    $('.puzzle .btn-big').click();
    await done;
  });

  it('the testimony board offers only evidence she has found', async () => {
    start(['dg-box', 'dg-guestbook', 'dg-clock-1', 'dg-clock-2', 'dg-clock-3', 'dg-clock-4', 'dg-letters-read']);
    await app.toTitle();
    const done = app.ui.puzzle('dg-testimony');
    await until(() => $('.puzzle-contradict'));
    const shown = $$('[data-evidence]').map((b) => b.dataset.evidence);
    expect(shown).toContain('guestbook');
    expect(shown).not.toContain('bed'); // not found yet
    expect(shown).not.toContain('log');
    $('.puzzle [data-act="close"]').click();
    await done;
  });
});
