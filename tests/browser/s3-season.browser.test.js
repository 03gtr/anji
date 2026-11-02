// @vitest-environment node
/**
 * Season 3 «أصداء الـV8» in REAL browsers (Edge at 390 and 320; WebKit 390 on the game's own animation frames).
 * A synthetic save in a fresh profile per test:
 *  - every Season 3 place loads and draws (its theme, Zefiro in her colour, the cast incl. Marius and Jalal), its
 *    opening plays through, no page error, no failed request;
 *  - Mission 02: she walks under the trees and the V8 speaks — ignition, one blip, off (the audio engine runs in the
 *    page; nothing throws) — her whisper, her answer by touch, the bakery's shutter; Season 3's save keeps it;
 *  - «الصدى» in the real panel: five waveforms drawn, no help controls, every target ≥ 44 px, no sideways scroll;
 *  - Mission 03 ends in a talk with Marius by touch (the investigation board was removed by the owner's hotfix brief):
 *    the «تلميح» names it, a ≥ 44 px target that changes nothing; the journal has every tab but the board.
 * Headless emulation, not a physical phone.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SHOTS = process.env.SHOTS_DIR || null;
const AFTER = [
  'intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'sp2-final-done',
  'act7-done', 'workshop-entered', 'wk-intro', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'notice:s2', 'notice:s3',
];
const S2_DONE = Array.from({ length: 17 }, (_, i) => `mission:s2-${String(i + 1).padStart(2, '0')}`);
const S3_UPTO = (n) => Array.from({ length: n }, (_, i) => `mission:s3-0${i + 1}`);

async function launch(name) {
  try {
    if (name === 'webkit') return { browser: await webkit.launch({ headless: true }) };
    for (const channel of ['msedge', 'chrome']) {
      try {
        return { browser: await chromium.launch({ channel, headless: true }) };
      } catch {
        // next channel
      }
    }
    return { reason: 'no chromium channel' };
  } catch (e) {
    return { reason: String(e.message).split('\n')[0] };
  }
}
const engines = { chromium: await launch('chromium'), webkit: await launch('webkit') };
let server;
let base;
beforeAll(async () => {
  if (!engines.chromium.browser && !engines.webkit.browser) return;
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5234, strictPort: false, hmr: false } });
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

async function open(browser, { width, height, scene, flags = [] }) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  contexts.push(ctx);
  await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('crash', () => errors.push('the page crashed'));
  page.on('response', (r) => r.status() >= 400 && errors.push(`HTTP ${r.status()} ${r.url()}`));
  // WebKit plays on the game's own animation frames (never ?timer=1: it starves headless WebKit on Windows)
  const timer = browser.browserType().name() === 'webkit' ? '' : 'timer=1&';
  await page.goto(`${base}?${timer}scene=${scene}&flags=${[...AFTER, ...S2_DONE, ...flags].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction((id) => window.__game?.screen?.world?.scene?.id === id, scene, { timeout: 60000 });
  await page.evaluate(`(async () => {
    const { ACTS } = await import('/src/game/data/chapters.js');
    const { atoms } = await import('/src/game/core/conditions.js');
    const g = window.__game.game;
    for (const a of ACTS) for (const o of a.objectives) for (const at of atoms(o.done)) {
      const [k, ...r] = at.split(':');
      const id = r.join(':');
      if (k === 'flag') g.setFlag(id);
      if (k === 'record') g.recordResult(id, { completed: true });
      if (k === 'item') g.addItem(id);
    }
    g.setFlag('husky-name', 'لولو');
    history.replaceState(null, '', location.pathname);
  })()`);
  return { page, errors, atChoice: [] };
}
const centre = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.disabled || el.hidden) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel);
async function press(t, sel) {
  const p = await centre(t.page, sel);
  expect(p, `${sel} is on screen`).toBeTruthy();
  await t.page.touchscreen.tap(p.x, p.y);
  await t.page.waitForTimeout(140);
}
/** Read every open dialogue through (taking the given picks at choices), until the world is back in play. */
async function readAll(t, picks = []) {
  for (let i = 0; i < 200; i++) {
    const s = await t.page.evaluate(() => {
      if (document.querySelector('.overlay-dialogue .dlg-choices button')) return 'choice';
      if (document.querySelector('.overlay-dialogue')) return 'next';
      return window.__game.screen.world.mode === 'play' && !document.querySelector('.overlay') ? 'play' : 'wait';
    });
    if (s === 'play') {
      // a scripted beat may open the next line after a pause: settle before calling it done
      await t.page.waitForTimeout(700);
      const again = await t.page.evaluate(() => window.__game.screen.world.mode === 'play' && !document.querySelector('.overlay'));
      if (again) return;
      continue;
    }
    if (s === 'choice') {
      t.atChoice.push(await t.page.evaluate(() => window.__game.screen.world.actor('anji').puffs.map((p) => p.type)));
      await press(t, `.overlay-dialogue .dlg-choices button:nth-child(${(picks.shift() ?? 0) + 1})`);
    } else if (s === 'next') await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
    else await t.page.waitForTimeout(150);
  }
  throw new Error('the scene did not come back to play');
}
/** Walk (arrow keys) until she is at x. */
async function walkTo(t, x) {
  const px = await t.page.evaluate(() => window.__game.screen.world.player.x);
  if (Math.abs(px - x) < 30) return;
  const key = x > px ? 'ArrowRight' : 'ArrowLeft';
  await t.page.keyboard.down(key);
  await t.page
    .waitForFunction(([ox, d]) => { const w = window.__game.screen.world; return w.mode !== 'play' || (d > 0 ? w.player.x >= ox : w.player.x <= ox); }, [x, x > px ? 1 : -1], { timeout: 30000, polling: 50 })
    .finally(() => t.page.keyboard.up(key));
}
const s3doc = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s3') || '{}'));
const shot = async (t, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));
const flag = (t, id) => t.page.evaluate((i) => window.__game.game.flag(i), id);

// each place, with the missions before it done (its opening plays on arrival)
const PLACES = [
  ['s3-street', 1],
  ['s3-home', 2],
  ['s3-garage', 3],
  ['s3-lane', 4],
  ['s3-archive', 5],
  ['s3-street', 7],
];

for (const [name, engine] of Object.entries(engines)) {
  const label = name === 'chromium' ? 'Edge' : 'WebKit';
  describe.skipIf(!engine.browser)(`Season 3 in ${label}`, () => {
    it.each(PLACES.map(([s, n], i) => [i + 1, s, n]))('place %i (%s): loads, draws, its opening plays through, no error', async (i, scene, n) => {
      const t = await open(engine.browser, { width: 390, height: 844, scene, flags: S3_UPTO(n) });
      await t.page.waitForTimeout(1200);
      await readAll(t, [0, 0, 0, 0]);
      await shot(t, `${name}-place-${i}-${scene}`);
      // drawn: the canvas has painted pixels in the middle of the view
      const painted = await t.page.evaluate(() => {
        const c = document.querySelector('canvas');
        const g = c.getContext('2d');
        const d = g.getImageData(c.width / 2 - 20, c.height / 2 - 20, 40, 40).data;
        let n = 0;
        for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++;
        return n;
      });
      expect(painted).toBeGreaterThan(100);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 300000);

    it('Mission 02: under the trees the V8 speaks once; her whisper; her answer by touch; the shutter after', async () => {
      const t = await open(engine.browser, { width: 390, height: 844, scene: 's3-street', flags: S3_UPTO(1) });
      await t.page.waitForTimeout(1000);
      await readAll(t);
      expect(await flag(t, 's3:02-arrived')).toBe(true);
      // the details are there to notice — none is required; she notices the plate on her way
      await walkTo(t, 1100);
      await t.page.waitForFunction(() => window.__game.game.flag('s3:02-engine-on'), null, { timeout: 30000 });
      await t.page.waitForTimeout(2200);
      await shot(t, `${name}-v8-idle`);
      await t.page.waitForFunction(() => window.__game.game.flag('s3:02-blip'), null, { timeout: 30000 });
      await shot(t, `${name}-v8-blip`);
      await readAll(t, [1]);
      expect(t.atChoice[0], 'she is blushing when she answers').toContain('blush');
      expect(await flag(t, 's3:02-engine-off')).toBe(true);
      expect(await flag(t, 's3:dec:v8-answer')).toBe('walk');
      expect(await flag(t, 's3:02-shutter')).toBe(true);
      const doc = await s3doc(t.page);
      expect(doc.collected).toContain('s3.ev.e-blip');
      expect(doc.flags['s3:dec:v8-answer']).toBe('walk');
      await shot(t, `${name}-v8-after`);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 300000);

    it('«الصدى» at 320: five waveforms; no help; every target ≥ 44 px; nothing scrolls sideways', async () => {
      const t = await open(engine.browser, { width: 320, height: 700, scene: 's3-home', flags: S3_UPTO(2) });
      await t.page.waitForTimeout(1000);
      await readAll(t, [0, 0]);
      await t.page.evaluate(() => { window.__game.ui.puzzle('s3-echo'); }); // (resolves when the panel closes: not awaited)
      await t.page.waitForSelector('.panel.puzzle .sort-card .s3-wave');
      await t.page.waitForFunction(() => document.querySelector('.overlay')?.getAnimations({ subtree: true }).every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 10000 });
      expect(await t.page.evaluate(() => document.querySelectorAll('.panel.puzzle .s3-wave').length)).toBe(5);
      expect(await t.page.evaluate(() => document.querySelectorAll('.panel.puzzle [data-act="hint"], .panel.puzzle [data-act="solution"], .panel.puzzle [data-act="skip"]').length)).toBe(0);
      for (const h of await t.page.evaluate(() => [...document.querySelectorAll('.panel.puzzle .sort-card, .panel.puzzle .sort-bin-head, .panel.puzzle [data-submit]')].map((x) => Math.round(x.getBoundingClientRect().height)))) expect(h).toBeGreaterThanOrEqual(44);
      expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await shot(t, `${name}-echo-320`);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 300000);

    it('Mission 03 ends in a talk with Marius, by touch: the «تلميح» says so, the journal has no board', async () => {
      // an older save: the board had opened (s3:board-open), the recordings are solved, the thread never drawn
      const t = await open(engine.browser, { width: 360, height: 780, scene: 's3-home', flags: [...S3_UPTO(2), 's3:03-opened', 's3:03-solved', 's3:board-open'] });
      await t.page.waitForTimeout(1000);
      await readAll(t, [0, 0]);
      await t.page.evaluate(() => {
        const g = window.__game.game;
        for (const e of ['e-clip', 'e-rec-cam', 'e-rec-gate', 'e-rec-lama', 'd-two-engines']) g.collect(`s3.ev.${e}`);
      });
      await t.page.waitForFunction(() => /ماريوس/.test(document.querySelector('.hud .objective span')?.textContent ?? ''), null, { timeout: 15000 });
      // the hint: on screen, a real touch target, the step's words, nothing changed
      const before = await t.page.evaluate(() => localStorage.getItem('snooki-game:s3'));
      await press(t, '.hint-pill');
      const hint = await t.page.evaluate(() => {
        const c = document.querySelector('.objective-hint');
        const r = c.getBoundingClientRect();
        const b = document.querySelector('.hint-pill').getBoundingClientRect();
        return { text: c.hidden ? '' : c.textContent, inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, h: Math.round(b.height) };
      });
      expect(hint.text).toMatch(/ماريوس/);
      expect(hint.inView).toBe(true);
      expect(hint.h).toBeGreaterThanOrEqual(44);
      expect(await t.page.evaluate(() => localStorage.getItem('snooki-game:s3'))).toBe(before);
      await shot(t, `${name}-hint-360`);
      await press(t, '.objective-hint');
      // she tells Marius
      const mx = await t.page.evaluate(() => window.__game.screen.world.actor('marius').x);
      await walkTo(t, mx - 50);
      await press(t, '.pad-interact');
      await readAll(t);
      expect(await flag(t, 's3:03-told')).toBe(true);
      expect(await flag(t, 'mission:s3-03')).toBe(true);
      // the journal: every tab but the board
      await press(t, '.hud [data-act="journal"]');
      await t.page.waitForSelector('.journal .tabs');
      expect(await t.page.evaluate(() => document.querySelector('.journal .tabs').textContent)).not.toMatch(/لوحة التحقيق/);
      expect(await t.page.evaluate(() => [...document.querySelectorAll('.journal [data-tab]')].map((b) => b.dataset.tab))).toEqual(['notes', 'missions', 'evidence', 'collection', 'bag', 'challenges', 'achievements']);
      expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await shot(t, `${name}-journal-360`);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 300000);
  });
}
