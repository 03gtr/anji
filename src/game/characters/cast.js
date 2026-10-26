/**
 * Supporting cast. All original designs.
 *  - Ryan: the missing creator. Only ever seen from behind or as a shadow
 *    (dark hair, charcoal hoodie, black backpack, jeans — from the reference).
 *  - Nurse Needle: an over-enthusiastic cartoon syringe with a rubber safety
 *    ball on her tip. Harmless, theatrical, determined to vaccinate Snooki.
 *  - Uncle Munther (العم منذر): the observatory's owl astronomer — warm,
 *    clever, a bit eccentric and often more confident than correct.
 *  - Sultan: the sanctuary's vain peacock.
 *  - The Gate, the phone and the narrator only have voices / icons.
 */
import { lightingDefs, lit } from './lighting.js';

let uid = 0;

export function ryanSprite({ pose = 'idle', t = 0, shadow = false, size } = {}) {
  const s = Math.sin(t * Math.PI * 2);
  const walk = pose === 'walk';
  const lf = walk ? 3 * s : 0;
  const id = `r${++uid}`;
  const fill = (c) => (shadow ? `url(#sh${id})` : c);
  const dims = size ? `width="${size / 2}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" ${dims}>
    <defs><linearGradient id="sh${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b0d22"/><stop offset=".85" stop-color="#151a3a"/><stop offset="1" stop-color="#6fd3ff"/></linearGradient>${shadow ? '' : lightingDefs(id)}</defs>
    <g opacity="${shadow ? 0.92 : 1}" ${shadow ? '' : `filter="url(#v3d-${id})"`}>
      <path d="M36 138 L34 ${186 - lf} L48 ${186 - lf} L49 140Z" fill="${fill('#3d5a85')}"/>
      <path d="M51 140 L52 ${186 + lf} L66 ${186 + lf} L64 138Z" fill="${fill('#35507a')}"/>
      <path d="M31 ${184 - lf} H49 V${193 - lf} H29Z" fill="${fill('#24252c')}"/><path d="M29 ${191 - lf} H49 V${195 - lf} H29Z" fill="${fill('#e9e9ef')}"/>
      <path d="M51 ${184 + lf} H69 L71 ${193 + lf} H51Z" fill="${fill('#24252c')}"/><path d="M51 ${191 + lf} H71 V${195 + lf} H51Z" fill="${fill('#e9e9ef')}"/>
      <path d="M24 70 C26 62 36 58 50 58 C64 58 74 62 76 70 L78 142 L22 142Z" fill="${fill('#2c2f38')}"/>
      <path d="M22 72 L14 ${126 + s * 2} L22 ${128 + s * 2} L28 84Z" fill="${fill('#262830')}"/>
      <path d="M78 72 L86 ${126 - s * 2} L78 ${128 - s * 2} L72 84Z" fill="${fill('#262830')}"/>
      <circle cx="18" cy="${131 + s * 2}" r="5" fill="${fill('#e8c2a8')}"/><circle cx="82" cy="${131 - s * 2}" r="5" fill="${fill('#e8c2a8')}"/>
      <path d="M34 60 C40 66 60 66 66 60 C64 54 36 54 34 60Z" fill="${fill('#23252d')}"/>
      <rect x="31" y="72" width="38" height="52" rx="8" fill="${fill('#15161b')}"/>
      <rect x="36" y="96" width="28" height="20" rx="5" fill="${fill('#1d1e24')}"/>
      <path d="M36 72 L34 64 M64 72 L66 64" stroke="${shadow ? '#0b0d22' : '#0f1014'}" stroke-width="4"/>
      ${shadow ? '' : '<path d="M46 104 L50 110 L54 104" stroke="#3a3d48" stroke-width="2" fill="none"/>'}
      <rect x="44" y="48" width="12" height="12" fill="${fill('#d9b39a')}"/>
      <ellipse cx="32.5" cy="40" rx="3.5" ry="6" fill="${fill('#e0b89e')}"/><ellipse cx="67.5" cy="40" rx="3.5" ry="6" fill="${fill('#e0b89e')}"/>
      <path d="M32 36 C30 18 42 12 50 12 C60 12 70 18 68 36 C68 46 62 52 50 52 C38 52 32 46 32 36Z" fill="${fill('#2a1d16')}"/>
      <path d="M38 22 C44 16 56 16 62 22 M36 32 C42 28 48 28 52 30" stroke="${shadow ? 'none' : '#3e2b20'}" stroke-width="1.6" fill="none"/>
    </g>
  </svg>`;
}

export function ryanPortrait({ expr = 'back' } = {}) {
  const turn = expr === 'turn';
  const id = `rp${++uid}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs><radialGradient id="moonlit" cx=".7" cy=".2" r=".9"><stop offset="0" stop-color="#9fd7ff" stop-opacity=".55"/><stop offset="1" stop-color="#9fd7ff" stop-opacity="0"/></radialGradient>${lightingDefs(id)}</defs>
    <circle cx="140" cy="40" r="90" fill="url(#moonlit)"/>
    <g filter="url(#v3d-${id})">
    <path d="M20 200 C24 160 50 140 100 138 C150 140 176 160 180 200Z" fill="#2c2f38"/>
    <path d="M62 146 C70 160 130 160 138 146 C130 134 70 134 62 146Z" fill="#23252d"/>
    <path d="M58 156 L52 200 M142 156 L148 200" stroke="#15161b" stroke-width="12"/>
    <rect x="88" y="112" width="24" height="28" fill="#d9b39a"/>
    ${turn ? '<path d="M128 74 C138 80 140 98 132 110 C128 118 120 122 114 122 L114 80Z" fill="#e6c0a6"/><path d="M128 96 q5 2 3 6" stroke="#b98b74" stroke-width="2" fill="none"/>' : ''}
    <ellipse cx="62" cy="88" rx="7" ry="12" fill="#e0b89e"/><ellipse cx="138" cy="88" rx="7" ry="12" fill="${turn ? '#e6c0a6' : '#e0b89e'}"/>
    <path d="M60 80 C56 40 80 28 100 28 C122 28 144 40 140 80 C140 104 126 118 100 118 C76 118 60 104 60 80Z" fill="#2a1d16"/>
    <path d="M72 50 C84 38 116 38 128 50" stroke="#3e2b20" stroke-width="3" fill="none"/>
    </g>
    <path d="M136 52 C142 62 142 74 138 82" stroke="#9fd7ff" stroke-width="2.4" fill="none" opacity=".6"/>
  </svg>`;
}

export function needleSvg({ expr = 'cheerful', pose = 'idle', t = 0 } = {}) {
  const s = Math.sin(t * Math.PI * 2);
  const hop = pose === 'hop' ? -Math.abs(s) * 10 : 0;
  const brow =
    expr === 'determined'
      ? '<path d="M37 70 L47 74 M63 74 L73 70" stroke="#3a2a48" stroke-width="2.6" stroke-linecap="round"/>'
      : expr === 'sneaky'
        ? '<path d="M37 72 L47 72 M63 70 L73 74" stroke="#3a2a48" stroke-width="2.6" stroke-linecap="round"/>'
        : '<path d="M38 69 Q42 66 47 69 M63 69 Q68 66 72 69" stroke="#3a2a48" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  const eyes =
    expr === 'sneaky'
      ? '<path d="M38 80 Q42 77 47 80 Q42 82 38 80Z M63 80 Q68 77 72 80 Q68 82 63 80Z" fill="#3a2a48"/>'
      : '<ellipse cx="43" cy="80" rx="5" ry="6.5" fill="#fff" stroke="#3a2a48" stroke-width="1.6"/><ellipse cx="67" cy="80" rx="5" ry="6.5" fill="#fff" stroke="#3a2a48" stroke-width="1.6"/><circle cx="44" cy="81" r="2.6" fill="#3a2a48"/><circle cx="68" cy="81" r="2.6" fill="#3a2a48"/><path d="M37 74 l-3 -3 M73 74 l3 -3" stroke="#3a2a48" stroke-width="1.6" stroke-linecap="round"/>';
  const mouth = expr === 'determined' ? '<path d="M48 94 Q55 90 62 94" stroke="#3a2a48" stroke-width="2.4" fill="none" stroke-linecap="round"/>' : '<path d="M46 92 Q55 102 64 92 Q55 97 46 92Z" fill="#c43a5a"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 170">
    <g transform="translate(0 ${hop})">
      <path d="M55 132 V156" stroke="#9aa3b8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="55" cy="159" r="7" fill="#ff8a3d" stroke="#d1631c" stroke-width="2"/>
      <path d="M48 128 H62 L59 136 H51Z" fill="#c7d3e6"/>
      <rect x="30" y="54" width="50" height="76" rx="12" fill="#e8f6ff" stroke="#8fb7d9" stroke-width="2.4"/>
      <path d="M32 106 H78 V118 Q78 128 68 128 H42 Q32 128 32 118Z" fill="#ff9ec4" opacity=".85"/>
      <path d="M72 64 h6 M72 74 h4 M72 84 h6 M72 94 h4" stroke="#8fb7d9" stroke-width="1.6"/>
      ${brow}${eyes}${mouth}
      <ellipse cx="38" cy="90" rx="4" ry="2.4" fill="#ffb3c8" opacity=".7"/><ellipse cx="72" cy="90" rx="4" ry="2.4" fill="#ffb3c8" opacity=".7"/>
      <rect x="22" y="48" width="66" height="8" rx="4" fill="#c7d3e6" stroke="#8fb7d9" stroke-width="1.6"/>
      <rect x="51" y="24" width="8" height="26" fill="#c7d3e6"/>
      <path d="M36 26 Q55 6 74 26 L70 30 H40Z" fill="#fff" stroke="#d6dbe8" stroke-width="1.6"/>
      <path d="M53 13 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4Z" fill="#e2405f"/>
      <path d="M30 92 L16 ${100 + s * 6} M80 92 L94 ${100 - s * 6}" stroke="#8fb7d9" stroke-width="3" stroke-linecap="round"/>
      <circle cx="15" cy="${101 + s * 6}" r="4.4" fill="#7fd0c8"/><circle cx="95" cy="${101 - s * 6}" r="4.4" fill="#7fd0c8"/>
    </g>
  </svg>`;
}

/** Uncle Munther's expressions: neutral, proud, confused, sleepy, delighted. */
export const MUNTHER_EXPRESSIONS = ['neutral', 'proud', 'confused', 'sleepy', 'delighted'];

function muntherPortrait(expr = 'neutral') {
  const id = `m${++uid}`;
  const e = MUNTHER_EXPRESSIONS.includes(expr) ? expr : 'neutral';
  const lids =
    e === 'sleepy'
      ? '<path d="M54 92 Q76 84 100 96 M100 96 Q124 84 146 92" fill="#6b5a86"/><path d="M52 98 H100 M100 98 H148" stroke="#6b5a86" stroke-width="14"/>'
      : e === 'proud'
        ? '<path d="M54 86 Q76 80 98 88 L98 92 L54 92Z M102 88 Q124 80 146 86 L146 92 L102 92Z" fill="#6b5a86"/>'
        : '';
  const brows =
    e === 'confused'
      ? '<path d="M56 70 L92 78 M108 74 L144 66" stroke="#4a3d60" stroke-width="5" stroke-linecap="round"/><text x="150" y="62" font-size="30" font-weight="700" fill="#ffd977" font-family="sans-serif">?</text>'
      : e === 'delighted'
        ? '<path d="M56 74 Q74 64 92 74 M108 74 Q126 64 144 74" stroke="#4a3d60" stroke-width="4" fill="none" stroke-linecap="round"/>'
        : '';
  const tilt = e === 'confused' ? -8 : e === 'proud' ? -3 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>${lightingDefs(id)}</defs>
    <g transform="rotate(${tilt} 100 120)" filter="url(#v3d-${id})">
    <ellipse cx="100" cy="126" rx="66" ry="70" fill="#6b5a86"/>
    <ellipse cx="100" cy="146" rx="42" ry="44" fill="#c9b8de"/>
    <path d="M70 150 q10 6 20 0 M90 166 q10 6 20 0 M110 150 q10 6 20 0" stroke="#9c88b8" stroke-width="3" fill="none"/>
    <path d="M44 62 L60 92 L74 70Z M156 62 L140 92 L126 70Z" fill="#6b5a86"/>
    <circle cx="76" cy="98" r="24" fill="#fff6dc" stroke="#d8a73a" stroke-width="5"/><circle cx="124" cy="98" r="24" fill="#fff6dc" stroke="#d8a73a" stroke-width="5"/>
    <path d="M100 96 h0" stroke="#d8a73a" stroke-width="5"/><path d="M98 98 H102" stroke="#d8a73a" stroke-width="5"/>
    <circle cx="78" cy="100" r="9" fill="#2a2140"/><circle cx="122" cy="100" r="9" fill="#2a2140"/><circle cx="81" cy="97" r="3" fill="#fff"/><circle cx="125" cy="97" r="3" fill="#fff"/>
    <path d="M92 114 L100 132 L108 114Z" fill="#e8a33a"/>
    <path d="M44 182 Q100 196 156 182 L150 168 Q100 180 50 168Z" fill="#2b3a8c"/>
    <path d="M150 40 L168 92" stroke="#f2c14e" stroke-width="7" stroke-linecap="round"/><path d="M150 40 l-3 -9 l7 3Z" fill="#3a2a48"/><path d="M166 86 l4 10" stroke="#ff9ec4" stroke-width="7" stroke-linecap="round"/>
    <circle cx="70" cy="178" r="2.4" fill="#ffe28a"/><circle cx="100" cy="184" r="2.4" fill="#ffe28a"/><circle cx="130" cy="178" r="2.4" fill="#ffe28a"/>
    </g>
    <g transform="rotate(${tilt} 100 120)">${lids}${brows}${e === 'delighted' ? '<path d="M94 132 Q100 140 106 132" stroke="#a46a1a" stroke-width="3" fill="none"/>' : ''}</g>
  </svg>`;
}

function sultanPortrait() {
  const eyes = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.12 + (i / 8) * 0.76);
    const x = 100 - Math.cos(a) * 82;
    const y = 160 - Math.sin(a) * 82;
    return `<path d="M100 160 L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#2f8f6a" stroke-width="5"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="12" ry="15" fill="#1f7a5a"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="9" fill="#e2b544"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#1d3fa0"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    ${eyes}
    <path d="M86 200 C80 160 84 120 92 96 C96 84 104 84 108 96 C116 120 120 160 114 200Z" fill="#1d5fd0"/>
    <circle cx="100" cy="86" r="18" fill="#1d5fd0"/>
    <path d="M100 68 L96 50 M100 68 L100 46 M100 68 L104 50" stroke="#1d5fd0" stroke-width="2"/><circle cx="96" cy="49" r="3.4" fill="#2bb5a0"/><circle cx="100" cy="45" r="3.4" fill="#2bb5a0"/><circle cx="104" cy="49" r="3.4" fill="#2bb5a0"/>
    <path d="M104 82 Q112 80 112 88 Q106 86 104 88Z" fill="#fff"/><path d="M107 84 h2" stroke="#16161c" stroke-width="2.4"/>
    <path d="M90 82 Q96 79 99 84" stroke="#16161c" stroke-width="2" fill="none"/>
    <path d="M116 88 L130 92 L116 94Z" fill="#cfc4a8"/>
  </svg>`;
}

function gatePortrait() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <path d="M30 200 V90 A70 70 0 0 1 170 90 V200" fill="none" stroke="#2d2f45" stroke-width="12"/>
    <path d="M60 200 V96 M100 200 V70 M140 200 V96" stroke="#2d2f45" stroke-width="8"/>
    <path d="M58 104 C58 84 84 84 84 104 C84 114 70 116 66 108" stroke="#7aa2ff" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M142 104 C142 84 116 84 116 104 C116 114 130 116 134 108" stroke="#7aa2ff" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="72" cy="100" r="5" fill="#9fd7ff"/><circle cx="128" cy="100" r="5" fill="#9fd7ff"/>
    <path d="M70 140 Q100 158 130 140" stroke="#7aa2ff" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="44" cy="74" r="10" fill="#3f6fe0"/><circle cx="156" cy="74" r="10" fill="#3f6fe0"/><circle cx="100" cy="30" r="12" fill="#3f6fe0"/>
  </svg>`;
}

function phonePortrait() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect x="58" y="22" width="84" height="156" rx="16" fill="#16161c"/>
    <rect x="64" y="34" width="72" height="132" rx="8" fill="#0c1640"/>
    <circle cx="100" cy="96" r="30" fill="#2b4fd0" opacity=".35"/>
    <text x="100" y="110" text-anchor="middle" font-size="40" font-family="serif" fill="#9fd7ff">R</text>
    <rect x="86" y="27" width="28" height="4" rx="2" fill="#2d2d36"/>
    <path d="M76 150 h48" stroke="#9fd7ff" stroke-width="3" opacity=".5"/>
  </svg>`;
}

/** Ryan's "playing version" on the laptop: a backlit silhouette on a screen. */
function ryanScreenPortrait() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect x="18" y="26" width="164" height="118" rx="12" fill="#16161c"/>
    <rect x="26" y="34" width="148" height="100" rx="6" fill="#0c1640"/>
    <radialGradient id="rsg" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#9fd7ff" stop-opacity=".55"/><stop offset="1" stop-color="#9fd7ff" stop-opacity="0"/></radialGradient>
    <rect x="26" y="34" width="148" height="100" rx="6" fill="url(#rsg)"/>
    <path d="M62 134 C66 112 82 104 100 104 C118 104 134 112 138 134Z" fill="#1b1d24"/>
    <path d="M80 76 C78 58 90 50 100 50 C112 50 122 58 120 76 C120 88 112 96 100 96 C88 96 80 88 80 76Z" fill="#17120f"/>
    <path d="M80 76 C78 58 90 50 100 50 C112 50 122 58 120 76" stroke="#9fd7ff" stroke-width="2" fill="none" opacity=".8"/>
    <path d="M34 42 h28" stroke="#7fd38a" stroke-width="3"/><text x="166" y="48" text-anchor="end" font-size="10" font-family="monospace" fill="#9fd7ff">ryan.play</text>
    <path d="M6 150 H194 L182 168 H18Z" fill="#9aa3b8"/><rect x="84" y="152" width="32" height="5" rx="2" fill="#6d7488"/>
  </svg>`;
}

const glyph = (char, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="76" fill="${bg}"/><text x="100" y="126" text-anchor="middle" font-size="80" font-family="sans-serif">${char}</text></svg>`;

/** speaker id → display name + portrait renderer */
export const CAST = {
  ryan: { name: 'ريان', portrait: ({ expr }) => ryanPortrait({ expr }) },
  needle: { name: 'الممرضة إبرة', portrait: ({ expr }) => needleSvg({ expr }) },
  munther: { name: 'العم منذر', portrait: ({ expr } = {}) => muntherPortrait(expr) },
  sultan: { name: 'السلطان', portrait: () => sultanPortrait() },
  gate: { name: 'البوابة', portrait: () => gatePortrait() },
  phone: { name: 'الموبايل', portrait: () => phonePortrait() },
  ryanpc: { name: 'ريان (نسخة اللعب)', portrait: () => ryanScreenPortrait() },
  sign: { name: 'لافتة', portrait: () => glyph('🪧', '#3b3d7e') },
  note: { name: 'ورقة', portrait: () => glyph('📜', '#3b3d7e') },
};

/**
 * Ryan's character-sheet views. The story keeps his face hidden: the side
 * view is a silhouette against moonlight, the "front" is backlit (face in
 * shadow). Hair, hoodie, backpack and proportions match ryanSprite.
 */
export const RYAN_VIEWS = ['back', 'turn', 'side', 'front-backlit'];

export function ryanView(view = 'back') {
  if (view === 'back') return ryanSprite({});
  if (view === 'turn') return ryanPortrait({ expr: 'turn' });
  const id = `rv${++uid}`;
  const rim = '#9fd7ff';
  if (view === 'side') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200">
      <defs>${lightingDefs(id)}</defs>
      <g filter="url(#v3d-${id})">
        <path d="M42 138 L40 188 L54 188 L55 140Z" fill="#2c3e5c"/><path d="M38 186 H58 L60 195 H36Z" fill="#1c1d24"/>
        <path d="M34 72 C34 62 44 58 54 58 C62 58 68 64 68 74 L70 142 L34 142Z" fill="#23252d"/>
        <path d="M22 76 C14 80 14 118 22 128 L34 126 L34 76Z" fill="#111216"/>
        <path d="M60 78 L66 126 L60 128 L54 82Z" fill="#1d1f26"/>
        <rect x="48" y="48" width="10" height="12" fill="#3a3038"/>
        <path d="M40 34 C40 16 52 10 60 12 C70 14 74 24 72 36 C72 46 66 52 56 52 C46 52 40 46 40 34Z" fill="#1d1612"/>
        <path d="M70 30 C74 34 75 40 72 44" stroke="${rim}" stroke-width="1.6" fill="none"/>
      </g>
      <path d="M68 74 L70 142 M72 36 C72 46 66 52 60 52" stroke="${rim}" stroke-width="1.2" fill="none" opacity=".7"/>
    </svg>`;
  }
  // front-backlit
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200">
    <defs>${lightingDefs(id)}<radialGradient id="halo${id}" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="${rim}" stop-opacity=".55"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="50" cy="70" rx="48" ry="70" fill="url(#halo${id})"/>
    <g filter="url(#v3d-${id})">
      <path d="M36 138 L34 188 L48 188 L49 140Z M51 140 L52 188 L66 188 L64 138Z" fill="#1f2a40"/>
      <path d="M24 70 C26 62 36 58 50 58 C64 58 74 62 76 70 L78 142 L22 142Z" fill="#1b1d24"/>
      <path d="M22 72 L14 126 L22 128 L28 84Z M78 72 L86 126 L78 128 L72 84Z" fill="#16171d"/>
      <path d="M32 72 L36 64 M68 72 L64 64" stroke="#0c0d12" stroke-width="5"/>
      <rect x="44" y="48" width="12" height="12" fill="#2a2228"/>
      <path d="M32 36 C30 18 42 12 50 12 C60 12 70 18 68 36 C68 46 62 52 50 52 C38 52 32 46 32 36Z" fill="#17120f"/>
    </g>
    <path d="M32 36 C30 18 42 12 50 12 C60 12 70 18 68 36 M24 70 C26 62 36 58 50 58 C64 58 74 62 76 70" stroke="${rim}" stroke-width="1.4" fill="none" opacity=".8"/>
  </svg>`;
}
