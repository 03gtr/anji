import { rabbit, crescent, bloom } from '../art.js';
import { T } from '../content.js';
import { h } from '../dom.js';

const bushSvg = (cls) => `<svg class="${cls}" viewBox="0 0 200 90" aria-hidden="true">
  <path d="M6 90C-4 60 22 38 48 48 56 18 96 8 112 34 128 14 172 22 172 52 196 48 204 74 196 90Z" fill="${cls.includes('front') ? '#6f9a6c' : '#5a8460'}"/>
  ${cls.includes('front')
    ? `${bloom(40, 62, 1)}${bloom(150, 58, 1.1, 'deep')}${bloom(100, 70, 0.9)}${bloom(178, 76, 0.8)}`
    : `${bloom(60, 40, 0.9, 'deep')}${bloom(118, 30, 1)}${bloom(160, 46, 0.85)}`}
</svg>`;

export function welcome(ctx) {
  const el = h(`
    <section class="scene scene-welcome">
      <div class="welcome-sky" aria-hidden="true">
        <svg viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice">
          ${crescent(290, 52, 22)}
          ${[[40, 30], [90, 70], [150, 24], [210, 60], [330, 110], [20, 120], [250, 18]]
            .map(([x, y], i) => `<circle class="twinkle" style="--d:${i * 0.6}s" cx="${x}" cy="${y}" r="${i % 2 ? 1.2 : 1.8}" fill="#fff6d0"/>`).join('')}
        </svg>
      </div>
      <div class="welcome-stage" aria-hidden="true">
        ${bushSvg('welcome-bush back')}
        <div class="welcome-rabbit">${rabbit({ withRose: true, cls: 'w-rabbit' })}</div>
        ${bushSvg('welcome-bush front')}
      </div>
      <div class="welcome-copy">
        <h1 class="welcome-hello" tabindex="-1">${T.welcome.hello}</h1>
        <p class="welcome-line">${T.welcome.line}</p>
        <button type="button" class="btn btn-primary btn-big" data-action="take-rose">${T.welcome.take}</button>
      </div>
    </section>`);

  const btn = el.querySelector('[data-action="take-rose"]');
  const rabbitWrap = el.querySelector('.welcome-rabbit');

  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    ctx.store.set({ welcomed: true });
    // if she taps before the rabbit finished hopping out, skip to the end of the hop
    rabbitWrap.getAnimations?.().forEach((a) => a.finish());
    rabbitWrap.classList.add('is-giving');
    ctx.sound.play('chime');
    ctx.fx.burstAt(rabbitWrap.querySelector('.rb-rose') || rabbitWrap, { count: 18, spread: 140 });
    ctx.guide.say(T.welcome.taken, { mood: 'party' });
    ctx.after(ctx.reduced ? 250 : 1100, () => ctx.go('garden', { from: 'welcome' }));
  });

  return {
    el,
    enter() {
      ctx.guide.say(T.welcome.guide, { target: btn });
    },
  };
}
