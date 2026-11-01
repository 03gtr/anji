/**
 * Season 2, Mission 06 «حقيقة البطاقة»: defending a theory in front of everyone (a pure rule; ui/defend.js is
 * its bar, acted out in the case room). Not one of the shared puzzle types: it lives on its own, like a
 * minigame's logic file, and is tested on its own (tests/game/s2-m06.test.js).
 *
 * config: {
 *   hypotheses: [id…],
 *   challenges: { [hypothesis]: [{ id, answer: [evidenceId…] | null }] },   // null: nothing she holds answers it
 * }
 * state: { pick, i, done: { [hypothesis]: answered }, broken: [hypothesis…], wrong }
 *
 *   choose(h)    she pins a theory and defends it; she resumes at the first challenge she has not answered yet
 *   present(ev)  a piece of evidence against the current challenge: only one in its `answer` list answers it;
 *                anything else is 'wrong' and says nothing about how close it was
 *   concede()    "I have no answer": a challenge nothing answers BREAKS the theory ('broken'); a challenge that
 *                has an answer only steps her back to the board (what she answered is kept)
 *
 * Only a theory whose every challenge has an answer can be 'solved'. Nothing is ever disabled: a broken theory
 * can be chosen again (and breaks again).
 */
export const defend = {
  init: () => ({ pick: null, i: 0, done: {}, broken: [], wrong: 0 }),
  choose(config, state, hyp) {
    if (!config.hypotheses.includes(hyp)) return { state, outcome: 'noop' };
    return { state: { ...state, pick: hyp, i: state.done[hyp] || 0 }, outcome: 'progress' };
  },
  present(config, state, evidence) {
    const ch = state.pick && config.challenges[state.pick][state.i];
    if (!ch) return { state, outcome: 'noop' };
    if (!ch.answer?.includes(evidence)) return { state: { ...state, wrong: state.wrong + 1 }, outcome: 'wrong' };
    const i = state.i + 1;
    const next = { ...state, i, done: { ...state.done, [state.pick]: i } };
    return { state: next, outcome: i >= config.challenges[state.pick].length ? 'solved' : 'progress' };
  },
  concede(config, state) {
    const ch = state.pick && config.challenges[state.pick][state.i];
    if (!ch) return { state, outcome: 'noop' };
    if (ch.answer?.length) return { state: { ...state, pick: null, i: 0 }, outcome: 'progress' };
    const broken = state.broken.includes(state.pick) ? state.broken : [...state.broken, state.pick];
    return { state: { ...state, pick: null, i: 0, broken }, outcome: 'broken' };
  },
};

/** Whether a theory can survive: every one of its challenges has an answer. */
export const holds = (config, hyp) => config.challenges[hyp].every((c) => c.answer?.length > 0);

/** Moves that defend the surviving theory from the start (tests). */
export function defendSolution(config) {
  const hyp = config.hypotheses.find((h) => holds(config, h));
  return hyp ? [['choose', hyp], ...config.challenges[hyp].map((c) => ['present', c.answer[0]])] : null;
}

/** Replays moves through the rule (tests): the last outcome and state. */
export function replayDefend(config, moves, state = defend.init(config)) {
  let outcome = 'noop';
  for (const [action, ...args] of moves) {
    const res = defend[action](config, state, ...args);
    state = res.state;
    outcome = res.outcome;
  }
  return { state, outcome };
}
