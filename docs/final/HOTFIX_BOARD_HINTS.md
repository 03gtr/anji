# Hotfix: the investigation board removed, mission hints added

This is the owner's quick correction to the live game. It adds no story and changes no season's content beyond the one step described below.

## 1. «لوحة التحقيق» removed

**What was removed:**

- **The journal tab:** it opened in Season 3, Mission 03. No save shows it now, including saves that drew threads on it. A request for the tab opens the notes instead.
- **The board's screen and controls:** `src/game/ui/board-s3.js`, with its cards, relation buttons, threads and reply line, and its styles in `styles/s3.css`.
- **The board's rules:** `src/game/data/s3/board.js` and the relation tables (`links`) in Season 3's mission modules (`LINKS_S3`).
- **The cork board in her room as a control:** it no longer opens anything. It is still drawn, with the papers pinned once the recordings are solved.

**What stays:**

- every piece of evidence (`EVIDENCE_S3`);
- every decision;
- Season 3's notebook pages;
- all dialogue;
- every mission and its completion flags.

Season 3's findings are still read in the notebook pages («الدفتر») and presented inside the puzzles and the defence. The same holds for Season 2, which never had an evidence list in the journal.

Season 1's academy puzzle, also titled «لوحة التحقيق», is a puzzle in a place, not a journal tab. It is unchanged.

## How progression was kept

I traced every condition in the game: mission steps, unlocks, and scene actors, interactables, cases and triggers. **Only one step waited for the board:** Season 3, Mission 03, step 4, «على لوحة التحقيق: اربطي المقطع بالشي اللي يكذبه».

The new step is **«گولي لماريوس شنو طلع بالتسجيلات»**.

- **The scene:** Marius is already in her room. After the recordings are solved, talking to him plays a short exchange built on the evidence she holds: the clip says one thing, the recordings prove two engines, so the caption lied. Then the mission completes.
- **Saves from before the update:**
  - one that had drawn the thread keeps the step done (`{ any: [told, the old thread flag] }`), and Marius does not repeat the telling;
  - one that had only solved the recordings ends with Marius;
  - nothing is reset, migrated or deleted.

## 2. «تلميح» inside the missions

**Coverage, audited from the data:**

- the original story's 40 chapter objectives;
- Season 2's 17 missions (57 steps);
- Season 3's 8 missions and the final story's 4 chapters (36 steps together);
- the original game's side missions and story packs, whose steps already had hints (104 steps).

Every step now has one. `tests/game/mission-hints.test.js` fails if any step is left without a hint.

**Where it shows:**

- **The play screen:** a «💡 تلميح» pill under the HUD. Tapping it shows the current step's words in a card; another tap, or a tap on the card, closes it.
  - When the step changes, the card closes and holds the new step's words.
  - It is hidden when the hint setting is off.
  - It is at least 44 px tall, in the game's gold-on-navy style.
- **The journal:** the mission card's «💡 تلميح» shows the same words. Season 2 now gets it too.

**What a hint says:** the place, the person or the thing to touch, and the kind of thinking a puzzle wants.

**What a hint never does:**

- name an answer;
- contain a digit;
- choose, place or skip anything;
- change any state.

One of the original game's hints contained a digit (a 24-hour clock remark); it was reworded without the number.

The words live in `src/game/data/mission-hints.js`. A step's own `hint` comes first.

## Tests

| File | What it checks |
|---|---|
| `tests/game/board-removed.test.js` | The screen and the rules are gone. No condition reads a board-only flag, except Mission 03's kept alternative. A new save ends Mission 03 with Marius. An older save, threads drawn or not, stays complete or completes, with nothing lost. A journal with the old flags has every other tab and none of the board, and opening it writes nothing. |
| `tests/game/mission-hints.test.js` | Every step has a hint. No hint has a digit, and none names what the step's puzzles accept as their answer. The objective carries the hint. The real HUD button shows the words, touches no byte of any save, follows the step, and respects the setting. The journal shows the same words. The touch target is at least 44 px. |
| `tests/browser/s3-season.browser.test.js`, `tests/browser/final-arc.browser.test.js` | In Edge and WebKit: Mission 03 is finished by touch through Marius, and the hint is on screen at 320, 360 and 390 wide, clear of the HUD. The journal has no board tab. |
| Updated | `s3-season` and `s3-play` play Season 3 through Marius. `s2-no-help` now expects Season 2's journal hints (the owner's new rule). Five objective tests expect the new `hint` field. `v2-content` knows the old thread flag is only read. |
