/**
 * Season 2, M2 — Mission 06 «حقيقة البطاقة» (s2-17; src/game/data/m2/m06-truth.js), the season's finale.
 *
 * - the rebuild: six moments of the night, one order only — every clue on the board is needed, and a blind guess
 *   is one in 720; strict (no help), and nothing before it names the order;
 * - the defence (puzzles/defend.js, ui/defend.js): A, B and C each meet a challenge nothing answers and break;
 *   D survives every challenge, each answered only by the evidence that answers it; a wrong piece is answered
 *   neutrally; "no answer" to a challenge that has one only steps her back; nothing is ever disabled; random
 *   guessing rarely works; nothing she reads before a challenge names its answer;
 * - every value of office-cover, stash, jojo-confront, sister-wish, lead and jealous-talk changes what is said or
 *   done (the differing lines and actions are compared);
 * - played through from its own data for several decision combinations: the case room, the garden at night, the
 *   last line; ids in Season 2's save; the original save byte-identical;
 * - M1's case room is exactly as shipped until Mission 06 opens;
 * - the defence bar in the real interface: no help controls, neutral wrong lines, B breaks, D holds.
 * Prior missions (02, 04, 05) are not depended on: their flags, evidence and decisions are set directly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { RULES, solve, replay } from '../../src/game/puzzles/rules.js';
import { canSkip, STRICT_WRONG } from '../../src/game/puzzles/host.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { S2_SCENES } from '../../src/game/data/scenes/s2.js';
import { EVIDENCE_S2, CASE_S2, DECISIONS_S2 } from '../../src/game/data/evidence-s2.js';
import { EVIDENCE_S2_M2, CASE_S2_M2, DECISIONS_S2_M2, JOURNAL_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import { JOURNAL } from '../../src/game/data/items.js';
import { MISSIONS as GRAPH, EVIDENCE as GRAPH_EVIDENCE } from '../../docs/season-2/graph.mjs';
import { defend, holds, defendSolution, replayDefend } from '../../src/game/puzzles/defend.js';
import { openDefence, variantOf, heldEvidence, loadDefence } from '../../src/game/ui/defend.js';
import { createGameApp } from '../../src/game/app.js';
import M06, { DEFENCE } from '../../src/game/data/m2/m06-truth.js';
import { M2_MODULES } from '../../src/game/data/m2/index.js';

/** The evidence Mission 06 answers with that earlier missions register (and which mission). */
const EARLIER = { 'e-page': 's2-13', 'e-wrapper': 's2-13', 'd-chain': 's2-15', 'd-timeline': 's2-16', 'e-surprise': 's2-16' };
import { memoryStorage } from '../helpers.js';

const T0 = 1_800_000_000_000;
const ORDER = PUZZLES['s2-night-order'];
const M = MISSIONS.find((m) => m.id === 's2-17');
const ROOM = SCENES['s2-caseroom']; // M1's place, as extended by the modules
const ROOM_M1 = S2_SCENES.find((s) => s.id === 's2-caseroom'); // as first shipped
const FINALE = SCENES['s2-finale'];
const C = DEFENCE.config;

/** Evidence other missions yield (graph.mjs): set directly, never through their modules. */
const PRIOR = ['e-versions', 'e-oilcan', 'e-logbook', 'e-loft', 't-jojo-true', 'e-page', 'e-wrapper', 'd-chain', 'd-timeline', 'e-surprise'];
const M1_EVIDENCE = CASE_S2.flatMap((c) => c.ids);
const HELD = [...new Set([...M1_EVIDENCE, 'f-rota', 'f-calendar', 'f-sticky', 'f-print', ...PRIOR])]; // all she holds by s2-17

/* ── the rebuild ── */
describe('the rebuild: the night in order', () => {
  const answer = ORDER.config.slots.map((s) => s.accepts[0]);
  // the board's five clues, as relations between the moments (the puzzle's `example`)
  const CLUES = [
    (o) => o.indexOf('words') === 0, // Lama told her sister two days BEFORE the night
    (o) => o.indexOf('note') < o.indexOf('lanterns'), // Ryan found the note at 8:30, the tree still dark
    (o) => o.indexOf('lanterns') < o.indexOf('card'), // her sister stood by the fourth lantern until it was lit
    (o) => o.indexOf('clock') + 1 === o.indexOf('lanterns'), // lit the moment the garden clock said nine, nothing between
    (o) => o.indexOf('card') < o.indexOf('page'), // the torn page's last line: the fourth holds a blank card
  ];
  const perms = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
  const all = perms(ORDER.config.pieces.map((p) => p.id));

  it('720 possible orders; exactly one fits the clues, and it is the board\'s; every clue is needed', () => {
    expect(all).toHaveLength(720);
    const fits = all.filter((o) => CLUES.every((c) => c(o)));
    expect(fits).toEqual([answer]);
    for (let k = 0; k < CLUES.length; k++) expect(all.filter((o) => CLUES.every((c, j) => j === k || c(o))).length, `clue ${k + 1}`).toBeGreaterThan(1);
    expect(ORDER.example.match(/<li>/g)).toHaveLength(CLUES.length);
  });

  it('the rule: the true order solves; a wrong one is only "wrong" (strict: the shared neutral line, never a count)', () => {
    const c = ORDER.config;
    let s = RULES.arrange.init(c);
    for (const [i, id] of [...answer].reverse().entries()) s = RULES.arrange.place(c, RULES.arrange.pick(c, s, id).state, `t${i + 1}`).state;
    expect(RULES.arrange.check(c, s).outcome).toBe('wrong');
    expect(replay('arrange', c, solve('arrange', c)).outcome).toBe('solved');
    expect(ORDER.strict && ORDER.noSkip && ORDER.noSolution).toBe(true);
    expect(ORDER.hints).toBeUndefined();
    expect(canSkip(ORDER, { mistakes: 99, hintsUsed: 99 })).toBe(false);
  });
});

/* ── the defence ── */
describe('the defence: choose a theory, then defend it', () => {
  it('A, B and C each meet a challenge nothing answers, and break; only D holds', () => {
    expect(C.hypotheses).toEqual(['A', 'B', 'C', 'D']);
    expect(C.hypotheses.filter((h) => holds(C, h))).toEqual(['D']);
    for (const hyp of ['A', 'B', 'C']) {
      let s = defend.choose(C, defend.init(), hyp).state;
      for (const ev of HELD) expect(defend.present(C, s, ev).outcome, `${hyp} answered by ${ev}`).toBe('wrong');
      const r = defend.concede(C, s);
      expect(r.outcome).toBe('broken');
      expect(r.state.broken).toEqual([hyp]);
      expect(r.state.pick).toBeNull();
      // a broken theory is never disabled: it can be chosen again (and breaks again)
      s = defend.choose(C, r.state, hyp).state;
      expect(s.pick).toBe(hyp);
      expect(defend.concede(C, s).state.broken).toEqual([hyp]);
    }
  });

  it('D survives every challenge — each answered only by the evidence that answers it, wherever she starts', () => {
    expect(replayDefend(C, defendSolution(C)).outcome).toBe('solved');
    // B breaks first, then D (the fair retry loop)
    let s = defend.concede(C, defend.choose(C, defend.init(), 'B').state).state;
    s = defend.choose(C, s, 'D').state;
    for (const [i, ch] of C.challenges.D.entries()) {
      const wrong = HELD.filter((e) => !ch.answer.includes(e));
      for (const e of wrong) expect(defend.present(C, s, e).outcome, `${ch.id} ← ${e}`).toBe('wrong');
      for (const e of ch.answer) expect(HELD, `${ch.id}: ${e} can be held by now`).toContain(e);
      const r = defend.present(C, s, ch.answer[ch.answer.length - 1]);
      expect(r.outcome).toBe(i === C.challenges.D.length - 1 ? 'solved' : 'progress');
      s = r.state;
    }
    expect(s.broken).toEqual(['B']);
  });

  it('"no answer" to a challenge that has one only steps her back; what she answered is kept', () => {
    let s = defend.choose(C, defend.init(), 'D').state;
    s = defend.present(C, s, C.challenges.D[0].answer[0]).state;
    s = defend.present(C, s, C.challenges.D[1].answer[0]).state;
    const r = defend.concede(C, s);
    expect(r.outcome).toBe('progress');
    expect(r.state.broken).toEqual([]);
    expect(defend.choose(C, r.state, 'D').state.i).toBe(2);
    expect(defend.present(C, defend.init(), 'e-page').outcome).toBe('noop'); // nothing chosen yet
  });

  it('random guessing rarely works: four theories, and every challenge needs one of a few among everything she holds', () => {
    expect(C.hypotheses.length).toBeGreaterThan(3);
    for (const ch of C.challenges.D) expect(HELD.length / ch.answer.length, ch.id).toBeGreaterThanOrEqual(8);
    const whole = C.hypotheses.length * C.challenges.D.reduce((n, ch) => n * (HELD.length / ch.answer.length), 1);
    expect(whole).toBeGreaterThan(20);
  });

  it('the needs of the graph are what the board and the defence use', () => {
    const g = GRAPH.find((m) => m.id === 's2-17');
    expect(g.requires).toEqual(['s2-16']);
    expect(g.yields).toEqual(['d-case']);
    const answers = new Set(C.challenges.D.flatMap((c) => c.answer));
    for (const e of ['d-chain', 'd-timeline', 'e-logbook', 'e-surprise', 'e-loft']) expect(answers.has(e), e).toBe(true);
    expect(ORDER.example).toMatch(/حلويات ريان/); // the wrapper, on the board
    for (const id of Object.keys(EARLIER)) expect(GRAPH_EVIDENCE[id], id).toBeTruthy();
    expect(M.unlock).toBe('flag:mission:s2-16');
  });

  it('the evidence it takes from earlier missions is theirs: registered by their modules, yielded on the graph', () => {
    for (const [id, mission] of Object.entries(EARLIER)) {
      const owner = M2_MODULES.filter((m) => m.evidence?.[id]);
      expect(owner.map((m) => m.missions[0].id), id).toEqual([mission]);
      expect(EVIDENCE_S2_M2[id], id).toBe(owner[0].evidence[id]);
      expect(GRAPH.find((m) => m.id === mission).yields, id).toContain(id);
    }
    expect(Object.keys(M06.evidence)).toEqual(['d-case']);
    expect(Object.keys(DEFENCE)).not.toContain('fallback'); // no stand-in labels: the defence bar shows the real ones
  });

  it('every answer of the defence is registered evidence the graph yields before the defence', () => {
    // the missions certainly done before the defence: plain prerequisites only ("any 3 of 5" guarantees none of them)
    const before = new Set();
    const walk = (id) => {
      for (const r of GRAPH.find((x) => x.id === id).requires) {
        if (typeof r === 'string' && !before.has(r)) {
          before.add(r);
          walk(r);
        }
      }
    };
    walk('s2-17');
    const yielded = new Set(GRAPH.filter((m) => before.has(m.id)).flatMap((m) => m.yields));
    for (const ch of Object.values(DEFENCE.challenges).flat()) {
      for (const e of ch.answer || []) {
        expect(EVIDENCE_S2[e] || EVIDENCE_S2_M2[e], `${ch.id}: ${e} registered`).toBeTruthy();
        expect(yielded.has(e), `${ch.id}: ${e} yielded before s2-17`).toBe(true);
      }
    }
  });

  it('the challenge words and staging are acted out by people who are there', () => {
    for (const [hyp, list] of Object.entries(DEFENCE.challenges)) {
      for (const ch of list) {
        for (const v of ch.variants) {
          expect(v.intro?.length, `${ch.id}: staged`).toBeGreaterThan(0);
          expect(v.intro.some((a) => a.move || a.all || a.camera), `${ch.id}: someone moves or the camera frames`).toBe(true);
          expect(DIALOGUE[v.deflect], `${ch.id}: ${v.deflect}`).toBeTruthy();
          if (ch.answer) expect(v.answered.some((a) => a.say && DIALOGUE[a.say]), `${ch.id}: answered`).toBe(true);
        }
      }
      if (hyp !== 'D') {
        const broken = DEFENCE.hypotheses[hyp].broken;
        const acts = DIALOGUE[broken[0].say].flatMap((n) => n.act || []);
        expect(acts.some((a) => a.jolt || a.puff || a.move || a.pose), `${hyp}: the blamed person reacts`).toBe(true);
      }
    }
  });
});

/* ── nothing gives an answer before it is earned ── */
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

describe('no help, and no answer before she earns it', () => {
  it('the rebuild: nothing she reads before it names the order', () => {
    const before = [ORDER.title, ORDER.goal, ORDER.intro, M.summary, ...M.steps.map((s) => s.text), ...['s2.17-gather', 's2.17-board-intro'].flatMap(lines), ...ORDER.config.pieces.map((p) => p.label), ...ORDER.config.slots.map((s) => s.label)];
    for (const t of before) for (const w of ['الكلام أول', 'الجملة أول', 'البطاقة قبل الورقة', 'الورقة قبل الساعة', 'الصفحة آخر', 'آخر شي الصفحة']) expect(t.includes(w), `«${w}» in «${t}»`).toBe(false);
  });

  it('the defence: no challenge, deflection, label or line before it names the answer', () => {
    const variants = Object.values(DEFENCE.challenges).flat().flatMap((c) => c.variants);
    const before = [
      ...variants.flatMap((v) => [v.t, v.name, ...lines(v.deflect)]),
      ...Object.values(DEFENCE.hypotheses).map((h) => h.title),
      ...Object.values(DEFENCE.labels).filter((l) => typeof l === 'string'),
      ...['s2.17-defend-intro', 's2.17-order-done', 's2.17-step-back', 's2.17-ryan-room', 's2.17-talk-rabi', 's2.17-talk-lama', 's2.17-talk-sabri', 's2.17-talk-jojo', 's2.17-talk-sister'].flatMap(lines),
      M.summary,
      ...M.steps.map((s) => s.text),
    ];
    // what answers each challenge, in the words a leak would use
    const answer = ['الساعة چانت متأخرة', 'وكت ساعة الحديقة', 'أقصر', 'أخوف', 'ثلاث نسخ', 'مثل ما انطلب', 'ريان طلب', 'آثار سنون', 'سنونها', 'سلسلة', 'خفتي عليّ', 'مفاجأة', 'الورد'];
    for (const text of before) for (const w of answer) expect(text.includes(w), `«${w}» in «${text}»`).toBe(false);
  });

  it('a challenge never names the evidence that answers it', () => {
    for (const ch of Object.values(DEFENCE.challenges).flat()) {
      for (const v of ch.variants) {
        for (const e of ch.answer || []) {
          const label = EVIDENCE_S2[e]?.label ?? EVIDENCE_S2_M2[e]?.label;
          expect(label, e).toBeTruthy();
          expect(v.t.includes(label), `${label} in «${v.t}»`).toBe(false);
        }
      }
    }
  });
});

/* ── decisions: every value changes something ── */
function gameWith(dec = {}, flags = []) {
  const g = createGame({ saveManager: null });
  for (const [k, v] of Object.entries(dec)) g.setFlag(`s2:dec:${k}`, v);
  for (const f of flags) g.setFlag(f);
  return g;
}
/** The lines (and their actions) a dialogue plays for this player. */
function played(g, key) {
  const out = [];
  const walk = (nodes) => {
    for (const n of [].concat(nodes || [])) {
      if ('if' in n && !n.t && !n.choice) {
        walk(check(n.if, g) ? n.then : n.else);
        continue;
      }
      out.push({ s: n.s, t: n.t, act: n.act || null });
    }
  };
  walk(DIALOGUE[key]);
  return out;
}
const challenge = (id) => Object.values(DEFENCE.challenges).flat().find((c) => c.id === id);

describe('earlier decisions change the defence and the ending', () => {
  it('office-cover: Sabri\'s challenge, his answer, and his line in the garden', () => {
    const [cover, truth] = ['cover', 'truth'].map((v) => gameWith({ 'office-cover': v }));
    expect(variantOf(challenge('d-sabri'), cover).t).not.toBe(variantOf(challenge('d-sabri'), truth).t);
    expect(variantOf(challenge('d-sabri'), cover).answered).not.toEqual(variantOf(challenge('d-sabri'), truth).answered);
    expect(played(cover, 's2.17-sabri')).not.toEqual(played(truth, 's2.17-sabri'));
    expect(played(cover, 's2.17-sabri').map((l) => l.t).join()).toMatch(/الطابعة/);
  });

  it('jojo-confront: Jojo\'s challenge, his answer, and how he hands Ryan the match', () => {
    const [gentle, blunt] = ['gentle', 'blunt'].map((v) => gameWith({ 'jojo-confront': v }));
    expect(variantOf(challenge('d-jojo'), gentle).t).not.toBe(variantOf(challenge('d-jojo'), blunt).t);
    expect(variantOf(challenge('d-jojo'), gentle).intro).not.toEqual(variantOf(challenge('d-jojo'), blunt).intro);
    expect(played(gentle, 's2.17-match')).not.toEqual(played(blunt, 's2.17-match'));
    expect(played(blunt, 's2.17-match').some((l) => l.s === 'anji')).toBe(true); // she owns her bluntness
  });

  it('stash: who raises the page (her husky, or Snooki), and the husky in the garden', () => {
    const [keep, ret] = ['keep', 'return'].map((v) => gameWith({ stash: v }));
    expect(variantOf(challenge('d-page'), keep).who).toBe('husky');
    expect(variantOf(challenge('d-page'), ret).who).toBe('snooki');
    expect(played(keep, 's2.17-husky')).not.toEqual(played(ret, 's2.17-husky'));
    expect(played(ret, 's2.17-husky').some((l) => l.act?.some((a) => a.move === 'husky'))).toBe(true);
  });

  it('sister-wish: her sister\'s challenge, her answer, and the last scene (read, or left open)', () => {
    const [read, leave] = ['read', 'leave'].map((v) => gameWith({ 'sister-wish': v }));
    expect(variantOf(challenge('d-sister'), read).t).not.toBe(variantOf(challenge('d-sister'), leave).t);
    expect(played(read, 's2.17-sister')).not.toEqual(played(leave, 's2.17-sister'));
    expect(played(leave, 's2.17-sister').map((l) => l.t).join()).toMatch(/بيضاء/); // the wish stays open
    expect(played(read, 's2.17-sister').map((l) => l.t).join()).toMatch(/گريتها/);
  });

  it('lead (M1): who stamps the case closed', () => {
    const [ryan, anji] = ['ryan', 'anji'].map((v) => played(gameWith({ lead: v }), 's2.17-stamp'));
    expect(ryan).not.toEqual(anji);
    expect(ryan.map((l) => l.t).join()).toMatch(/الرئيس يسلّم الختم/);
    expect(anji.map((l) => l.t).join()).toMatch(/الانقلاب اكتمل/);
  });

  it('jealous-talk (M1): five answers, five different Ryans when Rabi compliments his lantern — playful, never control', () => {
    const variants = DECISIONS_S2['jealous-talk'].map((v) => played(gameWith({ 'jealous-talk': v }), 's2.17-rabi'));
    expect(new Set(variants.map((v) => JSON.stringify(v))).size).toBe(5);
    expect(variants[1].some((l) => l.act?.some((a) => a.puff === 'ryan'))).toBe(true); // tease: cartoon steam
    for (const v of variants) expect(v.map((l) => l.t).join()).not.toMatch(/لا تحچين|ممنوع|لازم ما/);
  });

  it('every value of the decisions this mission reads appears in a condition', () => {
    const read = new Set();
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      for (const [k, v] of Object.entries(x)) {
        if (k === 'if') [].concat(v).forEach((c) => typeof c === 'string' && read.add(c.replace(/^!/, '')));
        else walk(v);
      }
    };
    walk([M06.dialogue, DEFENCE.challenges]);
    const values = { ...DECISIONS_S2, ...DECISIONS_S2_M2, stash: ['keep', 'return'], 'sister-wish': ['read', 'leave'] };
    for (const key of ['office-cover', 'stash', 'jojo-confront', 'sister-wish', 'lead', 'jealous-talk']) {
      for (const v of values[key]) expect(read.has(`dec:${key}=${v}`), `dec:${key}=${v}`).toBe(true);
    }
    expect(Object.keys(M06.decisions)).toEqual([]); // it makes none
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
  return { game, snapshot };
}
function say(game, nodes) {
  for (const n of [].concat(nodes || [])) {
    if ('if' in n && !n.t && !n.choice) {
      say(game, check(n.if, game) ? n.then : n.else);
      continue;
    }
    if (n.do) applyEffects(n.do, game);
  }
}
/**
 * A run list as the engine runs it. A puzzle is solved (its reward); the defence is played by the rule with
 * `script` (moves), its progress kept as the bar keeps it; `goto` is noted.
 */
function run(t, actions) {
  for (const a of [].concat(actions || [])) {
    if (typeof a === 'function' && a.defence) {
      const def = a.defence;
      let s = loadDefence(def, t.game);
      let outcome = 'noop';
      for (const [move, ...args] of t.script) {
        const r = defend[move](def.config, s, ...args);
        s = r.state;
        outcome = r.outcome;
        t.outcomes.push(outcome);
        for (const hyp of s.broken) t.game.setFlag(`${def.save}-broke-${hyp.toLowerCase()}`);
        for (const [hyp, n] of Object.entries(s.done)) t.game.setFlag(`${def.save}-held-${hyp.toLowerCase()}`, n);
      }
      if (outcome === 'solved') t.game.setFlag(def.solved);
      run(t, outcome === 'solved' ? a.then : a.else);
    } else if (a.say) say(t.game, DIALOGUE[a.say]);
    else if (a.fx) applyEffects(a.fx, t.game);
    else if (a.all) run(t, a.all);
    else if (a.puzzle) {
      applyEffects(PUZZLES[a.puzzle].reward, t.game);
      t.game.recordResult(`puzzle:${a.puzzle}`, { completed: true });
      run(t, a.then);
    } else if (a.goto) t.went = a.goto;
    else if ('if' in a && 'then' in a) run(t, check(a.if, t.game) ? a.then : a.else);
    syncMissions(t.game, { season2: true });
  }
}
/** Tapping a thing: what it does now (null when it is not there). */
function tap(t, scene, id) {
  const it = SCENES[scene].interact.find((i) => i.id === id);
  if (!it || !check(it.if, t.game)) return null;
  const c = it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, t.game)) : it;
  if (!c) return null;
  run(t, c.run);
  return c.run;
}
const arrive = (t, scene) => {
  for (const tr of SCENES[scene].triggers || []) if (check(tr.if, t.game)) run(t, tr.run);
};
const M1_DONE = ['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11'];
const toMission06 = (g, dec) => {
  for (const id of [...M1_DONE, 's2-12', 's2-13', 's2-14', 's2-15', 's2-16']) g.setFlag(`mission:${id}`);
  for (const k of ['in-archive', 'in-caseroom', 'caseroom-open', 'board-1', 'board-2']) g.setFlag(`s2:${k}`);
  for (const e of HELD) g.collect(`s2.ev.${e}`);
  for (const [k, v] of Object.entries(dec)) g.setFlag(`s2:dec:${k}`, v);
  syncMissions(g, { season2: true });
};
const COMBOS = [
  { 'office-cover': 'cover', stash: 'keep', 'jojo-confront': 'gentle', 'sister-wish': 'read', lead: 'ryan', 'jealous-talk': 'reassure' },
  { 'office-cover': 'truth', stash: 'return', 'jojo-confront': 'blunt', 'sister-wish': 'leave', lead: 'anji', 'jealous-talk': 'tease' },
  { 'office-cover': 'cover', stash: 'return', 'jojo-confront': 'blunt', 'sister-wish': 'read', lead: 'anji', 'jealous-talk': 'challenge' },
  { 'office-cover': 'truth', stash: 'keep', 'jojo-confront': 'gentle', 'sister-wish': 'leave', lead: 'ryan', 'jealous-talk': 'boundary' },
  { 'office-cover': 'truth', stash: 'keep', 'jojo-confront': 'blunt', 'sister-wish': 'read', lead: 'ryan', 'jealous-talk': 'subject' },
];

describe('Mission 06, played through from its own data', () => {
  for (const [n, dec] of COMBOS.entries()) {
    it(`a whole playthrough (${Object.values(dec).join(', ')}): the board, B breaks, D holds, the garden, the last line; the original save byte-identical`, () => {
      const t = { ...setup(), script: [], outcomes: [], went: null };
      toMission06(t.game, dec);
      expect(missionState(M, t.game).status).toBe('active');
      const before = t.snapshot();
      // everyone is in the case room: the gathering plays as she arrives
      arrive(t, 's2-caseroom');
      expect(t.game.flag('s2:17-gather')).toBe(true);
      // the board: first the night in order (the defence waits for it)
      tap(t, 's2-caseroom', 'board');
      expect(t.game.flag('s2:17-order')).toBe(true);
      expect(t.game.flag('s2:17-defended')).toBeFalsy();
      // she leaves the bar once half-way (first try), then: B breaks, and D holds
      t.script = n % 2 ? [['choose', 'D'], ['present', C.challenges.D[0].answer[0]]] : [['choose', 'C'], ['concede']];
      tap(t, 's2-caseroom', 'board');
      expect(t.game.flag('s2:17-defended')).toBeFalsy();
      t.script = [['choose', 'B'], ['present', 'e-receipt'], ['concede'], ['choose', 'D'], ...C.challenges.D.map((c) => ['present', c.answer[0]])];
      tap(t, 's2-caseroom', 'board');
      expect(t.outcomes).toContain('broken');
      expect(t.game.flag('s2:17-broke-b')).toBe(true);
      expect(t.game.flag('s2:17-defended')).toBe(true);
      expect(t.game.has('s2.ev.d-case')).toBe(true);
      expect(t.went).toBe('s2-finale');
      // the case room empties: everyone went to the garden (Ryan too); a door leads there
      expect(check(ROOM.actors.find((a) => a.id === 'lama').if, t.game)).toBe(false);
      expect(check(ROOM.actors.find((a) => a.id === 'ryan').if, t.game)).toBe(false);
      expect(tap(t, 's2-caseroom', 'garden-door')).toBeTruthy();
      // the garden at night: arriving, Ryan lights the eighth lantern; the roses wait for her
      expect(tap(t, 's2-finale', 'roses')).toBeNull();
      arrive(t, 's2-finale');
      expect(t.game.flag('s2:17-lit')).toBe(true);
      expect(missionState(M, t.game).status).toBe('active');
      tap(t, 's2-finale', 'roses');
      expect(t.game.flag('s2:17-roses') && t.game.flag('s2:17-end')).toBe(true);
      expect(missionState(M, t.game).status).toBe('complete');
      expect(t.game.inJournal('s2-truth') && t.game.inJournal('s2-m2-end')).toBe(true);
      // and it can be replayed: the roses again, the case room's last line
      expect(tap(t, 's2-finale', 'roses')[0]).toEqual({ say: 's2.17-replay' });
      expect(tap(t, 's2-caseroom', 'board')).toEqual([{ say: 's2.17-board-closed' }]);
      expect(t.snapshot()).toEqual(before);
    });
  }

  it('every id Mission 06 writes routes to Season 2’s own document', () => {
    const ids = [
      's2:17-gather', 's2:17-order', 's2:17-defended', 's2:17-garden', 's2:17-lit', 's2:17-roses', 's2:17-end', 's2:17-broke-a', 's2:17-broke-b', 's2:17-broke-c', 's2:17-held-d', 's2:17-holds',
      'puzzle:s2-night-order', 'mission:s2-17', 'mission-seen:s2-17', 'visited:s2-finale', 't.s2-finale.arrive', 't.s2-caseroom.17-gather', 'it.s2-finale.roses', 'it.s2-caseroom.garden-door',
      's2.ev.d-case', 's2-truth', 's2-m2-end', ...Object.keys(M06.dialogue).map((k) => `dlg:${k}`),
    ];
    for (const id of ids) expect(isS2(id), id).toBe(true);
    for (const k of Object.keys(M06.dialogue)) expect(k.startsWith('s2.17-'), k).toBe(true);
    expect(EVIDENCE_S2_M2['d-case']).toBeTruthy();
    expect(CASE_S2_M2.find((c) => c.mission === 's2-17').ids).toEqual(['d-case']);
    expect(JOURNAL_S2_M2['s2-truth'] && JOURNAL['s2-m2-end']).toBeTruthy();
    for (const e of Object.keys(EARLIER)) expect(EVIDENCE_S2[e], `${e} is another mission's`).toBeUndefined();
  });

  it('M1’s case room is exactly as shipped until Mission 06 opens', () => {
    const g = createGame({ saveManager: null });
    const visible = (scene) => scene.interact.filter((i) => check(i.if, g)).map((i) => i.id).sort();
    const pick = (scene, id) => {
      const it = scene.interact.find((i) => i.id === id);
      return it.cases ? it.cases.find((x) => x.if === undefined || check(x.if, g))?.run : it.run;
    };
    const actors = (scene) => (scene.actors || []).filter((a) => check(a.if, g)).map((a) => [a.id, a.kind, a.x]);
    const same = () => {
      expect(visible(ROOM)).toEqual(visible(ROOM_M1));
      for (const id of visible(ROOM_M1)) expect(pick(ROOM, id), id).toEqual(pick(ROOM_M1, id));
      expect(actors(ROOM)).toEqual(actors(ROOM_M1));
      expect((ROOM.triggers || []).filter((tr) => check(tr.if, g)).map((tr) => tr.id)).toEqual((ROOM_M1.triggers || []).filter((tr) => check(tr.if, g)).map((tr) => tr.id));
    };
    same();
    for (const id of M1_DONE.slice(0, 4)) g.setFlag(`mission:${id}`);
    g.setFlag('s2:board-1');
    same();
    for (const id of [...M1_DONE, 's2-12', 's2-13', 's2-14', 's2-15']) g.setFlag(`mission:${id}`);
    g.setFlag('s2:11-talked');
    g.setFlag('s2:board-2');
    same(); // Mission 05 done is what opens it
  });

  it('the module is self-contained: its scene, puzzle, dialogue and evidence are registered', () => {
    for (const s of M06.scenes) expect(SCENES[s.id], s.id).toBeTruthy();
    for (const id of Object.keys(M06.puzzles)) expect(PUZZLES[id], id).toBeTruthy();
    for (const k of Object.keys(M06.dialogue)) expect(DIALOGUE[k], k).toBeTruthy();
    for (const e of Object.keys(M06.evidence)) expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
    // every line the module says is used somewhere (scenes, the defence, or another line's branch)
    const used = JSON.stringify([M06.scenes, M06.patches, DEFENCE.challenges, DEFENCE.hypotheses, DEFENCE.labels]);
    for (const k of Object.keys(M06.dialogue)) expect(used.includes(`"${k}"`) || used.includes(`s2.17-night-`), k).toBe(true);
  });

  it('tone: no wedding, no promise, no private nickname or forbidden word; jealousy stays playful', () => {
    const text = JSON.stringify([M06.dialogue, M06.missions, M06.journal, M06.evidence, M06.puzzles, DEFENCE.challenges, DEFENCE.hypotheses, DEFENCE.labels, M06.scenes.map((s) => [s.title, s.ambient, s.interact.map((i) => i.label)])]);
    expect(text).not.toMatch(/زفاف|عرس|خطوبة|خطبة|مهر|زواج|نتزوج|تتزوج|خاتم|عروس|wedding|marri|bride/i);
    expect(text).not.toMatch(/وعد|أوعد|للأبد|طول العمر|\u0063\u006f\u0062\u0072\u0061|\u0073\u006e\u0061\u006b\u0065|\u0073\u0065\u0072\u0070\u0065\u006e\u0074/i);
  });
});

/* ── the bar, in the real interface ── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
describe('the defence bar (real panels)', () => {
  let root;
  let app;
  const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
  async function until(fn, ms = 5000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const v = fn();
      if (v) return v;
      await wait(5);
    }
    throw new Error('timed out');
  }
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('no help; a wrong piece gets a neutral line; B breaks (marked, never disabled); D holds; what she reached is kept', async () => {
    await app.toTitle();
    const g = app.game;
    for (const e of HELD) g.collect(`s2.ev.${e}`);
    for (const [k, v] of Object.entries(COMBOS[1])) g.setFlag(`s2:dec:${k}`, v);
    const staged = [];
    const done = openDefence(app, DEFENCE, { run: async (a) => staged.push(a) });
    await until(() => $('.tm-defend [data-hyp]'));
    expect($$('[data-act="hint"], [data-act="solution"], [data-act="skip"], [data-hint]')).toHaveLength(0);
    expect($('.tm-defend').textContent).not.toMatch(/تلميح|الحل/);
    expect($$('.tm-defend [data-hyp]').map((b) => b.dataset.hyp)).toEqual(['A', 'B', 'C', 'D']);
    // B: Jojo's challenge; a wrong piece: a neutral line, no chip disabled or marked
    $('[data-hyp="B"]').click();
    await until(() => !$('[data-acts]').hidden && !$('[data-present]').disabled);
    expect($('.tm-line').textContent).toMatch(/يأذيچ/);
    $('[data-present]').click();
    await until(() => !$('.tm-pick').hidden);
    expect($$('.tm-pick [data-ev]').length).toBe(heldEvidence(g, { ...EVIDENCE_S2, ...EVIDENCE_S2_M2 }).length);
    expect($$('.tm-pick [data-ev][disabled]')).toHaveLength(0);
    $('[data-ev="e-receipt"]').click();
    await until(() => $('.tm-feedback').textContent);
    expect(STRICT_WRONG).toContain($('.tm-feedback').textContent);
    expect($('.tm-feedback').textContent).not.toMatch(/[0-9٠-٩]/);
    // no answer: B breaks; back at the board, B marked but still there and enabled
    await until(() => !$('[data-concede]').disabled);
    $('[data-concede]').click();
    await until(() => $('[data-hyp]') && !$('[data-hyps]').hidden && !$('[data-hyp="B"]').disabled);
    expect(g.flag('s2:17-broke-b')).toBe(true);
    expect($('[data-hyp="B"]').textContent).toMatch(/انكسرت/);
    expect(staged.some((a) => JSON.stringify(a).includes('s2.17-broke-b'))).toBe(true);
    // D: Lama first; she answers her, then leaves; coming back she resumes at Sabri
    $('[data-hyp="D"]').click();
    await until(() => !$('[data-acts]').hidden && !$('[data-present]').disabled);
    expect($('.tm-who').textContent).toMatch(/لمى/);
    $('[data-present]').click();
    await until(() => !$('.tm-pick').hidden);
    $('[data-ev="e-drift"]').click();
    await until(() => /صبري/.test($('.tm-who').textContent) && !$('[data-present]').disabled);
    expect($('.tm-line').textContent).toMatch(/حرف بحرف/); // office-cover = truth: his own words
    $('[data-leave]').click();
    expect((await done).solved).toBe(false);
    expect(g.flag('s2:17-held-d')).toBe(1);
    // again: D resumes at Sabri; every answer; the defence holds
    const again = openDefence(app, DEFENCE, { run: async () => {} });
    await until(() => $('[data-hyp="D"]'));
    $('[data-hyp="D"]').click();
    for (const ch of C.challenges.D.slice(1)) {
      await until(() => !$('[data-acts]')?.hidden && !$('[data-present]').disabled);
      $('[data-present]').click();
      await until(() => !$('.tm-pick').hidden);
      $(`[data-ev="${ch.answer[0]}"]`).click();
      await wait(5);
    }
    expect((await again).solved).toBe(true);
    expect(g.flag('s2:17-holds')).toBe(true);
  });
});
