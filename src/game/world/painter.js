/**
 * Parallax background renderer with chunk caching.
 *
 * Each layer has a parallax factor f. Its content lives in "layer space"
 * (u = world x × f) and is generated deterministically from a seed, in chunks
 * of CHUNK units rendered once into offscreen canvases at device resolution.
 * Only the chunks on screen are drawn per frame; the cache is bounded (LRU)
 * and cleared on resize or when the scene ends.
 */
import { VIEW_H, GROUND } from './props.js';
import * as P from './props.js';
import { rng, hashString } from '../core/rng.js';

const CHUNK = 320;
const MAX_CHUNKS = 28;

/** Deterministic grid placement: fn(i, x, rand) for each cell overlapping [u0-m, u1+m]. */
export function each(u0, u1, step, margin, seed, fn) {
  const i0 = Math.floor((u0 - margin) / step);
  const i1 = Math.ceil((u1 + margin) / step);
  for (let i = i0; i <= i1; i++) {
    const rand = rng(seed ^ Math.imul(i + 7919, 2654435761));
    fn(i, i * step + rand() * step * 0.6, rand);
  }
}

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(Math.max(1, w), Math.max(1, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
}

/* ── Themes ─────────────────────────────────────────────────── */

const nightSky = (top, mid, bottom) => ({ top, mid, bottom });

function grassGround(ctx, u0, u1, seed, { grass = '#2c5a48', light = '#3a6e57', path = '#c9b79c', pathEdge = '#a8957a', soil = '#1d2b2c' } = {}) {
  ctx.fillStyle = soil;
  ctx.fillRect(u0 - 2, GROUND, u1 - u0 + 4, VIEW_H - GROUND);
  ctx.fillStyle = grass;
  ctx.fillRect(u0 - 2, GROUND, u1 - u0 + 4, 14);
  each(u0, u1, 10, 6, seed, (i, x, r) => P.leafBlob(ctx, x, GROUND + 2, 6, 4 + r() * 2, r() < 0.5 ? grass : light));
  // cobblestone path
  ctx.fillStyle = pathEdge;
  ctx.fillRect(u0 - 2, GROUND + 16, u1 - u0 + 4, 22);
  each(u0, u1, 16, 10, seed + 3, (i, x, r) => {
    ctx.fillStyle = r() < 0.5 ? path : '#d8c8ae';
    ctx.beginPath();
    ctx.ellipse(x, GROUND + 27 + (r() - 0.5) * 6, 7 + r() * 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = grass;
  ctx.fillRect(u0 - 2, GROUND + 38, u1 - u0 + 4, 6);
  each(u0, u1, 34, 20, seed + 5, (i, x, r) => {
    if (r() < 0.5) P.rose(ctx, x, GROUND + 46 + r() * 6, 2.4 + r() * 1.5, r() < 0.7 ? 'blue' : 'pink');
  });
}

function floorBoards(ctx, u0, u1, seed, { wood = '#5a3a32', light = '#6b463c', rug = null } = {}) {
  ctx.fillStyle = wood;
  ctx.fillRect(u0 - 2, GROUND, u1 - u0 + 4, VIEW_H - GROUND);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 1;
  for (let y = GROUND + 10; y < VIEW_H; y += 10) {
    ctx.beginPath();
    ctx.moveTo(u0 - 2, y);
    ctx.lineTo(u1 + 2, y);
    ctx.stroke();
  }
  each(u0, u1, 60, 0, seed, (i, x) => {
    ctx.fillStyle = light;
    ctx.fillRect(x, GROUND + 2 + (Math.abs(i) % 4) * 10, 1.5, 8);
  });
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(u0 - 2, GROUND, u1 - u0 + 4, 4);
  if (rug) {
    ctx.fillStyle = rug;
    ctx.fillRect(u0 - 2, GROUND + 18, u1 - u0 + 4, 16);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let x = Math.floor(u0 / 24) * 24; x < u1; x += 24) ctx.fillRect(x, GROUND + 24, 12, 3);
  }
}

function wallpaper(ctx, u0, u1, seed, { wall = '#25285a', pattern = '#2e3270', trim = '#3b2a3c', wainscot = '#2a2040' } = {}) {
  ctx.fillStyle = wall;
  ctx.fillRect(u0 - 2, 0, u1 - u0 + 4, GROUND);
  ctx.fillStyle = pattern;
  for (let x = Math.floor(u0 / 36) * 36; x < u1 + 36; x += 36) {
    for (let y = 18; y < GROUND - 70; y += 40) {
      const ox = (y / 40) % 2 ? 18 : 0;
      ctx.beginPath();
      ctx.moveTo(x + ox, y - 8);
      ctx.lineTo(x + ox + 6, y);
      ctx.lineTo(x + ox, y + 8);
      ctx.lineTo(x + ox - 6, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = wainscot;
  ctx.fillRect(u0 - 2, GROUND - 64, u1 - u0 + 4, 64);
  ctx.fillStyle = trim;
  ctx.fillRect(u0 - 2, GROUND - 68, u1 - u0 + 4, 6);
  ctx.fillRect(u0 - 2, 0, u1 - u0 + 4, 10);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  for (let x = Math.floor(u0 / 70) * 70; x < u1 + 70; x += 70) ctx.strokeRect(x + 8, GROUND - 56, 54, 44);
}

function concreteFloor(ctx, u0, u1, { floor = '#3a3d52', line = '#2e3044', stripe = null } = {}) {
  ctx.fillStyle = floor;
  ctx.fillRect(u0 - 2, GROUND, u1 - u0 + 4, VIEW_H - GROUND);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (let x = Math.floor(u0 / 80) * 80; x < u1 + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x - 20, VIEW_H);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(u0 - 2, GROUND, u1 - u0 + 4, 4);
  if (stripe) {
    ctx.fillStyle = stripe;
    for (let x = Math.floor(u0 / 40) * 40; x < u1 + 40; x += 40) ctx.fillRect(x, GROUND + 22, 22, 4);
  }
}

/** Interior rooms share one recipe: wall + optional pattern + floor. */
function interior({ wall, pattern, trim, wainscot, floor = 'wood', floorColors = {}, rug = null, extra }) {
  return {
    sky: null,
    ceiling: wall,
    layers: [
      {
        name: 'near',
        f: 1,
        draw(ctx, u0, u1, seed) {
          wallpaper(ctx, u0, u1, seed, { wall, pattern: pattern ?? wall, trim, wainscot });
          extra?.(ctx, u0, u1, seed);
          if (floor === 'wood') floorBoards(ctx, u0, u1, seed, { rug, ...floorColors });
          else concreteFloor(ctx, u0, u1, floorColors);
        },
      },
    ],
  };
}

export const THEMES = {
  'garden-night': {
    sky: nightSky('#0d1038', '#262a6e', '#6a4f98'),
    stars: 80,
    moon: [0.8, 0.14, 15],
    layers: [
      {
        name: 'far',
        f: 0.25,
        draw(ctx, u0, u1, seed) {
          ctx.fillStyle = '#1a2050';
          ctx.beginPath();
          ctx.moveTo(u0 - 2, 200);
          for (let u = u0 - 2; u <= u1 + 2; u += 8) ctx.lineTo(u, 170 + Math.sin(u * 0.012) * 18 + Math.sin(u * 0.031) * 8);
          ctx.lineTo(u1 + 2, VIEW_H);
          ctx.lineTo(u0 - 2, VIEW_H);
          ctx.closePath();
          ctx.fill();
          each(u0, u1, 70, 60, seed, (i, x, r) => P.tree(ctx, x, 196, 60 + r() * 50, r, { color: '#182251', trunk: '#141a40', round: r() < 0.5 }));
        },
      },
      {
        name: 'mid',
        f: 0.55,
        draw(ctx, u0, u1, seed) {
          each(u0, u1, 210, 120, seed, (i, x, r) => {
            const h = 70 + r() * 40;
            P.hedgeWall(ctx, x - 70, x + 70, GROUND - 30 - h, GROUND - 20, r, { color: '#1f3f40', light: '#284d4b', roses: 0.09 });
            if (r() < 0.6) P.lanternPost(ctx, x + 96, GROUND - 22, { height: 110 + r() * 20 });
          });
        },
      },
      {
        name: 'near',
        f: 1,
        draw(ctx, u0, u1, seed) {
          each(u0, u1, 150, 80, seed, (i, x, r) => {
            if (r() < 0.55) P.roseBush(ctx, x, GROUND + 2, 60 + r() * 40, 34 + r() * 20, r, { tone: 'blue' });
          });
          grassGround(ctx, u0, u1, seed);
        },
      },
      {
        name: 'front',
        f: 1.2,
        draw(ctx, u0, u1, seed) {
          each(u0, u1, 380, 120, seed, (i, x, r) => {
            if (r() < 0.6) P.roseBush(ctx, x, VIEW_H + 18, 90 + r() * 60, 52, r, { tone: r() < 0.7 ? 'blue' : 'pink', leaf: '#16302c', leafLight: '#1e3c36', roses: 8 });
          });
        },
      },
    ],
  },

  conservatory: {
    sky: nightSky('#101546', '#2b3a7c', '#5a74a8'),
    stars: 40,
    moon: [0.2, 0.18, 12],
    layers: [
      {
        name: 'far',
        f: 0.3,
        draw(ctx, u0, u1, seed) {
          P.glassPanes(ctx, Math.floor(u0 / 60) * 60 - 60, u1 + 60, 10, GROUND);
          each(u0, u1, 120, 60, seed, (i, x, r) => P.tree(ctx, x, GROUND - 10, 80 + r() * 50, r, { color: 'rgba(40,80,90,.55)', trunk: 'rgba(30,40,60,.6)' }));
        },
      },
      {
        name: 'mid',
        f: 0.6,
        draw(ctx, u0, u1, seed) {
          each(u0, u1, 160, 100, seed, (i, x, r) => {
            ctx.fillStyle = '#3a3f66';
            ctx.fillRect(x - 60, GROUND - 60, 120, 8);
            for (let k = -2; k <= 2; k++) P.pot(ctx, x + k * 24, GROUND - 60, r, { tone: r() < 0.6 ? 'blue' : 'pink' });
            ctx.fillStyle = '#2d3156';
            ctx.fillRect(x - 56, GROUND - 52, 6, 52);
            ctx.fillRect(x + 50, GROUND - 52, 6, 52);
          });
        },
      },
      {
        name: 'near',
        f: 1,
        draw(ctx, u0, u1, seed) {
          ctx.fillStyle = '#2b2f52';
          ctx.fillRect(u0 - 2, GROUND, u1 - u0 + 4, VIEW_H - GROUND);
          ctx.fillStyle = '#353a64';
          for (let x = Math.floor(u0 / 28) * 28; x < u1 + 28; x += 28) {
            for (let y = GROUND; y < VIEW_H; y += 14) ctx.fillRect(x + ((y / 14) % 2) * 14, y + 1, 26, 12);
          }
          each(u0, u1, 230, 80, seed, (i, x, r) => {
            if (r() < 0.6) P.pot(ctx, x, GROUND + 2, r, { tone: 'blue' });
          });
        },
      },
      {
        name: 'front',
        f: 1.2,
        draw(ctx, u0, u1, seed) {
          each(u0, u1, 420, 140, seed, (i, x, r) => {
            if (r() < 0.5) P.roseBush(ctx, x, VIEW_H + 18, 110, 50, r, { tone: 'blue', leaf: '#15302c', leafLight: '#1c3a35', roses: 7 });
          });
        },
      },
    ],
  },

  garage: interior({
    wall: '#1d2140',
    pattern: '#1d2140',
    trim: '#2a2f5a',
    wainscot: '#181b36',
    floor: 'concrete',
    floorColors: { floor: '#34374c', line: '#2a2c40', stripe: '#d8a73a' },
    extra(ctx, u0, u1) {
      // neon strips + brick hints
      ctx.fillStyle = 'rgba(111,211,255,.85)';
      for (let x = Math.floor(u0 / 260) * 260 + 40; x < u1; x += 260) ctx.fillRect(x, 26, 150, 4);
      ctx.fillStyle = 'rgba(111,211,255,.12)';
      for (let x = Math.floor(u0 / 260) * 260 + 40; x < u1; x += 260) ctx.fillRect(x - 10, 30, 170, 40);
      ctx.strokeStyle = 'rgba(255,255,255,.05)';
      for (let y = 90; y < GROUND - 70; y += 18) {
        for (let x = Math.floor(u0 / 40) * 40 + ((y / 18) % 2) * 20; x < u1 + 40; x += 40) ctx.strokeRect(x, y, 40, 18);
      }
    },
  }),

  house: {
    sky: null,
    ceiling: '#25285a',
    layers: [
      {
        name: 'near',
        f: 1,
        draw(ctx, u0, u1, seed) {
          wallpaper(ctx, u0, u1, seed);
          floorBoards(ctx, u0, u1, seed, { rug: '#5b1f34' });
        },
      },
    ],
  },
};

/* ── Painter ────────────────────────────────────────────────── */

export function createPainter({ theme: themeId, staticProps = [], seed = 1, propDrawers = {} }) {
  const theme = THEMES[themeId];
  if (!theme) throw new Error(`Unknown theme ${themeId}`);
  const cache = new Map(); // key → canvas (Map keeps insertion order → LRU)
  let scale = 0;
  let sky = null;
  let skyKey = '';

  function chunk(layer, li, index) {
    const key = `${li}:${index}`;
    const hit = cache.get(key);
    if (hit) {
      cache.delete(key);
      cache.set(key, hit);
      return hit;
    }
    const canvas = makeCanvas(Math.ceil(CHUNK * scale), Math.ceil(VIEW_H * scale));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, -index * CHUNK * scale, 0);
    const u0 = index * CHUNK;
    const u1 = u0 + CHUNK;
    const layerSeed = seed ^ hashString(`${themeId}:${layer.name}`);
    layer.draw(ctx, u0, u1, layerSeed);
    if (layer.f === 1) {
      // static props belong to the world layer (f = 1): bake those overlapping this chunk
      for (const prop of staticProps) {
        const reach = prop.reach ?? 160;
        if (prop.x + reach < u0 || prop.x - reach > u1) continue;
        const fn = propDrawers[prop.type];
        if (fn) fn(ctx, prop, rng(seed ^ hashString(`${prop.type}:${prop.x}`)));
      }
    }
    cache.set(key, canvas);
    while (cache.size > MAX_CHUNKS) cache.delete(cache.keys().next().value);
    return canvas;
  }

  /** Sky from topY (≤ 0 on tall portrait screens) down to the ground. */
  function drawSky(ctx, viewW, topY = 0) {
    if (!theme.sky) {
      if (topY < 0) {
        // tall portrait screens: the room's wall simply continues upward
        ctx.fillStyle = theme.ceiling || '#141432';
        ctx.fillRect(0, topY, viewW, -topY + 1);
        const shade = ctx.createLinearGradient(0, topY, 0, 0);
        shade.addColorStop(0, 'rgba(5,6,26,.75)');
        shade.addColorStop(1, 'rgba(5,6,26,0)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, topY, viewW, -topY + 1);
      }
      return;
    }
    const skyH = VIEW_H - topY;
    const key = `${Math.round(viewW)}:${Math.round(topY)}:${scale}`;
    if (key !== skyKey) {
      skyKey = key;
      sky = makeCanvas(Math.ceil(viewW * scale), Math.ceil(skyH * scale));
      const c = sky.getContext('2d');
      c.setTransform(scale, 0, 0, scale, 0, -topY * scale);
      const g = c.createLinearGradient(0, topY, 0, GROUND);
      g.addColorStop(0, theme.sky.top);
      g.addColorStop(0.6, theme.sky.mid);
      g.addColorStop(1, theme.sky.bottom);
      c.fillStyle = g;
      c.fillRect(0, topY, viewW, skyH);
      const r = rng(seed + 11);
      const starCount = Math.round((theme.stars || 0) * (skyH / VIEW_H));
      for (let i = 0; i < starCount; i++) {
        c.fillStyle = `rgba(255,246,208,${0.35 + r() * 0.6})`;
        c.beginPath();
        c.arc(r() * viewW, topY + r() * (GROUND * 0.7 - topY), r() < 0.15 ? 1.4 : 0.8, 0, Math.PI * 2);
        c.fill();
      }
      if (theme.moon) {
        const [mx, my, mr] = theme.moon;
        const x = mx * viewW;
        const y = Math.max(topY + 40, my * VIEW_H);
        const glow = c.createRadialGradient(x, y, mr * 0.5, x, y, mr * 4);
        glow.addColorStop(0, 'rgba(255,244,214,.45)');
        glow.addColorStop(1, 'rgba(255,244,214,0)');
        c.fillStyle = glow;
        c.beginPath();
        c.arc(x, y, mr * 4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#fff4d6';
        c.beginPath();
        c.arc(x, y, mr, -Math.PI / 2, Math.PI / 2, true);
        c.arc(x + mr * 0.45, y, mr * 0.95, Math.PI / 2, -Math.PI / 2, false);
        c.fill();
      }
    }
    ctx.drawImage(sky, 0, topY, viewW, skyH);
  }

  function drawLayer(ctx, layer, li, camX, viewW) {
    const offset = camX * layer.f;
    const first = Math.floor(offset / CHUNK);
    const last = Math.floor((offset + viewW) / CHUNK);
    for (let i = first; i <= last; i++) {
      ctx.drawImage(chunk(layer, li, i), i * CHUNK - offset, 0, CHUNK, VIEW_H);
    }
  }

  return {
    theme,
    /** Background: sky + every layer with f ≤ 1. */
    drawBack(ctx, camX, viewW, pixelScale, topY = 0) {
      if (pixelScale !== scale) {
        scale = pixelScale;
        cache.clear();
        skyKey = '';
      }
      drawSky(ctx, viewW, topY);
      theme.layers.forEach((layer, li) => {
        if (layer.f <= 1) drawLayer(ctx, layer, li, camX, viewW);
      });
    },
    /** Foreground (f > 1), drawn over the characters. */
    drawFront(ctx, camX, viewW) {
      theme.layers.forEach((layer, li) => {
        if (layer.f > 1) drawLayer(ctx, layer, li, camX, viewW);
      });
    },
    get cachedChunks() {
      return cache.size;
    },
    dispose() {
      cache.clear();
      sky = null;
    },
  };
}
