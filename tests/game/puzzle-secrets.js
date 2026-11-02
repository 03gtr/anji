/**
 * What a hint must never say about a puzzle (shared by tests/game/guides.test.js and tests/game/mission-hints.test.js):
 * the strings that name an answer, and the pairs that would place a card, a row or a line together with its answer.
 */
import { logicgridSolutions } from '../../src/game/puzzles/rules.js';

const label = (x) => String(x?.label ?? x?.text ?? x ?? '').trim();

/** Every string a hint must never contain, and pairs it must never contain together. */
export function secrets(p) {
  const c = p.config;
  const alone = [];
  const pairs = [];
  const opt = (list, id) => label(list?.find((o) => (o.id ?? o) === id));
  switch (p.type) {
    case 'sort':
      for (const st of c.stages) {
        if (st.kind === 'sort') for (const card of st.cards) pairs.push([label(card), opt(st.bins, card.accepts[0])]);
        else for (const id of st.answers ?? [st.answer]) alone.push(opt(st.options, id));
      }
      break;
    case 'contradict':
      for (const st of c.stages) {
        if (st.answer.claim >= 0) alone.push(label(st.claims[st.answer.claim]));
        for (const e of [].concat(st.answer.evidence)) alone.push(opt(st.evidence ?? c.evidence, e));
      }
      break;
    case 'deduction':
      alone.push(opt(c.suspects ?? c.options, c.answer.suspect));
      for (const e of c.answer.evidence) alone.push(opt(c.evidence, e));
      break;
    case 'rubbing':
      for (const id of c.answers ?? [c.answer]) alone.push(opt(c.options, id));
      break;
    case 'logicgrid': {
      const [sol] = logicgridSolutions(c);
      for (const r of c.rows) for (const col of c.cols) pairs.push([label(r), opt(col.options, sol[r.id][col.id])]);
      break;
    }
    case 'arrange':
      for (const slot of c.slots) pairs.push([opt(c.pieces, slot.accepts[0]), label(slot)]);
      break;
    case 'testimony':
      for (const v of p.versions) {
        const [beat, ev] = v.breaks;
        alone.push(label(v.beats.find((b) => b.id === beat)?.t));
        pairs.push([label(v.beats.find((b) => b.id === beat)?.t), ev]);
      }
      break;
    // (the original game's puzzles, read by the mission hints)
    case 'choice':
      for (const id of [].concat(c.answer ?? [])) alone.push(opt(c.options, id));
      break;
    case 'sequence':
      // the order is the answer: its first and last steps would give it away
      if (Array.isArray(c.answer) && c.answer.length) for (const id of [c.answer[0], c.answer[c.answer.length - 1]]) alone.push(opt(c.items, id));
      break;
    default:
      break; // lock, clock, shadows: their answers are numbers (no digit at all is allowed)
  }
  return { alone: alone.filter((s) => s.length >= 4), pairs: pairs.filter(([a, b]) => a.length >= 2 && b.length >= 2) };
}

