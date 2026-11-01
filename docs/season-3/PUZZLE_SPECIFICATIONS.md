# Season 3 — puzzle specifications

**Rules for every Season 3 puzzle** (tested, as Season 2's `tests/game/s2-fairness.test.js` and `s2-no-help.test.js`):
strict (no hint, no "show the answer", no skip — none rendered, none bound); a wrong try gets one of the neutral lines
(`STRICT_WRONG`) and never says which part is wrong; what she placed stays placed; a unique solution, proven
programmatically where the space can be enumerated; a guess space of at least 8 per stage and 20 per puzzle; no line
before the puzzle (dialogue, objective, journal, card label) contains its answer words. Status per puzzle in brackets.

## P-01 · «إعادة بناء الأسبوع» · `s3-office` · Mission 01 [built]

Type: `sort`, two strict stages (cards into bins; the existing rule and view, so mouse, touch and keyboard all work).

**What she has (evidence cards she collected in the clinic):**

| Card | Content |
|---|---|
| Visitor log | the six lines below (one shared book: visitors and staff stepping out) |
| Appointment book | Ryan: Sun 09:15 «فحص»; Wed 16:30 «توقيع الطبيب — ما چان موجود الأحد». Sabri: Thu 09:15. |
| Licensing-test schedule | Ryan's driving test: Thu 11:00 — «لازم تقرير طبي موقّع». |
| Printer queue slip | job «تقرير — ريان» sent Wed 16:45 · paper jam · printed Thu 09:04. |
| Lama's note | «ربيع يكتب بس «ر.»، كسلان. يطلع للگهوة كل يوم، وأيام الثلاثاء يجيب تقارير المختبر.» |
| Sabri's phone note | «ريان: الأحد، الأحد، الثلاثاء، الأربعاء، اليوم!! خمس مرات بأسبوع 😏» |

**Stage A — «منو كتب كل سطر؟»** · 7 cards → 4 bins (ريان · ربيع · صبري · «مو زيارة»)

| Card | Bin | Why (the deduction she makes) |
|---|---|---|
| L1 الأحد ٠٩:١٠ «ر.» «تقرير طبي» | ريان | Ryan's exam was booked Sun 09:15; Rabi' only fetches reports on Tuesdays |
| L2 الأحد ١٣:٣٠ «ر.» «گهوة» | ربيع | Lama: Rabi' signs «ر.» for coffee every day |
| L3 الثلاثاء ١٢:٠٥ «ر.» «تقرير» | ربيع | Ryan has no Tuesday appointment; Tuesdays are Rabi''s lab runs (the trap: "تقرير" looks like Ryan) |
| L4 الأربعاء ١٦:٤٠ «ر.» «توقيع» | ريان | Wed 16:30 signature appointment, test on Thursday |
| L5 الخميس ٠٩:٠٠ «ص.» «تقرير طبي» | صبري | his own appointment, Thu 09:15 |
| L6 الخميس ٠٩:٠٢ «ر.» «گهوة» | ربيع | coffee |
| P «تقرير ريان — طُبع الخميس ٠٩:٠٤» (the sheet on the printer) | «مو زيارة» | the queue slip: sent Wednesday, printed after the jam |

Guess space 4⁷ = 16 384; unique (each card is forced by one record, checked in tests by enumerating all 16 384).

**Stage B — «شنو نوع كل كلام؟»** · Sabri's 6 claims → 4 bins, defined on the cards themselves:
«صار — سجل يثبته» · «شافه بعينه — ما بيه سجل، بس چان حاضر» · «افترضه — لا سجل ولا شاهد» · «نقله — حچاه لغيره»

| Claim | Bin | Why |
|---|---|---|
| «ريان سجّل بالسجل الأحد ٩:١٠» | صار | L1 + the appointment book |
| «ريان رجع الأربعاء» | صار | L4 + the appointment book |
| «لمى ضحكت لمن جبت طاري ريان» | شافه | no record — but he was there (and so was the player: Lama's hidden smile in the opening) |
| «ريان جه اليوم هم» | افترضه | the printer slip shows it was a print, not a visit |
| «ريان يجي هنا خمس مرات بالأسبوع» | افترضه | Stage A: two of the five were Ryan |
| «گلت لشباب الكراج إن ريان ساكن بالعيادة» | نقله | his own group message |

Guess space 4⁶ = 4 096; unique (enumerated in tests). Whole puzzle: 16 384 × 4 096.

**No leaks:** the objective says «رتّبي الأسبوع من السجلات» (never which line is whose); no line before the puzzle
says which «ر.» is Rabi'. Answer words checked by the leak scan: «ربيع كتب», «مو ريان», «طابعة طبعت», «مو زيارة».

## P-02 · «الصدى» · audio analysis · `s3-echo` · Mission 03 [built]

Four recordings as waveform strips on one time axis (21:30–23:30), each with its source and its anchors. She marks, on
each recording, **which engine** (Zefiro / another) and **which events** it contains; then orders the events.

- Visible features (the waveform is drawn from the same engine model as the sound, `engine-voice.js`): Zefiro's idle
  has a regular double-pulse "burble" (half-order modulation); the other engine's idle is smooth and higher; a blip is
  one rise and fall; hard revving is repeated rises with a noise band (tyres).
- Anchors: the bakery shutter (a long rattle, 21:45 every night); the street-light relay (a click, 23:00); her gate's
  hinge in her own memo.
- **Not solvable by loudness:** the loudest recording (the clip, phone-mic close to a wall) is the *farthest* from the
  car; distance is read from the ratio of engine to ambience, not from level. A test asserts that ranking recordings
  by peak level gives a wrong answer.
- **Accessible without hearing:** every audible distinction has a drawn counterpart; sound is optional. Tested: the
  puzzle's solver uses only the drawn data.
- Guess space: 2⁴ engine labels × ordered events (≥ 8! / symmetries) — measured in tests; unique.

## P-03 · «الصدى المحرّف» · where the words changed · `s3-whisper` · Mission 04 [built]

Her own Mission 01 sentence (the version depends on `sabri-reply`) passes through five people; she has each version
(messages, testimony). She marks the **one link** where a word was changed and **which word**. Unique: exactly one
link changes meaning; the others change only form (word order, a filler word) — the rule card says "a change that
keeps the meaning is not a change". Guess space: 5 links × the changed word's candidates ≥ 20.

## P-04 · «سلسلة الإعادة» · the forward chain · `s3-forward` · Mission 04 [built]

A `logicgrid`: senders × receivers × times from forward metadata, caption edits and testimony. Unique by the existing
`logicgridSolutions` enumerator.

## P-05 · «وين وگفت السيارة الثانية» · spatial placement · `s3-park` · Mission 05 [built]

A street grid (both kerbs, 6 bays each). Place Zefiro and the other car from: tyre marks (direction, which kerb), an oil
drop, the neighbour camera's field of view (what it did and did not see), and Mission 03's distance ratios. Unique
placement, checked by enumerating every pair of bays (12 × 11).

## P-06 · «غرفة الحقائق السبعة» · `s3-seven` · Mission 06 [built]

Two layers: (1) `arrange` — the night's timeline with gaps; (2) a **proof**: choose the conclusion and the evidence
that proves it; accepted only if the evidence forms **two independent chains** (no shared source). The source of each
item is data; independence is computed, never hand-marked. Unique set of minimal proofs, enumerated in tests.

## P-07 · observation (non-punishing) · Mission 02 [built]

The street at night: details to notice (timer box, bakery hours, camera, plate). No timer fails her; nothing tells her
which detail matters. Each noticed detail is evidence; the ones she skipped can be noticed later (Mission 03 sends her
back if she needs them — never a dead end).

## P-08 · «ثلاث طرق» · Mission 07 [built]

Not a single puzzle: each road ends in a small strict puzzle (Marius: the dashcam's timestamps — `series`; Lama: the
camera log — `lock` from the log's own rule; Sabri: who he sent it to — `contradict`). Every road yields `e-original`.

## P-09 · the final defence and «السكوت» · Mission 08 [built]

The board's case presented as a defence (Season 2's `defend` rules, with Season 3's reliability rule: a challenge
cannot be answered with an unverified statement or a disproved one). Then the silence: the street's sound layers fade
one by one as she identifies each (engine, relay hum, a dog, the bakery fan…) until only the two of them are left — a
listening moment that cannot be failed.

## As built (2026-11-01)

The checks below come from `tests/game/s3-season.test.js` unless another file is named. Every puzzle is strict, has
one answer, and is solved by its own rules.

- **P-01 `s3-office`.** Sort, 4⁷ × 4⁶ guesses. Tested in `tests/game/s3-m01.test.js`.
- **P-02 `s3-echo`.** Three stages:
  1. five drawn recordings into two engines (2⁵);
  2. four sounds into four times (4⁴);
  3. "tick every statement that holds" (2⁶).

  The waveforms are drawn by `data/s3/art.js` `waveSvg()` from the same model the sound is rendered from
  (`core/engine-voice.js`). Tested: the loudest recording is the least clear (the clip), Zefiro's strokes alternate
  (the burble) and the other engine's do not, and the anchors fall where the night puts them.
- **P-03 `s3-whisper-<sabri-reply>`.** One puzzle per answer she gave in Mission 01. Two stages:
  1. five links into "same meaning / changed" (2⁵; exactly one is changed, `CHANGED_LINK`);
  2. "tick what changed" (2⁴).

  Each chain starts from her own Mission 01 words.
- **P-04 `s3-forward`.** Logic grid, 3 rows × 3 columns of 3 (3⁹), seven clues. Unique, and every clue is needed.
- **P-05 `s3-park`.** Logic grid, two cars × kerb × bay (144 placements), six clues. Unique, and every clue is needed.
- **P-06 `s3-seven`.** Two stages:
  1. nine cards into seven times plus «كلام بس» (8⁹);
  2. seven cards into sound / paper / proves nothing (3⁷).

  The two chains share no source, and no statement is in either chain (computed from the data).
- **P-07.** The street's details are optional facts. If two anchors were walked past, Mission 03 sends her back to
  the street, never to a dead end.
- **P-08 `s3-dashcam` · `s3-camlog` · `s3-backup`.** One per road. Each has a pick from eight, then "tick what was
  cut" (2⁵). Every road yields `e-original`. The test plays all 216 combinations of decisions and road.
- **P-09 `s3-defence`.** Five of Jalal's statements into seven evidence cards (7⁵). The two statement cards
  (`t-jalal`, `e-clip`) are never an answer. Then «السكوت»: three sounds she names in any order, then the engine. It
  cannot be failed.
