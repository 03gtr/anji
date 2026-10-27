/**
 * «داما» — English draughts (checkers), complete standard rules. Pure.
 *
 *  - 8×8 board, pieces on dark squares; 12 each. Anji ('a', bottom) moves
 *    first, up the board; Ryan ('r', top) moves down.
 *  - Men move one square diagonally forward; kings one square in any
 *    diagonal direction (no "flying" kings).
 *  - Capturing is compulsory. A capture jumps an adjacent enemy piece onto
 *    the empty square behind it; if the same piece can capture again it must
 *    continue (multi-jump). Any capturing sequence may be chosen.
 *  - A man reaching the far row becomes a king; that ends the move.
 *  - You win when your opponent has no legal move (no pieces, or blocked).
 *  - Draw: 40 moves in a row (both sides) without a capture or a man moving.
 *
 * Board: array of 64 cells, index = row * 8 + col, row 0 at the top.
 * Cell: null | { side: 'a'|'r', king: boolean }.
 * A move: { from, path: [squares landed on], captures: [squares taken] }.
 */
import { rng } from '../core/rng.js';

export const SIZE = 8;
export const DRAW_PLIES = 40;
const idx = (r, c) => r * SIZE + c;
const rc = (i) => [Math.floor(i / SIZE), i % SIZE];
const inside = (r, c) => r >= 0 && c >= 0 && r < SIZE && c < SIZE;
export const isDark = (i) => {
  const [r, c] = rc(i);
  return (r + c) % 2 === 1;
};

export function createCheckers() {
  const board = Array(64).fill(null);
  for (let i = 0; i < 64; i++) {
    if (!isDark(i)) continue;
    const [r] = rc(i);
    if (r < 3) board[i] = { side: 'r', king: false };
    else if (r > 4) board[i] = { side: 'a', king: false };
  }
  return { board, turn: 'a', quiet: 0, done: false, result: null, moves: 0 };
}

const dirs = (piece) => (piece.king ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : piece.side === 'a' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
const crowned = (piece, i) => !piece.king && ((piece.side === 'a' && rc(i)[0] === 0) || (piece.side === 'r' && rc(i)[0] === SIZE - 1));

/** All capture sequences for the piece at `from` (each a full multi-jump). */
function jumpsFrom(board, from, piece) {
  const out = [];
  const walk = (at, path, captures, b) => {
    let extended = false;
    const [r, c] = rc(at);
    for (const [dr, dc] of dirs(piece)) {
      const mr = r + dr;
      const mc = c + dc;
      const lr = r + 2 * dr;
      const lc = c + 2 * dc;
      if (!inside(lr, lc)) continue;
      const mid = idx(mr, mc);
      const land = idx(lr, lc);
      const victim = b[mid];
      if (!victim || victim.side === piece.side || captures.includes(mid) || b[land]) continue;
      extended = true;
      const nb = [...b];
      nb[land] = nb[at];
      nb[at] = null;
      const p2 = [...path, land];
      const c2 = [...captures, mid];
      // crowning ends the move
      if (crowned(piece, land)) out.push({ from, path: p2, captures: c2 });
      else walk(land, p2, c2, nb);
    }
    if (!extended && captures.length) out.push({ from, path, captures });
  };
  walk(from, [], [], board);
  return out;
}

/** Every legal move for the side to play (captures are compulsory). */
export function legalMoves(s, side = s.turn) {
  if (s.done) return [];
  const captures = [];
  const steps = [];
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (!p || p.side !== side) continue;
    captures.push(...jumpsFrom(s.board, i, p));
    const [r, c] = rc(i);
    for (const [dr, dc] of dirs(p)) {
      const nr = r + dr;
      const nc = c + dc;
      if (inside(nr, nc) && !s.board[idx(nr, nc)]) steps.push({ from: i, path: [idx(nr, nc)], captures: [] });
    }
  }
  return captures.length ? captures : steps;
}

const sameMove = (a, b) => a.from === b.from && a.path.length === b.path.length && a.path.every((x, i) => x === b.path[i]);

/** Apply a legal move; returns a NEW state (the old one stays for undo). */
export function applyMove(s, move) {
  const legal = legalMoves(s).find((m) => sameMove(m, move));
  if (!legal) return null;
  const board = [...s.board];
  const piece = { ...board[legal.from] };
  board[legal.from] = null;
  for (const c of legal.captures) board[c] = null;
  const to = legal.path[legal.path.length - 1];
  const wasMan = !piece.king;
  if (crowned(piece, to)) piece.king = true;
  board[to] = piece;
  const next = {
    board,
    turn: s.turn === 'a' ? 'r' : 'a',
    quiet: legal.captures.length || wasMan ? 0 : s.quiet + 1,
    done: false,
    result: null,
    moves: s.moves + 1,
    last: legal,
  };
  if (!legalMoves(next).length) {
    next.done = true;
    next.result = s.turn; // the side that just moved wins: the other cannot move
  } else if (next.quiet >= DRAW_PLIES) {
    next.done = true;
    next.result = 'draw';
  }
  return next;
}

export const count = (s, side) => s.board.filter((p) => p && p.side === side).length;

/* ── Ryan's AI ─────────────────────────────────────────────── */
function evaluate(s, side) {
  if (s.done) return s.result === side ? 1000 : s.result === 'draw' ? 0 : -1000;
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (!p) continue;
    const [r, c] = rc(i);
    let v = p.king ? 1.7 : 1;
    if (!p.king) v += (p.side === 'a' ? 7 - r : r) * 0.04; // advancement
    if (c === 0 || c === 7) v += 0.05; // safe edges
    score += p.side === side ? v : -v;
  }
  return score;
}

function search(s, depth, alpha, beta, side) {
  if (depth === 0 || s.done) return evaluate(s, side);
  const moves = legalMoves(s);
  const maximize = s.turn === side;
  let best = maximize ? -Infinity : Infinity;
  for (const m of moves) {
    const v = search(applyMove(s, m), depth - 1, alpha, beta, side);
    if (maximize) {
      best = Math.max(best, v);
      alpha = Math.max(alpha, v);
    } else {
      best = Math.min(best, v);
      beta = Math.min(beta, v);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export const AI_DEPTH = { easy: 0, normal: 2, hard: 4 };

/**
 * Ryan's move. Deterministic for a seed: ties between equally good moves
 * are broken by the seeded generator (so he does not always play the same
 * game). easy = a random legal move; normal/hard = alpha-beta search.
 * He sees exactly what the player sees: the board.
 */
export function aiMove(s, difficulty = 'normal', seed = 1) {
  const moves = legalMoves(s);
  if (!moves.length) return null;
  const r = rng(seed + s.moves * 7919);
  const depth = AI_DEPTH[difficulty] ?? 2;
  if (depth === 0) return moves[Math.floor(r() * moves.length)];
  const side = s.turn;
  let bestV = -Infinity;
  let best = [];
  for (const m of moves) {
    const v = search(applyMove(s, m), depth - 1, -Infinity, Infinity, side);
    if (v > bestV + 1e-9) {
      bestV = v;
      best = [m];
    } else if (Math.abs(v - bestV) <= 1e-9) best.push(m);
  }
  return best[Math.floor(r() * best.length)];
}
