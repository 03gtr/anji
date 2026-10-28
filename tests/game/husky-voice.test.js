/**
 * Anji's husky speaks — in her own voice, in the real update loop.
 *
 * REGRESSION (reported by the player: «her dog does not speak»): the husky only ever answered a
 * tap with an emoji (👀, 😏…), and the idle remarks of every scene are Snooki's, played only while
 * Snooki walks with Anji. Since the meeting Snooki is with Ryan, so on her own the dog beside her
 * never said a word. Now: tapping her gets her own lines (in turn, never at random), and when it is
 * just the two of them she has her own idle remarks. Snooki keeps his lines and his place.
 *
 * Where each dog talks:
 *   before the meeting        Snooki walks with Anji: his taps and the scene's remarks (unchanged)
 *   on her own, after         her husky: her taps and her remarks; Snooki is away with Ryan
 *   with Ryan (rose garden…)  her husky: her taps and remarks; Snooki beside Ryan: Ryan's-Snooki taps
 *   the shared walk           Snooki walks (with Ryan) and has the scene's remarks; she answers taps
 *   a scene that places her   (Story Pack scenes) she answers taps; the story speaks for her there
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { HUSKY_TAPS, HUSKY_AMBIENT, SNOOKI_TAPS, SNOOKI_RYAN_TAPS, bubbleLines } from '../../src/game/world/engine.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

const ARABIC_WORD = /[ء-ي]{2,}/;

describe('a speech bubble fits a phone: its words wrap into lines within the width', () => {
  const measure = (s) => s.length * 5; // a stand-in for the font: 5 units a letter
  it('every word kept, in order; no line wider than allowed; short text stays one line', () => {
    for (const text of [...HUSKY_TAPS.map((r) => r.text), ...HUSKY_AMBIENT, ...SNOOKI_RYAN_TAPS.map((r) => r.text)]) {
      const lines = bubbleLines(text, measure, 140);
      expect(lines.join(' ')).toBe(text.split(/\s+/).filter(Boolean).join(' '));
      for (const l of lines) expect(measure(l) <= 140 || !l.includes(' '), l).toBe(true);
    }
    expect(bubbleLines('هاو!', measure, 140)).toEqual(['هاو!']);
  });
  it('a single word wider than the line keeps a line of its own (never split inside a word)', () => {
    expect(bubbleLines('آ ب ' + 'ج'.repeat(40) + ' د', measure, 50)).toEqual(['آ ب', 'ج'.repeat(40), 'د']);
  });
});

describe('her lines', () => {
  it('words, not only an emoji — every tap line and every idle remark', () => {
    expect(HUSKY_TAPS.length).toBeGreaterThanOrEqual(6);
    expect(HUSKY_AMBIENT.length).toBeGreaterThanOrEqual(5);
    for (const r of HUSKY_TAPS) expect(r.text, r.text).toMatch(ARABIC_WORD);
    for (const t of HUSKY_AMBIENT) expect(t).toMatch(ARABIC_WORD);
  });
  it('her own: none of them is Snooki\'s; no repeats; only poses her sprite has; no wedding', () => {
    const hers = [...HUSKY_TAPS.map((r) => r.text), ...HUSKY_AMBIENT];
    const his = [...SNOOKI_TAPS, ...SNOOKI_RYAN_TAPS].map((r) => r.text);
    expect(hers.filter((t) => his.includes(t))).toEqual([]);
    expect(new Set(hers).size).toBe(hers.length);
    for (const r of HUSKY_TAPS) expect(['sit', 'sniff', 'excited', 'wag', 'bark', 'celebrate']).toContain(r.pose);
    for (const t of hers) expect(t).not.toMatch(/عرس|زواج|زفاف|خطوبة/);
  });
});

/* ── in the real engine ───────────────────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
let storage;
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
const NOTICES = ['intro-done', 'map-open', 'met-snooki', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team'];
const ENDED = ['act7-done', 'workshop-entered', 'wk-intro', 't.workshop.enter', 't.workshop.machine', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done', 'dg-box'];
const HUSKY = ['sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met'];

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

  async function enter(scene, flags, x, keep = false) {
    if (!keep) {
      const g = createGame({ saveManager: null, initial: { ...defaultState() } });
      g.setFlags(flags);
      g.setFlag(HUSKY_FLAG, 'لولو');
      g.state.seen.push('dlg:a8.open');
      storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene, x } }) });
    }
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    app.go(scene, { spawnX: x });
    const w = await until(() => app.screen?.world?.actor?.('anji') && app.screen.world);
    for (let i = 0; i < 30; i++) w.tick(1 / 60);
    return w;
  }
  const frames = (w, n) => {
    for (let i = 0; i < n; i++) w.tick(1 / 60);
  };
  /** Tap her where she stands (the canvas tap path, in world coordinates), let the reaction pass. */
  const tapHusky = (w) => {
    const h = w.actor('husky');
    frames(w, 120); // past the previous reaction (1.6 s)
    const took = w.tapAt(h.x, h.y - 20);
    return { took, text: h.bubble?.text };
  };

  it('REGRESSION: on her own after the meeting, a tap gets her words — each tap the next line, in turn; a reload carries on', async () => {
    let w = await enter('final', [...NOTICES, ...ENDED, ...HUSKY], 1050);
    expect(w.actor('snooki').companion).toBe(false); // Snooki is with Ryan, not with her
    const said = [];
    for (let i = 0; i < 3; i++) {
      const r = tapHusky(w);
      expect(r.took).toBe('husky');
      said.push(r.text);
    }
    for (const t of said) expect(t).toMatch(ARABIC_WORD);
    const order = HUSKY_TAPS.map((r) => r.text);
    expect(said).toEqual(order.slice(0, 3)); // in turn, not at random
    app.destroy();
    w = await enter('final', [], 1050, true); // the same save, reloaded
    expect(tapHusky(w).text).toBe(order[3]);
  });

  it('REGRESSION: just the two of them and Anji stands a while — the husky has her own say; Snooki (beside Ryan) does not', async () => {
    const w = await enter('final', [...NOTICES, ...ENDED, ...HUSKY], 1050);
    const husky = w.actor('husky');
    const snooki = w.actor('snooki');
    let heard = null;
    for (let i = 0; i < 60 * 20 && !heard; i++) {
      frames(w, 1);
      if (husky.bubble) heard = husky.bubble.text;
      expect(snooki.bubble).toBeFalsy();
    }
    expect(HUSKY_AMBIENT).toContain(heard);
    // REGRESSION: she said it from her scouting spot, 110 ahead — at the edge of a phone's ~180-wide
    // view, so it went unseen. Now she comes back to Anji's side while she speaks.
    expect(husky.x - w.player.x).toBeGreaterThan(90); // (she was scouting ahead when it began)
    frames(w, 60); // a second later, still speaking
    expect(husky.bubble?.text).toBe(heard);
    expect(Math.abs(husky.x - w.player.x)).toBeLessThan(80);
  });

  it('before the meeting nothing changes: Snooki walks with her and the scene\'s remarks are his', async () => {
    const w = await enter('house', [...NOTICES, 'act1-done', 'house-entered'], 600);
    expect(w.actor('husky')).toBeUndefined();
    const s = w.actor('snooki');
    expect(s.companion).toBe(true);
    let heard = null;
    for (let i = 0; i < 60 * 20 && !heard; i++) {
      frames(w, 1);
      if (s.bubble) heard = s.bubble.text;
    }
    expect(heard).toBeTruthy();
    expect(HUSKY_AMBIENT).not.toContain(heard);
  });

  it('the workshop and the rose garden (after the ending, the open ending read): she answers; Snooki beside Ryan answers as Ryan\'s dog', async () => {
    let w = await enter('workshop', [...NOTICES, ...ENDED, ...HUSKY], 300);
    expect(tapHusky(w)).toMatchObject({ took: 'husky' });
    expect(HUSKY_TAPS.map((r) => r.text)).toContain(w.actor('husky').bubble.text);
    app.destroy();
    w = await enter('final', [...NOTICES, ...ENDED, ...HUSKY], 1300);
    const s = w.actor('snooki');
    frames(w, 60);
    // Snooki: wait until he sits beside Ryan (he looks around now and then), then tap him
    for (let i = 0; i < 60 * 15 && (s.moveTo || Math.abs(s.x - (w.actor('ryan').x - 58)) > 1); i++) frames(w, 1);
    expect(w.tapAt(s.x, s.y - 20)).toBe('snooki');
    expect(SNOOKI_RYAN_TAPS.map((r) => r.text)).toContain(s.bubble.text);
    // and her: she scouts and follows, so find her where she is
    const r = tapHusky(w);
    expect(r.took).toBe('husky');
    expect(HUSKY_TAPS.map((x) => x.text)).toContain(r.text);
  });

  it('the shared walk: Snooki (with Ryan) keeps the scene\'s remarks; she answers a tap', async () => {
    const w = await enter('dogwalk', [...NOTICES, ...ENDED, ...HUSKY, 'tu-walk-plan'], 400);
    const s = w.actor('snooki');
    const husky = w.actor('husky');
    // her first, while she is still at Anji's side (later she scouts ahead, onto the walk's signs)
    const r = tapHusky(w);
    expect(r.took).toBe('husky');
    expect(HUSKY_TAPS.map((x) => x.text)).toContain(r.text);
    frames(w, 60 * 3);
    let snookiSaid = null;
    for (let i = 0; i < 60 * 20 && !snookiSaid; i++) {
      frames(w, 1);
      if (s.bubble) snookiSaid = s.bubble.text;
      expect(HUSKY_AMBIENT).not.toContain(husky.bubble?.text); // no idle remark of hers on the walk
    }
    expect(snookiSaid).toBeTruthy();
    expect(HUSKY_AMBIENT).not.toContain(snookiSaid);
  });
});
