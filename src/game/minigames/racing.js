/**
 * Road of Blue Lights — top-down night race in Ryan's blue supercar.
 * Steer with ◀ ▶ / arrow keys, or drag a finger left/right on the road.
 * Throttle is automatic; mistakes only cost time.
 */
import { TRACKS, CAR, OBSTACLE_SIZES, centerAt, createRace, stepRace, raceMedal } from './racing-logic.js';
import { h, ICONS } from '../ui/dom.js';
import { num, raceTime } from '../ui/format.js';

const CAR_COLORS = { cobalt: '#1f4fd1', midnight: '#1a1f5e', rose: '#e0567f', pearl: '#e9e7f2' };

export function mount(area, { app, scope, options, hud, finish }) {
  const track = TRACKS[options.track || 'moon'];
  let s = createRace(track);
  let paused = true;
  let countdown = 3.2;
  let steer = 0;
  let fingerX = null;
  let camX = 0;
  let t = 0;
  const color = CAR_COLORS[app.game.state.cosmetics.carColor] || CAR_COLORS.cobalt;

  const wrap = h(`<div class="race">
      <canvas class="runner-canvas" aria-label="سباق"></canvas>
      <div class="race-count" aria-live="assertive"></div>
      <div class="race-pad">
        <button type="button" class="pad-btn" data-steer="-1" aria-label="يسار">${ICONS.left}</button>
        <button type="button" class="pad-btn" data-steer="1" aria-label="يمين">${ICONS.right}</button>
      </div>
    </div>`);
  area.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const countEl = wrap.querySelector('.race-count');
  let W = 300;
  let H = 500;
  let k = 1;
  let dpr = 1;

  function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    k = Math.min(W / (track.roadHalf * 2 + 80), H / 340);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  resize();
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    scope.add(() => ro.disconnect());
  }

  // steering inputs
  const held = new Map();
  const updateSteer = () => {
    steer = [...held.values()].reduce((a, b) => a + b, 0);
  };
  wrap.querySelectorAll('[data-steer]').forEach((b) => {
    const v = Number(b.dataset.steer);
    scope.on(b, 'pointerdown', (e) => {
      e.preventDefault();
      b.setPointerCapture?.(e.pointerId);
      held.set(`p${e.pointerId}`, v);
      updateSteer();
    });
    const up = (e) => {
      held.delete(`p${e.pointerId}`);
      updateSteer();
    };
    scope.on(b, 'pointerup', up);
    scope.on(b, 'pointercancel', up);
    scope.on(b, 'lostpointercapture', up);
  });
  const toLateral = (clientX) => {
    const r = canvas.getBoundingClientRect();
    return camX + (clientX - r.left - W / 2) / k;
  };
  scope.on(canvas, 'pointerdown', (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    fingerX = toLateral(e.clientX);
  });
  scope.on(canvas, 'pointermove', (e) => {
    if (fingerX !== null) fingerX = toLateral(e.clientX);
  });
  const lift = () => {
    fingerX = null;
  };
  scope.on(canvas, 'pointerup', lift);
  scope.on(canvas, 'pointercancel', lift);
  const KEYS = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };
  scope.on(document, 'keydown', (e) => {
    if (KEYS[e.code] != null) {
      e.preventDefault();
      held.set(`k${e.code}`, KEYS[e.code]);
      updateSteer();
    }
  });
  scope.on(document, 'keyup', (e) => {
    if (KEYS[e.code] != null) {
      held.delete(`k${e.code}`);
      updateSteer();
    }
  });

  /* ── drawing ── */
  const Y = () => H * 0.76; // car's screen y
  const sy = (d) => Y() - (d - s.d) * k;
  const sx = (x) => W / 2 + (x - camX) * k;

  function drawCar(x, y, body, { player = false, angle = 0 } = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(k, k);
    if (player) {
      const g = ctx.createRadialGradient(0, -60, 4, 0, -60, 80);
      g.addColorStop(0, 'rgba(190,230,255,.45)');
      g.addColorStop(1, 'rgba(190,230,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(-48, -130);
      ctx.lineTo(48, -130);
      ctx.lineTo(10, -18);
      ctx.fill();
      if (s.boost > 0) {
        ctx.fillStyle = `rgba(111,211,255,${0.6 + 0.3 * Math.sin(t * 40)})`;
        ctx.beginPath();
        ctx.moveTo(-8, 18);
        ctx.lineTo(0, 34 + Math.random() * 8);
        ctx.lineTo(8, 18);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(-14, -17, 30, 38);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect?.(-15, -19, 30, 38, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(190,225,255,.9)';
    ctx.beginPath();
    ctx.roundRect?.(-11, -9, 22, 9, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(-11, 1, 22, 9);
    if (player) {
      // Anji (driver, auburn hair + bow) and Snooki (white, ears up)
      ctx.fillStyle = '#9c4a26';
      ctx.beginPath();
      ctx.arc(-5, 4, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8e1c2e';
      ctx.fillRect(-7, 7, 4, 2);
      ctx.fillStyle = '#fbfbfd';
      ctx.beginPath();
      ctx.arc(5.5, 4, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2.5, 1);
      ctx.lineTo(3.5, -3);
      ctx.lineTo(5, 0.5);
      ctx.moveTo(6.5, 0.5);
      ctx.lineTo(8, -3);
      ctx.lineTo(8.6, 1);
      ctx.fill();
    }
    ctx.fillStyle = '#bfe3ff';
    ctx.fillRect(-13, -20, 6, 3);
    ctx.fillRect(7, -20, 6, 3);
    ctx.fillStyle = '#ff4a6a';
    ctx.fillRect(-13, 17, 6, 2.5);
    ctx.fillRect(7, 17, 6, 2.5);
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d2626';
    ctx.fillRect(0, 0, W, H);
    const dTop = s.d + Y() / k + 40;
    const dBottom = s.d - (H - Y()) / k - 40;
    // roadside: blue roses and lamps, placed every 60 units
    for (let d = Math.floor(dBottom / 60) * 60; d < dTop; d += 60) {
      const c = centerAt(track, d);
      const r = Math.abs(Math.sin(d * 12.9898) * 43758.5453) % 1;
      for (const side of [-1, 1]) {
        const x = c + side * (track.roadHalf + 26 + r * 70);
        ctx.fillStyle = r > 0.5 ? '#3f6fe0' : '#e85d8c';
        ctx.beginPath();
        ctx.arc(sx(x), sy(d), 3.2 * k, 0, Math.PI * 2);
        ctx.fill();
      }
      if (Math.round(d) % 480 === 0) {
        for (const side of [-1, 1]) {
          const x = sx(c + side * (track.roadHalf + 18));
          const g = ctx.createRadialGradient(x, sy(d), 1, x, sy(d), 46 * k);
          g.addColorStop(0, 'rgba(255,214,140,.55)');
          g.addColorStop(1, 'rgba(255,214,140,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - 46 * k, sy(d) - 46 * k, 92 * k, 92 * k);
          ctx.fillStyle = '#ffd98a';
          ctx.beginPath();
          ctx.arc(x, sy(d), 3 * k, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // road strips
    const step = 18;
    for (let d = Math.floor(dBottom / step) * step; d < dTop; d += step) {
      const c0 = centerAt(track, d);
      const c1 = centerAt(track, d + step);
      const y0 = sy(d);
      const y1 = sy(d + step);
      const curb = Math.floor(d / 36) % 2 ? '#e9e7f2' : '#c9304a';
      const quad = (a0, b0, a1, b1, fill) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(sx(a0), y0);
        ctx.lineTo(sx(b0), y0);
        ctx.lineTo(sx(b1), y1 - 0.5);
        ctx.lineTo(sx(a1), y1 - 0.5);
        ctx.fill();
      };
      quad(c0 - track.roadHalf - 7, c0 + track.roadHalf + 7, c1 - track.roadHalf - 7, c1 + track.roadHalf + 7, curb);
      quad(c0 - track.roadHalf, c0 + track.roadHalf, c1 - track.roadHalf, c1 + track.roadHalf, '#262a44');
      if (Math.floor(d / 54) % 2 === 0) quad(c0 - 2, c0 + 2, c1 - 2, c1 + 2, 'rgba(111,211,255,.75)');
    }
    if (track.length > dBottom && track.length < dTop) {
      const c = centerAt(track, track.length);
      for (let i = -6; i < 6; i++) {
        ctx.fillStyle = (i + 6) % 2 ? '#fff' : '#16161c';
        ctx.fillRect(sx(c + i * (track.roadHalf / 6)), sy(track.length), (track.roadHalf / 6) * k, 8 * k);
      }
    }
    // boosts, orbs, obstacles
    track.boosts.forEach(([d, x], i) => {
      if (d < dBottom || d > dTop || s.usedBoosts.has(i)) return;
      ctx.fillStyle = '#ffd977';
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(sx(x - 14), sy(d - 12 + j * 10));
        ctx.lineTo(sx(x), sy(d - 2 + j * 10));
        ctx.lineTo(sx(x + 14), sy(d - 12 + j * 10));
        ctx.lineTo(sx(x + 14), sy(d - 7 + j * 10));
        ctx.lineTo(sx(x), sy(d + 3 + j * 10));
        ctx.lineTo(sx(x - 14), sy(d - 7 + j * 10));
        ctx.fill();
      }
    });
    track.orbs.forEach(([d, x], i) => {
      if (d < dBottom || d > dTop || s.orbs.has(i)) return;
      const g = ctx.createRadialGradient(sx(x), sy(d), 1, sx(x), sy(d), 14 * k);
      g.addColorStop(0, 'rgba(159,215,255,1)');
      g.addColorStop(1, 'rgba(159,215,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx(x), sy(d), (12 + Math.sin(t * 6 + i) * 2) * k, 0, Math.PI * 2);
      ctx.fill();
    });
    track.obstacles.forEach((o, i) => {
      const tc = o[2] === 'car' ? s.traffic.find((c) => c.i === i) : null;
      const d = tc ? tc.d : o[0];
      const x = tc ? tc.x : o[1];
      if (d < dBottom || d > dTop) return;
      if (o[2] === 'cone') {
        ctx.fillStyle = s.hitSet.has(i) ? 'rgba(240,138,60,.35)' : '#f08a3c';
        ctx.beginPath();
        ctx.arc(sx(x), sy(d), 7 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx(x), sy(d), 3 * k, 0, Math.PI * 2);
        ctx.fill();
      } else if (o[2] === 'oil') {
        ctx.fillStyle = '#08080e';
        ctx.beginPath();
        ctx.ellipse(sx(x), sy(d), (OBSTACLE_SIZES.oil.w / 2) * k, (OBSTACLE_SIZES.oil.len / 2) * k, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(159,215,255,.35)';
        ctx.stroke();
      } else drawCar(sx(x), sy(d), '#c9b8de');
    });
    // player
    const lean = (fingerX !== null ? Math.sign(fingerX - s.x) : steer) * 0.12 + (s.slip > 0 ? Math.sin(t * 20) * 0.2 : 0);
    drawCar(sx(s.x) + (s.bump > 0 ? Math.sin(t * 60) * 3 : 0), Y(), color, { player: true, angle: lean });
  }

  const loop = scope.loop((dt) => {
    t += dt;
    if (!paused) {
      if (countdown > 0) {
        const before = Math.ceil(countdown);
        countdown -= dt;
        const now = Math.ceil(countdown);
        countEl.textContent = countdown > 0 ? num(now) : 'انطلقي!';
        if (now !== before) app.audio.play(now > 0 ? 'tap' : 'success');
        if (countdown <= 0) scope.timeout(() => (countEl.textContent = ''), 700);
      } else {
        const ev = stepRace(track, s, dt, fingerX !== null ? { targetX: fingerX } : { steer });
        if (ev.orb) app.audio.play('pickup');
        if (ev.hit) {
          app.audio.play('hit');
          app.audio.vibrate(50);
        }
        if (ev.boost) app.audio.play('whoosh');
        if (ev.oil) app.audio.play('boing');
        if (ev.finished) {
          paused = true;
          const medal = raceMedal(track, s.t);
          finish({
            completed: true,
            score: Math.round(s.t * 10) / 10,
            lowerIsBetter: true,
            medal,
            title: `${track.name}: وصلتي! 🏁`,
            summary: `الوقت ${raceTime(s.t)} · أضواء ${num(s.orbs.size)}/${num(track.orbs.length)} · اصطدامات ${num(s.hits)} (الذهبية تحت ${raceTime(track.medals.gold)})`,
          });
        }
      }
      // camera follows the car, leaning toward the road
      camX += (s.x * 0.7 + centerAt(track, s.d + 160) * 0.3 - camX) * Math.min(1, dt * 4);
      hud(`⏱ ${raceTime(s.t)} · 💡 ${num(s.orbs.size)} · ${num(Math.round((s.v / CAR.vmax) * 100))}٪`);
    }
    draw();
  });

  return {
    start() {
      s = createRace(track);
      countdown = 3.2;
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
