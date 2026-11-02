// @vitest-environment node
/**
 * Season 2, M2 — Mission 03 «قصص جوجو الثلاث» (s2-14), in REAL browsers with REAL touch input.
 * Synthetic saves only (a fresh profile per test). Played like a player:
 *  - Uncle Jojo notices her and turns; tapping him, his face follows his lines; his first version is ACTED
 *    OUT behind the testimony bar; no help of any kind; a wrong piece of evidence: he shrugs it off, nothing
 *    says how close;
 *  - she leaves to look: lifts the oil can (a strain, dust); the can breaks version 1 (he shakes and sweats,
 *    her sister walks in); the garden clock she set in M1 breaks version 2;
 *  - version 3 needs what is in the loft: she takes the hand lamp, climbs the ladder; the loft is dark until
 *    she hangs the lamp; then the logbook and the eighth lantern; back down, the logbook breaks version 3;
 *  - his truth; she answers bluntly; when she comes back he remembers;
 *  - s2-14 completes in Season 2's own save; the original campaign's save stays byte-identical.
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
// Season 2: all of M1, Mission 01 and Mission 02 done; the evidence M1 gives (the clock was set in s2-08)
const S2_DONE = [
  ...['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11', 's2-12', 's2-13'].map((m) => `mission:${m}`),
  's2:in-archive', 's2:in-tree', 's2:in-caseroom', 's2:in-lamphouse', 's2:caseroom-open', 's2:board-1', 's2:board-2',
];
const EVIDENCE = ['e-register', 'e-copy', 'e-count', 'e-blank', 'e-moved', 'e-note', 'e-whisper', 't-jojo', 'h-jojo', 'e-drift', 'e-receipt', 't-rabi'];
const ANSWER_WORDS = ['مليانة', 'ختم سليم', 'ما انقدّمت', 'چانت عشرة', 'دفترك', 'الدفتر بالعلّية'];

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5216, strictPort: false, hmr: false } });
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

async function open(browser, { width, height }) {
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
  await page.goto(`${base}?${timer}scene=s2-lamphouse&flags=${[...AFTER, ...S2_DONE].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 60000 });
  await page.evaluate((ev) => {
    for (const e of ev) window.__game.game.collect(`s2.ev.${e}`);
    window.__game.game.setFlag('husky-name', 'لولو');
    window.__game.game.setFlag('s2:dec:jojo-why', 'ask');
    history.replaceState(null, '', location.pathname);
  }, EVIDENCE);
  return { page, errors };
}
const centre = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.disabled || el.hidden) return null;
    // (inline 'nearest': 'center' would scroll the right-to-left game root sideways — a test artefact, not play)
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
/** Read a dialogue to its end; `pick` chooses an option index when a choice comes. */
async function read(t, pick = 0) {
  for (let i = 0; i < 80; i++) {
    const s = await t.page.evaluate(() => {
      const d = document.querySelector('.overlay-dialogue');
      if (!d) return 'none';
      return d.querySelector('.dlg-choices button') ? 'choice' : 'next';
    });
    if (s === 'none') return;
    if (s === 'choice') await press(t, `.overlay-dialogue .dlg-choices button:nth-child(${pick + 1})`);
    else await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
  }
  throw new Error('the dialogue did not end');
}
const actor = (t, id) => t.page.evaluate((i) => { const a = window.__game.screen.world.actor(i); return a && { x: Math.round(a.x), anim: a.anim, mood: a.mood, facing: a.facing, visible: a.visible, puffs: a.puffs.length, jolt: Boolean(a.jolt) }; }, id);
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
/** Walk left out of the place (its exit), until the next one is playing. */
async function walkOut(t, to) {
  await t.page.keyboard.down('ArrowLeft');
  await t.page.waitForFunction((id) => window.__game.screen?.world?.scene?.id === id && window.__game.screen.world.mode !== 'loading', to, { timeout: 30000, polling: 100 }).finally(() => t.page.keyboard.up('ArrowLeft'));
}
const sceneIs = (t, id) => t.page.waitForFunction((i) => window.__game.screen?.world?.scene?.id === i && window.__game.screen.world.mode !== 'loading', id, { timeout: 30000 });
const tm = (t) => t.page.evaluate(() => {
  const el = document.querySelector('.overlay-testimony .tm');
  return el && { who: el.querySelector('.tm-who').textContent, line: el.querySelector('.tm-line').textContent, feedback: el.querySelector('.tm-feedback').textContent, help: el.querySelectorAll('[data-hint], .tm-hints').length };
});
const waitTm = (t) => t.page.waitForFunction(() => document.querySelector('.overlay-testimony .tm [data-present]:not([disabled])'), null, { timeout: 30000 });
/** Step to a statement by the bar's arrows (each one is acted out again). */
async function toBeat(t, n) {
  for (let i = 0; i < 6; i++) {
    const at = await t.page.evaluate(() => [...document.querySelector('.tm-dots').textContent.replace(/\s/g, '')].indexOf('●'));
    if (at === n) return;
    await press(t, at < n ? '.tm [data-next]' : '.tm [data-prev]');
    await waitTm(t);
  }
}
async function present(t, ev) {
  await press(t, '.tm [data-present]');
  await press(t, `.tm-chip[data-ev="${ev}"]`);
}
const s2 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s2') || '{}'));
const mainSave = (page) => page.evaluate(() => localStorage.getItem('snooki-game:save'));
const shot = async (t, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Mission 03 «قصص جوجو الثلاث» in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    const VIEWS = name === 'webkit' ? [['phone 390', 390, 844]] : [['phone 320', 320, 640], ['phone 390', 390, 844]];
    for (const [label, w, h] of VIEWS) {
      it(`${label}: three versions played by touch — staged, no help, broken by evidence she finds (the loft by lamplight); the choice is remembered`, async () => {
        const t = await open(engine.browser, { width: w, height: h });
        const tag = `${name}-${w}`;
        await playing(t.page);
        const before = await mainSave(t.page);
        expect(await actor(t, 'jojo')).toMatchObject({ mood: 'thinking', anim: 'thinking' }); // at work, thinking

        // he notices her and turns to her; tapping him: his face follows his lines; then his story is acted out
        await tapObject(t, 640);
        expect((await actor(t, 'jojo')).mood).toBe('smile');
        await read(t);
        await waitTm(t);
        let bar = await tm(t);
        expect(bar.who).toMatch(/النسخة الأولى/);
        expect((await actor(t, 'jojo')).x).toBeLessThan(560); // he walked to the bench for his first line
        for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.tm button')].filter((x) => !x.closest('[hidden]')).map((x) => Math.round(x.getBoundingClientRect().height)))) expect(b).toBeGreaterThanOrEqual(44);
        expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await shot(t, `${tag}-1-testimony`);

        // no help but the guide (owner's final brief): no old hint button or list; the guide's one button,
        // closed until she asks; nothing on the bar gives an answer
        expect(bar.help).toBe(0);
        expect(await t.page.evaluate(() => [...document.querySelectorAll('.tm button')].filter((b) => /تلميح/.test(b.textContent)).map((b) => b.dataset.act))).toEqual(['guide']);
        expect(await t.page.evaluate(() => document.querySelector('.tm .puzzle-guide').hidden)).toBe(true);
        const barText = await t.page.evaluate(() => document.querySelector('.tm').textContent);
        for (const word of ANSWER_WORDS) expect(barText.includes(word), word).toBe(false);

        // a wrong piece of evidence: he shrugs it off; nothing says how close; still version 1
        await present(t, 'e-register');
        await read(t);
        bar = await tm(t);
        expect(bar.who).toMatch(/النسخة الأولى/);
        expect(bar.feedback).not.toMatch(/[0-9٠-٩]/);

        // she goes to look: the bar can be left; the version she reached is kept
        await press(t, '.tm [data-leave]');
        await read(t);
        await playing(t.page);
        // the oil can: she lifts it (a strain), what she finds is hers
        await tapObject(t, 1200);
        await t.page.waitForTimeout(250);
        expect((await actor(t, 'anji')).anim).toBe('crouch');
        await shot(t, `${tag}-2-oil`);
        await read(t);
        expect((await s2(t.page)).collected).toContain('s2.ev.e-oilcan');
        await playing(t.page);

        // back to Jojo: version 1 breaks on the can — he shakes and sweats, her sister comes in
        await tapObject(t, (await actor(t, 'jojo')).x);
        await read(t);
        await waitTm(t);
        await toBeat(t, 1);
        await present(t, 'e-oilcan');
        await t.page.waitForTimeout(300);
        expect((await actor(t, 'jojo')).puffs).toBeGreaterThan(0);
        await read(t);
        await t.page.waitForFunction(() => window.__game.screen.world.actor('sister')?.visible, null, { timeout: 15000 });
        expect((await tm(t)).who).toMatch(/النسخة الأولى/); // the bar shows the version that broke while it is acted out
        await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 15000 });
        const seen = await t.page.evaluate(() => { const wd = window.__game.screen.world; const sis = wd.actor('sister'); const p = wd.toScreen(sis.x, sis.y - 50); return { inView: p.x > 0 && p.x < innerWidth, apart: Math.abs(sis.x - wd.player.x) }; });
        expect(seen.inView).toBe(true);
        expect(seen.apart).toBeGreaterThanOrEqual(50);
        await shot(t, `${tag}-3-sister`);
        await read(t);
        await waitTm(t);
        expect((await tm(t)).who).toMatch(/النسخة الثانية/);

        // version 2 breaks on the garden clock she set in M1; version 3 begins — she has nothing for it yet
        await toBeat(t, 1);
        await present(t, 'e-drift');
        await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 15000 });
        await read(t);
        await waitTm(t);
        expect((await tm(t)).who).toMatch(/النسخة الثالثة/);
        await press(t, '.tm [data-leave]');
        await read(t);
        await playing(t.page);

        // the hand lamp (in her hand, it glows), then the ladder to the loft
        await tapObject(t, 500);
        await read(t);
        expect((await s2(t.page)).flags['s2:hold']).toBe('s2-lamp');
        await playing(t.page);
        await tapObject(t, 1100);
        await read(t);
        await sceneIs(t, 's2-loft');
        // her first look around (it opens as she steps in)
        await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 15000 });
        await read(t);
        await playing(t.page);
        await shot(t, `${tag}-4-loft-dark`);
        // the lamp on the hook: the shelf and the far corner come out of the dark
        await tapObject(t, 420);
        await read(t);
        expect((await s2(t.page)).flags['s2:14-shelf-lit']).toBe(true);
        await playing(t.page);
        await tapObject(t, 560);
        await read(t);
        await playing(t.page);
        await tapObject(t, 740);
        await read(t);
        await shot(t, `${tag}-5-loft-lit`);
        let doc = await s2(t.page);
        expect(doc.collected).toEqual(expect.arrayContaining(['s2.ev.e-logbook', 's2.ev.e-loft']));
        await playing(t.page);

        // down again; version 3 breaks on the logbook; his truth; she answers bluntly
        await walkOut(t, 's2-lamphouse');
        await playing(t.page);
        await tapObject(t, (await actor(t, 'jojo')).x);
        await read(t);
        await waitTm(t);
        expect((await tm(t)).who).toMatch(/النسخة الثالثة/);
        await toBeat(t, 1);
        await present(t, 'e-logbook');
        for (let i = 0; i < 6; i++) {
          await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue') || JSON.parse(localStorage.getItem('snooki-game:s2') || '{}').flags?.['s2:dec:jojo-confront'], null, { timeout: 20000 });
          await read(t, 1);
          if ((await s2(t.page)).flags?.['s2:dec:jojo-confront']) break;
        }
        expect(await t.page.evaluate(() => document.querySelector('.overlay-testimony'))).toBeNull();
        await playing(t.page);
        doc = await s2(t.page);
        expect(doc.flags['mission:s2-14']).toBe(true);
        expect(doc.flags['s2:dec:jojo-confront']).toBe('blunt');
        expect(doc.collected).toContain('s2.ev.t-jojo-true');
        await shot(t, `${tag}-6-truth`);

        // the mission's end: the guide card says what is next; she dismisses it (as a player would)
        await t.page.waitForSelector('.guide-card [data-ok]', { timeout: 15000 });
        await press(t, '.guide-card [data-ok]');
        await t.page.waitForFunction(() => !document.querySelector('.guide-card'), null, { timeout: 15000 });
        // the choice is remembered when she comes back to him
        await tapObject(t, (await actor(t, 'jojo')).x);
        await t.page.waitForFunction(() => /راضية/.test(document.querySelector('.overlay-dialogue')?.textContent || ''), null, { timeout: 15000 }); // his line reads her blunt answer
        await read(t);

        expect(await mainSave(t.page)).toBe(before); // the original campaign's save: byte-identical
        expect(t.errors).toEqual([]);
      }, 360000);
    }
  });
}
