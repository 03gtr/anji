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

---

# Phase 03 — a longer, earned road to the finale

## 7. Gap analysis (what PR #5 had → what Phase 03 adds)

| Area | Before | Phase 03 |
|---|---|---|
| Finale | Act VIII opened with `act7-done` | also needs **«خريطة الغد»** (`SP2_FINAL_GATE`), grandfathered by `final-entered` |
| Long-form challenge | none | «خريطة الغد»: read the stitched map → find 3 inscriptions by matching its icons to the garden map (return visits after Act VII) → infer 3 rules → «الطريق الأخير» (2 levels, keys before doors, tight budget) |
| Optional depth | sequence machine, trail | + «مسار الخبراء» (expert key/door route) |
| Hints | 3 hints, the last often stated the answer | the first hint asks «متأكدة؟» first; last hints explain a reasoning step; answer-revealing hints and replies rewritten (Story Pack 01 cipher and machine too) |
| Husky | met only after the ending | met **before** the ending: a white pup stands in front of the sanctuary post (archive clue 3) and moves once named; Story Pack 01 becomes a reunion for those players |
| Journal | filters, numbers, statuses | + «الأدلة»: facts (with place) vs deductions, unfound only counted, a board to test the theory when all facts are found; finished entries only under «المكتملة»; open main before side |
| Map | focus mode, route | + current objective highlighted by default, ★ story / ◆ side / ✓ done badges, legend, lock reasons, and an overlap-free layout on phone, small phone, landscape and desktop |
| Guidance | toast | «الهدف التالي» card after a mission (one notice, not duplicated) → map focus; when there are several ways on, the card lists the real choices (§15) |
| Revelation | the letters lit the last seal directly | «الافتراض الغلط» between the letters and the gate: one earlier conclusion turns out wrong (§15) |
| Dialogue | tap anywhere | explicit «التالي» (44 px), «تخطي» smaller and secondary |
| Ryan | back view only (by design: "never shows his face") | **profile** when he stands or walks; back view kept for scripted back-turned moments (the embrace, waiting at the gate) |

## 8. Main-story dependency graph (new saves)

```
Act IV ─► Archives (house · academy · sanctuary[pup → name] · observatory)
       ─► Shifting Maze ─► (Act V) Missing Letters (observatory · library · lake)
       ─► «الافتراض الغلط»: coded line ─► the wrong conclusion ─► «بيدين» (archives)
       ─► Gate of Tomorrow plan (seals) ─► Act VII (workshop)
       ─► «خريطة الغد»: map ─► 3 inscriptions (corridor · lake · observatory)
                          ─► rule puzzle ─► final route ─► Act VIII (the hidden garden, the finale)
optional: Sequence Machine · Expert Route · Husky's Trail (garden · meadow · sanctuary)
```

**Finale prerequisites (new saves):** Acts I–VII, Story Pack 02's archive chain
including «الافتراض الغلط» (`sp2-twist-done` → `sp2-done`), and «خريطة الغد»
(`sp2-final-done`). Nothing optional is required.

**Old saves:** in or past the workshop → no archive gate; in or past the hidden
garden → no map gate; finished games keep `game-complete`, their ending, the
post-game packs, and their husky name. Nobody is moved back.

## 9. Puzzle rules and expected solutions (spoilers)

| Puzzle | Rule | Solution |
|---|---|---|
| `sp2-ledger` | each mark excludes one place | observatory + the 3 marks (an opinion and a ribbon note are not evidence) |
| `sp2-shifting-maze` | keys before their doors | 4 / 9 / 13 commands |
| `sp2-sequence` | +3; ×2; moon cycle; +2/×2 alternating | 11, 40, crescent, 24 |
| `sp2-letters-order` | each letter mentions the previous event | rose → lens → stars → plan |
| `sp2-letters-facts` | quotable line = fact | facts: rose before lens, plan after the name |
| `sp2-final-rule` | sum of the previous two; two interleaved rows; moon +2 phases | 15, 27, new moon |
| `sp2-final-route` | keys before doors, the gold key behind another door | 14 and 23 commands (budgets 16 and 25) |
| `sp2-maze-expert` | two keys in the right order | 36 commands (budget 38) |
| `sp2-trail` | water + moon + boat | the moonlit lake |
| `sp2-coded` | two symbols known from Act V's star cipher (♥ = ي, ☾ = ن); the sentence's meaning gives the rest | «بيدين» |
| `sp2-assumption` | the decoded line says the gate does not open by an appointed time | the wrong conclusion: «البوابة تنفتح بيوم مهم» |
| `sp2-two-hands` | what each lock needs: height and reading → Anji; a small gap and a scent → Snooki | high + words → Anji; gap + scent → Snooki |

All are verified by the solver from their start; budgets are within 2 of the
shortest route; without keys every key level is unsolvable (tested).

## 10. Hint policy

Hints are hidden until asked. The **first** tap only asks «متأكدة؟ المسي مرة ثانية»;
the next taps reveal hint 1 (a direction of thought), hint 2 (a relationship
between clues), hint 3 (a key reasoning step, never the answer). «شوفي الحل»
appears only after all hints; skipping stays possible (after the hints or 3
mistakes) so a puzzle never blocks the story. Wrong answers say only what is
needed. Explanations follow the solve. Turning hints off in Settings acts as a
challenge mode.

## 11. Controls

- **Dialogue**: «التالي» completes the line being typed, then advances; hidden
  while a choice is open; Enter/Space do the same. «تخطي» (smaller) fast-forwards
  to the next choice or the end — it never skips a choice. The silent embrace is
  unchanged (no caption, no prompt).
- **Movement audit**: unconsumed presses are dropped every frame, menus disable
  input and release held keys, window blur releases everything — no buffered jump
  after dialogue and no movement continuing under a menu (tested). No change to
  speeds.

## 12. Save compatibility (synthetic saves)

No schema change (`SAVE_VERSION` 3); all new state is additive flags, journal ids
and one keepsake. Tested with seven **synthetic** saves:

1. mid original story;
2. end of Act IV;
3. inside Acts V–VI;
4. already in the workshop;
5. finished game;
6. optional missions done;
7. Story Pack 01 done with a named husky.

For each: it loads unchanged, resumes forward (the HUD act never goes back), and
pays nothing twice across a reload. Export/import keeps everything. **Not tested
on Anji's real save.**

## 13. Length estimate (from mechanics, not playtesting)

Counting only stages that need exploration or reasoning:

| Content | Stages | Estimate |
|---|---|---|
| Archives | 3 location trips, a 3-clue deduction, a return trip | 25–40 min |
| Shifting Maze | 3 planning levels | 10–20 min |
| Missing Letters | 3 trips, 2 puzzles | 20–30 min |
| «الافتراض الغلط» | a cipher, re-reading the letters' conclusions, a two-hands arrangement | 10–20 min |
| «خريطة الغد» | map reading, 3 return visits, 3-level rule puzzle, 2-level route | 30–50 min |
| Optional (sequence, expert route, trail) | — | 30–50 min |

**Total**: roughly **1.75–2.75 hours of new main-story play**, plus 0.5–1 hour of
optional play. This is an estimate, not a measurement, and it is short of
"several hours": reaching that would need more chapters of this kind (see
limitations).

## 14. Known limitations

- **Length target not met:** about 1.75–2.75 h of new main play by estimate; "several
  hours" needs further chapters. No playtest has measured it.
- **No front view for Ryan:** the side-scrolling world never has him walk toward the
  camera, so there is no front walking view. He shows his profile; his face is
  never shown straight on.
- **Pre-finale husky:** players who already finished the main story before this
  update will not see the sanctuary pup scene (their husky comes from Story Pack 01).
- **Bundle size:** the main bundle grew from 528.6 kB to 614.2 kB (166.8 → 188.9 kB
  gzipped) for Story Pack 02 and Phase 03 combined; no new files are precached.
- **Browsers:** verified in headless Edge at 320×640, 390×844, 844×390,
  1280×720 and 1365×768. Not on a physical phone, Safari or Firefox.

## 15. Phase 03b — closing the remaining gaps

**«الافتراض الغلط» (new main mission, chapter 6, between the letters and the gate).**
After the Missing Letters she turns the gate plan over and finds a line in Ryan's
hand: «البوابة ما تنفتح بموعد… تنفتح ـــ», the last word written in symbols.

1. She decodes it with the star cipher from Act V. Two symbols are known; the
   sentence's meaning gives the rest: **«بيدين»** (`sp2-coded`).
2. She compares it with what she concluded from the letters. One conclusion,
   «تنفتح بيوم مهم», is contradicted by the line. She has to pick the one that
   was wrong (`sp2-assumption`).
3. She acts on it: four locks, each needing what only Anji or only Snooki can do
   (`sp2-two-hands`). Then the plan lights and the workshop opens.

Each stage resumes where she stopped. Closing a puzzle keeps the stage, and the
next visit to the plan goes straight back to it. The evidence notebook lists the
coded line and its decoded form as facts, and the wrong conclusion as the deduction.

**Old saves:** a gate opened before this update stays open: «بوابة الغد» is
grandfathered on `sp2-done`. For those saves the revelation is a return visit
to the plan, playable without replaying the gate opening.

**Display numbers:** the mission is appended to the mission list, never inserted,
so existing journal numbers do not change.

**Guidance with several ways on.** When the next step is elsewhere and there is
more than one way on, the «الهدف التالي» card lists the actual choices: each open
place of the current step first (★), then up to two other open missions (★ story /
◆ side), four buttons at most. Each choice opens the map routed to that place. If
the step is right here, no detours are offered. An act counts as one choice,
because its places are the whole chapter. The card now also closes when a menu,
puzzle or minigame opens over it. Before, it could stay on top of a panel and
block its buttons; the visual review caught this.

**Service worker: clean and updated installation (real browser).** The test used a
separate, ephemeral Edge profile and a synthetic save. Two builds were served
from the same origin: A, then B, identical except for the worker version.
Results, all passing (16/16):

- **Clean install:** one cache with all 36 files, and the page is controlled.
- **Waiting update:** the new worker installs and waits. Both caches exist; there
  is no reload, and the world keeps running on version A with the save untouched.
- **Applying it:** settings show «أكو نسخة جديدة» with the update button, and
  applying it reloads once. B then controls the page, only B's cache remains, and
  the save is the same.
- **Offline afterwards:** the title loads and the saved game continues.

This test found a bug present since the first commit. Late `precache-progress`
messages from the new worker switched the status from 'update' back to
'installing', which hid the update button for the rest of that session. It is fixed
in `core/sw-client.js`: a background install never changes the status, only the
first install reports 'installing'. A unit test reproduces the bug (`tests/game/sw-client.test.js`).

## 16. Phase 04 — «الحديقة العميقة»

14 new places on a second map page and four cross-linked investigations, ending in
`dg-done` and planting a second rose with Ryan. Since Phase 05 this is a continuation that
opens **after** the ending (`game-complete`); the finale needs «خريطة الغد» only, as in
Phase 03. The design, the dependency graph, the puzzle validation, save behaviour and the
updated length estimate are in [DEEP_GARDEN.md](DEEP_GARDEN.md); §13's estimate above
covers Story Pack 02 alone.

Phase 04 also removed the remaining automatic hints in this pack:
- wrong-answer replies that pointed at the answer (the ledger, the letters order, the two hands) now only say it does not fit;
- Snooki's «تلميح مجاني» line on the stitched map is gone;
- the ledger's waiting list repeats only what the ledger says (no exact spots).
