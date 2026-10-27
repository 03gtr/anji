/**
 * Hedge maze: top-down, lantern-lit (only nearby hedges are visible; visited
 * paths stay dimly remembered). Swipe to run along a corridor until the next
 * junction, tap/hold the D-pad for single steps, or use the arrow keys.
 * Having Ryan's map fragment lets her peek at the whole maze twice.
 */
import { parseMaze, createMazeState, moveIn, shortestPath, mazeMedal, MAZES, DIRS, isWall } from './maze-logic.js';
import { anjiPortrait } from '../characters/anji.js';
import { snookiPortrait } from '../characters/snooki.js';
import { h, ICONS } from '../ui/dom.js';
import { num } from '../ui/format.js';

const LINES = {
  start: 'المتاهة! دخلتها مية مرة. طلعت منها… مرات.',
  T: 'من هنا! أنا متأكد ١٠٠٪. يمكن ٧٠٪.',
  R: 'ورقة من ريان: «إذا وصلتي هنا، فسنوكي أكيد گال: أنا متأكد.» — R',
  petal: 'بتلة زرقة! ريان كان يزرعها بكل مكان.',
  bump: 'هذا سياج. أعرفه. التقينا قبل.',
};

export function mount(area, { app, scope, options, hud, finish }) {
  const maze = parseMaze(MAZES[options.layout || 'hedge']);
  const best = shortestPath(maze);
  const state = createMazeState(maze);
  const fog = options.fog ?? 3.2;
  const cos = app.game.state.cosmetics;
  let peeks = app.game.hasItem('map-1') ? 2 : 0;
  let peeking = false;
  let running = false;
  let paused = false;

  area.append(
    h(`<div class="maze">
      <p class="maze-snooki" aria-live="polite"><span class="maze-snooki-face">${snookiPortrait({ expr: 'smug', hat: cos.snookiHat })}</span><span class="maze-snooki-text"></span></p>
      <div class="maze-board" style="--w:${maze.w};--h:${maze.h}" role="img" aria-label="المتاهة"></div>
      <div class="maze-tools">
        <div class="dpad" role="group" aria-label="الاتجاهات">
          <button type="button" class="dpad-btn up" data-dir="up" aria-label="فوق">${ICONS.up}</button>
          <button type="button" class="dpad-btn left" data-dir="left" aria-label="يسار">${ICONS.left}</button>
          <button type="button" class="dpad-btn right" data-dir="right" aria-label="يمين">${ICONS.right}</button>
          <button type="button" class="dpad-btn down" data-dir="down" aria-label="جوه">${ICONS.down}</button>
        </div>
        <button type="button" class="btn btn-ghost maze-peek" ${peeks ? '' : 'hidden'}>🗺️ <span></span></button>
      </div>
    </div>`),
  );
  const board = area.querySelector('.maze-board');
  const sayEl = area.querySelector('.maze-snooki-text');
  const peekBtn = area.querySelector('.maze-peek');

  const cells = [];
  for (let y = 0; y < maze.h; y++) {
    for (let x = 0; x < maze.w; x++) {
      const c = maze.rows[y][x];
      const el = document.createElement('div');
      el.className = `mz ${c === '#' ? 'mz-wall' : 'mz-path'}${c === 'E' ? ' mz-exit' : ''}${c === '*' ? ' mz-petal' : ''}${c === 'R' ? ' mz-note' : ''}`;
      board.append(el);
      cells.push(el);
    }
  }
  const token = h(`<div class="mz-token mz-anji">${anjiPortrait({ expr: 'determined', outfit: cos.anjiOutfit, bow: cos.anjiBow })}</div>`);
  const dog = h(`<div class="mz-token mz-dog">${snookiPortrait({ expr: 'happy', hat: cos.snookiHat })}</div>`);
  board.append(dog, token);

  const say = (text) => {
    sayEl.textContent = text;
  };

  function paint() {
    const { x: px, y: py } = state.pos;
    for (let y = 0; y < maze.h; y++) {
      for (let x = 0; x < maze.w; x++) {
        const el = cells[y * maze.w + x];
        const d = Math.hypot(x - px, y - py);
        const lit = peeking || d <= fog;
        el.classList.toggle('is-dark', !lit && !state.seen.has(`${x},${y}`));
        el.classList.toggle('is-dim', !lit && state.seen.has(`${x},${y}`));
        if (maze.rows[y][x] === '*') el.classList.toggle('is-taken', state.petals.includes(`${x},${y}`));
      }
    }
    token.style.setProperty('--x', px);
    token.style.setProperty('--y', py);
    const back = state.trail.length > 1 ? state.trail[state.trail.length - 2] : state.pos;
    dog.style.setProperty('--x', back.x);
    dog.style.setProperty('--y', back.y);
    hud(`🌸 ${num(state.petals.length)}/${num(maze.petals.length)} · خطوات ${num(state.moves)}`);
    peekBtn.querySelector('span').textContent = `نظرة على الخريطة (${num(peeks)})`;
    peekBtn.disabled = peeks <= 0;
  }

  function onEvent(ev) {
    if (ev === 'petal') {
      app.audio.play('pickup');
      say(LINES.petal);
    } else if (ev === 'T') say(LINES.T);
    else if (ev === 'R') {
      app.audio.play('page');
      say(LINES.R);
    } else if (ev === 'exit') {
      app.audio.play('success');
      state.petals.forEach((_, i) => app.game.collect(`petal.${options.layout || 'hedge'}.${i + 1}`));
      finish({
        completed: true,
        score: state.moves,
        lowerIsBetter: true,
        medal: mazeMedal(state.moves, best),
        title: 'طلعتي من المتاهة! 🌿',
        summary: `بتلات: ${num(state.petals.length)}/${num(maze.petals.length)} · خطوات: ${num(state.moves)} (أقصر طريق ${num(best)})`,
      });
    }
  }

  function step(dir) {
    if (paused || state.done) return false;
    const res = moveIn(maze, state, dir);
    if (!res.moved) {
      app.audio.play('hit');
      board.classList.remove('bump');
      void board.offsetWidth;
      board.classList.add('bump');
      if (Math.random() < 0.25) say(LINES.bump);
      return false;
    }
    app.audio.play('step');
    if (res.event) onEvent(res.event);
    paint();
    return !res.event;
  }

  const openNeighbours = (x, y) => Object.values(DIRS).filter(([dx, dy]) => !isWall(maze, x + dx, y + dy)).length;

  /** Swipe: keep walking until a junction, a wall or something interesting. */
  async function runTo(dir) {
    if (running) return;
    running = true;
    let steps = 0;
    while (!scope.disposed && steps < 40 && step(dir)) {
      steps += 1;
      const { x, y } = state.pos;
      const [dx, dy] = DIRS[dir];
      if (isWall(maze, x + dx, y + dy) || openNeighbours(x, y) > 2) break;
      await scope.wait(app.reduced() ? 20 : 70);
    }
    running = false;
  }

  // D-pad: tap = one step, hold = repeat
  area.querySelectorAll('[data-dir]').forEach((b) => {
    let timer = 0;
    const stop = () => clearInterval(timer);
    scope.on(b, 'pointerdown', (e) => {
      e.preventDefault();
      step(b.dataset.dir);
      stop();
      timer = setInterval(() => step(b.dataset.dir), 170);
    });
    scope.on(b, 'pointerup', stop);
    scope.on(b, 'pointercancel', stop);
    scope.on(b, 'pointerleave', stop);
    scope.on(b, 'click', (e) => {
      if (e.detail === 0) step(b.dataset.dir); // keyboard activation
    });
    scope.add(stop);
  });

  // swipe on the board
  let startPt = null;
  scope.on(board, 'pointerdown', (e) => {
    startPt = { x: e.clientX, y: e.clientY };
  });
  scope.on(board, 'pointerup', (e) => {
    if (!startPt) return;
    const dx = e.clientX - startPt.x;
    const dy = e.clientY - startPt.y;
    startPt = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    runTo(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  });

  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };
  scope.on(document, 'keydown', (e) => {
    const dir = KEYS[e.code];
    if (!dir || paused) return;
    e.preventDefault();
    step(dir);
  });

  scope.on(peekBtn, 'click', () => {
    if (peeks <= 0 || peeking) return;
    peeks -= 1;
    peeking = true;
    paint();
    app.audio.play('sparkle');
    scope.timeout(() => {
      peeking = false;
      paint();
    }, 2600);
  });

  return {
    start() {
      say(LINES.start);
      paint();
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
    /** test hook */
    state,
  };
}
