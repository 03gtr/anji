# QA checklist

Legend: ✅ verified automatically · 👀 verified by playing in a browser
(mobile viewport 375×812 / 390×844) · ☐ to check by hand on a real phone.

## Automated (`npm test`, 559 tests, 18 files — all passing at the V3 commit)

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
- ✅ V2 puzzles: candles (stages, undo, solver from any state), code (line of
  the error, 14:30), connect (draw/erase, exact shape), program (walls, limits,
  BFS solutions); the skip rule; every puzzle has a goal and ≥ 3 hints.
- ✅ V2 racing: bot gold on every track × difficulty, no-steer finish,
  checkpoints, steering scaled by speed, verge slowdown, traffic hit (and no
  double hit), swept collision at boost speed, blue lights → boost, difficulty
  differences, controller countdown/pause/resume/retry/finish, rival beatable.
- ✅ V2 content: ≥ 10 missions; every flag/item/record/count a mission waits
  for can happen (no soft-locks); rewards once; chain connected; owl renamed
  everywhere; 2:30 clue + garage code; kitchen wording; green eyes; finale tone
  guard (no family-opposition words, "nothing is owed"); the drawing is never
  described in code; three endings selected correctly; save migration v1 → v2;
  settings; tips (once, wait for overlays, off/reset); home-meal recipe,
  stylist briefs, exam answers, robot circuit.
- ✅ V2 app flows (DOM): the full study chain via the world (laptop code →
  lamp → symbols → drawer → mission reward → passage); hint → solution →
  skip; missions journal; help screen; drawing unfold + journal; race host
  (ready card, countdown, pause freezes, finish records the result).
- ✅ V3 tabletop engines (24): seeded reproducible deck; High Card ties carry
  the pot; trick game follow-suit, trumps, trick winner leads, 3–3 draw, AI
  never plays an illegal card and never sees Anji's hand, deterministic per
  seed, hard > normal > easy over 400 hands; checkers opening, forced capture,
  multi-jump, crowning, king moves, no-move loss, 40-move draw, illegal moves
  rejected (undo-safe), AI legal at every level, AI-vs-AI ends; card-trick
  rounds solvable and distinct.
- ✅ V3 content: save v2 → v3 migration (nothing lost), games-room data
  validation, export/import; dialogue rotation; every game × every moment;
  Ryan never claims to be live/watching and never pressures; ≥ 7 activities and
  10 pranks, all runnable and rewarded; rewards valid; card backs unlockable;
  decorations unlockable; comedy never targets Anji; duet has no game over;
  waiting clock accepts ±15 min; arrange puzzles; no personal memories in the
  repo; drafts never shown; picnic labels only from owner memories; asset
  manifest complete, lit and exported; private assets marked private;
  `@private-sources` is empty in tests.
- ✅ V3 app flows (DOM, 9): first visit (Ryan's playing version invites her);
  High Card to a recorded result; a full rose-trick hand by tapping legal cards;
  checkers move → Ryan answers → undo; card trick three rounds; memory match to
  a result; garden duet + gift workshop; an activity from the board through the
  world (chocolate box); tapping Snooki reacts without blocking play.
- ✅ Public build: 36 files precached; `audit:private` clean (37 files in
  `dist/` checked against 22 private images, private file names and memory text).

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

- 👀 V2 (in-app browser, 375×812 and 812×375): race moon/night/bridge
  (portrait + landscape), study (lamp on/off, glowing symbols), desk search,
  code / constellation / robot / candle puzzles, house clock at 2:30, meadow,
  the drawing reveal (folded → unfolded).
- 👀 **Offline (V2)**: production build, headless Edge, 48 files precached,
  network off → title, new game, garden; maze, racing, kitchen, dress-up and
  quiz chunks load; zero errors.

- 👀 V3 (headless Microsoft Edge screenshots against the dev server; the
  in-app browser pane was too small to use): 390×844 portrait — games room,
  games table, rose trick, checkers, High Card, card trick, memory (ready
  panel), prank board, chocolate box, waiting clock, gift workshop; 844×390
  landscape — games room, checkers; 320×640 — rose trick, memory ready panel.
  No horizontal scroll and no console errors in any of them. Found and fixed:
  in low landscape the world canvas filled only a ~200 px strip (a grid
  auto-placement bug that predates V3), checkers was clipped at the top, and
  the six-card hand wrapped at 320 px.
- 👀 **Offline (V3)**: public build, headless Edge, 36 files precached, network
  off → title, new game, garden; maze, racing, kitchen, dress-up, quiz, memory,
  high-card, rose-trick, checkers, card-trick, duet, gift, pipes and garden
  chunks load; zero errors.

## By hand on a real phone ☐

- ☐ V3: play one full game of each table game on a phone, including a rematch
  and leaving mid-game; checkers undo; the daily table on two different days.
- ☐ V3: tap Snooki in the games room repeatedly (reactions, no spam); stand still
  ~20 s to see him fall asleep.

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
- ☐ Race by touch: hold ◀/▶, drag on the road, ⚡ when full; try all three
  difficulties; landscape (steering left, boost right).
- ☐ The finale with `private-art/finale-drawing.webp` in place: unfold by
  tap and by sideways drag; reopen from the journal.
- ☐ Tips: first-time tips appear one at a time; «إيقاف النصائح» works;
  Settings → «رجّعي كل النصائح» brings them back.

## Known limitations

- V2: the whole campaign was not replayed start-to-finish by hand in one
  sitting; flows were verified by tests and by jumping into each scene.
- The pseudo-3D race is drawn on a 2D canvas (no WebGL); on very old phones
  the draw distance may need lowering (`DRAW_DISTANCE` in `racing.js`).

- The in-app browser pane used during development cannot register service
  workers; offline was verified with headless Edge instead.
- Characters are original vector art based on the reference, not the painted
  style (see docs/ASSETS.md for the missing painted sprite sheets). V3 adds
  2.5D lighting; they are not 3D models.
- V3: the full campaign was again not replayed end to end; the games room was
  verified by tests, scene jumps and screenshots, not on a physical phone.
- Music is a simple synthesised ambience; no composed soundtrack yet.
- English localisation: text fields accept `{ ar, en }` but only Arabic is written.
