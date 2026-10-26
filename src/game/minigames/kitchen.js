/**
 * Healthy kitchen: three orders. Tap ingredients into the bowl, tap a bowl
 * item to take it out, then "cook". Wrong combinations get a reason, never a
 * game over.
 */
import { INGREDIENTS, RECIPES, checkRecipe, kitchenMedal } from './kitchen-logic.js';
import { symbol } from '../ui/symbols.js';
import { snookiPortrait } from '../characters/snooki.js';
import { h, esc } from '../ui/dom.js';
import { num } from '../ui/format.js';

export function mount(area, { app, scope, hud, finish }) {
  let index = 0;
  let picked = [];
  let mistakes = 0;
  let paused = false;

  area.append(
    h(`<div class="kitchen">
      <p class="maze-snooki"><span class="maze-snooki-face">${snookiPortrait({ expr: 'happy', hat: app.game.state.cosmetics.snookiHat })}</span><span class="k-say" aria-live="polite"></span></p>
      <section class="k-order card"><h3 class="k-title"></h3><p class="k-brief"></p></section>
      <div class="k-bowl" aria-label="الصحن"></div>
      <div class="k-shelf">${Object.entries(INGREDIENTS)
        .map(([id, it]) => `<button type="button" class="k-ing" data-id="${id}" aria-label="${esc(it.name)}">${symbol(it.icon)}<span>${esc(it.name)}</span></button>`)
        .join('')}</div>
      <button type="button" class="btn btn-primary k-cook">اطبخي 🍳</button>
    </div>`),
  );
  const say = (t) => {
    area.querySelector('.k-say').textContent = t;
  };
  const bowl = area.querySelector('.k-bowl');

  function render() {
    const r = RECIPES[index];
    area.querySelector('.k-title').textContent = `${num(index + 1)}/${num(RECIPES.length)} · ${r.title}`;
    area.querySelector('.k-brief').textContent = r.brief;
    bowl.innerHTML = `${picked.map((id, i) => `<button type="button" class="k-in" data-i="${i}" aria-label="شيلي ${esc(INGREDIENTS[id].name)}">${symbol(INGREDIENTS[id].icon)}</button>`).join('')}${'<span class="k-slot"></span>'.repeat(Math.max(0, r.size - picked.length))}`;
    bowl.querySelectorAll('[data-i]').forEach((b) =>
      b.addEventListener('click', () => {
        picked.splice(Number(b.dataset.i), 1);
        app.audio.play('tap');
        render();
      }),
    );
    area.querySelectorAll('.k-ing').forEach((b) => b.classList.toggle('is-in', picked.includes(b.dataset.id)));
    hud(`🍳 ${num(index)}/${num(RECIPES.length)} · أخطاء ${num(mistakes)}`);
  }

  area.querySelectorAll('.k-ing').forEach((b) =>
    scope.on(b, 'click', () => {
      if (paused) return;
      const id = b.dataset.id;
      if (picked.includes(id)) picked = picked.filter((x) => x !== id);
      else if (picked.length < RECIPES[index].size) picked.push(id);
      else {
        say('الصحن مليان. شيلي شي أول.');
        return;
      }
      app.audio.play('tap');
      render();
    }),
  );

  scope.on(area.querySelector('.k-cook'), 'click', () => {
    if (paused) return;
    const r = RECIPES[index];
    const res = checkRecipe(r, picked);
    if (!res.ok) {
      mistakes += 1;
      app.audio.play('fail');
      say(res.reason);
      bowl.classList.remove('shake');
      void bowl.offsetWidth;
      bowl.classList.add('shake');
      render();
      return;
    }
    app.audio.play('success');
    say(index === 0 ? 'سنوكي: لذيذ! …بس كان ممكن يكون بيتزا.' : index === 1 ? 'سنوكي: هذا أكل أبطال. آني أحتاج واحد.' : 'سنوكي: ريان چان يسوّي هذا كل ليلة الساعة سبعة وربع… تقريباً.');
    index += 1;
    picked = [];
    if (index >= RECIPES.length) {
      finish({ completed: true, medal: kitchenMedal(mistakes), score: mistakes, lowerIsBetter: true, title: 'المطبخ نجح! 🍳', summary: `أخطاء: ${num(mistakes)}` });
      return;
    }
    render();
  });

  return {
    start() {
      say('سنوكي يقرأ الطلبات: «كلها سهلة. إلا الصحية.»');
      render();
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
  };
}
