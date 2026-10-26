/**
 * The finale's quiet reveal: a small folded paper. A tap (or a sideways drag)
 * unfolds it. The owner's handmade drawing is a PRIVATE asset
 * (private-art/finale-drawing.webp, git-ignored, see docs/ASSETS.md);
 * without it a neutral placeholder card is shown so the scene still works.
 *
 * Nothing here describes the drawing's content: it is only ever in the
 * private image itself.
 *
 * After the reveal she can keep it in the journal or close it ("later");
 * either way it stays in the journal so she can open it again any time.
 */
import { painted } from '../art/painted.js';
import { h, esc } from './dom.js';

export const DRAWING_ART = 'finale-drawing';
/** Folded state: only the centre strip of the paper shows (crop-relative %). */
const FOLDED = { left: 33, right: 11 };

export function openDrawing(app, { revisit = false } = {}) {
  const url = painted(DRAWING_ART);
  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `<section class="drawing" aria-label="الرسمة">
        <p class="drawing-hint" aria-live="polite">${revisit ? 'الرسمة… مثل ما خليتيها.' : 'ورقة صغيرة، مطوية من الجنبين. المسيها (أو اسحبيها) حتى تفتحينها.'}</p>
        <button type="button" class="drawing-paper ${url ? '' : 'is-placeholder'}" aria-label="افتحي الورقة" data-paper>
          ${
            url
              ? `<img src="${esc(url)}" alt="الرسمة" draggable="false">`
              : `<span class="drawing-ph" aria-hidden="true"><svg viewBox="0 0 120 160"><rect x="6" y="6" width="108" height="148" rx="4" fill="#f7f4ee"/><path d="M60 118 C20 92 22 58 42 54 C52 52 58 60 60 66 C62 60 68 52 78 54 C98 58 100 92 60 118Z" fill="#3f6fe0"/></svg></span>`
          }
          <span class="drawing-fold left" aria-hidden="true"></span><span class="drawing-fold right" aria-hidden="true"></span>
        </button>
        <div class="drawing-actions" hidden>
          <button type="button" class="btn btn-primary" data-keep>خلّيها بالدفتر 📖</button>
          <button type="button" class="btn btn-ghost" data-later>${revisit ? 'رجوع' : 'بعدين'}</button>
        </div>
      </section>`;
      const paper = el.querySelector('[data-paper]');
      const actions = el.querySelector('.drawing-actions');
      const hint = el.querySelector('.drawing-hint');
      let open = 0;
      let done = false;

      const apply = (p) => {
        open = Math.max(0, Math.min(1, p));
        paper.style.setProperty('--l', `${FOLDED.left * (1 - open)}%`);
        paper.style.setProperty('--r', `${FOLDED.right * (1 - open)}%`);
        paper.style.setProperty('--o', String(open));
      };
      const finishOpen = () => {
        if (done) return;
        done = true;
        paper.classList.add('is-open');
        if (app.reduced()) apply(1);
        else {
          const start = open;
          const t0 = performance.now();
          const step = (now) => {
            const k = Math.min(1, (now - t0) / 1100);
            apply(start + (1 - start) * (1 - (1 - k) ** 3));
            if (k < 1 && !scope.disposed) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
        app.audio.play('page');
        hint.textContent = '';
        app.game.setFlag('drawing-seen');
        app.game.addJournal('drawing');
        scope.timeout(() => {
          actions.hidden = false;
          actions.querySelector('[data-keep]').focus({ preventScroll: true });
        }, app.reduced() ? 0 : 1300);
      };
      apply(0);

      // drag sideways to unfold (or simply tap)
      let x0 = null;
      scope.on(paper, 'pointerdown', (e) => {
        if (done) return;
        x0 = e.clientX;
        paper.setPointerCapture?.(e.pointerId);
      });
      scope.on(paper, 'pointermove', (e) => {
        if (done || x0 === null) return;
        apply(Math.abs(e.clientX - x0) / 140);
      });
      scope.on(paper, 'pointerup', () => {
        if (done) return;
        x0 = null;
        finishOpen();
      });
      scope.on(paper, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          finishOpen();
        }
      });
      scope.on(el.querySelector('[data-keep]'), 'click', () => {
        app.ui.toast('الرسمة محفوظة بالدفتر 📖 — تگدرين تفتحينها وقت ما تريدين.');
        close({ kept: true });
      });
      scope.on(el.querySelector('[data-later]'), 'click', () => close({ kept: false }));
      paper.focus({ preventScroll: true });
    },
    { className: 'overlay-drawing', label: 'الرسمة' },
  );
}
