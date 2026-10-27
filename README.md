# الحديقة السرّية: سنوكي والصانع المفقود
### Secret Garden: Snooki & the Missing Creator

**V3 — «صالة ألعاب ريان وأنجي» (Play Together).** See *What changed in V3* below.
(V2 — «غدنا اللي ما خلص» — is described further down.)

A mysterious, funny, emotional story adventure for the web. Anji wakes up in a
moonlit garden of blue roses, meets Snooki — a fluffy white husky who calls
himself "a security consultant with fur" — and slowly uncovers why the garden's
creator, Ryan, disappeared, and why the garden seems to know her.

- **Mobile-first**, Arabic (Iraqi dialect), right-to-left, touch + keyboard.
- **Offline-first**: after one complete visit it plays with no network (service
  worker precache, verified in a real browser with the network switched off).
- **Private by design**: no backend, accounts, analytics, trackers or network
  calls. Progress lives only in the player's browser; backups are files she
  exports herself.
- Vanilla JavaScript modules + Vite. No game engine, no runtime dependencies
  except a bundled font.

> This branch (`feature/snooki-missing-creator`) contains the game. The original
> 24-hour gift that is live on GitHub Pages is unchanged on `main`; on this
> branch it is still available as `gift.html`.

---

## Play it locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open http://localhost:5173/. Development shortcuts (dev server only, stripped from
builds):

| URL | What it does |
| --- | --- |
| `/?scene=house` | jump straight into a location |
| `/?scene=garage&flags=garage-open,act2-done` | …with story flags set |
| `/?scene=garage&game=race-night` | …then open a minigame |
| `/?scene=library&puzzle=library-candles` | …or a puzzle |
| `/?timer=1` | drive the game loop with timers (for automated testing in hidden tabs) |
| `/dev/art.html?zoom=2` | character sheet: every pose, outfit and expression |

## Test and build

```bash
npm test                # 574 unit, content, app-flow and real-browser scroll tests (Vitest, 21 files)
                        # the browser file drives an installed Edge/Chrome (playwright-core, no download)
                        # and is skipped, with the reason shown, if neither can be launched
npm run build           # PUBLIC build in dist/: no private art/memories + offline check + private audit
npm run build:private   # LOCAL build with private-art/ and private/memories.json (never publish)
npm run preview         # serve dist/ (service worker works on localhost)
npm run verify:offline  # re-check that dist/sw.js precaches exactly the files in dist/
npm run audit:private   # re-check dist/ for private images, file names and memory text
npm run art:export      # export every character image to docs/art/ (see docs/ART_PIPELINE.md)
```

Dev shortcut for the games room: `/?scene=gameroom&flags=house-entered,intro-done`.

## What is in the game

Eight acts, twelve explorable locations, a world map, and these activities:

| Act | Location | Gameplay |
| --- | --- | --- |
| I · الحديقة الضائعة | Lost Garden, Rose Conservatory | exploration & platforming, moon-roses sequence puzzle, hedge maze, Nurse Needle chase, the talking gate |
| II · البيت اللي يتذكر | The House, Ryan's study | wardrobe dress-up, healthy-kitchen logic, the programmer's study (desk search, laptop, lamp), the 2:30 clock, garage combination lock |
| III · طريق الأضواء الزرقاء | Garage & road | logic machine (3 circuits), paint booth, three third-person races |
| IV · تحقيق سنوكي الكبير | Detective Academy, Animal Sanctuary | memory cards, evidence search, track-reading quiz, deduction board |
| V · مرصد النجوم الضائعة | Observatory (العم منذر), Secret Library | staged candle puzzle, constellation rings, star cipher |
| VI · ممر الذكريات | Memory Corridor, Moonlit Lake | six memory frames (owner memories or story memories), lantern release |
| VII · ورشة الأشياء المفقودة | Workshop | three-stage final machine (circuits, lamps, journey lock) |
| VIII · ما وراء الحديقة | Hidden Garden | the meeting, the drawing, planting a blue rose together, three hopeful endings, credits, garden designer |

Plus **eleven side missions** (journal → «المهمات»), collectible stars, Ryan's
letters, seed pouches, recipe scraps and maze petals; medals and replayable
challenges (minigames *and* solved puzzles); 17 achievements; unlockable
outfits, bows, Snooki hats, collars and car colours; a journal of clues.

## What changed in V3

| Area | What was done |
| --- | --- |
| Games room | «صالة ألعاب ريان وأنجي»: a new room (door in the house hall, map node) with a card table, checkers table, shelf, blue-rose lamp, cork board, trophy shelf and Ryan's laptop. Ryan appears only as a recorded «نسخة اللعب» — never live, never watching, never pushy |
| Games | memory match, High Card, «سباق الورد» (an original trick game), checkers (full rules, undo), Snooki's card trick — seeded, with a fair AI on easy / normal / hard where there is an opponent |
| Dialogue | lines for before / win / lose / draw / rematch / leave / record, per game, as data, rotated |
| Activities | 7: rose delivery, chocolate box, picnic, waiting clock, garden duet, gift workshop, blue-rose promise |
| Pranks | Snooki's 10-prank board (all skippable, none targets Anji, nothing loud, flashing or irreversible) |
| Rewards | 6 card backs, garden outfit, jester hat, 8 garden decorations, journal entries, trophy shelf + replay gallery, an optional daily table (no streaks) |
| Characters | 2.5D: one shared lighting model; new poses/expressions/views; asset manifest + exported sheets (`docs/ART_PIPELINE.md`). Not 3D models |
| Memories | `location`, `object`, `status` fields; drafts never shown (`docs/MEMORIES.md`) |
| Saves | v3 with migration from v2 (nothing lost) |
| Privacy | the public build can no longer include private art or memories, and is audited |
| Mobile | landscape layout fix (the scene used to fill only a ~200 px strip), games sized for 320 px–landscape |

## What changed in V2

| Owner request | What was done |
| --- | --- |
| «بول ما بعد الجم» | now «وجبة ما بعد الجيم» (and every «الجم» → «الجيم / التمرين») |
| The clock | stops at **2:30**: Snooki's line, a journal entry, the garage code `0230`, the recipe timer, and a full clue chain |
| Ryan's study | a programmer's workspace you walk around: laptop with fictional *GardenCore / BlueRoseEngine* code, terminal + debug panel, circuit diagrams, cables, warm coffee, pulled-out chair, sticky notes, a lamp, a hidden clue and two easter eggs |
| Racing | rebuilt as a **third-person pseudo-3D chase camera** with an original GT-R-inspired coupe (four round tail lights, no logos), traffic, scenery, boost, blue lights, checkpoints, a navigator (Snooki), difficulty, reduced motion, pause/resume/retry |
| The candle puzzle | three short stages (3 in a row → 5 in a row → a plus), a one-line goal, a visual example, three action hints, «شوفي الحل», and a story-safe skip |
| Tutorials | one-at-a-time contextual tips (can be turned off / reset) + a permanent help screen in the pause menu |
| The owl | is «العم منذر» everywhere (warm, clever, a bit eccentric, often more confident than correct); old saves migrate |
| The ending | rewritten: honest about work and responsibilities, nothing is owed, a mutual choice; the drawing reveal (private asset), planting a blue rose together, three hopeful endings |
| Missions | eleven new chains (see `docs/GAME_DESIGN.md` → V2 missions) |
| Mobile | tighter portrait framing (less empty sky), ≥ 44 px targets, landscape race layout, no overlap |
| Anji | green eyes |

## Owner-supplied content (kept out of this public repository)

**Artwork.** Put painted panels in `private-art/*.webp` (git-ignored). The dev
server and `npm run build:private` then use them for the title screen,
cinematics, chapter cards and memory frames; the normal `npm run build` never
includes them and uses the game's own illustrations. See `docs/ASSETS.md`.

**The drawing (finale).** The owner's handmade drawing goes in
`private-art/finale-drawing.webp` (git-ignored; crop it to the paper, about
440×750). The finale shows it folded and unfolds it on a tap. Without the file a
neutral placeholder card appears. It is never committed.

**Personal memories.** Real memories are never stored in the repository. Either
import a memories file on her device (Settings → «ذكريات خاصة»), or put
`private/memories.json` (git-ignored) in place before `npm run build:private`. Until then
the Memory Corridor uses fictional story memories. See `docs/MEMORIES.md`.

> ⚠️ A `build:private` build contains the private art and memories.
> Only publish such a build if you explicitly want those files online.

## Deployment

Nothing on this branch deploys anything. The GitHub Pages workflow only runs for
`main`. Publishing the game is a separate, explicit decision (see
`docs/ARCHITECTURE.md` → "Publishing").

## Documentation

- `docs/GAME_DESIGN.md` — story, characters, acts, progression, tone
- `docs/ARCHITECTURE.md` — code structure, data flow, saves, offline, how to add content
- `docs/MEMORIES.md` — adding personal memories safely
- `docs/ASSETS.md` — assets, owner artwork, missing assets
- `docs/ART_PIPELINE.md` — 2.5D character pipeline, lighting, palette, manifest, licensing
- `docs/QA_CHECKLIST.md` — what was tested, and how to test by hand

---

## The original 24-hour gift (`gift.html`)

The first version of this repository is a one-day gift page (Anji's Secret
Garden with a white rabbit guide). Its source is `src/main.js` + `src/*.js`, its
launch time is `DEFAULT_LAUNCH_AT` in `src/config.js` (ISO time with offset, e.g.
`'2026-10-25T14:00:00+03:00'`), and it closes exactly 24 hours later. Its tests
are `tests/*.test.js`. On `main` it is the live page.
