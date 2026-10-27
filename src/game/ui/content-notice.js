/**
 * "New places are waiting": a small, dismissible card shown once per content
 * pack, only when that pack is actually playable for this save — its scene is
 * registered (loaded), its map location is built, and its unlock condition
 * holds. Both answers acknowledge it (a story flag, so it survives reloads and
 * backups); nothing is reloaded, reset or forced. It waits while a menu,
 * puzzle or cinematic is open and never covers the main menu.
 */
import { check } from '../core/conditions.js';
import { SCENES } from '../data/scenes/index.js';
import { WORLDS } from '../data/worlds.js';
import { PACKS } from '../data/missions-sp1.js';
import { h, esc } from './dom.js';

export const noticeFlag = (pack) => `notice:${pack.id}`;

/** The first pack whose notice is due for this save (or null). */
export function dueNotice(game, sceneId) {
  for (const pack of PACKS) {
    const world = WORLDS.find((w) => w.id === pack.world);
    if (game.flag(noticeFlag(pack)) || !SCENES[pack.scene] || !world?.ready || sceneId === pack.scene) continue;
    let open = false;
    try {
      open = check(pack.unlock, game) && check(world.unlock, game);
    } catch {
      open = false; // a malformed condition never breaks the game: no notice
    }
    if (open) return pack;
  }
  return null;
}

export function showContentNotice(app, sceneId, host) {
  const { game, scope } = app;
  if (!host || host.querySelector('.pack-notice')) return;
  const tryShow = () => {
    const pack = dueNotice(game, sceneId);
    if (!pack) return true; // nothing to show: stop waiting
    // wait for menus / cinematics to close and for toasts to finish (they share the top of the screen)
    if (app.overlays.count || host.ownerDocument.querySelector('.toast')) return false;
    const card = h(`<aside class="pack-notice" role="status" aria-live="polite">
        <p>${esc(pack.notice)}</p>
        <div class="pack-notice-actions">
          <button type="button" class="btn btn-small btn-primary" data-go>استكشفي هسه</button>
          <button type="button" class="btn btn-small btn-ghost" data-later>بعدين</button>
        </div></aside>`);
    const done = () => {
      game.setFlag(noticeFlag(pack));
      card.remove();
    };
    scope.on(card.querySelector('[data-go]'), 'click', () => {
      app.audio.play('tap');
      done();
      app.go(pack.scene, { spawnX: WORLDS.find((w) => w.id === pack.world)?.spawn });
    });
    scope.on(card.querySelector('[data-later]'), 'click', () => {
      app.audio.play('tap');
      done();
    });
    host.append(card);
    return true;
  };
  if (tryShow()) return;
  const id = scope.interval(() => {
    if (tryShow()) clearInterval(id);
  }, 1500);
}
