// @vitest-environment node
/**
 * Her husky's remarks can be SEEN on a phone, in a REAL browser: on a phone's narrow view her
 * scouting spot (110 ahead of Anji) is at the screen's edge; when she has something to say she
 * comes back to Anji's side, so she — and her words — are on screen. Synthetic saves only.
 *
 * REGRESSION (reported: «her dog does not speak»): her remark was made from the scouting spot,
 * half off screen on a phone.
 *
 * This is headless browser emulation, not a physical phone.
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
const FLAGS = [
  'intro-done', 'map-open', 'met-snooki', 'act7-done', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team',
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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5204, strictPort: false, hmr: false } });
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

describe.skipIf(!browser)(`her husky's remarks on a phone${browser ? '' : ` (skipped: ${unavailable})`}`, () => {
  it('phone: when she remarks she comes back to Anji\'s side — she and her words are on screen', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    contexts.push(ctx);
    await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${base}?timer=1&scene=final&flags=${FLAGS.join(',')}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 20000 });
    await page.evaluate(() => {
      window.__game.game.setFlag('husky-name', 'لولو');
      window.__old = window.__game.screen.world;
      window.__game.go('final', { spawnX: 1050 }); // a quiet stretch of the rose garden
    });
    await page.waitForFunction(() => window.__game.screen.world !== window.__old && window.__game.screen.world.mode === 'play', null, { timeout: 15000 });
    // she stands still: her husky scouts ahead, then (after ~14 s of play) says something
    await page.waitForFunction(() => Boolean(window.__game.screen.world.actor('husky')?.bubble), null, { timeout: 30000, polling: 'raf' });
    const said = await page.evaluate(() => window.__game.screen.world.actor('husky').bubble.text);
    const list = await page.evaluate(`import('/src/game/world/engine.js').then((m) => m.HUSKY_AMBIENT)`);
    expect(list).toContain(said);
    await page.waitForTimeout(1200); // she trots back while she speaks
    const seen = await page.evaluate(() => {
      const w = window.__game.screen.world;
      const h = w.actor('husky');
      const p = w.toScreen(h.x, h.y - 40);
      return { speaking: Boolean(h.bubble), x: p.x, width: innerWidth };
    });
    expect(seen.speaking).toBe(true);
    expect(seen.x).toBeGreaterThan(20);
    expect(seen.x).toBeLessThan(seen.width - 20); // on screen (REGRESSION: at or past the right edge)
    expect(errors).toEqual([]);
  }, 90000);
});
