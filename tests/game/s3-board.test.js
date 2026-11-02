/**
 * Season 3's investigation board — regressions for the defects found in its audit (docs/final/BOARD_AUDIT.md):
 *  - B1 a card's mark had no size: on a phone each card filled the screen, and with the season's evidence the relation
 *    buttons and the reply sat ~10,000 px below the cards (the CSS rule is checked here; the layout in the browser test);
 *  - B2 the relation buttons and the reply were below every card (now a bar at the foot of the panel);
 *  - B3 a conclusion's thread was refused when drawn from its other end («A يعتمد على B» for the table's «B يثبت A»);
 *  - B4 once a relation was chosen, the chosen card could not be let go (a tap on it did nothing).
 * And the whole board at the end of every road: every thread in the table can be drawn through the real UI, and the
 * threads, the cards and their reliability survive a reload.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager } from '../../src/game/core/save.js';
import { createS2Store, createSeasonStore, S3_KEY } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { EVIDENCE_S3, LINKS_S3 } from '../../src/game/data/evidence-s3.js';
import { linkFlag, linkHolds, linkMatch, reliability } from '../../src/game/data/s3/board.js';
import { renderBoard, drawnThreads } from '../../src/game/ui/board-s3.js';
import { setup, playSeason, PLANS } from './s3-play.js';

const board = (game) => {
  const body = document.createElement('div');
  renderBoard(body, game);
  return body;
};
const tap = (body, sel) => body.querySelector(sel).click();
const draw = (body, a, rel, b) => {
  tap(body, `[data-card="${a}"]`);
  tap(body, `[data-rel="${rel}"]`);
  tap(body, `[data-card="${b}"]`);
  return body.querySelector('.s3-board-say').textContent;
};
const flagKeys = (game) => Object.keys(game.s3State.flags).filter((k) => k.startsWith('s3:link:')).sort();
const reload = (storage) => {
  const sm = createSaveManager({ storage });
  const L = sm.load();
  const s2 = createS2Store({ storage });
  const s3 = createSeasonStore({ storage, key: S3_KEY });
  return createGame({ saveManager: sm, s2Store: s2, s3Store: s3, initial: L.state, s2Initial: s2.load(L.state.createdAt).state, s3Initial: s3.load(L.state.createdAt).state });
};

describe('B1/B2: the board fits a phone', () => {
  const css = fs.readFileSync('src/game/styles/s3.css', 'utf8');
  it('a card\'s mark has a size (it filled the card before)', () => {
    const rule = css.match(/\.s3-card-head svg\s*\{([^}]*)\}/);
    expect(rule, '.s3-card-head svg').toBeTruthy();
    expect(Number(rule[1].match(/width:\s*(\d+)px/)?.[1])).toBeLessThanOrEqual(32);
    expect(Number(rule[1].match(/height:\s*(\d+)px/)?.[1])).toBeLessThanOrEqual(32);
  });
  it('the relation buttons and the reply are one bar, kept at the foot of the panel', () => {
    expect(css).toMatch(/\.s3-board-bar\s*\{[^}]*position:\s*sticky;[^}]*bottom:\s*0/);
    const { game } = setup();
    applyEffects('ev3:e-clip', game);
    const body = board(game);
    const bar = body.querySelector('.s3-board-bar');
    expect(bar.querySelectorAll('[data-rel]')).toHaveLength(6);
    expect(bar.querySelector('.s3-board-say')).toBeTruthy();
  });
});

describe('B3: a conclusion\'s thread holds from either end', () => {
  const deduction = (id) => EVIDENCE_S3[id].rel === 'deduction';
  it('«A يعتمد على B» is the table\'s «B يثبت A» when A is a conclusion — and the other way round', () => {
    let n = 0;
    for (const [a, rel, b] of LINKS_S3) {
      if (rel === 'supports' && deduction(b)) {
        expect(LINKS_S3).toContain(linkMatch(LINKS_S3, b, 'depends', a, EVIDENCE_S3)); // (the table may also name it this way)
        n++;
      }
      if (rel === 'depends' && deduction(a)) {
        expect(LINKS_S3).toContain(linkMatch(LINKS_S3, b, 'supports', a, EVIDENCE_S3));
        n++;
      }
    }
    expect(n).toBeGreaterThanOrEqual(10);
  });
  it('between two facts, «يثبت» is not dependence: no converse', () => {
    for (const [a, rel, b] of LINKS_S3) if (rel === 'supports' && !deduction(b)) expect(linkHolds(LINKS_S3, b, 'depends', a, EVIDENCE_S3), `${b} depends ${a}`).toBe(false);
    expect(linkHolds(LINKS_S3, 'e-noise-notice', 'depends', 'e-keyring', EVIDENCE_S3)).toBe(false);
    // the relations that are not supports/depends never turn round
    expect(linkHolds(LINKS_S3, 'e-light-timer', 'before', 'e-bakery-hours', EVIDENCE_S3)).toBe(false);
  });
  it('the real board keeps it, as the table names it (one flag, never a second spelling)', () => {
    const { game } = setup();
    for (const e of ['d-two-engines', 'e-bakery-hours']) applyEffects(`ev3:${e}`, game);
    const body = board(game);
    expect(draw(body, 'd-two-engines', 'depends', 'e-bakery-hours')).toMatch(/^🧵/);
    expect(flagKeys(game)).toEqual([linkFlag('e-bakery-hours', 'supports', 'd-two-engines').slice(5)]);
    expect(drawnThreads(game)).toEqual([['e-bakery-hours', 'supports', 'd-two-engines']]);
    // drawn again the table's way: still one thread
    draw(body, 'e-bakery-hours', 'supports', 'd-two-engines');
    expect(drawnThreads(game)).toHaveLength(1);
  });
});

describe('B4: the chosen card can be let go', () => {
  it('a tap on the chosen card, after a relation, clears both — nothing kept, nothing said wrong', () => {
    const { game } = setup();
    for (const e of ['e-clip', 'd-two-engines']) applyEffects(`ev3:${e}`, game);
    const body = board(game);
    tap(body, '[data-card="e-clip"]');
    tap(body, '[data-rel="contradicts"]');
    tap(body, '[data-card="e-clip"]');
    expect(body.querySelector('.s3-card.is-sel')).toBeNull();
    expect([...body.querySelectorAll('[data-rel]')].every((b) => b.disabled)).toBe(true);
    expect(body.querySelector('.s3-board-say').textContent).toBe('');
    expect(flagKeys(game)).toEqual([]);
    // and before a relation too
    tap(body, '[data-card="e-clip"]');
    tap(body, '[data-card="e-clip"]');
    expect(body.querySelector('.s3-card.is-sel')).toBeNull();
    // a fresh choice still works
    expect(draw(body, 'e-clip', 'contradicts', 'd-two-engines')).toMatch(/^🧵/);
  });
});

describe('the whole board, at the end of every road', () => {
  it.each(PLANS.map((p, i) => [i + 1, p]))('plan %i: every thread can be drawn by touch; all of it survives a reload', (i, plan) => {
    const { game, storage } = setup();
    playSeason(game, plan, { street: i !== 3 });
    const has = (id) => game.has(`s3.ev.${id}`);
    const body = board(game);
    // every card she holds is on the board, and none she does not
    for (const id of Object.keys(EVIDENCE_S3)) expect(Boolean(body.querySelector(`[data-card="${id}"]`)), id).toBe(has(id));
    // every thread of the table whose cards she holds: drawn through the UI, kept
    const possible = LINKS_S3.filter(([a, , b]) => has(a) && has(b));
    expect(possible.length).toBeGreaterThanOrEqual(LINKS_S3.length - 1); // (a street detail she walked past may be missing)
    for (const [a, rel, b] of possible) expect(draw(body, a, rel, b), `${a} ${rel} ${b}`).toMatch(/^🧵/);
    expect(drawnThreads(game)).toHaveLength(possible.length);
    expect(body.querySelectorAll('.s3-threads li')).toHaveLength(possible.length);
    // the claims, as the season left them
    expect(reliability(EVIDENCE_S3['e-clip'], has)).toBe('disproved');
    expect(reliability(EVIDENCE_S3['t-jalal'], has)).toBe('disproved');
    expect(reliability(EVIDENCE_S3['e-sabri-count'], has)).toBe('disproved');
    // a reload: the same threads, the same cards, the board still open
    const again = reload(storage);
    expect(drawnThreads(again)).toEqual(drawnThreads(game));
    expect(again.flag('s3:board-open')).toBe(true);
    const body2 = board(again);
    expect(body2.querySelectorAll('.s3-card')).toHaveLength(body.querySelectorAll('.s3-card').length);
    expect(body2.querySelectorAll('.s3-threads li')).toHaveLength(possible.length);
  }, 60000);
});
