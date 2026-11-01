/**
 * Exploration engine: one side-scrolling location at a time.
 *
 * Owns the canvas, the camera, the actors (Anji, Snooki, cast) and the
 * interactive content of a scene definition (see data/scenes/*.js). Story
 * logic stays in data: interactables, triggers and exits run action lists
 * through `run()`, which awaits dialogue, puzzles and minigames supplied by
 * the app (app.ui.*). Everything is released by dispose().
 */
import { GROUND, VIEW_H } from './props.js';
import * as P from './props.js';
import { createPainter, releaseCanvas } from './painter.js';
import { frameCamera, followTop, MIN_TOP } from './camera.js';
import { stepBody, followVelocity, approach } from './physics.js';
import { frameTable } from '../characters/sprites.js';
import { spriteFrames } from './sprite-cache.js';
import { reaction as socialReaction } from '../progression/social.js';
import { check } from '../core/conditions.js';
import { isS2 } from '../core/game.js';
import { applyEffects } from '../core/effects.js';
import { fillNames } from '../core/names.js';
import { PROP_DRAWERS } from './prop-drawers.js';
import { dogsIn } from '../data/companions.js';
import { PERSONAS } from '../data/personas.js';
import { CIRCLE_GESTURES } from '../characters/circle.js';

const CIRCLE_GESTURE_NAMES = new Set(Object.keys(CIRCLE_GESTURES));

/**
 * The key of a rotating line counter (which of the dogs' lines comes next) for a scene: in a Season 2 place it is
 * kept in Season 2's own save (`s2:…`) — Season 2 never writes the original campaign's save, not even a counter
 * (REGRESSION: tapping her husky in the office wrote `hub.lines` in the original save).
 */
export const lineKey = (sceneId, key) => (isS2(sceneId) ? `s2:${key}` : key);

/**
 * The sound of a reaction (core/audio.js, synthesised; silent when sound is off): a gasp on a surprised face,
 * a comic slide when someone is caught out, a thud on a squash, a giggle on a laugh, paper on flying papers.
 */
/**
 * The animation states every character can be put in (`pose`), resolved from the frames each one has — no new art:
 * a state a character has no frames for borrows the nearest frames it does have, and the engine adds the motion
 * (a hide crouches lower and fades a little, a search looks one way then the other, a celebration bounces, a run
 * without run frames is a faster, leaning walk).
 */
export const STATE_FRAMES = {
  run: ['run', 'walk'],
  hide: ['crouch', 'sit', 'idle'],
  search: ['think', 'sniff', 'idle'],
  interact: ['crouch', 'point', 'idle'],
  celebrate: ['celebrate', 'excited', 'laugh', 'idle'],
  embarrassed: ['shy', 'idle'],
  carry: ['idle'],
  react: ['surprised', 'idle'],
  gesture: ['handsup', 'point', 'idle'],
};
/** The frames a character shows for a state (pure: tested for every character). */
export function framesFor(table, anim) {
  if (table[anim]) return table[anim];
  for (const name of STATE_FRAMES[anim] || []) if (table[name]) return table[name];
  return table.idle;
}

export const REACT_SFX = {
  mood: { surprised: 'gasp' },
  jolt: { shake: 'oops', squash: 'land' },
  puff: { papers: 'paper', sparkle: 'sparkle' },
  pose: { laugh: 'giggle' },
};

/**
 * A speech bubble's text, broken at spaces into lines no wider than `maxW` (a single word wider than
 * that keeps its own line). `measure(text)` gives a text's width in the bubble's font.
 */
export function bubbleLines(text, measure, maxW) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Prompt text: the game's Arabic font; icons: the platform's colour-emoji font. */
export const PROMPT_FONT = '700 10px "Baloo Bhaijaan 2", sans-serif';
export const PROMPT_ICON_FONT = '12px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export const KIND = {
  anji: { h: 112, w: 34, feet: 196 / 200, fps: 9 },
  snooki: { h: 64, w: 60, feet: 106 / 110, fps: 11 },
  husky: { h: 58, w: 54, feet: 106 / 110, fps: 11 }, // Story Pack 01: a little smaller than Snooki
  // Ryan is tall and athletic: ~16 % taller than Anji (112)
  ryan: { h: 130, w: 40, feet: 195 / 200, fps: 8 },
  shadow: { h: 130, w: 40, feet: 195 / 200, fps: 8 }, // Ryan's silhouette: same build
  needle: { h: 78, w: 40, feet: 166 / 170, fps: 8 },
  // Season 2's circle (characters/circle.js): ordinary adult builds, close to Anji's
  rabi: { h: 116, w: 36, feet: 193 / 200, fps: 8 },
  lama: { h: 110, w: 34, feet: 193 / 200, fps: 8 },
  sabri: { h: 116, w: 36, feet: 193 / 200, fps: 8 },
  jojo: { h: 112, w: 36, feet: 193 / 200, fps: 7 },
  sister: { h: 110, w: 34, feet: 193 / 200, fps: 8 },
};

const REACH = 34; // how close (beyond an object's half width) counts as "next to it"

/** Snooki's reactions when she taps him (rotating, see game.nextLine). */
export const SNOOKI_TAPS = [
  { pose: 'bark', text: 'هاو! …يعني «شكراً». بلغة الكلاب الراقية.', sfx: 'bark' },
  { pose: 'wag', text: 'ذيلي يتحرك وحده. ما إلي علاقة.' },
  { pose: 'innocent', text: 'آني؟ ما سوّيت شي. ولا مرة. بحياتي.' },
  { pose: 'sniff', text: 'أشم… بسكويت؟ لا. خيبة كبيرة.' },
  { pose: 'celebrate', text: 'نطّة احتفال! بدون سبب. الأسباب مبالغ بيها.' },
  { pose: 'stubborn', text: 'لا. مو هسه. آني مشغول… بالتفكير.' },
];
/** Snooki beside Ryan (after the meeting): Ryan's dog — loyal, steady, watchful, a little stubborn. */
export const SNOOKI_RYAN_TAPS = [
  { pose: 'sit', text: 'آني هنا. يم ريان. هذا مكاني.' },
  { pose: 'sniff', text: 'فحصت المنطقة. كلشي تمام. لا تقلقون.' },
  { pose: 'wag', text: 'ريان ما يحچي هواية. آني هم. نفهم بعض.' },
  { pose: 'stubborn', text: 'لا. ما أتحرك. ريان يمكن يحتاجني.' },
];
/** Anji's husky: like her — curious, quick, playful, a little mischievous, notices everything. */
export const HUSKY_TAPS = [
  { pose: 'sniff', text: '👃 أشم شي… هناك! لازم أعرف شنو. هسه.', scout: true },
  { pose: 'excited', text: 'أووو! لعبة؟ گولي لعبة! 🐾' },
  { pose: 'wag', text: '😏 لگيت طريق مختصر. لا تگولين لسنوكي.', scout: true },
  { pose: 'sit', text: '👀 ذاك الشي تحرك. آني شفته. أكيد… تقريباً.' },
  { pose: 'celebrate', text: '✨ لحگت فراشة! …أو هي لحگتني. نفس الشي.' },
  { pose: 'bark', text: 'هاو! يعني: «يلا، الدنيا ما راح تستكشف نفسها».', sfx: 'bark' },
  { pose: 'sniff', text: 'هنا أحد مشى قبل شوية. خطوته صغيرة. آني أعرف هالأشياء.' },
  { pose: 'wag', text: 'آني أذكى كلبة بالحديقة. سنوكي يگول لا. سنوكي غلطان.' },
];
/** Her remarks when Anji stands a while and it is just the two of them (Snooki is with Ryan). */
export const HUSKY_AMBIENT = [
  'نوگف؟ زين. آني أروح أشوف ذاك الركن… بسرعة.',
  'كل مكان بيه سر صغير. آني أشمه قبل ما تشوفينه.',
  'إذا تحتاجين مساعدة بلغز، آني موجودة. ذيلي يفكر أحسن مني.',
  'هالمكان ريحته… مغامرة. وشوية تراب.',
  'سنوكي يمكن مشغول ويا ريان. بس آني هنا. دايماً.',
  'لاحظتي؟ أكو شي يلمع هناك. لا؟ آني لاحظت.',
];

export async function createWorld(host, scene, app, { spawnX, onProgress } = {}) {
  const { game, audio, input, scope } = app;
  const canvas = document.createElement('canvas');
  canvas.className = 'world-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', scene.title);
  host.append(canvas);
  const ctx = canvas.getContext('2d');

  // ── sprites (decoded before play: genuine progress) ──
  // which dogs are here, and with whom (data/companions.js): Snooki is Ryan's, the husky is hers
  const dogs = dogsIn(scene, game);
  const kinds = new Set(['anji', 'snooki', ...(dogs.husky === 'follow' ? ['husky'] : []), ...(scene.actors || []).map((a) => a.kind)]);
  const tables = [...kinds].map((k) => [k, frameTable(k, game.state.cosmetics)]);
  const totalFrames = tables.reduce((n, [, t]) => n + Object.values(t).reduce((m, l) => m + l.length, 0), 0);
  let loaded = 0;
  const frames = {};
  await Promise.all(
    tables.map(async ([k]) => {
      // baked once per look and shared by every scene (world/sprite-cache.js)
      frames[k] = await spriteFrames(k, game.state.cosmetics, { onProgress: () => onProgress?.(++loaded, totalFrames) });
    }),
  );
  if (scope.disposed) return null;

  /** Sprites for an actor kind that appears mid-scene (e.g. a cutscene spawn). */
  async function ensureFrames(kind) {
    if (frames[kind]) return;
    frames[kind] = await spriteFrames(kind, game.state.cosmetics);
  }

  const painter = createPainter({ theme: scene.theme, staticProps: scene.props || [], seed: scene.seed || 7, propDrawers: PROP_DRAWERS });

  // ── actors ──
  const actors = new Map();
  function addActor(def) {
    const k = KIND[def.kind];
    const a = {
      id: def.id,
      kind: def.kind,
      x: def.x,
      y: def.y ?? GROUND,
      vx: 0,
      vy: 0,
      w: k.w,
      h: def.h ?? k.h,
      facing: def.facing ?? 1,
      onGround: true,
      anim: 'idle',
      animT: Math.random(),
      pose: null, // scripted animation override
      mood: def.mood ?? null, // a face kept while standing (a dialogue line's expression sets it); walking shows over it
      jolt: null, // a short runtime motion (hop, shake, lunge, squash, tilt): drawn, never baked
      puffs: [], // small drawn particles (sweat, steam, sparkle, dust)
      alpha: def.alpha ?? 1,
      visible: true,
      z: def.z ?? 1,
      emote: null,
      bubble: null,
      blinkAt: 2 + Math.random() * 3,
      companion: Boolean(def.companion),
      leader: def.leader ?? null, // whom a companion walks with (an actor id); her, by default
      def,
    };
    actors.set(a.id, a);
    return a;
  }
  const player = addActor({ id: 'anji', kind: 'anji', x: spawnX ?? scene.spawn ?? 200, z: 2 });
  const snooki = addActor({
    id: 'snooki',
    kind: 'snooki',
    x: dogs.snooki === 'ryan' ? dogs.ryanX - 58 : dogs.leader === 'ryan' ? dogs.ryanX - 50 : player.x - 70,
    companion: dogs.snooki === 'follow',
    leader: dogs.leader ?? null,
    z: 3,
  });
  /** Snooki is Ryan's from the meeting on (beside him, or walking with him on a shared outing). */
  const snookiWithRyan = dogs.snooki === 'ryan' || dogs.leader === 'ryan';
  if (dogs.snooki === 'away' || (scene.snookiHidden && check(scene.snookiHidden, game))) snooki.visible = false;
  if (dogs.snooki === 'ryan') {
    snooki.facing = 1;
    snooki.pose = 'sit';
  }
  // her own dog walks with her (a little further back when Snooki walks with her too)
  if (dogs.husky === 'follow') addActor({ id: 'husky', kind: 'husky', x: player.x - 120, companion: true, gap: dogs.snooki === 'follow' && !dogs.leader ? 118 : 62, z: 3 });
  for (const def of scene.actors || []) if (check(def.if, game)) addActor(def);

  // ── state ──
  const width = scene.width;
  let viewW = 400;
  let viewH = VIEW_H;
  let baseTop = 0; // camera top when she stands on the ground
  let topY = 0; // camera top this frame (rises when she climbs)
  let pixelScale = 1;
  let camX = Math.max(0, player.x - 180);
  let camTarget = null; // scripted camera
  let shake = 0;
  let t = 0;
  let mode = 'play'; // 'play' | 'cutscene'
  let cutsceneDepth = 0;
  let paused = false;
  let interactTarget = null;
  let autoWalk = null; // { x, then }
  let idleTime = 0;
  let stride = 0; // distance since her last footstep sound
  const letterbox = { k: 0, to: 0 }; // cinema bars (0 hidden … 1 shown)
  let nextWatch = 8; // Snooki's first look around (beside Ryan)
  let lastAmbient = 0;
  let lastLocationSave = 0;
  const firedTriggers = new Set();
  const listeners = { target: [], mode: [] };

  const platforms = () => (scene.platforms || []).filter((p) => check(p.if, game));
  const solids = () => (scene.blockers || []).filter((b) => check(b.if, game));
  const interactables = () => (scene.interact || []).filter((it) => check(it.if, game) && (!it.actor || actors.get(it.actor)?.visible !== false));
  /** A person she can talk to stays talkable wherever they walk: the interactable follows its actor. */
  const followActors = () => {
    for (const it of scene.interact || []) {
      const a = it.actor && actors.get(it.actor);
      if (a) it.x = Math.round(a.x);
    }
  };

  // ── layout ──
  function resize() {
    const r = host.getBoundingClientRect();
    const cssW = Math.max(1, r.width);
    const cssH = Math.max(1, r.height);
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    // cinematic band instead of the whole 300-unit scene (see camera.js)
    const f = frameCamera(cssW, cssH);
    viewW = f.viewW;
    viewH = f.viewH;
    baseTop = f.baseTop;
    topY = followTop(baseTop, viewH, player.y - player.h * 0.62);
    pixelScale = f.k * dpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
  }
  resize();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    scope.add(() => ro.disconnect());
  }

  // ── helpers ──
  const emit = (type, v) => listeners[type].forEach((fn) => fn(v));
  function setMode(m) {
    if (mode === m) return;
    mode = m;
    if (m !== 'play') {
      player.vx = 0;
      autoWalk = null;
    }
    emit('mode', m);
  }
  function screenToWorld(px, py) {
    const r = canvas.getBoundingClientRect();
    const k = r.width / viewW;
    return { x: camX + (px - r.left) / k, y: topY + (py - r.top) / k };
  }
  // an interactable with its own `y` (e.g. on a high ledge) must be reached at that height
  const near = (it, a = player) =>
    Math.abs(a.x - it.x) <= (it.w || 40) / 2 + REACH && a.y >= (it.y ?? GROUND) - (it.h || 140) && (it.y === undefined || a.y <= it.y + 8);

  // ── scripted actions ──
  function moveActor(a, x, speed = 150) {
    return new Promise((resolve) => {
      a.moveTo = { x, speed, resolve };
    });
  }

  async function runActions(actions, opts = {}) {
    const list = Array.isArray(actions) ? actions : [actions];
    for (const act of list) {
      if (scope.disposed) return;
      await runOne(act, opts);
    }
  }

  async function runOne(act) {
    if (typeof act === 'function') return act(api);
    if (act.if !== undefined && !('then' in act) && !('else' in act) && !act.puzzle && !act.game && !act.testimony && act.memory === undefined) {
      if (!check(act.if, game)) return;
    }
    // (a puzzle, minigame, memory or testimony has its own then/else: what follows it, not a branch)
    if ('then' in act && !act.puzzle && !act.game && !act.testimony && act.memory === undefined) {
      return runActions(check(act.if, game) ? act.then : act.else || []);
    }
    if (act.say) return app.ui.dialogue(act.say);
    // Season 2: Ryan's reaction when someone talks to Anji — contextual, sometimes none (progression/social.js)
    if (act.social) {
      // only when he is actually here — never a line from someone not on screen
      const ryan = actors.get('ryan');
      if (!ryan || ryan.visible === false) return;
      const { say } = socialReaction(game, act.social);
      return say ? app.ui.dialogue(say) : undefined;
    }
    if (act.fx) {
      const changes = applyEffects(act.fx, game);
      if (!act.quiet) app.ui.announce?.(changes); // quiet: after a moment that should stay calm
      return;
    }
    if (act.puzzle) {
      const res = await app.ui.puzzle(act.puzzle);
      return runActions(res?.solved ? act.then || [] : act.else || []);
    }
    if (act.memory !== undefined) {
      const res = await app.ui.memory(act.memory);
      return runActions(res?.solved ? act.then || [] : act.else || []);
    }
    if (act.game) {
      const res = await app.ui.minigame(act.game, act.options);
      return runActions(res?.completed ? act.then || [] : act.else || []);
    }
    if (act.wait) return scope.wait(app.reduced() ? Math.min(act.wait, 200) : act.wait);
    if (act.move) {
      const a = actors.get(act.move);
      if (!a) return;
      // { move: 'sister', to: 'anji', gap: 70 } — walk up to someone and stop beside them (wherever they stand)
      const to = act.to && actors.get(act.to);
      const x = to ? to.x - Math.sign(to.x - a.x || 1) * (act.gap ?? 60) : act.x;
      const p = moveActor(a, x, act.speed);
      return act.async ? undefined : p;
    }
    if (act.letterbox !== undefined) {
      // { letterbox: true } — cinema bars for a set piece (they slide in and out; off again with false)
      letterbox.to = act.letterbox ? 1 : 0;
      return;
    }
    if (act.exit) {
      // { exit: 'sabri', side: 'right', speed } — walks out of the place on that side and is gone
      const a = actors.get(act.exit);
      if (!a) return;
      await moveActor(a, act.side === 'left' ? camX - 80 : camX + viewW + 80, act.speed ?? 150);
      actors.delete(a.id);
      return;
    }
    if (act.face) {
      const a = actors.get(act.face);
      if (a) a.facing = act.dir ?? (act.toward ? Math.sign(actors.get(act.toward).x - a.x) || 1 : a.facing);
      return;
    }
    if (act.pose) {
      const a = actors.get(act.pose);
      if (!a) return;
      a.pose = act.anim;
      if (REACT_SFX.pose[act.anim]) audio.play(REACT_SFX.pose[act.anim]);
      if (act.for) {
        await scope.wait(act.for);
        a.pose = null;
      }
      return;
    }
    if (act.mood !== undefined) {
      // { mood: 'jojo', expr: 'shy' } — a face that stays until changed (null: back to neutral)
      const a = actors.get(act.mood);
      if (a) a.mood = act.expr ?? null;
      if (a && REACT_SFX.mood[act.expr]) audio.play(REACT_SFX.mood[act.expr]);
      return;
    }
    if (act.jolt) {
      // { jolt: 'jojo', type: 'hop'|'shake'|'lunge'|'squash'|'tilt'|'nod'|'rise', ms } — drawn on the canvas, costs no art
      const a = actors.get(act.jolt);
      if (a && !app.reduced()) a.jolt = { type: act.type, t0: t, ms: act.ms ?? 420 };
      if (a && REACT_SFX.jolt[act.type]) audio.play(REACT_SFX.jolt[act.type]);
      return;
    }
    if (act.puff) {
      // { puff: 'jojo', type: 'sweat'|'steam'|'sparkle'|'dust', ms }
      const a = actors.get(act.puff);
      if (a) a.puffs.push({ type: act.type, t0: t, until: t + (act.ms ?? 1600) / 1000 });
      if (a && REACT_SFX.puff[act.type]) audio.play(REACT_SFX.puff[act.type]);
      return;
    }
    if (act.all) {
      // several things at once (two people walking, a reaction while someone talks), then on together
      return Promise.all(act.all.map((a) => runOne(a)));
    }
    if (act.testimony) {
      // a witness's account, acted out in this world; she stops it where it breaks (ui/testimony.js)
      const res = await app.ui.testimony(act.testimony, { run: runActions, actors: (id) => actors.get(id) });
      return runActions(res?.solved ? act.then || [] : act.else || []);
    }
    if (act.emote) {
      const a = actors.get(act.emote);
      if (a) a.emote = { icon: act.icon, until: t + (act.ms ?? 1400) / 1000 };
      return;
    }
    if (act.bubble) {
      const a = actors.get(act.bubble);
      if (a) a.bubble = { text: fillNames(act.text, game), until: t + (act.ms ?? 2600) / 1000 };
      return;
    }
    if (act.spawn) {
      if (actors.has(act.spawn.id)) return; // already here (e.g. she came in on an earlier visit)
      await ensureFrames(act.spawn.kind);
      const a = addActor(act.spawn);
      if (act.spawn.fadeIn) {
        a.alpha = 0;
        a.fade = { to: act.spawn.alpha ?? 1, speed: 1.5 };
      }
      return;
    }
    if (act.despawn) {
      const a = actors.get(act.despawn);
      if (a && act.fade) {
        a.fade = { to: 0, speed: 1.4, remove: true };
        return scope.wait(700);
      }
      actors.delete(act.despawn);
      return;
    }
    if (act.stay) {
      const a = actors.get(act.stay);
      if (a) a.companion = false;
      return;
    }
    if (act.show !== undefined) {
      const a = actors.get(act.show);
      if (a) a.visible = act.visible ?? true;
      return;
    }
    if (act.place) {
      const a = actors.get(act.place);
      if (a) {
        a.x = act.x;
        a.vx = 0;
        if (act.facing) a.facing = act.facing;
      }
      return;
    }
    if (act.camera !== undefined) {
      if (act.camera === null) camTarget = null;
      else if (act.camera.between) camTarget = { between: act.camera.between }; // two people in one shot
      else camTarget = typeof act.camera === 'string' ? { actor: act.camera } : { x: act.camera };
      return scope.wait(act.ms ?? 600);
    }
    if (act.shake) {
      shake = act.shake;
      return;
    }
    if (act.sfx) return audio.play(act.sfx);
    if (act.toast) return app.ui.toast(act.toast, act.kind);
    if (act.chapter) return app.ui.chapter(act.chapter);
    if (act.cine) return app.ui.cinematic(act.cine);
    if (act.fade) return app.ui.fade(act.fade, act.ms);
    if (act.goto) return app.go(act.goto, { spawnX: act.x });
    if (act.map) return app.ui.openMap();
    if (act.journal) return app.ui.openJournal(act.journal);
    if (act.drawing) return app.ui.drawing(act.drawing === true ? {} : act.drawing);
    if (act.askName) return app.ui.askName(act.askName);
    if (act.free) return;
    throw new Error(`Unknown action ${JSON.stringify(act)}`);
  }

  /** Run actions as a cutscene: input off until finished (nesting-safe). */
  async function run(actions) {
    cutsceneDepth += 1;
    setMode('cutscene');
    try {
      await runActions(actions);
    } catch (err) {
      console.error('[world] action failed', err);
    } finally {
      cutsceneDepth -= 1;
      if (cutsceneDepth === 0 && !scope.disposed) {
        camTarget = null;
        for (const a of actors.values()) a.pose = null;
        player.mood = null; // her face goes back to her own; the others keep the mood the story left them in
        setMode('play');
        saveLocation(true);
      }
    }
  }

  const seenKey = (it) => `it.${scene.id}.${it.id}`;
  /** Objects she has not examined yet (or that have something new) twinkle. */
  const glows = (it) => it.glow !== false && (!game.seen(seenKey(it)) || (it.glowIf !== undefined && check(it.glowIf, game)));

  function interact(it) {
    if (!it || mode !== 'play') return;
    audio.play('tap');
    game.markSeen(seenKey(it));
    // talking to someone: they turn to her, she turns to them
    const who = it.actor && actors.get(it.actor);
    if (who) {
      who.facing = Math.sign(player.x - who.x) || who.facing;
      player.facing = Math.sign(who.x - player.x) || player.facing;
    }
    const cases = it.cases || [{ run: it.run }];
    // a case may also depend on who is looking at her right now (`unseenBy` / `seenBy`: an actor id) —
    // a timing window in the world, never written to the save
    const chosen = cases.find((c) => check(c.if, game) && (!c.unseenBy || !watching(c.unseenBy)) && (!c.seenBy || watching(c.seenBy)));
    if (chosen) run(chosen.run);
  }

  // the world follows the dialogue: the speaker shows the line's expression and turns to her; a line's
  // `act` (actions) plays while it is read — people move and react during a conversation, not only after it
  const ANJI_FACE = { surprised: 'surprised', thinking: 'think', shy: 'shy', pout: 'pout', annoyed: 'pout' };
  const MOOD_OF = { happy: 'smile', curious: 'thinking', smug: 'suspicious', sad: 'worried', scared: 'worried' };
  scope.sub(
    app.bus.on('dialogue-line', ({ speaker, expr, act, text }) => {
      const a = speaker && actors.get(speaker);
      for (const x of actors.values()) x.talkUntil = 0;
      if (a) a.talkUntil = t + Math.min(4, 0.8 + (text?.length ?? 20) * 0.045); // the mouth moves while the line is read
      if (a === player) player.mood = ANJI_FACE[expr] ?? null;
      else if (a) {
        const m = expr === 'neutral' ? null : MOOD_OF[expr] ?? expr;
        if (m === null) a.mood = null;
        else if (frames[a.kind]?.[m]) a.mood = m;
        if (!a.moveTo) a.facing = Math.sign(player.x - a.x) || a.facing;
        player.facing = Math.sign(a.x - player.x) || player.facing;
      }
      if (act) runActions(act).catch((err) => console.error('[world] line action failed', err));
    }),
  );

  function saveLocation(force = false) {
    if (!force && t - lastLocationSave < 8) return;
    lastLocationSave = t;
    game.setLocation(scene.id, player.x);
  }

  /** Tap on a dog: a short pose + line from its own list (never blocks play). */
  const busyUntil = {};
  function dogReact(a, list, key) {
    if (!a || t < (busyUntil[a.id] ?? 0) || !a.visible) return false;
    const r = list[game.nextLine(lineKey(scene.id, key), list.length)];
    busyUntil[a.id] = t + 1.6;
    a.pose = r.pose;
    a.bubble = { text: r.text, until: t + 2.6 };
    if (r.sfx) audio.play(r.sfx);
    // her husky sometimes darts ahead to see what is there, then comes back to her side
    if (r.scout && a.companion && !a.moveTo && mode === 'play') {
      const x = Math.max(30, Math.min(width - 30, player.x + player.facing * 170));
      a.moveTo = { x, speed: 260, resolve: () => {} };
    }
    scope.timeout(() => {
      if (a.pose === r.pose) a.pose = a === snooki && dogs.snooki === 'ryan' ? 'sit' : null;
    }, 1500);
    return true;
  }
  const snookiReact = () => dogReact(snooki, snookiWithRyan ? SNOOKI_RYAN_TAPS : SNOOKI_TAPS, snookiWithRyan ? 'snooki-ryan-tap' : 'snooki-tap');
  const huskyReact = () => dogReact(actors.get('husky'), HUSKY_TAPS, 'husky-tap');
  const onDog = (a, p) => a && a.visible && Math.abs(p.x - a.x) < 30 && p.y > a.y - a.h && p.y < a.y + 8;

  /** Whether someone is looking at her right now (they face her side). */
  const watching = (id) => {
    const a = actors.get(id);
    return Boolean(a && a.visible && Math.sign(player.x - a.x) === Math.sign(a.facing));
  };
  /**
   * A person's routine while she plays (not during a cutscene): `routines: [{ if?, steps: [{ face, pose?, ms }] }]`.
   * The first routine whose condition holds runs, step after step, round and round; `face` is someone's id
   * ('anji', 'lama'…), 'away' (from her) or ±1. Only the actor's look and facing change; nothing is saved.
   */
  function routine(a) {
    const list = a.def?.routines;
    if (!list || a.moveTo) return;
    const i = list.findIndex((r) => check(r.if, game));
    if (i < 0) {
      a.rt = null; // no routine applies now: they are free to fidget (habits)
      return;
    }
    if (a.rt?.i !== i) a.rt = { i, step: -1, until: 0 };
    const steps = list[i].steps;
    const lookAt = (s) => (s.face === 'away' ? -Math.sign(player.x - a.x) : typeof s.face === 'number' ? s.face : Math.sign((actors.get(s.face)?.x ?? a.x) - a.x));
    if (t >= a.rt.until) {
      a.rt.step = (a.rt.step + 1) % steps.length;
      const s = steps[a.rt.step];
      a.rt.until = t + s.ms / 1000;
      if (s.pose) a.pose = s.pose;
      else if (a.pose && a.rt.pose) a.pose = null;
      a.rt.pose = Boolean(s.pose);
    }
    // the look is kept every frame: someone watching her follows her as she moves (no gap to slip through)
    const look = lookAt(steps[a.rt.step]);
    if (look) a.facing = look;
  }
  /** Small habits while standing about (data/personas.js): a gesture now and then, never during a story beat. */
  function habit(a) {
    const p = PERSONAS[a.kind];
    if (!p?.habits || a.def?.habits === false || a.rt || a.moveTo || Math.abs(a.vx) > 1) return;
    if (a.habitEnd && t > a.habitEnd) {
      if (a.pose === a.habitPose) a.pose = null;
      a.habitEnd = 0;
    }
    if (a.habitAt === undefined) a.habitAt = t + 3 + Math.random() * 5;
    if (t < a.habitAt || a.pose) return;
    const h = p.habits[Math.floor(Math.random() * p.habits.length)];
    a.pose = a.habitPose = h.pose;
    a.habitEnd = t + h.ms / 1000;
    a.habitAt = t + 5 + Math.random() * 5;
  }

  /**
   * People who notice her: an actor with `notice: { dist, emote?, jolt? }` turns to her when she comes
   * close (and reacts once per approach); they look away again only when she has gone.
   */
  function noticeHer() {
    for (const a of actors.values()) {
      const n = a.def?.notice;
      if (!n || !a.visible || a.moveTo || a === player) continue;
      const d = Math.abs(player.x - a.x);
      if (d < (n.dist ?? 110) && !a.noticed) {
        a.noticed = true;
        a.facing = Math.sign(player.x - a.x) || a.facing;
        if (n.emote) a.emote = { icon: n.emote, until: t + 1.2 };
        if (n.jolt) a.jolt = { type: n.jolt, t0: t, ms: 420 };
      } else if (d > (n.dist ?? 110) + 70) a.noticed = false;
    }
  }

  // ── input: tap a thing to walk to it and use it; tap ground to walk there ──
  /** A tap at world point p. Her husky scouts ahead, often right over the thing Anji means to
   *  use, so a scene object wins over the husky when they overlap. Returns what took the tap. */
  function tapAt(p) {
    if (onDog(snooki, p) && snookiReact()) return 'snooki';
    const hit = interactables()
      .filter((it) => Math.abs(p.x - it.x) <= Math.max(26, (it.w || 40) / 2 + 10) && p.y >= (it.y ?? GROUND) - (it.h || 140) - 20 && p.y <= GROUND + 40)
      .sort((a, b) => Math.abs(p.x - a.x) - Math.abs(p.x - b.x))[0];
    if (hit) {
      if (near(hit)) interact(hit);
      else autoWalk = { x: hit.x - Math.sign(hit.x - player.x) * ((hit.w || 40) / 2 + 12), then: hit };
      return 'object';
    }
    if (onDog(actors.get('husky'), p) && huskyReact()) return 'husky';
    if (p.y > GROUND - 160) {
      autoWalk = { x: Math.max(20, Math.min(width - 20, p.x)), then: null };
      return 'ground';
    }
    return null;
  }
  scope.on(canvas, 'pointerup', (e) => {
    if (mode !== 'play' || paused) return;
    tapAt(screenToWorld(e.clientX, e.clientY));
  });

  // ── update ──
  function update(dt) {
    t += dt;
    const playing = mode === 'play' && !paused;
    followActors();
    if (playing) noticeHer();

    // player control
    let dir = 0;
    let jump = false;
    if (playing) {
      if (input.down('left')) dir -= 1;
      if (input.down('right')) dir += 1;
      jump = input.take('jump') || input.take('up');
      // a direction takes over from a tap-to-walk; a jump does not: she jumps on the way and
      // keeps walking to where she was going (on a phone, tapping «قفزة» while walking used to
      // stop her dead — the jump went up on the spot)
      if (dir !== 0) autoWalk = null;
      if (autoWalk) {
        const d = autoWalk.x - player.x;
        if (Math.abs(d) < 6) {
          const then = autoWalk.then;
          autoWalk = null;
          if (then && near(then)) interact(then);
        } else dir = Math.sign(d);
      }
      if (input.take('interact') && interactTarget) interact(interactTarget);
    }
    const world = { minX: 0, maxX: width, platforms: platforms(), solids: solids() };
    if (player.moveTo) dir = 0;
    const ev = stepBody(player, { dir, jump }, world, dt);
    if (ev.jumped) audio.play('jump');
    if (ev.landed) audio.play('land');
    // her steps: one sound per stride on the ground (quieter and slower when walking, firmer when running)
    if (player.onGround && Math.abs(player.vx) > 20) {
      stride += Math.abs(player.vx) * dt;
      if (stride > 52) {
        stride = 0;
        audio.play(Math.abs(player.vx) > 230 ? 'run' : 'footstep');
      }
    } else stride = 40; // the first step sounds soon after she starts
    if (dir !== 0) player.facing = dir;

    // actors: scripted moves, companion follow, fades
    for (const a of actors.values()) {
      if (a.moveTo) {
        const d = a.moveTo.x - a.x;
        const step = a.moveTo.speed * dt;
        if (Math.abs(d) <= step) {
          a.x = a.moveTo.x;
          a.vx = 0;
          const r = a.moveTo.resolve;
          a.moveTo = null;
          r();
        } else {
          a.vx = Math.sign(d) * a.moveTo.speed;
          a.x += a.vx * dt;
          a.facing = Math.sign(d);
        }
      } else if (a.companion && autoWalk?.then?.actor === a.id) {
        // she is walking over to talk to this companion: they wait for her instead of keeping their distance
        a.vx = approach(a.vx, 0, 900 * dt);
      } else if (a.companion && a.visible && mode === 'play' && (!a.leader || actors.get(a.leader)?.visible)) {
        // a companion walks with its own person: her, or (Snooki on a shared outing) Ryan
        const lead = a.leader ? actors.get(a.leader) : player;
        // her husky scouts ahead while Anji stands — but comes back to her side to say something
        // (on a phone's narrow view the scouting spot is at the screen's edge: a remark there is unseen)
        const scouting = a.id === 'husky' && idleTime > 3 && !(a.bubble && t < a.bubble.until);
        const v = followVelocity(a, lead, scouting ? { gap: -110, speed: 230 } : a.leader ? { gap: 50 } : a.def.gap ? { gap: a.def.gap } : undefined);
        a.vx = approach(a.vx, v, 900 * dt);
        a.x += a.vx * dt;
        if (Math.abs(a.vx) > 8) a.facing = Math.sign(a.vx);
        else if (Math.abs(lead.x - a.x) > 10) a.facing = Math.sign(lead.x - a.x);
        if (Math.abs(lead.x - a.x) > 500) a.x = lead.x - lead.facing * 200; // never lost behind
      } else if (a !== player && !a.moveTo) {
        a.vx = approach(a.vx, 0, 900 * dt);
      }
      if (a.fade) {
        a.alpha = approach(a.alpha, a.fade.to, a.fade.speed * dt);
        if (a.alpha === a.fade.to) {
          if (a.fade.remove) actors.delete(a.id);
          a.fade = null;
        }
      }
      // animation choice
      const moving = Math.abs(a.vx) > 14;
      let anim = a.pose;
      if (!anim) {
        if (a === player && !player.onGround) anim = player.vy < 0 ? 'jump' : 'fall';
        else if (moving) anim = Math.abs(a.vx) > 175 ? 'run' : 'walk';
        else if (a === snooki && idleTime > 16 && frames.snooki.sleep) anim = 'sleep';
        else if (a === snooki && idleTime > 5) anim = Math.floor(idleTime / 4) % 3 === 2 && frames.snooki.wag ? 'wag' : 'sit';
        else if (a.mood && frames[a.kind][a.mood]) anim = a.mood; // a face that stays (a story beat, a reaction)
        else anim = a.def?.view && frames[a.kind][a.def.view] ? a.def.view : 'idle'; // e.g. Ryan waiting with his back turned
      }
      if (anim !== a.anim) {
        a.anim = anim;
        a.animT = 0;
      }
      a.animT += dt;
      // searching: a look one way, then the other
      if (a.anim === 'search' && !moving) {
        a.searchFacing ??= a.facing;
        a.facing = Math.floor(a.animT / 0.8) % 2 ? -a.searchFacing : a.searchFacing;
      } else a.searchFacing = undefined;
      // a watchful one (`watch: true`): standing still with nobody to face, a glance over the shoulder now and then
      const persona = PERSONAS[a.kind];
      // (someone shown from the back, `view`, keeps still: that moment is staged)
      const still = !moving && !a.pose && !a.moveTo && !a.rt && a !== player && !a.companion && !a.def?.view && playing;
      if ((a.def?.watch ?? persona?.watch) && still) {
        a.watchFacing ??= a.facing;
        a.facing = (t + a.x * 0.013) % 3.6 < 0.9 ? -a.watchFacing : a.watchFacing;
      } else if (persona?.glance && still && player) {
        // he notices her: a look toward her now and then, then back to what he was doing
        a.glanceFacing ??= a.facing;
        a.facing = (t + a.x * 0.017) % 5.2 < 1.3 ? Math.sign(player.x - a.x) || a.glanceFacing : a.glanceFacing;
      } else {
        a.watchFacing = undefined;
        a.glanceFacing = undefined;
      }
      if (a.lastFacing !== undefined && a.lastFacing !== a.facing) a.turnT = t; // a turn is drawn, not snapped
      a.lastFacing = a.facing;
      if (playing && a !== player) {
        routine(a);
        habit(a);
      }
    }

    // collectibles in the world
    for (const item of scene.items || []) {
      if (game.has(item.id) || !check(item.if, game)) continue;
      // the item must touch her body (feet … top of the head), so high stars need a jump
      const iy = item.y ?? GROUND - 40;
      if (Math.abs(player.x - item.x) < 24 && iy >= player.y - player.h - 6 && iy <= player.y + 4) {
        game.collect(item.id);
        audio.play('pickup');
        app.ui.announce?.([{ kind: 'collect', id: item.id }]);
      }
    }

    // triggers (once: remembered in the save; repeatable: re-armed after leaving the zone)
    for (const tr of scene.triggers || []) {
      const key = `t.${scene.id}.${tr.id}`;
      const inside = player.x >= tr.x1 && player.x <= tr.x2;
      if (tr.once === false && !inside) firedTriggers.delete(key);
      if (mode !== 'play' || !inside || firedTriggers.has(key)) continue;
      if (tr.once !== false && game.flag(key)) continue;
      if (!check(tr.if, game)) continue;
      firedTriggers.add(key);
      if (tr.once !== false) game.setFlag(key);
      run(tr.run);
      break;
    }

    // exits at the scene edges
    if (mode === 'play') {
      for (const ex of scene.exits || []) {
        const atEdge = ex.side === 'left' ? player.x <= 24 && dir < 0 : ex.side === 'right' ? player.x >= width - 24 && dir > 0 : false;
        if (!atEdge) continue;
        if (check(ex.if, game)) {
          run([{ goto: ex.to, x: ex.spawn }]);
        } else if (ex.locked && !ex._cooldown) {
          ex._cooldown = true;
          run(ex.locked).then(() => scope.timeout(() => (ex._cooldown = false), 800));
        }
        break;
      }
    }

    // interaction target
    let best = null;
    if (mode === 'play') {
      for (const it of interactables()) {
        if (!near(it)) continue;
        if (!best || Math.abs(it.x - player.x) < Math.abs(best.x - player.x)) best = it;
      }
    }
    if (best !== interactTarget) {
      interactTarget = best;
      emit('target', best);
    }

    // Snooki beside Ryan: steady and watchful — a short look around now and then, back to his side
    if (dogs.snooki === 'ryan' && playing && snooki.visible && !snooki.moveTo && t > nextWatch) {
      const home = dogs.ryanX - 58;
      const out = Math.abs(snooki.x - home) < 4;
      nextWatch = t + (out ? 4 : 9 + Math.random() * 5);
      snooki.pose = null; // a real walk there and back, never sliding in a pose
      snooki.moveTo = {
        x: out ? home - 70 : home,
        speed: 70,
        resolve: () => {
          snooki.facing = 1;
          snooki.pose = out ? 'sniff' : 'sit'; // looks around out there; sits once back beside Ryan
        },
      };
    }

    // idle tracking, Snooki's ambient remarks (only when he is walking with her)
    if (playing && Math.abs(player.vx) < 5 && player.onGround) idleTime += dt;
    else idleTime = 0;
    const ambient = scene.ambient?.filter((l) => check(l.if, game));
    if (playing && snooki.visible && snooki.companion && ambient?.length && idleTime > 7 && t - lastAmbient > 14) {
      lastAmbient = t;
      const line = ambient[Math.floor(Math.random() * ambient.length)];
      snooki.bubble = { text: fillNames(line.t, game), until: t + 3.6 };
      if (line.cue) audio.play(line.cue);
    }
    // …and when it is just Anji and her husky (Snooki with Ryan), the husky has her own say — her
    // lines, in turn (the scene's ambient lines are Snooki's voice)
    const husky = actors.get('husky');
    if (playing && !snooki.companion && husky?.companion && husky.visible && !husky.bubble && idleTime > 7 && t - lastAmbient > 14) {
      lastAmbient = t;
      husky.bubble = { text: HUSKY_AMBIENT[game.nextLine(lineKey(scene.id, 'husky-ambient'), HUSKY_AMBIENT.length)], until: t + 3.6 };
    }

    // camera
    let focus = player.x + player.facing * viewW * 0.08;
    if (camTarget?.between) {
      const xs = camTarget.between.map((id) => actors.get(id)?.x).filter(Number.isFinite);
      if (xs.length) focus = (Math.min(...xs) + Math.max(...xs)) / 2;
    } else if (camTarget) focus = camTarget.actor ? actors.get(camTarget.actor)?.x ?? focus : camTarget.x;
    const target = Math.max(0, Math.min(Math.max(0, width - viewW), focus - viewW / 2));
    camX += (target - camX) * Math.min(1, dt * (camTarget ? 3 : 5));
    // follow her upward when she climbs (her visible head ≈ 62 % of the sprite box)
    const wantTop = followTop(baseTop, viewH, player.y - player.h * 0.62);
    topY += (wantTop - topY) * Math.min(1, dt * 4);
    shake = Math.max(0, shake - dt);

    if (playing && Math.abs(player.vx) < 2) saveLocation();
  }

  // ── render ──
  function drawActor(a) {
    if (!a.visible || a.alpha <= 0.01) return;
    const k = KIND[a.kind];
    let list = framesFor(frames[a.kind], a.anim);
    // a run drawn with walk frames goes faster (a run with its own frames keeps its pace)
    const fps = a.anim === 'run' && !frames[a.kind].run ? k.fps * 1.7 : k.fps;
    let img = list[Math.floor(a.animT * fps) % list.length];
    if (a.anim === 'idle') {
      // slow breathing + occasional blink
      img = list[Math.floor(a.animT * 1.6) % list.length];
      a.blinkAt -= 1 / 60;
      if (a.blinkAt < 0 && frames[a.kind].blink) {
        img = frames[a.kind].blink[0];
        if (a.blinkAt < -0.12) a.blinkAt = 2.5 + Math.random() * 3.5;
      }
    }
    const h = a.h;
    const w = (img.width / img.height) * h;
    ctx.save();
    ctx.globalAlpha = a.alpha * (a.anim === 'hide' ? 0.62 : 1); // hiding: low, and half lost in the cover
    // soft shadow
    ctx.fillStyle = 'rgba(8,10,30,.35)';
    ctx.beginPath();
    ctx.ellipse(a.x, a.onGround === false ? GROUND + 2 : a.y + 2, w * 0.32, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(a.x, a.y + h * (1 - k.feet));
    motion(a);
    ctx.scale(a.facing < 0 ? -1 : 1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    // talking: a small mouth that opens and closes over a front-facing face (Season 2's people)
    if (t < (a.talkUntil ?? 0) && PERSONAS[a.kind]?.front && !CIRCLE_GESTURE_NAMES.has(a.anim) && a.anim !== 'walk' && !app.reduced()) {
      const open = Math.floor(t * 8) % 2 === 0;
      ctx.fillStyle = '#7a3530';
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.8 + h * 0.006, w * 0.035, open ? h * 0.014 : h * 0.005, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Runtime body language, drawn around the feet (no new art, no memory): a short jolt (hop, shake,
   * lunge toward where they face, squash, tilt) and, for someone with `idleFx: 'sway'`, a slow sway.
   */
  function motion(a) {
    if (app.reduced()) return;
    // a turn: a brief squeeze as they swing round, instead of a mirror-snap
    const turn = (t - (a.turnT ?? -9)) / 0.14;
    if (turn < 1) ctx.scale(0.65 + 0.35 * turn, 1);
    // each person's own walk (data/personas.js): a light bob, a bounce, a glide
    const gait = PERSONAS[a.kind]?.bob;
    if (gait && a.anim === 'walk') ctx.translate(0, -Math.abs(Math.sin(a.animT * 9)) * gait);
    if (a.anim === 'run') {
      // a run: a lean into it, and a quicker bounce
      ctx.rotate(a.facing * 0.07);
      ctx.translate(0, -Math.abs(Math.sin(a.animT * 15)) * (gait || 2) * 1.4);
    }
    if (a.anim === 'hide') ctx.scale(1, 0.86);
    if (a.anim === 'celebrate' && !frames[a.kind].celebrate) ctx.translate(0, -Math.abs(Math.sin(a.animT * 7)) * 12);
    if (a.anim === 'carry') ctx.rotate(a.facing * 0.03);
    if (a.def?.idleFx === 'sway' && a.anim !== 'walk' && a.anim !== 'run') ctx.rotate(Math.sin(t * 1.7 + a.x) * 0.035);
    const j = a.jolt;
    if (!j) return;
    const p = (t - j.t0) / (j.ms / 1000);
    if (p >= 1) {
      a.jolt = null;
      return;
    }
    const arc = Math.sin(Math.PI * p);
    if (j.type === 'hop') ctx.translate(0, -18 * arc);
    else if (j.type === 'shake') ctx.translate(Math.sin(p * 44) * 3.2 * (1 - p), 0);
    else if (j.type === 'lunge') {
      ctx.translate(a.facing * 16 * arc, 0);
      ctx.rotate(a.facing * 0.12 * arc);
    } else if (j.type === 'squash') ctx.scale(1 + 0.12 * arc, 1 - 0.12 * arc);
    else if (j.type === 'tilt') ctx.rotate(-a.facing * 0.14 * arc);
    else if (j.type === 'nod') ctx.rotate(a.facing * 0.06 * Math.abs(Math.sin(p * Math.PI * 2)));
    else if (j.type === 'rise') {
      // drawing herself up when challenged: taller and narrower, held, then a quick lean-in at the end
      const hold = Math.min(1, p * 4) * (p < 0.8 ? 1 : (1 - p) / 0.2);
      ctx.scale(1 - 0.05 * hold, 1 + 0.11 * hold);
      if (p > 0.8) ctx.translate(a.facing * 10 * Math.sin(Math.PI * (p - 0.8) * 5), 0);
    }
  }

  /** Little drawn particles over someone: sweat drops, a puff of steam, sparkles, dust at the feet. */
  function drawPuffs(a, head) {
    a.puffs = a.puffs.filter((p) => t < p.until);
    for (const p of a.puffs) {
      const age = t - p.t0;
      ctx.save();
      if (p.type === 'sweat') {
        ctx.fillStyle = '#8fd3ff';
        for (const [dx, dl] of [[14, 0], [-12, 0.35]]) {
          const f = ((age + dl) % 0.9) / 0.9;
          ctx.globalAlpha = 1 - f;
          ctx.beginPath();
          ctx.ellipse(a.x + dx, head + 18 + f * 16, 2.4, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'steam') {
        ctx.fillStyle = '#f2f2f7';
        for (let i = 0; i < 3; i++) {
          const f = ((age * 1.4 + i / 3) % 1);
          ctx.globalAlpha = 0.8 * (1 - f);
          ctx.beginPath();
          ctx.arc(a.x + (i - 1) * 9, head - 4 - f * 22, 4 + f * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = '#ffd86b';
        for (let i = 0; i < 4; i++) {
          const ang = age * 3 + (i * Math.PI) / 2;
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(age * 10 + i);
          ctx.fillRect(a.x + Math.cos(ang) * 20 - 1.5, head + 10 + Math.sin(ang) * 10 - 1.5, 3, 3);
        }
      } else if (p.type === 'papers') {
        // sheets thrown up, turning, drifting down
        for (let i = 0; i < 7; i++) {
          const f = Math.min(1, age / 1.6);
          const dx = (i - 3) * 16 * f + Math.sin(age * 3 + i) * 8;
          const dy = -60 * Math.sin(Math.PI * Math.min(1, f * 1.4)) + f * 40;
          ctx.save();
          ctx.globalAlpha = 1 - Math.max(0, f - 0.8) * 5;
          ctx.translate(a.x + dx, a.y - 40 + dy);
          ctx.rotate(age * (2 + i * 0.4));
          ctx.fillStyle = '#f7f5ee';
          ctx.fillRect(-6, -8, 12, 16);
          ctx.fillStyle = '#b9c2d6';
          ctx.fillRect(-4, -5, 8, 1.4);
          ctx.fillRect(-4, -1, 8, 1.4);
          ctx.restore();
        }
      } else if (p.type === 'dust') {
        ctx.fillStyle = '#c8b9a2';
        for (let i = 0; i < 4; i++) {
          const f = Math.min(1, age / 0.6);
          ctx.globalAlpha = 0.7 * (1 - f);
          ctx.beginPath();
          ctx.arc(a.x + (i - 1.5) * 10 * (1 + f), a.y - 4 - f * 8, 3 + f * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function drawOverlays() {
    for (const a of actors.values()) {
      if (!a.visible) continue;
      const head = a.y - a.h - 8;
      if (a.puffs.length) drawPuffs(a, head);
      // what she carries (Season 2: `hold:<thing>`), at her hand
      if (a === player && game.flag('s2:hold')) {
        ctx.save();
        ctx.translate(a.x + a.facing * 15, a.y - a.h * 0.45);
        if (/lamp|lantern/.test(String(game.flag('s2:hold')))) {
          // a hand lamp: a warm glow, a small glass body on a handle
          const glow = ctx.createRadialGradient(0, 4, 2, 0, 4, 46);
          glow.addColorStop(0, 'rgba(255, 214, 140, 0.55)');
          glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(-46, -42, 92, 92);
          ctx.strokeStyle = '#4a3a2a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -8, 5, Math.PI, 0);
          ctx.stroke();
          ctx.fillStyle = '#ffd98a';
          ctx.fillRect(-5, -6, 10, 13);
          ctx.fillStyle = '#4a3a2a';
          ctx.fillRect(-6, 7, 12, 3);
        } else {
          ctx.rotate(a.facing * 0.2);
          ctx.fillStyle = '#f7f5ee';
          ctx.fillRect(-7, -9, 14, 18);
          ctx.strokeStyle = '#8b93a8';
          ctx.lineWidth = 1;
          ctx.strokeRect(-7, -9, 14, 18);
        }
        ctx.restore();
      }
      if (a.emote && t < a.emote.until) {
        const bob = Math.sin(t * 8) * 2;
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(a.x, head - 10 + bob, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = a.emote.icon === '!' ? '#e2405f' : '#2b2340';
        ctx.font = '700 15px "Baloo Bhaijaan 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.emote.icon, a.x, head - 9 + bob);
        ctx.restore();
      } else a.emote = null;
      if (a.bubble && t < a.bubble.until) {
        ctx.save();
        ctx.font = '600 11px "Baloo Bhaijaan 2", sans-serif';
        ctx.direction = 'rtl';
        // as many lines as it takes to stay inside the view (a phone shows only ~180 units)
        const maxW = Math.min(200, viewW - 40);
        const lines = bubbleLines(a.bubble.text, (s) => ctx.measureText(s).width, maxW);
        const tw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)));
        const lh = 14;
        const bh = lines.length * lh + 10;
        const bx = Math.max(camX + tw / 2 + 12, Math.min(camX + viewW - tw / 2 - 12, a.x));
        const by = head - 16; // the bubble's bottom edge sits at by + 10, as it always has
        ctx.fillStyle = 'rgba(255,247,236,.96)';
        ctx.beginPath();
        ctx.roundRect?.(bx - tw / 2 - 10, by + 10 - bh, tw + 20, bh, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(a.x - 5, by + 9);
        ctx.lineTo(a.x, by + 16);
        ctx.lineTo(a.x + 5, by + 9);
        ctx.fill();
        ctx.fillStyle = '#2b2340';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((l, i) => ctx.fillText(l, bx, by + 10 - bh + 5 + lh * (i + 0.5), maxW));
        ctx.restore();
      } else a.bubble = null;
    }
    if (mode === 'play') {
      for (const it of interactables()) {
        if (it === interactTarget || it.x < camX - 20 || it.x > camX + viewW + 20 || !glows(it)) continue;
        const y = (it.y ?? GROUND) - (it.h || 90) - 8;
        const tw = app.reduced() ? 0.8 : 0.55 + 0.45 * Math.sin(t * 3 + it.x * 0.01);
        P.sparkle(ctx, it.x + 10, y, 5 + tw * 3, 0.5 + tw * 0.5);
      }
    }
    if (interactTarget && mode === 'play') drawPrompt(interactTarget);
  }

  /**
   * "You can examine this": a labelled pill above the object (icon + its
   * Arabic name) pointing down at it. It used to be a bare 10-unit white disc
   * with a 12 px emoji in a non-emoji font, which read as a debug marker
   * floating over her head. Kept inside the visible frame.
   */
  function drawPrompt(it) {
    const bob = app.reduced() ? 0 : Math.sin(t * 4) * 1.5;
    const label = fillNames(it.label || '', game);
    ctx.save();
    ctx.font = PROMPT_FONT;
    ctx.direction = 'rtl';
    const lw = label ? Math.min(110, ctx.measureText(label).width) : 0;
    const w = 22 + (label ? lw + 8 : 0);
    const h = 20;
    const objTop = (it.y ?? GROUND) - (it.h || 90);
    const y = Math.max(topY + 6, Math.min(objTop - h - 8, GROUND - 120)) + bob;
    const x = Math.max(camX + w / 2 + 6, Math.min(camX + viewW - w / 2 - 6, it.x));
    ctx.shadowColor = 'rgba(8,10,30,.45)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(255,247,236,.97)';
    ctx.beginPath();
    ctx.roundRect?.(x - w / 2, y, w, h, h / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // pointer to the object
    const px = Math.max(x - w / 2 + 8, Math.min(x + w / 2 - 8, it.x));
    ctx.beginPath();
    ctx.moveTo(px - 4, y + h - 0.5);
    ctx.lineTo(px, y + h + 5);
    ctx.lineTo(px + 4, y + h - 0.5);
    ctx.fill();
    ctx.strokeStyle = '#e9b949';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect?.(x - w / 2, y, w, h, h / 2);
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = PROMPT_ICON_FONT;
    const iconX = x + w / 2 - 11;
    ctx.fillText(it.icon || '✋', iconX, y + h / 2 + 0.5);
    if (label) {
      ctx.font = PROMPT_FONT;
      ctx.fillStyle = '#2b2340';
      ctx.textAlign = 'right';
      ctx.fillText(label, iconX - 10, y + h / 2 + 1, 110);
    }
    ctx.restore();
  }

  function render() {
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, -topY * pixelScale);
    const theme = painter.theme;
    painter.drawBack(ctx, camX, viewW, pixelScale, topY, Math.min(baseTop, MIN_TOP), baseTop);
    ctx.save();
    const sx = shake > 0 ? Math.sin(t * 60) * 3 * shake : 0;
    ctx.translate(-camX + sx, 0);
    for (const pl of platforms()) if (!pl.hidden) P.stoneLedge(ctx, pl.x, pl.y, pl.w);
    // scene drawings: behind the people, or (`front: true`) over them — darkness and light pools, for one
    const drawDynamic = (front) => {
      for (const d of scene.dynamic || []) {
        if (!d.front !== !front) continue;
        if (d.x + (d.reach ?? 200) < camX || d.x - (d.reach ?? 200) > camX + viewW) continue;
        if (check(d.if, game)) d.draw(ctx, { t, game, P, x: d.x, world: api, camX, viewW });
      }
    };
    drawDynamic(false);
    for (const item of scene.items || []) {
      if (game.has(item.id) || !check(item.if, game)) continue;
      const iy = item.y ?? GROUND - 40;
      const group = item.id.split('.')[0];
      if (group === 'note') P.paper(ctx, item.x, iy, t);
      else if (group === 'seed') P.seedPouch(ctx, item.x, iy, t);
      else P.star(ctx, item.x, iy, 8, '#ffe28a', t);
    }
    [...actors.values()].sort((a, b) => a.z - b.z).forEach(drawActor);
    drawDynamic(true);
    ctx.restore();
    painter.drawFront(ctx, camX, viewW);
    ctx.save();
    ctx.translate(-camX + sx, 0);
    drawOverlays();
    ctx.restore();
    // cinema bars for a set piece, eased in and out (back to play: they always leave)
    letterbox.k = approach(letterbox.k, mode === 'play' ? 0 : letterbox.to, 1 / 30);
    if (mode === 'play') letterbox.to = 0;
    if (letterbox.k > 0.001) {
      ctx.save();
      ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
      ctx.fillStyle = '#05060f';
      const bar = viewH * 0.1 * letterbox.k;
      ctx.fillRect(0, 0, viewW, bar);
      ctx.fillRect(0, viewH - bar, viewW, bar);
      ctx.restore();
    }
  }

  const loop = scope.loop((dt) => {
    if (!paused) update(dt);
    render();
    input.endFrame();
  });

  const api = {
    canvas,
    scene,
    /** Whether the cinema bars are wanted (a set piece is on). */
    get letterbox() {
      return letterbox.to;
    },
    get mode() {
      return mode;
    },
    get player() {
      return player;
    },
    actor: (id) => actors.get(id),
    get camX() {
      return camX;
    },
    get viewW() {
      return viewW;
    },
    get viewH() {
      return viewH;
    },
    get topY() {
      return topY;
    },
    get reduced() {
      return app.reduced();
    },
    /** The app (scene content can open panels: games table, boards…). */
    get app() {
      return app;
    },
    get interactTarget() {
      return interactTarget;
    },
    /** Interactables currently on screen that still twinkle (tips, tests). */
    visibleGlows: () => interactables().filter((it) => it.x > camX && it.x < camX + viewW && glows(it)),
    start() {
      loop.start();
      if (scene.enter) run(scene.enter);
    },
    pause() {
      paused = true;
      input.releaseAll();
      loop.stop();
      render();
    },
    resume() {
      paused = false;
      loop.start();
    },
    run,
    interact: () => interact(interactTarget),
    /** Where a world point is on screen (CSS pixels), the inverse of the canvas's tap mapping. */
    toScreen(x, y) {
      const r = canvas.getBoundingClientRect();
      const k = r.width / viewW;
      return { x: r.left + (x - camX) * k, y: r.top + (y - topY) * k };
    },
    /** Tap at a world point (tests; the canvas does the same from screen coordinates). */
    tapAt: (x, y) => (mode === 'play' && !paused ? tapAt({ x, y }) : null),
    snookiReact: () => snookiReact(),
    huskyReact: () => huskyReact(),
    on(type, fn) {
      listeners[type].push(fn);
    },
    /** Advance the simulation manually (tests). */
    /** Re-dress Anji and Snooki after a wardrobe change. */
    async refreshCosmetics() {
      for (const kind of ['anji', 'snooki']) {
        // a new look is a new cache entry; the cache releases the old frames once these are ready
        frames[kind] = await spriteFrames(kind, game.state.cosmetics);
      }
    },
    tick(dt, frames = 1) {
      for (let i = 0; i < frames; i++) update(dt);
    },
    saveLocation: () => saveLocation(true),
    dispose() {
      loop.stop();
      painter.dispose();
      // the sprite frames are not this scene's to release: they stay in the shared cache for the next
      canvas.remove();
      releaseCanvas(canvas);
    },
  };
  scope.add(() => api.dispose());
  return api;
}
