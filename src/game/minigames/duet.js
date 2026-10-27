/**
 * «دويتو الحديقة» — Anji and Snooki light lanterns and flowers in the order
 * the garden shows. The pattern grows by one each round. Untimed by
 * default; a mistake just replays the round. Rules: tabletop/duet.js.
 */
import { createDuet, shownPattern, pressPad, duetMedal, PADS } from '../tabletop/duet.js';
import { symbol } from '../ui/symbols.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { sayBar } from '../tabletop/ui.js';

const ICON = { lantern: 'sun', rose: 'rose', moon: 'moon-full', paw: 'paw' };
const NAME = { lantern: 'فانوس', rose: 'وردة', moon: 'قمر', paw: 'كف سنوكي' };

export function mount(area, { app, scope, options, hud, finish }) {
  const s = createDuet(options.seed ?? (Date.now() % 100000), { length: options.length || 6 });
  const bar = sayBar();
  const wrap = h(`<div class="tt duet">
      <div class="du-pads">${PADS.map((p, i) => `<button type="button" class="du-pad pad-${p}" data-pad="${i}" aria-label="${NAME[p]}">${symbol(ICON[p])}<span>${NAME[p]}</span></button>`).join('')}</div>
      <p class="du-msg" role="status" aria-live="polite"></p>
      <button type="button" class="btn btn-ghost btn-small" data-replay>↻ شوفي النمط مرة ثانية</button>
    </div>`);
  wrap.prepend(bar.el);
  area.append(wrap);
  const msg = wrap.querySelector('.du-msg');
  const pads = [...wrap.querySelectorAll('.du-pad')];
  let showing = false;
  let paused = false;

  const flash = (i, ms) => {
    pads[i].classList.add('is-on');
    app.audio.play('tap');
    scope.timeout(() => pads[i].classList.remove('is-on'), ms);
  };
  function show() {
    showing = true;
    msg.textContent = 'باوعي…';
    const pattern = shownPattern(s);
    const gap = app.reduced() ? 900 : 700;
    pattern.forEach((p, k) => scope.timeout(() => !paused && flash(p, gap * 0.6), 500 + k * gap));
    scope.timeout(() => {
      showing = false;
      msg.textContent = `دورچ: ${num(pattern.length)} ${pattern.length === 1 ? 'خطوة' : 'خطوات'}. ماكو وقت، خذي راحتچ.`;
    }, 500 + pattern.length * gap);
    hud(`🎶 الجولة ${num(s.round)}/${num(s.seq.length)} · أخطاء ${num(s.mistakes)}`);
  }

  pads.forEach((b) =>
    scope.on(b, 'click', () => {
      if (showing || paused || s.done) return;
      const i = Number(b.dataset.pad);
      flash(i, 260);
      const res = pressPad(s, i);
      if (res === 'miss') {
        app.audio.play('fail');
        bar.say({ s: 'snooki', e: 'guilty', t: 'آني ضغطت الكف بالغلط. أكيد آني. نعيدها.' });
        scope.timeout(show, 700);
      } else if (res === 'round') {
        app.audio.play('sparkle');
        bar.say({ s: 'snooki', e: 'happy', t: ['حلو! الحديقة تغني.', 'آني رقصت. ما شفتي؟ رقصت.', 'خطوة زيادة… آني جاهز!'][s.round % 3] });
        scope.timeout(show, 800);
      } else if (res === 'done') {
        app.audio.play('success');
        finish({ completed: true, medal: duetMedal(s), score: s.mistakes, lowerIsBetter: true, title: 'الحديقة ضوت كلها 🎶', summary: `أخطاء: ${num(s.mistakes)}\nسنوكي: «فرقة موسيقية. آني القائد.»` });
      }
    }),
  );
  scope.on(wrap.querySelector('[data-replay]'), 'click', () => !showing && show());

  return {
    start() {
      bar.say({ s: 'snooki', e: 'happy', t: 'الحديقة تشغّل نمط، وإحنا نعيده. آني الكف. إنتي كل شي ثاني.' });
      show();
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
