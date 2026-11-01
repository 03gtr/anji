/**
 * A careful player for the stealth (tests only): reads her sister's tells and moves from cover to cover. It uses
 * only what a player can learn from the screen — where she is, what she is doing, and her rhythm (fixed, the same
 * every time).
 */
import { STEALTH, COVERS, RHYTHMS, coverAt, stepOf, isLooking, untilLook, stepStealth } from '../../src/game/minigames/s2-stealth-logic.js';

/** Where she will stand when her next look starts, and whether it is a glance out of the shed's window. */
export function nextLook(s) {
  const r = RHYTHMS[s.rhythm];
  if (s.sister.inside) return { peek: true, x: STEALTH.length };
  let x = s.sister.x;
  for (let k = s.sister.step; k < r.script.length; k++) {
    const [kind, v] = r.script[k];
    if (kind === 'walk') x = v;
    if (kind === 'look') return { peek: false, x };
    if (kind === 'enter') break;
  }
  return { peek: true, x: STEALTH.length };
}

/**
 * One decision: { dir, hide } for this frame. `margin` (units) and `lag` (seconds) leave room for a player who
 * reacts late (a real browser, driven from outside, sees the state a moment after it happened).
 */
export function careful(s, { margin = 0, lag = 0 } = {}) {
  const sp = STEALTH.anjiSpeed;
  const cov = coverAt(s.x);
  const crouch = () => ({ dir: 0, hide: Boolean(cov) && !s.hidden });
  if (isLooking(s) || stepOf(s).kind === 'tell' || (lag && untilLook(s) < lag)) return crouch();
  const until = untilLook(s);
  const look = nextLook(s);
  let target;
  if (look.peek) {
    const win = COVERS.find((c) => c.id === 'window');
    const mid = (win.x1 + win.x2) / 2;
    // under the window if it can be reached before her next glance; otherwise wait out of its reach
    target = cov?.id === 'window' || (s.sister.inside && Math.abs(mid - s.x) / sp <= until - 0.2 - lag) ? mid : STEALTH.peekFrom - 30 - margin;
  } else {
    // the farthest cover ahead that is safe at her next look and reachable before it starts
    let best = null;
    for (const c of COVERS) {
      const u = Math.min(c.x2 - 2 - margin, look.x - STEALTH.near - 8 - margin);
      if (u < c.x1 + 1 + margin) continue;
      if (Math.abs(u - s.x) / sp > until - 0.15 - lag) continue;
      if (best === null || u > best) best = u;
    }
    target = best ?? s.x;
  }
  // never close enough to be heard while she walks ahead
  if (!s.sister.inside) target = Math.min(target, s.sister.x - STEALTH.near - 8 - margin);
  if (Math.abs(target - s.x) > 3 + margin / 2) return { dir: Math.sign(target - s.x), hide: false };
  return crouch();
}

/** Walks straight on, never hiding. */
export const reckless = () => ({ dir: 1, hide: false });

/** Plays with a policy until done (or `max` seconds); returns what happened. */
export function play(s, policy, { dt = 1 / 30, max = 240, stopAt } = {}) {
  const events = [];
  for (let i = 0; i < max / dt && !s.done; i++) {
    const ev = stepStealth(s, dt, policy(s));
    if (ev.caught) {
      events.push(ev.caught);
      if (stopAt && events.length >= stopAt) break;
    }
  }
  return { s, events };
}
