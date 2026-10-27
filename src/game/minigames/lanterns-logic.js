/**
 * Lantern lake (targeting): paper lanterns rise from the water; tapping one
 * releases it into the sky. Blue = 1 point, gold = 3, heart = 5 and a
 * combo bonus for consecutive catches. Missed lanterns only break the
 * combo. Positions are in a 100×160 play field (y = 160 is the water).
 */
import { rng } from '../core/rng.js';

export const FIELD = { w: 100, h: 160 };
const KINDS = [
  ['blue', 0.78, 1],
  ['gold', 0.18, 3],
  ['heart', 0.04, 5],
];

export function createLake({ duration = 45, seed = 3, goal = 30 } = {}) {
  return { t: 0, duration, goal, lanterns: [], score: 0, combo: 0, bestCombo: 0, caught: 0, missed: 0, nextId: 1, nextSpawn: 0.3, done: false, rand: rng(seed) };
}

/** Spawn rate and speed grow over the round. */
const pace = (s) => Math.min(1, s.t / s.duration);

export function stepLake(s, dt) {
  const ev = { spawned: 0, missed: 0, finished: false };
  if (s.done) return ev;
  s.t += dt;
  if (s.t >= s.nextSpawn) {
    const r = s.rand();
    let acc = 0;
    let kind = 'blue';
    for (const [k, p] of KINDS) {
      acc += p;
      if (r <= acc) {
        kind = k;
        break;
      }
    }
    const speed = 16 + pace(s) * 16 + s.rand() * 6;
    s.lanterns.push({ id: s.nextId++, x: 10 + s.rand() * 80, y: FIELD.h + 6, vy: -speed * (kind === 'gold' ? 1.25 : kind === 'heart' ? 1.4 : 1), sway: s.rand() * Math.PI * 2, kind });
    s.nextSpawn = s.t + Math.max(0.32, 0.95 - pace(s) * 0.6) * (0.7 + s.rand() * 0.6);
    ev.spawned += 1;
  }
  for (const l of s.lanterns) {
    l.y += l.vy * dt;
    l.sway += dt * 1.6;
  }
  const before = s.lanterns.length;
  s.lanterns = s.lanterns.filter((l) => l.y > -10);
  ev.missed = before - s.lanterns.length;
  if (ev.missed) {
    s.missed += ev.missed;
    s.combo = 0;
  }
  if (s.t >= s.duration) {
    s.done = true;
    ev.finished = true;
  }
  return ev;
}

export const lanternX = (l) => l.x + Math.sin(l.sway) * 3;

/** Tap at field coords; the nearest lantern within reach is caught. */
export function tapLake(s, x, y, reach = 9) {
  if (s.done) return null;
  let best = null;
  let bestD = reach;
  for (const l of s.lanterns) {
    const d = Math.hypot(lanternX(l) - x, l.y - y);
    if (d <= bestD) {
      best = l;
      bestD = d;
    }
  }
  if (!best) {
    return null;
  }
  s.lanterns = s.lanterns.filter((l) => l !== best);
  s.combo += 1;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  s.caught += 1;
  const base = best.kind === 'heart' ? 5 : best.kind === 'gold' ? 3 : 1;
  const bonus = Math.min(4, Math.floor(s.combo / 5));
  s.score += base + bonus;
  return { lantern: best, points: base + bonus };
}

export function lakeMedal(s) {
  if (s.score >= s.goal * 2.2) return 'gold';
  if (s.score >= s.goal * 1.4) return 'silver';
  return 'bronze';
}
