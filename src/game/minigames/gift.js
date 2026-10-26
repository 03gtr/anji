/**
 * «ورشة الهدايا» — choose a wrapping, a ribbon, a flower and a note; the gift
 * is saved (game.addGift) as a collectible and can be placed in the hidden
 * garden as a decoration. Notes are fixed, gentle, fictional lines (no real
 * events). Nothing here depends on a romantic answer.
 */
import { h, esc } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { sayBar } from '../tabletop/ui.js';

export const GIFT_OPTIONS = {
  wrap: [
    ['midnight', 'ورق كحلي بنجوم', '#1d2b5c'],
    ['rose', 'ورق وردي', '#e0567f'],
    ['cream', 'ورق كريمي', '#f3e3c3'],
    ['green', 'ورق أخضر (مثل عيون أحد)', '#2f8a5a'],
  ],
  ribbon: [
    ['blue', 'شريطة زرقاء', '#3f6fe0'],
    ['gold', 'شريطة ذهبية', '#e2b544'],
    ['white', 'شريطة بيضاء', '#f3f1ff'],
  ],
  flower: [
    ['blue-rose', 'وردة زرقاء', '#3f6fe0'],
    ['white-rose', 'وردة بيضاء', '#f3f1ff'],
    ['none', 'بدون وردة', ''],
  ],
  note: [
    ['smile', '«حتى تبتسمين اليوم»', ''],
    ['garden', '«من الحديقة، إلچ»', ''],
    ['snooki', '«من سنوكي (ريان ساعد شوية)»', ''],
    ['blank', 'ورقة فاضية… تنكتب بعدين', ''],
  ],
};
const PARTS = [
  ['wrap', 'الورق'],
  ['ribbon', 'الشريطة'],
  ['flower', 'الوردة'],
  ['note', 'البطاقة'],
];

export function giftSvg(g) {
  const c = (part) => (GIFT_OPTIONS[part].find(([id]) => id === g[part]) || GIFT_OPTIONS[part][0])[2];
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <rect x="20" y="48" width="80" height="62" rx="6" fill="${c('wrap')}"/>
    <rect x="14" y="36" width="92" height="18" rx="5" fill="${c('wrap')}" stroke="rgba(0,0,0,.15)"/>
    <rect x="54" y="36" width="12" height="74" fill="${c('ribbon')}"/><rect x="14" y="42" width="92" height="8" fill="${c('ribbon')}"/>
    <path d="M60 36 C46 18 30 26 40 36Z M60 36 C74 18 90 26 80 36Z" fill="${c('ribbon')}"/>
    ${g.flower !== 'none' ? `<circle cx="84" cy="30" r="9" fill="${c('flower')}"/><path d="M80 30 Q84 25 88 30" stroke="rgba(255,255,255,.6)" stroke-width="2" fill="none"/>` : ''}
    <rect x="26" y="70" width="26" height="18" rx="2" fill="#fff7ec" transform="rotate(-8 39 79)"/>
  </svg>`;
}

export function mount(area, { app, scope, hud, finish }) {
  const gift = Object.fromEntries(PARTS.map(([k]) => [k, GIFT_OPTIONS[k][0][0]]));
  const bar = sayBar();
  const wrap = h(`<div class="tt gift">
      <div class="gf-preview"></div>
      <div class="gf-parts">${PARTS.map(
        ([k, label]) => `<fieldset class="gf-part"><legend>${esc(label)}</legend>${GIFT_OPTIONS[k]
          .map(([id, name]) => `<button type="button" class="gf-opt" data-part="${k}" data-v="${id}" aria-pressed="${gift[k] === id}">${esc(name)}</button>`)
          .join('')}</fieldset>`,
      ).join('')}</div>
      <button type="button" class="btn btn-primary btn-big" data-make>لفّي الهدية 🎁</button>
    </div>`);
  wrap.prepend(bar.el);
  area.append(wrap);
  const preview = () => {
    wrap.querySelector('.gf-preview').innerHTML = giftSvg(gift);
    wrap.querySelectorAll('[data-part]').forEach((b) => b.setAttribute('aria-pressed', String(gift[b.dataset.part] === b.dataset.v)));
  };
  wrap.querySelectorAll('[data-part]').forEach((b) =>
    scope.on(b, 'click', () => {
      gift[b.dataset.part] = b.dataset.v;
      app.audio.play('tap');
      if (b.dataset.part === 'ribbon') bar.say({ s: 'snooki', e: 'proud', t: 'الشريطة؟ آني أحب الشرايط. أحب أسحبها. لا تخافين.' });
      preview();
    }),
  );
  scope.on(wrap.querySelector('[data-make]'), 'click', () => {
    const saved = app.game.addGift(gift);
    app.audio.play('success');
    finish({
      completed: true,
      title: 'الهدية جاهزة 🎁',
      summary: saved
        ? `انحفظت بمجموعة الهدايا (${num(app.game.state.hub.gifts.length)}). تگدرين تحطين «صندوق هدية» بالحديقة المخفية.`
        : 'مجموعة الهدايا مليانة، بس الهدية انلفّت حلو.',
    });
  });

  return {
    start() {
      hud('ورشة الهدايا');
      bar.say({ s: 'snooki', e: 'happy', t: 'ورشة الهدايا! اختاري ورق، شريطة، وردة، وبطاقة. آني مسؤول الشريط اللاصق.' });
      preview();
    },
    pause() {},
    resume() {},
    destroy() {},
  };
}
