/**
 * Title screen: a cinematic garden (art/title-scene.js) behind everything,
 * Anji and Snooki in front of the open gate with roses at their feet, and
 * the title + actions. The owner's painted key art replaces the two
 * characters when it is present locally (private builds only). Also the
 * "installation" screen: it shows real progress while the game is saved
 * for offline play.
 *
 * Structure: .title-root (fixed art layer) › .title-screen (the scroller).
 */
import { h, esc } from '../ui/dom.js';
import { painted } from '../art/painted.js';
import { anjiPortrait } from '../characters/anji.js';
import { snookiPortrait } from '../characters/snooki.js';
import { titleBackdrop, titleRoses } from '../art/title-scene.js';
import { offlineText } from '../core/sw-client.js';
import { openSettings, confirmBox } from '../ui/menus.js';
import { currentObjective } from '../data/chapters.js';

export function createTitle(app, { message } = {}) {
  const { game, saves, scope } = app;
  const hero = painted('hero-anji-snooki');
  const logo = painted('title-logo');
  const started = game.flag('intro-done');
  const cast = `<div class="title-cast">
          <div class="cast-anji">${anjiPortrait({ expr: 'smile', outfit: game.state.cosmetics.anjiOutfit, bow: game.state.cosmetics.anjiBow })}</div>
          <div class="cast-snooki">${snookiPortrait({ expr: 'happy' })}</div>
          <div class="title-roses">${titleRoses()}</div>
        </div>`;
  const el = h(`<section class="title-root">
    <div class="title-art-layer" aria-hidden="true">${titleBackdrop('wide')}${titleBackdrop('tall')}
      <div class="title-flies">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--y:${30 + ((i * 53) % 60)}%;--d:${(i % 7) * 0.7}s"></i>`).join('')}</div>
    </div>
    <section class="title-screen">
      <div class="title-hero ${hero ? 'is-painted' : ''}" aria-hidden="true">
        ${hero ? `<img src="${hero}" alt="">` : cast}
      </div>
      <div class="title-copy">
        ${logo ? `<img class="title-logo-img" src="${logo}" alt="Secret Garden: Snooki & The Missing Creator">` : `<h1 class="title-logo"><span>Secret Garden</span><small>Snooki &amp; the Missing Creator</small></h1>`}
        <p class="title-ar">الحديقة السرّية: سنوكي والصانع المفقود</p>
        <p class="title-sub">حكاية غامضة، مضحكة، ومليانة ورد أزرق.</p>
        ${message ? `<p class="title-message" role="status">${esc(message)}</p>` : ''}
        <div class="stack title-actions">
          ${started ? `<button type="button" class="btn btn-primary btn-big" data-act="continue">كمّلي المغامرة</button><p class="title-objective">${esc(currentObjective(game).text)}</p>` : ''}
          <button type="button" class="btn ${started ? 'btn-ghost' : 'btn-primary btn-big'}" data-act="new">${started ? 'مغامرة جديدة' : 'ابدي المغامرة'}</button>
          <button type="button" class="btn btn-ghost" data-act="settings">⚙️ الإعدادات</button>
        </div>
        <p class="offline-line" aria-live="polite"></p>
        <div class="offline-bar" hidden><i></i></div>
      </div>
    </section>
  </section>`);

  const line = el.querySelector('.offline-line');
  const bar = el.querySelector('.offline-bar');
  scope.sub(
    app.offline.subscribe((info) => {
      line.textContent = offlineText(info);
      bar.hidden = info.status !== 'installing' || !info.total;
      if (info.total) bar.querySelector('i').style.width = `${(info.done / info.total) * 100}%`;
    }),
  );

  scope.on(el, 'click', async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    app.audio.unlock();
    app.audio.play('tap');
    if (act === 'continue') {
      const loc = game.state.location;
      app.go(loc.scene || 'garden', { spawnX: loc.x ?? undefined });
    } else if (act === 'new') {
      if (started) {
        const ok = await confirmBox(app, {
          title: 'مغامرة جديدة؟',
          text: 'راح يبدي كل شي من الأول وينمسح التقدم الحالي. (تگدرين تاخذين نسخة احتياطية من الإعدادات.)',
          yes: 'ابدي من جديد',
          danger: true,
        });
        if (!ok) return;
      }
      app.newGame();
    } else if (act === 'settings') openSettings(app);
  });

  return {
    el,
    enter() {
      app.audio.stopBed();
      el.querySelector('.btn')?.focus({ preventScroll: true });
      void saves;
    },
  };
}
