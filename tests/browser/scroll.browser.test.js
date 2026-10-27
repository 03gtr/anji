// @vitest-environment node
/**
 * Scrolling regression guard in a REAL browser (layout + real input), because
 * happy-dom has no layout: scrollTop can only be proven to move in a browser.
 *
 * Starts the Vite dev server in-process (mode "test" → no private art) and
 * drives an installed Microsoft Edge or Google Chrome through playwright-core
 * (no browser download). If neither can be launched the suite is skipped and
 * the reason is printed in the skipped test's name.
 *
 * What it guards (the V1–V3 bug): menus whose content was taller than the
 * screen were clipped by `.game { overflow: hidden }` with no scroll container,
 * and the title page hid its top above an unscrollable edge.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const VIEWS = [
  [320, 640],
  [390, 844],
  [844, 390],
  [1365, 768],
];

let server;
let browser;
let base;
let unavailable = '';
try {
  for (const channel of ['msedge', 'chrome']) {
    try {
      browser = await chromium.launch({ channel, headless: true });
      break;
    } catch (e) {
      unavailable = `${channel}: ${String(e.message).split('\n')[0]}`;
    }
  }
} catch (e) {
  unavailable = String(e.message);
}

beforeAll(async () => {
  if (!browser) return;
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5199, strictPort: false, hmr: false } });
  await server.listen();
  base = server.resolvedUrls.local[0];
}, 60000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const contexts = [];
afterEach(async () => {
  while (contexts.length) await contexts.pop().close().catch(() => {});
});

const WORLD = 'timer=1&scene=gameroom&flags=house-entered,intro-done,t.gameroom.enter,met-snooki,map-open';

/** Open a page at a viewport with tips off; optionally fill the journal (an "existing save"). */
async function open([w, h], query = '', { fill = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 1000 });
  contexts.push(ctx);
  await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000); // a stuck step fails here, with its location
  page.setDefaultNavigationTimeout(30000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game && (document.querySelector('.title-screen') || document.querySelector('.play.is-ready')), null, { timeout: 20000 });
  if (fill) {
    // a string, so the test runner does not rewrite the browser-side import()
    await page.evaluate(`import('/src/game/data/items.js').then((m) => { for (const k of Object.keys(m.JOURNAL)) window.__game.game.addJournal(k); })`);
  }
  return { page, ctx, errors };
}

// NB: overlays/minigames return a promise that settles only when they close —
// call them in a block body so page.evaluate does not wait for it.
const metrics = (page, sel) =>
  page.$eval(sel, (el) => ({ st: Math.round(el.scrollTop), max: el.scrollHeight - el.clientHeight, sh: el.scrollHeight, ch: el.clientHeight }));

/** Wheel over the element's centre until it stops moving; returns the scrollTop trail. */
async function wheelToEnd(page, sel) {
  const r = await page.$eval(sel, (el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });
  await page.mouse.move(r.x, r.y);
  const trail = [(await metrics(page, sel)).st];
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(60);
    const st = (await metrics(page, sel)).st;
    trail.push(st);
    if (st === trail[trail.length - 2] && i > 2) break;
  }
  return trail;
}

/** Is the last matching item fully inside the scroller's box? */
const lastVisible = (page, sel, item) =>
  page.$eval(
    sel,
    (el, it) => {
      const items = el.querySelectorAll(it);
      const last = items[items.length - 1];
      const r = el.getBoundingClientRect();
      const l = last.getBoundingClientRect();
      // inside the scroller AND on screen (a box that grows past the screen is clipped by .game)
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, innerHeight);
      return { count: items.length, visible: l.top >= top - 1 && l.bottom <= bottom + 1 };
    },
    item,
  );

const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth);

const suite = browser ? describe : describe.skip;
suite(unavailable && !browser ? `real-browser scrolling (skipped: ${unavailable})` : 'real-browser scrolling', () => {
  it('title page (fresh session): overflowing content scrolls by wheel and keys; nothing is hidden above the top', async () => {
    let overflowed = 0;
    for (const view of VIEWS) {
      const { page, errors } = await open(view);
      const sel = '.title-screen';
      const m = await metrics(page, sel);
      // at scrollTop 0 the first in-flow content starts inside the box (not cut off above it)
      const cut = await page.$eval(sel, (el) => el.getBoundingClientRect().top - el.querySelector('.title-hero').getBoundingClientRect().top);
      expect(cut, `${view} top hidden`).toBeLessThanOrEqual(0);
      if (m.max > 0) {
        overflowed++;
        const trail = await wheelToEnd(page, sel);
        expect(trail[1], `${view} first wheel moves`).toBeGreaterThan(0);
        expect(trail[trail.length - 1], `${view} wheel`).toBe(m.max);
        // keyboard: focus is on the first action; Home / End move the page
        await page.keyboard.press('Home');
        await page.waitForTimeout(400);
        expect((await metrics(page, sel)).st, `${view} Home`).toBe(0);
        await page.keyboard.press('End');
        await page.waitForTimeout(400);
        expect((await metrics(page, sel)).st, `${view} End`).toBe(m.max);
      }
      // whether it overflows or not, the actions can be reached
      expect((await lastVisible(page, sel, '.title-actions .btn')).visible, `${view} actions`).toBe(true);
      expect(await noSideScroll(page)).toBe(true);
      expect(errors).toEqual([]);
    }
    expect(overflowed, 'at least the short landscape title must overflow (else this test proves nothing)').toBeGreaterThan(0);
  }, 120000);

  it('long journal (existing save) scrolls to its final entry by wheel, End/Home, PageDown and ArrowDown, at every viewport', async () => {
    for (const view of VIEWS) {
      const { page, ctx, errors } = await open(view, WORLD, { fill: true });
      await page.evaluate(() => { window.__game.ui.openJournal(); });
      const sel = '.panel.journal .panel-scroll';
      await page.waitForSelector(sel);
      const m = await metrics(page, sel);
      expect(m.max, `${view} journal overflows`).toBeGreaterThan(200);
      const trail = await wheelToEnd(page, sel);
      expect(trail[1], `${view} first wheel moves`).toBeGreaterThan(0);
      expect(trail[trail.length - 1], `${view} wheel reaches end`).toBe(m.max);
      expect((await lastVisible(page, sel, ':scope > *')).visible, `${view} last entry`).toBe(true);
      // keyboard on the focused list region
      await page.focus(sel);
      for (const [key, check] of [
        ['Home', (st) => st === 0],
        ['PageDown', (st) => st > 0],
        ['End', (st) => st === m.max],
        ['Home', (st) => st === 0],
        ['ArrowDown', (st) => st > 0],
      ]) {
        await page.keyboard.press(key);
        await page.waitForTimeout(450);
        const st = (await metrics(page, sel)).st;
        expect(check(st), `${view} ${key} → ${st}`).toBe(true);
      }
      // the world behind did not scroll
      expect(await page.$eval('.game', (g) => g.scrollTop)).toBe(0);
      expect(await noSideScroll(page)).toBe(true);
      expect(errors).toEqual([]);
      await ctx.close();
    }
  }, 180000);

  it('games-room menus, settings, help and pause scroll inside the panel (a long modal scrolls internally)', async () => {
    const menus = [
      ['games table', "import('/src/game/ui/hub.js').then((m) => m.openGamesTable(window.__game))", '.hub-body', '.hub-game, .hub-act, button'],
      ['prank board', "import('/src/game/ui/hub.js').then((m) => m.openBoard(window.__game, 'pranks'))", '.hub-body', '.hub-act'],
      ['settings', 'window.__game.ui.openSettings()', '.panel.settings .panel-scroll', ':scope > *'],
      ['help', 'window.__game.ui.openHelp()', '.panel.help .panel-scroll', ':scope > *'],
      ['pause', "import('/src/game/ui/menus.js').then((m) => m.openPause(window.__game))", '.panel.pause', '.btn'],
    ];
    for (const view of [
      [320, 640],
      [844, 390],
    ]) {
      const { page, ctx, errors } = await open(view, WORLD);
      for (const [name, opener, sel, item] of menus) {
        await page.evaluate(`void (${opener})`);
        await page.waitForSelector(sel);
        await page.waitForTimeout(300);
        // the panel itself fits on screen (it never grows past the viewport)
        const fits = await page.$eval(sel, (el) => {
          const p = el.closest('.panel').getBoundingClientRect();
          return p.top >= -1 && p.bottom <= innerHeight + 1;
        });
        expect(fits, `${view} ${name} panel fits`).toBe(true);
        const m = await metrics(page, sel);
        if (m.max > 0) {
          const trail = await wheelToEnd(page, sel);
          expect(trail[trail.length - 1], `${view} ${name}`).toBe(m.max);
        }
        // overflowing or not, every item can be brought into view
        expect((await lastVisible(page, sel, item)).visible, `${view} ${name} last item`).toBe(true);
        expect(await page.$eval('.game', (g) => g.scrollTop), `${view} ${name} world still`).toBe(0);
        await page.evaluate(() => window.__game.overlays.closeAll());
      }
      expect(await noSideScroll(page)).toBe(true);
      expect(errors).toEqual([]);
      await ctx.close();
    }
  }, 120000);

  it('a finger drag (touch) scrolls the journal list on a phone', async () => {
    const { page, ctx } = await open([390, 844], WORLD, { fill: true });
    await page.evaluate(() => {
      window.__game.ui.openJournal();
    });
    const sel = '.panel.journal .panel-scroll';
    await page.waitForSelector(sel);
    await page.waitForTimeout(300);
    const b = await (await page.$(sel)).boundingBox();
    const x = Math.round(b.x + b.width / 2);
    const y = Math.round(b.y + b.height * 0.8);
    // raw touch events through the DevTools protocol (Chromium); a real finger moving up
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 20 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(500);
    expect((await metrics(page, sel)).st).toBeGreaterThan(100);
    expect(await page.$eval('.game', (g) => g.scrollTop)).toBe(0);
  }, 60000);

  it('a normal wheel / scroll key is not cancelled by any global handler (title and menus)', async () => {
    const { page, ctx } = await open([390, 844], WORLD);
    await page.evaluate(() => {
      window.__cancelled = [];
      for (const t of ['wheel', 'keydown']) window.addEventListener(t, (e) => e.defaultPrevented && window.__cancelled.push(e.type + ':' + (e.code || '')), { passive: true });
      window.__game.ui.openHelp();
    });
    await page.waitForSelector('.panel.help .panel-scroll');
    await page.focus('.panel.help .panel-scroll');
    await page.mouse.move(195, 420);
    await page.mouse.wheel(0, 300);
    for (const k of ['ArrowDown', 'ArrowUp', 'PageDown', 'Space', 'End', 'Home']) await page.keyboard.press(k);
    expect(await page.evaluate(() => window.__cancelled)).toEqual([]);
    await ctx.close();
  }, 60000);

  it('closing a menu gives the world its controls back (keys move Anji; touch pad works)', async () => {
    const { page, ctx, errors } = await open([844, 390], WORLD);
    const x0 = await page.evaluate(() => window.__game.screen.world.player.x);
    await page.evaluate(() => { window.__game.ui.openHelp(); });
    await page.waitForSelector('.panel.help');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__game.overlays.count);
    // focus restored somewhere outside the closed panel
    expect(await page.evaluate(() => !document.activeElement?.closest('.overlay'))).toBe(true);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(700);
    await page.keyboard.up('ArrowRight');
    const x1 = await page.evaluate(() => window.__game.screen.world.player.x);
    expect(x1).toBeGreaterThan(x0 + 20);
    // the on-screen pad (pointer) still drives the world
    const pad = await page.$('.pad-btn[data-input="left"]');
    const b = await pad.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
    const x2 = await page.evaluate(() => window.__game.screen.world.player.x);
    expect(x2).toBeLessThan(x1 - 20);
    expect(errors).toEqual([]);
    await ctx.close();
  }, 60000);

  it('racing still captures steering (keys cancelled, buttons pressed) and checkers taps still move pieces', async () => {
    const { page, ctx, errors } = await open([844, 390], WORLD);
    await page.evaluate(() => { window.__game.ui.minigame('race-moon'); });
    await page.click('.mg-layer [data-act="start"]');
    await page.waitForSelector('[data-steer]');
    const cancelled = await page.evaluate(() => {
      const e = new KeyboardEvent('keydown', { code: 'ArrowLeft', key: 'ArrowLeft', bubbles: true, cancelable: true });
      document.dispatchEvent(e);
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft', key: 'ArrowLeft', bubbles: true }));
      return e.defaultPrevented;
    });
    expect(cancelled).toBe(true);
    const steer = await (await page.$('[data-steer="1"]')).boundingBox();
    await page.mouse.move(steer.x + steer.width / 2, steer.y + steer.height / 2);
    await page.mouse.down();
    expect(await page.$eval('[data-steer="1"]', (b) => b.classList.contains('is-down'))).toBe(true);
    await page.mouse.up();
    await page.evaluate(() => window.__game.overlays.closeAll());

    await page.evaluate(() => { window.__game.ui.minigame('checkers'); });
    await page.click('.mg-layer [data-act="start"]');
    await page.click('.tt-ready [data-go]');
    await page.click('.ck-cell.is-movable');
    await page.click('.ck-cell.is-target');
    // the move was applied: the board highlights the last move's path
    await page.waitForSelector('.ck-cell.is-last', { timeout: 8000 });
    expect(await noSideScroll(page)).toBe(true);
    expect(errors).toEqual([]);
    await ctx.close();
  }, 60000);

  it('no horizontal page scroll in portrait and landscape (title, world, a menu)', async () => {
    for (const view of VIEWS) {
      const { page, ctx } = await open(view, WORLD);
      expect(await noSideScroll(page), `${view} world`).toBe(true);
      await page.evaluate(() => { window.__game.ui.openSettings(); });
      await page.waitForSelector('.panel.settings');
      expect(await noSideScroll(page), `${view} settings`).toBe(true);
      expect(await page.$eval('.panel.settings .panel-scroll', (el) => el.scrollWidth <= el.clientWidth + 1), `${view} settings list`).toBe(true);
      await ctx.close();
      const t = await open(view);
      expect(await noSideScroll(t.page), `${view} title`).toBe(true);
      await t.ctx.close();
    }
  }, 120000);
});
