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
import { corridorMemories, allMemories } from './memories/registry.js';
import { memoryPuzzle } from './memories/schema.js';
import { applyEffects } from './core/effects.js';
import { syncAchievements } from './progression/achievements.js';
import { COLLECTIBLES } from './data/items.js';
import { groupOf } from './core/game.js';
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
  const totals = {};
  for (const id of Object.keys(COLLECTIBLES)) totals[groupOf(id)] = (totals[groupOf(id)] || 0) + 1;
  game.totalOf = (group) => totals[group] || 0;
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
      /**
       * Play one memory: narration, then its question (unless already
       * solved), then its dialogue. `ref` is a corridor slot or a memory id.
       */
      memory: async (ref) => {
        const m = typeof ref === 'number' ? corridorMemories()[ref] : allMemories().find((x) => x.id === ref);
        if (!m) return { solved: false };
        const head = `«${m.title}»${m.dateLabel ? ` — ${m.dateLabel}` : ''}`;
        await playDialogue(app, [{ s: 'note', t: head }, { s: 'note', t: m.scene }]);
        const already = game.memory(m.id).solved;
        let solved = already || m.puzzle === 'reveal';
        if (!solved) {
          const res = await openPuzzle(app, memoryPuzzle(m));
          solved = Boolean(res?.solved);
          game.markMemory(m.id, solved);
          if (solved) toasts.announce(applyEffects(m.reward, game));
        } else if (!already) game.markMemory(m.id, true);
        if (solved && m.dialogue?.length) await playDialogue(app, m.dialogue);
        return { solved, memory: m };
      },
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
  // achievements are checked after any progress change (not on their own flags)
  let syncing = false;
  bus.on('change', (c) => {
    if (syncing || (c.kind === 'flag' && String(c.id).startsWith('ach:'))) return;
    syncing = true;
    for (const a of syncAchievements(game)) {
      toasts.toast(`🏆 إنجاز: ${a.name}`, 'unlock');
      toasts.announce(a.changes);
    }
    syncing = false;
  });
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
