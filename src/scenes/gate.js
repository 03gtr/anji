import { gardenBackdrop, rabbit, gate as gateArt } from '../art.js';
import { T } from '../content.js';
import { h } from '../dom.js';
import { formatRemaining } from '../expiry.js';

/**
 * Non-interactive screens shown outside the 24-hour window:
 * 'before' (not open yet), 'expired', or 'invalid' (launch time misconfigured).
 */
export function gateScreen(kind, { remainingMs = 0 } = {}) {
  const copy = kind === 'before'
    ? { title: T.before.title, line: T.before.line(formatRemaining(remainingMs)) }
    : kind === 'expired'
      ? T.expired
      : T.invalid;

  const el = h(`
    <section class="scene scene-gate is-${kind}" data-phase="${kind}">
      <div class="gate-garden" aria-hidden="true">
        ${gardenBackdrop({ dim: kind !== 'before' })}
        <div class="gate-closed">${gateArt()}</div>
        <div class="gate-rabbit">${rabbit({ sleeping: true })}</div>
      </div>
      <div class="gate-copy card">
        <h1 tabindex="-1">${copy.title}</h1>
        <p class="gate-line">${copy.line}</p>
      </div>
    </section>`);

  return {
    el,
    update({ remainingMs: ms }) {
      if (kind === 'before') el.querySelector('.gate-line').textContent = T.before.line(formatRemaining(ms));
    },
  };
}
