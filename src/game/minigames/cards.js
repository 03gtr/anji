/**
 * Memory cards — "detective training": remember the evidence cards.
 */
import { deal, flipCard, hideOpen, cardsMedal } from './cards-logic.js';
import { symbol } from '../ui/symbols.js';
import { snookiPortrait } from '../characters/snooki.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';

const DEFAULT_SET = ['paw', 'feather', 'key', 'map', 'rose', 'star', 'moon-full', 'coffee'];
const LINES = {
  start: 'تمرين المحقق الأول: الذاكرة. المحقق اللي ينسى… يصير كلب عادي.',
  match: ['دقيق! مثلي.', 'هذا دليل مهم. على الأغلب.', 'ذاكرة حديد. أو ذاكرة فرو.'],
  miss: ['قريب. بس لا.', 'سنوكي يكتب ملاحظة: «تحتاج تمرين». بالقلم الأحمر.', 'لا تقلقين، حتى آني أنسى… أحياناً… وين دفنت العظم.'],
};

export function mount(area, { app, scope, options, hud, finish }) {
  const s = deal(options.set || DEFAULT_SET.slice(0, options.pairs || 8), options.seed || Date.now() % 100000);
  let paused = false;
  let busy = false;

  area.append(
    h(`<div class="cards">
      <p class="maze-snooki"><span class="maze-snooki-face">${snookiPortrait({ expr: 'serious', hat: 'detective' })}</span><span class="cards-say" aria-live="polite"></span></p>
      <div class="cards-grid" style="--n:${s.deck.length <= 12 ? 3 : 4}">
        ${s.deck.map((c, i) => `<button type="button" class="card-tile" data-i="${i}" aria-label="ورقة ${num(i + 1)}"><span class="card-inner"><span class="card-back"></span><span class="card-face">${symbol(c.symbol)}</span></span></button>`).join('')}
      </div>
    </div>`),
  );
  const say = (t) => {
    area.querySelector('.cards-say').textContent = t;
  };
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const tiles = [...area.querySelectorAll('.card-tile')];

  function paint() {
    tiles.forEach((b, i) => {
      const up = s.open.includes(i) || s.matched.has(i);
      b.classList.toggle('is-up', up);
      b.classList.toggle('is-matched', s.matched.has(i));
      b.setAttribute('aria-label', up ? `ورقة ${num(i + 1)}: مكشوفة` : `ورقة ${num(i + 1)}`);
    });
    hud(`🃏 أزواج ${num(s.matched.size / 2)}/${num(s.deck.length / 2)} · محاولات ${num(s.moves)}`);
  }

  tiles.forEach((b, i) =>
    scope.on(b, 'click', () => {
      if (paused || busy) return;
      const r = flipCard(s, i);
      if (r === 'noop') return;
      app.audio.play('page');
      paint();
      if (r === 'match') {
        app.audio.play('pickup');
        say(pick(LINES.match));
        if (s.done) {
          scope.timeout(
            () =>
              finish({
                completed: true,
                score: s.moves,
                lowerIsBetter: true,
                medal: cardsMedal(s),
                title: 'ذاكرة محقق! 🔎',
                summary: `محاولات: ${num(s.moves)} لـ ${num(s.deck.length / 2)} أزواج`,
              }),
            700,
          );
        }
      } else if (r === 'miss') {
        busy = true;
        say(pick(LINES.miss));
        scope.timeout(() => {
          hideOpen(s);
          busy = false;
          paint();
        }, app.reduced() ? 500 : 850);
      }
    }),
  );

  return {
    start() {
      say(LINES.start);
      paint();
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
    state: s,
  };
}
