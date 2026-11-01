# Season 2: complete release, implementation log

This log covers the owner's "Season 2 Complete Gameplay Release" brief (2026-10-30). It records what was actually done and verified, step by step. Nothing listed here is a plan unless it says so.

> This repository is public. No private nicknames are written here, in code, in dialogue, in tests or in commits.

## Part 1: the state at the start (verified)

- **Working tree:** branch `feature/s2-gameplay-overhaul` in `D:/anji-s2`. The tree is clean and there are no stashes.
- **Local commits on top of `origin/main` `8c44130`:**
  - `20e622e`: Stage B. The s2-08 prototype, the testimony mechanic, the engine's acting features, and discovery hints.
  - `76d025c`: Stage C2. Mission 01 «سر المكتب», `lineKey` (the fix for the dog-counter leak into the original save) and the playtest recorder.
- **Remote:** the overhaul branch has never been pushed. `main` is `8c44130` (M1 is live; bundle `main-CLAOlyQi.js`).
- **Last verified on `76d025c`:**
  - DOM 1496/1496.
  - Browser 51 passed, 1 skipped, and 1 known intermittent: the journal tab is covered (passes 2/2 when run alone).
  - Build `main-B9bExwWW.js`; offline and private audits clean.
- **Checkpoint:** `76d025c`. Every step below is a new commit on top of it.

## Steps

(each step: what changed · why · how it was verified)

### Step 1: the Season 2 help system is removed (functionality, not CSS)

**What changed:**
- **`strict` flag.** Every Season 2 puzzle, M1 and Mission 01, carries it (set in the loop at the end of each data file).
- **`puzzles/host.js` builds none of the help for a `strict` puzzle:**
  - no hint, solution or skip buttons (absent from the DOM) and no handlers;
  - `canSkip` is always false, and the "how hints work" tip is never shown;
  - a wrong try is answered from `STRICT_WRONG`, a few neutral lines shared by every puzzle. Per-option replies, `wrong` lines and the rules' messages (which named counts or hinted) are not used.
- **`puzzles/views.js`, strict puzzles:**
  - choice and series options are never marked wrong or disabled, so nothing narrows a guess;
  - the logic grid never names the broken clue, and its note says so.
- **`ui/testimony.js`:** the hint button, the hint list, their state and the `HINT_LEVELS` import are removed. The score no longer counts hints.
- **`HINT_LEVELS`, `hintStyle: 'discovery'` and their CSS are deleted.** Only Season 2 used them.
- **Data:**
  - all 15 `hints` arrays are deleted from `puzzles-s2.js` and `puzzles-s2-m2.js`, so no hint text remains in the source;
  - all 33 step `hint`s are deleted from `missions-s2.js` and `missions-s2-m2.js`;
  - the journal never renders a step hint for pack `s2`.
- **The original game is unchanged:** its puzzles and steps keep their help, and a test proves it.

**Why:** the brief's non-negotiables 1–4.

**Tests:**
- **Rewritten to the new rule:**
  - "three hints each" became "strict: no hints" in `s2-m1`, `s2-overhaul`, `s2-living`, `narrative-puzzles`, `v2-content` and `v2-puzzles`;
  - the leak scans keep every other text.
- **New `tests/game/s2-no-help.test.js` (6), using real panels in the app:**
  - no help control exists for any Season 2 puzzle, and the hint tip is never shown;
  - wrong tries get neutral lines, with no disabled or marked option;
  - the grid never names a clue; the testimony bar has no help button;
  - the journal shows no Season 2 step hint;
  - the original puzzles still have hints.
- **Browser tests** (`s2-overhaul`, `s2-living`) now assert the help controls are *absent*, and that the testimony bar shows no answer words.

**Verified:**
- DOM: 1497 passed before the new file, and the new file's 6 pass.
- Browser: `s2-overhaul` and `s2-living` 6/6 (Edge 320/390, WebKit 390).

**Commit:** `98bf27a`.

### Step 2: the M1 puzzle audit (guessing and leaks)

**Found:**
- **Guessable choices:**
  - `s2-count` and `s2-wax` were 3-option choices.
  - The "pick" stages of `board-1`, `board-2` and `hands`, and the rubbing question, were 3-option single picks, where the right answer was visibly the long, careful one.
- **Small answer spaces:** `s2-compare` had 5 possible answers and `s2-sort-1` had 16.
- **Positional answer:** `s2-copy`'s answer was always the first claim.
- **Answers given away before the puzzle:**
  - Ryan's tree line said "seven" before she counted.
  - Anji's copy line voiced the compare answer.
  - `s2-wax`'s intro, `wax-intro` and `rabi-2` stated the wax rule.
  - `s2-hands` repeated the paper's feature word for word on the matching card.

**Changed:**
- **`s2-count`:** a three-dial lock: the tree, the register and the copy (13³ settings; none printed).
- **`s2-wax`:** a deduction: one conclusion and two observations (40 pairs, one right).
- **`s2-compare`:** a second stage on the register itself (the torn stub).
- **`s2-copy`:** three or four claims per part, with the false one in a different place each time.
- **`s2-sort-1`:** a fifth card.
- **`s2-hands`:** three features per sample; the decoys share one or two of them.
- **Pick stages and the rubbing question:** now "tick every true statement" (an exact set from 5–6 options), using the new `answers` in the `sort` and `rubbing` rules.
- **Hint-like text removed:** the `why` and `reply` texts were deleted from the data.
- **Leak lines rewritten.**
- **The `lock` view** takes a `labels.submit`.

**Tests:**
- **New `tests/game/s2-fairness.test.js`:**
  - For every Season 2 puzzle, at least 8 possible answers per stage and 20 per puzzle (a blind guess succeeds less than 5% of the time). It prints the measured spaces.
  - No 3-option single picks.
  - A leak scan per puzzle: title, goal, intro, the mission's summary and steps, and every line said before it in the scene that opens it.
- **The M1 rule tests** now check the exact-set behaviour (a subset or a superset is wrong).

### Step 3: `s2-08` back to its shipped shape; Mission 03 «قصص جوجو الثلاث» (`s2-14`); mission modules

**Restored (owner decision §8.2):**
- **From `8c44130`:**
  - M1's lamphouse scene (`scenes/s2.js`, whose only change was the lamphouse);
  - `evidence-s2.js`;
  - the `s2-08` mission (without hints).
- **Dialogue:** `dialogue/s2.js` is the shipped file plus only the Step 2 leak fixes and the leak-free clock lines. Jojo no longer admits the clock in M1; his admission belongs to Mission 03.
- **Save safety:** nothing from Stage B was ever pushed, so no player's save holds its ids.

**Module structure (`src/game/data/m2/`, contract in `docs/season-2/MISSION_MODULES.md`):**
- one file per mission, gathered by the M2 registries;
- `withM2(scene)` extends an existing place. Added cases go first, and each is gated on its own mission.

**Mission 03 (`m2/m03-jojo.js`):**
- **The testimony, three versions:**
  - v1 (oil): broken by the oil can she lifts;
  - v2 ("nine sharp"): broken by the clock from M1;
  - v3 ("not up to the loft in a year"): broken by his logbook.
- **Comedy:** he trips over his own stand while acting v2. The sister walks in at the first break.
- **A new place, the loft (`s2-loft`):**
  - It is dark: a front-drawn mask with soft light pools.
  - She carries the hand lamp up (`hold:s2-lamp`, drawn glowing in her hand) and hangs it on the hook. The logbook and the eighth lantern (ribbon, unburnt wick) appear in its light.
- **His truth:**
  - he forgot the clock;
  - he kept the eighth lantern unlit because Ryan asked him to.
- **Decisions:**
  - `jojo-why` (M1, previously unread) is read by his opening line, with all three cases;
  - `jojo-confront` is made here and read by his later line. The gentle answer gives the hooks map, which Mission 05 will read.

**Engine (additive):**
- dynamic drawings can be `front: true`;
- a held `lamp`/`lantern` is drawn glowing.

**HUD:** a Season 2 place that is not on the map counts as Season 2 for the current objective.

**Graph:**
- `s2-08` is back to its shipped yields.
- `s2-14` needs `t-jojo` and `e-drift`, and yields `e-oilcan`, `e-logbook`, `e-loft` and `t-jojo-true`.
- `s2-17` also needs `e-logbook`.
- `validate-graph`: OK.

**Tests:**
- **`tests/game/s2-overhaul.test.js` became `tests/game/s2-m03.test.js`:**
  - the rule over three versions;
  - staging and reactions;
  - guess rate;
  - no help, and a leak scan;
  - both decision values played through from data, with the original save byte-identical;
  - M1's lamphouse is identical to the shipped one until Mission 03 opens;
  - every decision read (the list of unread ones is down to five).
- **The browser test became `tests/browser/s2-m03.browser.test.js`:** the whole mission by touch in Edge 320/390 and WebKit 390, with screenshots (`D:/anji-tools/shots/m03`).

**Verified:**
- DOM 1554/1554.
- `s2-m03` browser 3/3.
- **The full browser suite** found:
  - **`s2-m1` tests:** they had to follow the redesign (the compare puzzle's second part, the board's tick list).
  - **A real phone bug:** the tap that OPENS a puzzle produced a compatibility click on the option now under the finger, which silently ticked a statement. The puzzle host now ignores a pointer click whose press did not start inside the panel; keyboard clicks still count. Regression tests: DOM, and browser (no box ticked after the opening tap).
  - **The `s2-m1` test helper** used `inline: 'center'` (it scrolls the RTL root sideways) and tapped moving targets. It now taps a still target.
  - **Results after the fixes:**
    - `s2-m1` 9/9, `s2-m03` 3/3, `journal` pass.
    - `s2-living` 3/3 on rerun. One first-walk timeout was seen once, in the same class as the known rare initial-load stall.

**Commit:** `d6317a7`. Build `main-nuBo-D7m.js`; offline and private audits clean; 0 private words in `src/`, `tests/` and `docs/`.

### Parallel: Missions 02, 04, 05 and 06
- **Builders:** four builders were dispatched from `d6317a7`, each in its own worktree and branch (`s2/m02`, `s2/m04`, `s2/m05`, `s2/m06`), with the module contract and a per-mission brief (shared rules plus mission requirements).
- **Unread M1 decisions assigned:**
  - `tree-tease` → Mission 05;
  - `sister-refusal` → Mission 04;
  - `lead` and `jealous-talk` → Mission 06.
- **To be merged and verified here,** one by one.

### Step 4: animation states, cinematic tools, sound, save audit (`99e070a`)
- **Animation (Part 4):**
  - every character resolves every listed state from frames it has (`framesFor`, tested for nine characters × 18 states);
  - the engine adds the motion for run, hide, search, celebrate and carry;
  - new jolts: `nod`, and `rise` (the sister drawing herself up, then a lean-in);
  - the sister's watchful glances; Ryan's looks toward Anji.
  - Ryan has only profile and back art. New gesture art for him was NOT drawn; his personality is carried by motion, glances, steam and nods. This is a stated limit.
- **Cinematics (Part 5):**
  - the `letterbox` and `exit` actions;
  - `world/lighting.js` (`darkness` with flickering pools, and `glow`);
  - set pieces with bars: the printer disaster, and Jojo's last story collapsing.
- **Sound (Part 9):** synthesised, original, silent when sound is off.
  - footsteps (walk and run), landing, paper, the printer jam, a wick, gasp, comic slide, giggle, click;
  - reactions sound by themselves.
- **Save audit (Part 7):**
  - every storage key written during Season 2 play is Season 2's own;
  - a reload after every step of Mission 03 still finishes it, with nothing lost or doubled, and the original save byte-identical;
  - existing coverage: corruption, a newer build, unknown keys, a second tab, an older tab, no storage.
- **Verified:** DOM 1567/1567; browser `s2-m03` 3/3, `s2-living` 3/3.

### Step 5: integration of Missions 02, 04, 05 and 06 (`40f51c4` … `8abf464`)
- **Merged, one by one, each diff reviewed and its tests run first:**
  - Mission 05 (`40f51c4`), Mission 06 (`e905427`), Mission 04 (`01e3e77`);
  - Mission 02 (`665492a`). Its builder was stopped before committing; its work was committed on `s2/m02` as `9a4289e`, its own tests run there (64/64), then merged.
- **Found in integration, and fixed:**
  - **The night's order.** Mission 06's night order contradicted Mission 05's timeline (the card was erased after the lighting, not before the note). Fixed in Mission 06 (`919026e`).
  - **One scene id, two places.** Missions 02 and 04 both named a place `s2-shed`: outside the shed, with the stash, and inside it, with the line of pegs. Mission 04's became `s2-shed-in` (`2e5f722`).
  - **A journal page reused.** Mission 04's page reused `s2-sister`, the page M1's sister mission already gives. That replaced its text, and its own reward was already held. It became `s2-sister-shadow` (`2e5f722`).
  - **Why nothing caught these.** `gather` lets a later module silently replace an earlier one's id. `tests/game/s2-modules.test.js` now checks that every id belongs to one module and not to M1.
  - **Stand-in labels.** Mission 06's stand-in evidence labels (`UPSTREAM`) and the defence bar's `fallback` were dead once the other missions registered their evidence, and their labels were out of date. Removed (`4a56f7c`).
- **The chain:** 01 → 02 → 03 → 04 → 05 → 06, each opening only when the one before it is done (`2262e18`, `2e5f722`).

### Step 6: WebKit, and how a frozen page is caught (`b59a5b6`, `7927408`)
- **What was seen:** Mission 02's WebKit browser test timed out, three times out of three, always at the same step on the first fork.
- **How it was diagnosed:**
  - a heartbeat from the page to the dev server, a channel apart from Playwright's, showed the page's own thread stopping;
  - the frames it painted had fallen from about 16 per second to 3, then to 0.
- **Cause:**
  - the browser tests open the game with `?timer=1`, a development-only loop that draws every 16 ms on a timer;
  - headless WebKit on Windows cannot keep up and its rendering starves until the page hangs;
  - on the game's own animation frames (the loop production uses), WebKit kept painting and played the whole mission.
- **Not a game defect:** production never uses the timer loop (`import.meta.env.DEV` only).
- **Fix:** every Season 2 browser test runs WebKit on animation frames; Edge keeps the timer loop.
- **Mission 02's WebKit test:**
  - has a 1200 s limit (its chase takes 714–797 s at WebKit's headless frame rate);
  - has an always-on watchdog that fails a frozen page in about a minute, naming the last step;
  - was checked by forcing the old loop (`M02_TIMER=1`): it failed after 274 s with the freeze named.

### Step 7: release audit (`cdda8e7`, `8abf464`)
- **Missions 01–06 in one save:** `tests/game/s2-campaign.test.js`.
  - It starts from the state M1 leaves, with nothing set by hand after that.
  - Every decision is taken both ways, every defence answer is a piece she actually holds, and the original save stays byte-identical.
- **Decisions:** `tests/game/s2-decisions.test.js` checks that every value of all 11 decisions is made somewhere and read somewhere. `DECISIONS.md` is the generated audit table.
- **Privacy:**
  - **Fixed:** Mission 06's test guard named the private concept's English words. They are now escapes. Tracked files, the branch's commit messages and the built site are clean.
  - **Open, the owner's decision:**
    - the unpushed commit `e26b742` still holds those words in its version of that test, so pushing the branch as it is would publish them;
    - the two private words are in already-published history (`3b5ae38`, `8d179b0`, both in `origin/main`);
    - neither can change without a history rewrite.
- **Verified:**
  - DOM 1927/1927 (58 files);
  - Season 2 browser 29/29 (M1 9, Mission 01 3, Missions 02–06 5+3+3+3+3), each suite exit 0;
  - the original game's browser suites 37 passed + 1 skipped (the Edge variant of a WebKit-only memory test), exit 0;
  - build `main-BlLUcfpB.js`, offline precache OK (39 files), private audit clean;
  - the graph validator OK.
- **Not measured:** human playtime. Only the automated browser playthroughs were timed.
