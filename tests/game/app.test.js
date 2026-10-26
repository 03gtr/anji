/**
 * App-level flows in a DOM without graphics: the canvas and image decoding
 * are stubbed, everything else (screens, overlays, saves, story actions,
 * minigame host) is the real code.
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

beforeEach(() => {
  globalThis.__timerLoop = true;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
  vi.stubGlobal('OffscreenCanvas', undefined); // use the stubbed DOM canvas everywhere
  // decode images instantly with a plausible size
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

async function drainDialogue(max = 60) {
  for (let i = 0; i < max; i++) {
    const box = $('.overlay-dialogue .dlg-box');
    if (!box) return;
    const choice = $('.btn-choice');
    if (choice) choice.click();
    else {
      box.click();
      box.click();
    }
    await wait(5);
  }
}

describe('game app', () => {
  it('title → new game → opening cinematic → playable garden, and progress is saved', async () => {
    const storage = memoryStorage();
    app = createGameApp(root, { storage, reducedMotion: true });
    await app.toTitle();
    expect($('.title-screen')).toBeTruthy();
    expect($('[data-act="continue"]')).toBeNull();
    $('[data-act="new"]').click();
    await until(() => $('.overlay-cine'));
    $('.cine-skip').click();
    await until(() => $('.overlay-dialogue'));
    await drainDialogue();
    const world = await until(() => app.screen?.world);
    await until(() => world.mode === 'play');
    expect(app.sceneId).toBe('garden');
    expect(app.game.flag('intro-done')).toBe(true);
    expect(JSON.parse(storage.getItem('snooki-game:save')).flags['intro-done']).toBe(true);
    expect($('.objective span').textContent).toMatch(/الحديقة|الشجيرة/);

    // reopen: continue is offered and returns to the saved scene
    app.destroy();
    app = createGameApp(root, { storage, reducedMotion: true });
    await app.toTitle();
    expect($('[data-act="continue"]')).toBeTruthy();
    $('[data-act="continue"]').click();
    await until(() => app.screen?.world);
    expect(app.sceneId).toBe('garden');
  });

  it('story actions run through the world: an interaction plays dialogue and applies effects', async () => {
    const storage = memoryStorage();
    app = createGameApp(root, { storage, reducedMotion: true });
    app.game.setFlag('intro-done');
    app.game.setFlag('met-snooki');
    await app.go('garden', { spawnX: 820 });
    const world = await until(() => app.screen?.world);
    await until(() => world.interactTarget?.id === 'fountain');
    world.interact();
    await until(() => $('.overlay-dialogue'));
    await drainDialogue();
    expect(app.game.flag('read-engraving')).toBe(true);
    expect(app.game.inJournal('engraving')).toBe(true);
  });

  it('a puzzle overlay solves, rewards once and returns', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    await app.toTitle();
    const done = app.ui.puzzle('moon-bloom');
    await until(() => $('.seq-item'));
    for (const id of ['new', 'crescent', 'half', 'full']) $(`.seq-item[data-id="${id}"]`).click();
    $('.panel .btn-primary').click();
    expect((await done).solved).toBe(true);
    expect(app.game.hasItem('map-1')).toBe(true);
    expect(app.game.record('puzzle:moon-bloom').completed).toBe(true);
  });

  it('the minigame host loads a game, finishes it and records the result', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    await app.toTitle();
    const done = app.ui.minigame('kitchen');
    await until(() => $('.mg-layer [data-act="start"]'));
    $('.mg-layer [data-act="start"]').click();
    await until(() => $('.k-ing'));
    const solve = [['fish', 'carrot', 'egg'], ['egg', 'spinach', 'avocado', 'fish'], ['yogurt', 'berries', 'honey']];
    for (const recipe of solve) {
      for (const id of recipe) $(`.k-ing[data-id="${id}"]`).click();
      $('.k-cook').click();
    }
    await until(() => $('.mg-result'));
    expect($('.mg-medal').textContent).toMatch(/ذهبية/);
    $('.mg-result [data-act="done"]').click();
    expect((await done).completed).toBe(true);
    expect(app.game.record('game:kitchen')).toMatchObject({ completed: true, medal: 'gold' });
    expect(app.game.isUnlocked('snooki-hat-party')).toBe(true);
  });

  it('pausing and going to the title keeps progress; unknown places fall back gracefully', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.game.setFlag('intro-done');
    await app.go('conservatory');
    await until(() => app.screen?.world);
    await app.go('nowhere');
    expect(app.sceneId).toBe('conservatory');
    expect($('.toast').textContent).toMatch(/قيد البناء/);
    await app.toTitle();
    expect(app.sceneId).toBe('title');
    expect($('[data-act="continue"]')).toBeTruthy();
  });

  it('achievements are announced once when earned', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    await app.toTitle();
    app.game.setFlag('met-snooki');
    expect(app.game.flag('ach:first-steps')).toBe(true);
    expect([...root.querySelectorAll('.toast')].some((t) => /إنجاز/.test(t.textContent))).toBe(true);
  });
});
