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
 *
 * When there is more than one way on, the card shows the real choices instead
 * of picking one: each open place of the current step, then up to two other
 * open missions (main story first), each opening the map on that place.
 */
import { journalEntries } from '../progression/journal-index.js';
import { WORLDS, worldById } from '../data/worlds.js';
import { check } from '../core/conditions.js';
import { fillNames } from '../core/names.js';
import { h, esc } from './dom.js';

const OTHER_CHOICES = 2;
const MAX_CHOICES = 4; // a phone card stays readable

/** What the card would say right now (pure: tested). `null` when there is nothing to guide to. */
export function nextGuidance(game, sceneId) {
  const entries = journalEntries(game);
  const current = entries.find((e) => e.isCurrent && e.status !== 'locked');
  if (!current?.next) return null;
  const here = WORLDS.filter((w) => w.scene && w.scene === sceneId).map((w) => w.id);
  const elsewhere = current.worlds.length > 0 && !current.worlds.some((w) => here.includes(w));
  const reachable = (id) => {
    const w = worldById(id);
    return Boolean(w && !here.includes(id) && check(w.unlock, game));
  };
  // several ways on → the actual choices: this step's places (an act's places are the
  // whole chapter, so an act stays one choice), then other open missions
  const places = current.id.startsWith('act:') ? [] : current.worlds.filter(reachable);
  const mine = places.length
    ? places.map((id) => ({ kind: 'main', label: worldById(id).name, entry: current, place: id }))
    : current.worlds.some(reachable) ? [{ kind: 'main', label: current.title, entry: current }] : [];
  const others = entries
    .filter((e) => e !== current && !e.id.startsWith('act:') && !e.hidden && (e.status === 'active' || e.status === 'available'))
    .filter((e) => e.next && e.next !== current.next && e.worlds.some(reachable))
    .slice(0, OTHER_CHOICES)
    .map((e) => ({ kind: e.category === 'main' ? 'main' : 'side', label: e.title, entry: e, place: e.worlds.find(reachable) }));
  const choices = [...mine, ...others].slice(0, MAX_CHOICES);
  // when the step is right here, no detours are offered
  return { entry: current, text: fillNames(current.next, game), elsewhere, choices: elsewhere && choices.length > 1 ? choices : [] };
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
        ${g.choices.length ? '<p class="guide-or">تگدرين تختارين:</p>' : ''}
        <div class="guide-actions">
          ${
            g.choices.length
              ? g.choices.map((c, i) => `<button type="button" class="btn btn-small ${c.kind === 'main' ? 'btn-primary' : 'btn-ghost'}" data-choice="${i}">${c.kind === 'main' ? '★' : '◆'} ${esc(c.label)}</button>`).join('')
              : g.elsewhere
                ? '<button type="button" class="btn btn-small btn-primary" data-next>🗺️ الهدف التالي</button>'
                : ''
          }
          <button type="button" class="btn btn-small btn-ghost" data-ok>تمام</button>
        </div></aside>`);
    // the card belongs to the world: a menu, puzzle or minigame opening over it takes it away
    // (a dialogue does not: it sits at the bottom and the card stays readable above it)
    const off = app.bus.on('overlay', ({ kinds }) => {
      if (kinds.some((k) => k !== 'overlay-dialogue')) dismiss();
    });
    const dismiss = () => {
      off();
      card.remove();
    };
    card.querySelector('[data-next]')?.addEventListener('click', () => {
      dismiss();
      app.ui.openMap({ focus: g.entry });
    });
    card.querySelectorAll('[data-choice]').forEach((b) =>
      b.addEventListener('click', () => {
        const c = g.choices[Number(b.dataset.choice)];
        dismiss();
        app.ui.openMap({ focus: c.entry, place: c.place });
      }),
    );
    card.querySelector('[data-ok]').addEventListener('click', dismiss);
    host.append(card);
    return true;
  };
  if (tryShow()) return true;
  const id = setInterval(() => {
    if (!host.isConnected || tryShow()) clearInterval(id);
  }, 600);
  return true;
}
