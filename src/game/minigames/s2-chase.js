/**
 * Season 2, Mission 02 «سنوكي ضايع» — the chase after Snooki: canvas drawing and input (rules in s2-chase-logic.js).
 * Tap anywhere (or the round button, Space, ↑) to jump; the second button (or ↓) slides under things.
 * The background reuses the world painter; Anji, Snooki and her husky reuse the game's sprites. Each leg is
 * its own place, drawn here: the archive's outer wall, the lantern tree, the shed roofs.
 *
 * options: { leg: 0 | 1 | 2, flags: 's2:13-' } — what she finds up on a high route is kept at once
 * (`<flags>find-<id>`), and so is the last checkpoint she passed (`<flags>cp-<leg>`): leaving the chase
 * half-way and coming back starts there, never earlier. Both are Season 2 flags (its own save).
 */
import { RUN, DOG, LEGS, createRun, stepRun, runMedal } from './s2-chase-logic.js';
import { createPainter, releaseCanvas } from '../world/painter.js';
import { PROP_DRAWERS } from '../world/prop-drawers.js';
import { GROUND, VIEW_H } from '../world/props.js';
import * as P from '../world/props.js';
import { spriteFrames } from '../world/sprite-cache.js';
import { fillNames } from '../core/names.js';
import { h } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { rng } from '../core/rng.js';

const LEG_NO = ['١', '٢', '٣'];
const FALL_LINE = { ditch: 'طشششش! … من آخر فانوس.', stream: 'طشششش! … من آخر فانوس.', gap: 'آآآخ! … من آخر فانوس.' };
const DOG_SAYS = { tease: '😜', innocent: '♪ …', showoff: '✨', escape: '🐾💨' };

/* ── the places (world units; ground top = GROUND) ── */
function stoneWall(ctx, x0, x1, top) {
  ctx.fillStyle = '#6d6a78';
  ctx.fillRect(x0, top, x1 - x0, GROUND - top);
  ctx.strokeStyle = 'rgba(40,36,56,.45)';
  ctx.lineWidth = 1;
  for (let y = top + 12, row = 0; y < GROUND; y += 12, row++) {
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    for (let x = x0 + (row % 2 ? 10 : 0); x < x1; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}
/** Behind each leg: the archive's long outer wall, the lantern tree's trunks and lanterns, far roofs. */
function backdrop(ctx, leg, camX, viewW, t) {
  const f = leg.id === 'roof' ? 0.5 : 0.8;
  const step = leg.id === 'archive' ? 240 : leg.id === 'tree' ? 520 : 200;
  const off = camX * (1 - f);
  const i0 = Math.floor((camX * f - step) / step);
  const i1 = Math.min(i0 + 40, Math.ceil(((camX + viewW) * f + step) / step)); // (bounded, whatever the view)
  for (let i = i0; i <= i1; i++) {
    const x = i * step + off;
    const r = rng(i * 7919 + leg.id.length);
    if (leg.id === 'archive') {
      stoneWall(ctx, x, x + step + 1, GROUND - 150);
      ctx.fillStyle = '#2b2a48'; // an arched window, warm inside
      ctx.beginPath();
      ctx.moveTo(x + 90, GROUND - 60);
      ctx.lineTo(x + 90, GROUND - 110);
      ctx.arc(x + 112, GROUND - 110, 22, Math.PI, 0);
      ctx.lineTo(x + 134, GROUND - 60);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,214,140,.35)';
      ctx.fillRect(x + 96, GROUND - 104, 32, 40);
      ctx.fillStyle = '#5a5668';
      ctx.fillRect(x, GROUND - 156, step + 1, 8); // the coping
    } else if (leg.id === 'tree') {
      // a trunk of the great tree and its lanterns, strung across
      ctx.fillStyle = '#1a1626';
      ctx.fillRect(x + 40, GROUND - 230, 46, 230);
      ctx.strokeStyle = 'rgba(40,30,60,.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 63, GROUND - 200);
      ctx.quadraticCurveTo(x + 63 + step / 2, GROUND - 150, x + 63 + step, GROUND - 200);
      ctx.stroke();
      for (let k = 1; k < 5; k++) {
        const lx = x + 63 + (step * k) / 5;
        const ly = GROUND - 200 + Math.sin((k / 5) * Math.PI) * 38 + 14;
        const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, 22);
        const a = 0.35 + 0.1 * Math.sin(t * 3 + k + i);
        glow.addColorStop(0, `rgba(255,206,120,${a})`);
        glow.addColorStop(1, 'rgba(255,206,120,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(lx - 22, ly - 22, 44, 44);
        ctx.fillStyle = '#f4c066';
        ctx.beginPath();
        ctx.ellipse(lx, ly, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // far roofs against the sunset
      const hgt = 40 + r() * 40;
      ctx.fillStyle = r() < 0.5 ? '#5a3b4e' : '#4d3646';
      ctx.beginPath();
      ctx.moveTo(x, GROUND - 40);
      ctx.lineTo(x + step * 0.5, GROUND - 40 - hgt);
      ctx.lineTo(x + step, GROUND - 40);
      ctx.fill();
      ctx.fillRect(x + step * 0.7, GROUND - 40 - hgt * 0.8, 10, 20);
    }
  }
}
/** The shed roofs: her ground on the last leg. */
function roofGround(ctx, u0, u1, bottom) {
  ctx.fillStyle = '#7a3b32';
  ctx.fillRect(u0, GROUND, u1 - u0, bottom - GROUND);
  ctx.fillStyle = '#93473b';
  for (let x = Math.floor(u0 / 18) * 18; x < u1; x += 18) {
    for (let y = GROUND + 3, k = 0; y < bottom; y += 10, k++) ctx.fillRect(x + (k % 2) * 9, y, 15, 6);
  }
  ctx.fillStyle = '#4b2620';
  ctx.fillRect(u0, GROUND - 3, u1 - u0, 5); // the ridge line she runs on
}
function pitDraw(ctx, p, t, bottom) {
  const x0 = p.x - p.w / 2;
  if (p.look === 'gap') {
    const g = ctx.createLinearGradient(0, GROUND, 0, bottom);
    g.addColorStop(0, '#2a1830');
    g.addColorStop(1, '#0c0814');
    ctx.fillStyle = g;
    ctx.fillRect(x0, GROUND - 3, p.w, bottom - GROUND + 3);
    ctx.fillStyle = '#3b3b46'; // the gutters on both edges
    ctx.fillRect(x0 - 4, GROUND - 2, 6, 8);
    ctx.fillRect(x0 + p.w - 2, GROUND - 2, 6, 8);
    return;
  }
  ctx.fillStyle = p.look === 'stream' ? '#16233a' : '#2a1d14';
  ctx.fillRect(x0, GROUND - 2, p.w, bottom - GROUND + 2);
  const water = ctx.createLinearGradient(0, GROUND + 10, 0, bottom);
  water.addColorStop(0, p.look === 'stream' ? '#3f7fb8' : '#4d6f82');
  water.addColorStop(1, '#1b3550');
  ctx.fillStyle = water;
  ctx.fillRect(x0 + 2, GROUND + 12, p.w - 4, bottom - GROUND - 12);
  ctx.strokeStyle = 'rgba(220,240,255,.55)';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 3; k++) {
    const y = GROUND + 18 + k * 8;
    ctx.beginPath();
    for (let x = x0 + 6; x < x0 + p.w - 6; x += 4) ctx.lineTo(x, y + Math.sin(t * 4 + x * 0.3 + k) * 1.4);
    ctx.stroke();
  }
  ctx.fillStyle = p.look === 'stream' ? '#4f7b4c' : '#7a6a58'; // reeds or stones on the edges
  for (const ex of [x0, x0 + p.w]) {
    ctx.beginPath();
    ctx.ellipse(ex, GROUND + 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
function lowDraw(ctx, o, r) {
  const x = o.x;
  const y = GROUND - o.base;
  ctx.save();
  switch (o.look) {
    case 'books':
      ['#8a3b4a', '#2f5d8a', '#c9a25c'].forEach((c, k) => {
        ctx.fillStyle = c;
        ctx.fillRect(x - 15 + k * 2, y - 11 * (k + 1), 30 - k * 4, 10);
      });
      break;
    case 'crate':
    case 'tiles':
      ctx.fillStyle = o.look === 'crate' ? '#8a6238' : '#a14a3a';
      ctx.fillRect(x - o.w / 2, y - o.h, o.w, o.h);
      ctx.strokeStyle = o.look === 'crate' ? '#5e4024' : '#6a2c22';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - o.w / 2 + 1, y - o.h + 1, o.w - 2, o.h - 2);
      if (o.look === 'crate') {
        ctx.beginPath();
        ctx.moveTo(x - o.w / 2, y - o.h);
        ctx.lineTo(x + o.w / 2, y);
        ctx.stroke();
      } else for (let k = 1; k < 4; k++) ctx.fillRect(x - o.w / 2, y - (o.h * k) / 4, o.w, 1.5);
      break;
    case 'can':
      ctx.fillStyle = '#4f8a6a';
      ctx.fillRect(x - 11, y - 24, 22, 24);
      ctx.strokeStyle = '#4f8a6a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 10, y - 16);
      ctx.lineTo(x + 20, y - 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - 2, y - 26, 8, Math.PI, 0);
      ctx.stroke();
      break;
    case 'cart':
      ctx.fillStyle = '#6b4a35';
      ctx.fillRect(x - 17, y - 36, 34, 26);
      ['#8a3b4a', '#2f5d8a', '#c9a25c', '#4f8a6a'].forEach((c, k) => {
        ctx.fillStyle = c;
        ctx.fillRect(x - 15 + k * 8, y - 46, 6, 12);
      });
      ctx.fillStyle = '#222';
      for (const dx of [-11, 11]) {
        ctx.beginPath();
        ctx.arc(x + dx, y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'pot':
      P.pot(ctx, x, y, r, { tone: 'pink' });
      break;
    case 'root':
      ctx.strokeStyle = '#3d2a20';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - o.w / 2 - 6, y + 2);
      ctx.quadraticCurveTo(x, y - o.h * 1.9, x + o.w / 2 + 6, y + 2);
      ctx.stroke();
      break;
    case 'stand':
    case 'chimney-pot':
      if (o.look === 'stand') {
        ctx.strokeStyle = '#2b2236';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 9, y);
        ctx.lineTo(x, y - o.h + 12);
        ctx.lineTo(x + 9, y);
        ctx.stroke();
        ctx.fillStyle = '#f4c066';
        ctx.beginPath();
        ctx.ellipse(x, y - o.h + 6, 7, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#7a4a3a';
        ctx.fillRect(x - 13, y - o.h, 26, o.h);
        ctx.fillStyle = '#5a3328';
        ctx.fillRect(x - 16, y - o.h, 32, 6);
      }
      break;
    case 'nest':
      ctx.fillStyle = '#7a5a3a';
      ctx.beginPath();
      ctx.ellipse(x, y - 10, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfe3ef';
      for (const dx of [-5, 3]) {
        ctx.beginPath();
        ctx.ellipse(x + dx, y - 18, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'vent':
      ctx.fillStyle = '#8a8f9c';
      ctx.fillRect(x - 9, y - o.h, 18, o.h);
      ctx.fillStyle = '#5d626e';
      ctx.fillRect(x - 13, y - o.h - 4, 26, 6);
      break;
    default:
      ctx.fillStyle = '#6b4a35';
      ctx.fillRect(x - o.w / 2, y - o.h, o.w, o.h);
  }
  ctx.restore();
}
/** Something overhead (slide under it): its lowest edge is RUN-height `y0` above the ground. */
function duckDraw(ctx, o, t) {
  const x = o.x;
  const bottom = GROUND - o.y0;
  ctx.save();
  if (o.look === 'branch') {
    ctx.strokeStyle = '#2b2018';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 70, GROUND - 160);
    ctx.quadraticCurveTo(x - 10, bottom - 30, x + o.w / 2 + 10, bottom - 8);
    ctx.stroke();
    for (let k = -2; k <= 2; k++) P.leafBlob(ctx, x + k * 10, bottom - 6 + Math.abs(k) * 3, 12, 8, k % 2 ? '#24463a' : '#2f5c4c');
    const glow = ctx.createRadialGradient(x + 6, bottom + 4, 1, x + 6, bottom + 4, 18);
    glow.addColorStop(0, 'rgba(255,206,120,.5)');
    glow.addColorStop(1, 'rgba(255,206,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 12, bottom - 14, 36, 36);
    ctx.fillStyle = '#f4c066';
    ctx.beginPath();
    ctx.ellipse(x + 6, bottom + 2, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.look === 'sign') {
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(x - 40, bottom - 66, 80, 6);
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1.5;
    for (const dx of [-14, 14]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, bottom - 60);
      ctx.lineTo(x + dx, bottom - 24);
      ctx.stroke();
    }
    ctx.fillStyle = '#8a6238';
    ctx.fillRect(x - o.w / 2, bottom - 26, o.w, 26);
    ctx.fillStyle = '#f4e3c0';
    ctx.font = '700 9px "Baloo Bhaijaan 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillText('الأرشيف', x, bottom - 9);
  } else {
    // a line (washing, or an aerial's wire with little flags) sagging low across her way
    ctx.strokeStyle = '#d8d2c4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 60, bottom - 50);
    ctx.quadraticCurveTo(x, bottom - 6, x + 60, bottom - 50);
    ctx.stroke();
    const colors = o.look === 'wire' ? ['#e24a6a', '#ffd84d', '#4e86c9', '#5fd18a'] : ['#f2efe6', '#9fd7ff', '#f7b6cb'];
    for (let k = -1; k <= 1; k++) {
      const cx = x + k * 18;
      const cy = bottom - 18 + Math.abs(k) * 7;
      ctx.fillStyle = colors[(k + 4) % colors.length];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 2 + k) * 0.08);
      if (o.look === 'wire') {
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(6, -8);
        ctx.lineTo(0, 10);
        ctx.fill();
      } else ctx.fillRect(-8, -8, 16, 26 - Math.abs(k) * 6);
      ctx.restore();
    }
  }
  ctx.restore();
}
function routeDraw(ctx, p) {
  const top = GROUND - p.y;
  if (p.look === 'wall') {
    stoneWall(ctx, p.x0, p.x1, top);
    ctx.fillStyle = '#8a8698';
    ctx.fillRect(p.x0 - 2, top - 4, p.x1 - p.x0 + 4, 7);
  } else if (p.look === 'ridge') {
    ctx.fillStyle = '#8b4438';
    ctx.beginPath();
    ctx.moveTo(p.x0, GROUND);
    ctx.lineTo(p.x0 + 20, top);
    ctx.lineTo(p.x1 - 20, top);
    ctx.lineTo(p.x1, GROUND);
    ctx.fill();
    ctx.fillStyle = '#a3574a';
    for (let y = top + 8; y < GROUND; y += 12) ctx.fillRect(p.x0 + 20, y, p.x1 - p.x0 - 40, 4);
    ctx.fillStyle = '#4b2620';
    ctx.fillRect(p.x0 + 14, top - 3, p.x1 - p.x0 - 28, 6);
  } else {
    // a long branch of the lantern tree
    ctx.fillStyle = '#2b2018';
    ctx.fillRect(p.x0, top - 2, p.x1 - p.x0, 12);
    for (let x = p.x0 + 10; x < p.x1; x += 26) P.leafBlob(ctx, x, top - 4, 12, 7, (x / 26) % 2 < 1 ? '#24463a' : '#2f5c4c');
  }
}
function springDraw(ctx, sp, t) {
  const x = sp.x;
  ctx.save();
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(x - 22, GROUND - 16, 44, 16);
  ctx.strokeStyle = '#c9c9d6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k < 5; k++) ctx.lineTo(x + (k % 2 ? 8 : -8), GROUND - 16 - k * 3);
  ctx.stroke();
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(x - 26, GROUND - 32, 52, 5);
  // the sign: up, this way
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(x - 36, GROUND - 76, 3, 60);
  ctx.fillStyle = '#ffd977';
  ctx.beginPath();
  ctx.arc(x - 34, GROUND - 80 + Math.sin(t * 4) * 2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1440';
  ctx.font = '700 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⤴', x - 34, GROUND - 79 + Math.sin(t * 4) * 2);
  ctx.restore();
}
function coverDraw(ctx, c) {
  const x = c.x;
  ctx.save();
  switch (c.look) {
    case 'barrel':
      ctx.fillStyle = '#7a5232';
      ctx.fillRect(x - 22, GROUND - 58, 44, 58);
      ctx.fillStyle = '#3b3b46';
      for (const y of [GROUND - 50, GROUND - 12]) ctx.fillRect(x - 23, y, 46, 4);
      break;
    case 'cart':
      ctx.fillStyle = '#6b4a35';
      ctx.fillRect(x - 26, GROUND - 60, 52, 50);
      ['#8a3b4a', '#2f5d8a', '#c9a25c', '#4f8a6a', '#8a3b4a'].forEach((col, k) => {
        ctx.fillStyle = col;
        ctx.fillRect(x - 24 + k * 10, GROUND - 74, 8, 16);
      });
      ctx.fillStyle = '#222';
      for (const dx of [-16, 16]) {
        ctx.beginPath();
        ctx.arc(x + dx, GROUND - 6, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'trunk':
      ctx.fillStyle = '#2b2018';
      ctx.fillRect(x - 26, GROUND - 70, 52, 70);
      ctx.fillStyle = '#3d2e22';
      ctx.beginPath();
      ctx.ellipse(x, GROUND - 70, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'stand':
      ctx.fillStyle = '#2b2236';
      ctx.fillRect(x - 24, GROUND - 64, 48, 64);
      ctx.fillStyle = '#f4c066';
      ctx.fillRect(x - 16, GROUND - 56, 32, 24);
      break;
    default:
      // a chimney
      ctx.fillStyle = '#7a4a3a';
      ctx.fillRect(x - 24, GROUND - 72, 48, 72);
      ctx.fillStyle = '#5a3328';
      ctx.fillRect(x - 28, GROUND - 76, 56, 8);
      ctx.strokeStyle = 'rgba(70,40,30,.6)';
      for (let y = GROUND - 60; y < GROUND; y += 12) {
        ctx.beginPath();
        ctx.moveTo(x - 24, y);
        ctx.lineTo(x + 24, y);
        ctx.stroke();
      }
  }
  ctx.restore();
}
function findDraw(ctx, f, t) {
  const x = f.x;
  const y = GROUND - f.y + Math.sin(t * 3 + x) * 3;
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 1, x, y, 20);
  glow.addColorStop(0, 'rgba(255,240,180,.55)');
  glow.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 20, y - 20, 40, 40);
  if (f.id === 'ball') {
    ctx.fillStyle = '#c9e04a';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f6f6ea';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x - 9, y, 8, -0.8, 0.8);
    ctx.stroke();
  } else if (f.id === 'bell') {
    ctx.fillStyle = '#e7b84a';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 6);
    ctx.quadraticCurveTo(x - 8, y - 9, x, y - 9);
    ctx.quadraticCurveTo(x + 8, y - 9, x + 8, y + 6);
    ctx.fill();
    ctx.fillStyle = '#4e86c9';
    ctx.fillRect(x - 9, y - 12, 18, 3);
  } else {
    ctx.fillStyle = '#1b1b22';
    for (const dx of [-6, 6]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y, 5.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillRect(x - 2, y - 2, 4, 1.5);
  }
  ctx.restore();
  P.sparkle(ctx, x + 10, y - 10, 4 + Math.sin(t * 5) * 1.5, 0.8);
}
/** Her case notebook, in Snooki's mouth. */
function notebook(ctx, x, y) {
  ctx.fillStyle = '#2f5d8a';
  ctx.fillRect(x - 6, y - 5, 12, 9);
  ctx.fillStyle = '#e9e4d8';
  ctx.fillRect(x - 5, y - 4, 2, 7);
}
function bubble(ctx, x, y, text, camX, viewW) {
  ctx.save();
  ctx.font = '700 11px "Baloo Bhaijaan 2", "Segoe UI Emoji", sans-serif';
  ctx.direction = 'rtl';
  const w = Math.min(viewW - 20, ctx.measureText(text).width + 16);
  const bx = Math.max(camX + w / 2 + 6, Math.min(camX + viewW - w / 2 - 6, x));
  ctx.fillStyle = 'rgba(255,247,236,.96)';
  ctx.beginPath();
  ctx.roundRect?.(bx - w / 2, y - 18, w, 20, 9);
  ctx.fill();
  ctx.fillStyle = '#2b2340';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx, y - 7, w - 8);
  ctx.restore();
}

export function mount(area, { app, scope, options, hud, finish }) {
  const legIndex = Math.max(0, Math.min(LEGS.length - 1, Number(options.leg) || 0));
  const course = LEGS[legIndex];
  const flags = options.flags || 's2:13-';
  const cpFlag = `${flags}cp-${legIndex}`;
  const findFlag = (id) => `${flags}find-${id}`;
  const game = app.game;
  const startAt = () => (Number.isInteger(game.flag(cpFlag)) ? game.flag(cpFlag) : 0);
  let s = createRun(course, { cp: startAt() });
  for (const f of course.finds) if (game.flag(findFlag(f.id))) s.found.add(f.id); // found before: stays found
  let paused = true;
  let ended = false;
  let jumpQueued = false;
  let slideQueued = false;
  let t = 0;
  let frames = null;
  let banner = null; // { text, until }
  let line = null; // a short line over her head (a fall, a checkpoint)
  const huskyTrail = []; // her y a moment ago (the husky jumps a beat after her)

  const wrap = h(`<div class="runner s2-run">
      <canvas class="runner-canvas" aria-label="مطاردة سنوكي"></canvas>
      <button type="button" class="runner-jump" aria-label="قفزة">⤒</button>
      <button type="button" class="runner-slide" aria-label="تزحلگي">⤓</button>
    </div>`);
  // the slide button mirrors the jump button on the other side (inline: the shared stylesheet is not this file's)
  Object.assign(wrap.querySelector('.runner-slide').style, {
    position: 'absolute',
    bottom: 'calc(var(--safe-b, 0px) + 18px)',
    left: 'calc(var(--safe-l, 0px) + 18px)',
    width: '76px',
    height: '76px',
    border: '0',
    borderRadius: '50%',
    fontSize: '30px',
    color: '#1b1440',
    background: '#9fd7ff',
    boxShadow: '0 5px 0 #5f8fb8, 0 0 0 6px rgba(159, 215, 255, 0.2)',
    touchAction: 'none',
  });
  area.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const painter = createPainter({ theme: course.theme, seed: 31 + legIndex, propDrawers: PROP_DRAWERS });
  scope.add(() => painter.dispose());
  let viewW = 400;
  let viewH = VIEW_H;
  let topY = 0;
  let px = 1;

  function resize() {
    const r = wrap.getBoundingClientRect();
    // (a panel that is opening or closing can measure 0 px: keep the last good layout — a zero scale would make
    // the view infinitely wide)
    if (r.width < 2 || r.height < 2) return;
    // at most 1.5 device pixels per CSS pixel: a 70-second leg scrolls through many background chunks, and
    // phones (iOS above all) cap a page's total canvas memory — the place after the chase needs its share
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
    // portrait phones zoom in (≥ 300 units wide) so the runners are big enough
    const k = Math.min(r.height / VIEW_H, r.width / (r.width < r.height ? 300 : 420));
    viewW = r.width / k;
    // the ground at ~70 % of the height: on a tall phone the runners are not squeezed against the bottom,
    // and the two round buttons sit on the ground below them, never over them
    topY = Math.max(VIEW_H - r.height / k, GROUND - 0.7 * (r.height / k));
    viewH = r.height / k;
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
  const slide = (e) => {
    e?.preventDefault?.();
    slideQueued = true;
  };
  scope.on(canvas, 'pointerdown', jump);
  scope.on(wrap.querySelector('.runner-jump'), 'pointerdown', jump);
  scope.on(wrap.querySelector('.runner-slide'), 'pointerdown', slide);
  scope.on(document, 'keydown', (e) => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) jump(e);
    else if (['ArrowDown', 'KeyS'].includes(e.code)) slide(e);
  });

  const hazardRand = course.hazards.map((o) => rng(o.x));
  const visible = (x, camX, m = 90) => x > camX - m && x < camX + viewW + m;
  const label = (id) => fillNames(course.finds.find((f) => f.id === id)?.label || '', game);

  function draw() {
    ctx.setTransform(px, 0, 0, px, 0, -topY * px);
    // she runs a little left of centre: Snooki ahead of her stays on screen (even a 300-unit phone view)
    const camX = Math.max(0, s.x - viewW * 0.28);
    painter.drawBack(ctx, camX, viewW, px, topY);
    const bottom = topY + viewH;
    if (bottom > VIEW_H) {
      // a tall screen shows more ground than the painter draws: the soil goes on down
      ctx.fillStyle = course.theme === 'garden-night' ? '#1d2b2c' : '#24332a';
      ctx.fillRect(0, VIEW_H - 1, viewW, bottom - VIEW_H + 2);
    }
    ctx.save();
    ctx.translate(-camX, 0);
    backdrop(ctx, course, camX, viewW, t);
    if (course.id === 'roof') roofGround(ctx, camX - 10, camX + viewW + 10, Math.max(VIEW_H, bottom));
    for (const p of course.platforms) if (p.x1 > camX - 40 && p.x0 < camX + viewW + 40) routeDraw(ctx, p);
    for (const p of course.hazards) if (p.kind === 'pit' && visible(p.x, camX)) pitDraw(ctx, p, t, Math.max(VIEW_H, bottom));
    for (const [i, x] of course.checkpoints.entries()) if (i > 0 && visible(x, camX)) P.lanternPost(ctx, x, GROUND + 4, { height: 90, lit: s.cp >= i });
    for (const sp of course.springs) if (visible(sp.x, camX)) springDraw(ctx, sp, t);
    course.hazards.forEach((o, i) => {
      if (o.kind === 'low' && visible(o.x, camX)) lowDraw(ctx, o, hazardRand[i]);
    });
    for (const o of course.highHazards) if (visible(o.x, camX)) lowDraw(ctx, o, rng(o.x));
    for (const f of course.finds) if (!s.found.has(f.id) && visible(f.x, camX)) findDraw(ctx, f, t);

    if (frames) {
      const blit = (img, x, y, hgt, { flip = false, rot = 0, alpha = 1 } = {}) => {
        const w = (img.width / img.height) * hgt;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        if (rot) ctx.rotate(rot);
        if (flip) ctx.scale(-1, 1);
        ctx.drawImage(img, -w / 2, -hgt, w, hgt);
        ctx.restore();
      };
      const run = Math.floor(t * 12) % 6;
      // her husky, a beat behind her (she does not fall in after her: she stops at the edge and barks)
      const hy = s.falling > 0 ? 0 : (huskyTrail[0] ?? s.y);
      const hx = s.x - 48;
      const hk = frames.husky;
      blit(s.falling > 0 ? hk.bark[Math.floor(t * 6) % hk.bark.length] : hy > 2 ? hk.run[2] : hk.run[(run + 2) % hk.run.length], hx, GROUND + 2 - hy, 46);
      // Snooki, the notebook in his mouth
      const d = s.dog;
      if (visible(d.x, camX, 60)) {
        const sk = frames.snooki;
        const dy = GROUND + 2 - d.y;
        if (d.state === 'hide') {
          blit(sk.sniff[Math.floor(t * 2) % sk.sniff.length], d.x, dy + 22, 52); // crouched behind his cover, peeking
        } else if (d.state === 'innocent') {
          blit(sk.innocent[Math.floor(t * 2) % sk.innocent.length], d.x + 34, dy, 52);
        } else if (d.state === 'tease') {
          blit(sk.wag[Math.floor(t * 8) % sk.wag.length], d.x, dy, 52, { flip: true }); // looking back at her
          notebook(ctx, d.x - 18, dy - 30);
        } else {
          const img = d.y > 2 ? sk.jump[0] : sk.run[run % sk.run.length];
          blit(img, d.x, dy, 52, { rot: d.state === 'showoff' ? -d.flip * Math.PI * 2 : 0 });
          if (d.state !== 'showoff') notebook(ctx, d.x + 20, dy - 30);
        }
        if (DOG_SAYS[d.state]) bubble(ctx, d.x + (d.state === 'innocent' ? 34 : 0), dy - 60, DOG_SAYS[d.state], camX, viewW);
      }
      // the covers stand in front of him (he hides behind them)
      for (const c of course.hides) if (visible(c.x, camX)) coverDraw(ctx, c);
      // Anji
      const ak = frames.anji;
      const ay = GROUND + 3 - s.y;
      const img = s.falling > 0 ? ak.fall[0] : s.slide > 0 ? ak.crouch[0] : s.support === null ? (s.vy > 0 ? ak.jump[0] : ak.fall[0]) : ak.run[run];
      blit(img, s.x, ay, s.slide > 0 ? 70 : 96, { rot: s.stumble > 0 ? Math.sin(t * 30) * 0.1 : s.slide > 0 ? -0.12 : 0, alpha: s.falling > 0 ? Math.max(0.2, s.falling / RUN.fallTime) : 1 });
      if (d.state === 'hide' && d.x - s.x < 200) bubble(ctx, hx, GROUND - 60 - hy, 'هاو! هناك!', camX, viewW); // the husky's cue
      if (line && t < line.until) bubble(ctx, s.x, ay - 104, line.text, camX, viewW);
    }
    // overhead things are in front of her (she slides under them)
    for (const o of course.hazards) if (o.kind === 'duck' && visible(o.x, camX)) duckDraw(ctx, o, t);
    ctx.restore();
    painter.drawFront(ctx, camX, viewW);
    if (banner && t < banner.until) {
      ctx.save();
      ctx.setTransform(px, 0, 0, px, 0, -topY * px);
      ctx.font = '700 15px "Baloo Bhaijaan 2", sans-serif';
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      const w = Math.min(viewW - 20, ctx.measureText(banner.text).width + 30);
      ctx.fillStyle = 'rgba(27,20,64,.82)';
      ctx.beginPath();
      ctx.roundRect?.(viewW / 2 - w / 2, Math.max(topY + 26, GROUND - 270), w, 30, 12);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(banner.text, viewW / 2, Math.max(topY + 26, GROUND - 270) + 20, w - 12);
      ctx.restore();
    }
  }

  function end() {
    if (ended) return;
    ended = true;
    paused = true;
    game.setFlag(cpFlag, false); // the leg is done: next time, from its start
    const found = course.finds.filter((f) => s.found.has(f.id)).map((f) => label(f.id));
    finish({
      completed: true,
      score: found.length,
      medal: runMedal(s),
      title: 'ضاع الأثر! 🐾',
      summary: `تعثّرات: ${num(s.stumbles)} · وگعات: ${num(s.falls)}${found.length ? ` · لگيتي: ${found.join('، ')}` : ''}`,
    });
  }

  const loop = scope.loop((dt) => {
    t += dt;
    if (!paused) {
      const ev = stepRun(course, s, dt, { jump: jumpQueued, slide: slideQueued });
      jumpQueued = false;
      slideQueued = false;
      huskyTrail.push(s.y);
      while (huskyTrail.length > 8) huskyTrail.shift();
      if (ev.jumped) app.audio.play(ev.spring ? 'sparkle' : 'jump');
      if (ev.hit) {
        app.audio.play('boing');
        app.audio.vibrate?.(40);
      }
      if (ev.fell) {
        app.audio.play('fail');
        line = { text: FALL_LINE[course.hazards.find((p) => p.kind === 'pit' && Math.abs(p.x - s.x) < p.w)?.look] || 'آخ! … من آخر فانوس.', until: t + 1.8 };
      }
      if (ev.checkpoint) {
        app.audio.play('sparkle');
        game.setFlag(cpFlag, s.cp); // a fall — or leaving — never takes her back before this
        line = { text: 'فانوس! من هنا إذا وگعت.', until: t + 1.6 };
      }
      if (ev.found) {
        app.audio.play('pickup');
        game.setFlag(findFlag(ev.found), true);
        banner = { text: `لگيتي: ${label(ev.found)}!`, until: t + 2.4 };
      }
      if (ev.dog === 'escape') banner = { text: 'وين راح؟!', until: t + 2.2 };
      if (ev.finished) {
        paused = true;
        scope.timeout(end, 700);
      }
      const pct = Math.min(100, Math.round((s.x / course.length) * 100));
      hud(`${LEG_NO[legIndex]}/٣ · ${num(pct)}٪ · ✨ ${num(s.found.size)}`);
    }
    draw();
  });

  return {
    async start() {
      // the same frames the scenes use (baked once, shared: world/sprite-cache.js), never released here
      const [anji, snooki, husky] = await Promise.all(['anji', 'snooki', 'husky'].map((k) => spriteFrames(k, game.state.cosmetics)));
      if (scope.disposed) return;
      frames = { anji, snooki, husky };
      s = createRun(course, { cp: startAt() });
      for (const f of course.finds) if (game.flag(findFlag(f.id))) s.found.add(f.id);
      banner = { text: `${LEG_NO[legIndex]} من ٣ · ${course.title}${s.cp ? ' · من آخر فانوس' : ''}`, until: t + 2.6 };
      paused = false;
      loop.start();
    },
    pause() {
      paused = true;
    },
    resume() {
      if (!ended) paused = false;
    },
    destroy() {
      loop.stop();
      releaseCanvas(canvas); // its memory back now, not at the next garbage collection
    },
    /** (tests and the playtest bot) */
    get state() {
      return s;
    },
    get course() {
      return course;
    },
    get paused() {
      return paused;
    },
  };
}

export { RUN, DOG };
