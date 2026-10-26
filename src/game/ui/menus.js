/**
 * Menus and panels: chapter cards, pause, settings (incl. save backup /
 * restore / reset), journal, and the world map.
 */
import { h, esc, tx, ICONS } from './dom.js';
import { symbol } from './symbols.js';
import { num } from './format.js';
import { painted } from '../art/painted.js';
import { ACTS } from '../data/chapters.js';
import { WORLDS, ROUTES, worldById } from '../data/worlds.js';
import { JOURNAL, COLLECTIBLES, ITEMS, GROUP_NAMES, worldCompletion } from '../data/items.js';
import { MINIGAMES } from '../minigames/registry.js';
import { check } from '../core/conditions.js';
import { groupOf } from '../core/game.js';
import { offlineText } from '../core/sw-client.js';

const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];

/* ── chapter card ─────────────────────────────────────────── */
export function chapterCard(app, { act, end = false }) {
  const a = ACTS.find((x) => x.act === act);
  const next = end ? ACTS.find((x) => x.act === act + 1) : null;
  const show = end ? next : a;
  const art = painted(show?.art);
  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `<div class="chapter ${art ? 'has-art' : ''}">
        ${art ? `<img class="chapter-art" src="${art}" alt="">` : ''}
        <div class="chapter-copy">
          ${end ? `<p class="chapter-end">نهاية الفصل ${ORD[act - 1]} ✦ ${esc(a.title)}</p>` : ''}
          ${show ? `<p class="chapter-kicker">الفصل ${ORD[show.act - 1]}</p><h2 class="chapter-title" tabindex="-1">${esc(show.title)}</h2><p class="chapter-sub">${esc(show.subtitle)}</p>` : ''}
          <button type="button" class="btn btn-primary" data-autofocus>كمّلي</button>
        </div></div>`;
      app.audio.play('gate');
      const btn = el.querySelector('button');
      scope.on(btn, 'click', () => close());
      scope.timeout(() => btn.classList.add('is-in'), 600);
    },
    { className: 'overlay-chapter', label: show?.title || '' },
  );
}

/* ── confirm ──────────────────────────────────────────────── */
export function confirmBox(app, { title, text, yes, no = 'لا، رجوع', danger = false }) {
  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `<section class="panel panel-small"><h2 tabindex="-1">${esc(title)}</h2><p>${esc(text)}</p>
        <div class="stack"><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(yes)}</button>
        <button type="button" class="btn btn-ghost" data-no data-autofocus>${esc(no)}</button></div></section>`;
      scope.on(el.querySelector('[data-yes]'), 'click', () => close(true));
      scope.on(el.querySelector('[data-no]'), 'click', () => close(false));
    },
    { className: 'overlay-panel', dismissible: true, label: title },
  );
}

/* ── settings ─────────────────────────────────────────────── */
export function openSettings(app) {
  const { settings, game, saves } = app;
  return app.overlays.open(
    (el, { close, scope }) => {
      const seg = (key, options) =>
        `<div class="seg" role="radiogroup" aria-label="${key}">${options
          .map(([v, label]) => `<button type="button" role="radio" data-set="${key}" data-v="${v}" aria-checked="${settings.get()[key] === v}">${esc(label)}</button>`)
          .join('')}</div>`;
      const toggle = (key, label) =>
        `<label class="toggle"><input type="checkbox" data-toggle="${key}" ${settings.get()[key] ? 'checked' : ''}><span>${esc(label)}</span></label>`;
      el.innerHTML = `<section class="panel settings">
        <header class="panel-head"><h2 tabindex="-1">الإعدادات</h2>
          <button type="button" class="icon-btn" data-close aria-label="إغلاق">${ICONS.close}</button></header>
        <div class="panel-scroll">
          <h3>الصوت</h3>
          ${toggle('sound', 'تشغيل الصوت')}
          <label class="slider"><span>مستوى الصوت</span><input type="range" min="0" max="1" step="0.05" value="${settings.get().volume}" data-volume></label>
          ${toggle('music', 'موسيقى وأجواء خفيفة')}
          <h3>النصوص</h3>
          <p class="field-label">سرعة ظهور الكلام</p>
          ${seg('textSpeed', [['slow', 'بطيئة'], ['normal', 'عادية'], ['fast', 'سريعة'], ['instant', 'فورية']])}
          <h3>الراحة</h3>
          <p class="field-label">الحركة والأنيميشن</p>
          ${seg('motion', [['system', 'حسب الجهاز'], ['reduce', 'أقل حركة'], ['full', 'كاملة']])}
          ${toggle('hints', 'إظهار زر التلميحات بالألغاز')}
          ${toggle('controlHints', 'كتابة أسماء الأزرار')}
          ${toggle('vibration', 'اهتزاز خفيف (إذا الجهاز يدعم)')}
          <h3>الحفظ</h3>
          <p class="muted">التقدم ينحفظ تلقائياً على هذا الجهاز فقط. ماكو حساب ولا إنترنت.</p>
          <div class="stack">
            <button type="button" class="btn btn-ghost" data-export>⬇️ نسخة احتياطية من التقدم</button>
            <label class="btn btn-ghost file-btn">⬆️ استرجاع من نسخة احتياطية<input type="file" accept="application/json,.json" data-import hidden></label>
            <button type="button" class="btn btn-danger" data-clear>مسح التقدم والبدء من جديد</button>
          </div>
          <h3>بدون إنترنت</h3>
          <p class="offline-line" aria-live="polite"></p>
          <button type="button" class="btn btn-primary" data-update hidden>تحديث للنسخة الجديدة</button>
          <p class="muted small">لعبة شخصية مصنوعة بحب. كل الشخصيات والأحداث بالقصة خيالية.</p>
        </div></section>`;

      scope.on(el.querySelector('[data-close]'), 'click', () => close());
      el.querySelectorAll('[data-toggle]').forEach((input) =>
        scope.on(input, 'change', () => {
          settings.set({ [input.dataset.toggle]: input.checked });
          if (input.dataset.toggle === 'sound' && input.checked) app.audio.play('tap');
        }),
      );
      scope.on(el.querySelector('[data-volume]'), 'input', (e) => settings.set({ volume: Number(e.target.value) }));
      el.querySelectorAll('[data-set]').forEach((b) =>
        scope.on(b, 'click', () => {
          settings.set({ [b.dataset.set]: b.dataset.v });
          el.querySelectorAll(`[data-set="${b.dataset.set}"]`).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
          app.applyMotion();
        }),
      );
      scope.on(el.querySelector('[data-export]'), 'click', () => {
        const blob = new Blob([saves.exportText(game.state)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `secret-garden-save-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        app.ui.toast('انحفظت النسخة الاحتياطية ✓');
      });
      scope.on(el.querySelector('[data-import]'), 'change', async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
          const state = saves.importText(await file.text());
          const ok = await confirmBox(app, { title: 'استرجاع التقدم؟', text: 'راح يتبدل التقدم الحالي بالنسخة اللي اخترتيها.', yes: 'استرجعي' });
          if (!ok) return;
          game.replace(state);
          close();
          app.toTitle({ message: 'رجع التقدم من النسخة الاحتياطية ✓' });
        } catch (err) {
          app.ui.toast(err.code === 'wrong-game' ? 'هذا الملف مو نسخة احتياطية من هاي اللعبة.' : err.code === 'future' ? 'هاي النسخة من إصدار أحدث من اللعبة.' : 'ما گدرنا نقرا الملف.', 'warn');
        }
      });
      scope.on(el.querySelector('[data-clear]'), 'click', async () => {
        const first = await confirmBox(app, { title: 'مسح التقدم؟', text: 'راح ينمسح كل التقدم على هذا الجهاز. تگدرين تاخذين نسخة احتياطية قبل.', yes: 'كمّلي للمسح', danger: true });
        if (!first) return;
        const second = await confirmBox(app, { title: 'متأكدة؟', text: 'هاي آخر خطوة. ما تگدرين ترجعين بعدها بدون نسخة احتياطية.', yes: 'امسحي نهائياً', danger: true });
        if (!second) return;
        app.newGame({ wipe: true });
        close();
      });
      const line = el.querySelector('.offline-line');
      const upd = el.querySelector('[data-update]');
      scope.sub(
        app.offline.subscribe((info) => {
          line.textContent = offlineText(info);
          upd.hidden = info.status !== 'update';
        }),
      );
      scope.on(upd, 'click', () => app.offline.applyUpdate());
    },
    { className: 'overlay-panel', dismissible: true, label: 'الإعدادات' },
  );
}

/* ── pause ────────────────────────────────────────────────── */
export function openPause(app) {
  return app.overlays.open(
    (el, { close, scope }) => {
      const mapOpen = app.game.flag('map-open');
      el.innerHTML = `<section class="panel panel-small pause">
        <h2 tabindex="-1">متوقفة ⏸</h2>
        <div class="stack">
          <button type="button" class="btn btn-primary" data-act="resume" data-autofocus>كمّلي اللعب</button>
          ${mapOpen ? '<button type="button" class="btn btn-ghost" data-act="map">🗺️ الخريطة</button>' : ''}
          <button type="button" class="btn btn-ghost" data-act="journal">📖 الدفتر</button>
          <button type="button" class="btn btn-ghost" data-act="settings">⚙️ الإعدادات</button>
          <button type="button" class="btn btn-ghost" data-act="title">🏠 الشاشة الرئيسية</button>
        </div>
        <p class="muted small">التقدم محفوظ تلقائياً.</p></section>`;
      scope.on(el, 'click', async (e) => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (!act) return;
        if (act === 'resume') close();
        if (act === 'map') {
          close();
          app.ui.openMap();
        }
        if (act === 'journal') {
          close();
          app.ui.openJournal();
        }
        if (act === 'settings') openSettings(app);
        if (act === 'title') {
          close();
          app.toTitle();
        }
      });
    },
    { className: 'overlay-panel', dismissible: true, label: 'إيقاف مؤقت' },
  );
}

/* ── journal ──────────────────────────────────────────────── */
export function openJournal(app, tab = 'notes') {
  const { game } = app;
  return app.overlays.open(
    (el, { close, scope }) => {
      const tabs = [
        ['notes', 'الدفتر'],
        ['collection', 'المجموعات'],
        ['bag', 'الحقيبة'],
        ['challenges', 'التحديات'],
      ];
      el.innerHTML = `<section class="panel journal">
        <header class="panel-head"><h2 tabindex="-1">دفتر أنجي</h2>
          <button type="button" class="icon-btn" data-close aria-label="إغلاق">${ICONS.close}</button></header>
        <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" data-tab="${id}">${label}</button>`).join('')}</div>
        <div class="panel-scroll journal-body" role="tabpanel"></div></section>`;
      const body = el.querySelector('.journal-body');

      function render(which) {
        el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === which)));
        if (which === 'notes') {
          const entries = game.state.journal.filter((id) => JOURNAL[id]);
          const notes = game.state.collected.filter((id) => groupOf(id) === 'note');
          body.innerHTML = `
            ${entries.length ? entries.map((id) => `<article class="entry"><span class="entry-icon">${symbol(JOURNAL[id].icon)}</span><div><h4>${esc(JOURNAL[id].title)}</h4><p>${esc(JOURNAL[id].text)}</p></div></article>`).join('') : '<p class="muted">الدفتر فارغ. الحديقة مليانة أسرار بعد.</p>'}
            ${notes.length ? `<h3>رسائل ريان</h3>${notes.map((id) => `<article class="entry note"><span class="entry-icon">📜</span><div><h4>${esc(COLLECTIBLES[id]?.name || id)}</h4><p>${esc(COLLECTIBLES[id]?.text || '')}</p></div></article>`).join('')}` : ''}`;
        } else if (which === 'collection') {
          const worlds = [...new Set(Object.values(COLLECTIBLES).map((c) => c.world))];
          const groups = Object.keys(GROUP_NAMES);
          body.innerHTML = `<div class="counts">${groups
            .map((g) => {
              const total = Object.keys(COLLECTIBLES).filter((id) => groupOf(id) === g).length;
              return `<div class="count"><b>${num(game.countGroup(g))}/${num(total)}</b><span>${GROUP_NAMES[g]}</span></div>`;
            })
            .join('')}</div>
            ${worlds
              .map((w) => {
                const { found, total } = worldCompletion(game, w);
                const name = worldById(w)?.name ?? w;
                return `<div class="completion"><span>${esc(name)}</span><span class="bar"><i style="width:${(found / total) * 100}%"></i></span><b>${num(found)}/${num(total)}</b></div>`;
              })
              .join('')}
            <p class="muted small">النجوم والبذور مخبّية بأماكن تحتاج قفزة… أو فضول.</p>`;
        } else if (which === 'bag') {
          const inv = Object.entries(game.state.inventory);
          body.innerHTML = inv.length
            ? inv.map(([id, n]) => `<article class="entry"><span class="entry-icon">${symbol(ITEMS[id]?.icon)}</span><div><h4>${esc(ITEMS[id]?.name || id)} ${n > 1 ? `×${num(n)}` : ''}</h4><p>${esc(ITEMS[id]?.text || '')}</p></div></article>`).join('')
            : '<p class="muted">الحقيبة فارغة.</p>';
        } else {
          const list = Object.entries(MINIGAMES).filter(([id]) => game.record(`game:${id}`)?.completed || (MINIGAMES[id].unlock && check(MINIGAMES[id].unlock, game)));
          body.innerHTML = list.length
            ? `<p class="muted">العبي أي تحدي خلّصتيه مرة ثانية، وحاولي توصلين للذهبية.</p>${list
                .map(([id, m]) => {
                  const r = game.record(`game:${id}`);
                  const medal = { gold: '🥇', silver: '🥈', bronze: '🥉' }[r?.medal] || '—';
                  return `<button type="button" class="entry entry-btn" data-play="${id}"><span class="entry-icon">${symbol(m.icon)}</span><div><h4>${esc(tx(m.title))}</h4><p>${medal} · لعبتيها ${num(r?.plays || 0)} مرة</p></div></button>`;
                })
                .join('')}`
            : '<p class="muted">التحديات تنفتح هنا بعد ما تخلصينها بالقصة.</p>';
          body.querySelectorAll('[data-play]').forEach((b) =>
            b.addEventListener('click', () => {
              close();
              app.ui.minigame(b.dataset.play);
            }),
          );
        }
      }
      el.querySelectorAll('[data-tab]').forEach((b) => scope.on(b, 'click', () => render(b.dataset.tab)));
      scope.on(el.querySelector('[data-close]'), 'click', () => close());
      render(tab);
    },
    { className: 'overlay-panel', dismissible: true, label: 'الدفتر' },
  );
}

/* ── world map ────────────────────────────────────────────── */
export function openMap(app) {
  const { game } = app;
  return app.overlays.open(
    (el, { close, scope }) => {
      const here = game.state.location.scene;
      const open = (w) => check(w.unlock, game);
      const lines = ROUTES.map(([a, b]) => {
        const A = worldById(a);
        const B = worldById(b);
        const lit = open(A) && open(B);
        return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="route ${lit ? 'is-open' : ''}"/>`;
      }).join('');
      el.innerHTML = `<section class="panel map">
        <header class="panel-head"><h2 tabindex="-1">خريطة الحديقة</h2>
          <button type="button" class="icon-btn" data-close aria-label="إغلاق">${ICONS.close}</button></header>
        <div class="map-board">
          <svg class="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
          ${WORLDS.map((w) => {
            const unlocked = open(w);
            const playable = unlocked && w.ready;
            return `<button type="button" class="map-node ${unlocked ? 'is-open' : 'is-locked'} ${playable ? '' : 'is-soon'} ${w.scene && w.scene === here ? 'is-here' : ''}"
              style="--x:${w.x};--y:${w.y}" data-world="${w.id}" aria-label="${esc(w.name)}${unlocked ? '' : ' (مقفول)'}">
              <span class="map-icon">${unlocked ? symbol(w.icon) : ICONS.lock}</span>
              <span class="map-name">${unlocked ? esc(w.name) : '؟؟؟'}</span></button>`;
          }).join('')}
        </div>
        <p class="map-info" aria-live="polite">اختاري مكان.</p></section>`;
      const info = el.querySelector('.map-info');
      scope.on(el.querySelector('[data-close]'), 'click', () => close());
      el.querySelectorAll('[data-world]').forEach((b) =>
        scope.on(b, 'click', () => {
          const w = worldById(b.dataset.world);
          if (!open(w)) {
            info.textContent = `مكان مقفول. ينفتح بالفصل ${ORD[w.act - 1]}.`;
            app.audio.play('fail');
            return;
          }
          if (!w.ready) {
            info.textContent = `${w.name}: هذا المكان قيد البناء وراح ينضاف بتحديث جاي ✨`;
            return;
          }
          app.audio.play('whoosh');
          close();
          if (w.game) app.ui.minigame(w.game);
          else if (w.scene !== here) app.go(w.scene, { spawnX: w.spawn });
        }),
      );
    },
    { className: 'overlay-panel', dismissible: true, label: 'الخريطة' },
  );
}
