// @vitest-environment node
/**
 * «دفتر أنجي» in a REAL browser at phone and desktop sizes, with a full journal: the title, the close
 * button and every tab are fully visible and on top; each tab is tapped (touch on a phone, a click on
 * desktop) and shows its own content; the content scrolls inside its own area while the tabs stay
 * put; closing and reopening keeps the layout. Synthetic saves only (a fresh profile per test).
 *
 * REGRESSION (seen on a real phone): with a long journal the tab row (a flex child of the panel,
 * which scrolls sideways) shrank to a 2 px strip — the tabs were there but could not be seen or tapped.
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
  ['phone', 390, 844, true],
  ['small phone', 360, 640, true],
  ['phone landscape', 844, 390, true],
  ['desktop', 1280, 720, false],
];
const FLAGS = 'intro-done,map-open,met-snooki,act1-done,act2-done,act3-done,act4-done,act5-done,act6-done,act7-done,game-complete,act8-done,t.final.meet,notice:sp1,notice:sp2,notice:deep,notice:team';

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5202, strictPort: false, hmr: false } });
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

/** Boxes of the journal's parts, and what is on top at the centre of each tab. */
const measure = (page) =>
  page.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
    const panel = document.querySelector('.overlay .panel.journal');
    const tabs = [...panel.querySelectorAll('.tabs [data-tab]')].map((t) => {
      const b = box(t);
      const top = document.elementFromPoint(b.x + b.w / 2, b.y + b.h / 2);
      return { id: t.dataset.tab, label: t.textContent.trim(), selected: t.getAttribute('aria-selected') === 'true', ...b, onTop: top === t || t.contains(top) };
    });
    return { vw: innerWidth, vh: innerHeight, panel: box(panel), title: box(panel.querySelector('h2')), close: box(panel.querySelector('[data-close]')), body: box(panel.querySelector('.journal-body')), tabs };
  });
const inside = (a, o) => a.x >= o.x - 0.5 && a.y >= o.y - 0.5 && a.r <= o.r + 0.5 && a.b <= o.b + 0.5;

describe.skipIf(!browser)(`Anji's journal in a real browser${browser ? '' : ` (skipped: ${unavailable})`}`, () => {
  for (const [name, w, h, touch] of VIEWS) {
    it(`${name} ${w}×${h}: every tab fully visible and tappable, each shows its own content; long content scrolls under them; close and reopen`, async () => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
      contexts.push(ctx);
      await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
      const page = await ctx.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(`${base}?timer=1&scene=final&flags=${FLAGS}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 20000 });
      // a full journal (every entry there is), then let the "new page" notices pass
      // (as a string: the test runner would rewrite an import() inside a function)
      await page.evaluate(`import('/src/game/data/items.js').then(({ JOURNAL }) => { for (const id of Object.keys(JOURNAL)) window.__game.game.addJournal(id); })`);
      await page.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 20000 }).catch(() => {});
      const tap = async (sel) => {
        const p = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
        if (touch) await page.touchscreen.tap(p.x, p.y);
        else await page.mouse.click(p.x, p.y);
      };
      const open = async () => {
        await tap('[data-act="journal"]');
        await page.waitForSelector('.overlay .panel.journal .tabs [data-tab]');
        await page.waitForTimeout(400); // the panel's pop-in
      };

      await open();
      let m = await measure(page);
      const screen = { x: 0, y: 0, r: m.vw, b: m.vh };
      expect(inside(m.title, screen) && inside(m.close, screen)).toBe(true);
      expect(m.tabs.map((t) => t.id)).toEqual(['notes', 'missions', 'evidence', 'collection', 'bag', 'challenges', 'achievements']);
      for (const t of m.tabs) {
        expect(t.h, `${t.label} height`).toBeGreaterThanOrEqual(40); // REGRESSION: was ~2 px
        expect(inside(t, m.panel) && inside(t, screen), `${t.label} inside the panel and the screen`).toBe(true);
        expect(t.onTop, `${t.label} is on top`).toBe(true);
        expect(t.b).toBeLessThanOrEqual(m.body.y + 1); // the content starts below the tabs
      }
      expect(m.body.h).toBeGreaterThan(60);
      // RTL: the first tab («الدفتر») sits at the right of the first row
      const firstRow = m.tabs.filter((t) => Math.abs(t.y - m.tabs[0].y) < 2);
      expect(Math.max(...firstRow.map((t) => t.r))).toBe(m.tabs[0].r);

      // each tab: tapped for real, selected, its own content
      const seen = new Set();
      for (const t of m.tabs) {
        await tap(`.overlay .tabs [data-tab="${t.id}"]`);
        await page.waitForTimeout(150);
        const after = await measure(page);
        expect(after.tabs.filter((x) => x.selected).map((x) => x.id)).toEqual([t.id]);
        // (the panel fits its content, so it may grow or shrink): every tab and the title stay in full view
        for (const x of after.tabs) expect(x.h >= 40 && x.onTop && inside(x, after.panel) && inside(x, screen), `${x.label} after choosing ${t.label}`).toBe(true);
        expect(inside(after.title, screen) && inside(after.close, screen)).toBe(true);
        const content = await page.evaluate(() => document.querySelector('.journal-body').innerHTML);
        expect(content.length).toBeGreaterThan(0);
        seen.add(content);
      }
      expect(seen.size).toBe(m.tabs.length); // every tab its own content

      // long content scrolls inside its area; the tabs stay where they are, visible
      await tap('.overlay .tabs [data-tab="notes"]');
      await page.waitForTimeout(150);
      const scrollable = await page.evaluate(() => { const b = document.querySelector('.journal-body'); return b.scrollHeight > b.clientHeight + 10; });
      expect(scrollable).toBe(true);
      m = await measure(page);
      await page.mouse.move(m.body.x + m.body.w / 2, m.body.y + Math.min(m.body.h / 2, 60));
      await page.mouse.wheel(0, 600);
      // (the browser applies a wheel scroll asynchronously: wait for it rather than a fixed time)
      const moved = await page.waitForFunction(() => document.querySelector('.journal-body').scrollTop > 0, null, { timeout: 3000 }).then(() => true).catch(() => false);
      expect(moved, 'the journal content scrolled').toBe(true);
      const scrolled = await measure(page);
      for (const t of scrolled.tabs) expect(t.onTop && Math.abs(t.y - m.tabs.find((x) => x.id === t.id).y) < 1).toBe(true);

      // close, reopen: the same layout
      await tap('.overlay .panel.journal [data-close]');
      await page.waitForFunction(() => !document.querySelector('.overlay .panel.journal'));
      await open();
      const again = await measure(page);
      for (const t of again.tabs) expect(t.h >= 40 && t.onTop && inside(t, again.panel)).toBe(true);
      expect(errors).toEqual([]);
    }, 120000);
  }
});
