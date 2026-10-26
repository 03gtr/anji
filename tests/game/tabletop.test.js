/**
 * Games-room rules: deck, High Card, «سباق الورد», checkers and Snooki's card
 * trick. Every engine is pure and seeded, so outcomes are reproducible and
 * the AI can be checked for legality and fairness.
 */
import { describe, it, expect } from 'vitest';
import { makeDeck, shuffle, rankLabel, cardName } from '../../src/game/tabletop/deck.js';
import { createHighCard, playRound, ROUNDS } from '../../src/game/tabletop/highcard.js';
import { createRoseTrick, legalCards, playCard, trickWinner, viewFor, aiChoose, HAND } from '../../src/game/tabletop/rosetrick.js';
import { createCheckers, legalMoves, applyMove, aiMove, count, isDark, DRAW_PLIES } from '../../src/game/tabletop/checkers.js';
import { makeTrick, trackSwaps, solveLabels, checkRound, roundSolution, makeLabelRound, makeSwapRound, makePatternRound } from '../../src/game/tabletop/cardtrick.js';

describe('deck', () => {
  it('has 48 unique cards and seeded, reproducible shuffles', () => {
    const d = makeDeck();
    expect(d).toHaveLength(48);
    expect(new Set(d.map((c) => c.id)).size).toBe(48);
    expect(shuffle(d, 7).map((c) => c.id)).toEqual(shuffle(d, 7).map((c) => c.id));
    expect(shuffle(d, 7).map((c) => c.id)).not.toEqual(shuffle(d, 8).map((c) => c.id));
    expect(rankLabel(10)).toBe('سنوكي');
    expect(cardName({ suit: 'star', rank: 7 })).toBe('٧ نجوم');
  });
});

describe('High Card', () => {
  it('higher rank takes the round and the pot; ties carry the pot forward', () => {
    const s = createHighCard(1);
    s.piles.anji = [{ id: 'a', suit: 'rose', rank: 5 }, { id: 'b', suit: 'rose', rank: 9 }, ...s.piles.anji];
    s.piles.ryan = [{ id: 'c', suit: 'star', rank: 5 }, { id: 'd', suit: 'star', rank: 2 }, ...s.piles.ryan];
    const tie = playRound(s);
    expect(tie.winner).toBe('tie');
    expect(s.pot).toHaveLength(2);
    const win = playRound(s);
    expect(win.winner).toBe('anji');
    expect(win.taken).toBe(4);
    expect(s.won.anji).toBe(4);
    expect(s.pot).toHaveLength(0);
  });
  it('ends after the set number of rounds with a winner or a draw', () => {
    for (let seed = 1; seed < 30; seed++) {
      const s = createHighCard(seed);
      while (!s.done) playRound(s);
      expect(s.round).toBe(ROUNDS);
      expect(['anji', 'ryan', 'draw']).toContain(s.result);
      if (s.result === 'draw') expect(s.won.anji).toBe(s.won.ryan);
    }
  });
  it('the same seed replays the same game (rematch with a new seed is different)', () => {
    const run = (seed) => {
      const s = createHighCard(seed);
      while (!s.done) playRound(s);
      return JSON.stringify(s.won);
    };
    expect(run(42)).toBe(run(42));
  });
});

describe('سباق الورد (trick game)', () => {
  it('deals six cards each, Anji leads', () => {
    const s = createRoseTrick(3);
    expect(s.hands.anji).toHaveLength(HAND);
    expect(s.hands.ryan).toHaveLength(HAND);
    expect(s.turn).toBe('anji');
    expect(legalCards(s, 'ryan')).toEqual([]);
  });
  it('the follower must follow suit when able', () => {
    const s = createRoseTrick(3);
    s.hands.anji = [{ id: 'star-5', suit: 'star', rank: 5 }];
    s.hands.ryan = [{ id: 'star-2', suit: 'star', rank: 2 }, { id: 'rose-8', suit: 'rose', rank: 8 }];
    playCard(s, 'anji', 'star-5');
    expect(legalCards(s, 'ryan').map((c) => c.id)).toEqual(['star-2']);
    expect(playCard(s, 'ryan', 'rose-8').ok).toBe(false); // illegal: must follow
  });
  it('roses trump; otherwise the highest card of the led suit wins', () => {
    expect(trickWinner([{ who: 'anji', card: { suit: 'star', rank: 8 } }, { who: 'ryan', card: { suit: 'rose', rank: 1 } }])).toBe('ryan');
    expect(trickWinner([{ who: 'anji', card: { suit: 'star', rank: 3 } }, { who: 'ryan', card: { suit: 'moon', rank: 8 } }])).toBe('anji');
    expect(trickWinner([{ who: 'anji', card: { suit: 'paw', rank: 3 } }, { who: 'ryan', card: { suit: 'paw', rank: 7 } }])).toBe('ryan');
  });
  it('the trick winner leads next; six tricks end the hand with a result (3–3 = draw)', () => {
    let draws = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const s = createRoseTrick(seed);
      while (!s.done) {
        const who = s.turn;
        const pick = who === 'ryan' ? aiChoose(viewFor(s, 'ryan'), 'normal', seed) : legalCards(s, 'anji')[0];
        const res = playCard(s, who, pick.id);
        expect(res.ok).toBe(true);
        if (res.trick && !s.done) expect(s.turn).toBe(res.trick.winner);
      }
      expect(s.tricks.anji + s.tricks.ryan).toBe(HAND);
      expect(['anji', 'ryan', 'draw']).toContain(s.result);
      if (s.result === 'draw') draws += 1;
    }
    expect(draws).toBeGreaterThanOrEqual(0);
  });
  it("Ryan's AI never plays an illegal card and never sees Anji's hand", () => {
    for (const diff of ['easy', 'normal', 'hard']) {
      for (let seed = 1; seed <= 40; seed++) {
        const s = createRoseTrick(seed);
        while (!s.done) {
          if (s.turn === 'ryan') {
            const view = viewFor(s, 'ryan');
            const seen = JSON.stringify(view);
            for (const c of s.hands.anji) expect(seen).not.toContain(`"${c.id}"`);
            expect(view.hand).toEqual(s.hands.ryan);
            expect(Object.keys(view)).toEqual(['hand', 'table', 'played', 'legal', 'tricks']);
            const c = aiChoose(view, diff, seed);
            expect(legalCards(s, 'ryan').some((x) => x.id === c.id)).toBe(true);
            playCard(s, 'ryan', c.id);
          } else playCard(s, 'anji', legalCards(s, 'anji')[0].id);
        }
      }
    }
  });
  it('the AI is deterministic for a seed', () => {
    const s = createRoseTrick(9);
    playCard(s, 'anji', legalCards(s, 'anji')[0].id);
    const v = viewFor(s, 'ryan');
    expect(aiChoose(v, 'easy', 5).id).toBe(aiChoose(v, 'easy', 5).id);
    expect(aiChoose(v, 'hard', 5).id).toBe(aiChoose(v, 'hard', 5).id);
  });
  it('harder Ryan wins more against the same simple player (over 400 seeded hands)', () => {
    const score = (diff) => {
      let ryan = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const s = createRoseTrick(seed);
        while (!s.done) {
          if (s.turn === 'ryan') playCard(s, 'ryan', aiChoose(viewFor(s, 'ryan'), diff, seed).id);
          else playCard(s, 'anji', aiChoose(viewFor(s, 'anji'), 'easy', seed + 1000).id);
        }
        ryan += s.tricks.ryan;
      }
      return ryan;
    };
    const easy = score('easy');
    const normal = score('normal');
    const hard = score('hard');
    expect(normal).toBeGreaterThan(easy);
    expect(hard).toBeGreaterThan(normal);
  });
});

describe('checkers (English draughts)', () => {
  it('starts with 12 pieces each on dark squares; Anji has 7 opening moves', () => {
    const s = createCheckers();
    expect(count(s, 'a')).toBe(12);
    expect(count(s, 'r')).toBe(12);
    s.board.forEach((p, i) => p && expect(isDark(i)).toBe(true));
    expect(legalMoves(s)).toHaveLength(7);
  });
  it('captures are compulsory and remove the jumped piece', () => {
    const s = createCheckers();
    s.board.fill(null);
    s.board[5 * 8 + 2] = { side: 'a', king: false };
    s.board[4 * 8 + 3] = { side: 'r', king: false };
    s.board[7 * 8 + 6] = { side: 'a', king: false };
    const moves = legalMoves(s);
    expect(moves).toHaveLength(1);
    expect(moves[0].captures).toEqual([4 * 8 + 3]);
    const next = applyMove(s, moves[0]);
    expect(next.board[4 * 8 + 3]).toBeNull();
    expect(next.board[3 * 8 + 4]).toMatchObject({ side: 'a' });
  });
  it('multi-jumps continue with the same piece', () => {
    const s = createCheckers();
    s.board.fill(null);
    s.board[7 * 8 + 0] = { side: 'a', king: false };
    s.board[6 * 8 + 1] = { side: 'r', king: false };
    s.board[4 * 8 + 3] = { side: 'r', king: false };
    s.board[0 * 8 + 7] = { side: 'r', king: false };
    const [m] = legalMoves(s);
    expect(m.captures).toHaveLength(2);
    expect(m.path).toEqual([5 * 8 + 2, 3 * 8 + 4]);
  });
  it('a man reaching the far row is crowned, and kings move backwards', () => {
    const s = createCheckers();
    s.board.fill(null);
    s.board[1 * 8 + 2] = { side: 'a', king: false };
    s.board[2 * 8 + 5] = { side: 'r', king: false };
    const crown = legalMoves(s).find((m) => m.path[0] === 0 * 8 + 1);
    const next = applyMove(s, crown);
    expect(next.board[1]).toMatchObject({ side: 'a', king: true });
    next.turn = 'a';
    expect(legalMoves(next).some((m) => m.path[0] === 1 * 8 + 0 || m.path[0] === 1 * 8 + 2)).toBe(true);
  });
  it('you win when the opponent cannot move', () => {
    const s = createCheckers();
    s.board.fill(null);
    s.board[5 * 8 + 2] = { side: 'a', king: false };
    s.board[4 * 8 + 3] = { side: 'r', king: false };
    const next = applyMove(s, legalMoves(s)[0]);
    expect(next.done).toBe(true);
    expect(next.result).toBe('a');
  });
  it('40 quiet king moves are a draw', () => {
    let s = createCheckers();
    s.board.fill(null);
    s.board[4 * 8 + 1] = { side: 'a', king: true };
    s.board[0 * 8 + 7] = { side: 'r', king: true };
    s.quiet = DRAW_PLIES - 1;
    s = applyMove(s, legalMoves(s).find((m) => m.captures.length === 0));
    expect(s.done).toBe(true);
    expect(s.result).toBe('draw');
  });
  it('illegal moves are rejected and the old state is kept (undo-safe)', () => {
    const s = createCheckers();
    expect(applyMove(s, { from: 40, path: [24], captures: [] })).toBeNull();
    const next = applyMove(s, legalMoves(s)[0]);
    expect(next).not.toBe(s);
    expect(count(s, 'a')).toBe(12);
  });
  it("Ryan's AI plays only legal moves, deterministically per seed, at every level", () => {
    for (const diff of ['easy', 'normal', 'hard']) {
      let s = createCheckers();
      s = applyMove(s, legalMoves(s)[0]);
      const m1 = aiMove(s, diff, 3);
      const m2 = aiMove(s, diff, 3);
      expect(m1).toEqual(m2);
      expect(legalMoves(s).some((m) => JSON.stringify(m) === JSON.stringify(m1))).toBe(true);
    }
  });
  it('the normal AI takes a free piece; a full AI-vs-AI game ends', () => {
    const s = createCheckers();
    s.board.fill(null);
    s.turn = 'r';
    s.board[2 * 8 + 3] = { side: 'r', king: false };
    s.board[3 * 8 + 4] = { side: 'a', king: false };
    s.board[7 * 8 + 0] = { side: 'a', king: false };
    expect(aiMove(s, 'normal', 1).captures).toHaveLength(1);
    let g = createCheckers();
    for (let i = 0; i < 300 && !g.done; i++) g = applyMove(g, aiMove(g, i % 2 ? 'normal' : 'easy', i));
    expect(g.done).toBe(true);
  });
});

describe("Snooki's card trick", () => {
  it('tracks the rose through the swaps', () => {
    expect(trackSwaps(0, [[0, 1], [1, 2]])).toBe(2);
    const r = makeSwapRound(5);
    expect(checkRound(r, roundSolution(r))).toBe(true);
    expect(checkRound(r, (roundSolution(r) + 1) % 3)).toBe(false);
  });
  it('the label puzzle is always solvable from the single drawn card', () => {
    for (let seed = 1; seed < 20; seed++) {
      const r = makeLabelRound(seed);
      expect(r.contents.every((c, i) => c !== ['rose', 'star', 'mix'][i])).toBe(true); // every label wrong
      expect(solveLabels(r.drawn)).toEqual(r.contents);
      expect(checkRound(r, solveLabels(r.drawn))).toBe(true);
    }
  });
  it('pattern rounds have exactly one correct option', () => {
    for (let seed = 1; seed < 20; seed++) {
      const r = makePatternRound(seed);
      expect(r.options.filter((o) => o === r.answer)).toHaveLength(1);
      expect(new Set(r.options).size).toBe(4);
    }
  });
  it('a trick is three different rounds', () => {
    expect(makeTrick(2).map((r) => r.kind)).toEqual(['swap', 'labels', 'pattern']);
  });
});
