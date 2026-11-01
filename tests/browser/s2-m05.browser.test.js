// @vitest-environment node
/**
 * Season 2, M2 — Mission 05 «ليلة الفوانيس» (s2-16), in REAL browsers with REAL touch input.
 * Synthetic saves only (a fresh profile per test). Played like a player, one route per run:
 *   Edge 320: office-cover=cover, jojo-confront=blunt, tree-tease=no   (the photograph alone)
 *   Edge 390: office-cover=truth, jojo-confront=gentle, tree-tease=yes (Sabri's memory, Jojo's map, Jojo there)
 *   WebKit 390: office-cover=truth, jojo-confront=blunt, tree-tease=yes
 *  - by day Lama takes her into the night; the night's arrival is acted out;
 *  - Lama's photograph comes into her hand; at the stand the panel opens: no help of any kind; every target
 *    is at least 44 px; no sideways scroll;
 *  - she picks lanterns up and hangs them by touch; the wall draws a ray per lantern; a wrong check is neutral
 *    (one of the shared lines, no number, her wall kept);
 *  - she rebuilds the night (the route decides what she starts with), the check solves it;
 *  - the night in order plays: the lanterns light one by one in the world; the card, the page, Ryan's "nine";
 *  - s2-16 completes in Season 2's own save; the original campaign's save stays byte-identical.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SHOTS = process.env.SHOTS_DIR || null; // where to keep screenshots (the playtest report), if set
const AFTER = [
  'intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'sp2-final-done',
  'act7-done', 'workshop-entered', 'wk-intro', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'notice:s2',
];
// Season 2: all of M1 and Missions 01–04 done
const S2_DONE = [
  ...['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11', 's2-12', 's2-13', 's2-14', 's2-15'].map((m) => `mission:${m}`),
  's2:in-archive', 's2:in-tree', 's2:in-caseroom', 's2:in-lamphouse', 's2:caseroom-open', 's2:board-1', 's2:board-2', 's2:02-counted', 's2:03-sorted',
];
const EVIDENCE = ['e-register', 'e-copy', 'e-count', 'e-blank', 'e-moved', 'e-note', 'e-whisper', 't-jojo', 'h-jojo', 'e-drift', 'e-receipt', 't-rabi', 'e-wax', 'e-versions', 'e-page', 'e-wrapper', 'e-oilcan', 'e-logbook', 'e-loft', 't-jojo-true'];
const NIGHT = { l1: 'h11', l2: 'h10', l3: 'h8', l4: 'h7', l5: 'h5', l6: 'h2', l7: 'h1' };
const ANSWER_WORDS = ['على الحلگة', 'بالحلگة', 'سبع ظلال', 'الثامن ما انعلّگ', 'ما چان بالشجرة'];
const STRICT_WRONG = ['ما ركبت. ارجعي للي لگيتيه وفكري مرة ثانية.', 'مو هيچ. خذي وقتچ.', 'بعد ما ركبت. اللي ضبطتيه بقى مثل ما هو.'];

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5218, strictPort: false, hmr: false } });
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

async function open(browser, { width, height }, route) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  contexts.push(ctx);
  await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('crash', () => errors.push('the page crashed'));
  // WebKit plays on the game's own animation frames: the dev-only timer loop (?timer=1) starves headless WebKit's
  // rendering on Windows until the page hangs (measured in tests/browser/s2-m02.browser.test.js); Edge keeps it
  const timer = browser.browserType().name() === 'webkit' ? '' : 'timer=1&';
  await page.goto(`${base}?${timer}scene=s2-tree&flags=${[...AFTER, ...S2_DONE].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 60000 });
  await page.evaluate(
    ({ ev, route: r }) => {
      const g = window.__game.game;
      for (const e of ev) g.collect(`s2.ev.${e}`);
      g.setFlag('husky-name', 'لولو');
      g.setFlag('s2:dec:office-cover', r.truth ? 'truth' : 'cover');
      g.setFlag('s2:dec:jojo-confront', r.gentle ? 'gentle' : 'blunt');
      if (r.gentle) g.setFlag('s2:14-hooks-map', true);
      g.setFlag('s2:dec:tree-tease', r.tease);
      history.replaceState(null, '', location.pathname);
    },
    { ev: EVIDENCE, route },
  );
  return { page, errors };
}
const centre = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.disabled || el.hidden) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height };
  }, sel);
async function press(t, sel) {
  const p = await centre(t.page, sel);
  expect(p, `${sel} is on screen and enabled`).toBeTruthy();
  await t.page.touchscreen.tap(p.x, p.y);
  await t.page.waitForTimeout(160);
}
/** Read a dialogue to its end. */
async function read(t) {
  for (let i = 0; i < 80; i++) {
    const s = await t.page.evaluate(() => (document.querySelector('.overlay-dialogue') ? 'next' : 'none'));
    if (s === 'none') return;
    await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
  }
  throw new Error('the dialogue did not end');
}
const actor = (t, id) => t.page.evaluate((i) => { const a = window.__game.screen.world.actor(i); return a && { x: Math.round(a.x), anim: a.anim, mood: a.mood, visible: a.visible, puffs: a.puffs.length }; }, id);
const playing = (page) => page.waitForFunction(() => window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay'), null, { timeout: 30000 });
/** Walk with the arrow keys until it is close, wait for the camera to settle, then a real tap on it. */
async function tapObject(t, x) {
  const dir = await t.page.evaluate((ox) => Math.sign(ox - window.__game.screen.world.player.x), x);
  if (dir !== 0) {
    const key = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
    await t.page.keyboard.down(key);
    await t.page
      .waitForFunction(([ox, d]) => { const w = window.__game.screen.world; return d > 0 ? w.player.x >= ox - 50 : w.player.x <= ox + 50; }, [x, dir], { timeout: 30000, polling: 50 })
      .finally(() => t.page.keyboard.up(key));
  }
  await t.page.evaluate(() => { window.__tapAt = null; });
  await t.page.waitForFunction(
    (ox) => {
      const w = window.__game.screen.world;
      const q = w.toScreen(ox, w.player.y - 50);
      const last = window.__tapAt;
      window.__tapAt = q;
      return q.x >= 0 && q.x <= innerWidth && q.y >= 0 && q.y <= innerHeight && last && Math.abs(q.x - last.x) < 0.5 && Math.abs(q.y - last.y) < 0.5;
    },
    x,
    { timeout: 10000, polling: 100 },
  );
  const p = await t.page.evaluate((ox) => { const w = window.__game.screen.world; return w.toScreen(ox, w.player.y - 50); }, x);
  expect(await t.page.evaluate(({ x: px, y: py }) => document.elementFromPoint(px, py)?.tagName, p), 'the world is under the tap').toBe('CANVAS');
  await t.page.touchscreen.tap(p.x, p.y);
  await t.page.waitForFunction(() => document.querySelector('.overlay'), null, { timeout: 30000 });
}
const sceneIs = (t, id) => t.page.waitForFunction((i) => window.__game.screen?.world?.scene?.id === i && window.__game.screen.world.mode !== 'loading', id, { timeout: 30000 });
const s2 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s2') || '{}'));
const mainSave = (page) => page.evaluate(() => localStorage.getItem('snooki-game:save'));
const shot = async (t, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));
const rays = (t) => t.page.evaluate(() => document.querySelectorAll('.shd-wall polygon').length);
const hungNow = (t) => t.page.evaluate(() => [...document.querySelectorAll('.shd-lantern.is-hung')].map((b) => b.dataset.lantern));

const RUNS = {
  chromium: [
    ['phone 320', 320, 640, { truth: false, gentle: false, tease: 'no' }],
    ['phone 390', 390, 844, { truth: true, gentle: true, tease: 'yes' }],
  ],
  webkit: [['phone 390', 390, 844, { truth: true, gentle: false, tease: 'yes' }]],
};

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Mission 05 «ليلة الفوانيس» in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    for (const [label, w, h, route] of RUNS[name]) {
      const routeName = `${route.truth ? 'truth' : 'cover'} × ${route.gentle ? 'gentle' : 'blunt'}`;
      it(`${label} (${routeName}): lanterns picked up and hung by touch; a neutral wrong check; solved; the night in order`, async () => {
        const t = await open(engine.browser, { width: w, height: h }, route);
        const tag = `${name}-${w}`;
        await playing(t.page);
        const before = await mainSave(t.page);

        // by day: Lama, at the tree, takes her into the night
        await tapObject(t, 290);
        await read(t);
        await sceneIs(t, 's2-tree-night');
        // the night's arrival, acted (Sabri wobbles on his ladder)
        await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 15000 });
        await read(t);
        await playing(t.page);
        expect(Boolean(await actor(t, 'jojo'))).toBe(route.gentle); // he comes only if she was kind to him

        // Lama's photograph, in her hand (and Sabri's memory, on the "truth" route: he walks to where Ryan stood)
        await tapObject(t, (await actor(t, 'lama')).x);
        const sabriAt = (await actor(t, 'sabri')).x;
        if (route.truth) {
          await t.page.waitForFunction(() => /ريان وگف هنا/.test(document.querySelector('.overlay-dialogue')?.textContent || ''), null, { timeout: 20000 }).catch(() => {});
        }
        let sabriWalked = false;
        for (let i = 0; i < 80; i++) {
          const open2 = await t.page.evaluate(() => Boolean(document.querySelector('.overlay-dialogue')));
          if (!open2) break;
          if (Math.abs((await actor(t, 'sabri')).x - sabriAt) > 40) sabriWalked = true;
          await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
        }
        expect(sabriWalked).toBe(route.truth);
        await playing(t.page);
        expect((await s2(t.page)).flags['s2:hold']).toBe('s2-photo');
        await shot(t, `${tag}-1-night`);

        // the stand: the panel opens
        await tapObject(t, 671);
        await read(t);
        await t.page.waitForSelector('.puzzle .shd', { timeout: 20000 });
        // no help of any kind; nothing on the panel names a position
        expect(await t.page.evaluate(() => document.querySelectorAll('[data-act="hint"], [data-act="solution"], [data-act="skip"], [data-hint]').length)).toBe(0);
        const panelText = await t.page.evaluate(() => document.querySelector('.puzzle').textContent);
        for (const word of ANSWER_WORDS) expect(panelText.includes(word), word).toBe(false);
        // 44 px targets; no sideways scroll; no two hooks overlap
        for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.shd-hook, .shd-lantern, .puzzle [data-check]')].map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }))) {
          expect(b[0]).toBeGreaterThanOrEqual(44);
          expect(b[1]).toBeGreaterThanOrEqual(44);
        }
        const hooks = await t.page.evaluate(() => [...document.querySelectorAll('.shd-hook')].map((x) => { const r = x.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }));
        for (let i = 0; i < hooks.length; i++) for (let j = i + 1; j < hooks.length; j++) expect(Math.hypot(hooks[i][0] - hooks[j][0], hooks[i][1] - hooks[j][1])).toBeGreaterThanOrEqual(44);
        expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        // what she starts with: Sabri's two (truth), or nothing; Jojo's marks (gentle), or none
        const given = await hungNow(t);
        expect(given.sort()).toEqual(route.truth ? ['l6', 'l7'] : []);
        expect(await rays(t)).toBe(given.length);
        expect(await t.page.evaluate(() => document.querySelectorAll('.shd-wall [stroke="#f3efe6"]').length)).toBe(route.gentle ? 7 : 0);
        await shot(t, `${tag}-2-panel`);

        // pick the eighth up and hang it: it lights and throws a ray
        await press(t, '.shd-lantern[data-lantern="l8"]');
        expect(await t.page.evaluate(() => document.querySelector('.shd-lantern[data-lantern="l8"]').getAttribute('aria-pressed'))).toBe('true');
        await press(t, '.shd-hook[data-hook="h3"]');
        expect(await rays(t)).toBe(given.length + 1);
        // a wrong check: a shared neutral line, no number, her wall kept
        await press(t, '.puzzle [data-check]');
        const fb = await t.page.evaluate(() => document.querySelector('.puzzle-feedback').textContent);
        expect(STRICT_WRONG).toContain(fb);
        expect(fb).not.toMatch(/[0-9٠-٩]/);
        expect(await rays(t)).toBe(given.length + 1);
        await shot(t, `${tag}-3-wrong`);
        // take it down again (a tap on its hook), back to the basket
        await press(t, '.shd-hook[data-hook="h3"]');
        await press(t, '.puzzle [data-down]');
        expect(await rays(t)).toBe(given.length);

        // the night, lantern by lantern (by touch)
        for (const [l, hk] of Object.entries(NIGHT)) {
          if (given.includes(l)) continue;
          await press(t, `.shd-lantern[data-lantern="${l}"]`);
          await press(t, `.shd-hook[data-hook="${hk}"]`);
        }
        expect(await rays(t)).toBe(7);
        await shot(t, `${tag}-4-matched`);
        await press(t, '.puzzle [data-check]');
        await t.page.waitForSelector('.puzzle.is-solved', { timeout: 15000 });
        await press(t, '.panel-foot .btn-primary');

        // the night in order: read through it; the lanterns light in the world one by one
        let litSeen = 0;
        for (let i = 0; i < 30; i++) {
          await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue') || JSON.parse(localStorage.getItem('snooki-game:s2') || '{}').collected?.includes('s2.ev.e-surprise'), null, { timeout: 30000 });
          const lit = (await s2(t.page)).flags['s2:16-lit'] || 0;
          if (lit > litSeen) litSeen = lit;
          if (lit === 7 && !(await t.page.evaluate(() => window.__shotLit))) {
            await t.page.evaluate(() => { window.__shotLit = true; });
            await shot(t, `${tag}-5-lit`);
          }
          if ((await s2(t.page)).collected?.includes('s2.ev.e-surprise') && !(await t.page.evaluate(() => document.querySelector('.overlay-dialogue')))) break;
          await read(t);
        }
        await playing(t.page);
        const doc = await s2(t.page);
        expect(litSeen).toBe(7);
        expect(doc.flags['s2:16-placed']).toBe(true);
        expect(doc.collected).toEqual(expect.arrayContaining(['s2.ev.f-photo', 's2.ev.d-timeline', 's2.ev.e-surprise']));
        expect(doc.flags['mission:s2-16']).toBe(true);
        expect(doc.flags['s2:hold']).toBeFalsy();

        // the mission's end card; dismissed as a player would; then back at the stand: the night, rebuilt
        await t.page.waitForSelector('.guide-card [data-ok]', { timeout: 15000 }).then(() => press(t, '.guide-card [data-ok]')).catch(() => {});
        await t.page.waitForFunction(() => !document.querySelector('.guide-card'), null, { timeout: 15000 });
        await tapObject(t, 671);
        await t.page.waitForFunction(() => /الحامل وظلاله/.test(document.querySelector('.overlay-dialogue')?.textContent || ''), null, { timeout: 15000 });
        await shot(t, `${tag}-6-after`);
        await read(t);
        expect(await mainSave(t.page)).toBe(before); // the original campaign's save: byte-identical
        expect(t.errors).toEqual([]);
      }, 420000);
    }
  });
}
