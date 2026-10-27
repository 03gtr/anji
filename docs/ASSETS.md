# Assets

## What the game draws itself (committed, original)

| Asset | Source | Notes |
| --- | --- | --- |
| Anji sprite (9 poses + 6-frame walk/run cycles, 6 outfits, 5 bows) | `src/game/characters/anji.js` | SVG generated, rasterised at 300 px for the canvas |
| Anji portraits (10 expressions) | same | shared head drawing → consistent face |
| Snooki sprite (10 poses, 6 hats, 4 collars) and portraits (9 expressions) | `characters/snooki.js` | |
| Ryan (back view, walk, shadow; portrait back/turn), Nurse Needle, العم منذر (owl), Sultan, the Gate, phone | `characters/cast.js` | |
| V2: programmer desk, laptop/terminal screens, coffee, lamp, chair, circuit posters, glowing symbols, secret shelf, passage torches, lever, stone door, waiting-room window, meadow tree, cats, Robo-Snooki, recipe board, archive cabinet | `world/props-v2.js` | procedural canvas |
| V2: race car (original low coupe, four round tail lights, quad exhausts, no badges), traffic, road scenery | `minigames/racing.js` | drawn per frame |
| Environments: 12 themes, ~40 props (gates, fountains, rose bushes, lanterns, car, telescope, machine…) | `world/props.js`, `world/painter.js` | procedural canvas, cached in chunks |
| Puzzle / item symbols (~45) | `ui/symbols.js` | inline SVG |
| Hidden-object scenes (Ryan's study, evidence table) | `minigames/hidden-scenes.js` | portrait SVG compositions |
| Sound effects and ambience | `core/audio.js` | synthesised (Web Audio), no files |
| Font | `@fontsource/baloo-bhaijaan-2` (bundled) | Arabic shaping, SIL OFL |
| App icon / manifest | `public/icon.svg`, `public/manifest.webmanifest` | |

Character sheet for checking consistency: `npm run dev` → `/dev/art.html?zoom=2`.

**V3:** characters now share one 2.5D lighting model, Anji has front/back views
and 3 new expressions, Snooki 5 new poses and 2 expressions, Ryan four views
(never his face), العم منذر five expressions; games-room props live in
`world/props-v3.js`. Every character image is listed in `src/game/art/manifest.js`
and exported for review with `npm run art:export` → `docs/art/`. Details,
lighting guide, palette, naming and licensing: **`docs/ART_PIPELINE.md`**.

## Owner artwork (local only, git-ignored)

`private-art/*.webp` — cropped from the owner's concept collage. Used by the
dev server and by `npm run build:private`; the normal `npm run build` never
includes them (V3) and uses the built-in illustrations.

| File | Used for |
| --- | --- |
| `hero-anji-snooki` | title screen hero, credits |
| `title-logo` | title logo |
| `story-1-awakening` | opening cinematic |
| `world-1-garden` | opening cinematic (gate), Act I card, memory frame |
| `world-2-road`, `world-3-house`, `world-4-academy`, `world-7-memories`, `world-8-ending` | chapter cards, memory frames, credits |
| `story-3-map`, `story-4-clues`, `story-5-ending`, `ryan-gate` | memory frames, credits |
| `story-2-snooki`, `ryan-note`, `play-*`, `world-5-kitchen`, `world-6-clinic` | available for future use |
| `reference-collage.png` | the full reference (not loaded by the game) |
| `finale-drawing` | **the owner's handmade drawing**: the finale reveal, the journal, the last credits frame. Crop the photo to the paper (~440×750, portrait). The fold effect assumes the centre strip spans ~33 % → 89 % of the width (`FOLDED` in `ui/drawing.js`). |

## Missing / recommended assets

The in-game characters are original vector art *based on* the reference; they
are not the painted style of the collage. For a closer match:

1. **Character sprite sheets** in the painted style: Anji and Snooki — idle,
   walk (6 frames), run, jump, celebrate, surprised, think — at ~300 px height,
   transparent PNG/WebP. The rasteriser can be pointed at image frames instead
   of SVG (`characters/sprites.js`).
2. **Dialogue portraits** in the painted style, one per expression.
3. **Ryan's face** (only if the owner wants him shown; the story never requires it).
4. **Music**: an original or licensed quiet main theme and an ending theme.
5. **Background paintings** per location (optional; the procedural scenes work).

No artwork has been generated from photographs, and no photo is used as a
sprite.
