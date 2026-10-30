// @vitest-environment node
/**
 * Season 2, Milestone M1, in REAL browsers with REAL input (touch on a phone, mouse on desktop).
 * Synthetic saves only (a fresh profile per test).
 *
 *  - Act I's opening played like a player: the archive, the register, the copy, the comparison —
 *    and the original campaign's save (localStorage) stays byte-identical throughout;
 *  - «لوحة الدائرة» (the case board) at 320, 360 and 390 px phones and on desktop: every card and
 *    column at least 44 px, inside the screen and tappable; a wrong layout keeps her cards; a reload
 *    resumes at the stage she reached; solved by taps alone;
 *  - Season 2's places and its new characters go through the shared sprite cache (PR #13): after
 *    the first visit, changing places bakes no sprite again (also in WebKit, when it is installed).
 *
 * This is headless browser emulation (Edge/Chrome, and Playwright's WebKit on Windows when present),
 * not a physical phone and not Safari. Engines that cannot be launched are skipped with the reason.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
/** A finished original game (main save) — Season 2 opens with the ending. */
const AFTER = [
  'intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'sp2-final-done',
  'act7-done', 'workshop-entered', 'wk-intro', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'notice:s2',
];
/** Season 2 through «دفتر التحقيق الرسمي» (s2-03): the board is next. These go to Season 2's own save. */
const S2_ACT1 = [
  's2:in-archive', 's2:in-tree', 's2:01-compared', 's2:02-counted', 's2:03-sorted', 's2:caseroom-open',
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => `s2:lantern-${n}`),
];
const S2_EVIDENCE = ['e-register', 'e-copy', 'e-count', 'e-blank', 'e-moved', 'e-note', 'e-whisper'];

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

let server;
let base;
beforeAll(async () => {
  if (!engines.chromium.browser && !engines.webkit.browser) return;
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5215, strictPort: false, hmr: false } });
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

/** A fresh profile in a Season 2 place, with the given progress; counts every sprite image baked. */
async function open(browser, { width = 390, height = 844, touch = true, scene, s2 = [], evidence = [] }) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2 });
  contexts.push(ctx);
  await ctx.addInitScript(() => {
    localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false }));
    window.__svgImages = 0;
    const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { ...desc, set(v) { if (String(v).startsWith('data:image/svg')) window.__svgImages++; desc.set.call(this, v); } });
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('crash', () => errors.push('the page crashed'));
  const flags = [...AFTER, ...s2].join(',');
  await page.goto(`${base}?timer=1&scene=${scene}&flags=${flags}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play' || document.querySelector('.overlay-dialogue'), null, { timeout: 60000 });
  await page.evaluate((ev) => {
    for (const e of ev) window.__game.game.collect(`s2.ev.${e}`);
    window.__game.game.setFlag('husky-name', 'لولو');
    history.replaceState(null, '', location.pathname); // a reload continues the save, as for a player
  }, evidence);
  return { page, errors, touch };
}
const centre = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel);
async function press(t, sel) {
  const p = await centre(t.page, sel);
  expect(p, `${sel} is on screen`).toBeTruthy();
  if (t.touch) await t.page.touchscreen.tap(p.x, p.y);
  else await t.page.mouse.click(p.x, p.y);
  await t.page.waitForTimeout(150);
}
/** Read the open dialogue to its end (the first choice when there is one). */
async function read(t) {
  for (let i = 0; i < 80; i++) {
    const state = await t.page.evaluate(() => {
      const d = document.querySelector('.overlay-dialogue');
      if (!d) return 'none';
      if (d.querySelector('.dlg-choices button')) return 'choice';
      return 'next';
    });
    if (state === 'none') return;
    if (state === 'choice') await press(t, '.overlay-dialogue .dlg-choices button');
    else await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
  }
  throw new Error('the dialogue did not end');
}
const playing = (page) => page.waitForFunction(() => window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay'), null, { timeout: 30000 });
/**
 * A real tap on something in the world, like a player: while it is off screen (a phone shows only
 * ~180 world units) she taps the ground at the screen's edge to walk that way; then taps the thing.
 */
async function tapObject(t, x) {
  // walk with the arrow keys (never tapping something else on the way) until it is close…
  const dir = await t.page.evaluate((ox) => Math.sign(ox - window.__game.screen.world.player.x), x);
  if (dir !== 0) {
    const key = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
    await t.page.keyboard.down(key);
    await t.page
      .waitForFunction(([ox, d]) => { const w = window.__game.screen.world; return d > 0 ? w.player.x >= ox - 50 : w.player.x <= ox + 50; }, [x, dir], { timeout: 30000, polling: 50 })
      .finally(() => t.page.keyboard.up(key));
    await t.page.waitForTimeout(250);
  }
  // …then a real tap (touch on a phone) on it
  const p = await t.page.evaluate((ox) => { const w = window.__game.screen.world; return w.toScreen(ox, w.player.y - 50); }, x);
  if (t.touch) await t.page.touchscreen.tap(p.x, p.y);
  else await t.page.mouse.click(p.x, p.y);
  await t.page.waitForFunction(() => document.querySelector('.overlay'), null, { timeout: 30000 });
}
const s2Doc = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s2') || '{}'));
const mainSave = (page) => page.evaluate(() => localStorage.getItem('snooki-game:save'));

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Season 2 M1 in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    it('phone, touch: Act I opens like a player plays it — register, copy, comparison — and the original save is never written', async () => {
      const t = await open(engine.browser, { scene: 's2-archive' });
      await read(t); // the arrival
      await playing(t.page);
      const before = await mainSave(t.page);
      await tapObject(t, 520); // the register
      await read(t);
      await playing(t.page);
      await tapObject(t, 860); // the copy
      await read(t);
      await playing(t.page);
      await tapObject(t, 520); // the comparison
      await t.page.waitForSelector('.panel.puzzle');
      await press(t, '.ct-claim[data-claim="1"]');
      await press(t, '[data-evidence="register"]');
      await press(t, '[data-submit]');
      await t.page.waitForSelector('.panel.puzzle.is-solved');
      await press(t, '.panel.puzzle .panel-foot .btn-primary');
      await read(t);
      await t.page.waitForFunction(() => window.__game.game.flag('mission:s2-01'), null, { timeout: 15000 });
      const doc = await s2Doc(t.page);
      expect(doc.flags['mission:s2-01']).toBe(true);
      expect(doc.collected).toEqual(expect.arrayContaining(['s2.ev.e-register', 's2.ev.e-copy']));
      expect(doc.journal).toContain('s2-case-open');
      expect(await mainSave(t.page)).toBe(before); // byte-identical
      expect(t.errors).toEqual([]);
    }, 240000);

    const VIEWS = name === 'webkit' ? [['phone 390', 390, 844, true]] : [['phone 320', 320, 640, true], ['phone 360', 360, 740, true], ['phone 390', 390, 844, true], ['desktop', 1280, 760, false]];
    for (const [label, w, h, touch] of VIEWS) {
      it(`${label}: the case board — every card and column ≥ 44 px, on screen and tappable; a wrong layout keeps her cards; reload resumes; solved by ${touch ? 'touch' : 'mouse'}`, async () => {
        const t = await open(engine.browser, { width: w, height: h, touch, scene: 's2-caseroom', s2: S2_ACT1, evidence: S2_EVIDENCE });
        await read(t); // the arrival
        await playing(t.page);
        await tapObject(t, 720); // the board
        await read(t).catch(() => {}); // the intro line, once
        await t.page.waitForSelector('.panel.puzzle-sort .sort-card');
        // every control: at least 44 px tall, inside the screen once scrolled to, and on top
        const boxes = await t.page.evaluate(() =>
          [...document.querySelectorAll('.panel.puzzle-sort .sort-card, .panel.puzzle-sort .sort-bin-head, .panel.puzzle-sort [data-submit]')].map((el) => {
            el.scrollIntoView({ block: 'center', inline: 'center' });
            const r = el.getBoundingClientRect();
            const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return { k: el.dataset.k, h: Math.round(r.height), inside: r.left >= 0 && r.right <= innerWidth + 0.5 && r.top >= 0 && r.bottom <= innerHeight + 0.5, onTop: el === top || el.contains(top) };
          }),
        );
        expect(boxes.length).toBe(5 + 2 + 1);
        for (const b of boxes) expect(b, JSON.stringify(b)).toMatchObject({ inside: true, onTop: true });
        for (const b of boxes) expect(b.h, b.k).toBeGreaterThanOrEqual(44);
        expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); // no sideways page scroll
        // everything under B: wrong — her layout stays
        for (const id of ['register', 'blank', 'moved', 'note', 'whisper']) {
          await press(t, `.sort-card[data-card="${id}"]`);
          await press(t, '[data-bin="B"]');
        }
        await press(t, '[data-submit]');
        expect(await t.page.evaluate(() => document.querySelectorAll('.sort-placed').length)).toBe(5);
        expect(await t.page.evaluate(() => document.querySelector('.puzzle-feedback').textContent)).toMatch(/من/);
        // put them right by tapping back and placing again
        for (const id of ['register', 'blank', 'moved']) {
          await press(t, `[data-unplace="${id}"]`);
          await press(t, `.sort-card[data-card="${id}"]`);
          await press(t, '[data-bin="A"]');
        }
        await press(t, '[data-submit]');
        await t.page.waitForSelector('[data-choose="needs"]');
        // a reload in the middle (the app opens on its title screen): «كمّلي» brings her back to the
        // Season 2 place she was in, and the board to the second stage
        await t.page.reload({ waitUntil: 'load' });
        await t.page.waitForSelector('.title-screen [data-act="continue"]', { timeout: 60000 });
        await press(t, '.title-screen [data-act="continue"]');
        await t.page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play' && window.__game.screen.world.scene.id === 's2-caseroom', null, { timeout: 60000 });
        await tapObject(t, 720);
        await t.page.waitForSelector('[data-choose="needs"]', { timeout: 20000 });
        await press(t, '[data-choose="proven"]');
        await press(t, '[data-submit]');
        expect(await t.page.evaluate(() => document.querySelector('.puzzle-feedback').textContent)).toMatch(/سبب/);
        await press(t, '[data-choose="needs"]');
        await press(t, '[data-submit]');
        await t.page.waitForSelector('.panel.puzzle.is-solved');
        await press(t, '.panel.puzzle .panel-foot .btn-primary');
        await read(t);
        await t.page.waitForFunction(() => window.__game.game.flag('mission:s2-04'), null, { timeout: 15000 });
        expect(t.errors).toEqual([]);
      }, 300000);
    }

    it('sprite cache: Season 2 places and their people bake each look once; changing places bakes nothing again', async () => {
      const t = await open(engine.browser, { scene: 's2-archive', s2: [...S2_ACT1, 'mission:s2-04', 's2:board-1', 's2:in-caseroom', 's2:in-clinic', 's2:in-gym', 's2:in-lamphouse', 's2:in-home'], evidence: S2_EVIDENCE });
      await read(t).catch(() => {});
      const tour = ['s2-tree', 's2-clinic', 's2-gym', 's2-lamphouse', 's2-home', 's2-caseroom', 's2-archive'];
      const go = async (scene) => {
        await t.page.evaluate((s) => { window.__old = window.__game.screen.world; window.__game.go(s); }, scene);
        await t.page.waitForFunction(() => window.__game.screen.world && window.__game.screen.world !== window.__old && window.__game.screen.world.mode !== 'loading', null, { timeout: 60000 });
        await t.page.waitForTimeout(300);
        await t.page.evaluate(() => window.__game.overlays.closeAll());
      };
      for (const s of tour) await go(s); // the first visit: each look baked once
      const per = [];
      for (const s of [...tour, ...tour]) {
        const b = await t.page.evaluate(() => window.__svgImages);
        await go(s);
        per.push((await t.page.evaluate(() => window.__svgImages)) - b);
      }
      expect(per.every((n) => n === 0), JSON.stringify(per)).toBe(true);
      expect(t.errors).toEqual([]);
    }, 300000);
  });
}
