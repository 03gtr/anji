/**
 * The evidence notebook (journal → «الأدلة»): which journal entries are observed
 * facts and which are deductions, per mission, and where each fact was found.
 * Ids are journal ids (stable, saved); nothing here is shown until she has it:
 * unfound facts only count, unsolved deductions only say they are open.
 *
 *   facts:     [{ id: journal id, place: world id }]
 *   deduction: { id: journal id shown once solved, solved: condition, board?: puzzle id
 *                that tests the theory from the notebook once every fact is found }
 */
export const EVIDENCE = [
  {
    mission: 'sp2-archives',
    facts: [
      { id: 'sp2-ledger', place: 'archives' },
      { id: 'sp2-clue-a', place: 'house' },
      { id: 'sp2-clue-b', place: 'academy' },
      { id: 'sp2-clue-c', place: 'sanctuary' },
    ],
    deduction: { id: 'sp2-key', solved: 'flag:sp2-deduced', board: 'sp2-ledger' },
  },
  {
    mission: 'sp2-letters',
    facts: [
      { id: 'sp2-letter-0', place: 'archives' },
      { id: 'sp2-letter-1', place: 'observatory' },
      { id: 'sp2-letter-2', place: 'library' },
      { id: 'sp2-letter-3', place: 'lake' },
    ],
    deduction: { id: 'sp2-letters', solved: 'flag:sp2-letters-done' },
  },
  {
    mission: 'sp2-twist',
    facts: [
      { id: 'sp2-coded-line', place: 'archives' },
      { id: 'sp2-coded', place: 'archives' },
    ],
    deduction: { id: 'sp2-assumption', solved: 'flag:sp2-assumption-done' },
  },
  {
    mission: 'sp2-final',
    facts: [
      { id: 'sp2-map-marks', place: 'workshop' },
      { id: 'sp2-insc-1', place: 'corridor' },
      { id: 'sp2-insc-2', place: 'lake' },
      { id: 'sp2-insc-3', place: 'observatory' },
    ],
    deduction: { id: 'sp2-final-rule', solved: 'flag:sp2-final-rule' },
  },
  {
    mission: 'sp1-unsigned-gift',
    facts: [{ id: 'sp1-clues', place: 'roads' }],
    deduction: { id: 'sp1-promise', solved: 'flag:sp1-gift-open' },
  },
  // Phase 04 «الحديقة العميقة»: `question` is the open question the investigation answers,
  // shown while it is unsolved (the investigation overview); never part of the answer
  {
    mission: 'dg-night',
    question: 'شنو صار بالورشة ليلة اختفاء البذرة، وبأي ترتيب؟',
    facts: [
      { id: 'dg-box', place: 'workshop' },
      { id: 'dg-guestbook', place: 'workshop' },
      { id: 'dg-clock-1', place: 'clockgarden' },
      { id: 'dg-clock-2', place: 'clockgarden' },
      { id: 'dg-clock-3', place: 'clockgarden' },
      { id: 'dg-clock-4', place: 'clockgarden' },
      { id: 'dg-letters', place: 'letterhall' },
      { id: 'dg-bed', place: 'house' },
      { id: 'dg-log', place: 'observatory' },
    ],
    deduction: { id: 'dg-timeline', solved: 'flag:dg-timeline' },
  },
  {
    mission: 'dg-trails',
    question: 'أي تفسير لاختفاء البذرة يصمد گدام كل الأدلة؟',
    facts: [
      { id: 'dg-trails', place: 'falsetrails' },
      { id: 'dg-pot', place: 'conservatory' },
    ],
    deduction: { id: 'dg-hypo', solved: 'flag:dg-hypo' },
  },
  {
    mission: 'dg-stars',
    question: 'شنو كتب ريان بالنجوم؟',
    facts: [
      { id: 'dg-pattern', place: 'sealedroom' },
      { id: 'dg-key', place: 'starchamber' },
    ],
    deduction: { id: 'dg-mirror', solved: 'flag:dg-mirror' },
  },
  {
    mission: 'dg-seed',
    question: 'شنو تحتاج البذرة حتى تصحى؟ وشلون تنزرع؟',
    facts: [
      { id: 'dg-note-water', place: 'roots' },
      { id: 'dg-note-heat', place: 'hyporoom' },
      { id: 'dg-strip-a', place: 'letterhall' },
      { id: 'dg-strip-b', place: 'mirrorhouse' },
      { id: 'dg-strip-c', place: 'bridge' },
      { id: 'dg-strip-d', place: 'forgottengreen' },
    ],
    deduction: { id: 'dg-done', solved: 'flag:dg-done' },
  },
  // optional discoveries
  { mission: 'sp2-trail', optional: true, facts: [], deduction: { id: 'sp2-trail', solved: 'flag:sp2-trail-done' } },
  { mission: 'sp2-sequence', optional: true, facts: [], deduction: { id: 'sp2-sequence', solved: 'flag:sp2-sequence-done' } },
  { mission: 'dg-music', optional: true, facts: [{ id: 'dg-song', place: 'musicroom' }], deduction: { id: 'dg-song', solved: 'flag:dg-song' } },
];
