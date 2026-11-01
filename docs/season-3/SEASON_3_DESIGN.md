# Season 3 — «أصداء الـV8» (Echoes of the V8)
### «الأسرار بين السطور» · The Secrets Between the Lines

**Status:** Phase A design, 2026-11-01, on `feature/season-3-echoes` (from production `a2decf3`). Nothing here is
implemented unless `IMPLEMENTATION_LOG.md` says so. Companion documents: `TECHNICAL_ARCHITECTURE.md`,
`EVIDENCE_GRAPH.md`, `DECISION_FLOW.md`, `PUZZLE_SPECIFICATIONS.md`, `CREATIVE_PROPOSALS.md`.

---

## 1. The idea in one paragraph

Two small, true moments — Anji, cornered by Sabri, blurts «ريان مجرد صديق أخوية ماريوس», and Ryan, who cannot find the
words, answers her with a single blip of Zefiro's V8 under her window — are recorded, repeated, cut and relabelled until
they come back as two lies: *"Anji says Ryan is nothing to her"* and *"Ryan races his car outside her house at night."*
Season 3 is the investigation of how a true thing becomes a false story. The player never learns the truth by being
told it: she hears the recordings, reads the records, watches who said what to whom, and proves where each echo bent.

- **Theme 1:** not everything that is said is true, and not everything that is true is immediately visible.
- **Theme 2:** the smallest detail exposes the biggest secret — a streetlight timer, a printer queue, the rhythm of
  an idling engine, one initial in a visitor log.

## 2. Canon (verified in the source and the Season 2 bible, 2026-11-01)

| Fact | Where verified | Season 3 treatment |
|---|---|---|
| Ryan's car is **«زفيرو»**, introduced in Act III (the garage). Its colour is the player's choice (`cosmetics.carColor`, cobalt by default, emerald unlockable). | `dialogue/act3.js`, `scenes/act3.js`, `items.js`, `missions.js` | **The Camaro SS is Zefiro.** Season 3 finally draws it properly (a muscle-car silhouette instead of the generic `sportsCar` prop), always in the colour she gave it. No new car is introduced. |
| Snooky once bit Zefiro's tyre («حادثة الإطار»). | `act3.js` | A running callback (Snooky and tyres; Mission 05). |
| Rabi' and Lama are Anji's coworkers at the clinic; Ryan once visited her clinic unannounced with sweets and flowers. | S2 bible §canon | Mission 01 is at the clinic («عيادة الورد», S1/S2 place, new Season 3 scene id). |
| **Sabri is Ryan's friend and coworker** (not Anji's), and once told Anji about Ryan's secret workplace visits. | S2 bible | Sabri is at the clinic **as a visitor**, waiting for his own driving-licence medical report. Idle in the waiting area, he reads the visitor log — that is where his theory starts. Canon kept, and the scene gets funnier. |
| Snooky is Ryan's dog; the white Siberian husky with icy-blue eyes is Anji's (the player names her, `{husky}`). | S2 bible, `companions.js` | Unchanged; both appear, ownership never swaps. |
| Uncle Jojo, Anji's sister, the lantern night (Season 2) | S2 | Not reopened. No new family history beyond Marius (owner-supplied). |
| No wedding, date, vows, proposal or invented real event. | S2 bible §7 | Unchanged; tested again for Season 3 (no-promise guard, as Mission 06 of Season 2). |
| The two private words are never written. | release rules | Unchanged; the privacy scan covers Season 3. |

**New, owner-supplied:** Marius, Anji's older brother and Ryan's friend (§3).
**New, fiction (labelled so in the memory/journal text):** Jalal, the car-club acquaintance; the clip; the
municipal noise notice; the bakery; the neighbour's camera; every record in Mission 01.

## 3. Cast

| Character | Season 3 role | Acting signature (procedural) |
|---|---|---|
| **Anji** | investigator and emotional centre; she reasons, disagrees with Ryan, makes and corrects mistakes | blush (cheeks warm, eyes slide away), nervous glance back, thinking pause (hand to chin), determination (squared shoulders, short nod) |
| **Ryan** | steady, observant, waits for proof before naming anyone; speaks through actions (Zefiro's blip; turning the engine *off* in the finale) | small smile, a look toward Anji and away, controlled nod, hands still |
| **Sabri** | careless, well-meaning; his long tongue starts the season; tries to repair, makes it worse | exaggerated double-take, pointing, hands up, a "zip my lips" gesture he cannot keep |
| **Lama** | active ally: observes, distracts, challenges Anji's assumptions | knowing look, smile hidden behind a file, quick lean to whisper, takes notes |
| **Marius** *(new)* | older brother, Ryan's friend; confident, protective, relaxed; never hostile to Ryan; teases Anji | tall and broad-shouldered, blond, blue eyes; easy stride, arms crossed when amused, a hand on Anji's head (sibling teasing) |
| **Snooky** | Ryan's dog; finds the object that links the clues (Mission 05) — as a dog: sniffs, digs, gets distracted, comes back | tail, ears, sniff, play bow, looking back |
| **{husky}** | Anji's dog; reacts to the street at night, to Zefiro's engine (ears back, then curious) | ears, head tilt, sits |
| **Jalal** *(fiction)* | car-club acquaintance Ryan trusted; the person behind the story | see Mission 04; not a villain — a frightened man who let a lie stand and then fed it |

**Jalal is fiction.** He is not modelled on anyone. His display name lives in one place (`data/s3/cast.js`) so the
owner can rename him with a single edit before release.

## 4. The story (what really happened — the player reconstructs it)

| Day / time | What happened (truth) | What it became |
|---|---|---|
| Sun 09:10 | Ryan comes to the clinic with Marius for his driving-licence medical report (exam booked 09:15). | Sabri: "visit 1". |
| Sun 13:30 · Tue 12:05 · Thu 09:02 | Rabi' signs the shared visitor log «ر.» each time he steps out (coffee; Tuesday's lab-report run). | Sabri: "visits 2, 3 and 5". |
| Wed 16:40 | Ryan returns: the doctor had not signed on Sunday, and his test is Thursday. The jammed printer queues the signed report (16:45). | Sabri: "visit 4". |
| Thu 09:00–09:04 | Sabri arrives for his own report. The printer, unjammed, prints Wednesday's queued job with today's footer. | Sabri: "Ryan was here *today* too — five visits!" He sends his count to the «شباب الكراج» group chat. |
| Thu (Mission 01) | Sabri confronts Anji; Anji answers (the player's choice); Marius walks in. | What Anji says is what Sabri will repeat. |
| Fri 21:40 | Ryan, parked on her street, cannot find the words: one controlled blip of Zefiro's V8, then the engine off. Anji's whisper: «مجنون… حتى السيارة يحچي بيها وياي.» (Mission 02) | — |
| Fri 21:45 | The bakery's shutter rolls down (every night). | an anchor in the recordings |
| Fri 23:00 | The street's lights switch to night mode (timer relay; every night). | an anchor in the recordings |
| Fri 23:10 | Jalal's own V8 — a different engine — is revved hard on the same street, with tyre noise. A neighbour files a noise complaint about "a grey car". | — |
| Sat | A clip of the 23:10 noise circulates captioned «ريان يسابق جوه بيت أنجي بالليل». Jalal, with a previous warning on his licence, lets it stand — and, to Ryan, as a "friend's warning", repeats Sabri's gossip in its worst form: "people say you race there, and she says you're nothing to her". | the two echoes |
| Sat (Mission 03) | Ryan, at the car club, hears Jalal's engine and recognises the clip in it. He has no proof yet, so he tells Anji only: «لا تصدّكين كلشي ينقال. أكو خفايا كثيرة راح أحچيلچ ياها بالوقت المناسب.» | — |

The player's job across Missions 01–08: prove each row of the right-hand column false (or true) from evidence.

## 5. Missions

Every mission has gameplay, acting, evidence, a clear objective that never names the answer, a valid completion
state, tests, and continuity. Ids are fixed here (see `TECHNICAL_ARCHITECTURE.md` §3).

### Mission 01 — «صبري ولسانه الطويل» · `s3-01` · the vertical slice
*Comedy, character introduction, the first echo.* **Place:** `s3-clinic`, «عيادة الورد», morning.

- **Opening (acted, not narrated):** Lama at reception hiding a smile behind a file; Rabi' passing with coffee and
  signing the log «ر.»; Sabri on the waiting bench, reading the visitor log upside-down, counting on his fingers.
- **The confrontation** (owner's script, kept): Sabri: «أنجي، سؤال بس لا تعصبين… واضح عندچ معزة خاصة يم ريان. ماكو شخص
  يتردد لعندچ بالسر ويسوي المستحيل حتى يشوفچ!» — Anji blushes, looks away, fidgets. **Her answer is the player's
  choice (decision `sabri-reply`)**: the scripted denial «لا… لا لا! ريان مجرد صديق أخوية ماريوس. جان جاي علمود اختبار
  القيادة، يريد تقرير طبي!», laughing it off, or confronting him. On the denial, Sabri: «إي طبعاً… تقرير طبي يحتاج كل هالزيارات؟»
  — «صبري! خلص عاد!». Lama tries not to laugh.
- **Marius walks in** («شنو صاير؟ ليش كلكم صافنين بيّه؟»). He came to collect Anji. He innocently confirms the report
  story — then makes it worse: «بس ريان أخذ التقرير من أول مرة… ليش رجع؟» Anji answers him honestly or deflects
  (decision `marius-honest`).
- **Gameplay — «إعادة بناء الأسبوع» (the office reconstruction):** she gathers the records — the visitor log, the
  appointment book, the licensing-test schedule, the printer's queue slip, Sabri's own note (on his phone, which he
  waves at her), Lama's observations — and proves what Sabri's "five visits" really were. Two strict stages
  (`PUZZLE_SPECIFICATIONS.md` §1): *who wrote each «ر.»* (Ryan / Rabi' / Sabri / not a visit at all), then *what kind
  of statement each of Sabri's claims is* (it happened / he saw it / he assumed it / he passed it on).
- **The office incident** (creative expansion, chosen over three alternatives in `CREATIVE_PROPOSALS.md` P-01): the
  jammed printer prints Wednesday's queued report on Thursday with today's footer — Sabri's "he came *today* too".
- **Completion:** both stages solved; Sabri, deflated, admits the count was wrong — and lets slip that he already sent
  it to «شباب الكراج». *Evidence:* `e-visitor-log`, `e-appointments`, `e-test-schedule`, `e-print-queue`,
  `e-lama-note` (facts),
  `e-sabri-count` (claim → disproved), `e-group-msg` (fact: the message exists), `d-office` (deduction).

### Mission 02 — «رسالة بثمانية أسطوانات» · `s3-02`
*Romantic comedy, cinematic sound, environmental investigation.* **Place:** `s3-street`, her street at night.

- **Walk home (play):** streetlights, the bakery closing (shutter at 21:45), a neighbour's camera above a gate, a
  timer box on a lamp post («الإنارة تتحول للوضع الليلي ١١:٠٠»), Zefiro's plate (ending «١٩») under the streetlight,
  {husky} pulling toward a parked shape. A **non-punishing
  observation pass** (P-07): the player notices the details herself (each tap records a fact); nothing tells her which
  matter — two of them become anchors in Mission 03's recordings.
- **The cinematic:** Zefiro under the trees, Ryan inside, Snooky's head at the window. Ignition, a low burbling idle,
  one controlled blip, the engine's fall back to idle, then off — and the night's quiet coming back. Anji, softly:
  «مجنون… حتى السيارة يحچي بيها وياي.» No racing, no speed: the car never moves.
- **Her answer (decision `v8-answer`):** a wave from the gate, walking over, or a text — each changes the next beat and
  is remembered in the finale.
- *Evidence:* `e-light-timer`, `e-bakery-hours`, `e-neighbour-cam`, `e-plate` (facts), `e-blip` (fact: she witnessed
  one blip at 21:40, engine then off).

### Mission 03 — «لا تصدّقين كلشي ينقال» · `s3-03`
*The central mystery opens.* **Places:** `s3-street` (day), `s3-home` (her room).

- The clip arrives on her phone, then Marius arrives with it (how depends on `marius-honest`: honest → he comes to her
  first, worried and teasing; deflect → he has already heard it from the group and his teasing has an edge).
- Ryan's line: «لا تصدّكين كلشي ينقال. أكو خفايا كثيرة راح أحچيلچ ياها بالوقت المناسب.» He says one of them concerns
  something affecting the two of them, which he found out through a person he trusted — «الله كشفلي شي ما چنت منتبهله».
  He does not name anyone. **Her answer (decision `ryan-trust`):** trust him and investigate with him, or say she needs
  to see it herself first (both valid; Ryan respects either).
- **Gameplay — «الصدى» (audio analysis):** four recordings — the circulated clip, the neighbour camera's two events,
  her own voice memo from the gate, Lama's voice note — shown as waveforms with time marks; she can listen, but every
  clue is also *visible* (P-02, accessibility). She proves two engines, not one: Zefiro's idle burble and single blip
  at 21:40 (bakery shutter after it, lights still in evening mode) against a smooth high idle and repeated hard revs with
  tyre noise after the 23:00 relay click. Not solvable by loudness: the loudest track is the farthest-misleading one
  (P-02 rules).
- **The evidence board opens** (§6): reliability tags appear; the clip becomes *contradicted*.
- *Evidence:* `e-clip` (claim → disproved), `e-rec-cam`, `e-rec-gate`, `e-rec-lama` (facts), `d-two-engines`,
  `t-ryan` (testimony).

### Mission 04 — «الشخص ورا القصة» · `s3-04`
*A fictional person's words and actions do not match.* **Places:** `s3-garage` (the car club), `s3-street`.

- She traces the clip back through its forwards (forward counts, times, an edited caption), reads the municipal noise
  notice (a car whose plate ends «٤٧» — Zefiro's plate, which she can notice on the street in Mission 02, does not;
  the notice names **no colour**, because Zefiro's colour is the player's own choice and one of the choices, *pearl*,
  is pale enough to be mistaken for grey at night — a colour clue would be unfair to some saves),
  and hears Jalal's account: home by 22:30. A petrol-station receipt (23:20, two streets away) dropped in the club's
  bin says otherwise.
- **Gameplay — «سلسلة الإعادة» (the forward chain, logic grid) and «الصدى المحرّف» (where the words changed):** who
  forwarded what to whom, when; then, in the chain of versions of Anji's own sentence (which version depends on
  `sabri-reply`), she marks the exact link where a word was changed (P-03).
- **Lama** (decision `lama-secret`): Anji may trust Lama with what Ryan suspects, or keep it to herself. Lama
  challenges Anji's first theory either way.
- *Evidence:* `e-forward-chain`, `e-caption-edit`, `e-noise-notice`, `e-receipt` (facts), `t-jalal` (claim →
  contradicted), `d-source` (deduction: Jalal captioned the clip).

### Mission 05 — «سنوكي يعرف شي» · `s3-05`
*Snooky finds the object that ties the clues together.* **Place:** `s3-street` (dawn) and the lane behind the bakery.

- Snooky, out with Ryan, will not leave a drain grate; then follows a scent along the lane — a tracking sequence where
  he behaves like a dog (detours after a cat, digs at the wrong spot, comes back, sits). Paw prints, tyre marks, an oil
  drop, a car-club keyring.
- **Gameplay — «وين وگفت السيارة الثانية» (spatial reasoning):** place the two cars on the street grid from tyre marks,
  the oil drop, the camera's field of view and the recordings' distances (P-04). Unique placement.
- *Evidence:* `e-keyring` (fact), `e-tyre-marks` (fact), `d-second-car` (deduction).

### Mission 06 — «غرفة الحقائق السبعة» · `s3-06`
*The major multi-layer logic room.* **Place:** `s3-archive` (the clinic's archive room after hours, Lama's key).

- Seven facts on the wall, three contradictory statements, a timeline with gaps, a physical arrangement (strings on
  the board), and a hidden link between two unrelated events — the bakery's shutter and the noise notice's time.
- **Gameplay:** arrange the timeline; then prove "the clip is Jalal's car, not Zefiro" with **two independent** chains
  of evidence (P-05: a proof is accepted only if it rests on evidence from at least two independent sources).
- *Evidence:* `d-seven` (deduction).

### Mission 07 — «ثلاث طرق وحقيقة وحدة» · `s3-07`
*Branching.* Three roads to the one missing piece — the original, uncut recording — through Marius (his friend's
dashcam), Lama (the clinic's camera log), or Sabri (who he told, and who sent him the clip). Earlier decisions decide
**who volunteers**, **what they ask in return**, and **the order** — never whether the mission can be finished: every
road is completable from any save (`DECISION_FLOW.md` §3 proves it per combination).
- *Evidence:* `e-original` (fact) by any road; `e-dashcam` / `e-cctv-log` / `e-sabri-sender` (road-specific facts).

### Mission 08 — «لمن يحچي السكوت» · `s3-08`
*The emotional finale.* **Place:** `s3-street`, night, then the rose garden (`s3-roses`).

- She presents her case on the board (P-06, a defence with reliability rules: an unverified statement cannot carry a
  conclusion). Jalal, faced with it, admits the caption; Ryan names him only then.
- **"When silence speaks":** Zefiro idles; Ryan turns the engine **off**. The street's sound fades layer by layer
  (P-09). What they say — and how the cinematic is staged — reads the season's decisions (`v8-answer`, `ryan-trust`,
  `sabri-reply`, `marius-honest`). No confession is forced; no wedding, date or promise.
- *Evidence:* `d-truth`.

## 6. Systems (new in Season 3)

1. **The investigation board** (`TECHNICAL_ARCHITECTURE.md` §7): cards with a reliability tag (confirmed fact ·
   unverified statement · contradictory · her hypothesis · disproved), relations she draws herself (supports,
   contradicts, depends on, before, after, same source, different source), checked against the evidence's own
   relation table. An invalid link is refused with a neutral line; correct links are never drawn for her. Her wrong
   theories can live on the board until evidence disproves them.
2. **Reliability is not a label on an object, it is a state:** a claim becomes *contradicted* or *disproved* as she
   proves it (conditions on deductions), and the card shows that change.
3. **Character memory** (`DECISION_FLOW.md`): seven decisions, each read by at least one later mission in a way the
   player sees; tested like Season 2's decision audit.
4. **Zefiro**: one car, drawn properly, in her colour; its synthesised V8 is the same engine model that draws Mission
   03's waveforms (P-02) — what she hears and what she reads are one source.

## 7. Production phases (from the directive) and the vertical slice

| Phase | Content | Exit criterion |
|---|---|---|
| A | this design + the companion documents | consistent; reviewed against canon (§2) |
| B | **vertical slice: Mission 01** (below) | played by touch in Edge and WebKit at 320/360/390/landscape; DOM + browser tests; no Season 1/2 regression |
| C | Zefiro, the V8, Mission 02, the audio puzzle prototype | the waveform puzzle passes the fairness tests |
| D | the board, reliability, contradictions, defence, timeline, decisions | board tests (invalid links refused, nothing auto-drawn) |
| E | Missions 03–08 | each with gameplay, acting, evidence, tests |
| F | integration (ids, links, saves, assets) | the id/graph/decision audits pass |
| G | QA (all suites, mobile, audio, offline, build, privacy) | every gate green |
| H | release candidate — **no merge or deploy without the owner's approval** | report |

**Vertical slice plan (Phase B), in order:**
1. **Season 3's own save** (`snooki-game:s3`): the season router in `core/game.js`, the store, unlock, map page — with
   byte-identity tests for the main and Season 2 saves (`TECHNICAL_ARCHITECTURE.md` §2).
2. **Marius** in the procedural cast (blond, blue-eyed, tall and broad) + the blush/glance acting.
3. **`s3-clinic`** and Mission 01's acting script.
4. **«إعادة بناء الأسبوع»** (strict, two stages) with uniqueness and guess-space tests.
5. Decisions `sabri-reply` and `marius-honest`, each read inside Mission 01 already (Sabri's and Marius's next lines).
6. DOM playthrough + browser test (Edge: 320, 360, 390, landscape; WebKit 390 on the production loop).

## 8. Scope and risks

- **Ryan's art:** Ryan has profile and back art only. His acting in Season 3 is motion, glances and Zefiro; no faked
  frontal art (stated limit, as in Season 2).
- **The car is not a licensed asset:** Zefiro is an original procedural drawing with muscle-car proportions; no
  manufacturer artwork or logo is copied.
- **Audio-only clues are never required:** every audio clue has a visible counterpart (P-02).
- **Fiction that touches real people:** only Jalal and the records are fiction; nobody real is accused of anything.
- **Size:** eight missions is the full season; the release can be staged (like Season 2's M1/M2) if the owner prefers.
