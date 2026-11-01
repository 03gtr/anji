// @vitest-environment node
/**
 * Season 2, M2 — Mission 02 «سنوكي ضايع» (s2-13), in REAL browsers with REAL touch input.
 * Synthetic saves only (a fresh profile per test). Played like a player:
 *  - the archive: Sabri (walking Snooki for Ryan) remembers the office; she puts her notebook down at the register
 *    and Snooki snatches it, "gives it back" to Sabri, then takes it from Sabri's hand and runs out of the door;
 *  - the first leg of the chase, by touch on the round buttons: the springboard up to the high route (the fork; a
 *    find up there), and one deliberate fall into a pit after the second checkpoint — back at that checkpoint,
 *    never earlier, the find kept; then to the end of the leg;
 *  - the first fork: every path read in the world, then the strict reading (one wrong try: a neutral line, no
 *    count; then right);
 *  - the other two legs, by touch too, in every view (Edge 320, 360, 390 and landscape; WebKit 390); at 320 she
 *    first leaves the second leg («بعدين») and goes back into it from its path;
 *  - the second fork, read by touch; behind the shed, the stash: the page and the wrapper; her choice (keep or
 *    give back); Ryan comes, Snooki goes back to him; when she comes back, the stash shows what she chose;
 *  - s2-13 completes in Season 2's own save; the original campaign's save stays byte-identical.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SHOTS = process.env.SHOTS_DIR || null;
/**
 * (debugging a stall: M02_LOG=file appends what the test is doing, each leg's progress, and the page's own heartbeat
 * every 500 ms — scene, positions, frames painted — sent to the dev server, a channel apart from Playwright's; each
 * test also saves a Playwright trace, and on failure the game's state and a screenshot, into SHOTS_DIR or
 * the system temp folder's m02-diag)
 */
let lastStep = '(none yet)';
const log = (m) => {
  if (!m.startsWith('  ')) lastStep = m;
  if (process.env.M02_LOG) fs.appendFileSync(process.env.M02_LOG, `${new Date().toISOString().slice(11, 19)} ${m}
`);
};
const AFTER = [
  'intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'sp2-final-done',
  'act7-done', 'workshop-entered', 'wk-intro', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'notice:s2',
];
// Season 2: all of M1 and Mission 01 done
const S2_DONE = [
  ...['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11', 's2-12'].map((m) => `mission:${m}`),
  's2:in-archive', 's2:in-tree', 's2:in-caseroom', 's2:in-lamphouse', 's2:in-office', 's2:caseroom-open', 's2:board-1', 's2:board-2',
];
const STRICT_WRONG = ['ما ركبت. ارجعي للي لگيتيه وفكري مرة ثانية.', 'مو هيچ. خذي وقتچ.', 'بعد ما ركبت. اللي ضبطتيه بقى مثل ما هو.'];
const FORK_1 = { a: 'came', b: 'back', c: 'other', d: 'went', e: 'old', f: 'other' };
const FORK_2 = { a: 'came', b: 'other', c: 'old', d: 'back', e: 'other', f: 'went' };

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
  // (M02_LOG: the page's heartbeat, answered ahead of Vite's own middlewares)
  const heartbeat = {
    name: 'm02-heartbeat',
    configureServer(s) {
      s.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/__hb?')) return next();
        log(`  ♥ ${decodeURIComponent(req.url.slice(6))}`);
        res.statusCode = 204;
        res.end();
      });
    },
  };
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', plugins: process.env.M02_LOG ? [heartbeat] : [], server: { port: 5232, strictPort: false, hmr: false } });
  await server.listen();
  base = server.resolvedUrls.local[0];
}, 60000);
afterAll(async () => {
  for (const e of Object.values(engines)) await within(30000, e.browser?.close() ?? Promise.resolve());
  await server?.close();
}, 60000);
const contexts = [];
const watchdogs = [];
/** Resolve within `ms` or give up (diagnostics must never hang the teardown). */
const within = (ms, p) => Promise.race([p, new Promise((r) => setTimeout(() => r('(timed out)'), ms))]);
afterEach(async ({ task }) => {
  while (watchdogs.length) watchdogs.pop()();
  const failed = task.result?.state === 'fail' || task.result?.errors?.length;
  while (contexts.length) {
    const ctx = contexts.pop();
    const page = ctx.pages()[0];
    if (process.env.M02_LOG && page) {
      const name = task.name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
      if (failed) {
        const state = await within(10000, page.evaluate(() => {
          const g = window.__game;
          const w = g?.screen?.world;
          const m = window.__mg;
          return {
            scene: w?.scene?.id, mode: w?.mode, player: w?.player && { x: Math.round(w.player.x), y: Math.round(w.player.y) },
            overlay: [...document.querySelectorAll('.overlay, .panel, .mg')].filter((e) => !e.hidden).map((e) => e.className),
            dialogue: document.querySelector('.overlay-dialogue')?.textContent?.slice(0, 120) || null,
            mg: m?.state && { x: Math.round(m.state.x), cp: m.state.cp, falls: m.state.falls, done: m.state.done, t: m.state.t, paused: m.paused },
            flags: Object.keys(JSON.parse(localStorage.getItem('snooki-game:s2') || '{}').flags || {}).filter((f) => f.startsWith('s2:13')),
          };
        }).catch((e) => `(evaluate failed: ${e.message})`));
        log(`FAILED ${name}: state ${JSON.stringify(state)}`);
        const dir = SHOTS || path.join(os.tmpdir(), 'm02-diag');
        fs.mkdirSync(dir, { recursive: true });
        log(`FAILED ${name}: screenshot ${await within(15000, page.screenshot({ path: `${dir}/${name}-at-failure.png` }).then(() => 'saved', (e) => e.message))}`);
      }
      const dir = SHOTS || path.join(os.tmpdir(), 'm02-diag');
      fs.mkdirSync(dir, { recursive: true });
      log(`trace ${await within(20000, ctx.tracing.stop({ path: `${dir}/${name}-trace.zip` }).then(() => 'saved', (e) => e.message))}`);
    }
    await within(20000, ctx.close().catch(() => {})); // (a frozen page may never close)
  }
}, 120000);

async function open(browser, { width, height }) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  contexts.push(ctx);
  if (process.env.M02_LOG) {
    await ctx.tracing.start({ screenshots: false, snapshots: false }); // actions and their timings only
    await ctx.addInitScript(() => {
      let frames = 0;
      const count = () => {
        frames++;
        requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
      setInterval(() => {
        try {
          const w = window.__game?.screen?.world;
          const h = w?.actor?.('husky');
          const beat = [
            w?.scene?.id ?? '-', w?.mode ?? '-', `p=${Math.round(w?.player?.x ?? -1)}`, `h=${Math.round(h?.x ?? -1)}${h?.anim ? `/${h.anim}` : ''}`,
            `f=${frames}`, [...document.querySelectorAll('.overlay')].map((o) => o.className.replace(/\s+/g, '.')).join('+') || 'no-overlay',
            window.__mg ? `mg=${Math.round(window.__mg.state?.x ?? -1)}` : '',
          ].join(' ');
          frames = 0;
          fetch(`/__hb?${encodeURIComponent(beat)}`, { keepalive: true }).catch(() => {});
        } catch (e) {
          fetch(`/__hb?${encodeURIComponent(`error ${e.message}`)}`).catch(() => {});
        }
      }, 500);
    });
  }
  await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('crash', () => errors.push('the page crashed'));
  // WebKit runs the game on its own animation frames: the dev-only timer loop (?timer=1, a draw every 16 ms) starves
  // headless WebKit's rendering on Windows until the page hangs (painted frames fell to 0 and the page stopped answering
  // on the first fork, every time); Chromium keeps up with it
  // (M02_TIMER=1 puts WebKit back on the timer loop: the way to reproduce the freeze, e.g. to check the watchdog)
  const timer = browser.browserType().name() === 'webkit' && !process.env.M02_TIMER ? '' : 'timer=1&';
  await page.goto(`${base}?${timer}scene=s2-archive&flags=${[...AFTER, ...S2_DONE].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 60000 });
  await page.evaluate(() => {
    window.__game.game.setFlag('husky-name', 'لولو');
    window.__game.game.setFlag('s2:dec:office-cover', 'cover');
    history.replaceState(null, '', location.pathname);
  });
  // A frozen page answers nothing — not even Playwright's own timeouts fire (seen in WebKit: see the note at the
  // goto above) — so a watchdog asks it for an answer every 10 s; two unanswered probes in a row fail the test at
  // once, naming the freeze, instead of letting it wait out the time limit.
  let fail;
  const frozen = new Promise((_, reject) => {
    fail = reject;
  });
  frozen.catch(() => {}); // (raced by the test)
  let watching = true;
  watchdogs.push(() => {
    watching = false;
  });
  (async () => {
    let silent = 0;
    while (watching) {
      await new Promise((r) => setTimeout(r, 10000));
      if (!watching) return;
      const answer = await within(30000, page.evaluate(() => 1).catch(() => 1)); // (a closed page is not a freeze)
      if (answer === 1) silent = 0;
      else if (++silent >= 2) {
        const at = lastStep;
        log(`FROZEN: no answer to two probes in a row; last step: ${at}`);
        fail(new Error(`the page stopped answering (two probes, 30 s each, unanswered); last step: ${at}`));
        return;
      }
    }
  })();
  return { page, errors, frozen };
}
const centre = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.disabled || el.hidden) return null;
    // (the runner's buttons are fixed over the canvas: never scroll for them)
    if (!el.closest('.runner')) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height, w: r.width };
  }, sel);
async function press(t, sel) {
  const p = await centre(t.page, sel);
  expect(p, `${sel} is on screen and enabled`).toBeTruthy();
  await t.page.touchscreen.tap(p.x, p.y);
  await t.page.waitForTimeout(160);
}
/**
 * Read every dialogue (choosing option `pick`) and wait out the acting between them, until she can play again —
 * or until something else opens (a puzzle, a minigame): returns 'play' or 'other'.
 */
async function settle(t, pick = 0) {
  log('settle');
  let calm = 0;
  for (let i = 0; i < 600; i++) {
    const s = await t.page.evaluate(() => {
      const d = document.querySelector('.overlay-dialogue');
      if (d) return d.querySelector('.dlg-choices button') ? 'choice' : 'next';
      if (document.querySelector('.overlay-game, .overlay-panel')) return 'other';
      if (document.querySelector('.guide-card [data-ok]')) return 'guide';
      return window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay') ? 'play' : 'wait';
    });
    if (s === 'choice') await press(t, `.overlay-dialogue .dlg-choices button:nth-child(${pick + 1})`);
    else if (s === 'next') await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
    else if (s === 'guide') await press(t, '.guide-card [data-ok]');
    else if (s === 'other') return 'other';
    else if (s === 'play') {
      if (++calm >= 4) return 'play';
      await t.page.waitForTimeout(150);
      continue;
    } else await t.page.waitForTimeout(150);
    calm = 0;
  }
  throw new Error('the scene did not settle');
}
const world = (t, fn, arg) => t.page.evaluate(fn, arg);
const px = (t) => world(t, () => window.__game.screen.world.player.x);
/** Walk with the arrow keys to near x (reading whatever happens on the way). */
async function walkTo(t, x) {
  for (let k = 0; k < 20; k++) {
    const dir = Math.sign(x - (await px(t)));
    if (Math.abs(x - (await px(t))) <= 40 || dir === 0) return;
    const key = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
    await t.page.keyboard.down(key);
    await t.page
      .waitForFunction(([ox, d]) => { const w = window.__game.screen.world; return w.mode !== 'play' || document.querySelector('.overlay') || (d > 0 ? w.player.x >= ox - 40 : w.player.x <= ox + 40); }, [x, dir], { timeout: 30000, polling: 50 })
      .finally(() => t.page.keyboard.up(key));
    await settle(t);
  }
}
/** Walk up to it, let the camera settle, then a real tap on it in the world. */
async function tapObject(t, x) {
  log(`tap ${x}`);
  await walkTo(t, x);
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
  const p = await world(t, (ox) => { const w = window.__game.screen.world; return w.toScreen(ox, w.player.y - 50); }, x);
  expect(await t.page.evaluate(({ x: qx, y: qy }) => document.elementFromPoint(qx, qy)?.tagName, p), 'the world is under the tap').toBe('CANVAS');
  await t.page.touchscreen.tap(p.x, p.y);
  await t.page.waitForFunction(() => document.querySelector('.overlay') || window.__game.screen.world.mode !== 'play', null, { timeout: 30000 });
}
const sceneIs = (t, id) => t.page.waitForFunction((i) => window.__game.screen?.world?.scene?.id === i && window.__game.screen.world.mode !== 'loading', id, { timeout: 30000 });
const s2 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('snooki-game:s2') || '{}'));
const mainSave = (page) => page.evaluate(() => localStorage.getItem('snooki-game:save'));
// (WebKit on Windows: a page screenshot of an outdoor place reached by a scene change can freeze the page — seen
// with places of the original game too, and never without the screenshot — so WebKit takes its pictures indoors only)
const shot = async (t, name) => SHOTS && !t.shotsOff && (fs.mkdirSync(SHOTS, { recursive: true }), t.page.screenshot({ path: `${SHOTS}/${name}.png` }));

/**
 * One leg of the chase, by touch on its two round buttons. A good runner (taps a little early: a touch takes a
 * moment to arrive); `high`: the springboard and the high route; `fallAfter`: once past that checkpoint she lets
 * herself fall into the next pit (once).
 */
async function runLeg(t, { high = false, fallAfter = null, tag = '' } = {}) {
  log(`leg ${tag}`);
  await t.page.waitForSelector('.mg [data-act="start"]');
  await press(t, '.mg [data-act="start"]');
  await t.page.waitForFunction(() => window.__mg?.state && !window.__mg.paused, null, { timeout: 30000 });
  const jumpAt = await centre(t.page, '.runner-jump');
  const slideAt = await centre(t.page, '.runner-slide');
  expect(Math.min(jumpAt.h, jumpAt.w, slideAt.h, slideAt.w)).toBeGreaterThanOrEqual(44);
  expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); // no sideways scroll
  const out = { restartAt: null, cpAtFall: null, foundAtFall: null };
  let fell = false;
  let shots = 0;
  const began = Date.now();
  const until = began + 300000;
  let last = null;
  let polls = 0;
  let noted = began;
  log(`leg ${tag} started`);
  while (Date.now() < until) {
    if (Date.now() - noted >= 10000) {
      noted = Date.now();
      log(`  · ${tag} ${Math.round((noted - began) / 1000)}s x=${Math.round(last?.x ?? 0)} cp=${last?.cp} falls=${last?.falls} high=${last?.onHigh} dog=${last?.dog} polls/s=${(polls / ((noted - began) / 1000)).toFixed(1)}`);
    }
    polls++;
    const st = await t.page.evaluate(
      ({ hi, fallAt }) => {
        const m = window.__mg;
        const s = m.state;
        const c = m.course;
        const onHigh = s.support && s.support !== 'ground';
        let act = null;
        if (s.falling > 0 || s.done) return { done: s.done, x: s.x, cp: s.cp, falls: s.falls, falling: s.falling > 0, found: [...s.found], dog: s.dog.state, onHigh };
        if (onHigh) {
          const hz = c.highHazards.find((x) => x.x - s.x > 40 && x.x - s.x < 72);
          const edge = s.support.x1 - s.x;
          const more = c.platforms.some((p) => p !== s.support && p.x0 > s.support.x1 && p.x0 - s.support.x1 < 140);
          if (hz || (more && edge > 12 && edge < 38)) act = 'jump';
        } else if (hi && s.support === 'ground' && c.springs.some((sp) => sp.x - s.x > 4 && sp.x - s.x < 26)) act = 'jump';
        else if (s.support !== null) {
          const hz = c.hazards.find((x) => x.x + x.w / 2 > s.x - 12 && x.x - s.x < 110);
          if (hz) {
            const d = hz.x - s.x;
            if (hz.kind === 'duck' && d < 68 && d > 40 && s.slide <= 0) act = 'slide';
            else if (hz.kind === 'pit' && d < hz.w / 2 + 34 && d > hz.w / 2 + 2 && !(fallAt !== null && s.cp >= fallAt)) act = 'jump';
            else if (hz.kind === 'low' && d < 72 && d > 44) act = 'jump';
          }
        }
        return { act, done: s.done, x: s.x, cp: s.cp, falls: s.falls, falling: false, found: [...s.found], dog: s.dog.state, onHigh };
      },
      { hi: high, fallAt: fallAfter !== null && !fell ? fallAfter : null },
    );
    last = st;
    if (st.done) break;
    if (fallAfter !== null && !fell && st.falls > 0) {
      fell = true;
      out.cpAtFall = st.cp;
      out.foundAtFall = st.found;
      await t.page.waitForFunction(() => window.__mg.state.falling <= 0, null, { timeout: 10000, polling: 30 });
      out.restartAt = await t.page.evaluate(() => ({ x: window.__mg.state.x, cp: window.__mg.state.cp, cpx: window.__mg.course.checkpoints[window.__mg.state.cp], found: [...window.__mg.state.found] }));
      await shot(t, `${tag}-fall-restart`);
      continue;
    }
    if (st.act === 'jump') await t.page.touchscreen.tap(jumpAt.x, jumpAt.y);
    else if (st.act === 'slide') await t.page.touchscreen.tap(slideAt.x, slideAt.y);
    if (st.onHigh && shots === 0) {
      shots++;
      await shot(t, `${tag}-high-route`);
    }
  }
  log(`leg ${tag} ${last?.done ? 'done' : 'NOT done'} in ${Math.round((Date.now() - began) / 1000)}s: x=${Math.round(last?.x ?? 0)} cp=${last?.cp} falls=${last?.falls} found=${last?.found} polls/s=${(polls / ((Date.now() - began) / 1000)).toFixed(1)}`);
  expect(last?.done, `the leg ended: ${JSON.stringify(last)}`).toBe(true);
  await t.page.waitForSelector('.mg-result [data-act="done"]', { timeout: 30000 });
  await shot(t, `${tag}-leg-done`);
  out.final = await t.page.evaluate(() => ({ found: [...window.__mg.state.found], stumbles: window.__mg.state.stumbles, falls: window.__mg.state.falls, t: window.__mg.state.t }));
  await press(t, '.mg-result [data-act="done"]');
  return out;
}
/** Leave a leg at its intro («بعدين»), as a player may — the leg waits for her. */
async function skipLeg(t) {
  await t.page.waitForSelector('.mg [data-act="exit"]');
  await press(t, '.mg [data-act="exit"]');
  expect(await settle(t)).toBe('play');
}
/** A trail reading, by touch: each path into its column (optionally one wrong try first). */
async function readTrail(t, answer, { wrongFirst = false } = {}) {
  log('reading');
  await t.page.waitForSelector('.panel.puzzle .sort-card');
  expect(await t.page.evaluate(() => document.querySelectorAll('.panel.puzzle [data-act="hint"], .panel.puzzle [data-act="solution"], .panel.puzzle [data-act="skip"]').length)).toBe(0);
  for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.panel.puzzle .sort-card, .panel.puzzle .sort-bin-head, .panel.puzzle [data-submit]')].map((x) => Math.round(x.getBoundingClientRect().height)))) expect(b).toBeGreaterThanOrEqual(44);
  expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const place = async (id, bin) => {
    await press(t, `.panel.puzzle .sort-card[data-card="${id}"]`);
    await press(t, `.panel.puzzle .sort-bin-head[data-bin="${bin}"]`);
  };
  const ids = Object.keys(answer);
  if (wrongFirst) {
    // the way he went and the way he came, swapped
    const went = ids.find((k) => answer[k] === 'went');
    const came = ids.find((k) => answer[k] === 'came');
    for (const id of ids) await place(id, id === went ? 'came' : id === came ? 'went' : answer[id]);
    await press(t, '.panel.puzzle [data-submit]');
    const fb = await t.page.evaluate(() => document.querySelector('.panel.puzzle .puzzle-feedback').textContent);
    expect(STRICT_WRONG).toContain(fb);
    expect(fb).not.toMatch(/[0-9٠-٩]/);
    for (const id of [went, came]) await press(t, `.panel.puzzle [data-unplace="${id}"]`);
    for (const id of [went, came]) await place(id, answer[id]);
  } else for (const id of ids) await place(id, answer[id]);
  await press(t, '.panel.puzzle [data-submit]');
  await t.page.waitForSelector('.panel.puzzle.is-solved');
  await press(t, '.panel.puzzle .panel-foot .btn-primary');
}

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Mission 02 «سنوكي ضايع» in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    // [label, width, height, leave the second leg once first, stash choice]
    const VIEWS =
      name === 'webkit'
        ? [['phone 390', 390, 844, false, 1]]
        : [['phone 320', 320, 640, true, 0], ['phone 360', 360, 780, false, 1], ['phone 390', 390, 844, false, 1], ['landscape 844', 844, 390, false, 0]];
    for (const [label, w, h, leaveOnce, pick] of VIEWS) {
      const choice = pick === 0 ? 'return' : 'keep';
      it(`${label}: the snatch, the chase by touch (a fork, a fall back to its checkpoint), the trail read, the stash (${choice}), Ryan`, async () => {
        const t = await open(engine.browser, { width: w, height: h });
        await Promise.race([
          t.frozen,
          (async () => {
            const tag = `${name}-${w}`;
            expect(await settle(t)).toBe('play');
            const before = await mainSave(t.page);

            // the archive: Sabri explains (and remembers the office); she goes to the register
            await walkTo(t, 260);
            await shot(t, `${tag}-1-archive`);
            expect((await s2(t.page)).flags['s2:13-met']).toBe(true);
            await tapObject(t, 520);
            expect(await settle(t)).toBe('play');
            let doc = await s2(t.page);
            expect(doc.flags['s2:13-gave']).toBe(true); // Snooki "returned" it… to Sabri
            expect(await world(t, () => Math.round(window.__game.screen.world.actor('snooki').x))).toBeLessThan(330); // he walked to Sabri with it
            await tapObject(t, 330);
            // Sabri holds it out — and Snooki takes it, and is gone
            await press(t, '.overlay-dialogue .dlg-nextbtn');
            await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
            await t.page.waitForFunction(() => /سنوكي!!/.test(document.querySelector('.overlay-dialogue')?.textContent || ''), null, { timeout: 20000 });
            expect(await world(t, () => window.__game.screen.world.actor('snooki').x)).toBeLessThan(120);
            await shot(t, `${tag}-2-snatched-back`);
            expect(await settle(t)).toBe('play');
            doc = await s2(t.page);
            expect(doc.flags['s2:13-stolen']).toBe(true);
            expect(await world(t, () => window.__game.screen.world.actor('snooki').visible)).toBe(false); // never her companion

            // the first leg, by touch: the high route at the fork (a find up there), a fall after the second checkpoint
            await tapObject(t, 70);
            expect(await settle(t)).toBe('other');
            const leg1 = await runLeg(t, { high: true, fallAfter: 2, tag: `${tag}-3-leg1` });
            if (name === 'webkit') t.shotsOff = true;
            expect(leg1.restartAt.cp).toBe(2);
            expect(leg1.restartAt.x).toBeGreaterThanOrEqual(leg1.restartAt.cpx); // back at the checkpoint she passed, not the start
            expect(leg1.restartAt.x).toBeLessThan(leg1.restartAt.cpx + 40); // (read a frame or two after the restart)
            expect(leg1.restartAt.found).toEqual(leg1.foundAtFall); // what she found stays found
            expect(leg1.final.found).toContain('ball'); // the high route's find
            expect(leg1.final.falls).toBe(1);
            expect(leg1.final.t).toBeGreaterThanOrEqual(60);
            doc = await s2(t.page);
            expect(doc.flags['s2:13-find-ball']).toBe(true);
            expect(doc.flags['s2:13-cp-0']).toBeFalsy(); // a finished leg starts from its beginning next time

            // the first fork: every path read in the world, then the reading
            expect(await settle(t)).toBe('play');
            await sceneIs(t, 's2-trail');
            expect(await settle(t)).toBe('play'); // her husky sniffs about; Anji will read the marks herself
            doc = await s2(t.page);
            expect(doc.flags['s2:13-leg1']).toBe(true);
            for (const [id, x] of [['a', 190], ['b', 340], ['c', 490], ['d', 700], ['e', 850], ['f', 1000]]) {
              await tapObject(t, x);
              expect(await settle(t)).toBe('play');
              expect((await s2(t.page)).flags[`s2:13-m1-${id}`]).toBe(true);
              if (id === 'b') await shot(t, `${tag}-4-marks`);
            }
            await tapObject(t, 595);
            expect(await settle(t)).toBe('other');
            await shot(t, `${tag}-5-reading`);
            await readTrail(t, FORK_1, { wrongFirst: true });
            expect(await settle(t)).toBe('other'); // the second leg opens
            expect((await s2(t.page)).flags['s2:13-fork1']).toBe(true);
            if (leaveOnce) {
              await skipLeg(t); // «بعدين»: she leaves the leg…
              expect((await s2(t.page)).flags['s2:13-leg2']).toBeFalsy();
              await tapObject(t, 700); // …and the path he took leads her back into it
              expect(await settle(t)).toBe('other');
            }
            await runLeg(t, { high: true, tag: `${tag}-6-leg2` });
            expect(await settle(t)).toBe('play');
            await sceneIs(t, 's2-shed');

            // the second fork: her husky barks at the wrong path; she reads the marks herself
            expect(await settle(t)).toBe('play');
            for (const [id, x] of [['a', 170], ['b', 320], ['c', 470], ['d', 690], ['e', 820], ['f', 930]]) {
              await tapObject(t, x);
              expect(await settle(t)).toBe('play');
              expect((await s2(t.page)).flags[`s2:13-m2-${id}`]).toBe(true);
            }
            await tapObject(t, 580);
            expect(await settle(t)).toBe('other');
            await readTrail(t, FORK_2);
            expect(await settle(t)).toBe('other'); // up on the roof — the third leg
            await shot(t, `${tag}-7-roof-leg`);
            await runLeg(t, { high: true, tag: `${tag}-8-leg3` });
            expect(await settle(t)).toBe('play');
            await t.page.waitForFunction(() => window.__game.screen?.world?.player?.x > 1250 && window.__game.screen.world.mode !== 'loading', null, { timeout: 30000 });

            // behind the shed: Snooki sits by the husky's stash, innocent; her notebook on top
            expect(await settle(t)).toBe('play');
            await shot(t, `${tag}-9-stash`);
            await tapObject(t, 1400);
            // the page, the wrapper; her choice; Snooki will not say where Ryan is; Ryan comes, laughing
            for (let i = 0; i < 8; i++) {
              await settle(t, pick);
              if ((await s2(t.page)).flags['s2:13-done']) break;
              if (await world(t, () => Boolean(window.__game.screen.world.actor('ryan'))) && i === 0) await shot(t, `${tag}-10-ryan`);
            }
            doc = await s2(t.page);
            expect(doc.flags['s2:dec:stash']).toBe(choice);
            expect(doc.collected).toEqual(expect.arrayContaining(['s2.ev.e-page', 's2.ev.e-wrapper']));
            expect(doc.flags['mission:s2-13']).toBe(true);
            expect(await world(t, () => window.__game.screen.world.actor('snooki')?.visible)).toBe(false); // he left with Ryan
            await shot(t, `${tag}-11-done`);

            // when she comes back to the stash, it (and her husky) show what she chose
            await tapObject(t, 1400);
            await t.page.waitForFunction((re) => new RegExp(re).test(document.querySelector('.overlay-dialogue')?.textContent || ''), choice === 'return' ? 'حارستها' : 'بلا صفحة', { timeout: 20000 });
            expect(await settle(t)).toBe('play');

            expect(await mainSave(t.page)).toBe(before); // the original campaign's save: byte-identical
            expect(t.errors).toEqual([]);
          })(),
        ]);
      }, name === 'webkit' ? 1200000 : 900000); // WebKit plays on its own (slower) frames: see the note at the goto
    }
  });
}
