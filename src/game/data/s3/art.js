/**
 * Season 3 «أصداء الـV8» — drawings shared by the missions (procedural, nothing to bake or download).
 * - zefiro(): Ryan's car, drawn properly at last — an original muscle-car silhouette (long bonnet, short deck, wide
 *   haunches), never a manufacturer's artwork or logo — always in the colour she gave it (cosmetics.carColor).
 * - the street's details (Mission 02's observation pass) and the waveform strips (Mission 03, P-02), drawn from the
 *   same engine model the sound is made from (core/engine-voice.js).
 */
import { GROUND } from '../../world/props.js';
import { strokes } from '../../core/engine-voice.js';

// the same five colours as the garage and the races (data/scenes/act3.js, minigames/racing.js); kept here so the
// season's data imports no scene (no import cycle)
const CAR_COLORS = { cobalt: '#1f4fd1', midnight: '#1a1f5e', rose: '#e0567f', pearl: '#e9e7f2', emerald: '#13806a' };

const TAU = Math.PI * 2;
/** Zefiro's colour, as she chose it (cobalt by default). */
export const carColor = (game) => CAR_COLORS[game.state.cosmetics?.carColor] || CAR_COLORS.cobalt;

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Zefiro, facing right, wheels on y. `running`: exhaust breath; `blip`: 0…1 a stronger breath. */
export function zefiro(ctx, x, y, { color = CAR_COLORS.cobalt, lights = false, running = false, blip = 0, driver = false, dog = false, t = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  // the shadow, and the headlights' pool on the road
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 100, 7, 0, 0, TAU);
  ctx.fill();
  if (lights) {
    const g = ctx.createRadialGradient(130, -6, 4, 130, -6, 90);
    g.addColorStop(0, 'rgba(255,240,200,.45)');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(80, -60, 150, 80);
  }
  // the body: low and long, bonnet longer than the boot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-98, -12);
  ctx.lineTo(-96, -30);
  ctx.lineTo(-74, -34);
  ctx.lineTo(-48, -36);
  ctx.lineTo(-30, -52);
  ctx.lineTo(4, -54);
  ctx.lineTo(26, -38);
  ctx.lineTo(80, -34);
  ctx.lineTo(98, -30);
  ctx.lineTo(102, -16);
  ctx.lineTo(96, -8);
  ctx.lineTo(-92, -8);
  ctx.closePath();
  ctx.fill();
  // the shoulder line and the haunches' shade
  ctx.fillStyle = shade(color, 0.72);
  ctx.fillRect(-94, -22, 192, 10);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-90, -28);
  ctx.lineTo(96, -28);
  ctx.stroke();
  // twin bonnet stripes
  ctx.fillStyle = 'rgba(15,17,30,.55)';
  ctx.fillRect(40, -37, 56, 2);
  ctx.fillRect(40, -33, 56, 2);
  // the glasshouse: low, small windows
  ctx.fillStyle = 'rgba(150,190,230,.75)';
  ctx.beginPath();
  ctx.moveTo(-42, -37);
  ctx.lineTo(-27, -50);
  ctx.lineTo(2, -51);
  ctx.lineTo(20, -38);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, 0.55);
  ctx.fillRect(-12, -50, 3, 13);
  // who is inside (silhouettes): Ryan at the wheel, Snooky's head at the back window
  if (driver) {
    ctx.fillStyle = 'rgba(20,22,40,.85)';
    ctx.beginPath();
    ctx.arc(6, -44, 5.5, 0, TAU);
    ctx.fill();
    ctx.fillRect(1, -40, 11, 4);
  }
  if (dog) {
    ctx.fillStyle = '#f2ece0';
    ctx.beginPath();
    ctx.ellipse(-26, -43, 6, 5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-31, -47);
    ctx.lineTo(-29, -53);
    ctx.lineTo(-26, -47);
    ctx.moveTo(-25, -47);
    ctx.lineTo(-22, -53);
    ctx.lineTo(-20, -46);
    ctx.fill();
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(-23, -44, 1.6, 1.6);
  }
  // lamps: slim headlight, wide tail-light
  ctx.fillStyle = lights ? '#fff4d0' : '#c8d6e8';
  ctx.fillRect(92, -27, 9, 4);
  ctx.fillStyle = running ? '#ff3a4e' : '#9a2a3a';
  ctx.fillRect(-98, -27, 8, 5);
  // the plate (Mission 02's detail: it ends in «١٩»)
  ctx.fillStyle = '#f2f2ea';
  ctx.fillRect(-100, -19, 6, 7);
  // wheels: big, with five-spoke rims
  for (const wx of [-60, 62]) {
    ctx.fillStyle = '#101016';
    ctx.beginPath();
    ctx.arc(wx, -8, 16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8a92a8';
    ctx.beginPath();
    ctx.arc(wx, -8, 8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#5a6278';
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(wx, -8);
      ctx.lineTo(wx + Math.cos((k * TAU) / 5) * 8, -8 + Math.sin((k * TAU) / 5) * 8);
      ctx.stroke();
    }
  }
  // the exhaust's breath: a slow puff at idle, a bigger one on the blip
  if (running) {
    const k = (t * 1.6) % 1;
    const size = 4 + k * 10 + blip * 14;
    ctx.fillStyle = `rgba(200,205,220,${(0.28 + blip * 0.3) * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(-106 - k * 16 - blip * 10, -10 - k * 4, size, 0, TAU);
    ctx.fill();
    // the body trembles with the idle (a pixel)
  }
  ctx.restore();
}

/** A street lamp with its timer box (Mission 02: «الإنارة تتحول للوضع الليلي ١١:٠٠»). */
export function streetLamp(ctx, x, { t = 0, night = false } = {}) {
  ctx.save();
  ctx.fillStyle = '#3a3f5c';
  ctx.fillRect(x - 3, GROUND - 170, 6, 170);
  ctx.fillRect(x - 3, GROUND - 170, 34, 5);
  const glow = night ? 0.25 : 0.45;
  const g = ctx.createRadialGradient(x + 28, GROUND - 160, 2, x + 28, GROUND - 160, 120);
  g.addColorStop(0, `rgba(255,214,140,${glow})`);
  g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 100, GROUND - 280, 260, 290);
  ctx.fillStyle = '#ffe2a8';
  ctx.fillRect(x + 22, GROUND - 165, 14, 5);
  // the timer box, with its blinking light
  ctx.fillStyle = '#5a6078';
  ctx.fillRect(x - 9, GROUND - 74, 18, 24);
  ctx.fillStyle = Math.sin(t * 4) > 0 ? '#7cf0a0' : '#2a5a3a';
  ctx.fillRect(x - 3, GROUND - 70, 6, 3);
  ctx.restore();
}

/** The bakery: its sign, its shutter (open … rolled down). */
export function bakery(ctx, x, { shut = false } = {}) {
  ctx.save();
  ctx.fillStyle = '#4a3a3a';
  ctx.fillRect(x - 80, GROUND - 120, 160, 120);
  ctx.fillStyle = '#e8a24a';
  ctx.fillRect(x - 70, GROUND - 116, 140, 18);
  ctx.fillStyle = '#3a2420';
  ctx.font = '700 12px "Baloo Bhaijaan 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('مخبز الحارة', x, GROUND - 103);
  if (shut) {
    ctx.fillStyle = '#7a7f92';
    ctx.fillRect(x - 66, GROUND - 92, 132, 92);
    ctx.fillStyle = '#62667a';
    for (let k = 0; k < 15; k++) ctx.fillRect(x - 66, GROUND - 90 + k * 6, 132, 1.5);
  } else {
    ctx.fillStyle = 'rgba(255,214,150,.85)';
    ctx.fillRect(x - 66, GROUND - 92, 132, 92);
    ctx.fillStyle = '#c48a4a';
    for (let k = 0; k < 4; k++) ctx.fillRect(x - 56 + k * 30, GROUND - 46, 22, 8);
  }
  // the opening hours on the door
  ctx.fillStyle = '#f2ece0';
  ctx.fillRect(x + 50, GROUND - 60, 12, 16);
  ctx.restore();
}

/** Her gate, and the neighbour's camera above the next gate. */
export function gate(ctx, x, { open = false } = {}) {
  ctx.save();
  ctx.fillStyle = '#2a2e58';
  ctx.fillRect(x - 30, GROUND - 70, 6, 70);
  ctx.fillRect(x + 24, GROUND - 70, 6, 70);
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 2;
  const w = open ? 18 : 48;
  for (let k = 0; k <= 6; k++) {
    ctx.beginPath();
    ctx.moveTo(x - 24 + (k * w) / 6, GROUND - 62);
    ctx.lineTo(x - 24 + (k * w) / 6, GROUND - 4);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x - 24, GROUND - 62);
  ctx.lineTo(x - 24 + w, GROUND - 62);
  ctx.stroke();
  ctx.restore();
}
export function camera(ctx, x, { t = 0 } = {}) {
  ctx.save();
  ctx.fillStyle = '#d8dae6';
  ctx.fillRect(x - 10, GROUND - 92, 20, 10);
  ctx.fillRect(x + 6, GROUND - 96, 4, 6);
  ctx.fillStyle = '#20232e';
  ctx.beginPath();
  ctx.arc(x - 10, GROUND - 87, 4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = Math.sin(t * 2) > 0.6 ? '#ff4a5a' : '#5a2a30';
  ctx.fillRect(x + 4, GROUND - 90, 3, 3);
  ctx.restore();
}

/**
 * A recording's waveform, as an inline SVG (the puzzle's cards). The engine's strokes go up from the centre line,
 * everything else (the street, the shutter, the tyres) goes down; clicks are thin spikes; the time marks sit under the
 * strip. Built from the model only: it is the same data the sound is.
 */
export function waveSvg(rec, { marks = [] } = {}) {
  const W = 240;
  const H = 46;
  const s = strokes(rec, 80);
  const max = 1;
  const bars = s
    .map((k, i) => {
      const x = 2 + i * 3;
      // mirrored: the engine above the centre line, everything else below — so their ratio (the distance) shows
      const a = Math.min(H / 2 - 2, (k.ambience / max) * (H / 2));
      const e = Math.min(H / 2 - 2, (k.engine / max) * (H / 2));
      const amb = `<rect x="${x}" y="${H / 2}" width="2" height="${Math.max(0.6, a).toFixed(1)}" fill="#8b90ad"/>`;
      const eng = k.engine > 0.01 ? `<rect x="${x}" y="${(H / 2 - e).toFixed(1)}" width="2" height="${e.toFixed(1)}" fill="#ffd27a"/>` : '';
      const click = k.click ? `<rect x="${x}" y="1" width="1" height="${H - 2}" fill="#9fd7ff"/>` : '';
      return amb + eng + click;
    })
    .join('');
  const ticks = marks
    .map(([at, label]) => {
      const x = 2 + (at / rec.dur) * 240;
      return `<text x="${x.toFixed(1)}" y="${H + 11}" font-size="9" fill="#cfd2e6" text-anchor="middle">${label}</text>`;
    })
    .join('');
  return `<svg class="s3-wave" viewBox="0 0 ${W + 4} ${H + 14}" width="100%" role="img" aria-label="موجة صوت"><rect width="${W + 4}" height="${H}" rx="4" fill="#181b36"/>${bars}${ticks}</svg>`;
}
