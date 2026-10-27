# Story Pack 02 — «أرشيف الأسرار» (The Secret Archives) + mission list / map overhaul

Story Pack 02 is part of the **main story**: it opens after Act IV, runs through Acts
V–VI, and its core chain must be finished before Act VII (the workshop) — so it is
always played **before** the ending. It is not post-game content.

## 1. Audit (what was there)

- **Progress** is flags; acts are lists of objectives (`data/chapters.js`); the HUD
  shows the first unfinished one. Act VII opens through the house stairs
  (`flag:workshop-open`) and the map (`flag:act6-done`); Act VIII through `act7-done`.
- **Story Pack 01** is post-game (`flag:game-complete`). The husky is met there, and
  «بوابة الغد» stands in a post-game place (`roads`).
- **Missions** (`data/missions.js`): stable ids, unlock + steps as conditions, reward
  once via `flag:mission:<id>`. The journal listed them flat, with no numbers,
  filters or map link; the map travelled on tap.
- **Saves**: `SAVE_VERSION` 3; flags may be booleans, numbers or strings.

## 2. Where Story Pack 02 sits

```
Act IV done ──► sp2-archives ──► sp2-maze ──┬──► (Act V done) sp2-letters ──► sp2-gate ──► Act VII
                                            └──► sp2-sequence (optional puzzle)
                (husky met, post-game only) ──► sp2-trail (optional)
```

| # | id | kind | needed for Act VII | opens with |
|---|---|---|---|---|
| ٥·٢ | `sp2-archives` | main | ✔ | `act4-done` |
| ٥·٣ | `sp2-maze` | main | ✔ | the second key |
| ٥·٤ | `sp2-sequence` | puzzle | — | the inner door |
| ٦·٣ | `sp2-letters` | main | ✔ | maze + `act5-done` |
| ٦·٤ | `sp2-gate` | main | ✔ | the letters |
| ✦٩ | `sp2-trail` | side | — | `sp1-husky-met` + the second key |

**The Act VII gate**: `SP2_GATE = { any: ['flag:sp2-done', 'flag:workshop-entered'] }`
on the workshop map node, the house stairs and a new last objective of Act VI.

- *Grandfathering*: any save that has already entered the workshop (mid Act VII,
  Act VIII, finished games) passes the gate. Nobody is sent back, and no ending
  or achievement is removed. Finished players simply see the new missions as
  optional.
- Required puzzles keep the standard skip (after the hints or 3 mistakes), so a
  puzzle can never block the ending. The optional ones are never required.

**Two conflicts with the brief, resolved without touching Story Pack 01**

1. *The husky's trail* needs the husky, who is first met after the ending
   (Story Pack 01). Moving her earlier would rewrite published content. The trail
   is therefore optional and, in practice, post-game. Its marks appear only once
   she has been named.
2. *«بوابة الغد»* stands in a post-game place. Before the ending the archive holds
   its **plan**: its seals light up as missions finish, and finally a crack of
   light with «الباقي… مو هسه». The real gate and the finale are not revealed.

## 3. Missions and puzzles

| Mission | Gameplay | Fairness |
|---|---|---|
| Archives | ledger → 3 marks (house / academy / sanctuary) → `sp2-ledger` deduction (place + 3 marks) → key in the observatory | each mark rules out one place; any two leave ≥2 places (tested); an opinion and an irrelevant note are offered as non-evidence |
| Shifting Maze | `program` with keys 🗝️/🔑 and doors 🚪, 3 levels, command budget shown | shortest routes 4 / 9 / 13 commands (limits 6 / 10 / 14); a locked door is a bump with its own message |
| Sequence Machine | new `series` type: learn the rule from 2 examples, pick the next | +3; ×2; moon cycle; +2 / ×2 alternating (verified against the examples) |
| Missing Letters | 3 fragments (observatory / library / lake) → order by internal references → sort written facts from inferences | one order only; facts are quotable lines, inferences are not |
| Gate of Tomorrow | the plan's three required seals → crack of light → workshop opens | — |
| Husky's Trail | 3 paw marks → `choice`: water + moon + boat | wrong answers explain which condition fails |

All puzzles: 3 graded hints, an explanation after solving, no timers, no luck. Leaving
a puzzle loses nothing, and **multi-stage puzzles resume at the stage reached**
(number flag `pstage:<id>`, cleared on solving). Clues are saved as flags plus
journal entries.

**Clue notebook**: journal → «الدفتر» → «🔎 دفتر الأدلة» (entries with `group: 'clues'`).

## 4. Mission list and map

- `progression/journal-index.js` (pure, tested) builds the list. The 8 acts appear
  as main chapters, alongside every mission.
- **Filters**: الكل · الرئيسية · الجانبية · الألغاز · المكتملة (with counts).
- **Display numbers**: «الفصل ٥» for acts, «٥·٢» for missions, «✦٢» after the ending.
  They come from the chapter plus the append-only order of `data/missions.js`, so
  adding content never renumbers older entries. Ids never change.
- **Status**: locked / available / active / complete. Locked entries say how they
  open without giving solutions; far-future locked entries are shown as «مهمة مخفية».
- **Order**: the current entry first (marked «◀ النشطة الآن», `aria-current`), then
  active, available, locked, finished.
- **«🗺️ على الخريطة»**: the map lights the places still to visit (a step may list
  `{ id, done }` places) and draws the route from where she is (`mapPath`). The panel
  says what to do, how it opens, or that it is done, and offers «روحي لـ…». Tapping
  a place still travels, as before. The pulse respects reduced motion.
- The new map node sits in a free spot so no icon covers a name (checked on
  phone and desktop).

## 5. Saves

No schema change. All new state is additive flags (`sp2-*`, `pstage:*`,
`notice:sp2`), journal ids, one item (`archive-key`) and one optional keepsake.
Tested with constructed saves (mid-story, finished, side missions done):
- each loads unchanged, and reloads idempotently;
- syncing missions only adds, and pays no reward twice across a reload;
- a finished game keeps its ending, and Story Pack 01 keeps working.

**Not tested on Anji's real save.**

## 6. Known limitations

- The husky's trail is effectively post-game (see §2).
- The archive's art is drawn in code on the existing library backdrop; its plan
  and seals are simple shapes.
- The real-browser scroll test now treats "reached the end" as within 1 px of
  `scrollHeight − clientHeight`. A fractional box (720.297 px) puts the true end
  at ≈7826.7, which the wheel reads as 7826; anything further short still fails.
- Verified in headless Edge only (phone 390×844, desktop 1280×720). Not on a
  physical phone, Safari or Firefox.
