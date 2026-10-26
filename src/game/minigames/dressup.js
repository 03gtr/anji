/**
 * Wardrobe: change Anji's outfit and bow, Snooki's hat and collar. The
 * preview updates instantly; locked pieces show how to earn them. Saving
 * stores the look (the world sprites use it from then on).
 */
import { COSMETICS } from '../data/items.js';
import { anjiSprite } from '../characters/anji.js';
import { snookiSprite } from '../characters/snooki.js';
import { h, esc, ICONS } from '../ui/dom.js';

const TABS = [
  ['anjiOutfit', 'الملابس'],
  ['anjiBow', 'الفيونكات'],
  ['snookiHat', 'قبعات سنوكي'],
  ['snookiCollar', 'قلادات سنوكي'],
];

const REACTIONS = {
  anjiOutfit: ['سنوكي: هذا يخلّي حتى الورد يغار.', 'سنوكي: أنيقة. بس آني بعدني الأنيق الرسمي.', 'سنوكي: يناسبچ… والمغامرة كذلك.'],
  anjiBow: ['سنوكي: الفيونكة هي اللي تقرر المزاج. معلومة علمية.', 'سنوكي: هاي تلمع. أحب الأشياء اللي تلمع.'],
  snookiHat: ['سنوكي: أخيراً! الاحترام اللي أستحقه.', 'سنوكي: …لا تصوريني.'],
  snookiCollar: ['سنوكي: لون جديد، كلب جديد. نفس الذكاء.'],
  carColor: ['سنوكي: لون سريع. أسرع من الأزرق؟ لا. بس قريب.', 'سنوكي: زفيرو تستحي… بس عاجبها.'],
};

const ALL_TABS = [...TABS, ['carColor', 'لون السيارة']];

export function mount(area, { app, scope, options = {}, hud, finish }) {
  const { game } = app;
  const draft = { ...game.state.cosmetics };
  const tabs = options.slots ? ALL_TABS.filter(([id]) => options.slots.includes(id)) : TABS;
  let tab = tabs[0][0];

  const available = (c) => c.free || game.isUnlocked(Object.keys(COSMETICS).find((k) => COSMETICS[k] === c));

  area.append(
    h(`<div class="dress">
      <div class="dress-preview" aria-live="polite">
        <div class="dress-anji"></div><div class="dress-snooki"></div>
      </div>
      <p class="dress-say"></p>
      <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" data-tab="${id}">${label}</button>`).join('')}</div>
      <div class="dress-options"></div>
      <div class="stack"><button type="button" class="btn btn-primary dress-save">${ICONS.check}<span>احفظي الإطلالة</span></button></div>
    </div>`),
  );
  const say = (t) => {
    area.querySelector('.dress-say').textContent = t;
  };

  function preview() {
    if (tab === 'carColor') {
      const colors = { cobalt: '#1f4fd1', midnight: '#1a1f5e', rose: '#e0567f', pearl: '#e9e7f2' };
      area.querySelector('.dress-anji').innerHTML = '';
      area.querySelector('.dress-snooki').innerHTML = `<svg viewBox="0 0 96 64" aria-hidden="true"><path d="M6 46Q7 33 21 31L30 21Q34 17 41 17H57Q63 17 67 23L74 31Q86 33 88 46Z" fill="${colors[draft.carColor] || colors.cobalt}"/><path d="M33 29L39 22H56L62 29Z" fill="#bfe3ff"/><circle cx="24" cy="47" r="8" fill="#16161c"/><circle cx="68" cy="47" r="8" fill="#16161c"/></svg>`;
      return;
    }
    area.querySelector('.dress-anji').innerHTML = anjiSprite({ outfit: draft.anjiOutfit, bow: draft.anjiBow, pose: 'idle', expr: 'smile' });
    area.querySelector('.dress-snooki').innerHTML = snookiSprite({ hat: draft.snookiHat, collar: draft.snookiCollar, pose: 'sit' });
  }

  function options() {
    area.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    const list = Object.entries(COSMETICS).filter(([, c]) => c.slot === tab);
    const box = area.querySelector('.dress-options');
    box.innerHTML = list
      .map(([id, c]) => {
        const open = available(c);
        return `<button type="button" class="dress-opt ${draft[tab] === c.value ? 'is-on' : ''} ${open ? '' : 'is-locked'}" data-id="${id}" aria-pressed="${draft[tab] === c.value}" ${open ? '' : 'aria-disabled="true"'}>
          <b>${esc(c.name)}</b>${open ? '' : `<small>${ICONS.lock} ${esc(c.hint || 'تنفتح بمكان ما بالحديقة')}</small>`}</button>`;
      })
      .join('');
    box.querySelectorAll('[data-id]').forEach((b) =>
      b.addEventListener('click', () => {
        const c = COSMETICS[b.dataset.id];
        if (!available(c)) {
          say(`مقفولة: ${c.hint || 'لازم تلگينها بالمغامرة.'}`);
          app.audio.play('fail');
          return;
        }
        draft[c.slot] = c.value;
        const pool = REACTIONS[c.slot];
        say(pool[Math.floor(Math.random() * pool.length)]);
        app.audio.play('tap');
        preview();
        options();
      }),
    );
  }

  area.querySelectorAll('[data-tab]').forEach((b) =>
    scope.on(b, 'click', () => {
      tab = b.dataset.tab;
      options();
    }),
  );
  scope.on(area.querySelector('.dress-save'), 'click', () => {
    for (const [slot, value] of Object.entries(draft)) game.setCosmetic(slot, value);
    app.bus.emit('cosmetics', draft);
    finish({ completed: true, title: 'إطلالة جديدة ✨', summary: 'سنوكي يگول: «أخيراً شي يليق بمغامرة.»' });
  });

  return {
    start() {
      hud(options.slots ? 'ورشة الصبغ' : 'غرفة الملابس');
      say('سنوكي: اختاري. آني رأيي محايد. (مو محايد.)');
      preview();
      options();
    },
    pause() {},
    resume() {},
    destroy() {},
  };
}
