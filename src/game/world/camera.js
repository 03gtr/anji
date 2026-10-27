/**
 * Camera framing for the side-scrolling world (pure functions, unit-tested).
 *
 * Scenes are drawn in a 300-unit-tall world whose upper half is mostly sky
 * (they were composed for landscape screens). Fitting all 300 units on a
 * portrait phone left ~60 % of the screen as empty sky and the characters at
 * ~16 % of its height. Instead, the camera keeps a cinematic band: about
 * FRAME_H units of height fill the screen (never less than MIN_VIEW_W units
 * of width), the ground sits near the bottom, and when Anji climbs above the
 * frame the camera follows her up so high stars and ledges stay reachable.
 */
import { VIEW_H } from './props.js';

/** World units of height shown at rest (the ground band plus head-room). */
export const FRAME_H = 230;
/** Never show less than this many world units of width (look-ahead room). */
export const MIN_VIEW_W = 160;
/** Highest point the camera may rise to (meadow stars sit at y ≈ -4). */
export const MIN_TOP = -90;
/** Where her head is kept, as a share of the visible height, while climbing. */
const HEAD_AT = 0.3;

/**
 * Layout for a canvas of cssW × cssH CSS pixels.
 * @returns {{ k: number, viewW: number, viewH: number, baseTop: number }}
 *   k: CSS px per world unit; baseTop: world y at the top edge when she is on the ground.
 */
export function frameCamera(cssW, cssH) {
  const w = Math.max(1, cssW);
  const h = Math.max(1, cssH);
  const k = Math.min(w / MIN_VIEW_W, h / FRAME_H);
  const viewH = h / k;
  return { k, viewW: w / k, viewH, baseTop: VIEW_H - viewH };
}

/**
 * Vertical framing for this frame: rest at baseTop; rise (never above
 * MIN_TOP) when her head would leave the upper part of the screen.
 * @param {number} headY world y of the top of her head
 */
export function followTop(baseTop, viewH, headY) {
  if (baseTop <= MIN_TOP) return baseTop; // everything already fits
  const wanted = headY - viewH * HEAD_AT;
  return Math.max(MIN_TOP, Math.min(baseTop, wanted));
}
