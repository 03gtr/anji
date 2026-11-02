/**
 * The final story (owner's final brief, Priorities 1, 2, 4, 5): four chapters after Season 3, two endings, the final
 * choice replayable — in Season 3's own document.
 *  - registration: four chapters, in order, after the season's finale; no new place (Season 3's own); every id routes
 *    to Season 3's save; no puzzle filler;
 *  - every branch, played through as the engine plays it: each of Season 3's answers to Sabri × every choice in the
 *    four chapters (972 runs) — every chapter completes, the decisions are kept, the original save and Season 2's
 *    never change;
 *  - Ryan's anger: the sharp line comes only when earned (a public brush-off on top of an earlier denial), and then
 *    always with her defence, his specific apology, and both owning their part; never without; no violence;
 *  - Marius finds out gradually: silent in f1, silent again in f2, covering in f3, knowing in the endings;
 *  - both endings: what each must and must not be; the ending card;
 *  - the ending record: the first ending is kept for ever; a replay adds to the history and changes the latest only;
 *    the replay needs no restart and can be played again and again;
 *  - no ceremony, no date, no family, no ring — in the final story's words.
 */
import { describe, it, expect } from 'vitest';
import { isS3 } from '../../src/game/core/game.js';
import { createSaveManager, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store, createSeasonStore, S2_KEY, S3_KEY } from '../../src/game/core/s2-store.js';
import { createGame } from '../../src/game/core/game.js';
import { applyEffects, isValidEffect } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions } from '../../src/game/progression/missions.js';
import { scriptTexts, walkScript } from '../../src/game/narrative/dialogue.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DECISIONS_S3 } from '../../src/game/data/evidence-s3.js';
import { S3_MODULES } from '../../src/game/data/s3/index.js';
import { EARNED } from '../../src/game/data/s3/f02-limits.js';
import { setup, player, playSeason, PLANS } from './s3-play.js';
import { memoryStorage } from '../helpers.js';

const ARC = MISSIONS.filter((m) => m.arc === 'final');
const ARC_MODULES = S3_MODULES.filter((m) => /^f0/.test(m.id));
const ARC_KEYS = Object.keys(DIALOGUE).filter((k) => /^s3\.f\d/.test(k));
const INSULT = 'يا معفنة، مو كل مرة أتحمل وأسكت!';
const done = (game, id) => game.flag(`mission:${id}`) === true;

/** A Season 3 save that has finished the season (for one answer to Sabri), as storage to start every run from. */
const seasonDone = new Map();
function afterSeason(reply) {
  if (!seasonDone.has(reply)) {
    const { game, storage } = setup();
    playSeason(game, { ...PLANS[0], 'sabri-reply': reply });
    game.save();
    seasonDone.set(reply, storage.dump());
  }
  const storage = memoryStorage(seasonDone.get(reply));
  let clock = 1_900_000_000_000;
  const now = () => clock++;
  const sm = createSaveManager({ storage, now });
  const L = sm.load();
  const s2 = createS2Store({ storage, now });
  const s3 = createSeasonStore({ storage, key: S3_KEY, now });
  const game = createGame({ saveManager: sm, s2Store: s2, s3Store: s3, initial: L.state, s2Initial: s2.load(L.state.createdAt).state, s3Initial: s3.load(L.state.createdAt).state, now });
  syncMissions(game, { season: 's3' });
  const others = () => [SAVE_KEY, `${SAVE_KEY}:backup`, S2_KEY, `${S2_KEY}:backup`].map((k) => storage.getItem(k));
  return { game, storage, others };
}

/** The four chapters, as she would play them. */
function playArc(game, plan) {
  const p = player(game, plan);
  const at = (scene, ...ids) => {
    p.visit(scene);
    for (const id of ids) p.tap(scene, id);
  };
  at('s3-home', 'marius', 'phone');
  expect(done(game, 's3-f1'), 's3-f1').toBe(true);
  at('s3-garage', 'ryan');
  expect(done(game, 's3-f2'), 's3-f2').toBe(true);
  at('s3-lane', 'grate', 'marks', 'oil', 'ryan');
  expect(done(game, 's3-f3'), 's3-f3').toBe(true);
  at('s3-street', 'ryan-final');
  expect(done(game, 's3-f4'), 's3-f4').toBe(true);
  return p;
}

const values = (k) => DECISIONS_S3[k];
const ARC_PLANS = [];
for (const ask of values('marius-ask'))
  for (const club of values('club-moment'))
    for (const words of values('after-words'))
      for (const forgive of values('forgive'))
        for (const need of values('need'))
          for (const fin of values('final')) ARC_PLANS.push({ 'marius-ask': ask, 'club-moment': club, 'after-words': words, forgive, need, final: fin });

describe('the final story: registration', () => {
  it('four chapters, in order, right after the season\'s finale — no more', () => {
    expect(ARC.map((m) => m.id)).toEqual(['s3-f1', 's3-f2', 's3-f3', 's3-f4']);
    expect(ARC[0].unlock).toBe('flag:mission:s3-08');
    ARC.forEach((m, i) => {
      if (i) expect(m.unlock).toBe(`flag:mission:${ARC[i - 1].id}`);
      expect(m.leadsTo).toEqual(i < 3 ? [ARC[i + 1].id] : []);
      expect(m.pack).toBe('s3');
      for (const s of m.steps) expect(s.hint, `${m.id}: no hints in the story`).toBeUndefined();
    });
  });
  it('no new place and no new puzzle: Season 3\'s own places, the story told in them', () => {
    const s3places = ['s3-clinic', 's3-street', 's3-home', 's3-garage', 's3-lane', 's3-archive'];
    for (const m of ARC) for (const w of m.world) expect(s3places).toContain(w);
    for (const mod of ARC_MODULES) {
      expect(mod.scenes, mod.id).toBeUndefined();
      expect(mod.puzzles, mod.id).toBeUndefined();
      for (const id of Object.keys(mod.patches || {})) expect(s3places).toContain(id);
    }
  });
  it('every id it adds lives in Season 3\'s own save', () => {
    for (const m of ARC) expect(isS3(`mission:${m.id}`), m.id).toBe(true);
    for (const k of ARC_KEYS) expect(isS3(`dlg:${k}`), k).toBe(true);
    for (const mod of ARC_MODULES) for (const k of Object.keys(mod.decisions || {})) expect(isS3(`s3:dec:${k}`), k).toBe(true);
    for (const id of ['s3:end:first', 's3:end:last', 's3:end:history', 's3:f4-replay', 't.s3-street.f4-replay']) expect(isS3(id), id).toBe(true);
  });
});

describe('the final story, played through', () => {
  it('every answer to Sabri × every choice in the four chapters: all complete; decisions kept; the other saves untouched', () => {
    let n = 0;
    for (const reply of values('sabri-reply'))
      for (const plan of ARC_PLANS) {
        const { game, others } = afterSeason(reply);
        const before = others();
        const p = playArc(game, plan);
        for (const [k, v] of Object.entries(plan)) expect(game.flag(`s3:dec:${k}`), k).toBe(v);
        game.save();
        expect(others()).toEqual(before);
        const heard = p.heard.join('\n');
        const earned = plan['club-moment'] === 'deny' && (plan['marius-ask'] === 'deny' || reply === 'deny');
        // the sharp line: only when earned, and then never alone
        expect(heard.includes(INSULT), `${reply} ${JSON.stringify(plan)}`).toBe(earned);
        if (earned) {
          expect(heard).toMatch(/آسف على الكلمة|آسف عليها بالذات|وهاي الكلمة… آسف/); // his apology names the word
          if (plan['after-words'] === 'stand') expect(heard).toContain('«معفنة»؟! هيچ تشوفني؟'); // her defence names it
        }
        // both own their part, every time
        expect(heard).toContain('أنكرتك هواي');
        expect(heard).toContain('آني خايفة، ريان');
        // his way back is hers to decide
        const way = { stand: 'هذا حدّي', why: 'لأن كل مرة أحد يسأل، تختفين', silent: 'أحتاج شوية وقت' }[plan['after-words']];
        expect(heard).toContain(way);
        // the endings
        if (plan.final === 'yes') {
          expect(heard).toContain('إي. أختارك.');
          expect(heard).toContain('آني مو أعمى');
          expect(heard).not.toContain('أحترم جوابچ');
        } else {
          expect(heard).toContain('أحترم جوابچ');
          expect(heard).toContain('مو لازم تحچين');
          expect(heard).not.toContain('آني مو أعمى');
          expect(game.flag('s3:f4-gone')).toBe(true);
        }
        expect(game.flag('s3:end:first')).toBe(plan.final);
        expect(game.flag('s3:end:history')).toBe(plan.final);
        n++;
      }
    expect(n).toBe(3 * 324);
  }, 240000);

  it('Marius finds out gradually: silent, silent again, covering for her, then knowing', () => {
    const { game } = afterSeason('laugh');
    const p = playArc(game, { 'marius-ask': 'ask-back', 'club-moment': 'own', 'after-words': 'why', forgive: 'now', need: 'seen', final: 'yes' });
    const order = ['مو كلشي لازم أسأل عنه', 'ثاني مرة يسكت هالأسبوع', 'لا تسأليني شلون عرفت', 'آني مو أعمى'].map((s) => p.heard.findIndex((h) => h.includes(s)));
    for (const i of order) expect(i).toBeGreaterThanOrEqual(0);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // and he is never hostile or controlling
    for (const k of ARC_KEYS) walkScript(DIALOGUE[k], (node) => node.s === 'marius' && expect(node.t ?? '', k).not.toMatch(/ممنوع|لا تطلعين|اسمعي كلامي|أكسر|بالقوة/));
  });
});

describe('the ending record and «الاختيار الأخير، مرة ثانية»', () => {
  it('end3: the first ending is kept for ever; the latest and the history beside it', () => {
    expect(isValidEffect('end3:yes')).toBe(true);
    expect(isValidEffect('end3:later')).toBe(true);
    expect(isValidEffect('end3:maybe')).toBe(false);
    const { game } = setup();
    applyEffects('end3:later', game);
    applyEffects('end3:yes', game);
    applyEffects('end3:yes', game);
    expect(game.flag('s3:end:first')).toBe('later');
    expect(game.flag('s3:end:last')).toBe('yes');
    expect(game.flag('s3:end:history')).toBe('later,yes,yes');
  });
  it('replayed from the street, twice: no restart, the first ending stays, the history grows, Zefiro comes back', () => {
    const { game } = afterSeason('deny');
    const plan = { 'marius-ask': 'deny', 'club-moment': 'deny', 'after-words': 'stand', forgive: 'time', need: 'patience', final: 'yes' };
    playArc(game, plan);
    const missions = ARC.map((m) => done(game, m.id));
    // her choice, again: «مو هسه»
    const again = (fin) => {
      const p = player(game, { ...plan, final: fin });
      p.visit('s3-street');
      p.tap('s3-street', 'again'); // she asks for the moment again (the first option)
      expect(game.flag('s3:f4-replay')).toBe(true);
      p.visit('s3-street'); // the street, on arrival: the moment plays again
      return p;
    };
    let p = again('later');
    expect(p.heard.join('\n')).toContain('أحترم جوابچ');
    expect(game.flag('s3:end:first')).toBe('yes');
    expect(game.flag('s3:end:last')).toBe('later');
    expect(game.flag('s3:end:history')).toBe('yes,later');
    expect(game.flag('s3:f4-gone')).toBe(true);
    expect(game.flag('s3:f4-replay')).toBeFalsy();
    p = again('yes');
    expect(p.heard.join('\n')).toContain('إي. أختارك.');
    expect(game.flag('s3:f4-gone')).toBeFalsy(); // he is back
    expect(game.flag('s3:end:first')).toBe('yes');
    expect(game.flag('s3:end:history')).toBe('yes,later,yes');
    // nothing was restarted: the chapters stay done, the season too
    expect(ARC.map((m) => done(game, m.id))).toEqual(missions);
    expect(done(game, 's3-08')).toBe(true);
  });
  it('declining the replay changes nothing', () => {
    const { game } = afterSeason('laugh');
    playArc(game, { 'marius-ask': 'joke', 'club-moment': 'quiet', 'after-words': 'silent', forgive: 'now', need: 'told', final: 'later' });
    const before = JSON.stringify(game.s3State.flags);
    // the second option: «لا. خليها مثل ما هي.»
    const script = DIALOGUE['s3.f4-ask-again'];
    const node = [];
    walkScript(script, (n) => n.choice && node.push(n));
    expect(node[0].choice[1].do).toBeUndefined();
    expect(check('flag:s3:f4-replay', game)).toBe(false);
    expect(JSON.stringify(game.s3State.flags)).toBe(before);
  });
});

describe('the final story\'s words', () => {
  const words = ARC_KEYS.flatMap((k) => scriptTexts(DIALOGUE[k]).map((t) => [k, t]));
  it('no ceremony, no date, no ring, no family — and no violence', () => {
    expect(words.length).toBeGreaterThan(100);
    for (const [k, t] of words) {
      expect(t, k).not.toMatch(/عرس|حفلة|زفاف|خطوبة|خاتم|محبس|موعد|تاريخ|بالشهر الجاي|السنة الجاية/);
      expect(t, k).not.toMatch(/أهلچ|أهلي|الأهل|عائلت|عيلت|أبوچ|أمچ|أبوي|الماما/);
      expect(t, k).not.toMatch(/ضرب|يضرب|صفع|دفع|يدفعها|كسر/);
    }
  });
  it('the sharp line exists once, in Chapter 02, under the earned condition only', () => {
    const hits = words.filter(([, t]) => t.includes('معفنة'));
    // said in the hurt; named again only by her defence and his apology, in the same chapter
    expect([...new Set(hits.map(([k]) => k))].sort()).toEqual(['s3.f2-answer', 's3.f2-hurt']);
    expect(words.filter(([, t]) => t === INSULT)).toHaveLength(1);
    // the node that says it sits under EARNED
    let guarded = false;
    walkScript(DIALOGUE['s3.f2-hurt'], (n) => {
      if (n.if && JSON.stringify(n.if) === JSON.stringify(EARNED) && JSON.stringify(n.then).includes(INSULT)) guarded = true;
    });
    expect(guarded).toBe(true);
  });
  it('the scenes it patches stay as they were until its own chapter opens', () => {
    for (const mod of ARC_MODULES)
      for (const [scene, patch] of Object.entries(mod.patches || {})) {
        for (const tr of patch.triggers || []) expect(JSON.stringify(tr.if), `${scene} ${tr.id}`).toMatch(/mission:s3-(08|f\d)|s3:f4-/);
        for (const it of patch.interact || []) for (const c of it.cases || []) expect(JSON.stringify(c.if ?? it.if), `${scene} ${it.id}`).toMatch(/mission:s3-(08|f\d)|s3:f\d-/);
      }
    // the scene list itself is unchanged in size: no place was added
    expect(Object.keys(SCENES).filter((id) => id.startsWith('s3-')).sort()).toEqual(['s3-archive', 's3-clinic', 's3-garage', 's3-home', 's3-lane', 's3-street']);
  });
});
