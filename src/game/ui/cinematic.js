/**
 * Cinematic player: full-screen shots with fades, slow camera drift (off with
 * reduced motion), captions and optional dialogue. Tap or Enter advances,
 * "تخطي" skips the rest — a cinematic never traps the player.
 */
import { CINEMATICS } from '../data/cinematics.js';
import { painted } from '../art/painted.js';
import { anjiSprite } from '../characters/anji.js';
import { CAST } from '../characters/cast.js';
import { SP1_SCENES } from '../art/sp1-scenes.js';
import { h, tx, ICONS } from './dom.js';

const ROSE = (x, y, r, c = '#3f6fe0') => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}"/><path d="M${-r * 0.5} 0 C${-r * 0.5} ${-r * 0.7} ${r * 0.5} ${-r * 0.7} ${r * 0.5} 0" stroke="#9fc0ff" stroke-width="${r * 0.18}" fill="none"/></g>`;

let shotId = 0;

function sceneSvg(name, game) {
  if (SP1_SCENES[name]) return SP1_SCENES[name](game, `sp1c${++shotId}`);
  const cos = game.state.cosmetics;
  switch (name) {
    case 'awaken': {
      const roses = Array.from({ length: 26 }, (_, i) => ROSE(20 + ((i * 37) % 340), 190 + ((i * 53) % 70), 7 + (i % 4), i % 5 ? '#3f6fe0' : '#e85d8c')).join('');
      return `<svg viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="cs1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1038"/><stop offset="1" stop-color="#4b3f8e"/></linearGradient></defs>
        <rect width="360" height="260" fill="url(#cs1)"/>
        <circle cx="290" cy="50" r="16" fill="#fff4d6"/><circle cx="296" cy="46" r="14" fill="#2a2a6e"/>
        <rect y="170" width="360" height="90" fill="#1f3f40"/>
        <g transform="translate(70 214) rotate(-90) scale(.55)">${anjiSprite({ pose: 'idle', blink: true, outfit: cos.anjiOutfit, bow: cos.anjiBow }).replace(/<\/?svg[^>]*>/g, '')}</g>
        ${roses}
      </svg>`;
    }
    case 'gate':
      return `<svg viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice">
        <rect width="360" height="260" fill="#141a48"/>
        <path d="M110 260 V110 A70 70 0 0 1 250 110 V260" fill="none" stroke="#2d2f45" stroke-width="10"/>
        ${[130, 150, 170, 190, 210, 230].map((x) => `<path d="M${x} 260 V${x < 180 ? 120 + (180 - x) / 3 : 120 + (x - 180) / 3}" stroke="#2d2f45" stroke-width="5"/>`).join('')}
        <circle cx="180" cy="160" r="14" fill="#26273a"/><text x="180" y="166" text-anchor="middle" fill="#7aa2ff" font-size="16" font-family="serif">R</text>
        ${ROSE(100, 100, 12)}${ROSE(260, 100, 12)}${ROSE(180, 46, 14)}
      </svg>`;
    case 'phone':
      return `<div class="cine-phone">${CAST.phone.portrait({})}</div>`;
    case 'roses': {
      const roses = Array.from({ length: 40 }, (_, i) => ROSE(10 + ((i * 29) % 350), 60 + ((i * 47) % 190), 6 + (i % 5))).join('');
      return `<svg viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice" class="cine-glow"><rect width="360" height="260" fill="#0b0e30"/>${roses}</svg>`;
    }
    default:
      return '';
  }
}

export function playCinematic(app, id) {
  const shots = CINEMATICS[id];
  if (!shots) return Promise.resolve();
  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `<div class="cine">
          <div class="cine-stage"></div>
          <p class="cine-caption" aria-live="polite"></p>
          <button type="button" class="cine-skip">${ICONS.skip}<span>تخطي</span></button>
          <span class="cine-tap" aria-hidden="true">المسي للمتابعة</span>
        </div>`;
      const cine = el.querySelector('.cine');
      const stage = el.querySelector('.cine-stage');
      const caption = el.querySelector('.cine-caption');
      let i = -1;
      let busy = false;
      let timer = 0;
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        app.game.markSeen(`cine:${id}`);
        close();
      };

      async function next() {
        if (busy || done) return;
        clearTimeout(timer);
        i += 1;
        if (i >= shots.length) return finish();
        const shot = shots[i];
        const art = painted(shot.art);
        const frame = h(`<div class="cine-shot ${app.reduced() || shot.scene?.startsWith('roads-') || shot.quick ? '' : 'drift'}"></div>`);
        // silent shots (the embrace): no "tap to continue" prompt; tap and «تخطي» still work
        cine.classList.toggle('is-silent', Boolean(shot.silent));
        if (art) frame.append(h(`<img class="cine-art" src="${art}" alt="" draggable="false">`));
        else frame.innerHTML = sceneSvg(shot.scene, app.game);
        stage.replaceChildren(frame);
        caption.textContent = tx(shot.caption || '');
        if (shot.sfx) app.audio.play(shot.sfx);
        if (shot.say) {
          busy = true;
          await scope.wait(500);
          if (done) return;
          await app.ui.dialogue(shot.say);
          busy = false;
          next();
          return;
        }
        const ms = shot.ms ?? 3000;
        timer = setTimeout(next, app.reduced() && !shot.quick ? Math.max(1800, ms) : ms);
      }
      scope.add(() => clearTimeout(timer));
      scope.on(el.querySelector('.cine'), 'click', (e) => {
        if (e.target.closest('.cine-skip')) return;
        next();
      });
      scope.on(el.querySelector('.cine-skip'), 'click', finish);
      scope.on(document, 'keydown', (e) => {
        if (busy) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          next();
        } else if (e.key === 'Escape') finish();
      });
      next();
    },
    { className: 'overlay-cine', label: 'مشهد' },
  );
}

