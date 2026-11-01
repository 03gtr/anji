/**
 * Darkness with soft pools of light, for a scene's `dynamic` list (`front: true`, drawn over the people): a dark
 * loft, a garden at dusk, the lantern night. One small offscreen mask per layer, redrawn each frame at half
 * resolution and stretched over the view; nothing is baked, nothing kept between scenes but the one canvas.
 *
 *   dynamic: [darkness({ alpha: 0.88, tint: [10, 8, 22], lights: ({ game, world, t }) => [{ x, y, r, flicker }] })]
 *
 * Each light: world x/y (y up from the floor line is `GROUND - …`), radius r, optional `flicker` (0–1). Lights
 * can depend on the game (a lamp hung, a lantern lit) and on the people (`world.player`, `world.actor(id)`).
 */
import { GROUND } from './props.js';

export function darkness({ alpha = 0.88, tint = [10, 8, 22], lights = () => [], above = 400, below = 200 } = {}) {
  let mask = null;
  const draw = (ctx, env) => {
    const { camX, viewW, t } = env;
    const W = Math.ceil(viewW / 2);
    const H = Math.ceil((above + below) / 2);
    if (!mask) mask = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!mask) return;
    if (mask.width !== W) mask.width = W;
    if (mask.height !== H) mask.height = H;
    const m = mask.getContext('2d');
    if (!m) return;
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, W, H);
    m.fillStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${alpha})`;
    m.fillRect(0, 0, W, H);
    m.globalCompositeOperation = 'destination-out';
    for (const l of lights(env) || []) {
      if (!l) continue;
      const r = l.r * (l.flicker ? 1 - l.flicker * 0.06 * (1 + Math.sin(t * 13 + l.x) * Math.sin(t * 7.3)) : 1);
      const x = (l.x - camX) / 2;
      const y = (l.y - (GROUND - above)) / 2;
      const g = m.createRadialGradient(x, y, r * 0.08, x, y, r / 2);
      g.addColorStop(0, 'rgba(0, 0, 0, 1)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      m.fillStyle = g;
      m.fillRect(x - r / 2, y - r / 2, r, r);
    }
    m.globalCompositeOperation = 'source-over';
    ctx.drawImage(mask, camX, GROUND - above, W * 2, H * 2);
  };
  return { x: 0, reach: 1e6, front: true, draw };
}

/** A warm glow around a lantern (behind the people): the light you see, where `darkness` is the dark you don't. */
export function glow(ctx, x, y, r = 60, t = 0, flicker = 0.5) {
  const k = 1 - flicker * 0.08 * (1 + Math.sin(t * 11 + x) * Math.sin(t * 5.7));
  const g = ctx.createRadialGradient(x, y, 2, x, y, r * k);
  g.addColorStop(0, 'rgba(255, 214, 140, 0.55)');
  g.addColorStop(1, 'rgba(255, 214, 140, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
