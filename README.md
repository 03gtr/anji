# الحديقة السرّية: سنوكي والصانع المفقود
### Secret Garden: Snooki & the Missing Creator

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
| `/?timer=1` | drive the game loop with timers (for automated testing in hidden tabs) |
| `/dev/art.html?zoom=2` | character sheet: every pose, outfit and expression |

## Test and build

```bash
npm test                # 334 unit, content-integrity and app-flow tests (Vitest)
npm run build           # production build in dist/ + offline precache verification
npm run preview         # serve dist/ (service worker works on localhost)
npm run verify:offline  # re-check that dist/sw.js precaches exactly the files in dist/
```

## What is in the game

Eight acts, twelve explorable locations, a world map, and these activities:

| Act | Location | Gameplay |
| --- | --- | --- |
| I · الحديقة الضائعة | Lost Garden, Rose Conservatory | exploration & platforming, moon-roses sequence puzzle, hedge maze, Nurse Needle chase, the talking gate |
| II · البيت اللي يتذكر | The House | wardrobe dress-up, healthy-kitchen logic, Ryan's study (hidden objects), garage combination lock |
| III · طريق الأضواء الزرقاء | Garage & road | logic machine (3 circuits), paint booth, three races |
| IV · تحقيق سنوكي الكبير | Detective Academy, Animal Sanctuary | memory cards, evidence search, track-reading quiz, deduction board |
| V · مرصد النجوم الضائعة | Observatory, Secret Library | candle lights-out, constellation rings, star cipher |
| VI · ممر الذكريات | Memory Corridor, Moonlit Lake | six memory frames (owner memories or story memories), lantern release |
| VII · ورشة الأشياء المفقودة | Workshop | three-stage final machine (circuits, lamps, journey lock) |
| VIII · ما وراء الحديقة | Hidden Garden | the meeting, ending variations, credits, garden designer |

Plus: collectible stars, Ryan's letters, seed pouches and maze petals in every
location; medals and replayable challenges (including two harder versions);
17 achievements; unlockable outfits, bows, Snooki hats, collars and car colours;
a journal of story clues.

## Owner-supplied content (kept out of this public repository)

**Artwork.** Put painted panels in `private-art/*.webp` (git-ignored). A local
build then uses them for the title screen, cinematics, chapter cards and memory
frames; without them the game uses its own illustrations. See `docs/ASSETS.md`.

**Personal memories.** Real memories are never stored in the repository. Either
import a memories file on her device (Settings → «ذكريات خاصة»), or put
`private/memories.json` (git-ignored) in place before a local build. Until then
the Memory Corridor uses fictional story memories. See `docs/MEMORIES.md`.

> ⚠️ A build made *with* private art or `private/memories.json` contains them.
> Only publish such a build if you explicitly want those files online.

## Deployment

Nothing on this branch deploys anything. The GitHub Pages workflow only runs for
`main`. Publishing the game is a separate, explicit decision (see
`docs/ARCHITECTURE.md` → "Publishing").

## Documentation

- `docs/GAME_DESIGN.md` — story, characters, acts, progression, tone
- `docs/ARCHITECTURE.md` — code structure, data flow, saves, offline, how to add content
- `docs/MEMORIES.md` — adding personal memories safely
- `docs/ASSETS.md` — art pipeline, asset manifest, missing assets
- `docs/QA_CHECKLIST.md` — what was tested, and how to test by hand

---

## The original 24-hour gift (`gift.html`)

The first version of this repository is a one-day gift page (Anji's Secret
Garden with a white rabbit guide). Its source is `src/main.js` + `src/*.js`, its
launch time is `DEFAULT_LAUNCH_AT` in `src/config.js` (ISO time with offset, e.g.
`'2026-10-25T14:00:00+03:00'`), and it closes exactly 24 hours later. Its tests
are `tests/*.test.js`. On `main` it is the live page.
