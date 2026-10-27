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

/*
 * Ryan's look (from the owner's reference, as a cartoon): tall and athletic —
 * broad shoulders tapering to the waist, strong arms with the hoodie sleeves
 * pushed up — short dark hair faded at the sides, a full beard, glasses.
 * The story still never shows his face straight on: he is seen from behind,
 * half-turned, or backlit.
 */
/** Short hair seen from behind: dark on top, fading lighter toward the neck (no hard edge). */
const fadeDef = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15100d"/><stop offset=".55" stop-color="#1f1712"/><stop offset="1" stop-color="#4a382d"/></linearGradient>`;

const RYAN = { hair: '#1a1411', fade: '#33271f', beard: '#2a1e18', skin: '#e0b597', skinShade: '#c9977b', hoodie: '#2b2f3a', hoodieShade: '#22252e', pack: '#15161b', jeans: '#3a5682', frame: '#121216' };

export function ryanSprite({ pose = 'idle', t = 0, shadow = false, size } = {}) {
  const s = Math.sin(t * Math.PI * 2);
  const walk = pose === 'walk';
  const lf = walk ? 3 * s : 0;
  const sw = walk ? s * 3 : 0;
  const id = `r${++uid}`;
  const fill = (c) => (shadow ? `url(#sh${id})` : c);
  const dims = size ? `width="${size / 2}" height="${size}"` : '';
  const R = RYAN;
  // an arm: sleeve over a muscular upper arm, bare forearm, hand (side = -1 left, 1 right)
  const arm = (side, swing) => {
    const x = (v) => 50 + side * v;
    return `<path d="M${x(31)} 64 C${x(41)} 72 ${x(42)} 90 ${x(39)} ${104 + swing} L${x(28)} ${104 + swing} C${x(27)} 92 ${x(25)} 80 ${x(24)} 70Z" fill="${fill(side < 0 ? R.hoodieShade : R.hoodie)}"/>
      <path d="M${x(39)} ${103 + swing} C${x(40.5)} ${114 + swing} ${x(39)} ${124 + swing} ${x(36)} ${131 + swing} L${x(29)} ${131 + swing} C${x(28.5)} ${122 + swing} ${x(28)} ${112 + swing} ${x(28)} ${103 + swing}Z" fill="${fill(R.skin)}"/>
      <path d="M${x(39.6)} ${101 + swing} L${x(27.4)} ${101 + swing} L${x(27.6)} ${106 + swing} L${x(39.4)} ${106 + swing}Z" fill="${fill(R.hoodieShade)}"/>
      <ellipse cx="${x(32.5)}" cy="${134 + swing}" rx="5.4" ry="5.8" fill="${fill(R.skin)}"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" ${dims}>
    <defs><linearGradient id="sh${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b0d22"/><stop offset=".85" stop-color="#151a3a"/><stop offset="1" stop-color="#6fd3ff"/></linearGradient>${fadeDef(`hd${id}`)}${shadow ? '' : lightingDefs(id)}</defs>
    <g opacity="${shadow ? 0.92 : 1}" ${shadow ? '' : `filter="url(#v3d-${id})"`}>
      <path d="M35 136 L33 ${186 - lf} L48 ${186 - lf} L49.5 140Z" fill="${fill(R.jeans)}"/>
      <path d="M50.5 140 L52 ${186 + lf} L67 ${186 + lf} L65 136Z" fill="${fill('#33507a')}"/>
      <path d="M30 ${184 - lf} H49 V${193 - lf} H28Z" fill="${fill('#24252c')}"/><path d="M28 ${191 - lf} H49 V${195 - lf} H28Z" fill="${fill('#e9e9ef')}"/>
      <path d="M51 ${184 + lf} H70 L72 ${193 + lf} H51Z" fill="${fill('#24252c')}"/><path d="M51 ${191 + lf} H72 V${195 + lf} H51Z" fill="${fill('#e9e9ef')}"/>
      ${arm(-1, sw)}${arm(1, -sw)}
      <path d="M31 140 L28 102 C25 88 18 78 18 70 C19 61 33 57 50 57 C67 57 81 61 82 70 C82 78 75 88 72 102 L69 140Z" fill="${fill(R.hoodie)}"/>
      <path d="M31 132 H69 L69 141 H31Z" fill="${fill(R.hoodieShade)}"/>
      <path d="M36 60 C41 70 59 70 64 60 C60 54 40 54 36 60Z" fill="${fill(R.hoodieShade)}"/>
      <rect x="32" y="74" width="36" height="50" rx="8" fill="${fill(R.pack)}"/>
      <rect x="37" y="97" width="26" height="19" rx="5" fill="${fill('#1d1e24')}"/>
      <path d="M37 74 L35 62 M63 74 L65 62" stroke="${shadow ? '#0b0d22' : '#0f1014'}" stroke-width="4.4"/>
      ${shadow ? '' : '<path d="M46 104 L50 110 L54 104" stroke="#3a3d48" stroke-width="2" fill="none"/>'}
      <path d="M42.5 45 H57.5 L58.5 59 H41.5Z" fill="${fill(R.skinShade)}"/>
      <ellipse cx="33.5" cy="36" rx="3.4" ry="5.6" fill="${fill(R.skin)}"/><ellipse cx="66.5" cy="36" rx="3.4" ry="5.6" fill="${fill(R.skin)}"/>
      <path d="M34.5 38 C35 46 39 50.5 45 51.5 L55 51.5 C61 50.5 65 46 65.5 38 C63 47 37 47 34.5 38Z" fill="${fill(R.beard)}"/>
      <path d="M34 34 C33 18 42 12 50 12 C58 12 67 18 66 34 C66 43 61 48 50 48 C39 48 34 43 34 34Z" fill="${shadow ? fill('') : `url(#hd${id})`}"/>
      ${shadow ? '' : `<path d="M38 46 C44 48.5 56 48.5 62 46" stroke="${R.fade}" stroke-width="1.2" fill="none"/>
      <path d="M31.5 31.5 C34 32 35 33.5 34.6 36 M68.5 31.5 C66 32 65 33.5 65.4 36" stroke="${R.frame}" stroke-width="1.3" fill="none"/>
      <path d="M40 18 C46 14.5 54 14.5 60 18 M38 25 C44 22 56 22 62 25" stroke="#2c211b" stroke-width="1.2" fill="none" opacity=".8"/>`}
    </g>
  </svg>`;
}

export function ryanPortrait({ expr = 'back' } = {}) {
  const turn = expr === 'turn';
  const id = `rp${++uid}`;
  const R = RYAN;
  // half-turned: his cheek, beard, the edge of his glasses and the tip of his nose
  // (drawn after the head, only beyond its right edge, x > 134)
  const profile = `<path d="M133 66 C146 72 151 88 147 102 C144 112 137 118 130 120 C133 104 135 84 133 66Z" fill="${R.skin}"/>
      <path d="M131 100 C138 100 144 98 148 96 C147 110 140 120 128 122 C131 114 132 106 131 100Z" fill="${R.beard}"/>
      <path d="M147 84 q5 3 2 8 q-2 1 -4 0" fill="${R.skin}" stroke="${R.skinShade}" stroke-width="1.2"/>
      <path d="M135 76 L148 77.5 L147 88 C143 90 139 89 136 87Z" fill="rgba(159,215,255,.22)" stroke="${R.frame}" stroke-width="2.4"/>
      <path d="M136 79 L130 80" stroke="${R.frame}" stroke-width="2.4"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs><radialGradient id="moonlit${id}" cx=".7" cy=".2" r=".9"><stop offset="0" stop-color="#9fd7ff" stop-opacity=".55"/><stop offset="1" stop-color="#9fd7ff" stop-opacity="0"/></radialGradient>${fadeDef(`hd${id}`)}${lightingDefs(id)}</defs>
    <circle cx="140" cy="40" r="90" fill="url(#moonlit${id})"/>
    <g filter="url(#v3d-${id})">
    <path d="M6 200 C10 160 44 140 100 138 C156 140 190 160 194 200Z" fill="${R.hoodie}"/>
    <path d="M58 146 C68 162 132 162 142 146 C132 132 68 132 58 146Z" fill="${R.hoodieShade}"/>
    <path d="M54 156 L46 200 M146 156 L154 200" stroke="${R.pack}" stroke-width="13"/>
    <path d="M84 108 H116 L118 142 H82Z" fill="${R.skinShade}"/>
    <ellipse cx="64" cy="86" rx="7" ry="12" fill="${R.skin}"/><ellipse cx="136" cy="86" rx="7" ry="12" fill="${R.skin}"/>
    <path d="M66 92 C68 108 80 118 96 120 L104 120 C120 118 132 108 134 92 C128 112 72 112 66 92Z" fill="${R.beard}"/>
    <path d="M64 78 C62 44 82 30 100 30 C118 30 138 44 136 78 C136 98 124 110 100 110 C76 110 64 98 64 78Z" fill="url(#hd${id})"/>
    <path d="M74 104 C88 110 112 110 126 104" stroke="${R.fade}" stroke-width="2" fill="none"/>
    <path d="M78 48 C90 40 110 40 122 48 M74 62 C88 56 112 56 126 62" stroke="#2c211b" stroke-width="2" fill="none" opacity=".8"/>
    <path d="M58 76 C64 77 68 80 67 86 M142 76 C136 77 132 80 133 86" stroke="${R.frame}" stroke-width="2.6" fill="none"/>
    ${turn ? profile : ''}
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
    // silhouette against moonlight: broad chest, strong arm, beard and glasses in profile
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200">
      <defs>${lightingDefs(id)}</defs>
      <g filter="url(#v3d-${id})">
        <path d="M40 138 L38 188 L54 188 L56 140Z" fill="#2c3e5c"/><path d="M36 186 H58 L61 195 H34Z" fill="#1c1d24"/>
        <path d="M30 74 C30 62 42 57 54 57 C66 57 74 64 74 78 C74 92 70 104 68 112 L68 142 L34 142 L32 110 C30 98 30 86 30 74Z" fill="#23252d"/>
        <path d="M18 76 C10 80 10 118 18 128 L31 126 L31 76Z" fill="#111216"/>
        <path d="M58 72 C68 78 70 96 66 108 L66 128 L58 130 L56 108 C54 96 54 84 58 72Z" fill="#1d1f26"/>
        <rect x="46" y="44" width="13" height="15" fill="#3a3038"/>
        <path d="M58 38 C64 44 66 50 62 54 C56 56 50 54 46 50Z" fill="#141010"/>
        <path d="M40 32 C40 15 52 10 60 12 C70 14 74 24 72 34 C72 44 66 50 56 50 C46 50 40 44 40 32Z" fill="#1d1612"/>
        <path d="M62 31 L72 31" stroke="#0a0a0c" stroke-width="2"/>
      </g>
      <path d="M72 78 C74 92 70 104 68 112 M72 34 C72 44 66 50 60 52" stroke="${rim}" stroke-width="1.2" fill="none" opacity=".7"/>
      <path d="M70 29 C74 33 75 39 72 43" stroke="${rim}" stroke-width="1.6" fill="none"/>
    </svg>`;
  }
  // front-backlit: face in shadow; the light catches his glasses, beard and shoulders
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200">
    <defs>${lightingDefs(id)}<radialGradient id="halo${id}" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="${rim}" stop-opacity=".55"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="50" cy="70" rx="48" ry="70" fill="url(#halo${id})"/>
    <g filter="url(#v3d-${id})">
      <path d="M35 136 L33 188 L48 188 L49.5 140Z M50.5 140 L52 188 L67 188 L65 136Z" fill="#1f2a40"/>
      <path d="M31 140 L28 102 C25 88 18 78 18 70 C19 61 33 57 50 57 C67 57 81 61 82 70 C82 78 75 88 72 102 L69 140Z" fill="#1b1d24"/>
      <path d="M19 66 C9 74 8 92 11 104 L13 131 L21 131 L23 104 C25 92 26 80 26 70Z M81 66 C91 74 92 92 89 104 L87 131 L79 131 L77 104 C75 92 74 80 74 70Z" fill="#16171d"/>
      <path d="M32 72 L36 63 M68 72 L64 63" stroke="#0c0d12" stroke-width="5"/>
      <path d="M42.5 45 H57.5 L58.5 59 H41.5Z" fill="#2a2228"/>
      <path d="M34 34 C33 18 42 12 50 12 C58 12 67 18 66 34 C66 46 60 53 50 53 C40 53 34 46 34 34Z" fill="#17120f"/>
      <path d="M36 38 C37 48 42 53 50 54 C58 53 63 48 64 38 C58 46 42 46 36 38Z" fill="#0f0b09"/>
    </g>
    <path d="M38 31 h9 M53 31 h9" stroke="${rim}" stroke-width="1.6" opacity=".85"/>
    <path d="M34 34 C33 18 42 12 50 12 C58 12 67 18 66 34 M18 70 C19 61 33 57 50 57 C67 57 81 61 82 70" stroke="${rim}" stroke-width="1.4" fill="none" opacity=".8"/>
  </svg>`;
}
