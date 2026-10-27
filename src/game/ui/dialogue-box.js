/**
 * Dialogue presentation: portrait, speaker name, text revealed word by word
 * (whole words keep Arabic letter shapes stable while typing), choices and a
 * skip control. Tap/Enter/Space completes the line, then advances.
 * Skip fast-forwards to the next choice or the end (effects still apply), so
 * no scene can trap the player.
 */
import { createDialogue } from '../narrative/dialogue.js';
import { check } from '../core/conditions.js';
import { applyEffects } from '../core/effects.js';
import { portraitSvg, speakerName } from '../characters/portraits.js';
import { h, esc, tx, ICONS } from './dom.js';

export function playDialogue(app, script, { id } = {}) {
  const { game, settings, audio } = app;
  return app.overlays.open(
    (el, { close, scope }) => {
      const changes = [];
      const runner = createDialogue(script, {
        check: (c) => check(c, game),
        apply: (fx) => changes.push(...applyEffects(fx, game)),
      });
      el.innerHTML = `
        <div class="dlg" data-side="start">
          <div class="dlg-portrait" aria-hidden="true"></div>
          <div class="dlg-box">
            <div class="dlg-head">
              <span class="dlg-name"></span>
              <button type="button" class="dlg-skip" aria-label="تخطي الحوار">${ICONS.skip}<span>تخطي</span></button>
            </div>
            <p class="dlg-text" aria-live="polite"></p>
            <div class="dlg-choices" role="group"></div>
            <span class="dlg-next" aria-hidden="true">▾</span>
          </div>
        </div>`;
      const root = el.querySelector('.dlg');
      const portrait = el.querySelector('.dlg-portrait');
      const nameEl = el.querySelector('.dlg-name');
      const textEl = el.querySelector('.dlg-text');
      const choicesEl = el.querySelector('.dlg-choices');
      const box = el.querySelector('.dlg-box');

      let typing = null; // { words, i, timer }
      let step = null;

      const finishTyping = () => {
        if (!typing) return;
        clearTimeout(typing.timer);
        textEl.textContent = typing.full;
        typing = null;
        root.classList.add('is-ready');
      };

      function typeText(text) {
        root.classList.remove('is-ready');
        const delay = settings.charDelay();
        if (!delay) {
          textEl.textContent = text;
          root.classList.add('is-ready');
          return;
        }
        const words = text.split(/(\s+)/);
        typing = { full: text, i: 0, timer: 0 };
        textEl.textContent = '';
        const tick = () => {
          if (!typing) return;
          typing.i += 1;
          textEl.textContent = words.slice(0, typing.i).join('');
          if (typing.i >= words.length) {
            typing = null;
            root.classList.add('is-ready');
            return;
          }
          typing.timer = setTimeout(tick, Math.max(30, words[typing.i - 1].length * delay));
        };
        tick();
      }
      scope.add(() => typing && clearTimeout(typing.timer));

      function show(s) {
        const side = s.speaker === 'anji' ? 'start' : 'end';
        root.dataset.side = side;
        root.dataset.speaker = s.speaker || 'narrator';
        const svg = s.speaker ? portraitSvg(s.speaker, s.expr, game.state.cosmetics) : '';
        portrait.innerHTML = svg;
        portrait.hidden = !svg;
        if (svg && !app.reduced()) {
          portrait.classList.remove('pop');
          void portrait.offsetWidth;
          portrait.classList.add('pop');
        }
        nameEl.textContent = speakerName(s.speaker);
        nameEl.hidden = !nameEl.textContent;
        choicesEl.replaceChildren();
        if (s.cue) audio.play(s.cue);
        typeText(tx(s.text));
      }

      function showChoice(s) {
        show({ ...s, text: s.text ?? '' });
        finishTyping();
        root.classList.add('has-choices');
        s.options.forEach((label, i) => {
          const b = h(`<button type="button" class="btn btn-choice">${esc(tx(label))}</button>`);
          b.addEventListener('click', () => {
            audio.play('tap');
            root.classList.remove('has-choices');
            runner.choose(i);
            advance();
          });
          choicesEl.append(b);
        });
        choicesEl.querySelector('button')?.focus({ preventScroll: true });
      }

      function advance() {
        for (;;) {
          step = runner.next();
          if (step.type === 'cue') {
            audio.play(step.cue);
            continue;
          }
          break;
        }
        if (step.type === 'end') {
          if (id) game.markSeen(id);
          app.ui.announce?.(changes);
          close({ changes });
          return;
        }
        if (step.type === 'choice') showChoice(step);
        else show(step);
      }

      function onTap() {
        if (step?.type === 'choice') return;
        if (typing) finishTyping();
        else {
          audio.play('page');
          advance();
        }
      }

      function skip() {
        finishTyping();
        while (step && step.type !== 'choice' && step.type !== 'end') {
          step = runner.next();
        }
        if (step.type === 'end') {
          if (id) game.markSeen(id);
          app.ui.announce?.(changes);
          close({ changes, skipped: true });
        } else showChoice(step);
      }

      scope.on(box, 'click', (e) => {
        if (e.target.closest('.dlg-skip, .btn-choice')) return;
        onTap();
      });
      scope.on(el.querySelector('.dlg-skip'), 'click', (e) => {
        e.stopPropagation();
        skip();
      });
      scope.on(document, 'keydown', (e) => {
        if (app.overlays.count && el !== document.querySelector('.overlay:last-of-type')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest?.('.btn-choice')) return;
          e.preventDefault();
          onTap();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          skip();
        }
      });
      advance();
    },
    { className: 'overlay-dialogue', label: 'حوار' },
  );
}
