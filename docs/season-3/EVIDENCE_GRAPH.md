# Season 3 — evidence graph

Evidence ids are `s3.ev.<id>`, collected with the effect `ev3:<id>`. The data lives in each mission module
(`src/game/data/s3/m0N-*.js`, `evidence`).

**Reliability** is a card's *state* on the board (`src/game/data/s3/board.js`, `reliability()`). It is never a fixed
label:
- `fact` and `deduction` stay as they are;
- a `claim` starts unverified;
- it becomes **contradicted** when she holds its `contradictedBy`;
- it becomes **disproved** when she holds its `disprovedBy`.

| Id | Mission | Kind | Source | Starts as | Becomes | Needed by |
|---|---|---|---|---|---|---|
| `e-visitor-log` · `e-appointments` · `e-test-schedule` · `e-print-queue` | 01 | records | clinic-records | fact | — | P-01 |
| `e-lama-note` | 01 | Lama's note | lama | fact | — | P-01 |
| `e-sabri-count` | 01 | claim | sabri | claim | disproved by `d-office` | P-01, P-06 (a statement) |
| `e-group-msg` | 01 | his sent message | sabri | fact (it exists, not that it is true) | — | — |
| `d-office` | 01 | deduction | clinic-records | deduction | — | — |
| `e-light-timer` · `e-bakery-hours` | 02 | observations | street | fact | — | P-02 (anchors; Mission 03 sends her back if she walked past them) |
| `e-neighbour-cam` · `e-plate` | 02 | observations | street | fact | — | board threads |
| `e-blip` | 02 | witnessed | anji | fact | — | board threads |
| `e-clip` | 03 | the circulated clip | clip | claim | disproved by `d-two-engines` | P-02, P-09 (a statement) |
| `e-rec-cam` | 03 | recordings | camera | fact | — | P-02, P-06 |
| `e-rec-gate` · `e-rec-lama` | 03 | her recordings | anji | fact | — | P-02 |
| `t-ryan` | 03 | testimony | ryan | claim | — | — |
| `d-two-engines` | 03 | deduction | recordings | deduction | — | P-06, the board's first thread |
| `e-forward-chain` | 04 | phones' metadata | phones | fact | — | P-04 |
| `e-noise-notice` | 04 | document (plate «…٤٧», **no colour**) | municipality | fact | — | P-06, P-09 |
| `e-receipt` | 04 | object (23:20, two streets away) | petrol-station | fact | — | P-06, P-09 |
| `t-jalal` | 04 | testimony («رجعت للبيت ١٠:٣٠») | jalal | claim | contradicted by `e-receipt`; disproved by `d-truth` | P-04, P-06, P-09 (a statement) |
| `d-source` · `d-twisted` | 04 | deductions | phones | deduction | — | P-09 |
| `e-keyring` · `e-tyre-marks` · `e-oil` | 05 | objects | lane | fact | — | P-05, P-06, P-09 |
| `d-second-car` | 05 | deduction | lane | deduction | — | — |
| `d-seven` | 06 | deduction (two independent chains) | board | deduction | — | — |
| `e-original` | 07 | the uncut recording (any road) | original | fact | — | P-09 |
| `e-dashcam` · `e-cctv-log` · `e-sabri-sender` | 07 | the road's own piece (one of them) | original | fact | — | — |
| `d-truth` | 08 | deduction | board | deduction | — | — |

**Independence (P-06).** Two chains are independent when they share no `source`. In «غرفة الحقائق السبعة»:
- the sound chain is `d-two-engines` (recordings) and `e-rec-cam` (camera);
- the paper chain is `e-noise-notice` (municipality), `e-keyring` (lane) and `e-receipt` (petrol-station).

The test computes this from the data, and it also checks that no statement sits in either chain.

**The board's relation table** is the `links` of each module: `[a, relation, b]`, with `contradicts`,
`same-source` and `different-source` symmetric. Every thread names evidence that exists, and the soft-lock validator
accepts a board thread only if it is in this table.
