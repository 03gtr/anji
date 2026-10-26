# QA checklist

Legend: ✅ verified automatically · 👀 verified by playing in a browser
(mobile viewport 375×812 / 390×844) · ☐ to check by hand on a real phone.

## Automated (`npm test`, 334 tests)

- ✅ Saves: save/load, backup recovery, corrupted save quarantine, migrations,
  future-version refusal, quota error, export/import round trip, wrong file.
- ✅ State: no duplicate collectibles, inventory never negative, best scores/medals.
- ✅ Conditions & effects language; settings; lifecycle scopes release everything.
- ✅ Dialogue runner: branches, guards, choices, effects, cues.
- ✅ Every puzzle definition is solvable (generic solvers incl. search for
  lights-out and rings); hints progress one at a time.
- ✅ Content integrity: every dialogue/puzzle/minigame/cinematic/scene reference
  resolves; speakers & expressions exist; effects and conditions are valid;
  every collectible is registered and reachable with the real jump physics;
  map routes and objectives are valid.
- ✅ Minigames: mazes solvable with reachable petals; chase obstacles spaced and
  gold proven by a bot; races finish within gold time (bot) and finish even
  without steering; hidden-object hit areas ≥ 34 units; kitchen recipes
  solvable, chocolate/avocado rejected for the dog; pipe levels solvable and
  start unsolved; cards and quiz rules; lantern lake gold reachable; garden
  designer seed budget.
- ✅ Memories: schema validation, story memories solvable, personal memories
  first, invalid skipped, import/remove on device.
- ✅ Achievements: earned once, rewards valid.
- ✅ App flows: title → new game → cinematic → garden, saved & continued; world
  interaction runs dialogue + effects; puzzle overlay rewards once; minigame
  host records a gold result; unknown location falls back; pause → title.
- ✅ Offline precache list equals `dist/` (build step).
- ✅ Original gift: its 49 tests still pass.

## Played in the browser 👀

- 👀 Title (with private art), opening cinematic, Act I complete: Snooki meeting,
  fountain, moon puzzle (wrong + hint + solve), maze (solved via controls),
  conservatory, chase (completed), gate riddle, Ryan's shadow, chapter card.
- 👀 House: lamps, study hidden objects, kitchen feedback, wardrobe preview.
- 👀 Garage: reveal, circuit puzzle (3 levels), race rendering.
- 👀 Sanctuary (Sultan), memory corridor (frame lit with painting), final
  garden: ending conversation, credits, garden designer → planted pieces drawn.
- 👀 **Offline**: production build in headless Microsoft Edge, 47 files
  precached, network disabled → title, new game, garden and a lazily loaded
  minigame chunk all load with zero errors.

## By hand on a real phone ☐

- ☐ Install/offline: open once online, wait for «جاهزة للعب بدون إنترنت ✓»,
  enable airplane mode, reopen.
- ☐ Touch: hold ◀ ▶ and jump together; slide a thumb off a button (must stop).
- ☐ Tap-to-walk on an object; the interact button label changes near objects.
- ☐ Landscape: controls float in the corners, nothing hidden by the browser UI.
- ☐ Each minigame once: maze (swipe), chase (tap), race (drag + buttons),
  cards, hidden objects, kitchen, wardrobe, circuits, lanterns, garden designer.
- ☐ Settings: text speed «فورية», reduced motion, sound off/on, volume.
- ☐ Backup: export a save file, clear progress, import it back.
- ☐ Memories: import an example memories file (see docs/MEMORIES.md).
- ☐ Long session: play 15+ minutes, switch apps and come back (game pauses,
  resumes, audio stops in background).

## Known limitations

- The in-app browser pane used during development cannot register service
  workers; offline was verified with headless Edge instead.
- Characters are original vector art based on the reference, not the painted
  style (see docs/ASSETS.md for the missing painted sprite sheets).
- Music is a simple synthesised ambience; no composed soundtrack yet.
- English localisation: text fields accept `{ ar, en }` but only Arabic is written.
