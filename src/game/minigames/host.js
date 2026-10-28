/**
 * Minigame overlay: shared shell for every minigame.
 *  intro (how to play) → play → result (medal, best, retry / continue)
 * with pause / restart / exit available at any time, automatic pause when the
 * tab is hidden, and results stored through game.recordResult('game:<id>').
 *
 * A minigame module exports mount(area, ctx) → { start, pause, resume, destroy }
 * and calls ctx.finish({ completed, score, medal, summary, lowerIsBetter }).
 */
import { MINIGAMES } from './registry.js';
import { createScope } from '../core/scope.js';
import { applyEffects } from '../core/effects.js';
import { h, esc, tx, ICONS } from '../ui/dom.js';

const MEDAL_LABEL = { gold: 'ذهبية', silver: 'فضية', bronze: 'برونزية' };
const MEDAL_ICON = { gold: '🥇', silver: '🥈', bronze: '🥉' };

export function openMinigame(app, id, options = {}) {
  const meta = MINIGAMES[id];
  if (!meta) throw new Error(`Unknown minigame ${id}`);
  const { game, audio } = app;

  return app.overlays.open(
    (el, { close, scope }) => {
      el.append(
        h(`<section class="mg" data-game="${id}">
          <header class="mg-head">
            <h2 class="mg-title" tabindex="-1">${esc(tx(meta.title))}</h2>
            <div class="mg-hud" aria-live="polite"></div>
            <div class="mg-actions">
              <button type="button" class="icon-btn" data-act="pause" aria-label="إيقاف مؤقت">${ICONS.pause}</button>
            </div>
          </header>
          <div class="mg-area"></div>
          <div class="mg-layer" hidden></div>
        </section>`),
      );
      const area = el.querySelector('.mg-area');
      const layer = el.querySelector('.mg-layer');
      const hud = el.querySelector('.mg-hud');
      let instance = null;
      let runScope = null;
      let state = 'intro';
      let mod = null;
      let lastResult = null;

      const showLayer = (html, wire) => {
        layer.innerHTML = html;
        layer.hidden = false;
        wire?.(layer);
        (layer.querySelector('[data-autofocus]') || layer.querySelector('button'))?.focus({ preventScroll: true });
      };
      const hideLayer = () => {
        layer.hidden = true;
        layer.innerHTML = '';
      };

      async function begin() {
        hideLayer();
        runScope?.dispose();
        instance?.destroy?.();
        area.replaceChildren();
        runScope = createScope();
        scope.add(() => runScope.dispose());
        try {
          mod = mod || (await meta.load());
        } catch (err) {
          // its code could not be loaded (no network and not cached, or an old copy): never a
          // blank screen with no way out — say so, and offer to try again or go back
          console.error('[minigame] could not load', id, err);
          if (scope.disposed) return;
          state = 'error';
          showLayer(
            `<div class="card mg-card" role="alert"><h3>ما گدرت أفتح هاللعبة هسه</h3>
              <p class="muted">تقدمچ محفوظ. جرّبي مرة ثانية، أو ارجعي وكمّلي المغامرة.</p>
              <div class="stack">
                <button type="button" class="btn btn-primary" data-act="retry" data-autofocus>جرّبي مرة ثانية</button>
                <button type="button" class="btn btn-ghost" data-act="exit">رجوع للمغامرة</button>
              </div></div>`,
            (l) => {
              l.querySelector('[data-act="retry"]').addEventListener('click', begin);
              l.querySelector('[data-act="exit"]').addEventListener('click', () => close({ completed: false, quit: true }));
            },
          );
          return;
        }
        if (scope.disposed) return;
        state = 'play';
        instance = mod.mount(area, {
          app,
          scope: runScope,
          options: { ...meta.options, ...options },
          hud: (text) => {
            hud.textContent = text;
          },
          finish: (result) => finish(result),
        });
        instance.start?.();
        if (import.meta.env?.DEV) globalThis.__mg = instance; // dev-only test hook
      }

      function pause() {
        if (state !== 'play') return;
        state = 'paused';
        instance?.pause?.();
        showLayer(
          `<div class="card mg-card"><h3>متوقفة ⏸</h3>
            <div class="stack">
              <button type="button" class="btn btn-primary" data-act="resume" data-autofocus>كمّلي</button>
              <button type="button" class="btn btn-ghost" data-act="restart">${ICONS.restart}<span>من البداية</span></button>
              <button type="button" class="btn btn-ghost" data-act="exit">رجوع للمغامرة</button>
            </div></div>`,
          (l) => {
            l.querySelector('[data-act="resume"]').addEventListener('click', resume);
            l.querySelector('[data-act="restart"]').addEventListener('click', begin);
            l.querySelector('[data-act="exit"]').addEventListener('click', () => close({ completed: lastResult?.completed ?? false, quit: true }));
          },
        );
      }
      function resume() {
        if (state !== 'paused') return;
        hideLayer();
        state = 'play';
        instance?.resume?.();
      }

      function finish(result) {
        if (state === 'result') return;
        state = 'result';
        instance?.pause?.();
        lastResult = result;
        const rec = game.recordResult(`game:${id}`, {
          completed: result.completed,
          score: result.score,
          medal: result.completed ? result.medal : null,
          lowerIsBetter: result.lowerIsBetter,
        });
        let changes = [];
        if (result.completed && rec.firstClear) changes = applyEffects(meta.reward, game);
        if (result.completed && result.medal === 'gold' && meta.goldReward) changes.push(...applyEffects(meta.goldReward, game));
        audio.play(result.completed ? 'success' : 'fail');
        const best = game.record(`game:${id}`);
        showLayer(
          `<div class="card mg-card mg-result ${result.completed ? 'is-win' : ''}">
            <h3>${esc(result.completed ? result.title || 'نجحتي! ✨' : result.title || 'محاولة حلوة!')}</h3>
            ${result.medal && result.completed ? `<p class="mg-medal">${MEDAL_ICON[result.medal]} ميدالية ${MEDAL_LABEL[result.medal]}</p>` : ''}
            ${result.summary ? `<p>${esc(tx(result.summary))}</p>` : ''}
            ${rec.newBest ? '<p class="mg-best">رقم قياسي جديد! 🎉</p>' : ''}
            ${best?.medal ? `<p class="mg-note">أفضل ميدالية: ${MEDAL_ICON[best.medal]}</p>` : ''}
            <div class="stack">
              ${result.completed ? '<button type="button" class="btn btn-primary" data-act="done" data-autofocus>كمّلي المغامرة</button>' : ''}
              <button type="button" class="btn ${result.completed ? 'btn-ghost' : 'btn-primary'}" data-act="retry" ${result.completed ? '' : 'data-autofocus'}>${ICONS.restart}<span>${result.completed ? 'العبيها مرة ثانية' : 'جرّبي مرة ثانية'}</span></button>
              ${result.completed ? '' : '<button type="button" class="btn btn-ghost" data-act="exit">رجوع للمغامرة</button>'}
            </div></div>`,
          (l) => {
            l.querySelector('[data-act="done"]')?.addEventListener('click', () => close({ completed: true, result }));
            l.querySelector('[data-act="retry"]').addEventListener('click', begin);
            l.querySelector('[data-act="exit"]')?.addEventListener('click', () => close({ completed: false, result }));
          },
        );
        app.ui.announce?.(changes);
      }

      scope.on(el.querySelector('[data-act="pause"]'), 'click', () => (state === 'paused' ? resume() : pause()));
      scope.on(document, 'visibilitychange', () => document.hidden && pause());
      scope.on(el, 'keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (state === 'play') pause();
          else if (state === 'paused') resume();
        }
      });
      scope.add(() => instance?.destroy?.());

      // intro card: objective + controls, then start
      showLayer(
        `<div class="card mg-card mg-intro">
          <h3>${esc(tx(meta.title))}</h3>
          <p>${esc(tx(meta.goal))}</p>
          <ul class="mg-controls">${(meta.controls || []).map((c) => `<li>${esc(tx(c))}</li>`).join('')}</ul>
          <div class="stack">
            <button type="button" class="btn btn-primary btn-big" data-act="start" data-autofocus>يلا نبدي!</button>
            ${options.required ? '' : '<button type="button" class="btn btn-ghost" data-act="exit">بعدين</button>'}
          </div></div>`,
        (l) => {
          l.querySelector('[data-act="start"]').addEventListener('click', () => {
            audio.unlock();
            begin();
          });
          l.querySelector('[data-act="exit"]')?.addEventListener('click', () => close({ completed: false, quit: true }));
        },
      );
    },
    { className: 'overlay-game', label: tx(meta.title) },
  );
}

