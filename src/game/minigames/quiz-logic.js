/** Clue quiz rules: one correct option per round; wrong options are remembered. */
export function createQuiz() {
  return { index: 0, tried: [], mistakes: 0, done: false };
}

/** @returns {{ correct: boolean, explain?: string, reply?: string }} */
export function answerQuiz(rounds, s, id) {
  if (s.done) return { correct: false };
  const r = rounds[s.index];
  const opt = r.options.find((o) => o.id === id);
  if (!opt || s.tried.includes(id)) return { correct: false };
  if (id === r.answer) {
    s.index += 1;
    s.tried = [];
    s.done = s.index >= rounds.length;
    return { correct: true, explain: r.explain };
  }
  s.tried.push(id);
  s.mistakes += 1;
  return { correct: false, reply: opt.reply };
}

export const quizMedal = (s) => (s.mistakes === 0 ? 'gold' : s.mistakes <= 2 ? 'silver' : 'bronze');
