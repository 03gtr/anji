/**
 * Snooki is Ryan's dog; the husky is Anji's — in the real update loop, not only in the rules.
 *
 * REGRESSION (seen on a real phone): on the shared walk («مشية العصر», `together: true`) every
 * companion followed Anji: Snooki trotted right behind her (62 units), level with her husky, while
 * Ryan walked behind them both (178) — Snooki looked like he had left Ryan to stay with her. On a
 * shared outing each dog now walks with its own person: Snooki at Ryan's side, the husky with her.
 * His mission role before the meeting (walking her to Ryan) is unchanged.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { dogsIn } from '../../src/game/data/companions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { SNOOKI_RYAN_TAPS, SNOOKI_TAPS } from '../../src/game/world/engine.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

const NOTICES = ['intro-done', 'map-open', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team'];
const ENDED = ['act7-done', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done'];
const HUSKY = ['sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met'];
const game = (flags) => {
  const g = createGame({ saveManager: null, initial: { ...defaultState() } });
  g.setFlags(flags);
  g.setFlag(HUSKY_FLAG, 'لولو');
  return g;
};

describe('who walks with whom (rules)', () => {
  it('before the meeting: Snooki walks with Anji (his mission), no leader', () => {
    expect(dogsIn(SCENES.garden, game(NOTICES))).toMatchObject({ snooki: 'follow' });
    expect(dogsIn(SCENES.garden, game(NOTICES)).leader).toBeUndefined();
  });
  it('the shared walk: both dogs come, Snooki with Ryan', () => {
    expect(dogsIn(SCENES.dogwalk, game([...NOTICES, ...ENDED, ...HUSKY]))).toMatchObject({ snooki: 'follow', leader: 'ryan', husky: 'follow' });
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
const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true }));

describe('in the engine', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
  });
  afterEach(() => {
    key('keyup', 'ArrowRight');
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  async function enter(scene, flags, x, seen = []) {
    const g = game(flags);
    g.state.seen.push(...seen);
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene, x } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
    app.go(scene, { spawnX: x });
    const w = await until(() => app.screen?.world?.actor?.('anji') && app.screen.world);
    for (let i = 0; i < 30; i++) w.tick(1 / 60);
    return w;
  }
  const frames = (w, n) => {
    for (let i = 0; i < n; i++) w.tick(1 / 60);
  };

  it('REGRESSION: the shared walk — Snooki keeps to Ryan, the husky to her; the two dogs are not glued together', async () => {
    const w = await enter('dogwalk', [...NOTICES, ...ENDED, ...HUSKY, 'tu-walk-plan'], 400);
    const [anji, snooki, husky, ryan] = ['anji', 'snooki', 'husky', 'ryan'].map((id) => w.actor(id));
    expect(snooki.visible && snooki.companion && husky.companion && ryan.companion).toBe(true);
    key('keydown', 'ArrowRight');
    let samples = 0;
    let glued = 0;
    let withRyan = 0;
    for (let i = 0; i < 60 * 6; i++) {
      frames(w, 1);
      if (i < 120) continue; // everyone has caught up after the first two seconds
      samples++;
      if (Math.abs(snooki.x - husky.x) < 24) glued++;
      if (Math.abs(snooki.x - ryan.x) < Math.abs(snooki.x - anji.x)) withRyan++;
    }
    key('keyup', 'ArrowRight');
    expect(anji.x).toBeGreaterThan(900); // she really walked
    expect(withRyan / samples).toBeGreaterThan(0.95); // Snooki walks at Ryan's side…
    // (on the move every follower trails its person a little: the follow speed tops out near walking pace)
    expect(Math.abs(snooki.x - ryan.x)).toBeLessThan(150);
    expect(Math.abs(husky.x - anji.x)).toBeLessThan(Math.abs(snooki.x - anji.x)); // …her husky is the one with her
    expect(glued / samples).toBeLessThan(0.1);
    // she stops: her husky scouts ahead (curious), Snooki stays with Ryan (steady)
    frames(w, 60 * 6);
    expect(Math.abs(snooki.x - ryan.x)).toBeLessThan(90);
    expect(husky.x).toBeGreaterThan(anji.x);
  });

  it('a tap on Snooki on the walk gets Ryan\'s Snooki (not the mission-era lines)', async () => {
    const w = await enter('dogwalk', [...NOTICES, ...ENDED, ...HUSKY, 'tu-walk-plan'], 400);
    const s = w.actor('snooki');
    frames(w, 120);
    w.tapAt(s.x, s.y - 20);
    expect(SNOOKI_RYAN_TAPS.map((r) => r.text)).toContain(s.bubble?.text);
    expect(SNOOKI_TAPS.map((r) => r.text)).not.toContain(s.bubble?.text);
  });

  it('before the meeting (his mission): Snooki walks with Anji', async () => {
    const w = await enter('garden', [...NOTICES, 'met-snooki'], 400);
    const s = w.actor('snooki');
    expect(s.companion && s.leader == null).toBe(true);
    key('keydown', 'ArrowRight');
    frames(w, 120);
    key('keyup', 'ArrowRight');
    frames(w, 60);
    expect(Math.abs(s.x - w.player.x)).toBeLessThan(100);
  });

  it('the rose garden after the ending, with the open ending: Snooki stays beside Ryan; her husky with her', async () => {
    const w = await enter('final', [...NOTICES, ...ENDED, ...HUSKY], 900);
    w.player.x = 1220; // under the rose tree: the open ending plays (a save from before it existed)
    await until(() => (w.tick(1 / 60), root.querySelector('.overlay-dialogue')?.textContent.includes('هنا تخلص الحكاية')), 10000);
    await until(() => {
      root.querySelector('.overlay-dialogue .dlg-nextbtn')?.click();
      w.tick(1 / 60);
      return !root.querySelector('.overlay-dialogue') && w.mode === 'play';
    }, 10000);
    const s = w.actor('snooki');
    const ryan = w.actor('ryan');
    expect(s.companion).toBe(false);
    key('keydown', 'ArrowRight');
    frames(w, 60 * 3);
    key('keyup', 'ArrowRight');
    frames(w, 60 * 4);
    expect(Math.abs(s.x - (ryan.x - 58))).toBeLessThan(130); // home beside Ryan (with his short look-arounds)
    expect(w.actor('husky').companion).toBe(true);
    expect(Math.abs(w.actor('husky').x - w.player.x)).toBeLessThan(200);
  });
});
