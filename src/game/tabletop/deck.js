/**
 * The Secret Garden card deck (original design, no real-world brands):
 * four suits — blue rose (the trump suit in «سباق الورد»), star, moon, paw —
 * and ranks 1…12, where 10 = سنوكي, 11 = العم منذر, 12 = الوردة.
 * Shuffles are seeded, so every deal can be reproduced (tests, rematches).
 */
import { rng } from '../core/rng.js';

export const SUITS = ['rose', 'star', 'moon', 'paw'];
export const SUIT_NAMES = { rose: 'ورد', star: 'نجوم', moon: 'قمر', paw: 'كفوف' };
export const SUIT_ICONS = { rose: 'rose', star: 'star', moon: 'moon-full', paw: 'paw' };
export const RANK_NAMES = { 10: 'سنوكي', 11: 'منذر', 12: 'الوردة' };
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const rankLabel = (r) => RANK_NAMES[r] || String(r).replace(/\d/g, (d) => AR_DIGITS[d]);

export const card = (suit, rank) => ({ id: `${suit}-${rank}`, suit, rank });

export function makeDeck({ suits = SUITS, ranks = 12 } = {}) {
  const out = [];
  for (const s of suits) for (let r = 1; r <= ranks; r++) out.push(card(s, r));
  return out;
}

/** Fisher–Yates with a seeded generator (returns a new array). */
export function shuffle(list, seed) {
  const a = [...list];
  const r = rng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A readable name, e.g. «٧ نجوم» / «سنوكي ورد». */
export const cardName = (c) => `${rankLabel(c.rank)} ${SUIT_NAMES[c.suit]}`;
