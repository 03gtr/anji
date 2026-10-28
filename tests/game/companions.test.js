/**
 * The owner's correction: Snooki is Ryan's dog, the white husky is Anji's. Before the ending
 * Snooki guides her (unchanged); after it Snooki is with Ryan (beside him where Ryan is) and
 * Anji walks with her own husky, with Snooki joining only when a story brings him along.
 * Checked as rules (every scene, several story states), as invariants, and in the real engine.
 * Synthetic saves only; nothing here writes a save.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check } from '../../src/game/core/conditions.js';
import { dogsIn, SNOOKI_JOINS } from '../../src/game/data/companions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DEEP_SCENES } from '../../src/game/data/scenes/deep.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

const game = (flags = {}, strings = {}) => {
  const g = createGame({ saveManager: null, initial: { ...defaultState(), flags: { ...flags } } });
  for (const [k, v] of Object.entries(strings)) g.setFlag(k, v);
  return g;
};
const ENDED = { 'act7-done': true, 'final-entered': true, 'rose-planted': true, 'game-complete': true };
const SP1_DONE = { 'sp1-roads-seen': true, 'sp1-embrace': true, 'sp1-visit-done': true, 'sp1-husky-met': true, 'sp1-gift-open': true, 'sp1-done': true };
/** A finished game, Story Pack 01 done, her husky named «لولو». */
const finished = (more = {}) => game({ ...ENDED, ...SP1_DONE, ...more }, { [HUSKY_FLAG]: 'لولو' });
const ALL = Object.values(SCENES);

describe('before the ending: the original story, unchanged', () => {
  it('Snooki walks with Anji in every scene; the husky is never a second follower', () => {
    for (const flags of [{}, { 'act4-done': true, 'sp2-husky-early': true }, { 'act7-done': true, 'final-entered': true }]) {
      const g = game(flags, flags['sp2-husky-early'] ? { [HUSKY_FLAG]: 'ثلجة' } : {});
      for (const s of ALL) {
        const d = dogsIn(s, g);
        expect(d.snooki, s.id).toBe('follow');
        expect(d.husky, s.id).not.toBe('follow');
      }
    }
  });
});

describe('after the ending: Snooki with Ryan, the husky with Anji', () => {
  it('the hidden garden: Snooki beside Ryan, her husky at her side', () => {
    const d = dogsIn(SCENES.final, finished());
    expect(d).toEqual({ snooki: 'ryan', husky: 'follow', ryanX: SCENES.final.actors.find((a) => a.kind === 'ryan').x });
  });

  it('a garden place with no story for Snooki: only her husky', () => {
    for (const id of ['garden', 'house', 'library', 'lake']) expect(dogsIn(SCENES[id], finished()), id).toMatchObject({ snooki: 'away', husky: 'follow' });
  });

  it('Story Pack 01 (shipped): Snooki is there while it is open; the husky is where its scenes put her', () => {
    const g = game({ ...ENDED, 'sp1-roads-seen': true, 'sp1-husky-met': true }, { [HUSKY_FLAG]: 'لولو' });
    expect(check(SNOOKI_JOINS, g)).toBe(true);
    expect(dogsIn(SCENES.roads, g)).toMatchObject({ snooki: 'follow', husky: 'placed' });
    // the clinic, once Ryan has come: Snooki stands with him (the visit with flowers and sweets)
    g.setFlag('sp1-visit-done');
    expect(dogsIn(SCENES.roseclinic, g)).toMatchObject({ snooki: 'ryan', husky: 'placed' });
  });

  it('a finished game that has not met the husky yet is never left without a dog', () => {
    const g = game({ ...ENDED });
    for (const s of ALL) {
      const d = dogsIn(s, g);
      expect(d.husky, s.id).not.toBe('follow');
      expect(['follow', 'ryan'].includes(d.snooki) || d.husky === 'placed', s.id).toBe(true);
    }
  });

  it('the deep garden: Snooki comes along for the case (he is the suspect) and goes back to Ryan after the second rose', () => {
    const g = finished({ 'dg-box': true });
    for (const s of DEEP_SCENES) {
      const d = dogsIn(s, g);
      expect(d.snooki, s.id).toBe('follow');
      expect(d.husky, s.id).toBe(s.actors?.some((a) => a.kind === 'husky') ? 'placed' : 'follow');
    }
    expect(dogsIn(SCENES.final, g).snooki).toBe('ryan'); // where Ryan is, beside Ryan
    g.setFlag('dg-planted');
    expect(dogsIn(SCENES.clockgarden, g)).toMatchObject({ snooki: 'away', husky: 'follow' });
    // the box beat: Snooki is shown running in before he speaks
    const box = SCENES.workshop.interact.find((i) => i.id === 'dg-seedbox').cases[0].run;
    expect(box.slice(0, 2)).toEqual([{ place: 'snooki', x: 690, facing: 1 }, { show: 'snooki' }]);
  });

  it('Story Pack 02 played late: the archive brings Snooki along; the walk brings all four', () => {
    expect(dogsIn(SCENES.archives, finished())).toMatchObject({ snooki: 'follow', husky: 'follow' });
    const walk = dogsIn(SCENES.dogwalk, finished({ 'tu-walk-plan': true }));
    expect(walk).toMatchObject({ snooki: 'follow', husky: 'follow' });
    expect(SCENES.dogwalk.actors.find((a) => a.kind === 'ryan').companion).toBe(true);
  });
});

describe('invariants, every scene and every state', () => {
  const states = [game(), game({ ...ENDED }), finished(), finished({ 'dg-box': true }), finished({ 'dg-box': true, 'dg-planted': true }), finished({ 'sp2-entered': true })];
  it('Snooki is beside Ryan only where Ryan is; nothing is written to the save; the name never changes', () => {
    for (const g of states) {
      const before = JSON.stringify(g.state);
      for (const s of ALL) {
        const d = dogsIn(s, g);
        if (d.snooki === 'ryan') expect(d.ryanX, s.id).not.toBeNull();
        expect(['follow', 'ryan', 'away']).toContain(d.snooki);
        expect(['follow', 'placed', 'away']).toContain(d.husky);
      }
      expect(JSON.stringify(g.state)).toBe(before);
    }
  });

  it('no second introduction: a named husky is never offered the meeting or the name again', () => {
    const g = finished({ 'sp2-ledger-read': true, 'sp2-husky-early': true });
    const pup = SCENES.sanctuary.interact.find((i) => i.id === 'sp2-pup');
    expect(check(pup.if, g)).toBe(false);
    const ryan = SCENES.roseclinic.interact.find((i) => i.cases?.some((c) => JSON.stringify(c).includes('sp1.husky-call')));
    for (const c of ryan.cases.filter((x) => JSON.stringify(x.if ?? '').includes('!flag:sp1-husky-met'))) expect(check(c.if, g)).toBe(false);
    expect(g.flag(HUSKY_FLAG)).toBe('لولو');
  });
});

/* ── in the real engine ─────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await wait(10);
  }
  throw new Error('timed out');
}

describe('in the engine', () => {
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

  async function enter(scene, flags) {
    const g = finished({ 'intro-done': true, 'map-open': true, 'notice:sp1': true, 'notice:sp2': true, 'notice:deep': true, 'notice:team': true, ...flags });
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene, x: 400 } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
    app.go(scene, { spawnX: 400 });
    return until(() => app.screen?.world?.actor?.('anji') && app.screen.world);
  }

  it('the hidden garden: Snooki stands with Ryan, the husky follows Anji', async () => {
    const w = await enter('final');
    const snooki = w.actor('snooki');
    const ryan = w.actor('ryan');
    expect(snooki.visible).toBe(true);
    expect(snooki.companion).toBe(false);
    expect(Math.abs(snooki.x - ryan.x)).toBeLessThan(80);
    expect(w.actor('husky')?.companion).toBe(true);
  });

  it('a garden place: only her husky; Snooki is not drawn and does not answer taps', async () => {
    const w = await enter('house');
    expect(w.actor('snooki').visible).toBe(false);
    expect(w.actor('husky').companion).toBe(true);
  });
});
