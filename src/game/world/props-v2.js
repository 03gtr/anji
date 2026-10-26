/**
 * V2 props: Ryan's programmer study, the hidden passage and waiting room,
 * the sanctuary meadow (Feroz the kitten and her mother), Robo-Snooki, the
 * recipe board and the letters archive. Procedural canvas drawings, original
 * art. Re-exported by props.js so scenes reach them as P.<name>.
 */
const TAU = Math.PI * 2;
const GROUND = 250;

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/* ── Ryan's study ─────────────────────────────────────────── */

/** Lines of fictional code on a dark screen (deterministic per seed). */
function codeLines(ctx, x, y, w, h, { seed = 1, rows = 9, error = -1, ok = false } = {}) {
  ctx.fillStyle = ok ? '#0e2a52' : '#0b1020';
  ctx.fillRect(x, y, w, h);
  const colors = ['#9fd7ff', '#ffd977', '#e85d8c', '#9ee6a8', '#c9b8de'];
  const lh = h / (rows + 1);
  for (let i = 0; i < rows; i++) {
    let cx = x + 3 + ((i * 7 + seed) % 3) * 4;
    const ly = y + lh * (i + 0.7);
    let k = (i * 13 + seed * 5) % 7;
    while (cx < x + w - 6) {
      const seg = 4 + ((k * 5 + i) % 9);
      if (cx + seg > x + w - 3) break;
      ctx.fillStyle = i === error ? '#ff5470' : colors[k % colors.length];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(cx, ly, seg, Math.max(1, lh * 0.35));
      cx += seg + 3;
      k += 1;
      if (k % 4 === 0) break;
    }
  }
  ctx.globalAlpha = 1;
  if (error >= 0) {
    ctx.fillStyle = 'rgba(255,84,112,.18)';
    ctx.fillRect(x, y + lh * (error + 0.4), w, lh * 0.9);
  }
}

/**
 * The desk: monitor (terminal / debug panel), laptop with GardenCore code,
 * keyboard, cables to a power strip, sticky notes, drawer, a coffee mug.
 * `fixed` turns the laptop screen blue (build passed).
 */
export function programmerDesk(ctx, x, y, { fixed = false, drawerOpen = false, t = 0, reduced = false } = {}) {
  const top = y - 62;
  // cables under the desk to a power strip
  ctx.strokeStyle = '#15161b';
  ctx.lineWidth = 2;
  for (const [sx, c] of [[-70, '#15161b'], [-20, '#2b2f3a'], [40, '#1d1f28']]) {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + sx, top + 6);
    ctx.bezierCurveTo(x + sx, y - 10, x + 90, y - 30, x + 104, y - 4);
    ctx.stroke();
  }
  ctx.fillStyle = '#2b2f3a';
  rrect(ctx, x + 92, y - 8, 30, 7, 2);
  ctx.fill();
  ctx.fillStyle = '#7fd38a';
  ctx.fillRect(x + 96, y - 6, 2, 2);
  // desk
  ctx.fillStyle = '#3a2620';
  ctx.fillRect(x - 128, top + 6, 8, 56);
  ctx.fillRect(x + 120, top + 6, 8, 56);
  ctx.fillStyle = '#5a3a2c';
  ctx.fillRect(x - 134, top, 268, 8);
  ctx.fillStyle = '#4a3026';
  ctx.fillRect(x + 50, top + 8, 70, 30);
  // drawer
  ctx.fillStyle = drawerOpen ? '#2a1a16' : '#5a3a2c';
  ctx.fillRect(x + 56, top + 13 + (drawerOpen ? 6 : 0), 58, 18);
  ctx.fillStyle = '#e2b544';
  ctx.fillRect(x + 80, top + 20 + (drawerOpen ? 6 : 0), 10, 3);
  // little symbol lock on the drawer
  ctx.fillStyle = drawerOpen ? '#7fd38a' : '#9fd7ff';
  ctx.beginPath();
  ctx.arc(x + 106, top + 22 + (drawerOpen ? 6 : 0), 2.5, 0, TAU);
  ctx.fill();

  // monitor on an arm (left): terminal + debug panel
  ctx.fillStyle = '#16161c';
  ctx.fillRect(x - 96, top - 12, 6, 12);
  rrect(ctx, x - 128, top - 74, 74, 62, 4);
  ctx.fill();
  ctx.fillStyle = '#05070f';
  ctx.fillRect(x - 124, top - 70, 66, 54);
  // terminal (left half) and debug panel (right half)
  ctx.font = '700 5px ui-monospace, monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = fixed ? '#9ee6a8' : '#ff8a9c';
  ctx.fillText(fixed ? '$ garden ✓' : '$ build ✗', x - 122, top - 68);
  codeLines(ctx, x - 123, top - 60, 32, 42, { seed: 3, rows: 7, error: fixed ? -1 : 4 });
  ctx.fillStyle = '#121a33';
  ctx.fillRect(x - 89, top - 68, 30, 50);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 2 && !fixed ? '#ff5470' : '#9fd7ff';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x - 86, top - 62 + i * 9, 8 + ((i * 7) % 14), 3);
    ctx.fillStyle = '#ffd977';
    ctx.fillRect(x - 86, top - 58 + i * 9, 4, 2);
  }
  ctx.globalAlpha = 1;
  // blinking cursor
  if (reduced || Math.sin(t * 6) > 0) {
    ctx.fillStyle = '#e8f6ff';
    ctx.fillRect(x - 108, top - 22, 4, 2);
  }
  // sticky notes on the monitor bezel
  for (const [nx, ny, c, r] of [[-60, -76, '#ffe28a', 0.1], [-130, -40, '#f7b6cb', -0.15], [-60, -50, '#9ee6a8', 0.05]]) {
    ctx.save();
    ctx.translate(x + nx, top + ny);
    ctx.rotate(r);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 11, 11);
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(9, 4);
    ctx.moveTo(2, 7);
    ctx.lineTo(7, 7);
    ctx.stroke();
    ctx.restore();
  }

  // laptop (centre)
  ctx.save();
  ctx.translate(x - 8, top);
  ctx.fillStyle = '#9aa3b8';
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(40, 0);
  ctx.lineTo(46, -2);
  ctx.lineTo(-46, -2);
  ctx.fill();
  ctx.fillStyle = '#2b2f3a';
  ctx.beginPath();
  ctx.moveTo(-38, -2);
  ctx.lineTo(-34, -50);
  ctx.lineTo(34, -50);
  ctx.lineTo(38, -2);
  ctx.closePath();
  ctx.fill();
  codeLines(ctx, -32, -47, 64, 41, { seed: 7, rows: 9, error: fixed ? -1 : 5, ok: fixed });
  if (fixed) {
    ctx.fillStyle = '#9ee6a8';
    ctx.font = '700 6px ui-monospace, monospace';
    ctx.fillText('✓ build passed', -28, -16);
  } else {
    ctx.fillStyle = '#ff5470';
    ctx.font = '700 6px ui-monospace, monospace';
    ctx.fillText('✗ build failed', -28, -16);
  }
  // a tiny blue rose sticker on the lid edge
  ctx.fillStyle = '#3f6fe0';
  ctx.beginPath();
  ctx.arc(30, -46, 2.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  // keyboard + mouse
  ctx.fillStyle = '#1d1f28';
  rrect(ctx, x - 40, top - 4, 50, 4, 1);
  ctx.fill();
  ctx.fillStyle = '#2b2f3a';
  ctx.beginPath();
  ctx.ellipse(x + 24, top - 2, 4, 2.4, 0, 0, TAU);
  ctx.fill();
}

/** Coffee mug with steam (still warm). */
export function coffeeMug(ctx, x, y, t = 0, reduced = false) {
  ctx.fillStyle = '#f3f1ff';
  rrect(ctx, x - 6, y - 12, 12, 12, 2);
  ctx.fill();
  ctx.strokeStyle = '#f3f1ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 7, y - 6, 3.4, -1.2, 1.2);
  ctx.stroke();
  ctx.fillStyle = '#5a3420';
  ctx.fillRect(x - 5, y - 11, 10, 2);
  ctx.fillStyle = '#3f6fe0';
  ctx.beginPath();
  ctx.arc(x, y - 5, 2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,246,255,.55)';
  ctx.lineWidth = 1.2;
  for (const dx of [-2, 2]) {
    const s = reduced ? 0 : Math.sin(t * 2 + dx);
    ctx.beginPath();
    ctx.moveTo(x + dx, y - 14);
    ctx.quadraticCurveTo(x + dx + 3 * s, y - 20, x + dx - 1, y - 26);
    ctx.stroke();
  }
}

/** Desk lamp; when lit, a warm cone of light. */
export function deskLamp(ctx, x, y, lit = true) {
  if (lit) {
    const g = ctx.createRadialGradient(x - 10, y - 30, 4, x - 10, y, 110);
    g.addColorStop(0, 'rgba(255,214,140,.38)');
    g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 46);
    ctx.lineTo(x - 120, y);
    ctx.lineTo(x + 40, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#2d2f45';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 6, y - 26);
  ctx.lineTo(x - 8, y - 44);
  ctx.stroke();
  ctx.fillStyle = '#2d2f45';
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 52);
  ctx.lineTo(x - 2, y - 46);
  ctx.lineTo(x - 12, y - 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 7, y - 2, 14, 3);
  if (lit) {
    ctx.fillStyle = '#ffe7a0';
    ctx.beginPath();
    ctx.arc(x - 12, y - 42, 3, 0, TAU);
    ctx.fill();
  }
}

/** Office chair, pulled out and turned, as if someone just stood up. */
export function officeChair(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.12);
  ctx.fillStyle = '#16161c';
  for (const dx of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.arc(dx, -3, 3, 0, TAU);
    ctx.fill();
  }
  ctx.fillRect(-16, -8, 32, 3);
  ctx.fillRect(-2, -30, 4, 22);
  ctx.fillStyle = '#2b3a8c';
  rrect(ctx, -18, -36, 36, 8, 4);
  ctx.fill();
  rrect(ctx, 8, -80, 12, 46, 5);
  ctx.fill();
  ctx.fillStyle = '#23286a';
  ctx.fillRect(10, -76, 3, 38);
  // a hoodie thrown over the back
  ctx.fillStyle = '#2c2f38';
  ctx.beginPath();
  ctx.moveTo(6, -78);
  ctx.quadraticCurveTo(26, -76, 22, -54);
  ctx.lineTo(18, -44);
  ctx.quadraticCurveTo(14, -60, 6, -62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Circuit diagram poster. Up close it is a schematic of a husky
 * ("SNOOKI v1.0") — the study's easter egg.
 */
export function circuitPoster(ctx, x, y, w = 70, h = 54) {
  ctx.fillStyle = '#e9f0ff';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.strokeStyle = '#2f5fd0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = '#1f3f95';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  // a dog-shaped trace: ears, head, body, tail
  ctx.moveTo(x - 20, y + 38);
  ctx.lineTo(x - 20, y + 24);
  ctx.lineTo(x - 14, y + 14);
  ctx.lineTo(x - 10, y + 22);
  ctx.lineTo(x - 4, y + 14);
  ctx.lineTo(x, y + 24);
  ctx.lineTo(x + 16, y + 26);
  ctx.lineTo(x + 22, y + 18);
  ctx.moveTo(x + 16, y + 26);
  ctx.lineTo(x + 16, y + 40);
  ctx.moveTo(x - 20, y + 38);
  ctx.lineTo(x + 16, y + 38);
  ctx.stroke();
  ctx.fillStyle = '#e85d8c';
  for (const [dx, dy] of [[-20, 24], [0, 24], [16, 26], [16, 38], [-20, 38]]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#1f3f95';
  ctx.font = '700 5px ui-monospace, monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('SNOOKI v1.0', x - w / 2 + 6, y + h - 10);
  // pins
  ctx.fillStyle = '#e2405f';
  ctx.beginPath();
  ctx.arc(x - w / 2 + 4, y + 2, 2, 0, TAU);
  ctx.arc(x + w / 2 - 4, y + 2, 2, 0, TAU);
  ctx.fill();
}

/** A second schematic: an honest circuit, for the wall's rhythm. */
export function circuitDiagram(ctx, x, y, w = 56, h = 44) {
  ctx.fillStyle = '#1b2350';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.strokeStyle = '#9fd7ff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 6, y + 10);
  ctx.lineTo(x + w / 2 - 6, y + 10);
  ctx.lineTo(x + w / 2 - 6, y + h - 8);
  ctx.lineTo(x - 6, y + h - 8);
  ctx.moveTo(x - w / 2 + 6, y + 10);
  ctx.lineTo(x - w / 2 + 6, y + h - 8);
  ctx.lineTo(x - 14, y + h - 8);
  ctx.stroke();
  ctx.fillStyle = '#ffd977';
  ctx.fillRect(x - 14, y + h - 12, 8, 8);
  ctx.strokeStyle = '#ffd977';
  ctx.strokeRect(x - 4, y + 16, 14, 10);
}

/**
 * Glow-in-the-dark symbols on the wall, only visible with the lamp off.
 * Drawn so that reading right → left gives: rose, car, paw, moon.
 */
export function wallSymbols(ctx, x, y, alpha = 1, t = 0) {
  if (alpha <= 0) return;
  const order = ['rose', 'car', 'paw', 'moon']; // right → left
  ctx.save();
  ctx.globalAlpha = alpha * (0.8 + 0.2 * Math.sin(t * 2));
  ctx.strokeStyle = '#b6ff9e';
  ctx.fillStyle = '#b6ff9e';
  ctx.shadowColor = '#7dff6a';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  order.forEach((kind, i) => {
    const cx = x + 54 - i * 36;
    const cy = y;
    ctx.beginPath();
    if (kind === 'rose') {
      ctx.arc(cx, cy - 2, 6, 0, TAU);
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx, cy + 12);
      ctx.moveTo(cx, cy + 8);
      ctx.lineTo(cx + 5, cy + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 2.4, 0, TAU);
      ctx.fill();
    } else if (kind === 'car') {
      ctx.moveTo(cx - 11, cy + 6);
      ctx.lineTo(cx - 10, cy);
      ctx.lineTo(cx - 4, cy - 1);
      ctx.lineTo(cx, cy - 6);
      ctx.lineTo(cx + 6, cy - 6);
      ctx.lineTo(cx + 11, cy);
      ctx.lineTo(cx + 11, cy + 6);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 7, 2.4, 0, TAU);
      ctx.arc(cx + 6, cy + 7, 2.4, 0, TAU);
      ctx.fill();
    } else if (kind === 'paw') {
      ctx.ellipse(cx, cy + 4, 5, 4, 0, 0, TAU);
      ctx.fill();
      for (const [dx, dy] of [[-6, -3], [-2, -7], [2, -7], [6, -3]]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 2, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.arc(cx, cy, 8, Math.PI * 0.3, Math.PI * 1.7);
      ctx.arc(cx + 4, cy, 6, Math.PI * 1.6, Math.PI * 0.4, true);
      ctx.fill();
    }
  });
  ctx.restore();
}

/** Tall bookshelf with a small rose-shaped lock; `open` slides it aside. */
export function secretShelf(ctx, x, y, { open = 0, rand } = {}) {
  const w = 86;
  const h = 170;
  if (open > 0) {
    // the dark opening behind the shelf
    ctx.fillStyle = '#05060f';
    ctx.fillRect(x - w / 2, y - h, w, h);
    const g = ctx.createLinearGradient(x, y - h, x, y);
    g.addColorStop(0, 'rgba(159,215,255,.06)');
    g.addColorStop(1, 'rgba(159,215,255,.18)');
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y - h, w, h);
  }
  ctx.save();
  ctx.translate(open * w * 0.92, 0);
  ctx.fillStyle = '#3b2630';
  ctx.fillRect(x - w / 2, y - h, w, h);
  const colors = ['#8e1c2e', '#2f5fd0', '#e2b544', '#2f6a5a', '#6b4fa0', '#c9a77a'];
  for (let r = 0; r < 4; r++) {
    const sy = y - h + 8 + r * 40;
    ctx.fillStyle = '#2a1a22';
    ctx.fillRect(x - w / 2 + 4, sy + 32, w - 8, 4);
    let bx = x - w / 2 + 6;
    let i = r;
    while (bx < x + w / 2 - 10) {
      const bw = 4 + ((i * 7) % 5);
      const bh = 24 + ((i * 5) % 8);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(bx, sy + 32 - bh, bw, bh);
      bx += bw + 1;
      i += rand ? 1 : 2;
    }
  }
  // the rose lock in the frame
  ctx.fillStyle = '#e2b544';
  ctx.beginPath();
  ctx.arc(x + w / 2 - 8, y - h / 2, 4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3f6fe0';
  ctx.beginPath();
  ctx.arc(x + w / 2 - 8, y - h / 2, 2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* ── Hidden passage & waiting room ───────────────────────── */

export function wallTorch(ctx, x, y, t = 0, reduced = false) {
  const f = reduced ? 1 : 0.85 + Math.sin(t * 9 + x) * 0.15;
  const g = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, 60 * f);
  g.addColorStop(0, 'rgba(159,215,255,.35)');
  g.addColorStop(1, 'rgba(159,215,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 10, 60 * f, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a3d52';
  ctx.fillRect(x - 3, y - 4, 6, 14);
  // a blue "flame": a lamp bulb in the shape of a rose bud
  ctx.fillStyle = '#9fd7ff';
  ctx.beginPath();
  ctx.ellipse(x, y - 10, 4 * f, 7 * f, 0, 0, TAU);
  ctx.fill();
}

export function lever(ctx, x, y, on = false) {
  ctx.fillStyle = '#3a3d52';
  ctx.fillRect(x - 12, y - 30, 24, 30);
  ctx.strokeStyle = '#9aa3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x + (on ? 14 : -14), y - 40);
  ctx.stroke();
  ctx.fillStyle = on ? '#7fd38a' : '#e85d8c';
  ctx.beginPath();
  ctx.arc(x + (on ? 14 : -14), y - 40, 5, 0, TAU);
  ctx.fill();
}

export function stoneDoor(ctx, x, y, open = 0) {
  ctx.fillStyle = '#05060f';
  ctx.fillRect(x - 30, y - 120, 60, 120);
  ctx.fillStyle = '#4b4f68';
  ctx.fillRect(x - 30, y - 120 - open * 112, 60, 120);
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  for (let r = 0; r < 4; r++) ctx.strokeRect(x - 30, y - 120 - open * 112 + r * 30, 60, 30);
  ctx.fillStyle = '#9fd7ff';
  ctx.beginPath();
  ctx.arc(x, y - 66 - open * 112, 3, 0, TAU);
  ctx.fill();
}

/**
 * The waiting-room window: a night road outside, a pale clock beside it
 * (stopped at 2:30 too), a single chair and a folded blanket.
 */
export function waitingWindow(ctx, x, y, t = 0) {
  const w = 120;
  const h = 90;
  const wx = x - w / 2;
  const wy = y - 170;
  const g = ctx.createLinearGradient(0, wy, 0, wy + h);
  g.addColorStop(0, '#0b1040');
  g.addColorStop(1, '#3b3a7a');
  ctx.fillStyle = g;
  ctx.fillRect(wx, wy, w, h);
  // the road winding toward the horizon, with small blue lights
  ctx.fillStyle = '#1a1d2e';
  ctx.beginPath();
  ctx.moveTo(wx + 20, wy + h);
  ctx.quadraticCurveTo(wx + 70, wy + h - 30, wx + 64, wy + 48);
  ctx.lineTo(wx + 68, wy + 48);
  ctx.quadraticCurveTo(wx + 82, wy + h - 30, wx + 60, wy + h);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `rgba(159,215,255,${0.4 + 0.3 * Math.sin(t * 2 + i)})`;
    ctx.beginPath();
    ctx.arc(wx + 36 + i * 7, wy + h - 6 - i * 8, 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#fff4d6';
  ctx.beginPath();
  ctx.arc(wx + w - 22, wy + 18, 7, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3b2630';
  ctx.lineWidth = 5;
  ctx.strokeRect(wx, wy, w, h);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, wy);
  ctx.lineTo(x, wy + h);
  ctx.stroke();
  ctx.fillStyle = '#3b2630';
  ctx.fillRect(wx - 8, wy + h, w + 16, 7);
  // small wall clock at 2:30
  const cx = wx - 30;
  const cy = wy + 20;
  ctx.fillStyle = '#f3e3c3';
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3b2630';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin((2.5 / 12) * TAU) * 5.5, cy - Math.cos((2.5 / 12) * TAU) * 5.5);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy + 8);
  ctx.stroke();
  // chair facing the window + blanket
  ctx.fillStyle = '#5a3a2c';
  ctx.fillRect(x - 34, y - 34, 40, 6);
  ctx.fillRect(x - 32, y - 28, 4, 28);
  ctx.fillRect(x + 2, y - 28, 4, 28);
  ctx.fillRect(x - 36, y - 76, 6, 46);
  ctx.fillStyle = '#2b3a8c';
  ctx.fillRect(x - 30, y - 42, 30, 8);
  ctx.fillStyle = '#9fd7ff';
  ctx.fillRect(x - 30, y - 39, 30, 2);
}

/* ── Sanctuary meadow: Feroz the kitten and her mother ──────── */

/** A cat (sitting). `small` draws the kitten; `tone` the fur colour. */
export function cat(ctx, x, y, { small = false, tone = '#e9e3d6', patch = '#b7aa94', t = 0, facing = 1, sad = false, reduced = false } = {}) {
  const s = small ? 0.55 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * s, s);
  const tail = reduced ? 0 : Math.sin(t * 2.4) * 0.25;
  // tail
  ctx.strokeStyle = tone;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.quadraticCurveTo(-34, -10 + tail * 20, -28, -34 + tail * 10);
  ctx.stroke();
  // body
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.ellipse(0, -16, 18, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = patch;
  ctx.beginPath();
  ctx.ellipse(-6, -20, 8, 7, 0.4, 0, TAU);
  ctx.fill();
  // head
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.arc(10, -38, 12, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -46);
  ctx.lineTo(3, -58);
  ctx.lineTo(10, -49);
  ctx.moveTo(12, -49);
  ctx.lineTo(19, -58);
  ctx.lineTo(20, -45);
  ctx.fill();
  ctx.fillStyle = '#f7b6cb';
  ctx.beginPath();
  ctx.moveTo(4, -48);
  ctx.lineTo(5, -54);
  ctx.lineTo(8, -49);
  ctx.moveTo(14, -49);
  ctx.lineTo(18, -54);
  ctx.lineTo(18, -47);
  ctx.fill();
  // eyes: blue-green (turquoise, like her name)
  ctx.fillStyle = '#2bb5a0';
  for (const ex of [6, 15]) {
    ctx.beginPath();
    if (sad) ctx.ellipse(ex, -39, 2.2, 1.4, 0, 0, TAU);
    else ctx.ellipse(ex, -39, 2.2, 2.8, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#16161c';
  for (const ex of [6, 15]) ctx.fillRect(ex - 0.5, -41, 1, 4);
  ctx.fillStyle = '#e8899e';
  ctx.beginPath();
  ctx.moveTo(10, -34);
  ctx.lineTo(12, -34);
  ctx.lineTo(11, -32.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,50,60,.55)';
  ctx.lineWidth = 0.7;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(11 + d * 3, -33);
    ctx.lineTo(11 + d * 12, -34 + d);
    ctx.stroke();
  }
  // front paws
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.ellipse(6, -2, 5, 3, 0, 0, TAU);
  ctx.ellipse(16, -2, 5, 3, 0, 0, TAU);
  ctx.fill();
  if (small) {
    // a little blue ribbon
    ctx.fillStyle = '#3f6fe0';
    ctx.fillRect(4, -28, 14, 3);
  }
  ctx.restore();
}

/** Big climbable tree for the meadow (the branches are scene platforms). */
export function meadowTree(ctx, x, y, t = 0) {
  ctx.fillStyle = '#3a2a22';
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x - 8, y - 190);
  ctx.lineTo(x + 8, y - 190);
  ctx.lineTo(x + 16, y);
  ctx.fill();
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x, y - 110);
  ctx.lineTo(x + 70, y - 132);
  ctx.moveTo(x, y - 160);
  ctx.lineTo(x - 64, y - 178);
  ctx.stroke();
  for (const [dx, dy, r, c] of [[0, -210, 54, '#1f4a3c'], [-50, -180, 36, '#285a48'], [56, -150, 38, '#285a48'], [20, -240, 34, '#2f6a54']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy + Math.sin(t + dx) * 1.2, r, 0, TAU);
    ctx.fill();
  }
}

/* ── Robo-Snooki ─────────────────────────────────────────── */
export function roboDog(ctx, x, y, { awake = false, t = 0, facing = 1, reduced = false } = {}) {
  const bob = awake && !reduced ? Math.abs(Math.sin(t * 6)) * 2 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(facing, 1);
  ctx.fillStyle = '#16161c';
  for (const lx of [-12, -4, 6, 14]) ctx.fillRect(lx, -10, 4, 10);
  ctx.fillStyle = '#c7d3e6';
  rrect(ctx, -18, -26, 38, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#9aa3b8';
  ctx.fillRect(-12, -22, 22, 3);
  // tail antenna
  ctx.strokeStyle = '#9aa3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, -22);
  ctx.lineTo(-26, -32 + (awake && !reduced ? Math.sin(t * 10) * 3 : 0));
  ctx.stroke();
  ctx.fillStyle = awake ? '#7fd38a' : '#e85d8c';
  ctx.beginPath();
  ctx.arc(-26, -33, 2.4, 0, TAU);
  ctx.fill();
  // head + ears
  ctx.fillStyle = '#e8f6ff';
  rrect(ctx, 10, -42, 22, 18, 5);
  ctx.fill();
  ctx.fillStyle = '#9aa3b8';
  ctx.beginPath();
  ctx.moveTo(12, -42);
  ctx.lineTo(14, -52);
  ctx.lineTo(19, -42);
  ctx.moveTo(23, -42);
  ctx.lineTo(28, -52);
  ctx.lineTo(30, -42);
  ctx.fill();
  // screen face
  ctx.fillStyle = '#0b1020';
  rrect(ctx, 14, -38, 15, 10, 2);
  ctx.fill();
  ctx.fillStyle = awake ? '#9fd7ff' : '#3a3d52';
  ctx.fillRect(17, -35, 3, 3);
  ctx.fillRect(23, -35, 3, 3);
  if (awake) {
    ctx.fillStyle = '#9fd7ff';
    ctx.fillRect(19, -31, 5, 1.4);
  }
  // blue collar tag (like Snooki's)
  ctx.fillStyle = '#2b3a8c';
  ctx.fillRect(10, -26, 8, 3);
  ctx.fillStyle = '#3f6fe0';
  ctx.beginPath();
  ctx.arc(14, -21, 2.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* ── Kitchen recipe board ──────────────────────────────────── */
export function recipeBoard(ctx, x, y, { torn = true } = {}) {
  ctx.fillStyle = '#6b4a3a';
  ctx.fillRect(x - 26, y, 52, 40);
  ctx.fillStyle = '#c9a77a';
  ctx.fillRect(x - 23, y + 3, 46, 34);
  ctx.fillStyle = '#fff6e6';
  ctx.save();
  ctx.translate(x - 4, y + 8);
  ctx.rotate(-0.06);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(22, 0);
  ctx.lineTo(22, 10);
  if (torn) {
    ctx.lineTo(18, 13);
    ctx.lineTo(14, 9);
    ctx.lineTo(9, 14);
    ctx.lineTo(4, 10);
  } else ctx.lineTo(22, 24);
  ctx.lineTo(0, torn ? 12 : 24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a88b5c';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(3, 4);
  ctx.lineTo(18, 4);
  ctx.moveTo(3, 7);
  ctx.lineTo(14, 7);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#e2405f';
  ctx.beginPath();
  ctx.arc(x + 7, y + 8, 1.8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe28a';
  ctx.fillRect(x - 20, y + 20, 12, 10);
}

/* ── Letters archive (memory corridor) ─────────────────────── */
export function archiveCabinet(ctx, x, y, { filled = 0, open = false } = {}) {
  ctx.fillStyle = '#4a3040';
  ctx.fillRect(x - 36, y - 96, 72, 96);
  ctx.fillStyle = '#3b2630';
  ctx.fillRect(x - 40, y - 100, 80, 6);
  for (let i = 0; i < 8; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const sx = x - 30 + col * 16;
    const sy = y - 86 + row * 22;
    ctx.fillStyle = i < filled ? '#ffe28a' : '#22141c';
    ctx.fillRect(sx, sy, 12, 4);
  }
  ctx.fillStyle = open ? '#22141c' : '#5a3a4a';
  ctx.fillRect(x - 30, y - 38 + (open ? 6 : 0), 60, 26);
  ctx.fillStyle = '#e2b544';
  ctx.fillRect(x - 6, y - 28 + (open ? 6 : 0), 12, 3);
  if (open) {
    ctx.fillStyle = '#f7c6d6';
    ctx.fillRect(x - 10, y - 40, 20, 12);
  }
}
