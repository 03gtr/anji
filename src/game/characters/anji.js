/**
 * Anji — original stylised design based on the owner's reference art:
 * long wavy auburn hair with golden highlights, a burgundy bow at the back of
 * her head, warm brown eyes, red lips, a black jacket over a red/black/white
 * plaid shirt (default outfit). One head drawing is shared by the sprite
 * (facing right, viewBox 100×200, feet on y≈196) and the dialogue portrait,
 * so every pose and expression stays the same character.
 */
let uid = 0;

export const ANJI_PALETTE = {
  skin: '#f7d6c4',
  skinShade: '#eab9a3',
  hair: '#9c4a26',
  hairDark: '#6e2f18',
  hairLight: '#d98b4f',
  eye: '#5a3220',
  lips: '#c42a3c',
  brow: '#7a3a20',
};

export const BOWS = {
  burgundy: ['#8e1c2e', '#651224'],
  sapphire: ['#2f5fd0', '#1f3f95'],
  rose: ['#e0567f', '#b03a60'],
  midnight: ['#24223a', '#141225'],
  gold: ['#d8a73a', '#a77b1e'],
};

/** Outfits: colours + small details. Ids are stable (saved in cosmetics). */
export const OUTFITS = {
  classic: { jacket: '#26232c', jacketShade: '#17151b', shirt: 'plaid', pants: '#2b3550', boots: '#5a2a2c', label: 'الجاكيت الأسود' },
  clinic: { jacket: '#f7f7fb', jacketShade: '#d9dbe8', shirt: 'scrubs', pants: '#3f6fb5', boots: '#e9e9f2', label: 'الصدرية البيضاء', coat: true, stethoscope: true },
  racer: { jacket: '#1f4fd1', jacketShade: '#163a9c', shirt: 'white', pants: '#16161c', boots: '#16161c', label: 'جاكيت السباق', stripes: true },
  evening: { jacket: '#1b2a6b', jacketShade: '#121d4d', shirt: 'dress', pants: '#1b2a6b', boots: '#c9a24a', label: 'فستان السهرة', dress: true },
  cozy: { jacket: '#efe2cf', jacketShade: '#d8c6ad', shirt: 'knit', pants: '#3a4f78', boots: '#7b4a35', label: 'البلوزة الدافية' },
  detective: { jacket: '#8a6a45', jacketShade: '#6c5134', shirt: 'plaid', pants: '#2e2a33', boots: '#3c2a22', label: 'معطف المحققة', coat: true },
};

function defs(id, outfit) {
  return `<defs>
    <linearGradient id="hair${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ANJI_PALETTE.hair}"/>
      <stop offset=".55" stop-color="#b45a2c"/>
      <stop offset="1" stop-color="${ANJI_PALETTE.hairLight}"/>
    </linearGradient>
    <pattern id="plaid${id}" width="7" height="7" patternUnits="userSpaceOnUse">
      <rect width="7" height="7" fill="#1d1a22"/>
      <rect y="2.5" width="7" height="2" fill="#c3313d"/>
      <rect x="2.5" width="2" height="7" fill="#ece6e8" opacity=".75"/>
      <rect x="2.5" y="2.5" width="2" height="2" fill="#f2d6d8"/>
    </pattern>
    <pattern id="knit${id}" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="${outfit.jacket}"/>
      <path d="M0 3 L1.5 0 L3 3 L4.5 0 L6 3" stroke="${outfit.jacketShade}" stroke-width=".8" fill="none"/>
    </pattern>
  </defs>`;
}

const shirtFill = (id, o) =>
  o.shirt === 'plaid' ? `url(#plaid${id})` : o.shirt === 'scrubs' ? '#3f6fb5' : o.shirt === 'knit' ? `url(#knit${id})` : o.shirt === 'dress' ? o.jacket : '#f4f4f8';

/* ── Face parts ─────────────────────────────────────────────── */

function eye(cx, cy, rx, style, P) {
  switch (style) {
    case 'closed': // happy closed arcs ^
      return `<path d="M${cx - rx - 1} ${cy + 1} Q${cx} ${cy - 5} ${cx + rx + 1} ${cy + 1}" stroke="#2b1710" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'soft':
      return `<path d="M${cx - rx - 1} ${cy - 1} Q${cx} ${cy + 3} ${cx + rx + 1} ${cy - 1}" stroke="#2b1710" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M${cx + rx} ${cy - 1} l2 -1.6" stroke="#2b1710" stroke-width="1.2" stroke-linecap="round"/>`;
    case 'half':
      return `<ellipse cx="${cx}" cy="${cy + 1}" rx="${rx}" ry="${rx * 0.95}" fill="${P.eye}"/>
        <circle cx="${cx + 0.8}" cy="${cy + 1}" r="${rx * 0.45}" fill="#24130c"/>
        <circle cx="${cx + 1.6}" cy="${cy - 0.3}" r="1.1" fill="#fff"/>
        <path d="M${cx - rx - 1.2} ${cy - 1} H${cx + rx + 1.2}" stroke="#2b1710" stroke-width="2.4" stroke-linecap="round"/>`;
    default: {
      const ry = style === 'wide' ? rx * 1.45 : rx * 1.22;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff"/>
        <ellipse cx="${cx + 0.5}" cy="${cy + 0.4}" rx="${rx * 0.86}" ry="${ry * 0.9}" fill="${P.eye}"/>
        <circle cx="${cx + 0.7}" cy="${cy + 0.8}" r="${style === 'wide' ? rx * 0.32 : rx * 0.48}" fill="#24130c"/>
        <circle cx="${cx + 1.8}" cy="${cy - ry * 0.35}" r="${rx * 0.34}" fill="#fff"/>
        <circle cx="${cx - 1.2}" cy="${cy + ry * 0.35}" r="${rx * 0.16}" fill="#fff" opacity=".8"/>
        <path d="M${cx - rx - 1.2} ${cy - ry * 0.55} Q${cx} ${cy - ry * 1.25} ${cx + rx + 1.4} ${cy - ry * 0.6}" stroke="#2b1710" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M${cx + rx + 1} ${cy - ry * 0.6} l2.4 -1.8" stroke="#2b1710" stroke-width="1.3" stroke-linecap="round"/>`;
    }
  }
}

const EXPRESSIONS = {
  // eyes, brows (lift of [far, near] brow), mouth, blush strength
  neutral: { eyes: 'open', brows: [0, 0], mouth: 'smile', blush: 0.45 },
  smile: { eyes: 'open', brows: [0, 0], mouth: 'grin', blush: 0.55 },
  laugh: { eyes: 'closed', brows: [-1, -1], mouth: 'laugh', blush: 0.7 },
  surprised: { eyes: 'wide', brows: [-4, -4], mouth: 'o', blush: 0.35 },
  thinking: { eyes: 'open', brows: [-2, 1], mouth: 'flat', blush: 0.35, look: -1 },
  skeptical: { eyes: 'half', brows: [1, -4], mouth: 'smirk', blush: 0.3 },
  soft: { eyes: 'soft', brows: [0, 0], mouth: 'smile', blush: 0.9 },
  worried: { eyes: 'open', brows: [-3, -3], mouth: 'worried', blush: 0.3, worried: true },
  determined: { eyes: 'open', brows: [2, 2], mouth: 'firm', blush: 0.35, angry: true },
  smirk: { eyes: 'open', brows: [0, -2], mouth: 'smirk', blush: 0.5 },
};
export const ANJI_EXPRESSIONS = Object.keys(EXPRESSIONS);

function mouth(kind, P) {
  switch (kind) {
    case 'grin':
      return `<path d="M54 72 Q60.5 79 67 72 Q61 76.5 54 72Z" fill="${P.lips}"/><path d="M55.5 72.6 Q60.5 76 65.5 72.6" stroke="#fff" stroke-width="1.4" fill="none" opacity=".9"/>`;
    case 'laugh':
      return `<path d="M53.5 71 Q60.5 71.5 67.5 70.5 Q66 81 60 81 Q54.5 81 53.5 71Z" fill="#7a1622"/><path d="M54.5 71.3 Q60.5 72.6 66.6 71 L66 73.4 Q60.5 74.5 55 73.6Z" fill="#fff"/><ellipse cx="60.5" cy="78.6" rx="3.6" ry="1.8" fill="#e46a7a"/>`;
    case 'o':
      return `<ellipse cx="60.5" cy="75" rx="3" ry="3.8" fill="#7a1622"/><ellipse cx="60.5" cy="75" rx="3" ry="3.8" fill="none" stroke="${P.lips}" stroke-width="1.6"/>`;
    case 'flat':
      return `<path d="M56 74 Q60.5 75.2 65 73.8" stroke="${P.lips}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case 'smirk':
      return `<path d="M55.5 74.2 Q61 75.4 66.5 71.4" stroke="${P.lips}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'worried':
      return `<path d="M55.5 75 Q58 72.6 60.5 74.6 Q63 76.4 65.6 73.8" stroke="${P.lips}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`;
    case 'firm':
      return `<path d="M56 74 H65" stroke="${P.lips}" stroke-width="2.6" stroke-linecap="round"/>`;
    default:
      return `<path d="M55 72.4 Q60.5 77.5 66 72.4 Q60.5 75 55 72.4Z" fill="${P.lips}"/>`;
  }
}

/** The head (hair, face, bow) in sprite coordinates. */
export function anjiHead({ id, expr = 'neutral', bow = 'burgundy', sway = 0, blink = false, layer = 'all' }) {
  const P = ANJI_PALETTE;
  const E = EXPRESSIONS[expr] || EXPRESSIONS.neutral;
  const [bowMain, bowDark] = BOWS[bow] || BOWS.burgundy;
  const eyes = blink && E.eyes !== 'closed' ? 'closed-flat' : E.eyes;
  const look = E.look || 0;
  const eyePair =
    eyes === 'closed-flat'
      ? `<path d="M46.5 60 Q51 62 55.5 60" stroke="#2b1710" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M64.5 60 Q68.5 62 72.5 60" stroke="#2b1710" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : `${eye(50.8 + look, 59.8, 4.7, eyes, P)}${eye(68.8 + look, 59.8, 4.1, eyes, P)}`;
  const [bf, bn] = E.brows;
  const browTilt = E.angry ? 2.2 : E.worried ? -2.2 : 0;
  const brows = `<path d="M46.2 ${49.6 + bf + browTilt} Q50.8 ${47 + bf} 55.4 ${48.8 + bf - browTilt}" stroke="${P.brow}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M64.8 ${48.8 + bn - browTilt} Q68.8 ${46.6 + bn} 72.6 ${49 + bn + browTilt}" stroke="${P.brow}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;

  const back = `<g transform="rotate(${sway * 0.45} 48 40)">
      <path d="M54 22 C30 16 16 38 20 60 C22 74 14 84 18 98 C21 110 12 118 18 130 C22 140 30 138 34 146 C40 138 36 128 42 122 C44 114 40 104 46 98 C50 92 48 88 52 84 Z" fill="url(#hair${id})"/>
      <path d="M22 66 C20 80 26 90 21 104 C18 116 24 124 22 132 M30 84 C28 98 34 108 30 122" stroke="${P.hairDark}" stroke-width="1.3" fill="none" opacity=".45"/>
      <path d="M26 56 C22 70 28 82 24 96 C22 106 26 114 25 122" stroke="${P.hairLight}" stroke-width="1.7" fill="none" opacity=".7"/>
    </g>`;
  const crown = `<path d="M24 50 C22 26 42 14 58 16 C76 18 86 32 84 50 C82 58 78 62 76 64 L36 66 C30 62 25 58 24 50Z" fill="url(#hair${id})"/>`;
  const face = `<path d="M37 56 C36 38 76 34 78.5 54 C79.5 70 71 83 60.5 84 C48 84.5 38 73 37 56Z" fill="${P.skin}"/>
    <path d="M38 62 C40 74 48 83 60.5 84 C52 81 44 74 40 62Z" fill="${P.skinShade}" opacity=".55"/>
    <ellipse cx="48" cy="68.5" rx="4.6" ry="2.6" fill="#f19aa0" opacity="${E.blush}"/>
    <ellipse cx="72" cy="68.5" rx="3.6" ry="2.3" fill="#f19aa0" opacity="${E.blush}"/>
    ${eyePair}${brows}
    <path d="M63.5 63.5 Q65.6 66.6 63.2 67.6" stroke="#d49a86" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    ${mouth(E.mouth, P)}`;
  const fringe = `<path d="M33 52 C34 30 58 20 76 28 C83 32 86 42 84 52 C80 44 74 40 70 42 C68 36 62 33 57 36 C52 41 46 44 40 54 C38 50 35 50 33 52Z" fill="url(#hair${id})"/>
    <path d="M45 33 C55 28 66 28 74 33" stroke="${P.hairLight}" stroke-width="1.8" fill="none" opacity=".75" stroke-linecap="round"/>
    <path d="M40 40 C46 36 52 35 57 36" stroke="${P.hairLight}" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/>
    <path d="M79 42 C86 56 80 74 86 92 C88 100 84 108 88 116 C80 112 76 102 77 92 C78 80 74 66 76 54Z" fill="url(#hair${id})"/>
    <path d="M81 58 C83 70 80 82 84 94" stroke="${P.hairLight}" stroke-width="1.3" fill="none" opacity=".6"/>`;
  const bowSvg = `<g transform="translate(29 34) rotate(-14)">
      <path d="M0 0 C-10 -12 -20 -4 -14 5 C-10 10 -4 6 0 2Z" fill="${bowMain}"/>
      <path d="M0 0 C8 -13 19 -6 14 4 C10 10 4 6 0 2Z" fill="${bowMain}"/>
      <path d="M-11 -2 C-8 -4 -5 -2 -2 0 M11 -3 C8 -4 5 -2 2 0" stroke="${bowDark}" stroke-width="1.2" fill="none"/>
      <path d="M-1 3 L-7 18 L-3 16 L-1 21 L2 4Z M2 3 L7 17 L3 15.5 L1 19Z" fill="${bowDark}"/>
      <ellipse cx="0" cy="1.5" rx="3.6" ry="3.2" fill="${bowDark}"/>
    </g>`;
  if (layer === 'back') return back;
  if (layer === 'front') return `${crown}${face}${fringe}${bowSvg}`;
  return `${back}${crown}${face}${fringe}${bowSvg}`;
}

/* ── Body parts ─────────────────────────────────────────────── */

const arm = (id, o, x, y, angle, front, handExtra = '') => `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M-6 -2 Q0 -6 6 -2 L5.4 32 L-5.4 32Z" fill="${front ? o.jacket : o.jacketShade}"/>
    ${o.stripes ? '<path d="M-1 -3 V31" stroke="#fff" stroke-width="2"/>' : ''}
    <rect x="-5.6" y="30" width="11.2" height="6.5" rx="2" fill="${o.coat ? o.jacketShade : shirtFill(id, o)}"/>
    <circle cx="0" cy="40.5" r="5" fill="${ANJI_PALETTE.skin}"/>
    ${handExtra}
  </g>`;

const leg = (o, x, y, angle, front, bend = 0) => {
  if (o.dress) {
    return `<g transform="translate(${x} ${y}) rotate(${angle})">
      <rect x="-4" y="0" width="8" height="40" rx="3.5" fill="${front ? '#3a2f46' : '#2a2233'}"/>
      <path d="M-5 38 H5 L8 46 H-5Z" fill="${o.boots}"/>
    </g>`;
  }
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M-6.5 -2 L6.5 -2 L5.6 20 L5.2 ${40 - bend} L-5.2 ${40 - bend} L-5.6 20Z" fill="${front ? o.pants : shade(o.pants)}"/>
    <path d="M-5.8 ${36 - bend} L5.8 ${36 - bend} L9.6 ${47 - bend} Q9 ${50 - bend} 6 ${50 - bend} L-6 ${50 - bend}Z" fill="${front ? o.boots : shade(o.boots)}"/>
  </g>`;
};

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * 0.78));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}

function torso(id, o) {
  const shirt = shirtFill(id, o);
  if (o.dress) {
    return `<path d="M38 88 C44 84 58 84 64 88 L66 112 C72 128 76 146 78 156 C62 162 40 162 26 156 C30 144 34 128 36 112Z" fill="${o.jacket}"/>
      <path d="M36 112 C46 116 56 116 66 112" stroke="#c9a24a" stroke-width="2" fill="none"/>
      <path d="M44 88 Q51 98 58 88" fill="${ANJI_PALETTE.skin}"/>
      <path d="M40 130 C48 140 60 142 70 136" stroke="#2a3d8c" stroke-width="1.5" fill="none" opacity=".7"/>`;
  }
  const long = o.coat ? 'L74 168 C58 172 40 172 26 166' : 'L70 140 C58 146 42 146 32 140';
  return `<path d="M38 88 C44 84 58 84 64 88 ${long} Z" fill="${o.jacket}"/>
    <path d="M44 88 L51.5 104 L59 88Z" fill="${shirt}"/>
    <path d="M44 88 L51.5 106 L48 112 M59 88 L51.5 106" stroke="${o.jacketShade}" stroke-width="1.8" fill="none"/>
    ${o.coat ? '' : `<path d="M33 136 L69 136 L70 143 C58 147 42 147 32 143Z" fill="${shirt}"/>`}
    ${o.stripes ? '<path d="M40 92 L36 138 M62 92 L66 138" stroke="#fff" stroke-width="2.4"/>' : ''}
    ${o.stethoscope ? '<path d="M45 90 C40 108 46 118 52 118 C58 118 62 108 58 90" stroke="#4a5368" stroke-width="2" fill="none"/><circle cx="52" cy="120" r="3.6" fill="#9aa3b8" stroke="#4a5368" stroke-width="1.4"/>' : ''}
    ${o.coat ? `<path d="M51.5 106 V166" stroke="${o.jacketShade}" stroke-width="1.6"/><circle cx="55" cy="122" r="1.4" fill="${o.jacketShade}"/><circle cx="55" cy="138" r="1.4" fill="${o.jacketShade}"/>` : ''}`;
}

/**
 * Poses: idle, walk, jump, fall, celebrate, surprised, think, lie (on her back)
 * `t` (0..1) animates walk cycles; `blink` closes the eyes for idle blinking.
 */
export function anjiPose(pose, t = 0) {
  const s = Math.sin(t * Math.PI * 2);
  switch (pose) {
    case 'walk':
      return { legF: 24 * s, legB: -24 * s, armF: -20 * s, armB: 18 * s, bob: -Math.abs(s) * 2.2, sway: 4 * s };
    case 'run':
      return { legF: 36 * s, legB: -36 * s, armF: -38 * s, armB: 34 * s, bob: -Math.abs(s) * 3.5, sway: 8 + 5 * s, lean: 6 };
    case 'jump':
      return { legF: -26, legB: 18, armF: -150, armB: -40, bob: 0, sway: -8, bendF: 8, bendB: 4 };
    case 'fall':
      return { legF: 12, legB: -10, armF: -110, armB: -60, bob: 0, sway: 10 };
    case 'celebrate':
      return { legF: 6, legB: -6, armF: -160, armB: -150, bob: -2 * Math.abs(s), sway: 3 * s };
    case 'surprised':
      return { legF: 4, legB: -4, armF: -40, armB: -24, bob: 0, sway: -3 };
    case 'think':
      return { legF: 2, legB: -2, armF: -142, armB: 8, bob: 0, sway: 0, cheek: true };
    case 'crouch':
      return { legF: -30, legB: 30, armF: -30, armB: 10, bob: 10, sway: 4, bendF: 6, bendB: 6 };
    default:
      return { legF: 3, legB: -3, armF: 4 + 2 * s, armB: -4, bob: s * 0.8, sway: 1.5 * s };
  }
}

/**
 * Full-body sprite facing right.
 * @param {{ pose?: string, t?: number, expr?: string, outfit?: string, bow?: string, blink?: boolean, size?: number }} o
 */
export function anjiSprite({ pose = 'idle', t = 0, expr, outfit = 'classic', bow = 'burgundy', blink = false, size } = {}) {
  const id = `a${++uid}`;
  const o = OUTFITS[outfit] || OUTFITS.classic;
  const p = anjiPose(pose, t);
  const face = expr || (pose === 'celebrate' ? 'laugh' : pose === 'surprised' ? 'surprised' : pose === 'think' ? 'thinking' : 'neutral');
  const dims = size ? `width="${size / 2}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" ${dims}>
    ${defs(id, o)}
    <g transform="translate(0 ${p.bob}) rotate(${p.lean || 0} 50 196)">
      ${anjiHead({ id, expr: face, bow, sway: p.sway, blink, layer: 'back' })}
      ${leg(o, 45, 140, p.legB, false, p.bendB || 0)}
      ${arm(id, o, 41, 92, p.armB, false)}
      ${leg(o, 56, 140, p.legF, true, p.bendF || 0)}
      ${torso(id, o)}
      <rect x="51" y="80" width="10" height="9" fill="${ANJI_PALETTE.skinShade}"/>
      ${anjiHead({ id, expr: face, bow, sway: p.sway, blink, layer: 'front' })}
      ${p.cheek ? arm(id, o, 61, 92, -152, true) : arm(id, o, 61, 92, p.armF, true)}
    </g>
  </svg>`;
}

/** Head-and-shoulders dialogue portrait (viewBox 200×200, facing right). */
export function anjiPortrait({ expr = 'neutral', outfit = 'classic', bow = 'burgundy' } = {}) {
  const id = `ap${++uid}`;
  const o = OUTFITS[outfit] || OUTFITS.classic;
  // her hand resting on her cheek, as in the reference art
  const hand =
    expr === 'thinking'
      ? `<path d="M56 200 C60 176 66 160 72 150 C78 142 90 146 90 156 C88 170 84 186 84 200Z" fill="${o.jacket}"/>
         <path d="M64 158 h22 v8 h-22Z" fill="${shirtFill(id, o)}"/>
         <ellipse cx="80" cy="138" rx="11" ry="14" fill="${ANJI_PALETTE.skin}"/>
         <path d="M74 128 q6 -4 12 2" stroke="${ANJI_PALETTE.skinShade}" stroke-width="2" fill="none"/>`
      : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    ${defs(id, o)}
    <g transform="translate(-14 -20) scale(2.12)">
      ${anjiHead({ id, expr, bow, layer: 'back' })}
      <path d="M26 104 C30 90 42 86 51 86 L62 86 C72 86 84 92 88 104 L92 120 L22 120Z" fill="${o.jacket}"/>
      <path d="M45 87 L52.5 104 L60 87Z" fill="${shirtFill(id, o)}"/>
      ${o.stethoscope ? '<path d="M44 90 C40 104 46 112 52 112 C58 112 62 104 58 90" stroke="#4a5368" stroke-width="1.8" fill="none"/>' : ''}
      <rect x="51" y="80" width="10" height="9" fill="${ANJI_PALETTE.skinShade}"/>
      ${anjiHead({ id, expr, bow, layer: 'front' })}
    </g>
    ${hand}
  </svg>`;
}
