# Phase 04 — «الحديقة العميقة» (The Deep Garden)

Branch `feature/story-pack-02`, on top of Phase 03 / 03b (PR #5). Nothing here is merged or
deployed. `main` and the live site are untouched.

## 0. Phase 05: the deep garden comes AFTER the ending (owner's decision)

The owner chose to keep the published ending exactly as players know it and to make this
expansion a new chapter that opens after it. This section replaces the gate described in §4;
the puzzles, chains and places below are unchanged.

**The published ending, as the code on `main` (`ec671db`) defines it.** The hidden garden opens
on the map with `act7-done`. Entering it sets `final-entered`. The `meet` trigger (`act7-done`
and not `game-complete`) plays the drawing, planting the blue rose (`rose-planted`), one of three
ending lines (`ending-hope` / `ending-memories` / `ending-growing`) and the credits. Then
`a8.ending` sets `game-complete` and `act8-done`. Story Pack 01 opens after `game-complete`.
Story Pack 02 and the deep garden are not on `main`.

**Gate rules now.**
- The hidden garden: `act7-done` AND (`sp2-final-done` OR `final-entered`). This is the Phase 03 gate again; nothing from the deep garden is in it or in any act objective (tested).
- The way in: `DEEP_UNLOCK` = `game-complete` OR `dg-box`.
  - `dg-box` is set only by the box, which shows only with `DEEP_UNLOCK`. So for every real save this means "after the ending".
  - It also keeps a Phase 04 preview save that began the chain before its ending (never published) from being shut out.
- No Story Pack 02 is needed. A finished game from the live site can start straight away.
- Act VII is back to its Phase 03 objectives. The deep missions are post-game (`pack: 'deep'`, no chapter). Their places are `act: 8` on the map's second page.

**How a returning player finds it.** These are three light hooks; none of them forces anything.
- A one-time notice: «أنجي، ريان ترك علبة صغيرة بالورشة… وطلعت فارغة 📦», with «استكشفي هسه» and «بعدين».
  - It is shown after any notice still due. A live save that never saw Story Pack 02 gets the archive notice first, one at a time.
- Ryan in the hidden garden mentions the box until it is opened.
- The journal lists «الليلة الضائعة» as an available post-game mission.

**The new ending of the chain (no ending is rewritten).** The rose in the finale is the first rose. The empty box was for its second seed.
- After the last page (`dg-done`), the hidden garden offers «جنب الوردة الأولى»: a short scene where Anji surprises Ryan with the seed and they plant it.
  - The roles come from the logic grid: Snooki digs, Anji places the seed, Ryan waters, the light together.
  - It sets `dg-planted` and journal `dg-planted`, and draws a second rose next to the first.
- `dg-seed` gained this third step. Missions are recorded complete once (`mission:<id>`), so a preview save that had already finished `dg-seed` stays complete.
- The Phase 04 finale line that assumed the seed came before the ending was removed.

**Wedding: deferred, not shipped.**
- No wedding scene, date, vow or marriage flag exists. This is tested: `tests/game/post-finale.test.js` scans every line, journal entry and mission condition.
- The published promise is kept as it was: Story Pack 01's «وعد» card, and Ryan's «نكمل لأن إحنا الاثنين نريد».
- A future wedding is a separate narrative milestone, earned after more shared story, not a meter to fill.

**Save categories tested** (synthetic saves only, `tests/game/post-finale.test.js` plus the updated `deep-garden.test.js` and `phase-03.test.js`):
- a new game reaching the original ending with no `dg-` flag;
- the live-shaped finished game (no Story Pack 02): it loads unchanged, Acts VII–VIII stay done, the chain opens, plants once, and nothing is paid twice;
- an Act V save mid Story Pack 02, with its puzzle stage kept;
- a save inside the finale (entered, not finished): the ending still plays, the deep garden waits;
- a live save that entered the finale before Story Pack 02 existed;
- a preview save inside the deep garden before its ending (steps and draft kept);
- a preview save that finished the deep garden;
- a named husky: nothing asks for or writes the name.

`SAVE_VERSION` stays 3; every change is additive.

## 1. Baseline audit (from the repository, before Phase 04)

| | Before Phase 04 | After Phase 04 |
|---|---|---|
| Map nodes (`WORLDS`) | 21 (20 playable scenes + the hedge-maze minigame), 21 routes | **35** (34 scenes), 41 routes (5 between pages, used for routing only) |
| Map pages | 1 (4 × 6 grid, 21 of 24 slots used) | 2: «الحديقة» and «الحديقة العميقة» (14 of 24 slots) |
| Missions | 27 (story 11, side 9, puzzle 2, challenge 2, collect 2, arcade 1) | **34** (story 16, side 11, …) |
| Puzzles / rule types | 48 puzzles of 14 types | **62** puzzles of **17** types (`machine`, `contradict`, `logicgrid`) |
| Story acts | 8 | 8 (Act VII gains 5 objectives) |
| Tests | DOM 942 in `tests/game` (22 files, Phase 03b staged) | `npm test`: DOM 1012 in 26 files (971 of them in `tests/game`) + real browser 10/10; SW install/update 16/16; visual review 60/60 |

How the existing systems work (verified in code):

- **Map nodes**: `data/worlds.js` holds `{ id, name, icon, x, y, act, scene, unlock, locked }`.
  - `menus.js openMap` renders the nodes; `check(w.unlock)` decides open/locked.
  - Mission badges (★ ◆ ✓) come from `journalEntries`.
  - Routes are lines only: travel is a tap on any open node, or a scene exit or door (`goto`).
- **Missions**: `data/missions*.js` with `unlock` and `steps[{ done, world, text, hint }]`.
  - Status (locked, available, active, complete) comes from `progression/missions.js`.
  - Display numbers come from the chapter plus the append-only order in `missions.js`.
- **Ending prerequisites**: the world `final` needs `act7-done` and `SP2_FINAL_GATE`.
  - Before Phase 04 that gate was `sp2-final-done` OR `final-entered`.
- **Save**: localStorage `snooki-game:save`, `SAVE_VERSION` 3.
  - `flags` accepts booleans, strings and finite numbers. Saves also hold `journal`, `records` (puzzle results) and `collected`.
  - Puzzle stage resume was already a number flag, `pstage:<id>`.
- **Dialogue**: `ui/dialogue-box.js` has the «التالي» button and a small «تخطي». Objective guidance is `ui/guide.js`.

## 2. What Phase 04 adds

### 2.1 The second map page

- **Pages**: worlds carry `region: 'deep'`. The map shows one page at a time, with tabs that appear only once a deep place is open.
  - It opens on the page of the current target, else the page she is on.
- **Node states**:
  - locked (🔒, with a reason that never gives the answer);
  - open;
  - optional (violet ring);
  - **not visited yet** (a cyan dot; recorded only for deep places, because older saves never recorded visits);
  - mission badges ★ ◆ ✓.
- **Entrances**: deep places entered from the garden are marked «⤒» and have a real door in that garden place.
  - The door has the same unlock condition as the map node.
- **Routes**: lines are drawn only within a page. A test checks that no deep line runs through another place.

### 2.2 Fourteen locations

All have `act: 7` and `pack: 'sp2'`. "Opens when" lists the flag or condition.

| id | Name | Kind | Opens when | Mechanic | Yields | Needs (from) | Leads to |
|---|---|---|---|---|---|---|---|
| `clockgarden` | حديقة الساعات الساكتة | main · entrance (garden) | `sp2-final-done` + empty box | read 4 stopped clocks | 4 times + traces | — | timeline, wheel, bells |
| `letterhall` | قاعة الرسائل | main · entrance (house) | same | **contradict** board (3 witnesses) + **arrange** timeline | who lied, the night in order, strip 1 | bed (house), log (observatory), guest book (workshop), clocks | hypotheses, wheel |
| `falsetrails` | حديقة الآثار الكاذبة | main · entrance (workshop) | same | **deduction**: which trail is real | the real trail | rake, dust, wet, pond clock | pot, hypotheses |
| `sealedroom` | غرفة المرصد المختومة | main · entrance (observatory) | same | **series** of symbol walls (last one is a mirror) | the mirror idea | — | wheel |
| `musicroom` | غرفة الموسيقى المهجورة | optional | `dg-timeline` | **sequence**: bells in the night's order | recording (optional extra evidence) | clock traces | (hypothesis board, optional card) |
| `hyporoom` | غرفة الفرضيات الأربع | main | `dg-trails` | **contradict** with 4 hypotheses: break 3, keep 1 | Snooki's confession + warmth note | the timeline (A), the trail and the pot (D) | roots |
| `starchamber` | قاعة خريطة النجوم | main | `dg-pattern` | **clock**: the star wheel set to "when the seed passed the water" | key letters ق ر | pond clock (A) | mirror |
| `mirrorhouse` | بيت المرايا | main | `dg-wheel` | **cipher** read reversed (mirror) | "moon light", strip 2 | wheel key (B), the heart = ي of earlier ciphers | seasons machine |
| `roots` | سرداب الجذور | main · entrance (conservatory pot) | `dg-hypo` | **program + root gates + wait** (3 levels) | water note | hypotheses (D) | hedge maze, seasons |
| `hedgemaze` | متاهة السياج الدوّارة | main | `dg-roots-maze` | program with gates + keys (2 levels) | — | the beat rule (roots) | bridge |
| `bridge` | الجسر المخفي | main | `dg-hedge` | **machine** (4 planks, conditional bell rope, 4 pulls) | strip 3 | — | forgotten greenhouse, lighthouse |
| `lighthouse` | منارة الذكريات | optional | `dg-bridge` | **switches** (lanterns) | keepsake, a scene with the dogs | — | — |
| `forgottengreen` | البيت الأخضر المنسي | main | `dg-bridge` | **machine** (seasons, 3 levels; hidden target from evidence) | the seed awake, strip 4 | light (B), water (C), warmth (D) | evidence room |
| `evidenceroom` | غرفة الأدلة الأخيرة | main | `dg-awake` | **logicgrid** (8 rules from 4 strips) | the last page → the hidden garden | strips from A, B, C, seed | finale |

Every place:

- has its own scene (a reused painter theme, plus props and drawings from existing helpers; no new image files);
- has an «enter» line said once;
- has a left exit and doors.

Progress is flags and journal entries only. Puzzles resume at their stage (`pstage:`) and keep a draft (`pdraft:`).

### 2.3 The investigations (and how they feed each other)

```
           «خريطة الغد» done ─► the empty seed box (workshop)
                 │
   ┌─────────────┼───────────────┬──────────────────┐
   A night       D hypotheses    B cipher           (optional: bells ◄─ A)
   clocks ─┐     trails          walls (mirror)
   letters ├► timeline ──► board ◄── pot             wheel ◄── A (11:40)
   bed/log ┘         │       │                        │
                     │       └► confession            mirror ◄── wheel letters
                     │           + warmth note ─┐     │  (light)
                     │                          │     │
                     │       C roots ◄── D      │     │
                     │       (water note)       │     │
                     │       hedge → bridge     │     │
                     │                │         │     │
                     └────► strips ───┴─► seasons machine ◄┘
                                           (light B + water C + warmth D)
                                                 │
                                         last page (strips A·B·C·seed)
                                                 │
                                         the hidden garden opens
```

- **Cross-chain discoveries**:
  - The wheel (B) needs the night's timeline (A).
  - The hypothesis board (D) needs the timeline (A) and the pot.
  - The roots (C) open only when D proves where the seed went.
  - The seasons machine needs B (light), C (water) and D (warmth).
  - The last page needs one strip from A, B, C and the seed.
- **Clues that change meaning later**:
  - The white hair on the pond clock first looks like proof against Snooki. It isn't, because a white husky lives in the garden; the cold bed is the proof.
  - The obvious suspect (the peacock) is the one honest witness.
  - Munther lied, but not about the seed.
  - The mirror wall in the sealed room only makes sense in the mirror house.
  - The last page's eight rules are the planting the finale shows: Ryan's line «هاي الوردة ما تنزرع بإيد وحدة» is now earned. An extra finale line plays only if `dg-done`.

### 2.4 Objectives vs. gameplay stages

- **Objectives (go and look)**: the box, the guest book, the clocks, the letters, the bed, the log, the pot, the water note, the trails.
- **Gameplay stages (real reasoning)**:
  - the testimony board;
  - the timeline;
  - the trail deduction;
  - the hypothesis board;
  - the symbol walls;
  - the star wheel;
  - the mirror cipher;
  - the root gates;
  - the hedge maze;
  - the bridge;
  - the seasons machine;
  - the logic grid;
  - (optional) the bells and the lanterns.

## 3. New mechanics, and how they were validated

| Type | What she does | Feedback on a wrong try | Validation (tests/game/deep-garden.test.js) |
|---|---|---|---|
| `machine` | pull levers (free to try, logged), then «شغّلي»; some levers act only in certain states; hidden targets come from evidence; budgets | "it ran, nothing happened"; dials kept | BFS solver; budget = shortest; the conditional lever changes the answer; the hidden target is exactly the three notes |
| `contradict` | for each testimony or hypothesis: the false claim plus the fact that proves it, or «كلها تركب»; only evidence she has found is offered | "this fact does not prove that claim" (no count, no "warmer"); picks kept | truthful witness = none; ambiguous evidence (white hair, lens cap) is not accepted |
| `logicgrid` | assign who and in which order | names the first broken rule, never how many cells are right | exactly 1 solution; removing any one of the 8 rules gives more than one |
| `program` + gates | ☀ opens on odd beats, 🌙 on even; «⏸ انتظري»; numbered beats | "the gate was closed on that beat" | 4 of 5 levels cannot be done without waiting within budget; budgets = shortest +1 at most; older mazes unchanged |

- **Drafts**: a rule type may define `draft.save/load`. The host stores it as a JSON-string flag (`pdraft:<id>`, valid in save v3), restores it on reopen («رجعتي — اللي ضبطتيه محفوظ»), and clears it on solve. An unreadable draft is dropped, never fatal.
- **Hints**:
  - only on request (the first tap asks «متأكدة؟»);
  - three per puzzle (nudge, then which clue, then the explicit answer);
  - the solution view only after all of them.
- **Hint audit of Story Pack 02**:
  - wrong-answer replies that hinted (ledger, letters order, two hands) are now neutral;
  - Snooki's «تلميح مجاني» line is gone;
  - the ledger's waiting list now repeats only what the ledger says (no exact spots).

## 4. Saves and the ending gate (Phase 04 design; superseded by §0)

> Phase 05 moved the deep garden after the ending: the rules below are no longer in force.

- `SP2_FINAL_GATE` = `dg-done` OR `final-entered`.
  - A save that entered the finale keeps it.
  - Each new Act VII objective also counts as done with `final-entered`, so a finished game never shows Act VII reopened.
- A save in the workshop, or at any point before it, plays on through «خريطة الغد» and then the deep garden. Nothing is reset or rewritten.
- `sp2-final-done` is **not** grandfathered for the finale, because «خريطة الغد» never shipped to the live site. Any PR-preview save that finished it meets the deep garden next. This is tested.
- New state is additive only: `dg-*`, `visited:<deep scene>`, `pdraft:*`, and journal ids. `SAVE_VERSION` is unchanged, so no migration is needed.
- Optional places and missions (bells, lighthouse) are never required. This is tested by atoms over every main condition.

## 5. Length (design estimate, not measured)

| Investigation | Distinct challenges | Estimate |
|---|---|---|
| A · الليلة الضائعة | 4 clocks + 3 places to verify + 3-witness board + timeline | 30–50 min |
| D · الفرضيات الأربع | trail deduction + pot + 4-hypothesis board | 25–35 min |
| B · شفرة المرصد | 3 pattern walls + star wheel + mirror cipher | 15–30 min |
| C · طريق الجذور | 3 root levels + 2 hedge levels + 3 bridge levels | 40–75 min |
| البذرة الأخيرة | 3-level seasons machine + 8-rule logic grid | 30–60 min |
| Optional (bells, lighthouse) | 2 | 15–30 min |

- **New main play: roughly 2.3–4.2 hours by design.**
- With Story Pack 02 (1.75–2.75 h), that is about **4–7 hours** of new content beyond the original acts (since Phase 05: Story Pack 02 before the ending, the deep garden after it).
- This is an estimate from the mechanics. Nobody has played it yet.

**How to check it is fun, not repetition** (playtest plan):

- Watch one first-time player per stage.
- Record the time per puzzle and the hint requests (target: under one per puzzle on average).
- Count wrong tries that taught her something versus blind retries.
- Ask whether she can explain *why* the answer is right (proof, not guess).
- Note where she stops playing.
- Expected "aha" points:
  - the honest peacock;
  - the wheel needing the night's hour;
  - reading the mirror backwards;
  - Snooki's confession;
  - the bell rope;
  - the grid turning out to be the finale.

## 6. Known limitations

- The deep places reuse existing painter themes (no new art). Some rooms share a look: the observatory twice, the conservatory twice, the lake twice, the meadow twice.
- Ryan's directional frames are unchanged from Phase 03: a profile in the world, a back view for `view: 'back'`. The side-scroller has no front walking view, and none was invented.
- The bundle grew to 709.1 kB (216.4 kB gzip). It is still one main chunk, as before.
- "Visited" is recorded only for deep places.
