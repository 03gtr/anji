/**
 * «لعبة الذاكرة» — the games-room memory match.
 * Sizes: 6 / 8 / 12 pairs. Optional timer (off by default: no time
 * pressure). Card themes unlock by playing; the card back is the player's
 * cosmetic. Snooki comments on match streaks.
 */
import { deal, flipCard, hideOpen, cardsMedal } from './cards-logic.js';
import { symbol } from '../ui/symbols.js';
import { check } from '../core/conditions.js';
import { h, esc } from '../ui/dom.js';
import { num, raceTime } from '../ui/format.js';
import { readyPanel, sayBar, sayScript, momentLines, linesText, playCount, backStyle, CARD_BACKS } from '../tabletop/ui.js';

export const MEMORY_THEMES = {
  garden: { name: 'الحديقة', icons: ['rose', 'leaf', 'moon-full', 'star', 'drop', 'sun', 'heart', 'key', 'feather', 'note', 'crown', 'mark'] },
  kitchen: { name: 'المطبخ', unlock: 'record:game:memory', icons: ['apple', 'carrot', 'avocado', 'egg', 'bread', 'fish', 'berries', 'yogurt', 'honey', 'spinach', 'coffee', 'candy'] },
  friends: { name: 'الأصدقاء', unlock: 'medal:game:memory:gold', icons: ['paw', 'feather', 'cat', 'robot', 'bird', 'footprint', 'claw', 'hoof', 'bone', 'dumbbell', 'car', 'map'] },
};
export const MEMORY_SIZES = { easy: 6, normal: 8, hard: 12 };
const STREAK = ['ثنتين ورا بعض! هاي ذاكرة محققة.', 'ثلاث! آني ما أگدر أعد لهالحد، بس فرحان.', 'سلسلة! ريان، شوف! …ريان بالابتوب. شوف من الابتوب!'];

export function mount(area, { app, scope, options, hud, finish }) {
  const { game } = app;
  const bar = sayBar();
  const wrap = h('<div class="tt memory"></div>');
  wrap.append(bar.el);
  area.append(wrap);
  let paused = false;

  const available = Object.entries(MEMORY_THEMES).filter(([, t]) => !t.unlock || check(t.unlock, game));
  const themeSelect = `<p class="field-label">الرسوم</p><select class="tt-select" data-opt="theme">${available.map(([id, t]) => `<option value="${id}">${esc(t.name)}</option>`).join('')}</select>
    <label class="toggle"><input type="checkbox" data-opt="timer"><span>مع مؤقت (اختياري)</span></label>`;
  sayScript(bar, momentLines(app, 'memory', playCount('memory') ? 'rematch' : 'before'), scope, app.reduced());

  readyPanel(wrap, {
    title: 'لعبة الذاكرة',
    rules: ['اقلبي ورقتين بكل مرة.', 'إذا تطابقن يبقن مفتوحات، وإذا لا ينقلبن.', 'خلّصي كل الأزواج بأقل عدد محاولات.', 'المؤقت اختياري؛ بدونه ماكو أي ضغط وقت.'],
    diffs: [['easy', '٦ أزواج'], ['normal', '٨ أزواج'], ['hard', '١٢ زوج']],
    extra: themeSelect,
  }).then(({ difficulty, theme = 'garden', timer = false }) => {
    if (scope.disposed) return;
    const pairs = MEMORY_SIZES[difficulty];
    const s = deal(MEMORY_THEMES[theme].icons.slice(0, pairs), options.seed ?? (Date.now() % 100000));
    const back = game.state.cosmetics.cardBack || 'classic';
    let streak = 0;
    let t = 0;
    const grid = h(`<div class="cards-grid mem-grid" style="--n:${pairs <= 6 ? 3 : 4};${backStyle(back)}">
        ${s.deck.map((c, i) => `<button type="button" class="card-tile" data-i="${i}" aria-label="ورقة ${num(i + 1)}"><span class="card-inner"><span class="card-back mem-back">${symbol(CARD_BACKS[back]?.icon || 'rose')}</span><span class="card-face">${symbol(c.symbol)}</span></span></button>`).join('')}
      </div>`);
    wrap.append(grid);
    const tiles = [...grid.querySelectorAll('.card-tile')];
    const paint = () => {
      tiles.forEach((b, i) => {
        const up = s.open.includes(i) || s.matched.has(i);
        b.classList.toggle('is-up', up);
        b.classList.toggle('is-matched', s.matched.has(i));
        b.setAttribute('aria-label', up ? `ورقة ${num(i + 1)}: مفتوحة` : `ورقة ${num(i + 1)}`);
      });
      hud(`🃏 ${num(s.matched.size / 2)}/${num(pairs)} · محاولات ${num(s.moves)}${timer ? ` · ⏱ ${raceTime(t)}` : ''}`);
    };
    if (timer) scope.interval(() => {
      if (!paused && !s.done) {
        t += 0.25;
        paint();
      }
    }, 250);
    let busy = false;
    tiles.forEach((b) =>
      scope.on(b, 'click', () => {
        if (paused || busy) return;
        const res = flipCard(s, Number(b.dataset.i));
        if (res === 'noop') return;
        app.audio.play(res === 'match' ? 'sparkle' : 'tap');
        if (res === 'match') {
          streak += 1;
          if (streak >= 2) bar.say({ s: 'snooki', e: 'happy', t: STREAK[Math.min(STREAK.length - 1, streak - 2)] });
        }
        if (res === 'miss') {
          streak = 0;
          busy = true;
          paint();
          scope.timeout(() => {
            hideOpen(s);
            busy = false;
            paint();
          }, app.reduced() ? 500 : 900);
          return;
        }
        paint();
        if (s.done) {
          const prev = game.record('game:memory')?.best;
          const record = prev != null && s.moves < prev;
          const script = momentLines(app, 'memory', record ? 'record' : 'win');
          scope.timeout(
            () =>
              finish({
                completed: true,
                medal: cardsMedal(s),
                score: s.moves,
                lowerIsBetter: true,
                title: 'كل الأزواج! 🃏',
                summary: `محاولات: ${num(s.moves)}${timer ? ` · الوقت ${raceTime(t)}` : ''}\n${linesText(script)}`,
              }),
            600,
          );
        }
      }),
    );
    paint();
  });

  return {
    start() {},
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
  };
}
