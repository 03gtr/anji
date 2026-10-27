/**
 * Lantern lake — tap the rising lanterns to send them to the sky. At the end
 * the released lanterns spell a message over the water.
 */
import { FIELD, createLake, stepLake, tapLake, lanternX, lakeMedal } from './lanterns-logic.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';

export function mount(area, { app, scope, options, hud, finish }) {
  let s = createLake({ duration: options.duration || 45, goal: options.goal || 30, seed: options.seed || Date.now() % 9973 });
  let paused = true;
  let t = 0;
  const flying = []; // released lanterns floating away (decoration)
  const pops = [];
  const wrap = h('<div class="runner lake"><canvas class="runner-canvas" aria-label="بحيرة الفوانيس"></canvas></div>');
  area.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let W = 300;
  let H = 480;
  let k = 3;
  let ox = 0;
  let oy = 0;
  let dpr = 1;

  function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    k = Math.min(W / FIELD.w, H / FIELD.h);
    ox = (W - FIELD.w * k) / 2;
    oy = (H - FIELD.h * k) / 2;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  resize();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    scope.add(() => ro.disconnect());
  }

  scope.on(canvas, 'pointerdown', (e) => {
    if (paused) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left - ox) / k;
    const y = (e.clientY - r.top - oy) / k;
    // generous reach on small screens (≈ 30 css px)
    const res = tapLake(s, x, y, Math.max(9, 30 / k));
    if (res) {
      app.audio.play(res.lantern.kind === 'blue' ? 'pickup' : 'sparkle');
      flying.push({ x: lanternX(res.lantern), y: res.lantern.y, kind: res.lantern.kind, life: 1.6 });
      pops.push({ x: lanternX(res.lantern), y: res.lantern.y, text: `+${num(res.points)}`, life: 0.8 });
    } else app.audio.play('tap');
  });

  const COLORS = { blue: ['#6fd3ff', '#2f5fd0'], gold: ['#ffe28a', '#d8a73a'], heart: ['#ff9ec4', '#e0567f'] };
  function drawLantern(x, y, kind, alpha = 1, scale = 1) {
    const [glow, body] = COLORS[kind];
    const px = ox + x * k;
    const py = oy + y * k;
    const r = 4.2 * k * scale;
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(px, py, 1, px, py, r * 3);
    g.addColorStop(0, glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect?.(px - r * 0.8, py - r, r * 1.6, r * 2, r * 0.6);
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.fillRect(px - r * 0.5, py - r * 0.6, r, r * 1.2);
    if (kind === 'heart') {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(r * 1.1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♥', px, py);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b0e30');
    sky.addColorStop(0.6, '#23286a');
    sky.addColorStop(1, '#2b3a8c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // moon and its reflection
    const mx = W * 0.72;
    const my = H * 0.16;
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.arc(mx, my, 18, 0, Math.PI * 2);
    ctx.fill();
    const waterY = oy + (FIELD.h - 16) * k;
    ctx.fillStyle = '#10163f';
    ctx.fillRect(0, waterY, W, H - waterY);
    ctx.fillStyle = 'rgba(255,244,214,.25)';
    for (let i = 0; i < 6; i++) ctx.fillRect(mx - 22 + Math.sin(t * 2 + i) * 6, waterY + 8 + i * 9, 44 - i * 5, 2);
    // dock with Anji & Snooki silhouettes
    ctx.fillStyle = '#3a2a22';
    ctx.fillRect(0, waterY - 6, W * 0.32, 8);
    ctx.fillStyle = '#16122a';
    ctx.beginPath();
    ctx.ellipse(W * 0.12, waterY - 26, 7, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(W * 0.2, waterY - 14, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const f of flying) drawLantern(f.x, f.y, f.kind, Math.max(0, f.life / 1.6), 0.8);
    for (const l of s.lanterns) drawLantern(lanternX(l), l.y, l.kind);
    ctx.font = '700 16px "Baloo Bhaijaan 2", sans-serif';
    ctx.textAlign = 'center';
    for (const p of pops) {
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillStyle = '#ffe28a';
      ctx.fillText(p.text, ox + p.x * k, oy + p.y * k - 20);
    }
    ctx.globalAlpha = 1;
    if (s.done && options.message) {
      ctx.fillStyle = 'rgba(255,226,138,.95)';
      ctx.font = '700 22px "Baloo Bhaijaan 2", sans-serif';
      ctx.direction = 'rtl';
      ctx.fillText(options.message, W / 2, H * 0.32);
    }
  }

  const loop = scope.loop((dt) => {
    t += dt;
    if (!paused) {
      const ev = stepLake(s, dt);
      if (ev.missed) app.audio.play('tap');
      hud(`🏮 ${num(s.score)} · سلسلة ${num(s.combo)} · ${num(Math.max(0, Math.ceil(s.duration - s.t)))}ث`);
      if (ev.finished) {
        paused = true;
        scope.timeout(
          () =>
            finish({
              completed: true,
              score: s.score,
              medal: lakeMedal(s),
              title: 'الفوانيس طارت… 🏮',
              summary: `نقاط: ${num(s.score)} · فوانيس: ${num(s.caught)} · أطول سلسلة: ${num(s.bestCombo)}`,
            }),
          1800,
        );
      }
    }
    for (const f of flying) {
      f.y -= 40 * dt;
      f.life -= dt;
    }
    for (const p of pops) p.life -= dt;
    while (flying.length && flying[0].life <= 0) flying.shift();
    while (pops.length && pops[0].life <= 0) pops.shift();
    draw();
  });

  return {
    start() {
      s = createLake({ duration: options.duration || 45, goal: options.goal || 30, seed: options.seed || Date.now() % 9973 });
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
