# Investigation board audit (لوحة التحقيق)

Owner's final brief, Priority 0. Audited on branch `feature/final-choice`, starting from `main` at `a1c047a`, before any new story was written.

## How it was audited

- **Code read in full:**
  - `data/s3/board.js` (the rules);
  - `ui/board-s3.js` (the tab);
  - the journal's tab wiring (`ui/menus.js`);
  - the save routing for `s3:link:` flags (`core/game.js`);
  - the board's CSS (`styles/s3.css`).
- **Data probe:** every evidence id, link endpoint, `contradictedBy` and `disprovedBy` target, and case list was checked against the registries.
- **DOM probe:** each of the four Season 3 playthrough plans was played to the end, then on the real board:
  - every thread in the table was drawn by tapping;
  - every converse thread was drawn;
  - a selection was cancelled;
  - the save was reloaded.
- **Browser probe:** Edge at 360 × 780 and 320 × 700, holding the whole season's evidence (35 cards). One card was tapped, then the relation buttons and the reply line were measured.

**Clean (checked, no defect found):**
- Every link endpoint exists.
- No thread is duplicated.
- Every claim's state changes as written.
- Threads, cards and the open board survive a reload.
- Mission 03's thread completes its step at once (`setFlag` commits and syncs Season 3's missions).
- Opening the board writes nothing to the original save or to Season 2's save.

## Confirmed defects

### B1 — Each card's icon filled the whole card; the board was ~10,600 px long

- **Reproduce:**
  1. Finish Season 3 (or hold all of its evidence).
  2. Open the journal's «لوحة التحقيق» tab on a phone (360 px).
  3. Every card is as tall as the screen, with a giant icon.
  4. Tap a card. The relation buttons are 10,650 px further down.
- **Root cause:** `symbol()` returns an `<svg>` with no size of its own. The journal sizes it elsewhere (`.entry-icon svg`), but `.s3-card-head svg` had no rule.
- **Files:** `src/game/styles/s3.css`
- **Fix:** `.s3-card-head svg { width: 26px; height: 26px; flex: none }`
- **Regression test:**
  - `tests/game/s3-board.test.js` › B1: the rule exists and is ≤ 32 px.
  - `tests/browser/final-arc.browser.test.js` › board at 320: every card icon ≤ 32 px in Edge and WebKit.

### B2 — The relation buttons and the reply were below every card

- **Reproduce:** with any sizeable hand of evidence, tap a card. The step you need next («نوع الخيط») and the answer to your thread («🧵…» or the neutral line) are off screen. Tapping the second card gives no visible feedback.
- **Root cause:** the markup order was cards, then relations, then reply, inside one scrolling panel, and focus moved with `preventScroll`.
- **Files:**
  - `src/game/ui/board-s3.js` (the bar wrapper);
  - `src/game/styles/s3.css` (`.s3-board-bar`: sticky at the foot of the panel, opaque, two rows of three on a phone, every button ≥ 44 px).
- **Fix:** the relation buttons and the reply are one bar at the foot of the panel, always on screen. The look and the tap-card → tap-relation → tap-card model are unchanged.
- **Regression test:**
  - `s3-board.test.js` › B2: one bar, sticky.
  - Browser › board at 320: after tapping the first card where it lies, the buttons and the reply are inside the viewport and the buttons are enabled.

### B3 — Correct threads were refused when drawn from the other end

- **Reproduce:** hold «محركين، مو واحد» and «دوام المخبز».
  - Draw «محركين، مو واحد — يعتمد على — دوام المخبز». It is refused, although the table says «دوام المخبز — يثبت — محركين».
  - Yet for one pair («منين بدا المقطع» / «رسائل المقطع») both forms were accepted, because the table listed it twice.
  - At the end of every plan, 14 logically correct threads were refused.
- **Root cause:** `linkHolds` matched only the exact `[a, rel, b]` the table names. «يثبت» and «يعتمد على» are converses for a conclusion, and the table named each such thread once, in either form.
- **Files:**
  - `src/game/data/s3/board.js` (`linkMatch`: the direct match, or the converse when the depending end is a deduction);
  - `src/game/ui/board-s3.js` (stores the table's own thread, so one thread never gets two flags).
- **Fix:**
  - «A يعتمد على B» ≡ «B يثبت A» when A is a deduction: 11 threads are now accepted.
  - Between two facts, «يثبت» is corroboration, not dependence, so it is still refused: «إنذار البلدية يعتمد على الميدالية».
  - Saved flags are unchanged: a thread is kept under the table's spelling, so older saves read the same.
- **Regression test:** `s3-board.test.js` › B3:
  - every conclusion's converse is accepted;
  - no fact-to-fact converse is accepted;
  - the real board keeps exactly one flag, the table's.

### B4 — Once a relation was chosen, the chosen card could not be let go

- **Reproduce:** tap a card, then a relation, then the same card again. Nothing happens, and the card stays selected. The only way out was to tap another card, which is an attempt and gets a "wrong" line.
- **Root cause:** the click handler had no branch for "same card with a relation chosen".
- **Files:** `src/game/ui/board-s3.js`. The instruction line now says so: «لمسة ثانية على نفس الدليل تتركه».
- **Fix:** tapping the chosen card always lets it go: selection and relation are cleared, nothing is kept, nothing is said.
- **Regression test:** `s3-board.test.js` › B4.

**All four regression tests fail on the pre-fix code** (stash run: 5 of 10 failed, namely the five defect checks). All pass on the fix.

## Observed, not changed

- The `note` icon is a musical note and is used for paper evidence (for example «سجل الزوار»). The icon set is shared by all three seasons, and changing it would alter Seasons 1 and 2. It is cosmetic, so it was left as is.
- `CASE_S3` (case lists per mission) is built but not read by any screen. The board shows every held card instead, so nothing is missing for the player.
- The road-specific originals are on the board only for the road she took: «كاميرا صاحب ماريوس», «سجل كاميرا الجيران», «نسخة صبري الأولى». No thread uses them, so no thread is impossible.
