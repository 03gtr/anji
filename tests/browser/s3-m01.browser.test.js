// @vitest-environment node
/**
 * Season 3, Mission 01 «صبري ولسانه الطويل» in REAL browsers with REAL touch (Edge 320, 360, 390, landscape 844;
 * WebKit 390 on the game's own animation frames). A synthetic save (the original game and Season 2 finished) in a
 * fresh profile per test, played like a player:
 *  - the morning, acted before a word (Rabi' signs the log, Sabri counts on his fingers, Lama hides a smile);
 *  - Sabri's question: Anji blushes and looks away; her answer (each view takes a different one); Marius walks in;
 *    her answer to him;
 *  - the clinic's records, gathered by tapping them in the world; the HUD follows the mission's steps;
 *  - «إعادة بناء الأسبوع» by touch: a wrong first try (a neutral line, no number, her cards kept), then right;
 *  - Sabri owns up (what he wrote is what she said), Marius remembers how she answered him;
 *  - Season 3's save holds it all; the original save stays byte-identical; no page error.
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
const STRICT_WRONG = ['ما ركبت. ارجعي للي لگيتيه وفكري مرة ثانية.', 'مو هيچ. خذي وقتچ.', 'بعد ما ركبت. اللي ضبطتيه بقى مثل ما هو.'];
// where things are in the clinic (data/s3/m01-sabri.js)
const AT = { sabri: 310, marius: 420, log: 530, lama: 590, counter: 690, board: 820, printer: 950, appointments: 1110 };
const WHO = { l1: 'ryan', l2: 'rabi', l3: 'rabi', l4: 'ryan', l5: 'sabri', l6: 'rabi', sheet: 'none' };
const KIND = { c1: 'happened', c2: 'happened', c3: 'saw', c4: 'assumed', c5: 'assumed', c6: 'passed' };
const REPLY = ['deny', 'laugh', 'confront'];
const HONEST = ['honest', 'deflect'];

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5233, strictPort: false, hmr: false } });
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
  page.on('response', (r) => r.status() >= 400 && errors.push(`HTTP ${r.status()} ${r.url()}`));
  // WebKit plays on the game's own animation frames: the dev-only timer loop (?timer=1) starves headless WebKit's
  // rendering on Windows until the page hangs (tests/browser/s2-m02.browser.test.js); Edge keeps it
  const timer = browser.browserType().name() === 'webkit' ? '' : 'timer=1&';
  await page.goto(`${base}?${timer}scene=s3-clinic&flags=${[...AFTER, ...S2_DONE].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world, null, { timeout: 60000 });
  // a finished original campaign: every act objective done, so the HUD follows the season of the place she is in
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
/** Read dialogue through; each choice met takes the next pick (and what Anji shows at that moment is recorded). */
async function read(t, picks = []) {
  for (let i = 0; i < 120; i++) {
    const s = await t.page.evaluate(() => {
      const d = document.querySelector('.overlay-dialogue');
      if (!d) return 'none';
      return d.querySelector('.dlg-choices button') ? 'choice' : 'next';
    });
    if (s === 'none') return;
    if (s === 'choice') {
      t.atChoice.push(await t.page.evaluate(() => window.__game.screen.world.actor('anji').puffs.map((p) => p.type)));
      await press(t, `.overlay-dialogue .dlg-choices button:nth-child(${(picks.shift() ?? 0) + 1})`);
    } else await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
  }
  throw new Error('the dialogue did not end');
}
/** Read on through dialogues that follow each other (acting in between), until play returns. */
async function readAll(t, picks = []) {
  for (let i = 0; i < 12; i++) {
    await read(t, picks);
    const done = await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue') || (window.__game.screen.world.mode === 'play' && !document.querySelector('.overlay')), null, { timeout: 30000 }).then(() => t.page.evaluate(() => !document.querySelector('.overlay-dialogue')));
    if (done) return;
  }
}
const playing = (page) => page.waitForFunction(() => window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay'), null, { timeout: 30000 });
const flag = (t, id) => t.page.evaluate((i) => window.__game.game.flag(i), id);
const objective = (t) => t.page.evaluate(() => document.querySelector('.hud .objective span')?.textContent.trim() ?? '');
/** Walk close (arrow keys), wait for the camera to settle, then a real tap on it — the world under the finger. */
async function tapObject(t, x) {
  const dir = await t.page.evaluate((ox) => Math.sign(ox - window.__game.screen.world.player.x), x);
  if (dir !== 0 && Math.abs(x - (await t.page.evaluate(() => window.__game.screen.world.player.x))) > 40) {
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
  await t.page.waitForFunction(() => document.querySelector('.overlay') || window.__game.screen.world.mode !== 'play', null, { timeout: 30000 });
}
const s3 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s3') || '{}'));
const mainSave = (page) => page.evaluate(() => localStorage.getItem('snooki-game:save'));
const shot = async (t, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));

/** One stage of the board by touch: each card, then its column. */
async function sortStage(t, answer) {
  for (const [id, bin] of Object.entries(answer)) {
    await press(t, `.panel.puzzle .sort-card[data-card="${id}"]`);
    await press(t, `.panel.puzzle .sort-bin-head[data-bin="${bin}"]`);
  }
}

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Mission 01 «صبري ولسانه الطويل» in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    // [label, width, height, sabri-reply choice, marius-honest choice]: every value of both decisions is played somewhere
    const VIEWS =
      name === 'webkit'
        ? [['phone 390', 390, 844, 1, 0]]
        : [['phone 320', 320, 640, 0, 0], ['phone 360', 360, 780, 1, 1], ['phone 390', 390, 844, 2, 0], ['landscape 844', 844, 390, 0, 1]];
    for (const [label, w, h, reply, honest] of VIEWS) {
      it(`${label}: the morning, Sabri's question (${REPLY[reply]}), Marius (${HONEST[honest]}), the records, the week by touch, Sabri owns up`, async () => {
        const t = { ...(await open(engine.browser, { width: w, height: h })), atChoice: [] };
        const tag = `${name}-${w}`;
        // the morning: acted, then a few lines
        await t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 60000 });
        await shot(t, `${tag}-1-morning`);
        await readAll(t);
        await playing(t.page);
        expect(await flag(t, 's3:01-opened')).toBe(true);
        const before = await mainSave(t.page);
        expect(await objective(t)).toBe('صبري عنده سؤال… واضح من باوعته.');

        // Sabri's question; she blushes; her answer; Marius walks in; her answer to him
        await tapObject(t, AT.sabri);
        await readAll(t, [reply, honest]);
        await playing(t.page);
        expect(t.atChoice[0], 'Anji is blushing when she has to answer').toContain('blush');
        expect(await flag(t, 's3:dec:sabri-reply')).toBe(REPLY[reply]);
        expect(await flag(t, 's3:dec:marius-honest')).toBe(HONEST[honest]);
        const marius = await t.page.evaluate(() => { const a = window.__game.screen.world.actor('marius'); return a && { x: Math.round(a.x), visible: a.visible }; });
        expect(marius?.visible).not.toBe(false);
        expect(Math.abs(marius.x - AT.marius)).toBeLessThan(30);
        await shot(t, `${tag}-2-marius`);
        expect(await objective(t)).toBe('سجلات العيادة تحچي غير شي. لمّيها.');

        // the records, by tapping them in the world (left to right)
        for (const where of ['log', 'lama', 'board', 'printer', 'appointments']) {
          await tapObject(t, AT[where]);
          await readAll(t);
          await playing(t.page);
        }
        const doc = await s3(t.page);
        for (const e of ['e-visitor-log', 'e-appointments', 'e-test-schedule', 'e-print-queue', 'e-lama-note']) expect(doc.collected, e).toContain(`s3.ev.${e}`);
        expect(await objective(t)).toBe('رتّبي الأسبوع من السجلات، على الطاولة.');

        // the week, by touch: no help; every target ≥ 44 px; nothing scrolls sideways
        await tapObject(t, AT.counter);
        // Sabri walks round first (no dialogue yet), then the records laid out (one line), then the panel opens —
        // an overlay, so not readAll
        await t.page.waitForSelector('.overlay-dialogue, .panel.puzzle', { timeout: 30000 });
        await read(t);
        await t.page.waitForSelector('.panel.puzzle .sort-card');
        // measure at rest: the panel opens with a pop-in from scale(0.97), and a slow (WebKit) frame can land mid-way
        await t.page.waitForFunction(() => document.querySelector('.overlay')?.getAnimations({ subtree: true }).every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 10000 });
        expect(await t.page.evaluate(() => document.querySelectorAll('.panel.puzzle [data-act="hint"], .panel.puzzle [data-act="solution"], .panel.puzzle [data-act="skip"]').length)).toBe(0);
        for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.panel.puzzle .sort-card, .panel.puzzle .sort-bin-head, .panel.puzzle [data-submit]')].map((x) => Math.round(x.getBoundingClientRect().height)))) expect(b).toBeGreaterThanOrEqual(44);
        expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await shot(t, `${tag}-3-week`);
        // a wrong first try: Tuesday's «تقرير» taken for Ryan (the trap)
        await sortStage(t, { ...WHO, l3: 'ryan' });
        await press(t, '.panel.puzzle [data-submit]');
        const fb = await t.page.evaluate(() => document.querySelector('.panel.puzzle .puzzle-feedback').textContent);
        expect(STRICT_WRONG).toContain(fb);
        expect(fb).not.toMatch(/[0-9٠-٩]/);
        expect(await t.page.evaluate(() => document.querySelectorAll('.panel.puzzle [data-unplace]').length)).toBe(7); // her cards stay
        await t.page.evaluate(() => Promise.all(document.querySelector('.panel.puzzle').getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
        await press(t, '.panel.puzzle [data-unplace="l3"]');
        await sortStage(t, { l3: 'rabi' });
        await press(t, '.panel.puzzle [data-submit]');
        await t.page.waitForSelector('.panel.puzzle .sort-card[data-card="c1"]');
        await sortStage(t, KIND);
        await press(t, '.panel.puzzle [data-submit]');
        await t.page.waitForSelector('.panel.puzzle.is-solved');
        await press(t, '.panel.puzzle .panel-foot .btn-primary');
        await readAll(t);
        await playing(t.page);
        expect(await flag(t, 's3:01-solved')).toBe(true);
        expect(await objective(t)).toBe('رجعي لصبري ويا اللي طلع.');

        // Sabri owns up (he walked over to the counter: she finds him there)
        const sabriAt = await t.page.evaluate(() => Math.round(window.__game.screen.world.actor('sabri').x));
        const where = await t.page.evaluate(() => { const w = window.__game.screen.world; return { sabri: Math.round(w.actor('sabri').x), lama: Math.round(w.actor('lama').x), anji: Math.round(w.player.x) }; });
        await tapObject(t, sabriAt);
        where.after = await t.page.evaluate(() => Math.round(window.__game.screen.world.player.x));
        // each line as it is once it has finished typing (the box reveals it word by word), then on to the next
        const owned = [];
        for (let i = 0; i < 40; i++) {
          await t.page.evaluate(() => { window.__lastLine = undefined; });
          const line = await t.page
            .waitForFunction(() => {
              const el = document.querySelector('.overlay-dialogue .dlg-text');
              if (!el) return 'gone';
              const prev = window.__lastLine;
              window.__lastLine = el.textContent;
              return prev === el.textContent && el.textContent ? el.textContent : false;
            }, null, { polling: 300, timeout: 15000 })
            .then((h) => h.jsonValue());
          if (line === 'gone') break;
          owned.push(line);
          await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
        }
        await playing(t.page);
        const words = owned.join(' ');
        expect(words.includes('مجرد صديق أخوية ماريوس'), `what Sabri said: ${words} · positions ${JSON.stringify(where)}`).toBe(reply === 0);
        expect(words.includes('إنچ ضحكتي')).toBe(reply === 1);
        expect(words.includes('إنچ زعلتي')).toBe(reply === 2);
        await shot(t, `${tag}-4-owned`);

        // all in Season 3's save; the original save untouched; no page error
        const end = await s3(t.page);
        expect(end.flags).toMatchObject({ 'mission:s3-01': true, 's3:dec:sabri-reply': REPLY[reply], 's3:dec:marius-honest': HONEST[honest] });
        expect(end.collected).toEqual(expect.arrayContaining(['s3.ev.d-office', 's3.ev.e-group-msg']));
        expect(await mainSave(t.page)).toBe(before);
        expect(t.errors).toEqual([]);
      }, name === 'webkit' ? 420000 : 300000);
    }
  });
}
