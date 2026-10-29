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
import { createSaveManager, defaultState, SAVE_KEY } from './core/save.js';
import { createS2Store, S2_KEY } from './core/s2-store.js';
import { createSettings } from './core/settings.js';
import { createGame } from './core/game.js';
import { createAudio } from './core/audio.js';
import { createInput } from './core/input.js';
import { createOfflineStatus } from './core/sw-client.js';
import { createOverlays } from './ui/overlay.js';
import { createToasts } from './ui/toast.js';
import { playDialogue } from './ui/dialogue-box.js';
import { playCinematic } from './ui/cinematic.js';
import { chapterCard, openJournal, openMap, openSettings, openHelp, confirmBox } from './ui/menus.js';
import { worldOfScene, regionOf } from './data/worlds.js';
import { openPuzzle } from './puzzles/host.js';
import { openMinigame } from './minigames/host.js';
import { createTitle } from './scenes/title.js';
import { createExplore } from './scenes/explore.js';
import { SCENES } from './data/scenes/index.js';
import { DIALOGUE } from './data/dialogue/index.js';
import { PUZZLES } from './data/puzzles.js';
import { corridorMemories, allMemories, withMemoryLabels } from './memories/registry.js';
import { memoryPuzzle } from './memories/schema.js';
import { applyEffects } from './core/effects.js';
import { syncAchievements } from './progression/achievements.js';
import { syncMissions } from './progression/missions.js';
import { createTips } from './ui/tips.js';
import { openDrawing } from './ui/drawing.js';
import { askName } from './ui/name-picker.js';
import { showGuide } from './ui/guide.js';
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
  // Season 2 keeps its own document (core/s2-store.js), bound to this playthrough
  const s2Store = createS2Store({ storage: opts.storage, now: opts.now });
  const s2Loaded = s2Store.load(loaded.state.createdAt);
  const game = createGame({ saveManager: saves, s2Store, bus, initial: loaded.state, s2Initial: s2Loaded.state, now: opts.now });
  const totals = {};
  for (const id of Object.keys(COLLECTIBLES)) totals[groupOf(id)] = (totals[groupOf(id)] || 0) + 1;
  game.totalOf = (group) => totals[group] || 0;
  const audio = createAudio(settings);
  const appScope = createScope(); // lives as long as the app (released by destroy)
  const input = createInput({ target: globalThis.window, scope: appScope });
  // world keys (arrows, space…) cancel the browser's default, so they stay off
  // until the exploration scene is actually playable — otherwise they would
  // block keyboard scrolling on the title screen and in menus
  input.setEnabled(false);
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
  // exploration tips wait while a menu, puzzle, minigame or cinematic covers the screen
  const tips = createTips(shell, { settings, audio, blocked: (tip) => tip.place !== 'top' && overlays.count > 0 });
  bus.on('overlay', () => tips.refresh());

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
    tips,
    s2Store,
    loadStatus: loaded.status,
    s2LoadStatus: s2Loaded.status,
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
        // activities like the picnic can be dressed with the owner's local memories
        const dressed = def.memoryObjects ? withMemoryLabels(def, id) : def;
        return openPuzzle(app, { id, ...dressed });
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
      openMap: (opts) => openMap(app, opts),
      openJournal: (tab) => openJournal(app, tab),
      openSettings: () => openSettings(app),
      openHelp: () => openHelp(app),
      drawing: (opts) => openDrawing(app, opts),
      askName: (who) => askName(app, who),
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
    // Phase 04: the deep garden's map marks places she has not been to yet (garden places
    // keep no such mark: older saves never recorded visits, so they would all look new)
    if (regionOf(worldOfScene(id)) === 'deep' && !game.flag(`visited:${id}`)) game.setFlag(`visited:${id}`);
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
    if (syncing || (c.kind === 'flag' && /^(ach|mission|mission-seen):/.test(String(c.id)))) return;
    if (c.kind === 'replace') return; // a new game / restored backup is not "progress"
    syncing = true;
    try {
      const missions = syncMissions(game);
      if (missions.unlocked.length > 2) toasts.toast(`🧭 انفتحت ${missions.unlocked.length} مهمات جديدة بالدفتر`, 'hint');
      else for (const m of missions.unlocked) toasts.toast(`🧭 مهمة جديدة: ${m.title}`, 'hint');
      if (missions.unlocked.length) tips.show('missions');
      // a finished mission gets one notice: the next-objective card in the world (it names
      // what was finished), or a toast elsewhere — never both
      const guided =
        missions.completed.length > 0 &&
        sceneId &&
        sceneId !== 'title' &&
        showGuide(app, { finished: missions.completed.map((m) => m.title), host: current?.screen?.el, sceneId });
      for (const m of missions.completed) {
        if (!guided) toasts.toast(`✅ خلصت المهمة: ${m.title}`, 'unlock');
        toasts.announce(m.changes);
      }
      for (const a of syncAchievements(game)) {
        toasts.toast(`🏆 إنجاز: ${a.name}`, 'unlock');
        toasts.announce(a.changes);
      }
    } finally {
      syncing = false;
    }
    if (c.kind === 'journal') tips.show('journal');
    if (c.kind === 'flag' && c.id === 'map-open') tips.show('map');
  });
  // A save this tab must not write (core/save.js, core/s2-store.js): another tab wrote newer progress,
  // or the save is from a newer build. Said once, with a way on; nothing on disk is touched.
  let blockedShown = false;
  function saveBlocked(why) {
    if (blockedShown) return;
    blockedShown = true;
    const text =
      why === 'other-tab'
        ? 'اللعبة مفتوحة بمكان ثاني وانحفظ هناك تقدم أحدث. حتى ما يضيع شي، هنا ما نحفظ بعد هسه. أعيدي التحميل حتى تكملين من آخر تقدم.'
        : 'هالحفظ من نسخة أحدث من اللعبة. حدّثي الصفحة حتى تكملين — تقدمچ محفوظ وما انلمس.';
    overlays.open(
      (el, { close, scope }) => {
        el.innerHTML = `<section class="panel panel-small save-blocked" role="alertdialog"><h2 tabindex="-1">تقدمچ بأمان</h2><p>${text}</p>
          <div class="stack"><button type="button" class="btn btn-primary" data-reload>أعيدي التحميل</button>
          <button type="button" class="btn btn-ghost" data-no data-autofocus>تمام</button></div></section>`;
        scope.on(el.querySelector('[data-reload]'), 'click', () => location.reload());
        scope.on(el.querySelector('[data-no]'), 'click', () => close());
      },
      { className: 'overlay-panel', dismissible: true, label: 'تقدمچ بأمان' },
    );
  }
  bus.on('save-error', (err) => {
    if (err === 'other-tab' || err === 'readonly') return saveBlocked(err === 'other-tab' ? 'other-tab' : 'future');
    toasts.toast(err === 'quota' ? 'المساحة على الجهاز ممتلئة: التقدم ما انحفظ. حرري شوية مساحة.' : 'ما گدرنا نحفظ التقدم على هذا الجهاز (التصفح الخاص؟).', 'warn');
  });
  // another tab saved: say so before this one tries (the stores refuse to overwrite it anyway)
  globalThis.window?.addEventListener('storage', (e) => {
    if ((e.key === SAVE_KEY || e.key === S2_KEY) && e.newValue != null) saveBlocked('other-tab');
  });
  if (loaded.status === 'future' || s2Loaded.status === 'future') saveBlocked('future');
  if (loaded.status === 'overwritten') {
    // an older version of the game, still open somewhere, wrote over newer progress: ask, keep both
    queueMicrotask(async () => {
      const back = await confirmBox(app, {
        title: 'تقدمچ الأحدث محفوظ',
        text: 'نسخة قديمة من اللعبة (صفحة ثانية چانت مفتوحة) كتبت فوق تقدمچ. نرجّع التقدم الأحدث؟ النسختين محفوظات بالحالتين.',
        yes: 'رجّعي الأحدث',
        no: 'خليها مثل ما هي',
      });
      if (back) {
        saves.restore(loaded.alt);
        game.replace(loaded.alt);
        toasts.toast('رجع تقدمچ الأحدث ✓', 'unlock');
      } else saves.keep();
    });
  }
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
    appScope.dispose(); // the window key listeners of `input`
    audio.stopBed();
    root.innerHTML = '';
  };
  return app;
}
