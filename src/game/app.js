/**
 * Game application: wires services (save, settings, audio, input, offline),
 * the UI layer (overlays, toasts, fades) and the two top-level screens
 * (title, exploration). Story content lives in data/, never here.
 *
 *   title ──new/continue──► explore(scene) ⇄ overlays (dialogue, puzzle,
 *     ▲                         │             minigame, cinematic, menus)
 *     └──────── pause → title ◄─┘
 */
import { createBus } from './core/bus.js';
import { createScope } from './core/scope.js';
import { createSaveManager, defaultState } from './core/save.js';
import { createSettings } from './core/settings.js';
import { createGame } from './core/game.js';
import { createAudio } from './core/audio.js';
import { createInput } from './core/input.js';
import { createOfflineStatus } from './core/sw-client.js';
import { createOverlays } from './ui/overlay.js';
import { createToasts } from './ui/toast.js';
import { playDialogue } from './ui/dialogue-box.js';
import { playCinematic } from './ui/cinematic.js';
import { chapterCard, openJournal, openMap, openSettings } from './ui/menus.js';
import { openPuzzle } from './puzzles/host.js';
import { openMinigame } from './minigames/host.js';
import { createTitle } from './scenes/title.js';
import { createExplore } from './scenes/explore.js';
import { SCENES } from './data/scenes/index.js';
import { DIALOGUE } from './data/dialogue/index.js';
import { PUZZLES } from './data/puzzles.js';
import { h } from './ui/dom.js';

const systemReduced = () => {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
};

/**
 * @param {HTMLElement} root
 * @param {{ storage?: Storage, now?: () => number, swEnabled?: boolean, reducedMotion?: boolean }} [opts]
 */
export function createGameApp(root, opts = {}) {
  const bus = createBus();
  const settings = createSettings({ storage: opts.storage, systemReducedMotion: () => opts.reducedMotion ?? systemReduced() });
  const saves = createSaveManager({ storage: opts.storage, now: opts.now });
  const loaded = saves.load();
  const game = createGame({ saveManager: saves, bus, initial: loaded.state, now: opts.now });
  const audio = createAudio(settings);
  const input = createInput({ target: globalThis.window });
  const offline = createOfflineStatus({ enabled: opts.swEnabled ?? false });

  root.innerHTML = '';
  const shell = h(`<div class="game">
      <main class="screen" id="screen"></main>
      <div class="overlays"></div>
      <div class="fader" aria-hidden="true"></div>
    </div>`);
  root.append(shell);
  const screen = shell.querySelector('.screen');
  const overlays = createOverlays(shell.querySelector('.overlays'), bus);
  const toasts = createToasts(shell, audio);
  const fader = shell.querySelector('.fader');

  let current = null; // { scope, scene }
  let sceneId = null;

  const app = {
    root,
    bus,
    settings,
    saves,
    game,
    audio,
    input,
    overlays,
    offline,
    loadStatus: loaded.status,
    reduced: () => settings.reducedMotion(),
    applyMotion() {
      shell.classList.toggle('reduce-motion', settings.reducedMotion());
    },
    ui: {
      dialogue: (ref) => {
        const script = typeof ref === 'string' ? DIALOGUE[ref] : ref;
        if (!script) {
          console.error('[dialogue] missing script', ref);
          return Promise.resolve();
        }
        return playDialogue(app, script, { id: typeof ref === 'string' ? `dlg:${ref}` : null });
      },
      puzzle: (id) => {
        const def = PUZZLES[id];
        if (!def) {
          console.error('[puzzle] missing', id);
          return Promise.resolve({ solved: false });
        }
        return openPuzzle(app, { id, ...def });
      },
      minigame: (id, options) => openMinigame(app, id, options),
      cinematic: (id) => playCinematic(app, id),
      chapter: (card) => chapterCard(app, card),
      toast: (text, kind) => toasts.toast(text, kind),
      announce: (changes) => toasts.announce(changes),
      openMap: () => openMap(app),
      openJournal: (tab) => openJournal(app, tab),
      openSettings: () => openSettings(app),
      fade: (dir = 'out', ms = 350) =>
        new Promise((resolve) => {
          fader.classList.toggle('is-on', dir === 'out');
          setTimeout(resolve, app.reduced() ? 0 : ms);
        }),
    },
    get sceneId() {
      return sceneId;
    },
    get screen() {
      return current?.screen ?? null;
    },
    go,
    toTitle,
    newGame,
  };

  async function show(make, id) {
    overlays.closeAll();
    if (current) {
      current.screen.exit?.();
      current.scope.dispose();
    }
    const scope = createScope();
    const screenApp = Object.create(app, { scope: { value: scope } });
    const s = make(screenApp);
    current = { scope, screen: s };
    sceneId = id;
    screen.replaceChildren(s.el);
    shell.dataset.screen = id;
    await s.enter?.();
    if (current?.screen === s) fader.classList.remove('is-on');
  }

  /** Travel to an exploration scene. Unknown / unbuilt scenes fall back to the map. */
  async function go(id, { spawnX } = {}) {
    const scene = SCENES[id];
    if (!scene) {
      toasts.toast('هذا المكان قيد البناء وراح ينضاف بتحديث جاي ✨', 'hint');
      if (game.flag('map-open')) openMap(app);
      return;
    }
    await show((a) => createExplore(a, scene, { spawnX }), id);
  }

  function toTitle({ message } = {}) {
    audio.stopBed();
    return show((a) => createTitle(a, { message }), 'title');
  }

  function newGame({ wipe = false } = {}) {
    if (wipe) saves.clear();
    game.replace(defaultState(opts.now?.() ?? Date.now()));
    return go('garden');
  }

  // play-time bookkeeping (only while visible and exploring)
  const tick = setInterval(() => {
    if (!document.hidden && sceneId && sceneId !== 'title') game.addPlayTime(30000);
  }, 30000);
  bus.on('save-error', (err) =>
    toasts.toast(err === 'quota' ? 'المساحة على الجهاز ممتلئة: التقدم ما انحفظ. حرري شوية مساحة.' : 'ما گدرنا نحفظ التقدم على هذا الجهاز (التصفح الخاص؟).', 'warn'),
  );
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) game.save();
  });
  settings.subscribe(() => app.applyMotion());
  app.applyMotion();

  if (loaded.status === 'recovered') toasts.toast('صار خلل بالحفظ الأخير ورجّعنا آخر نسخة سليمة.', 'warn');
  if (loaded.status === 'reset') toasts.toast('ملف الحفظ كان تالف؛ بدينا من جديد واحتفظنا بالقديم.', 'warn');

  app.destroy = () => {
    clearInterval(tick);
    overlays.closeAll();
    current?.scope.dispose();
    audio.stopBed();
    root.innerHTML = '';
  };
  return app;
}
