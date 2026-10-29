// @vitest-environment node
/**
 * Scene changes do not pile up graphics memory: character sprites are baked once per look, not
 * once per scene (world/sprite-cache.js). REAL browsers, synthetic saves only.
 *
 * REGRESSION (a white screen in the workshop, seen on a real phone): every scene baked every
 * character's frames again — ~90 SVG images decoded and drawn into canvases per scene change. In
 * Safari's engine (WebKit) that drawing leaves memory that only garbage collection hands back, late
 * and in bulk: graphics memory grew by ~450 MB per scene change, up to ~5 GB, and twice the
 * process holding it died, leaving a white page that no longer answered.
 *
 *  1. every engine available (Edge/Chrome; WebKit when installed): after each look has been baked
 *     once, workshop ↔ house ↔ the rose garden (her husky) bakes no sprite image again;
 *  2. WebKit on Windows only (where the graphics process can be measured): 20 such scene changes
 *     keep the graphics process's memory flat, every frame is drawn, and her husky still speaks.
 *
 * This is browser-ENGINE emulation (Playwright's WebKit build on Windows), not Safari on an iPhone.
 * Engines that cannot be launched are skipped, and the reason is printed in the skipped test's name.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
/** After the ending: the workshop open, the husky met and named, Ryan in the rose garden. */
const AFTER = [
  'intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'sp2-final-done',
  'act7-done', 'workshop-entered', 'wk-intro', 't.workshop.enter', 't.workshop.machine', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'dg-box', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team',
];
const TOUR = ['workshop', 'house', 'final'];

async function launch(name) {
  try {
    if (name === 'webkit') return { browser: await webkit.launch({ headless: true }) };
    let last = '';
    for (const channel of ['msedge', 'chrome']) {
      try {
        return { browser: await chromium.launch({ channel, headless: true }) };
      } catch (e) {
        last = `${channel}: ${String(e.message).split('\n')[0]}`;
      }
    }
    return { reason: last };
  } catch (e) {
    return { reason: String(e.message).split('\n')[0] };
  }
}
const engines = { chromium: await launch('chromium'), webkit: await launch('webkit') };

/** MB of WebKit's graphics process (Windows), or null where it cannot be measured. */
function gpuMB() {
  if (process.platform !== 'win32') return null;
  try {
    const out = execSync('powershell -NoProfile -Command "(Get-Process WebKitGPUProcess -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum / 1MB"', { timeout: 20000 }).toString().trim();
    return out ? Math.round(Number(out)) : null;
  } catch {
    return null;
  }
}

let server;
let base;
beforeAll(async () => {
  if (!engines.chromium.browser && !engines.webkit.browser) return;
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5213, strictPort: false, hmr: false } });
  await server.listen();
  base = server.resolvedUrls.local[0];
}, 60000);
afterAll(async () => {
  for (const e of Object.values(engines)) await e.browser?.close();
  await server?.close();
}, 60000);
const contexts = [];
afterEach(async () => {
  while (contexts.length) await contexts.pop().close().catch(() => {});
}, 60000);

/** A phone-sized profile in the rose garden after the ending; counts every sprite image it bakes. */
async function open(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  contexts.push(ctx);
  await ctx.addInitScript(() => {
    localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false }));
    window.__svgImages = 0; // every SVG image given to an <img>: one per sprite frame baked
    const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { ...desc, set(v) { if (String(v).startsWith('data:image/svg')) window.__svgImages++; desc.set.call(this, v); } });
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('crash', () => errors.push('the page crashed'));
  await page.goto(`${base}?timer=1&scene=final&flags=${AFTER.join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 60000 });
  await page.evaluate(() => { window.__game.game.setFlag('husky-name', 'لولو'); history.replaceState(null, '', location.pathname); });
  return { page, errors };
}
/** Change scene like the map does, and wait until the new one is built. */
async function go(page, scene, spawnX) {
  await page.evaluate(([s, x]) => { window.__old = window.__game.screen.world; window.__game.go(s, x == null ? {} : { spawnX: x }); }, [scene, spawnX]);
  await page.waitForFunction(() => window.__game.screen.world && window.__game.screen.world !== window.__old && window.__game.screen.world.mode !== 'loading', null, { timeout: 60000 });
  await page.waitForTimeout(400);
}
/** Share of white pixels in the world canvas (a white page is ~1). */
const whiteShare = (page) =>
  page.evaluate(() => {
    const c = document.querySelector('.world-canvas');
    if (!c) return 1;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let white = 0, n = 0;
    for (let i = 0; i < d.length; i += 4 * 97) { n++; if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) white++; }
    return white / n;
  });

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`sprite memory in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    it('after each look is baked once, workshop ↔ house ↔ the rose garden bakes no sprite again (REGRESSION: ~90 per scene change)', async () => {
      const t = await open(engine.browser);
      for (const s of TOUR) await go(t.page, s); // first visit: each kind's look is baked once
      const warm = await t.page.evaluate(() => window.__svgImages);
      expect(warm).toBeGreaterThan(0);
      const per = [];
      for (let i = 0; i < 9; i++) {
        const before = await t.page.evaluate(() => window.__svgImages);
        await go(t.page, TOUR[i % 3]);
        per.push((await t.page.evaluate(() => window.__svgImages)) - before);
      }
      expect(per).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(await whiteShare(t.page)).toBeLessThan(0.5);
      expect(t.errors).toEqual([]);
    }, 240000);

    it.skipIf(name !== 'webkit' || gpuMB() == null && process.platform !== 'win32')('graphics memory stays flat over 20 scene changes, every frame is drawn, and her husky still speaks (REGRESSION: +~450 MB per change, then a white page)', async () => {
      const t = await open(engine.browser);
      for (const s of TOUR) await go(t.page, s);
      await t.page.waitForTimeout(3000); // let the graphics process settle after the first bakes
      const start = gpuMB();
      expect(start, 'the graphics process can be measured').not.toBeNull();
      const samples = [start];
      const white = [];
      for (let i = 0; i < 20; i++) {
        await go(t.page, TOUR[i % 3]);
        samples.push(gpuMB());
        white.push(await whiteShare(t.page));
      }
      // the rose garden at the far end, where her remarks were checked before: she still speaks
      await go(t.page, 'final', 1050);
      const said = await t.page.waitForFunction(() => window.__game.screen.world.actor('husky')?.bubble?.text, null, { timeout: 45000, polling: 200 }).then((h) => h.jsonValue(), () => null);
      samples.push(gpuMB());
      console.log(`[webkit ${engine.browser.version()}] graphics process MB over 20 scene changes: ${samples.join(' → ')}`);
      const growth = Math.max(...samples) - start;
      // before the fix ONE scene change added ~450 MB; now twenty may not add even that much together
      expect(growth).toBeLessThan(400);
      expect(white.every((w) => w < 0.5)).toBe(true);
      expect(said).toBeTruthy();
      expect(t.errors).toEqual([]);
    }, 600000);
  });
}
