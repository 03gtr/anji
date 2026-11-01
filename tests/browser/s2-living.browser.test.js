// @vitest-environment node
/**
 * Season 2, M2 — Mission 01 «سر المكتب» in REAL browsers with REAL touch (Edge 320/390, WebKit 390).
 * A synthetic save (M1 finished) in a fresh profile per test, played like a player:
 *  - Lama walks with her; the office's papers (the coffee rota, the calendar); Sabri guards his screen;
 *  - the sticky note: she is CAUGHT while he watches; Lama goes to keep him talking; she reads it only in the
 *    moments he looks away (a timing window in the world);
 *  - the slip and the printer: Sabri runs, the printer shakes and throws papers, he sways and throws his hands up;
 *  - four papers back to the tray, one at a time (she carries them); her choice: cover for him, or the truth;
 *  - the board «منو گال شنو» filled by taps (no skip, no "show the answer"); Ryan walks in — what he finds
 *    depends on her choice; the mission completes in Season 2's save; the original save stays byte-identical.
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
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'notice:s2',
];
const M1 = Array.from({ length: 11 }, (_, i) => `mission:s2-${String(i + 1).padStart(2, '0')}`);
// the board, by taps: each cell cycles its options from empty (who: ريان, صبري, لمى · to: صبري, لمى, برا · said: سكوت, عيادة, يخبي)
const ANSWER = { sun: { who: 1, to: 1, said: 1 }, mon: { who: 2, to: 2, said: 2 }, tue: { who: 3, to: 3, said: 3 } };

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5217, strictPort: false, hmr: false } });
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
  await page.goto(`${base}?${timer}scene=s2-office&flags=${[...AFTER, ...M1].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world, null, { timeout: 60000 });
  // a finished original campaign: every act objective done (as a real finished save has it), so the HUD
  // follows the Season 2 mission of the place she is in
  // (as a string: the test runner would rewrite an import() inside a function)
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
  return { page, errors };
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
async function read(t, pick = 0) {
  for (let i = 0; i < 90; i++) {
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
/** Read on through dialogues that follow each other (a cutscene with lines in between), until play returns. */
async function readAll(t, pick = 0) {
  for (let i = 0; i < 12; i++) {
    await read(t, pick);
    const done = await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue') || window.__game.screen.world.mode === 'play', null, { timeout: 20000 }).then(() => t.page.evaluate(() => !document.querySelector('.overlay-dialogue')));
    if (done) return;
  }
}
const actor = (t, id) => t.page.evaluate((i) => { const a = window.__game.screen.world.actor(i); return a && { x: Math.round(a.x), anim: a.anim, mood: a.mood, facing: a.facing, visible: a.visible, companion: a.companion, puffs: a.puffs.length }; }, id);
const playing = (page) => page.waitForFunction(() => window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay'), null, { timeout: 30000 });
const flag = (t, id) => t.page.evaluate((i) => window.__game.game.flag(i), id);
const has = (t, id) => t.page.evaluate((i) => window.__game.game.has(i), id);
/** Walk close (arrow keys), wait for the camera to settle, then a real tap on it — the world under the finger. */
async function tapObject(t, x, { wait = true, walk = true } = {}) {
  const dir = await t.page.evaluate((ox) => Math.sign(ox - window.__game.screen.world.player.x), x);
  if (walk && dir !== 0 && Math.abs(x - (await t.page.evaluate(() => window.__game.screen.world.player.x))) > 40) {
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
      return q.x >= 0 && q.x <= innerWidth && last && Math.abs(q.x - last.x) < 0.5 && Math.abs(q.y - last.y) < 0.5;
    },
    x,
    { timeout: 10000, polling: 100 },
  );
  const p = await t.page.evaluate((ox) => { const w = window.__game.screen.world; return w.toScreen(ox, w.player.y - 50); }, x);
  expect(await t.page.evaluate(({ x: px, y: py }) => document.elementFromPoint(px, py)?.tagName, p), 'the world is under the tap').toBe('CANVAS');
  await t.page.touchscreen.tap(p.x, p.y);
  if (wait) await t.page.waitForFunction(() => document.querySelector('.overlay') || window.__game.screen.world.mode !== 'play', null, { timeout: 30000 });
}
const s2 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s2') || '{}'));
const mainSave = (page) => page.evaluate(() => localStorage.getItem('snooki-game:save'));
const shot = async (t, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Mission 01 «سر المكتب» in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    const VIEWS = name === 'webkit' ? [['phone 390', 390, 844, 1]] : [['phone 320', 320, 640, 0], ['phone 390', 390, 844, 1]];
    for (const [label, w, h, pick] of VIEWS) {
      it(`${label}: the office played by touch — papers, a timing window, the printer comedy, carrying, a choice, the board, Ryan`, async () => {
        const t = await open(engine.browser, { width: w, height: h });
        const tag = `${name}-${w}`;
        const t0 = Date.now();
        await readAll(t); // arriving: Lama is waiting
        await playing(t.page);
        const before = await mainSave(t.page);
        expect(await actor(t, 'lama')).toMatchObject({ companion: true, visible: true });
        expect(await t.page.evaluate(() => document.querySelector('.hud .objective span')?.textContent)).toMatch(/دوري بالمكتب/);

        // her husky, tapped in the office (a reaction and a line) — never a write to the original save
        if (await actor(t, 'husky')) {
          await t.page.waitForFunction(() => Math.abs(window.__game.screen.world.actor('husky').vx) < 1, null, { timeout: 15000 });
          const hx = await t.page.evaluate(() => { const w = window.__game.screen.world; const hk = w.actor('husky'); return w.toScreen(hk.x, hk.y - 20); });
          await t.page.touchscreen.tap(hx.x, hx.y);
          await t.page.waitForTimeout(400);
          expect(await mainSave(t.page)).toBe(before);
        }

        // the office's papers; Lama walks with her
        await tapObject(t, 340);
        await readAll(t);
        await tapObject(t, 700);
        await readAll(t);
        expect(Math.abs((await actor(t, 'lama')).x - (await actor(t, 'anji')).x)).toBeLessThan(160);
        await tapObject(t, 900); // Sabri guards his screen
        await readAll(t);
        await shot(t, `${tag}-1-guard`);

        // the sticky note while he watches: caught — every time, even walking past him to it (REGRESSION: his
        // look lagged 0.4 s behind her, and the note could be read without Lama's help)
        for (const from of [780, 1100]) {
          // (empty floor on each side of him: nothing there to examine)
          await playing(t.page);
          await tapObject(t, from, { wait: false });
          await t.page.waitForFunction((x) => Math.abs(window.__game.screen.world.player.x - x) < 60, from, { timeout: 15000 });
          await readAll(t);
          await playing(t.page);
          await tapObject(t, 940);
          await readAll(t);
          expect(await has(t, 's2.ev.f-sticky'), `approaching from ${from}`).toBe(false);
        }

        // Lama keeps him talking — then the moments he looks away (tap her once she has caught up and stands still)
        await t.page.waitForFunction(() => Math.abs(window.__game.screen.world.actor('lama').vx) < 1, null, { timeout: 15000 });
        // (someone who walks with her is tapped where she stands — walking at her first only makes her step round)
        await tapObject(t, (await actor(t, 'lama')).x, { walk: false });
        await readAll(t, 0);
        await playing(t.page);
        await t.page.waitForFunction(() => Math.abs(window.__game.screen.world.actor('lama').x - 820) < 4, null, { timeout: 15000 });
        await tapObject(t, 1000, { wait: false }); // to the screen's side (empty floor, past the note)
        await t.page.waitForTimeout(400);
        await readAll(t);
        // as a player does: wait for him to look at Lama, tap the note at once — and if he turns back first, try again
        const noteAt = await t.page.evaluate(() => { const w = window.__game.screen.world; return w.toScreen(940, w.player.y - 50); });
        for (let tries = 0; tries < 6 && !(await has(t, 's2.ev.f-sticky')); tries++) {
          await t.page.waitForFunction(() => { const w = window.__game.screen.world; const s = w.actor('sabri'); return w.mode === 'play' && !document.querySelector('.overlay') && Math.sign(w.player.x - s.x) !== Math.sign(s.facing); }, null, { timeout: 15000, polling: 30 });
          await t.page.touchscreen.tap(noteAt.x, noteAt.y);
          // caught (Sabri speaks first: his «إيييي!») → read it and try again; the note (the narrator reads it) → on
          await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 15000 });
          if ((await t.page.evaluate(() => document.querySelector('.overlay-dialogue .dlg').dataset.speaker)) !== 'sabri') break;
          await readAll(t);
        }
        // she reads it; then the slip — Sabri says it out loud — read up to the moment he bolts for the printer
        for (let i = 0; i < 40 && !(await t.page.evaluate(() => window.__game.screen.world.actor('sabri').x > 1080)); i++) {
          if (await t.page.evaluate(() => document.querySelector('.overlay-dialogue'))) await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
          else await t.page.waitForTimeout(150);
        }
        expect(await has(t, 's2.ev.f-sticky')).toBe(true);
        // the printer: it shakes and throws papers, he sways and throws his hands up — then his line
        await t.page.waitForFunction(() => window.__game.screen.world.actor('sabri').x > 1080 && /الطابعة/.test(document.querySelector('.overlay-dialogue .dlg-text')?.textContent ?? ''), null, { timeout: 20000 });
        await shot(t, `${tag}-2-printer`);
        await readAll(t);
        expect(await flag(t, 's2:12-papers')).toBe(true);

        // four papers back to the tray, one at a time (she carries each)
        for (const [id, x] of [['paper-1', 1010], ['paper-2', 1070], ['paper-3', 1230], ['paper-4', 1300]]) {
          await playing(t.page);
          await tapObject(t, x, { wait: false });
          await t.page.waitForFunction((i) => window.__game.game.flag('s2:hold') === i, id, { timeout: 15000 });
          if (id === 'paper-3') await readAll(t);
          if (id === 'paper-1') await shot(t, `${tag}-3-carry`);
          await playing(t.page);
          await tapObject(t, 1150, { wait: false });
          await t.page.waitForFunction(() => !window.__game.game.flag('s2:hold'), null, { timeout: 15000 });
        }
        // her choice
        await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 15000 });
        await readAll(t, pick);
        expect((await s2(t.page)).flags['s2:dec:office-cover']).toBe(pick ? 'truth' : 'cover');

        // the board «منو گال شنو»: by taps; no skip, no "show the answer"
        await playing(t.page);
        await tapObject(t, 600);
        await read(t); // Lama's line, then the board opens (a panel, not a line)
        await t.page.waitForSelector('.panel.puzzle .lg-cell');
        expect(await t.page.evaluate(() => document.querySelectorAll('[data-act="hint"], [data-act="solution"], [data-act="skip"], [data-hint]').length)).toBe(0); // absent, not hidden
        for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.panel.puzzle .lg-cell, .panel.puzzle [data-check]')].map((x) => Math.round(x.getBoundingClientRect().height)))) expect(b).toBeGreaterThanOrEqual(44);
        for (const [row, cols] of Object.entries(ANSWER)) for (const [col, n] of Object.entries(cols)) for (let i = 0; i < n; i++) await press(t, `.lg-cell[data-row="${row}"][data-col="${col}"]`);
        await shot(t, `${tag}-4-board`);
        await press(t, '.panel.puzzle [data-check]');
        await t.page.waitForSelector('.panel.puzzle.is-solved');
        expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('.game').scrollLeft === 0)).toBe(true);
        await press(t, '.panel.puzzle .panel-foot .btn-primary');

        // Ryan walks in; what he finds depends on her choice (read only the board's closing lines first)
        await read(t);
        await t.page.waitForFunction(() => window.__game.screen.world.actor('ryan')?.visible && document.querySelector('.overlay-dialogue'), null, { timeout: 20000 });
        await shot(t, `${tag}-5-ryan`);
        await readAll(t);
        await playing(t.page);
        const doc = await s2(t.page);
        expect(doc.flags['mission:s2-12']).toBe(true);
        expect(doc.collected).toEqual(expect.arrayContaining(['s2.ev.e-versions', 's2.ev.f-print', 's2.ev.f-sticky']));
        const after = await mainSave(t.page);
        const changed = after === before ? [] : ((x, y) => Object.keys({ ...x, ...y }).filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k])).map((k) => `${k}: ${JSON.stringify(x[k])?.slice(0, 80)} → ${JSON.stringify(y[k])?.slice(0, 80)}`))(JSON.parse(before), JSON.parse(after));
        expect(changed, 'the original campaign save must stay byte-identical').toEqual([]);
        expect(t.errors).toEqual([]);
        console.log(`[playtime] ${tag}: scripted touch run ${((Date.now() - t0) / 1000).toFixed(0)} s (a bot that knows the answers — a floor, not a playtest)`);
      }, 400000);
    }
  });
}
