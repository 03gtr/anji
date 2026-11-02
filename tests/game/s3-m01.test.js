/**
 * Season 3, Mission 01 «صبري ولسانه الطويل» (s3-01) — the vertical slice, from its own data:
 *  - the module is registered and owns its ids; every id it writes routes to Season 3's save;
 *  - «إعادة بناء الأسبوع» (P-01): strict (no help of any kind), each card has exactly one place, the guess space is
 *    large, it is solved by its own rules, a wrong try gets a neutral line, and no line before it gives an answer;
 *  - played through for every combination of both decisions (3 × 2): each choice changes the very next lines and the
 *    ending's; the original save and Season 2's stay byte-identical;
 *  - the map: Season 3's page, the clinic locked until Season 2's finale.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame, isS3 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store, createSeasonStore, S2_KEY, S3_KEY } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { solve, replay } from '../../src/game/puzzles/rules.js';
import { resolveConfig, canSkip, STRICT_WRONG } from '../../src/game/puzzles/host.js';
import { createDialogue, scriptTexts } from '../../src/game/narrative/dialogue.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { JOURNAL } from '../../src/game/data/items.js';
import { WORLDS, REGIONS } from '../../src/game/data/worlds.js';
import { EVIDENCE_S3, DECISIONS_S3, CASE_S3 } from '../../src/game/data/evidence-s3.js';
import M01, { OFFICE_ANSWER, RECORDS } from '../../src/game/data/s3/m01-sabri.js';
import { memoryStorage } from '../helpers.js';

const T0 = 1_800_000_000_000;
const M = MISSIONS.find((m) => m.id === 's3-01');
const P = PUZZLES['s3-office'];
const CLINIC = SCENES['s3-clinic'];

/** A player who finished the original game and Season 2 (its finale), with the three stores on one storage. */
function setup() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج' };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  const s2 = createS2Store({ storage, now: () => T0 + 5 });
  const d2 = s2.load(T0).state;
  d2.flags['mission:s2-17'] = true;
  s2.save(d2);
  let clock = T0 + 100;
  const now = () => clock++;
  const saves = createSaveManager({ storage, now });
  const loaded = saves.load();
  const s2Store = createS2Store({ storage, now });
  const s3Store = createSeasonStore({ storage, key: S3_KEY, now });
  const game = createGame({ saveManager: saves, s2Store, s3Store, initial: loaded.state, s2Initial: s2Store.load(T0).state, s3Initial: s3Store.load(T0).state, now });
  syncMissions(game, { season: 's3' });
  const others = () => [SAVE_KEY, `${SAVE_KEY}:backup`, `${SAVE_KEY}:shadow`, S2_KEY, `${S2_KEY}:backup`].map((k) => storage.getItem(k));
  return { game, storage, others };
}

/** Plays the scene's own data as the engine does; her choices are made by `plan` (decision key → value). */
function player(game, plan) {
  const t = { heard: [], said: [], wrong: null };
  const pick = (options) => Math.max(0, options.findIndex((o) => [].concat(o.do || []).some((fx) => /^dec3:/.test(fx) && plan[fx.slice(5, fx.indexOf('='))] === fx.slice(fx.indexOf('=') + 1))));
  function say(key) {
    const script = DIALOGUE[key];
    expect(script, key).toBeTruthy();
    t.said.push(key);
    // the choice node waiting: the runner hides its options' effects, so pick from the script's own choice nodes
    const choices = [];
    const walk = (nodes) => (nodes || []).forEach((n) => (n.choice && choices.push(n), walk(n.then), walk(n.else), (n.choice || []).forEach((o) => walk(o.then))));
    walk(script);
    let c = 0;
    const d = createDialogue(script, { check: (x) => check(x, game), apply: (fx) => applyEffects(fx, game) });
    for (let i = 0; i < 300 && !d.ended; i++) {
      if (d.waitingForChoice) {
        const node = choices[c++];
        d.choose(pick(node.choice.filter((o) => !('if' in o) || check(o.if, game))));
        continue;
      }
      const step = d.next();
      if (step.type === 'line') t.heard.push(step.text);
    }
    game.markSeen(`dlg:${key}`);
  }
  function run(actions) {
    for (const a of [].concat(actions || [])) {
      if (!a || typeof a !== 'object') continue;
      if (a.puzzle) {
        const p = PUZZLES[a.puzzle];
        const c = resolveConfig(p.config, game);
        expect(replay(p.type, c, solve(p.type, c)).outcome).toBe('solved');
        if (game.recordResult(`puzzle:${a.puzzle}`, { completed: true }).firstClear) applyEffects(p.reward, game);
        run(a.then);
      } else if ('then' in a || 'else' in a) run(check(a.if, game) ? a.then : a.else);
      else if (a.if !== undefined && !check(a.if, game)) continue;
      else if (a.say) say(a.say);
      else if (a.fx) applyEffects(a.fx, game);
      else if (a.all) run(a.all);
      syncMissions(game, { season: 's3' });
    }
  }
  function arrive() {
    game.setLocation('s3-clinic', 150);
    for (const tr of CLINIC.triggers) {
      if (tr.once !== false && game.flag(`t.s3-clinic.${tr.id}`)) continue;
      if (!check(tr.if, game)) continue;
      if (tr.once !== false) game.setFlag(`t.s3-clinic.${tr.id}`);
      run(tr.run);
    }
  }
  function tap(id) {
    const it = CLINIC.interact.find((i) => i.id === id && check(i.if, game));
    if (!it) return null;
    game.markSeen(`it.s3-clinic.${id}`);
    const c = it.cases.find((x) => x.if === undefined || check(x.if, game));
    run(c.run);
    return c.run;
  }
  return Object.assign(t, { arrive, tap, say });
}

describe('Mission 01: the module and its registration', () => {
  it('is registered: its mission, place, puzzle, dialogue, evidence, decisions and journal page', () => {
    expect(M).toBeTruthy();
    expect(M.pack).toBe('s3');
    expect(CLINIC).toBeTruthy();
    expect(P).toBeTruthy();
    for (const k of Object.keys(M01.dialogue)) expect(DIALOGUE[k], k).toBe(M01.dialogue[k]);
    for (const e of Object.keys(M01.evidence)) expect(EVIDENCE_S3[e], e).toBeTruthy();
    // (later missions add their own decisions; Mission 01's two are exactly these)
    expect(DECISIONS_S3).toMatchObject({ 'sabri-reply': ['deny', 'laugh', 'confront'], 'marius-honest': ['honest', 'deflect'] });
    expect(JOURNAL['s3-sabri']).toBeTruthy();
    expect(CASE_S3.find((c) => c.mission === 's3-01').ids).toEqual(expect.arrayContaining(RECORDS));
  });

  it('every id the mission writes belongs to Season 3', () => {
    const ids = [
      's3:01-opened', 's3:01-asked', 's3:01-marius-in', 's3:01-solved', 's3:01-done', 's3:dec:sabri-reply', 's3:dec:marius-honest', 'mission:s3-01', 'puzzle:s3-office',
      'visited:s3-clinic', 't.s3-clinic.open', 'it.s3-clinic.sabri', 's3-sabri', ...Object.keys(M01.dialogue).map((k) => `dlg:${k}`), ...Object.keys(M01.evidence).map((e) => `s3.ev.${e}`),
    ];
    for (const id of ids) expect(isS3(id), id).toBe(true);
  });
});

describe('«إعادة بناء الأسبوع» (P-01)', () => {
  const stages = P.config.stages;

  it('is strict: no hint, no "show the answer", no skip — however many mistakes', () => {
    expect(P.strict && P.noSkip && P.noSolution).toBe(true);
    expect(P.hints ?? []).toEqual([]);
    expect(canSkip(P, { mistakes: 99, hintsUsed: 99, hintsOn: true })).toBe(false);
  });

  it('every card has exactly one right place, and it is the specified one (PUZZLE_SPECIFICATIONS.md P-01)', () => {
    for (const st of stages) {
      for (const c of st.cards) {
        expect(c.accepts, c.id).toHaveLength(1);
        expect(st.bins.map((b) => b.id)).toContain(c.accepts[0]);
        expect(c.accepts[0], c.id).toBe(OFFICE_ANSWER[c.id]);
      }
    }
    expect(stages.map((s) => s.cards.length)).toEqual([7, 6]);
  });

  it('cannot be guessed: 4⁷ ways for the log, 4⁶ for Sabri’s claims (Season 2’s floor: ≥ 8 a stage, ≥ 20 a puzzle)', () => {
    const spaces = stages.map((s) => s.bins.length ** s.cards.length);
    expect(spaces).toEqual([16384, 4096]);
    for (const n of spaces) expect(n).toBeGreaterThanOrEqual(8);
    expect(spaces.reduce((a, b) => a * b, 1)).toBeGreaterThanOrEqual(20);
  });

  it('is solved by its own rules', () => {
    const c = resolveConfig(P.config, createGame({ saveManager: null }));
    expect(replay('sort', c, solve('sort', c)).outcome).toBe('solved');
  });

  it('no line before it says whose «ر.» is whose, or what the week really was', () => {
    const ANSWER = ['إجا مرتين', 'ربيع كتب', 'مو ريان', 'الطابعة طبعت', 'گهوة ربيع', 'ما چانت زيارة', 'مو زيارة'];
    const after = new Set(['s3.01-solved', 's3.01-counter-done', 's3.01-sabri-admits', 's3.01-sabri-after', 's3.01-marius-after']);
    const before = [
      ...Object.entries(M01.dialogue).filter(([k]) => !after.has(k)).flatMap(([, v]) => scriptTexts(v)),
      ...M.steps.map((s) => s.text),
      M.summary,
      P.goal,
      P.intro,
      ...Object.entries(M01.evidence).filter(([id]) => id !== 'd-office').map(([, e]) => e.note),
    ];
    for (const w of ANSWER) for (const line of before) expect(line.includes(w), `«${w}» in «${line}»`).toBe(false);
  });
});

describe('Mission 01, played through from its own data', () => {
  const PLANS = ['deny', 'laugh', 'confront'].flatMap((reply) => ['honest', 'deflect'].map((honest) => ({ 'sabri-reply': reply, 'marius-honest': honest })));

  for (const plan of PLANS) {
    it(`${plan['sabri-reply']} × ${plan['marius-honest']}: the morning, the question, Marius, the records, the week, Sabri owns up`, () => {
      const { game, storage, others } = setup();
      const before = others();
      expect(missionState(M, game).status).toBe('active');
      const p = player(game, plan);
      p.arrive();
      expect(game.flag('s3:01-opened')).toBe(true);
      // before his question, the records are not hers yet: the counter is not even there
      expect(p.tap('counter')).toBeNull();
      p.tap('sabri');
      expect(game.flag('s3:dec:sabri-reply')).toBe(plan['sabri-reply']);
      expect(game.flag('s3:dec:marius-honest')).toBe(plan['marius-honest']);
      expect(game.has('s3.ev.e-sabri-count')).toBe(true);
      // her answer changes Sabri's very next line, and Marius's
      const heard = p.heard.join(' | ');
      expect(heard.includes('تقرير طبي يحتاج كل هالزيارات')).toBe(plan['sabri-reply'] === 'deny');
      expect(heard.includes('ضحكتي! يعني')).toBe(plan['sabri-reply'] === 'laugh');
      expect(heard.includes('مو قصدي')).toBe(plan['sabri-reply'] === 'confront');
      expect(heard.includes('صبري… ريان چان وياي الأحد')).toBe(plan['marius-honest'] === 'honest');
      expect(heard.includes('وإنتِ صايرة أحمر أكثر منه')).toBe(plan['marius-honest'] === 'deflect');
      // the counter waits until she has the records
      p.tap('counter');
      expect(game.flag('s3:01-solved')).toBeFalsy();
      for (const id of ['log', 'appointments', 'board', 'printer', 'lama']) p.tap(id);
      for (const e of RECORDS) expect(game.has(`s3.ev.${e}`), e).toBe(true);
      p.tap('counter');
      expect(game.flag('s3:01-solved')).toBe(true);
      expect(game.has('s3.ev.d-office')).toBe(true);
      // Sabri owns up — what he wrote to the group is what she said
      p.heard.length = 0;
      p.tap('sabri');
      const owned = p.heard.join(' | ');
      expect(owned.includes('مجرد صديق أخوية ماريوس')).toBe(plan['sabri-reply'] === 'deny');
      expect(owned.includes('إنچ ضحكتي')).toBe(plan['sabri-reply'] === 'laugh');
      expect(owned.includes('إنچ زعلتي')).toBe(plan['sabri-reply'] === 'confront');
      expect(game.has('s3.ev.e-group-msg')).toBe(true);
      expect(missionState(M, game).status).toBe('complete');
      expect(game.inJournal('s3-sabri')).toBe(true);
      // and Marius remembers how she answered him
      p.heard.length = 0;
      p.tap('marius');
      expect(p.heard.join(' ').includes('گلتيلي من أول')).toBe(plan['marius-honest'] === 'honest');
      expect(p.heard.join(' ').includes('المرة الجاية گوليلي من أول')).toBe(plan['marius-honest'] === 'deflect');
      // all of it in Season 3's own stored document, nothing of it outside
      expect(others()).toEqual(before);
      const stored = JSON.parse(storage.getItem(S3_KEY));
      expect(stored.flags).toMatchObject({ 'mission:s3-01': true, 's3:dec:sabri-reply': plan['sabri-reply'], 's3:dec:marius-honest': plan['marius-honest'] });
      expect(stored.collected).toEqual(expect.arrayContaining(['s3.ev.d-office', 's3.ev.e-group-msg']));
      expect(stored.journal).toContain('s3-sabri');
    });
  }

  it('every value of both decisions is read by a condition in the mission', () => {
    const text = JSON.stringify(M01);
    for (const [k, values] of Object.entries(M01.decisions)) for (const v of values) expect(text.includes(`dec3:${k}=${v}`), `${k}=${v}`).toBe(true);
  });
});

describe('«إعادة بناء الأسبوع» in the real panel (what the player sees)', () => {
  const noop = () => {};
  const fakeContext = () => {
    const gradient = { addColorStop: noop };
    return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
  };
  let root;
  let app;
  const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
  const until = async (fn, ms = 5000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const v = fn();
      if (v) return v;
      await wait(10);
    }
    throw new Error('timed out');
  };
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

  // (owner's final brief, 2026-11-02: the one help is the contextual guide — words only, tests/game/guides.test.js)
  it('has no hint ladder, solution or skip control (absent, not hidden) — only the guide; a wrong layout gets a neutral line — never a count', async () => {
    await app.toTitle();
    app.settings.set({ hints: true, tips: true });
    const done = app.ui.puzzle('s3-office');
    await until(() => $('.puzzle .sort-card'));
    expect($$('[data-act="hint"], [data-act="solution"], [data-act="skip"], [data-hint], [data-sol]')).toHaveLength(0);
    expect([...$('.panel-foot').children].map((b) => b.dataset.act)).toEqual(['guide']);
    // every line of the log into «ريان»: wrong (four of the seven are not his)
    const seen = [];
    for (let round = 0; round < 2; round++) {
      for (const card of P.config.stages[0].cards) {
        $(`.puzzle .sort-card[data-card="${card.id}"]`)?.click();
        await wait(2);
        $('.puzzle [data-bin="ryan"]')?.click();
        await wait(2);
      }
      $('.puzzle [data-submit]').click();
      await wait(5);
      seen.push($('.puzzle-feedback').textContent);
    }
    expect($('.panel.puzzle.is-solved')).toBeNull();
    for (const line of seen) expect(STRICT_WRONG, line).toContain(line);
    for (const line of seen) expect(line).not.toMatch(/[0-9٠-٩]/);
    $('.puzzle [data-act="close"]').click();
    await done;
  });
});

describe('the map', () => {
  it('Season 3 has its own page, and the clinic opens only after Season 2’s finale', () => {
    expect(REGIONS.map((r) => r.id)).toContain('s3');
    const w = WORLDS.find((x) => x.scene === 's3-clinic');
    expect(w.region).toBe('s3');
    expect(w.pack).toBe('s3');
    const g = createGame({ saveManager: null });
    expect(check(w.unlock, g)).toBe(false);
    g.setFlag('mission:s2-17');
    expect(check(w.unlock, g)).toBe(true);
    expect(missionState(M, g).status).toBe('active');
  });
});
