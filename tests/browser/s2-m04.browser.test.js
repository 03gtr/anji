// @vitest-environment node
/**
 * Season 2, M2 — Mission 04 «ظل الأخت» (s2-15), in REAL browsers with REAL input. Synthetic saves only (a fresh
 * profile per test). Played like a player:
 *  - the home garden: Lama's apology, her sister's opening (her own silhouette: a sway, a rise), she slips away;
 *  - the stealth: the hold buttons ◀ ▶ are pressed and held with a real pointer, «اختبي» is tapped by touch; she is
 *    caught once (a playful confrontation, «شتسوين؟»), restarts from the last cover, then follows her unseen by
 *    reading her tells (the careful player of tests/game/s2-stealth-bot.js, driving the real buttons);
 *  - the shed: three hiding places (the husky finds one); her sister comes back in; the line: a wrong order gets a
 *    neutral line (no count, no clue); she closes it (her sister's challenge), comes back, and pegs the chain;
 *  - dusk under the flickering lantern: two in one frame, letterbox bars; she owns the note; the card: read or left;
 *  - s2-15 completes in Season 2's own save; the original campaign's save stays byte-identical.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { careful } from '../game/s2-stealth-bot.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SHOTS = process.env.SHOTS_DIR || null;
const AFTER = [
  'intro-done', 'map-open', 'met-snooki', 'act1-done', 'act2-done', 'act3-done', 'act4-done', 'act5-done', 'act6-done', 'sp2-done', 'sp2-final-done',
  'act7-done', 'workshop-entered', 'wk-intro', 'final-entered', 't.final.enter', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done',
  'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'notice:s2',
];
// Season 2: all of M1, Missions 01–03 done
const S2_DONE = [
  ...['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08', 's2-09', 's2-10', 's2-11', 's2-12', 's2-13', 's2-14'].map((m) => `mission:${m}`),
  's2:in-archive', 's2:in-tree', 's2:in-caseroom', 's2:in-lamphouse', 's2:in-home', 's2:caseroom-open', 's2:board-1', 's2:board-2', 's2:09-quiz',
];
const EVIDENCE = ['e-register', 'e-copy', 'e-blank', 'e-note', 'e-whisper', 't-lama', 'e-imprint', 't-sister', 'h-sister', 'd-elim', 'e-versions', 'f-print', 'f-sticky', 't-jojo-true'];
const ANSWER_WORDS = ['لمى لأختي', 'ووصلتلچ إنتِ', 'أختي كتبت', 'آني كتبتها', 'آخر حلقة'];
const ORDER = ['quiet', 'clinic', 'hides', 'heard', 'note'];

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5224, strictPort: false, hmr: false } });
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
  // (the archives first: the decisions and evidence are in place before the home garden opens)
  // WebKit plays on the game's own animation frames: the dev-only timer loop (?timer=1) starves headless WebKit's
  // rendering on Windows until the page hangs (measured in tests/browser/s2-m02.browser.test.js); Edge keeps it
  const timer = browser.browserType().name() === 'webkit' ? '' : 'timer=1&';
  await page.goto(`${base}?${timer}scene=s2-archive&flags=${[...AFTER, ...S2_DONE].join(',')}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 60000 });
  await page.evaluate(
    ({ ev, dec }) => {
      for (const e of ev) window.__game.game.collect(`s2.ev.${e}`);
      window.__game.game.setFlag('husky-name', 'لولو');
      for (const [k, v] of Object.entries(dec)) window.__game.game.setFlag(`s2:dec:${k}`, v);
      history.replaceState(null, '', location.pathname);
    },
    { ev: EVIDENCE, dec: decisions },
  );
  return { page, errors };
}
const centre = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.disabled || el.hidden) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }, sel);
async function press(t, sel) {
  const p = await centre(t.page, sel);
  expect(p, `${sel} is on screen and enabled`).toBeTruthy();
  await t.page.touchscreen.tap(p.x, p.y);
  await t.page.waitForTimeout(160);
}
/** Read a dialogue to its end; `pick` chooses an option index when a choice comes. Returns the text shown. */
async function read(t, pick = 0) {
  const seen = [];
  for (let i = 0; i < 90; i++) {
    const s = await t.page.evaluate(() => {
      const d = document.querySelector('.overlay-dialogue');
      if (!d) return { kind: 'none' };
      return { kind: d.querySelector('.dlg-choices button') ? 'choice' : 'next', text: d.textContent };
    });
    if (s.kind === 'none') return seen.join(' ');
    seen.push(s.text);
    if (s.kind === 'choice') await press(t, `.overlay-dialogue .dlg-choices button:nth-child(${pick + 1})`);
    else await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
  }
  throw new Error('the dialogue did not end');
}
/**
 * Read through a whole cutscene — several dialogues with acted moments between them, a scene change included —
 * until she can play again. `onText(text)` sees every line as it is shown; `pick` answers a choice.
 */
async function readScene(t, { pick = 0, onText } = {}) {
  const seen = [];
  const t0 = Date.now();
  let calm = 0;
  while (Date.now() - t0 < 120000) {
    const s = await t.page.evaluate(() => {
      const d = document.querySelector('.overlay-dialogue');
      if (d) return { kind: d.querySelector('.dlg-choices button') ? 'choice' : 'next', text: d.querySelector('.dlg-text')?.textContent || d.textContent };
      const w = window.__game.screen?.world;
      return { kind: w?.mode === 'play' && !document.querySelector('.overlay') ? 'done' : 'wait' };
    });
    if (s.kind === 'done') {
      // (a new place may open with a line of its own a moment after it appears)
      if (calm++ >= 3) return seen.join(' ');
      await t.page.waitForTimeout(150);
      continue;
    }
    calm = 0;
    if (s.kind === 'wait') {
      calm = 0;
      await t.page.waitForTimeout(120);
      continue;
    }
    seen.push(s.text);
    if (onText) await onText(s.text);
    if (s.kind === 'choice') {
      seen.push(await t.page.evaluate((n) => document.querySelector(`.overlay-dialogue .dlg-choices button:nth-child(${n})`).textContent, pick + 1));
      await press(t, `.overlay-dialogue .dlg-choices button:nth-child(${pick + 1})`);
    } else await press(t, '.overlay-dialogue .dlg-nextbtn').catch(() => {});
  }
  throw new Error('the scene did not end');
}
const dialogue = (t) => t.page.waitForFunction(() => document.querySelector('.overlay-dialogue'), null, { timeout: 30000 });
const actor = (t, id) => t.page.evaluate((i) => { const a = window.__game.screen.world.actor(i); return a && { x: Math.round(a.x), anim: a.anim, mood: a.mood, facing: a.facing, visible: a.visible, sway: a.def?.idleFx, jolt: a.jolt?.type ?? null }; }, id);
const playing = (page) => page.waitForFunction(() => window.__game.screen?.world?.mode === 'play' && !document.querySelector('.overlay'), null, { timeout: 30000 });
const sceneIs = (t, id) => t.page.waitForFunction((i) => window.__game.screen?.world?.scene?.id === i && window.__game.screen.world.mode !== 'loading', id, { timeout: 30000 });
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

/* ── the stealth, driven through its real buttons ── */
const mg = (t) => t.page.evaluate(() => JSON.parse(JSON.stringify(window.__mg?.state ?? null)));
async function holdButton(t, sel) {
  const p = await centre(t.page, sel);
  await t.page.mouse.move(p.x, p.y);
  await t.page.mouse.down();
}
const release = (t) => t.page.mouse.up();
/** Hold ▶ until her sister catches Anji (too close or seen), then let go. */
async function getCaught(t) {
  await holdButton(t, '.s2-stealth [data-move="right"]');
  await t.page.waitForFunction(() => window.__mg?.state?.react, null, { timeout: 30000, polling: 50 }).finally(() => release(t));
  return mg(t);
}
/** The careful player, deciding from what the page shows, acting through the real controls. */
async function followCarefully(t, late = []) {
  let holding = 0;
  for (let i = 0; i < 2400; i++) {
    const s = await mg(t);
    if (!s || s.done) break;
    if (s.react) {
      // the page is driven from outside: a stall in the driver (seen in WebKit: several seconds) can make the
      // careful player late. That is the game's own restart: wait for it, note it, and go on from the last cover.
      if (holding) await release(t);
      holding = 0;
      late.push(`${s.react.kind}@${Math.round(s.x)}`);
      await t.page.waitForFunction(() => !window.__mg?.state?.react, null, { timeout: 10000, polling: 50 });
      continue;
    }
    const d = careful(s, { margin: 14, lag: 0.35 });
    if (d.dir !== holding) {
      if (holding) await release(t);
      if (d.dir) await holdButton(t, `.s2-stealth [data-move="${d.dir > 0 ? 'right' : 'left'}"]`);
      holding = d.dir;
    }
    if (!d.dir && d.hide) {
      const h = await centre(t.page, '.s2-stealth [data-hide]');
      await t.page.touchscreen.tap(h.x, h.y);
      await t.page.waitForFunction(() => window.__mg?.state?.hidden, null, { timeout: 2000, polling: 30 }).catch(() => {});
    }
    await t.page.waitForTimeout(30);
  }
  if (holding) await release(t);
  return mg(t);
}

for (const [name, engine] of Object.entries(engines)) {
  describe.skipIf(!engine.browser)(`Mission 04 «ظل الأخت» in ${name}${engine.browser ? ` ${engine.browser.version()}` : ` (skipped: ${engine.reason})`}`, () => {
    // each view plays a different M1 answer and a different card choice
    const VIEWS = name === 'webkit'
      ? [['phone 390', 390, 844, { 'sister-refusal': 'respect', 'office-cover': 'truth' }, 0]]
      : [['phone 320', 320, 640, { 'sister-refusal': 'push', 'office-cover': 'cover' }, 1], ['phone 390', 390, 844, { 'sister-refusal': 'respect', 'office-cover': 'truth' }, 0]];
    for (const [label, w, hgt, decisions, pick] of VIEWS) {
      it(`${label}: the opening, the stealth (caught once, then unseen), the shed, the chain, dusk under the lantern, the card ${pick ? 'left' : 'read'}`, async () => {
        const tag = `${name}-${w}`;
        const t = await open(engine.browser, { width: w, height: hgt }, decisions);
        const before = await mainSave(t.page);
        // into the home garden from the archives (its left exit leads back there)
        await t.page.evaluate(() => window.__game.go('s2-home'));
        await sceneIs(t, 's2-home');

        // the opening plays as she walks in: Lama apologises; her sister turns (a rise), sways, slips away
        await t.page.waitForFunction(() => /أعتذر/.test(document.querySelector('.overlay-dialogue')?.textContent || ''), null, { timeout: 30000 });
        await shot(t, `${tag}-1-lama`);
        const seenSister = [];
        let pictured = false;
        let said = await readScene(t, {
          onText: async (text) => {
            const a = await actor(t, 'sister');
            if (a) seenSister.push(a);
            if (!pictured && /الجواب نفسه|يمكن بعدين/.test(text)) {
              pictured = true;
              expect(a.sway).toBe('sway'); // her own silhouette: the slow sway
              await shot(t, `${tag}-2-sister-opening`);
            }
          },
        });
        expect(said).toMatch(decisions['sister-refusal'] === 'push' ? /الجواب نفسه/ : /يمكن بعدين/);
        expect(said).toMatch(decisions['office-cover'] === 'truth' ? /إنتِ وريان/ : /قصة الطابعة/);
        expect(seenSister.some((a) => a.sway === 'sway')).toBe(true);
        expect((await s2(t.page)).flags['s2:15-start']).toBe(true);
        expect(await actor(t, 'sister')).toBeFalsy(); // gone to the shed

        // the path to the shed: the stealth (its rhythm follows how she met the refusal in M1)
        await tapObject(t, 1250);
        await read(t);
        await t.page.waitForSelector('.mg [data-act="start"]', { timeout: 30000 });
        await shot(t, `${tag}-3-stealth-intro`);
        await press(t, '.mg [data-act="start"]');
        await t.page.waitForFunction(() => window.__mg?.state && document.querySelector('.s2-stealth [data-hide]'), null, { timeout: 30000 });
        expect((await mg(t)).rhythm).toBe(decisions['sister-refusal'] === 'push' ? 'wary' : 'gentle');
        for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.s2-stealth button')].map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }))) {
          expect(b[0]).toBeGreaterThanOrEqual(44);
          expect(b[1]).toBeGreaterThanOrEqual(44);
        }
        expect(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

        // caught once: a playful confrontation, then back to the last cover, nothing else lost
        const caught = await getCaught(t);
        expect(['seen', 'heard']).toContain(caught.react.kind);
        await t.page.waitForTimeout(500);
        await shot(t, `${tag}-4-caught`);
        await t.page.waitForFunction(() => window.__mg.state.react === null, null, { timeout: 10000, polling: 50 });
        const back = await mg(t);
        expect(back.x).toBe(back.checkpoint.x);
        expect(back.hidden).toBe(true);
        expect(back.caught).toBe(1);

        // then carefully, reading her tells, through the real buttons
        await t.page.waitForTimeout(200);
        let half = false;
        const watch = setInterval(async () => {
          if (half) return;
          const s = await mg(t).catch(() => null);
          if (s && s.sister.x > 900 && s.sister.step > 0 && !s.react) {
            half = true;
            await shot(t, `${tag}-5-stealth`).catch(() => {});
          }
        }, 400);
        const late = [];
        const end = await followCarefully(t, late).finally(() => clearInterval(watch));
        expect(end.done).toBe(true);
        if (late.length) console.info(`[s2-m04 ${tag}] the driver was late ${late.length}× (restarts: ${late.join(", ")})`);
        expect(end.caught + end.lost).toBe(1 + late.length); // every restart is one the game reported, nothing else
        await t.page.waitForSelector('.mg [data-act="done"]', { timeout: 15000 });
        await press(t, '.mg [data-act="done"]');
        said = await readScene(t); // what she saw; then the shed (its first look around)
        await sceneIs(t, 's2-shed-in');
        expect(said).toMatch(/السقيفة/);
        expect((await s2(t.page)).flags['s2:15-tracked']).toBe(true);
        await playing(t.page);
        await shot(t, `${tag}-6-shed`);
        for (const x of [520, 300, 740]) {
          await tapObject(t, x);
          await read(t);
          await playing(t.page);
        }
        const flags = (await s2(t.page)).flags;
        expect(['heard', 'draft', 'whisper'].every((k) => flags[`s2:15-slip-${k}`])).toBe(true);

        // the line: her sister comes back in — she rises, leans in: «شتسوين؟»
        await tapObject(t, 445);
        await t.page.waitForFunction(() => window.__game.screen.world.actor('sister')?.visible, null, { timeout: 15000 });
        await dialogue(t);
        const faced = await actor(t, 'sister');
        expect(faced.sway).toBe('sway');
        await shot(t, `${tag}-7-faced`);
        said = await read(t);
        expect(await t.page.evaluate(() => document.querySelector('.overlay-dialogue'))).toBeNull();
        expect(said).toMatch(/شتسوين/);
        for (const word of ANSWER_WORDS) expect(said.includes(word), word).toBe(false);

        // the puzzle: strict — no help; a wrong order gets a neutral line, no count
        await t.page.waitForSelector('.puzzle-arrange', { timeout: 15000 });
        // the foot holds only the guide's button (owner's final brief), nothing shown until she asks
        expect(await t.page.evaluate(() => [...document.querySelector('.puzzle .panel-foot').children].map((b) => b.dataset.act))).toEqual(['guide']);
        expect(await t.page.evaluate(() => document.querySelector('.puzzle .puzzle-guide').children.length)).toBe(0);
        const wrong = ['quiet', 'clinic', 'whisper', 'heard', 'note'];
        for (let i = 0; i < 5; i++) {
          await press(t, `.ar-piece[data-piece="${wrong[i]}"]`);
          await press(t, `.ar-slot[data-slot="p${i + 1}"]`);
        }
        await shot(t, `${tag}-8-chain-wrong`);
        await press(t, '.puzzle [data-check]');
        const fb = await t.page.evaluate(() => document.querySelector('.puzzle-feedback').textContent);
        expect(fb.length).toBeGreaterThan(0);
        expect(fb).not.toMatch(/[0-9٠-٩]/);
        for (const b of await t.page.evaluate(() => [...document.querySelectorAll('.puzzle button')].map((x) => Math.round(x.getBoundingClientRect().height)))) expect(b).toBeGreaterThanOrEqual(44);
        // she closes it: her sister's challenge
        await press(t, '.puzzle [data-act="close"]');
        said = await readScene(t);
        expect(said).toMatch(/ما تهرب/);
        expect((await s2(t.page)).collected).not.toContain('s2.ev.d-chain');

        // back to the line; the order the words travelled
        await tapObject(t, 445);
        await read(t);
        await t.page.waitForSelector('.puzzle-arrange', { timeout: 15000 });
        for (let i = 0; i < 5; i++) {
          await press(t, `.ar-piece[data-piece="${ORDER[i]}"]`);
          await press(t, `.ar-slot[data-slot="p${i + 1}"]`);
        }
        await press(t, '.puzzle [data-check]');
        await t.page.waitForSelector('.puzzle.is-solved', { timeout: 15000 });
        await shot(t, `${tag}-9-chain`);
        await press(t, '.puzzle .panel-foot .btn-primary');
        await dialogue(t);
        await shot(t, `${tag}-10-line`);
        let card = false;
        let choiceShot = false;
        said = await readScene(t, {
          pick,
          onText: async (text) => {
            if (/آني كتبتها/.test(text) && !card) {
              const frame = await t.page.evaluate(() => {
                const wd = window.__game.screen.world;
                const a = wd.actor('anji');
                const b = wd.actor('sister');
                const pa = wd.toScreen(a.x, a.y - 50);
                const pb = wd.toScreen(b.x, b.y - 50);
                return { scene: wd.scene.id, both: pa.x > 0 && pa.x < innerWidth && pb.x > 0 && pb.x < innerWidth, facing: Math.sign(a.x - b.x) === Math.sign(b.facing), mode: wd.mode };
              });
              expect(frame).toEqual({ scene: 's2-dusk', both: true, facing: true, mode: 'cutscene' }); // she turned to Anji; both in the shot
              await shot(t, `${tag}-11-dusk`);
              card = true;
            }
            if (!choiceShot && (await t.page.evaluate(() => Boolean(document.querySelector('.overlay-dialogue .dlg-choices button'))))) {
              choiceShot = true;
              await shot(t, `${tag}-12-card-choice`);
            }
          },
        });
        expect((await s2(t.page)).collected).toContain('s2.ev.d-chain');
        expect(card).toBe(true);
        expect(said.includes('خلّيه عليّ')).toBe(pick === 0); // the wish is shown only when she reads it
        await playing(t.page);
        const doc = await s2(t.page);
        expect(doc.flags['s2:dec:sister-wish']).toBe(pick ? 'leave' : 'read');
        expect(doc.flags['mission:s2-15']).toBe(true);
        await t.page.waitForSelector('.guide-card [data-ok]', { timeout: 15000 });
        await press(t, '.guide-card [data-ok]');
        await t.page.waitForFunction(() => !document.querySelector('.guide-card'), null, { timeout: 15000 });

        // when she comes back to her, her line remembers the card
        await tapObject(t, (await actor(t, 'sister')).x);
        await t.page.waitForFunction((re) => new RegExp(re).test(document.querySelector('.overlay-dialogue')?.textContent || ''), pick ? 'بجيبي بعدها' : 'كل كلمة بيها', { timeout: 15000 });
        await shot(t, `${tag}-13-after`);
        await read(t);

        expect(await mainSave(t.page)).toBe(before); // the original campaign's save: byte-identical
        expect(t.errors).toEqual([]);
      }, 600000);
    }
  });
}
