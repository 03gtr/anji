/**
 * «حديقة الآثار الكاذبة» (the deep garden, mission «الفرضيات الأربع», step one) — reported on a real
 * phone: «خطوط متساوية 🔎» and the rest were examined, and the investigation never went on.
 *
 * REGRESSION: the board «أي أثر؟» waited for `seen:dg.trail-wide` (and the others), but the dialogue
 * box records a line it has played as `dlg:dg.trail-wide` — so it said «قبل ما أحكم…» for ever and the
 * puzzle that completes the step never opened. The same mistake made every deep-garden board's
 * one-time intro (`once`) play again on every visit. The board now names what is still left to look
 * at; the step's hint says where to look.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check } from '../../src/game/core/conditions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DEEP_SCENES } from '../../src/game/data/scenes/deep.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { MISSIONS_DEEP } from '../../src/game/data/missions-deep.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { WORLDS, worldById } from '../../src/game/data/worlds.js';
import { missionState } from '../../src/game/progression/missions.js';
import { HUSKY_FLAG } from '../../src/game/core/names.js';
import { memoryStorage } from '../helpers.js';

/* ── every «seen:» condition in the game can come true ─────────────────── */
const EFFECT_KEYS = new Set(['fx', 'do', 'reward', 'goldReward']);
function collect(node, parentKey, out, seen = new Set()) {
  if (node == null || typeof node === 'function' || seen.has(node)) return;
  if (typeof node === 'string') {
    const m = node.match(/^!?seen:(.+)$/);
    if (m) out.push({ key: m[1], effect: EFFECT_KEYS.has(parentKey) });
    return;
  }
  if (typeof node !== 'object') return;
  seen.add(node);
  if (Array.isArray(node)) node.forEach((v) => collect(v, parentKey, out, seen));
  else for (const [k, v] of Object.entries(node)) collect(v, k, out, seen);
}

describe('every «seen:» condition refers to something the game actually records', () => {
  const all = [];
  collect([SCENES, DEEP_SCENES, DIALOGUE, MISSIONS, MISSIONS_DEEP, PUZZLES, WORLDS], null, all);
  const written = new Set(all.filter((a) => a.effect).map((a) => a.key));
  const conditions = all.filter((a) => !a.effect);

  it('there are such conditions to check (the false-trails board among them)', () => {
    expect(conditions.map((c) => c.key)).toContain('dlg:dg.trail-even');
  });
  it('each is a played dialogue (dlg:), an examined object (it.<scene>.<id>), a cinematic (cine:), or a key a «seen:» effect writes', () => {
    const bad = conditions.filter(({ key }) => !/^(dlg:|it\.[\w-]+\.[\w-]+$|cine:)/.test(key) && !written.has(key)).map((c) => c.key);
    expect(bad).toEqual([]);
  });
  it('a dlg: key names a dialogue that exists', () => {
    const missing = conditions.filter(({ key }) => key.startsWith('dlg:') && !DIALOGUE[key.slice(4)]).map((c) => c.key);
    expect(missing).toEqual([]);
  });
});

/* ── the investigation, played in the app ─────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
let storage;
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
const $ = (sel) => root.querySelector(sel);
const $$ = (sel) => [...root.querySelectorAll(sel)];
/** After the ending, Ryan's box opened: the deep garden is open; she has not been in the false trails yet. */
const OPEN = ['intro-done', 'map-open', 'met-snooki', 'act7-done', 'final-entered', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done', 'dg-box', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team'];
const CLUES = { rake: 230, 'trail-wide': 520, 'trail-even': 860, 'trail-paws': 1180 };
const STATION = 1330;
const mission = MISSIONS_DEEP.find((m) => m.id === 'dg-trails');

describe('in the app: «حديقة الآثار الكاذبة»', () => {
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

  async function enter(flags, seen = [], keep = false) {
    if (!keep) {
      const g = createGame({ saveManager: null, initial: { ...defaultState() } });
      g.setFlags(flags);
      g.setFlag(HUSKY_FLAG, 'لولو');
      g.state.seen.push('dlg:a8.open', ...seen);
      storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'falsetrails', x: 200 } }) });
    }
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    app.go('falsetrails', { spawnX: 200 }); // through the entrance: the arrival plays first, as for a player
    const w = await until(() => app.screen?.world?.actor?.('anji') && app.screen.world);
    await play(w); // the arrival line, if any
    return w;
  }
  /** Let the scene run and read every line to the end (the dialogue box's «التالي»). */
  async function play(w) {
    for (let i = 0; i < 400; i++) {
      w.tick(1 / 60);
      $('.overlay-dialogue .dlg-nextbtn')?.click();
      await wait(2);
      if (!$('.overlay') && w.mode === 'play') return;
    }
    throw new Error('the scene did not come back to play');
  }
  /** Stand by an object and examine it (what «فحص» does); return the dialogue's first text. */
  async function examine(w, x) {
    w.player.x = x;
    for (let i = 0; i < 5; i++) w.tick(1 / 60);
    w.interact();
    // the line as it shows: the box writes it out word by word and marks itself ready when done
    await until(() => (w.tick(1 / 60), $('[data-suspect]') || $('.overlay-dialogue .is-ready, .overlay-dialogue.is-ready')), 8000);
    return $('.overlay-dialogue .dlg-text')?.textContent ?? '';
  }
  const lineOf = (key) => DIALOGUE[key][0].t;

  it('REGRESSION: having looked at everything, «أي أثر؟» opens the puzzle (it used to wait for ever)', async () => {
    const w = await enter(OPEN);
    expect(missionState(mission, app.game)).toMatchObject({ status: 'active', step: 0 });
    for (const x of Object.values(CLUES)) {
      await examine(w, x);
      await play(w);
    }
    await examine(w, STATION);
    await until(() => (w.tick(1 / 60), $('.overlay-dialogue .dlg-nextbtn')?.click(), $('[data-suspect]')), 8000);
    expect($$('[data-suspect]').map((b) => b.dataset.suspect)).toEqual(['wide', 'even', 'paws']);
  });

  it('before that, the board says which clue is still left — along the path, one at a time', async () => {
    const w = await enter(OPEN);
    expect(await examine(w, STATION)).toContain(lineOf('dg.tracks-wait-rake').slice(-30));
    await play(w);
    await examine(w, CLUES.rake);
    await play(w);
    expect(await examine(w, STATION)).toContain(lineOf('dg.tracks-wait-wide').slice(-30));
    await play(w);
    await examine(w, CLUES['trail-wide']);
    await play(w);
    await examine(w, CLUES['trail-paws']);
    await play(w);
    expect(await examine(w, STATION)).toContain(lineOf('dg.tracks-wait-even').slice(-30)); // the one she skipped
    await play(w);
    expect(app.game.flag('dg-trails')).toBeFalsy();
    expect($('[data-suspect]')).toBeNull();
  });

  it('a wrong trail is refused; the true one completes the step once: journal, next place, next step; the intro plays once', async () => {
    let w = await enter(OPEN, ['dlg:dg.rake', 'dlg:dg.trail-wide', 'dlg:dg.trail-even', 'dlg:dg.trail-paws']);
    const hyporoom = worldById('hyporoom');
    expect(check(hyporoom.unlock, app.game)).toBe(false);
    await examine(w, STATION);
    await until(() => (w.tick(1 / 60), $('.overlay-dialogue .dlg-nextbtn')?.click(), $('[data-suspect]')), 8000);
    expect(app.game.seen('dlg:dg.tracks-intro')).toBe(true);
    // wrong: the even lines, with the dust and the rake
    $('[data-suspect="even"]').click();
    $('[data-evidence="dust"]').click();
    $('[data-evidence="rake"]').click();
    $('[data-submit]').click();
    await wait(20);
    expect(app.game.flag('dg-trails')).toBeFalsy();
    // right: the small paws — wet, and the crumbs along them
    $('[data-evidence="dust"]').click();
    $('[data-evidence="rake"]').click();
    $('[data-suspect="paws"]').click();
    $('[data-evidence="wet"]').click();
    $('[data-evidence="crumbs"]').click();
    $('[data-submit]').click();
    await until(() => app.game.flag('dg-trails'));
    $('.puzzle .btn-big')?.click();
    await play(w);
    expect(app.game.state.journal.filter((j) => j === 'dg-trails')).toHaveLength(1);
    expect(check(hyporoom.unlock, app.game)).toBe(true); // the next place opens on the map
    expect(missionState(mission, app.game)).toMatchObject({ status: 'active', step: 1 }); // the next step: the four hypotheses
    expect(mission.steps[1].world).toBe('hyporoom');
    // back to the board: its «again» line, nothing twice, no intro again
    const again = await examine(w, STATION);
    expect(again).toContain(lineOf('dg.tracks-again'));
    expect(again).not.toContain(lineOf('dg.tracks-intro'));
    await play(w);
    // reload: kept, nothing replayed
    app.destroy();
    w = await enter([], [], true);
    expect(app.game.flag('dg-trails')).toBe(true);
    expect(app.game.state.journal.filter((j) => j === 'dg-trails')).toHaveLength(1);
    expect(await examine(w, STATION)).toContain(lineOf('dg.tracks-again'));
  });

  it('a save from before this update (clues read, stuck at the board): the puzzle opens straight away', async () => {
    const w = await enter(OPEN, ['dlg:dg.rake', 'dlg:dg.trail-wide', 'dlg:dg.trail-even', 'dlg:dg.trail-paws', 'dlg:dg.falsetrails-enter']);
    await examine(w, STATION);
    await until(() => (w.tick(1 / 60), $('.overlay-dialogue .dlg-nextbtn')?.click(), $('[data-suspect]')), 8000);
  });

  it('the step\'s hint says where to look (the three trails, the rake, then «أي أثر؟»)', () => {
    expect(mission.steps[0].hint).toMatch(/الآثار الثلاثة والگرابة/);
    expect(mission.steps[0].hint).toMatch(/«أي أثر؟»/);
  });
});
