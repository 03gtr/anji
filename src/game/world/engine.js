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
import { createPainter } from './painter.js';
import { frameCamera, followTop, MIN_TOP } from './camera.js';
import { stepBody, followVelocity, approach } from './physics.js';
import { frameTable, rasterize, RASTER_HEIGHT } from '../characters/sprites.js';
import { check } from '../core/conditions.js';
import { applyEffects } from '../core/effects.js';
import { fillNames } from '../core/names.js';
import { PROP_DRAWERS } from './prop-drawers.js';
import { dogsIn } from '../data/companions.js';

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
/** Anji's husky: like her — curious, quick, playful, a little mischievous (she acts more than she talks). */
export const HUSKY_TAPS = [
  { pose: 'sniff', text: '👃… ؟', scout: true },
  { pose: 'excited', text: 'أووو! 🐾' },
  { pose: 'wag', text: '😏', scout: true },
  { pose: 'celebrate', text: '✨🦋' },
  { pose: 'sit', text: '👀' },
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
    tables.map(async ([k, table]) => {
      frames[k] = await rasterize(table, {
        height: RASTER_HEIGHT[k],
        onProgress: () => onProgress?.(++loaded, totalFrames),
      });
    }),
  );
  if (scope.disposed) return null;

  /** Sprites for an actor kind that appears mid-scene (e.g. a cutscene spawn). */
  async function ensureFrames(kind) {
    if (frames[kind]) return;
    frames[kind] = await rasterize(frameTable(kind, game.state.cosmetics), { height: RASTER_HEIGHT[kind] });
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
      alpha: def.alpha ?? 1,
      visible: true,
      z: def.z ?? 1,
      emote: null,
      bubble: null,
      blinkAt: 2 + Math.random() * 3,
      companion: Boolean(def.companion),
      def,
    };
    actors.set(a.id, a);
    return a;
  }
  const player = addActor({ id: 'anji', kind: 'anji', x: spawnX ?? scene.spawn ?? 200, z: 2 });
  const snooki = addActor({
    id: 'snooki',
    kind: 'snooki',
    x: dogs.snooki === 'ryan' ? dogs.ryanX - 58 : player.x - 70,
    companion: dogs.snooki === 'follow',
    z: 3,
  });
  if (dogs.snooki === 'away' || (scene.snookiHidden && check(scene.snookiHidden, game))) snooki.visible = false;
  if (dogs.snooki === 'ryan') {
    snooki.facing = 1;
    snooki.pose = 'sit';
  }
  // her own dog walks with her (a little further back when Snooki walks too)
  if (dogs.husky === 'follow') addActor({ id: 'husky', kind: 'husky', x: player.x - 120, companion: true, gap: dogs.snooki === 'follow' ? 118 : 62, z: 3 });
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
  let nextWatch = 8; // Snooki's first look around (beside Ryan)
  let lastAmbient = 0;
  let lastLocationSave = 0;
  const firedTriggers = new Set();
  const listeners = { target: [], mode: [] };

  const platforms = () => (scene.platforms || []).filter((p) => check(p.if, game));
  const solids = () => (scene.blockers || []).filter((b) => check(b.if, game));
  const interactables = () => (scene.interact || []).filter((it) => check(it.if, game));

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
    if (act.if !== undefined && !('then' in act) && !('else' in act) && !act.puzzle && !act.game && act.memory === undefined) {
      if (!check(act.if, game)) return;
    }
    if ('then' in act && !act.puzzle && !act.game && act.memory === undefined) {
      return runActions(check(act.if, game) ? act.then : act.else || []);
    }
    if (act.say) return app.ui.dialogue(act.say);
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
      const p = moveActor(a, act.x, act.speed);
      return act.async ? undefined : p;
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
      if (act.for) {
        await scope.wait(act.for);
        a.pose = null;
      }
      return;
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
    const cases = it.cases || [{ run: it.run }];
    const chosen = cases.find((c) => check(c.if, game));
    if (chosen) run(chosen.run);
  }

  function saveLocation(force = false) {
    if (!force && t - lastLocationSave < 8) return;
    lastLocationSave = t;
    game.setLocation(scene.id, player.x);
  }

  /** Tap on a dog: a short pose + line from its own list (never blocks play). */
  const busyUntil = {};
  function dogReact(a, list, key) {
    if (!a || t < (busyUntil[a.id] ?? 0) || !a.visible) return false;
    const r = list[game.nextLine(key, list.length)];
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
  const snookiReact = () => dogReact(snooki, dogs.snooki === 'ryan' ? SNOOKI_RYAN_TAPS : SNOOKI_TAPS, dogs.snooki === 'ryan' ? 'snooki-ryan-tap' : 'snooki-tap');
  const huskyReact = () => dogReact(actors.get('husky'), HUSKY_TAPS, 'husky-tap');
  const onDog = (a, p) => a && a.visible && Math.abs(p.x - a.x) < 30 && p.y > a.y - a.h && p.y < a.y + 8;

  // ── input: tap a thing to walk to it and use it; tap ground to walk there ──
  scope.on(canvas, 'pointerup', (e) => {
    if (mode !== 'play' || paused) return;
    const p = screenToWorld(e.clientX, e.clientY);
    if (onDog(snooki, p) && snookiReact()) return;
    if (onDog(actors.get('husky'), p) && huskyReact()) return;
    const hit = interactables()
      .filter((it) => Math.abs(p.x - it.x) <= Math.max(26, (it.w || 40) / 2 + 10) && p.y >= (it.y ?? GROUND) - (it.h || 140) - 20 && p.y <= GROUND + 40)
      .sort((a, b) => Math.abs(p.x - a.x) - Math.abs(p.x - b.x))[0];
    if (hit) {
      if (near(hit)) interact(hit);
      else autoWalk = { x: hit.x - Math.sign(hit.x - player.x) * ((hit.w || 40) / 2 + 12), then: hit };
    } else if (p.y > GROUND - 160) {
      autoWalk = { x: Math.max(20, Math.min(width - 20, p.x)), then: null };
    }
  });

  // ── update ──
  function update(dt) {
    t += dt;
    const playing = mode === 'play' && !paused;

    // player control
    let dir = 0;
    let jump = false;
    if (playing) {
      if (input.down('left')) dir -= 1;
      if (input.down('right')) dir += 1;
      jump = input.take('jump') || input.take('up');
      if (dir !== 0 || jump) autoWalk = null;
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
      } else if (a.companion && a.visible && mode === 'play') {
        const scouting = a.id === 'husky' && idleTime > 3;
        const v = followVelocity(a, player, scouting ? { gap: -110, speed: 230 } : a.def.gap ? { gap: a.def.gap } : undefined);
        a.vx = approach(a.vx, v, 900 * dt);
        a.x += a.vx * dt;
        if (Math.abs(a.vx) > 8) a.facing = Math.sign(a.vx);
        else if (Math.abs(player.x - a.x) > 10) a.facing = Math.sign(player.x - a.x);
        if (Math.abs(player.x - a.x) > 500) a.x = player.x - player.facing * 200; // never lost behind
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
        else if (moving) anim = Math.abs(a.vx) > 175 && frames[a.kind].run ? 'run' : 'walk';
        else if (a === snooki && idleTime > 16 && frames.snooki.sleep) anim = 'sleep';
        else if (a === snooki && idleTime > 5) anim = Math.floor(idleTime / 4) % 3 === 2 && frames.snooki.wag ? 'wag' : 'sit';
        else anim = a.def?.view && frames[a.kind][a.def.view] ? a.def.view : 'idle'; // e.g. Ryan waiting with his back turned
      }
      if (anim !== a.anim) {
        a.anim = anim;
        a.animT = 0;
      }
      a.animT += dt;
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
      snooki.pose = out ? 'sniff' : 'sit';
      snooki.moveTo = { x: out ? home - 70 : home, speed: 70, resolve: () => (snooki.facing = 1) };
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

    // camera
    let focus = player.x + player.facing * viewW * 0.08;
    if (camTarget) focus = camTarget.actor ? actors.get(camTarget.actor)?.x ?? focus : camTarget.x;
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
    let list = frames[a.kind][a.anim] || frames[a.kind].idle;
    let img = list[Math.floor(a.animT * k.fps) % list.length];
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
    ctx.globalAlpha = a.alpha;
    // soft shadow
    ctx.fillStyle = 'rgba(8,10,30,.35)';
    ctx.beginPath();
    ctx.ellipse(a.x, a.onGround === false ? GROUND + 2 : a.y + 2, w * 0.32, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(a.x, a.y + h * (1 - k.feet));
    ctx.scale(a.facing < 0 ? -1 : 1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
  }

  function drawOverlays() {
    for (const a of actors.values()) {
      if (!a.visible) continue;
      const head = a.y - a.h - 8;
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
        const tw = Math.min(200, ctx.measureText(a.bubble.text).width);
        const bx = Math.max(camX + tw / 2 + 12, Math.min(camX + viewW - tw / 2 - 12, a.x));
        const by = head - 16;
        ctx.fillStyle = 'rgba(255,247,236,.96)';
        ctx.beginPath();
        ctx.roundRect?.(bx - tw / 2 - 10, by - 14, tw + 20, 24, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(a.x - 5, by + 9);
        ctx.lineTo(a.x, by + 16);
        ctx.lineTo(a.x + 5, by + 9);
        ctx.fill();
        ctx.fillStyle = '#2b2340';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.bubble.text, bx, by - 1, 200);
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
    for (const d of scene.dynamic || []) {
      if (d.x + (d.reach ?? 200) < camX || d.x - (d.reach ?? 200) > camX + viewW) continue;
      if (check(d.if, game)) d.draw(ctx, { t, game, P, x: d.x, world: api });
    }
    for (const item of scene.items || []) {
      if (game.has(item.id) || !check(item.if, game)) continue;
      const iy = item.y ?? GROUND - 40;
      const group = item.id.split('.')[0];
      if (group === 'note') P.paper(ctx, item.x, iy, t);
      else if (group === 'seed') P.seedPouch(ctx, item.x, iy, t);
      else P.star(ctx, item.x, iy, 8, '#ffe28a', t);
    }
    [...actors.values()].sort((a, b) => a.z - b.z).forEach(drawActor);
    ctx.restore();
    painter.drawFront(ctx, camX, viewW);
    ctx.save();
    ctx.translate(-camX + sx, 0);
    drawOverlays();
    ctx.restore();
  }

  const loop = scope.loop((dt) => {
    if (!paused) update(dt);
    render();
    input.endFrame();
  });

  const api = {
    canvas,
    scene,
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
    snookiReact: () => snookiReact(),
    huskyReact: () => huskyReact(),
    on(type, fn) {
      listeners[type].push(fn);
    },
    /** Advance the simulation manually (tests). */
    /** Re-dress Anji and Snooki after a wardrobe change. */
    async refreshCosmetics() {
      for (const kind of ['anji', 'snooki']) {
        frames[kind] = await rasterize(frameTable(kind, game.state.cosmetics), { height: RASTER_HEIGHT[kind] });
      }
    },
    tick(dt, frames = 1) {
      for (let i = 0; i < frames; i++) update(dt);
    },
    saveLocation: () => saveLocation(true),
    dispose() {
      loop.stop();
      painter.dispose();
      canvas.remove();
    },
  };
  scope.add(() => api.dispose());
  return api;
}
