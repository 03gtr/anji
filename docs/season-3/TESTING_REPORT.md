# Season 3 — testing report

Results of runs that actually happened, newest first. Each line: what ran, where, the exit code, the counts.
"Edge" and "WebKit" are headless browser emulation through playwright-core (Edge 156, WebKit 27.2) on Windows, not
physical phones.

| Date | Commit | Suite | Result |
|---|---|---|---|
| 2026-11-02 | Step 3 (the whole season), before its commit | `npm run build` (public) | exit 0 · offline precache OK, 38 files · audit-private clean |
| 2026-11-02 | Step 3 | **every browser test**, sequential (`vitest run tests/browser --no-file-parallelism`): Seasons 1, 2 and 3 | exit 0 · 17 files · 89 passed, 1 skipped (`sprite-memory`'s GPU check runs in WebKit only, by design) · 4452 s |
| 2026-11-01 | Step 3 | `tests/browser/s3-season.browser.test.js` in WebKit 390 | exit 0 · 9/9: the six places, the V8 cinematic, «الصدى» at 320, the board by touch |
| 2026-11-01 | Step 3 | the same file in Edge | 9/9 (after the fixes below) |
| 2026-11-01 | Step 3 | DOM, all (includes the 216-combination playthrough) | exit 0 · 62 files · 2171/2171 |
| 2026-11-01 | Step 3 | cast drawings: the five existing looks, every pose, frame and portrait, against the committed `circle.js` | 180/180 byte-identical (Marius and Jalal are new looks) |
| 2026-11-01 | Step 3 | privacy scan over 431 files and the branch's commit messages | no hits |
| 2026-11-01 | uncommitted (Step 2, on `2ccff72`) | `npm run build` (public; `build:private` is never run) | exit 0 · offline precache OK, 39 files · audit-private clean |
| 2026-11-01 | uncommitted (Step 2) | `tests/browser/s3-m01.browser.test.js`, all views, one run | exit 0 · 5/5 · 329 s: Edge 320, 360, 390, landscape 844×390; WebKit 390 (rAF, no `?timer=1`) |
| 2026-11-01 | uncommitted (Step 2) | DOM, all | exit 0 · 61 files · 1999/1999 |
| 2026-11-01 | uncommitted (Step 2) | `s3-m01` + `s3-restart` + `s3-save` | 40/40 (16 + 8 + 16) |
| 2026-11-01 | uncommitted (Step 2) | privacy scan (both private words, the concept words, secret patterns) over 416 files and the branch's commit messages | no hits |
| 2026-11-01 | `8b0e732` (Season 3 save router) | DOM, all | exit 0 · 59 files · 1943/1943 (the 1927 existing, unchanged, + 16) |
| 2026-11-01 | `8b0e732` | `tests/game/s3-save.test.js` | 16/16 |
| 2026-11-01 | `a2decf3` (production, before any Season 3 change) | DOM, `npx vitest run --exclude "tests/browser/**"` | exit 0 · 58 files · 1927/1927 |

## Failures on the way (Step 2), and what they were

Each one was found by the browser test and fixed at its cause. No assertion was weakened.

- **Edge 320: a tap on Sabri opened Lama.** Sabri's walk to the counter was attached to a line of narration, and the
  tap that finished the line also stopped the walk. He stood at x 575, beside Lama at 590. **Fix (the game):** the
  walk is its own scene step, finished before the line. **Follow-up (the test):** wait for that line before reading,
  since nothing is said while he walks.
- **WebKit 390: a puzzle control measured 43 px.** The panel opens with a pop-in from `scale(0.97)`, and WebKit
  measured during it (44 × 0.97 ≈ 42.7). At rest every control is ≥ 44 px (the CSS minimums are 44 and 50). **Fix
  (the test):** wait for the panel's opening animation to end, then measure the rendered size. It still uses the
  transformed size, so a permanent shrink would fail.
- **HTTP 403 for the fonts** while `node_modules` was a junction into another worktree. The worktree now has its own
  `npm ci` copy.

## Failures on the way (Step 3), and what they were

- **Fairness floor (DOM).** `pick` stages with 4–5 options were under the 8-a-stage floor. The content was changed
  (multi-select stages, or eight options); the floor was not.
- **A colour word in evidence (DOM).** The camera's «أحمر» light was reworded.
- **Edge: her answer to the blip showed `shy`, not the blush.** The blush belonged to the line before and had faded.
  Fix (the game): a «…» beat with the blush before the choice.
- **Edge: two tests timed out at 300 s.** They awaited `ui.puzzle()` and `ui.openJournal()`, which resolve only when
  the panel closes. Fix (the test): open the panel without awaiting it.
- **Screenshots: the waveform hid the distance clue, and the 11:00 click was not drawn.** Fix (the game): mirrored
  strips, and a click marked in the column whose span holds it (tested).

Not run: a physical phone; the live site before the deploy.
