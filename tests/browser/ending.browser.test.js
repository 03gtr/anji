// @vitest-environment node
/**
 * The ending under the blue rose tree in a REAL browser, with REAL input, at a phone and a desktop
 * viewport: she walks into the meeting with the keyboard, the app is closed at the folded paper
 * (a reload), she walks back and the meeting resumes; then the paper, the planting puzzle, the
 * chapter card, the credits, the ending, the open ending — every control pressed like a player.
 * Afterwards nothing is recorded twice, and a reload replays nothing. Synthetic saves only (a
 * fresh profile per test); never a real player's save.
 *
 * REGRESSION: the meeting's flag was saved before its actions ran, so an ending closed half-way
 * could never be finished.
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
/** Just before the ending: the workshop's machine done, in the rose garden, never under the tree. */
const BEFORE = [
  'intro-done', 'map-open', 'met-snooki', 'workshop-entered', 'wk-intro', 'act7-done', 'final-entered', 't.final.enter',
  'sp2-done', 'sp2-final-done', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team',
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
}, 60000);
const contexts = [];
afterEach(async () => {
  while (contexts.length) await contexts.pop().close().catch(() => {});
}, 60000);

const ready = (page) => page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 20000 });
/** Into the rose garden at `x` (a scene change, as the map would do it). */
async function goTo(page, x) {
  await page.evaluate((x) => {
    window.__old = window.__game.screen.world;
    window.__game.go('final', { spawnX: x });
  }, x);
  await page.waitForFunction(() => window.__game.screen.world !== window.__old && window.__game.screen.world.mode === 'play', null, { timeout: 15000 });
  await page.waitForTimeout(1500); // the camera eases onto her after a scene change
}
/** She walks right with the keyboard until she reaches x 1240 (under the rose tree) or a scene starts. */
async function walkIn(page) {
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => { const w = window.__game.screen.world; return w.mode !== 'play' || w.player.x > 1240; }, null, { timeout: 15000 }).finally(() => page.keyboard.up('ArrowRight'));
  await page.waitForTimeout(1500);
}
/** A REAL press: a touch tap on the phone, a mouse click on desktop. */
const press = (page, view, p) => (view[0] === 'phone' ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y));
/** What a player would press next (centre of it), or a marker for the paper / nothing to press yet. */
const nextTarget = (page) =>
  page.evaluate(() => {
    const at = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const shown = (el) => el && el.offsetParent !== null;
    const d = document.querySelector('.drawing');
    if (d) {
      const acts = d.querySelector('.drawing-actions');
      return acts.hidden ? { paper: true, ...at(d.querySelector('[data-paper]')) } : { later: true, ...at(d.querySelector('[data-later]')) };
    }
    const seq = [...document.querySelectorAll('.puzzle .seq-item:not(.is-lit)')];
    if (seq.length) {
      const n = (b) => Number(b.textContent.trim().replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).match(/\d+/)?.[0] ?? 99);
      return at(seq.sort((a, b) => n(a) - n(b))[0]);
    }
    const choice = [...document.querySelectorAll('.overlay-dialogue .btn-choice')].find(shown);
    if (choice) return at(choice);
    const nextBtn = document.querySelector('.overlay-dialogue .dlg-nextbtn');
    if (shown(nextBtn)) return at(nextBtn);
    const cine = document.querySelector('.cine-stage');
    if (cine) return at(cine);
    const b = [...document.querySelectorAll('.overlay button')].find((x) => shown(x) && /كمّلي|تمام|التالي/.test(x.textContent));
    return b ? at(b) : null;
  });
const saved = (page) =>
  page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('snooki-game:save') || '{}');
    const f = s.flags || {};
    const count = (id) => (s.journal || []).filter((j) => j === id).length;
    return { meet: !!f['t.final.meet'], rose: !!f['rose-planted'], complete: !!f['game-complete'], husky: f['husky-name'], ending: count('ending'), drawing: count('drawing'), open: count('ending-open'), seenOpen: (s.seen || []).includes('dlg:a8.open') };
  });
const dialogueText = (page) => page.evaluate(() => document.querySelector('.overlay-dialogue')?.textContent ?? '');

describe.skipIf(!browser)(`the ending in a real browser${browser ? '' : ` (skipped: ${unavailable})`}`, () => {
  for (const view of VIEWS) {
    it(`${view[0]}: closed at the folded paper, resumed, completed with real input; open ending once; nothing twice; a reload replays nothing`, async () => {
      const ctx = await browser.newContext({ viewport: { width: view[1], height: view[2] }, hasTouch: view[0] === 'phone' });
      contexts.push(ctx);
      await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
      const page = await ctx.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(`${base}?timer=1&scene=final&flags=${BEFORE.join(',')}`, { waitUntil: 'load' });
      await ready(page);
      await page.evaluate(`window.__game.game.setFlag('husky-name', 'لولو')`);
      await goTo(page, 1000);

      // 1. the meeting, played with real input up to the folded paper — then the app is closed
      await walkIn(page);
      for (let i = 0; i < 300; i++) {
        const t = await nextTarget(page);
        if (t?.paper) break;
        if (t) await press(page, view, t);
        await page.waitForTimeout(150);
      }
      expect(await page.evaluate(() => Boolean(document.querySelector('.drawing [data-paper]')))).toBe(true);
      expect(await saved(page)).toMatchObject({ meet: true, complete: false, drawing: 0 });
      await page.reload({ waitUntil: 'load' });
      await ready(page);

      // 2. she walks back under the rose tree: the meeting plays again from its start
      await goTo(page, 1000);
      await walkIn(page);
      expect(await page.evaluate(() => window.__game.screen.world.mode)).toBe('cutscene');
      await page.waitForFunction(() => /رياااان/.test(document.querySelector('.overlay-dialogue')?.textContent ?? ''), null, { timeout: 15000 });

      // 3. through to the end: the paper (a real tap on the phone; desktop uses the plain click —
      // the route screen readers and switch access take), «بعدين», the planting puzzle, the
      // chapter card, the credits, the ending and the open ending
      let paperOpened = false;
      let sawOpen = false;
      for (let i = 0; i < 700; i++) {
        const done = await page.evaluate(() => window.__game.game.flag('game-complete') && !document.querySelector('.overlay') && window.__game.screen.world.mode === 'play');
        if (done) break;
        if (/هنا تخلص الحكاية/.test(await dialogueText(page))) sawOpen = true;
        const t = await nextTarget(page);
        if (t?.paper) {
          if (view[0] === 'phone') await press(page, view, t);
          else await page.evaluate(() => document.querySelector('.drawing [data-paper]').click());
          await page.waitForFunction(() => document.querySelector('.drawing [data-paper]')?.classList.contains('is-open'), null, { timeout: 3000 });
          paperOpened = true;
        } else if (t) await press(page, view, t);
        await page.waitForTimeout(150);
      }
      expect(paperOpened).toBe(true);
      expect(sawOpen).toBe(true);
      await page.waitForTimeout(800);
      const end = await saved(page);
      expect(end).toEqual({ meet: true, rose: true, complete: true, husky: 'لولو', ending: 1, drawing: 1, open: 1, seenOpen: true });
      // the canon after the meeting: Snooki stays with Ryan (not following her); she has not met her
      // husky yet in this save (Story Pack 01 comes after the ending), so no dog follows her
      expect(await page.evaluate(() => { const w = window.__game.screen.world; const s = w.actor('snooki'); return { snooki: Boolean(s?.visible) && !s.companion, husky: Boolean(w.actor('husky')?.companion) }; })).toEqual({ snooki: true, husky: false });

      // 4. after a reload, walking under the rose tree replays nothing; everything is kept
      await page.reload({ waitUntil: 'load' });
      await ready(page);
      await goTo(page, 1000);
      await walkIn(page);
      await page.waitForTimeout(1500);
      expect(await page.evaluate(() => ({ mode: window.__game.screen.world.mode, overlay: Boolean(document.querySelector('.overlay')) }))).toEqual({ mode: 'play', overlay: false });
      expect(await saved(page)).toEqual(end);
      expect(errors).toEqual([]);
    }, 240000);
  }
});
