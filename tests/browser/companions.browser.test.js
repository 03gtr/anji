// @vitest-environment node
/**
 * Companion regression guard in a REAL browser, with REAL input: taps go through the canvas's
 * own pointer handler (screen coordinates → world), at a phone and a desktop viewport, and the
 * workshop's box beat is played through end to end. Synthetic saves only (a fresh profile per
 * test); never a real player's save.
 *
 * Starts the Vite dev server in-process (mode "test" → no private art) and drives an installed
 * Microsoft Edge or Google Chrome through playwright-core. If neither can be launched the suite
 * is skipped and the reason is printed in the skipped test's name.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const VIEWS = [
  ['phone', 390, 844],
  ['desktop', 1365, 768],
];
/** A finished game (the meeting, the ending), Story Pack 01 done, the husky named «لولو». */
const FINISHED = [
  'intro-done', 'map-open', 'met-snooki', 'workshop-entered', 'wk-intro', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'sp1-gift-open', 'sp1-done',
  'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team',
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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5198, strictPort: false, hmr: false } });
  await server.listen();
  base = server.resolvedUrls.local[0];
}, 60000);
afterAll(async () => {
  await browser?.close();
  await server?.close();
}, 60000);
const contexts = [];
afterEach(async () => {
  while (contexts.length) await contexts.pop().close().catch(() => {});
}, 60000);

/** A fresh profile at a viewport, a synthetic finished save, the given scene. */
async function open([, w, h], scene, x) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 1000 });
  contexts.push(ctx);
  await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}?timer=1&scene=${scene}&flags=${FINISHED.join(',')}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(`window.__game.game.setFlag('husky-name', 'لولو')`);
  if (x != null) await goTo(page, scene, x);
  return { page, ctx, errors };
}
async function goTo(page, scene, x) {
  await page.evaluate(([scene, x]) => {
    window.__old = window.__game.screen.world;
    window.__game.go(scene, { spawnX: x });
  }, [scene, x]);
  await page.waitForFunction(() => window.__game.screen.world !== window.__old && window.__game.screen.world.mode === 'play', null, { timeout: 15000 });
  await page.waitForTimeout(1500); // the camera eases onto her after a scene change
}
/** A REAL tap through the canvas at a world point: touch on the phone, a mouse click on desktop. */
async function tapWorld(page, view, x, y) {
  const p = await page.evaluate(([x, y]) => window.__game.screen.world.toScreen(x, y), [x, y]);
  const on = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.classList.contains('world-canvas') ?? false, [p.x, p.y]);
  expect(on, `tap point ${Math.round(p.x)},${Math.round(p.y)} is on the canvas`).toBe(true);
  if (view[0] === 'phone') await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
  return p;
}
const dialogueOpen = (page) => page.evaluate(() => Boolean(document.querySelector('.overlay-dialogue')));
/** Wait until the open dialogue (revealed word by word) shows the given text. */
const dialogueShows = (page, re) => page.waitForFunction((src) => new RegExp(src).test(document.querySelector('.overlay-dialogue')?.textContent ?? ''), re.source, { timeout: 8000 }).then(() => true);
/** Tap «التالي» until the dialogue is closed and the world is back in play. */
async function finishDialogue(page) {
  for (let i = 0; i < 40; i++) {
    const done = await page.evaluate(() => !document.querySelector('.overlay-dialogue') && window.__game.screen.world.mode === 'play');
    if (done) return true;
    await page.evaluate(() => [...document.querySelectorAll('.overlay-dialogue button')].find((b) => /التالي/.test(b.textContent))?.click());
    await page.waitForTimeout(250);
  }
  return false;
}
const GROUND = 'window.__game.screen.world.actor("anji").y';

describe.skipIf(!browser)(`companions in a real browser${browser ? '' : ` (skipped: ${unavailable})`}`, () => {
  for (const view of VIEWS) {
    it(`${view[0]}: a real tap on her husky (nothing under her) gets the husky's own reaction`, async () => {
      const { page, errors } = await open(view, 'final', 1100);
      // Anji stops; her husky scouts ahead (curious), onto open ground
      await page.evaluate(() => (window.__game.screen.world.actor('anji').facing = 1));
      await page.waitForFunction(() => { const w = window.__game.screen.world; return w.actor('husky').x - w.actor('anji').x > 80; }, null, { timeout: 10000 });
      const h = await page.evaluate(() => { const a = window.__game.screen.world.actor('husky'); return { x: a.x, y: a.y }; });
      await tapWorld(page, view, h.x, h.y - 25);
      await page.waitForFunction(() => Boolean(window.__game.screen.world.actor('husky').bubble), null, { timeout: 3000 });
      const bubble = await page.evaluate(() => window.__game.screen.world.actor('husky').bubble.text);
      const list = await page.evaluate(`import('/src/game/world/engine.js').then((m) => m.HUSKY_TAPS.map((r) => r.text))`);
      expect(list).toContain(bubble);
      expect(await dialogueOpen(page)).toBe(false);
      expect(errors).toEqual([]);
    }, 90000);

    it(`${view[0]}: a real tap on Anji's notebook reaches it while her husky stands right over it`, async () => {
      // she stands beside the notebook (x 1760), so it is on screen even in a phone's narrow view
      const { page, errors } = await open(view, 'final', 1720);
      // setup: her husky stands right over the notebook (where her scouting takes her when Anji
      // stops a little further off; pinned here so the overlap is exact at every viewport)
      await page.evaluate(() => {
        const h = window.__game.screen.world.actor('husky');
        h.companion = false;
        h.moveTo = null;
        h.vx = 0;
        h.x = 1760;
      });
      const gy = await page.evaluate(GROUND);
      await tapWorld(page, view, 1760, gy - 30); // the same point covers the husky and the notebook
      await page.waitForFunction(() => Boolean(document.querySelector('.overlay-dialogue')), null, { timeout: 6000 });
      expect(await dialogueShows(page, /دفتر خططي/)).toBe(true);
      expect(await page.evaluate(() => window.__game.screen.world.actor('husky').bubble)).toBeFalsy();
      expect(errors).toEqual([]);
    }, 90000);

    it(`${view[0]}: the workshop box — Snooki comes for his beat, leaves by the stairs; recorded once; no replay after a reload`, async () => {
      const { page, errors } = await open(view, 'workshop', 700);
      expect(await page.evaluate(() => window.__game.screen.world.actor('snooki').visible)).toBe(false); // with Ryan
      const gy = await page.evaluate(GROUND);
      await tapWorld(page, view, 760, gy - 40); // the box (a real tap)
      await page.waitForFunction(() => Boolean(document.querySelector('.overlay-dialogue')), null, { timeout: 6000 });
      const during = await page.evaluate(() => { const s = window.__game.screen.world.actor('snooki'); return { visible: s.visible, x: s.x }; });
      expect(during.visible).toBe(true);
      expect(Math.abs(during.x - 690)).toBeLessThan(5);
      expect(await finishDialogue(page)).toBe(true); // no stuck cutscene
      await page.waitForFunction(() => !window.__game.screen.world.actor('snooki').visible, null, { timeout: 8000 });
      const after = await page.evaluate(() => ({
        x: window.__game.screen.world.actor('snooki').x,
        box: window.__game.game.flag('dg-box'),
        journal: window.__game.game.state.journal.filter((j) => j === 'dg-box').length,
        mode: window.__game.screen.world.mode,
      }));
      expect(after).toMatchObject({ box: true, journal: 1, mode: 'play' });
      expect(after.x).toBeLessThan(40); // gone by the stairs (left), not by the deep garden's back door
      // an existing workshop interaction still works: the guest book (now readable), recorded once
      await goTo(page, 'workshop', 1050);
      await tapWorld(page, view, 1110, gy - 40);
      await page.waitForFunction(() => Boolean(document.querySelector('.overlay-dialogue')), null, { timeout: 8000 });
      expect(await finishDialogue(page)).toBe(true);
      expect(await page.evaluate(() => window.__game.game.state.journal.filter((j) => j === 'dg-guestbook').length)).toBe(1);
      // reload (the save is kept), back to the box: the one-time beat does not replay
      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 20000 });
      await goTo(page, 'workshop', 700);
      await tapWorld(page, view, 760, gy - 40);
      await page.waitForFunction(() => Boolean(document.querySelector('.overlay-dialogue')), null, { timeout: 6000 });
      expect(await dialogueShows(page, /العلبة فاضية، والغطا مسدود زين/)).toBe(true); // «again», not the first beat
      expect(await page.evaluate(() => window.__game.screen.world.actor('snooki').visible)).toBe(false);
      expect(await finishDialogue(page)).toBe(true);
      expect(await page.evaluate(() => window.__game.game.state.journal.filter((j) => j === 'dg-box').length)).toBe(1);
      expect(errors).toEqual([]);
    }, 90000);
  }
});
