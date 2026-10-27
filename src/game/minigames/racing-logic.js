/**
 * Road of Blue Lights — racing rules (V2: third-person pseudo-3D).
 *
 * The track is a list of short segments (SEG world units long), each with a
 * curve (how much the road bends) and a height (hills). The player has a
 * distance `z` along the track, a lateral position `x` (-1 … 1 is the road,
 * beyond is the verge) and a speed `v`. Curves push the car outward
 * (centrifugal), so she has to steer into bends. Throttle is automatic.
 *
 * You cannot lose: crashes and the verge only cost time. Every track has a
 * finish line, three checkpoints, traffic, blue lights (they fill the ⚡
 * boost meter) and boost arrows. Medal times are proven by a test bot.
 *
 * Pure and deterministic (seeded), so it is unit-tested without a canvas.
 */
import { rng } from '../core/rng.js';

export const SEG = 200; // world units per segment
export const CAR = {
  vmax: 12000,
  boostV: 15600,
  accel: 3600, // u/s² (0 → vmax in ~3.3 s)
  brake: 9000,
  coast: 2400,
  offroadV: 3600,
  lateral: 2.1, // road widths per second at full speed
  centrifugal: 0.18,
  width: 0.3, // car width in road units (road = 2)
  length: 2 * SEG * 0.6,
};

export const DIFFICULTY = {
  easy: { traffic: 0.5, centrifugal: 0.7, assist: true, crashKeep: 0.65 },
  normal: { traffic: 1, centrifugal: 1, assist: false, crashKeep: 0.45 },
  hard: { traffic: 1.5, centrifugal: 1.2, assist: false, crashKeep: 0.35 },
};

/**
 * Tracks: `sections` are [segments, curve, hill]. Curve: ±1 gentle … ±5
 * sharp. Hill: height change over the section (world units). Decorations
 * are generated from the theme. `cones`, `oil`, `boosts` and `orbs` are
 * [fraction of the track, lane x]. Traffic is seeded per track.
 */
const T = {
  moon: {
    name: 'طريق القمر',
    theme: 'moon',
    seed: 11,
    sections: [[60, 0, 0], [80, 1.5, 400], [70, 0, -400], [90, -2.5, 0], [60, 0, 600], [80, 3, -600], [70, -1, 0], [90, 2, 300], [80, -3, -300], [70, 0, 0], [70, 1.5, 0], [90, 0, 0]],
    traffic: 6,
    trafficSpeed: [0.45, 0.6],
    cones: [[0.18, -0.4], [0.33, 0.4], [0.52, 0], [0.7, -0.5], [0.86, 0.45]],
    oil: [[0.42, 0.3], [0.78, -0.2]],
    boosts: [[0.12, 0], [0.47, 0.5], [0.8, -0.5]],
    orbs: [0.06, 0.09, 0.15, 0.22, 0.26, 0.31, 0.37, 0.44, 0.5, 0.56, 0.62, 0.67, 0.74, 0.83, 0.9, 0.95].map((f, i) => [f, [0, 0.45, -0.45][i % 3]]),
    medals: { gold: 42, silver: 49 },
  },
  rose: {
    name: 'طريق الورد',
    theme: 'rose',
    seed: 23,
    sections: [[50, 0, 0], [60, 2.5, 300], [60, -3, 0], [70, 3.5, -500], [50, 0, 0], [80, -4, 500], [60, 2, 0], [70, -2.5, -400], [60, 4, 400], [70, 0, 0], [60, -3.5, -300], [80, 2.5, 300], [60, -1.5, 0], [90, 0, 0]],
    traffic: 10,
    trafficSpeed: [0.45, 0.62],
    cones: [[0.15, 0.4], [0.28, -0.45], [0.41, 0], [0.55, 0.45], [0.66, -0.3], [0.79, 0.3], [0.9, -0.4]],
    oil: [[0.36, -0.3], [0.6, 0.2], [0.84, 0]],
    boosts: [[0.1, 0], [0.5, -0.5], [0.74, 0.5]],
    orbs: [0.05, 0.08, 0.13, 0.19, 0.24, 0.3, 0.34, 0.39, 0.45, 0.52, 0.57, 0.63, 0.69, 0.76, 0.82, 0.88, 0.93, 0.97].map((f, i) => [f, [0.45, 0, -0.45][i % 3]]),
    medals: { gold: 44, silver: 51 },
  },
  bridge: {
    name: 'جسر منتصف الليل',
    theme: 'bridge',
    seed: 37,
    sections: [[60, 0, 0], [70, -2, 600], [60, 2.5, 0], [60, 0, -600], [200, 0, 0], [70, 3, 0], [60, -3, 400], [70, 2, -400], [60, -2.5, 0], [80, 1.5, 0], [100, 0, 0]],
    bridge: [0.33, 0.62], // fraction range on the bridge (railings, water)
    lookRight: 0.47, // the observatory light appears on the right here
    traffic: 12,
    trafficSpeed: [0.5, 0.66],
    cones: [[0.2, 0.4], [0.3, -0.4], [0.45, 0.45], [0.55, -0.45], [0.7, 0], [0.85, 0.4]],
    oil: [[0.38, 0], [0.76, -0.3]],
    boosts: [[0.14, 0], [0.4, 0], [0.88, 0]],
    orbs: [0.04, 0.08, 0.12, 0.17, 0.22, 0.27, 0.35, 0.39, 0.43, 0.5, 0.54, 0.58, 0.65, 0.72, 0.78, 0.82, 0.9, 0.95].map((f, i) => [f, [0, -0.45, 0.45][i % 3]]),
    medals: { gold: 41, silver: 48 },
  },
  // V2 side mission «الطريق للبيت»: a long night road, a rival car ahead
  night: {
    name: 'الطريق للبيت',
    theme: 'night',
    seed: 53,
    sections: [[70, 0, 0], [80, 2, 500], [70, -2.5, -200], [90, 3, -300], [60, 0, 0], [80, -3.5, 400], [70, 2.5, 0], [100, 0, -400], [70, -2, 300], [80, 3.5, 0], [70, -3, -300], [90, 1.5, 0], [70, 0, 0], [100, 0, 0]],
    traffic: 12,
    trafficSpeed: [0.45, 0.62],
    cones: [[0.16, 0.45], [0.31, -0.45], [0.48, 0], [0.63, 0.4], [0.81, -0.4]],
    oil: [[0.4, -0.2], [0.72, 0.3]],
    boosts: [[0.09, 0], [0.36, 0.5], [0.58, -0.5], [0.86, 0]],
    orbs: Array.from({ length: 22 }, (_, i) => [0.04 + i * 0.043, [0, 0.45, -0.45, 0][i % 4]]),
    rival: { speed: 0.9, start: 0.06 }, // a friendly rival ahead (fraction of the track): steady pace, never rams
    medals: { gold: 51, silver: 59 },
  },
};

/* ── track building ───────────────────────────────────────── */

/** Sections are authored compactly and stretched so a race lasts ~40–55 s. */
const STRETCH = 2.6;

const ease = (a, b, p) => a + (b - a) * (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2);

export function buildTrack(def) {
  const segments = [];
  let y = 0;
  let prevCurve = 0;
  for (const [authored, curve, hill] of def.sections) {
    const count = Math.round(authored * STRETCH);
    const y0 = y;
    // ease in/out of curves and hills over the section
    for (let i = 0; i < count; i++) {
      const p = i / count;
      const c = i < count * 0.2 ? ease(prevCurve, curve, i / (count * 0.2)) : curve;
      segments.push({ i: segments.length, curve: c, y1: 0, y2: ease(y0, y0 + hill, (i + 1) / count) });
    }
    y = y0 + hill;
    prevCurve = curve;
  }
  for (let i = 0; i < segments.length; i++) segments[i].y1 = i ? segments[i - 1].y2 : 0;
  const length = segments.length * SEG;
  const at = (f) => Math.round(f * length);
  const r = rng(def.seed);
  const [s0, s1] = def.trafficSpeed;
  const traffic = Array.from({ length: def.traffic }, (_, k) => ({
    z: at(0.08 + (k / def.traffic) * 0.84 + r() * 0.03),
    x: [-0.5, 0, 0.5][Math.floor(r() * 3)],
    speed: CAR.vmax * (s0 + r() * (s1 - s0)),
    color: ['#c9304a', '#e2b544', '#e9e7f2', '#3f9a6a', '#7a5fc0'][k % 5],
  }));
  return {
    ...def,
    segments,
    length,
    cones: def.cones.map(([f, x]) => ({ z: at(f), x })),
    oil: def.oil.map(([f, x]) => ({ z: at(f), x })),
    boosts: def.boosts.map(([f, x]) => ({ z: at(f), x })),
    orbs: def.orbs.map(([f, x]) => ({ z: at(f), x })),
    checkpoints: [0.25, 0.5, 0.75].map(at),
    trafficStart: traffic,
  };
}

export const TRACKS = Object.fromEntries(Object.entries(T).map(([id, def]) => [id, buildTrack({ id, ...def })]));

export const segmentAt = (track, z) => track.segments[Math.floor(z / SEG) % track.segments.length];

/** Curve of the road ahead (for the navigator and the bot): average over n segments. */
export function curveAhead(track, z, n = 30) {
  const i0 = Math.floor(z / SEG);
  let sum = 0;
  let max = 0;
  for (let k = 0; k < n; k++) {
    const c = track.segments[Math.min(track.segments.length - 1, i0 + k)].curve;
    sum += c;
    if (Math.abs(c) > Math.abs(max)) max = c;
  }
  return { avg: sum / n, max };
}

/* ── race state ───────────────────────────────────────────── */

export function createRace(track, { difficulty = 'normal' } = {}) {
  const diff = DIFFICULTY[difficulty] || DIFFICULTY.normal;
  const keep = Math.max(1, Math.round(track.trafficStart.length * diff.traffic));
  const traffic = [];
  for (let k = 0; k < keep; k++) {
    const src = track.trafficStart[k % track.trafficStart.length];
    // extra cars (hard) are offset so they never stack on the same spot
    traffic.push({ ...src, z: k < track.trafficStart.length ? src.z : (src.z + track.length * 0.11) % track.length, hitCooldown: 0 });
  }
  return {
    difficulty: diff,
    z: 0,
    x: 0,
    v: 0,
    t: 0,
    boost: 0, // seconds of boost left
    meter: 0, // 0 … 1, filled by blue lights
    slip: 0,
    slipDir: 1,
    bump: 0,
    hits: 0,
    offroadTime: 0,
    orbs: new Set(),
    usedBoosts: new Set(),
    hitCones: new Set(),
    hitOil: new Set(),
    checkpoint: 0,
    splits: [],
    traffic: traffic.slice(0, keep),
    rival: track.rival ? { z: track.rival.start * track.length, v: CAR.vmax * 0.5 } : null,
    done: false,
  };
}

/**
 * Advance the race by dt.
 * input: { steer: -1…1 } or { targetX } (finger, road units), { boost: true }
 * (use a full meter), { brake: true }.
 * Returns events: { orb, hit, cone, oil, boost, checkpoint, finished, offroad }.
 */
export function stepRace(track, s, dt, input = {}) {
  const ev = { orb: false, hit: false, cone: false, oil: false, boost: false, checkpoint: 0, finished: false, offroad: false };
  if (s.done) return ev;
  s.t += dt;
  const seg = segmentAt(track, s.z);
  const pct = s.v / CAR.vmax;
  const off = Math.abs(s.x) > 1;
  ev.offroad = off;
  if (off) s.offroadTime += dt;

  s.boost = Math.max(0, s.boost - dt);
  s.slip = Math.max(0, s.slip - dt);
  s.bump = Math.max(0, s.bump - dt);
  if (input.boost && s.meter >= 1 && s.boost <= 0) {
    s.meter = 0;
    s.boost = 2.2;
    ev.boost = true;
  }

  // speed
  const top = off ? CAR.offroadV : s.boost > 0 ? CAR.boostV : CAR.vmax;
  if (input.brake) s.v = Math.max(0, s.v - CAR.brake * dt);
  else if (s.v < top) s.v = Math.min(top, s.v + CAR.accel * (s.boost > 0 ? 1.8 : 1) * dt);
  else s.v = Math.max(top, s.v - (off ? CAR.brake : CAR.coast) * dt);

  // steering scales with speed; curves push outward; oil makes it drift
  let steer;
  if (typeof input.targetX === 'number') steer = Math.max(-1, Math.min(1, (input.targetX - s.x) / 0.25));
  else steer = Math.max(-1, Math.min(1, input.steer || 0));
  if (s.difficulty.assist && !steer && Math.abs(s.x) > 0.75) steer = -Math.sign(s.x) * 0.6; // easy: drift back to the road
  const dx = dt * CAR.lateral * Math.min(1, pct);
  const grip = s.slip > 0 ? 0.4 : 1;
  s.x += steer * dx * grip;
  s.x -= dx * pct * seg.curve * CAR.centrifugal * s.difficulty.centrifugal;
  if (s.slip > 0) s.x += s.slipDir * dx * 0.6;
  s.x = Math.max(-2.2, Math.min(2.2, s.x));
  const z0 = s.z;
  s.z += s.v * dt;

  // traffic drives forward; overlap = a bump (no damage, just lost speed)
  for (const car of s.traffic) {
    const r0 = car.z - z0;
    car.z += car.speed * dt;
    if (car.z > track.length) car.z -= track.length;
    car.hitCooldown = Math.max(0, car.hitCooldown - dt);
    // swept test: also catches a car passed between two frames at boost speed
    const r1 = car.z - s.z;
    const overlap = Math.min(r0, r1) < CAR.length * 0.7 && Math.max(r0, r1) > -CAR.length * 0.3 && Math.abs(r0 - r1) < track.length / 2;
    if (car.hitCooldown <= 0 && overlap && Math.abs(car.x - s.x) < CAR.width * 1.05) {
      car.hitCooldown = 1;
      s.hits += 1;
      s.v = Math.min(s.v, car.speed * s.difficulty.crashKeep + CAR.vmax * 0.1);
      s.z = Math.min(s.z, car.z - CAR.length * 0.75);
      s.x += s.x >= car.x ? 0.12 : -0.12;
      s.bump = 0.45;
      ev.hit = true;
    }
  }
  if (s.rival) {
    s.rival.v = Math.min(CAR.vmax * track.rival.speed, s.rival.v + CAR.accel * 0.8 * dt);
    s.rival.z = Math.min(track.length + SEG * 4, s.rival.z + s.rival.v * dt);
  }

  const near = (o, w) => o.z > z0 - SEG * 0.8 && o.z < s.z + SEG * 0.8 && Math.abs(o.x - s.x) < w;
  track.cones.forEach((o, i) => {
    if (!s.hitCones.has(i) && near(o, 0.2)) {
      s.hitCones.add(i);
      s.hits += 1;
      s.v *= 0.7;
      s.bump = 0.3;
      ev.cone = true;
      ev.hit = true;
    }
  });
  track.oil.forEach((o, i) => {
    if (!s.hitOil.has(i) && near(o, 0.3)) {
      s.hitOil.add(i);
      s.slip = 1;
      s.slipDir = s.x >= o.x ? 1 : -1;
      ev.oil = true;
    }
  });
  track.boosts.forEach((o, i) => {
    if (!s.usedBoosts.has(i) && near(o, 0.3)) {
      s.usedBoosts.add(i);
      s.boost = Math.max(s.boost, 1.4);
      ev.boost = true;
    }
  });
  track.orbs.forEach((o, i) => {
    if (!s.orbs.has(i) && near(o, 0.22)) {
      s.orbs.add(i);
      s.meter = Math.min(1, s.meter + 0.25);
      ev.orb = true;
    }
  });

  while (s.checkpoint < track.checkpoints.length && s.z >= track.checkpoints[s.checkpoint]) {
    s.splits.push(s.t);
    s.checkpoint += 1;
    ev.checkpoint = s.checkpoint;
  }
  if (s.z >= track.length) {
    s.z = track.length;
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

/** Did she finish ahead of the rival? (night run only) */
export const beatRival = (track, s) => Boolean(s.rival) && s.done && s.rival.z < track.length;

/**
 * Race controller: countdown → racing ⇄ paused → finished, and retry.
 * The UI drives it with tick(); pausing simply stops the simulation.
 */
export function createRaceController(track, { difficulty = 'normal', countdown = 3 } = {}) {
  const c = {
    track,
    difficulty,
    state: createRace(track, { difficulty }),
    phase: 'countdown', // countdown | racing | paused | finished
    count: countdown,
    resumeTo: 'racing',
    tick(dt, input) {
      if (c.phase === 'countdown') {
        c.count -= dt;
        if (c.count <= 0) c.phase = 'racing';
        return null;
      }
      if (c.phase !== 'racing') return null;
      const ev = stepRace(track, c.state, dt, input);
      if (ev.finished) c.phase = 'finished';
      return ev;
    },
    pause() {
      if (c.phase === 'racing' || c.phase === 'countdown') {
        c.resumeTo = c.phase;
        c.phase = 'paused';
      }
    },
    resume() {
      if (c.phase === 'paused') c.phase = c.resumeTo;
    },
    retry(nextDifficulty = c.difficulty) {
      c.difficulty = nextDifficulty;
      c.state = createRace(track, { difficulty: nextDifficulty });
      c.phase = 'countdown';
      c.count = countdown;
    },
  };
  return c;
}

/** A careful driver (tests, and the medal times): leans into curves, dodges, grabs boosts. */
export function botInput(track, s) {
  const { avg } = curveAhead(track, s.z, 12);
  let target = Math.max(-0.6, Math.min(0.6, avg * 0.12));
  const look = SEG * 22;
  const blockers = [
    ...s.traffic.filter((c) => c.z > s.z - SEG && c.z - s.z < look),
    ...track.cones.filter((o, i) => !s.hitCones.has(i) && o.z > s.z && o.z - s.z < look),
    ...track.oil.filter((o, i) => !s.hitOil.has(i) && o.z > s.z && o.z - s.z < look),
  ].sort((a, b) => a.z - b.z);
  for (const b of blockers) {
    if (Math.abs(b.x - target) < 0.42) {
      const lanes = [-0.6, 0, 0.6].filter((l) => blockers.every((o) => Math.abs(o.x - l) >= 0.42 || o.z - s.z > look));
      target = lanes.sort((a, c) => Math.abs(a - s.x) - Math.abs(c - s.x))[0] ?? (b.x > 0 ? -0.65 : 0.65);
      break;
    }
  }
  return { targetX: target, boost: s.meter >= 1 };
}
