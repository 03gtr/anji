/**
 * Logic machine: tap tiles to rotate them until energy reaches every target.
 * Several levels in a row (e.g. power → coolant → lights for the car).
 */
import { PIPE_LEVELS, parseLevel, scramble, rotateAt, flow, isSolved, SHAPES, rotateMask, N, E, S, W } from './pipes-logic.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';

const NAMES = { power: 'الكهرباء ⚡', coolant: 'التبريد ❄️', lights: 'الأضواء 💡', workshop: 'قلب الماكينة ⚙️' };

/** Minimum taps from rot to the solved state (symmetric tiles counted correctly). */
export function minTaps(level, rot) {
  let n = 0;
  level.grid.forEach((row, y) =>
    row.forEach((c, x) => {
      const target = rotateMask(SHAPES[c.shape], c.solved);
      for (let k = 0; k < 4; k++) {
        if (rotateMask(SHAPES[c.shape], rot[y][x] + k) === target) {
          n += k;
          break;
        }
      }
    }),
  );
  return n;
}

function tileSvg(shape, role) {
  const m = SHAPES[shape];
  const seg = (bit, d) => (m & bit ? `<path d="${d}" class="pipe"/>` : '');
  const core = role === 'S' ? '<circle cx="24" cy="24" r="10" class="pipe-src"/>' : role === 'T' ? '<circle cx="24" cy="24" r="9" class="pipe-bulb"/>' : shape === '.' ? '' : '<circle cx="24" cy="24" r="6" class="pipe-joint"/>';
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${seg(N, 'M24 24 V0')}${seg(E, 'M24 24 H48')}${seg(S, 'M24 24 V48')}${seg(W, 'M24 24 H0')}${core}</svg>`;
}

export function mount(area, { app, scope, options, hud, finish }) {
  const ids = options.levels || ['power'];
  let li = 0;
  let level = null;
  let rot = null;
  let moves = 0;
  let optimal = 0;
  let paused = false;
  let busy = false;

  area.append(h(`<div class="pipes"><p class="pipes-title"></p><div class="pipes-grid" role="grid"></div><p class="pipes-hint">المسي أي قطعة حتى تلفها. وصّلي الطاقة من المصدر ⚡ لكل اللمبات 💡.</p></div>`));
  const grid = area.querySelector('.pipes-grid');

  function load(i) {
    level = parseLevel(PIPE_LEVELS[ids[i]]);
    rot = scramble(level, 11 + i * 7);
    optimal += minTaps(level, rot);
    area.querySelector('.pipes-title').textContent = `${num(i + 1)}/${num(ids.length)} · ${NAMES[ids[i]] || ids[i]}`;
    grid.style.setProperty('--w', level.w);
    grid.innerHTML = level.grid
      .map((row, y) =>
        row
          .map((c, x) => {
            const fixed = c.role === 'S' || c.role === 'F' || c.shape === '.' || c.shape === 'X';
            return `<button type="button" class="tile ${c.shape === '.' ? 'is-empty' : ''} ${fixed ? 'is-fixed' : ''}" data-x="${x}" data-y="${y}" ${c.shape === '.' ? 'tabindex="-1" aria-hidden="true"' : `aria-label="قطعة ${x + 1}، ${y + 1}"`}><span class="tile-in">${tileSvg(c.shape, c.role)}</span></button>`;
          })
          .join(''),
      )
      .join('');
    grid.querySelectorAll('.tile:not(.is-empty)').forEach((b) =>
      b.addEventListener('click', () => {
        if (paused || busy) return;
        const x = Number(b.dataset.x);
        const y = Number(b.dataset.y);
        const next = rotateAt(level, rot, x, y);
        if (next === rot) return;
        rot = next;
        moves += 1;
        app.audio.play('tap');
        paint();
        if (isSolved(level, rot)) solved();
      }),
    );
    paint();
  }

  function paint() {
    const lit = flow(level, rot);
    grid.querySelectorAll('.tile').forEach((b) => {
      const x = Number(b.dataset.x);
      const y = Number(b.dataset.y);
      b.querySelector('.tile-in').style.transform = `rotate(${rot[y][x] * 90}deg)`;
      b.classList.toggle('is-lit', lit.has(`${x},${y}`));
    });
    hud(`⚙️ لفّات ${num(moves)}`);
  }

  function solved() {
    busy = true;
    app.audio.play('success');
    grid.classList.add('is-done');
    scope.timeout(() => {
      grid.classList.remove('is-done');
      busy = false;
      li += 1;
      if (li < ids.length) load(li);
      else {
        const ratio = moves / Math.max(1, optimal);
        finish({
          completed: true,
          score: moves,
          lowerIsBetter: true,
          medal: ratio <= 1.4 ? 'gold' : ratio <= 2.2 ? 'silver' : 'bronze',
          title: options.doneTitle || 'الماكينة اشتغلت! ⚡',
          summary: `لفّات: ${num(moves)} (أقل عدد ممكن ${num(optimal)})`,
        });
      }
    }, 900);
  }

  return {
    start() {
      load(0);
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
    get state() {
      return { level, rot, moves };
    },
  };
}

