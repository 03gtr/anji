/**
 * Static scene props by type. Baked into cached background chunks, so they
 * cost nothing per frame. Signature: (ctx, prop, rand).
 */
import * as P from './props.js';
import { GROUND } from './props.js';

export const PROP_DRAWERS = {
  fountain: (ctx, p) => P.fountain(ctx, p.x, GROUND + 4, 0),
  bench: (ctx, p) => P.bench(ctx, p.x, GROUND + 4),
  lantern: (ctx, p) => P.lanternPost(ctx, p.x, GROUND + 4, { height: p.height ?? 120, lit: p.lit ?? true }),
  bush: (ctx, p, r) => P.roseBush(ctx, p.x, GROUND + 6, p.w ?? 80, p.h ?? 46, r, { tone: p.tone ?? 'blue', roses: p.roses ?? 6 }),
  tree: (ctx, p, r) => P.tree(ctx, p.x, GROUND + 4, p.h ?? 200, r, { color: p.color ?? '#1d3a44', round: p.round ?? true }),
  sign: (ctx, p) => P.signPost(ctx, p.x, GROUND + 4, p.text),
  pot: (ctx, p, r) => P.pot(ctx, p.x, GROUND + 4, r, { tone: p.tone ?? 'blue' }),
  window: (ctx, p) => P.windowFrame(ctx, p.x - (p.w ?? 50) / 2, p.y ?? 60, p.w ?? 50, p.h ?? 70),
  frame: (ctx, p, r) => P.pictureFrame(ctx, p.x - (p.w ?? 34) / 2, p.y ?? 80, p.w ?? 34, p.h ?? 26, r, { tone: p.tone }),
  bookshelf: (ctx, p, r) => P.bookshelf(ctx, p.x - (p.w ?? 80) / 2, GROUND, p.w ?? 80, p.h ?? 150, r),
  table: (ctx, p) => P.table(ctx, p.x, GROUND + 2, p.w ?? 70, { cloth: p.cloth }),
  hedge: (ctx, p, r) => P.hedgeWall(ctx, p.x - p.w / 2, p.x + p.w / 2, GROUND - (p.h ?? 150), GROUND + 6, r, { roses: 0.08 }),
  hedgeArch: (ctx, p, r) => {
    P.hedgeWall(ctx, p.x - 120, p.x - 34, GROUND - 160, GROUND + 6, r, { roses: 0.1 });
    P.hedgeWall(ctx, p.x + 34, p.x + 120, GROUND - 160, GROUND + 6, r, { roses: 0.1 });
    ctx.strokeStyle = '#244a3e';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(p.x, GROUND - 120, 46, Math.PI, 0);
    ctx.stroke();
    for (let a = 0; a < 7; a++) P.rose(ctx, p.x + Math.cos(Math.PI + (a * Math.PI) / 6) * 46, GROUND - 120 + Math.sin(Math.PI + (a * Math.PI) / 6) * 46, 4.5, a % 3 ? 'blue' : 'pink');
    ctx.fillStyle = '#0d1a24';
    ctx.fillRect(p.x - 34, GROUND - 120, 68, 124);
    ctx.beginPath();
    ctx.arc(p.x, GROUND - 120, 34, Math.PI, 0);
    ctx.fill();
  },
  rug: (ctx, p) => {
    ctx.fillStyle = p.color ?? '#5b1f34';
    ctx.beginPath();
    ctx.ellipse(p.x, GROUND + 24, p.w ?? 70, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  car: (ctx, p) => P.sportsCar(ctx, p.x, GROUND + 18, { color: p.color ?? '#1f4fd1', lights: false }),
  mark: (ctx, p) => {
    ctx.fillStyle = '#4b4f78';
    ctx.fillRect(p.x - 16, GROUND - 46, 32, 50);
    P.creatorMark(ctx, p.x, GROUND - 24, 11, '#9fd7ff');
  },
};
