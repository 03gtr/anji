/**
 * Play screen for an exploration location: HUD (objective, map, journal,
 * sound, pause), the world canvas, and touch controls. In portrait the
 * controls sit below the scene; in landscape they float over its corners.
 */
import { createWorld } from '../world/engine.js';
import { h, esc, ICONS } from '../ui/dom.js';
import { currentObjective } from '../data/chapters.js';
import { openPause } from '../ui/menus.js';
import { num } from '../ui/format.js';
import { fillNames } from '../core/names.js';
import { showContentNotice } from '../ui/content-notice.js';

const ORD = ['', 'الفصل الأول', 'الفصل الثاني', 'الفصل الثالث', 'الفصل الرابع', 'الفصل الخامس', 'الفصل السادس', 'الفصل السابع', 'الفصل الثامن'];

export function createExplore(app, scene, { spawnX } = {}) {
  const { game, bus, input, scope, settings } = app;
  const el = h(`<section class="play" data-scene="${scene.id}">
      <header class="hud">
        <button type="button" class="icon-btn hud-btn" data-act="pause" aria-label="إيقاف مؤقت">${ICONS.pause}</button>
        <div class="objective" role="status" aria-live="polite"><small></small><span></span></div>
        <button type="button" class="icon-btn hud-btn" data-act="map" aria-label="الخريطة" hidden>${ICONS.map}</button>
        <button type="button" class="icon-btn hud-btn" data-act="journal" aria-label="الدفتر">${ICONS.journal}</button>
        <button type="button" class="icon-btn hud-btn" data-act="sound"></button>
      </header>
      <div class="stage">
        <div class="loading" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <p>${esc(scene.title)}</p><div class="loading-bar"><i></i></div>
        </div>
        <p class="place-banner" aria-hidden="true">${esc(scene.title)}</p>
      </div>
      <div class="controls" data-mode="play">
        <div class="pad pad-move">
          <button type="button" class="pad-btn" data-input="left" aria-label="يسار">${ICONS.left}</button>
          <button type="button" class="pad-btn" data-input="right" aria-label="يمين">${ICONS.right}</button>
        </div>
        <div class="pad pad-act">
          <button type="button" class="pad-btn pad-interact" data-input="interact" aria-label="فحص" disabled>${ICONS.hand}<span class="pad-label">فحص</span></button>
          <button type="button" class="pad-btn pad-jump" data-input="jump" aria-label="قفزة">${ICONS.up}<span class="pad-label">قفزة</span></button>
        </div>
      </div>
    </section>`);

  const stage = el.querySelector('.stage');
  const loading = el.querySelector('.loading');
  const controls = el.querySelector('.controls');
  const objective = el.querySelector('.objective');
  const mapBtn = el.querySelector('[data-act="map"]');
  const soundBtn = el.querySelector('[data-act="sound"]');
  const interactBtn = el.querySelector('.pad-interact');
  let world = null;

  const renderObjective = () => {
    const o = currentObjective(game);
    objective.querySelector('small').textContent = o.act ? `${ORD[o.act]} · ${o.title}` : o.title || '';
    objective.querySelector('span').textContent = fillNames(o.text, game);
    mapBtn.hidden = !game.flag('map-open');
  };
  const renderSound = () => {
    const on = settings.get().sound;
    soundBtn.innerHTML = on ? ICONS.soundOn : ICONS.soundOff;
    soundBtn.setAttribute('aria-label', on ? 'كتم الصوت' : 'تشغيل الصوت');
    soundBtn.setAttribute('aria-pressed', String(on));
  };
  const renderHints = () => el.classList.toggle('no-labels', !settings.get().controlHints);
  scope.sub(bus.on('change', renderObjective));
  scope.sub(bus.on('cosmetics', () => world?.refreshCosmetics()));
  scope.sub(settings.subscribe(() => {
    renderSound();
    renderHints();
  }));

  for (const b of el.querySelectorAll('[data-input]')) {
    if (b.dataset.input === 'interact') {
      // the interact button acts immediately on tap (no hold needed)
      scope.on(b, 'click', () => world?.interact());
    } else input.bindButton(b, b.dataset.input, scope);
  }

  scope.on(el.querySelector('.hud'), 'click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    app.audio.unlock();
    if (act === 'pause') openPause(app);
    if (act === 'map') app.ui.openMap();
    if (act === 'journal') app.ui.openJournal();
    if (act === 'sound') {
      settings.set({ sound: !settings.get().sound });
      if (settings.get().sound) {
        app.audio.play('tap');
        if (scene.music) app.audio.startBed(scene.music);
      }
    }
  });

  scope.on(document, 'keydown', (e) => {
    if (app.overlays.count || e.target.closest?.('input, textarea')) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      openPause(app);
    } else if (e.code === 'KeyM' && game.flag('map-open')) app.ui.openMap();
    else if (e.code === 'KeyJ') app.ui.openJournal();
  });

  // real-time play pauses under menus, puzzles, minigames and cinematics;
  // during dialogue the scene keeps breathing (idle animation) behind the box
  const heavyOverlay = (kinds) => kinds.some((k) => k !== 'overlay-dialogue');
  scope.sub(
    bus.on('overlay', ({ kinds }) => {
      // menus get the arrow keys / space back (for scrolling) while play is paused
      input.setEnabled(!heavyOverlay(kinds));
      if (!world) return;
      if (heavyOverlay(kinds)) world.pause();
      else world.resume();
    }),
  );
  scope.on(document, 'visibilitychange', () => {
    if (!world) return;
    if (document.hidden) {
      world.saveLocation();
      world.pause();
      app.audio.suspend();
    } else if (!app.overlays.count) {
      world.resume();
      app.audio.resume();
      if (scene.music) app.audio.startBed(scene.music);
    }
  });

  return {
    el,
    async enter() {
      renderObjective();
      renderSound();
      renderHints();
      // (an overlay still open from the scene change re-enables input when it closes)
      input.setEnabled(!app.overlays.count);
      world = await createWorld(stage, scene, app, {
        spawnX,
        onProgress: (done, total) => {
          const pct = Math.round((done / total) * 100);
          loading.setAttribute('aria-valuenow', String(pct));
          loading.querySelector('i').style.width = `${pct}%`;
          loading.setAttribute('aria-valuetext', `${num(pct)}٪`);
        },
      });
      if (!world) return;
      loading.remove();
      game.setLocation(scene.id, world.player.x);
      world.on('target', (it) => {
        if (it) app.tips?.show('interact');
        const label = it ? fillNames(it.label, game) : '';
        interactBtn.disabled = !it;
        interactBtn.querySelector('.pad-label').textContent = it ? label : 'فحص';
        interactBtn.setAttribute('aria-label', it ? `فحص: ${label}` : 'لا شي قريب للفحص');
        interactBtn.classList.toggle('is-ready', Boolean(it));
      });
      world.on('mode', (m) => {
        controls.dataset.mode = m;
      });
      el.classList.add('is-ready');
      if (scene.music) app.audio.startBed(scene.music);
      world.start();
      // contextual tips, one at a time: moving first, then glowing objects
      scope.timeout(() => app.tips?.show('move'), 1200);
      // new story content she can reach now: one small, dismissible card per pack
      scope.timeout(() => showContentNotice(app, scene.id, el), 1800);
      scope.interval(() => {
        if (!app.overlays.count && world.mode === 'play' && world.visibleGlows().length) app.tips?.show('glow');
      }, 4000);
    },
    exit() {
      world?.saveLocation();
      input.setEnabled(false); // releases everything too
    },
    get world() {
      return world;
    },
  };
}
