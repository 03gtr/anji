/**
 * Character sprite frames are baked once per look and shared by every scene (world/sprite-cache.js).
 *
 * REGRESSION (a white screen in the workshop, seen on a real phone; reproduced in Safari's engine,
 * WebKit): every scene baked every character's frames again. In WebKit drawing an SVG frame into a
 * canvas leaves memory that only garbage collection returns, so graphics memory grew by ~450 MB per
 * scene change until the process holding it died and the page went white. The engine now asks the
 * cache, which bakes a look once.
 *
 * Lifetime: one look per kind; a new look (the wardrobe) replaces the old one and releases it once
 * the new frames are ready; a failed bake is not kept; the key is the frames' own SVG text.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { spriteFrames, clearSpriteFrames, spriteCacheKeys, lookKey } from '../../src/game/world/sprite-cache.js';
import { frameTable, RASTER_HEIGHT } from '../../src/game/characters/sprites.js';
import { COSMETICS } from '../../src/game/data/items.js';

/** A stand-in for the real rasteriser: counts bakes, returns canvas-like frames. */
function fakeRasterize() {
  const calls = [];
  const fn = async (table, { height, onProgress } = {}) => {
    calls.push({ height, poses: Object.keys(table) });
    const out = {};
    for (const [pose, list] of Object.entries(table)) {
      out[pose] = list.map(() => {
        onProgress?.();
        return { width: 10, height: 20, getContext: () => ({}) };
      });
    }
    return out;
  };
  fn.calls = calls;
  return fn;
}
const CLASSIC = { anjiOutfit: 'classic', anjiBow: 'burgundy', snookiHat: 'none', snookiCollar: 'navy' };
const allFrames = (set) => Object.values(set).flat();
const frameCount = (kind, cos) => Object.values(frameTable(kind, cos)).reduce((n, l) => n + l.length, 0);

beforeEach(() => clearSpriteFrames());

describe('sprite frames: baked once per look, shared by every scene', () => {
  it('the same look is baked once, however many scenes ask for it (REGRESSION: once per scene)', async () => {
    const rasterize = fakeRasterize();
    const first = await spriteFrames('anji', CLASSIC, { rasterize });
    for (let scene = 0; scene < 20; scene++) expect(await spriteFrames('anji', { ...CLASSIC }, { rasterize })).toBe(first);
    expect(rasterize.calls).toHaveLength(1);
    expect(rasterize.calls[0].height).toBe(RASTER_HEIGHT.anji);
  });

  it('each kind has its own entry at its own size; the cache never holds more than one look per kind', async () => {
    const rasterize = fakeRasterize();
    for (const k of ['anji', 'snooki', 'husky', 'ryan', 'shadow', 'needle']) await spriteFrames(k, CLASSIC, { rasterize });
    for (let i = 0; i < 5; i++) for (const k of ['anji', 'snooki', 'husky', 'ryan']) await spriteFrames(k, CLASSIC, { rasterize });
    expect(rasterize.calls.map((c) => c.height)).toEqual(['anji', 'snooki', 'husky', 'ryan', 'shadow', 'needle'].map((k) => RASTER_HEIGHT[k]));
    expect(Object.keys(spriteCacheKeys()).sort()).toEqual(['anji', 'husky', 'needle', 'ryan', 'shadow', 'snooki']);
  });

  it('a new look (wardrobe) is baked fresh — never stale — and the old frames are released once it is ready', async () => {
    const rasterize = fakeRasterize();
    const classic = await spriteFrames('anji', CLASSIC, { rasterize });
    const dressed = await spriteFrames('anji', { ...CLASSIC, anjiOutfit: 'cozy' }, { rasterize });
    await Promise.resolve();
    await Promise.resolve();
    expect(dressed).not.toBe(classic);
    expect(rasterize.calls).toHaveLength(2);
    expect(allFrames(classic).every((c) => c.width === 0 && c.height === 0)).toBe(true); // memory handed back
    expect(allFrames(dressed).every((c) => c.width > 0)).toBe(true);
    // back to the first look: baked again (one look per kind is kept), the second released in turn
    const again = await spriteFrames('anji', CLASSIC, { rasterize });
    await Promise.resolve();
    await Promise.resolve();
    expect(again).not.toBe(classic);
    expect(allFrames(dressed).every((c) => c.width === 0)).toBe(true);
  });

  it("a cosmetic another kind ignores does not re-bake it (Snooki's hat does not touch Anji, nor the husky's fixed look)", async () => {
    const rasterize = fakeRasterize();
    await spriteFrames('anji', CLASSIC, { rasterize });
    await spriteFrames('husky', CLASSIC, { rasterize });
    await spriteFrames('anji', { ...CLASSIC, snookiHat: 'jester' }, { rasterize });
    await spriteFrames('husky', { ...CLASSIC, snookiHat: 'jester', snookiCollar: 'rose' }, { rasterize });
    expect(rasterize.calls).toHaveLength(2);
  });

  it('the key is the frames themselves: any change of their SVG or size changes it', () => {
    const t = frameTable('snooki', CLASSIC);
    const k = lookKey(t, 170);
    expect(lookKey(frameTable('snooki', { ...CLASSIC }), 170)).toBe(k);
    expect(lookKey(frameTable('snooki', { ...CLASSIC, snookiCollar: 'rose' }), 170)).not.toBe(k);
    expect(lookKey(t, 171)).not.toBe(k);
    expect(lookKey({ ...t, idle: [t.idle[0]] }, 170)).not.toBe(k);
  });

  it('every look in the wardrobe has its own key (no stale art), and the same look always the same key', () => {
    const values = (slot) => [...new Set(Object.values(COSMETICS).filter((c) => c.slot === slot).map((c) => c.value))];
    const looks = (kind, slots) =>
      slots.reduce((acc, slot) => acc.flatMap((cos) => values(slot).map((v) => ({ ...cos, [slot]: v }))), [{ ...CLASSIC }]);
    for (const [kind, slots] of [['anji', ['anjiOutfit', 'anjiBow']], ['snooki', ['snookiHat', 'snookiCollar']]]) {
      const all = looks(kind, slots);
      expect(all.length).toBeGreaterThan(4);
      const keys = all.map((cos) => lookKey(frameTable(kind, cos), RASTER_HEIGHT[kind]));
      expect(new Set(keys).size).toBe(all.length); // every combination differs
      expect(all.map((cos) => lookKey(frameTable(kind, cos), RASTER_HEIGHT[kind]))).toEqual(keys); // and is stable
    }
    for (const kind of ['husky', 'ryan', 'shadow', 'needle']) {
      expect(new Set([0, 1, 2].map(() => lookKey(frameTable(kind, CLASSIC), RASTER_HEIGHT[kind]))).size).toBe(1);
    }
  });

  it('two scenes asking at once share one bake', async () => {
    const rasterize = fakeRasterize();
    const [a, b] = await Promise.all([spriteFrames('snooki', CLASSIC, { rasterize }), spriteFrames('snooki', CLASSIC, { rasterize })]);
    expect(a).toBe(b);
    expect(rasterize.calls).toHaveLength(1);
  });

  it('the loading bar still fills: progress is reported once per frame, baked or already cached', async () => {
    const rasterize = fakeRasterize();
    let n = 0;
    await spriteFrames('husky', CLASSIC, { rasterize, onProgress: () => n++ });
    expect(n).toBe(frameCount('husky', CLASSIC));
    n = 0;
    await spriteFrames('husky', CLASSIC, { rasterize, onProgress: () => n++ });
    expect(n).toBe(frameCount('husky', CLASSIC));
  });

  it('a failed bake is not kept: the next request tries again (the scene error card’s «جرّبي مرة ثانية»)', async () => {
    let fail = true;
    const ok = fakeRasterize();
    const rasterize = async (...a) => {
      if (fail) throw new Error('image failed to load');
      return ok(...a);
    };
    await expect(spriteFrames('ryan', CLASSIC, { rasterize })).rejects.toThrow('image failed');
    await Promise.resolve();
    expect(spriteCacheKeys().ryan).toBeUndefined();
    fail = false;
    const set = await spriteFrames('ryan', CLASSIC, { rasterize });
    expect(allFrames(set).length).toBe(frameCount('ryan', CLASSIC));
  });

  it('a failed new look keeps the previous one (not nothing), and releases nothing', async () => {
    const good = fakeRasterize();
    const classic = await spriteFrames('anji', CLASSIC, { rasterize: good });
    await expect(spriteFrames('anji', { ...CLASSIC, anjiBow: 'gold' }, { rasterize: async () => { throw new Error('x'); } })).rejects.toThrow();
    await Promise.resolve();
    expect(allFrames(classic).every((c) => c.width > 0)).toBe(true);
    expect(await spriteFrames('anji', CLASSIC, { rasterize: good })).toBe(classic);
    expect(good.calls).toHaveLength(1);
  });
});
