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
                                   ├─ progression/achievements, missions
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

## V2 additions

| Module | Responsibility |
| --- | --- |
| `data/missions.js` + `progression/missions.js` | side-mission chains; state derived from flags; rewards applied once |
| `ui/tips.js` | contextual one-time tips (one at a time, wait for overlays, can be disabled/reset) |
| `ui/menus.js` → `openHelp` | permanent help screen (pause menu) |
| `ui/drawing.js` | the finale's folded-paper reveal of the private drawing |
| `puzzles/rules.js` | new types `candles`, `code`, `connect`, `program`; `solve()` (one solver used by tests and «شوفي الحل») |
| `puzzles/host.js` | goal line, example, hint ladder, solution, skip (`canSkip`) |
| `minigames/racing-logic.js` | pseudo-3D track model (segments, curves, hills), traffic, checkpoints, boost meter, difficulty, controller (countdown/pause/retry), test bot |
| `minigames/racing.js` | chase-camera renderer, original coupe, navigator, HUD |
| `world/props-v2.js` | study, passage, meadow, cat, robot, archive props |
| `data/scenes/side-house.js`, `side-meadow.js` | Ryan's study, the hidden passage, the meadow |

## V3 additions

```
data/scenes/side-gameroom.js ──► ui/hub.js (games table, cork board, trophies, laptop/daily)
        │                              │
        │                              ├─► minigames/{memory,highcard,rosetrick,checkers,cardtrick,duet,gift}.js  (lazy chunks)
        │                              │          └─► tabletop/*.js  pure, seeded rules + AI (no DOM)
        │                              └─► data/activities.js (ACTIVITIES, PRANKS) ─► puzzles / minigames
        └─► data/hub-lines.js  dialogue pools per game × moment ─► game.nextLine() rotation (saved)
```

| Module | Responsibility |
| --- | --- |
| `tabletop/deck.js` | 4 suits × 12 ranks, seeded `shuffle(list, seed)` |
| `tabletop/highcard.js`, `rosetrick.js`, `checkers.js`, `cardtrick.js`, `duet.js` | pure game rules; every function returns new state (undo = keep the old one). AIs receive only a player-visible view (`viewFor`) or the legal move list |
| `tabletop/ui.js` | shared card rendering, card backs, the speaker bar, ready panel (rules + difficulty), moment lines |
| `ui/hub.js` | games-room panels; `dailyChallenge(date)` is deterministic from the calendar date |
| `data/hub-lines.js` | `HUB_LINES` pools, `MOMENTS` (before/win/lose/draw/rematch/leave/record), `linesFor`, `pickLines` |
| `data/activities.js` | 7 activities and 10 pranks as runnable data (`intro` lines → puzzle / minigame → reward flag) |
| `data/puzzles-v3.js` | the activities' and pranks' puzzles (spread into `PUZZLES`) |
| `puzzles/rules.js` | new types `arrange` and `clock` (with solvers) |
| `world/props-v3.js` | games-room props; `world/engine.js` adds Snooki tap reactions and an idle sleep/wag/sit cycle |
| `characters/lighting.js` | shared 2.5D light rig (see `docs/ART_PIPELINE.md`) |
| `art/manifest.js` | character asset manifest; `scripts/export-art.mjs` exports it |
| `@private-sources` alias | `art/private-sources.js` in dev / `--mode private`, `art/private-none.js` in the public build and tests |
| `scripts/audit-private.mjs` | fails `npm run build` if any private image byte, private file name or personal-memory text is in `dist/` |

## Story Pack 01 additions (post-game)

See `docs/STORY_PACK_01.md` for the storyboards, save model and finale hook.

| Module | Responsibility |
| --- | --- |
| `data/missions-sp1.js` | the pack's missions (`kind: 'story'` chapters + optional side activities) and `PACKS` (one entry per content pack) |
| `data/scenes/sp1.js`, `data/dialogue/sp1.js`, `data/puzzles-sp1.js` | «طريق الذكريات» and «عيادة الورد», their lines and three puzzles |
| `art/sp1-scenes.js` | the embrace and code-montage shots (SVG drawn in code) |
| `core/names.js` | `cleanName`, `huskyName`, `fillNames` — the `{husky}` placeholder in dialogue, prompts, journal, missions, puzzles |
| `ui/name-picker.js` | the naming panel (scene action `{ askName: 'husky' }`); sets the string flag `husky-name` once |
| `ui/content-notice.js` | the one-time "new places" card (`dueNotice`) |

Small engine extensions: actor kind `husky`, `fx` actions may be `quiet`,
cinematic shots may be `silent` (no tap prompt) or `quick` (kept short with reduced
motion), the `program` puzzle accepts `look`/`messages`, and after the ending the HUD
objective shows the active story chapter. No save schema change (`SAVE_VERSION` 3).

## Story Pack 02 additions (main story)

See `docs/STORY_PACK_02.md`. `data/missions-sp2.js` (`SP2_GATE` guards Act VII),
`data/scenes/sp2.js` (the archive + `SP2_EXTRAS`, merged into existing scenes by
`data/scenes/index.js`), `data/dialogue/sp2.js`, `data/puzzles-sp2.js`;
`puzzles/rules.js` adds keys/doors to `program` and a new `series` type;
`puzzles/host.js` resumes multi-stage puzzles (`pstage:<id>`);
`progression/journal-index.js` builds the numbered, filterable mission list;
`ui/menus.js` renders it and `openMap(app, { focus })` + `mapPath()`.

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

**Sprite frames are baked once per look** (`world/sprite-cache.js`) and shared
by every scene and the chase minigame. Each kind holds one look, keyed by its
own SVG text; a wardrobe change bakes the new look and then releases the old.
Scenes never release sprite frames themselves.

This fixes a defect seen in WebKit. Re-baking every character on every scene
entry (drawing ~90 SVG images into canvases) grew Safari-engine graphics memory
by ~450 MB per scene change. That memory came back only through late garbage
collection, and the process holding it could die, leaving a white page.
`tests/browser/sprite-memory.browser.test.js` checks this. A scene's own canvases
are still released when it ends (`releaseCanvas`).

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

## Scrolling model

The document never scrolls: `.game` is a fixed full-screen shell with
`overflow: hidden` (the world canvas and HUD need a fixed viewport). Every
screen or panel that can be taller than the phone scrolls **inside its own
container**: `.title-screen`, `.panel` (whole panel, for pause/map/confirm),
`.panel-scroll` (the list inside settings/journal/help/games-room panels,
keyboard-focusable), `.panel.puzzle`, and `.tt` (table games). Rules that keep
this working: an overlay `.panel` needs `min-height: 0` + `overflow-y: auto`
(else its grid row grows to the content and `max-height: 100%` caps nothing);
a flex child that should scroll needs `min-height: 0`; a scroller must not use
`justify-content: flex-end`/`center` (overflow past the start edge cannot be
scrolled to). The world's key handler (`core/input.js`, which cancels arrows /
space) is enabled only while the exploration scene is playable — off on the
title, under menus/puzzles/minigames and after leaving the world.

## Saves

**Season 2 (since M1).** Season 2 keeps its own document, `snooki-game:s2` (`core/s2-store.js`). `game.js` routes every id with an `s2` segment there (`isS2`), so Season 2 never writes the main save. Details: `docs/season-2/SEASON_2_TECHNICAL_PLAN.md` §1–3.

The main save also gained these protections. The released builds' code cannot change, so the protections live in the new build:

| Case | What the new build does |
|---|---|
| Every save it writes | Marks it with `rev` (in the file, never in the state) and mirrors it to `:shadow` |
| An older build wrote last | Seen at the next load (`'overwritten'`). The player is asked; both copies are kept (`:alt`) |
| A save from a newer build | Read-only, never reset |
| Another tab of this build saved newer progress | This tab does not overwrite it, and says so |

Tests: `tests/game/s2-*.test.js`, with the released save code frozen in `tests/fixtures/deployed-client/`.

`snooki-game:save` (+ `:backup`, and `:broken` if a corrupt save was quarantined),
`snooki-game:settings`, `snooki-game:memories` (imported personal memories).
Schema version: `SAVE_VERSION` in `core/save.js` (V2 = 2; migration 1 → 2
renames the owl's journal entry). Tips seen / race difficulty live in settings.
V3 = 3: migration 2 → 3 adds `cosmetics.cardBack` and a `hub` section
(`lines` rotation counters, `gifts` — at most 24, validated against
`GIFT_PARTS` — and `daily`). Nothing existing is changed or dropped; export →
import keeps the games-room progress (tested).

## Offline

`build/offline-plugin.js` emits `dist/sw.js` with the exact list of built files
and a content-hash cache name. The worker precaches everything on install
(reporting progress to the title screen), serves cache-first, deletes only older
caches of this game, and waits for the player to accept updates.
`scripts/verify-offline.mjs` fails the build if the list and `dist/` disagree.
Verified (V2): production build, headless Edge, network disabled after
install — 48 files precached; title, new game, garden and the maze, racing,
kitchen, dress-up and quiz chunks all load with zero errors (see QA checklist).
Verified (V3): public build, 36 files precached (private art is no longer in
the default build, hence fewer files than V2); network off → title, new game,
garden, and the maze, racing, kitchen, dress-up, quiz, memory, high-card,
rose-trick, checkers, card-trick, duet, gift, pipes and garden chunks all load
with zero errors. The games room itself is in the main bundle.

## Security & privacy

- CSP on built pages: `default-src 'self'`, `connect-src 'none'` (the page cannot
  send anything anywhere), no inline scripts.
- No analytics, accounts, cookies, third-party requests or CDNs.
- Private art and memories live in git-ignored folders or on the device.
- V3: the default `npm run build` cannot include them (alias → `private-none.js`)
  and is audited; only `npm run build:private` includes them, for local use.

## Publishing (not done)

This branch is not deployed. To publish the game, a separate, explicit decision
is needed: merge to `main` (the current workflow deploys `main`), or deploy a
preview elsewhere. Note that the current live site on `main` is the 24-hour
gift, and that a `build:private` build contains `private-art/` and
`private/memories.json` — publishing it publishes those files.
