/**
 * «سباق الورد» — an original two-player trick-taking game. Pure rules + AI.
 *
 * Deck: the four suits, ranks 1…8 (32 cards). Each player gets 6 cards.
 * Blue roses (rose suit) are trumps.
 *  - The leader plays any card.
 *  - The other player must follow the led suit if they can; if they cannot,
 *    any card may be played (a rose wins over everything else).
 *  - The trick goes to the highest rose if one was played, otherwise to the
 *    highest card of the led suit. The trick's winner leads the next one.
 *  - After 6 tricks, more tricks wins. 3–3 is a draw.
 * Anji leads the first trick.
 *
 * Ryan's AI only ever sees a "view": his own hand, the cards on the table and
 * the cards already played (public). He never sees Anji's hand or the
 * remaining deck — no cheating, by construction (and by test).
 */
import { makeDeck, shuffle } from './deck.js';
import { rng } from '../core/rng.js';

export const HAND = 6;
export const TRUMP = 'rose';

export function createRoseTrick(seed = 1) {
  const deck = shuffle(makeDeck({ ranks: 8 }), seed);
  const sortHand = (h) => [...h].sort((a, b) => (a.suit === b.suit ? a.rank - b.rank : a.suit.localeCompare(b.suit)));
  return {
    seed,
    hands: { anji: sortHand(deck.slice(0, HAND)), ryan: sortHand(deck.slice(HAND, HAND * 2)) },
    leader: 'anji',
    turn: 'anji',
    table: [], // [{ who, card }]
    played: [], // every card played so far (public)
    tricks: { anji: 0, ryan: 0 },
    history: [], // finished tricks: { cards, winner }
    done: false,
    result: null,
  };
}

const other = (who) => (who === 'anji' ? 'ryan' : 'anji');

/** Cards `who` may play now. */
export function legalCards(s, who) {
  if (s.done || s.turn !== who) return [];
  const hand = s.hands[who];
  if (!s.table.length) return hand;
  const led = s.table[0].card.suit;
  const follow = hand.filter((c) => c.suit === led);
  return follow.length ? follow : hand;
}

/** Winner of a complete trick (two cards, first one led). */
export function trickWinner(table) {
  const [a, b] = table;
  const led = a.card.suit;
  const score = (c) => (c.suit === TRUMP ? 100 + c.rank : c.suit === led ? c.rank : 0);
  return score(b.card) > score(a.card) ? b.who : a.who;
}

/** Play a card. Returns { ok, trick? } (trick = { cards, winner } when it completes). */
export function playCard(s, who, cardId) {
  const card = legalCards(s, who).find((c) => c.id === cardId);
  if (!card) return { ok: false };
  s.hands[who] = s.hands[who].filter((c) => c.id !== cardId);
  s.table.push({ who, card });
  s.played.push(card);
  if (s.table.length < 2) {
    s.turn = other(who);
    return { ok: true };
  }
  const winner = trickWinner(s.table);
  const trick = { cards: s.table, winner };
  s.history.push(trick);
  s.tricks[winner] += 1;
  s.table = [];
  s.leader = winner;
  s.turn = winner;
  if (!s.hands.anji.length && !s.hands.ryan.length) {
    s.done = true;
    s.result = s.tricks.anji > s.tricks.ryan ? 'anji' : s.tricks.ryan > s.tricks.anji ? 'ryan' : 'draw';
    s.turn = null;
  }
  return { ok: true, trick };
}

/** What a player is allowed to know (no opponent hand). */
export function viewFor(s, who) {
  return {
    hand: [...s.hands[who]],
    table: s.table.map((t) => ({ ...t })),
    played: [...s.played],
    legal: legalCards(s, who),
    tricks: { ...s.tricks },
  };
}

/* ── Ryan's AI ─────────────────────────────────────────────── */
const lowest = (cards) => [...cards].sort((a, b) => (a.suit === TRUMP) - (b.suit === TRUMP) || a.rank - b.rank)[0];
const beats = (card) => (lead) => trickWinner([lead, { who: 'x', card }]) === 'x';

/**
 * Choose Ryan's card from a view.
 *   easy:   a random legal card (playful mistakes)
 *   normal: win a trick as cheaply as possible, otherwise throw the lowest
 *           card; lead a strong non-trump card when he has one
 *   hard:   counts the cards already played (public information) to lead
 *           sure winners, or the card least likely to be beaten
 */
export function aiChoose(view, difficulty = 'normal', seed = 1) {
  const legal = view.legal;
  if (!legal.length) return null;
  const r = rng(seed + view.played.length * 31);
  if (difficulty === 'easy') return legal[Math.floor(r() * legal.length)];

  if (view.table.length) {
    // following
    const lead = view.table[0];
    const winners = legal.filter((c) => beats(c)(lead));
    if (winners.length) {
      return lowest(winners);
    }
    return lowest(legal);
  }
  // leading
  const nonTrump = legal.filter((c) => c.suit !== TRUMP);
  if (difficulty === 'hard') {
    const seen = new Set([...view.played, ...view.hand].map((c) => c.id));
    const sure = legal.filter((c) => {
      // every higher card of its suit (and every rose, for a non-rose) is already gone or in his hand
      for (let rank = c.rank + 1; rank <= 8; rank++) if (!seen.has(`${c.suit}-${rank}`)) return false;
      if (c.suit !== TRUMP) for (let rank = 1; rank <= 8; rank++) if (!seen.has(`${TRUMP}-${rank}`)) return false;
      return true;
    });
    if (sure.length) return lowest(sure);
    // otherwise lead the non-trump card with the fewest unseen higher cards
    // when that is at most one; else throw the lowest card
    const higherUnseen = (c) => {
      let n = 0;
      for (let rank = c.rank + 1; rank <= 8; rank++) if (!seen.has(`${c.suit}-${rank}`)) n += 1;
      return n;
    };
    const ranked = nonTrump.map((c) => [higherUnseen(c), -c.rank, c]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    if (ranked.length && ranked[0][0] <= 1) return ranked[0][2];
    return lowest(nonTrump.length ? nonTrump : legal);
  }
  const strong = nonTrump.filter((c) => c.rank >= 6).sort((a, b) => b.rank - a.rank);
  if (strong.length) return strong[0];
  return lowest(nonTrump.length ? nonTrump : legal);
}
