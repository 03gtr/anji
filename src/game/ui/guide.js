/**
 * "Next objective" guidance (Phase 03). When a mission is completed and the
 * story's next step is somewhere else, a small card says what was finished and
 * what comes next, with «الهدف التالي» (opens the map focused on the next known
 * place, with its route and travel button) and «تمام» (dismiss, explore freely).
 *
 * It reads the same mission state as the journal, the map and the HUD
 * (progression/journal-index.js), never forces travel, waits for menus and
 * dialogue to close, replaces itself instead of stacking, and is not repeated
 * on reload (mission completion happens once). Hidden destinations are not
 * revealed: a step that has to be worked out points at where the clue is.
 */
import { journalEntries } from '../progression/journal-index.js';
import { WORLDS } from '../data/worlds.js';
import { fillNames } from '../core/names.js';
import { h, esc } from './dom.js';

/** What the card would say right now (pure: tested). `null` when there is nothing to guide to. */
export function nextGuidance(game, sceneId) {
  const current = journalEntries(game).find((e) => e.isCurrent && e.status !== 'locked');
  if (!current?.next) return null;
  const here = WORLDS.filter((w) => w.scene && w.scene === sceneId).map((w) => w.id);
  const elsewhere = current.worlds.length > 0 && !current.worlds.some((w) => here.includes(w));
  return { entry: current, text: fillNames(current.next, game), elsewhere };
}

export function showGuide(app, { finished = [], host, sceneId }) {
  const g = nextGuidance(app.game, sceneId);
  if (!host || !g) return false;
  const tryShow = () => {
    if (app.overlays.count) return false;
    host.querySelector('.guide-card')?.remove();
    const card = h(`<aside class="guide-card" role="status" aria-live="polite">
        ${finished.length ? `<p class="guide-done">✅ خلصت: ${esc(finished.join('، '))}</p>` : ''}
        <p><b>الهدف التالي:</b> ${esc(g.text)}</p>
        <div class="guide-actions">
          ${g.elsewhere ? '<button type="button" class="btn btn-small btn-primary" data-next>🗺️ الهدف التالي</button>' : ''}
          <button type="button" class="btn btn-small btn-ghost" data-ok>تمام</button>
        </div></aside>`);
    card.querySelector('[data-next]')?.addEventListener('click', () => {
      card.remove();
      app.ui.openMap({ focus: g.entry });
    });
    card.querySelector('[data-ok]').addEventListener('click', () => card.remove());
    host.append(card);
    return true;
  };
  if (tryShow()) return true;
  const id = setInterval(() => {
    if (!host.isConnected || tryShow()) clearInterval(id);
  }, 600);
  return true;
}
