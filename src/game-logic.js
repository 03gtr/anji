/**
 * Pure, deterministic logic for the delivery mini-game.
 * y runs from 0 (top of the path) to 1 (bottom). The car sits at CATCH_Y.
 * Anything in the car's lane inside the generous catch band is collected;
 * missed items simply roll away — there is no losing.
 */
export const LANES = 3;
export const CATCH_Y = 0.82;
export const CATCH_BAND = [0.7, 0.95];
export const KINDS = ['rose', 'sweet', 'rose', 'choco', 'candy'];

export function createGame({ goal = 8, speed = 0.3, spawnEvery = 1.0, rng = Math.random } = {}) {
  return {
    goal,
    speed,
    spawnEvery,
    rng,
    lane: 1,
    items: [],
    collected: 0,
    missed: 0,
    time: 0,
    nextSpawn: 0.3,
    nextId: 1,
    lastLanes: [],
    done: false,
  };
}

export function setLane(game, lane) {
  game.lane = Math.max(0, Math.min(LANES - 1, lane));
  return collect(game);
}

function pickLane(game) {
  let lane = Math.floor(game.rng() * LANES);
  // avoid the same lane three times in a row so the car has to move
  const [a, b] = game.lastLanes;
  if (a === lane && b === lane) lane = (lane + 1 + Math.floor(game.rng() * 2)) % LANES;
  game.lastLanes = [lane, a];
  return lane;
}

function collect(game) {
  const got = [];
  game.items = game.items.filter((it) => {
    const inBand = it.y >= CATCH_BAND[0] && it.y <= CATCH_BAND[1];
    if (inBand && it.lane === game.lane) {
      got.push(it);
      return false;
    }
    return true;
  });
  game.collected += got.length;
  if (game.collected >= game.goal) game.done = true;
  return got;
}

/**
 * Advance the game by dt seconds.
 * @returns {{ spawned: object[], collected: object[], missed: object[] }}
 */
export function step(game, dt) {
  const out = { spawned: [], collected: [], missed: [] };
  if (game.done) return out;
  const d = Math.min(dt, 0.1); // a hidden tab shouldn't teleport items
  game.time += d;

  if (game.time >= game.nextSpawn) {
    const item = {
      id: game.nextId++,
      lane: pickLane(game),
      y: -0.06,
      kind: KINDS[Math.floor(game.rng() * KINDS.length)],
    };
    game.items.push(item);
    out.spawned.push(item);
    game.nextSpawn = game.time + game.spawnEvery;
  }

  for (const it of game.items) it.y += game.speed * d;
  out.collected = collect(game);

  game.items = game.items.filter((it) => {
    if (it.y > 1.06) {
      out.missed.push(it);
      return false;
    }
    return true;
  });
  game.missed += out.missed.length;
  return out;
}
