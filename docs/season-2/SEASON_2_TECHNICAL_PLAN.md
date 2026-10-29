# Season 2 — Technical Plan (revised after Gate C)

These are the facts the plan builds on. Each was checked in the code at `main` `ca13094`, whose live bundle is `main-BB8Hqur-.js`.

Every released game build, from the first one `e771143` to `ca13094`, runs the **same** `save.js` and `game.js`, unchanged since `506780f`. A frozen copy is in `tests/fixtures/deployed-client/`, guarded by SHA-256. It stands in for "an older deployed tab".

## 1. Coexistence: one game, two save documents

Season 2 is a new pack (`pack: 's2'`). It opens after `game-complete` on a third map page, `region: 's2'`.

Its **progress lives in its own localStorage document**, `snooki-game:s2`, with `:backup`, `:shadow` and `:previous`. The main save `snooki-game:save` stays the Season 1 document.

**What Season 2 reads from the main save (read-only):** `game-complete`, `HUSKY_MET` / `sp1-husky-met`, `husky-name`, cosmetics, and the main save's `createdAt`.

**What Season 2 writes to the main save: nothing.** There are no documented exceptions. The season unlock is *derived* from `game-complete` and is never written anywhere. The write-isolation tests (§6) assert that the main save is byte-identical before and after any Season 2 operation.

**How this is enforced:**
- **Separate scene ids.** Season 2 places have their own ids, even when they reuse a Season 1 look (`s2-archive` uses the archive's painter theme and props). So Season 1 scene triggers (`t.archives.*`), `visited:archives` and `seen:dlg:` keys can never fire or be written by Season 2 play.
- **Prefix routing.** Every Season 2 id starts with `s2`: flags `s2:*`, missions `s2-*`, evidence `s2e.*`, journal `s2-*`, puzzles `s2-*`, scenes `s2-*`, line pools `s2:*`.
  - `game` gains a second store. Every state method (`flag`, `setFlag`, `collect`, `addJournal`, `markSeen`, `recordResult`, `nextLine`, `setLocation`, `pstage`/`pdraft`) routes by id prefix to the Season 2 document.
  - `mission:s2-*`, `mission-seen:s2-*`, `seen:dlg:s2.*` and `pstage:s2-*` route there too.
  - The routing table is one function, `isS2(id)`, and it is unit-tested exhaustively.
- **Shared engine code passes the scene's region.** For example, the husky's ambient line rotation key becomes `s2:husky-ambient` inside Season 2 places, so even a line counter can't touch the main save.
- **Location while she plays Season 2** is stored in the Season 2 document. The main save keeps her last Season 1 place. «كمّلي» resumes whichever document was written last (compared by `updatedAt`).
- **No equippable rewards.** Season 2 gives no cosmetics in M1–M3. An unknown cosmetic id in the main save is the one thing an old renderer might not handle, so the design avoids it.

## 2. Save compatibility (requirement A)

### 2.1 What older clients do — characterised by tests

`tests/game/s2-compat-baseline.test.js`: 8 tests, all passing on the frozen deployed client.

| # | Older deployed tab meets… | Result | Consequence for the design |
|---|---|---|---|
| 1 | a separate `snooki-game:s2` key, through load, save, every `game` method, export, import, new game (`clear`), corrupt and recovery paths | touches **only** its own three keys; never enumerates or clears storage; the Season 2 document stays byte-identical | Season 2 data in its own key **cannot be destroyed by an older client** |
| 2 | new top-level fields in the main save (`rev`, `s2`) | loads fine, then **drops them** on the next save | never put authoritative new data in main-save top-level fields |
| 3 | unknown string or number flags in the main save | kept | (would work, but rejected: see 4) |
| 4 | a main save with a higher `SAVE_VERSION` | **resets**: status `reset`, empty game. The next two saves overwrite the primary and the backup; progress survives only in `:broken` | **the main `SAVE_VERSION` is never bumped** for Season 2 |
| 5 | another tab saving newer progress meanwhile | last writer wins: the stale tab's next save (e.g. the 8-second location save) removes the newer progress from the main save, and one write later from the backup | an **existing hazard of all deployed builds**; it can't be fixed retroactively (2.3) |
| 6 | an export file with an `s2` section | imports the main save and ignores `s2` without failing | documented limitation: restoring Season 2 from a file needs a new build |

### 2.2 The strategy

1. **Isolation by key.** An older client never reads or writes `snooki-game:s2` (test 1). Season 2 progress survives any older tab, any rollback of a release, and an older build's "new game".
2. **No main-save version bump** (test 4).
3. **Season 2 document schema `v: 1`**, with its own migrations table, `normalize`, and backup on every write (the same proven pattern as `save.js`). Its `normalize` **preserves unknown keys** inside known containers: flags of any valid type, and any `s2*` string in the lists. So an M1 build that meets an M2 or M3 document (a rollback) keeps the M2/M3 progress it can't use yet, and writes it back unchanged. A unit test covers this: M1 code, M3 document, a save, every key survives.
4. **A future document version is read-only, never reset.** If a build meets a Season 2 document newer than it understands, it shows «هالتقدم من نسخة أحدث من اللعبة — حدّثي حتى تكملين» and refuses every Season 2 write. Its own key and backup stay untouched. This is the opposite of `save.js`'s reset, and it is built in from the first version.
5. **Owner binding.** The document stores `owner` = the main save's `createdAt`.
   - If an older build starts a new game, `createdAt` changes. The new build then moves the old document to `snooki-game:s2:previous`; it does not delete it. The new playthrough's Season 2 starts empty once it reaches `game-complete`.
   - Importing a backup that has an `s2` section binds that section.
6. **Several tabs of the new build** (a defect that exists today):
   - Each document carries a revision `rev`.
   - Before every write the store re-reads the stored `rev`. If another tab wrote since this tab loaded, it does **not** overwrite. It switches to read-only and shows «اللعبة مفتوحة بمكان ثاني — نعيد التحميل؟».
   - A `storage` event listener detects this early.
   - This protects **both** documents among new-build tabs.
7. **Detecting an older tab's overwrite of the main save** (the hazard in 2.1 #5):
   - **The shadow copy.** New builds write the main save with a `rev` field and mirror it to `snooki-game:save:shadow`, a key older builds never touch.
   - **The tell.** A main save with no `rev` but a shadow with the same `createdAt` means an older build wrote last.
   - **The check.** On load, the new build compares the two, using the union of flags, collected and journal entries. If the main save **lost** anything the shadow has, it does not choose silently. It shows: «نسخة قديمة من اللعبة كتبت فوق تقدمچ. نرجّع الأحدث؟».
     - «رجّعي الأحدث» restores the shadow and keeps the overwritten copy in `:alt`.
     - «خليها» keeps the main save and keeps the shadow in `:alt`.
   - Nothing is deleted.

### 2.3 Limitation (stated plainly)

An older tab that is **still open** can overwrite newer *Season 1* progress in the main save. This is test 2.1 #5. Its code is already on players' devices and can't be changed.

**What the design guarantees:**
- **Season 2 progress** can't be touched by it (separate key).
- **Season 1 progress lost this way** is detected the next time a new build loads (the shadow) and offered back; nothing is decided silently.
- **Once every open tab has reloaded** into a build with item 6, the window closes for good.

**What it can't guarantee:**
- **The overlap moment itself.** While an old tab and a new tab both have the game open, the old tab's write lands. It is recoverable afterwards, but not prevented.

## 3. Write isolation (requirement B)

The rule is: Season 2 operations write **zero** bytes to the main save, the settings, or the memories key.

**Tests** (`tests/game/s2-isolation.test.js`, written test-first in Phase 1):
- **Single operations.** For each Season 2 operation — start the season, collect evidence, add journal entries, set a decision, pin to the board, complete a mission, record a puzzle, rotate a line, set location, show the season notice — run it and assert that `snooki-game:save`, `:backup`, `snooki-game:settings` and `snooki-game:memories` are byte-identical before and after.
- **A full scripted run.** Run M1 from s2-01 to s2-11 in the DOM test harness. Then assert that the Season 1 flags, collected items, journal, records, endings (`game-complete`, `act8-done`, `ending-*`), garden, gifts and cosmetics are deep-equal to the snapshot.
- **Real browser.** Play s2-01 in headless Edge and WebKit, then compare the `localStorage` main-save string before and after.
- **Routing.** `isS2(id)`, table-driven: every Season 2 id kind routes to Season 2, and every existing Season 1 id in the content (collected from the data files) routes to the main save.

## 4. Modules

| Module | New or extended | Responsibility |
|---|---|---|
| `core/s2-store.js` | new | Season 2 document: load, normalize (preserving unknown keys), migrate, backup, owner binding, `rev`, read-only states (future version, other tab) |
| `core/save.js` | extended (main key unchanged, version unchanged) | the `rev` field, the shadow mirror, the older-overwrite check; export/import gain an optional `s2` section |
| `core/game.js` | extended | `isS2(id)` routing to the Season 2 store; same public methods |
| `data/missions-s2.js`, `data/evidence-s2.js`, `data/scenes/s2.js`, `data/dialogue/s2.js`, `data/puzzles-s2.js` | new | content; `graph.mjs` moves here and the validator becomes a content test |
| `progression/case-state.js` | new | typed decisions, board and relationship (registry-validated) |
| `progression/casefile.js`, `progression/social.js` | new | pure: `assess`, `missingFor`, `reaction` |
| `core/conditions.js`, `core/effects.js` | extended | `num:`, `dec:`, `ev:` atoms (validated in the content test) |
| `puzzles/rules.js` | extended | `sort`, `rubbing`, `duo`, `board` (+ solvers) |
| `ui/caseboard.js` | new | the board, «غرفة الدائرة» (tap-first) |
| `ui/menus.js`, `ui/guide.js` | extended | map page `s2`; the «القضية» view inside «الأدلة»; the HUD objective for the pack she is in |
| `data/companions.js`, `world/engine.js` | extended | `scout`; region-keyed line pools; no ownership change |
| `styles/game.css` | extended | `.tabs button { min-height: 44px }`: WebKit renders the journal tabs at 43 px today (§8) |

## 5. Milestones and save contracts (requirement D)

Every milestone is a complete, playable release. It ends at its **terminal** mission, and `validate-graph` checks the following:
- every main mission of the milestone leads to its terminal;
- nothing needs a later milestone;
- released alone, everything in scope can be completed.

| | M1 | M2 | M3 |
|---|---|---|---|
| Content | Acts I–II: s2-01 … s2-11; optional: lanterns, training, prank, duel, memory archive, outing | Acts III–IV: s2-12 … s2-21; optional: the apology | Acts V–VI: s2-22 … s2-30; optional: post-campaign cipher |
| Terminal / stopping point | **s2-11 «اجتماع الدفترين»**: the board at stage 2 with A, B and C open. Journal: «يتبع… خيوط كاذبة تنتظر». The map shows only real places; there are no "coming soon" locks | **s2-21 «علّية الفوانيس»**: the eighth lantern found. «يتبع… الدائرة تنغلق» | **s2-30**: the season is complete; post-game opens |
| Board stages | 1–2 | 3 (+ the accusation in s2-15) | 4 |
| Season 2 document | `v: 1`; keys `s2:*`, `mission:s2-01..11`, `s2e.*` (M1 evidence), `s2-*` journal | **same `v: 1`**; only new keys | **same `v: 1`**; only new keys |
| Extension rule | — | additive keys only, no migration; M1 code that meets an M2 document preserves every key (the rollback test) | as M2 |
| If a shape change is ever needed | — | `v: 2` through an additive migration. Older builds go read-only on a `v: 2` document (§2.2 item 4); they never reset it | same |

**Release contract per milestone (Gate F):**
- the full `npm test` passes, including the Season 2 tests and the compatibility baseline;
- `npm run build` passes, with the offline check and the private-asset audit;
- the local production preview gets a walkthrough at 320 px, 390 px and on desktop, in Edge and WebKit;
- the compatibility suite passes on synthetic saves: a live-shaped finished save, a mid-milestone save, the previous milestone's terminal save, an older-tab overwrite, a future-version document, and two tabs;
- a release-candidate report;
- **then the owner's explicit approval for that release.**

## 6. Offline, performance, errors, release

- **Offline:** unchanged. The precache list is generated, and `verify-offline` and `audit-private` gate the build.
- **Bundle:**
  - Season 2 dialogue and scenes go in a lazy chunk, with the existing recovery card if it fails to load;
  - missions and evidence metadata stay in the main bundle;
  - the main-bundle growth budget is +60 KB gzip, measured in Phase 1.
- **Memory:** the existing painter with canvas release; no new image files.
- **Errors:** scene or chunk failures use the existing cards. A board failure shows a card with «رجوع». The read-only states (future document, other tab) show their own message and still allow playing Season 1.
- **Release:** a push to `main` deploys (`deploy.yml`). Nothing reaches `main` without the owner's approval for that specific release. Previews are local (`npm run build` + `vite preview`).

## 7. Implementation phases (after this revision is approved)

| Phase | Content | Exit evidence |
|---|---|---|
| 1 Foundations | `s2-store`, routing, shadow and `rev` for the main save, the read-only states, export/import, the HUD objective by pack, tabs at 44 px, the content test from `validate-graph` | the isolation and compatibility tests (§2, §3) written **first** and passing; existing suite green |
| 2 Investigation loop | `casefile`, `board` + `ui/caseboard`, `sort`, the hint standard | rule and solver tests; board browser tests (Edge + WebKit; 320, 360, 390, desktop) |
| 3 M1 content | s2-01 … s2-11, the M1 optional content, cast portraits (fictional designs) | full M1 run in a browser by touch; reload mid-mission; journal = mission state; **M1 release candidate** |
| 4+ | M2, then M3, each with its own release candidate and approval | as above |

## 8. WebKit (engine testing, not an iPhone)

- **Installed:** Playwright WebKit 27.2 (build 2370) from Playwright's official CDN, into `%LOCALAPPDATA%\ms-playwright`. This is the WebKit engine on Windows. It is **not** Safari, not iOS, and not a physical device.
- **Smoke tool:** `D:\anji-tools\webkit-smoke.mjs`. Results are in the Gate C follow-up report.
- **First finding:** the journal tabs measure **43 px** in WebKit and 44 px in Edge. The CSS says `min-height: 40px`, and Edge reached 44 only through font metrics. The fix (`min-height: 44px`) is planned for Phase 1, so it ships with M1 unless the owner wants it sooner as a separate hotfix.
- **Plan:** in Phase 1, the browser tests take a `BROWSER=webkit` switch, so the existing and new suites run on both engines.

### 8.1 Workshop white screen: WebKit evidence (2026-10-29, `main` code, synthetic saves)

**Symptom.** In 2 of 3 multi-page WebKit smoke runs, the page went **completely white and stopped responding** at the husky step, the last page of the run (`D:\anji-tools\shots\webkit\husky-bubble.png`, 5 KB). When this happened, `WebKitGPUProcess`, which had reached about 6 GB, was no longer running. No page error was logged.

**Measurements** (`webkit-white.mjs`, `webkit-mem-control.mjs`, `webkit-alloc.mjs`, `webkit-sprite-images.mjs` in `D:\anji-tools`):

| Run | Graphics-process memory |
|---|---|
| 10 screenshots | +0 MB per step |
| idle 36 s | +0 MB per step |
| **9 scene switches** | **+448 MB per switch** |
| 30 switches in one page | sawtooth: +~470 MB per switch up to ~5.3 GB, then a slow switch (11–13 s) and a drop to ~250 MB, twice; the page survived this run |

**Census per switch:**
- canvases that still hold pixels stay at one scene's worth (92–104, 6.7–15.4 Mpx), so the PR #10 canvas release works;
- about 90 new `<img>` are created per switch, from the sprite rasteriser.

**Isolated tests:**

| Test | Result |
|---|---|
| a bare canvas set to 0×0 | released immediately in WebKit |
| sprite SVG images decoded but **not drawn** | +1 MB per round |
| the game's `rasterize`/`bake` (decode, then `drawImage` onto a canvas) | **+~390 MB per round**, the same with `img.src = ''` |
| the frames **baked once and reused** | stays flat at one set across 10 rounds |

**Conclusion (engine evidence, not device proof).** Re-rasterising every character's sprite frames on every scene entry makes WebKit's graphics memory grow by hundreds of MB per scene switch. That memory is reclaimed only late and in bulk. When the process holding it dies, the page is white and dead.

This is consistent with the white screen Anji saw on her phone. The workshop is the scene where players switch most: map, stairs, back door. This is the Windows WebKit build with software rendering, so the absolute numbers will differ on iOS.

**Fixed and live** in [03gtr/anji#13](https://github.com/03gtr/anji/pull/13): commits `a144e85` and `3767b98`, merged as `3ceacb5` (2026-10-29), deploy run `40894045478`, live bundle `main-D5-S9p4M.js`.
- **Production in WebKit 27.2:** 12 map changes re-baked 0 sprites, and graphics memory stayed flat at 570–614 MB.
- **Old code, same test:** 90–98 re-bakes per change, and memory grew +2049 to +3093 MB in a sawtooth.
- **Limits:** none of this is from a physical iPhone. The white screen on Anji's phone is likely fixed but unconfirmed.

### 8.2 Rendering lifecycle rules Season 2 must follow (after #13)

- **One sprite cache.** Every Season 2 character sprite (new cast: Rabi', Lama, Sabri, Uncle Jojo, Anji's sister) is obtained through `world/sprite-cache.js` (`spriteFrames(kind, cosmetics)`).
  - **Never** call `rasterize` directly from a scene, a minigame or the case board.
  - **Never** add a second cache.
- **New kinds.** Each new kind is added to `frameTable` / `RASTER_HEIGHT` and so becomes one more cached set: one look per kind. The memory bound grows by one set per new kind.
  - **Before M1 ships:** measure the WebKit graphics-process baseline with all M1 kinds baked, using the `sprite-memory.browser` pattern.
  - **Option:** if it becomes significant, add an LRU for kinds that appear in only one place, as a separate reviewed change.
- **Generated ids.** A new kind's SVG must number its generated ids in a form the cache key handles: `id="…"` referenced by `url(#…)` / `href="#…"`. The `sprite-cache` content test ("every look has its own stable key") must be extended to every new kind.
- **Scene memory.** Scenes release their own canvases (`releaseCanvas`) and never release sprite frames.
  - The case board (`ui/caseboard.js`) and new minigames use DOM or their own canvases, and release them on dispose.
  - Every new scene is added to a WebKit transition test: N round trips, 0 re-bakes after warm-up, graphics memory flat.
- **Failures.** A failed bake surfaces through the existing scene-error card. The cache keeps the last good look and retries on «جرّبي مرة ثانية».

