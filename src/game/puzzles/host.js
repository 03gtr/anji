/**
 * Puzzle overlay: shared shell (title, one-line goal, optional visual
 * example, feedback, progressive hints, solution, skip, give-up/return)
 * around a type-specific view. Solving applies the puzzle's reward effects
 * once and records the result.
 *
 * Help ladder (same for every puzzle):
 *   hints[0..n]  gentle → which object matters → the exact action
 *   «شوفي الحل»  the view highlights the solution (when the type supports it)
 *               or the `solutionText` is shown
 *   «تخطّي»     after the hints (or 3 mistakes): the story continues with the
 *               same reward; the record remembers it was skipped (no medal)
 */
import { RULES, nextHint } from './rules.js';
import { VIEWS } from './views.js';
import { applyEffects } from '../core/effects.js';
import { check } from '../core/conditions.js';
import { h, esc, tx, ICONS } from '../ui/dom.js';
import { confirmBox } from '../ui/menus.js';
import { fillNames } from '../core/names.js';

export const SKIP_AFTER_MISTAKES = 3;

/** Whether the skip option is offered (pure: tested). */
export function canSkip(def, { hintsUsed = 0, mistakes = 0, hintsOn = true } = {}) {
  if (def.noSkip) return false;
  const hints = def.hints?.length || 0;
  return mistakes >= SKIP_AFTER_MISTAKES || (hintsOn && hints > 0 && hintsUsed >= hints) || (!hintsOn && mistakes >= 1);
}

/**
 * Cards that depend on what she has found (`if` on a staged puzzle's cards, Season 2) are kept only
 * when she has them — the rules stay pure and see a plain config.
 */
export function resolveConfig(config, game) {
  if (!Array.isArray(config?.stages)) return config;
  return { ...config, stages: config.stages.map((st) => (Array.isArray(st.cards) ? { ...st, cards: st.cards.filter((c) => c.if === undefined || check(c.if, game)) } : st)) };
}

export function openPuzzle(app, input) {
  const { game, audio, settings } = app;
  const def = { ...input, config: resolveConfig(input.config, game) };
  const rules = RULES[def.type];
  const view = VIEWS[def.type];
  if (!rules || !view) throw new Error(`Unknown puzzle type ${def.type}`);

  return app.overlays.open(
    (el, { close, scope }) => {
      let state = rules.init(def.config);
      // multi-stage puzzles resume at the stage she reached (a number flag: no save-schema change)
      const stageFlag = `pstage:${def.id}`;
      const resumable = Array.isArray(def.config?.stages) && 'stage' in state && !game.record(`puzzle:${def.id}`)?.completed;
      const savedStage = resumable ? game.flag(stageFlag) : null;
      if (Number.isInteger(savedStage) && savedStage > 0 && savedStage < def.config.stages.length) state = { ...state, stage: savedStage };
      // Phase 04: puzzles with a draft (a logic grid, a machine's dials) keep what she set, too
      const draftFlag = `pdraft:${def.id}`;
      const drafted = Boolean(rules.draft) && !game.record(`puzzle:${def.id}`)?.completed;
      const savedDraft = drafted ? game.flag(draftFlag) : null;
      if (typeof savedDraft === 'string') {
        try {
          state = rules.draft.load(def.config, savedDraft, state);
        } catch {
          game.setFlag(draftFlag, false); // an unreadable draft is dropped, never fatal
        }
      }
      let hintsUsed = 0;
      let solved = false;
      let showSolution = Boolean(def.guided); // guided: the next step simply glows
      let mistakes = 0;
      let hintArmed = false; // the first hint asks once: think first, help is a choice
      el.append(
        h(`<section class="panel puzzle puzzle-${def.type}">
          <header class="panel-head">
            <h2 tabindex="-1">${esc(tx(def.title))}</h2>
            <button type="button" class="icon-btn" data-act="close" aria-label="رجوع">${ICONS.close}</button>
          </header>
          ${def.goal ? `<p class="puzzle-goal"><b>الهدف:</b> ${esc(fillNames(tx(def.goal), app.game))}</p>` : ''}
          <p class="puzzle-intro">${esc(fillNames(tx(def.intro), app.game))}</p>
          ${def.example ? `<div class="puzzle-example" aria-label="مثال">${def.example}</div>` : ''}
          <div class="puzzle-body"></div>
          <p class="puzzle-feedback" role="status" aria-live="polite"></p>
          <ol class="puzzle-hints" hidden></ol>
          <footer class="panel-foot">
            <button type="button" class="btn btn-ghost" data-act="hint">${ICONS.hint}<span></span></button>
            <button type="button" class="btn btn-ghost" data-act="solution" hidden>🔍 <span>شوفي الحل</span></button>
            <button type="button" class="btn btn-ghost" data-act="skip" hidden>${ICONS.skip}<span>تخطّي اللغز</span></button>
          </footer>
        </section>`),
      );
      const body = el.querySelector('.puzzle-body');
      const feedback = el.querySelector('.puzzle-feedback');
      const hintsEl = el.querySelector('.puzzle-hints');
      const hintBtn = el.querySelector('[data-act="hint"]');
      const solBtn = el.querySelector('[data-act="solution"]');
      const skipBtn = el.querySelector('[data-act="skip"]');
      const panel = el.querySelector('.panel');
      const hasSolution = Boolean(view.solution || def.solutionText);

      const updateButtons = () => {
        const hintsOn = settings.get().hints;
        const left = (def.hints?.length || 0) - hintsUsed;
        hintBtn.querySelector('span').textContent = left <= 0 ? 'خلصت التلميحات' : hintArmed ? 'متأكدة؟ المسي مرة ثانية' : `تلميح (${left})`;
        hintBtn.disabled = left <= 0 || solved;
        hintBtn.hidden = !hintsOn || !def.hints?.length || solved;
        solBtn.hidden = solved || showSolution || !hasSolution || !(hintsOn && left <= 0);
        skipBtn.hidden = solved || !canSkip(def, { hintsUsed, mistakes, hintsOn });
      };

      const say = (text, kind = '') => {
        feedback.textContent = tx(text);
        feedback.dataset.kind = kind;
      };

      function finish({ skipped = false } = {}) {
        solved = true;
        audio.play('success');
        audio.vibrate([20, 40, 20]);
        panel.classList.add('is-solved');
        say(skipped ? def.skipText || 'تمام. القصة تكمل… واللغز ينتظرچ بالتحديات إذا تحبين ترجعين.' : fillNames(def.success, app.game) || 'انحلّت! ✨', 'good');
        const score = mistakes + hintsUsed * 2 + (showSolution ? 10 : 0);
        const r = game.recordResult(`puzzle:${def.id}`, { completed: true, score, lowerIsBetter: true });
        if (skipped) game.setFlag(`skipped:${def.id}`);
        if (resumable) game.setFlag(stageFlag, false);
        if (drafted) game.setFlag(draftFlag, false);
        const changes = r.firstClear ? applyEffects(def.reward, game) : [];
        app.ui.announce?.(changes);
        const done = h('<button type="button" class="btn btn-primary btn-big" data-autofocus>كمّلي ✨</button>');
        done.addEventListener('click', () => close({ solved: true, skipped, hintsUsed }));
        el.querySelector('.panel-foot').replaceChildren(done);
        done.focus({ preventScroll: true });
        updateButtons();
      }

      const api = {
        def,
        get state() {
          return state;
        },
        get hintsUsed() {
          return hintsUsed;
        },
        get showSolution() {
          return showSolution;
        },
        act(action, ...args) {
          if (solved) return 'noop';
          const res = rules[action](def.config, state, ...args);
          const stageBefore = state.stage;
          state = res.state;
          if (resumable && res.outcome === 'progress' && state.stage !== stageBefore) game.setFlag(stageFlag, state.stage);
          if (drafted && res.outcome !== 'solved' && res.outcome !== 'noop') game.setFlag(draftFlag, rules.draft.save(state));
          if (res.outcome === 'wrong') {
            mistakes += 1;
            audio.play('fail');
            audio.vibrate(60);
            panel.classList.remove('shake');
            void panel.offsetWidth;
            if (!app.reduced()) panel.classList.add('shake');
            const replies = def.wrong?.length ? def.wrong : ['مو هيچ… جرّبي مرة ثانية.'];
            const option = def.config.options?.find((o) => o.id === args[0]);
            say(res.message || option?.reply || replies[(mistakes - 1) % replies.length], 'bad');
          } else if (res.outcome === 'progress') {
            audio.play('tap');
            say(res.message || '', res.message ? 'good' : '');
          } else if (res.message) {
            say(res.message, 'bad'); // a refused move says why (empty cells, no moves left)
          }
          view.render(body, api);
          if (res.outcome === 'solved') finish();
          else updateButtons();
          return res.outcome;
        },
        say,
        reduced: app.reduced,
        game, // for names in card texts ({husky})
        /** Whether she has something (views list only the evidence she has found). */
        has: (cond) => check(cond, game),
      };

      scope.on(el.querySelector('[data-act="close"]'), 'click', () => close({ solved, hintsUsed }));
      scope.on(hintBtn, 'click', () => {
        const next = nextHint(def.hints || [], hintsUsed);
        if (!next) return;
        if (hintsUsed === 0 && !hintArmed) {
          hintArmed = true;
          updateButtons();
          return;
        }
        hintArmed = false;
        hintsUsed = next.used;
        hintsEl.hidden = false;
        hintsEl.append(h(`<li>${esc(tx(next.text))}</li>`));
        audio.play('page');
        view.render(body, api);
        updateButtons();
      });
      scope.on(solBtn, 'click', () => {
        showSolution = true;
        if (def.solutionText) {
          hintsEl.hidden = false;
          hintsEl.append(h(`<li class="is-solution">${esc(tx(def.solutionText))}</li>`));
        }
        audio.play('page');
        view.render(body, api);
        updateButtons();
      });
      scope.on(skipBtn, 'click', async () => {
        const ok = await confirmBox(app, {
          title: 'تتخطّين اللغز؟',
          text: 'القصة تكمل عادي وتاخذين نفس الشي. تگدرين ترجعين تحلّينه بعدين من الدفتر ← التحديات.',
          yes: 'إي، كمّلي القصة',
          no: 'لا، أحاول بعد',
        });
        if (ok && !solved) finish({ skipped: true });
      });
      scope.on(el, 'keydown', (e) => {
        if (e.key === 'Escape') close({ solved, hintsUsed });
      });

      updateButtons();
      view.render(body, api);
      if (state.stage > 0 && resumable) say(`رجعتي للمستوى ${state.stage + 1} — اللي حلّيتيه محفوظ.`, 'good');
      else if (typeof savedDraft === 'string') say('رجعتي — اللي ضبطتيه محفوظ.', 'good');
      el.querySelector('h2').focus({ preventScroll: true });
      app.tips?.show('hint');
    },
    { className: 'overlay-panel', label: tx(def.title) },
  );
}
