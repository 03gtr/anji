/**
 * «شفرة الصندوق» (Story Pack 01) and every other symbol cipher: solvable with the letters on the pad.
 *
 * REGRESSION: the box lock showed its key (🌹 = و, 💙 = د) but did not fill those two symbols in,
 * and its letter pad had neither و nor د — so «تأكيد» could never be pressed with the answer and the
 * box could not be opened (seen on a real phone). «السطر المكتوب بالرموز» (Story Pack 02) had the
 * same defect (ي and ن). The solver tests never noticed: they set the answer letters directly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check } from '../../src/game/core/conditions.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { RULES } from '../../src/game/puzzles/rules.js';
import { memoryStorage } from '../helpers.js';

const CIPHERS = Object.entries(PUZZLES).filter(([, p]) => p.type === 'cipher');

describe('every symbol cipher can be solved from its own letter pad', () => {
  it('there are ciphers to check (the box lock among them)', () => {
    expect(CIPHERS.map(([id]) => id)).toContain('sp1-cipher');
    expect(CIPHERS.length).toBeGreaterThanOrEqual(5);
  });

  for (const [id, p] of CIPHERS) {
    const c = p.config;
    it(`${id} «${p.title}»: the pad has every letter she must place; the key and the filled-in letters agree with the answer`, () => {
      expect(c.glyphs.length).toBe(c.word.length);
      const toPlace = c.word.filter((_, i) => c.given?.[i] == null);
      for (const l of toPlace) expect(c.letters, `letter «${l}» is on the pad`).toContain(l);
      for (const [i, l] of Object.entries(c.given || {})) expect(c.word[i]).toBe(l);
      for (const [g, l] of c.key || []) {
        expect(c.glyphs).toContain(g);
        c.glyphs.forEach((x, i) => x === g && expect(c.word[i]).toBe(l));
      }
      // one symbol, one letter (the cipher fills every copy of a symbol with the same letter)
      c.glyphs.forEach((g, i) => c.glyphs.forEach((h, k) => g === h && expect(c.word[i]).toBe(c.word[k])));
      // played only with pad letters, the rule accepts it
      let s = RULES.cipher.init(c);
      c.word.forEach((l, i) => c.given?.[i] == null && (s = RULES.cipher.set(c, s, i, l).state));
      expect(RULES.cipher.submit(c, s).outcome).toBe('solved');
    });
  }
});

describe('«شفرة الصندوق»: the answer is «وعد»', () => {
  const c = PUZZLES['sp1-cipher'].config;

  it('the clues lead to it: 🌹 = و and 💙 = د from the key, 🌙 = «أول حرف من عيد» = ع, in the middle', () => {
    expect(c.word.join('')).toBe('وعد');
    expect(c.key).toEqual([['sym:rose', 'و'], ['sym:heart', 'د']]);
    expect(c.glyphs).toEqual(['sym:rose', 'sym:moon-crescent', 'sym:heart']); // read right to left: 🌹 🌙 💙
    expect(PUZZLES['sp1-cipher'].hints[1]).toMatch(/القمر بالنص… وهو أول حرف من «عيد»/);
  });

  it('still a riddle: the moon is not given away, and a look-alike letter (غ) sits on the pad', () => {
    expect(c.given?.[1]).toBeUndefined();
    expect(c.letters).toContain('غ');
    expect(PUZZLES['sp1-cipher'].goal + PUZZLES['sp1-cipher'].intro).not.toContain('وعد');
  });

  it('wrong answers are rejected: one more mistake each time, never solved', () => {
    for (const guess of [['و', 'غ', 'د'], ['د', 'ع', 'و'], ['و', 'ن', 'د']]) {
      let s = RULES.cipher.init(c);
      guess.forEach((l, i) => (s = RULES.cipher.set(c, s, i, l).state));
      const out = RULES.cipher.submit(c, s);
      expect(out.outcome).toBe('wrong');
      expect(out.state.mistakes).toBe(1);
    }
  });
});

/* ── on the real puzzle screen ─────────────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 5000) {
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
const BOX_READY = ['intro-done', 'map-open', 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'sp1-husky-met', 'sp1-gift-box', 'sp1-clue-1', 'sp1-clue-2', 'sp1-clue-3'];
const gift = SCENES.roads?.interact?.find((i) => i.id === 'gift-box') ?? Object.values(SCENES).flatMap((s) => s.interact || []).find((i) => i.id === 'gift-box');

describe('«شفرة الصندوق» on the puzzle screen', () => {
  let storage;
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
    const g = createGame({ saveManager: null, initial: { ...defaultState() } });
    g.setFlags(BOX_READY);
    storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'house', x: 300 } }) });
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });
  const boot = async () => {
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false, hints: true });
    await app.toTitle();
  };
  /** Select a symbol, then a letter on the pad — as she taps them. */
  async function place(i, letter) {
    $(`.cipher-cell[data-cell="${i}"]`).click();
    await wait(2);
    const key = $(`.cipher-pad [data-letter="${letter}"]`);
    expect(key, `«${letter}» is on the pad`).toBeTruthy();
    key.click();
    await wait(2);
  }

  it('REGRESSION: solved with the pad alone — wrong answer refused, «وعد» opens it; reward once; kept after a reload', async () => {
    await boot();
    expect(check(gift.if, app.game)).toBe(true);
    const done = app.ui.puzzle('sp1-cipher');
    await until(() => $('.cipher-row'));
    // right-to-left: the row is RTL and its cells are in the answer's order (first cell = rightmost)
    expect($('.cipher-row').getAttribute('dir')).toBe('rtl');
    expect($$('.cipher-cell').map((b) => b.dataset.cell)).toEqual(['0', '1', '2']);
    expect($$('.cipher-key span').map((s) => s.textContent.replace(/\s/g, ''))).toEqual(expect.arrayContaining([expect.stringContaining('=و'), expect.stringContaining('=د')]));
    // a wrong moon: refused
    await place(0, 'و');
    await place(1, 'غ');
    await place(2, 'د');
    $('[data-submit]').click();
    await wait(5);
    expect(app.game.flag('sp1-gift-open')).toBeFalsy();
    expect($$('.cipher-cell').map((b) => b.querySelector('.cipher-letter').textContent)).toEqual(['و', 'غ', 'د']);
    // the moon is the first letter of «عيد»
    await place(1, 'ع');
    $('[data-submit]').click();
    await until(() => app.game.flag('sp1-gift-open'));
    expect(app.game.state.journal.filter((j) => j === 'sp1-promise')).toHaveLength(1);
    $('.puzzle .btn-big')?.click();
    await done;
    expect(check(gift.if, app.game)).toBe(false); // the box is open: it cannot be opened again
    // solving it again (e.g. from a replay) adds nothing
    const again = app.ui.puzzle('sp1-cipher');
    await until(() => $('.cipher-row'));
    await place(0, 'و');
    await place(1, 'ع');
    await place(2, 'د');
    $('[data-submit]').click();
    await wait(20);
    $('.puzzle .btn-big')?.click();
    $('.puzzle [data-act="close"]')?.click();
    await again;
    expect(app.game.state.journal.filter((j) => j === 'sp1-promise')).toHaveLength(1);
    // reload: the same save, a new app
    app.destroy();
    app = null;
    await boot();
    expect(app.game.flag('sp1-gift-open')).toBe(true);
    expect(app.game.state.journal.filter((j) => j === 'sp1-promise')).toHaveLength(1);
    expect(check(gift.if, app.game)).toBe(false);
  });

  it('hints: the first press asks to confirm (nothing spent), then each press shows the next hint, in order', async () => {
    await boot();
    const done = app.ui.puzzle('sp1-cipher');
    await until(() => $('.cipher-row'));
    const btn = () => $('.puzzle [data-act="hint"]') ?? $$('.puzzle button').find((b) => /تلميح|متأكدة|خلصت التلميحات/.test(b.textContent));
    const hints = () => $$('.puzzle-hints li').map((l) => l.textContent);
    expect(btn().textContent).toMatch(/تلميح \(3\)/);
    btn().click();
    await wait(2);
    expect(hints()).toEqual([]);
    expect(btn().textContent).toMatch(/متأكدة/);
    const all = PUZZLES['sp1-cipher'].hints;
    for (let n = 1; n <= 3; n++) {
      btn().click();
      await wait(2);
      expect(hints()).toEqual(all.slice(0, n));
    }
    expect(btn().textContent).toMatch(/خلصت التلميحات/);
    btn().click();
    await wait(2);
    expect(hints()).toHaveLength(3);
    $('.puzzle [data-act="close"]').click();
    await done;
  });
});
