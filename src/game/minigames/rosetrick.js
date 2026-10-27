/**
 * «سباق الورد» — the original trick-taking game against Ryan's playing
 * version. Legal cards glow; illegal ones are dimmed and refuse taps. Ryan
 * plays from a view without Anji's hand (tabletop/rosetrick.js).
 */
import { createRoseTrick, legalCards, playCard, viewFor, aiChoose, HAND } from '../tabletop/rosetrick.js';
import { cardName, SUIT_NAMES } from '../tabletop/deck.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { readyPanel, sayBar, sayScript, momentLines, linesText, playCount, cardHtml, MEDAL_BY_DIFF } from '../tabletop/ui.js';

export const ROSE_RULES = [
  'كل واحد عنده ٦ أوراق. الورد الأزرق 🌹 أقوى نوع (يغلب كل شي).',
  'اللي يبدي يلعب أي ورقة. الثاني لازم يلعب من نفس النوع إذا عنده.',
  'إذا ما عنده من نفس النوع، يلعب أي ورقة — والوردة تربح.',
  'الأكلة للوردة الأعلى، وإذا ماكو ورد: للرقم الأعلى من النوع اللي بدأ.',
  'اللي يربح الأكلة يبدي الجاية. بعد ٦ أكلات: الأكثر يربح، و٣–٣ تعادل.',
  'الأوراق اللي تگدرين تلعبينها تلمع.',
];

export function mount(area, { app, scope, options, hud, finish }) {
  const back = app.game.state.cosmetics.cardBack || 'classic';
  const bar = sayBar();
  const wrap = h('<div class="tt rosetrick"></div>');
  wrap.append(bar.el);
  area.append(wrap);
  let paused = false;
  let busy = false;
  sayScript(bar, momentLines(app, 'rosetrick', playCount('rosetrick') ? 'rematch' : 'before'), scope, app.reduced());

  readyPanel(wrap, { title: 'سباق الورد', rules: ROSE_RULES, difficulty: options.difficulty || 'normal' }).then(({ difficulty }) => {
    if (scope.disposed) return;
    const seed = options.seed ?? (Date.now() % 100000);
    const s = createRoseTrick(seed);
    const board = h(`<div class="rt">
        <div class="rt-opp" aria-label="أوراق ريان"></div>
        <div class="rt-table" aria-live="polite"></div>
        <p class="rt-msg" role="status"></p>
        <div class="rt-hand" aria-label="أوراقچ"></div>
      </div>`);
    wrap.append(board);
    const msg = board.querySelector('.rt-msg');
    const say = (t) => {
      msg.textContent = t;
    };

    function paint() {
      board.querySelector('.rt-opp').innerHTML = s.hands.ryan.map(() => cardHtml(null, { back, down: true, attrs: 'tabindex="-1" aria-hidden="true"', cls: 'is-small' })).join('');
      board.querySelector('.rt-table').innerHTML = s.table.length
        ? s.table.map((t) => `<div class="rt-play"><small>${t.who === 'anji' ? 'أنجي' : 'ريان'}</small>${cardHtml(t.card, { attrs: 'tabindex="-1"' })}</div>`).join('')
        : `<p class="muted small">${s.turn === 'anji' ? 'دورچ تبدين.' : s.turn === 'ryan' ? 'ريان يفكر…' : ''}</p>`;
      const legal = new Set(legalCards(s, 'anji').map((c) => c.id));
      board.querySelector('.rt-hand').innerHTML = s.hands.anji
        .map((c) => cardHtml(c, { attrs: `data-card="${c.id}" ${legal.has(c.id) ? '' : 'aria-disabled="true"'}`, cls: legal.has(c.id) && !busy ? 'is-legal' : 'is-blocked' }))
        .join('');
      hud(`الأكلات: أنجي ${num(s.tricks.anji)} – ${num(s.tricks.ryan)} ريان · ${num(HAND - s.hands.anji.length)}/${num(HAND)}`);
      board.querySelectorAll('[data-card]').forEach((b) => b.addEventListener('click', () => play(b.dataset.card)));
    }

    function afterTrick(res) {
      if (!res.trick) return;
      say(res.trick.winner === 'anji' ? 'الأكلة إلچ! 🌹' : 'الأكلة لريان.');
      app.audio.play(res.trick.winner === 'anji' ? 'sparkle' : 'tap');
    }

    function ryanTurn() {
      if (s.done || s.turn !== 'ryan') return;
      busy = true;
      paint();
      scope.timeout(() => {
        if (scope.disposed) return;
        if (paused) return scope.timeout(ryanTurn, 300);
        const card = aiChoose(viewFor(s, 'ryan'), difficulty, seed);
        const res = playCard(s, 'ryan', card.id);
        if (!res.trick) say(`ريان لعب ${cardName(card)}.`);
        afterTrick(res);
        busy = false;
        settle(res);
      }, app.reduced() ? 150 : 700);
    }

    function settle(res) {
      if (res?.trick) {
        // show the finished trick for a moment, then clear
        const shown = res.trick.cards;
        board.querySelector('.rt-table').innerHTML = shown.map((t) => `<div class="rt-play ${t.who === res.trick.winner ? 'is-win' : ''}"><small>${t.who === 'anji' ? 'أنجي' : 'ريان'}</small>${cardHtml(t.card, { attrs: 'tabindex="-1"' })}</div>`).join('');
        busy = true;
        scope.timeout(() => {
          busy = false;
          if (s.done) return end();
          paint();
          ryanTurn();
        }, app.reduced() ? 300 : 1100);
        return;
      }
      paint();
      ryanTurn();
    }

    function play(id) {
      if (paused || busy || s.turn !== 'anji') return;
      const res = playCard(s, 'anji', id);
      if (!res.ok) {
        const led = s.table[0]?.card.suit;
        say(led ? `لازم تلعبين ${SUIT_NAMES[led]} إذا عندچ.` : 'مو دورچ.');
        app.audio.play('fail');
        return;
      }
      app.audio.play('tap');
      afterTrick(res);
      settle(res);
    }

    function end() {
      const moment = s.result === 'anji' ? 'win' : s.result === 'ryan' ? 'lose' : 'draw';
      const script = momentLines(app, 'rosetrick', moment);
      finish({
        completed: s.result !== 'ryan',
        medal: s.result === 'anji' ? MEDAL_BY_DIFF[difficulty] : s.result === 'draw' ? 'bronze' : null,
        score: s.tricks.anji,
        title: s.result === 'anji' ? 'ربحتي السباق! 🌹' : s.result === 'ryan' ? 'ريان ربح هالمرة' : 'تعادل ٣–٣!',
        summary: `الأكلات: أنجي ${num(s.tricks.anji)} – ${num(s.tricks.ryan)} ريان (صعوبة: ${{ easy: 'سهلة', normal: 'عادية', hard: 'صعبة' }[difficulty]})\n${linesText(script)}`,
      });
    }

    paint();
  });

  return {
    start() {},
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
  };
}
