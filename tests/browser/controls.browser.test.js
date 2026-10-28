// @vitest-environment node
/**
 * Moving and jumping together in a REAL browser, through the real input path: on a phone-sized
 * touch viewport the on-screen pad gets real multi-touch (Chrome DevTools Protocol touch points:
 * one finger holds «يمين», a second taps «قفزة»), and a tap on the ground walks her there; on
 * desktop, the arrow keys and Space. Also: on the shared walk, Snooki walks with Ryan.
 * Her movement is recorded on every animation frame inside the page, so the checks hold whatever
 * the machine's load. Synthetic saves only (a fresh profile per test).
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
const SPEED = 155; // physics.js MOVE.speed

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
  server = await createServer({ root: ROOT, configFile: `${ROOT}vite.config.js`, mode: 'test', logLevel: 'silent', server: { port: 5201, strictPort: false, hmr: false } });
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

async function open(phone, scene, flags) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1365, height: 768 } });
  contexts.push(ctx);
  await ctx.addInitScript(() => localStorage.setItem('snooki-game:settings', JSON.stringify({ tips: false })));
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}?timer=1&scene=${scene}&flags=${flags.join(',')}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game?.screen?.world?.mode === 'play', null, { timeout: 20000 });
  await page.evaluate(`window.__game.game.setFlag('husky-name', 'لولو')`);
  await page.waitForTimeout(1500);
  const cdp = phone ? await ctx.newCDPSession(page) : null;
  return { page, cdp, errors };
}
const me = (page) => page.evaluate(() => { const p = window.__game.screen.world.player; return { x: p.x, y: p.y, vx: p.vx, vy: p.vy, ground: p.onGround }; });
const centre = (page, input) => page.evaluate((i) => { const r = document.querySelector(`.pad-btn[data-input="${i}"]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, input);
/** CDP touch: touchStart lists the fingers on the glass (new ones go down); touchEnd lists the fingers that lift. */
const touch = (cdp, type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
/** Record her state on every animation frame in the page (frame-accurate, whatever the load). */
const trace = (page) =>
  page.evaluate(() => {
    window.__trace = [];
    const tick = () => {
      const p = window.__game.screen.world.player;
      window.__trace.push({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, ground: p.onGround });
      window.__traceId = requestAnimationFrame(tick);
    };
    tick();
  });
const stopTrace = (page) => page.evaluate(() => (cancelAnimationFrame(window.__traceId), window.__trace));
const until = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 15000, polling: 'raf' });
const airborne = () => !window.__game.screen.world.player.onGround;
const grounded = () => window.__game.screen.world.player.onGround;
const stopped = () => window.__game.screen.world.player.vx === 0;
const START = ['intro-done', 'map-open', 'met-snooki'];

describe.skipIf(!browser)(`moving and jumping in a real browser${browser ? '' : ` (skipped: ${unavailable})`}`, () => {
  it('phone, two fingers: «يمين» held, «قفزة» tapped — she jumps while running, at full speed, and keeps running; let go: she stops; a cancelled touch never leaves her walking', async () => {
    const { page, cdp, errors } = await open(true, 'garden', START);
    const R = { ...(await centre(page, 'right')), id: 1 };
    const J = { ...(await centre(page, 'jump')), id: 2 };
    await touch(cdp, 'touchStart', [R]);
    await until(page, (v) => window.__game.screen.world.player.vx === v, SPEED);
    await trace(page);
    await touch(cdp, 'touchStart', [R, J]); // second finger down on «قفزة», first still on «يمين»
    await until(page, airborne);
    await touch(cdp, 'touchEnd', [J]); // the jump finger lifts; «يمين» stays held
    await until(page, grounded);
    await page.waitForTimeout(200);
    const tr = await stopTrace(page);
    const air = tr.filter((f) => !f.ground);
    expect(air.length).toBeGreaterThan(3);
    expect(tr.slice(0, tr.indexOf(air[0])).every((f) => f.vx === SPEED)).toBe(true); // no slowing down before the jump
    expect(air.every((f) => f.vx === SPEED)).toBe(true); // full speed through the jump
    expect(tr.at(-1)).toMatchObject({ ground: true, vx: SPEED }); // still running after landing
    await touch(cdp, 'touchEnd', [R]);
    await until(page, stopped);
    // a touch the browser cancels: released, never stuck walking
    await touch(cdp, 'touchStart', [R]);
    await until(page, () => window.__game.screen.world.player.vx > 0);
    await touch(cdp, 'touchCancel', []);
    await until(page, stopped);
    await page.waitForTimeout(300);
    expect((await me(page)).vx).toBe(0);
    expect(errors).toEqual([]);
  }, 90000);

  it('phone: walking to a tapped spot, «قفزة» jumps on the way and she still arrives (REGRESSION: the walk used to stop)', async () => {
    const { page, cdp, errors } = await open(true, 'garden', START);
    const goal = (await me(page)).x + 75; // on screen (a phone shows ~180 world units)
    const p = await page.evaluate(([x]) => { const w = window.__game.screen.world; return w.toScreen(x, w.player.y - 10); }, [goal]);
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.classList.contains('world-canvas'), [p.x, p.y])).toBe(true);
    const J = { ...(await centre(page, 'jump')), id: 3 };
    const G = { x: p.x, y: p.y, id: 6 };
    await trace(page);
    // the tap on the ground and «قفزة» right after it: she jumps as she sets off, whatever the load
    await touch(cdp, 'touchStart', [G]);
    await touch(cdp, 'touchEnd', [G]);
    await touch(cdp, 'touchStart', [J]);
    await until(page, airborne);
    await touch(cdp, 'touchEnd', [J]);
    await until(page, (g) => { const pl = window.__game.screen.world.player; return pl.onGround && Math.abs(pl.x - g) < 8; }, goal);
    const tr = await stopTrace(page);
    // in the air, while the tapped spot is still ahead, she keeps walking toward it: never slowing
    // down (the old code stopped her: vx fell to 0), up to walking speed
    const onTheWay = tr.filter((f) => !f.ground && goal - f.x > 10);
    expect(onTheWay.length).toBeGreaterThan(2);
    expect(onTheWay.every((f, i) => i === 0 || f.vx >= onTheWay[i - 1].vx - 0.01)).toBe(true);
    expect(Math.max(...onTheWay.map((f) => f.vx))).toBeGreaterThan(SPEED * 0.6);
    expect(Math.abs((await me(page)).x - goal)).toBeLessThan(8);
    expect(errors).toEqual([]);
  }, 90000);

  it('phone: standing still, «قفزة» jumps; a second tap in mid-air adds nothing', async () => {
    const { page, cdp, errors } = await open(true, 'garden', START);
    const J = { ...(await centre(page, 'jump')), id: 4 };
    const y0 = (await me(page)).y;
    await touch(cdp, 'touchStart', [J]);
    await until(page, airborne);
    await touch(cdp, 'touchEnd', [J]);
    // near the top of the jump: far from landing, long past the moment after leaving the ground
    await until(page, () => { const pl = window.__game.screen.world.player; return !pl.onGround && pl.vy > -120; });
    await trace(page);
    await touch(cdp, 'touchStart', [J]);
    await page.waitForTimeout(30);
    await touch(cdp, 'touchEnd', [J]);
    await until(page, grounded);
    await page.waitForTimeout(400);
    const tr = await stopTrace(page);
    const vy0 = tr[0].vy;
    expect(tr.every((f) => f.ground || f.vy >= vy0 - 1)).toBe(true); // no new upward push in mid-air
    expect(tr.findIndex((f, i) => i > 0 && !f.ground && tr[i - 1].ground)).toBe(-1); // and no bounce after landing
    expect((await me(page)).y).toBe(y0);
    expect(errors).toEqual([]);
  }, 90000);

  it('desktop keyboard: → held, Space — she jumps while running, at full speed; → let go or the window loses focus: she stops', async () => {
    const { page, errors } = await open(false, 'garden', START);
    await page.keyboard.down('ArrowRight');
    await until(page, (v) => window.__game.screen.world.player.vx === v, SPEED);
    await trace(page);
    await page.keyboard.press('Space');
    await until(page, airborne);
    await until(page, grounded);
    const tr = await stopTrace(page);
    const air = tr.filter((f) => !f.ground);
    expect(air.length).toBeGreaterThan(3);
    expect(air.every((f) => f.vx === SPEED)).toBe(true);
    await page.keyboard.up('ArrowRight');
    await until(page, stopped);
    await page.keyboard.down('ArrowRight');
    await until(page, () => window.__game.screen.world.player.vx > 0);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await until(page, stopped);
    await page.keyboard.up('ArrowRight');
    expect(errors).toEqual([]);
  }, 90000);

  it('phone: on the shared walk Snooki walks with Ryan, her husky with her', async () => {
    const flags = [...START, 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'act7-done', 'final-entered', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done', 'sp1-roads-seen', 'sp1-embrace', 'sp1-visit-done', 'sp1-husky-met', 'tu-walk-plan'];
    const { page, cdp, errors } = await open(true, 'dogwalk', flags);
    const R = { ...(await centre(page, 'right')), id: 5 };
    const x0 = (await me(page)).x;
    await touch(cdp, 'touchStart', [R]);
    await until(page, (x) => window.__game.screen.world.player.x > x + 250, x0); // everyone has caught up
    let withRyan = 0;
    let samples = 0;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(100);
      const d = await page.evaluate(() => { const w = window.__game.screen.world; const s = w.actor('snooki'); return { toRyan: Math.abs(s.x - w.actor('ryan').x), toAnji: Math.abs(s.x - w.player.x), huskyToAnji: Math.abs(w.actor('husky').x - w.player.x), visible: s.visible }; });
      samples++;
      if (d.visible && d.toRyan < d.toAnji && d.huskyToAnji < d.toAnji) withRyan++;
    }
    await touch(cdp, 'touchEnd', [R]);
    expect(withRyan).toBe(samples);
    expect(errors).toEqual([]);
  }, 90000);
});
