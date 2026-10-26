/**
 * "Nurse Needle chase": Anji and Snooki run through the conservatory, jumping
 * flowerpots and hoses while an over-eager cartoon syringe (with a rubber
 * safety ball on her tip) hops after Snooki. Comic, never violent: being
 * caught only means a theatrical "AH-HA!" and a restart at the last
 * checkpoint. Pure rules here; drawing lives in chase.js.
 */
export const CHASE = {
  runSpeed: 215,
  speedUp: 6, // units/s gained per second, up to maxSpeed
  maxSpeed: 270,
  gravity: 1650,
  jump: 600,
  stumbleTime: 0.7,
  stumbleFactor: 0.45,
  needleFactor: 0.97,
  startGap: 230,
  maxGap: 320,
  catchGap: 30,
  half: 14, // runner half width
};

export const OBSTACLE_SIZE = {
  pot: { w: 30, h: 34 },
  hose: { w: 46, h: 16 },
  gnome: { w: 26, h: 42 },
  bench: { w: 56, h: 30 },
};

const course = (length, checkpoints, obstacles, treats) => ({
  length,
  checkpoints,
  obstacles: obstacles.map(([x, type]) => ({ x, type, ...OBSTACLE_SIZE[type] })),
  treats: treats.map((x, i) => ({ x, y: i % 3 === 1 ? 105 : 36 })),
});

/**
 * Hand-placed courses. Obstacles are ≥ 260 units apart: one jump covers up to
 * ~200 units at top speed, so there is always time to land and jump again —
 * a flawless (gold) run is possible on every course.
 */
export const COURSES = {
  conservatory: course(
    3600,
    [0, 1200, 2400],
    [[420, 'pot'], [720, 'hose'], [1020, 'pot'], [1300, 'gnome'], [1600, 'pot'], [1880, 'hose'], [2170, 'bench'], [2450, 'pot'], [2740, 'gnome'], [3020, 'hose'], [3300, 'pot']],
    [300, 570, 870, 1160, 1450, 1740, 2020, 2310, 2600, 2880, 3160, 3450],
  ),
  clinic: course(
    4200,
    [0, 1400, 2800],
    [[380, 'pot'], [660, 'bench'], [950, 'hose'], [1230, 'gnome'], [1520, 'pot'], [1800, 'bench'], [2080, 'pot'], [2360, 'hose'], [2650, 'gnome'], [2930, 'bench'], [3210, 'pot'], [3500, 'hose'], [3780, 'gnome']],
    [250, 520, 800, 1090, 1370, 1660, 1940, 2220, 2500, 2790, 3070, 3350, 3640, 3950],
  ),
};

export function createChase(c) {
  return {
    x: 0,
    y: 0,
    vy: 0,
    onGround: true,
    speed: CHASE.runSpeed,
    stumble: 0,
    gap: CHASE.startGap,
    hits: 0,
    hitSet: new Set(),
    treats: new Set(),
    checkpoint: 0,
    caught: 0,
    done: false,
    t: 0,
    buffer: 0,
    length: c.length,
  };
}

/**
 * @param input { jump: boolean (pressed this frame) } — every jump is full height,
 *   so a quick tap on a phone works as well as a long press
 * @returns events
 */
export function stepChase(c, s, dt, input = {}) {
  const ev = { jumped: false, hit: false, treat: false, caught: false, checkpoint: false, finished: false };
  if (s.done) return ev;
  s.t += dt;
  s.speed = Math.min(CHASE.maxSpeed, s.speed + CHASE.speedUp * dt);

  // jump with a small input buffer
  s.buffer = input.jump ? 0.12 : Math.max(0, s.buffer - dt);
  if (s.buffer > 0 && s.onGround) {
    s.vy = CHASE.jump;
    s.onGround = false;
    s.buffer = 0;
    ev.jumped = true;
  }
  s.vy -= CHASE.gravity * dt;
  s.y += s.vy * dt;
  if (s.y <= 0) {
    s.y = 0;
    s.vy = 0;
    s.onGround = true;
  }

  const factor = s.stumble > 0 ? CHASE.stumbleFactor : 1;
  s.stumble = Math.max(0, s.stumble - dt);
  const v = s.speed * factor;
  s.x += v * dt;
  s.gap = Math.min(CHASE.maxGap, s.gap + (v - s.speed * CHASE.needleFactor) * dt);

  c.obstacles.forEach((o, i) => {
    if (s.hitSet.has(i)) return;
    const overlap = s.x + CHASE.half > o.x - o.w / 2 && s.x - CHASE.half < o.x + o.w / 2;
    if (overlap && s.y < o.h - 4) {
      s.hitSet.add(i);
      s.hits += 1;
      s.stumble = CHASE.stumbleTime;
      ev.hit = true;
    }
  });
  c.treats.forEach((tr, i) => {
    if (s.treats.has(i)) return;
    if (Math.abs(s.x - tr.x) < 22 && Math.abs(s.y + 30 - tr.y) < 40) {
      s.treats.add(i);
      ev.treat = true;
    }
  });

  const cp = c.checkpoints.filter((x) => s.x >= x).pop() ?? 0;
  if (cp !== s.checkpoint) {
    s.checkpoint = cp;
    ev.checkpoint = true;
  }

  if (s.gap <= CHASE.catchGap) {
    // caught: comic pose, then back to the checkpoint with a fresh lead
    s.caught += 1;
    s.x = s.checkpoint;
    s.y = 0;
    s.vy = 0;
    s.onGround = true;
    s.stumble = 0;
    s.gap = CHASE.startGap;
    // obstacles after the checkpoint can be hit again
    c.obstacles.forEach((o, i) => o.x > s.checkpoint && s.hitSet.delete(i));
    ev.caught = true;
  }
  if (s.x >= c.length) {
    s.done = true;
    ev.finished = true;
  }
  return ev;
}

export function chaseMedal(s) {
  if (s.hits === 0) return 'gold';
  if (s.hits <= 2 && s.caught === 0) return 'silver';
  return 'bronze';
}
