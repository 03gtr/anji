# Character art pipeline (V3)

## What the art is — and is not

The characters are **2.5D**: flat vector drawings (SVG, generated from code)
given volume by a shared lighting model. They are **not 3D models** — there is
no mesh, no rig, no camera you can rotate, and no 3D engine in the game. Turning
views (Anji front/back, Ryan back/turn/side/backlit-front) are separate drawings
of the same design, not renders of one model.

Why 2.5D and not real 3D: a WebGL engine plus rigged models would add several
megabytes to an offline-first phone game and a second art style next to the
painted collage. The lighting approach costs nothing per frame (sprites are
rasterised once per scene) and adds 0 bytes of dependencies.

## How a character image is made

```
characters/anji.js · snooki.js · cast.js      (SVG drawing per pose / expression)
        │  body parts wrapped with lit(id, …, 'v3d' | 'fur' | 'gloss')
        ▼
characters/lighting.js                         (one shared light rig, SVG filters)
        ▼
characters/sprites.js  rasterise → bake()      (once per scene, OffscreenCanvas)
        ▼
world/engine.js draws the baked bitmaps        (no filter cost per frame)
```

Portraits (dialogue faces) stay as inline SVG.

## Lighting and material guide

One rig for every character, so they look like they share a room
(`LIGHT` in `characters/lighting.js`):

| Light | Direction | Colour | Story reason |
| --- | --- | --- | --- |
| Key | azimuth 225°, elevation 52° (upper left) | warm `#fff3e2` | lanterns, lamps |
| Specular | key + 8° | white | hair shine, fur sheen, shoes |
| Rim | azimuth 330°, elevation 18° (behind, right) | cool `#9fd7ff` | moonlight, blue roses |
| Ambient | 0.40 of the flat colour survives in full shadow | — | readability on dark scenes |
| Diffuse | 0.68 | — | |

Materials (filter per body part):

| Filter | Used for | Behaviour |
| --- | --- | --- |
| `v3d` | skin, cloth, hair, Ryan, العم منذر | medium blur height map, soft highlight |
| `fur` | Snooki's coat | wider falloff, low specular so white fur does not clip |
| `gloss` | eyes, nose, bows, collar, shoes | tight bright highlight |

Plus `ao` (ambient-occlusion gradients) under hair, chin and arms.

Rules learnt while tuning: keep specular low on white (Snooki) and on hair, or
it washes out; skin uses the lowest diffuse contrast; never light the eyes'
iris with `v3d` (they go muddy) — use `gloss` on the catch-light only.

## Character sheets and palette

| Character | Key colours | Notes |
| --- | --- | --- |
| Anji | hair `#9c4a26` (gradient `#7e351b` → `#b9632f`, auburn), eyes `#3d7a46` (green), skin `#f7d6c4`, burgundy bow by default | 13 expressions, 9 poses + walk/run cycles, front & back views, 8 outfits |
| Snooki | fur `#fbfbfd` / shade `#e4e2ee` / deep `#cfcbe0`, inner ear `#f3b9c3` | 14 poses (incl. bark, wag, innocent, stubborn, celebrate), 11 expressions, hats incl. jester |
| Ryan | dark silhouette, blue rim light | never shows his face: back, turn, side, backlit-front (laptop) only |
| العم منذر | the owl | 5 expressions (neutral, proud, confused, delighted, sleepy) |

Review sheets: `docs/art/sheets/{anji,snooki,ryan,munther}.svg`, or live with
`npm run dev` → `/dev/art.html?zoom=2`.

## Asset manifest

`src/game/art/manifest.js` lists every character image:

`{ character, id, file, kind, pose | expression | view, scenes, resolution, public, integrated, tested, render() }`

- `CHARACTER_ASSETS` — 67 generated images, all `public: true`.
- `PRIVATE_ASSETS` — owner-supplied images (`private-art/…`), `public: false`,
  never exported, never in a public build.

`tests/game/v3-content.test.js` checks that ids and files are unique, every
character and the new poses/views are listed, every public entry renders an SVG
with the lighting filter (except Ryan's flat shadow) and has its exported file
in `docs/art/`, and every private entry is `public: false` under `private-art/`
or `private/`.

## Naming convention and dimensions

```
docs/art/<character>/<kind>-<name>.svg     e.g. docs/art/snooki/pose-wag.svg
manifest id: <character>/<kind>/<name>     e.g. snooki/pose/wag
private:      private-art/<name>.webp      (git-ignored)
```

| Kind | Raster height in game | Export |
| --- | --- | --- |
| Anji / Ryan sprite | 300 px (width ≈ 0.5 × height) | SVG |
| Snooki sprite | 170 px (width ≈ 1.27 × height) | SVG |
| Portrait | 200 × 200 viewBox, drawn as vector | SVG |

## Export

```bash
npm run art:export     # writes docs/art/**.svg (67 images + 4 sheets, ~1.4 MB)
```

Re-run after changing a character; the files are review copies (the game does
not load them).

## Private assets

Owner artwork lives in `private-art/` and personal memories in `private/` (both
git-ignored). Code imports them only through the `@private-sources` alias
(`vite.config.js`):

| Command | `@private-sources` resolves to | Private images in `dist/`? |
| --- | --- | --- |
| `npm run build` (default) | `art/private-none.js` | no — and `audit:private` fails the build if any private byte, file name or memory text appears |
| `npm run build:private` | `art/private-sources.js` | yes — the audit reports them; **never publish this build** without explicit approval |
| `npm run dev` | `art/private-sources.js` | n/a (local only) |
| tests | `art/private-none.js` | n/a |

## Licensing

- All character art is original, generated from code in this repository; no
  photograph is traced or used as a sprite, and no brand logos are drawn.
- The concept collage and the handmade drawing belong to the owner. They are
  local-only and are not licensed for publication.
- Font: Baloo Bhaijaan 2 (SIL OFL), bundled.

## What would make it closer to the painted collage

Painted sprite sheets (idle, walk ×6, run, jump, celebrate, surprised, think at
~300 px, transparent WebP) can replace the SVG frames: `sprites.js` already
rasterises images, so only the frame source changes. No individual character
photographs or painted sheets have been supplied so far.
