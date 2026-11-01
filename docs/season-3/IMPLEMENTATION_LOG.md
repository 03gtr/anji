# Season 3 — implementation log

Only what is done, with its commit and its verification. Plans live in the design documents.

## Phase A — repository audit and design (2026-11-01)

- **Production baseline:**
  - `origin/main` = `a2decf3` (the Season 2 release);
  - the live site serves `main-BlLUcfpB.js` (checked with `curl`).
- **Branch:**
  - `feature/season-3-echoes`, created from `origin/main` in its own worktree `D:/anji-s3`;
  - its upstream was removed, so a plain `git push` cannot target `main`;
  - every existing worktree and branch is untouched, including `D:/anji-s2` with its uncommitted journal diagnostic;
  - `node_modules` was first a junction to `D:/anji-s2/node_modules` (same lockfile). Vite's file guard then
    refused to serve the fonts through it (HTTP 403), so only the link was removed and `npm ci` installed the
    worktree its own copy. `D:/anji-s2/node_modules` was checked afterwards and is intact.
- **Audited in the source** (`TECHNICAL_ARCHITECTURE.md` §1): saves and routing, the Season 2 store, the app's season coupling, mission modules, scenes and engine, the procedural cast, audio, puzzle rules, Zefiro's drawing and colours, tests.
- **Canon findings:**
  - **Zefiro.** Ryan's car is «زفيرو», blue by default, in a colour the player can change, so the Camaro is Zefiro.
  - **Sabri.** Sabri is Ryan's coworker, not Anji's, so in Mission 01 he is at the clinic as a visitor.
  - **Car colour.** One of the car colours, *pearl*, is pale enough to read as grey, so no clue may rely on colour.
- **Baseline tests:** DOM 58 files, 1927/1927, exit 0, on the untouched `a2decf3` in the new worktree.
- **Documents:** `SEASON_3_DESIGN.md`, `TECHNICAL_ARCHITECTURE.md`, `PUZZLE_SPECIFICATIONS.md`, `DECISION_FLOW.md`, `EVIDENCE_GRAPH.md`, `CREATIVE_PROPOSALS.md`, this log, `TESTING_REPORT.md` (commit `9e7dfba`).

## Phase B — vertical slice

### Step 1 — Season 3's own save (`8b0e732`)

- **The season router.** `core/game.js` keeps one document per season (`seasonOf`, `isS3`). Season 2's order of writes and events is unchanged.
- **The store.** Season 3's store is Season 2's code under `snooki-game:s3` (`createSeasonStore`, `S3_KEY`).
- **App wiring:**
  - per-season mission sync (`syncMissions({ season })`), with no achievements from a season;
  - backups carry `s3`;
  - line pools and the HUD pack know `s3`.
- **Verified:**
  - `tests/game/s3-save.test.js` 16/16;
  - the whole DOM suite 1943/1943, including Season 2's save tests and the frozen deployed-client baseline, unchanged.
- A "restart Season 3 only" option is **not** wanted: the owner chose `all` (below).

### Step 1b — owner decisions; restart verified; Season 3 in the save protections (uncommitted)

- **Owner decisions (2026-11-01):** restart policy `all`; the name **Jalal** (fiction); Zefiro's spare key `later`
  (deferred, no dependency). Recorded in the design, the architecture (§2.1), the decision flow and the proposals.
- **Restart, inspected before any change:** both ways of starting over already restart every season together
  (`newGame()` → `replace()` rebinds each season to the new playthrough). Nothing is deleted. Old season documents go
  to `:previous` on the first write. So no restart code was changed. It is **proven** by
  `tests/game/s3-restart.test.js` through the real app with all three saves: cancel changes nothing; confirm and wipe
  restart all three; a reload right after a restart; no partial state.
- **Found while checking:** `app.js` watched only the main and Season 2 keys for another tab's write, and checked
  only their load status for a newer build. `snooki-game:s3` is now covered the same way (additive; the stores
  themselves already refused to overwrite).

### Step 2 — Marius, the clinic, Mission 01 and its puzzle (uncommitted)

- **Marius** (`characters/circle.js`): blond (`swept` hair), blue eyes, tall and broad (`build: 1.13`, drawn
  wider by a scale about his centre), a dark coat over a light shirt. The new options are off for everyone else:
  the five existing people were drawn in every pose and frame before and after, and 180/180 drawings are
  byte-identical. Engine size `KIND.marius`, idle habits in `personas.js`.
- **A blush** (`world/engine.js`, puff type `blush`): pink cheeks and warm lines over Anji when Sabri asks his
  question. The browser test checks that it is on her at the moment she has to answer.
- **Season 3 effects and conditions:** `ev3:<id>` (evidence into the Season 3 document) and `dec3:key=value`
  (a decision). The content validators know both.
- **Season 3 data** (`data/s3/`): `constants.js` (no import cycle), `index.js` (`S3_MODULES`, `withS3`, the same
  shape as Season 2's `data/m2`), and `m01-sabri.js` for the whole mission:
  - the place `s3-clinic` (the map: region «أصداء الـV8», open after Season 2's finale);
  - the scene, its people and the records;
  - the dialogue, keeping the owner's lines and spelling;
  - the evidence, with its reliability and source;
  - two decisions (`sabri-reply`, `marius-honest`) that change what is said later;
  - the case-file entry and the mission (four steps, no hints).
- **The puzzle `s3-office`** (sort, two stages):
  - who was really in the office each day, then what kind of statement each one is;
  - strict: no hint, no solution and no skip, and a wrong check says only that it is not right yet (no count);
  - one answer;
  - the guess space is 16384 × 4096.
- **People stay talkable while they walk:** each person's interactable is bound to their actor (`actor:`).
- **Found in the browser and fixed:**
  - **Sabri's walk to the counter.** It was attached to a line of narration, so a quick tap stopped him beside
    Lama, and the next tap on "Sabri" opened Lama. The walk is now its own scene step, finished before the line.
  - **«گهوته» matched the owl guard.** It was reworded to «گهوة ربيع» (same meaning).
- **Tests:**
  - `tests/game/s3-m01.test.js` (16): registration; the puzzle (strict, unique, guess space); no answer leaks; six
    playthroughs through the real dialogue with every decision; the stored Season 3 document; the real puzzle panel
    with no help controls.
  - `tests/browser/s3-m01.browser.test.js`: the whole mission by touch in Edge at 320, 360, 390 and landscape 844,
    and in WebKit at 390 (on rAF; WebKit never uses `?timer=1`). It covers every target ≥ 44 px, no sideways
    scroll, a wrong try, Sabri's admission per reply, the Season 3 document, the main save byte-identical, and no
    page errors.

### Step 3 — the whole season: Missions 02–08, the V8, the board (2026-11-01)

The owner authorised the whole Season 3 release (commit, push, PR, merge on green checks, deploy, live check).
Missions, each one module in `src/game/data/s3/`:
- **02 «رسالة بثمانية أسطوانات»** (`s3-street`, a new `street-night` theme):
  - the street's details, optional (P-07);
  - Zefiro drawn properly, in her colour;
  - the V8 cinematic: ignition, burble, ONE blip, off; the car never moves;
  - the whisper, then `v8-answer`;
  - the bakery's shutter after it.
- **03 «لا تصدّقين كلشي ينقال»** (`s3-home`):
  - the clip;
  - Marius (reads `marius-honest`);
  - Ryan's call, then `ryan-trust`;
  - five recordings and «الصدى» (P-02);
  - the board opens; the first thread.
- **04 «الشخص ورا القصة»** (`s3-garage`):
  - Sabri, Jalal (fiction, a new look) and the receipt;
  - «سلسلة الإعادة» (P-04);
  - Lama's call, then `lama-secret`;
  - «الصدى المحرّف» (P-03): one puzzle per `sabri-reply`.
- **05 «سنوكي يعرف شي»** (`s3-lane`):
  - Snooky tracks like a dog: a cat, a wrong dig, then he sits;
  - the keyring, the tyre marks, the oil;
  - «وين وگفت السيارة الثانية» (P-05).
- **06 «غرفة الحقائق السبعة»** (`s3-archive`): the night in order, then two independent chains (P-06).
- **07 «ثلاث طرق وحقيقة وحدة»**:
  - three roads, each with its own puzzle and the same `e-original`;
  - the offers read the earlier decisions;
  - `road`.
- **08 «لمن يحچي السكوت»** (her street, by `patches`):
  - the defence (P-09: a statement is never an answer);
  - Jalal admits, and why; Ryan names him only then;
  - «السكوت»: she names three sounds, each fades; Ryan turns the engine off;
  - the ending reads five decisions;
  - no promise, wedding or date.

Systems:
- `core/engine-voice.js`: one model for the sound and the drawn waveforms.
- `core/audio.js`:
  - named V8 sounds, rendered from the model;
  - the finale's fading layers.
- The board:
  - `data/s3/board.js` (the rules);
  - `ui/board-s3.js` and `styles/s3.css` (a journal tab).
- `sort` cards may carry `art`.

Found on the way and fixed:
- **Fairness floor.**
  - Problem: the `pick` stages first had 4–5 options, under the floor of 8 a stage.
  - Fix: they became "tick every statement that holds" (2ⁿ) or got eight options. Each new option was checked for
    a single right answer: «أول ثانيتين» was ambiguous and was replaced.
- **The clip's anchor.**
  - Problem: the clip carried a street-light click, but it was cut from the 23:10 event.
  - Fix: the click was removed.
- **Colour words.**
  - Problem: the camera's «أحمر» light was in an evidence note.
  - Fix: reworded; no colour words in evidence or puzzles (tested).
- **Hidden ratio.**
  - Problem: the waveforms drew the engine over the ambience, hiding the distance clue.
  - Fix: they are now mirrored (engine above, everything else below).
- **Missing click.**
  - Problem: the street-light click fell between drawn columns.
  - Fix: a column now shows any click inside its span (tested).
- **Answer beat.**
  - Problem: her answer to the blip had no blush beat of its own.
  - Fix: a «…» line, as in Mission 01.

Docs brought to what was built:
- `DECISION_FLOW.md`: six decisions, all [built]; `jalal-way` is not built;
- `EVIDENCE_GRAPH.md`;
- `PUZZLE_SPECIFICATIONS.md`: all [built], with an as-built section;
- `SEASON_3_DESIGN.md` §9 (as built);
- `TECHNICAL_ARCHITECTURE.md` (the code map).
