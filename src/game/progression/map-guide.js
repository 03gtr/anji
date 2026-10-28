/**
 * What the map tells her about places she cannot open yet, and where to keep exploring.
 * It never unlocks anything: it explains the unlock rules that are already there.
 *
 *   lockedText(world)   when she taps a locked place: what that place needs. A chapter is named
 *                       only while that chapter is still ahead of her (after it, the place waits
 *                       for a mission, never for a chapter she has already finished).
 *   exploreText(...)    one line on the map: the hidden deep garden (Ryan's box in the workshop),
 *                       open missions left, locked places left — or, only when everything there is
 *                       has been done, that the next adventures come with later updates.
 */
import { check } from '../core/conditions.js';
import { WORLDS } from '../data/worlds.js';
import { DEEP_UNLOCK, DEEP_OPEN } from '../data/missions-deep.js';

const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];

export const EXPLORE = {
  box: '📦 بعد أكو أماكن ما انكشفت بالخريطة: ريان ترك علبة صغيرة إلچ بالورشة.',
  open: '◆ بعد أكو مهمات مفتوحة تگدرين تلعبيها هسه. افتحي «المهمات» بالدفتر وشوفي وين.',
  locked: 'خلصتي كل اللي مفتوح هسه. الأماكن اللي عليها 🔒 المسيها حتى تعرفين شتحتاج.',
  done: '🌹 خلصتي كل اللي بالحديقة لهسه. المغامرات الجاية توصل ويا تحديثات جاية.',
};

export function lockedText(w, game) {
  if (w.locked) return `🔒 مكان مقفول. ${w.locked}`;
  if (w.act && !game.flag(`act${w.act}-done`)) return `مكان مقفول. ينفتح بالفصل ${ORD[w.act - 1]}.`;
  return '🔒 مكان مقفول. ينفتح بمهمة بعدچ ما خلصتيها: افتحي «المهمات» بالدفتر.';
}

/** `entries`: journalEntries(game); `current`: the objective the map is showing (or null). */
export function exploreText(game, entries, current) {
  if (check(DEEP_UNLOCK, game) && !check(DEEP_OPEN, game)) return EXPLORE.box;
  if (current) return '';
  if (entries.some((e) => e.status === 'available' || e.status === 'active')) return EXPLORE.open;
  if (entries.some((e) => e.status === 'locked') || WORLDS.some((w) => w.ready && !check(w.unlock, game))) return EXPLORE.locked;
  return EXPLORE.done;
}
