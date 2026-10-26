/**
 * V2 app-level flows (same harness as app.test.js): the study clue chain,
 * the puzzle help ladder (hints, solution, skip), the missions journal,
 * the help screen, the drawing reveal and the race host lifecycle.
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


async function finishDialogues() {
  for (let i = 0; i < 6; i++) {
    await wait(20);
    await drainDialogue();
  }
}

describe('V2 flows', () => {
  it('study chain: laptop code → lamp off → symbols → drawer → mission reward → hidden passage', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    for (const f of ['intro-done', 'house-entered', 'study-done', 'clock-seen']) app.game.setFlag(f);
    app.settings.set({ tips: false });
    await app.go('study', { spawnX: 632 });
    const world = await until(() => app.screen?.world);
    await until(() => world.interactTarget?.id === 'laptop');
    world.interact();
    await until(() => $('.overlay-dialogue'));
    await drainDialogue();
    await until(() => $('.code-slot'));
    const want = ['14:30', 'anji', 'blue'];
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 5 && $(`.code-slot[data-i="${i}"]`).textContent !== want[i]; k++) $(`.code-slot[data-i="${i}"]`).click();
    }
    $('[data-run]').click();
    expect(app.game.flag('build-fixed')).toBe(true);
    $('.panel-foot .btn-primary').click();
    await finishDialogues();

    world.player.x = 776;
    await until(() => world.interactTarget?.id === 'lamp');
    world.interact();
    // the camera pans to the wall first, then Snooki reads the symbols
    await until(() => {
      drainDialogue();
      return app.game.flag('symbols-seen');
    }, 4000);
    await finishDialogues();
    expect(app.game.flag('study-dark')).toBe(true);

    world.player.x = 732;
    await until(() => world.interactTarget?.id === 'drawer');
    world.interact();
    await until(() => $('.lock-dials'));
    for (let i = 0; i < 4; i++) for (let k = 0; k < i + 1; k++) $(`.dial-btn[data-i="${i}"][data-d="1"]`).click();
    $('.lock-submit').click();
    expect(app.game.flag('drawer-open')).toBe(true);
    $('.panel-foot .btn-primary').click();
    await finishDialogues();
    expect(app.game.flag('mission:unfinished-build')).toBe(true);
    expect(app.game.hasItem('shelf-key')).toBe(true);

    world.player.x = 1010;
    await until(() => world.interactTarget?.id === 'shelf');
    world.interact();
    await finishDialogues();
    await until(() => app.sceneId === 'passage');
    expect(app.game.flag('passage-open')).toBe(true);
  });

  it('puzzle help ladder: hints, then the solution highlight, then a story-safe skip', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    const done = app.ui.puzzle('library-candles');
    await until(() => $('.candle'));
    expect($('.puzzle-goal').textContent).toMatch(/شعّلي كل الشموع/);
    expect($('.candle-example')).toBeTruthy();
    expect($('[data-act="skip"]').hidden).toBe(true);
    for (let i = 0; i < 3; i++) $('[data-act="hint"]').click();
    expect(root.querySelectorAll('.puzzle-hints li').length).toBe(3);
    expect($('[data-act="solution"]').hidden).toBe(false);
    $('[data-act="solution"]').click();
    expect(root.querySelectorAll('.candle.is-solution').length).toBeGreaterThan(0);
    expect($('[data-act="skip"]').hidden).toBe(false);
    $('[data-act="skip"]').click();
    await until(() => $('[data-yes]'));
    $('[data-yes]').click();
    await until(() => $('.panel.is-solved'));
    expect(app.game.flag('candles-lit')).toBe(true); // the story continues
    expect(app.game.flag('skipped:library-candles')).toBe(true);
    $('.panel-foot .btn-primary').click();
    expect((await done).skipped).toBe(true);
  });

  it('the journal lists active missions with the next step and a hidden hint', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    app.game.setFlag('kitchen-done');
    app.ui.openJournal('missions');
    const card = await until(() => $('[data-mission="missing-recipe"]'));
    expect(card.textContent).toMatch(/لوح الوصفات/);
    const hint = card.querySelector('.mission-hint');
    expect(hint.hidden).toBe(true);
    card.querySelector('[data-mhint]').click();
    expect(hint.hidden).toBe(false);
  });

  it('the pause menu opens a permanent help screen', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.game.setFlag('intro-done');
    app.settings.set({ tips: false });
    await app.go('garden');
    await until(() => app.screen?.world);
    $('.hud [data-act="pause"]').click();
    await until(() => $('[data-act="help"]'));
    $('[data-act="help"]').click();
    const help = await until(() => $('.help'));
    for (const word of ['التحكم', 'الخريطة', 'الدفتر', 'التلميحات', 'الحفظ']) expect(help.textContent).toContain(word);
  });

  it('the drawing unfolds on a tap and stays in the journal to reopen later', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    await app.toTitle();
    const done = app.ui.drawing();
    const paper = await until(() => $('[data-paper]'));
    paper.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, bubbles: true }));
    paper.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, bubbles: true }));
    expect(app.game.inJournal('drawing')).toBe(true);
    await until(() => !$('.drawing-actions').hidden);
    $('[data-keep]').click();
    expect((await done).kept).toBe(true);
    app.ui.openJournal('notes');
    expect(await until(() => $('[data-open="drawing"]'))).toBeTruthy();
  });

  it('the race host: ready card, countdown, driving, pause freezes, finish records a result', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false, raceDifficulty: 'easy' });
    await app.toTitle();
    const done = app.ui.minigame('race-moon');
    await until(() => $('.mg-layer [data-act="start"]'));
    $('.mg-layer [data-act="start"]').click();
    await until(() => $('.race-ready [data-go]'));
    expect($('[data-diff="easy"]').getAttribute('aria-checked')).toBe('true');
    $('.race-ready [data-go]').click();
    const ctl = await until(() => globalThis.__mg?.controller);
    await until(() => ctl.phase === 'racing', 6000);
    await until(() => ctl.state.z > 0);
    $('.mg-head [data-act="pause"]').click();
    const z = ctl.state.z;
    await wait(120);
    expect(ctl.phase).toBe('paused');
    expect(ctl.state.z).toBe(z);
    $('.mg-layer [data-act="resume"]').click();
    await until(() => ctl.state.z > z);
    // jump to the end of the road: the host records the result and the reward
    ctl.state.z = ctl.track.length - 10;
    ctl.state.v = 12000;
    await until(() => $('.mg-result'), 4000);
    $('.mg-result [data-act="done"]').click();
    expect((await done).completed).toBe(true);
    expect(app.game.record('game:race-moon').completed).toBe(true);
    expect(app.game.flag('race-moon')).toBe(true);
  });
});
