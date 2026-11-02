# Puzzle hints — «تلميح» for the seasons' puzzles

This is Priority 3 of the owner's final brief: help that teaches **how** to solve a puzzle, never **what** the answer is.

## What exists

- **The original game (Season 1 and its packs):** unchanged. It keeps its own hint ladder, «شوفي الحل» (show the solution) and skip.
- **Seasons 2 and 3 (the `strict` puzzles, 30 of them):**
  - There is still no solution, no skip, and no answer-revealing reply.
  - New: one optional button, «💡 تلميح ١ من ٣: اتجاه», in the puzzle's footer.
  - Uncle Jojo's testimony gets the same button in its own bar.

## The three levels (per stage)

Each tap opens the next level for the stage she is on. A new stage starts with its own guide, closed.

1. **اتجاه (direction):** where to look, meaning the clue or the relationship that matters.
   > «لا تركزين على الحرف وحده… شوفي الوقت وسبب الزيارة هم.»
2. **تفكير (reasoning):** how to compare two clues.
   > «إذا شخصين يستخدمون نفس الحرف، لازم ترجعين للتوقيت أو نوع المعاملة حتى تفرقين بينهم.»
3. **طريقة (method):** the next logical operation, never its result.
   > «استبعدي الزيارات اللي ما تتوافق ويا الوقت المثبت بدفتر المواعيد، وبعدها راجعي الاحتمالات الباقية.»

## Where the code lives

- **The hint text:** `src/game/data/guides.js`. One file for all of them, so leaks are checked in one place.
- **The panel:** `src/game/puzzles/host.js`.
  - The guide only renders words.
  - It never calls the puzzle's rules and never touches the state or the view.
  - It counts toward `hintsUsed` on the record, as any help does.
  - It is hidden when the hint setting is off.
- **The testimony bar:** `src/game/ui/testimony.js`.

## Tests

| File | What it checks |
|---|---|
| `tests/game/guides.test.js` › coverage | Every strict puzzle has exactly one set per stage, three distinct levels, each a real sentence (≥ 30 characters). Every guide belongs to a season puzzle. |
| `tests/game/guides.test.js` › no leak | Each of the 30 puzzles is read against its own answer (see below). |
| `tests/game/guides.test.js` › real panel | One tap opens one level, and the cards don't move. After three taps the button is disabled. No solution, skip or old-style hint ever appears. Solving stage 1 opens stage 2's own closed guide. The hint setting hides the button. The testimony's guide never picks a line or a piece of evidence. |
| `tests/game/guides.test.js` › puzzles unchanged | Every season puzzle still solves by its own rules. Uniqueness and fairness are still enforced, unchanged, by the season tests. |
| `tests/game/s2-no-help.test.js`, `tests/game/s3-m01.test.js` | Updated for the owner's new rule: the footer holds the guide's button and nothing else. Every other "no help" assertion is unchanged. |

The no-leak check fails a hint if any of these are true:
- it contains a digit;
- it names a correct option, claim, conclusion or piece of evidence;
- it pairs a sort card with its bin;
- it pairs a logic-grid row with its solved value;
- it pairs an arrange piece with its slot;
- it pairs a testimony line with the evidence that breaks it.
