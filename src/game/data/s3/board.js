/**
 * Season 3's investigation board (docs/season-3/TECHNICAL_ARCHITECTURE.md §7, SEASON_3_DESIGN.md §6) — the rules,
 * apart from any screen (ui/board-s3.js draws it). Pure; imports nothing from the season's registries, so a
 * mission module can name a thread (linkFlag) without an import cycle.
 *
 * - A card's reliability is a STATE, not a label: a claim becomes «متناقض» or «انكشف غلط» when she holds the
 *   evidence that does it (`contradictedBy` / `disprovedBy` on the claim), and the card shows the change.
 * - She draws threads herself: two cards and a relation. A thread is kept only if the season's relation table has
 *   it (`links` in the mission modules); otherwise a neutral line — never which part is wrong, never a count, and
 *   no thread is ever drawn for her.
 */
export const RELATIONS = [
  { id: 'supports', label: 'يثبت', symmetric: false },
  { id: 'contradicts', label: 'يناقض', symmetric: true },
  { id: 'depends', label: 'يعتمد على', symmetric: false },
  { id: 'before', label: 'صار قبل', symmetric: false },
  { id: 'same-source', label: 'نفس المصدر', symmetric: true },
  { id: 'different-source', label: 'مصدر مختلف', symmetric: true },
];
const SYM = new Set(RELATIONS.filter((r) => r.symmetric).map((r) => r.id));

/** The flag that records a thread she drew (symmetric relations read the same both ways). */
export function linkFlag(a, rel, b) {
  const [x, y] = SYM.has(rel) && b < a ? [b, a] : [a, b];
  return `flag:s3:link:${x}~${rel}~${y}`;
}
/**
 * The table's thread that this one states, or null. A conclusion rests on what proves it, so «A يعتمد على B» and
 * «B يثبت A» are one thread when A is a deduction (`evidence[A].rel`): the table names it once, in either form, and
 * she may draw it either way. Between two facts «يثبت» is corroboration, not dependence: no converse there.
 */
const CONVERSE = { supports: 'depends', depends: 'supports' };
export function linkMatch(links, a, rel, b, evidence = {}) {
  const key = linkFlag(a, rel, b);
  const direct = links.find(([x, r, y]) => linkFlag(x, r, y) === key);
  if (direct) return direct;
  const conv = CONVERSE[rel];
  const conclusion = rel === 'depends' ? a : b;
  if (!conv || evidence[conclusion]?.rel !== 'deduction') return null;
  return links.find(([x, r, y]) => x === b && r === conv && y === a) ?? null;
}
/** Is this thread in the season's relation table (as written, or as its converse for a conclusion)? */
export function linkHolds(links, a, rel, b, evidence) {
  return linkMatch(links, a, rel, b, evidence) !== null;
}

export const STATES = {
  fact: 'دليل مؤكد',
  claim: 'كلام ما متأكدين منه',
  contradicted: 'متناقض',
  disproved: 'انكشف غلط',
  deduction: 'استنتاجچ',
};
/** A card's reliability now, from what she holds (`has(id)` — the evidence id without its prefix). */
export function reliability(ev, has) {
  if (ev.rel === 'fact') return 'fact';
  if (ev.rel === 'deduction') return 'deduction';
  if (ev.disprovedBy && has(ev.disprovedBy)) return 'disproved';
  if (ev.contradictedBy && has(ev.contradictedBy)) return 'contradicted';
  return 'claim';
}

/** Neutral reply to a thread that does not hold (as the strict puzzles' replies: never which part, never a count). */
export const LINK_WRONG = ['هالخيط ما يمسك.', 'لا… فكري شنو يربطهم بالضبط.', 'الدليل ما يگول هيچ. بعد مرة.'];
