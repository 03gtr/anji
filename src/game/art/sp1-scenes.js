/**
 * Story Pack 01 cinematic illustrations (SVG, viewBox 360×260, drawn in code;
 * no image files, so they work offline and never touch private art).
 *
 *   roads-*   «حيث يلتقي الطريقان» — the silent embrace. The camera stays behind
 *             both of them, looking down the tree tunnel into the evening light:
 *             Ryan's back is to her, as on the first day, and no face is shown.
 *   code-*    «من سطر صغير» — a 3-shot montage: a line of code → a component → a
 *             finished product. Illustrative only: not a screenshot of any site.
 *
 * Shot storyboards: docs/STORY_PACK_01.md.
 */
import { anjiBack, OUTFITS, ANJI_PALETTE } from '../characters/anji.js';
import { ryanSprite } from '../characters/cast.js';

const W = 360;
const H = 260;
const VP = { x: 182, y: 124 }; // where both roads meet the light

/** Place a 100×200 character drawing with its feet at (cx, feet) and height h. */
function place(svg, cx, feet, h) {
  return svg.replace('<svg ', `<svg x="${(cx - h / 4).toFixed(1)}" y="${(feet - h * 0.98).toFixed(1)}" width="${(h / 2).toFixed(1)}" height="${h.toFixed(1)}" `);
}

const leaves = (n, seed) =>
  Array.from({ length: n }, (_, i) => {
    const x = (seed * 37 + i * 53) % W;
    const y = (seed * 11 + i * 29) % 120;
    return `<ellipse class="sp1-leaf" style="--d:${(i % 5) * 0.7}s" cx="${x}" cy="${y}" rx="3.2" ry="1.6" fill="${i % 2 ? '#c9a24a' : '#7aa05a'}" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`;
  }).join('');

/** The tree tunnel: two roads converging into warm light, arching canopy, light shafts. */
function tunnel(id, { glow = 0.75 } = {}) {
  const trunks = [-1, 1]
    .flatMap((side) =>
      [0, 1, 2, 3, 4].map((k) => {
        const t = k / 5;
        const x = VP.x + side * (160 - t * 120);
        const w = 18 - t * 13;
        const top = 40 + t * 60;
        const bottom = H - t * 118;
        return `<rect x="${(x - w / 2).toFixed(1)}" y="${top}" width="${w.toFixed(1)}" height="${(bottom - top).toFixed(1)}" fill="${k < 2 ? '#2a1f22' : '#4a3a3a'}"/>`;
      }),
    )
    .join('');
  const canopy = Array.from({ length: 22 }, (_, i) => {
    const x = (i * 41) % (W + 40) - 20;
    const y = 10 + ((i * 23) % 70) - (Math.abs(x - VP.x) < 70 ? -10 : 0);
    return `<ellipse cx="${x}" cy="${y}" rx="${40 + (i % 3) * 10}" ry="${26 + (i % 4) * 6}" fill="${['#1f3020', '#2b4226', '#35512e'][i % 3]}"/>`;
  }).join('');
  return `<defs>
      <radialGradient id="${id}-sun" cx="${VP.x / W}" cy="${VP.y / H}" r=".6"><stop offset="0" stop-color="#fff1c8"/><stop offset=".35" stop-color="#ffc98a"/><stop offset=".8" stop-color="#8a5a6a"/><stop offset="1" stop-color="#3a2f4a"/></radialGradient>
      <linearGradient id="${id}-road" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3c3944"/><stop offset="1" stop-color="#8a7a7a"/></linearGradient>
      <radialGradient id="${id}-glow" cx="${VP.x / W}" cy="${(VP.y + 8) / H}" r=".45"><stop offset="0" stop-color="#ffe2a8" stop-opacity="${glow}"/><stop offset="1" stop-color="#ffe2a8" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${id}-sun)"/>
    <path d="M0 ${H} L${VP.x - 8} ${VP.y + 4} L${VP.x + 6} ${VP.y + 4} L${W * 0.62} ${H}Z" fill="url(#${id}-road)"/>
    <path d="M${W * 0.66} ${H} L${VP.x + 12} ${VP.y + 6} L${VP.x + 22} ${VP.y + 6} L${W} ${H - 30} L${W} ${H}Z" fill="url(#${id}-road)" opacity=".9"/>
    <path d="M${W * 0.3} ${H} L${VP.x - 1} ${VP.y + 6}" stroke="#efe2c4" stroke-width="2.2" stroke-dasharray="14 12" opacity=".7"/>
    <path d="M${W * 0.83} ${H} L${VP.x + 17} ${VP.y + 8}" stroke="#efe2c4" stroke-width="1.8" stroke-dasharray="12 12" opacity=".55"/>
    <path d="M0 ${H} L0 ${H - 40} L${VP.x - 30} ${VP.y + 10} L${VP.x - 8} ${VP.y + 6}Z" fill="#3e5a36" opacity=".9"/>
    <path d="M${W} ${H - 30} L${W} ${H - 70} L${VP.x + 40} ${VP.y + 8} L${VP.x + 22} ${VP.y + 6}Z" fill="#3e5a36" opacity=".8"/>
    ${trunks}
    ${canopy}
    <g opacity=".16" fill="#ffe6b0">
      <path d="M150 0 L176 0 L210 ${H} L170 ${H}Z"/><path d="M86 0 L100 0 L150 ${H} L128 ${H}Z"/><path d="M250 0 L262 0 L246 ${H} L226 ${H}Z"/>
    </g>
    <rect width="${W}" height="${H}" fill="url(#${id}-glow)"/>`;
}

/** A car seen from behind (simple, readable at any size). */
function carRear(cx, bottom, w, body) {
  const h = w * 0.52;
  const top = bottom - h;
  return `<g>
      <ellipse cx="${cx}" cy="${bottom + 1}" rx="${w * 0.55}" ry="${w * 0.07}" fill="#000" opacity=".25"/>
      <path d="M${cx - w * 0.5} ${bottom - h * 0.12} Q${cx - w * 0.52} ${top + h * 0.45} ${cx - w * 0.36} ${top + h * 0.4} L${cx - w * 0.26} ${top + h * 0.06} Q${cx} ${top - h * 0.04} ${cx + w * 0.26} ${top + h * 0.06} L${cx + w * 0.36} ${top + h * 0.4} Q${cx + w * 0.52} ${top + h * 0.45} ${cx + w * 0.5} ${bottom - h * 0.12} L${cx + w * 0.5} ${bottom} L${cx - w * 0.5} ${bottom}Z" fill="${body}"/>
      <path d="M${cx - w * 0.24} ${top + h * 0.12} L${cx + w * 0.24} ${top + h * 0.12} L${cx + w * 0.31} ${top + h * 0.38} L${cx - w * 0.31} ${top + h * 0.38}Z" fill="#2a3346" opacity=".85"/>
      <rect x="${cx - w * 0.44}" y="${top + h * 0.5}" width="${w * 0.16}" height="${h * 0.1}" rx="1.5" fill="#e2405f"/>
      <rect x="${cx + w * 0.28}" y="${top + h * 0.5}" width="${w * 0.16}" height="${h * 0.1}" rx="1.5" fill="#e2405f"/>
      <rect x="${cx - w * 0.12}" y="${top + h * 0.62}" width="${w * 0.24}" height="${h * 0.12}" rx="1" fill="#e9e4d4"/>
    </g>`;
}

const WHITE_CAR = '#ece6dc';
const BLUE_CAR = '#1f4fd1';

function anji(game) {
  const c = game.state.cosmetics;
  return anjiBack({ outfit: c.anjiOutfit, bow: c.anjiBow });
}

/**
 * The embrace: Anji (nearer the camera) holds him from behind. Her hanging
 * arms are clipped away below the shoulder and drawn again around his waist.
 */
function embrace(game, id) {
  const o = OUTFITS[game.state.cosmetics.anjiOutfit] || OUTFITS.classic;
  const rH = 176; // Ryan, a step further from the camera
  const rX = 186;
  const rFeet = 276;
  const aH = 150; // Anji, nearer: her head rests between his shoulder blades
  const aX = 184;
  const aFeet = 284;
  const s = aH / 200;
  const x0 = aX - aH / 4;
  const y0 = aFeet - aH * 0.98;
  // her arms come out from under the long hair at the clip's corners (which they cover)
  const shY = y0 + 92 * s;
  const side = (rH / 200) * 22; // half the width of his back at her arms' height
  // from under her hair: the upper arm out and down to the elbow, the forearm forward
  // around his side; only the hand's edge shows, resting at his waist
  const arm = (dir) => {
    const sx = aX + dir * 17 * s;
    const ex = rX + dir * (side + 3 * s);
    const hx = rX + dir * (side - 4 * s);
    const ey = shY + 10 * s;
    const hy = shY + 22 * s;
    const pts = `M${sx.toFixed(1)} ${shY.toFixed(1)} Q${ex.toFixed(1)} ${(shY + 2 * s).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} L${hx.toFixed(1)} ${hy.toFixed(1)}`;
    // sleeve, its shadow side, a warm rim from the evening light ahead, then the hand on his side
    return `<path d="${pts}" stroke="${o.jacket}" stroke-width="${(14 * s).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="${pts}" stroke="${o.jacketShade}" stroke-width="${(5 * s).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(${dir * 2} 2)"/>
      <path d="${pts}" stroke="#ffd9a0" stroke-width="${(2 * s).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".22" transform="translate(${-dir * 3} -3)"/>
      <ellipse cx="${(hx - dir * 4 * s).toFixed(1)}" cy="${(hy + 1.5).toFixed(1)}" rx="${(6.4 * s).toFixed(1)}" ry="${(5 * s).toFixed(1)}" fill="${ANJI_PALETTE.skin}"/>
      <path d="M${(hx - dir * 8 * s).toFixed(1)} ${(hy + 2).toFixed(1)} q${(-dir * 3).toFixed(1)} 2 ${(-dir * 5).toFixed(1)} 0" stroke="${ANJI_PALETTE.skinShade}" stroke-width=".9" fill="none"/>`;
  };
  return `<defs><clipPath id="${id}-arms"><rect x="${x0}" y="${y0}" width="${aH / 2}" height="${(92.5 * s).toFixed(1)}"/><rect x="${(x0 + 33 * s).toFixed(1)}" y="${(y0 + 92 * s).toFixed(1)}" width="${(34 * s).toFixed(1)}" height="${(108 * s).toFixed(1)}" rx="${(6 * s).toFixed(1)}"/></clipPath></defs>
    ${place(ryanSprite({}), rX, rFeet, rH)}
    <g clip-path="url(#${id}-arms)">${place(anji(game), aX, aFeet, aH)}</g>
    ${arm(-1)}${arm(1)}`;
}

// the game is right-to-left; code and the address bar must still read left-to-right
// story shots fill the screen (cropped at the sides on a phone: the subject stays in the centre third);
// the code shots are letterboxed instead, so no line of code is ever cut
const svg = (inner, cls = '', fit = 'slice') => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid ${fit}" class="sp1-art ${cls}">${inner}</svg>`;

/* ── «من سطر صغير»: the code montage ─────────────────────── */
const editor = (lines, { dim = 1 } = {}) => `<g opacity="${dim}">
    <rect x="22" y="26" width="316" height="208" rx="10" fill="#151827"/>
    <rect x="22" y="26" width="316" height="22" rx="10" fill="#1e2236"/>
    <circle cx="38" cy="37" r="3.6" fill="#e2405f"/><circle cx="50" cy="37" r="3.6" fill="#e2b544"/><circle cx="62" cy="37" r="3.6" fill="#5cd0b5"/>
    <text x="180" y="41" text-anchor="middle" fill="#8a90b4" font-size="9" font-family="ui-monospace, Menlo, Consolas, monospace" direction="ltr">idea.js</text>
    ${lines
      .map(
        ([txt, color], i) =>
          `<text x="40" y="${74 + i * 22}" fill="#4b5170" font-size="10" font-family="ui-monospace, Menlo, Consolas, monospace" direction="ltr">${i + 1}</text><text x="60" y="${74 + i * 22}" fill="${color}" font-size="12" font-family="ui-monospace, Menlo, Consolas, monospace" direction="ltr" xml:space="preserve">${txt}</text>`,
      )
      .join('')}
  </g>`;

const CODE = [
  ['const idea = "something useful";', '#ffd977'],
  ['function grow(idea) {', '#9fd7ff'],
  ['  return idea + care + time;', '#e6e9ff'],
  ['}', '#9fd7ff'],
];

function card(x, y, w, h, extra = '') {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff7ec"/>${extra}</g>`;
}

export const SP1_SCENES = {
  'roads-wide': (game, id) => svg(`${tunnel(id, { glow: 0.6 })}${carRear(160, 176, 34, WHITE_CAR)}${carRear(206, 174, 30, BLUE_CAR)}<g class="sp1-leaves">${leaves(10, 3)}</g>`, 'sp1-push'),
  'roads-stop': (game, id) =>
    svg(
      `${tunnel(id, { glow: 0.7 })}${carRear(108, 214, 92, WHITE_CAR)}${carRear(262, 210, 86, BLUE_CAR)}
       ${place(ryanSprite({}), 208, 236, 96)}${place(anji(game), 132, 246, 84)}<g class="sp1-leaves">${leaves(8, 5)}</g>`,
      'sp1-push',
    ),
  'roads-near': (game, id) =>
    svg(
      `${tunnel(id, { glow: 0.8 })}${carRear(30, 250, 130, WHITE_CAR)}${carRear(336, 246, 120, BLUE_CAR)}
       ${place(ryanSprite({}), 204, 262, 156)}${place(anji(game), 150, 274, 138)}<g class="sp1-leaves">${leaves(9, 7)}</g>`,
      'sp1-push',
    ),
  'roads-embrace': (game, id) => svg(`${tunnel(id, { glow: 0.95 })}${embrace(game, id)}<g class="sp1-leaves">${leaves(12, 9)}</g><rect class="sp1-bloom" width="${W}" height="${H}" fill="#ffe2a8" opacity="0"/>`, 'sp1-push sp1-warm'),
  'roads-after': (game, id) =>
    svg(`${tunnel(id, { glow: 0.9 })}${carRear(150, 178, 36, WHITE_CAR)}${carRear(214, 176, 32, BLUE_CAR)}${place(ryanSprite({}), 184, 182, 30)}${place(anji(game), 180, 184, 26)}<g class="sp1-leaves">${leaves(10, 11)}</g>`, 'sp1-pull'),

  'code-lines': () => svg(`<rect width="${W}" height="${H}" fill="#0b0e1e"/>${editor(CODE)}<rect class="sp1-caret" x="302" y="63" width="2" height="14" fill="#ffd977"/>`, '', 'meet'),
  'code-shape': () =>
    svg(
      `<rect width="${W}" height="${H}" fill="#0b0e1e"/>${editor(CODE, { dim: 0.25 })}
       <g class="sp1-rise">${card(118, 70, 160, 120, `<rect x="134" y="88" width="80" height="9" rx="4" fill="#2b2340"/><rect x="134" y="106" width="128" height="18" rx="6" fill="#e9e4f4"/><rect x="134" y="132" width="128" height="18" rx="6" fill="#e9e4f4"/><rect x="134" y="160" width="70" height="20" rx="10" fill="#3a72d8"/>`)}</g>`,
      '',
      'meet',
    ),
  'code-product': () =>
    svg(
      `<rect width="${W}" height="${H}" fill="#1b2050"/>
       <g class="sp1-rise">
         <rect x="34" y="28" width="292" height="196" rx="12" fill="#fbf8f2"/>
         <rect x="34" y="28" width="292" height="24" rx="12" fill="#e9e4f4"/>
         <rect x="90" y="34" width="180" height="12" rx="6" fill="#fff"/>
         <text x="180" y="43.5" text-anchor="middle" fill="#5a5f78" font-size="8.5" font-family="ui-monospace, Menlo, Consolas, monospace" direction="ltr">iq-group.app</text>
         <rect x="52" y="66" width="120" height="12" rx="5" fill="#2b2340"/><rect x="52" y="84" width="170" height="7" rx="3" fill="#b8b4c8"/>
         ${card(52, 104, 82, 70, '<circle cx="74" cy="126" r="11" fill="#3a72d8"/><rect x="62" y="146" width="60" height="6" rx="3" fill="#b8b4c8"/><rect x="62" y="158" width="40" height="6" rx="3" fill="#d8d4e4"/>')}
         ${card(140, 104, 82, 70, '<circle cx="162" cy="126" r="11" fill="#e0567f"/><rect x="150" y="146" width="60" height="6" rx="3" fill="#b8b4c8"/><rect x="150" y="158" width="40" height="6" rx="3" fill="#d8d4e4"/>')}
         ${card(228, 104, 82, 70, '<circle cx="250" cy="126" r="11" fill="#5cd0b5"/><rect x="238" y="146" width="60" height="6" rx="3" fill="#b8b4c8"/><rect x="238" y="158" width="40" height="6" rx="3" fill="#d8d4e4"/>')}
         <rect x="52" y="188" width="90" height="22" rx="11" fill="#3a72d8"/>
       </g>`,
      '',
      'meet',
    ),
};
