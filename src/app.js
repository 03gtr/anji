/**
 * App controller: owns the time gate, the scene router, the header and the
 * guide. Scenes are plain functions returning { el, enter?, destroy? }.
 *
 *            ┌── before ──(launch reached)──┐
 *   load ───►│                              ▼
 *            ├── active : welcome → garden ⇄ memories / game → ending
 *            │                              │ (any moment)
 *            └── expired ◄───────(launch + 24h passed)
 *
 * Time is re-checked on load, on focus / visibility, on a slow interval and
 * before every interaction (capture-phase listener), always by comparing
 * explicit timestamps.
 */
import { LAUNCH_AT } from './config.js';
import { getWindow, getPhase } from './expiry.js';
import { createStore } from './store.js';
import { createGuide } from './guide.js';
import { createFx } from './fx.js';
import { createSound } from './sound.js';
import { T } from './content.js';
import { icons } from './art.js';
import { h } from './dom.js';
import { welcome } from './scenes/welcome.js';
import { garden } from './scenes/garden.js';
import { clinicMemory, deliveryMemory, nightMemory, starMemory } from './scenes/memories.js';
import { game } from './scenes/game.js';
import { ending } from './scenes/ending.js';
import { gateScreen } from './scenes/gate.js';

/** Everything that counts towards the progress indicator. */
export const DISCOVERIES = [
  'memory-clinic', 'memory-delivery', 'game-delivery', 'memory-night', 'memory-star',
  'star-1', 'star-2', 'star-3', 'roses', 'bunny',
];

const SCENES = {
  welcome,
  garden,
  clinic: clinicMemory,
  delivery: deliveryMemory,
  night: nightMemory,
  star: starMemory,
  game,
  ending,
};

const prefersReducedMotion = () => {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
};

/**
 * @param {HTMLElement} root
 * @param {{ now?: () => number, launchAt?: string|number, storage?: Storage, reducedMotion?: boolean, checkEveryMs?: number }} [opts]
 */
export function createApp(root, opts = {}) {
  const now = opts.now ?? (() => Date.now());
  const reduced = opts.reducedMotion ?? prefersReducedMotion();
  const store = createStore({ storage: opts.storage });

  let win = null;
  try {
    win = getWindow(opts.launchAt ?? LAUNCH_AT);
  } catch (err) {
    console.error('[secret-garden] Launch time is misconfigured:', err.message);
  }

  root.innerHTML = '';
  const shell = h(`
    <div class="app ${reduced ? 'reduce-motion' : ''}">
      <header class="topbar" hidden>
        <p class="topbar-title">${T.appTitle} <span aria-hidden="true">🌹</span></p>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${DISCOVERIES.length}" aria-valuenow="0">
          <span class="progress-text"></span>
          <span class="progress-bar" aria-hidden="true"><span></span></span>
        </div>
        <button type="button" class="icon-btn sound-btn" data-action="sound"></button>
      </header>
      <main class="stage" id="main"></main>
      <div class="fx-layer" aria-hidden="true"></div>
    </div>`);
  root.append(shell);

  const topbar = shell.querySelector('.topbar');
  const main = shell.querySelector('main');
  const soundBtn = shell.querySelector('.sound-btn');
  const progressEl = shell.querySelector('.progress');
  const setVar = (name, px) => shell.style.setProperty(name, `${Math.round(px)}px`);

  const sound = createSound(store);
  const fx = createFx(shell.querySelector('.fx-layer'), { reduced });
  const guide = createGuide({ mount: shell, store, reduced, onLayout: (px) => setVar('--dock-h', px) });

  let scene = null;
  let sceneName = null;
  let gateKind = null;
  let timers = [];

  /* ── header ─────────────────────────────────────────── */
  function renderProgress() {
    const n = DISCOVERIES.filter((id) => store.has(id)).length;
    progressEl.setAttribute('aria-valuenow', String(n));
    progressEl.querySelector('.progress-text').textContent = T.common.progress(n, DISCOVERIES.length);
    progressEl.querySelector('.progress-bar span').style.width = `${(n / DISCOVERIES.length) * 100}%`;
  }
  function renderSound() {
    const on = sound.enabled();
    soundBtn.innerHTML = on ? icons.soundOn : icons.soundOff;
    soundBtn.setAttribute('aria-label', on ? T.common.soundOff : T.common.soundOn);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.title = on ? T.common.soundOff : T.common.soundOn;
  }
  soundBtn.addEventListener('click', () => {
    sound.toggle();
    renderSound();
  });
  store.subscribe(renderProgress);
  renderProgress();
  renderSound();

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => setVar('--top-h', topbar.hidden ? 0 : topbar.offsetHeight)) : null;
  ro?.observe(topbar);

  /* ── scene context ──────────────────────────────────── */
  const ctx = {
    store,
    guide,
    sound,
    fx,
    reduced,
    go,
    checkTime,
    after(ms, fn) {
      const id = setTimeout(() => {
        timers = timers.filter((t) => t !== id);
        fn();
      }, ms);
      timers.push(id);
    },
    /** Record a discovery; celebrate it only the first time. */
    discover(id, text, el, burstOpts) {
      const isNew = store.discover(id);
      if (!isNew || !text) return isNew;
      sound.play('chime');
      if (el) fx.burstAt(el, burstOpts || { count: 12, spread: 90 });
      guide.celebrate(text);
      return isNew;
    },
  };

  function clearScene() {
    timers.forEach(clearTimeout);
    timers = [];
    scene?.destroy?.();
    scene = null;
    main.innerHTML = '';
  }

  function go(name, params = {}) {
    if (gateKind) return; // locked outside the window: no navigation
    const make = SCENES[name];
    if (!make) return;
    clearScene();
    sceneName = name;
    scene = make(ctx, params);
    scene.el.classList.add('scene-enter');
    main.append(scene.el);
    topbar.hidden = name === 'welcome';
    setVar('--top-h', topbar.hidden ? 0 : topbar.offsetHeight);
    shell.dataset.scene = name;
    window.scrollTo?.(0, 0);
    scene.el.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
    scene.enter?.();
  }

  /* ── time gate ──────────────────────────────────────── */
  function currentPhase() {
    return win ? getPhase(now(), win) : 'invalid';
  }

  function showGate(kind) {
    if (gateKind === kind) {
      scene?.update?.({ remainingMs: win ? win.start - now() : 0 });
      return;
    }
    clearScene();
    gateKind = kind;
    sceneName = null;
    topbar.hidden = true;
    setVar('--top-h', 0);
    guide.setVisible(false);
    shell.dataset.scene = `gate-${kind}`;
    scene = gateScreen(kind, { remainingMs: win ? win.start - now() : 0 });
    main.append(scene.el);
    scene.el.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
  }

  /** @returns {boolean} true when interaction may proceed */
  function checkTime() {
    const phase = currentPhase();
    if (phase === 'active') {
      if (gateKind === 'before') {
        // the garden just opened while the page was waiting
        gateKind = null;
        guide.setVisible(true);
        startJourney();
      }
      return gateKind === null;
    }
    showGate(phase);
    return false;
  }

  function startJourney() {
    go(store.get().welcomed ? 'garden' : 'welcome');
  }

  // Before *any* interaction: re-check the clock first.
  const guard = (e) => {
    if (e.type === 'keydown' && !['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    if (!checkTime()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  const onFocus = () => checkTime();
  const onVisible = () => {
    if (!document.hidden) checkTime();
  };
  root.addEventListener('pointerdown', guard, true);
  root.addEventListener('click', guard, true);
  root.addEventListener('keydown', guard, true);
  window.addEventListener('focus', onFocus);
  window.addEventListener('pageshow', onFocus);
  document.addEventListener('visibilitychange', onVisible);
  const interval = setInterval(checkTime, opts.checkEveryMs ?? 15000);

  // Initial render
  if (checkTime()) startJourney();

  return {
    go,
    checkTime,
    store,
    guide,
    get scene() {
      return scene;
    },
    get sceneName() {
      return gateKind ? `gate-${gateKind}` : sceneName;
    },
    destroy() {
      clearInterval(interval);
      clearScene();
      guide.destroy();
      ro?.disconnect();
      root.removeEventListener('pointerdown', guard, true);
      root.removeEventListener('click', guard, true);
      root.removeEventListener('keydown', guard, true);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      root.innerHTML = '';
    },
  };
}
