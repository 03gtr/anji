// @vitest-environment node
/**
 * Season 2, M2 — Mission 06 «حقيقة البطاقة» (s2-17), the season's finale, in REAL browsers with REAL touch input.
 * Synthetic saves only (a fresh profile per test); Missions 02, 04 and 05 are set as done, with the evidence and
 * decisions they leave (their modules are not needed). Played like a player:
 *  - everyone is in the case room and the gathering is acted out as she comes in;
 *  - the board: the night in order, by touch — a wrong order gets only a neutral line, the right one solves;
 *  - the defence: she chooses B; Jojo's challenge has no answer; she says so; B breaks, and Ryan reacts (a step
 *    back, he looks away, then turns back, kind); the board shows B broken, never disabled;
 *  - she chooses D and answers every challenge with the evidence that answers it (each challenger walks up to her;
 *    the decisions decide who and what: Sabri's words, Jojo's tone, the husky or Snooki, her sister's question);
 *  - the garden at night: Ryan lights the eighth lantern, its light leads to the white roses, and the ending plays
 *    to its last line; s2-17 completes in Season 2's own save; the original save stays byte-identical.
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
// Season 2: all of M1 and Missions 01–05 done
const S2_DONE = [
  ...['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11', 's2-12', 's2-13', 's2-14', 's2-15', 's2-16'].map((m) => `mission:${m}`),
  's2:in-archive', 's2:in-tree', 's2:in-caseroom', 's2:in-lamphouse', 's2:caseroom-open', 's2:board-1', 's2:board-2', 's2:11-talked',
];
const EVIDENCE = [
  'e-register', 'e-copy', 'e-count', 'e-blank', 'e-moved', 'e-note', 'e-whisper', 't-rabi', 'h-rabi', 'e-wax', 't-lama', 'h-lama', 'e-copy-diff', 't-sabri', 'h-sabri', 'e-receipt',
  't-jojo', 'h-jojo', 'e-drift', 't-sister', 'h-sister', 'e-imprint', 'd-elim', 'f-rota', 'f-calendar', 'f-sticky', 'f-print', 'e-versions', 'e-oilcan', 'e-logbook', 'e-loft', 't-jojo-true',
  // Missions 02, 04, 05 (built alongside; set directly)
  'e-page', 'e-wrapper', 'd-chain', 'd-timeline', 'e-surprise',
];
const ORDER = ['words', 'note', 'clock', 'lanterns', 'card', 'page'];
// D's challenges, in turn, and a piece of evidence that answers each
const D = [['لمى', 'd-timeline'], ['صبري', 'e-versions'], ['جوجو', 'e-logbook'], [null, 'e-page'], ['أختي', 'd-chain'], ['ريان', 'e-surprise']];
const STRICT = ['ما ركبت. ارجعي للي لگيتيه وفكري مرة ثانية.', 'مو هيچ. خذي وقتچ.', 'بعد ما ركبت. اللي ضبطتيه بقى مثل ما هو.'];

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5226, strictPort: false, hmr: false } });
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

async function open(browser, { width, height }, decisions) {
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
  await page.goto(`${base}?${timer}scene=s2-caseroom&flags=${[...AFTER, ...S2_DONE].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode, null, { timeout: 60000 });
  await page.evaluate(
    ([ev, dec]) => {
      for (const e of ev) window.__game.game.collect(`s2.ev.${e}`);
      window.__game.game.setFlag('husky-name', 'لولو');
      for (const [k, v] of Object.entries(dec)) window.__game.game.setFlag(`s2:dec:${k}`, v);
      history.replaceState(null, '', location.pathname);
    },
    [EVIDENCE, decisions],
  );
  return { page, errors, said: [] };
}
const centre = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.disabled || el.hidden || el.closest('[hidden]')) return null;
    // (inline 'nearest': 'center' would scroll the right-to-left game root sideways — a test artefact, not play)
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height };
  }, sel);
async function press(t, sel) {
  const p = await centre(t.page, sel);
  expect(p, `${sel} is on screen and enabled`).toBeTruthy();
  await t.page.touchscreen.tap(p.x, p.y);
  await t.page.waitForTimeout(140);
}
const dialogue = (page) => page.evaluate(() => document.querySelector('.overlay-dialogue .dlg-text, .overlay-dialogue p')?.textContent ?? null);
/** Read every dialogue that comes, until `done()` holds and no dialogue is open (lines are kept in `t.said`). */
async function readUntil(t, done, ms = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await t.page.evaluate(() => {
      const d = document.querySelector('.overlay-dialogue');
      if (!d) return 'none';
      return d.querySelector('.dlg-choices button') ? 'choice' : 'next';
    });
    if (s === 'none') {
      if (await done()) return;
      await t.page.waitForTimeout(120);
      continue;
    }
    const line = await t.page.evaluate(() => document.querySelector('.overlay-dialogue')?.textContent.trim());
    if (line && t.said[t.said.length - 1] !== line) t.said.push(line);
    if (s === 'choice') await press(t, '.overlay-dialogue .dlg-choices button');
    else await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
  }
  throw new Error('the scene did not end');
}
const noOverlay = (t) => t.page.evaluate(() => !document.querySelector('.overlay'));
const actor = (t, id) => t.page.evaluate((i) => { const a = window.__game.screen.world.actor(i); return a && { x: Math.round(a.x), facing: a.facing, visible: a.visible, emote: Boolean(a.emote), puffs: a.puffs.length, pose: a.pose }; }, id);
const playing = (page) => page.waitForFunction(() => window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay'), null, { timeout: 60000 });
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
const s2 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s2') || '{}'));
const mainSave = (page) => page.evaluate(() => localStorage.getItem('snooki-game:save'));
const shot = async (t, name) => SHOTS && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));
const barReady = (t) => t.page.waitForFunction(() => { const b = document.querySelector('.tm-defend [data-acts]:not([hidden]) [data-present]'); return b && !b.disabled && !document.querySelector('.overlay-dialogue'); }, null, { timeout: 30000 });
const boardReady = (t) => t.page.waitForFunction(() => { const b = document.querySelector('.tm-defend [data-hyps]:not([hidden]) [data-hyp="D"]'); return b && !b.disabled && !document.querySelector('.overlay-dialogue'); }, null, { timeout: 30000 });
const bar = (t) => t.page.evaluate(() => ({ who: document.querySelector('.tm-defend .tm-who')?.textContent, line: document.querySelector('.tm-defend .tm-line')?.textContent, feedback: document.querySelector('.tm-defend .tm-feedback')?.textContent }));

const RUNS = {
  chromium: [
    ['phone 320', 320, 640, { 'office-cover': 'cover', stash: 'keep', 'jojo-confront': 'gentle', 'sister-wish': 'read', lead: 'ryan', 'jealous-talk': 'tease' }],
    ['phone 390', 390, 844, { 'office-cover': 'truth', stash: 'return', 'jojo-confront': 'blunt', 'sister-wish': 'leave', lead: 'anji', 'jealous-talk': 'challenge' }],
  ],
  webkit: [['phone 390', 390, 844, { 'office-cover': 'truth', stash: 'keep', 'jojo-confront': 'blunt', 'sister-wish': 'read', lead: 'anji', 'jealous-talk': 'reassure' }]],
};

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Mission 06 «حقيقة البطاقة» in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    for (const [label, w, h, dec] of RUNS[name]) {
      it(`${label}: the night in order, B breaks (Ryan reacts), D defended by touch, the ending to its last line`, async () => {
        const t = await open(engine.browser, { width: w, height: h }, dec);
        const tag = `${name}-${w}`;
        const before = await mainSave(t.page);

        // everyone is here: the gathering plays as she comes in
        await readUntil(t, () => noOverlay(t));
        await playing(t.page);
        expect(t.said.join(' ')).toMatch(/غرفة الدائرة مليانة/);
        for (const id of ['rabi', 'lama', 'sabri', 'jojo', 'sister', 'ryan']) expect((await actor(t, id))?.visible, id).toBe(true);
        await shot(t, `${tag}-1-gather`);

        // the board: the night in order
        await tapObject(t, 720);
        await readUntil(t, () => t.page.evaluate(() => Boolean(document.querySelector('.puzzle-arrange'))));
        expect(await t.page.evaluate(() => document.querySelectorAll('.puzzle [data-act="hint"], .puzzle [data-act="solution"], .puzzle [data-act="skip"]').length)).toBe(0);
        expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        // a wrong order first: only a neutral line
        for (const [i, id] of [...ORDER].reverse().entries()) {
          await press(t, `.puzzle [data-piece="${id}"]`);
          await press(t, `.puzzle [data-slot="t${i + 1}"]`);
        }
        await press(t, '.puzzle [data-check]');
        expect(STRICT).toContain(await t.page.evaluate(() => document.querySelector('.puzzle-feedback').textContent));
        await shot(t, `${tag}-2-board`);
        for (const [i, id] of ORDER.entries()) {
          await press(t, `.puzzle [data-piece="${id}"]`);
          await press(t, `.puzzle [data-slot="t${i + 1}"]`);
        }
        await press(t, '.puzzle [data-check]');
        await t.page.waitForSelector('.puzzle.is-solved, .puzzle .is-solved, .panel.is-solved', { timeout: 15000 });
        await press(t, '.puzzle .panel-foot .btn-primary');
        await readUntil(t, () => noOverlay(t));
        expect((await s2(t.page)).flags['s2:17-order']).toBe(true);
        await playing(t.page);

        // the defence: B first
        await tapObject(t, 720);
        await readUntil(t, () => t.page.evaluate(() => Boolean(document.querySelector('.tm-defend [data-hyp]'))));
        await boardReady(t);
        expect(await t.page.evaluate(() => [...document.querySelectorAll('.tm-defend [data-hyp]')].map((b) => b.dataset.hyp))).toEqual(['A', 'B', 'C', 'D']);
        for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.tm-defend button')].filter((x) => !x.closest('[hidden]')).map((x) => Math.round(x.getBoundingClientRect().height)))) expect(b).toBeGreaterThanOrEqual(44);
        await press(t, '.tm-defend [data-hyp="B"]');
        await barReady(t);
        expect((await bar(t)).line).toMatch(/يأذيچ/);
        const jojo = await t.page.evaluate(() => { const wd = window.__game.screen.world; const a = wd.actor('jojo'); const p = wd.toScreen(a.x, a.y - 50); return { inView: p.x > 0 && p.x < innerWidth, apart: Math.abs(a.x - wd.player.x) }; });
        expect(jojo.inView).toBe(true); // he walked up to her: they are framed together
        expect(jojo.apart).toBeLessThan(120);
        // a wrong piece: Jojo shrugs, a neutral line
        await press(t, '.tm-defend [data-present]');
        await press(t, '.tm-defend [data-ev="e-receipt"]');
        await readUntil(t, async () => (await bar(t)).feedback);
        expect(STRICT).toContain((await bar(t)).feedback);
        // she has no answer: B breaks, and Ryan reacts — a step back, he looks away; then he turns back, kind
        await barReady(t);
        const ryan0 = await actor(t, 'ryan');
        await press(t, '.tm-defend [data-concede]');
        await t.page.waitForFunction(() => /يرجع خطوة/.test(document.querySelector('.overlay-dialogue')?.textContent || ''), null, { timeout: 20000 });
        await t.page.waitForTimeout(1300);
        const ryan1 = await actor(t, 'ryan');
        expect(ryan1.x).toBeGreaterThan(ryan0.x); // he stepped back
        expect(ryan1.emote).toBe(true);
        await shot(t, `${tag}-3-b-breaks`);
        await readUntil(t, () => t.page.evaluate(() => Boolean(document.querySelector('.tm-defend [data-hyps]:not([hidden])'))));
        expect(t.said.join(' ')).toMatch(/بس مو هيچ/);
        await boardReady(t);
        expect(await t.page.evaluate(() => document.querySelector('.tm-defend [data-hyp="B"]').textContent)).toMatch(/انكسرت/);
        expect((await s2(t.page)).flags['s2:17-broke-b']).toBe(true);

        // D: every challenge, answered by touch
        await press(t, '.tm-defend [data-hyp="D"]');
        for (const [i, [who, ev]] of D.entries()) {
          await barReady(t);
          const b = await bar(t);
          if (who) expect(b.who, `challenge ${i + 1}`).toContain(who);
          if (i === 1) expect(b.line).toMatch(dec['office-cover'] === 'cover' ? /الطابعة/ : /حرف بحرف/); // Sabri: as she left things at the office
          if (i === 2) expect(b.line).toMatch(dec['jojo-confront'] === 'blunt' ? /سؤال صريح/ : /السؤال الصعب/);
          if (i === 3) expect(b.who).toMatch(dec.stash === 'keep' ? /لولو/ : /سنوكي/); // the husky raises it, or Snooki
          if (i === 4) expect(b.line).toMatch(dec['sister-wish'] === 'read' ? /گريتي/ : /ما گريتي/);
          if (i === 3) await shot(t, `${tag}-4-challenge-page`);
          await press(t, '.tm-defend [data-present]');
          await press(t, `.tm-defend [data-ev="${ev}"]`);
          if (i < D.length - 1) await readUntil(t, async () => (await bar(t)).who && !(await bar(t)).who.includes(who ?? '\u0000') && (await t.page.evaluate(() => !document.querySelector('.tm-defend [data-present]')?.disabled)));
        }
        // the theory holds: everyone, then the garden at night, where Ryan lights the eighth lantern
        await readUntil(
          t,
          async () => (await s2(t.page)).flags?.['s2:17-lit'] && (await t.page.evaluate(() => window.__game.screen?.world?.scene?.id === 's2-finale' && window.__game.screen.world.mode === 'play')),
          180000,
        );
        expect(t.said.join(' ')).toMatch(/عندي دليل. عندي نظرية/);
        let doc = await s2(t.page);
        expect(doc.flags['s2:17-defended']).toBe(true);
        expect(doc.collected).toContain('s2.ev.d-case');
        expect(t.said.join(' ')).toMatch(/ضويني/);
        await playing(t.page);
        await shot(t, `${tag}-5-lantern`);
        // its light leads to the white roses
        await tapObject(t, 1330);
        await t.page.waitForTimeout(400);
        await shot(t, `${tag}-6-roses`);
        await readUntil(t, async () => (await s2(t.page)).flags?.['s2:17-end'] && (await t.page.evaluate(() => window.__game.screen.world.mode === 'play')), 180000);
        const said = t.said.join(' ');
        // (a line is matched by its first words: a tap can land just as the typing finishes)
        expect(said).toMatch(/تذكرني بذاك اليوم/);
        expect(said).toMatch(dec.lead === 'ryan' ? /الدفتر الرسمي يحتاج آخر ختم/ : /الختم وياي، تذكر/);
        expect(said).toMatch(dec['sister-wish'] === 'read' ? /گريتيها، صح؟/ : /ترجّع البطاقة لفانوسها/);
        expect(said).toMatch({ reassure: /ريان يباوع لأنجي/, tease: /ريان يطلّع دفتر ثاني/, challenge: /عجبچ الفانوس/ }[dec['jealous-talk']]);
        expect(t.said[t.said.length - 1]).toMatch(/ملف الدائرة/); // the last line
        expect(await t.page.evaluate(() => window.__game.game.s2State?.flags?.['s2:17-end'] ?? JSON.parse(localStorage.getItem('snooki-game:s2')).flags['s2:17-end'])).toBe(true);
        await shot(t, `${tag}-7-end`);

        doc = await s2(t.page);
        expect(doc.flags['mission:s2-17']).toBe(true);
        expect(doc.journal).toEqual(expect.arrayContaining(['s2-truth', 's2-m2-end']));
        // the mission's end: the guide card (if any) is dismissed, as a player would
        const card = await t.page.waitForSelector('.guide-card [data-ok]', { timeout: 4000 }).catch(() => null);
        if (card) await press(t, '.guide-card [data-ok]');
        expect(await mainSave(t.page)).toBe(before); // the original campaign's save: byte-identical
        expect(t.errors).toEqual([]);
      }, 600000);
    }
  });
}
