/**
 * «الداما» — English draughts against Ryan's playing version (also used for
 * the prank «جولة ثأر ريان», options.revenge). Tap a piece: its legal
 * destinations glow (captures are compulsory, multi-jumps are one move).
 * Undo takes back your last move and Ryan's answer. Rules + AI:
 * tabletop/checkers.js (Ryan sees only the board).
 */
import { createCheckers, legalMoves, applyMove, aiMove, count, isDark } from '../tabletop/checkers.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { readyPanel, sayBar, sayScript, momentLines, linesText, playCount, MEDAL_BY_DIFF } from '../tabletop/ui.js';

export const CHECKERS_RULES = [
  'قطعچ الوردية تمشي لفوق، قطع ريان الزرقاء تنزل لجوّا. خطوة وحدة مايلة.',
  'الأكل إجباري: إذا تگدرين تقفزين فوق قطعة، لازم تقفزين. وإذا تگدرين تكمّلين القفز، كمّلي.',
  'القطعة اللي توصل لآخر صف تصير ملكة 👑 وتمشي لكل الاتجاهات (خطوة وحدة).',
  'تربحين لمن ريان ما يگدر يتحرك (ما بقت قطع أو كلها محاصرة).',
  '٤٠ حركة ورا بعض بدون أكل ولا تقدّم = تعادل.',
  'زر «تراجع» يرجّع حركتچ الأخيرة.',
];

export function mount(area, { app, scope, options, hud, finish }) {
  const bar = sayBar();
  const gameId = options.revenge ? 'revenge' : 'checkers';
  const wrap = h('<div class="tt checkers"></div>');
  wrap.append(bar.el);
  area.append(wrap);
  let paused = false;
  sayScript(bar, momentLines(app, gameId, playCount(gameId) && !options.revenge ? 'rematch' : 'before'), scope, app.reduced());

  readyPanel(wrap, { title: options.revenge ? 'جولة ثأر ريان' : 'الداما', rules: CHECKERS_RULES, difficulty: options.difficulty || 'normal' }).then(({ difficulty }) => {
    if (scope.disposed) return;
    const seed = options.seed ?? (Date.now() % 100000);
    let s = createCheckers();
    const history = [];
    let sel = null;
    let thinking = false;
    const board = h(`<div class="ck">
        <div class="ck-board" role="grid" aria-label="رقعة الداما" dir="ltr"></div>
        <p class="ck-msg" role="status" aria-live="polite">دورچ. المسي قطعة وردية.</p>
        <div class="ck-ctl"><button type="button" class="btn btn-ghost btn-small" data-undo>↶ تراجع</button></div>
      </div>`);
    wrap.append(board);
    const grid = board.querySelector('.ck-board');
    const msg = board.querySelector('.ck-msg');
    const undoBtn = board.querySelector('[data-undo]');

    const movesFrom = (i) => legalMoves(s).filter((m) => m.from === i);
    function paint() {
      const legal = s.turn === 'a' && !s.done ? legalMoves(s) : [];
      const movable = new Set(legal.map((m) => m.from));
      const targets = new Map(sel != null ? movesFrom(sel).map((m) => [m.path[m.path.length - 1], m]) : []);
      const lastPath = new Set(s.last ? [s.last.from, ...s.last.path] : []);
      grid.innerHTML = s.board
        .map((p, i) => {
          const dark = isDark(i);
          const cls = [
            'ck-cell',
            dark ? 'is-dark' : '',
            movable.has(i) && !thinking ? 'is-movable' : '',
            sel === i ? 'is-sel' : '',
            targets.has(i) ? 'is-target' : '',
            lastPath.has(i) ? 'is-last' : '',
          ].join(' ');
          const piece = p ? `<span class="ck-piece side-${p.side} ${p.king ? 'is-king' : ''}">${p.king ? '👑' : ''}</span>` : '';
          const label = `${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}${p ? (p.side === 'a' ? ' قطعتچ' : ' قطعة ريان') + (p.king ? ' ملكة' : '') : ''}${targets.has(i) ? ' — المسي للحركة' : ''}`;
          return dark ? `<button type="button" class="${cls}" data-i="${i}" aria-label="${label}">${piece}</button>` : `<span class="${cls}" aria-hidden="true"></span>`;
        })
        .join('');
      undoBtn.disabled = !history.length || thinking;
      hud(`أنجي ${num(count(s, 'a'))} – ${num(count(s, 'r'))} ريان · ${{ easy: 'سهلة', normal: 'عادية', hard: 'صعبة' }[difficulty]}`);
      grid.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => tap(Number(b.dataset.i))));
    }

    function tap(i) {
      if (paused || thinking || s.done || s.turn !== 'a') return;
      const piece = s.board[i];
      if (piece?.side === 'a') {
        const ms = movesFrom(i);
        if (!ms.length) {
          const forced = legalMoves(s).some((m) => m.captures.length);
          msg.textContent = forced ? 'الأكل إجباري: قطعة ثانية عندها أكلة.' : 'هاي القطعة ما عندها حركة.';
          app.audio.play('fail');
          return;
        }
        sel = sel === i ? null : i;
        app.audio.play('tap');
        paint();
        return;
      }
      if (sel == null) return;
      const options2 = movesFrom(sel).filter((m) => m.path[m.path.length - 1] === i).sort((a, b) => b.captures.length - a.captures.length);
      if (!options2.length) return;
      history.push(s);
      s = applyMove(s, options2[0]);
      sel = null;
      app.audio.play(options2[0].captures.length ? 'sparkle' : 'tap');
      msg.textContent = options2[0].captures.length ? `أكلتي ${num(options2[0].captures.length)}!` : 'حركة حلوة.';
      paint();
      if (s.done) return end();
      ryan();
    }

    function ryan() {
      thinking = true;
      msg.textContent = 'ريان يفكر…';
      paint();
      scope.timeout(() => {
        if (scope.disposed) return;
        if (paused) return scope.timeout(ryan, 300);
        const m = aiMove(s, difficulty, seed);
        s = applyMove(s, m);
        thinking = false;
        msg.textContent = m.captures.length ? `ريان أكل ${num(m.captures.length)}.` : 'دورچ.';
        app.audio.play('tap');
        paint();
        if (s.done) end();
      }, app.reduced() ? 120 : 650);
    }

    scope.on(undoBtn, 'click', () => {
      if (thinking || !history.length) return;
      s = history.pop();
      sel = null;
      msg.textContent = 'رجعنا حركة.';
      paint();
    });

    function end() {
      const result = s.result === 'a' ? 'anji' : s.result === 'r' ? 'ryan' : 'draw';
      const moment = result === 'anji' ? 'win' : result === 'ryan' ? 'lose' : 'draw';
      const script = momentLines(app, gameId, moment);
      scope.timeout(
        () =>
          finish({
            completed: result !== 'ryan',
            medal: result === 'anji' ? MEDAL_BY_DIFF[difficulty] : result === 'draw' ? 'bronze' : null,
            score: s.moves,
            lowerIsBetter: true,
            title: result === 'anji' ? 'ربحتي الداما! 👑' : result === 'ryan' ? 'ريان ربح هالمرة' : 'تعادل!',
            summary: `الحركات: ${num(s.moves)}\n${linesText(script)}`,
          }),
        600,
      );
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
