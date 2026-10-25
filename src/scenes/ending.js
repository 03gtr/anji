import { arch, rabbit, starPath } from '../art.js';
import { T } from '../content.js';
import { h } from '../dom.js';

export function ending(ctx) {
  const glow = [[12, 18], [86, 12], [70, 30], [24, 40], [92, 46], [50, 6], [6, 58]]
    .map(([x, y], i) => `<svg class="glow-star" style="--x:${x}%;--y:${y}%;--d:${i * 0.45}s" viewBox="0 0 20 20" aria-hidden="true"><path d="${starPath(10, 10, 9)}" fill="#ffe7a3"/></svg>`)
    .join('');

  const el = h(`
    <section class="scene scene-ending">
      <div class="ending-stage" aria-hidden="true">
        ${glow}
        <div class="ending-arch">${arch({ night: true })}</div>
        <div class="ending-rabbit">${rabbit({ withRose: true })}</div>
      </div>
      <div class="ending-copy">
        <h1 class="ending-title" tabindex="-1">${T.ending.lines[0]}</h1>
        <p>${T.ending.lines[1]}</p>
        <p>${T.ending.lines[2]}</p>
      </div>
      <div class="ending-actions">
        <button type="button" class="btn btn-ghost" data-action="garden">${T.ending.garden}</button>
        <button type="button" class="btn btn-primary" data-action="replay">${T.ending.replay}</button>
      </div>
    </section>`);

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'replay') {
      ctx.store.reset();
      ctx.go('welcome');
    } else if (b.dataset.action === 'garden') {
      ctx.go('garden', { from: 'ending' });
    }
  });

  return {
    el,
    enter() {
      ctx.sound.play('win');
      ctx.after(ctx.reduced ? 0 : 700, () => ctx.fx.burstAt(el.querySelector('.ending-rabbit'), { count: 20, spread: 150 }));
      // no pointer here: the ending should be read from the top, not scrolled to a button
      ctx.guide.say(T.ending.guide, { mood: 'party' });
    },
  };
}
