/**
 * Character sprite frames, baked once per look and shared by every scene and minigame.
 *
 * Baking a frame (decode the SVG, drawImage it into a canvas) leaves memory behind in Safari's
 * engine (WebKit) that only garbage collection hands back, late and in bulk. The canvases
 * themselves are released at once (releaseCanvas); the hidden cost is in drawing the SVG. Every
 * scene used to bake every character again: measured in WebKit, graphics memory grew by ~450 MB
 * per scene change, up to ~5 GB, and twice the process holding it died, leaving a white page.
 * The same characters look the same in every scene, so the frames are now baked once and reused.
 *
 * Lifetime: one look per character kind. The key is the frames' own SVG text (plus the size), so
 * any change of look — the wardrobe — gives a new key: stale art cannot be shown. A new look
 * replaces the kind's old frames, which are released once the new ones are ready. At most one set
 * per kind is kept (the kinds are a fixed list), so the cache cannot grow without bound; a look
 * asked for and then superseded before it finished baking is released as soon as it is done.
 * A failed bake is not kept: the next request tries again (a scene's «جرّبي مرة ثانية»), and the
 * last good look stays.
 */
import { frameTable, rasterize as rasterizeTable, RASTER_HEIGHT } from '../characters/sprites.js';
import { releaseCanvas } from './painter.js';

/** kind → { key, frames: Promise<{ pose: [canvas…] }>, total }: the look handed out now (maybe still baking) */
const slots = new Map();
/** kind → { set, entry }: the last look that finished baking while current — the one scenes draw */
const settled = new Map();

const releaseSet = (set) => Object.values(set || {}).forEach((list) => list.forEach(releaseCanvas));

/**
 * Every generated SVG numbers its own ids (`v3d-s37`, `haira12`, `shr17`…: a counter, so several
 * can share a page). Those numbers say nothing about the look: before fingerprinting, every id is
 * renamed by order of appearance, with its references (`url(#…)`, `href="#…"`). The same look then
 * always gives the same key, and any real difference in the drawing still changes it.
 */
function withoutOwnIds(svg) {
  const names = new Map();
  for (const [, id] of svg.matchAll(/\bid="([^"]+)"/g)) if (!names.has(id)) names.set(id, `i${names.size}`);
  if (!names.size) return svg;
  return svg.replace(/(\bid="|url\(#|href="#)([^")]+)/g, (m, lead, id) => (names.has(id) ? lead + names.get(id) : m));
}

/** A short, stable fingerprint of a frame table (its SVG text, own id numbers aside) and the bake height. */
export function lookKey(table, height) {
  let h = 5381;
  const feed = (s) => {
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  };
  feed(String(height));
  for (const [pose, list] of Object.entries(table)) {
    feed(`|${pose}:${list.length}|`);
    for (const svg of list) feed(withoutOwnIds(svg));
  }
  return `${height}:${(h >>> 0).toString(36)}`;
}

/**
 * Frames for a character kind in the current look. Resolves to the shared set (do not release
 * it: it belongs to the cache). `onProgress()` is called once per frame, also when the frames
 * were already baked, so a scene's loading bar still fills.
 */
export function spriteFrames(kind, cosmetics, { onProgress, rasterize = rasterizeTable } = {}) {
  const table = frameTable(kind, cosmetics);
  const height = RASTER_HEIGHT[kind];
  const key = lookKey(table, height);
  const total = Object.values(table).reduce((n, list) => n + list.length, 0);
  const slot = slots.get(kind);
  if (slot?.key === key) {
    return slot.frames.then((set) => {
      for (let i = 0; i < total; i++) onProgress?.();
      return set;
    });
  }
  const next = { key, total };
  // What callers get: this look once baked — or, if a newer look was asked for meanwhile (two
  // wardrobe changes in a row), the newest one: a superseded look is never handed out.
  next.frames = rasterize(table, { height, onProgress: onProgress && (() => onProgress()) }).then(
    (set) => {
      if (slots.get(kind) !== next) {
        releaseSet(set); // superseded while baking: nobody draws it
        return slots.get(kind)?.frames ?? Promise.reject(new Error(`no current look for ${kind}`));
      }
      // the look scenes were drawing is no longer handed out: give its memory back now that this one is ready
      const old = settled.get(kind);
      settled.set(kind, { set, entry: next });
      if (old && old.set !== set) releaseSet(old.set);
      return set;
    },
    (err) => {
      if (slots.get(kind) === next) {
        const good = settled.get(kind); // keep the last look that baked (still alive) rather than nothing
        if (good) slots.set(kind, good.entry);
        else slots.delete(kind);
      }
      throw err;
    },
  );
  slots.set(kind, next);
  return next.frames;
}

/** Release every cached frame (tests; nothing in the game needs to). */
export function clearSpriteFrames() {
  for (const { set } of settled.values()) releaseSet(set);
  slots.clear();
  settled.clear();
}

/** What the cache holds: kind → look key (tests and diagnostics). */
export const spriteCacheKeys = () => Object.fromEntries([...slots].map(([kind, s]) => [kind, s.key]));
