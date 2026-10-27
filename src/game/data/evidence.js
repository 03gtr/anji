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
  // optional discoveries
  { mission: 'sp2-trail', optional: true, facts: [], deduction: { id: 'sp2-trail', solved: 'flag:sp2-trail-done' } },
  { mission: 'sp2-sequence', optional: true, facts: [], deduction: { id: 'sp2-sequence', solved: 'flag:sp2-sequence-done' } },
];
