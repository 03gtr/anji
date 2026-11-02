/**
 * The seasons' puzzle guides (data/guides.js; the owner's final brief, Priority 3): optional help that teaches how to
 * solve without giving the answer.
 *  - coverage: every strict puzzle has one set of exactly three levels for every stage, each a real sentence;
 *  - no leak, read against each puzzle's own answer: no digit; no correct option, claim, conclusion or evidence named;
 *    never a card together with its place; never a grid row together with its value;
 *  - in the real panel: one tap opens one level; the state is never touched (no card placed, no option picked), no
 *    solution and no skip ever appear, and a new stage brings its own guide; the hint setting hides it;
 *  - the puzzles stay what they were: one answer each (their fairness tests are unchanged).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { GUIDES, GUIDE_LEVELS } from '../../src/game/data/guides.js';
import { solve, replay, logicgridSolutions } from '../../src/game/puzzles/rules.js';
import { memoryStorage } from '../helpers.js';

const STRICT = Object.entries(PUZZLES).filter(([, p]) => p.strict);
const stagesOf = (p) => (Array.isArray(p.config.stages) && p.type !== 'shadows' ? p.config.stages.length : 1);
const label = (x) => String(x?.label ?? x?.text ?? x ?? '').trim();
const all = (id) => GUIDES[id].flat();

/** Every string a hint must never contain, and pairs it must never contain together. */
function secrets(p) {
  const c = p.config;
  const alone = [];
  const pairs = [];
  const opt = (list, id) => label(list?.find((o) => (o.id ?? o) === id));
  switch (p.type) {
    case 'sort':
      for (const st of c.stages) {
        if (st.kind === 'sort') for (const card of st.cards) pairs.push([label(card), opt(st.bins, card.accepts[0])]);
        else for (const id of st.answers ?? [st.answer]) alone.push(opt(st.options, id));
      }
      break;
    case 'contradict':
      for (const st of c.stages) {
        if (st.answer.claim >= 0) alone.push(label(st.claims[st.answer.claim]));
        for (const e of [].concat(st.answer.evidence)) alone.push(opt(st.evidence ?? c.evidence, e));
      }
      break;
    case 'deduction':
      alone.push(opt(c.suspects ?? c.options, c.answer.suspect));
      for (const e of c.answer.evidence) alone.push(opt(c.evidence, e));
      break;
    case 'rubbing':
      for (const id of c.answers ?? [c.answer]) alone.push(opt(c.options, id));
      break;
    case 'logicgrid': {
      const [sol] = logicgridSolutions(c);
      for (const r of c.rows) for (const col of c.cols) pairs.push([label(r), opt(col.options, sol[r.id][col.id])]);
      break;
    }
    case 'arrange':
      for (const slot of c.slots) pairs.push([opt(c.pieces, slot.accepts[0]), label(slot)]);
      break;
    case 'testimony':
      for (const v of p.versions) {
        const [beat, ev] = v.breaks;
        alone.push(label(v.beats.find((b) => b.id === beat)?.t));
        pairs.push([label(v.beats.find((b) => b.id === beat)?.t), ev]);
      }
      break;
    default:
      break; // lock, clock, shadows: their answers are numbers (no digit at all is allowed)
  }
  return { alone: alone.filter((s) => s.length >= 4), pairs: pairs.filter(([a, b]) => a.length >= 2 && b.length >= 2) };
}

describe('every season puzzle has its guide', () => {
  it('three levels for every stage, each a real sentence', () => {
    expect(GUIDE_LEVELS).toEqual(['اتجاه', 'تفكير', 'طريقة']);
    expect(STRICT.length).toBeGreaterThanOrEqual(30);
    for (const [id, p] of STRICT) {
      const g = GUIDES[id];
      expect(g, id).toBeTruthy();
      expect(g, id).toHaveLength(stagesOf(p));
      for (const levels of g) {
        expect(levels, id).toHaveLength(3);
        expect(new Set(levels).size, id).toBe(3);
        for (const t of levels) expect(t.length, `${id}: «${t}» is too short to help`).toBeGreaterThanOrEqual(30);
      }
    }
    // and nothing else: every guide belongs to a season's puzzle
    for (const id of Object.keys(GUIDES)) expect(PUZZLES[id]?.strict, id).toBe(true);
  });
});

describe('no guide gives the answer', () => {
  it.each(STRICT.map(([id]) => [id]))('%s', (id) => {
    const p = PUZZLES[id];
    const text = all(id);
    for (const t of text) expect(t, `${id}: a digit`).not.toMatch(/[0-9٠-٩]/);
    const { alone, pairs } = secrets(p);
    for (const t of text) {
      for (const s of alone) expect(t.includes(s), `${id}: names an answer «${s}» in «${t}»`).toBe(false);
      for (const [a, b] of pairs) expect(t.includes(a) && t.includes(b), `${id}: pairs «${a}» with «${b}» in «${t}»`).toBe(false);
    }
  });
  it('the puzzles keep their single answer (the guide changed none of them)', () => {
    for (const [id, p] of STRICT) if (p.type !== 'testimony') expect(replay(p.type, p.config, solve(p.type, p.config)).outcome, id).toBe('solved');
  });
});

const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => gradient : k === 'measureText' ? () => ({ width: 40 }) : k === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
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

describe('the guide in the real panel', () => {
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

  it('one tap, one level; words only — nothing placed, nothing picked; no solution, no skip; a new stage has its own', async () => {
    await app.toTitle();
    app.settings.set({ hints: true });
    const done = app.ui.puzzle('s3-office');
    await until(() => $('.puzzle .sort-card'));
    const cards = () => $$('.puzzle .sort-card').map((b) => `${b.dataset.card}:${b.getAttribute('aria-pressed')}:${b.closest('[data-bin]')?.dataset.bin ?? '-'}`).join('|');
    const before = cards();
    const btn = () => $('.puzzle [data-act="guide"]');
    expect($('.puzzle-guide').hidden).toBe(true);
    for (let i = 0; i < 3; i++) {
      btn().click();
      await wait(5);
      expect($$('.puzzle-guide li'), `level ${i + 1}`).toHaveLength(i + 1);
      expect($$('.puzzle-guide li')[i].textContent).toContain(GUIDES['s3-office'][0][i]);
      expect(cards(), 'the guide moved nothing').toBe(before);
    }
    expect(btn().disabled).toBe(true);
    btn().click();
    expect($$('.puzzle-guide li')).toHaveLength(3);
    expect($$('.puzzle [data-act="solution"], .puzzle [data-act="skip"], .puzzle [data-act="hint"]')).toHaveLength(0);
    // solve the first stage by hand: the second stage starts with its own guide, closed
    const { OFFICE_ANSWER } = await import('../../src/game/data/s3/m01-sabri.js');
    for (const card of PUZZLES['s3-office'].config.stages[0].cards) {
      $(`.puzzle [data-card="${card.id}"]`).click();
      $(`.puzzle [data-bin="${OFFICE_ANSWER[card.id]}"]`).click();
    }
    $('.puzzle [data-submit]').click();
    await wait(10);
    expect($$('.puzzle-guide li'), 'the second stage starts with its guide closed').toHaveLength(0);
    expect($('.puzzle-guide').hidden).toBe(true);
    expect(btn().disabled).toBe(false);
    btn().click();
    expect($$('.puzzle-guide li')[0].textContent).toContain(GUIDES['s3-office'][1][0]);
    $('.puzzle [data-act="close"]').click();
    await done;
  });

  it('the hint setting hides it', async () => {
    await app.toTitle();
    app.settings.set({ hints: false });
    const done = app.ui.puzzle('s2-who-said');
    await until(() => $('.puzzle'));
    expect($('.puzzle [data-act="guide"]').hidden).toBe(true);
    $('.puzzle [data-act="close"]').click();
    await done;
  });

  it('the testimony\'s guide opens level by level, and never picks a line or an evidence', async () => {
    await app.toTitle();
    app.settings.set({ hints: true });
    const done = app.ui.testimony('s2-jojo-versions', { run: async () => {} });
    await until(() => $('.tm [data-act="guide"]'));
    const line = $('.tm-line').textContent;
    for (let i = 0; i < 3; i++) $('.tm [data-act="guide"]').click();
    expect($$('.tm .puzzle-guide li')).toHaveLength(3);
    expect($('.tm [data-act="guide"]').disabled).toBe(true);
    expect($('.tm-line').textContent).toBe(line);
    expect($('.tm-pick').hidden).toBe(true);
    $('.tm [data-leave]').click();
    await done;
  });
});
