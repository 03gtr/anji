/**
 * The rabbit guide: a docked avatar + speech bubble that points at the
 * control it is talking about. It never captures clicks outside its own
 * dock: the highlight ring and the paw pointer are pointer-events: none.
 */
import { rabbit, icons } from './art.js';
import { T } from './content.js';

const CELEBRATE_MS = 4200;

export function createGuide({ mount, store, reduced, onLayout = () => {} }) {
  const dock = document.createElement('aside');
  dock.className = 'guide';
  dock.setAttribute('aria-label', T.guideUi.region);
  dock.innerHTML = `
    <button type="button" class="guide-avatar" data-guide="avatar" aria-label="${T.guideUi.restore}">
      ${rabbit({ cls: 'guide-rabbit' })}
      <span class="guide-dot" aria-hidden="true"></span>
    </button>
    <div class="guide-bubble">
      <p class="guide-text" role="status" aria-live="polite"></p>
      <div class="guide-tools">
        <button type="button" class="icon-btn" data-guide="replay" aria-label="${T.guideUi.replay}" title="${T.guideUi.replay}">${icons.replay}</button>
        <button type="button" class="icon-btn" data-guide="min" aria-label="${T.guideUi.minimize}" title="${T.guideUi.minimize}">${icons.minimize}</button>
      </div>
    </div>`;

  const pointer = document.createElement('div');
  pointer.className = 'guide-pointer';
  pointer.setAttribute('aria-hidden', 'true');
  pointer.innerHTML = '<span class="gp"><svg viewBox="0 0 40 48"><path d="M20 46L6 26h9V4h10v22h9z" fill="#f06f9a" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg></span>';

  mount.append(dock, pointer);

  const textEl = dock.querySelector('.guide-text');
  const avatar = dock.querySelector('.guide-avatar');

  let current = { text: '', target: null };
  let shownTarget = null;
  let celebrateTimer = 0;
  let raf = 0;
  let minimized = store.get().guideMin;

  applyMinimized();

  dock.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-guide]');
    if (!btn) return;
    const act = btn.dataset.guide;
    if (act === 'min') setMinimized(true);
    else if (act === 'replay') replay();
    else if (act === 'avatar') {
      if (minimized) setMinimized(false);
      else replay();
    }
  });

  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => onLayout(dock.offsetHeight))
    : null;
  ro?.observe(dock);

  function setMinimized(v) {
    minimized = v;
    store.set({ guideMin: v });
    applyMinimized();
    if (!v) replay();
  }

  function applyMinimized() {
    dock.classList.toggle('is-min', minimized);
    avatar.setAttribute('aria-label', minimized ? T.guideUi.restore : T.guideUi.replay);
    avatar.setAttribute('aria-expanded', String(!minimized));
    onLayout(dock.offsetHeight);
    track();
  }

  function show(text, target, mood) {
    textEl.textContent = text;
    dock.dataset.mood = mood || 'talk';
    dock.classList.remove('is-speaking');
    void dock.offsetWidth; // restart the bubble animation
    dock.classList.add('is-speaking');
    if (minimized) dock.classList.add('has-news');
    setTarget(target);
  }

  function setTarget(target) {
    if (shownTarget && shownTarget !== target) shownTarget.classList.remove('is-guided');
    shownTarget = target && target.isConnected ? target : null;
    if (shownTarget) {
      shownTarget.classList.add('is-guided');
      revealTarget(shownTarget);
    }
    track();
  }

  /** Scroll the target into the visible band (above the dock) once, if needed. */
  function revealTarget(el) {
    if (typeof el.getBoundingClientRect !== 'function') return;
    const r = el.getBoundingClientRect();
    const bottomLimit = window.innerHeight - dock.offsetHeight - 12;
    if (r.top < 60 || r.bottom > bottomLimit) {
      el.scrollIntoView?.({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  function track() {
    cancelAnimationFrame(raf);
    if (!shownTarget || minimized) {
      pointer.classList.remove('is-on');
      return;
    }
    const loop = () => {
      if (!shownTarget || !shownTarget.isConnected) {
        pointer.classList.remove('is-on');
        return;
      }
      const r = shownTarget.getBoundingClientRect();
      const visibleBottom = window.innerHeight - dock.offsetHeight;
      const onScreen = r.width > 0 && r.bottom > 0 && r.top < visibleBottom;
      pointer.classList.toggle('is-on', onScreen);
      if (onScreen) {
        const [dir, x, y] = placePointer(r);
        pointer.dataset.dir = dir;
        pointer.className = `guide-pointer is-on is-${dir}`;
        pointer.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * Beside the target when there is room (so it never hides text above or
   * below a button), otherwise above it, or below it near the top edge.
   * @returns {['left'|'right'|'above'|'below', number, number]} top-left of the 36×44 box
   */
  function placePointer(r) {
    const W = 36;
    const H = 44;
    const cy = r.top + r.height / 2 - H / 2;
    const cx = r.left + r.width / 2 - W / 2;
    if (r.left >= 48) return ['left', r.left - W - 8, cy];
    if (window.innerWidth - r.right >= 48) return ['right', r.right + 8, cy];
    if (r.top >= 64) return ['above', cx, r.top - H - 6];
    return ['below', cx, r.bottom + 6];
  }

  function replay() {
    clearTimeout(celebrateTimer);
    dock.classList.remove('has-news');
    show(current.text, current.target, current.mood);
    avatar.querySelector('.guide-rabbit')?.classList.remove('hop');
    void avatar.offsetWidth;
    avatar.querySelector('.guide-rabbit')?.classList.add('hop');
  }

  return {
    el: dock,
    /** Set the current scene instruction (replayable). */
    say(text, { target = null, mood = 'talk' } = {}) {
      clearTimeout(celebrateTimer);
      current = { text, target, mood };
      show(text, target, mood);
    },
    /** A short celebration that doesn't replace the scene instruction. */
    celebrate(text) {
      clearTimeout(celebrateTimer);
      show(text, current.target, 'party');
      celebrateTimer = setTimeout(() => show(current.text, current.target, current.mood), CELEBRATE_MS);
    },
    /** Change what the pointer highlights without changing the words. */
    point(target) {
      current.target = target;
      setTarget(target);
    },
    replay,
    isMinimized: () => minimized,
    setVisible(v) {
      dock.hidden = !v;
      if (!v) {
        setTarget(null);
        onLayout(0);
      } else onLayout(dock.offsetHeight);
    },
    destroy() {
      clearTimeout(celebrateTimer);
      cancelAnimationFrame(raf);
      ro?.disconnect();
      setTarget(null);
      dock.remove();
      pointer.remove();
    },
  };
}
