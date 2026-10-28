/**
 * The ending under the blue rose tree, interrupted and continued — and the open ending after it.
 *
 * REGRESSION: the meeting was a one-time trigger, and the engine saves a one-time trigger's flag
 * before its actions run (every change is written to the save at once). An ending closed half-way
 * (the app shut at the folded paper, the planting puzzle, the last lines) left `t.final.meet` set
 * and `game-complete` not — and walking back under the rose tree played nothing, for ever.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check } from '../../src/game/core/conditions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { JOURNAL } from '../../src/game/data/items.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

const meet = SCENES.final.triggers.find((t) => t.id === 'meet');
const open = SCENES.final.triggers.find((t) => t.id === 'open');
const BEFORE = { 'intro-done': true, 'map-open': true, 'act7-done': true, 'final-entered': true, 't.final.enter': true, 'notice:sp1': true, 'notice:sp2': true, 'notice:deep': true, 'notice:team': true };
/** Closed half-way through the ending: the meeting has begun, the ending has not completed. */
const INTERRUPTED = { ...BEFORE, 't.final.meet': true, 'drawing-seen': true, 'rose-planted': true };
/** A game completed before the open ending existed. */
const ENDED = { ...INTERRUPTED, 'game-complete': true, 'act8-done': true };
const game = (flags, seen = []) => {
  const g = createGame({ saveManager: null, initial: { ...defaultState(), flags: { ...flags }, seen: [...seen] } });
  g.setFlag(HUSKY_FLAG, 'لولو');
  return g;
};
const lines = (key) => DIALOGUE[key].filter((l) => l.t).map((l) => l.t).join('\n');

describe('the meeting can always continue until the ending has completed', () => {
  it('is bounded by its own condition, not by a flag saved before it runs', () => {
    expect(meet.once).toBe(false);
    expect(meet.if).toEqual(['flag:act7-done', '!flag:game-complete']);
    // the canonical turning point (data/companions.js) is still marked as the meeting begins
    expect(meet.run[0]).toEqual({ fx: 'flag:t.final.meet' });
    expect(meet.run.filter((s) => s.say === 'a8.ending')).toHaveLength(1);
  });

  it('plays for a fresh arrival, again for an interrupted ending, and never after it has completed', () => {
    expect(check(meet.if, game(BEFORE))).toBe(true);
    expect(check(meet.if, game(INTERRUPTED))).toBe(true);
    expect(check(meet.if, game(ENDED))).toBe(false);
    expect(check(meet.if, game({ ...BEFORE, 'act7-done': false }))).toBe(false);
  });

  it('the open ending: once after the ending, for saves finished before it existed too', () => {
    expect(open.once).toBe(false);
    expect(check(open.if, game(INTERRUPTED))).toBe(false); // not before the ending has completed
    expect(check(open.if, game(ENDED))).toBe(true);
    expect(check(open.if, game(ENDED, ['dlg:a8.open']))).toBe(false);
    // the finale plays it straight after the ending, before the gardening hint
    const at = meet.run.findIndex((s) => s.say === 'a8.open');
    expect(at).toBeGreaterThan(meet.run.findIndex((s) => s.say === 'a8.after'));
    expect(meet.run.at(-1).toast).toBeTruthy();
  });
});

describe('the open ending', () => {
  const text = lines('a8.open');

  it('is honest: the chapter is complete, future adventures come with later updates', () => {
    expect(text).toContain('هنا تخلص هالحكاية');
    expect(text).toContain('اتصلي بريان وخليه يصمملچ مهمات جديدة');
    expect(text).toContain('دماغچ شكله تفوّق على دماغ ريان');
    expect(text).toContain('تحديثات جاية');
    expect(text).toContain('الحديقة مفتوحة');
  });

  it('no wedding, no dates, no fake calls or messages', () => {
    expect(text).not.toMatch(/عرس|زواج|زفاف|خطوبة|عروس|خاتم|تزوج/);
    expect(text).not.toMatch(/\d|يوم|شهر|سنة|قريباً|باچر/);
    expect(text).not.toMatch(/رنّ|يرن|مكالمة|رسالة وصلت|انبعثت|أرسلت/);
  });

  it('records the chapter end in her journal', () => {
    expect(DIALOGUE['a8.open'].at(-1)).toEqual({ do: ['journal:ending-open'] });
    expect(JOURNAL['ending-open']?.title).toBeTruthy();
    expect(JOURNAL['ending-open'].text).toContain('تحديثات');
  });
});

/* ── in the real engine ───────────────────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await wait(10);
  }
  throw new Error('timed out');
}

describe('in the engine: walking back under the rose tree', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  /** A synthetic save in the rose garden, then she walks into the meeting place. */
  async function walkIn(flags, seen = []) {
    const g = game(flags, seen);
    app = createGameApp(root, { storage: memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'final', x: 900 } }) }), reducedMotion: true });
    app.settings.set({ tips: false });
    app.go('final', { spawnX: 900 });
    const w = await until(() => app.screen?.world?.actor?.('anji') && app.screen.world);
    for (let i = 0; i < 30; i++) w.tick(1 / 60);
    expect(w.mode).toBe('play');
    w.player.x = 1220;
    for (let i = 0; i < 10; i++) w.tick(1 / 60);
    return w;
  }
  const dialogue = () => root.querySelector('.overlay-dialogue')?.textContent ?? '';
  /** Frames run while the scene plays (camera, Snooki's walk), until `fn` holds. */
  const playUntil = (w, fn) => until(() => (w.tick(1 / 60), fn()), 10000);

  it('REGRESSION: an ending closed half-way resumes the meeting', async () => {
    const w = await walkIn(INTERRUPTED);
    expect(w.mode).toBe('cutscene');
    await playUntil(w, () => dialogue().includes('رياااان'));
    expect(app.game.flag('game-complete')).toBeFalsy();
  });

  it('a completed game from before this update gets the open ending once — and nothing else replays', async () => {
    const w = await walkIn(ENDED);
    expect(w.mode).toBe('cutscene');
    await playUntil(w, () => dialogue().includes('هنا تخلص الحكاية'));
    expect(dialogue()).not.toContain('رياااان');
    // read through to the end, as she would
    await playUntil(w, () => {
      root.querySelector('.overlay-dialogue .dlg-nextbtn')?.click();
      return !root.querySelector('.overlay-dialogue') && w.mode === 'play';
    });
    expect(app.game.journal ?? app.game.state.journal).toContain('ending-open');
    // she walks away and back: it does not play again (the box records it as `dlg:a8.open`)
    w.player.x = 900;
    for (let i = 0; i < 10; i++) w.tick(1 / 60);
    w.player.x = 1220;
    for (let i = 0; i < 60; i++) w.tick(1 / 60);
    expect(w.mode).toBe('play');
    expect(root.querySelector('.overlay-dialogue')).toBeNull();
    expect(app.game.state.journal.filter((j) => j === 'ending-open')).toHaveLength(1);
  });

  it('a completed game that has read the open ending: nothing plays, she just keeps playing', async () => {
    const w = await walkIn(ENDED, ['dlg:a8.open']);
    for (let i = 0; i < 60; i++) w.tick(1 / 60);
    expect(w.mode).toBe('play');
    expect(root.querySelector('.overlay-dialogue')).toBeNull();
  });
});
