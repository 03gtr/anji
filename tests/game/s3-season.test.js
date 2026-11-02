/**
 * Season 3 «أصداء الـV8» — the whole season, from its own data:
 *  - registration: eight missions in order, each place on the map, every id Season 3's own;
 *  - every puzzle: strict (no hint, no solution, no skip), a unique answer, a guess space of ≥ 8 a stage and ≥ 20 a
 *    puzzle, solved by its own rules; the logic grids unique AND every clue needed (enumerated);
 *  - the specific promises: «الصدى» is not solvable by loudness and is drawn from the sound's own model (P-02);
 *    «غرفة الحقائق السبعة» proves with two chains that share no source (P-06); the defence never accepts a statement
 *    as an answer (P-09); the whisper chain starts from her own Mission 01 words (P-03);
 *  - the decisions: every value is made somewhere and read somewhere;
 *  - (the investigation board was removed by the owner's hotfix brief: tests/game/board-removed.test.js);
 *  - played through, every mission, for plans that cover every value of every decision and every road; the original
 *    save and Season 2's stay byte-identical.
 */
import { describe, it, expect } from 'vitest';
import { isS3 } from '../../src/game/core/game.js';
import { S3_KEY } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { solve, replay, logicgridSolutions } from '../../src/game/puzzles/rules.js';
import { resolveConfig, canSkip } from '../../src/game/puzzles/host.js';
import { scriptTexts, walkScript } from '../../src/game/narrative/dialogue.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { WORLDS } from '../../src/game/data/worlds.js';
import { EVIDENCE_S3, DECISIONS_S3 } from '../../src/game/data/evidence-s3.js';
import { PUZZLES_S3 } from '../../src/game/data/puzzles-s3.js';
import { S3_MODULES } from '../../src/game/data/s3/index.js';
import { RECORDINGS } from '../../src/game/data/s3/recordings.js';
import { ECHO_ANSWER } from '../../src/game/data/s3/m03-echo.js';
import { VERSIONS, CHANGED_LINK } from '../../src/game/data/s3/m04-source.js';
import { SEVEN_ANSWER, PROOF_EVIDENCE } from '../../src/game/data/s3/m06-seven.js';
import { STATEMENT_BINS, DEFENCE_ANSWER } from '../../src/game/data/s3/m08-silence.js';
import { peak, clarity, strokes } from '../../src/game/core/engine-voice.js';
import { setup, playSeason, PLANS } from './s3-play.js';

// the season's eight missions (the final story's chapters share its document, `arc: 'final'`: tests/game/final-arc.test.js)
const S3_MISSIONS = MISSIONS.filter((m) => m.pack === 's3' && m.arc !== 'final');
const S3_IDS = Object.keys(PUZZLES_S3);

describe('Season 3: registration', () => {
  it('eight missions, in order, each leading to the next', () => {
    expect(S3_MISSIONS.map((m) => m.id)).toEqual(['s3-01', 's3-02', 's3-03', 's3-04', 's3-05', 's3-06', 's3-07', 's3-08']);
    S3_MISSIONS.forEach((m, i) => {
      expect(m.leadsTo).toEqual(i < 7 ? [S3_MISSIONS[i + 1].id] : []);
      if (i) expect(m.unlock, m.id).toBe(`flag:mission:${S3_MISSIONS[i - 1].id}`);
      for (const s of m.steps) expect(s.hint, `${m.id}: no hints in a season's story`).toBeUndefined();
    });
  });
  it('every place a module adds is a scene and a map place on Season 3\'s page', () => {
    const scenes = S3_MODULES.flatMap((m) => m.scenes || []);
    expect(scenes.map((s) => s.id).sort()).toEqual(['s3-archive', 's3-clinic', 's3-garage', 's3-home', 's3-lane', 's3-street']);
    for (const s of scenes) {
      expect(SCENES[s.id], s.id).toBeTruthy();
      const w = WORLDS.find((x) => x.id === s.id);
      expect(w?.region, s.id).toBe('s3');
    }
    // every mission's places exist; patches only touch Season 3's own places
    for (const m of S3_MISSIONS) for (const w of m.world) expect(SCENES[w], `${m.id} ${w}`).toBeTruthy();
    for (const mod of S3_MODULES) for (const id of Object.keys(mod.patches || {})) expect(isS3(id), id).toBe(true);
  });
  it('every id Season 3 adds routes to Season 3\'s own save', () => {
    for (const id of [...S3_IDS, ...S3_MISSIONS.map((m) => m.id), ...Object.keys(DIALOGUE).filter((k) => k.startsWith('s3.'))]) expect(isS3(id), id).toBe(true);
    for (const id of Object.keys(EVIDENCE_S3)) expect(isS3(`s3.ev.${id}`)).toBe(true);
    for (const k of Object.keys(DECISIONS_S3)) expect(isS3(`s3:dec:${k}`)).toBe(true);
  });
  it('every piece of evidence is one a mission can give (an ev3: effect exists)', () => {
    const given = new Set();
    const visit = (x) => {
      if (Array.isArray(x)) return x.forEach(visit);
      if (typeof x === 'string' && x.startsWith('ev3:')) given.add(x.slice(4));
      if (x && typeof x === 'object') Object.values(x).forEach(visit);
    };
    visit(S3_MODULES.map((m) => [m.scenes, m.patches, m.dialogue]));
    for (const id of Object.keys(EVIDENCE_S3)) expect(given.has(id), id).toBe(true);
  });
});

/** Every combination of a stage's answer (the guess space), and the number of right ones. */
function space(p) {
  if (p.type === 'logicgrid') return [p.config.cols.reduce((n, c) => n * c.options.length ** p.config.rows.length, 1)];
  // a pick with `answers` is "tick every statement that holds": any subset is a guess
  return p.config.stages.map((st) => (st.kind === 'sort' ? st.bins.length ** st.cards.length : st.answers ? 2 ** st.options.length : st.options.length));
}

describe('Season 3: every puzzle is fair', () => {
  it.each(S3_IDS)('%s: strict — no hint, no solution, no skip', (id) => {
    const p = PUZZLES[id];
    expect(p.strict && p.noSkip && p.noSolution, id).toBe(true);
    expect(p.hints ?? []).toEqual([]);
    expect(canSkip(p, 99)).toBe(false);
  });
  it.each(S3_IDS)('%s: one answer, solved by its own rules; ≥ 8 a stage, ≥ 20 in all', (id) => {
    const p = PUZZLES[id];
    const c = resolveConfig(p.config, {});
    expect(replay(p.type, c, solve(p.type, c)).outcome).toBe('solved');
    const s = space(p);
    for (const n of s) expect(n, id).toBeGreaterThanOrEqual(8);
    expect(s.reduce((a, b) => a * b, 1), id).toBeGreaterThanOrEqual(20);
    if (p.type === 'sort') {
      for (const st of p.config.stages) {
        if (st.kind === 'sort') for (const card of st.cards) expect(card.accepts, `${id} ${card.id}`).toHaveLength(1);
        else for (const a of st.answers ?? [st.answer]) expect(st.options.map((o) => o.id)).toContain(a);
      }
    }
  });
  it.each(['s3-forward', 's3-park'])('%s: exactly one solution, and every clue is needed', (id) => {
    const c = PUZZLES[id].config;
    expect(logicgridSolutions(c)).toHaveLength(1);
    for (const cl of c.clues) expect(logicgridSolutions(c, c.clues.filter((x) => x !== cl)).length, cl.text).toBeGreaterThan(1);
  });
});

describe('the promises of the specification', () => {
  it('«الصدى» (P-02): the loudest recording is the farthest — ranking by loudness gives the wrong answer', () => {
    const ids = Object.keys(RECORDINGS);
    const loudest = ids.reduce((a, b) => (peak(RECORDINGS[a]) > peak(RECORDINGS[b]) ? a : b));
    const farthest = ids.reduce((a, b) => (clarity(RECORDINGS[a]) < clarity(RECORDINGS[b]) ? a : b));
    expect(loudest).toBe('clip');
    expect(farthest).toBe('clip');
    expect(ECHO_ANSWER.far).toBe('wall');
  });
  it('«الصدى» (P-02): what is drawn tells the engines apart — Zefiro\'s strokes alternate (the burble), the other\'s do not', () => {
    const alternation = (rec) => {
      const s = strokes(rec, 120).filter((k) => k.engine > 0.05);
      let d = 0;
      for (let i = 1; i < s.length; i++) d += Math.abs(s[i].engine - s[i - 1].engine);
      return d / Math.max(1, s.reduce((a, k) => a + k.engine, 0));
    };
    for (const [id, rec] of Object.entries(RECORDINGS)) {
      if (rec.engine === 'zefiro') expect(alternation(rec), id).toBeGreaterThan(0.5);
      else expect(alternation(rec), id).toBeLessThan(0.25);
      expect(ECHO_ANSWER[id], id).toBe(rec.engine);
    }
  });
  it('«الصدى» (P-02): the anchors are where the night puts them (blip before the shutter; the click before the revs)', () => {
    const at = (rec, kind) => rec.events.filter((e) => e.kind === kind).map((e) => e.at);
    expect(Math.max(...at(RECORDINGS.cam1, 'blip'))).toBeLessThan(Math.min(...at(RECORDINGS.cam1, 'shutter')));
    expect(Math.max(...at(RECORDINGS.cam2, 'relay'))).toBeLessThan(Math.min(...at(RECORDINGS.cam2, 'rev')));
    expect(at(RECORDINGS.gate, 'blip')).toHaveLength(1);
    expect(at(RECORDINGS.cam1, 'blip')).toHaveLength(1);
    // and what is drawn shows it: the click is on the strip that has one (at the panel's 80 columns), on no other
    const drawnClick = (rec) => strokes(rec, 80).some((k) => k.click);
    for (const [id, rec] of Object.entries(RECORDINGS)) expect(drawnClick(rec), id).toBe(rec.events.some((e) => e.kind === 'relay'));
  });
  it('«الصدى المحرّف» (P-03): each chain starts from her own Mission 01 words, and only one link changes it', () => {
    const m01 = scriptTexts(DIALOGUE['s3.01-sabri-asks']).join(' ');
    expect(m01).toContain('مجرد صديق أخوية ماريوس');
    expect(m01).toContain('لازم تشتغل محقق');
    expect(m01).toContain('منو گلك تعد زيارات الناس؟');
    for (const v of ['deny', 'laugh', 'confront']) {
      expect(VERSIONS[v]).toHaveLength(6);
      const p = PUZZLES[`s3-whisper-${v}`];
      const links = p.config.stages[0].cards;
      expect(links).toHaveLength(5);
      expect(links.filter((k) => k.accepts[0] === 'changed').map((k) => k.id)).toEqual([CHANGED_LINK]);
      expect(p.config.stages[1].answers).toHaveLength(1);
    }
  });
  it('«غرفة الحقائق السبعة» (P-06): the two chains share no source, and no statement is in either', () => {
    const chain = (bin) => Object.entries(PROOF_EVIDENCE).filter(([k]) => SEVEN_ANSWER[k] === bin).map(([, e]) => EVIDENCE_S3[e]);
    const sources = (bin) => new Set(chain(bin).map((e) => e.source));
    const sound = sources('sound');
    const paper = sources('paper');
    expect(sound.size && paper.size).toBeTruthy();
    for (const s of sound) expect(paper.has(s), s).toBe(false);
    for (const e of [...chain('sound'), ...chain('paper')]) expect(e.rel).not.toBe('claim');
    for (const e of chain('none')) expect(e.rel).toBe('claim');
  });
  it('the defence (P-09): a statement is never accepted as an answer', () => {
    const cards = PUZZLES['s3-defence'].config.stages[0].cards;
    for (const b of STATEMENT_BINS) {
      expect(EVIDENCE_S3[b].rel).toBe('claim');
      for (const c of cards) expect(c.accepts).not.toContain(b);
    }
    for (const e of Object.values(DEFENCE_ANSWER)) expect(EVIDENCE_S3[e].rel).not.toBe('claim');
  });
  it('no clue is a colour: Zefiro\'s colour is the player\'s choice (pearl reads as grey at night)', () => {
    const colours = /رمادي|رصاصي|أزرق|زرگ|أسود|أبيض|أحمر|وردي|لؤلؤي|زمردي/;
    const texts = [];
    for (const id of S3_IDS) texts.push(JSON.stringify(PUZZLES[id].config));
    for (const e of Object.values(EVIDENCE_S3)) texts.push(e.note);
    for (const t of texts) expect(colours.test(t), t.slice(0, 80)).toBe(false);
  });
});

describe('Season 3: decisions', () => {
  it('every value of every decision is made somewhere and read somewhere', () => {
    const made = new Set();
    const read = new Set();
    // a condition on one value reads it; with an `else`, the else branch is every other value of that decision
    const reads = (n) => {
      for (const a of atoms(n.if ?? [])) {
        if (!a.startsWith('dec3:')) continue;
        read.add(a.slice(5));
        const [key, value] = a.slice(5).split('=');
        if ('else' in n) for (const v of DECISIONS_S3[key] || []) if (v !== value) read.add(`${key}=${v}`);
      }
    };
    const visitRun = (x) => {
      if (Array.isArray(x)) return x.forEach(visitRun);
      if (!x || typeof x !== 'object') return;
      reads(x);
      Object.values(x).forEach(visitRun);
    };
    for (const script of Object.values(DIALOGUE)) {
      walkScript(script, (n) => {
        reads(n);
        for (const o of n.choice || []) for (const fx of [].concat(o.do || [])) if (fx.startsWith('dec3:')) made.add(fx.slice(5));
      });
    }
    visitRun(S3_MODULES.map((m) => [m.scenes, m.patches]));
    for (const [key, values] of Object.entries(DECISIONS_S3)) {
      for (const v of values) {
        expect(made.has(`${key}=${v}`), `${key}=${v} is made`).toBe(true);
        expect(read.has(`${key}=${v}`), `${key}=${v} is read`).toBe(true);
      }
    }
  });
});

describe('Season 3, played through', () => {
  it.each(PLANS.map((p, i) => [i + 1, p]))('plan %i: every mission completes; the decisions are kept; the other saves never change', (i, plan) => {
    const { game, others, storage } = setup();
    const before = others();
    const p = playSeason(game, plan, { street: i !== 2 });
    for (const [k, v] of Object.entries(plan)) expect(game.flag(`s3:dec:${k}`), k).toBe(v);
    game.save();
    expect(others()).toEqual(before);
    const doc = JSON.parse(storage.getItem(S3_KEY));
    expect(doc.flags['mission:s3-08']).toBe(true);
    for (const e of ['e-original', 'd-truth', 'd-seven', 'd-source', 'd-twisted', 'd-second-car']) expect(doc.collected).toContain(`s3.ev.${e}`);
    // the finale reads her answers back (what Ryan and she say depends on them)
    const ending = p.heard.join(' ');
    const v8 = { wave: 'أشرتلك من الباب', walk: 'مشيتلك', text: 'دزيتلك رسالة' }[plan['v8-answer']];
    expect(ending).toContain(v8);
  });
  it('every road from every save: all 216 combinations of the earlier decisions and the road complete the season', () => {
    const values = (k) => DECISIONS_S3[k];
    let n = 0;
    for (const reply of values('sabri-reply'))
      for (const honest of values('marius-honest'))
        for (const v8 of values('v8-answer'))
          for (const trust of values('ryan-trust'))
            for (const lama of values('lama-secret'))
              for (const road of values('road')) {
                const { game } = setup();
                playSeason(game, { 'sabri-reply': reply, 'marius-honest': honest, 'v8-answer': v8, 'ryan-trust': trust, 'lama-secret': lama, road });
                expect(game.has('s3.ev.e-original')).toBe(true);
                n++;
              }
    expect(n).toBe(216);
  }, 120000);
  it('no promise, wedding or date anywhere in Season 3\'s words', () => {
    const words = /عرس|زواج|خطوبة|خاتم|نتزوج|موعد غرام|أوعدچ|أوعدك|وعد/;
    for (const [k, script] of Object.entries(DIALOGUE)) if (k.startsWith('s3.')) for (const t of scriptTexts(script)) expect(words.test(t), `${k}: ${t}`).toBe(false);
  });
});
