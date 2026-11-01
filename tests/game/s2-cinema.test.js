/**
 * Season 2 complete release, Part 5: the cinematic tools, run in the real world engine.
 * - `letterbox`: cinema bars for a set piece, on and off; back to play they always leave;
 * - `exit`: someone walks out of the place and is gone;
 * - world/lighting.js `darkness`: a front layer with light pools that depend on the game; draws without error,
 *   one mask canvas reused frame after frame.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { darkness } from '../../src/game/world/lighting.js';
import { memoryStorage } from '../helpers.js';

const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
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

describe('cinematic tools', () => {
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
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('letterbox on for a set piece, off again; exit walks someone out and away', async () => {
    await app.go('s2-loft');
    const world = await until(() => app.screen?.world?.mode === 'play' && app.screen.world);
    await world.run([{ spawn: { id: 'walker', kind: 'jojo', x: 300, facing: 1 } }]);
    expect(world.actor('walker')).toBeTruthy();
    const playing = world.run([{ letterbox: true }, { exit: 'walker', side: 'right', speed: 4000 }, { letterbox: false }]);
    await until(() => world.letterbox === 1);
    await playing;
    expect(world.actor('walker')).toBeFalsy();
    expect(world.letterbox).toBe(0);
  });
});

describe('lighting', () => {
  it('a darkness layer draws over the people, with the lights the game asks for, reusing one mask', () => {
    const made = [];
    const real = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = real(tag);
      if (tag === 'canvas') {
        made.push(el);
        el.getContext = () => fakeContext();
      }
      return el;
    });
    const asked = [];
    const layer = darkness({ lights: ({ game }) => (game.lit ? [{ x: 100, y: 200, r: 300, flicker: 0.3 }] : []) });
    expect(layer.front).toBe(true);
    const drawn = [];
    const ctx = { drawImage: (...a) => drawn.push(a) };
    for (const lit of [false, true, true]) {
      asked.push(lit);
      layer.draw(ctx, { game: { lit }, world: null, camX: 0, viewW: 400, t: 1 });
    }
    expect(drawn).toHaveLength(3);
    expect(made).toHaveLength(1); // one mask, reused
    vi.restoreAllMocks();
  });
});
