/**
 * V3 props: the games room («صالة ألعاب ريان وأنجي»). Procedural canvas
 * drawings, original art, lit by the same warm-lamp / cool-moon scheme as
 * the characters (see characters/lighting.js and docs/ART_PIPELINE.md).
 */
const TAU = Math.PI * 2;
const GROUND = 250;

function softShadow(ctx, x, y, rx, ry) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
  g.addColorStop(0, 'rgba(8,10,30,.45)');
  g.addColorStop(1, 'rgba(8,10,30,0)');
  ctx.fillStyle = g;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function miniCard(ctx, x, y, rot, face = true, color = '#3f6fe0') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = face ? '#fff7ec' : color;
  ctx.fillRect(-5, -7, 10, 14);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(-5, -7, 10, 14);
  if (face) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 2.4, 0, TAU);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#9fc0ff';
    ctx.strokeRect(-3.4, -5.4, 6.8, 10.8);
  }
  ctx.restore();
}

/** Round card table with two chairs, fanned cards and a little score pad. */
export function cardTable(ctx, x, y, t = 0) {
  softShadow(ctx, x, y + 2, 70, 8);
  // chairs
  for (const dx of [-62, 62]) {
    ctx.fillStyle = '#4a3026';
    ctx.fillRect(x + dx - 12, y - 40, 24, 5);
    ctx.fillRect(x + dx - 10, y - 35, 3, 35);
    ctx.fillRect(x + dx + 7, y - 35, 3, 35);
    ctx.fillRect(x + dx + (dx < 0 ? -12 : 9), y - 78, 4, 40);
    ctx.fillStyle = '#8e1c2e';
    ctx.fillRect(x + dx - 11, y - 44, 22, 5);
  }
  // table
  ctx.fillStyle = '#3a2620';
  ctx.fillRect(x - 4, y - 48, 8, 48);
  ctx.fillRect(x - 22, y - 4, 44, 4);
  const g = ctx.createLinearGradient(0, y - 58, 0, y - 46);
  g.addColorStop(0, '#2f6a5a');
  g.addColorStop(1, '#1f4a3e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y - 52, 52, 9, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // cards
  miniCard(ctx, x - 18, y - 56, -0.5, true, '#3f6fe0');
  miniCard(ctx, x - 10, y - 57, -0.15, true, '#e0567f');
  miniCard(ctx, x - 2, y - 57, 0.2, true, '#e2b544');
  miniCard(ctx, x + 22, y - 55, 1.3, false);
  miniCard(ctx, x + 24, y - 56.5, 1.4, false);
  ctx.fillStyle = '#fff7ec';
  ctx.fillRect(x + 6, y - 58, 9, 6);
  ctx.strokeStyle = '#2b3a8c';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 56);
  ctx.lineTo(x + 14, y - 56);
  ctx.moveTo(x + 7, y - 54);
  ctx.lineTo(x + 12, y - 54);
  ctx.stroke();
  // a soft sparkle over the cards
  const tw = 0.5 + 0.5 * Math.sin(t * 2);
  ctx.fillStyle = `rgba(255,226,138,${0.25 + tw * 0.3})`;
  ctx.beginPath();
  ctx.arc(x - 10, y - 66, 2, 0, TAU);
  ctx.fill();
}

/** The blue-rose lamp: a glass rose glowing on a slim stand. */
export function roseLamp(ctx, x, y, t = 0, reduced = false) {
  const pulse = reduced ? 1 : 0.9 + 0.1 * Math.sin(t * 1.6);
  const g = ctx.createRadialGradient(x, y - 96, 2, x, y - 96, 90 * pulse);
  g.addColorStop(0, 'rgba(120,170,255,.45)');
  g.addColorStop(1, 'rgba(120,170,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 96, 90 * pulse, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#2d2f45';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 86);
  ctx.stroke();
  ctx.fillStyle = '#2d2f45';
  ctx.fillRect(x - 10, y - 3, 20, 3);
  ctx.fillStyle = '#3f6fe0';
  ctx.beginPath();
  ctx.arc(x, y - 96, 11, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9fc0ff';
  ctx.beginPath();
  ctx.arc(x - 3, y - 99, 4.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c7dbff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y - 96, 6, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.fillStyle = '#5f8f5a';
  ctx.beginPath();
  ctx.ellipse(x + 7, y - 80, 6, 2.6, -0.5, 0, TAU);
  ctx.fill();
}

/** Low table with a checkers board; optionally a sleeping Snooki on it. */
export function checkersTable(ctx, x, y, { snooki = true, t = 0, reduced = false } = {}) {
  softShadow(ctx, x, y + 2, 54, 7);
  ctx.fillStyle = '#4a3026';
  ctx.fillRect(x - 40, y - 30, 6, 30);
  ctx.fillRect(x + 34, y - 30, 6, 30);
  ctx.fillStyle = '#6b4a3a';
  ctx.fillRect(x - 46, y - 34, 92, 6);
  // board (perspective-ish strip)
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#f3e3c3' : '#5a3420';
    ctx.fillRect(x - 36 + i * 9, y - 40, 9, 6);
  }
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#5a3420' : '#f3e3c3';
    ctx.fillRect(x - 36 + i * 9, y - 46, 9, 6);
  }
  if (!snooki) {
    for (const [dx, c] of [[-30, '#e0567f'], [-12, '#e0567f'], [14, '#3f6fe0'], [30, '#3f6fe0']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x + dx, y - 46, 3.6, 1.8, 0, 0, TAU);
      ctx.fill();
    }
    return;
  }
  // Snooki asleep, curled on the board
  const breathe = reduced ? 0 : Math.sin(t * 1.4) * 0.8;
  ctx.fillStyle = '#fbfbfd';
  ctx.beginPath();
  ctx.ellipse(x, y - 52 - breathe, 30, 12 + breathe, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e4e2ee';
  ctx.beginPath();
  ctx.ellipse(x - 2, y - 46, 26, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fbfbfd';
  ctx.beginPath();
  ctx.arc(x + 24, y - 54, 10, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 19, y - 61);
  ctx.lineTo(x + 21, y - 73);
  ctx.lineTo(x + 26, y - 63);
  ctx.moveTo(x + 27, y - 63);
  ctx.lineTo(x + 32, y - 72);
  ctx.lineTo(x + 33, y - 60);
  ctx.fill();
  ctx.strokeStyle = '#2a1e1c';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 22, y - 55);
  ctx.quadraticCurveTo(x + 25, y - 53, x + 28, y - 55);
  ctx.stroke();
  ctx.fillStyle = '#2a1d1a';
  ctx.beginPath();
  ctx.arc(x + 33, y - 52, 2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a72d8';
  ctx.beginPath();
  ctx.arc(x + 16, y - 48, 2.6, 0, TAU);
  ctx.fill();
  // z z
  ctx.fillStyle = 'rgba(159,215,255,.85)';
  ctx.font = '700 9px sans-serif';
  const zy = reduced ? 0 : (t * 8) % 8;
  ctx.fillText('z', x + 34, y - 72 - zy);
  ctx.fillText('z', x + 40, y - 80 - zy);
}

/** Shelf of small game boxes, with a wooden crate to climb. */
export function gameShelf(ctx, x, y) {
  softShadow(ctx, x, y + 2, 44, 6);
  ctx.fillStyle = '#3b2630';
  ctx.fillRect(x - 36, y - 160, 72, 160);
  const boxes = ['#2b3a8c', '#8e1c2e', '#e2b544', '#2f6a5a', '#6b4fa0', '#e0567f', '#3f6fe0', '#c9a77a'];
  for (let r = 0; r < 3; r++) {
    const sy = y - 150 + r * 48;
    ctx.fillStyle = '#2a1a22';
    ctx.fillRect(x - 32, sy + 40, 64, 4);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = boxes[(r * 3 + i) % boxes.length];
      ctx.fillRect(x - 30 + i * 20, sy + 14 + ((i + r) % 2) * 6, 18, 26 - ((i + r) % 2) * 6);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(x - 28 + i * 20, sy + 18 + ((i + r) % 2) * 6, 10, 2);
    }
  }
  // crate (the hidden step at the shelf's foot)
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(x - 30, y - 54, 70, 8);
  ctx.fillStyle = '#6b4a3a';
  ctx.fillRect(x - 28, y - 46, 6, 46);
  ctx.fillRect(x + 32, y - 46, 6, 46);
}

/** Cork board with pinned notes; `icon` is 'heart' (activities) or 'paw' (pranks). */
export function corkBoard(ctx, x, y, icon = 'heart') {
  ctx.fillStyle = '#6b4a3a';
  ctx.fillRect(x - 34, y - 2, 68, 60);
  ctx.fillStyle = '#c9a77a';
  ctx.fillRect(x - 30, y + 2, 60, 52);
  const notes = [[-20, 8, '#fff7ec'], [2, 6, '#ffe28a'], [-14, 30, '#f7b6cb'], [8, 28, '#9ee6a8']];
  for (const [dx, dy, c] of notes) {
    ctx.fillStyle = c;
    ctx.fillRect(x + dx, y + dy, 16, 16);
    ctx.fillStyle = '#e2405f';
    ctx.beginPath();
    ctx.arc(x + dx + 8, y + dy + 2, 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = icon === 'heart' ? '#3f6fe0' : '#2a1e1c';
  if (icon === 'heart') {
    ctx.beginPath();
    ctx.moveTo(x, y + 50);
    ctx.bezierCurveTo(x - 12, y + 40, x - 6, y + 32, x, y + 38);
    ctx.bezierCurveTo(x + 6, y + 32, x + 12, y + 40, x, y + 50);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(x, y + 46, 5, 4, 0, 0, TAU);
    for (const [dx, dy] of [[-6, -6], [-2, -9], [2, -9], [6, -6]]) {
      ctx.moveTo(x + dx + 2, y + 46 + dy);
      ctx.arc(x + dx, y + 46 + dy, 2, 0, TAU);
    }
    ctx.fill();
  }
}

/** Ryan's laptop on a desk; the screen shows his backlit silhouette. */
export function ryanLaptop(ctx, x, y, t = 0) {
  softShadow(ctx, x, y + 2, 60, 7);
  ctx.fillStyle = '#4a3026';
  ctx.fillRect(x - 52, y - 46, 104, 6);
  ctx.fillRect(x - 48, y - 40, 5, 40);
  ctx.fillRect(x + 43, y - 40, 5, 40);
  // screen glow
  const g = ctx.createRadialGradient(x, y - 70, 4, x, y - 70, 70);
  g.addColorStop(0, 'rgba(159,215,255,.35)');
  g.addColorStop(1, 'rgba(159,215,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 70, 70, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#16161c';
  ctx.fillRect(x - 30, y - 92, 60, 44);
  ctx.fillStyle = '#0c1640';
  ctx.fillRect(x - 27, y - 89, 54, 38);
  // silhouette
  ctx.fillStyle = '#17120f';
  ctx.beginPath();
  ctx.arc(x, y - 74, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1b1d24';
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 51);
  ctx.quadraticCurveTo(x, y - 70, x + 14, y - 51);
  ctx.fill();
  ctx.strokeStyle = '#9fd7ff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y - 74, 7.5, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  // blinking "play" dot
  ctx.fillStyle = Math.sin(t * 3) > 0 ? '#7fd38a' : '#2f6a5a';
  ctx.beginPath();
  ctx.arc(x + 22, y - 84, 2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9aa3b8';
  ctx.fillRect(x - 34, y - 48, 68, 3);
  // a coffee cup and a card
  ctx.fillStyle = '#f3f1ff';
  ctx.fillRect(x + 36, y - 56, 8, 9);
  miniCard(ctx, x - 40, y - 50, 0.3, true, '#3f6fe0');
}

/** Trophy shelf: one small cup per medal earned (up to 8). */
export function trophyShelf(ctx, x, y, { medals = 0 } = {}) {
  ctx.fillStyle = '#3b2630';
  ctx.fillRect(x - 40, y + 30, 80, 6);
  ctx.fillRect(x - 40, y + 70, 80, 6);
  const n = Math.min(8, medals);
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const cx = x - 30 + (i % 4) * 20;
    const cy = y + 30 + row * 40;
    if (i < n) {
      ctx.fillStyle = ['#e2b544', '#c7d3e6', '#c98a3c'][i % 3];
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 16);
      ctx.lineTo(cx + 6, cy - 16);
      ctx.lineTo(cx + 3, cy - 6);
      ctx.lineTo(cx - 3, cy - 6);
      ctx.fill();
      ctx.fillRect(cx - 1.4, cy - 6, 2.8, 4);
      ctx.fillRect(cx - 5, cy - 2, 10, 2);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.strokeRect(cx - 6, cy - 16, 12, 14);
    }
  }
}
