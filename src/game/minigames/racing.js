/**
 * Road of Blue Lights — V2 third-person pseudo-3D race.
 *
 * Chase camera behind an original low, wide coupe (four round tail lights,
 * a small rear wing, quad exhausts — inspired by Japanese grand tourers, no
 * real badges or logos; a tiny blue rose instead). Anji drives, Snooki
 * navigates: he calls the bends, the checkpoints and the boost.
 *
 * Controls: ◀ ▶ buttons, drag on the road, or arrow keys / A D; ⚡ (Space /
 * ↑) fires the boost when the meter is full; ↓ / S brakes. Throttle is
 * automatic. Rules live in racing-logic.js (pure, unit-tested).
 */
import { TRACKS, CAR, SEG, createRaceController, raceMedal, beatRival, curveAhead } from './racing-logic.js';
import { h, esc, ICONS } from '../ui/dom.js';
import { num, raceTime } from '../ui/format.js';
import { snookiPortrait } from '../characters/snooki.js';
import { rng } from '../core/rng.js';

export const CAR_COLORS = { cobalt: '#1f4fd1', midnight: '#1a1f5e', rose: '#e0567f', pearl: '#e9e7f2', emerald: '#13806a' };

const THEMES = {
  moon: { sky: ['#070a2a', '#1b2160', '#4b3f8e'], grass: ['#14302c', '#183630'], rumble: ['#e9e7f2', '#2f5fd0'], road: ['#2a2d44', '#2e3149'], lane: '#9fd7ff', hills: '#141a48', fog: '#1b2160' },
  rose: { sky: ['#1d1442', '#5a2f6e', '#b35f7e'], grass: ['#1c3a30', '#21443a'], rumble: ['#fff3f6', '#e0567f'], road: ['#2c2a40', '#302e46'], lane: '#ffd2e0', hills: '#2a1d4a', fog: '#5a2f6e' },
  bridge: { sky: ['#03051a', '#101650', '#2b2f6e'], grass: ['#0f1c2c', '#122133'], rumble: ['#e9e7f2', '#c9304a'], road: ['#23263a', '#272a40'], lane: '#ffe28a', hills: '#0b1030', fog: '#101650' },
  night: { sky: ['#05071f', '#141a4a', '#36306a'], grass: ['#10231f', '#132925'], rumble: ['#e9e7f2', '#13806a'], road: ['#262838', '#2a2c3e'], lane: '#b6ff9e', hills: '#0d1236', fog: '#141a4a' },
};

const DIFF_LABELS = [['easy', 'سهلة'], ['normal', 'عادية'], ['hard', 'صعبة']];
const DRAW_DISTANCE = 220;
const CAM_DEPTH = 0.84;
const PLAYER_DIST = 840; // camera → player (world units)

export function mount(area, { app, scope, options, hud, finish }) {
  const track = TRACKS[options.track || 'moon'];
  const theme = THEMES[track.theme] || THEMES.moon;
  const settings = app.settings;
  const reduced = () => app.reduced();
  let ctl = createRaceController(track, { difficulty: settings.get().raceDifficulty, countdown: 3 });
  let started = false;
  let hostPaused = false;
  let t = 0;
  let skyOffset = 0;
  let steerHeld = 0;
  let finger = null; // road units
  let brake = false;
  let boostPressed = false;
  let lastCall = -10;
  let lastCountShown = null;
  let finished = false;
  let rivalPassed = false;
  let rivalSeen = false;
  const color = CAR_COLORS[app.game.state.cosmetics.carColor] || CAR_COLORS.cobalt;

  const wrap = h(`<div class="race3d" data-track="${track.id}">
      <canvas class="race-canvas" aria-label="سباق: ${esc(track.name)}"></canvas>
      <div class="race-hud" aria-hidden="true">
        <div class="rh-bar"><i class="rh-fill"></i>${track.checkpoints.map((z) => `<b class="rh-cp" style="--p:${z / track.length}"></b>`).join('')}${track.rival ? '<span class="rh-rival"></span>' : ''}<span class="rh-me"></span></div>
        <div class="rh-row"><span class="rh-time">0:00.0</span><span class="rh-speed"><b>0</b> كم/س</span></div>
        <div class="rh-meter" title="التسارع"><i></i><span>⚡</span></div>
      </div>
      <div class="race-nav" aria-live="polite" hidden><span class="race-nav-face">${snookiPortrait({ expr: 'happy', hat: app.game.state.cosmetics.snookiHat })}</span><p></p></div>
      <div class="race-count" aria-live="assertive"></div>
      <div class="race-ready card">
        <p class="race-ready-line">${esc(options.readyLine || 'سنوكي: «اليوم إنتِ تسوقين، وأنا مسؤول الملاحة. وإذا ضعنا، نگول الطريق هو اللي غلطان.»')}</p>
        <p class="field-label">الصعوبة</p>
        <div class="seg" role="radiogroup" aria-label="صعوبة السياقة">${DIFF_LABELS.map(([v, l]) => `<button type="button" role="radio" data-diff="${v}" aria-checked="${ctl.difficulty === v}">${l}</button>`).join('')}</div>
        <p class="muted small race-diff-note"></p>
        <button type="button" class="btn btn-primary btn-big" data-go>انطلقي 🏁</button>
      </div>
      <div class="race-pad">
        <button type="button" class="pad-btn race-steer" data-steer="-1" aria-label="لفّي يسار">${ICONS.left}</button>
        <button type="button" class="pad-btn race-boost" data-boost aria-label="تسارع" disabled>⚡</button>
        <button type="button" class="pad-btn race-steer" data-steer="1" aria-label="لفّي يمين">${ICONS.right}</button>
      </div>
    </div>`);
  area.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const nav = wrap.querySelector('.race-nav');
  const countEl = wrap.querySelector('.race-count');
  const ready = wrap.querySelector('.race-ready');
  const boostBtn = wrap.querySelector('[data-boost]');
  const timeEl = wrap.querySelector('.rh-time');
  const speedEl = wrap.querySelector('.rh-speed b');
  const meterEl = wrap.querySelector('.rh-meter i');
  const meEl = wrap.querySelector('.rh-me');
  const fillEl = wrap.querySelector('.rh-fill');
  const rivalEl = wrap.querySelector('.rh-rival');
  const diffNote = wrap.querySelector('.race-diff-note');

  const NOTES = { easy: 'سيارات أقل، والمقود يرجّعچ للطريق.', normal: 'مثل ما صممها ريان.', hard: 'زحمة أكثر، ومنعطفات تسحب أقوى.' };
  const renderDiff = () => {
    wrap.querySelectorAll('[data-diff]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.diff === ctl.difficulty)));
    diffNote.textContent = NOTES[ctl.difficulty];
  };
  renderDiff();
  wrap.querySelectorAll('[data-diff]').forEach((b) =>
    scope.on(b, 'click', () => {
      settings.set({ raceDifficulty: b.dataset.diff });
      ctl.retry(b.dataset.diff);
      renderDiff();
      app.audio.play('tap');
    }),
  );
  scope.on(wrap.querySelector('[data-go]'), 'click', () => {
    app.audio.unlock();
    ready.hidden = true;
    started = true;
    say(track.rival ? 'سيارة رصاصية قدّامنا… ريحتها مألوفة. دوسي!' : 'يلا! أنا أراقب المنعطفات.', 3);
  });

  /* ── layout ── */
  let W = 360;
  let H = 640;
  let dpr = 1;
  let view = null;
  function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const portrait = H > W * 1.05;
    const horizon = H * (portrait ? 0.32 : 0.4);
    const halfRoadFrac = portrait ? 0.5 : 0.3;
    // keep the car clear of the touch buttons at the bottom
    const groundY = H * (portrait ? 0.8 : 0.84);
    const unit = W / 2; // square pixels: same factor for x and y
    const roadW = (halfRoadFrac * W) / ((CAM_DEPTH / PLAYER_DIST) * unit);
    view = { portrait, horizon, roadW, unit, camHeight: (groundY - horizon) / ((CAM_DEPTH / PLAYER_DIST) * unit), groundY, carW: W * (portrait ? 0.42 : 0.22) };
  }
  resize();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    scope.add(() => ro.disconnect());
  }

  /* ── input ── */
  const held = new Map();
  const updateSteer = () => {
    steerHeld = Math.max(-1, Math.min(1, [...held.values()].reduce((a, b) => a + b, 0)));
  };
  wrap.querySelectorAll('[data-steer]').forEach((b) => {
    const v = Number(b.dataset.steer);
    scope.on(b, 'pointerdown', (e) => {
      e.preventDefault();
      b.setPointerCapture?.(e.pointerId);
      held.set(`p${e.pointerId}`, v);
      b.classList.add('is-down');
      updateSteer();
    });
    const up = (e) => {
      held.delete(`p${e.pointerId}`);
      b.classList.remove('is-down');
      updateSteer();
    };
    scope.on(b, 'pointerup', up);
    scope.on(b, 'pointercancel', up);
    scope.on(b, 'lostpointercapture', up);
  });
  scope.on(boostBtn, 'click', () => {
    boostPressed = true;
  });
  const roadUnitsAt = (clientX) => {
    const r = canvas.getBoundingClientRect();
    const halfRoad = (CAM_DEPTH / PLAYER_DIST) * view.unit * view.roadW;
    return camRoadX() + (clientX - r.left - W / 2) / halfRoad;
  };
  scope.on(canvas, 'pointerdown', (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    finger = roadUnitsAt(e.clientX);
  });
  scope.on(canvas, 'pointermove', (e) => {
    if (finger !== null) finger = roadUnitsAt(e.clientX);
  });
  const lift = () => {
    finger = null;
  };
  scope.on(canvas, 'pointerup', lift);
  scope.on(canvas, 'pointercancel', lift);
  const KEYS = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };
  scope.on(document, 'keydown', (e) => {
    if (KEYS[e.code] != null) {
      e.preventDefault();
      held.set(`k${e.code}`, KEYS[e.code]);
      updateSteer();
    } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (!started && !ready.hidden) wrap.querySelector('[data-go]').click();
      else boostPressed = true;
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      brake = true;
    }
  });
  scope.on(document, 'keyup', (e) => {
    if (KEYS[e.code] != null) {
      held.delete(`k${e.code}`);
      updateSteer();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') brake = false;
  });

  /* ── navigator (Snooki) ── */
  let navUntil = 0;
  function say(text, secs = 2.4) {
    nav.hidden = false;
    nav.querySelector('p').textContent = text;
    navUntil = t + secs;
  }

  /* ── projection helpers ── */
  const s = () => ctl.state;
  const camRoadX = () => s().x * 0.85;
  const segAt = (i) => track.segments[Math.min(i, track.segments.length - 1)];
  const segY = (i, which) => (i >= track.segments.length ? track.segments[track.segments.length - 1].y2 : segAt(i)[which]);

  /* ── scenery (deterministic per segment) ── */
  const lookRightZ = track.lookRight ? track.lookRight * track.length : null;
  const sceneryCache = new Map();
  function sceneryFor(i) {
    let hit = sceneryCache.get(i);
    if (!hit) {
      hit = buildScenery(i);
      sceneryCache.set(i, hit);
    }
    return hit;
  }
  function buildScenery(i) {
    const out = [];
    const r = rng(track.seed * 7919 + i * 31);
    const onBridge = track.bridge && i * SEG >= track.bridge[0] * track.length && i * SEG <= track.bridge[1] * track.length;
    if (onBridge) {
      out.push({ kind: 'rail', x: -1.25 }, { kind: 'rail', x: 1.25 });
      if (i % 10 === 0) out.push({ kind: 'lamp', x: -1.3 }, { kind: 'lamp', x: 1.3 });
      return out;
    }
    if (i % 12 === 0) out.push({ kind: 'lamp', x: -1.35 }, { kind: 'lamp', x: 1.35 });
    if (i % 3 === 0 && r() < 0.8) out.push({ kind: 'roses', x: (r() < 0.5 ? -1 : 1) * (1.5 + r() * 1.2), tone: r() < 0.7 ? '#3f6fe0' : '#e0567f' });
    if (i % 7 === 0 && r() < 0.7) out.push({ kind: 'tree', x: (r() < 0.5 ? -1 : 1) * (2.4 + r() * 2), h: 0.9 + r() * 0.6 });
    const c = segAt(i).curve;
    if (Math.abs(c) >= 2 && i % 5 === 0) out.push({ kind: 'chevron', x: c > 0 ? -1.3 : 1.3, dir: c > 0 ? 1 : -1 });
    if (track.theme === 'night' && i % 40 === 20) out.push({ kind: 'house', x: (r() < 0.5 ? -1 : 1) * (3.2 + r()), lit: r() < 0.6 });
    return out;
  }

  /* ── drawing: background ── */
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, view.horizon + 10);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(0.6, theme.sky[1]);
    g.addColorStop(1, theme.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, view.horizon + 12);
    const r = rng(track.seed + 3);
    for (let k = 0; k < 70; k++) {
      const x = (((r() * W * 2 - skyOffset * 0.2) % (W * 2)) + W * 2) % (W * 2);
      if (x > W) continue;
      ctx.fillStyle = `rgba(255,246,208,${0.3 + r() * 0.6})`;
      ctx.fillRect(x, r() * view.horizon * 0.85, r() < 0.15 ? 1.6 : 1, r() < 0.15 ? 1.6 : 1);
    }
    // moon
    const mx = ((W * 0.78 - skyOffset * 0.3) % (W * 1.6) + W * 1.6) % (W * 1.6);
    ctx.fillStyle = 'rgba(255,244,214,.18)';
    ctx.beginPath();
    ctx.arc(mx, view.horizon * 0.3, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.arc(mx, view.horizon * 0.3, 14, 0, Math.PI * 2);
    ctx.fill();
    // far hills, shifting with the bends
    ctx.fillStyle = theme.hills;
    ctx.beginPath();
    ctx.moveTo(0, view.horizon + 12);
    for (let x = 0; x <= W + 8; x += 8) {
      const u = x + skyOffset;
      ctx.lineTo(x, view.horizon - 18 - Math.sin(u * 0.012) * 12 - Math.sin(u * 0.031) * 6);
    }
    ctx.lineTo(W, view.horizon + 12);
    ctx.fill();
    if (track.theme === 'night') {
      // the town glow far away: home
      ctx.fillStyle = 'rgba(255,214,140,.5)';
      for (let k = 0; k < 14; k++) ctx.fillRect(((k * 37 - skyOffset * 0.5) % W + W) % W, view.horizon - 6 - (k % 3) * 3, 2, 2);
    }
  }

  function quad(x1, y1, w1, x2, y2, w2, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x1 + w1, y1);
    ctx.closePath();
    ctx.fill();
  }

  /* ── drawing: the road and everything on it ── */
  function drawRoad() {
    const st = s();
    const unit = view.unit;
    const camZ = st.z - PLAYER_DIST;
    const base = Math.max(0, Math.floor(camZ / SEG));
    const pFrac = (camZ - base * SEG) / SEG;
    const playerSeg = Math.floor(st.z / SEG);
    const playerY = segY(playerSeg, 'y1') + (segY(playerSeg, 'y2') - segY(playerSeg, 'y1')) * ((st.z % SEG) / SEG);
    const camY = view.camHeight + playerY;
    const camX = camRoadX() * view.roadW;
    const curveScale = view.roadW * 0.0065;
    let curveX = 0;
    let curveDX = -(segAt(base).curve * pFrac) * curveScale;
    let maxY = H;
    const drawn = [];
    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const i = base + n;
      const seg = i < track.segments.length ? track.segments[i] : { i, curve: 0, y1: segY(i, 'y1'), y2: segY(i, 'y2') };
      const zNear = Math.max(1, i * SEG - camZ);
      const zFar = (i + 1) * SEG - camZ;
      if (zFar <= 1) {
        curveX += curveDX;
        curveDX += seg.curve * curveScale;
        continue;
      }
      const sN = CAM_DEPTH / zNear;
      const sF = CAM_DEPTH / zFar;
      const xN = W / 2 + sN * (curveX - camX) * unit;
      const xF = W / 2 + sF * (curveX + curveDX - camX) * unit;
      const yN = view.horizon + sN * (camY - seg.y1) * unit;
      const yF = view.horizon + sF * (camY - seg.y2) * unit;
      const wN = sN * view.roadW * unit;
      const wF = sF * view.roadW * unit;
      const info = { i, sN, xN, yN, wN, clip: maxY, curveX, worldZ: i * SEG };
      curveX += curveDX;
      curveDX += seg.curve * curveScale;
      if (yF >= maxY || yN <= view.horizon - 2) {
        drawn.push(info);
        continue;
      }
      const alt = Math.floor(i / 3) % 2;
      const onBridge = track.bridge && i * SEG >= track.bridge[0] * track.length && i * SEG <= track.bridge[1] * track.length;
      // ground (or water under the bridge)
      ctx.fillStyle = onBridge ? (alt ? '#0b1440' : '#0d1848') : theme.grass[alt];
      ctx.fillRect(0, yF, W, Math.min(maxY, yN) - yF + 1);
      if (onBridge && alt) {
        ctx.fillStyle = 'rgba(159,215,255,.12)';
        ctx.fillRect(0, yF, W, 1);
      }
      quad(xN, yN, wN * 1.12, xF, yF, wF * 1.12, theme.rumble[alt]);
      quad(xN, yN, wN, xF, yF, wF, theme.road[alt]);
      if (alt) {
        for (const lane of [-1 / 3, 1 / 3]) quad(xN + lane * wN, yN, wN * 0.018, xF + lane * wF, yF, wF * 0.018, theme.lane);
      }
      // checkpoint and finish lines
      for (const [k, cz] of track.checkpoints.entries()) {
        if (cz >= i * SEG && cz < (i + 1) * SEG) quad(xN, yN, wN, xF, yF, wF, k < st.checkpoint ? 'rgba(127,211,138,.6)' : 'rgba(159,215,255,.55)');
      }
      if (track.length >= i * SEG && track.length < (i + 1) * SEG) {
        for (let c = 0; c < 8; c++) {
          const a = -1 + (c * 2) / 8;
          ctx.fillStyle = c % 2 ? '#fff' : '#16161c';
          ctx.fillRect(xF + a * wF, yF, (wF * 2) / 8 + 1, Math.max(2, yN - yF));
        }
      }
      maxY = yF;
      drawn.push(info);
    }
    // fog toward the horizon
    const fg = ctx.createLinearGradient(0, view.horizon - 4, 0, view.horizon + 40);
    fg.addColorStop(0, theme.fog);
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, view.horizon - 4, W, 44);

    // sprites, far → near
    const zIndex = (z) => drawn[Math.floor(z / SEG) - base];
    const sprites = [];
    for (let n = drawn.length - 1; n >= 0; n--) {
      const d = drawn[n];
      if (d.yN <= view.horizon - 2) continue;
      for (const sp of sceneryFor(d.i)) sprites.push({ ...sp, d, z: d.worldZ });
    }
    if (lookRightZ && Math.abs(lookRightZ - st.z) < SEG * 160 && lookRightZ > st.z) {
      const d = zIndex(lookRightZ);
      if (d) sprites.push({ kind: 'observatory', x: 4.2, d, z: lookRightZ });
    }
    const things = [];
    for (const [i, o] of track.cones.entries()) if (!st.hitCones.has(i)) things.push({ kind: 'cone', ...o });
    for (const [i, o] of track.oil.entries()) if (!st.hitOil.has(i)) things.push({ kind: 'oil', ...o });
    for (const [i, o] of track.boosts.entries()) if (!st.usedBoosts.has(i)) things.push({ kind: 'arrow', ...o });
    for (const [i, o] of track.orbs.entries()) if (!st.orbs.has(i)) things.push({ kind: 'orb', ...o, k: i });
    for (const c of st.traffic) things.push({ kind: 'traffic', x: c.x, z: c.z, color: c.color });
    if (st.rival && st.rival.z < track.length + SEG * 3) things.push({ kind: 'rival', x: -0.3, z: st.rival.z });
    for (const th of things) {
      if (th.z <= st.z - SEG * 2 || th.z > camZ + DRAW_DISTANCE * SEG) continue;
      const d = zIndex(th.z);
      if (d) sprites.push({ ...th, d });
    }
    sprites.sort((a, b) => b.z - a.z);
    for (const sp of sprites) drawSprite(sp, camX);
  }

  function drawSprite(sp, camX) {
    const { d } = sp;
    const frac = (sp.z - d.worldZ) / SEG;
    const scale = d.sN * (1 - frac * 0.04);
    const px = W / 2 + scale * (d.curveX + sp.x * view.roadW - camX) * view.unit;
    const py = d.yN;
    const k = scale * view.unit; // px per world unit
    if (py < view.horizon - 4 || k <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, d.clip);
    ctx.clip();
    switch (sp.kind) {
      case 'lamp': {
        const hgt = 520 * k;
        ctx.fillStyle = '#2d2f45';
        ctx.fillRect(px - 9 * k, py - hgt, 18 * k, hgt);
        const g = ctx.createRadialGradient(px, py - hgt, 1, px, py - hgt, 160 * k);
        g.addColorStop(0, 'rgba(159,215,255,.75)');
        g.addColorStop(1, 'rgba(159,215,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py - hgt, 160 * k, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'roses': {
        ctx.fillStyle = '#1f4a3c';
        ctx.beginPath();
        ctx.ellipse(px, py - 60 * k, 150 * k, 70 * k, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = sp.tone;
        for (let q = 0; q < 5; q++) {
          ctx.beginPath();
          ctx.arc(px + (q - 2) * 50 * k, py - (70 + (q % 2) * 40) * k, 20 * k, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'tree': {
        const th = 900 * sp.h * k;
        ctx.fillStyle = '#2a1d16';
        ctx.fillRect(px - 20 * k, py - th * 0.4, 40 * k, th * 0.4);
        ctx.fillStyle = '#163a3a';
        ctx.beginPath();
        ctx.moveTo(px, py - th);
        ctx.lineTo(px + 220 * k, py - th * 0.3);
        ctx.lineTo(px - 220 * k, py - th * 0.3);
        ctx.fill();
        break;
      }
      case 'chevron': {
        ctx.fillStyle = '#ffd977';
        ctx.fillRect(px - 120 * k, py - 260 * k, 240 * k, 140 * k);
        ctx.fillStyle = '#16161c';
        for (let q = -1; q <= 1; q++) {
          const cx = px + q * 70 * k;
          ctx.beginPath();
          ctx.moveTo(cx - sp.dir * 25 * k, py - 240 * k);
          ctx.lineTo(cx + sp.dir * 25 * k, py - 190 * k);
          ctx.lineTo(cx - sp.dir * 25 * k, py - 140 * k);
          ctx.lineTo(cx - sp.dir * 5 * k, py - 190 * k);
          ctx.fill();
        }
        ctx.fillStyle = '#2d2f45';
        ctx.fillRect(px - 8 * k, py - 120 * k, 16 * k, 120 * k);
        break;
      }
      case 'rail': {
        ctx.fillStyle = '#9aa3b8';
        ctx.fillRect(px - 10 * k, py - 160 * k, 20 * k, 160 * k);
        ctx.fillStyle = 'rgba(159,215,255,.7)';
        ctx.fillRect(px - 26 * k, py - 170 * k, 52 * k, 18 * k);
        break;
      }
      case 'house': {
        ctx.fillStyle = '#1d2140';
        ctx.fillRect(px - 300 * k, py - 400 * k, 600 * k, 400 * k);
        ctx.beginPath();
        ctx.moveTo(px - 340 * k, py - 400 * k);
        ctx.lineTo(px, py - 620 * k);
        ctx.lineTo(px + 340 * k, py - 400 * k);
        ctx.fill();
        if (sp.lit) {
          ctx.fillStyle = '#ffd98a';
          ctx.fillRect(px - 200 * k, py - 300 * k, 110 * k, 90 * k);
          ctx.fillRect(px + 90 * k, py - 300 * k, 110 * k, 90 * k);
        }
        break;
      }
      case 'observatory': {
        // the light on the hill, to the right of the bridge ("باوعي يمين")
        const r = 900 * k;
        ctx.fillStyle = '#141a48';
        ctx.beginPath();
        ctx.arc(px, py - r * 0.6, r, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#c9b8de';
        ctx.beginPath();
        ctx.arc(px, py - r * 1.5, r * 0.4, Math.PI, 0);
        ctx.fill();
        const g = ctx.createRadialGradient(px + r * 0.2, py - r * 1.7, 2, px + r * 0.2, py - r * 1.7, r);
        g.addColorStop(0, 'rgba(255,226,138,.9)');
        g.addColorStop(1, 'rgba(255,226,138,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px + r * 0.2, py - r * 1.7, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'cone': {
        ctx.fillStyle = '#f08a3c';
        ctx.beginPath();
        ctx.moveTo(px, py - 140 * k);
        ctx.lineTo(px + 60 * k, py);
        ctx.lineTo(px - 60 * k, py);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(px - 32 * k, py - 70 * k, 64 * k, 18 * k);
        break;
      }
      case 'oil': {
        ctx.fillStyle = 'rgba(8,8,14,.9)';
        ctx.beginPath();
        ctx.ellipse(px, py - 6 * k, 170 * k, 30 * k, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(159,215,255,.35)';
        ctx.lineWidth = Math.max(1, 8 * k);
        ctx.stroke();
        break;
      }
      case 'arrow': {
        ctx.fillStyle = '#ffd977';
        for (let q = 0; q < 3; q++) {
          const y = py - q * 30 * k;
          ctx.beginPath();
          ctx.moveTo(px - 140 * k, y);
          ctx.lineTo(px, y - 40 * k);
          ctx.lineTo(px + 140 * k, y);
          ctx.lineTo(px + 140 * k, y - 14 * k);
          ctx.lineTo(px, y - 54 * k);
          ctx.lineTo(px - 140 * k, y - 14 * k);
          ctx.fill();
        }
        break;
      }
      case 'orb': {
        const bob = reduced() ? 0 : Math.sin(t * 5 + sp.k) * 20;
        const y = py - (170 + bob) * k;
        const g = ctx.createRadialGradient(px, y, 1, px, y, 110 * k);
        g.addColorStop(0, 'rgba(232,246,255,1)');
        g.addColorStop(0.35, 'rgba(159,215,255,.85)');
        g.addColorStop(1, 'rgba(159,215,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, y, 110 * k, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'traffic':
        drawCarRear(px, py, 0.315 * view.roadW * k, sp.color, { kind: 'hatch' });
        break;
      case 'rival':
        drawCarRear(px, py, 0.315 * view.roadW * k, '#3a3d48', { kind: 'gt', tinted: true });
        break;
      default:
    }
    ctx.restore();
  }

  /**
   * Rear view of a car, bottom-centre at (cx, by), `w` px wide.
   * kind 'gt': the low grand tourer (player / rival); 'hatch': traffic.
   */
  function drawCarRear(cx, by, w, body, { kind = 'gt', tinted = false, player = false, steer = 0, braking = false } = {}) {
    const hgt = w * (kind === 'gt' ? 0.44 : 0.62);
    ctx.save();
    ctx.translate(cx, by);
    if (player) ctx.transform(1, 0, steer * -0.08, 1, 0, 0);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.56, hgt * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // tyres
    ctx.fillStyle = '#0c0c12';
    ctx.fillRect(-w * 0.5, -hgt * 0.26, w * 0.16, hgt * 0.26);
    ctx.fillRect(w * 0.34, -hgt * 0.26, w * 0.16, hgt * 0.26);
    if (kind === 'gt') {
      const bodyTop = -hgt * 0.66;
      // lower body, wide hips
      const g = ctx.createLinearGradient(0, bodyTop, 0, -hgt * 0.1);
      g.addColorStop(0, shade(body, 0.25));
      g.addColorStop(0.5, body);
      g.addColorStop(1, shade(body, -0.35));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, -hgt * 0.14);
      ctx.lineTo(-w * 0.52, -hgt * 0.42);
      ctx.quadraticCurveTo(-w * 0.5, bodyTop, -w * 0.4, bodyTop);
      ctx.lineTo(w * 0.4, bodyTop);
      ctx.quadraticCurveTo(w * 0.5, bodyTop, w * 0.52, -hgt * 0.42);
      ctx.lineTo(w * 0.5, -hgt * 0.14);
      ctx.closePath();
      ctx.fill();
      // cabin / glasshouse
      ctx.fillStyle = shade(body, -0.15);
      ctx.beginPath();
      ctx.moveTo(-w * 0.34, bodyTop);
      ctx.lineTo(-w * 0.25, -hgt * 0.98);
      ctx.lineTo(w * 0.25, -hgt * 0.98);
      ctx.lineTo(w * 0.34, bodyTop);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = tinted ? '#0b0d16' : '#16203a';
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, bodyTop - hgt * 0.03);
      ctx.lineTo(-w * 0.23, -hgt * 0.93);
      ctx.lineTo(w * 0.23, -hgt * 0.93);
      ctx.lineTo(w * 0.3, bodyTop - hgt * 0.03);
      ctx.closePath();
      ctx.fill();
      if (player) {
        // through the rear window: Anji (driver, left) and Snooki's ears (right)
        ctx.fillStyle = '#9c4a26';
        ctx.beginPath();
        ctx.arc(-w * 0.11, -hgt * 0.76, w * 0.065, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8e1c2e';
        ctx.fillRect(-w * 0.14, -hgt * 0.72, w * 0.06, hgt * 0.04);
        ctx.fillStyle = '#fbfbfd';
        ctx.beginPath();
        ctx.arc(w * 0.12, -hgt * 0.74, w * 0.06, 0, Math.PI * 2);
        ctx.moveTo(w * 0.07, -hgt * 0.78);
        ctx.lineTo(w * 0.08, -hgt * 0.9);
        ctx.lineTo(w * 0.11, -hgt * 0.8);
        ctx.moveTo(w * 0.13, -hgt * 0.8);
        ctx.lineTo(w * 0.16, -hgt * 0.9);
        ctx.lineTo(w * 0.17, -hgt * 0.78);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.lineWidth = Math.max(1, w * 0.008);
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, -hgt * 0.9);
      ctx.lineTo(-w * 0.26, bodyTop);
      ctx.stroke();
      // ducktail wing
      ctx.fillStyle = shade(body, -0.3);
      ctx.fillRect(-w * 0.38, bodyTop - hgt * 0.06, w * 0.76, hgt * 0.06);
      ctx.fillRect(-w * 0.3, bodyTop, w * 0.03, hgt * 0.05);
      ctx.fillRect(w * 0.27, bodyTop, w * 0.03, hgt * 0.05);
      // four round tail lights
      const lit = braking ? 1 : 0.75;
      for (const lx of [-0.4, -0.26, 0.26, 0.4]) {
        const x = lx * w;
        const y = -hgt * 0.47;
        const r = w * 0.055;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * (braking ? 4 : 2.6));
        glow.addColorStop(0, `rgba(255,60,90,${0.55 * lit})`);
        glow.addColorStop(1, 'rgba(255,60,90,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * (braking ? 4 : 2.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a0d1c';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff3c5a';
        ctx.lineWidth = Math.max(1, r * 0.45);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
        ctx.stroke();
      }
      // plate with a tiny blue rose (no badges, no logos)
      ctx.fillStyle = '#e9e7f2';
      ctx.fillRect(-w * 0.1, -hgt * 0.36, w * 0.2, hgt * 0.1);
      ctx.fillStyle = '#3f6fe0';
      ctx.beginPath();
      ctx.arc(0, -hgt * 0.31, hgt * 0.035, 0, Math.PI * 2);
      ctx.fill();
      // diffuser and quad exhausts
      ctx.fillStyle = '#14141a';
      ctx.fillRect(-w * 0.44, -hgt * 0.2, w * 0.88, hgt * 0.08);
      ctx.fillStyle = '#9aa3b8';
      for (const ex of [-0.36, -0.28, 0.28, 0.36]) {
        ctx.beginPath();
        ctx.arc(ex * w, -hgt * 0.16, w * 0.024, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // traffic hatchback
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(-w * 0.48, -hgt * 0.12);
      ctx.lineTo(-w * 0.46, -hgt * 0.55);
      ctx.lineTo(-w * 0.36, -hgt);
      ctx.lineTo(w * 0.36, -hgt);
      ctx.lineTo(w * 0.46, -hgt * 0.55);
      ctx.lineTo(w * 0.48, -hgt * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1b2236';
      ctx.fillRect(-w * 0.32, -hgt * 0.92, w * 0.64, hgt * 0.3);
      ctx.fillStyle = '#ff3c5a';
      ctx.fillRect(-w * 0.44, -hgt * 0.5, w * 0.14, hgt * 0.1);
      ctx.fillRect(w * 0.3, -hgt * 0.5, w * 0.14, hgt * 0.1);
      ctx.fillStyle = '#e9e7f2';
      ctx.fillRect(-w * 0.1, -hgt * 0.36, w * 0.2, hgt * 0.1);
    }
    ctx.restore();
  }

  function drawPlayer() {
    const st = s();
    const halfRoad = (CAM_DEPTH / PLAYER_DIST) * view.unit * view.roadW;
    const px = W / 2 + (st.x - camRoadX()) * halfRoad;
    let py = view.groundY;
    const rm = reduced();
    if (!rm && Math.abs(st.x) > 1 && st.v > 100) py += Math.sin(t * 50) * 2; // rumble on the verge
    if (!rm && st.bump > 0) py += Math.sin(t * 70) * 3;
    const steer = finger !== null ? Math.max(-1, Math.min(1, (finger - st.x) / 0.25)) : steerHeld;
    drawCarRear(px, py, view.carW, color, { kind: 'gt', player: true, steer, braking: brake || st.bump > 0 });
    if (st.boost > 0) {
      for (const ex of [-0.32, 0.32]) {
        ctx.fillStyle = `rgba(159,215,255,${rm ? 0.7 : 0.5 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(px + ex * view.carW, py - view.carW * 0.05, view.carW * 0.05, view.carW * (0.05 + (rm ? 0.04 : Math.random() * 0.06)), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawSpeedLines() {
    const st = s();
    if (reduced() || st.v < CAR.vmax * 0.85) return;
    const a = Math.min(0.35, (st.v - CAR.vmax * 0.85) / CAR.vmax + (st.boost > 0 ? 0.2 : 0));
    ctx.strokeStyle = `rgba(232,246,255,${a})`;
    ctx.lineWidth = 1.5;
    const r = rng(Math.floor(t * 20));
    for (let k = 0; k < 10; k++) {
      const side = k % 2 ? 1 : -1;
      const y = view.horizon + r() * (H - view.horizon);
      const x = W / 2 + side * (W * 0.35 + r() * W * 0.2);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * 30, y + 12);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSky();
    drawRoad();
    drawPlayer();
    drawSpeedLines();
  }

  /* ── HUD ── */
  function updateHud() {
    const st = s();
    timeEl.textContent = raceTime(st.t);
    speedEl.textContent = num(Math.round((st.v / CAR.vmax) * 240));
    meterEl.style.width = `${Math.round(st.meter * 100)}%`;
    boostBtn.disabled = st.meter < 1 || st.boost > 0;
    boostBtn.classList.toggle('is-ready', st.meter >= 1 && st.boost <= 0);
    const p = Math.min(1, st.z / track.length);
    meEl.style.setProperty('--p', p);
    fillEl.style.width = `${p * 100}%`;
    if (rivalEl && st.rival) rivalEl.style.setProperty('--p', Math.min(1, st.rival.z / track.length));
    hud(`⏱ ${raceTime(st.t)}`);
  }

  /* ── navigator calls ── */
  function navigator(ev) {
    const st = s();
    if (ev?.checkpoint) {
      say(`نقطة تفتيش ${num(ev.checkpoint)} ✓  ${raceTime(st.t)}`, 2.2);
      app.audio.play('sparkle');
      lastCall = t;
      return;
    }
    if (ev?.orb && st.meter >= 1 && st.boost <= 0) {
      say('⚡ التسارع جاهز! المسي ⚡', 2.2);
      lastCall = t;
      return;
    }
    if (lookRightZ && st.z > lookRightZ - SEG * 60 && st.z < lookRightZ && t - lastCall > 3) {
      say('باوعي يمين! أكو ضوء بالمرصد!', 3);
      lastCall = t + 30;
      return;
    }
    if (st.rival && !rivalSeen && st.rival.z - st.z < SEG * 60 && t - lastCall > 2) {
      rivalSeen = true;
      say('هاي هي! السيارة الرصاصية قدّامنا. ريحتها… مألوفة.', 2.6);
      lastCall = t;
      return;
    }
    if (st.rival && !rivalPassed && st.z > st.rival.z + SEG) {
      rivalPassed = true;
      say('عدّينا السيارة الرصاصية! لا تگولين لأحد إني صفّگت.', 3);
      lastCall = t;
      return;
    }
    if (t - lastCall < 3.2) return;
    const { max } = curveAhead(track, st.z + SEG * 18, 24);
    if (Math.abs(max) >= 2.5) {
      say(max > 0 ? 'منعطف لليمين! ➡' : '⬅ منعطف لليسار!', 2);
      lastCall = t;
    }
  }

  /* ── loop ── */
  const loop = scope.loop((dt) => {
    t += dt;
    if (started && !hostPaused && !finished) {
      if (ctl.phase === 'countdown') {
        const n = Math.ceil(ctl.count - dt);
        if (n !== lastCountShown) {
          lastCountShown = n;
          countEl.textContent = n > 0 ? num(n) : 'انطلقي!';
          app.audio.play(n > 0 ? 'tap' : 'success');
          if (n <= 0) scope.timeout(() => (countEl.textContent = ''), 700);
        }
      }
      const input = finger !== null ? { targetX: finger } : { steer: steerHeld };
      input.brake = brake;
      input.boost = boostPressed;
      boostPressed = false;
      const ev = ctl.tick(dt, input);
      if (ev) {
        const st = s();
        skyOffset += (track.segments[Math.min(track.segments.length - 1, Math.floor(st.z / SEG))]?.curve || 0) * (st.v / CAR.vmax) * dt * 60;
        if (ev.orb) app.audio.play('pickup');
        if (ev.hit) {
          app.audio.play('hit');
          app.audio.vibrate(50);
          if (ev.cone) say('مخروط! …ما شفته. أنا الملاحة مو المخاريط.', 1.6);
        }
        if (ev.boost) app.audio.play('whoosh');
        if (ev.oil) {
          app.audio.play('boing');
          say('زيت! ثبّتي المقود!', 1.6);
        }
        navigator(ev);
        if (ev.finished) end();
      }
      updateHud();
    }
    if (nav && !nav.hidden && t > navUntil) nav.hidden = true;
    draw();
  });

  function end() {
    finished = true;
    const st = s();
    const medal = raceMedal(track, st.t);
    const rival = track.rival ? (beatRival(track, st) ? 'سبقتي السيارة الرصاصية! ' : 'السيارة الرصاصية وصلت قبلچ بشوية. ') : '';
    finish({
      completed: true,
      score: Math.round(st.t * 10) / 10,
      lowerIsBetter: true,
      medal,
      title: track.rival ? `${rival}🏁` : `${track.name}: وصلتي! 🏁`,
      summary: `الوقت ${raceTime(st.t)} · أضواء ${num(st.orbs.size)}/${num(track.orbs.length)} · اصطدامات ${num(st.hits)} (الذهبية تحت ${raceTime(track.medals.gold)})`,
    });
  }

  return {
    start() {
      loop.start();
      app.tips?.show('minigame');
    },
    pause() {
      hostPaused = true;
      ctl.pause();
      held.clear();
      updateSteer();
      finger = null;
      brake = false;
    },
    resume() {
      hostPaused = false;
      ctl.resume();
    },
    destroy() {
      loop.stop();
    },
    get state() {
      return ctl.state;
    },
    get controller() {
      return ctl;
    },
    /** dev/test hook: start without the ready card */
    go() {
      ready.hidden = true;
      started = true;
    },
  };
}

/** Lighten (amount > 0) or darken (< 0) a #rrggbb colour. */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
