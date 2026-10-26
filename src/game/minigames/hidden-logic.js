/**
 * Hidden-object rules. Objects have a box in scene units; taps within the box
 * plus a padding count (so small things are still easy to hit on a phone).
 */
export const MIN_HIT = 34; // scene units: never smaller than this

export function hitBox(o, pad = 6) {
  const w = Math.max(MIN_HIT, o.w + pad * 2);
  const h = Math.max(MIN_HIT, o.h + pad * 2);
  return { x: o.x + o.w / 2 - w / 2, y: o.y + o.h / 2 - h / 2, w, h };
}

export function createHunt(objects) {
  return { found: [], misses: 0, hints: 0, done: false, total: objects.length };
}

/** @returns {{ hit: string|null, done: boolean }} */
export function tapAt(objects, s, x, y) {
  if (s.done) return { hit: null, done: true };
  // the smallest box under the finger wins (nested objects stay findable)
  const under = objects
    .filter((o) => !s.found.includes(o.id))
    .filter((o) => {
      const b = hitBox(o);
      return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    })
    .sort((a, b) => a.w * a.h - b.w * b.h)[0];
  if (!under) {
    s.misses += 1;
    return { hit: null, done: false };
  }
  s.found.push(under.id);
  s.done = s.found.length === objects.length;
  return { hit: under.id, done: s.done };
}

export function useHint(objects, s, rand = Math.random) {
  const left = objects.filter((o) => !s.found.includes(o.id));
  if (!left.length) return null;
  s.hints += 1;
  return left[Math.floor(rand() * left.length)].id;
}

export function huntMedal(s) {
  if (s.hints === 0 && s.misses <= 2) return 'gold';
  if (s.hints <= 1 && s.misses <= 6) return 'silver';
  return 'bronze';
}
