/**
 * «الورقة الأعلى» (High Card / a short War). Pure rules.
 *
 * The 48-card deck is shuffled (seeded) and split: 24 cards each. Every round
 * both players reveal their top card; the higher rank wins the round and
 * takes the cards on the table. A tie is «حرب صغيرة»: the cards stay in the
 * pot and the next decisive round takes them all. After ROUNDS rounds (or
 * when the piles run out) whoever collected more cards wins; equal = draw.
 * Nobody makes choices here, so there is no AI to bias: the shuffle decides.
 */
import { makeDeck, shuffle } from './deck.js';

export const ROUNDS = 10;

export function createHighCard(seed = 1, { rounds = ROUNDS } = {}) {
  const deck = shuffle(makeDeck(), seed);
  return {
    seed,
    rounds,
    round: 0,
    piles: { anji: deck.slice(0, 24), ryan: deck.slice(24) },
    won: { anji: 0, ryan: 0 },
    pot: [],
    last: null, // { anji, ryan, winner: 'anji'|'ryan'|'tie', taken }
    ties: 0,
    done: false,
    result: null, // 'anji' | 'ryan' | 'draw'
  };
}

/** Reveal one round. Returns the round record (also in state.last). */
export function playRound(s) {
  if (s.done) return null;
  const a = s.piles.anji.shift();
  const b = s.piles.ryan.shift();
  s.round += 1;
  s.pot.push(a, b);
  let winner = 'tie';
  if (a.rank > b.rank) winner = 'anji';
  else if (b.rank > a.rank) winner = 'ryan';
  let taken = 0;
  if (winner === 'tie') s.ties += 1;
  else {
    taken = s.pot.length;
    s.won[winner] += taken;
    s.pot = [];
  }
  s.last = { anji: a, ryan: b, winner, taken, round: s.round };
  if (s.round >= s.rounds || !s.piles.anji.length || !s.piles.ryan.length) {
    s.done = true;
    s.result = s.won.anji > s.won.ryan ? 'anji' : s.won.ryan > s.won.anji ? 'ryan' : 'draw';
  }
  return s.last;
}
