/**
 * Scrolling regression guard (DOM level). The world's keyboard controls cancel
 * the browser default for arrows / space; they must only do that while the
 * world is actually playable — never on the title screen or under a menu,
 * where those keys scroll. Menus must expose a focusable scroll region and
 * give control back to the world when they close.
 *
 * Real scrolling (scrollTop moving under wheel / keys, reaching the last
 * item) needs a layout engine: see tests/browser/scroll.browser.test.js.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { memoryStorage } from '../helpers.js';

const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
        if (prop === 'measureText') return () => ({ width: 40 });
        if (prop === 'getImageData') return () => ({ data: [] });
        return noop;
      },
      set: () => true,
    },
  );
}

let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await wait(10);
  }
  throw new Error('timed out');
}
const $ = (sel) => root.querySelector(sel);

/** Dispatch a keydown like the browser does and report whether it was cancelled. */
function press(code, target = document.activeElement || document.body) {
  const key = { ArrowDown: 'ArrowDown', ArrowUp: 'ArrowUp', ArrowRight: 'ArrowRight', Space: ' ', PageDown: 'PageDown', End: 'End' }[code] || code;
  const e = new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  const up = new KeyboardEvent('keyup', { code, key, bubbles: true, cancelable: true });
  target.dispatchEvent(up);
  return e.defaultPrevented;
}

beforeEach(() => {
  globalThis.__timerLoop = true;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
  vi.stubGlobal('OffscreenCanvas', undefined);
  vi.stubGlobal(
    'Image',
    class {
      constructor() {
        this.width = 100;
        this.height = 200;
        this.naturalWidth = 100;
        this.naturalHeight = 200;
        this.complete = true;
      }
      set src(v) {
        this._src = v;
        setTimeout(() => this.onload?.(), 0);
      }
      get src() {
        return this._src;
      }
      decode() {
        return Promise.resolve();
      }
    },
  );
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

async function inWorld() {
  app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
  app.settings.set({ tips: false });
  for (const f of ['intro-done', 'house-entered', 'met-snooki', 't.gameroom.enter', 'gameroom-entered']) app.game.setFlag(f);
  await app.go('gameroom', { spawnX: 220 });
  await until(() => $('.play.is-ready') || $('.is-ready'), 4000);
  await until(() => !app.overlays.count, 4000);
}

describe('scroll keys are not swallowed outside play', () => {
  it('title screen: arrows, space and page keys keep their default (they scroll the page)', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    await app.toTitle();
    expect($('.title-screen')).toBeTruthy();
    for (const k of ['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'End']) expect(press(k), k).toBe(false);
    expect(app.input.enabled).toBe(false);
  });

  it('during play the world still captures its keys (the page must not scroll while walking)', async () => {
    await inWorld();
    expect(app.input.enabled).toBe(true);
    const e = new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight', bubbles: true, cancelable: true });
    document.body.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(app.input.down('right')).toBe(true);
    document.body.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight', key: 'ArrowRight', bubbles: true }));
    expect(app.input.down('right')).toBe(false);
    expect(press('ArrowDown')).toBe(true);
  });

  it('a menu over the world gets arrows/space back; closing it restores the world controls', async () => {
    await inWorld();
    const opened = app.ui.openHelp();
    await until(() => $('.panel.help'));
    expect(app.input.enabled).toBe(false);
    const region = $('.panel.help .panel-scroll');
    region.focus();
    for (const k of ['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'End']) expect(press(k, region), k).toBe(false);
    // Escape closes the menu (dismissible overlay) and the world takes its keys back
    region.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
    await opened;
    expect(app.overlays.count).toBe(0);
    expect(app.input.enabled).toBe(true);
    const e = new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight', bubbles: true, cancelable: true });
    document.body.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(app.input.down('right')).toBe(true);
  });

  it('held keys are released when a menu opens (no stuck walking)', async () => {
    await inWorld();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(app.input.down('right')).toBe(true);
    app.ui.openJournal();
    await until(() => $('.panel.journal'));
    expect(app.input.down('right')).toBe(false);
    app.overlays.closeAll();
  });

  it('leaving the world for the title switches the world keys off again', async () => {
    await inWorld();
    await app.toTitle();
    expect(app.input.enabled).toBe(false);
    expect(press('ArrowDown')).toBe(false);
  });
});

describe('menus: focus and scroll regions', () => {
  it('every list menu has one focusable scroll region; focus starts on the first control as before', async () => {
    await inWorld();
    const hub = await import('../../src/game/ui/hub.js');
    const menus = [
      ['settings', () => app.ui.openSettings()],
      ['journal', () => app.ui.openJournal()],
      ['help', () => app.ui.openHelp()],
      ['hub-games', () => hub.openGamesTable(app)],
      ['board-pranks', () => hub.openBoard(app, 'pranks')],
      ['hub-trophies', () => hub.openTrophies(app)],
    ];
    for (const [cls, open] of menus) {
      const before = document.activeElement;
      open();
      const panel = await until(() => $(`.panel.${cls}`));
      await wait(0);
      const regions = panel.querySelectorAll('.panel-scroll');
      expect(regions.length, cls).toBe(1);
      expect(regions[0].tabIndex, cls).toBe(0);
      // autofocus unchanged: the first button (the close button), not the region
      expect(document.activeElement, cls).toBe(panel.querySelector('button'));
      app.overlays.closeTop();
      await wait(0);
      expect(app.overlays.count, cls).toBe(0);
      expect(document.activeElement === before || !before?.isConnected, cls).toBe(true);
    }
  });
});
