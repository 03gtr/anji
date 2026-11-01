# Season 2 Gameplay Overhaul: Stage A (Audit and Design)

Status: **proposal for owner review.** Nothing in this document is implemented. Stage B starts only after the owner approves it.

This document is about the M1 that is live now (main `8c44130`, bundle `main-CLAOlyQi.js`). All file references are against that code.

> This repository is public. The sister's visual concept follows the owner's private brief. Neither the concept's name nor any real-world nickname is written in this repository, in game text or in the code. The existing hashed guard in `tests/game/s2-m1.test.js` stays in place.

---

## 1. Audit: what the code does today

### 1.1 Length

- **The planned length was never met.** The catalog estimated M1 at 5.4–7.3 h (`SEASON_2_MISSION_CATALOG.md:11`).
- **What a full play contains:**
  - **Taps:** 31 taps in the world (the test's scripted player, `s2-m1.test.js:348-406`), plus about 80 inside puzzles.
  - **Reading:** about 156 dialogue and text screens on the critical path.
- **Estimated time: 13–18 minutes.** This is an estimate (at 3 s per screen), not a measurement. It agrees with the owner's report of about 15 minutes.

### 1.2 Hints and puzzle text that give the answer away

Every Season 2 puzzle (`puzzles-s2.js`) has 3 hints, and **hint 3 states the answer**. Examples:

| Puzzle | Hint 3 | Where |
|---|---|---|
| `s2-count` | «سبعة…» | :61 |
| `s2-clock` | «١٠:٤٠» | :219 |
| `s2-sentence` | the full sentence | :206 |
| `s2-sort-1` | every card placement | :91 |

After hint 3, three more things let her through without reasoning:
- **A "show solution" button** highlights the answer in every view (`host.js:105`, `views.js:54,390,596,613`).
- **Skip** opens after 3 mistakes, or after just 1 when hints are turned off, and **still gives the full reward** (`host.js:25-29,125`).
- **Free retries:** a mistake only lowers the score (`host.js:120`).

**The story text answers most puzzles before they open:**

| Puzzle | Where the answer is given | File |
|---|---|---|
| compare | «ثمانية؟ السجل وگف على سبعة» | `dialogue/s2.js:30` |
| wax | Rabi's line | `dialogue/s2.js:186-189` |
| sentence | Sabri's line | `dialogue/s2.js:216` |
| clock | the intro gives the rule and the start time, so the answer is one tap away | `puzzles-s2.js:217-218` |
| hands | the intro quotes the matching card note word for word | `puzzles-s2.js:259` vs `:274` |

Before a mission even starts, its reward text («الجايزة») is shown in the journal. Some of those texts contain the answer, for example «سبع فوانيس» (`menus.js:432`, `missions-s2.js:78,201,243`).

**Puzzles that can be guessed or hill-climbed:**
- **Guessable:**
  - **3-option choices disable each wrong option** (`views.js:61`), so they are solved in at most 3 taps: `s2-count`, `s2-wax`, and the last question of rubbing, board-1, hands and board-2.
  - **`s2-copy`'s answer is always the first claim** in all 3 stages (`puzzles-s2.js:170-172`).
- **Hill-climbable:** the sort and arrange puzzles answer each attempt with "N of M are right" (`rules.js:291,598`), so they can be solved by trial.

### 1.3 Interactions are mostly reading

The 7 scenes have 28 interactables:

| Kind | Count | Notes |
|---|---|---|
| Tap to collect | 11 | |
| Talk, and get progress just for listening | 7 | |
| Host a puzzle | 9 | 11 puzzles in total |
| Flavour only | 4 | Ryan in two scenes; the notice twice, and its flag is never read |
| Travel | 1 | |

**Where the 23 evidence items come from:**
- 6 by a single tap;
- 9 just by reading dialogue;
- 8 by solving a puzzle.

**Every witness mission has the same shape:** talk (and receive the testimony for free), then one puzzle at the next object (`scenes/s2.js:274-446`).

**Choices change nothing:**
- **Never read:** 7 decisions are written and never read again: `dec:lead`, `tree-tease`, `sabri`, `jojo-why`, `sister-refusal`, `jealous-talk`, and `rel:talk`/`rel:rivalry` (verified with `dec-refs`).
- **The one exception:** `rabi-reply`, which shapes Ryan's next reaction inside that same conversation (`social.js:45`).

**There is no real exploration:**
- every scene is one walkable line;
- the journal step hints name the exact object to tap;
- the map unlocks all four witness places at once (`worlds.js:68-71`).

### 1.4 Characters stand still

- **No staging at all:** the Season 2 scenes use no `move`, `pose`, `emote`, `bubble`, `face`, `camera` or `spawn` actions. The grep matches are scene starting positions, not actions.
- **Every human stands still** with a 2-frame breathing loop, facing a fixed direction, and never turns towards Anji.
- **Each circle character** (rabi, lama, sabri, jojo, sister) has only idle×2 and walk×6 frames (`sprites.js:120-127`).
- **Expressions exist only in the dialogue portraits.** `personSprite` already accepts an `expr` value with 6 faces (`circle.js:28,61-89`), but `frameTable` never passes it, so every face in the world is neutral.
- **Ryan's jealousy "cartoon" is narrator text only** (`dialogue/s2.js:345-350`).
- **Only the dogs react to taps** (`engine.js:438-457`).

### 1.5 What the engine already supports (to be reused)

- **Actions:**
  - several actors can move at once (`move … async`);
  - face, pose, emote, bubble, camera targets, spawn and despawn (`engine.js:272-396`);
  - the world keeps updating while a dialogue is open (`explore.js:105-114`).
- **Rendering:** sprites are SVG frames baked once per look (`sprites.js` → `sprite-cache.js`).
  - **Cheap to add:** new poses or faces on the shared circle body. One pose function gives all five circle characters the pose.
  - **Free in memory:** effects drawn at runtime, such as hop, squash, shake, tilt, sway and particles.
  - **Rules to follow (Technical Plan §8.2):** use only `spriteFrames`; one look per kind; get a WebKit memory baseline for any new kind.

### 1.6 Conflicts with earlier approved design (decided by the owner, 2026-10-30)

- **Jojo:** an embellishing storyteller. He lies and changes his story for harmless reasons (covering his own embarrassment, protecting a surprise), never out of malice, and only evidence exposes him. This replaces the Gate C "truthful" rule.
- **Sabri:** Ryan and Anji's relationship is **private at work**. Sabri's innocent slips reveal it to the workplace, through comedy, embarrassment and Lama's reaction.
- **Existing players:** missions already finished stay finished, and nothing is lost. The new gameplay reaches those players through optional "case reopened" encounters and M2. This is §6, option "Recommended".
- **Stage B approved:** the s2-08 prototype (§7). Skip and "show solution" are removed from Season 2 story puzzles.

The table below is kept for the record.

| Topic | Approved at Gate C (`STORY_BIBLE.md`) | New brief |
|---|---|---|
| Uncle Jojo | Precise and truthful. Declining to testify never implies guilt (:138-142). | A deliberate source of misleading, changing and contradictory accounts. |
| Sabri | Passed on accurate words about Ryan's **surprise** (:57, :134-136). Ryan and Anji are assumed to be an open couple. | Accidentally exposes Ryan and Anji's **relationship**. |
| The sister | Plain palette (`circle.js:25`). No label or nickname (:145). | A distinctive animal-inspired visual concept (owner's brief), still with no nickname. |

---

## 2. Hint system v2: discovery, not answers (Season 2 only)

**Three optional levels, each started by the player.** Nothing pops up on its own, and nothing nags.

| Level | Purpose | Example (`s2-clock`, rewritten) |
|---|---|---|
| 1. Theme | A contextual nudge | "Clocks in this garden don't all agree since the lantern night." |
| 2. Attention | Points to an object or piece of evidence she has, never to the answer | "Look again at the note pinned beside the clock." |
| 3. Method | How to reason, never the result | "Work out what the note asked everyone to do, then ask whether this clock did it. The difference is your correction." |

**Rules, enforced by tests:**
- **No answer anywhere:**
  - For each puzzle, the answer token (the target value, the correct option's label or text, the slot order) must not appear in any hint, intro, goal, dialogue line before the puzzle, mission summary, journal step hint, or the `rewardText` shown before completion.
  - A test builds this "answer-leak scanner" from each puzzle's `solve()` result.
- **No way around reasoning:**
  - Remove "show solution" and skip from Season 2's story puzzles: `solution: false`, `noSkip`.
  - Closing a puzzle keeps her draft, so she can leave and come back.
  - The original game's puzzles are unchanged.
- **Wrong answers explain the conflict, not the fix:**
  - Feedback names the evidence that conflicts with what she submitted ("this card disagrees with the register you copied").
  - It never names where the card belongs.
  - No more "N of M right" counts.
  - Wrong options are no longer disabled.
- **Not guessable:**
  - Option order and the position of the correct claim are shuffled per playthrough, from a seed stored in the Season 2 save.
  - The number of states grows (3 options becomes multi-part deductions).
  - The test checks that random guessing succeeds less than 5% of the time.
- **One help channel:** the journal's step hints use the same three levels and never name the exact object until level 2.

---

## 3. Characters as actors

### 3.1 Engine additions

All are additive, use the existing pipeline, and come with tests.

| Addition | Cost | What it enables |
|---|---|---|
| World expressions for circle kinds: smile, surprised, worried, thinking, angry, suspicious, plus blink | Small. `frameTable` passes the existing `expr`; about 7 frames × 5 kinds, baked once | Visible faces in the world |
| Shared body poses in `personSprite`: point, arms crossed, hands up, facepalm, laugh, lean in, sit | Medium. One SVG pose function serves all five kinds | Body language |
| Runtime effects: hop, squash, shake, tilt, sway, steam/sweat particles | Free, drawn at runtime with no baking | Physical comedy |
| Actors can be interactables (`actor:'id'`), and the speaker faces Anji automatically | Small | NPCs can walk and still be talked to |
| `npcReact`: taps and proximity reactions for any actor (generalises `dogReact`) | Small | Characters notice her |
| Actions between dialogue lines (`{ say, at: [...] }`), `await` / all-done for parallel moves, a two-actor camera shot | Small–medium | Staged scenes with several actors |
| `view` poses that survive the end of a cutscene | Small | Moods that persist |

### 3.2 Cast direction

- **The sister:** a new look for her kind, following the owner's brief. She gets:
  - a signature silhouette;
  - a swaying idle and a "rise" pose when challenged;
  - a quick lean-in when she catches someone out, used for comedy;
  - narrowed-eye suspicion.

  She is active in the story:
  - she runs her own counter-investigation;
  - she challenges Anji's theories on the board;
  - she can be won over, which gives a later evidence route, or put off, which gives a longer route.
- **Uncle Jojo** (pending decision 1.6): a warm, embellishing storyteller whose accounts change. He tells three versions, each staged with actors (see 4.2). Each lie has a harmless motive (covering his own embarrassment or protecting a surprise), not malice. His lies are never obvious from his words alone; only comparing them with evidence exposes them.
- **Sabri** (pending decision 1.6): physical comedy. He hides things badly, trips over the receipt, overshares at the worst moment, and is mortified afterwards. His disclosure is a staged accident, and he is never a villain.
- **Lama:** a working partner. She counts, keeps the timeline, sometimes disagrees with Anji's theory, and has her own task in two missions.
- **Ryan:** small reactions in the world (turning his head, an emote, a jealous puff of particles), with no new art for his face.
- **The dogs:** Snooki and the husky help investigate. They sniff out a hidden object, and Snooki runs off with evidence, which leads to a chase (reusing the existing chase minigame).

---

## 4. Gameplay loops (balanced, not all puzzles)

1. **Investigative exploration.** Hidden or blocked spots are reached by doing something: moving a crate, lighting a lantern to reveal wax, following the husky's sniff cue, or climbing. Hints and journal steps stop naming the object.
2. **Testimony and reenactment (the core new mechanic).**
   - A witness's account is staged with real actors moving and posing.
   - She can replay or scrub it, and tap the moment that conflicts with a piece of evidence she has: present the evidence, the witness reacts, and their story changes.
   - This is how Jojo's contradictions and Sabri's mix-up are played.
   - It uses the existing `move`/`pose`/`camera` actions plus the timeline additions above.
3. **Environmental manipulation.** Drag the clock hands (with no "start one tap away"), angle a lantern's light, rub with pressure, and rebuild a scene by placing objects back where the evidence says they were.
4. **Evidence board v2.** Link claims to evidence, mark contradictions, and build a theory from multiple parts. Feedback names conflicts, never placements. The sister challenges a weak theory before it is accepted.
5. **Short action and timing.** The Snooki chase (existing minigame), sneaking a look while Sabri's back is turned (his facing and timing are visible), and catching falling lanterns. Each is under 90 s, can be retried, and takes no progress away.
6. **Consequences that matter.** Decisions open or close evidence routes, and change later scenes and how characters greet her.
   - **Tests check this:** every decision key must be read somewhere after it is written.
   - **Example:** if she respects the sister's refusal, the sister later volunteers the handwriting sample. If she pushes, she must earn it through the reconstruction route.

---

## 5. Mission by mission (M1, s2-01 … s2-11)

| # | Today | Redesign |
|---|---|---|
| 01 | 3 taps; the answer is spoken first | The archive is in disarray: shelves must be pushed and the register found by its smell of wax (husky cue). Compare claims across 3 documents with shuffled positions and no spoken answer. |
| 02 | Tap 7 lanterns, then a 3-option count | Lanterns are lit and unlit in turn. Reach the hidden 7th by climbing. A timing beat, as wind snuffs lanterns, decides what she can observe. The count becomes a deduction from the observations. |
| 03 | Talk, then a 4-card sort | Ryan and Anji split the table work, staged with actors. The sort feeds a board she keeps. `dec:lead` changes who carries out the next step later. |
| 04 | 1 tap, then board-1 | Board v2. The sister walks in and challenges the theory, which leads to a reasoning duel with no 3-option guess. |
| 05 | Rabi tells her the wax answer | Wax evidence is found by lighting lanterns and examining the drips. Rabi's account is reenacted, and she taps the conflicting moment. A comedy beat with Ryan's jealousy appears in the world. |
| 06 | Talk to Lama, then copy ×3 (always claim 1) | Lama's own task: she reconstructs the copy's timeline with Anji, and the two can disagree. The contradictions use shuffled positions. |
| 07 | Sabri recites the sentence | Sabri's slip is a staged comedy scene. She sneaks the receipt while he is distracted (timing), then rebuilds what he really said from overheard fragments. |
| 08 | Jojo, then a one-tap clock | **Stage B prototype** (§7): Jojo's three versions, reenactment, a physical clock, and the sister. |
| 09 | A no-stakes quiz, then rubbing | The sister's counter-investigation duel. The rubbing uses pressure and an angle. Respect or push becomes a real fork. |
| 10 | 1 tap; the intro quotes the match | Handwriting comparison against several real features (slant, loops, pressure), with no matching text phrase. Elimination, not accusation. |
| 11 | Talk, then board-2 | A multi-part theory with sister and Lama reactions. Jealousy is played lightly in the world. The ending changes with earlier decisions. |

---

## 6. Save safety and existing players

- **The Season 2 document stays `snooki-game:s2`.**
  - New ids keep an `s2` segment (`isS2` routing); the main save is never written.
  - Unknown fields are kept, and a newer document stays read-only for older builds.
- **`S2_VERSION` goes from 1 to 2 with `S2_MIGRATIONS[1]`.**
  - Only additive: it records `s2:v1-progress` and maps v1 progress forward.
  - Nothing she has earned is removed.
- **Trap: missions already finished never show new steps**, because `missionState` returns complete whenever `mission:<id>` is set (`progression/missions.js:22`).
  - **Recommended:** keep v1-completed missions complete (no forced replay), and put the overhaul's new interactions into optional "case reopened" encounters and M2.
  - **Alternative:** reopen the redesigned missions while keeping all evidence (owner decision 1.6-D).
- **Ids that must not change:** dialogue-seen keys used as mission steps (`seen:dlg:s2.hands-intro`), `graph.mjs`, and the M1 content test.
- **Tests:**
  - regression tests for every new mechanic, and for the migration (v1 docs, including partial ones, load correctly);
  - the original save stays byte-identical;
  - an older build reading a v2 document opens it read-only.

---

## 7. Stage B prototype (proposal)

**«بيت الفانوس»: Jojo's three versions** (rework of s2-08).

- **Two interactive characters:**
  - **Jojo:** moves, gestures and changes expression between versions.
  - **The sister:** signature idle, suspicious lean-in, a reaction when Jojo's story wobbles.
  - **The husky** reacts too.
- **Environmental interaction:** the lamphouse clock is turned physically by dragging, with no one-tap start. The oil can and lamp can be moved to check what Jojo claims.
- **A puzzle with the new hints:** a testimony and reenactment contradiction. Find which of Jojo's versions conflicts with the clock, and with what. All three hint levels are present and none gives the answer.
- **A consequence:** how she confronts Jojo (gently or bluntly) changes his later cooperation, and is read again in a later scene.
- **Acceptance:**
  - playable by touch, mouse and keyboard at 320–1280 px;
  - offline;
  - the answer-leak scanner passes;
  - random guessing succeeds less than 5% of the time;
  - visible animations in Edge and WebKit;
  - the original save stays byte-identical;
  - a playtest timing is recorded (measured, not estimated).

## 8. Acceptance criteria (overall)

- No Season 2 puzzle can be solved from hints, text or dialogue alone; the answer-leak scanner passes.
- No skip or solution button on the critical path.
- Every decision is read later; every NPC in a story scene has at least one reaction and one staged action.
- Length is **measured** by real playtests (stopwatch, a first-time player), and M1 must not be finishable by spamming hints and obvious choices.
  - **Proposed target:** 60–90 minutes of active play for M1, to be confirmed by measurement.
- Save compatibility tests pass. Offline and mobile layouts are verified. Nothing is released without the owner's explicit approval.

---

## 9. Stage B: what was built (prototype, local branch `feature/s2-gameplay-overhaul`)

**Engine** (additive; the original game's scenes are unaffected)
- **Faces in the world:** the circle characters have world moods (smile, surprised, worried, thinking, suspicious, angry, shy), a blink, and 8 shared gestures (point, hands up, arms crossed, think, facepalm, laugh, lean, shrug). One pose function serves all five characters, and each look is baked once per session (sprite cache).
- **The world follows the dialogue:** each dialogue line's expression sets the speaker's face in the world, the two turn to face each other, and a line's `act` actions play while it is read.
- **Runtime body language** (drawn, no new art): jolt (hop, shake, lunge, squash, tilt), a slow sway idle, and particles (sweat, steam, sparkle, dust).
- **Interactive actors:**
  - an interactable can follow its actor (`actor:`);
  - people turn to her when she talks to them, and notice her when she comes close (`notice`);
  - `move … to: <someone>, gap`, `all: [...]` (in parallel), and a two-person camera (`camera: { between }`).
- **A new mechanic, testimony** (`ui/testimony.js`, rule `testimony`):
  - a witness's versions are acted out behind a bar;
  - she can press a statement, present evidence she holds, or ask for three labelled help levels;
  - a wrong pair says nothing about how close it was;
  - the version she reached is kept.
- **The garden clock is turned by dragging its hand.** The buttons stay for keyboard users.
- **Season 2 puzzles have no skip and no "show the answer".** Mission reward texts are hidden until the mission is done.

**Content (s2-08)**
- **Jojo's two versions:**
  - the oil-trip story, broken by the full, sealed can she lifts;
  - the "nine sharp" story, broken by the clock she sets.
- His last version tells the harmless truth: he forgot to put the clock forward and lit the lanterns an hour late.
- **Her sister** walks in when version 1 breaks and reacts (lean-in, laughter).
- **Her answer is remembered:**
  - if she was kind, he brings his logbook;
  - if she was blunt, he sulks until her sister nudges him.
- **New evidence:** `e-oil`, `t-jojo-true` and `e-logbook`. Players who finished s2-08 as first shipped keep it finished, and the case reopens.

**Bugs found and fixed along the way**
- A `testimony` action (which has its own `then`/`else`) would have been treated as an if-branch; the same rule covers puzzles and minigames.
- During a version's break, the bar showed the next version's text.
- The sister stopped behind Anji, so staging now targets people instead of fixed positions.

**Tests**
- `tests/game/s2-overhaul.test.js` (14) checks:
  - the testimony rule;
  - random guessing below 5%;
  - an answer-leak scanner;
  - no skip or solution;
  - decisions read later (a list of decisions not yet read is left for Stage C);
  - save safety for new, partway and finished players.
- `tests/browser/s2-overhaul.browser.test.js` plays the whole sequence by touch in Edge (320 and 390) and WebKit (390), and the main save stays byte-identical.

**Not done in Stage B (Stage C):**
- the other ten missions;
- decisions that are still never read (`lead`, `tree-tease`, `sabri`, `jojo-why`, `sister-refusal`, `jealous-talk`);
- the hint texts of the other puzzles (their hint 3 still states the answer);
- Sabri, Lama and Ryan as actors;
- a measured playtest by a first-time human player.
