# Season 3 — evidence graph

Evidence ids are `s3.ev.<id>`. **Reliability** is the card's state on the board (§7 of `TECHNICAL_ARCHITECTURE.md`):
`fact` (confirmed), `claim` (unverified statement), `contra` (contradicted by a fact she holds), `hyp` (her hypothesis),
`disproved`. A claim's state changes when the deduction that tests it is made — listed in "becomes". The data form is
`docs/season-3/graph.mjs` (written with each mission; validated like Season 2's: no cycles, nothing needed before it is
yielded, no orphan evidence, every reference registered).

| Id | Mission | Kind | Starts as | Becomes | Needed by |
|---|---|---|---|---|---|
| `e-visitor-log` | 01 | object | fact | — | P-01 |
| `e-appointments` | 01 | document | fact | — | P-01 |
| `e-test-schedule` | 01 | document | fact | — | P-01 |
| `e-print-queue` | 01 | document | fact | — | P-01 |
| `e-lama-note` | 01 | testimony | fact (Lama's first-hand habit note) | — | P-01 |
| `e-sabri-count` | 01 | claim | claim | disproved by `d-office` | P-01 |
| `e-group-msg` | 01 | object (his sent message) | fact (the message exists — not that it is true) | — | 04 (chain start) |
| `d-office` | 01 | deduction | fact | — | 04, 08 |
| `e-light-timer` | 02 | observation | fact | — | P-02 |
| `e-bakery-hours` | 02 | observation | fact | — | P-02 |
| `e-neighbour-cam` | 02 | observation | fact | — | 03 (unlocks `e-rec-cam`), P-04 |
| `e-plate` | 02 | observation | fact | — | 04 (the notice) |
| `e-blip` | 02 | witnessed | fact | — | P-02 |
| `e-clip` | 03 | claim | claim | disproved by `d-two-engines` | P-02 |
| `e-rec-cam` · `e-rec-gate` · `e-rec-lama` | 03 | recordings | fact | — | P-02 |
| `t-ryan` | 03 | testimony | claim («لا تصدّكين كلشي ينقال») | fact after `d-source` | 08 |
| `d-two-engines` | 03 | deduction | fact | — | 04, 06 |
| `e-forward-chain` · `e-caption-edit` | 04 | metadata | fact | — | P-04 |
| `e-noise-notice` | 04 | document | fact (plate «…٤٧», no colour) | — | 05, 06 |
| `e-receipt` | 04 | object | fact (23:20, two streets away) | — | 06 |
| `t-jalal` | 04 | testimony | claim («رجعت للبيت قبل ١٠:٣٠») | contra by `e-receipt`, disproved by `d-seven` | 06 |
| `d-source` | 04 | deduction | fact | — | 06 |
| `e-keyring` · `e-tyre-marks` | 05 | objects | fact | — | P-05 |
| `d-second-car` | 05 | deduction | fact | — | 06 |
| `d-seven` | 06 | deduction (two independent chains) | fact | — | 07, 08 |
| `e-original` | 07 | recording | fact | — | 08 |
| `e-dashcam` · `e-cctv-log` · `e-sabri-sender` | 07 | road pieces | fact | — | (one of them) 07 |
| `d-truth` | 08 | deduction | fact | — | — |

**Independence (P-06).** Each evidence has a `source`: `clinic-records`, `street-observation`, `neighbour-camera`,
`her-phone`, `lama-phone`, `car-club`, `municipality`, `petrol-station`, `snooky`. Two chains are independent when
they share no source.
