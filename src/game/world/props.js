/**
 * Canvas drawing for environment pieces, in world units (ground top = GROUND).
 * Static props are baked into cached background chunks; dynamic ones (gates,
 * pedestals, doors…) are drawn every frame because their state changes.
 */
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
