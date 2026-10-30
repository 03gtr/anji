# Season 2 — Test Plan and Release Gates

## 1. Baseline (Gate A)

| | Value |
|---|---|
| Last full run, `main` `ca13094` (in the previous session, not re-run for this design) | `npm test`: 1190 DOM tests (36 files) and 34 browser tests (7 files, run one file at a time) |
| Live | `main-BB8Hqur-.js`; CI was green |
| Browser tooling | `playwright-core` with Microsoft Edge (Chromium), headless; Vite in-process; `hasTouch` / CDP touch |
| Available since Gate C | Playwright **WebKit 27.2** (engine on Windows): engine testing only |
| Not available | Safari on iOS/macOS, Firefox, a physical phone |

Every report says which kind of evidence it rests on:
- **automated (DOM):** happy-dom unit and integration tests;
- **local browser:** headless Edge against the dev server or a production build;
- **production smoke:** the live site with synthetic saves in a fresh profile;
- **physical device:** a real phone. **None so far.** It is never claimed without it.

## 2. Unit tests (`tests/game/s2-*.test.js`)

- **Mission prerequisites:**
  - every mission is locked until its `requires` are met, and active after;
  - `any 3 of 5` works with every combination (10 combinations);
  - Act IV explains the missing husky.
- **Evidence:**
  - collecting is idempotent;
  - no duplicates after a repeated action or a reload;
  - every evidence id in the content is in the registry, and the reverse.
- **Graph:** the real data passes the `validate-graph` checks (cycles, unreachable missions, impossible prerequisites, orphaned evidence).
- **Hypothesis evaluation:**
  - `assess()` accepts every consistent layout and flags inconsistent facts;
  - the knowledge levels are correct;
  - an early accusation never blocks.
- **Dialogue branching:**
  - every decision value leads on to the next required step;
  - no choice is offered twice;
  - a reload between the choice and its reply plays the reply once.
- **Jealousy classification:** the full table, plus these invariants:
  - greeting → `none`;
  - professional → `focus`;
  - no physical or threatening reaction exists;
  - `none` is always allowed;
  - refusing affection has the same progress path.
- **Companions:**
  - ownership per scene type;
  - one leader each;
  - `{husky}` is never hardcoded.
- **Save:**
  - `case-state` rejects unknown keys and values, and defaults on malformed data;
  - an old **v3** save from the live game loads unchanged;
  - an **old client** loading a Season 2 save keeps every `s2:` flag (the deployed `normalize` is run on Season 2 fixtures);
  - a `future` save is kept read-only, never reset.
- **Puzzles:** `sort`, `rubbing`, `duo` and `board`. For each: solver, wrong actions, resume, solvable configs, every cipher solvable from its pad, exactly 3 hints.
- **Journal:** every `s2-*` entry is added by the action that completes its step.
- **Wedding guard:** extend `post-finale.test.js` to scan every Season 2 line, journal entry, mission and condition.
- **Write set:** a scripted Season 2 run changes nothing outside the allowed set (Technical Plan §1).

## 2a. Save compatibility and write isolation: the exact tests (requirements A and B)

**Exists now, passing (8/8):** `tests/game/s2-compat-baseline.test.js`, run against the frozen deployed client.
1. The frozen copy is the released code (SHA-256 of `save.js` and `game.js`).
2. Load, save, every `game` method, export, import and new game touch only the client's own three keys. The `snooki-game:s2` document stays byte-identical, and the client never enumerates or clears storage.
3. Corrupt-save and reset paths also stay on those three keys.
4. Importing a new-format export (with `s2`) restores the main save and ignores `s2`.
5. Unknown top-level main-save fields (`rev`, `s2`) are dropped on re-save.
6. Unknown string and number flags survive a re-save.
7. A higher main `SAVE_VERSION` → reset; the progress survives only in `:broken`.
8. A stale tab overwrites another tab's newer progress (main save, then backup), and the `s2` key is untouched throughout.

**Phase 1, written before the code they test (each must fail on today's code, then pass):**

| File | Test |
|---|---|
| `s2-store.test.js` | new document; save/load round trip; backup on write; a corrupt primary recovers from the backup; **a future `v` is read-only** (no write reaches the key or the backup, the message is shown); **unknown keys are preserved** (M1 code + M3 document + a save → every key kept); owner mismatch moves the document to `:previous` (never deleted); bounded size |
| `s2-tabs.test.js` | two new-build tabs: the second writer sees the newer `rev` → no overwrite, read-only + reload prompt; holds for **both** documents; a `storage` event triggers the same |
| `s2-older-tab.test.js` | the new build writes progress; the **frozen deployed client** (stale tab) writes over the main save; the new build reloads → detects the overwrite through the shadow → offers to restore; «رجّعي الأحدث» restores every lost flag, collected item and journal entry; «خليها» keeps the main save; **both** copies stay on disk (`:alt`); the `s2` document is intact. Also: the old client loads a new-build main save (with `rev`) → plays normally |
| `s2-older-tab.test.js` | **rollback**: the main save and `s2` document written by M2, then loaded by M1 code → nothing lost, written back unchanged; loaded by the frozen deployed client → the main save loads, `s2` untouched |
| `s2-isolation.test.js` | every Season 2 operation (list in Technical Plan §3) → `snooki-game:save`, `:backup`, `settings` and `memories` byte-identical; a scripted M1 run → Season 1 flags, collected items, journal, records, endings, garden, gifts and cosmetics deep-equal to the snapshot; `isS2()` routing table over every id in the content |
| `s2-export.test.js` | export with `s2` → import into the new build restores both; import into the frozen client restores the main save only, with no error |
| browser `s2-save.browser.test.js` | Edge + WebKit: play s2-01 → main-save string unchanged; a second page of the same profile, as a second tab, gets the read-only prompt; a reload resumes the Season 2 location |

## 3. Integration (scripted, DOM)

1. Start from a synthetic finished save.
2. The Season 2 notice appears, and the map page appears.
3. Complete s2-01, then leave mid-s2-02 and reload. The lantern taps, evidence and stage are kept.
4. Unlock the witnesses, and do them in the reverse order.
5. Do s2-10 with exactly 3 samples.
6. Board stages 1 and 2.
7. Make an early accusation, then apologise, then continue.
8. The Act IV routes in both orders.
9. Board stage 4.
10. Each `sister-card` value leads to s2-29 and s2-30.
11. Post-game unlocks.
12. The original endings are still replayable from their saves.

## 4. Browser tests (`tests/browser/s2-*.browser.test.js`, headless Edge, real input)

- Taps on the canvas (using `world.toScreen`) and on DOM controls; touch through `hasTouch` and CDP.
- Keyboard for desktop.
- Dialogue «التالي»; choices.
- Puzzle failure and success through real taps.
- Scene transitions; reload and resume.
- Viewports: **320, 360 and 390 portrait; 844 × 390 landscape; 1280 desktop**.
- The board's columns, tabs and cards are inside the viewport, at least 44 × 44, and tappable (bounding boxes, the journal test pattern).
- Journal tabs still all visible (existing test).
- Bubbles stay on screen (existing).
- Error recovery: a forced chunk failure → the recovery card → retry works.

## 5. Critical regression cases (directive §19.4) → where each is tested

| # | Case | Test |
|---|---|---|
| 1 | Original-season save loads | `save.test`, `post-finale.test` (+ s2 fixtures) |
| 2 | Original endings accessible | `ending-recovery.test`, `ending.browser.test` (existing) |
| 3 | Season 2 doesn't overwrite the original | write-set test (s2-state) |
| 4 | Husky name persists | `s2-companions.test` (+ existing `team-us.test`) |
| 5 | Snooky stays with Ryan | `dog-ownership.test` (+ s2 scenes) |
| 6 | Husky stays with Anji | same |
| 7 | Both dogs cooperate without confusion | `duo` rule tests + `s2-companions` |
| 8 | Greeting → no jealousy | `s2-social.test` |
| 9 | Professional → no jealousy | `s2-social.test` |
| 10 | Compliment → several valid reactions | `s2-social.test` (table) |
| 11 | Repeated flirtation → a different, not forced, reaction | `s2-social.test` |
| 12 | Anji's boundary doesn't cost progress | `s2-branches.test` |
| 13 | Refusing a kiss or reassurance doesn't softlock | `s2-branches.test` + integration |
| 14 | Missing evidence is explained | `s2-casefile.test` (`missingFor`) + browser |
| 15 | No impossible False Threads gate (and the Deep Garden’s False Trails stays fixed) | graph test + `s2-content` + `false-trails.test` (existing) |
| 16 | Journal = mission state | `s2-content.test` |
| 17 | Solved puzzle stays solved after reload | resume tests + browser |
| 18 | Interrupted scene recovers | browser (reload mid-scene, forced error) |
| 19 | Controls usable on narrow screens | browser bounding-box tests |
| 20 | No private or nonexistent assets | `audit-private` (build) + content asset check |

## 5a. Duration: estimates vs. measurements (requirement C)

| | Main | Optional | Source |
|---|---|---|---|
| **Estimate** (designed active time, `validate-graph`) | M1 5.4–7.3 h · M2 5.2–6.8 h · M3 4.5–6.0 h = **15.1–20.1 h** | 2.8–4.9 h | sum of each mission's designed activity (exploration, puzzle, dialogue), not reading speed |
| **Measured** | **none yet** | **none yet** | — |

- **The target is not claimed.** The directive's 20–30 h target is *not* claimed. On current estimates it is reached only with the optional content, and only at the slow end.
- **Measurement protocol, per milestone:**
  - **Scripted runs:** the "fast path" and "with every hint" runs (wall-clock) are recorded as lower and upper bounds of mechanical time. They are **not** player time.
  - **Player time:** only a real playtest by the owner or another player is reported as player time. The game's own `playMs` counter (already saved) gives it. Reported separately, with the number of sessions.
- **Content-density guards** (content tests):
  - no mission without at least one of: new evidence, new mechanic, new deduction, or a relationship or decision beat;
  - no repeated puzzle config;
  - no timer or cooldown gating progress;
  - no step that only asks her to walk somewhere already visited without something new there;
  - every dialogue is skippable or advanceable (existing «التالي» / «تخطي»).

## 6. Gates

| Gate | Passes when |
|---|---|
| **C (now)** | the owner approves the design and answers the blocking questions |
| D, each phase | the phase's exit evidence (Technical Plan §8) + `npm test` green on the branch |
| E | full `npm test` + the Season 2 browser suite + `npm run build` (offline + private audit) + a manual walkthrough in a local preview, with screenshots at 320, 390 and desktop |
| F, per milestone | release-candidate report (branch, commit, build result, test counts, known limits). **Wait for explicit approval.** Only then: PR → merge → the deploy run succeeds → the live bundle matches the build → production smoke with synthetic saves |

**Flaky tests:** investigated and documented, never skipped or loosened.
