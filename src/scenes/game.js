import { car, bouquet, icons } from '../art.js';
import { T } from '../content.js';
import { h } from '../dom.js';
import { createGame, step, setLane, LANES, CATCH_Y } from '../game-logic.js';

const GLYPH = { rose: '🌹', sweet: '🍬', choco: '🍫', candy: '🍭' };
const laneCenter = (lane) => `${((lane + 0.5) / LANES) * 100}%`;

export function game(ctx) {
  const el = h(`
    <section class="scene scene-game">
      <div class="memory-top game-top">
        <button type="button" class="btn-back" data-action="back">${icons.back}<span>${T.common.back}</span></button>
        <button type="button" class="btn btn-ghost btn-small" data-action="skip">${T.game.skip}</button>
      </div>
      <h1 class="memory-title" tabindex="-1">${T.game.title}</h1>
      <p class="game-hud" aria-live="polite"><span class="game-count">${T.game.hud(0, 8)}</span></p>
      <div class="game-meter" aria-hidden="true"><span></span></div>
      <div class="track" dir="ltr">
        <div class="track-grass left" aria-hidden="true"></div>
        <div class="track-grass right" aria-hidden="true"></div>
        <div class="track-lines" aria-hidden="true"></div>
        ${T.game.lanes.map((label, i) => `<button type="button" class="lane" data-lane="${i}" style="--i:${i}" aria-label="${label}"></button>`).join('')}
        <div class="track-inner" aria-hidden="true">
          <div class="track-items"></div>
          <div class="track-car" style="left:${laneCenter(1)};top:${CATCH_Y * 100}%">${car()}</div>
        </div>
        <div class="track-overlay">
          <button type="button" class="btn btn-primary btn-big" data-action="start">${T.game.ready}</button>
        </div>
      </div>
      <div class="game-done card" hidden>
        <div class="game-done-art" aria-hidden="true">${bouquet()}</div>
        <h2 class="game-done-title" tabindex="-1">${T.game.done}</h2>
        <p class="game-done-line"></p>
        <button type="button" class="btn btn-primary" data-action="back-done">${T.common.back} 🌷</button>
      </div>
    </section>`);

  const track = el.querySelector('.track');
  const itemsLayer = el.querySelector('.track-items');
  const carEl = el.querySelector('.track-car');
  const countEl = el.querySelector('.game-count');
  const meter = el.querySelector('.game-meter span');
  const overlay = el.querySelector('.track-overlay');
  const startBtn = el.querySelector('[data-action="start"]');
  const doneBox = el.querySelector('.game-done');

  const state = createGame({ goal: 8, speed: ctx.reduced ? 0.2 : 0.3, spawnEvery: ctx.reduced ? 1.3 : 1.0 });
  const nodes = new Map();
  let running = false;
  let started = false;
  let finished = false;
  let raf = 0;
  let last = 0;
  let timeCheck = 0;

  function render() {
    for (const it of state.items) {
      let n = nodes.get(it.id);
      if (!n) {
        n = document.createElement('span');
        n.className = 'track-item';
        n.textContent = GLYPH[it.kind];
        n.style.left = laneCenter(it.lane);
        itemsLayer.append(n);
        nodes.set(it.id, n);
      }
      n.style.top = `${it.y * 100}%`;
    }
    for (const [id, n] of nodes) {
      if (!state.items.some((it) => it.id === id)) {
        n.remove();
        nodes.delete(id);
      }
    }
    carEl.style.left = laneCenter(state.lane);
    countEl.textContent = T.game.hud(Math.min(state.collected, state.goal), state.goal);
    meter.style.width = `${Math.min(1, state.collected / state.goal) * 100}%`;
  }

  function onCollected(list) {
    if (!list.length) return;
    ctx.sound.play('pop');
    const r = carEl.getBoundingClientRect?.();
    if (r) ctx.fx.burst(r.left + r.width / 2, r.top, { count: 6, spread: 50, glyphs: ['✨', '💗'] });
    carEl.classList.remove('bump');
    void carEl.offsetWidth;
    carEl.classList.add('bump');
    if (state.collected === 3) ctx.guide.celebrate(T.game.guidePlaying);
  }

  function frame(t) {
    if (!running) return;
    const dt = last ? (t - last) / 1000 : 0;
    last = t;
    timeCheck += dt;
    if (timeCheck > 1) {
      timeCheck = 0;
      if (!ctx.checkTime()) return; // scene is replaced by the gate screen
    }
    const ev = step(state, dt);
    onCollected(ev.collected);
    render();
    if (state.done) finish(false);
    else raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || finished) return;
    running = true;
    started = true;
    overlay.hidden = true;
    track.classList.add('is-running');
    last = 0;
    ctx.guide.say(T.game.guide, { target: track });
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function finish(skipped) {
    if (finished) return;
    finished = true;
    pause();
    track.classList.remove('is-running');
    track.classList.add('is-done');
    state.items = [];
    itemsLayer.replaceChildren();
    nodes.clear();
    overlay.hidden = true;
    doneBox.hidden = false;
    el.querySelector('.game-done-line').textContent = skipped ? T.game.skipped : T.game.doneLine;
    el.querySelector('[data-action="skip"]').hidden = true;
    ctx.sound.play('win');
    ctx.discover('game-delivery', T.game.found, doneBox, { count: 22, spread: 160 });
    doneBox.scrollIntoView?.({ block: 'center', behavior: ctx.reduced ? 'auto' : 'smooth' });
    ctx.guide.point(doneBox.querySelector('[data-action="back-done"]'));
  }

  function move(lane) {
    if (!running) start();
    onCollected(setLane(state, lane));
    render();
    if (state.done) finish(false);
  }

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lane != null) move(Number(b.dataset.lane));
    else if (b.dataset.action === 'start') start();
    else if (b.dataset.action === 'skip') finish(true);
    else if (b.dataset.action === 'back' || b.dataset.action === 'back-done') ctx.go('garden', { from: 'game' });
  });

  const onKey = (e) => {
    if (finished || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    if (!ctx.checkTime()) return;
    if (e.key === 'ArrowLeft') move(state.lane - 1);
    else if (e.key === 'ArrowRight') move(state.lane + 1);
    else return;
    e.preventDefault();
  };
  const onVis = () => {
    if (document.hidden) pause();
    else if (started && !finished && !running) {
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);

  return {
    el,
    /** exposed for tests */
    state,
    tick(dt) {
      const ev = step(state, dt);
      onCollected(ev.collected);
      render();
      if (state.done) finish(false);
    },
    enter() {
      ctx.guide.say(T.game.guide, { target: startBtn });
      render();
    },
    destroy() {
      pause();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
