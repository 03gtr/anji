/**
 * «خدعة سنوكي بالأوراق» — three short rounds, all fair and solvable. Pure.
 *
 *  1. swap   — three face-down cards, the blue rose is shown first. Snooki
 *              swaps pairs (the swaps are listed and can be replayed step by
 *              step, no time pressure). Where is the rose now?
 *  2. labels — three boxes labelled «ورد», «نجوم», «خليط». Snooki swore every
 *              label is wrong. One card is drawn from the box labelled
 *              «خليط»; from it, give every box its true label.
 *  3. pattern— a row of cards follows a rule; which card comes next?
 */
import { rng } from '../core/rng.js';

/* swap: positions 0,1,2 */
export function makeSwapRound(seed, swaps = 4) {
  const r = rng(seed);
  const start = Math.floor(r() * 3);
  const list = [];
  for (let i = 0; i < swaps; i++) {
    const a = Math.floor(r() * 3);
    const b = (a + 1 + Math.floor(r() * 2)) % 3;
    list.push([Math.min(a, b), Math.max(a, b)]);
  }
  return { kind: 'swap', start, swaps: list };
}
export function trackSwaps(start, swaps) {
  let at = start;
  for (const [a, b] of swaps) {
    if (at === a) at = b;
    else if (at === b) at = a;
  }
  return at;
}

/* labels: contents are a permutation of rose/star/mix where no box holds its label */
export const LABELS = ['rose', 'star', 'mix'];
export const LABEL_NAMES = { rose: 'ورد', star: 'نجوم', mix: 'خليط' };
export function makeLabelRound(seed) {
  // the two derangements of three items
  const derangements = [
    ['star', 'mix', 'rose'],
    ['mix', 'rose', 'star'],
  ];
  const contents = derangements[Math.floor(rng(seed)() * 2)];
  const mixBox = LABELS.indexOf('mix');
  // the box labelled «خليط» really holds only roses or only stars: that card decides everything
  return { kind: 'labels', contents, drawnFrom: mixBox, drawn: contents[mixBox] };
}
/** The deduction a player makes from the drawn card (also the checker). */
export function solveLabels(drawn) {
  // the «خليط» box holds `drawn`; the box labelled `drawn` can hold neither `drawn`
  // (taken) nor… its own label, so it holds the other single suit; the last box is the mix
  const other = drawn === 'rose' ? 'star' : 'rose';
  const contents = { mix: drawn, [drawn]: other, [other]: 'mix' };
  return LABELS.map((label) => contents[label]);
}
export const checkLabels = (round, answer) => answer.length === 3 && answer.every((c, i) => c === round.contents[i]);

/* pattern: rank sequences with one clear rule */
const PATTERNS = [
  { ranks: [2, 4, 6, 8], next: 10, rule: 'كل ورقة تزيد اثنين' },
  { ranks: [1, 2, 4, 8], next: 16, rule: 'كل ورقة ضعف اللي قبلها' },
  { ranks: [12, 10, 8, 6], next: 4, rule: 'كل ورقة تنقص اثنين' },
  { ranks: [1, 1, 2, 3, 5], next: 8, rule: 'كل ورقة مجموع الثنتين اللي قبلها' },
  { ranks: [3, 6, 9, 12], next: 15, rule: 'كل ورقة تزيد ثلاثة' },
];
export function makePatternRound(seed) {
  const r = rng(seed);
  const p = PATTERNS[Math.floor(r() * PATTERNS.length)];
  const wrong = new Set();
  while (wrong.size < 3) {
    const v = p.next + [-3, -2, -1, 1, 2, 3, 4][Math.floor(r() * 7)];
    if (v !== p.next && v >= 0) wrong.add(v);
  }
  const options = [p.next, ...wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { kind: 'pattern', ranks: p.ranks, rule: p.rule, answer: p.next, options };
}

export function makeTrick(seed = 1) {
  return [makeSwapRound(seed), makeLabelRound(seed + 1), makePatternRound(seed + 2)];
}

/** Check a round's answer. */
export function checkRound(round, answer) {
  if (round.kind === 'swap') return answer === trackSwaps(round.start, round.swaps);
  if (round.kind === 'labels') return checkLabels(round, answer);
  return answer === round.answer;
}

/** The solution, for the «شوفي الحل» button. */
export function roundSolution(round) {
  if (round.kind === 'swap') return trackSwaps(round.start, round.swaps);
  if (round.kind === 'labels') return round.contents;
  return round.answer;
}
