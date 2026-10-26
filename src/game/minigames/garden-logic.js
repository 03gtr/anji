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
