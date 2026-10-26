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
import { stepBody, followVelocity, approach } from './physics.js';
import { frameTable, rasterize, RASTER_HEIGHT } from '../characters/sprites.js';
import { check } from '../core/conditions.js';
import { applyEffects } from '../core/effects.js';
import { PROP_DRAWERS } from './prop-drawers.js';

const KIND = {
  anji: { h: 112, w: 34, feet: 196 / 200, fps: 9 },
  snooki: { h: 64, w: 60, feet: 106 / 110, fps: 11 },
  ryan: { h: 114, w: 34, feet: 195 / 200, fps: 8 },
  shadow: { h: 114, w: 34, feet: 195 / 200, fps: 8 },
  needle: { h: 78, w: 40, feet: 166 / 170, fps: 8 },
};

const REACH = 34; // how close (beyond an object's half width) counts as "next to it"

export async function createWorld(host, scene, app, { spawnX, onProgress } = {}) {
  const { game, audio, input, scope } = app;
  const canvas = document.createElement('canvas');
  canvas.className = 'world-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', scene.title);
  host.append(canvas);
  const ctx = canvas.getContext('2d');

  // ── sprites (decoded before play: genuine progress) ──
  const kinds = new Set(['anji', 'snooki', ...(scene.actors || []).map((a) => a.kind)]);
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
  const snooki = addActor({ id: 'snooki', kind: 'snooki', x: player.x - 70, companion: true, z: 3 });
  if (scene.snookiHidden && check(scene.snookiHidden, game)) snooki.visible = false;
  for (const def of scene.actors || []) if (check(def.if, game)) addActor(def);

  // ── state ──
  const width = scene.width;
  let viewW = 400;
  let topY = 0;
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
    // fit the 300-unit-tall scene; on narrow portrait phones zoom in so the
    // characters are big enough (≥ 250 units of width), and let the sky fill
    // the remaining height above
    const k = Math.min(cssH / VIEW_H, cssW / (cssW < cssH ? 250 : 360));
    viewW = cssW / k;
    topY = VIEW_H - cssH / k;
    pixelScale = k * dpr;
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
  const near = (it, a = player) => Math.abs(a.x - it.x) <= (it.w || 40) / 2 + REACH && a.y >= (it.y ?? GROUND) - (it.h || 140);

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
    if (act.if !== undefined && !('then' in act) && !('else' in act) && !act.puzzle && !act.game) {
      if (!check(act.if, game)) return;
    }
    if ('then' in act && !act.puzzle && !act.game) {
      return runActions(check(act.if, game) ? act.then : act.else || []);
    }
    if (act.say) return app.ui.dialogue(act.say);
    if (act.fx) {
      const changes = applyEffects(act.fx, game);
      app.ui.announce?.(changes);
      return;
    }
    if (act.puzzle) {
      const res = await app.ui.puzzle(act.puzzle);
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
      if (a) a.bubble = { text: act.text, until: t + (act.ms ?? 2600) / 1000 };
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

  function interact(it) {
    if (!it || mode !== 'play') return;
    audio.play('tap');
    const cases = it.cases || [{ run: it.run }];
    const chosen = cases.find((c) => check(c.if, game));
    if (chosen) run(chosen.run);
  }

  function saveLocation(force = false) {
    if (!force && t - lastLocationSave < 8) return;
    lastLocationSave = t;
    game.setLocation(scene.id, player.x);
  }

  // ── input: tap a thing to walk to it and use it; tap ground to walk there ──
  scope.on(canvas, 'pointerup', (e) => {
    if (mode !== 'play' || paused) return;
    const p = screenToWorld(e.clientX, e.clientY);
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
        const v = followVelocity(a, player);
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
        else if (a === snooki && idleTime > 5) anim = 'sit';
        else anim = 'idle';
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

    // idle tracking, Snooki's ambient remarks
    if (playing && Math.abs(player.vx) < 5 && player.onGround) idleTime += dt;
    else idleTime = 0;
    const ambient = scene.ambient?.filter((l) => check(l.if, game));
    if (playing && ambient?.length && idleTime > 7 && t - lastAmbient > 14) {
      lastAmbient = t;
      const line = ambient[Math.floor(Math.random() * ambient.length)];
      snooki.bubble = { text: line.t, until: t + 3.6 };
      if (line.cue) audio.play(line.cue);
    }

    // camera
    let focus = player.x + player.facing * viewW * 0.08;
    if (camTarget) focus = camTarget.actor ? actors.get(camTarget.actor)?.x ?? focus : camTarget.x;
    const target = Math.max(0, Math.min(Math.max(0, width - viewW), focus - viewW / 2));
    camX += (target - camX) * Math.min(1, dt * (camTarget ? 3 : 5));
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
    if (interactTarget && mode === 'play') {
      const it = interactTarget;
      const y = (it.y ?? GROUND) - (it.h || 90) - 14 + Math.sin(t * 5) * 3;
      ctx.save();
      ctx.fillStyle = 'rgba(255,247,236,.95)';
      ctx.beginPath();
      ctx.arc(it.x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9437a';
      ctx.font = '700 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.icon || '✋', it.x, y + 1);
      ctx.restore();
    }
  }

  function render() {
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, -topY * pixelScale);
    const theme = painter.theme;
    painter.drawBack(ctx, camX, viewW, pixelScale, topY);
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
    get interactTarget() {
      return interactTarget;
    },
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
