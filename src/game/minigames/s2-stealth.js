/**
 * Season 2, Mission 04 «ظل الأخت»: following her sister to the shed — canvas and controls. The rules are in
 * s2-stealth-logic.js. Hold ◀ ▶ to move (or the arrow keys), «اختبي» (or ↓) to crouch in cover.
 *
 * Her sister is drawn as her own silhouette: a slow sway while she stands, a tell before every look back (her eyes
 * slide back, a small «…»), a raised posture while she looks (the glance cone shows how far her look reaches),
 * and, when she catches Anji, a rise and a quick lean-in: «شتسوين؟». Fiction written for the game.
 */
import { STEALTH, COVERS, RHYTHMS, createStealth, stepStealth, phaseOf, isLooking, coverAt } from './s2-stealth-logic.js';
import { createPainter } from '../world/painter.js';
import { PROP_DRAWERS } from '../world/prop-drawers.js';
import { GROUND, VIEW_H } from '../world/props.js';
import * as P from '../world/props.js';
import { spriteFrames } from '../world/sprite-cache.js';
import { h } from '../ui/dom.js';
import { rng } from '../core/rng.js';

const ANJI_H = 112;
const SISTER_H = 110;
const BTN = 'position:absolute;bottom:calc(var(--safe-b, 0px) + 14px);min-width:60px;height:60px;border:0;border-radius:18px;font:700 22px/1 Baloo Bhaijaan 2,sans-serif;color:#1b1440;background:rgba(255,247,236,.92);box-shadow:0 4px 14px rgba(8,10,30,.35);touch-action:none;user-select:none;-webkit-user-select:none;';
const REACT_LINE = { seen: 'شتسوين؟', heard: 'شتسوين؟ أسمع خطواتچ!', lost: 'وين راحت؟' };

/* ── the garden, drawn on the canvas ── */
function houseCorner(ctx) {
  ctx.fillStyle = '#c9b8a4';
  ctx.fillRect(-400, GROUND - 210, 470, 210);
  ctx.fillStyle = '#b3a18c';
  ctx.fillRect(56, GROUND - 210, 14, 210);
  ctx.fillStyle = '#6d4e3a';
  ctx.fillRect(-400, GROUND - 222, 482, 14);
  P.windowFrame(ctx, -40, GROUND - 170, 46, 62);
}
function linePoles(ctx) {
  ctx.strokeStyle = '#6b5a48';
  ctx.lineWidth = 5;
  for (const x of [545, 705]) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x, GROUND - 150);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ece4d6';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(545, GROUND - 146);
  ctx.quadraticCurveTo(625, GROUND - 132, 705, GROUND - 146);
  ctx.stroke();
}
function sheets(ctx, t) {
  const tones = ['#f6f2ea', '#f3c9d4', '#cfe2f5'];
  for (let i = 0; i < 3; i++) {
    const x = 566 + i * 44;
    const sway = Math.sin(t * 1.6 + i) * 3;
    ctx.fillStyle = tones[i];
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 140 + i);
    ctx.lineTo(x + 40, GROUND - 139 + i);
    ctx.lineTo(x + 40 + sway, GROUND - 34);
    ctx.lineTo(x + sway * 0.6, GROUND - 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8b7a66';
    ctx.fillRect(x + 6, GROUND - 145 + i, 4, 9);
    ctx.fillRect(x + 30, GROUND - 145 + i, 4, 9);
  }
}
function planter(ctx) {
  P.bench(ctx, 905, GROUND);
  ctx.fillStyle = '#7a5236';
  ctx.fillRect(878, GROUND - 46, 64, 46);
  ctx.fillStyle = '#634029';
  ctx.fillRect(874, GROUND - 52, 72, 8);
  P.roseBush(ctx, 910, GROUND - 50, 66, 30, rng(910), { tone: 'blue', roses: 4 });
}
function shed(ctx, s, t) {
  const x0 = 1380;
  ctx.fillStyle = '#7b5b43';
  ctx.fillRect(x0, GROUND - 190, 330, 190);
  ctx.fillStyle = '#5c4232';
  for (let x = x0; x < x0 + 330; x += 22) ctx.fillRect(x, GROUND - 190, 2, 190);
  ctx.fillStyle = '#4a2f2a';
  ctx.beginPath();
  ctx.moveTo(x0 - 16, GROUND - 186);
  ctx.lineTo(x0 + 165, GROUND - 246);
  ctx.lineTo(x0 + 346, GROUND - 186);
  ctx.closePath();
  ctx.fill();
  // the door (she goes in here)
  const inside = s.sister.inside;
  ctx.fillStyle = inside ? '#2b1d18' : '#5a3a2c';
  ctx.fillRect(1544, GROUND - 120, 44, 120);
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(1580, GROUND - 62, 4, 4);
  // the window: warm light once she is in; her shape moves behind it while she hides her notes
  const wx = 1450;
  const wy = GROUND - 128;
  ctx.fillStyle = inside ? '#ffd98a' : '#3a4a5a';
  ctx.fillRect(wx - 26, wy, 52, 42);
  if (inside) {
    const ph = phaseOf(s);
    const sx = ph === 'peek' ? wx : wx - 10 + Math.sin(t * 2.2) * 12;
    ctx.fillStyle = 'rgba(40,24,30,.75)';
    ctx.beginPath();
    ctx.ellipse(sx, wy + 16, 8, 9, 0, 0, Math.PI * 2); // her head
    ctx.fill();
    ctx.fillRect(sx - 12, wy + 25, 24, 18);
    if (ph === 'peek') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - 5, wy + 14, 3, 2);
      ctx.fillRect(sx + 2, wy + 14, 3, 2);
    }
  }
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 3;
  ctx.strokeRect(wx - 26, wy, 52, 42);
  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.lineTo(wx, wy + 42);
  ctx.stroke();
}
function barrel(ctx) {
  ctx.fillStyle = '#4f6a7a';
  ctx.fillRect(1428, GROUND - 58, 46, 58);
  ctx.fillStyle = '#3d5563';
  ctx.fillRect(1426, GROUND - 46, 50, 5);
  ctx.fillRect(1426, GROUND - 18, 50, 5);
}
function pots(ctx) {
  P.pot(ctx, 308, GROUND, rng(308), { tone: 'pink' });
  P.pot(ctx, 330, GROUND - 2, rng(330));
  P.pot(ctx, 346, GROUND, rng(346), { tone: 'pink' });
}
function bush(ctx) {
  P.roseBush(ctx, 1160, GROUND, 92, 74, rng(1160), { tone: 'blue', roses: 5 });
}
/** The flowerpot by the bench where she had tucked her notes (she takes them out on the way). */
function notePot(ctx, s) {
  P.pot(ctx, 978, GROUND, rng(978), { tone: 'blue' });
  const at = RHYTHMS[s.rhythm].script.findIndex(([kind]) => kind === 'relocate');
  const still = !s.sister.inside && (s.sister.step < at || (s.sister.step === at && s.sister.t < 0.8));
  if (still) {
    ctx.fillStyle = '#f7f5ee';
    ctx.fillRect(972, GROUND - 30, 10, 7);
    ctx.fillRect(976, GROUND - 33, 8, 6);
  }
}
/** What she carries: the blank card (and, once she has taken them out of the pot, her pencil notes). */
function carried(ctx, s) {
  const sis = s.sister;
  if (sis.inside) return;
  const at = RHYTHMS[s.rhythm].script.findIndex(([kind]) => kind === 'relocate');
  const hx = sis.x + sis.facing * 13;
  const hy = GROUND - 50;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(sis.facing * 0.25);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6, -8, 12, 15);
  ctx.strokeStyle = '#c9c2b4';
  ctx.lineWidth = 1;
  ctx.strokeRect(-6, -8, 12, 15);
  if (sis.step > at || (sis.step === at && sis.t >= 0.8)) {
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(-2, -11, 11, 13);
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(0, -7, 7, 1);
    ctx.fillRect(0, -4, 7, 1);
  }
  ctx.restore();
}

export function mount(area, { app, scope, options, hud, finish }) {
  const rhythm = options.rhythm || 'gentle';
  let s = createStealth(rhythm);
  let paused = true;
  let frames = null;
  let t = 0;
  let fadeIn = 0;
  let finished = 0;
  let cam = null;
  const held = { left: false, right: false };
  let hidePress = false;

  const wrap = h(`<div class="runner s2-stealth">
      <canvas class="runner-canvas" role="img" aria-label="حديقة البيت: أختي ماشية للسقيفة"></canvas>
      <div class="st-controls" style="position:absolute;inset:auto 0 0 0;height:0;direction:ltr">
        <button type="button" data-move="left" aria-label="لورا" style="${BTN}left:calc(var(--safe-l, 0px) + 14px)">◀</button>
        <button type="button" data-move="right" aria-label="لگدام" style="${BTN}left:calc(var(--safe-l, 0px) + 86px)">▶</button>
        <button type="button" data-hide aria-pressed="false" style="${BTN}right:calc(var(--safe-r, 0px) + 14px);padding:0 16px;font-size:17px">🙈 اختبي</button>
      </div>
    </div>`);
  area.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const hideBtn = wrap.querySelector('[data-hide]');
  const painter = createPainter({ theme: options.theme || 'meadow', seed: 807, propDrawers: PROP_DRAWERS });
  scope.add(() => painter.dispose());
  let viewW = 400;
  let viewH = VIEW_H;
  let topY = 0;
  let k = 1;
  let px = 1;

  function resize() {
    const r = wrap.getBoundingClientRect();
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    // wide enough to see her ahead (≥ 300 units on a phone); room under the ground for the buttons
    k = Math.min(r.width / (r.width < r.height ? 300 : 520), Math.max(1, r.height) / (VIEW_H + 60));
    viewW = r.width / k;
    viewH = r.height / k;
    topY = VIEW_H + 74 - viewH;
    px = k * dpr;
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  resize();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    scope.add(() => ro.disconnect());
  }

  // ── controls: hold to move, tap to crouch ──
  wrap.querySelectorAll('[data-move]').forEach((b) => {
    const side = b.dataset.move;
    const on = (e) => {
      e.preventDefault();
      held[side] = true;
      b.setPointerCapture?.(e.pointerId);
    };
    const off = () => {
      held[side] = false;
    };
    scope.on(b, 'pointerdown', on);
    scope.on(b, 'pointerup', off);
    scope.on(b, 'pointercancel', off);
    scope.on(b, 'lostpointercapture', off);
    scope.on(b, 'contextmenu', (e) => e.preventDefault());
  });
  scope.on(hideBtn, 'pointerdown', (e) => {
    e.preventDefault();
    hidePress = true;
  });
  scope.on(hideBtn, 'click', (e) => {
    if (e.detail === 0) hidePress = true; // keyboard activation (a tap already counted on pointerdown)
  });
  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', KeyA: 'left', KeyD: 'right' };
  scope.on(document, 'keydown', (e) => {
    if (KEYS[e.code]) {
      held[KEYS[e.code]] = true;
      e.preventDefault();
    } else if ((e.code === 'ArrowDown' || e.code === 'KeyS') && !e.repeat) {
      hidePress = true;
      e.preventDefault();
    }
  });
  scope.on(document, 'keyup', (e) => {
    if (KEYS[e.code]) held[KEYS[e.code]] = false;
  });
  scope.on(globalThis, 'blur', () => {
    held.left = false;
    held.right = false;
  });

  /* ── drawing ── */
  function blit(img, x, hgt, feet, { facing = 1, rot = 0, sy = 1, dx = 0, alpha = 1 } = {}) {
    const w = (img.width / img.height) * hgt;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(8,10,30,.3)';
    ctx.beginPath();
    ctx.ellipse(x, GROUND + 2, w * 0.3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(x + dx, GROUND + hgt * (1 - feet));
    ctx.rotate(rot);
    ctx.scale(facing < 0 ? -1 : 1, sy);
    ctx.drawImage(img, -w / 2, -hgt, w, hgt);
    ctx.restore();
  }

  function drawSister() {
    const sis = s.sister;
    if (sis.inside || !frames) return;
    const ph = phaseOf(s);
    const reduced = app.reduced();
    const st = { facing: sis.facing };
    let list = frames.sister.idle;
    let i = Math.floor(t * 1.6);
    if (s.react && s.react.kind !== 'lost') {
      // caught: she turns, rises tall, then a quick lean-in toward Anji
      const p = s.react.t;
      list = frames.sister.suspicious || list;
      st.facing = -1;
      st.sy = 1 + Math.min(1, p / 0.3) * (reduced ? 0 : 0.1);
      const lean = reduced ? 0 : Math.max(0, Math.sin(Math.min(1, Math.max(0, (p - 0.35) / 0.5)) * Math.PI));
      st.rot = -0.16 * lean; // toward Anji (she faces her)
      st.dx = -14 * lean;
    } else if (ph === 'walk') {
      list = frames.sister.walk;
      i = Math.floor(t * 8);
    } else if (ph === 'look') {
      list = frames.sister.suspicious || list;
      st.sy = reduced ? 1 : 1 + Math.min(1, sis.t / 0.25) * 0.05; // the raised posture
    } else if (ph === 'relocate') {
      list = frames.sister.lean || list;
    }
    // her slow sway whenever she stands
    if (!reduced && ph !== 'walk' && !s.react) st.rot = (st.rot || 0) + Math.sin(t * 1.7) * 0.035;
    blit(list[i % list.length], sis.x, SISTER_H, 193 / 200, st);
    if (!s.react) carried(ctx, s);
    const head = GROUND - SISTER_H * 0.84;
    if (ph === 'tell' && !s.react) {
      // the tell: her eyes slide back (two glints drifting behind her), a small «…»
      const p = Math.min(1, sis.t / 0.5);
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(sis.x - 2 - p * 9, head + 6, 3, 2);
      ctx.fillRect(sis.x + 4 - p * 9, head + 6, 3, 2);
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 10);
      ctx.fillStyle = 'rgba(255,247,236,.95)';
      ctx.beginPath();
      ctx.roundRect?.(sis.x - 16, head - 30, 32, 18, 9);
      ctx.fill();
      ctx.fillStyle = '#e2405f';
      ctx.font = '700 14px "Baloo Bhaijaan 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('…', sis.x, head - 22);
      ctx.restore();
    }
  }

  function drawCone() {
    const sis = s.sister;
    const ph = phaseOf(s);
    if (s.react) return;
    if (!sis.inside && (ph === 'look' || ph === 'tell')) {
      const ex = sis.x - 6;
      const ey = GROUND - SISTER_H * 0.8;
      const far = sis.x - STEALTH.range;
      ctx.save();
      if (ph === 'look') {
        const g = ctx.createLinearGradient(ex, 0, far, 0);
        g.addColorStop(0, 'rgba(255,236,170,.42)');
        g.addColorStop(1, 'rgba(255,236,170,.06)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(far, GROUND - 170);
        ctx.lineTo(far, GROUND + 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,120,.7)';
      } else {
        // during the tell: only the outline, dashed — where her look is about to reach
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255,214,120,.45)';
      }
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(far, GROUND - 170);
      ctx.lineTo(ex, ey);
      ctx.lineTo(far, GROUND + 8);
      ctx.stroke();
      ctx.restore();
    }
    if (sis.inside && (ph === 'peek' || ph === 'tell')) {
      const wx = 1450;
      const wy = GROUND - 108;
      ctx.save();
      if (ph === 'peek') {
        const g = ctx.createLinearGradient(wx, 0, STEALTH.peekFrom, 0);
        g.addColorStop(0, 'rgba(255,236,170,.45)');
        g.addColorStop(1, 'rgba(255,236,170,.08)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(wx - 20, wy);
        ctx.lineTo(STEALTH.peekFrom, GROUND - 150);
        ctx.lineTo(STEALTH.peekFrom, GROUND + 8);
        ctx.lineTo(1420, GROUND - 60); // the barrel's shadow: under the sill her look does not reach
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255,214,120,.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(STEALTH.peekFrom, GROUND - 150);
        ctx.lineTo(wx - 20, wy);
        ctx.lineTo(STEALTH.peekFrom, GROUND + 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawAnji() {
    if (!frames) return;
    const caught = s.react && s.react.kind !== 'lost';
    let list = frames.anji.idle;
    let i = Math.floor(t * 1.6);
    if (caught) list = frames.anji.surprised || list;
    else if (s.moving) {
      list = frames.anji.walk;
      i = Math.floor(t * 9);
    } else if (s.hidden) list = frames.anji.crouch || list;
    blit(list[i % list.length], s.x, ANJI_H, 196 / 200, { facing: caught ? 1 : s.facing, alpha: s.hidden && coverAt(s.x) ? 0.92 : 1 });
  }

  function bubble(text, x, y) {
    ctx.save();
    ctx.font = '700 13px "Baloo Bhaijaan 2", sans-serif';
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 22;
    const bx = Math.max(cam + w / 2 + 6, Math.min(cam + viewW - w / 2 - 6, x));
    ctx.fillStyle = 'rgba(255,247,236,.97)';
    ctx.beginPath();
    ctx.roundRect?.(bx - w / 2, y - 14, w, 28, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 13);
    ctx.lineTo(x, y + 21);
    ctx.lineTo(x + 5, y + 13);
    ctx.fill();
    ctx.fillStyle = '#9c2f5a';
    ctx.fillText(text, bx, y);
    ctx.restore();
  }

  /** The whole garden as one strip at the top: where the covers are, where she is, and where her look reaches. */
  function drawStrip(cssW) {
    const pad = 14;
    const y = 10;
    const w = cssW - pad * 2;
    const sx = (x) => pad + (x / (STEALTH.length + 80)) * w;
    ctx.save();
    ctx.fillStyle = 'rgba(16,14,40,.62)';
    ctx.beginPath();
    ctx.roundRect?.(pad - 6, y - 4, w + 12, 30, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(pad, y + 14, w, 2);
    ctx.fillStyle = '#4f8a5c';
    for (const c of COVERS) ctx.fillRect(sx(c.x1), y + 8, Math.max(4, sx(c.x2) - sx(c.x1)), 12);
    ctx.fillStyle = '#9a6a4a';
    ctx.fillRect(sx(1544), y + 4, 8, 18); // the shed door
    const sis = s.sister;
    const ph = phaseOf(s);
    if (!sis.inside && (ph === 'look' || ph === 'tell')) {
      ctx.fillStyle = ph === 'look' ? 'rgba(255,214,120,.55)' : 'rgba(255,214,120,.22)';
      ctx.beginPath();
      ctx.moveTo(sx(sis.x), y + 14);
      ctx.lineTo(sx(sis.x - STEALTH.range), y + 2);
      ctx.lineTo(sx(sis.x - STEALTH.range), y + 26);
      ctx.closePath();
      ctx.fill();
    }
    if (sis.inside && ph === 'peek') {
      ctx.fillStyle = 'rgba(255,214,120,.55)';
      ctx.fillRect(sx(STEALTH.peekFrom), y + 4, sx(1450) - sx(STEALTH.peekFrom), 20);
    }
    ctx.fillStyle = isLooking(s) ? '#ffd166' : '#c9a3ff';
    ctx.beginPath();
    ctx.arc(sx(sis.inside ? 1450 : sis.x), y + 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff8fb1';
    ctx.fillStyle = '#ff8fb1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx(s.x), y + 14, 5, 0, Math.PI * 2);
    if (s.hidden && coverAt(s.x)) ctx.stroke();
    else ctx.fill();
    ctx.restore();
  }

  function draw() {
    const r = canvas.getBoundingClientRect();
    ctx.setTransform(px, 0, 0, px, 0, -topY * px);
    // the camera keeps Anji left of centre, so her sister ahead stays in view; both in one shot when caught
    let focus = s.x + viewW * 0.22;
    if (s.react) focus = (s.react.x + (s.sister.inside ? 1450 : s.sister.x)) / 2;
    else if (s.sister.inside) focus = Math.max(focus, 1380);
    const target = Math.max(-60, Math.min(STEALTH.length + 160 - viewW, focus - viewW / 2));
    cam = cam === null ? target : cam + (target - cam) * 0.12;
    const camX = cam;
    painter.drawBack(ctx, camX, viewW, px, topY);
    ctx.fillStyle = '#3d3a2e';
    ctx.fillRect(0, VIEW_H, canvas.width, viewH);
    ctx.save();
    ctx.translate(-camX, 0);
    houseCorner(ctx);
    linePoles(ctx);
    shed(ctx, s, t);
    drawCone();
    drawSister();
    drawAnji();
    pots(ctx);
    sheets(ctx, t);
    planter(ctx);
    notePot(ctx, s);
    bush(ctx);
    barrel(ctx);
    // the cover she is in glows faintly (where she can crouch)
    const cov = coverAt(s.x);
    if (cov && !s.react) {
      ctx.fillStyle = s.hidden ? 'rgba(120,220,150,.28)' : 'rgba(255,255,255,.14)';
      ctx.fillRect(cov.x1, GROUND + 6, cov.x2 - cov.x1, 5);
    }
    // the watch: a small ring fills while she watches through the window
    if (s.sister.inside && s.watch > 0) {
      ctx.save();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(1450, GROUND - 150, 10, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * s.watch) / STEALTH.watchNeed);
      ctx.stroke();
      ctx.restore();
    }
    if (s.react) {
      const who = s.react.kind === 'lost' ? s.x : s.sister.inside ? 1450 : s.sister.x;
      bubble(REACT_LINE[s.react.kind], who, GROUND - (s.react.kind === 'lost' ? ANJI_H : SISTER_H) - 26);
    }
    // off to the right: where she is, and whether she is about to look
    const sis = s.sister;
    if (!sis.inside && sis.x > camX + viewW - 8) {
      const ph = phaseOf(s);
      const cx = camX + viewW - 20;
      ctx.fillStyle = ph === 'look' ? '#ffd166' : ph === 'tell' ? '#ff9f6b' : 'rgba(201,163,255,.9)';
      ctx.beginPath();
      ctx.arc(cx, GROUND - 70, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b1440';
      ctx.font = '700 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ph === 'look' ? '👀' : ph === 'tell' ? '…' : '›', cx, GROUND - 69);
    }
    ctx.restore();
    painter.drawFront(ctx, camX, viewW);
    // the strip, and the fades of a restart, in screen space
    const dpr = px / k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStrip(r.width);
    const dark = s.react ? Math.max(0, (s.react.t - (STEALTH.reactTime - 0.35)) / 0.35) : fadeIn;
    if (dark > 0) {
      ctx.fillStyle = `rgba(10,8,22,${Math.min(1, dark)})`;
      ctx.fillRect(0, 0, r.width, r.height);
    }
  }

  function hudText() {
    if (s.done) return '🤫 شفتيها';
    if (s.react) return s.react.kind === 'lost' ? '… ضيّعتيها' : '😳 لزمتچ';
    const ph = phaseOf(s);
    const hidden = s.hidden && coverAt(s.x);
    const me = hidden ? '🙈 مختبية' : coverAt(s.x) ? '🌿 يم مخبأ' : '👣 مكشوفة';
    if (s.sister.inside) return `${me} · ${ph === 'peek' ? '👀 تباوع من الشباك!' : ph === 'tell' ? '… راح تباوع' : 'شوفيها من الشباك'}`;
    if (ph === 'look') return `${me} · 👀 تباوع!`;
    if (ph === 'tell') return `${me} · … راح تلتفت`;
    if (ph === 'walk' && s.sister.x - s.x > STEALTH.lose - 120) return `${me} · لا تبعدين هواية`;
    return me;
  }

  const loop = scope.loop((dt) => {
    t += dt;
    fadeIn = Math.max(0, fadeIn - dt * 2.5);
    if (!paused) {
      const ev = stepStealth(s, dt, { dir: (held.right ? 1 : 0) - (held.left ? 1 : 0), hide: hidePress });
      hidePress = false;
      if (ev.tell) app.audio.play('tap');
      if (ev.caught) {
        app.audio.play(ev.caught === 'lost' ? 'page' : 'boing');
        app.audio.vibrate?.(40);
      }
      if (ev.restart) {
        fadeIn = 1;
        held.left = false;
        held.right = false;
      }
      if (ev.done) {
        finished = t;
        app.audio.play('sparkle');
      }
      if (finished && t - finished > 0.9 && !paused) {
        paused = true;
        finish({ completed: true, title: 'شفتيها! 🤫', summary: 'خبّت أوراقها بالسقيفة… وما حسّت بيچ.' });
      }
      hideBtn.setAttribute('aria-pressed', String(Boolean(s.hidden)));
      hideBtn.style.background = s.hidden ? '#9fe3b4' : 'rgba(255,247,236,.92)';
      hud(hudText());
    }
    draw();
  });

  return {
    async start() {
      const [anji, sister] = await Promise.all(['anji', 'sister'].map((kind) => spriteFrames(kind, app.game.state.cosmetics)));
      if (scope.disposed) return;
      frames = { anji, sister };
      s = createStealth(rhythm);
      paused = false;
      loop.start();
    },
    pause() {
      paused = true;
      held.left = false;
      held.right = false;
    },
    resume() {
      if (!finished) paused = false;
    },
    destroy() {
      loop.stop();
    },
    get state() {
      return s;
    },
  };
}
