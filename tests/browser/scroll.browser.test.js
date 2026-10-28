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

// teardown gets the same headroom as setup: closing the browser took > 10 s
// (vitest's default hook limit) under a 6× CPU slowdown
afterAll(async () => {
  await browser?.close();
  await server?.close();
}, 60000);

const contexts = [];
afterEach(async () => {
  while (contexts.length) await contexts.pop().close().catch(() => {});
}, 60000);

const WORLD = 'timer=1&scene=gameroom&flags=house-entered,intro-done,t.gameroom.enter,met-snooki,map-open';

/** Open a page at a viewport with tips off; optionally fill the journal (an "existing save"). */
async function open([w, h], query = '', { fill = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 1000 });
  contexts.push(ctx);
  await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
  // A passive observer of wheel events (it cannot cancel anything). It lets
  // wheelToEnd() prove the wheel reached the list and was not prevented, and
  // it makes delivery deterministic: under a 6× CPU slowdown, headless
  // Chromium silently dropped a synthetic wheel in ~1 run of 8 when the page
  // had no wheel listener at all (0 drops in 26 runs with one).
  await ctx.addInitScript(() => {
    window.__wheels = [];
    addEventListener('wheel', (e) => window.__wheels.push({ target: e.target, prevented: e.defaultPrevented }), { passive: true });
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000); // a stuck step fails here, with its location
  // optional: simulate a slow CI runner (e.g. SCROLL_TEST_CPU_SLOWDOWN=4) when hunting flakes; off by default
  if (Number(process.env.SCROLL_TEST_CPU_SLOWDOWN) > 1) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.SCROLL_TEST_CPU_SLOWDOWN) });
  }
  page.setDefaultNavigationTimeout(30000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game && (document.querySelector('.title-screen') || document.querySelector('.play.is-ready')), null, { timeout: 20000 });
  // measure only after the web font has loaded: the swap changes text heights,
  // and with a small overflow (22 px on a 320×640 title) that flips results
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
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

/**
 * "Scrolled to the end": within 1 px of scrollHeight − clientHeight. Those two are
 * whole numbers but the box can be fractional, so the true end can sit just under
 * the computed one: a long journal at 390×844 has a 720.297 px tall box, its real
 * end is ≈7826.7, the wheel stops on whole pixels at 7826, an instant jump rounds
 * to 7827. Anything more than 1 px short still fails.
 */
const atEnd = (st, max) => st >= max - 1 && st <= max;

/** Wheel over the element's centre until it stops moving; returns the scrollTop trail. */
/**
 * After a wheel/key input, wait for the scroll it caused: poll scrollTop until
 * it has moved away from `from` and then held still for a few polls (smooth
 * scrolling animates — slowly on CI runners), or until `timeout` ms pass.
 * Returns the settled value, or `from` if it never moved: callers' assertions
 * (first wheel > 0, reaches the end, Home = 0…) are unchanged and still fail
 * if the page does not scroll. A fixed 60 ms read flaked on GitHub's Linux
 * Chrome (run 40472535862: "1365,768 first wheel moves: expected 0").
 * Polls every 100 ms, not faster: under a 6× CPU slowdown, reading the page
 * every 25 ms lost the first wheel ~1 run in 8; at 100 ms it never did.
 */
async function settledScroll(page, sel, from, timeout = 3000) {
  const t0 = Date.now();
  let last = from;
  let still = 0;
  while (Date.now() - t0 < timeout) {
    await page.waitForTimeout(100);
    const st = (await metrics(page, sel)).st;
    if (st !== last) {
      last = st;
      still = 0;
    } else if (st !== from && ++still >= 2) return st;
  }
  return last;
}

async function wheelToEnd(page, sel) {
  const r = await page.$eval(sel, (el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });
  await page.mouse.move(r.x, r.y);
  await page.evaluate(() => { window.__wheels = []; });
  const trail = [(await metrics(page, sel)).st];
  for (let i = 0; i < 40; i++) {
    const before = trail[trail.length - 1];
    if (i > 0 && before >= (await metrics(page, sel)).max) break; // at the end: nothing left to wheel
    await page.mouse.wheel(0, 400);
    const st = await settledScroll(page, sel, before, 2000);
    trail.push(st);
    if (i === 0) {
      // the first wheel reached this list (or something inside it) and nothing cancelled it
      const first = await page.$eval(sel, (el) => {
        const w = window.__wheels[0];
        return w ? { inside: el.contains(w.target), prevented: w.prevented } : null;
      });
      expect(first, `${sel}: the first wheel reached the page`).not.toBeNull();
      expect(first.inside, `${sel}: the first wheel landed on the list`).toBe(true);
      expect(first.prevented, `${sel}: the first wheel was not cancelled`).toBe(false);
    }
    if (st === before) break; // this wheel moved nothing (within 2 s)
  }
  return trail;
}

/** Press a key on the focused scroller and return where it settles. */
async function pressAndSettle(page, sel, key) {
  const before = (await metrics(page, sel)).st;
  await page.keyboard.press(key);
  return settledScroll(page, sel, before);
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
        expect(atEnd(trail[trail.length - 1], m.max), `${view} wheel → ${trail[trail.length - 1]} of ${m.max}`).toBe(true);
        // keyboard: focus is on the first action; Home / End move the page
        expect(await pressAndSettle(page, sel, 'Home'), `${view} Home`).toBe(0);
        const end = await pressAndSettle(page, sel, 'End');
        expect(atEnd(end, m.max), `${view} End → ${end} of ${m.max}`).toBe(true);
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
      expect(atEnd(trail[trail.length - 1], m.max), `${view} wheel reaches end → ${trail[trail.length - 1]} of ${m.max}`).toBe(true);
      expect((await lastVisible(page, sel, ':scope > *')).visible, `${view} last entry`).toBe(true);
      // keyboard on the focused list region
      await page.focus(sel);
      for (const [key, check] of [
        ['Home', (st) => st === 0],
        ['PageDown', (st) => st > 0],
        ['End', (st) => atEnd(st, m.max)],
        ['Home', (st) => st === 0],
        ['ArrowDown', (st) => st > 0],
      ]) {
        const st = await pressAndSettle(page, sel, key);
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
          expect(atEnd(trail[trail.length - 1], m.max), `${view} ${name} → ${trail[trail.length - 1]} of ${m.max}`).toBe(true);
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

  it('mobile framing: Anji is big enough on a portrait phone; landscape buttons stay on screen; the right title art per orientation', async () => {
    // portrait phone: her drawn figure ≥ 25 % of the play area (the old framing gave ~20 %)
    const p = await open([390, 844], WORLD);
    const share = await p.page.evaluate(() => {
      const w = window.__game.screen.world;
      const c = document.querySelector('.stage canvas');
      const k = c.clientWidth / w.viewW;
      return { share: (112 * 0.67 * k) / c.clientHeight, ratio: c.width / c.height - c.clientWidth / c.clientHeight };
    });
    expect(share.share).toBeGreaterThanOrEqual(0.25);
    expect(Math.abs(share.ratio)).toBeLessThan(0.01); // backing store has the same aspect: no stretching
    // landscape phone: every touch button fully inside the screen, labels hidden (they used to hang off the bottom)
    const l = await open([844, 390], WORLD);
    const pads = await l.page.$$eval('.pad-btn', (bs) => bs.map((b) => {
      const r = b.getBoundingClientRect();
      return { inside: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, h: Math.round(r.height) };
    }));
    expect(pads.length).toBe(4);
    for (const pad of pads) expect(pad.inside).toBe(true);
    expect(await l.page.$$eval('.controls .pad-label', (ls) => ls.every((x) => getComputedStyle(x).display === 'none'))).toBe(true);
    // title art: tall composition on portrait phones, wide elsewhere
    const tp = await open([390, 844]);
    expect(await tp.page.$eval('.title-art-tall', (s) => getComputedStyle(s).display)).toBe('block');
    expect(await tp.page.$eval('.title-art-wide', (s) => getComputedStyle(s).display)).toBe('none');
    const tl = await open([1365, 768]);
    expect(await tl.page.$eval('.title-art-wide', (s) => getComputedStyle(s).display)).toBe('block');
    // the cast stands bottom-left, clear of the title column on wide screens
    const overlap = await tl.page.evaluate(() => {
      const a = document.querySelector('.title-cast').getBoundingClientRect();
      const b = document.querySelector('.title-copy').getBoundingClientRect();
      return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
    });
    expect(overlap).toBe(false);
  }, 90000);

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

  // Phase 03: with every place open, no place name overlaps another place's name or icon,
  // and nothing sits outside the board — on a small phone, a phone, landscape and desktop
  it('map: no overlapping labels or icons, nothing off the board, at every viewport', async () => {
    for (const view of VIEWS) {
      const { page, ctx, errors } = await open(view, WORLD);
      const res = await page.evaluate(async () => {
        // the flags that open every place on the map (see data/worlds.js), both pages (Phase 04)
        window.__game.game.setFlags(['maze-done', 'act1-done', 'house-entered', 'garage-open', 'act3-done', 'case-open', 'act4-done', 'library-open', 'act5-done', 'act6-done', 'workshop-entered', 'kitten-tracks', 'act7-done', 'final-entered', 'game-complete', 'sp1-embrace', 'notice:sp1', 'notice:sp2']);
        window.__game.game.setFlags(['sp2-final-done', 'dg-box', 'dg-timeline', 'dg-trails', 'dg-pattern', 'dg-hypo', 'dg-wheel', 'dg-roots-maze', 'dg-hedge', 'dg-bridge', 'dg-awake']);
        window.__game.ui.openMap();
        await new Promise((r) => setTimeout(r, 400));
        const measure = () => {
          const board = document.querySelector('.map-board').getBoundingClientRect();
          const boxes = [];
          for (const n of document.querySelectorAll('.map-node')) for (const p of n.querySelectorAll('.map-name, .map-icon')) boxes.push({ w: n.dataset.world, name: p.classList.contains('map-name'), r: p.getBoundingClientRect() });
          const hits = [];
          for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];
            if (a.w === b.w || !(a.name || b.name)) continue;
            const ov = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
            const oh = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
            if (ov > 2 && oh > 2) hits.push(`${a.w}×${b.w}`);
          }
          const outside = boxes.filter((b) => b.r.left < board.left - 2 || b.r.right > board.right + 2 || b.r.top < board.top - 2 || b.r.bottom > board.bottom + 2).map((b) => b.w);
          return { open: document.querySelectorAll('.map-node.is-open').length, hits, outside };
        };
        const pages = {};
        for (const region of ['garden', 'deep']) {
          document.querySelector(`[data-region="${region}"]`).click();
          await new Promise((r) => setTimeout(r, 150));
          pages[region] = measure();
        }
        const close = document.querySelector('.map [data-close]').getBoundingClientRect();
        return { pages, closeVisible: close.top >= 0 && close.right <= innerWidth + 1 && close.width > 20 };
      });
      expect(res.pages.garden.open, `${view} places open`).toBeGreaterThan(15);
      expect(res.pages.deep.open, `${view} deep places open`).toBe(14);
      for (const [region, r] of Object.entries(res.pages)) {
        expect(r.hits, `${view} ${region} overlaps`).toEqual([]);
        expect(r.outside, `${view} ${region} off the board`).toEqual([]);
      }
      expect(res.closeVisible, `${view} close button reachable`).toBe(true);
      expect(errors).toEqual([]);
      await ctx.close();
    }
  }, 120000);
});
