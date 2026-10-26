/**
 * V3 app-level flows (same harness as app.test.js): the games room, one
 * complete round of every new table game through the real UI (seeded, so
 * the answers are known), an activity from the board, Snooki's reactions.
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


import { makeTrick, roundSolution } from '../../src/game/tabletop/cardtrick.js';
import { deal } from '../../src/game/minigames/cards-logic.js';
import { MEMORY_THEMES } from '../../src/game/minigames/memory.js';
import { createDuet } from '../../src/game/tabletop/duet.js';

async function startGame(id, options) {
  const done = app.ui.minigame(id, options);
  await until(() => $('.mg-layer [data-act="start"]'));
  $('.mg-layer [data-act="start"]').click();
  return { done }; // wrapped: returning the promise itself would wait for the game to close
}
async function go() {
  const btn = await until(() => $('.tt-ready [data-go]'));
  btn.click();
}

describe('V3: the games room', () => {
  it("first visit: Ryan's playing version invites her", async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    for (const f of ['intro-done', 'house-entered']) app.game.setFlag(f);
    await app.go('gameroom', { spawnX: 220 });
    await until(() => $('.overlay-dialogue'), 4000);
    expect($('.overlay-dialogue').textContent).toMatch(/نسخة اللعب/);
    await drainDialogue(80);
    await until(() => app.game.flag('gameroom-entered'));
    expect(app.game.inJournal('gameroom')).toBe(true);
  });

  it('High Card: ten rounds to a result, recorded', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    const { done } = await startGame('highcard', { seed: 5 });
    await go();
    for (let i = 0; i < 10; i++) {
      (await until(() => $('.hc-go'))).click();
      await wait(5);
    }
    const result = await until(() => $('.mg-result'), 3000);
    expect(result.textContent).toMatch(/أنجي .* ريان/);
    expect(app.game.record('game:highcard').plays).toBe(1);
    ($('.mg-result [data-act="done"]') || $('.mg-result [data-act="exit"]')).click();
    await done;
  });

  it('سباق الورد: a full hand by tapping legal cards; Ryan plays only legal cards', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    await startGame('rosetrick', { seed: 7, difficulty: 'easy' });
    await go();
    for (let i = 0; i < 40 && !$('.mg-result'); i++) {
      const legal = $('.rt-hand .pcard.is-legal');
      if (legal) legal.click();
      await wait(120);
    }
    const result = await until(() => $('.mg-result'), 6000);
    expect(result.textContent).toMatch(/الأكلات/);
    expect(app.game.record('game:rosetrick').plays).toBe(1);
  });

  it('checkers: a move, Ryan answers, undo takes it back', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    await startGame('checkers', { seed: 2, difficulty: 'easy' });
    await go();
    (await until(() => $('.ck-cell.is-movable'))).click();
    (await until(() => $('.ck-cell.is-target'))).click();
    await until(() => $('.ck-msg').textContent.includes('دورچ') || $('.ck-msg').textContent.includes('ريان أكل'), 3000);
    expect($('[data-undo]').disabled).toBe(false);
    $('[data-undo]').click();
    expect(root.querySelectorAll('.ck-piece.side-a').length).toBe(12);
    expect($('.ck-msg').textContent).toMatch(/رجعنا/);
  });

  it("Snooki's card trick: three rounds solved → result", async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    const rounds = makeTrick(11);
    await startGame('cardtrick', { seed: 11 });
    (await until(() => $(`[data-pos="${roundSolution(rounds[0])}"]`))).click();
    const labels = roundSolution(rounds[1]);
    await until(() => $('[data-box]'));
    root.querySelectorAll('[data-box]').forEach((sel, i) => {
      sel.value = labels[i];
      sel.dispatchEvent(new Event('change'));
    });
    $('[data-check]').click();
    (await until(() => $(`.ctk-options [data-opt="${roundSolution(rounds[2])}"]`))).click();
    const result = await until(() => $('.mg-result'));
    expect(result.textContent).toMatch(/كشفتي/);
    expect(app.game.record('game:cardtrick').medal).toBe('gold');
  });

  it('memory match: every pair found → result with moves', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    const seed = 21;
    const deck = deal(MEMORY_THEMES.garden.icons.slice(0, 6), seed).deck;
    await startGame('memory', { seed });
    (await until(() => $('.tt-ready [data-diff="easy"]'))).click();
    await go();
    await until(() => $('.card-tile'));
    const seen = new Set();
    for (let i = 0; i < deck.length; i++) {
      if (seen.has(i)) continue;
      const j = deck.findIndex((c, k) => k !== i && c.symbol === deck[i].symbol);
      seen.add(i);
      seen.add(j);
      $(`.card-tile[data-i="${i}"]`).click();
      $(`.card-tile[data-i="${j}"]`).click();
    }
    const result = await until(() => $('.mg-result'), 3000);
    expect(result.textContent).toMatch(/محاولات/);
    expect(app.game.record('game:memory')).toMatchObject({ completed: true, medal: 'gold' });
  });

  it('garden duet (no time pressure) and the gift workshop complete', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    const seq = createDuet(4, { length: 2 }).seq;
    await startGame('duet', { seed: 4, length: 2 });
    for (let round = 1; round <= 2; round++) {
      await until(() => /دورچ/.test($('.du-msg')?.textContent || ''), 4000);
      for (const p of seq.slice(0, round)) $(`.du-pad[data-pad="${p}"]`).click();
      if (round < 2) await until(() => !/دورچ/.test($('.du-msg')?.textContent || ''), 4000);
    }
    await until(() => $('.mg-result'), 3000);
    $('.mg-result [data-act="done"]').click();
    expect(app.game.flag('duet-done')).toBe(true);
    await startGame('gift', {});
    (await until(() => $('[data-make]'))).click();
    await until(() => $('.mg-result'));
    expect(app.game.state.hub.gifts).toHaveLength(1);
  });

  it('an activity from the board plays through the world (chocolate box)', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    for (const f of ['intro-done', 'house-entered', 'gameroom-entered', 't.gameroom.enter']) app.game.setFlag(f);
    await app.go('gameroom', { spawnX: 1150 });
    const world = await until(() => app.screen?.world);
    await until(() => world.interactTarget?.id === 'activities');
    world.interact();
    (await until(() => $('[data-act="chocolates"]'))).click();
    await until(() => $('.overlay-dialogue'));
    await drainDialogue();
    await until(() => $('.ar-slot'));
    const def = { blue: ['b1', 'b2', 'b3', 'b4'], white: ['w1', 'w2', 'w3', 'w4'] };
    for (let i = 0; i < 9; i++) {
      const piece = i === 4 ? 'g1' : [0, 2, 6, 8].includes(i) ? def.blue.shift() : def.white.shift();
      $(`.ar-piece[data-piece="${piece}"]`).click();
      $(`.ar-slot[data-slot="c${i}"]`).click();
    }
    $('[data-check]').click();
    expect(app.game.flag('chocolates-done')).toBe(true);
    expect(app.game.isUnlocked('cardback-gold')).toBe(true);
  });

  it('tapping Snooki makes him react (and he never blocks play)', async () => {
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    app.settings.set({ tips: false });
    app.game.setFlag('intro-done');
    app.game.setFlag('met-snooki');
    await app.go('garden');
    const world = await until(() => app.screen?.world);
    await until(() => world.mode === 'play');
    expect(world.snookiReact()).toBe(true);
    expect(world.actor('snooki').bubble?.text).toBeTruthy();
    expect(world.snookiReact()).toBe(false); // short cooldown, no spam
    expect(world.mode).toBe('play');
  });
});
