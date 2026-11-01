# Season 3 — technical architecture

**Status:** design (Phase A), 2026-11-01, verified against the source at `a2decf3`. Sections marked **[built]** are
implemented; `IMPLEMENTATION_LOG.md` has the commits.

## 1. What exists (audit)

| Area | Source | Facts that matter for Season 3 |
|---|---|---|
| Saves | `core/save.js`, `core/s2-store.js`, `core/game.js` | Two documents: the main save (`snooki-game:save` + `:backup`/`:shadow`) and Season 2's (`snooki-game:s2` + `:backup`/`:shadow`/`:previous`). Ids are routed by `isS2` (`/(^|[:.])s2([-:.]|$)/`). `createS2Store` already takes a `key`; its document schema (flags, collected, seen, journal, records, lines, location, playMs, `here`, `owner`, `rev`) is season-neutral. `game.js` hard-codes **one** season document (`docOf`, `commitDoc`, `setFlags`, `setLocation`/`inS2`/`resumesInS2`, `addPlayTime`, `replace`, `save`, `nextLine`, `journalIds`). |
| Season coupling outside `game.js` | `app.js` (mission sync by `change.doc`), `progression/missions.js` (`{ season2 }` filter by `pack`), `data/chapters.js` (`herePack`), `world/engine.js` (`lineKey`), `core/save.js` (`exportText`/`importText` with an `s2` section), `ui/menus.js` (export; no hint/reward rows for `s2`), `data/worlds.js` (map page `region: 's2'`, `REGIONS`) | Small, explicit surface. |
| Mission modules | `data/m2/index.js` (`gather`, `withM2` patches), `docs/season-2/MISSION_MODULES.md` | Season 3 copies the pattern in `data/s3/`, with the id-ownership test from day one. |
| Scenes and engine | `world/engine.js`, `world/lighting.js`, `world/props.js`, `data/personas.js` | Actors with moods, jolts (hop, shake, lunge, squash, tilt, nod, rise), gestures, emotes, puffs, bubbles, `letterbox`, `camera`, `fade`, `front` dynamic drawings, darkness/glow lighting, held props, footsteps. |
| Cast | `characters/circle.js` (`CIRCLE`, `personSprite`, `personPortrait`), `anji.js`, `snooki.js`, `cast.js` | Procedural SVG people with hair styles, expressions, gestures. No height/build or eye-colour parameter yet. |
| Audio | `core/audio.js` | Master gain bound to settings (sound, volume), gesture unlock, `SYNTH` one-shots (`noise`, `sweep`, `tone`), scene-owned beds. **No long, stoppable voice** — needed for the engine. |
| Puzzles | `puzzles/rules.js` (21 types), `host.js` (`strict`, `STRICT_WRONG`, ghost-click guard), `views.js`, `defend.js` | `sort` (multi-stage, strict, exact-set picks), `logicgrid`, `arrange`, `contradict`, `testimony`, `shadows`, the defence. |
| The car | `world/props.js` `sportsCar`, `scenes/act3.js` `CAR_COLORS` | Zefiro's colour = `cosmetics.carColor` ∈ cobalt, midnight, rose, pearl, emerald. |
| Tests | `tests/game` (58 files, 1927 tests at `a2decf3`), `tests/browser` (15 files) | Season 2 save tests (`s2-isolation`, `s2-store`, `s2-resume`, `s2-older-tab`, `s2-compat-baseline` against a frozen copy of the deployed client) are the regression net for the router change. |

## 2. Season 3's own save — `snooki-game:s3` [planned for Phase B, step 1]

**Rule:** Season 3 never writes the main save or Season 2's. Proven by byte-identity tests, not by inspection.

- **Routing.** `isS3 = /(^|[:.])s3([-:.]|$)/`, and `seasonOf(id)` → `'s2' | 's3' | null` (main). Every Season 3 id has
  an `s3` segment: places `s3-clinic`, flags `s3:01-…`, decisions `s3:dec:…`, evidence `s3.ev.e-…`, missions
  `mission:s3-01`, dialogue `dlg:s3.01-…`, triggers `t.s3-clinic.…`, journal `s3-…`. A test asserts that **no id that
  exists today** (Seasons 1 and 2) matches `isS3` — otherwise an old id would silently move documents.
- **The store.** `createS2Store({ key: 'snooki-game:s3' })` — the same proven code (backup, corruption recovery, newer
  version read-only, unknown keys preserved, `owner` binding to the main save's `createdAt`, `rev` against older tabs).
  Exported under the neutral name `createSeasonStore` (an alias; `createS2Store` stays for Season 2's callers).
- **The router in `core/game.js`** — generalised from "main + s2" to "main + one document per season":
  - documents `{ main, s2, s3 }`, stores `{ s2, s3 }`, dirty flags per document;
  - `docOf(id)`, `commit(id)`, `setFlags` (one write per touched document), `nextLine` (the key's season's lines);
  - "where she is" becomes `here: null | 's2' | 's3'` (was the boolean `inS2`). Entering a season's place writes that
    document's `here = true`; leaving it (to the main game **or another season**) writes `here = false` to it; the main
    save is never written for a season move. `resumeLocation()` picks the season document whose `here` is true and
    that is newer than the main save (Season 2's tie rule unchanged); if two qualify (only possible with hand-edited
    data), the newer document wins;
  - `addPlayTime` goes to the document she is in; `save()` writes each dirty document; `replace()` keeps or rebinds
    **each** season document by playthrough exactly as Season 2's is today;
  - `liftSeasons` (was `liftS2`) moves season ids out of a main state into their documents;
  - getters: `state`, `s2State` (unchanged), `s3State`; `journalIds()` = main + s2 + s3.
- **Compatibility:** with no `s3Store`, behaviour is identical to today (Season 2's tests run unchanged against the new
  router; the frozen deployed-client baseline still passes).
- **App wiring:** `app.js` creates the Season 3 store beside Season 2's; a `change` with `doc: 's3'` syncs only Season
  3's missions and never achievements; `syncMissions(game, { season })` (the old `{ season2 }` still accepted);
  `herePack` knows `s3`; `lineKey` prefixes `s3:` for Season 3 places; backups export and import an `s3` section;
  another tab's write to `snooki-game:s3`, and a Season 3 document from a newer build, raise the same protections as
  the main and Season 2 saves (the "open elsewhere" and "newer version" messages; nothing overwritten).

### 2.1 Restart policy: `all` (owner decision, 2026-11-01) [built — verified, no restart code changed]

- **What restarts:** both ways of starting over — «مغامرة جديدة» on the title (one confirmation) and the settings'
  «مسح التقدم» (two confirmations) — call `newGame()`, which replaces the main state with a new playthrough. Every
  season document follows the playthrough (`replace()`): each is rebound to the new `createdAt` and starts empty. So
  the original game, Season 2 and Season 3 always restart **together**; there is no per-season restart.
- **What is kept:** nothing is deleted by a restart. A season's old document stays where it is until the new
  playthrough first writes that season; that write moves it to `<key>:previous` (the store's existing rule for
  "another playthrough's document"). It never resurfaces: a document whose `owner` is not the current playthrough is
  never loaded as current.
- **Never without confirmation:** the restart only happens after the game's own confirmation; «لا» changes nothing.
- **No partial state:** after a restart every document written belongs to the same playthrough (`owner` =
  the main save's `createdAt`); a reload before any season is written is still the new playthrough.
- **Tests:** `tests/game/s3-restart.test.js` (through the real app, with all three saves present).

## 3. Ids (all owned by one module each; duplicates fail a test)

| Kind | Form | Examples |
|---|---|---|
| mission | `s3-NN` | `s3-01` … `s3-08` |
| scene | `s3-<place>` | `s3-clinic`, `s3-street`, `s3-home`, `s3-garage`, `s3-archive`, `s3-roses` |
| flag | `s3:NN-<what>` | `s3:01-confronted`, `s3:01-marius-in` |
| decision | `s3:dec:<key>` (value as the flag's value) | `s3:dec:sabri-reply=deny` |
| evidence | `s3.ev.<id>` with `e-` fact/claim, `t-` testimony, `d-` deduction, `h-` her hypothesis | `s3.ev.e-visitor-log` |
| dialogue | `s3.NN-<beat>` | `s3.01-sabri-asks` |
| puzzle | `s3-<name>` | `s3-office` |
| journal | `s3-<name>` | `s3-sabri` |
| minigame | `s3-<name>` | `s3-scent` |

## 4. Modules (Season 3 code lives in its own files)

```
src/game/data/s3/
  index.js            S3_MODULES, gather(key), withS3(scene) — the Season 2 module contract, one owner per id
  cast.js             Season 3 people (Marius; Jalal) — added to the procedural cast
  m01-sabri.js        Mission 01 (scene s3-clinic, dialogue, puzzle s3-office, evidence, decisions, journal)
  m02-camaro.js …     one module per mission
src/game/data/missions-s3.js, evidence-s3.js, puzzles-s3.js, dialogue/s3.js, scenes/s3.js   registries (gather)
src/game/world/zefiro.js        the Camaro drawing (procedural, layered, colour from cosmetics.carColor)
src/game/core/engine-voice.js   the V8 model (rpm curve → firing frequency) shared by the sound and the waveforms
src/game/ui/board.js            the investigation board
```

Registration mirrors Season 2: `missions.js`, `puzzles.js`, `dialogue/index.js`, `scenes/index.js`, `items.js`
(journal) each gain one import. Season 1/2 data files are not edited.

## 5. Unlock and the map

- Season 3 opens after Season 2's finale: `S3_OPEN = 'flag:mission:s2-17'` (read through the router from Season 2's
  document).
- A fourth map page: `REGIONS` gains `{ id: 's3', name: 'أصداء الـV8' }`; Season 3 places are `region: 's3'`,
  `pack: 's3'`. A returning-player notice (once), as Season 2's.

## 6. Audio — a long voice, and the V8 [planned for Phase C]

- `audio.voice(build)` returns a handle `{ stop(fadeMs) }` for sounds that last (the engine). Voices are owned by the
  scene: the world stops them on leaving, on pause, on hiding, and when sound is switched off; a new voice of the same
  name replaces the old (no overlap). Before the first gesture nothing plays (the existing unlock rule).
- **The V8 model** (`engine-voice.js`): an rpm curve for each event (crank → catch → idle → blip → decay → off). A
  cross-plane V8 fires 4 times per revolution: the fundamental is `rpm / 60 × 4`, with the characteristic uneven
  "burble" as an amplitude modulation at half the crank frequency. The sound renders the curve with oscillators,
  a low-pass that opens with rpm, and noise for intake/exhaust. **The same curve draws Mission 03's waveforms**, so
  what she hears and what she reads always agree (and the puzzle can be tested numerically).
- The second engine (Jalal's) is a different model: smooth high idle, no burble — distinguishable by sight and sound.

## 7. The investigation board [planned for Phase D]

- **Cards** = evidence held (`s3.ev.*`), each showing its **current** reliability: a function of the evidence's base
  kind and conditions (e.g. `e-clip` is *unverified* until `d-two-engines`, then *disproved*).
- **Relations** she draws: supports, contradicts, depends on, before, after, same source, different source. Each
  evidence pair has its true relations in data; a drawn relation is accepted only if it is true; an invalid one is
  refused with a neutral line (`STRICT_WRONG` style — it never names the right relation). Nothing is drawn for her.
- **Hypotheses** (`h-*`) are her own cards; they stay until disproved (and then show it).
- Input: touch drag, mouse drag, and keyboard (select card → select card → choose relation). Saved in Season 3's
  document (`s3:rel:<a>|<b>` → relation).

## 8. Tests (added with each step; the Season 2 regression net stays)

- **Save:** isolation (every Season 3 write lands in `snooki-game:s3`; main and Season 2 saves byte-identical across a
  full Mission 01), resume/reload (in Season 3, after leaving it, after a decision), corruption and newer-version
  recovery (store tests parameterised by key), restart, cross-season moves (Season 2 place → Season 3 place → main).
- **Ids:** no duplicate mission/scene/evidence/decision/puzzle/dialogue id across modules or against Seasons 1–2; no
  pre-existing id matches `isS3`; every scene exit and `goto` points to a registered scene; every evidence reference
  resolves; the evidence graph validates (no cycles, nothing needed before it is yielded).
- **Puzzles:** every Season 3 puzzle strict, solvable by its own rules, **unique** (exhaustive check where the space is
  enumerable), guess space measured (≥ 8 per stage, ≥ 20 per puzzle, as Season 2), no answer in the lines before it.
- **Decisions:** every value made somewhere and read somewhere (Season 2's audit, extended).
- **Browser:** Edge at 320/360/390/landscape and WebKit 390 on the production animation loop (the timer loop starves
  headless WebKit — `docs/season-2/IMPLEMENTATION_LOG.md` Step 6), with the freeze watchdog.

## 9. File ownership (for any parallel work)

Shared registries (`missions.js`, `puzzles.js`, `dialogue/index.js`, `scenes/index.js`, `items.js`, `worlds.js`,
`core/game.js`, `app.js`) are edited **only by the integrator** (this session), once each. A mission builder owns only
its `data/s3/mNN-*.js`, its tests and its assets. No two builders touch the same file.

## As built — the season's code (2026-11-01)

| File | What it is |
|---|---|
| `src/game/data/s3/m01-sabri.js` … `m08-silence.js` | one module per mission (missions, scenes, interactables, dialogue, evidence, decisions, puzzles, board `links`, `patches` to earlier places), gathered by `data/s3/index.js` |
| `src/game/data/s3/board.js` | the board's rules (pure): relations, `linkFlag` (symmetric relations read both ways), `linkHolds`, `reliability()` as a state, the neutral refusals |
| `src/game/ui/board-s3.js` · `styles/s3.css` | the board as a journal tab «لوحة التحقيق» (shown only once `s3:board-open`); touch first, ≥ 44 px, reliability in words and marks (never colour alone) |
| `src/game/core/engine-voice.js` | the V8 model (pure): Zefiro's cross-plane burble vs the other engine; one source for the sound (`render`) and for the drawn waveforms (`strokes`); `peak` and `clarity` for the tests |
| `src/game/core/audio.js` | named sounds `v8-start`, `v8-idle`, `v8-blip`, `v8-off`, `v8-other`, `shutter`, `relay` (rendered once from the model, then replayed) and the finale's layers `hush-*` (each fades and stays faded); additive — every existing sound is unchanged |
| `src/game/data/s3/art.js` · `recordings.js` | Zefiro drawn properly (an original muscle-car silhouette, in `cosmetics.carColor`), the street's details, the waveform SVG; the five recordings of Friday night |
| `src/game/world/painter.js` | one new theme, `street-night` (additive) |
| `src/game/characters/circle.js` · `world/engine.js` · `data/personas.js` | Jalal (fiction) as a new look, size and habits (additive; the existing looks are byte-identical) |
| `src/game/puzzles/views.js` | a `sort` card may carry `art` (the waveform); a card without it renders exactly as before |
| `src/game/ui/menus.js` | the board tab, added only when Season 3's board is open |
| `src/game/data/worlds.js` | Season 3's six places on its map page, each unlocked by the previous mission |

No change to the save format, the stores, or the restart. Season 3's data lives in `snooki-game:s3` (§2).
