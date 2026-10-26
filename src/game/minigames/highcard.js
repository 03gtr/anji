/**
 * «الورقة الأعلى» — short High Card rounds against Ryan's playing version.
 * One tap reveals both top cards; ties ("حرب صغيرة") keep the cards in the
 * middle for the next round. Rules: tabletop/highcard.js.
 */
import { createHighCard, playRound } from '../tabletop/highcard.js';
import { cardName } from '../tabletop/deck.js';
import { h, esc } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { readyPanel, sayBar, sayScript, momentLines, linesText, playCount, cardHtml } from '../tabletop/ui.js';

export function mount(area, { app, scope, options, hud, finish }) {
  const back = app.game.state.cosmetics.cardBack || 'classic';
  const bar = sayBar();
  const wrap = h('<div class="tt highcard"></div>');
  wrap.append(bar.el);
  area.append(wrap);
  let paused = false;
  sayScript(bar, momentLines(app, 'highcard', playCount('highcard') ? 'rematch' : 'before'), scope, app.reduced());

  readyPanel(wrap, {
    title: 'الورقة الأعلى',
    rules: ['كل جولة: كل واحد يكشف ورقته اللي فوق.', 'الرقم الأعلى يربح الجولة وياخذ الأوراق اللي بالنص.', 'تعادل؟ «حرب صغيرة»: الأوراق تبقى بالنص، والجولة الجاية تاخذها كلها.', 'بعد ١٠ جولات: اللي جمع أوراق أكثر يربح. الحظ هنا كله: ماكو غش، ماكو تخطيط.', 'الترتيب: ١ … ٩، بعدين سنوكي (١٠)، منذر (١١)، الوردة (١٢).'],
    diffs: null,
  }).then(() => {
    if (scope.disposed) return;
    const s = createHighCard(options.seed ?? (Date.now() % 100000));
    const board = h(`<div class="hc">
        <div class="hc-side"><b>ريان</b><span class="hc-pile" data-pile="ryan"></span><span class="hc-won" data-won="ryan"></span></div>
        <div class="hc-table" aria-live="polite"><div class="hc-slot" data-slot="ryan"></div><div class="hc-pot"></div><div class="hc-slot" data-slot="anji"></div></div>
        <div class="hc-side"><b>أنجي</b><span class="hc-pile" data-pile="anji"></span><span class="hc-won" data-won="anji"></span></div>
        <p class="hc-msg" role="status"></p>
        <button type="button" class="btn btn-primary btn-big hc-go">اكشفي الورقة 🃏</button>
      </div>`);
    wrap.append(board);
    const msg = board.querySelector('.hc-msg');
    const paint = () => {
      for (const who of ['anji', 'ryan']) {
        board.querySelector(`[data-pile="${who}"]`).innerHTML = s.piles[who].length ? cardHtml(null, { back, down: true, attrs: 'tabindex="-1" aria-hidden="true"' }) : '';
        board.querySelector(`[data-won="${who}"]`).textContent = `ربح ${num(s.won[who])} ورقة`;
        board.querySelector(`[data-slot="${who}"]`).innerHTML = s.last
          ? `${cardHtml(s.last[who], { attrs: 'tabindex="-1"', cls: s.last.winner === who ? 'is-win' : '' })}<small>${who === 'anji' ? 'أنجي' : 'ريان'}</small>`
          : '';
      }
      board.querySelector('.hc-pot').textContent = s.pot.length ? `بالنص: ${num(s.pot.length)} 🃏` : '';
      hud(`الجولة ${num(s.round)}/${num(s.rounds)} · أنجي ${num(s.won.anji)} – ${num(s.won.ryan)} ريان`);
    };
    paint();
    const go = board.querySelector('.hc-go');
    go.focus({ preventScroll: true });
    scope.on(go, 'click', () => {
      if (paused || s.done) return;
      const r = playRound(s);
      app.audio.play(r.winner === 'tie' ? 'boing' : r.winner === 'anji' ? 'sparkle' : 'tap');
      msg.textContent =
        r.winner === 'tie'
          ? `تعادل: ${cardName(r.anji)} و${cardName(r.ryan)} — حرب صغيرة! الأوراق تبقى بالنص.`
          : `${r.winner === 'anji' ? 'إلچ' : 'لريان'}: ${cardName(r[r.winner])} أعلى · أخذ ${num(r.taken)} أوراق`;
      paint();
      if (s.done) {
        go.disabled = true;
        const moment = s.result === 'anji' ? 'win' : s.result === 'ryan' ? 'lose' : 'draw';
        const script = momentLines(app, 'highcard', moment);
        scope.timeout(
          () =>
            finish({
              completed: s.result !== 'ryan',
              medal: s.result === 'anji' ? (s.won.anji >= 30 ? 'gold' : 'silver') : s.result === 'draw' ? 'bronze' : null,
              score: s.won.anji,
              title: s.result === 'anji' ? 'ربحتي! 🃏' : s.result === 'ryan' ? 'ريان ربح هالمرة' : 'تعادل!',
              summary: `أنجي ${num(s.won.anji)} – ${num(s.won.ryan)} ريان\n${linesText(script)}`,
            }),
          app.reduced() ? 200 : 900,
        );
      }
    });
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
