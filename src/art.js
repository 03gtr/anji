/**
 * Original, hand-written SVG illustrations. No external images.
 * Every function returns an SVG/markup string.
 */

const INK = '#2b2340';
const LINE = '#e7dcf0';

let uid = 0;
const nextId = (p) => `${p}${++uid}`;

/** A single rose bloom (centred on 0,0, radius ≈ 10). */
export function bloom(x, y, s = 1, tone = 'pink') {
  const c = tone === 'deep'
    ? ['#e8588a', '#c93e70', '#f07aa2', '#a8325c']
    : ['#f48fb1', '#e2668f', '#f7a8c4', '#c94f7a'];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle r="10" fill="${c[0]}"/>
    <path d="M-10 1C-9 10 9 10 10 1C6 6-6 6-10 1Z" fill="${c[1]}"/>
    <path d="M-7-2C-6-10 6-10 7-2C3-6-3-6-7-2Z" fill="${c[2]}"/>
    <path d="M-3.5 0C-3.5-4.5 3.5-4.5 3.5 0C3.5 3.5-1.2 3.5-1.2 0" fill="none" stroke="${c[3]}" stroke-width="1.5" stroke-linecap="round"/>
  </g>`;
}

/** Long-stem rose as a standalone svg. */
export function rose({ cls = '', label = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="rose-svg ${cls}" viewBox="-24 -16 48 92" ${a11y}>
    <path d="M0 6C2 26-3 48 1 74" stroke="#5f8f5a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M1 38C9 28 20 29 22 33C15 40 7 41 1 38Z" fill="#7fb07a"/>
    <path d="M0 52C-8 44-18 46-20 50C-13 56-6 56 0 52Z" fill="#6fa56b"/>
    <path d="M-6 8C-4 13 4 13 6 8L4 14C2 16-2 16-4 14Z" fill="#6fa56b"/>
    ${bloom(0, 0, 1.25)}
  </svg>`;
}

/** The white rabbit. */
export function rabbit({ cls = '', withRose = false, sleeping = false, label = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  const eyes = sleeping
    ? `<path d="M45 64q5 4 10 0M65 64q5 4 10 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : `<g class="rb-eyes">
        <ellipse cx="50" cy="62" rx="3.8" ry="4.6" fill="${INK}"/>
        <ellipse cx="70" cy="62" rx="3.8" ry="4.6" fill="${INK}"/>
        <circle cx="51.4" cy="60.4" r="1.4" fill="#fff"/>
        <circle cx="71.4" cy="60.4" r="1.4" fill="#fff"/>
      </g>`;
  const heldRose = withRose
    ? `<g class="rb-rose">
        <path d="M58 118C64 108 72 98 82 86" stroke="#5f8f5a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M70 101c6-6 13-5 15-2-5 5-10 5-15 2z" fill="#7fb07a"/>
        ${bloom(84, 82, 1.05)}
      </g>`
    : '';
  const zzz = sleeping
    ? `<g class="rb-zzz" fill="#cfc4ff" font-family="sans-serif" font-weight="700">
        <text x="86" y="40" font-size="17">z</text><text x="98" y="26" font-size="13">z</text><text x="107" y="14" font-size="10">z</text>
      </g>`
    : '';
  return `<svg class="rabbit ${cls}" viewBox="0 0 120 140" ${a11y}>
    <ellipse class="rb-shadow" cx="60" cy="134" rx="31" ry="5" fill="#2a2150" opacity=".16"/>
    <g class="rb-all">
      <circle cx="91" cy="113" r="9" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>
      <ellipse cx="60" cy="107" rx="30" ry="26" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>
      <ellipse cx="60" cy="113" rx="17" ry="14" fill="#fbf7ff"/>
      <g class="rb-ear rb-ear-l">
        <ellipse cx="45" cy="30" rx="9.5" ry="25" transform="rotate(-12 45 52)" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>
        <ellipse cx="45" cy="32" rx="4.6" ry="18" transform="rotate(-12 45 52)" fill="#f8c3d3"/>
      </g>
      <g class="rb-ear rb-ear-r">
        <ellipse cx="75" cy="30" rx="9.5" ry="25" transform="rotate(12 75 52)" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>
        <ellipse cx="75" cy="32" rx="4.6" ry="18" transform="rotate(12 75 52)" fill="#f8c3d3"/>
      </g>
      <circle cx="60" cy="64" r="27" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>
      ${eyes}
      <ellipse cx="43" cy="72" rx="5.5" ry="3.2" fill="#f9b6c8" opacity=".75"/>
      <ellipse cx="77" cy="72" rx="5.5" ry="3.2" fill="#f9b6c8" opacity=".75"/>
      <path d="M57 68.5h6l-3 3.4z" fill="#ef86a6" stroke="#ef86a6" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M60 72q-2.5 4-6 2.4M60 72q2.5 4 6 2.4" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${heldRose}
      <ellipse cx="55" cy="104" rx="6.5" ry="5.5" fill="#fff" stroke="${LINE}" stroke-width="1.3"/>
      <ellipse cx="67" cy="102" rx="6.5" ry="5.5" fill="#fff" stroke="${LINE}" stroke-width="1.3"/>
      <ellipse cx="48" cy="129" rx="9.5" ry="5.2" fill="#fff" stroke="${LINE}" stroke-width="1.3"/>
      <ellipse cx="72" cy="129" rx="9.5" ry="5.2" fill="#fff" stroke="${LINE}" stroke-width="1.3"/>
    </g>
    ${zzz}
  </svg>`;
}

/** Just the ears + eyes, peeking over a bush. */
export function peekingRabbit() {
  return `<svg viewBox="0 0 60 50" aria-hidden="true">
    <ellipse cx="22" cy="18" rx="5.5" ry="15" transform="rotate(-10 22 30)" fill="#fff" stroke="${LINE}"/>
    <ellipse cx="22" cy="19" rx="2.6" ry="10" transform="rotate(-10 22 30)" fill="#f8c3d3"/>
    <ellipse cx="38" cy="18" rx="5.5" ry="15" transform="rotate(10 38 30)" fill="#fff" stroke="${LINE}"/>
    <ellipse cx="38" cy="19" rx="2.6" ry="10" transform="rotate(10 38 30)" fill="#f8c3d3"/>
    <ellipse cx="30" cy="40" rx="15" ry="11" fill="#fff" stroke="${LINE}"/>
    <circle cx="25" cy="39" r="2.2" fill="${INK}"/><circle cx="35" cy="39" r="2.2" fill="${INK}"/>
    <path d="M10 50c0-9 9-13 14-9 3-6 13-6 16 0 5-4 14 0 14 9z" fill="#5f8a63"/>
    ${bloom(16, 45, 0.45)}${bloom(44, 44, 0.45, 'deep')}
  </svg>`;
}

export function crescent(cx, cy, r, fill = '#fff4d6') {
  // outer half-circle on the left, inner shallower arc back up: a lit crescent
  const inner = r * 1.25;
  return `<path transform="translate(${cx} ${cy}) rotate(-25)" d="M0 ${-r}A${r} ${r} 0 0 0 0 ${r}A${inner} ${inner} 0 0 1 0 ${-r}Z" fill="${fill}"/>`;
}

export function starPath(cx, cy, R, r = R * 0.45) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r : R;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
}

export function star({ cls = '', fill = '#ffe28a' } = {}) {
  return `<svg class="star-svg ${cls}" viewBox="0 0 60 60" aria-hidden="true">
    <circle cx="30" cy="30" r="26" fill="${fill}" opacity=".18"/>
    <path d="${starPath(30, 31, 22)}" fill="${fill}" stroke="#f5c451" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="24" cy="29" r="1.8" fill="${INK}"/><circle cx="36" cy="29" r="1.8" fill="${INK}"/>
    <path d="M26 35q4 3 8 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export function clinic({ cls = '' } = {}) {
  return `<svg class="${cls}" viewBox="0 0 84 72" aria-hidden="true">
    <ellipse cx="42" cy="68" rx="34" ry="4" fill="#2a2150" opacity=".15"/>
    <rect x="12" y="27" width="60" height="40" rx="4" fill="#fff8ee" stroke="#e8d6c3" stroke-width="1.5"/>
    <path d="M5 30L42 8l37 22z" fill="#f2a7bf" stroke="#e58fab" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="42" cy="22" r="7.5" fill="#fff"/>
    <path d="M40.3 16.8h3.4v3.5h3.5v3.4h-3.5v3.5h-3.4v-3.5h-3.5v-3.4h3.5z" fill="#e86a92"/>
    <rect x="35" y="45" width="14" height="22" rx="3" fill="#b9a3d6"/>
    <circle cx="46" cy="57" r="1.2" fill="#fff"/>
    <rect x="17" y="37" width="12" height="11" rx="2.5" fill="#d6e7f7"/>
    <rect x="55" y="37" width="12" height="11" rx="2.5" fill="#d6e7f7"/>
    ${bloom(18, 66, 0.55)}${bloom(66, 66, 0.55, 'deep')}
  </svg>`;
}

export function car({ cls = '', withRabbit = true } = {}) {
  const ears = withRabbit
    ? `<ellipse cx="46" cy="8" rx="3.2" ry="9" transform="rotate(-10 46 16)" fill="#fff" stroke="${LINE}"/>
       <ellipse cx="54" cy="8" rx="3.2" ry="9" transform="rotate(10 54 16)" fill="#fff" stroke="${LINE}"/>
       <circle cx="50" cy="20" r="6.5" fill="#fff" stroke="${LINE}"/>
       <circle cx="48" cy="19.5" r="1.1" fill="${INK}"/><circle cx="52.4" cy="19.5" r="1.1" fill="${INK}"/>`
    : '';
  return `<svg class="${cls}" viewBox="0 0 96 64" aria-hidden="true">
    <ellipse cx="48" cy="58" rx="38" ry="4" fill="#2a2150" opacity=".15"/>
    ${ears}
    <path d="M10 46Q11 33 25 31L34 21Q38 17 45 17H61Q67 17 71 23L78 31Q88 33 88 46Z" fill="#f48fb1" stroke="#e2729a" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M37 29L43 22H60L66 29Z" fill="#eaf2fb" opacity=".85"/>
    <rect x="44" y="34" width="10" height="3" rx="1.5" fill="#e2729a"/>
    <circle cx="82" cy="40" r="2.6" fill="#fff4b8"/>
    <circle cx="28" cy="47" r="8" fill="${INK}"/><circle cx="28" cy="47" r="3.2" fill="#e8e2f2"/>
    <circle cx="70" cy="47" r="8" fill="${INK}"/><circle cx="70" cy="47" r="3.2" fill="#e8e2f2"/>
    ${bloom(20, 30, 0.55)}${bloom(26, 25, 0.5, 'deep')}
  </svg>`;
}

export function sweetsBox({ cls = '' } = {}) {
  return `<svg class="${cls}" viewBox="-18 -18 36 32" aria-hidden="true">
    <rect x="-13" y="-6" width="26" height="17" rx="2.5" fill="#f6c1d1" stroke="#ec9db7"/>
    <rect x="-2" y="-6" width="4" height="17" fill="#b68fd8"/>
    <rect x="-14.5" y="-10" width="29" height="5.5" rx="1.8" fill="#f19bb7"/>
    <rect x="-2" y="-10" width="4" height="5.5" fill="#a07ccc"/>
    <ellipse cx="-5" cy="-12.5" rx="5" ry="3" fill="#b68fd8"/><ellipse cx="5" cy="-12.5" rx="5" ry="3" fill="#b68fd8"/>
    <circle cy="-12" r="2" fill="#9a72c9"/>
  </svg>`;
}

export function bouquet({ cls = '' } = {}) {
  return `<svg class="${cls}" viewBox="0 0 64 84" aria-hidden="true">
    <g fill="#7fb07a">
      <ellipse cx="10" cy="30" rx="9" ry="4" transform="rotate(-35 10 30)"/>
      <ellipse cx="54" cy="30" rx="9" ry="4" transform="rotate(35 54 30)"/>
      <ellipse cx="20" cy="10" rx="8" ry="3.5" transform="rotate(-60 20 10)"/>
      <ellipse cx="44" cy="10" rx="8" ry="3.5" transform="rotate(60 44 10)"/>
    </g>
    ${bloom(18, 28, 0.95, 'deep')}${bloom(46, 28, 0.95)}${bloom(32, 30, 1)}${bloom(24, 15, 0.9)}${bloom(40, 15, 0.9, 'deep')}
    <path d="M8 36L32 80L56 36Q44 44 32 39Q20 44 8 36Z" fill="#efe4fb" stroke="#cdbbe9" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M8 36L32 80L22 42Z" fill="#f9d4e1"/>
    <path d="M56 36L32 80L42 42Z" fill="#f9d4e1"/>
    <path d="M32 60l-8-5v10zM32 60l8-5v10z" fill="#f06f9a"/>
    <circle cx="32" cy="60" r="2.6" fill="#c9437a"/>
  </svg>`;
}

/** Rose arch. `night` adds moon + stars around it. */
export function arch({ cls = '', night = false, small = false } = {}) {
  const roses = [
    [18, 70], [16, 54], [20, 40], [28, 28], [40, 20], [52, 18], [64, 20], [76, 28], [84, 40], [88, 54], [86, 70],
  ].map(([x, y], i) => bloom(x, y, small ? 0.62 : 0.55, i % 3 === 1 ? 'deep' : 'pink')).join('');
  const leaves = [
    [22, 62], [18, 47], [24, 34], [34, 23], [58, 18], [70, 23], [80, 34], [86, 47], [82, 62],
  ].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#7fb07a" transform="rotate(${x < 52 ? -40 : 40} ${x} ${y})"/>`).join('');
  const sky = night
    ? `${crescent(86, 10, 8)}<circle cx="16" cy="8" r="1.4" fill="#fff6d0"/><circle cx="30" cy="4" r="1" fill="#fff6d0"/><circle cx="70" cy="6" r="1.1" fill="#fff6d0"/>`
    : '';
  return `<svg class="${cls}" viewBox="0 -4 104 96" aria-hidden="true">
    ${sky}
    <ellipse cx="52" cy="90" rx="44" ry="4" fill="#2a2150" opacity=".15"/>
    <path d="M18 90V52A34 34 0 0 1 86 52V90" fill="none" stroke="#6b8f68" stroke-width="5" stroke-linecap="round"/>
    ${leaves}${roses}
  </svg>`;
}

export function gate({ cls = '' } = {}) {
  return `<svg class="${cls}" viewBox="0 0 90 84" aria-hidden="true">
    <ellipse cx="45" cy="80" rx="38" ry="4" fill="#2a2150" opacity=".15"/>
    <path d="M14 80V40A31 31 0 0 1 76 40V80" fill="none" stroke="#6b8f68" stroke-width="5"/>
    <g fill="#f3e2c7" stroke="#d9bf98" stroke-width="1.2">
      <rect x="20" y="46" width="7" height="34" rx="2"/><rect x="30" y="42" width="7" height="38" rx="2"/>
      <rect x="53" y="42" width="7" height="38" rx="2"/><rect x="63" y="46" width="7" height="34" rx="2"/>
      <rect x="18" y="56" width="22" height="5" rx="2"/><rect x="50" y="56" width="22" height="5" rx="2"/>
    </g>
    <path d="M41 80V44M49 80V44" stroke="#c9a978" stroke-width="2" stroke-dasharray="2 3"/>
    ${bloom(16, 44, 0.6)}${bloom(26, 22, 0.6, 'deep')}${bloom(45, 10, 0.7)}${bloom(64, 22, 0.6, 'deep')}${bloom(74, 44, 0.6)}
  </svg>`;
}

/** Full garden backdrop (400×600). */
export function gardenBackdrop({ dim = false } = {}) {
  const sky = nextId('sky');
  const glow = nextId('glow');
  const ground = nextId('gr');
  const stars = [
    [40, 40], [92, 92], [140, 30], [210, 70], [250, 22], [380, 150], [30, 180], [120, 160],
    [250, 140], [190, 200], [350, 230], [60, 260], [290, 210], [160, 110], [370, 40],
  ].map(([x, y], i) => `<circle class="${i % 3 === 0 ? 'twinkle' : ''}" style="--d:${(i % 5) * 0.7}s" cx="${x}" cy="${y}" r="${i % 4 === 0 ? 1.8 : 1.1}" fill="#fff6d0"/>`).join('');
  const bush = (x, y, s, tone = '#5f8a63') => `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-36 10c-4-14 8-24 18-18 4-12 22-14 28-2 10-6 26 2 22 20z" fill="${tone}"/>
      ${bloom(-18, -2, 0.55)}${bloom(4, -10, 0.6, 'deep')}${bloom(22, 0, 0.55)}${bloom(-4, 4, 0.5)}
    </g>`;
  return `<svg class="backdrop ${dim ? 'is-dim' : ''}" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1b1f4e"/>
        <stop offset=".3" stop-color="#363775"/>
        <stop offset=".52" stop-color="#8f78ba"/>
        <stop offset=".62" stop-color="#e7b4c9"/>
      </linearGradient>
      <radialGradient id="${glow}">
        <stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/>
        <stop offset="1" stop-color="#fff6d8" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${ground}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9cc095"/>
        <stop offset="1" stop-color="#6f9a70"/>
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#${sky})"/>
    ${stars}
    <circle cx="322" cy="84" r="74" fill="url(#${glow})"/>
    ${crescent(322, 84, 26)}
    <path d="M0 300Q80 262 170 290T400 276V600H0Z" fill="#6c7aa6" opacity=".5"/>
    <path d="M0 326Q100 292 212 320T400 304V600H0Z" fill="#7d9d88"/>
    <path d="M0 352Q120 330 222 346T400 338V600H0Z" fill="url(#${ground})"/>
    <path d="M176 600C150 540 268 500 236 452S150 392 186 344" fill="none" stroke="#f4e5cf" stroke-width="40" stroke-linecap="round"/>
    <path d="M176 600C150 540 268 500 236 452S150 392 186 344" fill="none" stroke="#e7d0b0" stroke-width="9" stroke-dasharray="1 22" stroke-linecap="round"/>
    ${bush(40, 412, 1)}${bush(352, 370, 0.9)}${bush(60, 566, 1.2)}${bush(356, 566, 1.15, '#587f5c')}
    ${bush(300, 470, 0.7, '#6b956b')}${bush(118, 498, 0.65, '#6b956b')}
  </svg>`;
}

export const icons = {
  soundOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M6 3v4.5h4.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  minimize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10l6 6 6-6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
