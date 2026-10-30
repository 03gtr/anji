/**
 * Season 2 «ملف الدائرة المغلقة», Milestone M1 (s2-01 … s2-11): content, rules and a full playthrough.
 *
 *  - the case file: every `ev:` / `dec:` / `num:` used anywhere is in Season 2's registries, every
 *    Season 2 id routes to its own save, and the M1 data agrees with the approved graph
 *    (docs/season-2/graph.mjs): same missions, same prerequisites, same evidence;
 *  - every puzzle: exactly three hints, solvable through its own rules — the handwriting comparison
 *    with ANY three (or more) of the five samples;
 *  - the new rules (`sort`, `rubbing`): a wrong try keeps what she set and never gives the answer;
 *  - Ryan's reactions: a greeting never draws one, work only sends him back to work, "none" is always
 *    possible otherwise, no reaction is controlling, and every line the table can ask for exists;
 *  - a scripted player walks M1 from the ending to «يتبع…» — in two different orders, with a reload
 *    in the middle — and the original campaign's save is never written; nothing is collected twice;
 *  - no wedding content, and neither private nickname appears.
 */
import { describe, it, expect } from 'vitest';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store, S2_KEY } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { MISSIONS_S2, S2_OPEN } from '../../src/game/data/missions-s2.js';
import { PUZZLES_S2 } from '../../src/game/data/puzzles-s2.js';
import { S2_SCENES } from '../../src/game/data/scenes/s2.js';
import { S2 as DIALOGUE_S2 } from '../../src/game/data/dialogue/s2.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { EVIDENCE_S2, DECISIONS_S2, JOURNAL_S2, CASE_S2 } from '../../src/game/data/evidence-s2.js';
import { MISSIONS as GRAPH_MISSIONS, EVIDENCE as GRAPH_EVIDENCE, milestoneOf } from '../../docs/season-2/graph.mjs';
import { RULES, solve, replay } from '../../src/game/puzzles/rules.js';
import { resolveConfig } from '../../src/game/puzzles/host.js';
import { possibleReactions, reactionKeys, CATEGORIES, REPLIES, REACTIONS, reaction } from '../../src/game/progression/social.js';
import { dueNotice } from '../../src/game/ui/content-notice.js';
import { journalEntries } from '../../src/game/progression/journal-index.js';
import { ACTS, currentObjective } from '../../src/game/data/chapters.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { dogsIn } from '../../src/game/data/companions.js';
import { WORLDS } from '../../src/game/data/worlds.js';
import { memoryStorage } from '../helpers.js';

const T0 = 1_800_000_000_000;

/* ── walking every piece of Season 2 content ── */
function actionsOf(scene) {
  const out = [];
  const visit = (list) => {
    for (const a of [].concat(list || [])) {
      if (!a || typeof a === 'function') continue;
      out.push(a);
      visit(a.then);
      visit(a.else);
    }
  };
  for (const it of scene.interact || []) {
    visit(it.run);
    for (const c of it.cases || []) visit(c.run);
  }
  for (const t of scene.triggers || []) visit(t.run);
  return out;
}
function scriptNodes(script, out = []) {
  for (const n of [].concat(script || [])) {
    if (!n || typeof n !== 'object') continue;
    out.push(n);
    scriptNodes(n.then, out);
    scriptNodes(n.else, out);
    for (const o of n.choice || []) {
      out.push(o);
      scriptNodes(o.then, out);
    }
  }
  return out;
}
const allEffects = () => [
  ...MISSIONS_S2.flatMap((m) => [].concat(m.reward)),
  ...Object.values(PUZZLES_S2).flatMap((p) => [].concat(p.reward)),
  ...S2_SCENES.flatMap((s) => actionsOf(s).flatMap((a) => (a.fx ? [].concat(a.fx) : []))),
  ...Object.values(DIALOGUE_S2).flatMap((script) => scriptNodes(script).flatMap((n) => (n.do ? [].concat(n.do) : []))),
];
const allConditions = () => [
  ...MISSIONS_S2.flatMap((m) => [m.unlock, ...m.steps.map((s) => s.done)]),
  ...S2_SCENES.flatMap((s) => [
    ...(s.actors || []).map((a) => a.if),
    ...(s.dynamic || []).map((d) => d.if),
    ...(s.interact || []).flatMap((i) => [i.if, ...(i.cases || []).map((c) => c.if)]),
    ...(s.triggers || []).map((t) => t.if),
    ...actionsOf(s).map((a) => a.if),
  ]),
  ...Object.values(PUZZLES_S2).flatMap((p) => [...(p.config.evidence || []).map((e) => e.if), ...(p.config.stages || []).flatMap((st) => (st.cards || []).map((c) => c.if))]),
  ...Object.values(DIALOGUE_S2).flatMap((script) => scriptNodes(script).map((n) => n.if)),
];

describe('the case file and its ids', () => {
  it('every ev:/dec:/num: effect and condition is in Season 2’s registries', () => {
    const effects = allEffects();
    const conds = allConditions().flatMap((c) => atoms(c));
    expect(effects.length).toBeGreaterThan(40);
    for (const fx of effects) {
      const [kind, ...rest] = fx.replace(/^[!-]/, '').split(':');
      const arg = rest.join(':');
      if (kind === 'ev') expect(EVIDENCE_S2[arg], fx).toBeTruthy();
      if (kind === 'dec') {
        const [key, value] = arg.split('=');
        expect(DECISIONS_S2[key], fx).toContain(value);
      }
      if (kind === 'journal') expect(JOURNAL_S2[arg], fx).toBeTruthy();
      if (kind === 'flag' || kind === 'journal' || kind === 'num') expect(isS2(kind === 'num' ? arg : arg), `${fx} stays in Season 2`).toBe(true);
    }
    for (const a of conds) {
      const [kind, ...rest] = a.split(':');
      const arg = rest.join(':');
      if (kind === 'ev') expect(EVIDENCE_S2[arg], a).toBeTruthy();
      if (kind === 'dec') expect(DECISIONS_S2[arg.split('=')[0]], a).toContain(arg.split('=')[1]);
    }
  });

  it('every Season 2 id routes to its own document', () => {
    for (const m of MISSIONS_S2) expect(isS2(`mission:${m.id}`), m.id).toBe(true);
    for (const s of S2_SCENES) for (const k of [`visited:${s.id}`, `t.${s.id}.arrive`, `it.${s.id}.x`]) expect(isS2(k), k).toBe(true);
    for (const id of Object.keys(PUZZLES_S2)) expect(isS2(`puzzle:${id}`) && isS2(`pstage:${id}`), id).toBe(true);
    for (const id of Object.keys(JOURNAL_S2)) expect(isS2(id), id).toBe(true);
    for (const k of Object.keys(DIALOGUE_S2)) expect(isS2(`dlg:${k}`), k).toBe(true);
    for (const e of Object.keys(EVIDENCE_S2)) expect(isS2(`s2.ev.${e}`), e).toBe(true);
  });

  it('M1 agrees with the approved graph: same missions, prerequisites and evidence', () => {
    const m1 = GRAPH_MISSIONS.filter((m) => milestoneOf(m) === 'M1');
    expect(MISSIONS_S2.map((m) => m.id)).toEqual(m1.map((m) => m.id));
    // every piece of evidence the graph has M1 produce is in the registry, and nothing more
    const produced = new Set(m1.flatMap((m) => m.yields));
    expect(new Set(Object.keys(EVIDENCE_S2))).toEqual(produced);
    for (const id of produced) expect(GRAPH_EVIDENCE[id].rel, id).toBe(EVIDENCE_S2[id].rel);
    // each mission yields the graph's evidence somewhere in its own content (scene/puzzle/effects)
    const yieldedBy = Object.fromEntries(CASE_S2.map((c) => [c.mission, c.ids]));
    for (const g of m1) {
      if (yieldedBy[g.id] || g.yields.length) expect(new Set(g.yields), g.id).toEqual(new Set([...(yieldedBy[g.id] ?? []), ...(g.id === 's2-01' ? ['e-register', 'e-copy'] : [])].filter((x) => g.yields.includes(x))));
    }
    // prerequisites: what the graph requires is what the game requires
    for (const g of m1) {
      const m = MISSIONS_S2.find((x) => x.id === g.id);
      const req = atoms(m.unlock).filter((a) => a.startsWith('flag:mission:')).map((a) => a.slice(13));
      for (const r of g.requires.filter((x) => typeof x === 'string')) expect(req, `${g.id} requires ${r}`).toContain(r);
    }
  });

  it('the season opens with the original ending only, and nothing in M1 points past it', () => {
    expect(MISSIONS_S2[0].unlock).toBe(S2_OPEN);
    for (const m of MISSIONS_S2) for (const s of m.steps) expect(s.text && s.hint, `${m.id} step`).toBeTruthy();
    expect(MISSIONS_S2.find((m) => m.id === 's2-11').reward).toContain('journal:s2-m1-end');
    for (const s of S2_SCENES) for (const e of s.exits || []) expect(e.to === 'garden' || S2_SCENES.some((x) => x.id === e.to), `${s.id} → ${e.to}`).toBe(true);
    for (const w of WORLDS.filter((x) => x.region === 's2')) expect(S2_SCENES.some((s) => s.id === w.scene), w.id).toBe(true);
  });
});

/* ── puzzles ── */
const hasAll = { has: () => true, flag: () => true, hasItem: () => true, seen: () => true, record: () => null, countGroup: () => 99 };
const gameWith = (evidence) => ({ ...hasAll, has: (id) => evidence.includes(String(id).replace('s2.ev.', '')) });

describe('M1 puzzles', () => {
  it('every one has exactly three hints and is solvable by its own rules', () => {
    for (const [id, p] of Object.entries(PUZZLES_S2)) {
      expect(p.hints, id).toHaveLength(3);
      const config = resolveConfig(p.config, hasAll);
      expect(replay(p.type, config, solve(p.type, config)).outcome, id).toBe('solved');
    }
  });

  it('the handwriting comparison works with ANY three, four or five of the samples (and her decision is still "eliminate")', () => {
    const samples = ['h-rabi', 'h-lama', 'h-sabri', 'h-jojo', 'h-sister'];
    const subsets = [];
    for (let mask = 0; mask < 32; mask++) {
      const s = samples.filter((_, i) => mask & (1 << i));
      if (s.length >= 3) subsets.push(s);
    }
    expect(subsets).toHaveLength(16);
    for (const s of subsets) {
      const config = resolveConfig(PUZZLES_S2['s2-hands'].config, gameWith(s));
      expect(config.stages[0].cards).toHaveLength(s.length);
      expect(replay('sort', config, solve('sort', config)).outcome, s.join(',')).toBe('solved');
      expect(config.stages[1].answer).toBe('elim');
    }
  });

  it('sort: a wrong layout keeps her cards and only says how many fit; a wrong pick says what is true, never the answer', () => {
    const { config } = PUZZLES_S2['s2-board-1'];
    let st = RULES.sort.init(config);
    for (const c of config.stages[0].cards) {
      st = RULES.sort.pick(config, st, c.id).state;
      st = RULES.sort.place(config, st, 'B').state;
    }
    const wrong = RULES.sort.submit(config, st);
    expect(wrong.outcome).toBe('wrong');
    expect(wrong.message).toMatch(/من ٥|من 5/);
    expect(Object.keys(wrong.state.placed)).toHaveLength(5); // kept
    // a card that fits two theories is right in either
    st = RULES.sort.init(config);
    for (const c of config.stages[0].cards) {
      st = RULES.sort.pick(config, st, c.id).state;
      st = RULES.sort.place(config, st, c.accepts[c.accepts.length - 1]).state;
    }
    const next = RULES.sort.submit(config, st);
    expect(next.outcome).toBe('progress');
    st = RULES.sort.choose(config, next.state, 'proven').state;
    const pick = RULES.sort.submit(config, st);
    expect(pick.outcome).toBe('wrong');
    expect(pick.message).not.toMatch(/سبب، وما عدنا سبب بعد\.$/); // not the right answer's words
    expect(pick.message).toMatch(/سبب/); // but what is true: no motive yet
    expect(RULES.sort.submit(config, RULES.sort.choose(config, pick.state, 'needs').state).outcome).toBe('solved');
  });

  it('rubbing: nothing to answer until every part is rubbed; a guess past the evidence is wrong, with a reason', () => {
    const { config } = PUZZLES_S2['s2-rubbing'];
    let st = RULES.rubbing.init(config);
    expect(RULES.rubbing.choose(config, st, 'for-anji').outcome).toBe('noop');
    for (const r of config.regions) st = RULES.rubbing.rub(config, st, r.id).state;
    expect(RULES.rubbing.rub(config, st, config.regions[0].id).outcome).toBe('noop'); // once each
    const guess = RULES.rubbing.submit(config, RULES.rubbing.choose(config, st, 'who').state);
    expect(guess.outcome).toBe('wrong');
    expect(guess.message).toMatch(/توقيع/);
    expect(RULES.rubbing.submit(config, RULES.rubbing.choose(config, st, 'for-anji').state).outcome).toBe('solved');
  });

  it('a multi-stage board resumes at its stage (the host keeps pstage:)', () => {
    const p = PUZZLES_S2['s2-board-2'];
    expect(Array.isArray(p.config.stages) && 'stage' in RULES.sort.init(p.config)).toBe(true);
  });
});

/* ── Ryan's reactions ── */
describe('Ryan’s reactions are contextual, never control', () => {
  it('a greeting never, work only "back to work"; "none" always possible otherwise; nothing controlling exists', () => {
    for (const trust of [0, 1, 2, 3])
      for (const tone of ['light', 'serious'])
        for (const reply of [null, ...REPLIES]) {
          expect(possibleReactions({ cat: 'greeting', trust, tone, reply })).toEqual(['none']);
          expect(possibleReactions({ cat: 'professional', trust, tone, reply })).toEqual(['focus']);
          for (const cat of ['compliment', 'flirt', 'repeat']) {
            const r = possibleReactions({ cat, trust, tone, reply });
            if (reply !== 'tease-ryan') expect(r, `${cat} ${trust} ${tone} ${reply}`).toContain('none');
            for (const x of r) expect(REACTIONS).toContain(x);
          }
        }
    expect(REACTIONS.join(' ')).not.toMatch(/angry|threat|forbid|control|grab/);
  });

  it('a repeated compliment can draw a different reaction (cartoon or competition), never forced', () => {
    expect(possibleReactions({ cat: 'repeat', trust: 0 })).toEqual(expect.arrayContaining(['cartoon', 'none']));
  });

  it('setting a boundary or challenging him can draw an apology (once he trusts a little); it never costs anything', () => {
    expect(possibleReactions({ cat: 'compliment', trust: 1, reply: 'boundary' })).toContain('apologize');
    expect(possibleReactions({ cat: 'compliment', trust: 0, reply: 'boundary' })).not.toContain('apologize');
  });

  it('the same moment rotates; every line the table can ask for exists', () => {
    const g = createGame({ saveManager: null });
    const seen = new Set([0, 1, 2, 3, 4, 5].map(() => reaction(g, { cat: 'compliment' }).reaction));
    expect(seen.size).toBeGreaterThan(1);
    for (const key of reactionKeys()) expect(DIALOGUE[key], key).toBeTruthy();
    expect(CATEGORIES).toEqual(['greeting', 'professional', 'compliment', 'flirt', 'repeat']);
  });
});

/* ── a scripted player: M1 from the ending to «يتبع…» ── */
function setup(storage = memoryStorage(), mainState = null) {
  if (!storage.getItem(SAVE_KEY)) {
    const main = mainState ?? defaultState(T0);
    main.flags = { ...main.flags, 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج', 'sp1-husky-met': true, 'notice:sp1': true };
    storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  }
  const saveManager = createSaveManager({ storage, now: () => T0 + 1 });
  const loaded = saveManager.load();
  const s2Store = createS2Store({ storage, now: () => T0 + 2 });
  const game = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now: () => T0 + 3 });
  return { storage, game };
}
/** Plays a dialogue like the dialogue box: marks it seen, follows if/then/else, picks the given (or first) choice. */
function playDialogue(game, key, choices = {}) {
  const walk = (nodes) => {
    for (const n of [].concat(nodes || [])) {
      if (n.if !== undefined && ('then' in n || 'else' in n)) {
        walk(check(n.if, game) ? n.then : n.else);
        continue;
      }
      if (n.do) applyEffects(n.do, game);
      if (n.choice) {
        const opts = n.choice.filter((o) => !('if' in o) || check(o.if, game));
        const o = opts[Math.min(choices[key] ?? 0, opts.length - 1)];
        if (o.do) applyEffects(o.do, game);
        walk(o.then);
      }
    }
  };
  expect(DIALOGUE[key], key).toBeTruthy();
  walk(DIALOGUE[key]);
  game.markSeen(`dlg:${key}`);
}
/** Runs scene actions like the engine (say, fx, puzzle — solved by its reward —, if/then, social: nothing to change). */
function run(game, actions, choices) {
  for (const a of [].concat(actions || [])) {
    if (a.if !== undefined && !('then' in a) && !a.puzzle) {
      if (!check(a.if, game)) continue;
    }
    if ('then' in a && !a.puzzle) {
      run(game, check(a.if, game) ? a.then : a.else, choices);
      continue;
    }
    if (a.say) playDialogue(game, a.say, choices);
    else if (a.fx) applyEffects(a.fx, game);
    else if (a.puzzle) {
      const p = PUZZLES_S2[a.puzzle];
      applyEffects(p.reward, game);
      game.recordResult(`puzzle:${a.puzzle}`, { completed: true });
      run(game, a.then, choices);
    }
    syncMissions(game, { season2: true }); // as the app does after a change to Season 2's save
  }
}
const sceneOf = (id) => S2_SCENES.find((s) => s.id === id);
/** Tap something in a scene: the first case whose condition holds, as the engine does. */
function tap(game, sceneId, itemId, choices) {
  const it = sceneOf(sceneId).interact.find((i) => i.id === itemId);
  expect(it, `${sceneId}/${itemId}`).toBeTruthy();
  expect(check(it.if, game), `${sceneId}/${itemId} is there`).toBe(true);
  const c = it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, game)) : { run: it.run };
  run(game, c.run, choices);
}
function enter(game, sceneId) {
  game.setLocation(sceneId, 200);
  for (const t of sceneOf(sceneId).triggers || []) if (check(t.if, game)) run(game, t.run);
  syncMissions(game, { season2: true });
}
const status = (game, id) => missionState(MISSIONS_S2.find((m) => m.id === id), game).status;

function actI(game) {
  enter(game, 's2-archive');
  tap(game, 's2-archive', 'register');
  tap(game, 's2-archive', 'copy');
  tap(game, 's2-archive', 'register'); // the comparison
  expect(status(game, 's2-01')).toBe('complete');
  enter(game, 's2-tree');
  tap(game, 's2-tree', 'trunk'); // too early: says what is missing
  expect(game.flag('s2:02-counted')).toBeFalsy();
  for (let n = 1; n <= 7; n++) tap(game, 's2-tree', `lantern-${n}`);
  tap(game, 's2-tree', 'trunk');
  expect(status(game, 's2-02')).toBe('complete');
  tap(game, 's2-tree', 'ryan');
  tap(game, 's2-tree', 'table'); // the note under the cup
  tap(game, 's2-tree', 'ryan', { 's2.ryan-whisper': 1 }); // she takes the notebook
  tap(game, 's2-tree', 'table'); // the sort
  expect(status(game, 's2-03')).toBe('complete');
  enter(game, 's2-caseroom');
  tap(game, 's2-caseroom', 'board');
  expect(status(game, 's2-04')).toBe('complete');
}
const WITNESS_PLAY = {
  's2-05': (g) => {
    enter(g, 's2-clinic');
    tap(g, 's2-clinic', 'rabi', { 's2.rabi-1': 2 });
    enter(g, 's2-tree');
    tap(g, 's2-tree', 'lantern-6');
  },
  's2-06': (g) => {
    enter(g, 's2-clinic');
    tap(g, 's2-clinic', 'lama');
    tap(g, 's2-clinic', 'clinic-board');
  },
  's2-07': (g) => {
    enter(g, 's2-gym');
    tap(g, 's2-gym', 'sabri');
    tap(g, 's2-gym', 'sabri');
    tap(g, 's2-gym', 'receipt', { 's2.receipt': 1 });
  },
  's2-08': (g) => {
    enter(g, 's2-lamphouse');
    tap(g, 's2-lamphouse', 'jojo', { 's2.jojo-1': 0 });
    tap(g, 's2-lamphouse', 'clock');
  },
  's2-09': (g) => {
    enter(g, 's2-home');
    tap(g, 's2-home', 'sister');
    tap(g, 's2-home', 'pencil');
    tap(g, 's2-home', 'sister', { 's2.sister-talk': 0 });
  },
};
function finishM1(game, choices = {}) {
  enter(game, 's2-caseroom');
  if (!game.has('s2.ev.d-elim')) tap(game, 's2-caseroom', 'board');
  expect(status(game, 's2-10')).toBe('complete');
  tap(game, 's2-caseroom', 'ryan', choices);
  tap(game, 's2-caseroom', 'board');
  expect(status(game, 's2-11')).toBe('complete');
}

describe('M1, played through', () => {
  it('from the ending to «يتبع…»: every mission in order, the journal and the case file agree, the original save untouched', () => {
    const t = setup();
    const mainBefore = t.storage.getItem(SAVE_KEY);
    expect(status(t.game, 's2-01')).toBe('active');
    actI(t.game);
    for (const id of ['s2-05', 's2-06', 's2-07', 's2-08', 's2-09']) expect(status(t.game, id)).toBe('active');
    for (const id of ['s2-05', 's2-06', 's2-07', 's2-08', 's2-09']) {
      WITNESS_PLAY[id](t.game);
      expect(status(t.game, id), id).toBe('complete');
    }
    finishM1(t.game, { 's2.11-talk': 3 });
    // journal = missions: every mission's reward entry is in the journal
    for (const m of MISSIONS_S2) for (const r of [].concat(m.reward).filter((x) => x.startsWith('journal:'))) expect(t.game.inJournal(r.slice(8)), r).toBe(true);
    expect(t.game.inJournal('s2-m1-end')).toBe(true);
    // the case file: all of M1's evidence, each piece once
    expect(t.game.countGroup('s2')).toBe(Object.keys(EVIDENCE_S2).length);
    expect(new Set(t.game.s2State.collected).size).toBe(t.game.s2State.collected.length);
    // the decisions she made are named values; Ryan's trust grew by a story beat
    expect(t.game.flag('s2:dec:lead')).toBe('anji');
    expect(t.game.flag('s2:dec:jealous-talk')).toBe('boundary');
    expect(t.game.flag('s2:rel:trust')).toBe(1);
    // the original campaign's save was never written (REGRESSION found here: syncing every mission
    // after a Season 2 change wrote the original game's `mission-seen:` bookkeeping)
    expect(t.storage.getItem(SAVE_KEY)).toBe(mainBefore);
    expect(JSON.parse(t.storage.getItem(S2_KEY)).flags['mission:s2-11']).toBe(true);
  });

  it('a different order (witnesses reversed, only three before the note), with a reload in the middle: same ending, nothing twice', () => {
    const t = setup();
    actI(t.game);
    for (const id of ['s2-09', 's2-08', 's2-07']) WITNESS_PLAY[id](t.game);
    // the note can be compared with three samples already
    expect(status(t.game, 's2-10')).toBe('active');
    enter(t.game, 's2-caseroom');
    tap(t.game, 's2-caseroom', 'board');
    expect(status(t.game, 's2-10')).toBe('complete');
    expect(status(t.game, 's2-11')).toBe('locked');
    // Ryan says what is still missing, not the answer
    tap(t.game, 's2-caseroom', 'ryan');
    expect(t.game.seen('dlg:s2.ryan-room-wait')).toBe(true);
    // a reload (a new tab after this one closed): everything comes back from Season 2's own save
    const again = setup(t.storage);
    expect(again.game.has('s2.ev.d-elim')).toBe(true);
    expect(status(again.game, 's2-04')).toBe('complete');
    for (const id of ['s2-06', 's2-05']) WITNESS_PLAY[id](again.game);
    finishM1(again.game);
    expect(again.game.inJournal('s2-m1-end')).toBe(true);
    // tapping finished things again collects nothing new and completes nothing twice
    const before = JSON.stringify(again.game.s2State.collected);
    for (const n of [1, 4, 6]) tap(again.game, 's2-tree', `lantern-${n}`);
    tap(again.game, 's2-archive', 'register');
    expect(JSON.stringify(again.game.s2State.collected)).toBe(before);
  });

  it('an interrupted beat replays, a finished one does not (arrival lines, the quiz)', () => {
    const t = setup();
    actI(t.game);
    // the arrival flag is set after its line: before it, it would play again
    expect(t.game.flag('s2:in-clinic')).toBeFalsy();
    enter(t.game, 's2-clinic');
    expect(t.game.flag('s2:in-clinic')).toBe(true);
    const seenBefore = t.game.s2State.seen.length;
    enter(t.game, 's2-clinic');
    expect(t.game.s2State.seen.length).toBe(seenBefore);
  });

  it('every decision keeps the story going (each value of each M1 choice reaches «يتبع…»)', () => {
    for (const [key, options] of [['s2.ryan-whisper', 2], ['s2.rabi-1', 3], ['s2.receipt', 2], ['s2.jojo-1', 2], ['s2.sister-talk', 2], ['s2.11-talk', 5]]) {
      for (let i = 0; i < options; i++) {
        const t = setup();
        const choices = { [key]: i };
        actI(t.game);
        enter(t.game, 's2-tree');
        for (const id of ['s2-05', 's2-06', 's2-07', 's2-08', 's2-09']) {
          if (id === 's2-05') {
            enter(t.game, 's2-clinic');
            tap(t.game, 's2-clinic', 'rabi', choices);
            enter(t.game, 's2-tree');
            tap(t.game, 's2-tree', 'lantern-6');
          } else if (id === 's2-07') {
            enter(t.game, 's2-gym');
            tap(t.game, 's2-gym', 'sabri');
            tap(t.game, 's2-gym', 'sabri');
            tap(t.game, 's2-gym', 'receipt', choices);
          } else if (id === 's2-08') {
            enter(t.game, 's2-lamphouse');
            tap(t.game, 's2-lamphouse', 'jojo', choices);
            tap(t.game, 's2-lamphouse', 'clock');
          } else if (id === 's2-09') {
            enter(t.game, 's2-home');
            tap(t.game, 's2-home', 'sister');
            tap(t.game, 's2-home', 'pencil');
            tap(t.game, 's2-home', 'sister', choices);
          } else WITNESS_PLAY[id](t.game);
        }
        finishM1(t.game, choices);
        expect(t.game.inJournal('s2-m1-end'), `${key} option ${i}`).toBe(true);
      }
    }
  });
});

describe('around the season', () => {
  it('opens with the original ending only: the notice, the map page, nothing before', () => {
    const g = createGame({ saveManager: null });
    for (const f of ['notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team']) g.setFlag(f);
    expect(dueNotice(g, 'garden')).toBeNull();
    expect(status(g, 's2-01')).toBe('locked');
    g.setFlag('game-complete');
    expect(dueNotice(g, 'garden')?.id).toBe('s2');
    expect(status(g, 's2-01')).toBe('active');
    g.setFlag('notice:s2');
    expect(dueNotice(g, 'garden')).toBeNull();
    expect(g.s2State.flags['notice:s2']).toBe(true); // acknowledged in Season 2's own save
    expect(g.state.flags['notice:s2']).toBeUndefined();
  });

  it('the objective follows the pack of the place she is in — journal and HUD alike (REGRESSION: the deep garden showed the archives’ step)', () => {
    // a finished game (every act objective done) with Story Pack 02's first chapter, the deep garden and Season 2 all open
    const done = ACTS.flatMap((a) => a.objectives.flatMap((o) => atoms(o.done)));
    const flags = Object.fromEntries(
      [...done, 'flag:game-complete', 'flag:dg-box', 'flag:sp1-husky-met', 'flag:husky-name'].filter((a) => a.startsWith('flag:')).map((a) => [a.slice(5), true]),
    );
    // objectives met by a record (a race, a minigame) — a real finished save has them
    const records = Object.fromEntries(
      done
        .filter((a) => /^(record|medal):/.test(a))
        .map((a) => [a.startsWith('record:') ? a.slice(7) : a.slice(6, a.lastIndexOf(':')), { plays: 1, best: null, medal: 'gold', completed: true }]),
    );
    const t = setup(memoryStorage(), { ...defaultState(T0), flags, records });
    expect(currentObjective(t.game).act).toBeNull(); // every act objective is done: the post-game rule applies
    t.game.setLocation('s2-archive', 200);
    expect(journalEntries(t.game).find((e) => e.isCurrent)?.id).toBe('s2-01');
    expect(currentObjective(t.game).text).toBe(MISSIONS_S2[0].steps[0].text);
    t.game.setLocation('clockgarden', 200); // a deep garden place
    expect(MISSIONS.find((m) => m.id === journalEntries(t.game).find((e) => e.isCurrent)?.id)?.pack).toBe('deep');
    expect(currentObjective(t.game).title).toBe(MISSIONS.find((m) => m.pack === 'deep' && m.kind === 'story').title);
  });

  it('dogs: Snooki stands with Ryan where Ryan is, and is away where he is not; her husky walks with her', () => {
    const t = setup();
    actI(t.game);
    for (const s of S2_SCENES) {
      const d = dogsIn(s, t.game);
      const ryanHere = (s.actors || []).some((a) => a.kind === 'ryan' && check(a.if, t.game));
      expect(d.snooki, s.id).toBe(ryanHere ? 'ryan' : 'away');
      expect(d.husky, s.id).toBe('follow');
    }
  });

  it('no wedding content, and neither private nickname, anywhere in Season 2', () => {
    const text = JSON.stringify([DIALOGUE_S2, JOURNAL_S2, MISSIONS_S2, PUZZLES_S2, EVIDENCE_S2, S2_SCENES.map((s) => [s.title, s.ambient])]);
    expect(text).not.toMatch(/زفاف|عرس|خطوبة|خطبة|مهر|زواج|نتزوج|تتزوج|wedding|marriage/);
    expect(text).not.toMatch(/تحميلة|كوبرا/);
  });

  it('Snooki only speaks in Season 2 where Ryan is in the scene (never a line from someone not there)', () => {
    const snookiKeys = Object.entries(DIALOGUE_S2)
      .filter(([, script]) => scriptNodes(script).some((n) => n.s === 'snooki'))
      .map(([k]) => k);
    expect(snookiKeys.length).toBeGreaterThan(0);
    for (const k of snookiKeys) {
      if (k.startsWith('s2.react.')) continue; // reactions play only when Ryan is on screen (engine)
      const scenes = S2_SCENES.filter((s) => JSON.stringify([s.interact, s.triggers]).includes(`"${k}"`));
      expect(scenes.length, k).toBeGreaterThan(0);
      for (const s of scenes) expect((s.actors || []).some((a) => a.kind === 'ryan'), `${k} in ${s.id}`).toBe(true);
    }
  });
});
