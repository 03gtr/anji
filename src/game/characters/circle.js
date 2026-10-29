/**
 * Season 2's circle: Rabi', Lama, Sabri, Uncle Jojo and Anji's sister.
 *
 * ORIGINAL, CLEARLY FICTIONAL designs (owner decision): none of them claims to look like the real
 * person. Only Uncle Jojo's white hair is a real detail. Designs are respectful: no feature is drawn
 * to be laughed at, and nobody's height, looks or coat is a joke (docs/season-2/SEASON_2_STORY_BIBLE.md).
 *
 *  - personSprite(look, { pose, t }) — the full figure for the world (viewBox 100×200, feet ≈ 195),
 *    baked once per look by world/sprite-cache.js like every other character;
 *  - personPortrait(look, expr)       — the dialogue portrait (viewBox 200×200).
 *
 * Ids inside each SVG are numbered (`p12`…) and referenced only through `url(#…)`, the form the
 * sprite cache's key understands.
 */
import { lightingDefs } from './lighting.js';

let uid = 0;

/** The five looks. Colours and silhouettes differ clearly from Anji, Ryan and each other. */
export const CIRCLE = {
  rabi: { name: 'ربيع', skin: '#e2b896', skinShade: '#c99a7a', hair: '#2b211b', hairStyle: 'neat', top: '#3f8f8a', topShade: '#2f6f6b', coat: '#f4f6f8', coatShade: '#d5dbe2', legs: '#3a4256', shoes: '#2a2a30', glasses: '#2b2f3a' },
  lama: { name: 'لمى', skin: '#e9c3a3', skinShade: '#cfa284', hair: '#4a2e22', hairStyle: 'bob', top: '#d9a53a', topShade: '#b8862a', coat: null, legs: '#5a4a6e', shoes: '#3a2c3c', clip: '#e86a8a' },
  sabri: { name: 'صبري', skin: '#d8a982', skinShade: '#bd8d68', hair: '#1f1a17', hairStyle: 'curly', top: '#24406e', topShade: '#1b3155', coat: null, legs: '#2c2f38', shoes: '#e9e9ef', stripe: '#f08a3c' },
  jojo: { name: 'العم جوجو', skin: '#e3bb9c', skinShade: '#c79c7c', hair: '#f2f2ee', hairStyle: 'white', top: '#e9e2d0', topShade: '#cfc6b0', coat: '#7a5a3e', coatShade: '#5f4530', legs: '#4a4038', shoes: '#2e2620', moustache: '#f2f2ee' },
  sister: { name: 'أخت أنجي', skin: '#ecc7a8', skinShade: '#d2a688', hair: '#3a2219', hairStyle: 'tied', top: '#8e5a8a', topShade: '#704470', coat: null, legs: '#2f3a52', shoes: '#4a2a3a' },
};
export const CIRCLE_KINDS = Object.keys(CIRCLE);
export const CIRCLE_EXPRESSIONS = ['neutral', 'smile', 'thinking', 'surprised', 'worried', 'shy'];

function hairBack(L, cx = 50) {
  switch (L.hairStyle) {
    case 'bob':
      return `<path d="M${cx - 18} 30 C${cx - 20} 12 ${cx + 20} 12 ${cx + 18} 30 L${cx + 19} 50 C${cx + 12} 54 ${cx - 12} 54 ${cx - 19} 50Z" fill="${L.hair}"/>`;
    case 'tied':
      return `<path d="M${cx - 17} 30 C${cx - 19} 13 ${cx + 19} 13 ${cx + 17} 30 L${cx + 16} 40 C${cx + 8} 44 ${cx - 8} 44 ${cx - 16} 40Z" fill="${L.hair}"/>
        <path d="M${cx + 14} 34 C${cx + 26} 40 ${cx + 24} 64 ${cx + 16} 76 C${cx + 14} 64 ${cx + 15} 50 ${cx + 10} 40Z" fill="${L.hair}"/>`;
    default:
      return '';
  }
}

function hairFront(L, cx = 50) {
  switch (L.hairStyle) {
    case 'neat':
      return `<path d="M${cx - 16} 26 C${cx - 17} 13 ${cx - 6} 9 ${cx + 2} 10 C${cx + 12} 10 ${cx + 18} 16 ${cx + 16} 27 C${cx + 10} 21 ${cx - 2} 19 ${cx - 16} 26Z" fill="${L.hair}"/>`;
    case 'curly':
      return `<g fill="${L.hair}">${[-14, -7, 0, 7, 14].map((d) => `<circle cx="${cx + d}" cy="${14 + Math.abs(d) * 0.35}" r="7"/>`).join('')}<circle cx="${cx - 16}" cy="23" r="5.5"/><circle cx="${cx + 16}" cy="23" r="5.5"/></g>`;
    case 'white':
      return `<path d="M${cx - 16} 28 C${cx - 18} 16 ${cx - 8} 12 ${cx} 12 C${cx + 9} 12 ${cx + 18} 16 ${cx + 16} 28 C${cx + 12} 22 ${cx + 8} 20 ${cx} 21 C${cx - 8} 20 ${cx - 12} 22 ${cx - 16} 28Z" fill="${L.hair}"/>
        <path d="M${cx - 17} 28 C${cx - 20} 34 ${cx - 18} 40 ${cx - 15} 42 M${cx + 17} 28 C${cx + 20} 34 ${cx + 18} 40 ${cx + 15} 42" stroke="${L.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'bob':
      return `<path d="M${cx - 18} 31 C${cx - 19} 4 ${cx + 19} 4 ${cx + 18} 30 C${cx + 10} 21 ${cx - 4} 21 ${cx - 18} 31Z" fill="${L.hair}"/>
        <rect x="${cx + 8}" y="17" width="7" height="3.4" rx="1.6" fill="${L.clip}"/>`;
    case 'tied':
      return `<path d="M${cx - 17} 29 C${cx - 18} 3 ${cx + 18} 3 ${cx + 17} 28 C${cx + 8} 19 ${cx - 6} 19 ${cx - 17} 29Z" fill="${L.hair}"/>`;
    default:
      return '';
  }
}

function face(L, expr, cx = 50, cy = 32, s = 1) {
  const eyeY = cy - 1;
  const ey = expr === 'smile' ? 1.1 : expr === 'surprised' ? 2.4 : 1.8;
  const eyes = [-6, 6]
    .map((d) => `<ellipse cx="${cx + d * s}" cy="${eyeY}" rx="${1.7 * s}" ry="${ey * s}" fill="#2a1d18"/><circle cx="${cx + (d + 0.6) * s}" cy="${eyeY - 0.6 * s}" r="${0.5 * s}" fill="#fff"/>`)
    .join('');
  const browY = eyeY - 4.6 * s;
  const brows =
    expr === 'worried'
      ? `<path d="M${cx - 9 * s} ${browY + 1} L${cx - 3 * s} ${browY - 0.6} M${cx + 3 * s} ${browY - 0.6} L${cx + 9 * s} ${browY + 1}" stroke="${L.hairStyle === 'white' ? '#cfcfc8' : '#2a1d18'}" stroke-width="${1.3 * s}" stroke-linecap="round"/>`
      : expr === 'thinking'
        ? `<path d="M${cx - 9 * s} ${browY} L${cx - 3 * s} ${browY} M${cx + 3 * s} ${browY - 1.4} L${cx + 9 * s} ${browY + 0.4}" stroke="${L.hairStyle === 'white' ? '#cfcfc8' : '#2a1d18'}" stroke-width="${1.3 * s}" stroke-linecap="round"/>`
        : `<path d="M${cx - 9 * s} ${browY + 0.4} Q${cx - 6 * s} ${browY - 1.4} ${cx - 3 * s} ${browY + 0.2} M${cx + 3 * s} ${browY + 0.2} Q${cx + 6 * s} ${browY - 1.4} ${cx + 9 * s} ${browY + 0.4}" stroke="${L.hairStyle === 'white' ? '#cfcfc8' : '#2a1d18'}" stroke-width="${1.2 * s}" fill="none" stroke-linecap="round"/>`;
  const my = cy + 8 * s;
  const mouth =
    expr === 'smile'
      ? `<path d="M${cx - 4.5 * s} ${my} Q${cx} ${my + 4 * s} ${cx + 4.5 * s} ${my}" stroke="#8a3b34" stroke-width="${1.4 * s}" fill="none" stroke-linecap="round"/>`
      : expr === 'surprised'
        ? `<ellipse cx="${cx}" cy="${my + 0.8 * s}" rx="${2 * s}" ry="${2.6 * s}" fill="#7a3530"/>`
        : expr === 'worried'
          ? `<path d="M${cx - 4 * s} ${my + 1.4 * s} Q${cx} ${my - 1 * s} ${cx + 4 * s} ${my + 1.4 * s}" stroke="#8a3b34" stroke-width="${1.3 * s}" fill="none" stroke-linecap="round"/>`
          : expr === 'shy'
            ? `<path d="M${cx - 3 * s} ${my + 0.6 * s} Q${cx} ${my + 2 * s} ${cx + 3 * s} ${my + 0.6 * s}" stroke="#8a3b34" stroke-width="${1.2 * s}" fill="none" stroke-linecap="round"/><ellipse cx="${cx - 8 * s}" cy="${cy + 4 * s}" rx="${2.6 * s}" ry="${1.4 * s}" fill="#f19a9a" opacity=".55"/><ellipse cx="${cx + 8 * s}" cy="${cy + 4 * s}" rx="${2.6 * s}" ry="${1.4 * s}" fill="#f19a9a" opacity=".55"/>`
            : `<path d="M${cx - 3.6 * s} ${my + 0.6 * s} Q${cx} ${my + 1.6 * s} ${cx + 3.6 * s} ${my + 0.6 * s}" stroke="#8a3b34" stroke-width="${1.3 * s}" fill="none" stroke-linecap="round"/>`;
  const extra =
    (L.moustache ? `<path d="M${cx - 6 * s} ${my - 2.4 * s} Q${cx} ${my - 5 * s} ${cx + 6 * s} ${my - 2.4 * s} Q${cx} ${my - 1.6 * s} ${cx - 6 * s} ${my - 2.4 * s}Z" fill="${L.moustache}"/>` : '') +
    (L.glasses ? `<g stroke="${L.glasses}" stroke-width="${1 * s}" fill="rgba(159,215,255,.15)"><rect x="${cx - 10 * s}" y="${eyeY - 3.6 * s}" width="${8 * s}" height="${6.6 * s}" rx="${1.6 * s}"/><rect x="${cx + 2 * s}" y="${eyeY - 3.6 * s}" width="${8 * s}" height="${6.6 * s}" rx="${1.6 * s}"/><path d="M${cx - 2 * s} ${eyeY - 1 * s} H${cx + 2 * s}" fill="none"/></g>` : '');
  return eyes + brows + mouth + extra;
}

/** The full figure for the world: idle (a slow breath) or walk (legs and arms swing). */
export function personSprite(kind, { pose = 'idle', t = 0, expr = 'neutral' } = {}) {
  const L = CIRCLE[kind];
  const id = `p${++uid}`;
  const s = Math.sin(t * Math.PI * 2);
  const walk = pose === 'walk';
  const lf = walk ? 4 * s : 0;
  const sw = walk ? 3.4 * s : 0;
  const breathe = walk ? 0 : 0.6 * s;
  const arm = (side, swing) => {
    const x = (v) => 50 + side * v;
    const sleeve = L.coat ? (side < 0 ? L.coatShade : L.coat) : side < 0 ? L.topShade : L.top;
    return `<path d="M${x(19)} 66 C${x(26)} 76 ${x(27)} 96 ${x(25)} ${118 + swing} L${x(17)} ${118 + swing} C${x(17)} 98 ${x(15)} 82 ${x(13)} 72Z" fill="${sleeve}"/>
      <ellipse cx="${x(21)}" cy="${121 + swing}" rx="4.4" ry="4.8" fill="${L.skin}"/>`;
  };
  const coat = L.coat
    ? `<path d="M29 64 C33 60 67 60 71 64 L74 140 L57 140 L50 72 L43 140 L26 140Z" fill="${L.coat}"/><path d="M50 72 L57 140 M50 72 L43 140" stroke="${L.coatShade}" stroke-width="1.6"/>`
    : '';
  const stripe = L.stripe ? `<path d="M32 90 H68" stroke="${L.stripe}" stroke-width="4"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200">
    <defs>${lightingDefs(id)}</defs>
    <g filter="url(#v3d-${id})">
      <path d="M38 132 L36 ${186 - lf} L49 ${186 - lf} L50 136Z" fill="${L.legs}"/>
      <path d="M50 136 L51 ${186 + lf} L64 ${186 + lf} L62 132Z" fill="${L.legs}"/>
      <path d="M33 ${184 - lf} H49 V${193 - lf} H31Z" fill="${L.shoes}"/>
      <path d="M51 ${184 + lf} H67 L69 ${193 + lf} H51Z" fill="${L.shoes}"/>
      ${arm(-1, sw)}${arm(1, -sw)}
      <path d="M33 140 L31 ${96 + breathe} C29 84 28 72 31 66 C36 61 64 61 69 66 C72 72 71 84 69 ${96 + breathe} L67 140Z" fill="${L.top}"/>
      ${stripe}${coat}
      <path d="M44 50 H56 L57 63 H43Z" fill="${L.skinShade}"/>
      ${hairBack(L)}
      <ellipse cx="33.6" cy="33" rx="2.8" ry="4.6" fill="${L.skin}"/><ellipse cx="66.4" cy="33" rx="2.8" ry="4.6" fill="${L.skin}"/>
      <path d="M34 30 C33 16 42 11 50 11 C58 11 67 16 66 30 C66 43 59 52 50 52 C41 52 34 43 34 30Z" fill="${L.skin}"/>
      ${hairFront(L)}
      ${face(L, expr, 50, 32, 1)}
    </g>
  </svg>`;
}

/** The dialogue portrait: head and shoulders, with an expression. */
export function personPortrait(kind, expr = 'neutral') {
  const L = CIRCLE[kind];
  const id = `pp${++uid}`;
  const e = CIRCLE_EXPRESSIONS.includes(expr) ? expr : 'neutral';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>${lightingDefs(id)}<radialGradient id="bg${id}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#2b2f5a"/><stop offset="1" stop-color="#151735"/></radialGradient></defs>
    <circle cx="100" cy="100" r="96" fill="url(#bg${id})"/>
    <g filter="url(#v3d-${id})" transform="translate(-50 -22) scale(3)">
      <path d="M22 80 C26 66 40 61 50 61 C60 61 74 66 78 80Z" fill="${L.coat ?? L.top}"/>
      ${L.coat ? `<path d="M44 62 L50 74 L56 62" fill="${L.top}"/>` : ''}
      <path d="M45 48 H55 L56 62 H44Z" fill="${L.skinShade}"/>
      ${hairBack(L)}
      <ellipse cx="33.6" cy="33" rx="2.8" ry="4.6" fill="${L.skin}"/><ellipse cx="66.4" cy="33" rx="2.8" ry="4.6" fill="${L.skin}"/>
      <path d="M34 30 C33 16 42 11 50 11 C58 11 67 16 66 30 C66 43 59 52 50 52 C41 52 34 43 34 30Z" fill="${L.skin}"/>
      ${hairFront(L)}
      ${face(L, e, 50, 32, 1)}
    </g>
  </svg>`;
}
