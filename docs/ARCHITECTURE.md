# Architecture

Vanilla JavaScript ES modules, bundled by Vite. No framework or game engine:
the exploration scenes are a small canvas engine, everything else is DOM.

```
index.html ─► src/game/main.js ─► app.js
                                   ├─ core/      services (no DOM knowledge)
                                   ├─ ui/        overlays: dialogue, menus, toasts, cinematics
                                   ├─ scenes/    top-level screens: title, explore
                                   ├─ world/     canvas exploration engine
                                   ├─ puzzles/   rules (pure) + views + host
                                   ├─ minigames/ registry + one module per game (lazy-loaded)
                                   ├─ narrative/ dialogue runner (pure)
                                   ├─ characters/SVG character generators + rasteriser
                                   ├─ memories/  memory schema, story memories, registry
                                   ├─ progression/achievements
                                   └─ data/      ALL story content: dialogue, scenes, puzzles,
                                                 items, chapters, map, cinematics
gift.html ─► src/main.js (the original 24-hour gift, unchanged)
```

## Core services (`src/game/core`)

| Module | Responsibility |
| --- | --- |
| `save.js` | Versioned localStorage saves with automatic backup, corruption recovery, migrations (`MIGRATIONS[n]` upgrades v*n* → v*n+1*), export/import files |
| `game.js` | The single source of truth for progress (flags, items, collectibles, records, cosmetics…). Every change saves and emits `change` |
| `conditions.js` / `effects.js` | The small data language content uses: `'flag:x'`, `'!item:y'`, `{ any: [...] }`, `'count:star>=10'` / `'flag:x'`, `'-item:y'`, `'got:z'`, `'unlock:c'` |
| `scope.js` | Lifetime scopes: every listener, timer and animation loop of a screen/overlay is released by one `dispose()` |
| `input.js` | Keyboard + touch buttons (pointer capture, release-all on blur: no stuck keys) |
| `audio.js` | Synthesised Web Audio (no files); optional samples; silent fallback |
| `settings.js` | Preferences stored separately from the save |
| `sw-client.js` | Service-worker registration, genuine install progress, update prompt |

## Content flow

```
data/scenes/*.js  ──interact / trigger──►  world.run(actions)
   actions: say · puzzle · game · memory · fx · move · camera · goto · chapter · cine …
        │                     │                │
        ▼                     ▼                ▼
 ui/dialogue-box     puzzles/host.js     minigames/host.js
 (narrative/          (puzzles/rules.js   (registry → lazy import
  dialogue.js)         pure rules)          → mount(area, ctx))
        └──────── effects & results ────────► core/game.js ──save──► localStorage
```

The world engine (`world/engine.js`) owns the canvas, camera, physics
(`world/physics.js`), actors (Anji, the Snooki companion AI, cast), parallax
painting with chunk caching (`world/painter.js`), interactables, triggers and
exits. Real-time play pauses under any menu, puzzle, minigame or cinematic
overlay and when the tab is hidden.

## Adding content

- **Dialogue**: a new entry in `data/dialogue/actN.js` (`{ s, e, t }` lines,
  `if/then/else`, `choice`, `do`), registered in `data/dialogue/index.js`.
- **A location**: a scene object in `data/scenes/*.js` (props, platforms, items,
  dynamic draws, interactables, triggers, exits), registered in
  `data/scenes/index.js`, plus a map node in `data/worlds.js`.
- **A puzzle**: a definition in `data/puzzles.js` using one of the rule types
  (sequence, choice, lock, cipher, switches, rings, deduction).
- **A minigame**: a module exporting `mount(area, ctx)` and an entry in
  `minigames/registry.js` (title, goal, controls, reward).
- `tests/game/content.test.js` then checks every reference, condition, effect,
  speaker, expression, and that every collectible is reachable.

## Saves

`snooki-game:save` (+ `:backup`, and `:broken` if a corrupt save was quarantined),
`snooki-game:settings`, `snooki-game:memories` (imported personal memories).
Schema version: `SAVE_VERSION` in `core/save.js`.

## Offline

`build/offline-plugin.js` emits `dist/sw.js` with the exact list of built files
and a content-hash cache name. The worker precaches everything on install
(reporting progress to the title screen), serves cache-first, deletes only older
caches of this game, and waits for the player to accept updates.
`scripts/verify-offline.mjs` fails the build if the list and `dist/` disagree.
Verified: production build, headless Edge, network disabled after install —
title, new game, garden and lazy minigame chunks all load (see QA checklist).

## Security & privacy

- CSP on built pages: `default-src 'self'`, `connect-src 'none'` (the page cannot
  send anything anywhere), no inline scripts.
- No analytics, accounts, cookies, third-party requests or CDNs.
- Private art and memories live in git-ignored folders or on the device.

## Publishing (not done)

This branch is not deployed. To publish the game, a separate, explicit decision
is needed: merge to `main` (the current workflow deploys `main`), or deploy a
preview elsewhere. Note that the current live site on `main` is the 24-hour
gift, and that a build containing `private-art/` or `private/memories.json`
publishes those files.
