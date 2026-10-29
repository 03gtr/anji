# Season 2 — Puzzle Specification

All puzzles run in the existing host (`puzzles/host.js`): goal line, example, hint ladder, solution, skip and resume. Rules are pure functions in `puzzles/rules.js` (`init`, actions, `submit` → `{ state, outcome, message }`) with a solver used by tests and «شوفي الحل».

## 1. Vocabulary: existing rules reused with new reasoning

| Rule (exists) | Season 2 use | Reasoning that is new |
|---|---|---|
| `contradict` | copy vs register (01), copy vs tree (06), the three rumour versions (14) | the "witness" is a *document*, and a sincere statement can be the one that is wrong |
| `arrange` | Sabri's exact sentence (07), the true timeline (13, 24) | order by *corrected* time, not by the times written down |
| `clock` | the garden clock and the lamp change (08) | the clock is "right" by its own rule and wrong by the world's |
| `logicgrid` | handwriting elimination (10), small (3 × 5) | elimination, not identification: the grid answers "not these" |
| `program` | the husky's paw-print tracking (19) | the tracks branch; a dead end returns her to the last fork, with no penalty |
| `cipher` | Ryan's riddle lantern (29) | the key letters are on the pad (existing guard: every cipher solvable from its own pad) |

## 2. New rules (small, pure, each with a solver)

| Rule | Mechanic | Touch input | Fairness guard |
|---|---|---|---|
| `sort` | put cards into 2–3 bins (fact, claim, opinion) | tap a card, then tap a bin. No drag needed; drag is a bonus | each card has a written reason shown after it is solved |
| `rubbing` | rub a pencil over the blank card to reveal the imprint, in strokes over regions | tap or swipe the regions. The reveal order doesn't matter. Reduced motion shows the strokes at once | the imprint glyphs are drawn as shapes; their letters are in the hint text, not colour only |
| `duo` | two actors (husky and Snooky) on two halves of one map. A plate on one side opens a door on the other | two pads, one per actor, switched with a toggle. No simultaneous input needed | the solver proves a solution exists; the state stays the same if she swaps actors mid-way |
| `board` | the case-room board: pin, link, mark and label (see §3) | tap-first: card → column; card → card for a link | `assess()` accepts **every** consistent layout, not one developer layout |

Every new rule gets:
- unit tests for the solver: a solution exists, and it is minimal where relevant;
- unit tests for wrong actions: feedback, no state loss;
- a resume test: stage and draft survive reload;
- a content test: every config is solvable.

## 3. The case board (`board` rule + `progression/casefile.js`)

The board is persistent across the season. It is not a one-off puzzle.

**State, all stored as flags (see the Technical Plan):**
- `s2:pin:<ev>` = `A|B|C|D`, for a pinned card;
- `s2:link:<a>~<b>` = `s` (supports) or `x` (contradicts);
- `s2:mark:<hyp>` = `open|doubt|broken|kept`;
- `s2:label:<ev>` = `fact|claim|opinion`;
- `s2:board` = the stage, 0–4.

**Stages (each opened by a mission):**

| Stage | Opened by | New ability | Columns |
|---|---|---|---|
| 1 | s2-04 | pin; one statement | A, B |
| 2 | s2-11 | link a testimony to evidence | A, B, C |
| 3 | s2-17 | label fact, claim or opinion | A, B, C |
| 4 | s2-25 | mark broken or kept; mark **unresolved** | A, B, C, D |

**Assessment** (pure; returns explanations, never a score):

```
assess(board, evidence) → {
  perHypothesis: { A: { supports: [...], contradictions: [...], knowledge: 'none'|'theory'|'evidence'|'known' } , … },
  inconsistent: [ { ev, hyp, why } ],   // a fact pinned where it cannot fit
  missing:      [ { hyp, kind } ]        // e.g. { hyp: 'A', kind: 'motive' } → «يحتاج سبب»
}
```

**Knowledge levels:**
- `theory`: only claims support it.
- `evidence`: at least one fact supports it.
- `known`: its deduction is solved, and no unanswered contradiction remains.

The UI uses the three labels «عندي نظرية / عندي دليل / أعرف شنو صار».

**Speculation as certainty.** In `s2-15` she may accuse. This sets the decision `s2:dec:accuse`, and an early accusation has consequences:
- the accused is hurt;
- Ryan is embarrassed;
- the `o-apology` repair appears;
- some later lines change tone.

Progress is never blocked: `s2-16` follows either way.

## 4. Hint standard

Every Season 2 puzzle has exactly **three** hints (a content test enforces it):
1. **Attention:** which kind of clue or which area matters.
2. **Relationship:** which pieces to compare.
3. **Strong:** narrows the answer without solving it.

**Rules:**
- **No shame:** hints don't shame. The existing tone, e.g. «ما بيها عيب».
- **Free:** hints cost no story progress.
- **Skip:** the existing «تخطي» skip comes after the hints or 3 mistakes. Skipping records the puzzle as `skipped` and the story continues. The case board can't be skipped, but it can't fail either.
- **Blocked vs wrong:** a puzzle opened without its inputs shows «ناقصچ <نوع الدليل> — دوري ب<المكان>», which is not a wrong-answer message. It is generated from `needs` and the evidence registry, so it can't name an unavailable object.

## 5. Fairness checklist (each is a content test)

- **Solvable:** every puzzle's solver finds a solution from its config.
- **Pads are complete:** every cipher's answer letters are on its pad (the existing guard covers all ciphers).
- **Inputs are available:** every puzzle's inputs (`needs`) are produced by guaranteed prerequisites (`validate-graph`).
- **Hints are valid:** every hint names only objects the player can have seen. This is checked against the world ids in the hint text.
- **Condition atoms are real:** every `seen:` / `got:s2e.` / `flag:s2:` atom used in a condition refers to something the content can produce (the existing seen-key guard, extended).
- **No colour-only clues:** every colour-coded element also has a shape or text label.
- **No sound-only clues:** every sound clue has a text or visual twin.
- **Touch-only play works:** every puzzle can be completed on a 320 px touch view without keyboard, hover or drag (browser test).
