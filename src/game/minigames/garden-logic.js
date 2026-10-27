/**
 * Garden designer rules. A 4×5 grid of plots in the hidden garden. Roses
 * cost seeds (each seed pouch she collected = 3 roses); decorations are free
 * but some unlock with progress. The layout is saved and drawn in the world.
 */
export const COLS = 4;
export const ROWS = 5;
export const ROSES_PER_POUCH = 3;

export const PIECES = {
  'rose-blue': { name: 'وردة زرقاء', icon: 'rose', rose: true },
  'rose-pink': { name: 'وردة وردية', icon: 'rose-red', rose: true },
  'rose-white': { name: 'وردة بيضاء', icon: 'rose-white', rose: true },
  lantern: { name: 'فانوس', icon: 'sun' },
  bench: { name: 'مصطبة', icon: 'note' },
  stones: { name: 'حجر ممر', icon: 'moon-new' },
  arch: { name: 'قوس ورد', icon: 'heart', unlock: 'flag:game-complete' },
  fountain: { name: 'نافورة صغيرة', icon: 'drop', unlock: 'flag:game-complete' },
  statue: { name: 'تمثال سنوكي', icon: 'paw', unlock: 'count:star>=15' },
  // V2: one special piece per side mission
  table: { name: 'طاولة أكل البيت', icon: 'apple', unlock: 'flag:mission:missing-recipe', special: true },
  'cat-house': { name: 'بيت فيروز', icon: 'cat', unlock: 'flag:mission:lost-kitten', special: true },
  telescope: { name: 'تلسكوب صغير', icon: 'star', unlock: 'flag:mission:second-sky', special: true },
  robo: { name: 'روبو-سنوكي', icon: 'robot', unlock: 'flag:mission:robo-snooki', special: true },
  // V3: from the games room's activities and pranks
  'rose-vase': { name: 'مزهرية الوردة', icon: 'rose', unlock: 'flag:deliver-done' },
  chocolates: { name: 'علبة شوكولاتة', icon: 'candy', unlock: 'flag:chocolates-done' },
  picnic: { name: 'بطانية نزهة', icon: 'apple', unlock: 'flag:picnic-done' },
  'gift-box': { name: 'صندوق هدية', icon: 'heart', unlock: 'flag:gift-made' },
  'lantern-path': { name: 'ممر فوانيس', icon: 'sun', unlock: 'flag:duet-done' },
  'promise-arch': { name: 'قوس الوعد', icon: 'rose', unlock: 'flag:promise-done' },
  'snooki-stash': { name: 'مخبأ سنوكي', icon: 'paw', unlock: 'flag:prank-paws' },
  'game-table': { name: 'طاولة أوراق', icon: 'star', unlock: 'flag:gameroom-entered' },
};

export const roseBudget = (seedPouches) => seedPouches * ROSES_PER_POUCH;
export const rosesUsed = (layout) => layout.filter((p) => PIECES[p.id]?.rose).length;

/**
 * Place (or replace) a piece. Returns the new layout, or null when not
 * allowed (unknown piece/cell, locked piece, or not enough seeds).
 */
export function place(layout, cell, id, { seeds = 0, unlocked = () => true } = {}) {
  const piece = PIECES[id];
  if (!piece || !Number.isInteger(cell) || cell < 0 || cell >= COLS * ROWS) return null;
  if (piece.unlock && !unlocked(piece.unlock)) return null;
  const without = layout.filter((p) => p.cell !== cell);
  if (piece.rose && rosesUsed(without) >= roseBudget(seeds)) return null;
  return [...without, { id, cell }].sort((a, b) => a.cell - b.cell);
}

export function clearCell(layout, cell) {
  return layout.filter((p) => p.cell !== cell);
}
