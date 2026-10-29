# Season 2 — Mission Catalog and Dependency Graph

Status: **design for review**. The authoritative graph data is `graph.mjs`. `node docs/season-2/validate-graph.mjs` currently reports:

```
missions 30 main + 8 optional; evidence 34; hypotheses 4
completion order found: 38/38
missions sharing prerequisites (playable in any order): s2-05 s2-06 s2-07 s2-08 s2-09 s2-12 s2-13 s2-14 s2-15 s2-19 s2-20 s2-23 s2-24 s2-27 s2-28
designed active time: main 15.1–20.1 h, optional 2.8–4.9 h
designed active time by milestone (ESTIMATES, not measured):
  M1: 11 main (5.4–7.3 h) + 6 optional (1.9–3.2 h), ends at s2-11
  M2: 10 main (5.2–6.8 h) + 1 optional (0.2–0.3 h), ends at s2-21
  M3: 9 main (4.5–6.0 h) + 1 optional (0.8–1.5 h), ends at s2-30
OK: no cycles, unreachable missions, impossible prerequisites, orphaned evidence, or milestone leaks
```

The validator was checked against injected defects. It reported each one:
- a cycle;
- an orphaned testimony;
- evidence needed before its producing mission is a guaranteed prerequisite;
- a mission needing a later milestone's mission or evidence.

## 1. Season entry and shared rules

**Season gate.**
- `S2_OPEN` = `game-complete`, so the original ending must be finished.
- The Deep Garden and the Story Packs are **not** required (owner decision, Gate C). Nothing already completed is replayed or re-locked.
- A one-time notice (`dueNotice`, after any earlier notice) says «أنجي، فكرة ليلة الفوانيس صارت… بس الصبح شي ما ينفهم 🏮», with «استكشفي هسه» and «بعدين».
- The map gains a third page, «الدائرة المغلقة». Its tab appears only once `S2_OPEN`.

**Husky-dependent steps.**
- Act IV needs the husky met (`HUSKY_MET`, Story Pack 01).
- If she has not been met, `s2-18`'s locked text says so and the map guide points to where she is met. Nothing else depends on her.

**Where Season 2 state lives (revised at Gate C):**
- Everything a mission writes goes to the Season 2 save document (`snooki-game:s2`), routed by the `s2` id prefix: flags, `mission:s2-*`, evidence `s2e.*`, journal, puzzle stage and draft, line rotation, and location.
- Season 2 places have their own scene ids (`s2-archive`, `s2-clinic`, …) even where they reuse a Season 1 look. So no Season 1 trigger, visit flag or dialogue "seen" key can be written.
- The main save is never written (Technical Plan §1–3).

**Every main mission:**
- is `pack: 's2'`, `kind: 'story'`, and carries `act`, `day` and its milestone (`M1`, `M2` or `M3`; see Technical Plan §5);
- has explicit steps whose `done` conditions are flags or evidence (`got:s2e.<id>`), never dialogue text;
- writes completion once (`mission:<id>`, the existing engine);
- has a `needs` list. When locked or blocked, the game names what is missing by **category**, for example «بعدچ ما سمعتي شهادة لمى». It never names the answer.

**Interruption recovery (every mission).**
- Progress is saved at every step change, because `game.commit` saves immediately.
- Puzzles resume at their stage (`pstage:`) and keep their draft (`pdraft:`).
- Entering a scene never sets a step. Only the action does, so reload can't skip or repeat a beat.
- A one-time trigger sets its flag as the **last** step of its run, not the first. This is the lesson of the interrupted-ending bug.

**Hints:** every puzzle has exactly three: attention, relationship and strong (see the Puzzle Spec).

## 2. Catalog (all main missions)

Columns:
- **Unlock:** the missions that must be complete.
- **Mechanics / clue type:** what the player does.
- **Evidence:** in = needs, out = yields; ids from `graph.mjs`.
- **Choice:** the decision recorded, if any (see Character States).
- **Done when:** the completion condition.
- **Time:** designed active minutes.

| ID | Day | Title | Unlock | Mechanics / clue type | Evidence in → out | Choice | Done when | Time |
|---|---|---|---|---|---|---|---|---|
| s2-01 | 1 | «الصفحة المگطوعة» | S2_OPEN | explore the archive; find the register; **compare** the copy with the register's stub (tutorial `contradict`, 1 stage) | → register, copy | — | both collected, compare solved | 20–30 |
| s2-02 | 2 | «شجرة الفوانيس» | 01 | environmental: inspect 7 lanterns (lit, unlit, wax length); **count** vs copy; find the blank and moved cards | copy → count, blank, moved | — | 3 evidence collected | 30–40 |
| s2-03 | 3 | «دفتر التحقيق الرسمي» | 02 | Ryan's comic notebook scene; find the missing exhibit (the note is under his cup); first **fact / claim** sort (3 cards) | → note, whisper | first tease: tease, help or ignore | sort solved | 20–30 |
| s2-04 | 4 | «لوحة الدائرة» | 03 | first case-room visit: **pin** 5 cards to A or B; mark one contradiction (blank card vs "sabotage needs a motive"; teaches *open*, not *proven*) | register, blank, moved, note, whisper | — | board stage 1 passed | 25–35 |
| s2-05 | 5 | «ربيع والفانوس المضوي» | 04 | clinic; **trace**: wax drip and wick height prove the card was moved into a lit lantern; jealousy beat (compliment) | moved → wax, t-rabi, h-rabi | reply to the compliment | wax deduced | 35–45 |
| s2-06 | 6 | «نسخة لمى» | 04 | clinic noticeboard; **copy vs original** discrepancies (`contradict`, 3 stages); she counted Snooky | copy, count → t-lama, copy-diff, h-lama | — | 3 discrepancies found | 35–45 |
| s2-07 | 7 | «صبري والكلمات الصحيحة» | 04 | training hall; **exact wording**: rebuild his sentence from fragments (`arrange`); Ryan's flustered cover-up | whisper → t-sabri, receipt, h-sabri | press Sabri, or let Ryan keep his secret | sentence rebuilt | 30–40 |
| s2-08 | 8 | «العم جوجو وساعة الحديقة» | 04 | lamp house; **timing**: set the clock by the lamp-change notice (`clock`); his refusal to sign | register → drift, t-jojo, h-jojo | ask why, or accept his answer | clock solved | 40–50 |
| s2-09 | 9 | «أخت أنجي والمسابقة» | 04 | the house; her quiz **duel** (rivalry; win or lose both continue); **imprint** rubbing of the blank card (new `rubbing` rule); she declines one question | blank → imprint, t-sister, h-sister | respect the refusal, or push once | rubbing solved; duel played | 40–50 |
| s2-10 | 10 | «الورقة اللي ما انوقّعت» | 04 + any 3 of 05–09 | **handwriting elimination** (`logicgrid`, small): with any 3 samples, three hands are ruled out | note + 3 samples → elim | — | elimination solved | 25–35 |
| s2-11 | 12 | «اجتماع الدفترين» | 05–10 | Anji and Ryan compare notebooks; board stage 2: C appears; **link testimony to evidence**; first open talk about Rabi' | — | how Anji handles Ryan's jealousy (5 options) | board stage 2 passed | 25–35 |
| s2-12 | 13 | «الخيط الأول: الشمع» | 11 | a wax trail leads to the archive (**false**); compare samples and route; it is Jojo's oil-lamp route | wax, t-jojo → oil | — | route explained | 35–45 |
| s2-13 | 14 | «الخيط الثاني: الوقت» | 11 | the register puts Rabi' at the archive at "9:40" (**false**); correct by the drift (`arrange` timeline) | drift, t-rabi, register → time-fix | — | timeline corrected | 30–40 |
| s2-14 | 15 | «الخيط الثالث: الكلام» | 11 | three versions of one sentence; find where the words changed (`contradict` on wording) | t-sabri, t-lama, whisper → versions | — | change points found | 35–45 |
| s2-15 | 15 | «الاتهام» | 11 | the board asks: «تعرفين منو؟» She may accuse anyone, or say «بعدني ما أعرف» | — | **accuse**: who or wait | a choice was made | 20–30 |
| s2-16 | 16 | «انقلاب الحكاية» | 12–15 | **midpoint reversal**: oil, time and receipt break A and crack B; Ryan admits a surprise exists and won't tell | oil, time-fix, receipt | **Ryan's secret**: respect or push | board shows A broken | 25–35 |
| s2-17 | 17 | «دليل، نظرية، لو رأي» | 16 | board stage 3: label every card fact, claim or opinion (`sort`), with versions as the hard case | versions → labels | — | labels solved | 20–30 |
| s2-18 | 18 | «ضباب الحديقة» | 17 + husky met | fog splits the group (dogs shown safe: bell and bark markers); the husky **scouts** a hidden path (new `scout` action) | — | — | reach the fork | 35–45 |
| s2-19 | 19 | «مخبأ الهاسكي» | 18 | **tracking**: follow paw prints through a branching path (`program` with tracks); her stash | → page (tooth marks), wrapper | scold, laugh or reward her | stash found | 35–45 |
| s2-20 | 20 | «سنوكي ما يخون» | 18 | Ryan's side: Snooky **sniffs** a trail and refuses until Ryan nods (Ryan must agree, after a talk) | → surprise | ask Ryan, or wait for him to offer | Snooky leads | 35–45 |
| s2-21 | 21 | «علّية الفوانيس» | 19, 20 | **two-dog co-op route** (new `duo` rule: two actors, two halves of one map); the eighth lantern | wrapper, surprise → loft | — | loft opened | 40–50 |
| s2-22 | 22 | «نرجع للأدلة» | 21 | **reopen**: three old items read again (blank, moved, page) with new knowledge | page, blank, moved | — | 3 re-reads done | 30–40 |
| s2-23 | 23 | «سلسلة الكلام» | 22 | **rumour chain**: order who told whom; place the note at its end (imprint plus sample) | versions, elim, imprint, h-sister → chain | — | chain built | 35–45 |
| s2-24 | 24 | «الساعة الصحيحة» | 22 | **true timeline** of the night (`arrange` with corrected times) | drift, oil, time-fix, page → timeline | — | timeline built | 35–45 |
| s2-25 | 25 | «الغرفة كاملة» | 23, 24 | board stage 4: break A and B, fold C into D; mark **what stays unresolved** | chain, timeline, loft, labels → case | — | D kept, one item marked open | 40–50 |
| s2-26 | 26 | «الحچي ويا كل واحد» | 25 | conversations with Rabi', Lama, Sabri and Jojo; tone set by her earlier choices; the husky steals a card mid-speech | case | **share the truth**: together, one by one, or let it rest | each conversation done | 35–45 |
| s2-27 | 27 | «أخت أنجي» | 26 | the sister scene: her perspective; the blank card's wish | imprint, t-sister | **stance**: cooperate, disagree, boundary or unresolved; then **the card**: read together, return unread, or keep it for later | a choice was made | 25–35 |
| s2-28 | 28 | «توقيع العم جوجو» | 26 | Jojo writes the corrected entry; whether to ask him to sign | t-jojo, timeline | **ask**, or leave it to him | entry written | 20–30 |
| s2-29 | 29 | «ليلة الفوانيس الثانية» | 27, 28 | the evening again, reactive to choices; Ryan's riddle lantern (cipher solvable from its own pad) leads to «طريق الذكريات»; roses and sweets | loft | her wish card (3 options); an optional affectionate reply, never required | riddle solved, evening done | 35–45 |
| s2-30 | 30 | «الحديقة اللي ما تنام» | 29 | Anji writes the register's new page; open future; post-game unlocks | — | — | the page is written | 15–25 |

Optional content (`OPTIONAL` in `graph.mjs`) never yields evidence that main content needs:
- the lantern workshop;
- dog training;
- the prank exchange;
- the puzzle duel;
- the memory archive;
- an outing;
- an apology (only after an early accusation);
- a post-campaign cipher.

## 3. Dependency graph

```
game-complete ─► 01 ─► 02 ─► 03 ─► 04 ─┬─► 05 Rabi'  ─┐
                                        ├─► 06 Lama   ─┤  (any order)
                                        ├─► 07 Sabri  ─┤
                                        ├─► 08 Jojo   ─┤
                                        └─► 09 sister ─┤
                    any 3 of 05–09 ─► 10 ───────────────┴─► 11 ─┬─► 12 wax  ─┐
                                                                 ├─► 13 time ─┤ (any order)
                                                                 ├─► 14 words ┤
                                                                 └─► 15 accuse┴─► 16 ─► 17
   (husky met) ─────────────────────────────────────────────────────────────────────┐   │
                                                                     18 ◄────────────┴───┘
                                                         ┌──── 19 husky ─┐
                                                         └──── 20 Snooky ┴─► 21 ─► 22 ─┬─► 23 chain ─┐
                                                                                        └─► 24 time  ┴─► 25 ─► 26 ─┬─► 27 sister ─┐
                                                                                                                    └─► 28 Jojo   ┴─► 29 ─► 30
```

**Hypotheses and their evidence.**

| Hypothesis | Required evidence |
|---|---|
| A | supported by register, blank, moved, note; broken by wax, oil, time-fix, page |
| B | supported by whisper, t-lama, t-sabri; broken by receipt, wrapper, loft |
| C | supported by drift, copy-diff, time-fix; limited by note, imprint |
| D | chain, timeline, page, imprint, loft |

**Missed clues.**
- Required evidence is never optional, and the objects that yield it can't disappear.
- If a puzzle opens without its inputs, it shows which **kind** of clue is missing and where to look. It never says what the clue is.

**Alternate routes.**
- the five witnesses, in any order;
- `s2-10` with any 3 of 5 samples;
- the three false trails, in any order;
- the two dog routes, in either order;
- the chain and the timeline, in either order;
- the last two personal scenes, in either order.

## 4. Full mission specs: Milestone 1 (written before implementation)

The other missions get the same 24-field spec before their milestone starts. The rule: no mission is built without its objective, completion and recovery written down.

### s2-01 «الصفحة المگطوعة»

1. **ID / title:** `s2-01` «الصفحة المگطوعة».
2. **Purpose:** open the case in under five minutes, and teach evidence pickup and comparison.
3. **Start:** the notice → the archive (spawn at the door).
4. **Unlock:** `flag:game-complete`.
5. **Entry:** a three-line scene. Anji: «ليلة أمس چانت حلوة… ليش السجل مفتوح هيچ؟»; the husky sniffs the register (if she has been met); Ryan is not here yet.
6. **Main objective:** find out what is wrong with the register.
7. **Optional objective:** read Jojo's lamp-change notice (foreshadows `s2-08`).
8. **Interactables:**
   - the register (torn stub);
   - Lama's copy (pinned to the board);
   - the lamp-change notice (optional);
   - the window (flavour).
9. **Evidence:**
   - `s2e.e-register` (fact);
   - `s2e.e-copy` (claim).
10. **Puzzle:**
    - a one-stage `contradict` in tutorial form;
    - the claim «ثمان ضيوف، والسجل يگول…» against the register stub, whose torn edge shows the last line number «٧»;
    - pick the claim, then the evidence.
11. **Solution:** the claim «ثمان» against the evidence «سطر ٧».
12. **Alternatives:** none (tutorial).
13. **Failure:** a wrong pair says «هالدليل ما يثبت إن هالجملة غلط». It keeps her picks, doesn't count against her, and can be retried without limit.
14. **Hints:**
    1. «الأرقام هي المفتاح.»
    2. «قارني عدد الأسماء بالنسخة بآخر رقم سطر بالسجل.»
    3. «النسخة تگول ثمانية… والسجل وگف على سطر سبعة.»
15. **Dialogue branches:** none. Anji's reaction line varies once by `HUSKY_MET`.
16. **Consequences:** the case room and map page open.
17. **Journal:**
    - `s2-case-open`;
    - the «القضية» notebook shows 2 facts, 0 theories.
18. **Relationship:** none.
19. **Companion:** the husky follows Anji if she has been met (she is alone otherwise). Snooky is absent (Ryan is not here).
20. **Completion:** `got:s2e.e-register`, `got:s2e.e-copy`, `flag:s2:01-compared`.
21. **Recovery:**
    - **evidence:** each item is collected on its own tap.
    - **puzzle:** the comparison resumes (`pstage`).
    - **entry:** the entry line is once-only by `seen:dlg:s2.01-enter`, guarded by the content test.
22. **Tests:**
    - unit: the mission is locked before `game-complete` and active after it;
    - unit: collecting twice gives one item;
    - unit: the puzzle solves and rejects wrong pairs;
    - browser (phone, 320 and 390 px, touch): enter, tap both items, solve, reload mid-puzzle → same stage.
23. **Time:** 20–30 min (exploration ~8, puzzle ~6, dialogue ~6).

### s2-02 «شجرة الفوانيس»

1. **ID / title:** `s2-02` «شجرة الفوانيس».
2. **Purpose:** environmental observation; the first contradiction the player sees with her own eyes.
3. **Start:** the archive exit → the lantern tree (new garden-region place).
4. **Unlock:** `mission:s2-01`.
5. **Entry:** Ryan arrives with coffee: «صباح الخير… ليش وجهچ وجه محققة؟» Snooky is at his side.
6. **Main objective:** check every lantern.
7. **Optional objective:** count the lanterns before reading the cards (an «عين حادة» journal note).
8. **Interactables:**
   - 7 lanterns, each tap showing its state (lit, unlit; wax length; card);
   - the empty hook;
   - Ryan;
   - Snooky.
9. **Evidence:**
   - `e-count` (fact);
   - `e-blank` (fact);
   - `e-moved` (fact).
10. **Puzzle:** none. Observation only. The count step is a choice of 6, 7 or 8, checked against the lanterns she has tapped. It opens only after she has tapped at least 7.
11. **Solution:** 7.
12. **Alternatives:** she may count first or read cards first.
13. **Failure:** a wrong count gives «عدّي مرة ثانية، يمكن فانوس مخبّى ورا الغصن». The hidden lantern is visible on a 320 px view (tested).
14. **Hints:**
    1. «كل الفوانيس؟ حتى اللي ورا الغصن؟»
    2. «قارني العدد بنسخة لمى.»
    3. «اضغطي كل فانوس مرة وحدة، وبعدين جاوبي.»
15. **Dialogue branches:** at the moved card Ryan says «هاي بطاقتي… شمسوية بفانوس ربيع؟» Anji answers with one of:
    - (a) «هسه نعرف.»;
    - (b) tease: «يمكن ربيع يحب خطك.»;
    - (c) nothing.
    It is local and reconverges.
16. **Consequences:** Ryan's first "official notebook" hint appears («لحظة… لازم دفتر.»).
17. **Journal:** `s2-tree`.
18. **Relationship:**
    - choice (b) unlocks one later callback line;
    - it doesn't change trust.
19. **Companion:**
    - Snooky beside Ryan; his tap reaction is «يشم البطاقة… ريحة يد ريان»;
    - the husky (if met) scouts the far end and barks at the hidden lantern;
    - the bark is a cue, not the answer.
20. **Completion:** all 3 evidence items plus `flag:s2:02-counted`.
21. **Recovery:**
    - **taps:** lantern taps are stored as `s2:lantern:<n>`, so the count gate survives reload.
    - **choices:** the choice is stored before its reply line.
22. **Tests:**
    - unit: the count gate (fewer than 7 taps → no count choice);
    - unit: idempotent evidence;
    - unit: the choice is stored once;
    - browser: the hidden lantern is tappable at 320 px; a reload after 4 taps keeps 4.
23. **Time:** 30–40 min.

### s2-03 «دفتر التحقيق الرسمي»

1. **ID / title:** `s2-03` «دفتر التحقيق الرسمي».
2. **Purpose:** comedy that introduces the evidence/theory distinction.
3. **Start:** the lantern tree → Ryan's table.
4. **Unlock:** `mission:s2-02`.
5. **Entry:** Ryan with a stamped notebook: «القضية رقم واحد. الملف… وين الملف؟»
6. **Main objective:** help Ryan find his missing "exhibit", then sort what you know.
7. **Optional objective:** the first prank, `o-prank` (swap his stamp ink).
8. **Interactables:**
   - the table (cup, notebook, stamp, napkin);
   - Snooky;
   - the husky.
9. **Evidence:**
   - `e-note`, the document under the cup, found by lifting it;
   - `e-whisper`, Ryan finally says what he heard: «يگولون… آني دا أخبي شي. شنو أخبي؟ آني؟»
10. **Puzzle:**
    - a `sort` (new small rule): 3 cards into «دليل» or «كلام»;
    - the cards: «البطاقة بفانوس ربيع» (دليل), «ريان يخبي شي» (كلام), «الورقة بلا توقيع» (دليل; its *content* is كلام).
11. **Solution:** as listed in 10. The third card's tooltip explains the nuance after it is solved.
12. **Alternatives:** the cup can be lifted before or after the sort.
13. **Failure:** each wrong placement is explained; nothing is lost.
14. **Hints:**
    1. «شفتيه بعينچ؟»
    2. «الدليل شي تگدرين تشوفيه؛ الكلام شي أحد گاله.»
    3. «الورقة موجودة (دليل)… بس اللي مكتوب بيها بعده كلام.»
15. **Dialogue branches:** Anji's first tease of the season:
    - (a) «تحقيق رسمي ويا كوب گهوة؟»;
    - (b) help him seriously;
    - (c) take the notebook and run the case herself.
    Option (c) sets `s2:dec:lead = anji`, and later scenes let her chair the board.
16. **Consequences:** the case room is introduced.
17. **Journal:** `s2-notebook`.
18. **Relationship:** `lead` decision; `rivalry` +1 if she takes the notebook.
19. **Companion:**
    - Snooky barks at the cup, a plausible cue: the note smells of something sweet;
    - the husky tries to steal the napkin.
20. **Completion:** `got:s2e.e-note`, `got:s2e.e-whisper`, `flag:s2:03-sorted`.
21. **Recovery:** the cup lift and the sort are independent steps, each saved.
22. **Tests:**
    - `sort` rule unit tests;
    - the decision is stored;
    - browser: the cup is reachable and the sort works by tap only.
23. **Time:** 20–30 min.

### s2-04 «لوحة الدائرة»

1. **ID / title:** `s2-04` «لوحة الدائرة».
2. **Purpose:** the first board visit; a theory isn't proof.
3. **Start:** the archive → the case room (new).
4. **Unlock:** `mission:s2-03`.
5. **Entry:** Anji: «إذا راح نفكر، نفكر صح.» The board has A and B only.
6. **Main objective:** pin your evidence and say what each theory still needs.
7. **Optional objective:** none.
8. **Interactables:** the board (DOM panel), the copy of the register, and Ryan.
9. **Evidence:** none new.
10. **Puzzle:**
    - **What she does:** she pins 5 cards to A or B, then marks one contradiction pair.
    - **What it checks:** `assess()` checks that every *fact* is placed where it fits. It accepts a claim pinned to either theory, because both are possible. It then asks for one statement:
      - «A يحتاج سبب، وما عندنا سبب بعد» (correct), or
      - «A ثابت» (wrong).
11. **Solution:** the pins consistent with each card's support list, plus the "needs a motive" statement.
12. **Alternatives:** any consistent pinning passes. There is no single developer layout.
13. **Failure:** «A ثابت» gives Ryan: «ثابت؟ عندنا ورقة… ما عندنا سبب.» Nothing is lost.
14. **Hints:**
    1. «كل بطاقة: وين تساعد؟»
    2. «قارني اللي عدنا ويا اللي تحتاجه كل نظرية.»
    3. «التخريب يحتاج سبب… لگيتي سبب؟»
15. **Dialogue branches:** none.
16. **Consequences:** Act II opens. The 5 witnesses appear on the map in any order.
17. **Journal:** `s2-board-1`, and the knowledge label «عندي نظرية».
18. **Relationship:** none.
19. **Companion:** Snooky lies by Ryan's chair. The husky (if met) sits on the board's dropped card, a comic beat with no effect.
20. **Completion:** `flag:s2:board-1`.
21. **Recovery:** pins are saved per change (`s2:pin:<ev>`), so the board reopens exactly as she left it.
22. **Tests:**
    - `assess()` accepts every consistent layout and rejects a wrong statement;
    - the pins survive reload;
    - browser at 320 px: all cards and both columns are reachable by tap, with no drag required.
23. **Time:** 25–35 min.

### Witness template (s2-05 … s2-09)

The same 24 fields, with these fixed rules:
- **A concrete objective:** for example, «ليش بطاقة ريان بفانوسي؟»
- **A new clue type**, one per witness:
  - trace (Rabi');
  - copy vs original (Lama);
  - exact wording (Sabri);
  - timing (Jojo);
  - imprint (the sister).
- **Earlier evidence:** each uses at least one earlier item (see `needs`).
- **One meaningful choice.**
- **Journal updates:** one testimony and one handwriting sample.
- **Withholding:** a witness who declines a question isn't marked suspicious. The board files the gap as «ما جاوب», which isn't evidence.
