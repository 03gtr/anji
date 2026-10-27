/**
 * Memory cards: flip two, keep matches. Deterministic shuffle (seeded) so a
 * layout can be reproduced; moves count for the medal.
 */
import { rng } from '../core/rng.js';

export function deal(symbols, seed = 1) {
  const deck = [...symbols, ...symbols].map((s, i) => ({ id: i, symbol: s }));
  const r = rng(seed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { deck, open: [], matched: new Set(), moves: 0, done: false };
}

/**
 * Flip card at index. Returns:
 *   'open'  — first card of a pair turned
 *   'match' — second card matched
 *   'miss'  — second card did not match (call hide() before the next flip)
 *   'noop'  — not allowed (already open/matched, or two cards waiting)
 */
export function flipCard(s, index) {
  if (s.done || s.open.length >= 2 || s.open.includes(index) || s.matched.has(index) || !s.deck[index]) return 'noop';
  s.open.push(index);
  if (s.open.length === 1) return 'open';
  s.moves += 1;
  const [a, b] = s.open;
  if (s.deck[a].symbol === s.deck[b].symbol) {
    s.matched.add(a);
    s.matched.add(b);
    s.open = [];
    s.done = s.matched.size === s.deck.length;
    return 'match';
  }
  return 'miss';
}

export function hideOpen(s) {
  s.open = [];
}

export function cardsMedal(s) {
  const pairs = s.deck.length / 2;
  if (s.moves <= Math.ceil(pairs * 1.6)) return 'gold';
  if (s.moves <= Math.ceil(pairs * 2.3)) return 'silver';
  return 'bronze';
}
