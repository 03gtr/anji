import { gardenBackdrop, star, clinic, car, arch, gate, rose, peekingRabbit, icons } from '../art.js';
import { T } from '../content.js';
import { h } from '../dom.js';

/** Memory hotspots in the order the guide suggests them. */
export const MEMORIES = [
  { id: 'clinic', found: 'memory-clinic', x: 23, y: 68, art: () => clinic() },
  { id: 'delivery', found: 'memory-delivery', x: 74, y: 77, art: () => car() },
  { id: 'night', found: 'memory-night', x: 78, y: 45, art: () => arch({ night: true, small: true }) },
  { id: 'star', found: 'memory-star', x: 22, y: 13, art: () => star() },
];

const HIDDEN_STARS = [
  { id: 'star-1', x: 56, y: 25 },
  { id: 'star-2', x: 9, y: 40 },
  { id: 'star-3', x: 91, y: 92 },
];

const ROSES = [
  { x: 33, y: 93 },
  { x: 62, y: 89 },
  { x: 12, y: 84 },
];

export function garden(ctx, params = {}) {
  const { store } = ctx;
  const has = (id) => store.has(id);

  const memorySpot = (m) => `
    <button type="button" class="spot spot-memory ${has(m.found) ? 'is-found' : 'is-available'}"
      data-spot="${m.id}" style="--x:${m.x}%;--y:${m.y}%"
      aria-label="${T.garden.labels[m.id]}${has(m.found) ? ' ✓' : ''}">
      <span class="spot-art">${m.art()}</span>
      <span class="spot-label">${T.garden.labels[m.id]}</span>
      <span class="spot-check" aria-hidden="true">${icons.check}</span>
    </button>`;

  const hiddenStar = (s) => `
    <button type="button" class="spot spot-secret ${has(s.id) ? 'is-found' : 'is-hidden'}"
      data-secret="${s.id}" style="--x:${s.x}%;--y:${s.y}%" aria-label="شي صغير يلمع">
      <span class="mini-star" aria-hidden="true"></span>
    </button>`;

  const rosesOpen = has('roses');
  const roseSpot = (r, i) => `
    <button type="button" class="spot spot-rose ${rosesOpen ? 'is-open is-found' : 'is-hidden'}"
      data-rose="${i}" style="--x:${r.x}%;--y:${r.y}%" aria-label="وردة">
      ${rose()}
    </button>`;

  const el = h(`
    <section class="scene scene-garden">
      <h1 class="sr-only" tabindex="-1">${T.garden.heading}</h1>
      <div class="garden">
        ${gardenBackdrop()}
        <div class="fireflies" aria-hidden="true">${'<span></span>'.repeat(7)}</div>
        <div class="petals" aria-hidden="true">${'<span></span>'.repeat(5)}</div>
        ${HIDDEN_STARS.map(hiddenStar).join('')}
        ${ROSES.map(roseSpot).join('')}
        <button type="button" class="spot spot-bunny ${has('bunny') ? 'is-found' : 'is-hidden'}"
          data-secret="bunny" style="--x:88%;--y:59%" aria-label="شي يتحرك ورا الشجيرة">${peekingRabbit()}</button>
        ${MEMORIES.map(memorySpot).join('')}
        <button type="button" class="spot spot-gate is-available" data-spot="gate" style="--x:46%;--y:53%"
          aria-label="${T.garden.labels.gate}">
          <span class="spot-art">${gate()}</span>
          <span class="spot-label">${T.garden.labels.gate}</span>
        </button>
      </div>
      <div class="gate-confirm card" hidden>
        <p>${T.garden.gateEarly}</p>
        <div class="row">
          <button type="button" class="btn btn-primary" data-action="gate-go">${T.garden.gateGo}</button>
          <button type="button" class="btn btn-ghost" data-action="gate-stay">${T.garden.gateStay}</button>
        </div>
      </div>
    </section>`);

  const confirmBox = el.querySelector('.gate-confirm');
  const spot = (id) => el.querySelector(`[data-spot="${id}"]`);
  const visitedCount = () => MEMORIES.filter((m) => has(m.found)).length;
  const nextMemory = () => MEMORIES.find((m) => !has(m.found));

  function suggest(textOverride) {
    const next = nextMemory();
    if (next) ctx.guide.say(textOverride || T.garden.point[next.id], { target: spot(next.id) });
    else ctx.guide.say(textOverride || T.garden.point.gate, { target: spot('gate') });
  }

  const openRoses = new Set();

  el.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target || !el.contains(target)) return;

    if (target.dataset.spot) {
      const id = target.dataset.spot;
      if (id === 'gate') {
        if (visitedCount() < 2 && confirmBox.hidden) {
          confirmBox.hidden = false;
          ctx.guide.say(T.garden.gateEarly, { target: confirmBox.querySelector('[data-action="gate-go"]') });
          return;
        }
        ctx.go('ending');
        return;
      }
      ctx.go(id);
      return;
    }

    if (target.dataset.action === 'gate-go') {
      ctx.go('ending');
      return;
    }
    if (target.dataset.action === 'gate-stay') {
      confirmBox.hidden = true;
      suggest();
      return;
    }

    if (target.dataset.secret) {
      const id = target.dataset.secret;
      if (has(id)) {
        ctx.fx.burstAt(target, { count: 6, spread: 50 });
        return;
      }
      target.classList.remove('is-hidden');
      target.classList.add('is-found');
      let text = T.secrets.bunny;
      if (id.startsWith('star-')) {
        const left = HIDDEN_STARS.filter((s) => !has(s.id) && s.id !== id).length;
        text = T.secrets.star(left);
      }
      ctx.discover(id, text, target, { glyphs: id === 'bunny' ? ['🐇', '💗', '✨'] : ['✨', '⭐'] });
      return;
    }

    if (target.dataset.rose != null) {
      if (target.classList.contains('is-open')) {
        ctx.fx.burstAt(target, { count: 6, spread: 50 });
        return;
      }
      target.classList.add('is-open');
      openRoses.add(target.dataset.rose);
      ctx.sound.play('pop');
      if (openRoses.size === ROSES.length && !has('roses')) {
        el.querySelectorAll('.spot-rose').forEach((r) => r.classList.add('is-found'));
        ctx.discover('roses', T.secrets.roses, target);
      } else {
        ctx.fx.burstAt(target, { count: 8, spread: 60 });
        ctx.guide.celebrate(T.secrets.rose);
      }
    }
  });

  return {
    el,
    enter() {
      if (params.from === 'welcome' || store.get().found.length === 0) suggest(T.garden.intro);
      else suggest();
    },
  };
}
