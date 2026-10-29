/**
 * Nurse Needle chase — canvas runner. Tap anywhere (or Space / ↑) to jump.
 * Background reuses the world painter, characters reuse the game sprites.
 */
import { CHASE, COURSES, createChase, stepChase, chaseMedal } from './chase-logic.js';
import { createPainter } from '../world/painter.js';
import { PROP_DRAWERS } from '../world/prop-drawers.js';
import { GROUND, VIEW_H } from '../world/props.js';
import * as P from '../world/props.js';
import { spriteFrames } from '../world/sprite-cache.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { rng } from '../core/rng.js';

const CAUGHT_LINES = ['آهاا! مسكتك يا سنوكي!', 'تعال حبيبي، بس وخزة صغيرونة!', 'ماكو مهرب من الصحة العامة!'];

function drawObstacle(ctx, o, r) {
  const x = o.x;
  switch (o.type) {
    case 'pot':
      P.pot(ctx, x, GROUND + 2, r, { tone: 'pink' });
      break;
    case 'hose':
      ctx.strokeStyle = '#3f9a5a';
      ctx.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x, GROUND - 6, 22 - i * 5, 8 - i * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 'gnome':
      ctx.fillStyle = '#2f5fd0';
      ctx.fillRect(x - 10, GROUND - 20, 20, 20);
      ctx.fillStyle = '#f7d6c4';
      ctx.beginPath();
      ctx.arc(x, GROUND - 26, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x - 7, GROUND - 24);
      ctx.lineTo(x, GROUND - 12);
      ctx.lineTo(x + 7, GROUND - 24);
      ctx.fill();
      ctx.fillStyle = '#c9304a';
      ctx.beginPath();
      ctx.moveTo(x - 9, GROUND - 30);
      ctx.lineTo(x, GROUND - 46);
      ctx.lineTo(x + 9, GROUND - 30);
      ctx.fill();
      break;
    default:
      P.bench(ctx, x, GROUND + 2);
  }
}

function drawTreat(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 4 + x) * 3);
  ctx.fillStyle = 'rgba(255,240,200,.3)';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f3e3c3';
  ctx.fillRect(-8, -3, 16, 6);
  for (const [dx, dy] of [[-8, -3], [-8, 3], [8, -3], [8, 3]]) {
    ctx.beginPath();
    ctx.arc(dx, dy, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function mount(area, { app, scope, options, hud, finish }) {
  const course = COURSES[options.course || 'conservatory'];
  let s = createChase(course);
  let paused = true;
  let jumpQueued = false;
  let t = 0;
  let caughtLine = null;
  let frames = null;

  const wrap = h(`<div class="runner">
      <canvas class="runner-canvas" aria-label="مطاردة"></canvas>
      <button type="button" class="runner-jump" aria-label="قفزة">⤒</button>
    </div>`);
  area.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const painter = createPainter({ theme: options.theme || 'conservatory', seed: 21, propDrawers: PROP_DRAWERS });
  scope.add(() => painter.dispose());
  let viewW = 400;
  let topY = 0;
  let px = 1;

  function resize() {
    const r = wrap.getBoundingClientRect();
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    // portrait phones zoom in (≥ 300 units wide) so the runners are big enough
    const k = Math.min(r.height / VIEW_H, r.width / (r.width < r.height ? 300 : 420));
    viewW = r.width / k;
    topY = VIEW_H - r.height / k;
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

  const jump = (e) => {
    e?.preventDefault?.();
    jumpQueued = true;
  };
  scope.on(canvas, 'pointerdown', jump);
  scope.on(wrap.querySelector('.runner-jump'), 'pointerdown', jump);
  scope.on(document, 'keydown', (e) => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) jump(e);
  });

  const obstacleRand = course.obstacles.map((o) => rng(o.x));

  function draw() {
    ctx.setTransform(px, 0, 0, px, 0, -topY * px);
    // keep the runners right of centre so Nurse Needle is visible when she gets close
    const camX = Math.max(0, s.x - viewW * 0.58);
    painter.drawBack(ctx, camX, viewW, px, topY);
    ctx.save();
    ctx.translate(-camX, 0);
    // checkpoints + finish
    for (const cp of course.checkpoints.slice(1)) {
      P.lanternPost(ctx, cp, GROUND + 4, { height: 90, lit: s.x >= cp });
    }
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 8; i++) ctx.fillRect(course.length, GROUND - 120 + i * 15, 8, 8 * (i % 2));
    P.creatorMark(ctx, course.length + 4, GROUND - 140, 12, '#9fd7ff');
    course.obstacles.forEach((o, i) => {
      if (o.x > camX - 80 && o.x < camX + viewW + 80) drawObstacle(ctx, o, obstacleRand[i]);
    });
    course.treats.forEach((tr, i) => {
      if (!s.treats.has(i) && tr.x > camX - 40 && tr.x < camX + viewW + 40) drawTreat(ctx, tr.x, GROUND - tr.y - 10, t);
    });
    if (frames) {
      const runIdx = Math.floor(t * 12) % 6;
      const stumbling = s.stumble > 0;
      const a = s.onGround ? frames.anji.run[runIdx] : frames.anji.jump[0];
      const d = s.onGround ? frames.snooki.run[runIdx] : frames.snooki.jump[0];
      const blit = (img, x, y, hgt, flip = false) => {
        const w = (img.width / img.height) * hgt;
        ctx.save();
        ctx.translate(x, y);
        if (flip) ctx.scale(-1, 1);
        if (stumbling) ctx.rotate(Math.sin(t * 30) * 0.08);
        ctx.drawImage(img, -w / 2, -hgt, w, hgt);
        ctx.restore();
      };
      const needleX = s.x - s.gap;
      blit(frames.needle.walk[Math.floor(t * 8) % 4], needleX, GROUND + 4 - Math.abs(Math.sin(t * 8)) * 14, 74);
      blit(d, s.x + 34, GROUND + 2 - s.y, 56);
      blit(a, s.x - 4, GROUND + 3 - s.y, 104);
      if (needleX < camX + 10) {
        // off-screen: an arrow at the left edge shows how close she is
        const near = Math.max(0, 1 - (camX - needleX) / 200);
        ctx.save();
        ctx.globalAlpha = 0.5 + near * 0.5;
        ctx.fillStyle = near > 0.6 ? '#ff6b8a' : '#9fd7ff';
        ctx.beginPath();
        ctx.arc(camX + 18, GROUND - 60, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💉', camX + 18, GROUND - 59);
        ctx.restore();
      }
      if (caughtLine && t < caughtLine.until) {
        ctx.font = '700 12px "Baloo Bhaijaan 2", sans-serif';
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(caughtLine.text).width;
        ctx.fillStyle = 'rgba(255,247,236,.96)';
        ctx.fillRect(needleX - tw / 2 - 8, GROUND - 120, tw + 16, 22);
        ctx.fillStyle = '#c9437a';
        ctx.fillText(caughtLine.text, needleX, GROUND - 105);
      }
    }
    ctx.restore();
    painter.drawFront(ctx, camX, viewW);
  }

  const loop = scope.loop((dt) => {
    t += dt;
    if (!paused) {
      const ev = stepChase(course, s, dt, { jump: jumpQueued });
      jumpQueued = false;
      if (ev.jumped) app.audio.play('jump');
      if (ev.treat) app.audio.play('pickup');
      if (ev.hit) {
        app.audio.play('boing');
        app.audio.vibrate(40);
      }
      if (ev.checkpoint) app.audio.play('sparkle');
      if (ev.caught) {
        app.audio.play('fail');
        caughtLine = { text: CAUGHT_LINES[s.caught % CAUGHT_LINES.length], until: t + 2.2 };
      }
      if (ev.finished) {
        paused = true;
        finish({
          completed: true,
          score: s.treats.size,
          medal: chaseMedal(s),
          title: 'هربتوا! 🐾',
          summary: `بسكويت سنوكي: ${num(s.treats.size)}/${num(course.treats.length)} · تعثّرات: ${num(s.hits)}${s.caught ? ` · انمسكتوا ${num(s.caught)} مرة` : ''}`,
        });
      }
      const pct = Math.min(100, Math.round((s.x / course.length) * 100));
      hud(`🦴 ${num(s.treats.size)} · ${num(pct)}٪ · مسافة الإبرة ${s.gap < 90 ? '⚠️' : '✓'}`);
    }
    draw();
  });

  return {
    async start() {
      // the same frames the scenes use (baked once, shared: world/sprite-cache.js), never released here
      const [anji, snooki, needle] = await Promise.all(['anji', 'snooki', 'needle'].map((k) => spriteFrames(k, app.game.state.cosmetics)));
      if (scope.disposed) return;
      frames = { anji, snooki, needle };
      s = createChase(course);
      paused = false;
      loop.start();
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {
      loop.stop();
    },
    get state() {
      return s;
    },
  };
}

export { CHASE };
