/**
 * Menus and panels: chapter cards, pause, settings (incl. save backup /
 * restore / reset), journal, and the world map.
 */
import { h, esc, tx, ICONS } from './dom.js';
import { symbol } from './symbols.js';
import { num } from './format.js';
import { painted } from '../art/painted.js';
import { ACTS } from '../data/chapters.js';
import { WORLDS, ROUTES, REGIONS, worldById, regionOf } from '../data/worlds.js';
import { JOURNAL, COLLECTIBLES, ITEMS, GROUP_NAMES, worldCompletion } from '../data/items.js';
import { MINIGAMES } from '../minigames/registry.js';
import { PUZZLES } from '../data/puzzles.js';
import { check } from '../core/conditions.js';
import { fillNames } from '../core/names.js';
import { groupOf } from '../core/game.js';
import { offlineText } from '../core/sw-client.js';
import { importMemoriesText, clearImportedMemories, loadPersonal } from '../memories/registry.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';
import { journalEntries, filterEntries, displayNo, evidenceView, FILTERS, STATUS_NAMES } from '../progression/journal-index.js';

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
        <div tabindex="0" class="panel-scroll">
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
          ${toggle('tips', 'نصائح قصيرة أول مرة تحتاجينها')}
          <button type="button" class="btn btn-ghost btn-small" data-tips-reset>رجّعي كل النصائح من جديد</button>
          <h3>السباقات</h3>
          <p class="field-label">صعوبة السياقة</p>
          ${seg('raceDifficulty', [['easy', 'سهلة'], ['normal', 'عادية'], ['hard', 'صعبة']])}
          <p class="muted small">«سهلة»: سيارات أقل، والمقود يساعدچ ترجعين للطريق، والوقت ما يأثر على تقدم القصة.</p>
          <h3>الحفظ</h3>
          <p class="muted">التقدم ينحفظ تلقائياً على هذا الجهاز فقط. ماكو حساب ولا إنترنت.</p>
          <div class="stack">
            <button type="button" class="btn btn-ghost" data-export>⬇️ نسخة احتياطية من التقدم</button>
            <label class="btn btn-ghost file-btn">⬆️ استرجاع من نسخة احتياطية<input type="file" accept="application/json,.json" data-import hidden></label>
            <button type="button" class="btn btn-danger" data-clear>مسح التقدم والبدء من جديد</button>
          </div>
          <h3>ذكريات خاصة</h3>
          <p class="muted small">ملف ذكريات (JSON) يبقى على هذا الجهاز فقط وما ينرفع لأي مكان. الإطارات الفاضية تنملي بذكريات من القصة.</p>
          <p class="memories-line"></p>
          <div class="stack">
            <label class="btn btn-ghost file-btn">📸 استيراد ملف ذكريات<input type="file" accept="application/json,.json" data-memories hidden></label>
            <button type="button" class="btn btn-ghost" data-clear-memories>إزالة الذكريات المستوردة</button>
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
      scope.on(el.querySelector('[data-tips-reset]'), 'click', () => {
        app.tips.reset();
        el.querySelector('[data-toggle="tips"]').checked = true;
        app.ui.toast('النصائح راح تطلع مرة ثانية ✓');
      });
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
      const memLine = el.querySelector('.memories-line');
      const renderMemories = () => {
        const n = loadPersonal().memories.length;
        memLine.textContent = n ? `ذكريات خاصة مفعّلة: ${n}` : 'ماكو ذكريات خاصة مفعّلة.';
      };
      renderMemories();
      scope.on(el.querySelector('[data-memories]'), 'change', async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const res = importMemoriesText(await file.text());
        if (!res.ok) app.ui.toast(res.error === 'not-json' ? 'الملف مو JSON صالح.' : res.error === 'empty' ? 'الملف ما بيه ذكريات.' : 'ما گدرنا نحفظ الذكريات على هذا الجهاز.', 'warn');
        else app.ui.toast(`انضافت ${res.count} ذكريات${res.skipped?.length ? ` (وتجاهلنا ${res.skipped.length} بيها أخطاء)` : ''} ✨`);
        renderMemories();
      });
      scope.on(el.querySelector('[data-clear-memories]'), 'click', async () => {
        const ok = await confirmBox(app, { title: 'إزالة الذكريات؟', text: 'راح تنشال الذكريات المستوردة من هذا الجهاز. التقدم بالقصة يبقى.', yes: 'إزالة', danger: true });
        if (!ok) return;
        clearImportedMemories();
        renderMemories();
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
          <button type="button" class="btn btn-ghost" data-act="help">❓ المساعدة</button>
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
        if (act === 'help') openHelp(app);
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
        ['missions', 'المهمات'],
        ['evidence', 'الأدلة'],
        ['collection', 'المجموعات'],
        ['bag', 'الحقيبة'],
        ['challenges', 'التحديات'],
        ['achievements', 'الإنجازات'],
      ];
      el.innerHTML = `<section class="panel journal">
        <header class="panel-head"><h2 tabindex="-1">دفتر أنجي</h2>
          <button type="button" class="icon-btn" data-close aria-label="إغلاق">${ICONS.close}</button></header>
        <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button type="button" role="tab" data-tab="${id}">${label}</button>`).join('')}</div>
        <div tabindex="0" class="panel-scroll journal-body" role="tabpanel"></div></section>`;
      const body = el.querySelector('.journal-body');

      function render(which) {
        el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === which)));
        if (which === 'notes') {
          const all = game.state.journal.filter((id) => JOURNAL[id]);
          const entries = all.filter((id) => JOURNAL[id].group !== 'clues');
          const clues = all.filter((id) => JOURNAL[id].group === 'clues');
          const notes = game.state.collected.filter((id) => groupOf(id) === 'note');
          const entry = (id) => `<article class="entry"><span class="entry-icon">${symbol(JOURNAL[id].icon)}</span><div><h4>${esc(JOURNAL[id].title)}</h4><p>${esc(fillNames(JOURNAL[id].text, game))}</p>${JOURNAL[id].open ? `<button type="button" class="btn btn-ghost btn-small" data-open="${esc(JOURNAL[id].open)}">${esc(JOURNAL[id].openLabel || 'افتحي')}</button>` : ''}</div></article>`;
          body.innerHTML = `
            ${entries.length ? entries.map(entry).join('') : '<p class="muted">الدفتر فارغ. الحديقة مليانة أسرار بعد.</p>'}
            ${clues.length ? `<p class="muted small clue-head">🔎 الأدلة والاستنتاجات صارت بتبويب «الأدلة».</p>` : ''}
            ${notes.length ? `<h3>رسائل ريان</h3>${notes.map((id) => `<article class="entry note"><span class="entry-icon">📜</span><div><h4>${esc(COLLECTIBLES[id]?.name || id)}</h4><p>${esc(COLLECTIBLES[id]?.text || '')}</p></div></article>`).join('')}` : ''}`;
          body.querySelectorAll('[data-open]').forEach((b) =>
            b.addEventListener('click', () => {
              if (b.dataset.open === 'drawing') app.ui.drawing?.({ revisit: true });
            }),
          );
        } else if (which === 'missions') {
          const entries = journalEntries(game);
          body.innerHTML = renderMissions(game, entries, missionFilter);
          body.querySelectorAll('[data-filter]').forEach((b) =>
            b.addEventListener('click', () => {
              missionFilter = b.dataset.filter;
              render('missions');
              body.querySelector(`[data-filter="${missionFilter}"]`)?.focus({ preventScroll: true });
            }),
          );
          body.querySelectorAll('[data-mhint]').forEach((b) =>
            b.addEventListener('click', () => {
              const p = b.nextElementSibling;
              p.hidden = !p.hidden;
              b.setAttribute('aria-expanded', String(!p.hidden));
            }),
          );
          body.querySelectorAll('[data-mapfocus]').forEach((b) =>
            b.addEventListener('click', () => {
              const e = entries.find((x) => x.id === b.dataset.mapfocus);
              close();
              app.ui.openMap({ focus: e });
            }),
          );
        } else if (which === 'evidence') {
          const views = evidenceView(game);
          body.innerHTML = views.length
            ? views
                .map(
                  (v) => `<section class="evidence ${v.optional ? 'is-optional' : ''}" data-evidence="${esc(v.mission.id)}">
                  <header><span class="mission-no">${esc(displayNo(v.mission, num))}</span><h4>${esc(v.mission.title)}</h4>${v.optional ? '<span class="mission-kind kind-side">اختياري</span>' : ''}</header>
                  ${v.question ? `<p class="ev-question">❔ ${esc(v.question)}</p>` : ''}
                  ${v.facts.length ? `<p class="ev-label">👁 مشاهدات</p>${v.facts.map((f) => `<div class="ev-fact"><b>${esc(f.title)}</b><span>${esc(fillNames(f.text, game))}</span>${f.place ? `<small>📍 ${esc(f.place)}</small>` : ''}</div>`).join('')}` : ''}
                  ${v.missing ? `<p class="ev-missing muted small">بعد ${num(v.missing)} ${v.missing === 1 ? 'دليل' : 'أدلة'} ما انلگت.</p>` : ''}
                  <p class="ev-label">💡 استنتاج</p>
                  ${
                    v.deduction.status === 'solved'
                      ? `<div class="ev-deduction is-solved">✅ ${v.deduction.title ? `<b>${esc(v.deduction.title)}</b> ` : ''}${esc(fillNames(v.deduction.text || 'انحل.', game))}</div>`
                      : v.deduction.status === 'ready'
                        ? `<div class="ev-deduction">❓ كل الأدلة بإيدچ. شنو تستنتجين؟${v.deduction.board ? ` <button type="button" class="btn btn-small btn-primary" data-board="${esc(v.deduction.board)}">🔎 جرّبي نظريتچ</button>` : ''}</div>`
                        : '<div class="ev-deduction">❓ بعد ما انحل.</div>'
                  }
                </section>`,
                )
                .join('')
            : '<p class="muted">ماكو أدلة بعد. الأدلة اللي تلگينها بالتحقيقات تنحفظ هنا.</p>';
          body.querySelectorAll('[data-board]').forEach((b) =>
            b.addEventListener('click', () => {
              close();
              app.ui.puzzle(b.dataset.board);
            }),
          );
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
        } else if (which === 'achievements') {
          const got = ACHIEVEMENTS.filter((a) => game.flag(`ach:${a.id}`)).length;
          body.innerHTML = `<p class="muted">${num(got)}/${num(ACHIEVEMENTS.length)} إنجاز</p>${ACHIEVEMENTS.map((a) => {
            const done = game.flag(`ach:${a.id}`);
            return `<article class="entry ${done ? '' : 'is-locked'}"><span class="entry-icon">${done ? symbol(a.icon) : ICONS.lock}</span><div><h4>${esc(a.name)}</h4><p>${esc(a.text)}</p></div></article>`;
          }).join('')}`;
        } else {
          const list = Object.entries(MINIGAMES).filter(([id]) => game.record(`game:${id}`)?.completed || (MINIGAMES[id].unlock && check(MINIGAMES[id].unlock, game)));
          const puzzles = Object.entries(PUZZLES).filter(([id]) => game.record(`puzzle:${id}`)?.completed);
          body.innerHTML = list.length || puzzles.length
            ? `<p class="muted">العبي أي تحدي خلّصتيه مرة ثانية، وحاولي توصلين للذهبية.</p>${list
                .map(([id, m]) => {
                  const r = game.record(`game:${id}`);
                  const medal = { gold: '🥇', silver: '🥈', bronze: '🥉' }[r?.medal] || '—';
                  return `<button type="button" class="entry entry-btn" data-play="${id}"><span class="entry-icon">${symbol(m.icon)}</span><div><h4>${esc(tx(m.title))}</h4><p>${medal} · لعبتيها ${num(r?.plays || 0)} مرة</p></div></button>`;
                })
                .join('')}${
                puzzles.length
                  ? `<h3>الألغاز</h3>${puzzles
                      .map(([id, p]) => {
                        const skipped = game.flag(`skipped:${id}`) && game.record(`puzzle:${id}`).plays < 2;
                        return `<button type="button" class="entry entry-btn" data-puzzle="${id}"><span class="entry-icon">🧩</span><div><h4>${esc(tx(p.title))}</h4><p>${skipped ? 'تخطّيتيه — جرّبي تحلّينه' : 'انحلّ ✓ · العبيه مرة ثانية'}</p></div></button>`;
                      })
                      .join('')}`
                  : ''
              }`
            : '<p class="muted">التحديات تنفتح هنا بعد ما تخلصينها بالقصة.</p>';
          body.querySelectorAll('[data-play]').forEach((b) =>
            b.addEventListener('click', () => {
              close();
              app.ui.minigame(b.dataset.play);
            }),
          );
          body.querySelectorAll('[data-puzzle]').forEach((b) =>
            b.addEventListener('click', () => {
              close();
              app.ui.puzzle(b.dataset.puzzle);
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

/* ── missions (journal tab) ───────────────────────────────── */
let missionFilter = 'all'; // remembered while the game is open

const STATUS_ICON = { locked: '🔒', available: '✨', active: '▶', complete: '✅' };

export function renderMissions(game, entries = journalEntries(game), filter = 'all') {
  const shown = filterEntries(entries, filter);
  const chips = FILTERS.map(([id, label]) => {
    const n = filterEntries(entries, id).length;
    return `<button type="button" class="chip ${id === filter ? 'is-on' : ''}" data-filter="${id}" aria-pressed="${id === filter}">${esc(label)} <small>${num(n)}</small></button>`;
  }).join('');
  const card = (e) => {
    const title = e.hidden ? 'مهمة مخفية' : e.title;
    const text = fillNames(e.next, game);
    const body =
      e.status === 'complete'
        ? `<p class="mission-reward">✅ خلصت${e.reward ? ` · ${esc(e.reward)}` : ''}</p>`
        : e.status === 'locked'
          ? `<p class="mission-locked">🔒 ${esc(e.locked)}</p>`
          : `${e.summary ? `<p class="mission-summary">${esc(fillNames(e.summary, game))}</p>` : ''}
             <p class="mission-next"><b>${e.status === 'available' ? 'للبدء:' : 'الخطوة الجاية:'}</b> ${esc(text)}</p>
             ${e.hint ? `<button type="button" class="btn btn-ghost btn-small" data-mhint aria-expanded="false">💡 تلميح</button><p class="mission-hint" hidden>${esc(fillNames(e.hint, game))}</p>` : ''}
             ${e.reward ? `<p class="mission-reward muted small">الجايزة: ${esc(e.reward)}</p>` : ''}`;
    return `<article class="mission status-${e.status} cat-${e.category} ${e.isCurrent ? 'is-current' : ''}" data-mission="${esc(e.id)}" ${e.isCurrent ? 'aria-current="step"' : ''}>
        <header>
          <span class="mission-no">${esc(displayNo(e, num))}</span>
          <h4>${esc(title)}</h4>
          <span class="mission-status st-${e.status}">${STATUS_ICON[e.status]} ${STATUS_NAMES[e.status]}</span>
        </header>
        <p class="mission-meta"><span class="mission-kind kind-${e.category}">${esc(e.kindLabel)}</span>
          ${e.hidden ? '' : `<span class="mission-where">📍 ${esc(e.where)}</span>`}
          ${e.status === 'active' ? `<span class="mission-steps" aria-label="الخطوات">${num(e.steps.done)}/${num(e.steps.total)}</span>` : ''}</p>
        ${e.isCurrent ? '<p class="mission-now">◀ النشطة الآن</p>' : ''}
        ${body}
        ${e.worlds.length && !e.hidden ? `<button type="button" class="btn btn-ghost btn-small" data-mapfocus="${esc(e.id)}">🗺️ على الخريطة</button>` : ''}
      </article>`;
  };
  const doneCount = filterEntries(entries, 'done').length;
  return `<div class="chips" role="group" aria-label="تصفية المهمات">${chips}</div>
    ${shown.length ? shown.map(card).join('') : '<p class="muted">ماكو شي هنا بعد. كمّلي القصة… المهمات تنفتح بالطريق.</p>'}
    ${filter !== 'done' && doneCount ? `<button type="button" class="btn btn-ghost btn-small done-link" data-filter="done">✅ ${num(doneCount)} مكتملة — اعرضيها</button>` : ''}`;
}

/* ── help ─────────────────────────────────────────────────── */
export const HELP_SECTIONS = [
  ['🎮 التحكم', ['◀ ▶ للمشي، ⬆ للقفز. أو المسي الأرض بالمشهد حتى تمشين لهناك.', 'بالكيبورد: الأسهم أو A/D للمشي، المسافة أو ↑ للقفز، E أو Enter للفحص، Esc للإيقاف، M للخريطة، J للدفتر.']],
  ['✋ الفحص والأشياء', ['لمن تقربين من شي يطلع فوقه رمز، وزر «فحص» يصير أصفر. المسيه (أو المسي الشي نفسه).', 'النجمة الصغيرة اللي تلمع فوق شي يعني بعد ما فحصتيه.', 'النجوم والبذور والرسائل تنجمع بس تلمسينها. بعضها عالي ويحتاج قفزة من رف.']],
  ['🗺️ الخريطة', ['تنفتح بعد الفصل الأول. زر الخريطة فوق ينقلچ لأي مكان انفتح.', 'الأماكن المقفولة تنفتح بالقصة.']],
  ['📖 الدفتر', ['«الدفتر»: الأدلة والرسائل.', '«المهمات»: المهمات الجانبية، الخطوة الجاية، وتلميح لكل خطوة.', '«التحديات»: العبي أي لعبة خلصتيها مرة ثانية للذهبية.']],
  ['💡 التلميحات والألغاز', ['كل لغز بيه هدف بجملة وحدة فوق.', 'زر «تلميح» يعطي مساعدة خطوة بخطوة: من فكرة عامة، للشي المهم، لشنو تسوين بالضبط.', 'بعد التلميحات تگدرين «تشوفين الحل» أو «تتخطين اللغز» — والقصة تكمل عادي.']],
  ['🔁 الألعاب الصغيرة', ['⏸ يوقف أي لعبة، وبيه «من البداية» و«رجوع للمغامرة».', 'ماكو خسارة: الغلط يكلف وقت أو ميدالية بس، مو تقدم.', 'السباقات إلها صعوبة (سهلة / عادية / صعبة) من الإعدادات.']],
  ['💾 الحفظ', ['كل شي ينحفظ تلقائياً على هذا الجهاز.', 'الإعدادات ← «نسخة احتياطية» تنزّل ملف. «استرجاع» يرجّع التقدم منه (حتى على جهاز ثاني).', 'اللعبة تشتغل بدون إنترنت بعد أول فتحة.']],
];

export function openHelp(app) {
  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `<section class="panel help">
        <header class="panel-head"><h2 tabindex="-1">المساعدة</h2>
          <button type="button" class="icon-btn" data-close aria-label="إغلاق">${ICONS.close}</button></header>
        <div tabindex="0" class="panel-scroll">
          ${HELP_SECTIONS.map(([title, lines]) => `<h3>${esc(title)}</h3><ul class="help-list">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`).join('')}
        </div></section>`;
      scope.on(el.querySelector('[data-close]'), 'click', () => close());
    },
    { className: 'overlay-panel', dismissible: true, label: 'المساعدة' },
  );
}

/* ── world map ────────────────────────────────────────────── */
/** Shortest chain of map routes between two locations (ids), or [] (pure). */
export function mapPath(from, to) {
  if (!from || !to || from === to) return [];
  const prev = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) break;
    for (const [a, b] of ROUTES) {
      const nxt = a === cur ? b : b === cur ? a : null;
      if (nxt && !(nxt in prev)) {
        prev[nxt] = cur;
        queue.push(nxt);
      }
    }
  }
  if (!(to in prev)) return [];
  const edges = [];
  for (let n = to; prev[n] != null; n = prev[n]) edges.push([prev[n], n]);
  return edges.reverse();
}

/**
 * @param {{ focus?: object, place?: string }} [opts] — a journal entry (progression/journal-index.js) to
 *   locate: its places are highlighted, the route from here is drawn (to `place` when
 *   one of them was chosen), and the panel says what to do there (or how it opens).
 *   Tapping a place still travels, as before.
 */
export function openMap(app, { focus: asked, place } = {}) {
  const { game } = app;
  return app.overlays.open(
    (el, { close, scope }) => {
      const here = game.state.location.scene;
      // the same mission state as the journal and the HUD: without an explicit focus, the map
      // shows the current objective; each place says what it holds (open story / side / done)
      const entries = journalEntries(game);
      const current = entries.find((e) => e.isCurrent && e.status !== 'locked' && e.worlds.length);
      const focus = asked ?? current ?? null;
      const isCurrentFocus = Boolean(focus && focus === current);
      const badge = {};
      for (const e of entries) {
        if (e.hidden || e.status === 'locked') continue;
        for (const w of e.worlds) {
          const kind = e.status === 'complete' ? 'done' : e.category === 'main' ? 'main' : 'side';
          const rankOf = { main: 3, side: 2, done: 1 };
          if ((rankOf[kind] || 0) > (rankOf[badge[w]] || 0)) badge[w] = kind;
        }
      }
      const BADGE = { main: '★', side: '◆', done: '✓' };
      const hereWorld = WORLDS.find((w) => w.scene && w.scene === here);
      const open = (w) => check(w.unlock, game);
      const targets = (focus?.worlds || []).map(worldById).filter(Boolean);
      if (place) targets.sort((a, b) => (b.id === place) - (a.id === place)); // a chosen place routes first
      const target = targets[0];
      const path = new Set(mapPath(hereWorld?.id, target?.id).map(([a, b]) => [a, b].sort().join('|')));
      // Phase 04: two pages. The page shown is the target's, else where she is; the tabs appear
      // once the deep garden has an open place (before that it does not exist for her)
      const deepOpen = WORLDS.some((w) => regionOf(w) === 'deep' && open(w));
      let region = regionOf(target ?? hereWorld);
      if (region === 'deep' && !deepOpen && !target) region = 'garden';
      const unvisited = (w) => regionOf(w) === 'deep' && open(w) && !game.flag(`visited:${w.scene}`);
      const lines = (r) =>
        ROUTES.filter(([a, b]) => regionOf(worldById(a)) === r && regionOf(worldById(b)) === r)
          .map(([a, b]) => {
            const A = worldById(a);
            const B = worldById(b);
            const lit = open(A) && open(B);
            return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="route ${lit ? 'is-open' : ''} ${path.has([a, b].sort().join('|')) ? 'is-path' : ''}"/>`;
          })
          .join('');
      const focusText = !focus
        ? ''
        : focus.status === 'complete'
          ? '✅ خلصت.'
          : focus.status === 'locked'
            ? `🔒 ${focus.locked}`
            : `${focus.status === 'available' ? 'للبدء:' : 'الخطوة الجاية:'} ${fillNames(focus.next, game) ?? ''}`;
      const canGo = target && open(target) && target.ready && target.scene && target.scene !== here;
      el.innerHTML = `<section class="panel map ${focus ? 'has-focus' : ''}">
        <header class="panel-head"><h2 tabindex="-1">خريطة الحديقة</h2>
          <button type="button" class="icon-btn" data-close aria-label="إغلاق">${ICONS.close}</button></header>
        ${
          focus
            ? `<div class="map-focus st-${focus.status}" role="status">
                <p class="map-focus-title">${isCurrentFocus ? '<small class="map-focus-kicker">الهدف الحالي</small> ' : ''}<span class="mission-no">${esc(displayNo(focus, num))}</span> ${esc(focus.hidden ? 'مهمة مخفية' : focus.title)}</p>
                <p class="map-focus-text">${esc(focusText)}</p>
                ${target && !open(target) ? `<p class="map-focus-text muted">«${esc(target.name)}» بعده مقفول بالخريطة.</p>` : ''}
                ${canGo ? `<button type="button" class="btn btn-primary btn-small" data-go="${target.id}">🧭 روحي لـ«${esc(target.name)}»</button>` : ''}
              </div>`
            : ''
        }
        ${
          deepOpen
            ? `<div class="map-regions" role="group" aria-label="صفحات الخريطة">${REGIONS.map(
                (r) => `<button type="button" data-region="${r.id}" aria-pressed="${r.id === region}">${esc(r.name)}${WORLDS.some((w) => regionOf(w) === r.id && unvisited(w)) ? '<span class="map-region-dot" aria-label="(بيها مكان جديد)"></span>' : ''}</button>`,
              ).join('')}</div>`
            : ''
        }
        <div class="map-board"></div>
        <p class="map-legend" aria-hidden="true"><span>★ القصة</span><span>◆ جانبية / لغز</span><span>✓ مكتملة</span><span>🔒 مقفول</span><span class="map-legend-deep">● مكان ما زرتيه · ⤒ مدخل من الحديقة</span></p>
        <p class="map-info" aria-live="polite">${focus ? 'المكان المضوي هو وين المهمة. المسي أي مكان مفتوح حتى تسافرين.' : 'اختاري مكان.'}</p></section>`;
      const info = el.querySelector('.map-info');
      const boardEl = el.querySelector('.map-board');
      const drawBoard = () => {
        boardEl.className = `map-board region-${region}`;
        el.querySelector('.map-legend-deep').hidden = region !== 'deep';
        boardEl.innerHTML = `<svg class="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines(region)}</svg>
          ${WORLDS.filter((w) => regionOf(w) === region)
            .map((w) => {
              const unlocked = open(w);
              const playable = unlocked && w.ready;
              const isTarget = targets.includes(w);
              const gate = w.from && worldById(w.from);
              return `<button type="button" class="map-node ${w.x < 50 ? 'label-after' : 'label-before'} ${unlocked ? 'is-open' : 'is-locked'} ${w.optional ? 'is-optional' : ''} ${playable ? '' : 'is-soon'} ${w.scene && w.scene === here ? 'is-here' : ''} ${isTarget ? `is-target ${focus.status === 'complete' ? 'is-target-done' : ''}` : ''}"
                style="--x:${w.x};--y:${w.y}" data-world="${w.id}" aria-label="${esc(w.name)}${unlocked ? '' : ' (مقفول)'}${w.optional ? ' (اختياري)' : ''}${gate ? ` — مدخلها من «${esc(gate.name)}»` : ''}${unvisited(w) ? ' — ما زرتيها بعد' : ''}${isTarget ? ' — مكان المهمة' : ''}">
                <span class="map-icon">${unlocked ? symbol(w.icon) : ICONS.lock}</span>
                ${unlocked && badge[w.id] ? `<span class="map-badge b-${badge[w.id]}" aria-hidden="true">${BADGE[badge[w.id]]}</span>` : ''}
                ${unvisited(w) ? '<span class="map-new" aria-hidden="true"></span>' : ''}
                <span class="map-name">${unlocked ? `${gate ? '⤒ ' : ''}${esc(w.short ?? w.name)}` : '؟؟؟'}</span></button>`;
            })
            .join('')}`;
        boardEl.querySelectorAll('[data-world]').forEach((b) => scope.on(b, 'click', () => pick(worldById(b.dataset.world))));
      };
      el.querySelectorAll('[data-region]').forEach((b) =>
        scope.on(b, 'click', () => {
          region = b.dataset.region;
          el.querySelectorAll('[data-region]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.region === region)));
          app.audio.play('page');
          drawBoard();
        }),
      );
      scope.on(el.querySelector('[data-close]'), 'click', () => close());
      const go = el.querySelector('[data-go]');
      if (go) {
        scope.on(go, 'click', () => {
          app.audio.play('whoosh');
          close();
          app.go(target.scene, { spawnX: target.spawn });
        });
      }
      function pick(w) {
        if (!open(w)) {
          info.textContent = w.locked ? `🔒 مكان مقفول. ${w.locked}` : `مكان مقفول. ينفتح بالفصل ${ORD[w.act - 1]}.`;
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
      }
      drawBoard();
    },
    { className: 'overlay-panel', dismissible: true, label: 'الخريطة' },
  );
}
