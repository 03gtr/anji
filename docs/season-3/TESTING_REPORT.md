# Season 3 — testing report

Results of runs that actually happened, newest first. Each line: what ran, where, the exit code, the counts.

| Date | Commit | Suite | Result |
|---|---|---|---|
| 2026-11-01 | `8b0e732` (Season 3 save router) | DOM, all | exit 0 · 59 files · 1943/1943 (the 1927 existing, unchanged, + 16) |
| 2026-11-01 | `8b0e732` | `tests/game/s3-save.test.js` | 16/16 |
| 2026-11-01 | `a2decf3` (production, before any Season 3 change) | DOM, `npx vitest run --exclude "tests/browser/**"` | exit 0 · 58 files · 1927/1927 |

Not yet run for Season 3: browser tests (there is no Season 3 place yet), build, offline.
