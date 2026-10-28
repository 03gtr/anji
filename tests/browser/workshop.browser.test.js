// @vitest-environment node
/**
 * The workshop and the deep garden's false trails in a REAL browser, with REAL input (touch on a
 * phone, keyboard and mouse on desktop). Synthetic saves only (a fresh profile per test).
 *
 *  - in and out of the workshop like a player: the map, an object, the stairs, back in, a reload;
 *  - REGRESSION (a player stuck until she closed the game): a place that cannot be built (its sprite
 *    images fail, as when a phone runs short of memory) left an endless loading bar, and a minigame
 *    whose code could not load left a blank screen whose only button did nothing. Both now say so and
 *    offer a way on;
 *  - every scene now hands its canvas memory back when it ends (phones cap it, and close the page —
 *    a white screen — when old scenes' canvases are still waiting to be collected);
 *  - REGRESSION (seen on a real phone): «حديقة الآثار الكاذبة» — every clue examined, «أي أثر؟» still
 *    waited for ever; now it opens, the investigation completes and the next place opens on the map.
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
/** After the ending, the workshop open (Act VI and the archives' seals), Ryan's box opened. */
const AFTER = [
  'intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'sp2-final-done',
  'act7-done', 'workshop-entered', 'wk-intro', 't.workshop.enter', 't.workshop.machine', 'final-entered', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'dg-box', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team',
];
/** Act VI done, the workshop's machine not started yet (its first stage is the pipes minigame). */
const MACHINE = ['intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'workshop-entered', 'wk-intro', 't.workshop.enter', 't.workshop.machine'];

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5203, strictPort: false, hmr: false } });
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

/**
 * A fresh profile at `scene` with `flags`, then the address bar is cleaned so a reload continues the
 * save (as for a player). Optionally: sprite images fail while `window.__failImages` is set, and every
 * canvas made is remembered (to see what is never handed back).
 */
async function open({ phone, scene, flags, items = [], journal = [] }) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 720 } });
  contexts.push(ctx);
  await ctx.addInitScript(() => {
    localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false }));
    const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', { ...desc, set(v) { if (window.__failImages && String(v).startsWith('data:image/svg')) { setTimeout(() => this.onerror?.(new Event('error')), 5); return; } desc.set.call(this, v); } });
    window.__canvases = [];
    const OC = window.OffscreenCanvas;
    if (OC) window.OffscreenCanvas = class extends OC { constructor(w, h) { super(w, h); window.__canvases.push(this); } };
    const make = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...rest) { const el = make.call(this, tag, ...rest); if (String(tag).toLowerCase() === 'canvas') window.__canvases.push(el); return el; };
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}?timer=1&scene=${scene}&flags=${flags.join(',')}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 20000 });
  await page.evaluate(([items, journal]) => { window.__game.game.setFlag('husky-name', 'لولو'); items.forEach((i) => window.__game.game.addItem(i)); journal.forEach((j) => window.__game.game.addJournal(j)); history.replaceState(null, '', location.pathname); }, [items, journal]);
  await page.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 20000 }).catch(() => {});
  const cdp = phone ? await ctx.newCDPSession(page) : null;
  return { page, cdp, errors, phone };
}
// (scrolled into view first, as she would scroll a long puzzle on a phone)
const centre = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
/** A real tap (phone) or click (desktop) on an element. */
async function press(t, sel) {
  const p = await centre(t.page, sel);
  expect(p, `${sel} is on screen`).toBeTruthy();
  if (t.phone) await t.page.touchscreen.tap(p.x, p.y);
  else await t.page.mouse.click(p.x, p.y);
  await t.page.waitForTimeout(120);
}
const sceneId = (page) => page.evaluate(() => window.__game.screen?.world?.scene?.id ?? null);
const playing = (page) => page.waitForFunction(() => window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay'), null, { timeout: 15000 });
const prompt = (page) => page.evaluate(() => document.querySelector('.pad-interact .pad-label')?.textContent ?? '');
/** Hold a direction (the pad on a phone, an arrow key on desktop) until `done()` holds. */
async function walk(t, dir, done, ms = 20000) {
  const key = dir === 'right' ? 'ArrowRight' : 'ArrowLeft';
  const p = { ...(await centre(t.page, `.pad-btn[data-input="${dir}"]`)), id: 7 };
  if (t.phone) await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
  else await t.page.keyboard.down(key);
  const t0 = Date.now();
  let ok = false;
  while (Date.now() - t0 < ms && !(ok = await done())) await t.page.waitForTimeout(40);
  if (t.phone) await t.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [p] });
  else await t.page.keyboard.up(key);
  return ok;
}
/** Examine what is in front of her: «فحص» (a tap) or E. */
async function examine(t) {
  if (t.phone) await press(t, '.pad-interact');
  else await t.page.keyboard.press('KeyE');
  await t.page.waitForTimeout(300);
}
/** Read the open dialogue to its end with «التالي». */
async function read(t) {
  for (let i = 0; i < 60 && (await t.page.$('.overlay-dialogue')); i++) {
    if (await t.page.$('.overlay-dialogue .dlg-nextbtn')) await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
    else await t.page.waitForTimeout(100);
  }
  expect(await t.page.$('.overlay-dialogue')).toBeNull();
}
/** Through the map, like a player: the map button, the page, the place. */
async function travel(t, world, region) {
  await press(t, '[data-act="map"]');
  await t.page.waitForSelector('.map-board .map-node');
  if (region) await press(t, `.map-regions [data-region="${region}"]`);
  await t.page.evaluate(() => (window.__old = window.__game.screen?.world));
  await press(t, `.map-node[data-world="${world}"]`);
}
const arrived = (page, scene) => page.waitForFunction((s) => { const w = window.__game.screen?.world; return w && w !== window.__old && w.scene.id === s && w.mode === 'play'; }, scene, { timeout: 15000 });
const save = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:save')));

describe.skipIf(!browser)(`the workshop and the false trails in a real browser${browser ? '' : ` (skipped: ${unavailable})`}`, () => {
  for (const phone of [true, false]) {
    it(`${phone ? 'phone' : 'desktop'}: into the workshop from the map, an object, out by the stairs, back in, a reload — the place every time, nothing twice`, async () => {
      const t = await open({ phone, scene: 'house', flags: AFTER, journal: ['dg-box'] });
      await travel(t, 'workshop');
      await arrived(t.page, 'workshop');
      expect(await t.page.evaluate(() => ({ canvas: Boolean(document.querySelector('.world-canvas')), loading: Boolean(document.querySelector('.loading')) }))).toEqual({ canvas: true, loading: false });
      // Ryan's box (already opened): walk to it, examine, read
      expect(await walk(t, 'right', async () => (await prompt(t.page)) === 'علبة البذرة الأخيرة')).toBe(true);
      await examine(t);
      await t.page.waitForSelector('.overlay-dialogue');
      await read(t);
      await playing(t.page);
      // out by the stairs (the left edge)
      expect(await walk(t, 'left', async () => (await sceneId(t.page)) === 'house', 25000)).toBe(true);
      await playing(t.page);
      // back in, and stay a while (her place is saved when she stands still), then a reload
      await travel(t, 'workshop');
      await arrived(t.page, 'workshop');
      await t.page.waitForFunction(() => JSON.parse(localStorage.getItem('snooki-game:save')).location?.scene === 'workshop', null, { timeout: 15000 });
      await t.page.reload({ waitUntil: 'load' });
      await t.page.waitForTimeout(1200);
      const cont = await t.page.$('button:has-text("كمّلي")');
      if (cont) await press(t, '.title button.btn-primary').catch(() => cont.click());
      await t.page.waitForFunction(() => window.__game?.screen?.world?.scene?.id === 'workshop' && window.__game.screen.world.mode === 'play', null, { timeout: 20000 });
      const s = await save(t.page);
      expect((s.journal || []).filter((j) => j === 'dg-box')).toHaveLength(1);
      expect(s.flags['husky-name']).toBe('لولو');
      expect(t.errors).toEqual([]);
    }, 150000);
  }

  it('phone: a place that cannot be built says so and offers a way on; «رجوع للخريطة» and «جرّبي مرة ثانية» both work (REGRESSION: an endless loading bar)', async () => {
    const t = await open({ phone: true, scene: 'house', flags: AFTER });
    await t.page.evaluate(() => (window.__failImages = true));
    await travel(t, 'workshop');
    await t.page.waitForSelector('.scene-error', { timeout: 15000 });
    expect(await t.page.evaluate(() => document.querySelector('.scene-error').textContent)).toMatch(/ورشة الأشياء المفقودة[\s\S]*تقدمچ محفوظ/);
    expect((await save(t.page)).location.scene).toBe('house'); // her saved place is still the one before
    await press(t, '.scene-error [data-away]');
    await t.page.waitForSelector('.map-board .map-node');
    await t.page.evaluate(() => (window.__failImages = false));
    await press(t, '.map-node[data-world="workshop"]');
    await t.page.waitForFunction(() => window.__game.screen?.world?.scene?.id === 'workshop' && window.__game.screen.world.mode === 'play', null, { timeout: 15000 });
    // and «جرّبي مرة ثانية»: fails, then the trouble passes, she tries again
    await t.page.evaluate(() => (window.__failImages = true));
    await travel(t, 'house');
    await t.page.waitForSelector('.scene-error', { timeout: 15000 });
    await t.page.evaluate(() => (window.__failImages = false));
    await press(t, '.scene-error [data-retry]');
    await t.page.waitForFunction(() => window.__game.screen?.world?.scene?.id === 'house' && window.__game.screen.world.mode === 'play', null, { timeout: 15000 });
    expect(t.errors).toEqual([]); // logged as console errors, never left uncaught
  }, 120000);

  it('phone: the machine\'s minigame cannot load — it says so; «رجوع للمغامرة» brings her back to play (REGRESSION: a blank screen, no way out)', async () => {
    const t = await open({ phone: true, scene: 'workshop', flags: MACHINE, items: ['map-1', 'map-2', 'map-3', 'blue-thread'] });
    await t.page.route(/\/src\/game\/minigames\/pipes\.js/, (r) => r.abort());
    expect(await walk(t, 'right', async () => (await prompt(t.page)) === 'ماكينة الأشياء المفقودة', 25000)).toBe(true);
    await examine(t);
    await t.page.waitForSelector('.overlay-dialogue');
    await read(t);
    await t.page.waitForSelector('.overlay-game button:has-text("يلا نبدي")');
    await press(t, '.overlay-game .mg-layer .btn-primary');
    await t.page.waitForSelector('.overlay-game [role="alert"]', { timeout: 10000 });
    expect(await t.page.evaluate(() => document.querySelector('.overlay-game [role="alert"]').textContent)).toMatch(/ما گدرت أفتح هاللعبة هسه/);
    await press(t, '.overlay-game [data-act="exit"]');
    await t.page.waitForFunction(() => !document.querySelector('.overlay-game'), null, { timeout: 8000 });
    for (let i = 0; i < 20 && (await t.page.$('.overlay-dialogue')); i++) await read(t);
    await playing(t.page);
    // she can move again
    const x0 = await t.page.evaluate(() => window.__game.screen.world.player.x);
    await walk(t, 'left', async () => (await t.page.evaluate(() => window.__game.screen.world.player.x)) < x0 - 40, 5000);
    expect(await t.page.evaluate(() => window.__game.screen.world.player.x)).toBeLessThan(x0 - 40);
    expect(t.errors).toEqual([]);
  }, 120000);

  it('scene memory is handed back: after many trips the canvases still holding memory stay at about one scene\'s worth', async () => {
    const t = await open({ phone: true, scene: 'house', flags: AFTER });
    const live = () => t.page.evaluate(() => Math.round(window.__canvases.reduce((n, c) => n + c.width * c.height, 0) / 1e6));
    const go = async (scene) => {
      await t.page.evaluate((s) => { window.__old = window.__game.screen.world; window.__game.go(s, { spawnX: 300 }); }, scene);
      await arrived(t.page, scene);
      await t.page.waitForTimeout(300);
    };
    await go('workshop');
    const one = await live();
    for (let i = 0; i < 6; i++) {
      await go('house');
      await go('workshop');
    }
    const after = await live();
    expect(one).toBeGreaterThan(0);
    expect(after).toBeLessThan(one * 1.6); // REGRESSION: grew with every trip (about one scene each)
  }, 120000);

  it('phone: «حديقة الآثار الكاذبة», played by hand — every clue, a wrong trail refused, the true one; the next place opens (REGRESSION: the board waited for ever)', async () => {
    const t = await open({ phone: true, scene: 'workshop', flags: AFTER });
    await travel(t, 'falsetrails', 'deep');
    await arrived(t.page, 'falsetrails').catch(() => {}); // the arrival line starts at the entrance
    await t.page.waitForSelector('.overlay-dialogue', { timeout: 10000 });
    await read(t);
    await playing(t.page);
    const clues = ['گرابة مسنودة', 'أثر عريض', 'خطوط متساوية', 'كفوف صغيرة'];
    for (const label of clues) {
      expect(await walk(t, 'right', async () => (await prompt(t.page)) === label, 20000), label).toBe(true);
      await examine(t);
      await t.page.waitForSelector('.overlay-dialogue');
      await read(t);
      await playing(t.page);
    }
    expect(await walk(t, 'right', async () => (await prompt(t.page)) === 'أي أثر؟', 20000)).toBe(true);
    await examine(t);
    for (let i = 0; i < 20 && !(await t.page.$('[data-suspect]')); i++) {
      if (await t.page.$('.overlay-dialogue .dlg-nextbtn')) await press(t, '.overlay-dialogue .dlg-nextbtn');
      else await t.page.waitForTimeout(150);
    }
    await t.page.waitForSelector('[data-suspect]', { timeout: 5000 });
    // wrong: the even lines with the dust and the rake
    await press(t, '[data-suspect="even"]');
    await press(t, '[data-evidence="dust"]');
    await press(t, '[data-evidence="rake"]');
    await press(t, '[data-submit]');
    await t.page.waitForTimeout(400);
    expect((await save(t.page)).flags['dg-trails']).toBeFalsy();
    // the true trail: the small paws, wet, with the crumbs (each card tapped only if it is not already as wanted)
    await press(t, '[data-suspect="paws"]');
    for (const [id, want] of [['dust', false], ['rake', false], ['pond', false], ['wet', true], ['crumbs', true]]) {
      if ((await t.page.getAttribute(`[data-evidence="${id}"]`, 'aria-pressed')) !== String(want)) await press(t, `[data-evidence="${id}"]`);
    }
    expect(await t.page.evaluate(() => [...document.querySelectorAll('[data-evidence][aria-pressed="true"]')].map((b) => b.dataset.evidence).sort())).toEqual(['crumbs', 'wet']);
    await press(t, '[data-submit]');
    await t.page.waitForFunction(() => JSON.parse(localStorage.getItem('snooki-game:save')).flags['dg-trails'] === true, null, { timeout: 8000 });
    for (let i = 0; i < 30 && (await t.page.$('.overlay')); i++) {
      const b = (await t.page.$('.overlay-dialogue .dlg-nextbtn')) ? '.overlay-dialogue .dlg-nextbtn' : (await t.page.$('.puzzle .btn-big')) ? '.puzzle .btn-big' : null;
      if (b) await press(t, b);
      else await t.page.waitForTimeout(150);
    }
    await playing(t.page);
    const s = await save(t.page);
    expect((s.journal || []).filter((j) => j === 'dg-trails')).toHaveLength(1);
    // the next place: open on the map's deep page
    await press(t, '[data-act="map"]');
    await t.page.waitForSelector('.map-board .map-node');
    await press(t, '.map-regions [data-region="deep"]');
    expect(await t.page.evaluate(() => document.querySelector('.map-node[data-world="hyporoom"]').classList.contains('is-open'))).toBe(true);
    expect(t.errors).toEqual([]);
  }, 180000);
});
