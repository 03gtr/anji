/**
 * Canvas drawing for environment pieces, in world units (ground top = GROUND).
 * Static props are baked into cached background chunks; dynamic ones (gates,
 * pedestals, doors…) are drawn every frame because their state changes.
 */
import { cat, roboDog } from './props-v2.js';

export const GROUND = 250;
export const VIEW_H = 300;

const TAU = Math.PI * 2;

export function rose(ctx, x, y, r = 5, tone = 'blue') {
  const c = {
    blue: ['#3f6fe0', '#2a4fb8', '#8fb2ff'],
    pink: ['#e85d8c', '#b83e68', '#ffb3cc'],
    red: ['#c9304a', '#8e1c2e', '#ff8a9c'],
    white: ['#f3f1ff', '#c9c5e6', '#ffffff'],
    gold: ['#e7b84a', '#b8861f', '#fff0b0'],
  }[tone];
  ctx.fillStyle = c[0];
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c[1];
  ctx.beginPath();
  ctx.arc(x, y + r * 0.25, r * 0.85, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = c[2];
  ctx.lineWidth = Math.max(0.6, r * 0.18);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, Math.PI * 1.1, Math.PI * 2.4);
  ctx.stroke();
}

export function leafBlob(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

/** A rounded bush with roses; `rand` decides rose placement. */
export function roseBush(ctx, x, y, w, h, rand, { tone = 'blue', leaf = '#2f5a4a', leafLight = '#3f7460', roses = 6 } = {}) {
  const blobs = Math.max(3, Math.round(w / 18));
  for (let i = 0; i < blobs; i++) {
    const bx = x - w / 2 + (w * (i + 0.5)) / blobs;
    const by = y - h * (0.45 + 0.25 * Math.sin(i * 1.7));
    leafBlob(ctx, bx, by, w / blobs + 6, h * 0.55, i % 2 ? leaf : leafLight);
  }
  ctx.fillStyle = leaf;
  ctx.fillRect(x - w / 2, y - h * 0.4, w, h * 0.4);
  for (let i = 0; i < roses; i++) {
    const rx = x - w / 2 + 6 + rand() * (w - 12);
    const ry = y - h * (0.25 + rand() * 0.6);
    rose(ctx, rx, ry, 3.6 + rand() * 2.4, rand() < 0.8 ? tone : tone === 'blue' ? 'pink' : 'blue');
  }
}

export function hedgeWall(ctx, x0, x1, top, bottom, rand, { color = '#244a3e', light = '#2f5c4c', roses = 0.06, tone = 'blue' } = {}) {
  ctx.fillStyle = color;
  ctx.fillRect(x0, top + 10, x1 - x0, bottom - top - 10);
  for (let x = x0; x < x1 + 14; x += 14) {
    leafBlob(ctx, x, top + 10 + rand() * 4, 12, 12, rand() < 0.5 ? color : light);
  }
  for (let x = x0; x < x1; x += 7) {
    if (rand() < roses) rose(ctx, x, top + 14 + rand() * (bottom - top - 24), 3 + rand() * 2, rand() < 0.85 ? tone : 'pink');
    if (rand() < 0.08) leafBlob(ctx, x, top + 20 + rand() * (bottom - top - 30), 5, 3, light);
  }
}

export function lanternPost(ctx, x, y, { height = 120, lit = true } = {}) {
  if (lit) {
    const g = ctx.createRadialGradient(x, y - height, 2, x, y - height, 46);
    g.addColorStop(0, 'rgba(255,214,140,.55)');
    g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y - height, 46, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#1c1d2e';
  ctx.fillRect(x - 2.2, y - height + 8, 4.4, height - 8);
  ctx.fillRect(x - 7, y - 6, 14, 6);
  ctx.beginPath();
  ctx.moveTo(x - 9, y - height + 2);
  ctx.lineTo(x + 9, y - height + 2);
  ctx.lineTo(x + 6, y - height + 18);
  ctx.lineTo(x - 6, y - height + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lit ? '#ffd98a' : '#4a4a62';
  ctx.fillRect(x - 5, y - height + 5, 10, 11);
  ctx.fillStyle = '#1c1d2e';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - height + 3);
  ctx.lineTo(x, y - height - 8);
  ctx.lineTo(x + 10, y - height + 3);
  ctx.closePath();
  ctx.fill();
}

export function tree(ctx, x, y, h, rand, { color = '#1f3b46', trunk = '#1a1a2a', round = true } = {}) {
  ctx.fillStyle = trunk;
  ctx.fillRect(x - h * 0.04, y - h * 0.45, h * 0.08, h * 0.45);
  ctx.fillStyle = color;
  if (round) {
    for (let i = 0; i < 5; i++) {
      leafBlob(ctx, x + (rand() - 0.5) * h * 0.45, y - h * (0.55 + rand() * 0.3), h * (0.18 + rand() * 0.08), h * (0.16 + rand() * 0.08), color);
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - h * 0.22, y - h * 0.25);
    ctx.lineTo(x + h * 0.22, y - h * 0.25);
    ctx.closePath();
    ctx.fill();
  }
}

export function bench(ctx, x, y) {
  ctx.fillStyle = '#3a2a3a';
  ctx.fillRect(x - 26, y - 20, 52, 5);
  ctx.fillRect(x - 26, y - 34, 52, 4);
  ctx.fillRect(x - 24, y - 20, 4, 20);
  ctx.fillRect(x + 20, y - 20, 4, 20);
  ctx.fillRect(x - 24, y - 34, 3, 14);
  ctx.fillRect(x + 21, y - 34, 3, 14);
}

export function fountain(ctx, x, y, t = 0) {
  ctx.fillStyle = '#5b5f86';
  ctx.beginPath();
  ctx.ellipse(x, y - 10, 46, 12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6d72a0';
  ctx.fillRect(x - 46, y - 10, 92, 10);
  ctx.fillStyle = '#7bb6ff';
  ctx.beginPath();
  ctx.ellipse(x, y - 12, 40, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6d72a0';
  ctx.fillRect(x - 5, y - 52, 10, 40);
  ctx.beginPath();
  ctx.ellipse(x, y - 52, 20, 6, 0, 0, TAU);
  ctx.fill();
  // water arcs
  ctx.strokeStyle = 'rgba(160,210,255,.85)';
  ctx.lineWidth = 2;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, y - 62);
    ctx.quadraticCurveTo(x + dir * 20, y - 78 - 3 * Math.sin(t * 3), x + dir * 30, y - 14);
    ctx.stroke();
  }
  creatorMark(ctx, x, y - 30, 7, '#c9d6ff');
}

/**
 * The Creator's Mark: a rose whose stem curls into an "R".
 * (Later in the story she realises the leaf is an "A".)
 */
export function creatorMark(ctx, x, y, s = 10, color = '#9fd7ff') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 10, s / 10);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -5, 4.4, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -0.6);
  ctx.lineTo(0, 10);
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(6, 2, 5, 5);
  ctx.quadraticCurveTo(3, 7, 0, 6);
  ctx.moveTo(1.5, 6.3);
  ctx.lineTo(6, 10.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.quadraticCurveTo(-6, 2, -6.5, 7);
  ctx.quadraticCurveTo(-3, 8, 0, 6);
  ctx.fill();
  ctx.restore();
}

export const MOON_PHASES = ['new', 'crescent', 'half', 'full'];

export function moonSymbol(ctx, x, y, r, phase, color = '#fff2c6') {
  ctx.save();
  ctx.fillStyle = 'rgba(20,24,60,.85)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  if (phase === 'full') ctx.arc(x, y, r - 1.5, 0, TAU);
  else if (phase === 'half') ctx.arc(x, y, r - 1.5, -Math.PI / 2, Math.PI / 2);
  else if (phase === 'crescent') {
    ctx.arc(x, y, r - 1.5, -Math.PI / 2, Math.PI / 2);
    ctx.arc(x - r * 0.45, y, r * 1.05, Math.PI / 2.6, -Math.PI / 2.6, true);
  }
  ctx.fill();
  ctx.restore();
}

export function pedestal(ctx, x, y, { lit = false, phase = 'full', t = 0 } = {}) {
  ctx.fillStyle = '#4b4f78';
  ctx.fillRect(x - 12, y - 40, 24, 40);
  ctx.fillStyle = '#5d6290';
  ctx.fillRect(x - 16, y - 46, 32, 7);
  ctx.fillRect(x - 15, y - 4, 30, 4);
  if (lit) {
    const g = ctx.createRadialGradient(x, y - 60, 2, x, y - 60, 32);
    g.addColorStop(0, `rgba(140,190,255,${0.6 + 0.15 * Math.sin(t * 4)})`);
    g.addColorStop(1, 'rgba(140,190,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y - 60, 32, 0, TAU);
    ctx.fill();
  }
  rose(ctx, x, y - 56, 7, lit ? 'blue' : 'white');
  ctx.strokeStyle = '#3f6a4e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 49);
  ctx.lineTo(x, y - 46);
  ctx.stroke();
  moonSymbol(ctx, x, y - 24, 7, phase);
}

/** Ornate iron gate. open: 0 (closed) … 1 (open). */
export function ironGate(ctx, x, y, { w = 120, h = 170, open = 0, mark = true, glow = 0 } = {}) {
  const pillar = (px) => {
    ctx.fillStyle = '#3e3f5c';
    ctx.fillRect(px - 12, y - h - 10, 24, h + 10);
    ctx.fillStyle = '#4c4e70';
    ctx.fillRect(px - 15, y - h - 18, 30, 10);
    rose(ctx, px, y - h - 24, 6, 'blue');
  };
  const half = w / 2;
  const leaf = (dir) => {
    ctx.save();
    ctx.translate(x + dir * half, y);
    ctx.scale(Math.max(0.08, 1 - open) * -dir, 1);
    ctx.strokeStyle = '#26273a';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 5; i++) {
      const bx = (half * i) / 5;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx, -h + 26 - Math.sin((i / 5) * Math.PI * 0.5) * 22);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.35);
    ctx.lineTo(half, -h * 0.35);
    ctx.moveTo(0, -18);
    ctx.lineTo(half, -18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -h + 26);
    ctx.quadraticCurveTo(half * 0.6, -h - 4, half, -h + 4);
    ctx.stroke();
    ctx.restore();
  };
  if (glow > 0) {
    const g = ctx.createRadialGradient(x, y - h * 0.55, 4, x, y - h * 0.55, h);
    g.addColorStop(0, `rgba(160,210,255,${0.45 * glow})`);
    g.addColorStop(1, 'rgba(160,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - h, y - h * 1.6, h * 2, h * 1.6);
  }
  leaf(-1);
  leaf(1);
  pillar(x - half - 12);
  pillar(x + half + 12);
  if (mark && open < 0.5) {
    ctx.fillStyle = '#26273a';
    ctx.beginPath();
    ctx.arc(x, y - h * 0.55, 13, 0, TAU);
    ctx.fill();
    creatorMark(ctx, x, y - h * 0.55, 12, glow > 0 ? '#bfe3ff' : '#7aa2ff');
  }
}

export function stoneLedge(ctx, x, y, w) {
  ctx.fillStyle = '#4a4d72';
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = '#5a5e88';
  ctx.fillRect(x, y, w, 3);
  ctx.strokeStyle = '#3a3c5c';
  ctx.lineWidth = 1;
  for (let i = 18; i < w; i += 18) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + 3);
    ctx.lineTo(x + i, y + 10);
    ctx.stroke();
  }
  ctx.fillStyle = '#2f5c4c';
  for (let i = 4; i < w; i += 12) leafBlob(ctx, x + i, y + 11, 4, 3, '#2f5c4c');
}

export function star(ctx, x, y, r, color = '#ffe28a', t = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * 2);
  ctx.rotate(Math.sin(t * 2) * 0.15);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.2);
  g.addColorStop(0, 'rgba(255,226,138,.6)');
  g.addColorStop(1, 'rgba(255,226,138,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A four-point twinkle: marks objects she has not examined yet (not a collectible). */
export function sparkle(ctx, x, y, r, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.fillStyle = '#e8f6ff';
  ctx.shadowColor = '#9fd7ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.quadraticCurveTo(0, 0, 0, r);
  ctx.quadraticCurveTo(0, 0, -r, 0);
  ctx.quadraticCurveTo(0, 0, 0, -r);
  ctx.fill();
  ctx.restore();
}

export function paper(ctx, x, y, t = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.4) * 2);
  ctx.rotate(-0.12);
  ctx.fillStyle = 'rgba(255,240,200,.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f3e3c3';
  ctx.fillRect(-8, -10, 16, 20);
  ctx.strokeStyle = '#a88b5c';
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i += 4) {
    ctx.beginPath();
    ctx.moveTo(-5, i);
    ctx.lineTo(5, i);
    ctx.stroke();
  }
  ctx.restore();
}

export function seedPouch(ctx, x, y, t = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.8) * 2);
  ctx.fillStyle = 'rgba(143,178,255,.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c9a77a';
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.quadraticCurveTo(-9, 9, 0, 9);
  ctx.quadraticCurveTo(9, 9, 7, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(-6, -6, 12, 3);
  rose(ctx, 0, 3, 3.2, 'blue');
  ctx.restore();
}

/** Door in an interior wall; state: 'closed' | 'open' | 'locked'. */
export function door(ctx, x, y, { w = 54, h = 104, state = 'closed', color = '#5a3a4a', sign = null, glow = false } = {}) {
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(x - w / 2 - 6, y - h - 6, w + 12, h + 6);
  if (state === 'open') {
    const g = ctx.createLinearGradient(x, y - h, x, y);
    g.addColorStop(0, '#ffe2a8');
    g.addColorStop(1, '#f5b97a');
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y - h, w * 0.22, h);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2 + 7, y - h + 8, w - 14, h * 0.4);
    ctx.strokeRect(x - w / 2 + 7, y - h * 0.48, w - 14, h * 0.4);
    ctx.fillStyle = '#e2b544';
    ctx.beginPath();
    ctx.arc(x + w / 2 - 9, y - h * 0.48, 3, 0, TAU);
    ctx.fill();
    if (state === 'locked') {
      ctx.fillStyle = '#e2b544';
      ctx.fillRect(x - 6, y - h * 0.55, 12, 10);
      ctx.strokeStyle = '#e2b544';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - h * 0.55, 4.5, Math.PI, 0);
      ctx.stroke();
    }
  }
  if (glow) {
    ctx.strokeStyle = 'rgba(160,210,255,.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2 - 3, y - h - 3, w + 6, h + 3);
  }
  if (sign) {
    ctx.fillStyle = '#f3e3c3';
    ctx.fillRect(x - 22, y - h - 26, 44, 16);
    ctx.fillStyle = '#4a3220';
    ctx.font = '700 9px "Baloo Bhaijaan 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sign, x, y - h - 18);
  }
}

export function windowFrame(ctx, x, y, w = 50, h = 70) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#1b2160');
  g.addColorStop(1, '#4b3f8e');
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff4d6';
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.3, 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
  ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
}

export function pictureFrame(ctx, x, y, w, h, rand, { tone = '#e2b544' } = {}) {
  ctx.fillStyle = tone;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#2b2c55';
  ctx.fillRect(x, y, w, h);
  // a tiny landscape: moon + hills (generic; never a real photo)
  ctx.fillStyle = '#fff4d6';
  ctx.beginPath();
  ctx.arc(x + w * (0.3 + rand() * 0.4), y + h * 0.3, Math.min(w, h) * 0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3f6a5a';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.4, y + h * 0.45, x + w, y + h * 0.8);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

export function bookshelf(ctx, x, y, w, h, rand) {
  ctx.fillStyle = '#3b2630';
  ctx.fillRect(x, y - h, w, h);
  const rows = Math.max(2, Math.round(h / 34));
  const colors = ['#8e1c2e', '#2f5fd0', '#e2b544', '#2f6a5a', '#6b4fa0', '#c9a77a'];
  for (let r = 0; r < rows; r++) {
    const ry = y - h + 6 + (r * (h - 6)) / rows;
    const rh = (h - 6) / rows - 6;
    ctx.fillStyle = '#2a1a22';
    ctx.fillRect(x + 3, ry + rh, w - 6, 4);
    let bx = x + 5;
    while (bx < x + w - 8) {
      const bw = 3 + rand() * 5;
      const bh = rh * (0.7 + rand() * 0.3);
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.fillRect(bx, ry + rh - bh, bw, bh);
      bx += bw + 1;
    }
  }
}

export function table(ctx, x, y, w = 70, { cloth = '#efe2cf' } = {}) {
  ctx.fillStyle = '#4a2f2a';
  ctx.fillRect(x - w / 2 + 4, y - 34, 5, 34);
  ctx.fillRect(x + w / 2 - 9, y - 34, 5, 34);
  ctx.fillStyle = cloth;
  ctx.fillRect(x - w / 2, y - 40, w, 8);
}

export function sportsCar(ctx, x, y, { color = '#1f4fd1', lights = true, t = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (lights) {
    const g = ctx.createRadialGradient(70, -20, 2, 70, -20, 60);
    g.addColorStop(0, 'rgba(160,220,255,.5)');
    g.addColorStop(1, 'rgba(160,220,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(40, -60, 90, 70);
  }
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 80, 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-76, -10);
  ctx.lineTo(-72, -26);
  ctx.lineTo(-30, -32);
  ctx.lineTo(-6, -48);
  ctx.lineTo(26, -48);
  ctx.lineTo(52, -32);
  ctx.lineTo(74, -26);
  ctx.lineTo(78, -12);
  ctx.lineTo(70, -6);
  ctx.lineTo(-70, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,.85)';
  ctx.beginPath();
  ctx.moveTo(-22, -32);
  ctx.lineTo(-2, -44);
  ctx.lineTo(22, -44);
  ctx.lineTo(42, -32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-60, -20);
  ctx.lineTo(64, -22);
  ctx.stroke();
  ctx.fillStyle = '#bfe3ff';
  ctx.fillRect(66, -24, 9, 4);
  ctx.fillStyle = '#ff4a6a';
  ctx.fillRect(-75, -24, 6, 4);
  for (const wx of [-46, 46]) {
    ctx.fillStyle = '#121218';
    ctx.beginPath();
    ctx.arc(wx, -8, 13, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9aa3b8';
    ctx.beginPath();
    ctx.arc(wx, -8, 6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2a2d3a';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < 5; a++) {
      const ang = t * 6 + (a * TAU) / 5;
      ctx.beginPath();
      ctx.moveTo(wx, -8);
      ctx.lineTo(wx + Math.cos(ang) * 6, -8 + Math.sin(ang) * 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function signPost(ctx, x, y, text) {
  ctx.fillStyle = '#5a3d2c';
  ctx.fillRect(x - 2, y - 52, 4, 52);
  ctx.fillStyle = '#c9a77a';
  ctx.fillRect(x - 28, y - 56, 56, 18);
  ctx.fillStyle = '#3a2618';
  ctx.font = '700 9px "Baloo Bhaijaan 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 47);
}

export function glassPanes(ctx, x0, x1, top, bottom) {
  ctx.strokeStyle = 'rgba(200,230,255,.35)';
  ctx.lineWidth = 2;
  for (let x = x0; x < x1; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top + 30);
    ctx.quadraticCurveTo(x + 30, top, x + 60, top + 30);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x0, top + 110);
  ctx.lineTo(x1, top + 110);
  ctx.stroke();
}

export function pot(ctx, x, y, rand, { tone = 'blue' } = {}) {
  ctx.fillStyle = '#b4674a';
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 22);
  ctx.lineTo(x + 13, y - 22);
  ctx.lineTo(x + 9, y);
  ctx.lineTo(x - 9, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9a523a';
  ctx.fillRect(x - 14, y - 25, 28, 5);
  roseBush(ctx, x, y - 24, 30, 26, rand, { tone, roses: 3 });
}

/** Tall clock whose hands show h:m (the house's stopped clock is a clue). */
export function grandfatherClock(ctx, x, y, { h = 7, m = 14, swing = 0 } = {}) {
  ctx.fillStyle = '#3b2630';
  ctx.fillRect(x - 18, y - 150, 36, 150);
  ctx.fillStyle = '#4a3040';
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 150);
  ctx.quadraticCurveTo(x, y - 176, x + 22, y - 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f3e3c3';
  ctx.beginPath();
  ctx.arc(x, y - 128, 13, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3b2630';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * 10, y - 128 - Math.cos(a) * 10);
    ctx.lineTo(x + Math.sin(a) * 12, y - 128 - Math.cos(a) * 12);
    ctx.stroke();
  }
  const hand = (frac, len, w) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y - 128);
    ctx.lineTo(x + Math.sin(frac * TAU) * len, y - 128 - Math.cos(frac * TAU) * len);
    ctx.stroke();
  };
  hand(((h % 12) + m / 60) / 12, 6.5, 2);
  hand(m / 60, 9.5, 1.3);
  ctx.fillStyle = '#2a1a22';
  ctx.fillRect(x - 10, y - 108, 20, 80);
  ctx.strokeStyle = '#e2b544';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 106);
  ctx.lineTo(x + Math.sin(swing) * 6, y - 50);
  ctx.stroke();
  ctx.fillStyle = '#e2b544';
  ctx.beginPath();
  ctx.arc(x + Math.sin(swing) * 6, y - 46, 5, 0, TAU);
  ctx.fill();
}

/** Wall lamp; `lit` 0…1 fades the warm glow. */
export function sconce(ctx, x, y, lit = 1) {
  if (lit > 0) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, 60);
    g.addColorStop(0, `rgba(255,214,140,${0.5 * lit})`);
    g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(x - 2, y + 4, 4, 14);
  ctx.fillStyle = lit > 0.3 ? '#ffd98a' : '#5a5470';
  ctx.beginPath();
  ctx.moveTo(x - 7, y + 4);
  ctx.lineTo(x + 7, y + 4);
  ctx.lineTo(x + 4, y - 8);
  ctx.lineTo(x - 4, y - 8);
  ctx.closePath();
  ctx.fill();
}

/** Staircase going down (to the workshop). */
export function stairsDown(ctx, x, y, { open = false } = {}) {
  ctx.fillStyle = '#1a1424';
  ctx.fillRect(x - 40, y - 8, 80, 12);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#3a2a36' : '#45323f';
    ctx.fillRect(x - 36 + i * 6, y - 4 + i * 2, 72 - i * 12, 3);
  }
  ctx.strokeStyle = '#6b4a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 40, y - 8);
  ctx.lineTo(x - 40, y - 60);
  ctx.lineTo(x + 40, y - 60);
  ctx.lineTo(x + 40, y - 8);
  ctx.stroke();
  if (!open) {
    ctx.strokeStyle = '#e2b544';
    ctx.lineWidth = 2;
    for (let i = -30; i <= 30; i += 12) {
      ctx.beginPath();
      ctx.moveTo(x + i, y - 58);
      ctx.lineTo(x + i, y - 8);
      ctx.stroke();
    }
  }
}

/** A portrait frame that is still empty (the house "forgot" who to show). */
export function blankFrame(ctx, x, y, w, h, { glow = 0 } = {}) {
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x - w / 2 - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#e9e2d4';
  ctx.fillRect(x - w / 2, y, w, h);
  if (glow) {
    ctx.fillStyle = `rgba(159,215,255,${0.35 * glow})`;
    ctx.fillRect(x - w / 2, y, w, h);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.12)';
  ctx.strokeRect(x - w / 2 + 4, y + 4, w - 8, h - 8);
}

export function toolRack(ctx, x, y) {
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(x - 60, y - 150, 120, 80);
  ctx.strokeStyle = '#9aa3b8';
  ctx.lineWidth = 3;
  const tools = [[-45, 'wrench'], [-25, 'hammer'], [-5, 'screw'], [15, 'wrench'], [35, 'saw']];
  for (const [dx, kind] of tools) {
    ctx.beginPath();
    if (kind === 'hammer') {
      ctx.moveTo(x + dx, y - 140);
      ctx.lineTo(x + dx, y - 85);
      ctx.moveTo(x + dx - 7, y - 140);
      ctx.lineTo(x + dx + 7, y - 140);
    } else if (kind === 'saw') {
      ctx.moveTo(x + dx, y - 140);
      ctx.lineTo(x + dx + 10, y - 90);
    } else {
      ctx.moveTo(x + dx, y - 138);
      ctx.lineTo(x + dx, y - 92);
      ctx.arc(x + dx, y - 140, 4, 0, Math.PI * 2);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#4a3028';
  ctx.fillRect(x - 70, y - 40, 140, 8);
  ctx.fillRect(x - 64, y - 32, 6, 32);
  ctx.fillRect(x + 58, y - 32, 6, 32);
  ctx.fillStyle = '#e2b544';
  ctx.fillRect(x - 40, y - 52, 24, 12);
  ctx.fillStyle = '#c9304a';
  ctx.fillRect(x + 10, y - 50, 30, 10);
}

/** Rolling shutter door to the road; open 0…1. */
export function shutter(ctx, x, y, { open = 0, glow = 0 } = {}) {
  const w = 130;
  const h = 150;
  if (open > 0) {
    const g = ctx.createLinearGradient(x, y - h, x, y);
    g.addColorStop(0, '#141a52');
    g.addColorStop(1, '#2b3a8c');
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = 'rgba(111,211,255,.8)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x - 4, y - 20 - i * 22, 8, 10);
  }
  ctx.fillStyle = '#5b6080';
  const top = y - h;
  const visible = h * (1 - open);
  ctx.fillRect(x - w / 2, top, w, visible);
  ctx.strokeStyle = '#464a68';
  ctx.lineWidth = 2;
  for (let yy = top + 8; yy < top + visible; yy += 8) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, yy);
    ctx.lineTo(x + w / 2, yy);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(x - w / 2 - 8, top - 10, w + 16, 10);
  if (glow) {
    ctx.strokeStyle = `rgba(255,217,119,${0.7 * glow})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - w / 2 - 4, top - 4, w + 8, h + 4);
  }
}

/** Dust sheet covering the car before the reveal. */
export function carSheet(ctx, x, y) {
  ctx.fillStyle = '#c9c5e6';
  ctx.beginPath();
  ctx.moveTo(x - 86, y);
  ctx.quadraticCurveTo(x - 80, y - 40, x - 30, y - 52);
  ctx.quadraticCurveTo(x + 10, y - 62, x + 40, y - 50);
  ctx.quadraticCurveTo(x + 84, y - 34, x + 88, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath();
  ctx.moveTo(x - 40, y - 46);
  ctx.quadraticCurveTo(x - 30, y - 20, x - 44, y);
  ctx.moveTo(x + 20, y - 54);
  ctx.quadraticCurveTo(x + 30, y - 20, x + 22, y);
  ctx.stroke();
}

/** Wall panel with three status lamps (power, cooling, lights). */
export function controlPanel(ctx, x, y, { on = false, t = 0 } = {}) {
  ctx.fillStyle = '#2a2236';
  ctx.fillRect(x - 30, y - 150, 60, 80);
  ctx.fillStyle = '#121640';
  ctx.fillRect(x - 24, y - 144, 48, 50);
  const lamps = ['#ffd977', '#6fd3ff', '#f3f1ff'];
  lamps.forEach((c, i) => {
    ctx.fillStyle = on ? c : '#3a3c5c';
    ctx.beginPath();
    ctx.arc(x - 14 + i * 14, y - 82, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  if (!on) {
    ctx.fillStyle = `rgba(232,93,140,${0.5 + 0.5 * Math.sin(t * 4)})`;
    ctx.fillRect(x - 18, y - 128, 36, 4);
  } else {
    ctx.strokeStyle = '#6fd3ff';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) ctx.lineTo(x - 20 + i, y - 120 + Math.sin(i * 0.6 + t * 6) * 6);
    ctx.stroke();
  }
}

export function chalkboard(ctx, x, y, { lines = [], title = '' } = {}) {
  ctx.fillStyle = '#6b4a3a';
  ctx.fillRect(x - 74, y - 190, 148, 96);
  ctx.fillStyle = '#1d2b2c';
  ctx.fillRect(x - 68, y - 184, 136, 84);
  ctx.fillStyle = '#f3f1ff';
  ctx.font = '700 10px "Baloo Bhaijaan 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  if (title) ctx.fillText(title, x, y - 166);
  ctx.globalAlpha = 0.7;
  ctx.font = '8px "Baloo Bhaijaan 2", sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, x, y - 150 + i * 12));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(243,241,255,.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + 46, y - 124, 9, 0, Math.PI * 2);
  ctx.moveTo(x + 52, y - 117);
  ctx.lineTo(x + 60, y - 109);
  ctx.stroke();
  ctx.fillStyle = '#e2b544';
  ctx.fillRect(x - 60, y - 98, 30, 4);
}

export function schoolDesk(ctx, x, y) {
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(x - 26, y - 34, 52, 7);
  ctx.fillStyle = '#5a3d2c';
  ctx.fillRect(x - 22, y - 27, 4, 27);
  ctx.fillRect(x + 18, y - 27, 4, 27);
  ctx.fillStyle = '#f3e3c3';
  ctx.fillRect(x - 10, y - 38, 16, 4);
}

export function diploma(ctx, x, y) {
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x - 15, y - 2, 30, 38);
  ctx.fillStyle = '#f3e3c3';
  ctx.fillRect(x - 12, y + 1, 24, 32);
  ctx.fillStyle = '#3a72d8';
  ctx.beginPath();
  ctx.arc(x, y + 14, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (const [dx, dy] of [[-3, -3], [0, -4], [3, -3]]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + 14 + dy, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Sultan the peacock: side view with an optional open tail fan. */
export function peacock(ctx, x, y, { fan = 0, t = 0, facing = -1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  if (fan > 0) {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.62 + (i / (n - 1)) * 0.76) + Math.sin(t * 2 + i) * 0.02;
      const r = 70 * fan;
      const ex = Math.cos(a) * r + 18;
      const ey = Math.sin(a) * r - 36;
      ctx.strokeStyle = '#2f8f6a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, -30);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = '#1f7a5a';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 8, 10, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2b544';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 4.5, 6, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d3fa0';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#2f8f6a';
    ctx.beginPath();
    ctx.moveTo(14, -26);
    ctx.quadraticCurveTo(50, -24, 70, -6);
    ctx.lineTo(60, -2);
    ctx.quadraticCurveTo(40, -16, 12, -16);
    ctx.fill();
  }
  ctx.fillStyle = '#1d5fd0';
  ctx.beginPath();
  ctx.ellipse(6, -26, 16, 12, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4, -32);
  ctx.quadraticCurveTo(-10, -50, -6, -62);
  ctx.lineTo(2, -60);
  ctx.quadraticCurveTo(0, -46, 6, -34);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-4, -64, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-6, -65, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16161c';
  ctx.beginPath();
  ctx.arc(-6.6, -65, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cfc4a8';
  ctx.beginPath();
  ctx.moveTo(-11, -64);
  ctx.lineTo(-17, -62);
  ctx.lineTo(-11, -61);
  ctx.fill();
  ctx.strokeStyle = '#1d5fd0';
  ctx.lineWidth = 1.2;
  for (const dx of [-3, 0, 3]) {
    ctx.beginPath();
    ctx.moveTo(-4, -70);
    ctx.lineTo(-4 + dx, -78);
    ctx.stroke();
    ctx.fillStyle = '#2bb5a0';
    ctx.beginPath();
    ctx.arc(-4 + dx, -79, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#a88b5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, -16);
  ctx.lineTo(0, 0);
  ctx.moveTo(10, -16);
  ctx.lineTo(12, 0);
  ctx.stroke();
  ctx.restore();
}

export function bunny(ctx, x, y, t = 0) {
  const hop = Math.max(0, Math.sin(t * 3)) * 4;
  ctx.save();
  ctx.translate(x, y - hop);
  ctx.fillStyle = '#e9e2d4';
  ctx.beginPath();
  ctx.ellipse(0, -8, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-9, -14, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-11, -24, 2.4, 7, -0.2, 0, Math.PI * 2);
  ctx.ellipse(-7, -24, 2.4, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16161c';
  ctx.beginPath();
  ctx.arc(-11, -15, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(10, -9, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function squirrel(ctx, x, y, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#a66a3a';
  ctx.beginPath();
  ctx.ellipse(10, -16, 7, 14, 0.4 + Math.sin(t * 4) * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -9, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-3, -19, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16161c';
  ctx.beginPath();
  ctx.arc(-5, -20, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b4a2a';
  ctx.beginPath();
  ctx.ellipse(-6, -10, 2.4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function deer(ctx, x, y, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#b07a4a';
  ctx.beginPath();
  ctx.ellipse(0, -34, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-18, -30, 4, 30);
  ctx.fillRect(-8, -30, 4, 30);
  ctx.fillRect(8, -30, 4, 30);
  ctx.fillRect(16, -30, 4, 30);
  const bob = Math.sin(t * 1.2) * 3;
  ctx.beginPath();
  ctx.moveTo(-18, -40);
  ctx.lineTo(-26, -62 + bob);
  ctx.lineTo(-18, -64 + bob);
  ctx.lineTo(-12, -40);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-26, -66 + bob, 7, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e9e2d4';
  for (const [dx, dy] of [[-4, -38], [6, -40], [12, -34]]) {
    ctx.beginPath();
    ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function fence(ctx, x0, x1, y, { thread = false } = {}) {
  ctx.fillStyle = '#8a6a45';
  for (let x = x0; x <= x1; x += 26) ctx.fillRect(x - 2, y - 44, 5, 44);
  ctx.fillRect(x0 - 2, y - 36, x1 - x0 + 4, 4);
  ctx.fillRect(x0 - 2, y - 18, x1 - x0 + 4, 4);
  if (thread) {
    ctx.strokeStyle = '#3a72d8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 + 40, y - 34);
    ctx.quadraticCurveTo(x0 + 46, y - 24, x0 + 52, y - 30);
    ctx.stroke();
  }
}

export function pond(ctx, x, y, w = 160, t = 0) {
  ctx.fillStyle = '#1d3a5c';
  ctx.beginPath();
  ctx.ellipse(x, y + 20, w / 2, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(159,215,255,.4)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(t + i) * 20, y + 20, 20 + i * 14, 4 + i, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Brass telescope on a tripod; `lens` adds the blue lens glow. */
export function telescope(ctx, x, y, { lens = false, t = 0 } = {}) {
  ctx.strokeStyle = '#8a6a20';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 60);
  ctx.lineTo(x - 26, y);
  ctx.moveTo(x, y - 60);
  ctx.lineTo(x + 26, y);
  ctx.moveTo(x, y - 60);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y - 64);
  ctx.rotate(-0.55);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(-20, -9, 90, 18);
  ctx.fillStyle = '#e2b544';
  ctx.fillRect(-20, -9, 90, 5);
  ctx.fillStyle = '#8a6a20';
  ctx.fillRect(60, -12, 14, 24);
  ctx.fillRect(-28, -6, 10, 12);
  if (lens) {
    const g = ctx.createRadialGradient(76, 0, 1, 76, 0, 30);
    g.addColorStop(0, `rgba(111,211,255,${0.7 + 0.2 * Math.sin(t * 3)})`);
    g.addColorStop(1, 'rgba(111,211,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(76, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6fd3ff';
    ctx.fillRect(72, -10, 4, 20);
  }
  ctx.restore();
}

/** Uncle Munther, the observatory owl, on his perch. */
export function owl(ctx, x, y, { awake = true, t = 0 } = {}) {
  ctx.fillStyle = '#5a3d2c';
  ctx.fillRect(x - 3, y - 80, 6, 80);
  ctx.fillRect(x - 24, y - 82, 48, 5);
  const by = y - 82 + Math.sin(t * 1.5) * 1.2;
  ctx.fillStyle = '#6b5a86';
  ctx.beginPath();
  ctx.ellipse(x, by - 22, 17, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9b8de';
  ctx.beginPath();
  ctx.ellipse(x, by - 16, 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b5a86';
  ctx.beginPath();
  ctx.moveTo(x - 14, by - 38);
  ctx.lineTo(x - 10, by - 50);
  ctx.lineTo(x - 4, by - 40);
  ctx.moveTo(x + 14, by - 38);
  ctx.lineTo(x + 10, by - 50);
  ctx.lineTo(x + 4, by - 40);
  ctx.fill();
  for (const dx of [-7, 7]) {
    ctx.fillStyle = '#fff6dc';
    ctx.beginPath();
    ctx.arc(x + dx, by - 32, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8a73a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    if (awake) {
      ctx.fillStyle = '#2a2140';
      ctx.beginPath();
      ctx.arc(x + dx, by - 32, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#2a2140';
      ctx.beginPath();
      ctx.moveTo(x + dx - 4, by - 32);
      ctx.lineTo(x + dx + 4, by - 32);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#e8a33a';
  ctx.beginPath();
  ctx.moveTo(x - 3, by - 27);
  ctx.lineTo(x, by - 21);
  ctx.lineTo(x + 3, by - 27);
  ctx.fill();
}

export function candleStand(ctx, x, y, { lit = false, t = 0, h = 70 } = {}) {
  ctx.fillStyle = '#8a6a20';
  ctx.fillRect(x - 2, y - h, 4, h);
  ctx.fillRect(x - 12, y - 4, 24, 4);
  ctx.fillRect(x - 16, y - h, 32, 4);
  for (const dx of [-12, 0, 12]) {
    ctx.fillStyle = '#f3e9da';
    ctx.fillRect(x + dx - 2.5, y - h - 14, 5, 12);
    if (lit) {
      const g = ctx.createRadialGradient(x + dx, y - h - 18, 1, x + dx, y - h - 18, 26);
      g.addColorStop(0, 'rgba(255,214,140,.55)');
      g.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + dx, y - h - 18, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd977';
      ctx.beginPath();
      ctx.ellipse(x + dx, y - h - 18 + Math.sin(t * 9 + dx) * 0.6, 2.4, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function ladder(ctx, x, y, h = 160) {
  ctx.strokeStyle = '#8a6a45';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x - 4, y - h);
  ctx.moveTo(x + 12, y);
  ctx.lineTo(x + 20, y - h);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 16; i < h; i += 22) {
    const k = i / h;
    ctx.beginPath();
    ctx.moveTo(x - 12 + 8 * k, y - i);
    ctx.lineTo(x + 12 + 8 * k, y - i);
    ctx.stroke();
  }
}

export function starChart(ctx, x, y, w = 70, h = 54) {
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(x - w / 2 - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#121646';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.strokeStyle = 'rgba(159,215,255,.6)';
  ctx.lineWidth = 1;
  const pts = [[0.2, 0.3], [0.4, 0.2], [0.55, 0.45], [0.75, 0.35], [0.6, 0.75], [0.3, 0.7]];
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(x - w / 2 + px * w, y + py * h) : ctx.moveTo(x - w / 2 + px * w, y + py * h)));
  ctx.stroke();
  ctx.fillStyle = '#ffe28a';
  for (const [px, py] of pts) {
    ctx.beginPath();
    ctx.arc(x - w / 2 + px * w, y + py * h, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A memory frame on the corridor wall. Lit frames show the memory's
 * painting (if an image is ready) or a simple moonlit vignette.
 */
export function memoryFrame(ctx, x, y, { lit = false, image = null, icon = 'rose', t = 0, index = 0 } = {}) {
  const w = 74;
  const h = 92;
  ctx.fillStyle = lit ? '#e2b544' : '#6b5a3a';
  ctx.fillRect(x - w / 2 - 5, y - 5, w + 10, h + 10);
  if (lit) {
    const g = ctx.createRadialGradient(x, y + h / 2, 10, x, y + h / 2, 90);
    g.addColorStop(0, 'rgba(255,226,138,.25)');
    g.addColorStop(1, 'rgba(255,226,138,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 90, y - 40, 180, h + 80);
  }
  ctx.fillStyle = lit ? '#1b2160' : '#0d0f26';
  ctx.fillRect(x - w / 2, y, w, h);
  if (lit && image && image.complete && image.naturalWidth) {
    const ar = image.naturalWidth / image.naturalHeight;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    let sx = 0;
    let sy = 0;
    if (ar > w / h) {
      sw = sh * (w / h);
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = sw / (w / h);
      sy = (image.naturalHeight - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, x - w / 2, y, w, h);
  } else if (lit) {
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.arc(x + 16, y + 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2f5a4a';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h);
    ctx.quadraticCurveTo(x - 10, y + 50, x + w / 2, y + h - 18);
    ctx.lineTo(x + w / 2, y + h);
    ctx.fill();
    rose(ctx, x - 14, y + 66, 6, icon === 'heart' ? 'pink' : 'blue');
    rose(ctx, x + 8, y + 72, 5, 'blue');
  } else {
    ctx.fillStyle = `rgba(159,215,255,${0.25 + 0.1 * Math.sin(t * 2 + index)})`;
    ctx.font = '700 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('؟', x, y + h / 2);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.strokeRect(x - w / 2 + 3, y + 3, w - 6, h - 6);
}

export function dock(ctx, x, y, w = 220) {
  ctx.fillStyle = '#4a3324';
  ctx.fillRect(x - w / 2, y - 8, w, 10);
  ctx.fillStyle = '#3a2a1e';
  for (let i = -w / 2 + 10; i < w / 2; i += 40) ctx.fillRect(x + i, y, 6, 40);
  ctx.strokeStyle = 'rgba(0,0,0,.2)';
  for (let i = -w / 2; i < w / 2; i += 14) {
    ctx.beginPath();
    ctx.moveTo(x + i, y - 8);
    ctx.lineTo(x + i, y + 2);
    ctx.stroke();
  }
}

export function lanternBoat(ctx, x, y, t = 0) {
  ctx.fillStyle = '#5a3d2c';
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 8);
  ctx.lineTo(x + 30, y - 8);
  ctx.lineTo(x + 20, y + 4);
  ctx.lineTo(x - 20, y + 4);
  ctx.fill();
  for (const [dx, c] of [[-14, '#6fd3ff'], [0, '#ffe28a'], [14, '#6fd3ff']]) {
    const g = ctx.createRadialGradient(x + dx, y - 18, 1, x + dx, y - 18, 16);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + dx, y - 18 + Math.sin(t * 2 + dx) * 1.5, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.fillRect(x + dx - 4, y - 24 + Math.sin(t * 2 + dx) * 1.5, 8, 11);
  }
}

/** The Machine of Missing Things; `stage` 0–3 lights its three gauges. */
export function machine(ctx, x, y, { stage = 0, t = 0, done = false } = {}) {
  ctx.fillStyle = '#5a3d2c';
  ctx.fillRect(x - 90, y - 150, 180, 150);
  ctx.fillStyle = '#b4674a';
  ctx.fillRect(x - 84, y - 144, 168, 12);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 3;
  for (const [gx, gy, r] of [[x - 50, y - 100, 22], [x + 40, y - 92, 28], [x - 4, y - 50, 16]]) {
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(done ? t * 0.8 : stage > 0 ? t * 0.3 : 0);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = i % 2 ? r : r * 0.82;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 3; i++) {
    const on = stage > i;
    ctx.fillStyle = on ? ['#ffd977', '#6fd3ff', '#ff9ec4'][i] : '#3a3c5c';
    ctx.beginPath();
    ctx.arc(x - 30 + i * 30, y - 20, 7, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath();
      ctx.arc(x - 30 + i * 30, y - 20, 12 + Math.sin(t * 4 + i) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // three map-shaped slots
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = done ? '#f3e3c3' : '#2a1a22';
    ctx.fillRect(x + 60 - i * 14, y - 140 + i * 6, 12, 18);
  }
  if (done) {
    const g = ctx.createRadialGradient(x, y - 80, 10, x, y - 80, 140);
    g.addColorStop(0, 'rgba(159,215,255,.35)');
    g.addColorStop(1, 'rgba(159,215,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 140, y - 220, 280, 230);
  }
}

export function bicycle(ctx, x, y) {
  ctx.strokeStyle = '#3a72d8';
  ctx.lineWidth = 3;
  for (const dx of [-22, 22]) {
    ctx.beginPath();
    ctx.arc(x + dx, y - 16, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 16);
  ctx.lineTo(x - 4, y - 40);
  ctx.lineTo(x + 14, y - 40);
  ctx.lineTo(x + 22, y - 16);
  ctx.moveTo(x - 4, y - 40);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  ctx.fillStyle = '#8e1c2e';
  ctx.beginPath();
  ctx.ellipse(x + 16, y - 44, 6, 4, 0.4, 0, Math.PI * 2);
  ctx.ellipse(x + 22, y - 44, 6, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function musicBox(ctx, x, y, t = 0) {
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(x - 18, y - 22, 36, 22);
  ctx.fillStyle = '#e2b544';
  ctx.fillRect(x - 18, y - 24, 36, 4);
  ctx.fillStyle = '#f7b6cb';
  ctx.beginPath();
  ctx.arc(x, y - 32 + Math.sin(t * 2) * 1, 6, 0, Math.PI * 2);
  ctx.fill();
}

/** The giant glowing blue rose tree in the hidden garden. */
export function roseTree(ctx, x, y, t = 0) {
  const g = ctx.createRadialGradient(x, y - 170, 20, x, y - 170, 230);
  g.addColorStop(0, 'rgba(143,178,255,.35)');
  g.addColorStop(1, 'rgba(143,178,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 240, y - 400, 480, 420);
  ctx.fillStyle = '#3a2a36';
  ctx.beginPath();
  ctx.moveTo(x - 18, y);
  ctx.quadraticCurveTo(x - 10, y - 90, x - 30, y - 150);
  ctx.lineTo(x - 6, y - 150);
  ctx.quadraticCurveTo(x + 4, y - 100, x + 18, y);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.05 + (i / 8) * 0.9);
    const bx = x - 18 + Math.cos(a) * (90 + (i % 3) * 22);
    const by = y - 170 + Math.sin(a) * (80 + (i % 2) * 18);
    leafBlob(ctx, bx, by, 46, 34, i % 2 ? '#24503f' : '#2f5c4c');
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 60 + ((i * 37) % 70);
    rose(ctx, x - 18 + Math.cos(a) * r, y - 190 + Math.sin(a) * r * 0.7, 6 + (i % 3) * 1.5 + Math.sin(t * 2 + i) * 0.5, i % 6 === 0 ? 'white' : 'blue');
  }
}

/** One planted piece from the garden designer. */
export function gardenPiece(ctx, id, x, y, rand, t = 0) {
  switch (id) {
    case 'rose-blue':
    case 'rose-pink':
    case 'rose-white':
      roseBush(ctx, x, y, 34, 26, rand, { tone: id === 'rose-blue' ? 'blue' : id === 'rose-pink' ? 'pink' : 'white', roses: 4 });
      break;
    case 'lantern':
      lanternPost(ctx, x, y, { height: 70 });
      break;
    case 'bench':
      bench(ctx, x, y);
      break;
    case 'stones':
      ctx.fillStyle = '#c9b79c';
      for (const dx of [-12, 0, 12]) {
        ctx.beginPath();
        ctx.ellipse(x + dx, y - 2, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'arch':
      ctx.strokeStyle = '#6b8f68';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 30, 22, Math.PI, 0);
      ctx.moveTo(x - 22, y - 30);
      ctx.lineTo(x - 22, y);
      ctx.moveTo(x + 22, y - 30);
      ctx.lineTo(x + 22, y);
      ctx.stroke();
      for (let i = 0; i < 5; i++) rose(ctx, x + Math.cos(Math.PI + (i * Math.PI) / 4) * 22, y - 30 + Math.sin(Math.PI + (i * Math.PI) / 4) * 22, 3.6, i % 2 ? 'pink' : 'blue');
      break;
    case 'fountain':
      ctx.fillStyle = '#6d72a0';
      ctx.fillRect(x - 16, y - 10, 32, 10);
      ctx.fillStyle = '#7bb6ff';
      ctx.fillRect(x - 13, y - 12, 26, 3);
      ctx.strokeStyle = 'rgba(160,210,255,.85)';
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.quadraticCurveTo(x + 6, y - 28 - Math.sin(t * 3) * 2, x + 12, y - 12);
      ctx.stroke();
      break;
    case 'statue':
      ctx.fillStyle = '#e9e7f2';
      ctx.beginPath();
      ctx.ellipse(x, y - 12, 14, 10, 0, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 24, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 30);
      ctx.lineTo(x + 7, y - 40);
      ctx.lineTo(x + 11, y - 31);
      ctx.moveTo(x + 12, y - 31);
      ctx.lineTo(x + 15, y - 40);
      ctx.lineTo(x + 17, y - 29);
      ctx.fill();
      ctx.fillStyle = '#9aa3b8';
      ctx.fillRect(x - 16, y - 4, 32, 6);
      break;
    // V2 special pieces (unlocked by side missions)
    case 'cat-house':
      ctx.fillStyle = '#c9a77a';
      ctx.fillRect(x - 14, y - 18, 28, 18);
      ctx.fillStyle = '#8e1c2e';
      ctx.beginPath();
      ctx.moveTo(x - 18, y - 18);
      ctx.lineTo(x, y - 32);
      ctx.lineTo(x + 18, y - 18);
      ctx.fill();
      ctx.fillStyle = '#2a1a16';
      ctx.beginPath();
      ctx.arc(x, y - 6, 6, Math.PI, 0);
      ctx.fillRect(x - 6, y - 6, 12, 6);
      ctx.fill();
      cat(ctx, x + 18, y + 2, { small: true, t, facing: -1 });
      break;
    case 'robo':
      roboDog(ctx, x, y, { awake: true, t, facing: rand() < 0.5 ? 1 : -1 });
      break;
    case 'telescope':
      ctx.strokeStyle = '#8a6a20';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x, y - 14);
      ctx.lineTo(x + 8, y);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y - 16);
      ctx.rotate(-0.6);
      ctx.fillStyle = '#d8a73a';
      ctx.fillRect(-14, -3, 26, 6);
      ctx.fillStyle = '#9fd7ff';
      ctx.fillRect(12, -3.5, 3, 7);
      ctx.restore();
      break;
    case 'rose-vase':
      ctx.fillStyle = '#9fd7ff';
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.quadraticCurveTo(x - 12, y - 14, x - 5, y - 22);
      ctx.lineTo(x + 5, y - 22);
      ctx.quadraticCurveTo(x + 12, y - 14, x + 8, y);
      ctx.fill();
      rose(ctx, x, y - 30, 6, 'blue');
      break;
    case 'chocolates':
      ctx.fillStyle = '#5a3420';
      ctx.fillRect(x - 14, y - 10, 28, 10);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = ['#3f6fe0', '#e2b544', '#f3f1ff'][i];
        ctx.beginPath();
        ctx.arc(x - 8 + i * 8, y - 12, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'picnic':
      ctx.fillStyle = '#e85d8c';
      ctx.beginPath();
      ctx.ellipse(x, y - 1, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a77a';
      ctx.fillRect(x - 6, y - 12, 12, 9);
      break;
    case 'gift-box':
      ctx.fillStyle = '#1d2b5c';
      ctx.fillRect(x - 9, y - 16, 18, 16);
      ctx.fillStyle = '#3f6fe0';
      ctx.fillRect(x - 2, y - 16, 4, 16);
      ctx.fillRect(x - 9, y - 12, 18, 3);
      break;
    case 'lantern-path':
      for (const dx of [-14, 0, 14]) {
        ctx.fillStyle = '#ffd977';
        ctx.beginPath();
        ctx.arc(x + dx, y - 6, 3 + Math.sin(t * 3 + dx) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'promise-arch':
      ctx.strokeStyle = '#9fd7ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 26, 20, Math.PI, 0);
      ctx.stroke();
      rose(ctx, x, y - 46, 4.4, 'blue');
      break;
    case 'snooki-stash':
      ctx.fillStyle = '#8a6a45';
      ctx.fillRect(x - 12, y - 8, 24, 8);
      ctx.fillStyle = '#e85d8c';
      ctx.fillRect(x - 8, y - 12, 6, 4);
      ctx.fillStyle = '#f3f1ff';
      ctx.fillRect(x + 2, y - 13, 7, 5);
      break;
    case 'game-table':
      table(ctx, x, y, 30, { cloth: '#2f6a5a' });
      ctx.fillStyle = '#fff7ec';
      ctx.fillRect(x - 6, y - 43, 5, 7);
      ctx.fillRect(x + 1, y - 43, 5, 7);
      break;
    case 'table':
      table(ctx, x, y, 34, { cloth: '#2b3a8c' });
      ctx.fillStyle = '#f3f1ff';
      ctx.beginPath();
      ctx.ellipse(x - 6, y - 42, 6, 2.4, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 7, y - 42, 6, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4f8a5a';
      ctx.beginPath();
      ctx.arc(x - 6, y - 44, 2.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
  }
}

export * from './props-v2.js';
export * from './props-v3.js';
