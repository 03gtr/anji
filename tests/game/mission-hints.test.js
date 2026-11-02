/**
 * «تلميح» inside the missions (data/mission-hints.js; the owner's hotfix brief): help on what to do next, never an
 * answer.
 *  - coverage: every chapter objective of the original story and every step of every mission, in every season and
 *    the final story, has a hint that is a real sentence — no step is left without one;
 *  - no leak: no digit; read against every puzzle that completes the step (its reward, or the run that sets it),
 *    never an answer, never a card with its place, a row with its value or a line with the evidence that breaks it;
 *  - the real HUD: the «تلميح» button shows the current step's words, closes again when the step changes, is hidden
 *    when the hint setting is off, is at least 44 px tall, and touches nothing (not a flag, not a save byte);
 *  - the journal shows the same words for the step.
 */
import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { defaultState } from '../../src/game/core/save.js';
import { atoms } from '../../src/game/core/conditions.js';
import { ACTS, currentObjective } from '../../src/game/data/chapters.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { ACT_HINTS, STEP_HINTS, missionHint, actHint } from '../../src/game/data/mission-hints.js';
import { missionState } from '../../src/game/progression/missions.js';
import { secrets } from './puzzle-secrets.js';
import { setup } from './s3-play.js';

const norm = (a) => String(a).replace(/^!?flag:/, '');
/** Every puzzle run in a scene, with the effects its success sets. */
const RUNS = [];
(function walk(o) {
  if (Array.isArray(o)) return o.forEach(walk);
  if (!o || typeof o !== 'object') return;
  if (typeof o.puzzle === 'string') {
    const fx = new Set();
    (function collect(x) {
      if (Array.isArray(x)) return x.forEach(collect);
      if (!x || typeof x !== 'object') return;
      for (const f of [].concat(x.fx ?? [])) if (typeof f === 'string') fx.add(norm(f));
      Object.values(x).forEach(collect);
    })(o.then);
    RUNS.push([o.puzzle, fx]);
  }
  Object.values(o).forEach(walk);
})(Object.values(SCENES).map((s) => [s.interact, s.triggers]));
/** The puzzles that complete a step. */
function puzzlesOf(done) {
  const want = new Set(atoms(done).map(norm));
  const ids = new Set();
  for (const [id, p] of Object.entries(PUZZLES)) if ([].concat(p.reward ?? []).some((r) => want.has(norm(r)))) ids.add(id);
  for (const [id, fx] of RUNS) if ([...want].some((w) => fx.has(w))) ids.add(id);
  return [...ids].filter((id) => PUZZLES[id]);
}
/** A finished original story, as a real save holds it (setup() sets only the ending's own flags). */
function finished() {
  const t = setup();
  for (const a of ACTS) for (const o of a.objectives) for (const at of atoms(o.done)) {
    const [k, ...r] = at.split(':');
    if (k === 'flag') t.game.setFlag(r.join(':'));
    if (k === 'record') t.game.recordResult(r.join(':'), { completed: true });
    if (k === 'item') t.game.addItem(r.join(':'));
  }
  t.game.save();
  return t;
}
const STEPS = [
  ...ACTS.flatMap((a) => a.objectives.map((o, i) => [`act ${a.act} · ${i + 1}`, actHint(a.act, i), o.done])),
  ...MISSIONS.flatMap((m) => m.steps.map((s, i) => [`${m.id} · ${i + 1}`, missionHint(m, i), s.done])),
];

describe('every mission step has a «تلميح»', () => {
  it('the original story\'s chapters, every mission of every season, and the final story: no step without one', () => {
    for (const a of ACTS) expect(ACT_HINTS[a.act], `act ${a.act}`).toHaveLength(a.objectives.length);
    for (const [where, hint] of STEPS) expect(hint, `${where}: no hint`).toBeTruthy();
    // this file's words are real sentences (the original game's own step hints are its own, often short)
    for (const h of [...Object.values(ACT_HINTS), ...Object.values(STEP_HINTS)].flat()) expect(h.length, `«${h}» is too short to help`).toBeGreaterThanOrEqual(25);
    for (const pack of ['s2', 's3']) expect(MISSIONS.filter((m) => m.pack === pack).length, pack).toBeGreaterThan(0);
    expect(MISSIONS.filter((m) => m.arc === 'final')).toHaveLength(4);
    // every hint of this file belongs to a mission that had none of its own, step for step
    for (const [id, list] of Object.entries(STEP_HINTS)) {
      const m = MISSIONS.find((x) => x.id === id);
      expect(m, id).toBeTruthy();
      expect(list, id).toHaveLength(m.steps.length);
      expect(m.steps.some((s) => s.hint), `${id} has hints of its own`).toBe(false);
    }
  });
});

describe('no «تلميح» gives an answer', () => {
  it('no digit, and nothing a puzzle of the step would accept as its answer', () => {
    let read = 0;
    const leaks = [];
    for (const [where, hint, done] of STEPS) {
      if (/[0-9٠-٩]/.test(hint)) leaks.push(`${where}: a digit in «${hint}»`);
      for (const id of puzzlesOf(done)) {
        read++;
        const { alone, pairs } = secrets(PUZZLES[id]);
        for (const s of alone) if (hint.includes(s)) leaks.push(`${where} (${id}): names «${s}» in «${hint}»`);
        for (const [a, b] of pairs) if (hint.includes(a) && hint.includes(b)) leaks.push(`${where} (${id}): pairs «${a}» with «${b}»`);
      }
    }
    expect(leaks).toEqual([]);
    // the steps that end in a puzzle were all read against it (the original story's, Season 2's, Season 3's)
    expect(read).toBeGreaterThanOrEqual(35);
  });
  it('the objective carries the step\'s hint: a new game, a chapter, a season', () => {
    const g = createGame({ saveManager: null, initial: defaultState() });
    expect(currentObjective(g).hint).toBe(ACT_HINTS[1][0]);
    const { game } = finished();
    game.setLocation('s3-clinic', 200);
    const m = MISSIONS.find((x) => x.id === 's3-01');
    expect(currentObjective(game)).toMatchObject({ text: m.steps[0].text, hint: STEP_HINTS['s3-01'][0] });
    expect(missionState(m, game).step).toBe(0);
  });
});

const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => gradient : k === 'measureText' ? () => ({ width: 40 }) : k === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
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

describe('the «تلميح» button, in the real game', () => {
  let root;
  let app;
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
  });
  afterEach(() => {
    app?.destroy();
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('shows the step\'s words on a tap, touches nothing, follows the step, and the setting hides it', async () => {
    const { storage } = finished();
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false, hints: true });
    app.go('s3-clinic', { spawnX: 200 });
    const btn = await until(() => root.querySelector('.play[data-scene="s3-clinic"] .hint-pill'));
    const card = root.querySelector('.objective-hint');
    // once the place has loaded (her location is the clinic), the HUD holds Season 3's first step
    await until(() => app.game.location()?.scene === 's3-clinic' && card.textContent === STEP_HINTS['s3-01'][0]);
    expect(btn.hidden).toBe(false);
    expect(btn.textContent).toContain('تلميح');
    expect(card.hidden).toBe(true);
    await wait(300); // the arrival settles (nothing more is written while she stands still)

    const dump = () => JSON.stringify(storage.dump());
    const before = [JSON.stringify(app.game.state), JSON.stringify(app.game.s3State), dump()];
    btn.click();
    expect(card.hidden).toBe(false);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(card.textContent).toBe(STEP_HINTS['s3-01'][0]);
    btn.click();
    expect(card.hidden).toBe(true);
    btn.click();
    card.click(); // a tap on the words closes them too
    expect(card.hidden).toBe(true);
    expect([JSON.stringify(app.game.state), JSON.stringify(app.game.s3State), dump()]).toEqual(before);

    // the step changes: the button now holds the next step's words, closed
    btn.click();
    app.game.setFlag('s3:01-asked');
    await until(() => card.textContent === STEP_HINTS['s3-01'][1]);
    expect(card.hidden).toBe(true);

    // the hint setting hides it
    app.settings.set({ hints: false });
    expect(btn.hidden).toBe(true);
    app.settings.set({ hints: true });
    expect(btn.hidden).toBe(false);
  });

  it('the journal shows the same words for the step', async () => {
    const { storage } = finished();
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    app.go('s3-clinic', { spawnX: 200 });
    await until(() => root.querySelector('.hint-pill'));
    app.ui.openJournal('missions');
    const card = await until(() => root.querySelector('.journal [data-mission="s3-01"]'));
    const b = card.querySelector('[data-mhint]');
    expect(b).toBeTruthy();
    b.click();
    expect(card.querySelector('.mission-hint').hidden).toBe(false);
    expect(card.querySelector('.mission-hint').textContent).toBe(STEP_HINTS['s3-01'][0]);
  });

  it('a touch target of at least 44 px, in the game\'s own colours', () => {
    const css = fs.readFileSync('src/game/styles/game.css', 'utf8');
    const rule = css.match(/\.hint-pill \{[^}]+\}/)[0];
    expect(rule).toMatch(/min-height: 44px/);
    expect(rule).toMatch(/var\(--gold\)/);
  });
});
