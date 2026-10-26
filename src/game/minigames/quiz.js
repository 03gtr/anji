/**
 * Clue quiz: rounds of "look at this clue, pick the answer" with
 * explanations. Used for animal tracks at the sanctuary and similar
 * investigations. Data lives in quiz-sets.js; rules are in quiz-logic.js.
 */
import { QUIZ_SETS } from './quiz-sets.js';
import { createQuiz, answerQuiz, quizMedal } from './quiz-logic.js';
import { symbol } from '../ui/symbols.js';
import { h, esc } from '../ui/dom.js';
import { num } from '../ui/format.js';

export function mount(area, { app, scope, options, hud, finish }) {
  const set = QUIZ_SETS[options.set];
  const s = createQuiz(set.rounds);
  let paused = false;
  let locked = false;

  area.append(h(`<div class="quiz"><p class="quiz-intro">${esc(set.intro)}</p><section class="quiz-card card"></section><p class="quiz-say" aria-live="polite"></p></div>`));
  const card = area.querySelector('.quiz-card');
  const say = (t, kind = '') => {
    const el = area.querySelector('.quiz-say');
    el.textContent = t;
    el.dataset.kind = kind;
  };

  function render() {
    const r = set.rounds[s.index];
    card.innerHTML = `
      <p class="quiz-step">${num(s.index + 1)}/${num(set.rounds.length)}</p>
      <div class="quiz-clue">${r.icon ? symbol(r.icon) : ''}<p>${esc(r.clue)}</p></div>
      <div class="choice-grid">${r.options
        .map((o) => `<button type="button" class="choice-item" data-id="${o.id}" ${s.tried.includes(o.id) ? 'disabled' : ''}>${o.icon ? symbol(o.icon) : ''}<span>${esc(o.label)}</span></button>`)
        .join('')}</div>`;
    card.querySelectorAll('[data-id]').forEach((b) =>
      b.addEventListener('click', () => {
        if (paused || locked) return;
        const res = answerQuiz(set.rounds, s, b.dataset.id);
        if (res.correct) {
          app.audio.play('success');
          say(res.explain || 'صح!', 'good');
          b.classList.add('is-right');
          locked = true;
          scope.timeout(() => {
            locked = false;
            if (s.done) {
              finish({
                completed: true,
                score: s.mistakes,
                lowerIsBetter: true,
                medal: quizMedal(s),
                title: set.doneTitle || 'تحقيق ناجح! 🔎',
                summary: `أخطاء: ${num(s.mistakes)}`,
              });
            } else {
              say('');
              render();
            }
          }, app.reduced() ? 900 : 1600);
        } else {
          app.audio.play('fail');
          say(res.reply || 'مو هذا.', 'bad');
          render();
        }
        hud(`🔎 ${num(s.index)}/${num(set.rounds.length)} · أخطاء ${num(s.mistakes)}`);
      }),
    );
  }

  return {
    start() {
      hud(`🔎 ٠/${num(set.rounds.length)}`);
      render();
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
    state: s,
  };
}
