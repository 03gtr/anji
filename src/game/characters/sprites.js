/**
 * Rasterises the SVG character drawings into images for the canvas, once per
 * scene (and again only if the outfit changes). Each frame is decoded before
 * the scene starts, so animation never stutters on a missing image.
 */
import { anjiSprite } from './anji.js';
import { snookiSprite } from './snooki.js';
import { ryanSprite, ryanSide, needleSvg } from './cast.js';
import { personSprite, CIRCLE_KINDS } from './circle.js';

const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * Give the SVG an explicit pixel size, so every browser rasterises it at a
 * resolution that stays crisp when drawn on a high-DPI canvas.
 */
export function withSize(svg, height) {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) return svg;
  const w = Math.round((height * Number(vb[1])) / Number(vb[2]));
  return svg.replace(/<svg /, `<svg width="${w}" height="${height}" `);
}

/** Rasterisation height (px) per character kind. */
export const RASTER_HEIGHT = { anji: 300, snooki: 170, husky: 160, ryan: 300, shadow: 300, needle: 220, ...Object.fromEntries(CIRCLE_KINDS.map((k) => [k, 300])) };

/** Story Pack 01: the white husky — Snooki's build, icy-blue eyes, rose collar, a flower. */
export const HUSKY_LOOK = { eye: '#7fd0ff', collar: 'rose', hat: 'blossom' };

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

const WALK = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];

/**
 * Frame tables per character: name → list of SVG strings.
 * Sizes are in device pixels (the drawn height), keeping memory small.
 */
export function frameTable(kind, cos = {}) {
  switch (kind) {
    case 'anji': {
      const o = { outfit: cos.anjiOutfit || 'classic', bow: cos.anjiBow || 'burgundy' };
      return {
        idle: [anjiSprite({ ...o, pose: 'idle', t: 0 }), anjiSprite({ ...o, pose: 'idle', t: 0.25 })],
        blink: [anjiSprite({ ...o, pose: 'idle', t: 0, blink: true })],
        walk: WALK.map((t) => anjiSprite({ ...o, pose: 'walk', t })),
        run: WALK.map((t) => anjiSprite({ ...o, pose: 'run', t })),
        jump: [anjiSprite({ ...o, pose: 'jump' })],
        fall: [anjiSprite({ ...o, pose: 'fall' })],
        celebrate: [anjiSprite({ ...o, pose: 'celebrate', t: 0 }), anjiSprite({ ...o, pose: 'celebrate', t: 0.25 })],
        surprised: [anjiSprite({ ...o, pose: 'surprised' })],
        think: [anjiSprite({ ...o, pose: 'think' })],
        crouch: [anjiSprite({ ...o, pose: 'crouch', expr: 'thinking' })],
        sleep: [anjiSprite({ ...o, pose: 'idle', blink: true, expr: 'soft' })],
        pout: [anjiSprite({ ...o, pose: 'idle', expr: 'pout' })],
        shy: [anjiSprite({ ...o, pose: 'idle', expr: 'shy' })],
      };
    }
    case 'snooki': {
      const o = { hat: cos.snookiHat || 'none', collar: cos.snookiCollar || 'navy' };
      return {
        idle: [snookiSprite({ ...o, pose: 'idle', t: 0 }), snookiSprite({ ...o, pose: 'idle', t: 0.25 })],
        blink: [snookiSprite({ ...o, pose: 'idle', blink: true })],
        walk: WALK.map((t) => snookiSprite({ ...o, pose: 'walk', t })),
        run: WALK.map((t) => snookiSprite({ ...o, pose: 'run', t })),
        sit: [snookiSprite({ ...o, pose: 'sit', t: 0 }), snookiSprite({ ...o, pose: 'sit', t: 0.25 })],
        sniff: [snookiSprite({ ...o, pose: 'sniff', t: 0 }), snookiSprite({ ...o, pose: 'sniff', t: 0.5 })],
        excited: [snookiSprite({ ...o, pose: 'excited', t: 0 }), snookiSprite({ ...o, pose: 'excited', t: 0.5 })],
        confused: [snookiSprite({ ...o, pose: 'confused' })],
        sleep: [snookiSprite({ ...o, pose: 'sleep' })],
        jump: [snookiSprite({ ...o, pose: 'jump' })],
        growl: [snookiSprite({ ...o, pose: 'idle', mouth: 'closed' })],
        bark: [snookiSprite({ ...o, pose: 'bark', t: 0 }), snookiSprite({ ...o, pose: 'bark', t: 0.25 })],
        wag: [0, 0.25, 0.5, 0.75].map((t) => snookiSprite({ ...o, pose: 'wag', t })),
        innocent: [snookiSprite({ ...o, pose: 'innocent', t: 0 }), snookiSprite({ ...o, pose: 'innocent', t: 0.5 })],
        stubborn: [snookiSprite({ ...o, pose: 'stubborn' })],
        celebrate: [snookiSprite({ ...o, pose: 'celebrate', t: 0 }), snookiSprite({ ...o, pose: 'celebrate', t: 0.25 })],
      };
    }
    case 'husky': {
      const o = HUSKY_LOOK;
      return {
        idle: [snookiSprite({ ...o, pose: 'idle', t: 0 }), snookiSprite({ ...o, pose: 'idle', t: 0.25 })],
        blink: [snookiSprite({ ...o, pose: 'idle', blink: true })],
        walk: WALK.map((t) => snookiSprite({ ...o, pose: 'walk', t })),
        run: WALK.map((t) => snookiSprite({ ...o, pose: 'run', t })),
        sit: [snookiSprite({ ...o, pose: 'sit', t: 0 }), snookiSprite({ ...o, pose: 'sit', t: 0.25 })],
        sniff: [snookiSprite({ ...o, pose: 'sniff', t: 0 }), snookiSprite({ ...o, pose: 'sniff', t: 0.5 })],
        excited: [snookiSprite({ ...o, pose: 'excited', t: 0 }), snookiSprite({ ...o, pose: 'excited', t: 0.5 })],
        wag: [0, 0.25, 0.5, 0.75].map((t) => snookiSprite({ ...o, pose: 'wag', t })),
        bark: [snookiSprite({ ...o, pose: 'bark', t: 0 }), snookiSprite({ ...o, pose: 'bark', t: 0.25 })],
        celebrate: [snookiSprite({ ...o, pose: 'celebrate', t: 0 }), snookiSprite({ ...o, pose: 'celebrate', t: 0.25 })],
      };
    }
    case 'ryan':
      // profile when he walks or stands; `back` for scripted back-turned moments (actor `view: 'back'`)
      return {
        idle: [ryanSide({})],
        walk: WALK.map((t) => ryanSide({ pose: 'walk', t })),
        back: [ryanSprite({})],
      };
    case 'shadow':
      return {
        idle: [ryanSprite({ shadow: true })],
        walk: WALK.map((t) => ryanSprite({ pose: 'walk', t, shadow: true })),
      };
    case 'needle':
      return {
        idle: [needleSvg({ expr: 'cheerful' })],
        walk: [0, 0.25, 0.5, 0.75].map((t) => needleSvg({ expr: 'determined', pose: 'hop', t })),
        sneaky: [needleSvg({ expr: 'sneaky' })],
      };
    default:
      // Season 2's circle (characters/circle.js): a slow breath while standing, a walk
      if (CIRCLE_KINDS.includes(kind)) {
        return {
          idle: [personSprite(kind, { t: 0 }), personSprite(kind, { t: 0.25 })],
          walk: WALK.map((t) => personSprite(kind, { pose: 'walk', t })),
        };
      }
      throw new Error(`Unknown sprite kind ${kind}`);
  }
}

/**
 * Draw a decoded SVG image into a bitmap canvas once, so the lighting filters
 * (characters/lighting.js) are evaluated a single time, never per frame.
 */
export function bake(img) {
  const w = img.width || img.naturalWidth;
  const h = img.height || img.naturalHeight;
  if (!w || !h || typeof document === 'undefined') return img;
  try {
    const c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = c.getContext('2d');
    if (!ctx?.drawImage) return img;
    ctx.drawImage(img, 0, 0, w, h);
    return c;
  } catch {
    return img;
  }
}

/** Decode every frame of a table. onProgress(done, total) reports real progress. */
export async function rasterize(table, { onProgress, height = 256 } = {}) {
  const entries = Object.entries(table);
  const total = entries.reduce((n, [, list]) => n + list.length, 0);
  let done = 0;
  const out = {};
  await Promise.all(
    entries.map(async ([name, list]) => {
      out[name] = await Promise.all(
        list.map(async (svg) => {
          const img = await loadImage(svgUrl(withSize(svg, height)));
          done += 1;
          onProgress?.(done, total);
          return bake(img);
        }),
      );
    }),
  );
  return out;
}

export { svgUrl };
