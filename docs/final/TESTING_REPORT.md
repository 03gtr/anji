# Testing report — the final update

All the runs below were on the `feature/final-choice` worktree, on a Windows 10 desktop. Every browser was headless and used emulated viewports. **No physical phone was used.**

## DOM suite (Vitest + happy-dom)

**65 files, 2258/2258 passing.** The run used the final tree, after every content and test edit.

New files:

| File | Covers |
|---|---|
| `tests/game/s3-board.test.js` | The board defects B1–B4. Each test fails on the old code (5 of its 10 tests fail before the fix). It also checks that every one of the table's threads can be drawn by touch and survives a reload. |
| `tests/game/guides.test.js` | The three-level guide:<br>• coverage of all 30 strict puzzles;<br>• no leak against each puzzle's own answer;<br>• the real panel: one level per tap, no state change, the hint setting, and the testimony;<br>• every puzzle still solves by its own rules. |
| `tests/game/final-arc.test.js` | The four chapters:<br>• registration and patch gating;<br>• 972 playthroughs, covering every decision combination;<br>• Marius's discovery, which goes step by step;<br>• the `end3:` record, with the first ending never overwritten across two replays;<br>• ending B;<br>• the wording rules: no ceremony, date or promise, no family, no private words;<br>• the guard that the sharp line appears only when earned. |
| `tests/game/s3-play.js` | A shared Season 3 playthrough helper, extracted from `s3-season.test.js`. |

Existing files changed:

- **`s2-no-help.test.js` and `s3-m01.test.js`:** the footer now holds the guide's one button. This follows the owner's new hint rule, and each header says so. Every other "no help" assertion is unchanged.
- **`s3-season.test.js`:** the count of Season 3's own eight missions excludes `arc: 'final'`.
- **`s3-save.test.js`:** `data/guides.js` is on the list of shared, non-saving modules.

## Browser suite (playwright-core: Edge `msedge` and WebKit)

Every file ran sequentially (`--no-file-parallelism`).

**The first full run:** 18 files and 101 tests, with 90 passed, 7 failed and 4 skipped.

**The 7 failures.** None was a game defect.

- **`s2-m03` (3 failures) and `s2-m04` (3 failures):**
  - The old browser assertions said "no «تلميح» anywhere".
  - The owner's brief now asks for the guide.
  - The assertions now say the guide's one button is the only help, closed until she asks.
  - Every answer-word check still runs.
- **`scroll` (1 failure):**
  - The harness gave up after 40 wheels of 400 px, which is 16,000 px.
  - The full journal at 320 × 640 is 16,214 px.
  - The bound is now 80. The test still has to reach the last entry by wheel, End/Home, PageDown and ArrowDown.

**The rerun of those three files:** 16/16 passing.

**The 4 skips are by design:**

- Chapters 01–03 of `final-arc` run in Edge only. WebKit covers Chapter 04, the replay and the board.
- `sprite-memory`'s graphics-memory test is WebKit-only.

**`final-arc.browser.test.js` (new):**

| Test | Engine and view |
|---|---|
| Chapter 01: Marius's question, her answer, his silence, and Ryan's message | Edge 390 |
| Chapter 02: the card, the club, the earned line, her defence and his apology | Edge 320 |
| Chapter 03: the dawn walk, three stops in her order, and Ryan's question | Edge 360 |
| Chapter 04, both endings, and the replay from the journal | Edge 390 and landscape, WebKit 390 |
| The board with the season's full evidence | Edge and WebKit, 320 and 360 |

## Build, offline and privacy

- `npm run build` produced `main-rvfldTH8.js`. `build:private` was never run.
- The offline precache check passed: 38 files.
- `audit-private` was clean: no private art or memories in `dist/`.
- A scan of `dist/` for the private nicknames found 0 hits.
- No new dependency and no remote service or analytics.

## Saves

Synthetic saves and fresh browser profiles only; the owner's real save was never touched.

The final story writes only to Season 3's own document (`snooki-game:s3`). The original save and Season 2's stay byte-identical, which every one of the 972 playthroughs asserts.

## Limitations

- **Headless emulation only:** Edge and WebKit engines at 320, 360 and 390 wide, plus landscape. No physical phone was used.
- **The embrace:** told with poses, blushes and the camera. There is no dedicated hug sprite.
- **Paper evidence:** cards still use the `note` (music) icon. This was observed and left as it was.
