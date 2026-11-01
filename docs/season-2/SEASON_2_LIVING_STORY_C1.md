# Season 2: The Living Story (Stage C1: mission architecture)

Status: **design for owner review.** Nothing in this document is implemented.

Builds on:
- `SEASON_2_GAMEPLAY_OVERHAUL.md` (Stage A audit, Stage B prototype);
- the story bible's truth table (`SEASON_2_STORY_BIBLE.md` §3);
- the approved graph (`graph.mjs`).

> This repository is public. The sister's visual concept follows the owner's private brief. Neither the concept's name nor any real-world nickname is written here, in game text or in the code. Mission 04's public title is neutral: «ظل الأخت» ("The Sister's Shadow"). The hashed guard in `tests/game/s2-m1.test.js` still enforces this.

---

## 0. Current state (verified 2026-10-30)

**Branch:** `feature/s2-gameplay-overhaul`, local only, cut from `main` `8c44130`.

**Stage B status:** **uncommitted.** It changes 20 tracked files and adds 4 new ones.

**Verified for Stage B:**
- the unit/app suite: 1441 passed, plus 14 new tests;
- the prototype browser test: 3/3 passing (Edge 320 and 390, WebKit 390).

**Not yet done for Stage B:** the production build; a full browser-suite rerun after the last fixes.

**Regressions found while preparing C1:**
1. **Evidence id collision (fixed).**
   - The problem: Stage B reused `e-oil`, which the approved graph reserves for M2's "wax trail = Jojo's oil-lantern route" (s2-12). That left a duplicate key in `EVIDENCE`, and the later entry silently won.
   - The fix: Stage B's evidence is renamed `e-oilcan` (code, tests, graph).
2. **Orphaned evidence (open).** `validate-graph` reports `e-oilcan`, `t-jojo-true` and `e-logbook` as produced but never needed. The graph in §2 gives each a use.
3. **Canon conflict (decision needed, §7):**
   - The bible's truth table says Jojo *was* away fetching oil at "nine".
   - Stage B, following the owner's brief, makes the oil trip a lie, broken by the full, sealed oil can.
   - The planned M2 clue `e-oil` relied on the old version.

---

## 1. Where the six missions go

The approved plan has **19 more missions** after M1 (s2-12 … s2-30, Acts III–VI), none of them built. The six connected missions below cover the same story beats in fewer, deeper, playable missions. Proposal:

| New | id | Replaces (planned beats absorbed) |
|---|---|---|
| 01 «سر المكتب» (The Office Secret) | `s2-12` | s2-14 (three versions of one sentence), s2-15 (the accusation choice) |
| 02 «سنوكي ضايع» (Snooki Is Missing) | `s2-13` | s2-18 … s2-21 (the dogs know the way: page, wrapper, surprise, the eighth lantern) |
| 03 «قصص جوجو الثلاث» (Jojo's Three Stories) | `s2-14` | s2-12 (wax and oil route), s2-13 (corrected time), plus Stage B, expanded to three versions |
| 04 «ظل الأخت» (The Sister's Shadow) | `s2-15` | s2-23 (the chain of words), s2-27 (the sister's choice) |
| 05 «ليلة الفوانيس» (The Lantern Night) | `s2-16` | s2-24 (the night in order), s2-22 (page and card together) |
| 06 «حقيقة البطاقة» (The Truth Behind the Card) | `s2-17` | s2-25, s2-26, s2-29, s2-30 (the closed circle, hypothesis D, the ending) |

- **Save safety:** ids s2-12 … s2-17 have never shipped, so reusing them is safe, and every id keeps an `s2` segment (`isS2` routing).
- **s2-18 … s2-30 are removed from the graph.** The milestone split becomes owner decision §7.1.

---

## 2. The arc: one case, six moves

```
M1 (live): the record is incomplete · five perspectives · three hypotheses on the board
   │
01 Office ──► who said what (Sabri's exact words; the relationship slips out at work)
   │            yields: e-versions, t-sabri2, dec:office-*
02 Snooki ──► the dogs know the way (the husky's stash; Snooki leads, never betrays Ryan)
   │            yields: e-page (tooth marks), e-wrapper; needs nothing new — a breather with action
03 Jojo ────► three stories (oil can, the clock, the loft): his last truth protects Ryan's surprise
   │            needs: e-drift (M1), e-oilcan, e-logbook; yields: t-jojo-true, e-loft
04 Sister ──► the chain of words ends with her (the note, the blank card's wish)
   │            needs: e-versions, e-imprint (M1), h-sister (M1); yields: d-chain, dec:sister-*
05 Night ───► the night in order, by light and shadow (lanterns placed where they stood)
   │            needs: e-drift, t-jojo-true, e-page, e-loft; yields: d-timeline, e-surprise
06 Card ────► hypothesis D, defended; the ending reflects what she found and chose
                needs: d-chain, d-timeline, e-loft, e-wrapper; yields: d-case; reads every decision
```

**Hypotheses:**
- **A ("someone sabotaged the night")** breaks in 02 and 03 (the tooth marks, the oil can, the clock).
- **B ("Ryan hides something that hurts Anji")** breaks in 02, 03 and 05 (the wrapper, the loft, the surprise).
- **C ("the clock fooled everyone")** merges into D in 05.
- **D ("a closed circle of small mistakes and two well-meant choices")** is defended in 06.

The approved story's nuance is kept:
- nobody is a villain;
- accusing is optional and never required;
- one thing stays open by Anji's choice: the sister's wish.

---

## 3. Mission designs

Each mission is defined by:
- an objective;
- its places;
- its people (each with an active role);
- its core mechanics;
- one puzzle that hints cannot solve;
- one comedy beat that is *shown*;
- one decision with a later consequence;
- evidence needed and yielded;
- a fail and retry loop;
- the words that would give the answer away (fed to the answer-leak scanner).

### 01 «سر المكتب» (The Office Secret): `s2-12`
- **Place:** a new scene, `s2-office` (Ryan, Sabri and Lama's workplace). It is wide, with desks, a printer, a coffee corner and a cabinet. Anji visits with Lama.
- **People:**
  - **Lama:** an ally. She follows Anji, comments on what Anji examines, and can be sent to distract.
  - **Sabri:** comic and well-meaning. He has his own patrol and sitting routine.
  - **Ryan:** absent at first, enters at the end.
- **Play:**
  1. Exploration: examine desks, papers, the shared calendar and the coffee rota. Objects can be opened, moved and picked up (*carry* and *place*).
  2. **"Who said what" (logic):** three versions of Sabri's sentence exist (his own, Lama's, the one that reached the sister). She rebuilds the original from fragments found on the sticky notes, the calendar and the coffee rota. Each fragment rules versions in or out, so trying words does not work.
  3. **The slip (comedy):**
     - Sabri congratulates Anji "on her and Ryan" in front of the office.
     - He tries to cover it up: knocks the printer tray, scatters papers, and pretends the printer said it.
     - He makes it worse; the papers fly (particles).
     - She can help gather them, which is a short timing beat with a bonus clue on one sheet.
- **Decision `office-cover`:**
  - help Sabri cover it, or let the truth stand. Lama learns either way.
  - **Later (04, 06):** what the sister heard from Lama differs, and Sabri's attitude differs.
- **Evidence:** needs `t-sabri` and `t-lama` (M1). Yields `e-versions` and `t-sabri2` ("his exact words, again").
- **Fail and retry:** a wrong reconstruction gets a reaction from Lama or Sabri. Nothing is lost.
- **Answer words:** the exact original sentence.

### 02 «سنوكي ضايع» (Snooki Is Missing): `s2-13`
- **Places:** garden routes across three linked areas (the archive path, the tree, the shed roof). It uses the **chase** engine (`minigames/chase-logic.js`), extended with:
  - forks for alternate routes;
  - "lost the trail" moments, where tracking is by scent marks and the husky's cue;
  - Snooki's personality states: tease (waits, looks back, wags), dodge, hide, and a show-off jump.
- **People:**
  - **Snooki:** carries Anji's case notebook (playful, not a theft for gain).
  - **The husky:** helps track.
  - **Ryan:** at the end, laughing.
- **Play:**
  - Each chase leg is 60–90 s, with a tap-to-jump/slide control on touch and a landscape layout option.
  - A failed leg restarts at the leg's checkpoint and never resets progress.
  - Snooki ends at **the husky's stash**: the torn register page (tooth marks) with Ryan's sweets wrapper inside.
  - Snooki will not lead to Ryan's surprise (loyalty, canon).
- **Puzzle (light):** read the trail. Marks of three kinds (paw size, wet or dry, direction) decide which fork is fresh.
- **Comedy:** Snooki "returns" the notebook to the wrong person (Sabri), then steals it back.
- **Decision `stash`:** return the husky's treasures or keep them as evidence. **Later (06):** the husky's reaction, and an extra line in the ending.
- **Evidence:** yields `e-page` and `e-wrapper`. This **breaks A** ("someone tore it on purpose").
- **Answer words:** none (the trail-reading answer is never written as words).

### 03 «قصص جوجو الثلاث» (Jojo's Three Stories): `s2-14`
- **Place:** the lamphouse (Stage B scene), with the loft unlocked.
- **People:**
  - **Jojo:** an embellishing storyteller with physical reenactment.
  - **The sister:** comes in at the first break.
  - **The husky:** reacts.
- **Play:** the Stage B testimony, expanded to three versions:
  - **v1, the oil trip:** broken by `e-oilcan` (she lifts it: full, sealed).
  - **v2, "nine sharp":** broken by `e-drift` (the clock; from M1, or set here).
  - **v3, "I never went up to the loft":** broken by `e-logbook` (his own logbook lists the eighth lantern: «الثامن — العلّية — يبقى مطفي، مثل ما انطلب»).
- **His last truth:**
  - He forgot the clock (embarrassment).
  - He kept the eighth lantern unlit **because Ryan asked him to**. He kept a friend's surprise, so this is loyalty, not malice.
- **Physical manipulation:**
  - drag the clock hands;
  - lift the oil can;
  - carry the lantern down from the loft;
  - angle the lantern so its light reveals the logbook page.
- **Comedy:** Jojo acts out version 2 so "precisely" that he trips over his own lantern stand (squash, shake, sweat).
- **Decision `jojo-confront`** (Stage B): kind or blunt. **Later:** how he hands over the logbook (done); his line in 06.
- **Evidence:** yields `t-jojo-true` and `e-loft`. This **breaks B** partly: Ryan's lantern was kept dark on purpose, for her.
- **Answer words:** «مليانة», «ختم», «ما انقدّمت», «مطفي، مثل ما انطلب» (none may appear before the break).

### 04 «ظل الأخت» (The Sister's Shadow): `s2-15`
- **Place:** the home garden by day, then dusk. A second area is the shed.
- **People:**
  - **The sister:** her own silhouette (owner's brief), confident and suspicious, with a sway, a lean-in and a rise.
  - **Lama:** comes to apologise.
  - **The husky.**
- **Play:**
  - **Observation and stealth:**
    - The sister is moving the blank card and her pencil notes out of the house.
    - She looks around in a visible rhythm (her facing plus a light glance cone).
    - Anji follows by moving only while the sister looks away, and can hide behind plants or the washing line.
    - Being seen is a playful confrontation (she leans in: «شتسوين؟»), and Anji restarts from the last cover.
    - No penalty beyond the restart.
  - **The chain of words (logic):** order what was said, Sabri → Lama → the sister → the note, using `e-versions`, `t-lama` and her own words. A wrong order meets her challenge.
  - **The cinematic encounter:**
    - At dusk under the lantern, the sister turns. The camera frames both of them, and the lantern light flickers.
    - She admits the note was hers, to protect Anji.
- **Decision `sister-wish`:**
  - read the wish on the blank card (it can be made out under the lantern), or leave it to her.
  - **Later (06):** the ending's last scene. This is the canon "thing left open by Anji's choice".
- **Evidence:** needs `e-versions`, `e-imprint` and `h-sister`. Yields `d-chain`.
- **Answer words:** the chain order, written out.

### 05 «ليلة الفوانيس» (The Lantern Night): `s2-16`
- **Place:** the lantern tree at night (the existing tree scene with a night lighting pass).
- **People:**
  - **Lama:** keeps the timeline: she holds the clock, and her own task is calling out times.
  - **Sabri:** holds the ladder (comedy: he wobbles).
  - **Ryan:** watches, and lights his own lantern at the end.
- **Play: light and shadow placement.**
  - Eight lanterns (seven on the tree plus the eighth from the loft) are carried and hung on hooks.
  - Each lit lantern casts the shadows of the branches and the wish-card stand onto the archive wall.
  - Lama's photo from the night shows the shadow pattern.
  - Rebuilding the pattern places every lantern where it really was, and when it was lit (Jojo's late lighting, the eighth never lit).
  - This is a logic and placement puzzle with a visible result: the shadows match or they don't.
- **Routes from earlier decisions:**
  - if she let the truth stand in 01, Sabri volunteers his memory of where Ryan stood;
  - otherwise Lama's photo is the only route, and it is harder (fewer lanterns are pre-placed).
  - If she was kind to Jojo in 03, he lends the lantern hooks' map.
- **Reveal:**
  - **The register page:** the husky tore it after Jojo's late lighting, when the wrapper fell into it.
  - **The blank card:** written, then erased by the sister, at the moment the shadows show.
- **Evidence:** yields `d-timeline` and `e-surprise` (Ryan's surprise was meant for "nine", which was really ten).
- **Answer words:** each lantern's position and time, written out.

### 06 «حقيقة البطاقة» (The Truth Behind the Card): `s2-17`
- **Place:** the case room, then the garden at night for the ending.
- **People:** everyone. Group staging, with reactions in sequence.
- **Play:**
  - **Rebuild and defend:**
    - She places the night's events in order on the board: the clock, the lanterns, the words, the note, the page, the card.
    - She chooses a hypothesis (A, B, C or D).
    - She then **defends** it: each character raises a challenge in turn (a testimony-like rebuttal round), and she answers each one with evidence.
  - Only D survives every challenge. The others break, each with the reaction of the person it would have blamed.
- **Ending:**
  - Ryan lights the eighth lantern, and his surprise plays out.
  - Its variations depend on:
    - `office-cover` (Sabri's line);
    - `stash` (the husky);
    - `jojo-confront` (Jojo);
    - `sister-wish` (the final scene: read or left);
    - the M1 decisions (`lead`, `jealous-talk` …), which finally get read.
  - There is no wedding and no new real-world promise. Jealousy stays playful.
- **Answer words:** none can be written; the defence round is checked against held evidence.

---

## 4. Character animation state machine

**One controller per actor** (engine, additive). Each frame picks the first state whose condition holds:

```
scripted pose (gesture, for N ms)  → point · laugh · facepalm · cross · think · handsup · shrug · lean · interact
airborne                           → jump / fall           (Anji, dogs; chase)
moving                             → walk / run (speed)    (+ per-character gait: bob, lean, stride fps)
reacting (short, timed)            → react: jolt + emote + face   (surprised, embarrassed, suspicious, angry, laugh)
talking (their line is shown)      → talk: 2-frame mouth loop + the line's mood + an occasional gesture
mood (kept)                        → the face she/he is left with
idle                               → breathing + blink + idle habit (per character, every 4–9 s)
turn                               → a 120 ms squash on facing change (drawn), never an instant flip
```

**Personality profiles** (data, not new code paths):

| Character | Gait | Idle habit | Talk gesture | Signature reaction |
|---|---|---|---|---|
| Anji | quick, light bob | looks at the nearest clue | open hand | determined lean-in |
| Snooki | trot, tail wag | sniff, sit, look back at her | — | play-bow, then dash |
| The sister | smooth, gliding | slow sway | arms crossed, head tilt | rise, then a quick lean-in |
| Jojo | measured, slightly stiff | strokes his moustache, checks the clock | storyteller arms (big) | sweat and shake when caught |
| Sabri | bouncy, too fast | checks phone, fidgets | waving hands | trips, then freezes |
| Lama | steady | counts on fingers | points at notes | arms crossed ("I told you") |
| Ryan | calm | glances at Anji | small nod | a cartoon steam puff (jealousy, playful) |

**New art needed (per kind, baked once and cached; memory baseline required):**
- the circle characters: talk ×2, interact (reach), run (walk frames at a higher fps; no new art);
- Ryan: 2 profile faces (smile, surprised). This is medium cost.

Everything else is runtime drawing (jolts, sway, turn squash, particles), which costs no memory.

---

## 5. Cinematic actions (reusable, additive)

| Action | Purpose | Cost |
|---|---|---|
| `camera: { between }` | frame two people (exists) | none |
| `camera: { zoom, on }` | emphasis close-up (canvas scale around a focus, eased) | small |
| `enter` / `exit` | timed entrance or exit through a side, with optional gait | small (spawn + move + despawn) |
| `react` | several people react in sequence (a staggered `all`) | small |
| `light` | darkness with lantern light pools, flicker, shadows cast on a wall | medium (one canvas mask per frame) |
| `trail` / particles | scent marks, papers flying, dust, steam | small (drawn) |
| `ambient` | a scripted beat that plays **without taking control** (people keep living) | small (runs outside cutscene mode) |
| letterbox bars | only for the three set-piece moments (sister at dusk, the lantern reveal, the ending) | small |

---

## 6. Mechanics, hints, testing, saves

**New mechanics**
- carry and place (objects in hand);
- stealth (facing and glance cone, cover spots, a restart point);
- branching chase (forks, scent tracking, Snooki's states, landscape layout);
- light and shadow placement;
- order and defend (the board plus a rebuttal round).

**Rules for all of them**
- Each one is a pure rule module with tests, like `puzzles/rules.js`.
- Each has a fail and retry loop.

**Hints**
- three discovery levels (Stage B);
- no skip and no solution button;
- the answer-leak scanner extended to every new puzzle, mission step, summary and dialogue line before a solve.

**Guessing**
- Every puzzle's random-guess success must stay below 5%.
- A test computes it from the rule's state space.

**Saves**
- Everything goes to `snooki-game:s2`; new ids keep an `s2` segment.
- `S2_VERSION` is unchanged: everything is additive, nothing changes meaning, and unknown fields are kept.
- Tests cover:
  - every new decision being read later;
  - every mission state for new, partway and completed players;
  - the main save staying byte-identical through each mission.

**Mobile**
- tested at 320, 360 and 390 px;
- 44 px targets;
- no sideways scroll (a game-root `scrollLeft` check, as in Stage B);
- an optional landscape layout for the chase legs only;
- keyboard and mouse kept working.

**Measuring playtime (Stage C4)**
- a dev-only playtest recorder (never in the save, never sent anywhere): timestamps for input, dialogue, cutscene, puzzle and chase time, and interaction counts, exported as a file;
- the report gives the median and the spread **over the playthroughs actually run**, with the tester named (AI or human) and the number of runs (n);
- no target duration is claimed before it is measured.

---

## 7. Owner decisions needed before C2

1. **Campaign structure:**
   - The six missions replace the 19 planned (s2-12 … s2-30) as ids s2-12 … s2-17.
   - **Recommended:** one milestone (M2 = all six), released once complete. The alternative is M2 = 01–03 and M3 = 04–06.
2. **Where Stage B lives:**
   - **Recommended:** move the testimony into Mission 03 (`s2-14`, three versions).
   - Return M1's `s2-08` to its shipped shape, keeping only its leak-free clock and hints.
   - Why: M1 stays the short introduction it was released as, and Mission 03 gets the full arc.
   - The alternative is to keep Stage B in s2-08 and add only version 3 in Mission 03.
3. **Canon updates to the story bible:**
   - Jojo never went for oil.
   - He forgot the clock.
   - He kept Ryan's lantern unlit at Ryan's request.
   - The planned `e-oil` (the wax trail as his oil route) is retired.
4. **Mission 01 premise:**
   - Ryan and Anji's relationship is private at work, and Sabri's slip makes it public there.
   - It's played for affectionate comedy; nobody is hurt.
   - M1 never states the relationship at work (checked).
5. **The C2 vertical slice:** **recommended Mission 01** (Anji, Lama, Sabri and Ryan; carry and place; the "who said what" logic; the printer comedy; the `office-cover` decision). It exercises the most new systems.

---

## 8. Owner decisions (2026-10-30)

1. **Release:** one milestone. M2 is all six missions (s2-12 … s2-17), released once the whole arc is built and playtested. The graph's s2-18 … s2-30 are removed.
2. **Stage B:** the testimony moves to Mission 03 (`s2-14`, three versions). M1's `s2-08` returns to its shipped shape, keeping the leak-free clock and hints. This is done when Mission 03 is built (C3).
3. **Jojo canon (adopted):**
   - He never went for oil.
   - He forgot to put the clock forward.
   - He kept Ryan's eighth lantern unlit because Ryan asked him to.
   - The planned `e-oil` (the wax trail as his oil route) is retired.
4. **C2 vertical slice:** Mission 01, «سر المكتب», on the local branch, with tests, a playtest recording and screenshots. No merge or deploy.

---

## 9. Stage C2: Mission 01 «سر المكتب» (vertical slice, built)

**Built:** the scene `s2-office`; mission `s2-12`; the puzzle `s2-who-said`; and M2's own registries:
- `data/missions-s2-m2.js`
- `data/puzzles-s2-m2.js`
- `data/evidence-s2-m2.js`
- `data/dialogue/s2-m2.js`
- `data/scenes/s2-m2.js`

They are registered next to M1's, and M1's own registries are unchanged. The office is on the Season 2 map page and opens after `s2-11`.

**The loop:**
1. Lama walks with her. She examines the coffee rota and the calendar.
2. Sabri guards his screen. Touching the sticky note while he watches gets her caught; she can retry, and nothing is lost.
3. Lama goes to keep him talking. The note can be read only while he looks away (a world timing window, never saved).
4. **The slip:** Sabri says the relationship out loud.
5. **The printer comedy:** he runs, the printer jams and shakes, papers fly, and he sways and throws his hands up.
6. She carries four papers back to the tray. One of them is Lama's printed message (a clue).
7. **The decision `office-cover`:** cover for him, or let the truth stand. What Lama learns depends on it.
8. **The board «منو گال شنو»:** a 3×3 logic grid. It has exactly one solution, every clue is needed, and a random guess succeeds with probability 5·10⁻⁵. There are no answers in any text before it is solved, and no skip or solution button.
9. Ryan walks in. His scene depends on the decision.

**Engine** (additive):
- routines that keep their look every frame;
- interactable cases with `unseenBy` / `seenBy`;
- carrying (`hold:`), with the item drawn in her hand;
- a turn squash, a mouth that moves while a character talks, idle habits and walk bob (`data/personas.js`);
- a papers particle;
- companions wait while she walks over to them;
- `move … to:`.

**Bugs found by playing, and fixed:**
1. **A Season 2 isolation leak (it also exists in the live M1).** Tapping a dog in a Season 2 place, or the husky's idle remarks there, wrote the rotating-line counter to the **original save** (`hub.lines`). Those counters now go to Season 2's save (`lineKey`), with a regression test.
2. The watcher's look lagged up to 0.4 s, so the note could be read without the distraction.
3. A companion stepped away when she walked over to talk.
4. Lama's distraction spot put Anji between Sabri and Lama.
5. On a phone, Lama followed too far behind to stay on screen.

**Tests:**
- `tests/game/s2-living.test.js` (11 tests);
- `tests/browser/s2-living.browser.test.js`: the whole mission by touch in Edge (320 and 390) and WebKit (390), with the original save byte-identical.

**Playtest recorder:** `?playtest=1` (development only), giving `window.__playtest.report()`. No human playtest has been recorded yet.
