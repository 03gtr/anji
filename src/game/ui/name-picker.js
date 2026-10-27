/**
 * Story Pack 01: Anji names the white husky. One tap on a suggestion, or a
 * name of her own (validated by core/names.js; refused input explains why
 * and keeps the panel open). The name is saved once as a string story flag
 * and never replaced afterwards — a later call just returns the saved name.
 */
import { HUSKY_FLAG, HUSKY_SUGGESTIONS, NAME_MAX, cleanName, huskyName } from '../core/names.js';
import { esc } from './dom.js';
import { num } from './format.js';

const WHO = {
  husky: { flag: HUSKY_FLAG, suggestions: HUSKY_SUGGESTIONS, current: huskyName, title: 'شنو اسمها؟', text: 'هاسكي بيضاء بعيون زرگ مثل الثلج. اسمها راح يبقى ويّاها بكل الحكاية.' },
};

/** @returns {Promise<string>} the saved name */
export function askName(app, who = 'husky') {
  const spec = WHO[who];
  if (!spec) return Promise.resolve('');
  if (cleanName(app.game.flag(spec.flag))) return Promise.resolve(spec.current(app.game)); // already named: never overwrite
  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `<section class="panel panel-small name-picker" aria-describedby="np-text">
          <h2 tabindex="-1">${esc(spec.title)}</h2>
          <p id="np-text">${esc(spec.text)}</p>
          <div class="np-suggest" role="group" aria-label="أسماء مقترحة">${spec.suggestions
            .map((n) => `<button type="button" class="btn btn-ghost np-name" data-name="${esc(n)}">${esc(n)}</button>`)
            .join('')}</div>
          <form class="np-own" novalidate>
            <label for="np-input">أو اسم على ذوقچ</label>
            <div class="np-row">
              <input id="np-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="${NAME_MAX + 4}" dir="auto" aria-describedby="np-error">
              <button type="submit" class="btn btn-primary">هذا اسمها</button>
            </div>
            <p id="np-error" class="np-error" role="alert" hidden></p>
          </form>
        </section>`;
      const input = el.querySelector('#np-input');
      const error = el.querySelector('#np-error');
      const choose = (name) => {
        app.audio.play('sparkle');
        app.game.setFlag(spec.flag, name);
        close(name);
      };
      el.querySelectorAll('[data-name]').forEach((b) => scope.on(b, 'click', () => choose(b.dataset.name)));
      scope.on(el.querySelector('form'), 'submit', (e) => {
        e.preventDefault();
        const name = cleanName(input.value);
        if (name) return choose(name);
        error.hidden = false;
        error.textContent = input.value.trim() ? `حروف بس (بدون أرقام أو رموز)، ولحد ${num(NAME_MAX)} حرف.` : 'اكتبي اسم، أو اختاري واحد من فوق.';
        input.focus();
      });
      scope.on(input, 'input', () => (error.hidden = true));
    },
    { className: 'overlay-panel', label: spec.title },
  );
}
