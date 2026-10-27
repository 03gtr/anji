/**
 * Regression tests for the mobile visual defects fixed on the
 * cinematic-visuals branch: camera framing (characters too small, empty sky
 * on portrait phones), the in-world prompt (read as a debug marker), Ryan's
 * build, and the title's key art (cropping / stretching / private art).
 */
import { describe, it, expect } from 'vitest';
import { frameCamera, followTop, FRAME_H, MIN_VIEW_W, MIN_TOP } from '../../src/game/world/camera.js';
import { VIEW_H, GROUND } from '../../src/game/world/props.js';
import { KIND, PROMPT_ICON_FONT, PROMPT_FONT } from '../../src/game/world/engine.js';
import { ryanSprite, ryanPortrait, ryanView } from '../../src/game/characters/cast.js';
import { titleBackdrop, titleRoses, TITLE_LAYOUTS } from '../../src/game/art/title-scene.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { ANJI_PALETTE, anjiPortrait } from '../../src/game/characters/anji.js';
import { createGameApp } from '../../src/game/app.js';
import { memoryStorage } from '../helpers.js';

// the drawn figure fills about two thirds of a character's sprite box
const visibleShare = (kind, cssW, cssH) => {
  const f = frameCamera(cssW, cssH);
  return (KIND[kind].h * 0.67 * f.k) / cssH;
};
// play-area sizes measured on real devices / the browser test (canvas, CSS px)
const VIEWS = { phonePortrait: [390, 665], smallPhone: [320, 470], phoneLandscape: [844, 390], desktop: [1365, 606], tablet: [768, 860] };

describe('camera framing', () => {
  it('Anji fills at least a quarter of the play area on every screen (was ~20 % on portrait phones)', () => {
    for (const [name, [w, h]] of Object.entries(VIEWS)) expect(visibleShare('anji', w, h), name).toBeGreaterThanOrEqual(0.25);
  });

  it('the old fit-the-whole-scene framing really was too small on a portrait phone (guards the measurement)', () => {
    const [w, h] = VIEWS.phonePortrait;
    const oldK = Math.min(h / VIEW_H, w / 220);
    expect((KIND.anji.h * 0.67 * oldK) / h).toBeLessThan(0.21);
  });

  it('never shows less than MIN_VIEW_W units of width (room to see ahead) nor more height than the band', () => {
    for (const [name, [w, h]] of Object.entries(VIEWS)) {
      const f = frameCamera(w, h);
      expect(f.viewW, name).toBeGreaterThanOrEqual(MIN_VIEW_W - 1e-9);
      expect(f.viewH, name).toBeLessThanOrEqual(Math.max(FRAME_H, (h * MIN_VIEW_W) / w) + 1e-9);
      // the ground band is always at the bottom: frame bottom = scene bottom
      expect(f.baseTop + f.viewH, name).toBeCloseTo(VIEW_H, 6);
      expect(GROUND).toBeGreaterThan(f.baseTop);
    }
  });

  it('uniform scale: one factor for both axes (nothing is stretched or squashed)', () => {
    for (const [w, h] of Object.values(VIEWS)) {
      const f = frameCamera(w, h);
      expect(f.viewW * f.k).toBeCloseTo(w, 6);
      expect(f.viewH * f.k).toBeCloseTo(h, 6);
    }
  });

  it('rests on the ground, and rises with her so the highest collectible in any scene can be seen', () => {
    let highestItem = Infinity;
    let highestLedge = Infinity;
    for (const s of Object.values(SCENES)) {
      for (const it of s.items || []) highestItem = Math.min(highestItem, it.y ?? GROUND);
      for (const p of s.platforms || []) highestLedge = Math.min(highestLedge, p.y);
    }
    for (const [name, [w, h]] of Object.entries(VIEWS)) {
      const f = frameCamera(w, h);
      const head = (y) => y - KIND.anji.h * 0.62;
      expect(followTop(f.baseTop, f.viewH, head(GROUND)), name).toBe(f.baseTop);
      const top = followTop(f.baseTop, f.viewH, head(highestLedge));
      expect(top, name).toBeGreaterThanOrEqual(MIN_TOP);
      expect(top, `${name}: item at y=${highestItem} visible from the highest ledge`).toBeLessThan(highestItem - 6);
    }
  });
});

describe('in-world prompt', () => {
  it('draws icons with a colour-emoji font and labels with the game font (it read as a debug marker)', () => {
    expect(PROMPT_ICON_FONT).toMatch(/Emoji/);
    expect(PROMPT_FONT).toMatch(/Baloo Bhaijaan 2/);
  });
});

describe('Ryan', () => {
  it('is clearly taller than Anji, and his silhouette matches', () => {
    expect(KIND.ryan.h / KIND.anji.h).toBeGreaterThanOrEqual(1.12);
    expect(KIND.shadow.h).toBe(KIND.ryan.h);
  });

  it('keeps his face hidden in every view (story), while beard and glasses read in the half-turn', () => {
    for (const svg of [ryanSprite({}), ryanSprite({ pose: 'walk', t: 0.3 }), ryanPortrait({ expr: 'back' }), ryanView('front-backlit')]) {
      // no eyes or mouth anywhere: those would be the only round dark shapes on a face
      expect(svg).not.toMatch(/eye|mouth|pupil/i);
    }
    const turn = ryanPortrait({ expr: 'turn' });
    expect(turn).toContain('#121216'); // glasses frame
    expect(turn).toContain('#2a1e18'); // beard
  });
});

describe('title key art', () => {
  const urls = (svg) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
  const ids = (svg) => new Set([...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));

  it('both compositions resolve every gradient inside themselves, with ids unique between them', () => {
    const wide = titleBackdrop('wide');
    const tall = titleBackdrop('tall');
    for (const svg of [wide, tall, titleRoses()]) {
      const own = ids(svg);
      for (const u of urls(svg)) expect(own.has(u), u).toBe(true);
    }
    const shared = [...ids(wide)].filter((i) => ids(tall).has(i) && i.startsWith('ts'));
    expect(shared).toEqual([]);
  });

  it('never stretches: slice/meet only, and Ryan stands in the gate in both layouts', () => {
    for (const svg of [titleBackdrop('wide'), titleBackdrop('tall'), titleRoses()]) {
      expect(svg).not.toMatch(/preserveAspectRatio="none"/);
      expect(svg).toMatch(/preserveAspectRatio="xMid(YMid|YMax) (slice|meet)"/);
    }
    for (const L of Object.values(TITLE_LAYOUTS)) expect(L.gateX).toBeGreaterThan(L.W * 0.3);
  });

  it("Anji's cover portrait has no skin-coloured disc on her face (the hand-on-cheek read as a giant mole)", async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = createGameApp(root, { storage: memoryStorage(), reducedMotion: true });
    await app.toTitle();
    const svg = root.querySelector('.cast-anji svg');
    expect(svg).toBeTruthy();
    const skin = [ANJI_PALETTE.skin, ANJI_PALETTE.skinShade].map((c) => c.toLowerCase());
    // the face itself is a path with the skin gradient; a separate skin ellipse/circle is a blob
    const blobs = [...svg.querySelectorAll('ellipse, circle')].filter((e) => skin.includes((e.getAttribute('fill') || '').toLowerCase()));
    expect(blobs.map((e) => e.outerHTML)).toEqual([]);
    app.destroy();
    root.remove();
    // positive control: the same check does find the hand in the dialogue "thinking" portrait
    const thinking = new DOMParser().parseFromString(anjiPortrait({ expr: 'thinking' }), 'image/svg+xml');
    expect([...thinking.querySelectorAll('ellipse')].some((e) => skin.includes((e.getAttribute('fill') || '').toLowerCase()))).toBe(true);
  });

  it('contains no raster image or private-art reference (public build)', () => {
    for (const svg of [titleBackdrop('wide'), titleBackdrop('tall'), titleRoses()]) {
      expect(svg).not.toMatch(/<image|\.webp|\.png|\.jpe?g|private/i);
    }
  });
});
