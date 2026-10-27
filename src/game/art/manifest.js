/**
 * Character asset manifest (V3 art pipeline, see docs/ART_PIPELINE.md).
 *
 * Every character image in the game is generated from code (SVG + the shared
 * lighting model in characters/lighting.js) and rasterised on the device, so
 * there are no per-frame image downloads. `npm run art:export` writes the same
 * images as transparent SVG files (docs/art/...) and one sheet per character,
 * for review and for artists. Private owner images are listed separately and
 * are never exported or committed.
 *
 * Entry: { character, id, file, kind, pose|expression|view, scenes,
 *          resolution, public, integrated, tested, render() }
 */
import { anjiSprite, anjiPortrait, anjiFront, anjiBack, OUTFITS, ANJI_EXPRESSIONS } from '../characters/anji.js';
import { snookiSprite, snookiPortrait, SNOOKI_EXPRESSIONS } from '../characters/snooki.js';
import { ryanView, RYAN_VIEWS, ryanSprite, CAST, MUNTHER_EXPRESSIONS } from '../characters/cast.js';
import { RASTER_HEIGHT } from '../characters/sprites.js';

export const ANJI_POSES = ['idle', 'walk', 'run', 'jump', 'fall', 'celebrate', 'surprised', 'think', 'crouch'];
export const SNOOKI_POSES = ['idle', 'walk', 'run', 'sit', 'sniff', 'excited', 'confused', 'sleep', 'jump', 'bark', 'wag', 'innocent', 'stubborn', 'celebrate'];

const px = (h, ratio) => `${Math.round(h * ratio)}×${h} px`;
const entry = (o) => ({ public: true, tested: true, ...o });

export const CHARACTER_ASSETS = [
  ...ANJI_POSES.map((pose) =>
    entry({ character: 'anji', id: `anji/pose/${pose}`, file: `docs/art/anji/pose-${pose}.svg`, kind: 'pose', pose, scenes: ['exploration'], resolution: px(RASTER_HEIGHT.anji, 0.5), integrated: true, render: () => anjiSprite({ pose, t: 0.25 }) }),
  ),
  ...['front', 'back'].map((view) =>
    entry({ character: 'anji', id: `anji/view/${view}`, file: `docs/art/anji/view-${view}.svg`, kind: 'view', view, scenes: ['games room', 'character sheet'], resolution: px(RASTER_HEIGHT.anji, 0.5), integrated: view === 'front', render: () => (view === 'front' ? anjiFront({}) : anjiBack({})) }),
  ),
  ...Object.keys(OUTFITS).map((outfit) =>
    entry({ character: 'anji', id: `anji/outfit/${outfit}`, file: `docs/art/anji/outfit-${outfit}.svg`, kind: 'outfit', pose: outfit, scenes: ['wardrobe', 'exploration'], resolution: px(RASTER_HEIGHT.anji, 0.5), integrated: true, render: () => anjiSprite({ outfit }) }),
  ),
  ...ANJI_EXPRESSIONS.map((expression) =>
    entry({ character: 'anji', id: `anji/expression/${expression}`, file: `docs/art/anji/expression-${expression}.svg`, kind: 'portrait', expression, scenes: ['dialogue'], resolution: '200×200 (vector)', integrated: true, render: () => anjiPortrait({ expr: expression }) }),
  ),
  ...SNOOKI_POSES.map((pose) =>
    entry({ character: 'snooki', id: `snooki/pose/${pose}`, file: `docs/art/snooki/pose-${pose}.svg`, kind: 'pose', pose, scenes: ['exploration', 'games room'], resolution: px(RASTER_HEIGHT.snooki, 140 / 110), integrated: true, render: () => snookiSprite({ pose, t: 0.25 }) }),
  ),
  ...SNOOKI_EXPRESSIONS.map((expression) =>
    entry({ character: 'snooki', id: `snooki/expression/${expression}`, file: `docs/art/snooki/expression-${expression}.svg`, kind: 'portrait', expression, scenes: ['dialogue', 'minigames'], resolution: '200×200 (vector)', integrated: true, render: () => snookiPortrait({ expr: expression }) }),
  ),
  ...RYAN_VIEWS.map((view) =>
    entry({ character: 'ryan', id: `ryan/view/${view}`, file: `docs/art/ryan/view-${view}.svg`, kind: 'view', view, scenes: view === 'front-backlit' ? ['games room (laptop)'] : ['exploration', 'dialogue'], resolution: view === 'turn' ? '200×200 (vector)' : px(RASTER_HEIGHT.ryan, 0.5), integrated: view !== 'side', render: () => ryanView(view) }),
  ),
  entry({ character: 'ryan', id: 'ryan/shadow', file: 'docs/art/ryan/shadow.svg', kind: 'pose', pose: 'shadow', scenes: ['act I gate'], resolution: px(RASTER_HEIGHT.shadow, 0.5), integrated: true, render: () => ryanSprite({ shadow: true }) }),
  ...MUNTHER_EXPRESSIONS.map((expression) =>
    entry({ character: 'munther', id: `munther/expression/${expression}`, file: `docs/art/munther/expression-${expression}.svg`, kind: 'portrait', expression, scenes: ['dialogue'], resolution: '200×200 (vector)', integrated: true, render: () => CAST.munther.portrait({ expr: expression }) }),
  ),
];

/**
 * Owner-supplied images: local only (git-ignored), never exported, never in a
 * public build (the `@private-sources` alias in vite.config.js resolves to
 * art/private-none.js for public builds; scripts/audit-private.mjs checks dist).
 */
export const PRIVATE_ASSETS = [
  { character: 'anji', id: 'private/hero-anji-snooki', file: 'private-art/hero-anji-snooki.webp', kind: 'painting', scenes: ['title', 'credits'], resolution: 'crop of the collage', public: false, integrated: true, tested: false },
  { character: 'ryan', id: 'private/ryan-gate', file: 'private-art/ryan-gate.webp', kind: 'painting', scenes: ['memory frames', 'credits'], resolution: 'crop of the collage', public: false, integrated: true, tested: false },
  { character: 'anji', id: 'private/finale-drawing', file: 'private-art/finale-drawing.webp', kind: 'handmade drawing', scenes: ['finale', 'journal', 'credits', 'replay gallery'], resolution: '~440×750', public: false, integrated: true, tested: false },
];
