// @vitest-environment node
/**
 * The final story in REAL browsers — the four chapters played by keyboard and touch on a synthetic save (Season 3
 * finished) in a fresh profile, and the mission «تلميح» on a phone:
 *  - Chapter 01 (Edge 390): Marius asks; she answers; his silence; the phone;
 *  - Chapter 02 (Edge 320): the club; the earned sharp line, her defence, his apology; the chapter completes;
 *  - Chapter 03 (Edge 360): the dawn walk, three stops, Ryan's question;
 *  - Chapter 04 + replay (Edge 390, WebKit 390, Edge landscape): the choice «إي. أختارك.» and its ending card; then
 *    «الاختيار الأخير، مرة ثانية» from the journal, «مو هسه», Zefiro driving away and its card — the first ending
 *    stays recorded, the history grows, nothing restarts;
 *  - the «تلميح» at 320 and 390: a real touch target clear of the HUD, the step's words on screen; the journal has no
 *    investigation board (removed by the owner's hotfix brief) — the synthetic save still carries its old flag.
 * No page error, no failed request, nothing scrolls sideways. Headless emulation, not a physical phone.
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
const S3_DONE = Array.from({ length: 8 }, (_, i) => `mission:s3-0${i + 1}`);
// (and the season's places as a finished season leaves them: her room and the lane opened by their missions, the
// finale played — its crowd gone home, Zefiro's engine off)
S3_DONE.push('s3:03-opened', 's3:05-opened', 's3:05-scent-1', 's3:05-scent-2', 's3:05-scent-3', 's3:08-gathered', 's3:08-defended', 's3:08-hush', 's3:08-done', 's3:08-idle', 's3:08-engine-off');
const ARC_UPTO = (n) => ['s3-f1', 's3-f2', 's3-f3', 's3-f4'].slice(0, n).map((id) => `mission:${id}`);

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5244, strictPort: false, hmr: false } });
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

async function open(browser, { width, height, scene, flags = [], decisions = {} }) {
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
  // load in the archive, record Season 3's own openings as played (as a finished season has them), then go
  await page.goto(`${base}?${timer}scene=s3-archive&flags=${[...AFTER, ...S2_DONE, ...S3_DONE, 's3:board-open', ...flags].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.scene?.id === 's3-archive', null, { timeout: 60000 });
  await page.evaluate(`(async () => {
    const { SCENES } = await import('/src/game/data/scenes/index.js');
    const { ACTS } = await import('/src/game/data/chapters.js');
    const { atoms } = await import('/src/game/core/conditions.js');
    const g = window.__game.game;
    // the original game, finished as a player finishes it (its objectives met)
    for (const a of ACTS) for (const o of a.objectives) for (const at of atoms(o.done)) {
      const [k, ...r] = at.split(':');
      const id = r.join(':');
      if (k === 'flag') g.setFlag(id);
      if (k === 'record') g.recordResult(id, { completed: true });
      if (k === 'item') g.addItem(id);
    }
    for (const sc of Object.values(SCENES)) if (sc.id.startsWith('s3-')) for (const tr of sc.triggers || []) if (!/^f[0-9]-/.test(tr.id)) g.setFlag('t.' + sc.id + '.' + tr.id);
    for (const [k, v] of Object.entries(${JSON.stringify(decisions)})) g.setFlag('s3:dec:' + k, v);
    g.setFlag('husky-name', 'لولو');
    history.replaceState(null, '', location.pathname);
    await window.__game.go(${JSON.stringify(scene)});
  })()`);
  await page.waitForFunction((id) => window.__game?.screen?.world?.scene?.id === id, scene, { timeout: 60000 });
  return { page, errors, said: [] };
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
/** Read every open dialogue (and chapter card) through, taking the given picks at choices; `at(text)` may shoot. */
async function readAll(t, picks = [], at = null) {
  for (let i = 0; i < 300; i++) {
    const s = await t.page.evaluate(() => {
      if (document.querySelector('.overlay-dialogue .dlg-choices button')) return 'choice';
      if (document.querySelector('.overlay-dialogue')) return 'next';
      if (document.querySelector('.overlay-chapter button')) return 'card';
      return window.__game.screen.world.mode === 'play' && !document.querySelector('.overlay') ? 'play' : 'wait';
    });
    if (s === 'play') {
      await t.page.waitForTimeout(800);
      const again = await t.page.evaluate(() => window.__game.screen.world.mode === 'play' && !document.querySelector('.overlay'));
      if (again) return;
      continue;
    }
    if (s === 'next' || s === 'choice') {
      const line = await t.page.evaluate(() => document.querySelector('.overlay-dialogue .dlg-text, .overlay-dialogue p')?.textContent ?? '');
      if (line && t.said.at(-1) !== line) {
        t.said.push(line);
        if (at) await at(line, s);
      }
    }
    if (s === 'choice') await press(t, `.overlay-dialogue .dlg-choices button:nth-child(${(picks.shift() ?? 0) + 1})`);
    else if (s === 'next') await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
    else if (s === 'card') {
      if (at) await at(await t.page.evaluate(() => document.querySelector('.overlay-chapter .chapter-title')?.textContent ?? ''), 'card');
      await t.page.waitForTimeout(700);
      await press(t, '.overlay-chapter button');
    } else await t.page.waitForTimeout(150);
  }
  throw new Error('the scene did not come back to play');
}
async function walkTo(t, x) {
  const px = await t.page.evaluate(() => window.__game.screen.world.player.x);
  if (Math.abs(px - x) < 30) return;
  const key = x > px ? 'ArrowRight' : 'ArrowLeft';
  await t.page.keyboard.down(key);
  await t.page
    .waitForFunction(([ox, d]) => { const w = window.__game.screen.world; return w.mode !== 'play' || (d > 0 ? w.player.x >= ox : w.player.x <= ox); }, [x, x > px ? 1 : -1], { timeout: 30000, polling: 50 })
    .finally(() => t.page.keyboard.up(key));
}
/** Walk to someone (where they stand now) and examine (E). */
async function talkTo(t, who, picks = [], at = null) {
  const x = await t.page.evaluate((id) => window.__game.screen.world.actor(id)?.x ?? null, who);
  expect(x, `${who} is here`).not.toBeNull();
  await walkTo(t, x - 50);
  await t.page.keyboard.press('KeyE');
  await t.page.waitForTimeout(400);
  await readAll(t, picks, at);
}
async function examineAt(t, x, picks = [], at = null) {
  await walkTo(t, x);
  await t.page.keyboard.press('KeyE');
  await t.page.waitForTimeout(400);
  await readAll(t, picks, at);
}
const shot = async (t, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));
const flag = (t, id) => t.page.evaluate((i) => window.__game.game.flag(i), id);
const sideways = (t) => t.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

for (const [name, engine] of Object.entries(engines)) {
  const label = name === 'chromium' ? 'Edge' : 'WebKit';
  const edge = name === 'chromium';
  describe.skipIf(!engine.browser)(`The final story in ${label}`, () => {
    it.skipIf(!edge)('Chapter 01 at 390: Marius asks; she answers; he keeps quiet; Ryan\'s message', async () => {
      const t = await open(engine.browser, { width: 390, height: 844, scene: 's3-home' });
      await t.page.waitForTimeout(1200);
      await readAll(t);
      expect(await flag(t, 's3:f1-met')).toBe(true);
      await talkTo(t, 'marius', [0], async (line, kind) => kind === 'choice' && (await shot(t, `${name}-f1-question-390`)));
      expect(t.said.join('\n')).toContain('معجب بيچ لو شنو؟');
      expect(t.said.join('\n')).toContain('مو كلشي لازم أسأل عنه');
      expect(await flag(t, 's3:dec:marius-ask')).toBe('deny');
      await examineAt(t, 360);
      expect(await flag(t, 'mission:s3-f1')).toBe(true);
      expect(await sideways(t)).toBe(false);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 300000);

    it.skipIf(!edge)('Chapter 02 at 320: the card, the club, the earned line — her defence, his apology', async () => {
      const t = await open(engine.browser, { width: 320, height: 700, scene: 's3-garage', flags: ARC_UPTO(1), decisions: { 'marius-ask': 'deny' } });
      await t.page.waitForTimeout(1200);
      await readAll(t);
      await talkTo(t, 'ryan', [0, 0, 1], async (line) => line.includes('معفنة') && !t.shotInsult && ((t.shotInsult = true), await shot(t, `${name}-f2-line-320`)));
      const said = t.said.join('\n');
      expect(said).toContain('يا معفنة، مو كل مرة أتحمل وأسكت!');
      expect(said).toContain('«معفنة»؟! هيچ تشوفني؟');
      expect(said).toContain('آسف على الكلمة');
      expect(said).toContain('أنكرتك هواي');
      expect(await flag(t, 's3:dec:forgive')).toBe('time');
      expect(await flag(t, 'mission:s3-f2')).toBe(true);
      expect(await sideways(t)).toBe(false);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 300000);

    it.skipIf(!edge)('Chapter 03 at 360: the dawn walk, three stops in her order, Ryan\'s question', async () => {
      const t = await open(engine.browser, { width: 360, height: 780, scene: 's3-lane', flags: ARC_UPTO(2), decisions: { 'club-moment': 'own', 'after-words': 'why', forgive: 'now' } });
      await t.page.waitForTimeout(1200);
      await readAll(t);
      await examineAt(t, 1300, [2]); // the oil stain first: what she needs
      await shot(t, `${name}-f3-dawn-360`);
      await examineAt(t, 1150);
      await examineAt(t, 420);
      await talkTo(t, 'ryan');
      expect(t.said.join('\n')).toContain('جاهزين نبني شي؟');
      expect(await flag(t, 's3:dec:need')).toBe('patience');
      expect(await flag(t, 'mission:s3-f3')).toBe(true);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 300000);

    const views = edge ? [['390', 390, 844], ['landscape', 844, 390]] : [['390', 390, 844]];
    it.each(views)('Chapter 04 (%s): «إي. أختارك.»; then the choice again from the journal — «مو هسه» — the first ending kept', async (v, width, height) => {
      const t = await open(engine.browser, { width, height, scene: 's3-street', flags: ARC_UPTO(3), decisions: { 'marius-ask': 'joke', 'sabri-reply': 'laugh', need: 'seen', forgive: 'now', 'club-moment': 'own' } });
      await t.page.waitForTimeout(1200);
      await readAll(t);
      await talkTo(t, 'ryan', [0], async (line, kind) => {
        if (kind === 'choice' && line.includes('والشارع كله ينتظر')) await shot(t, `${name}-f4-choice-${v}`);
        if (line.includes('حضن هادي')) await shot(t, `${name}-f4-embrace-${v}`);
        if (kind === 'card') await shot(t, `${name}-f4-end-yes-${v}`);
      });
      expect(t.said.join('\n')).toContain('آني مو أعمى');
      expect(await flag(t, 's3:end:first')).toBe('yes');
      // «الاختيار الأخير، مرة ثانية»: from the journal
      await t.page.evaluate(() => { window.__game.ui.openJournal('notes'); });
      await t.page.waitForSelector('[data-open="final-choice"]');
      await press(t, '[data-open="final-choice"]');
      await t.page.waitForSelector('[data-yes]');
      expect(await t.page.evaluate(() => document.querySelector('.panel-small p').textContent)).toContain('يبقى محفوظ');
      await press(t, '[data-yes]');
      await t.page.waitForFunction(() => window.__game.screen?.world?.scene?.id === 's3-street' && document.querySelector('.overlay-dialogue'), null, { timeout: 60000 });
      t.said = [];
      let away = false;
      await readAll(t, [1], async (line, kind) => {
        if (!away && (await flag(t, 's3:f4-away'))) {
          away = true;
          await t.page.waitForTimeout(600);
          await shot(t, `${name}-f4-leaving-${v}`);
        }
        if (kind === 'card') await shot(t, `${name}-f4-end-later-${v}`);
      });
      expect(t.said.join('\n')).toContain('أحترم جوابچ');
      expect(await flag(t, 's3:end:first')).toBe('yes');
      expect(await flag(t, 's3:end:last')).toBe('later');
      expect(await flag(t, 's3:end:history')).toBe('yes,later');
      expect(await flag(t, 's3:f4-gone')).toBe(true);
      expect(await flag(t, 'mission:s3-08')).toBe(true); // nothing restarted
      const doc = await t.page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s3')));
      expect(doc.flags['s3:end:first']).toBe('yes');
      expect(await sideways(t)).toBe(false);
      expect(t.errors, t.errors.join('\n')).toEqual([]);
    }, 400000);

    it('the «تلميح» at 320, 390 and in landscape: on screen, a real touch target clear of the HUD, the step\'s words; the journal without the board', async () => {
      for (const [width, height] of [[320, 640], [390, 844], [844, 390]]) {
        const t = await open(engine.browser, { width, height, scene: 's3-home', flags: [] });
        await t.page.waitForTimeout(1000);
        // the chapter's opening plays on arrival (later in WebKit, on its own frames): read it through, until the
        // objective is the step after it — Marius's question (the arrival step names him too: not enough to wait for)
        await t.page.waitForFunction(() => /عنده سؤال/.test(document.querySelector('.hud .objective span')?.textContent ?? '') || Boolean(document.querySelector('.overlay-dialogue')), null, { timeout: 20000 });
        await readAll(t);
        await t.page.waitForFunction(() => /عنده سؤال/.test(document.querySelector('.hud .objective span')?.textContent ?? ''), null, { timeout: 15000 });
        await press(t, '.hint-pill');
        const r = await t.page.evaluate(() => {
          const pill = document.querySelector('.hint-pill').getBoundingClientRect();
          const card = document.querySelector('.objective-hint');
          const c = card.getBoundingClientRect();
          const hud = [...document.querySelectorAll('.hud-btn')].filter((b) => !b.hidden).map((b) => b.getBoundingClientRect());
          const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          return { h: Math.round(pill.height), text: card.hidden ? '' : card.textContent, inView: c.top >= 0 && c.bottom <= innerHeight && c.left >= 0 && c.right <= innerWidth, rect: [c.left, c.top, c.right, c.bottom, innerWidth, innerHeight].map(Math.round), overHud: hud.some((b) => overlap(b, pill)) };
        });
        expect(r.h).toBeGreaterThanOrEqual(44);
        expect(r.text).toMatch(/ماريوس بغرفتچ. احچي وياه/); // that step's own hint (data/mission-hints.js)
        expect(r.inView, `the card at ${r.rect}`).toBe(true);
        expect(r.overHud).toBe(false);
        expect(await sideways(t)).toBe(false);
        await shot(t, `${name}-hint-${width}`);
        await press(t, '.objective-hint');
        await press(t, '.hud [data-act="journal"]');
        await t.page.waitForSelector('.journal .tabs');
        expect(await t.page.evaluate(() => document.querySelector('.journal .tabs').textContent)).not.toMatch(/لوحة التحقيق/);
        expect(await sideways(t)).toBe(false);
        expect(t.errors, t.errors.join('\n')).toEqual([]);
      }
    }, 300000);
  });
}
