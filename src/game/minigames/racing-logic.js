/**
 * Road of Blue Lights — racing rules (top-down, auto throttle, steering).
 * Distance d runs along the track; x is lateral (0 = world centre line).
 * You cannot lose: mistakes only cost time. Medal times are checked by a
 * test bot so gold is always achievable.
 */
export const CAR = {
  vmax: 470,
  boostV: 640,
  accel: 300,
  offroadV: 190,
  lateral: 300,
  half: 15, // car half width
  len: 34,
};

const seg = (pairs) => pairs; // [[distance, centreOffset], …] — smoothstep between points

const BASE_TRACKS = {
  moon: {
    name: 'طريق القمر',
    length: 9000,
    roadHalf: 78,
    curve: seg([[0, 0], [1500, 0], [2600, 70], [3600, -50], [4600, 40], [5600, 0], [6600, 80], [7600, -20], [9000, 0]]),
    obstacles: [[1200, -30, 'cone'], [2000, 30, 'cone'], [2900, 60, 'cone'], [3500, -60, 'oil'], [4300, 20, 'cone'], [5100, -20, 'cone'], [6000, 30, 'oil'], [6900, 70, 'cone'], [7800, -40, 'cone']],
    boosts: [[1600, 0], [4800, 40], [7300, 40]],
    orbs: [[800, 0], [1000, 0], [2300, 40], [2500, 60], [3200, -20], [4000, -10], [4500, 40], [5400, 0], [6300, 60], [6500, 80], [7100, 30], [8200, -10], [8600, 0]],
    medals: { gold: 37.5, silver: 44 },
  },
  rose: {
    name: 'طريق الورد',
    length: 11000,
    roadHalf: 70,
    curve: seg([[0, 0], [1000, 40], [2000, -60], [3000, 60], [4000, -40], [5000, 80], [6000, -60], [7000, 30], [8000, -70], [9000, 50], [10000, 0], [11000, 0]]),
    obstacles: [[900, 0, 'cone'], [1700, -40, 'cone'], [2300, -30, 'oil'], [2900, 40, 'car'], [3700, -20, 'cone'], [4400, 20, 'car'], [5200, 60, 'cone'], [5900, -40, 'oil'], [6600, 10, 'car'], [7400, -50, 'cone'], [8300, -40, 'car'], [9100, 30, 'cone'], [9800, 0, 'oil']],
    boosts: [[1300, 30], [4700, 0], [8700, -10]],
    orbs: [[600, 0], [1400, 20], [2600, 30], [3300, 40], [4100, -30], [5500, 70], [6300, -30], [7000, 30], [7800, -60], [8800, 20], [9500, 30], [10400, 0]],
    medals: { gold: 47, silver: 55 },
  },
  bridge: {
    name: 'جسر منتصف الليل',
    length: 12500,
    roadHalf: 58,
    curve: seg([[0, 0], [1500, 0], [2500, 50], [3500, 50], [4500, -50], [5500, -50], [6500, 30], [7500, -30], [8500, 40], [9500, -40], [10500, 0], [12500, 0]]),
    obstacles: [[1000, -20, 'car'], [1800, 20, 'cone'], [2700, 40, 'car'], [3300, 30, 'oil'], [4000, -10, 'cone'], [4800, -40, 'car'], [5600, -20, 'cone'], [6300, 30, 'car'], [7000, -10, 'oil'], [7800, -20, 'car'], [8600, 30, 'cone'], [9300, -30, 'car'], [10100, 10, 'oil'], [11000, -20, 'car'], [11800, 20, 'cone']],
    boosts: [[1400, 10], [6000, -10], [10600, 0]],
    orbs: [[700, 0], [1500, 0], [2300, 40], [3100, 50], [4300, -40], [5200, -50], [5900, 20], [6800, -20], [7400, -20], [8200, 40], [9000, -30], [9900, -20], [10800, 0], [11500, 10], [12100, 0]],
    medals: { gold: 52.5, silver: 62 },
  },
};

/**
 * Tracks are authored compactly and stretched by SCALE along the road, so a
 * race lasts about 35–50 seconds with obstacles still spaced fairly.
 */
const SCALE = 1.8;
const stretch = (list) => list.map(([d, ...rest]) => [Math.round(d * SCALE), ...rest]);
export const TRACKS = Object.fromEntries(
  Object.entries(BASE_TRACKS).map(([id, t]) => [
    id,
    { ...t, length: Math.round(t.length * SCALE), curve: stretch(t.curve), obstacles: stretch(t.obstacles), boosts: stretch(t.boosts), orbs: stretch(t.orbs) },
  ]),
);

const OB = { cone: { w: 16, len: 16 }, oil: { w: 40, len: 34 }, car: { w: 30, len: 40, speed: 260 } };

/** Road centre at distance d (smooth between control points). */
export function centerAt(track, d) {
  const c = track.curve;
  if (d <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    if (d <= c[i][0]) {
      const [d0, x0] = c[i - 1];
      const [d1, x1] = c[i];
      const t = (d - d0) / (d1 - d0);
      const s = t * t * (3 - 2 * t);
      return x0 + (x1 - x0) * s;
    }
  }
  return c[c.length - 1][1];
}

export function createRace(track) {
  return {
    d: 0,
    x: 0,
    v: 0,
    t: 0,
    boost: 0,
    slip: 0,
    slipDir: 1,
    bump: 0,
    hits: 0,
    orbs: new Set(),
    done: false,
    // traffic cars move along the road
    traffic: track.obstacles.map((o, i) => (o[2] === 'car' ? { i, d: o[0], x: o[1] } : null)).filter(Boolean),
    hitSet: new Set(),
    usedBoosts: new Set(),
  };
}

/**
 * input: { steer: -1..1 } or { targetX: number } (absolute lateral target, e.g. finger)
 * returns events { orb, hit, boost, oil, finished, offroad }
 */
export function stepRace(track, s, dt, input = {}) {
  const ev = { orb: false, hit: false, boost: false, oil: false, finished: false, offroad: false };
  if (s.done) return ev;
  s.t += dt;
  const center = centerAt(track, s.d);
  const off = Math.abs(s.x - center) > track.roadHalf;
  ev.offroad = off;

  s.boost = Math.max(0, s.boost - dt);
  s.slip = Math.max(0, s.slip - dt);
  s.bump = Math.max(0, s.bump - dt);
  const target = off ? CAR.offroadV : s.boost > 0 ? CAR.boostV : CAR.vmax;
  s.v = s.v < target ? Math.min(target, s.v + CAR.accel * (s.boost > 0 ? 2 : 1) * dt) : Math.max(target, s.v - 600 * dt);

  // steering: lateral speed scales with forward speed; oil adds a drift
  let lat = 0;
  if (typeof input.targetX === 'number') lat = Math.max(-1, Math.min(1, (input.targetX - s.x) / 40));
  else lat = Math.max(-1, Math.min(1, input.steer || 0));
  const grip = s.slip > 0 ? 0.35 : 1;
  const vx = lat * CAR.lateral * (0.45 + 0.55 * Math.min(1, s.v / CAR.vmax)) * grip + (s.slip > 0 ? s.slipDir * 70 : 0);
  s.x += vx * dt;
  s.x = Math.max(center - track.roadHalf - 90, Math.min(center + track.roadHalf + 90, s.x));
  s.d += s.v * dt;

  for (const car of s.traffic) car.d += OB.car.speed * dt;

  track.obstacles.forEach((o, i) => {
    if (s.hitSet.has(i)) return;
    const [od, ox, type] = o;
    const tc = type === 'car' ? s.traffic.find((c) => c.i === i) : null;
    const d0 = tc ? tc.d : od;
    const x0 = tc ? tc.x : ox;
    const size = OB[type];
    if (Math.abs(s.d - d0) < (CAR.len + size.len) / 2 && Math.abs(s.x - x0) < CAR.half + size.w / 2) {
      s.hitSet.add(i);
      if (type === 'oil') {
        s.slip = 1.1;
        s.slipDir = s.x >= x0 ? 1 : -1;
        ev.oil = true;
      } else {
        s.hits += 1;
        s.v *= type === 'car' ? 0.45 : 0.6;
        s.bump = 0.4;
        ev.hit = true;
        if (tc) s.x += s.x >= x0 ? 18 : -18;
      }
    }
  });
  track.boosts.forEach(([bd, bx], i) => {
    if (!s.usedBoosts.has(i) && Math.abs(s.d - bd) < 30 && Math.abs(s.x - bx) < 34) {
      s.usedBoosts.add(i);
      s.boost = 1.6;
      ev.boost = true;
    }
  });
  track.orbs.forEach(([od, ox], i) => {
    if (!s.orbs.has(i) && Math.abs(s.d - od) < 30 && Math.abs(s.x - ox) < 28) {
      s.orbs.add(i);
      ev.orb = true;
    }
  });

  if (s.d >= track.length) {
    s.done = true;
    ev.finished = true;
  }
  return ev;
}

export function raceMedal(track, time) {
  if (time <= track.medals.gold) return 'gold';
  if (time <= track.medals.silver) return 'silver';
  return 'bronze';
}

export const OBSTACLE_SIZES = OB;
