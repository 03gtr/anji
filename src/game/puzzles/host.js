/**
 * Puzzle overlay: shared shell (title, objective, feedback, progressive hints,
 * give-up/return) around a type-specific view. Solving applies the puzzle's
 * reward effects once and records the result.
 */
import { RULES, nextHint } from './rules.js';
import { VIEWS } from './views.js';
import { applyEffects } from '../core/effects.js';
import { h, esc, tx, ICONS } from '../ui/dom.js';

export function openPuzzle(app, def) {
  const { game, audio, settings } = app;
  const rules = RULES[def.type];
  const view = VIEWS[def.type];
  if (!rules || !view) throw new Error(`Unknown puzzle type ${def.type}`);

  return app.overlays.open(
    (el, { close, scope }) => {
      let state = rules.init(def.config);
      let hintsUsed = 0;
      let solved = false;
      el.append(
        h(`<section class="panel puzzle puzzle-${def.type}">
          <header class="panel-head">
            <h2 tabindex="-1">${esc(tx(def.title))}</h2>
            <button type="button" class="icon-btn" data-act="close" aria-label="رجوع">${ICONS.close}</button>
          </header>
          <p class="puzzle-intro">${esc(tx(def.intro))}</p>
          <div class="puzzle-body"></div>
          <p class="puzzle-feedback" role="status" aria-live="polite"></p>
          <ol class="puzzle-hints" hidden></ol>
          <footer class="panel-foot">
            <button type="button" class="btn btn-ghost" data-act="hint">${ICONS.hint}<span></span></button>
          </footer>
        </section>`),
      );
      const body = el.querySelector('.puzzle-body');
      const feedback = el.querySelector('.puzzle-feedback');
      const hintsEl = el.querySelector('.puzzle-hints');
      const hintBtn = el.querySelector('[data-act="hint"]');
      const panel = el.querySelector('.panel');

      const updateHintBtn = () => {
        const left = (def.hints?.length || 0) - hintsUsed;
        hintBtn.querySelector('span').textContent = left > 0 ? `تلميح (${left})` : 'ماكو تلميحات بعد';
        hintBtn.disabled = left <= 0 || solved;
        hintBtn.hidden = !settings.get().hints || !def.hints?.length;
      };

      const say = (text, kind = '') => {
        feedback.textContent = tx(text);
        feedback.dataset.kind = kind;
      };

      function finish() {
        solved = true;
        audio.play('success');
        audio.vibrate([20, 40, 20]);
        panel.classList.add('is-solved');
        say(def.success || 'انحلّت! ✨', 'good');
        const r = game.recordResult(`puzzle:${def.id}`, { completed: true, score: state.mistakes ?? state.moves ?? 0, lowerIsBetter: true });
        const changes = r.firstClear ? applyEffects(def.reward, game) : [];
        app.ui.announce?.(changes);
        const done = h('<button type="button" class="btn btn-primary btn-big" data-autofocus>كمّلي ✨</button>');
        done.addEventListener('click', () => close({ solved: true, hintsUsed }));
        el.querySelector('.panel-foot').replaceChildren(done);
        done.focus({ preventScroll: true });
      }

      const api = {
        def,
        get state() {
          return state;
        },
        act(action, ...args) {
          if (solved) return 'noop';
          const res = rules[action](def.config, state, ...args);
          state = res.state;
          if (res.outcome === 'wrong') {
            audio.play('fail');
            audio.vibrate(60);
            panel.classList.remove('shake');
            void panel.offsetWidth;
            if (!app.reduced()) panel.classList.add('shake');
            const replies = def.wrong || ['مو هيچ… جرّبي مرة ثانية.'];
            const option = def.config.options?.find((o) => o.id === args[0]);
            say(option?.reply || replies[(Math.max(1, state.mistakes) - 1) % replies.length], 'bad');
          } else if (res.outcome === 'progress') {
            audio.play('tap');
            say('');
          }
          view.render(body, api);
          if (res.outcome === 'solved') finish();
          return res.outcome;
        },
        say,
        reduced: app.reduced,
      };

      scope.on(el.querySelector('[data-act="close"]'), 'click', () => close({ solved, hintsUsed }));
      scope.on(hintBtn, 'click', () => {
        const next = nextHint(def.hints || [], hintsUsed);
        if (!next) return;
        hintsUsed = next.used;
        hintsEl.hidden = false;
        hintsEl.append(h(`<li>${esc(tx(next.text))}</li>`));
        audio.play('page');
        updateHintBtn();
      });
      scope.on(el, 'keydown', (e) => {
        if (e.key === 'Escape') close({ solved, hintsUsed });
      });

      updateHintBtn();
      view.render(body, api);
      el.querySelector('h2').focus({ preventScroll: true });
    },
    { className: 'overlay-panel', label: tx(def.title) },
  );
}
