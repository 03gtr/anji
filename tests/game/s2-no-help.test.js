/**
 * Season 2 complete release: no help with the story, in the real interface.
 *
 * The owner's brief removes the whole help system from Season 2 — hint levels, hint buttons, "show the answer",
 * skip — as functionality, not as hidden buttons. So these tests open the real panels and look at the DOM:
 *  - a Season 2 puzzle's panel has no hint, solution or skip control at all (not hidden: absent), no hint list
 *    content, and the "how hints work" tip is never shown for it;
 *  - a wrong try is answered with one of the same few neutral lines (never a clue, a count, or which option
 *    to avoid), and no option is marked wrong or disabled — nothing narrows the choice for her;
 *  - the logic grid's check never names which clue is broken;
 *  - the testimony bar has no help button;
 *  - the journal shows no hint for a Season 2 mission step;
 *  - the original game's puzzles keep their help (nothing outside Season 2 changed).
 * Changed by the owner's final brief (2026-11-02): the seasons' puzzles now offer ONE optional help — the contextual
 * guide (data/guides.js: direction, reasoning, method; words only). Still absent: the old hint ladder, «شوفي الحل»
 * and skip. The guide's own rules (no answer, no state change) are tested in tests/game/guides.test.js.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { STRICT_WRONG, openPuzzle } from '../../src/game/puzzles/host.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { PUZZLES_S2 } from '../../src/game/data/puzzles-s2.js';
import { PUZZLES_S2_M2 } from '../../src/game/data/puzzles-s2-m2.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { renderMissions } from '../../src/game/ui/menus.js';
import { memoryStorage } from '../helpers.js';

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
const HELP = '[data-act="hint"], [data-act="solution"], [data-act="skip"], [data-hint], [data-sol], [data-mhint]';

describe('Season 2: no help with the story (real panels)', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('every Season 2 puzzle panel has no hint ladder, solution or skip control — absent, not hidden — only the guide', async () => {
    await app.toTitle();
    app.settings.set({ hints: true, tips: true });
    const shown = vi.spyOn(app.tips, 'show');
    for (const id of [...Object.keys(PUZZLES_S2), ...Object.keys(PUZZLES_S2_M2)].filter((x) => PUZZLES[x].type !== 'testimony')) {
      const done = app.ui.puzzle(id);
      await until(() => $('.puzzle'));
      expect($$(HELP), id).toHaveLength(0);
      expect($('.puzzle-hints')?.children.length ?? 0, id).toBe(0);
      // the foot holds the guide's one button and nothing else
      expect([...$('.panel-foot').children].map((b) => b.dataset.act), id).toEqual(['guide']);
      expect($('.puzzle-guide').children.length, id).toBe(0); // nothing shown until she asks
      $('.puzzle [data-act="close"]').click();
      await done;
      await until(() => !$('.puzzle'));
    }
    expect(shown.mock.calls.map((c) => c[0])).not.toContain('hint');
  });

  it('a wrong try gets one of the shared neutral lines — never a count, a clue or the answer', async () => {
    await app.toTitle();
    const done = app.ui.puzzle('s2-count');
    await until(() => $('.puzzle .lock-submit'));
    const seen = [];
    for (let i = 0; i < 4; i++) {
      $('.puzzle .lock-submit').click();
      await wait(5);
      seen.push($('.puzzle-feedback').textContent);
    }
    for (const line of seen) expect(STRICT_WRONG, line).toContain(line);
    for (const line of seen) expect(line).not.toMatch(/[0-9٠-٩]/);
    $('.puzzle [data-act="close"]').click();
    await done;
  });

  it('a strict choice never marks or disables a tried option (nothing narrows a guess)', async () => {
    await app.toTitle();
    const def = { id: 'strict-probe', type: 'choice', strict: true, noSkip: true, noSolution: true, title: 't', goal: 'g', intro: 'i', success: 's', reward: [], wrong: [], config: { question: 'q', options: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id, reply: `hint ${id}` })), answer: 'd' } };
    const done = openPuzzle(app, def);
    await until(() => $('.puzzle .choice-item'));
    for (const id of ['a', 'b', 'c']) {
      $(`.puzzle [data-id="${id}"]`).click();
      await wait(5);
      expect($$('.puzzle .choice-item[disabled], .puzzle .choice-item.is-wrong')).toHaveLength(0);
      expect(STRICT_WRONG).toContain($('.puzzle-feedback').textContent); // never the option's own reply
    }
    $('.puzzle [data-act="close"]').click();
    await done;
  });

  it('the clue grid\'s check says only that something does not fit — never which clue', async () => {
    await app.toTitle();
    const done = app.ui.puzzle('s2-who-said');
    await until(() => $('.puzzle .lg-cell'));
    $('.puzzle .lg-cell').click(); // one cell set: the others empty — fill all with their first option
    for (const c of $$('.puzzle .lg-cell.is-empty')) c.click();
    await wait(5);
    for (const c of $$('.puzzle .lg-cell.is-empty')) c.click();
    $('.puzzle [data-check]').click();
    await wait(5);
    expect($$('.puzzle .lg-clues .is-broken')).toHaveLength(0);
    const said = $('.puzzle-feedback').textContent;
    if (said) for (const clue of PUZZLES['s2-who-said'].config.clues) expect(said.includes(clue.text)).toBe(false);
    $('.puzzle [data-act="close"]').click();
    await done;
  });

  it('the testimony bar has no help but the guide', async () => {
    await app.toTitle();
    const done = app.ui.testimony('s2-jojo-versions', { run: async () => {} });
    await until(() => $('.tm'));
    expect($$(HELP)).toHaveLength(0);
    expect($$('.tm button').filter((b) => /تلميح/.test(b.textContent)).map((b) => b.dataset.act)).toEqual(['guide']);
    expect($('.tm .puzzle-guide').hidden).toBe(true);
    $('.tm [data-leave]').click();
    await done;
  });

  it('the journal shows no hint for a Season 2 step; the original game\'s steps keep theirs', () => {
    const { game } = app;
    const s2 = MISSIONS.filter((m) => m.pack === 's2').map((m) => ({ ...m, status: 'active', next: m.steps[0].text, hint: 'x', pack: 's2', category: 'main', worlds: [] }));
    const html = renderMissions(game, s2, 'all');
    expect(html).not.toMatch(/data-mhint/);
    const og = MISSIONS.find((m) => m.pack !== 's2' && m.steps[0]?.hint);
    const html2 = renderMissions(game, [{ ...og, status: 'active', next: og.steps[0].text, hint: og.steps[0].hint, category: 'main', worlds: [] }], 'all');
    expect(html2).toMatch(/data-mhint/);
  });

  it('the original game is unchanged: its puzzles still have their help', async () => {
    await app.toTitle();
    app.settings.set({ hints: true });
    const id = Object.keys(PUZZLES).find((k) => !PUZZLES[k].strict && PUZZLES[k].hints?.length && PUZZLES[k].type === 'choice');
    const done = app.ui.puzzle(id);
    await until(() => $('.puzzle'));
    expect($('.puzzle [data-act="hint"]')).toBeTruthy();
    $('.puzzle [data-act="close"]').click();
    await done;
  });
});

describe('a phone tap that opens a puzzle never acts inside it', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    root = document.createElement('div');
    document.body.append(root);
    app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
  });
  afterEach(() => {
    app?.destroy();
    root.remove();
    vi.restoreAllMocks();
    delete globalThis.__timerLoop;
  });

  it('REGRESSION: the compatibility click after the opening tap is ignored; a real tap (pressed inside) and a key still work', async () => {
    await app.toTitle();
    const done = app.ui.puzzle('s2-board-2');
    await until(() => $('.puzzle .sort-card'));
    const card = () => $('.puzzle .sort-card');
    const id = card().dataset.card;
    // the ghost: a pointer click with no press inside the panel
    card().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
    await wait(5);
    expect($(`.puzzle [data-card="${id}"]`).getAttribute('aria-pressed')).toBe('false');
    // a keyboard click (detail 0) counts
    card().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }));
    await wait(5);
    expect($(`.puzzle [data-card="${id}"]`).getAttribute('aria-pressed')).toBe('true');
    // a real tap: pressed inside, then clicked
    card().dispatchEvent(new Event('pointerdown', { bubbles: true }));
    card().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
    await wait(5);
    expect($(`.puzzle [data-card="${id}"]`).getAttribute('aria-pressed')).toBe('false');
    $('.puzzle [data-act="close"]').click();
    await done;
  });
});
