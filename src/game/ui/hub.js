/**
 * Games-room panels: the games table (every table/card game with its record
 * and best medal), the two boards (activities, pranks), the trophy shelf
 * with the replay gallery, and today's optional challenge.
 * Panels only choose; the world runs the choice (so it plays like story
 * content and can always be left).
 */
import { h, esc, tx, ICONS } from './dom.js';
import { symbol } from './symbols.js';
import { num } from './format.js';
import { MINIGAMES } from '../minigames/registry.js';
import { ACTIVITIES, PRANKS } from '../data/activities.js';
import { check } from '../core/conditions.js';
import { hashString } from '../core/rng.js';
import { COSMETICS } from '../data/items.js';
import { CARD_BACKS, backStyle } from '../tabletop/ui.js';
import { painted } from '../art/painted.js';
import { DRAWING_ART } from './drawing.js';

const MEDAL = { gold: '🥇', silver: '🥈', bronze: '🥉' };
export const HUB_GAME_IDS = Object.entries(MINIGAMES)
  .filter(([, m]) => m.hub)
  .map(([id]) => id);

/** Today's suggestion (local date only; no streaks, no expiry, no server). */
export function dailyChallenge(date = new Date()) {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const games = ['memory', 'highcard', 'rosetrick', 'checkers', 'cardtrick'];
  const n = hashString(day);
  const game = games[n % games.length];
  const difficulty = ['easy', 'normal', 'hard'][(n >>> 8) % 3];
  return { day, game, difficulty, seed: n % 100000 };
}

const panel = (app, cls, label, build) =>
  app.overlays.open(
    (el, ctl) => {
      el.innerHTML = `<section class="panel ${cls}"><header class="panel-head"><h2 tabindex="-1">${esc(label)}</h2>
        <button type="button" class="icon-btn" data-close aria-label="إغلاق">${ICONS.close}</button></header><div tabindex="0" class="panel-scroll hub-body"></div></section>`;
      ctl.scope.on(el.querySelector('[data-close]'), 'click', () => ctl.close(null));
      build(el.querySelector('.hub-body'), ctl);
    },
    { className: 'overlay-panel', dismissible: true, label },
  );

/** The games table: resolves with a game id (or null). */
export function openGamesTable(app) {
  const { game } = app;
  return panel(app, 'hub-games', 'طاولة الألعاب', (body, { close }) => {
    const cards = HUB_GAME_IDS.map((id) => {
      const m = MINIGAMES[id];
      const r = game.record(`game:${id}`);
      return `<button type="button" class="hub-game" data-game="${id}">
          <span class="hub-game-icon">${symbol(m.icon)}</span>
          <span><b>${esc(tx(m.title))}</b><small>${esc(tx(m.goal))}</small>
          <em>${r ? `${MEDAL[r.medal] || '—'} · لعبتيها ${num(r.plays)} مرة` : 'جديدة ✨'}</em></span></button>`;
    }).join('');
    const backs = Object.entries(COSMETICS).filter(([, c]) => c.slot === 'cardBack');
    const current = game.state.cosmetics.cardBack || 'classic';
    body.innerHTML = `<div class="hub-games-list">${cards}</div>
      <h3>ظهر الأوراق</h3>
      <div class="hub-backs">${backs
        .map(([key, c]) => {
          const open = c.free || game.isUnlocked(key);
          return `<button type="button" class="hub-back ${current === c.value ? 'is-on' : ''}" data-back="${c.value}" ${open ? '' : 'disabled'} aria-pressed="${current === c.value}" aria-label="${esc(c.name)}${open ? '' : ` (مقفول: ${esc(c.hint || '')})`}">
            <span class="pcard is-down" style="${backStyle(c.value)}"><span class="pcard-back">${symbol(CARD_BACKS[c.value]?.icon || 'rose')}</span></span><small>${open ? esc(CARD_BACKS[c.value]?.name || c.name) : ICONS.lock}</small></button>`;
        })
        .join('')}</div>`;
    body.querySelectorAll('[data-game]').forEach((b) => b.addEventListener('click', () => close(b.dataset.game)));
    body.querySelectorAll('[data-back]').forEach((b) =>
      b.addEventListener('click', () => {
        game.setCosmetic('cardBack', b.dataset.back);
        body.querySelectorAll('[data-back]').forEach((x) => {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-pressed', String(x === b));
        });
        app.audio.play('tap');
      }),
    );
  });
}

/** Activities / pranks board: resolves with an entry id (or null). */
export function openBoard(app, kind) {
  const list = kind === 'pranks' ? PRANKS : ACTIVITIES;
  const title = kind === 'pranks' ? 'مقالب ريان وسنوكي' : 'أنشطة الحديقة';
  return panel(app, `hub-board board-${kind}`, title, (body, { close }) => {
    const done = list.filter((a) => check(a.done, app.game)).length;
    body.innerHTML = `<p class="muted small">${kind === 'pranks' ? 'مقالب بلا أذى: كلها إلها حل وجايزة، وتگدرين تطلعين متى ما تريدين.' : 'أنشطة هادية بالحديقة. كلها اختيارية.'} (${num(done)}/${num(list.length)})</p>
      <div class="hub-board-list">${list
        .map((a) => {
          const ok = check(a.done, app.game);
          return `<button type="button" class="hub-act ${ok ? 'is-done' : ''}" data-act="${a.id}"><span class="hub-game-icon">${symbol(a.icon)}</span><span><b>${esc(a.title)} ${ok ? '✓' : ''}</b><small>${esc(a.text)}</small></span></button>`;
        })
        .join('')}</div>`;
    body.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => close(b.dataset.act)));
  });
}

export const activityById = (kind, id) => (kind === 'pranks' ? PRANKS : ACTIVITIES).find((a) => a.id === id);

/** Trophy shelf: records + the replay gallery. Resolves with { replay } or null. */
export function openTrophies(app) {
  const { game } = app;
  return panel(app, 'hub-trophies', 'رف الجوائز', (body, { close }) => {
    const rows = HUB_GAME_IDS.map((id) => {
      const r = game.record(`game:${id}`);
      return `<li><span>${esc(tx(MINIGAMES[id].title))}</span><b>${r ? `${MEDAL[r.medal] || '—'} · ${num(r.plays)}×` : '—'}</b></li>`;
    }).join('');
    const gifts = game.state.hub.gifts.length;
    const gallery = [
      { id: 'opening', label: 'البداية: الاستيقاظ بالحديقة', when: 'flag:intro-done' },
      { id: 'credits', label: 'النهاية والشكر', when: 'flag:game-complete' },
      { id: 'drawing', label: 'الرسمة', when: 'flag:drawing-seen', private: true },
    ];
    body.innerHTML = `<ul class="hub-records">${rows}</ul>
      <p class="muted small">هدايا ملفوفة: ${num(gifts)} 🎁</p>
      <h3>معرض المشاهد</h3>
      <div class="hub-gallery">${gallery
        .map((g) => {
          const open = check(g.when, game);
          const priv = g.private && painted(DRAWING_ART);
          return `<button type="button" class="hub-act" data-replay="${g.id}" ${open ? '' : 'disabled'}><span class="hub-game-icon">${open ? '▶' : ICONS.lock}</span><span><b>${esc(g.label)}</b>${g.private ? `<small>${priv ? 'فيها رسمة خاصة (محفوظة على هذا الجهاز بس)' : 'الرسمة الخاصة مو موجودة بهاي النسخة'}</small>` : ''}</span></button>`;
        })
        .join('')}</div>`;
    body.querySelectorAll('[data-replay]').forEach((b) => b.addEventListener('click', () => close({ replay: b.dataset.replay })));
  });
}
