/**
 * Moving and jumping together (reported on a real phone: tapping «قفزة» while Anji walked stopped
 * her — the jump went straight up and the walk was gone).
 *
 * REGRESSION: a tap-to-walk (tap the ground: she walks there) was cancelled by ANY input, a jump
 * included. Now only a direction takes over; a jump is made on the way and she keeps walking.
 * Held pad buttons never turn into a page gesture, and still release on cancel / lost capture /
 * focus loss (no stuck walking). Jump rules are unchanged: on the ground (or a moment after
 * leaving it), full height, never in mid-air.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { createInput } from '../../src/game/core/input.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { MOVE } from '../../src/game/world/physics.js';
import { memoryStorage } from '../helpers.js';

describe('held pad buttons', () => {
  const button = () => {
    const el = document.createElement('button');
    el.setPointerCapture = () => {};
    document.body.append(el);
    return el;
  };
  const pe = (type, id) => Object.assign(new Event(type, { bubbles: true, cancelable: true }), { pointerId: id });

  it('two fingers: «يمين» held while «قفزة» is pressed and lifted — the walk stays held, the jump fires once', () => {
    const input = createInput({ target: window });
    const right = button();
    const jump = button();
    input.bindButton(right, 'right');
    input.bindButton(jump, 'jump');
    right.dispatchEvent(pe('pointerdown', 1));
    jump.dispatchEvent(pe('pointerdown', 2));
    expect(input.down('right')).toBe(true);
    expect(input.take('jump')).toBe(true);
    expect(input.take('jump')).toBe(false); // once per press
    jump.dispatchEvent(pe('pointerup', 2));
    expect(input.down('right')).toBe(true);
    right.dispatchEvent(pe('pointerup', 1));
    expect(input.down('right')).toBe(false);
  });

  it('no stuck walking: pointer cancel, lost capture and focus loss all release', () => {
    const input = createInput({ target: window });
    const right = button();
    input.bindButton(right, 'right');
    for (const end of ['pointercancel', 'lostpointercapture']) {
      right.dispatchEvent(pe('pointerdown', 7));
      expect(input.down('right')).toBe(true);
      right.dispatchEvent(pe(end, 7));
      expect(input.down('right'), end).toBe(false);
    }
    right.dispatchEvent(pe('pointerdown', 8));
    window.dispatchEvent(new Event('blur'));
    expect(input.down('right')).toBe(false);
  });

  it('a touch on a held button is not handed to the page as a gesture', () => {
    const input = createInput({ target: window });
    const jump = button();
    input.bindButton(jump, 'jump');
    const t = new Event('touchstart', { bubbles: true, cancelable: true });
    jump.dispatchEvent(t);
    expect(t.defaultPrevented).toBe(true);
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

describe('in the engine: moving and jumping together', () => {
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

  async function enter() {
    const g = createGame({ saveManager: null, initial: { ...defaultState() } });
    g.setFlags(['intro-done', 'map-open', 'met-snooki']);
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'garden', x: 300 } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
    app.go('garden', { spawnX: 300 });
    const w = await until(() => app.screen?.world?.actor?.('anji') && app.screen.world);
    for (let i = 0; i < 30; i++) w.tick(1 / 60);
    expect(w.mode).toBe('play');
    return w;
  }
  const frames = (w, n) => {
    for (let i = 0; i < n; i++) w.tick(1 / 60);
  };

  it('REGRESSION: walking to a tapped spot, «قفزة» jumps on the way and she still gets there', async () => {
    const w = await enter();
    const p = w.player;
    const goal = p.x + 200;
    expect(w.tapAt(goal, p.y - 10)).toBe('ground');
    frames(w, 20);
    expect(p.vx).toBeGreaterThan(MOVE.speed * 0.9);
    key('keydown', 'Space');
    frames(w, 1);
    key('keyup', 'Space');
    expect(p.onGround).toBe(false); // the jump happens at once
    frames(w, 15);
    expect(p.vx).toBeGreaterThan(MOVE.speed * 0.6); // and she keeps walking through it
    frames(w, 180);
    expect(Math.abs(p.x - goal)).toBeLessThan(8); // all the way to the tapped spot
  });

  it('holding a direction through a jump: full speed in the air, no stop first', async () => {
    const w = await enter();
    const p = w.player;
    key('keydown', 'ArrowRight');
    frames(w, 20);
    expect(p.vx).toBe(MOVE.speed);
    key('keydown', 'Space');
    frames(w, 1);
    key('keyup', 'Space');
    expect(p.onGround).toBe(false);
    let slowest = Infinity;
    for (let i = 0; i < 40 && !p.onGround; i++) {
      frames(w, 1);
      slowest = Math.min(slowest, p.vx);
    }
    expect(slowest).toBe(MOVE.speed);
    key('keyup', 'ArrowRight');
    frames(w, 30);
    expect(p.vx).toBe(0); // and stops when let go
  });

  it('standing still: a jump; in mid-air: a second press does nothing (no double jump)', async () => {
    const w = await enter();
    const p = w.player;
    key('keydown', 'Space');
    frames(w, 1);
    key('keyup', 'Space');
    expect(p.onGround).toBe(false);
    frames(w, 12); // well into the jump (past the moment after leaving the ground)
    const vy = p.vy;
    key('keydown', 'Space');
    frames(w, 1);
    key('keyup', 'Space');
    expect(p.vy).toBeGreaterThan(vy); // still falling the same arc: no new upward push
    frames(w, 120);
    expect(p.onGround).toBe(true);
  });
});
