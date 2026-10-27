/**
 * Hedge maze rules. Layouts are hand-made strings:
 *   #  hedge        .  path        S  start       E  exit
 *   *  petal (optional collectible)
 *   T  "Snooki's tip" junction: he insists on a direction (and is wrong)
 *   R  dead end with a note from Ryan
 */
export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function parseMaze(rows) {
  const h = rows.length;
  const w = rows[0].length;
  if (rows.some((r) => r.length !== w)) throw new Error('Maze rows must have equal length');
  let start = null;
  let exit = null;
  const petals = [];
  const specials = {};
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === 'S') start = { x, y };
      if (c === 'E') exit = { x, y };
      if (c === '*') petals.push({ x, y });
      if (c === 'T' || c === 'R') specials[`${x},${y}`] = c;
    }),
  );
  if (!start || !exit) throw new Error('Maze needs S and E');
  return { rows, w, h, start, exit, petals, specials };
}

export const isWall = (maze, x, y) => x < 0 || y < 0 || x >= maze.w || y >= maze.h || maze.rows[y][x] === '#';

export function createMazeState(maze) {
  return { pos: { ...maze.start }, trail: [{ ...maze.start }], petals: [], moves: 0, done: false, seen: new Set([`${maze.start.x},${maze.start.y}`]) };
}

/** @returns {{ moved: boolean, event: null | 'petal' | 'exit' | 'T' | 'R' }} */
export function moveIn(maze, state, dir) {
  if (state.done) return { moved: false, event: null };
  const [dx, dy] = DIRS[dir] || [0, 0];
  const nx = state.pos.x + dx;
  const ny = state.pos.y + dy;
  if (isWall(maze, nx, ny)) return { moved: false, event: null };
  state.pos = { x: nx, y: ny };
  state.moves += 1;
  state.trail.push({ x: nx, y: ny });
  if (state.trail.length > 3) state.trail.shift();
  const key = `${nx},${ny}`;
  state.seen.add(key);
  let event = null;
  if (maze.petals.some((p) => p.x === nx && p.y === ny) && !state.petals.includes(key)) {
    state.petals.push(key);
    event = 'petal';
  }
  if (maze.specials[key]) event = maze.specials[key];
  if (nx === maze.exit.x && ny === maze.exit.y) {
    state.done = true;
    event = 'exit';
  }
  return { moved: true, event };
}

/** Breadth-first shortest path length (for medals and content tests). */
export function shortestPath(maze) {
  const q = [[maze.start.x, maze.start.y, 0]];
  const seen = new Set([`${maze.start.x},${maze.start.y}`]);
  while (q.length) {
    const [x, y, d] = q.shift();
    if (x === maze.exit.x && y === maze.exit.y) return d;
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (!isWall(maze, nx, ny) && !seen.has(k)) {
        seen.add(k);
        q.push([nx, ny, d + 1]);
      }
    }
  }
  return -1;
}

/** Every petal must be reachable (no unreachable collectibles). */
export function reachable(maze) {
  const seen = new Set();
  const stack = [[maze.start.x, maze.start.y]];
  while (stack.length) {
    const [x, y] = stack.pop();
    const k = `${x},${y}`;
    if (seen.has(k) || isWall(maze, x, y)) continue;
    seen.add(k);
    for (const [dx, dy] of Object.values(DIRS)) stack.push([x + dx, y + dy]);
  }
  return seen;
}

export function mazeMedal(moves, best) {
  if (moves <= best * 1.25) return 'gold';
  if (moves <= best * 1.8) return 'silver';
  return 'bronze';
}

/** Hand-made layouts. */
export const MAZES = {
  hedge: [
    '###############',
    '#S....#.....*.#',
    '#####.#.#####.#',
    '#.....#.#...#.#',
    '#.#####.#.#.#.#',
    '#.#*....#.#...#',
    '#.#.#####.#####',
    '#...#R..#.....#',
    '###.#.#.#####.#',
    '#*..#.#..T....#',
    '#.###.###.###.#',
    '#.....#.....#E#',
    '###############',
  ],
  'hedge-night': [
    '#################',
    '#S....#.....#..*#',
    '####.##.###.#.###',
    '#*.#....#.#...#.#',
    '#.####.##.#####.#',
    '#......#..T.....#',
    '####.#.#.#####.##',
    '#....#...#R..#..#',
    '#.########.###.##',
    '#.....*#........#',
    '###############E#',
  ],
};
