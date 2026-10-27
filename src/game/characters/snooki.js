/**
 * Snooki — fluffy white Siberian husky (from the owner's reference): white
 * cloud-like coat, upright ears with pink insides, warm amber eyes with dark
 * rims, a dark nose, a navy collar with a round blue paw tag.
 * Sprite: facing right, viewBox 140×110, paws on y≈106.
 * Portrait: front view, viewBox 200×200.
 */
import { lightingDefs, lit, aoDefs, ao } from './lighting.js';

let uid = 0;

const C = {
  fur: '#fbfbfd',
  furShade: '#e4e2ee',
  furDeep: '#cfcbe0',
  line: '#c9c5d8',
  earIn: '#f3b9c3',
  eye: '#c98a3c',
  rim: '#2a1e1c',
  nose: '#2a1d1a',
  tongue: '#f07f95',
};

export const COLLARS = { navy: ['#1d2b5c', '#3a72d8'], rose: ['#8e1c3e', '#e0567f'], gold: ['#6b4e12', '#e2b544'], mint: ['#1d5b52', '#5cd0b5'], sky: ['#2c7ab4', '#bfe8ff'] };

/** Scalloped (fluffy) closed shape around an ellipse. */
export function fluff(cx, cy, rx, ry, bumps = 12, amp = 0.12, phase = 0) {
  const pt = (a, k = 1) => [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  let d = '';
  for (let i = 0; i <= bumps; i++) {
    const a = phase + (i / bumps) * Math.PI * 2;
    const [x, y] = pt(a);
    if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    else {
      const [qx, qy] = pt(a - Math.PI / bumps, 1 + amp);
      d += ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return `${d}Z`;
}

function hatSvg(hat, x, y, scale = 1) {
  const g = (inner) => `<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>`;
  switch (hat) {
    case 'detective':
      return g(`<path d="M-17 2 C-16 -14 16 -14 17 2Z" fill="#8a6a45"/>
        <path d="M-17 2 C-16 -14 16 -14 17 2Z" fill="url(#check-${x}-${y})" opacity=".35"/>
        <path d="M-22 3 Q0 9 22 3 Q0 6 -22 3Z" fill="#6c5134"/>
        <path d="M-2 -12 Q0 -16 2 -12" stroke="#6c5134" stroke-width="2" fill="none"/>
        <defs><pattern id="check-${x}-${y}" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5H5M2.5 0V5" stroke="#3b2a18" stroke-width="1"/></pattern></defs>`);
    case 'party':
      return g(`<path d="M-9 2 L0 -24 L9 2Z" fill="#e0567f"/><path d="M-6 -6 L6 -6 M-3.5 -14 L3.5 -14" stroke="#ffd977" stroke-width="2"/><circle cy="-25" r="3.5" fill="#ffd977"/>`);
    case 'crown':
      return g(`<path d="M-14 2 L-14 -10 L-7 -3 L0 -14 L7 -3 L14 -10 L14 2Z" fill="#e2b544" stroke="#a77b1e" stroke-width="1.4"/><circle cy="-4" r="2.4" fill="#3a72d8"/>`);
    case 'rose':
      return g(`<circle r="7" fill="#3f6fe0"/><path d="M-4 -1 Q0 -6 4 -1 Q0 3 -4 -1Z" fill="#7aa2ff"/><path d="M-9 3 Q-14 0 -12 -4 M9 3 Q14 0 12 -4" stroke="#5f8f5a" stroke-width="2.4" fill="none"/>`);
    case 'jester':
      return g(`<path d="M-14 2 L-18 -14 L-4 -4 L0 -18 L4 -4 L18 -14 L14 2Z" fill="#6b4fa0"/><path d="M0 -18 L4 -4 L14 2 L-14 2 L-4 -4Z" fill="#e85d8c" opacity=".55"/><circle cx="-18" cy="-15" r="3" fill="#ffd977"/><circle cx="0" cy="-19" r="3" fill="#ffd977"/><circle cx="18" cy="-15" r="3" fill="#ffd977"/>`);
    case 'goggles':
      return g(`<rect x="-16" y="-4" width="32" height="5" rx="2" fill="#3b2a5a"/><circle cx="-7" cy="-2" r="6" fill="#9fd7ff" stroke="#3b2a5a" stroke-width="2"/><circle cx="7" cy="-2" r="6" fill="#9fd7ff" stroke="#3b2a5a" stroke-width="2"/>`);
    default:
      return '';
  }
}

export const SNOOKI_HATS = {
  none: 'بدون',
  detective: 'قبعة المحقق',
  party: 'قبعة الحفلة',
  crown: 'تاج الملك',
  rose: 'وردة زرقاء',
  goggles: 'نظارات السباق',
  jester: 'قبعة المقالب',
};

function pose(name, t) {
  const s = Math.sin(t * Math.PI * 2);
  switch (name) {
    case 'walk':
      return { fl: 20 * s, fr: -20 * s, bl: -20 * s, br: 20 * s, bob: -Math.abs(s) * 1.6, tail: 10 * s, head: 0 };
    case 'run':
      return { fl: 34 * s, fr: 26 * s, bl: -34 * s, br: -26 * s, bob: -Math.abs(s) * 4, tail: -20, head: 4, stretch: 1.06, earsBack: true };
    case 'sit':
      return { sit: true, tail: 6 * s, head: -4 };
    case 'sniff':
      return { fl: 4, fr: -4, bl: 0, br: 0, bob: 1, tail: 18 * s, head: 16, headY: 8, eyes: 'closed' };
    case 'excited':
      return { fl: -40, fr: -30, bl: 6, br: -6, bob: -6 - Math.abs(s) * 2, tail: 25 * s, head: -8, body: -14 };
    case 'confused':
      return { fl: 0, fr: 0, bl: 0, br: 0, bob: 0, tail: 0, head: -16, mouth: 'small' };
    case 'sleep':
      return { lie: true, tail: 0, eyes: 'closed', mouth: 'small' };
    case 'jump':
      return { fl: -40, fr: -34, bl: 40, br: 34, bob: 0, tail: -10, head: -6, earsBack: true };
    // V3
    case 'bark':
      return { fl: 6, fr: -2, bl: -4, br: 4, bob: -1 - Math.abs(s), tail: 14 * s, head: -14, mouth: 'bark' };
    case 'wag':
      return { fl: 0, fr: 0, bl: 0, br: 0, bob: s * 0.6, tail: 34 * s, head: -2 };
    case 'innocent':
      return { sit: true, tail: 2 * s, head: -12, eyesUp: true, mouth: 'small' };
    case 'stubborn':
      return { sit: true, tail: 0, head: -22, eyes: 'closed', mouth: 'closed' };
    case 'celebrate':
      return { fl: -46, fr: -36, bl: 30, br: 24, bob: -8 - Math.abs(s) * 3, tail: 30 * s, head: -10, body: -10, mouth: 'happy' };
    default:
      return { fl: 0, fr: 0, bl: 0, br: 0, bob: s * 0.8, tail: 8 * s, head: 0 };
  }
}

/**
 * Side sprite facing right.
 * @param {{ pose?: string, t?: number, hat?: string, collar?: string, mouth?: 'happy'|'small'|'closed', blink?: boolean, size?: number }} o
 */
export function snookiSprite({ pose: name = 'idle', t = 0, hat = 'none', collar = 'navy', mouth, blink = false, size } = {}) {
  const id = `s${++uid}`;
  const p = pose(name, t);
  const [band, tag] = COLLARS[collar] || COLLARS.navy;
  const mouthKind = mouth || p.mouth || 'happy';
  const eyesClosed = blink || p.eyes === 'closed';
  const legSvg = (x, angle, back) =>
    `<g transform="translate(${x} 70) rotate(${angle})" filter="url(#fur-${id})">
      <rect x="-5.5" y="0" width="11" height="30" rx="5.5" fill="${back ? C.furShade : C.fur}"/>
      <ellipse cx="1" cy="31" rx="7" ry="4.6" fill="${back ? C.furShade : C.fur}"/>
      <path d="M-1.5 30 v3 M2.5 30 v3" stroke="${C.line}" stroke-width=".9"/>
    </g>`;
  const ears = p.earsBack
    ? `<path d="M100 26 L84 12 L102 16Z" fill="${C.furShade}"/><path d="M108 22 L94 4 L114 14Z" fill="${C.fur}"/><path d="M106 18 L98 9 L110 15Z" fill="${C.earIn}"/>`
    : `<path d="M95 27 L95 5 L106 21Z" fill="${C.furShade}"/><path d="M104 23 L109 0 L119 21Z" fill="${C.fur}"/><path d="M107 20 L109.5 7 L115 19.5Z" fill="${C.earIn}"/>`;
  const up = p.eyesUp ? -1.2 : 0;
  const eye = eyesClosed
    ? `<path d="M110 36 Q115 39 120 36" stroke="${C.rim}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : `<path d="M109.5 36 Q115 30 121 35 Q115 40 109.5 36Z" fill="${C.eye}" stroke="${C.rim}" stroke-width="1.8" stroke-linejoin="round"/>
       <circle cx="115.6" cy="${35.4 + up}" r="2.4" fill="${C.rim}"/><circle cx="116.6" cy="${34.2 + up}" r="1" fill="#fff"/><circle cx="114" cy="${36.6 + up}" r=".5" fill="#fff" opacity=".7"/>`;
  const mouthSvg =
    mouthKind === 'bark'
      ? `<path d="M118 48 Q126 47 133 46 L132 52 Q125 62 118 52Z" fill="#7a2230" stroke="${C.rim}" stroke-width="1.5"/><path d="M121 55 Q125 60 129 55Z" fill="${C.tongue}"/><path d="M134 36 l6 -4 M136 42 l7 0 M134 48 l6 4" stroke="#9fd7ff" stroke-width="1.6" stroke-linecap="round"/>`
      : mouthKind === 'happy'
      ? `<path d="M119 49 Q124 56 131 50" stroke="${C.rim}" stroke-width="1.6" fill="#7a2230"/><path d="M122 52 Q124 62 129 58 Q130 54 128 51Z" fill="${C.tongue}"/>`
      : mouthKind === 'small'
        ? `<path d="M123 50 Q126 52 129 49.5" stroke="${C.rim}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
        : `<path d="M121 49.5 Q126 51.5 131 49" stroke="${C.rim}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  const head = `<g transform="translate(0 ${p.headY || 0}) rotate(${p.head || 0} 104 44) translate(104 46) scale(1.16) translate(-104 -46)">
      ${lit(id, ears, 'fur')}
      ${lit(id, `<path d="${fluff(108, 38, 20, 19, 12, 0.1)}" fill="${C.fur}"/><ellipse cx="124" cy="45" rx="12.5" ry="8.6" fill="${C.fur}"/>`, 'fur')}
      <path d="M96 30 q3 -3 6 -1 M100 25 q3 -2 5 0 M93 40 q2 -3 5 -2" stroke="${C.furDeep}" stroke-width=".9" fill="none" opacity=".6"/>
      <path d="M114 50 Q124 56 135 48" stroke="${C.furShade}" stroke-width="2" fill="none"/>
      <g filter="url(#gloss-${id})"><ellipse cx="134" cy="42.5" rx="4.4" ry="3.4" fill="${C.nose}"/></g><ellipse cx="133" cy="41.3" rx="1.4" ry=".8" fill="#fff" opacity=".6"/>
      ${eye}${mouthSvg}
      <ellipse cx="111" cy="44" rx="4" ry="2.2" fill="#f6c1cb" opacity=".45"/>
      ${hatSvg(hat, 108, 20, 0.85)}
    </g>`;
  const tail = `<g transform="rotate(${p.tail || 0} 34 52)">
      ${lit(id, `<path d="${fluff(24, 36, 13, 15, 10, 0.18, 0.4)}" fill="${C.fur}"/>`, 'fur')}
      <path d="M30 48 C22 44 18 36 24 28" stroke="${C.furShade}" stroke-width="2" fill="none"/>
    </g>`;
  const collarSvg = `${lit(id, `<path d="M94 50 Q103 60 115 54 L116 59 Q103 67 93 56Z" fill="${band}"/>`, 'gloss')}
      ${lit(id, `<circle cx="104" cy="65" r="5.2" fill="${tag}" stroke="${band}" stroke-width="1.4"/>`, 'gloss')}
      <circle cx="104" cy="66.2" r="1.6" fill="#fff"/><circle cx="101.8" cy="63.4" r=".9" fill="#fff"/><circle cx="104" cy="62.6" r=".9" fill="#fff"/><circle cx="106.2" cy="63.4" r=".9" fill="#fff"/>`;

  let body;
  if (p.lie) {
    body = `<g transform="translate(14 46)">${tail}</g>
      ${lit(id, `<path d="${fluff(70, 84, 46, 18, 16, 0.1)}" fill="${C.fur}"/>`, 'fur')}
      <ellipse cx="70" cy="92" rx="40" ry="8" fill="${C.furShade}" opacity=".5"/>
      <g transform="translate(-6 40)">${collarSvg}${head}</g>`;
  } else if (p.sit) {
    body = `<g transform="translate(6 46)">${tail}</g>
      <ellipse cx="54" cy="94" rx="24" ry="12" fill="${C.furShade}"/>
      ${lit(id, `<path d="${fluff(62, 70, 26, 30, 12, 0.12)}" fill="${C.fur}"/><ellipse cx="56" cy="96" rx="20" ry="9" fill="${C.fur}"/>`, 'fur')}
      <path d="M50 58 q4 -3 8 0 M46 72 q4 -3 8 0 M70 80 q3 -2 6 0" stroke="${C.furDeep}" stroke-width=".9" fill="none" opacity=".55"/>
      ${legSvg(80, 0, true)}${legSvg(90, 0, false)}
      <g transform="translate(-14 -6)">
        ${lit(id, `<path d="${fluff(96, 56, 15, 20, 10, 0.12)}" fill="${C.fur}"/>`, 'fur')}
        ${collarSvg}${head}
      </g>`;
  } else {
    body = `${tail}
      ${legSvg(44, p.bl, true)}${legSvg(88, p.fl, true)}
      <g transform="rotate(${p.body || 0} 52 86) scale(${p.stretch || 1} 1)">
        ${lit(id, `<path d="${fluff(64, 62, 38, 23, 14, 0.12)}" fill="${C.fur}"/>`, 'fur')}
        <ellipse cx="64" cy="74" rx="32" ry="9" fill="${C.furShade}" opacity=".5"/>
        <path d="M40 54 Q46 50 52 54 M58 50 Q64 46 70 50" stroke="${C.furShade}" stroke-width="1.6" fill="none"/>
        <path d="M34 62 q3 -3 7 -1 M48 46 q4 -2 7 0 M76 48 q3 -2 6 0 M82 66 q3 -2 6 0" stroke="${C.furDeep}" stroke-width=".9" fill="none" opacity=".55"/>
      </g>
      ${legSvg(54, p.br, false)}${legSvg(97, p.fr, false)}
      <g transform="rotate(${p.body || 0} 52 86)">
        ${lit(id, `<path d="${fluff(96, 54, 15, 19, 10, 0.12)}" fill="${C.fur}"/>`, 'fur')}
        ${collarSvg}${head}
      </g>`;
  }
  const dims = size ? `width="${(size * 140) / 110}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 110" ${dims} data-id="${id}">
    <defs>${lightingDefs(id)}${aoDefs(id)}</defs>
    <g transform="translate(0 ${p.bob || 0})">${body}</g>
  </svg>`;
}

const PORTRAIT_EXPR = ['happy', 'smug', 'confused', 'shocked', 'dramatic', 'sniff', 'proud', 'guilty', 'serious', 'innocent', 'sleepy'];
export const SNOOKI_EXPRESSIONS = PORTRAIT_EXPR;

/** Front-facing dialogue portrait. */
export function snookiPortrait({ expr = 'happy', hat = 'none', collar = 'navy' } = {}) {
  const [band, tag] = COLLARS[collar] || COLLARS.navy;
  const e = PORTRAIT_EXPR.includes(expr) ? expr : 'happy';
  const tilt = e === 'confused' ? -12 : e === 'proud' ? -4 : 0;
  const earL = e === 'guilty' ? 'M70 70 L36 52 L58 88Z' : e === 'confused' ? 'M66 64 L34 44 L52 86Z' : 'M64 70 L58 18 L94 52Z';
  const earR = e === 'guilty' ? 'M130 70 L164 52 L142 88Z' : 'M136 70 L142 18 L106 52Z';
  const almond = (cx, cy, dir) =>
    `<path d="M${cx - 12} ${cy} Q${cx} ${cy - 11} ${cx + 12} ${cy - 1 * dir} Q${cx} ${cy + 9} ${cx - 12} ${cy}Z" fill="${C.eye}" stroke="${C.rim}" stroke-width="3" stroke-linejoin="round"/>`;
  let eyes;
  switch (e) {
    case 'smug':
      eyes = `<path d="M66 98 Q78 92 90 98 Q78 103 66 98Z" fill="${C.eye}" stroke="${C.rim}" stroke-width="3"/><path d="M110 98 Q122 92 134 98 Q122 103 110 98Z" fill="${C.eye}" stroke="${C.rim}" stroke-width="3"/>
        <circle cx="80" cy="98" r="3.4" fill="${C.rim}"/><circle cx="124" cy="98" r="3.4" fill="${C.rim}"/>
        <path d="M64 92 L90 94 M110 94 L136 91" stroke="${C.rim}" stroke-width="3.4" stroke-linecap="round"/>`;
      break;
    case 'shocked':
      eyes = `<circle cx="78" cy="96" r="13" fill="#fff" stroke="${C.rim}" stroke-width="3"/><circle cx="122" cy="96" r="13" fill="#fff" stroke="${C.rim}" stroke-width="3"/>
        <circle cx="78" cy="96" r="3.6" fill="${C.rim}"/><circle cx="122" cy="96" r="3.6" fill="${C.rim}"/>`;
      break;
    case 'sniff':
    case 'proud':
      eyes = `<path d="M66 98 Q78 88 90 98" stroke="${C.rim}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M110 98 Q122 88 134 98" stroke="${C.rim}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
      break;
    case 'dramatic':
      eyes = `${almond(78, 96, 1)}${almond(122, 96, -1)}
        <circle cx="79" cy="95" r="6.5" fill="${C.rim}"/><circle cx="121" cy="95" r="6.5" fill="${C.rim}"/>
        <circle cx="82" cy="92" r="3" fill="#fff"/><circle cx="124" cy="92" r="3" fill="#fff"/><circle cx="76" cy="99" r="1.6" fill="#fff"/><circle cx="118" cy="99" r="1.6" fill="#fff"/>
        <path d="M70 104 Q66 116 70 124 Q75 116 70 104Z" fill="#8fc8ff"/><path d="M130 104 Q134 116 130 124 Q125 116 130 104Z" fill="#8fc8ff"/>`;
      break;
    case 'innocent':
      eyes = `${almond(78, 96, 1)}${almond(122, 96, -1)}<circle cx="80" cy="91" r="5.4" fill="${C.rim}"/><circle cx="124" cy="91" r="5.4" fill="${C.rim}"/>
        <circle cx="82" cy="89" r="2.2" fill="#fff"/><circle cx="126" cy="89" r="2.2" fill="#fff"/><text x="146" y="62" font-size="26" fill="#ffd977" font-family="sans-serif">✦</text>`;
      break;
    case 'sleepy':
      eyes = `<path d="M66 98 Q78 104 90 98" stroke="${C.rim}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M110 98 Q122 104 134 98" stroke="${C.rim}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <text x="146" y="64" font-size="24" font-weight="700" fill="#9fd7ff" font-family="sans-serif">z</text><text x="160" y="48" font-size="18" font-weight="700" fill="#9fd7ff" font-family="sans-serif">z</text>`;
      break;
    case 'guilty':
      eyes = `${almond(78, 98, 1)}${almond(122, 98, -1)}<circle cx="72" cy="98" r="4.4" fill="${C.rim}"/><circle cx="116" cy="98" r="4.4" fill="${C.rim}"/>
        <path d="M150 70 Q156 80 150 86 Q144 80 150 70Z" fill="#8fc8ff"/>`;
      break;
    case 'serious':
      eyes = `${almond(78, 96, 1)}${almond(122, 96, -1)}<circle cx="79" cy="96" r="4.4" fill="${C.rim}"/><circle cx="121" cy="96" r="4.4" fill="${C.rim}"/>
        <path d="M64 86 L92 92 M108 92 L136 86" stroke="${C.rim}" stroke-width="3.6" stroke-linecap="round"/>`;
      break;
    default:
      eyes = `${almond(78, 96, 1)}${almond(122, 96, -1)}<circle cx="79" cy="95.5" r="4.8" fill="${C.rim}"/><circle cx="121" cy="95.5" r="4.8" fill="${C.rim}"/>
        <circle cx="81" cy="93" r="1.8" fill="#fff"/><circle cx="123" cy="93" r="1.8" fill="#fff"/>`;
  }
  const mouths = {
    happy: `<path d="M84 132 Q100 156 116 132" fill="#7a2230" stroke="${C.rim}" stroke-width="2.6"/><path d="M92 140 Q100 166 110 142 Q101 146 92 140Z" fill="${C.tongue}"/>`,
    smug: `<path d="M86 134 Q100 140 118 128" stroke="${C.rim}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    confused: `<path d="M92 136 Q100 132 108 137" stroke="${C.rim}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    shocked: `<ellipse cx="100" cy="140" rx="7" ry="9" fill="#7a2230" stroke="${C.rim}" stroke-width="2.6"/>`,
    dramatic: `<path d="M86 140 Q92 132 100 138 Q108 132 114 140" stroke="${C.rim}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    sniff: `<path d="M90 134 Q100 140 110 134" stroke="${C.rim}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M70 112 l-10 -4 M70 120 l-12 0 M130 112 l10 -4 M130 120 l12 0" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>`,
    proud: `<path d="M84 132 Q100 150 116 132" fill="#7a2230" stroke="${C.rim}" stroke-width="2.6"/><path d="M93 138 Q100 152 108 139Z" fill="${C.tongue}"/>`,
    guilty: `<path d="M86 138 Q93 132 100 138 Q107 144 114 136" stroke="${C.rim}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    serious: `<path d="M88 136 H112" stroke="${C.rim}" stroke-width="3" stroke-linecap="round"/>`,
    innocent: `<path d="M90 134 Q100 142 110 134" stroke="${C.rim}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    sleepy: `<ellipse cx="100" cy="138" rx="5" ry="3.6" fill="#7a2230" stroke="${C.rim}" stroke-width="2"/>`,
  };
  const id = `sp${++uid}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>${lightingDefs(id)}</defs>
    ${lit(id, `<path d="M30 200 C34 170 60 156 100 156 C140 156 166 170 170 200Z" fill="${C.fur}"/>`, 'fur')}
    <path d="M58 168 Q100 186 142 168 L144 178 Q100 198 56 178Z" fill="${band}"/>
    <circle cx="100" cy="190" r="10" fill="${tag}" stroke="${band}" stroke-width="2.4"/>
    <circle cx="100" cy="192.5" r="3" fill="#fff"/><circle cx="95.6" cy="187" r="1.8" fill="#fff"/><circle cx="100" cy="185.4" r="1.8" fill="#fff"/><circle cx="104.4" cy="187" r="1.8" fill="#fff"/>
    <g transform="rotate(${tilt} 100 110)">
      <path d="${earL}" fill="${C.fur}" stroke="${C.line}" stroke-width="1.4"/><path d="${earR}" fill="${C.fur}" stroke="${C.line}" stroke-width="1.4"/>
      ${e === 'guilty' ? '' : '<path d="M68 62 L64 32 L84 54Z M132 62 L136 32 L116 54Z" fill="' + C.earIn + '"/>'}
      ${lit(id, `<path d="${fluff(100, 110, 64, 58, 18, 0.07)}" fill="${C.fur}"/>`, 'fur')}
      ${lit(id, `<path d="${fluff(100, 136, 50, 26, 12, 0.1, 0.3)}" fill="${C.fur}"/><ellipse cx="100" cy="128" rx="32" ry="22" fill="${C.fur}"/>`, 'fur')}
      <path d="M58 92 q6 -5 12 -2 M130 90 q6 -3 12 2 M84 70 q6 -4 12 -1 M110 70 q6 -3 11 1" stroke="${C.furDeep}" stroke-width="1.4" fill="none" opacity=".55"/>
      <path d="M70 138 Q100 152 130 138" stroke="${C.furShade}" stroke-width="2.4" fill="none"/>
      <ellipse cx="66" cy="118" rx="9" ry="5" fill="#f6c1cb" opacity=".45"/><ellipse cx="134" cy="118" rx="9" ry="5" fill="#f6c1cb" opacity=".45"/>
      ${eyes}
      ${lit(id, `<ellipse cx="100" cy="117" rx="11" ry="8" fill="${C.nose}"/>`, 'gloss')}<ellipse cx="96" cy="114" rx="3.4" ry="1.8" fill="#fff" opacity=".6"/>
      <path d="M100 125 V130" stroke="${C.rim}" stroke-width="2.4"/>
      ${mouths[e]}
      ${e === 'confused' ? '<text x="150" y="60" font-size="34" font-weight="700" fill="#7aa2ff" font-family="sans-serif">?</text>' : ''}
      ${hatSvg(hat, 100, 52, 2)}
    </g>
  </svg>`;
}
