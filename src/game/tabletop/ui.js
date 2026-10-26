/**
 * Shared pieces of the games-room UIs: card faces and backs, the speech bar
 * (Ryan's playing version / Snooki), the ready panel (rules + difficulty),
 * and result lines. Everything is plain DOM so cards are real buttons
 * (touch, keyboard, screen readers).
 */
import { symbol } from '../ui/symbols.js';
import { esc, h } from '../ui/dom.js';
import { SUIT_ICONS, rankLabel, cardName } from './deck.js';
import { pickLines } from '../data/hub-lines.js';
import { CAST } from '../characters/cast.js';
import { snookiPortrait } from '../characters/snooki.js';

/** Card backs (cosmetic slot `cardBack`). */
export const CARD_BACKS = {
  classic: { name: 'ورد أزرق', a: '#2b3a8c', b: '#3f6fe0', icon: 'rose' },
  stars: { name: 'نجوم', a: '#141a48', b: '#ffd977', icon: 'star' },
  paws: { name: 'كفوف', a: '#5a3a4a', b: '#f7b6cb', icon: 'paw' },
  gold: { name: 'ذهبي', a: '#6b4e12', b: '#e2b544', icon: 'crown' },
  moon: { name: 'قمر', a: '#0d1038', b: '#c9b8de', icon: 'moon-full' },
  roses: { name: 'ورد وردي', a: '#8e1c3e', b: '#f7b6cb', icon: 'rose-red' },
};

export const backStyle = (id) => {
  const b = CARD_BACKS[id] || CARD_BACKS.classic;
  return `--back-a:${b.a};--back-b:${b.b}`;
};

/** A playing card as a button. */
export function cardHtml(card, { down = false, back = 'classic', attrs = '', cls = '' } = {}) {
  if (down || !card) {
    const b = CARD_BACKS[back] || CARD_BACKS.classic;
    return `<button type="button" class="pcard is-down ${cls}" style="${backStyle(back)}" ${attrs} aria-label="ورقة مقلوبة"><span class="pcard-back">${symbol(b.icon)}</span></button>`;
  }
  return `<button type="button" class="pcard suit-${card.suit} ${cls}" ${attrs} aria-label="${esc(cardName(card))}">
      <span class="pcard-rank">${esc(rankLabel(card.rank))}</span>
      <span class="pcard-suit">${symbol(SUIT_ICONS[card.suit])}</span>
    </button>`;
}

/** The speech bar at the top of a game: who speaks + the line. */
export function sayBar() {
  const el = h(`<div class="tt-say" aria-live="polite"><span class="tt-face"></span><p><b></b><span></span></p></div>`);
  return {
    el,
    say(line) {
      if (!line) return;
      const ryan = line.s === 'ryanpc';
      el.querySelector('.tt-face').innerHTML = ryan ? CAST.ryanpc.portrait() : snookiPortrait({ expr: line.e || 'happy' });
      el.querySelector('b').textContent = ryan ? 'ريان (نسخة اللعب)' : 'سنوكي';
      el.querySelector('span:last-child').textContent = line.t;
      el.dataset.who = line.s;
    },
  };
}

/** Plays a short script line by line in the bar (2.6 s each, skipped with reduced motion). */
export function sayScript(bar, script, scope, reduced = false) {
  script.forEach((line, i) => scope.timeout(() => bar.say(line), reduced ? 0 : i * 2600));
}

/** One script for a moment (rotating, saved). */
export const momentLines = (app, game, moment) => pickLines(game, moment, (k, n) => app.game.nextLine(k, n));

/** Result text for the host's result card: the first lines of the script. */
export const linesText = (script) => script.map((l) => `${l.s === 'ryanpc' ? 'ريان' : 'سنوكي'}: «${l.t}»`).join('\n');

/* plays per game this session (to choose "before" vs "rematch") */
const plays = new Map();
export function playCount(game) {
  const n = plays.get(game) || 0;
  plays.set(game, n + 1);
  return n;
}

export const DIFFS = [
  ['easy', 'سهلة'],
  ['normal', 'عادية'],
  ['hard', 'صعبة'],
];

/**
 * Ready panel: rules (always readable again), difficulty (when the game has
 * an AI or sizes), and «يلا». Resolves with the chosen difficulty.
 */
export function readyPanel(area, { title, rules, diffs = DIFFS, difficulty = 'normal', extra = '' }) {
  return new Promise((resolve) => {
    let diff = difficulty;
    const el = h(`<section class="tt-ready card">
        <h3>${esc(title)}</h3>
        <details class="tt-rules" open><summary>القوانين</summary><ul>${rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></details>
        ${diffs ? `<p class="field-label">الصعوبة</p><div class="seg" role="radiogroup" aria-label="الصعوبة">${diffs.map(([v, l]) => `<button type="button" role="radio" data-diff="${v}" aria-checked="${v === diff}">${esc(l)}</button>`).join('')}</div>` : ''}
        ${extra}
        <button type="button" class="btn btn-primary btn-big" data-go>يلا نلعب 🃏</button>
      </section>`);
    area.append(el);
    el.querySelectorAll('[data-diff]').forEach((b) =>
      b.addEventListener('click', () => {
        diff = b.dataset.diff;
        el.querySelectorAll('[data-diff]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      }),
    );
    el.querySelector('[data-go]').addEventListener('click', () => {
      const extras = Object.fromEntries([...el.querySelectorAll('[data-opt]')].map((i) => [i.dataset.opt, i.type === 'checkbox' ? i.checked : i.value]));
      el.remove();
      resolve({ difficulty: diff, ...extras });
    });
    el.querySelector('[data-go]').focus({ preventScroll: true });
  });
}

export const MEDAL_BY_DIFF = { easy: 'bronze', normal: 'silver', hard: 'gold' };
