/**
 * Side-view movement rules, kept pure for testing.
 * Units: world units (the ground is at GROUND), seconds.
 */
import { GROUND } from './props.js';

export const MOVE = {
  speed: 155,
  accel: 1100,
  decel: 1500,
  airControl: 0.75,
  gravity: 1550,
  jumpVelocity: 575,
  maxFall: 900,
  coyote: 0.1,
  jumpBuffer: 0.13,
};

/** Move value toward target by at most delta. */
export const approach = (v, target, delta) => (v < target ? Math.min(v + delta, target) : Math.max(v - delta, target));

/**
 * Advance one body by dt.
 * body: { x, y, vx, vy, onGround, coyote, buffer, w }
 * intent: { dir: -1|0|1, jump: boolean (pressed this frame) }
 * Jumps are always full height: a quick tap on a phone must be enough.
 * world: { minX, maxX, platforms: [{x, y, w}], solids: [{x, w}] }
 * Returns events: { jumped, landed }
 */
export function stepBody(body, intent, world, dt, M = MOVE) {
  const events = { jumped: false, landed: false };
  const control = body.onGround ? 1 : M.airControl;
  const target = intent.dir * M.speed;
  const rate = (intent.dir !== 0 ? M.accel : M.decel) * control;
  body.vx = approach(body.vx, target, rate * dt);

  // jump buffering + coyote time make jumps forgiving on touch screens
  if (intent.jump) body.buffer = M.jumpBuffer;
  else body.buffer = Math.max(0, (body.buffer || 0) - dt);
  if (body.onGround) body.coyote = M.coyote;
  else body.coyote = Math.max(0, (body.coyote || 0) - dt);
  if (body.buffer > 0 && body.coyote > 0) {
    body.vy = -M.jumpVelocity;
    body.onGround = false;
    body.coyote = 0;
    body.buffer = 0;
    events.jumped = true;
  }

  // horizontal, then clamp against bounds and solid blockers
  const half = (body.w || 30) / 2;
  let nx = body.x + body.vx * dt;
  nx = Math.max(world.minX + half, Math.min(world.maxX - half, nx));
  for (const s of world.solids || []) {
    const left = s.x - s.w / 2 - half;
    const right = s.x + s.w / 2 + half;
    if (nx > left && nx < right) {
      nx = body.x <= s.x ? left : right;
      body.vx = 0;
    }
  }
  body.x = nx;

  // vertical with one-way platforms (land only when coming from above)
  const prevY = body.y;
  body.vy = Math.min(M.maxFall, body.vy + M.gravity * dt);
  let ny = body.y + body.vy * dt;
  let landedOn = null;
  if (body.vy >= 0) {
    for (const p of world.platforms || []) {
      if (body.x + half * 0.6 < p.x || body.x - half * 0.6 > p.x + p.w) continue;
      if (prevY <= p.y + 0.01 && ny >= p.y) {
        if (!landedOn || p.y < landedOn.y) landedOn = p;
      }
    }
  }
  const floor = landedOn ? landedOn.y : GROUND;
  const wasGround = body.onGround;
  if (ny >= floor && body.vy >= 0) {
    ny = floor;
    body.vy = 0;
    body.onGround = true;
    if (!wasGround) events.landed = true;
  } else {
    body.onGround = false;
  }
  body.y = ny;
  return events;
}

/** Companion following: returns the desired velocity toward a spot behind the leader. */
export function followVelocity(follower, leader, { gap = 62, speed = 190 } = {}) {
  const targetX = leader.x - leader.facing * gap;
  const d = targetX - follower.x;
  if (Math.abs(d) < 6) return 0;
  const urgency = Math.min(1, Math.abs(d) / 120);
  return Math.sign(d) * speed * (0.35 + 0.65 * urgency);
}
