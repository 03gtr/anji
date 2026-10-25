import { clinic, car, bouquet, sweetsBox, rabbit, arch, rose, star, crescent, icons } from '../art.js';
import { T } from '../content.js';
import { h, esc } from '../dom.js';

function shell({ cls, title, stage, story = '', actions = '', reveal = '' }) {
  return h(`
    <section class="scene scene-memory ${cls}">
      <div class="memory-top">
        <button type="button" class="btn-back" data-action="back">${icons.back}<span>${T.common.back}</span></button>
      </div>
      <h1 class="memory-title" tabindex="-1">${title}</h1>
      <div class="memory-stage">${stage}</div>
      ${story ? `<p class="memory-story">${story}</p>` : ''}
      <div class="memory-actions">${actions}</div>
      <div class="memory-reveal" hidden>
        ${reveal}
        <div class="memory-footer">
          <button type="button" class="btn btn-ghost" data-action="back">${T.common.back} 🌷</button>
        </div>
      </div>
    </section>`);
}

function wireBack(ctx, el) {
  el.querySelectorAll('[data-action="back"]').forEach((b) =>
    b.addEventListener('click', () => ctx.go('garden', { from: 'memory' })));
}

/** Memory A — the rabbit with suspicious reasons to visit the clinic. */
export function clinicMemory(ctx) {
  const found = ctx.store.has('memory-clinic');
  const el = shell({
    cls: 'memory-clinic',
    title: T.clinic.title,
    stage: `
      <div class="clinic-stage">
        ${clinic({ cls: 'clinic-big' })}
        <div class="clinic-rabbit">${rabbit({ withRose: true })}</div>
        <span class="clinic-sign">قسم الورد 🌹</span>
      </div>`,
    story: T.clinic.story,
    actions: `<button type="button" class="btn btn-primary" data-action="reveal">${T.clinic.reveal}</button>`,
    reveal: `
      <div class="ticket">
        <p class="ticket-title">📋 ${T.clinic.cardTitle}</p>
        <dl>${T.clinic.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <p class="ticket-note">${T.clinic.note}</p>
      </div>`,
  });
  wireBack(ctx, el);
  const btn = el.querySelector('[data-action="reveal"]');
  const revealBox = el.querySelector('.memory-reveal');

  function doReveal(celebrate) {
    revealBox.hidden = false;
    btn.hidden = true;
    revealBox.classList.add('is-in');
    if (celebrate) ctx.discover('memory-clinic', T.clinic.found, revealBox.querySelector('.ticket'));
    ctx.guide.say(T.clinic.guideAfter, { target: el.querySelector('.memory-footer [data-action="back"]') });
  }
  btn.addEventListener('click', () => doReveal(true));

  return {
    el,
    enter() {
      if (found) doReveal(false);
      else ctx.guide.say(T.clinic.guide, { target: btn });
    },
  };
}

/** Memory B — the secret delivery mission (leads into the mini-game). */
export function deliveryMemory(ctx) {
  const played = ctx.store.has('game-delivery');
  const el = shell({
    cls: 'memory-delivery',
    title: T.delivery.title,
    stage: `
      <div class="delivery-stage">
        <div class="delivery-road" aria-hidden="true"></div>
        <div class="delivery-car">${car()}</div>
        <div class="delivery-bouquet">${bouquet()}</div>
        <div class="delivery-sweets">${sweetsBox()}</div>
      </div>`,
    story: T.delivery.story,
    actions: `
      ${played ? `<p class="done-chip">${icons.check}<span>${T.game.done}</span></p>` : ''}
      <button type="button" class="btn btn-primary" data-action="start">${played ? 'العبيها مرة ثانية 🎮' : T.delivery.start}</button>`,
  });
  wireBack(ctx, el);
  const btn = el.querySelector('[data-action="start"]');
  btn.addEventListener('click', () => ctx.go('game'));

  return {
    el,
    enter() {
      ctx.discover('memory-delivery', null);
      ctx.guide.say(T.delivery.guide, { target: btn });
    },
  };
}

/** Memory C — a rose and a little box of sweets beneath a moonlit arch. */
export function nightMemory(ctx) {
  const found = ctx.store.has('memory-night');
  const el = shell({
    cls: 'memory-night',
    title: T.night.title,
    stage: `
      <div class="night-stage">
        <svg class="night-sky" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          ${crescent(258, 46, 20)}
          ${[[30, 30], [70, 70], [120, 20], [180, 50], [300, 110], [20, 120], [210, 16], [150, 96]]
            .map(([x, y], i) => `<circle class="twinkle" style="--d:${i * 0.5}s" cx="${x}" cy="${y}" r="${i % 2 ? 1.1 : 1.7}" fill="#fff6d0"/>`).join('')}
        </svg>
        <button type="button" class="night-arch" data-action="arch" aria-label="${T.night.tap}">
          ${arch()}
          <span class="night-gift" aria-hidden="true">
            <span class="night-rose">${rose()}</span>
            <span class="night-box">${sweetsBox()}</span>
          </span>
        </button>
        <div class="night-ground" aria-hidden="true"></div>
      </div>`,
    actions: `<button type="button" class="btn btn-primary" data-action="tap">${T.night.tap}</button>`,
    reveal: `<p class="memory-quote">${T.night.line}</p>`,
  });
  wireBack(ctx, el);
  const archBtn = el.querySelector('[data-action="arch"]');
  const tapBtn = el.querySelector('[data-action="tap"]');
  const revealBox = el.querySelector('.memory-reveal');

  function doReveal(celebrate) {
    if (el.classList.contains('is-revealed')) return;
    el.classList.add('is-revealed');
    revealBox.hidden = false;
    tapBtn.hidden = true;
    if (celebrate) ctx.discover('memory-night', T.night.found, archBtn, { glyphs: ['✨', '🌙', '⭐'] });
    ctx.guide.say(T.night.guideAfter, { target: el.querySelector('.memory-footer [data-action="back"]') });
  }
  archBtn.addEventListener('click', () => doReveal(true));
  tapBtn.addEventListener('click', () => doReveal(true));

  return {
    el,
    enter() {
      if (found) doReveal(false);
      else ctx.guide.say(T.night.guide, { target: archBtn });
    },
  };
}

/** Memory D — the secret star with a short warm note. */
export function starMemory(ctx) {
  const found = ctx.store.has('memory-star');
  const el = shell({
    cls: 'memory-star',
    title: T.star.title,
    stage: `
      <div class="star-stage">
        <button type="button" class="big-star" data-action="star" aria-label="${T.star.tap}">${star()}</button>
      </div>`,
    actions: `<button type="button" class="btn btn-primary" data-action="tap">${T.star.tap}</button>`,
    reveal: `<div class="star-note"><p class="memory-quote">${T.star.line}</p></div>`,
  });
  wireBack(ctx, el);
  const starBtn = el.querySelector('[data-action="star"]');
  const tapBtn = el.querySelector('[data-action="tap"]');
  const revealBox = el.querySelector('.memory-reveal');

  function doReveal(celebrate) {
    if (el.classList.contains('is-revealed')) return;
    el.classList.add('is-revealed');
    revealBox.hidden = false;
    tapBtn.hidden = true;
    if (celebrate) ctx.discover('memory-star', T.star.found, starBtn, { glyphs: ['✨', '⭐', '💫'] });
    ctx.guide.say(T.star.guideAfter, { target: el.querySelector('.memory-footer [data-action="back"]') });
  }
  starBtn.addEventListener('click', () => doReveal(true));
  tapBtn.addEventListener('click', () => doReveal(true));

  return {
    el,
    enter() {
      if (found) doReveal(false);
      else ctx.guide.say(T.star.guide, { target: starBtn });
    },
  };
}
