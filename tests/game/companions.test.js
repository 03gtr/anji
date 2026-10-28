/**
 * The owner's rule (hotfix): the meeting under the blue rose tree is the turning point.
 * Before it, Snooki walks with Anji (his mission: bring her to Ryan). From it on, Snooki is
 * Ryan's: beside Ryan where Ryan is, otherwise away with him — never her companion when she is
 * on her own — and Anji walks with her own husky. Where the two of them are together, both dogs.
 * Each dog behaves like its person (tested in the engine). Synthetic saves only.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check } from '../../src/game/core/conditions.js';
import { syncMissions } from '../../src/game/progression/missions.js';
import { dogsIn, MET_RYAN } from '../../src/game/data/companions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DEEP_SCENES } from '../../src/game/data/scenes/deep.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { SNOOKI_RYAN_TAPS, HUSKY_TAPS } from '../../src/game/world/engine.js';
import { memoryStorage } from '../helpers.js';

const game = (flags = {}, strings = {}) => {
  const g = createGame({ saveManager: null, initial: { ...defaultState(), flags: { ...flags } } });
  for (const [k, v] of Object.entries(strings)) g.setFlag(k, v);
  return g;
};
const ENDED = { 'act7-done': true, 'final-entered': true, 't.final.meet': true, 'rose-planted': true, 'game-complete': true, 'act8-done': true };
const SP1_DONE = { 'sp1-roads-seen': true, 'sp1-embrace': true, 'sp1-visit-done': true, 'sp1-husky-met': true, 'sp1-gift-open': true, 'sp1-done': true };
/** A finished game, Story Pack 01 done, her husky named «لولو». */
const finished = (more = {}) => game({ ...ENDED, ...SP1_DONE, ...more }, { [HUSKY_FLAG]: 'لولو' });
const ALL = Object.values(SCENES);
const SOLO = ALL.filter((s) => !(s.actors || []).some((a) => a.kind === 'ryan'));
const meet = SCENES.final.triggers.find((t) => t.id === 'meet');

describe('before the meeting under the rose tree: the original story', () => {
  it('Snooki walks with Anji in every scene; the husky is never a second follower', () => {
    for (const flags of [{}, { 'act4-done': true, 'sp2-husky-early': true }, { 'act7-done': true, 'final-entered': true }]) {
      const g = game(flags, flags['sp2-husky-early'] ? { [HUSKY_FLAG]: 'ثلجة' } : {});
      expect(check(MET_RYAN, g)).toBe(false);
      for (const s of ALL) {
        expect(dogsIn(s, g).snooki, s.id).toBe('follow');
        expect(dogsIn(s, g).husky, s.id).not.toBe('follow');
      }
    }
  });
});

describe('the meeting is the turning point', () => {
  it('the meeting itself sends Snooki to Ryan and ends his walking with her (in that same scene)', () => {
    const i = meet.run.findIndex((a) => a.move === 'snooki');
    expect(meet.run[i + 1]).toEqual({ stay: 'snooki' });
    // a save left in the middle of the ending (the meeting started, the ending not finished) already counts
    const mid = game({ 'act7-done': true, 'final-entered': true, 't.final.meet': true });
    expect(check(MET_RYAN, mid)).toBe(true);
    expect(dogsIn(SCENES.final, mid).snooki).toBe('ryan');
    expect(dogsIn(SCENES.house, mid).snooki).toBe('away');
  });

  it('re-entering the rose garden: the meeting does not repeat, and nothing turns back', () => {
    const g = finished();
    expect(check(meet.if, g)).toBe(false);
    const first = dogsIn(SCENES.final, g);
    expect(first).toMatchObject({ snooki: 'ryan', husky: 'follow' });
    expect(dogsIn(SCENES.final, g)).toEqual(first);
  });
});

describe('after the meeting: Snooki with Ryan, her husky with her', () => {
  it('REGRESSION: on her own, Snooki never follows her — not with Story Pack 01, the archive or the deep case still open', () => {
    const states = [
      game({ ...ENDED, 'sp1-husky-met': true }, { [HUSKY_FLAG]: 'لولو' }), // Story Pack 01 not finished
      finished({ 'sp2-entered': true }), // the archive played late
      finished({ 'dg-box': true }), // in the middle of the deep garden's case
      game({ ...ENDED }), // has not met her husky yet
    ];
    for (const g of states) {
      for (const s of SOLO) expect(dogsIn(s, g).snooki, s.id).toBe('away');
    }
    for (const s of [SCENES.archives, ...DEEP_SCENES, SCENES.garden, SCENES.house]) expect(dogsIn(s, finished({ 'dg-box': true, 'sp2-entered': true })).snooki, s.id).toBe('away');
  });

  it('Anji on her own: her husky walks with her (once met); before she meets her, she walks alone', () => {
    for (const id of ['garden', 'house', 'library', 'clockgarden', 'archives']) expect(dogsIn(SCENES[id], finished()), id).toMatchObject({ snooki: 'away', husky: 'follow' });
    expect(dogsIn(SCENES.garden, game({ ...ENDED }))).toMatchObject({ snooki: 'away', husky: 'away' });
  });

  it('Ryan and Anji together: Snooki beside Ryan and her husky with her; on the walk all four together', () => {
    const g = finished({ 'tu-walk-plan': true, 'tu-train-plan': true });
    for (const id of ['final', 'trainyard', 'roseclinic']) {
      const d = dogsIn(SCENES[id], g);
      expect(d.snooki, id).toBe('ryan');
      expect(d.ryanX, id).toBe(SCENES[id].actors.find((a) => a.kind === 'ryan').x);
      expect(['follow', 'placed'], id).toContain(d.husky);
    }
    expect(dogsIn(SCENES.dogwalk, g)).toMatchObject({ snooki: 'follow', husky: 'follow' });
    expect(SCENES.dogwalk.together).toBe(true);
  });

  it('a scene that places her husky keeps her there (Story Pack 01), never a second copy', () => {
    const g = finished();
    expect(dogsIn(SCENES.roads, g).husky).toBe('placed');
    expect(dogsIn(SCENES.roseclinic, g)).toMatchObject({ snooki: 'ryan', husky: 'placed' });
  });
});

describe('saves stay as they are', () => {
  it('nothing is written; the husky keeps her name; missions and journal are untouched; no second introduction', () => {
    const g = finished({ 'sp2-ledger-read': true, 'sp2-husky-early': true, 'mission:sp1-two-roads': true, 'dg-box': true });
    g.addJournal('ending');
    g.addJournal('sp1-husky');
    const before = JSON.stringify(g.state);
    for (const s of ALL) dogsIn(s, g);
    expect(JSON.stringify(g.state)).toBe(before);
    syncMissions(g);
    expect(g.flag('mission:sp1-two-roads')).toBe(true);
    expect(g.state.journal).toEqual(expect.arrayContaining(['ending', 'sp1-husky']));
    expect(g.flag(HUSKY_FLAG)).toBe('لولو');
    expect(check(SCENES.sanctuary.interact.find((i) => i.id === 'sp2-pup').if, g)).toBe(false);
  });
});

/* ── in the real engine: who is where, and how each dog behaves ─────────── */
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

  async function enter(scene, flags = {}, x = 400) {
    const g = finished({ 'intro-done': true, 'map-open': true, 'notice:sp1': true, 'notice:sp2': true, 'notice:deep': true, 'notice:team': true, ...flags });
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene, x } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
    app.go(scene, { spawnX: x });
    return until(() => app.screen?.world?.actor?.('anji') && app.screen.world);
  }

  it('the rose garden: Snooki sits beside Ryan (not following), looks around now and then and comes back; her husky follows her', async () => {
    const w = await enter('final', {}, 600);
    const snooki = w.actor('snooki');
    const ryan = w.actor('ryan');
    expect(snooki.visible && !snooki.companion).toBe(true);
    const home = ryan.x - 58;
    expect(snooki.x).toBe(home);
    expect(snooki.pose).toBe('sit');
    expect(w.actor('husky').companion).toBe(true);
    // Snooki: a measured look around (a few steps), then always back to Ryan
    let farthest = 0;
    for (let i = 0; i < 60 * 30; i++) {
      w.tick(1 / 60);
      farthest = Math.max(farthest, Math.abs(snooki.x - home));
    }
    expect(farthest).toBeGreaterThan(30);
    expect(farthest).toBeLessThan(120);
    for (let i = 0; i < 60 * 12 && Math.abs(snooki.x - home) > 1; i++) w.tick(1 / 60);
    expect(Math.abs(snooki.x - home)).toBeLessThanOrEqual(1);
    expect(Math.abs(snooki.x - w.actor('anji').x)).toBeGreaterThan(200); // he never wanders off to her
  });

  it('on her own: no Snooki (not drawn, no taps, no remarks); her husky scouts ahead when she stops', async () => {
    const w = await enter('house', {}, 500);
    const snooki = w.actor('snooki');
    expect(snooki.visible).toBe(false);
    expect(w.snookiReact()).toBe(false);
    const husky = w.actor('husky');
    const anji = w.actor('anji');
    for (let i = 0; i < 60 * 2; i++) w.tick(1 / 60);
    expect((husky.x - anji.x) * anji.facing).toBeLessThan(0); // just arrived: behind her
    for (let i = 0; i < 60 * 6; i++) w.tick(1 / 60); // she stands still
    expect((husky.x - anji.x) * anji.facing).toBeGreaterThan(60); // the husky has gone ahead to explore
    for (let i = 0; i < 60 * 20; i++) w.tick(1 / 60);
    expect(snooki.bubble).toBeFalsy(); // no remarks from a dog who is not here
  });

  it("a tap on each dog gives that dog's own reaction (Snooki with Ryan steady, the husky curious and playful)", async () => {
    const w = await enter('final', {}, 1300);
    expect(w.snookiReact()).toBe(true);
    expect(SNOOKI_RYAN_TAPS.map((r) => r.text)).toContain(w.actor('snooki').bubble.text);
    expect(w.huskyReact()).toBe(true);
    expect(HUSKY_TAPS.map((r) => r.text)).toContain(w.actor('husky').bubble.text);
  });
});
