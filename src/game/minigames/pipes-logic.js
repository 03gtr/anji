/**
 * Logic machine: rotate tiles so energy flows from every source to every
 * target. Openings are a bitmask N=1 E=2 S=4 W=8; rotating turns them
 * clockwise. Levels are authored in their solved state and scrambled
 * deterministically, so every level is guaranteed to be solvable.
 */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

/** Tile shapes in rotation 0. */
export const SHAPES = {
  I: N | S, // straight
  L: N | E, // elbow
  T: N | E | S, // tee
  X: N | E | S | W, // cross
  D: N, // dead end (sources and targets)
  '.': 0,
};

export const rotateMask = (mask, r) => {
  let m = mask;
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
};

/**
 * Level rows use 3-char tokens: shape, solved rotation, role.
 *   role: '-' plain, 'S' source, 'T' target, 'F' fixed (cannot rotate)
 * e.g. 'D1S' = dead-end rotated once (facing east) that is a source.
 */
export function parseLevel(rows) {
  const grid = rows.map((row) =>
    row.trim().split(/\s+/).map((tok) => ({ shape: tok[0], solved: Number(tok[1]), role: tok[2] || '-' })),
  );
  const h = grid.length;
  const w = grid[0].length;
  if (grid.some((r) => r.length !== w)) throw new Error('Level rows must have equal length');
  return { grid, w, h };
}

export function scramble(level, seed = 1) {
  let a = seed >>> 0;
  const rand = () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
  const movable = (c) => !(c.role === 'F' || c.role === 'S' || c.shape === 'X' || c.shape === '.');
  const rot = level.grid.map((row) => row.map((c) => (movable(c) ? (c.solved + 1 + Math.floor(rand() * 3)) % 4 : c.solved)));
  // symmetric tiles can land back in a solved state: make sure it starts unsolved
  const cells = level.grid.flatMap((row, y) => row.map((c, x) => [c, x, y])).filter(([c]) => movable(c));
  let i = 0;
  while (isSolved(level, rot) && i < cells.length * 4) {
    const [, x, y] = cells[i % cells.length];
    rot[y][x] = (rot[y][x] + 1) % 4;
    i += 1;
  }
  return rot;
}

const DIRS = [
  [N, 0, -1, S],
  [E, 1, 0, W],
  [S, 0, 1, N],
  [W, -1, 0, E],
];

/** Cells reached by the flow from all sources. */
export function flow(level, rot) {
  const open = (x, y) => rotateMask(SHAPES[level.grid[y][x].shape], rot[y][x]);
  const seen = new Set();
  const stack = [];
  level.grid.forEach((row, y) => row.forEach((c, x) => c.role === 'S' && stack.push([x, y])));
  while (stack.length) {
    const [x, y] = stack.pop();
    const k = `${x},${y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const m = open(x, y);
    for (const [bit, dx, dy, back] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!(m & bit) || nx < 0 || ny < 0 || nx >= level.w || ny >= level.h) continue;
      if (open(nx, ny) & back) stack.push([nx, ny]);
    }
  }
  return seen;
}

export function isSolved(level, rot) {
  const lit = flow(level, rot);
  return level.grid.every((row, y) => row.every((c, x) => c.role !== 'T' || lit.has(`${x},${y}`)));
}

export function rotateAt(level, rot, x, y) {
  const c = level.grid[y]?.[x];
  if (!c || c.role === 'F' || c.role === 'S' || c.shape === '.') return rot;
  const next = rot.map((r) => [...r]);
  next[y][x] = (next[y][x] + 1) % 4;
  return next;
}

/** Hand-made levels (written solved; scrambled at play time). */
export const PIPE_LEVELS = {
  power: [
    'D1S I1- L2- L1- .0-',
    '.0- .0- I0- .0- I0-',
    '.0- .0- L0- I1- D3T',
  ],
  coolant: [
    'D2S I1- .0- L1- D3T',
    'I0- L2- .0- I0- .0-',
    'L0- I1- T1- L3- .0-',
    '.0- .0- D0T .0- L0-',
  ],
  workshop: [
    'D1S I1- T1- I1- L2- L2-',
    'I0- .0- I0- .0- I0- .0-',
    '.0- L1- X0- I1- T0- D3T',
    'L1- L3- I0- L0- I0- .0-',
    'D0T .0- L0- I1- L3- I1-',
  ],
  // V2: Robo-Snooki's circuit (one source, two lamps: eyes)
  robo: [
    'D1S I1- T1- I1- D3T',
    '.0- .0- I0- .0- .0-',
    'D1T I1- L3- .0- L0-',
  ],
  lights: [
    'D1S I1- T1- I1- D3T',
    'I0- .0- I0- .0- .0-',
    'D1T I1- X0- I1- D3T',
    '.0- .0- I0- .0- .0-',
    'L0- .0- D0T .0- L1-',
  ],
};
