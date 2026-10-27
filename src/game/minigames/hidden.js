/**
 * Hidden-object search: tap the listed objects in an illustrated scene.
 * Wrong taps are only counted (for the medal), hints make one object pulse.
 */
import { HIDDEN_SCENES } from './hidden-scenes.js';
import { createHunt, tapAt, useHint, huntMedal } from './hidden-logic.js';
import { symbol } from '../ui/symbols.js';
import { snookiPortrait } from '../characters/snooki.js';
import { h, esc, ICONS } from '../ui/dom.js';
import { num } from '../ui/format.js';

export function mount(area, { app, scope, options, hud, finish }) {
  const scene = HIDDEN_SCENES[options.scene || 'study'];
  const s = createHunt(scene.objects);
  let paused = false;

  area.append(
    h(`<div class="hunt">
      <p class="maze-snooki hunt-snooki" aria-live="polite"><span class="maze-snooki-face">${snookiPortrait({ expr: 'sniff', hat: app.game.state.cosmetics.snookiHat })}</span><span class="hunt-say">${esc(scene.intro)}</span></p>
      <div class="hunt-view">
        <svg class="hunt-svg" viewBox="0 0 300 420" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(scene.title)}">
          ${scene.background}${scene.decoys || ''}
          ${scene.objects.map((o) => `<g class="hunt-obj" data-id="${o.id}" transform="translate(${o.x} ${o.y})">${o.svg}</g>`).join('')}
          <circle class="hunt-ring" r="22" cx="-100" cy="-100"/>
        </svg>
      </div>
      <div class="hunt-list" role="list">
        ${scene.objects.map((o) => `<span class="hunt-chip" role="listitem" data-chip="${o.id}">${symbol(o.icon)}<b>${esc(o.label)}</b></span>`).join('')}
      </div>
      <button type="button" class="btn btn-ghost hunt-hint">${ICONS.hint}<span>تلميح</span></button>
    </div>`),
  );
  const svg = area.querySelector('.hunt-svg');
  const say = (t) => {
    area.querySelector('.hunt-say').textContent = t;
  };
  const ring = area.querySelector('.hunt-ring');

  const update = () => hud(`🔎 ${num(s.found.length)}/${num(s.total)} · تلميحات ${num(s.hints)}`);

  function toScene(e) {
    const pt = svg.createSVGPoint?.();
    const m = svg.getScreenCTM?.();
    if (pt && m) {
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    }
    const r = svg.getBoundingClientRect();
    const k = Math.min(r.width / 300, r.height / 420);
    return { x: (e.clientX - r.left - (r.width - 300 * k) / 2) / k, y: (e.clientY - r.top - (r.height - 420 * k) / 2) / k };
  }

  scope.on(svg, 'pointerup', (e) => {
    if (paused || s.done) return;
    const { x, y } = toScene(e);
    const res = tapAt(scene.objects, s, x, y);
    if (!res.hit) {
      app.audio.play('tap');
      return;
    }
    const o = scene.objects.find((ob) => ob.id === res.hit);
    svg.querySelector(`[data-id="${o.id}"]`).classList.add('is-found');
    area.querySelector(`[data-chip="${o.id}"]`).classList.add('is-found');
    ring.setAttribute('cx', '-100');
    app.audio.play('sparkle');
    if (o.line) say(o.line);
    update();
    if (res.done) {
      scope.timeout(
        () =>
          finish({
            completed: true,
            medal: huntMedal(s),
            score: s.misses + s.hints * 3,
            lowerIsBetter: true,
            title: 'لگيتي كل شي! 🔎',
            summary: `لمسات بالغلط: ${num(s.misses)} · تلميحات: ${num(s.hints)}`,
          }),
        900,
      );
    }
  });

  scope.on(area.querySelector('.hunt-hint'), 'click', () => {
    const id = useHint(scene.objects, s);
    if (!id) return;
    const o = scene.objects.find((ob) => ob.id === id);
    ring.setAttribute('cx', String(o.x + o.w / 2));
    ring.setAttribute('cy', String(o.y + o.h / 2));
    say(`سنوكي يشم ريحة ${o.label}… هناك.`);
    app.audio.play('page');
    update();
  });

  return {
    start() {
      update();
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
    state: s,
  };
}
