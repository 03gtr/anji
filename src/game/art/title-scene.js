/**
 * The title screen's key art, drawn in code (public, no private images):
 * a midnight garden of luminous blue roses, warm lanterns, and an open iron
 * gate full of light, with Ryan walking into it seen from behind — the
 * composition of the owner's reference artwork. Anji and Snooki stand in
 * front of it as DOM layers (title.js), with a row of roses in front of them.
 *
 * Two compositions from one drawing: WIDE (1600×900; gate in the middle,
 * room on the left for the cast and on the right for the title) and TALL
 * (900×1600 for portrait phones; gate high up, cast in front of it, a dark
 * garden at the bottom under the text). Glows are radial gradients, not
 * blur filters, so it stays cheap on phones.
 */
import { ryanSprite } from '../characters/cast.js';

const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export const TITLE_LAYOUTS = {
  wide: { W: 1600, H: 900, gateX: 800, gateBase: 700, gateH: 380, wallH: 150, moon: [1290, 150, 44], horizon: 520, lamps: [210, 1390] },
  // portrait: the gate sits right of centre and high, so Anji and Snooki (bottom-left) don't hide Ryan
  tall: { W: 900, H: 1600, gateX: 640, gateBase: 640, gateH: 380, wallH: 140, moon: [230, 150, 44], horizon: 470, lamps: [70, 880] },
};

const DEFS = `<defs>
  <linearGradient id="tsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a2a"/><stop offset=".45" stop-color="#141a52"/><stop offset=".75" stop-color="#2b2464"/><stop offset="1" stop-color="#3b2a63"/></linearGradient>
  <radialGradient id="tsMoon"><stop offset="0" stop-color="#fff4d6" stop-opacity=".5"/><stop offset="1" stop-color="#fff4d6" stop-opacity="0"/></radialGradient>
  <radialGradient id="tsWarm"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb850" stop-opacity=".45"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
  <radialGradient id="tsGate" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#fffaf0"/><stop offset=".3" stop-color="#ffe7b0"/><stop offset=".65" stop-color="#ffb860" stop-opacity=".75"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
  <radialGradient id="tsBlue"><stop offset="0" stop-color="#8fd0ff" stop-opacity=".8"/><stop offset="1" stop-color="#3f7dff" stop-opacity="0"/></radialGradient>
  <linearGradient id="tsPath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffdca0" stop-opacity=".85"/><stop offset=".5" stop-color="#7a6a88" stop-opacity=".55"/><stop offset="1" stop-color="#1c1a3a" stop-opacity=".2"/></linearGradient>
  <linearGradient id="tsWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d63"/><stop offset="1" stop-color="#1c1d3a"/></linearGradient>
  <linearGradient id="tsGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14183c"/><stop offset="1" stop-color="#05061a"/></linearGradient>
  <linearGradient id="tsFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a2a" stop-opacity="0"/><stop offset=".45" stop-color="#070a2a" stop-opacity=".85"/><stop offset="1" stop-color="#05061a"/></linearGradient>
  <linearGradient id="tsVignette" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05061a" stop-opacity=".55"/><stop offset=".25" stop-color="#05061a" stop-opacity="0"/><stop offset=".7" stop-color="#05061a" stop-opacity="0"/><stop offset="1" stop-color="#05061a" stop-opacity=".85"/></linearGradient>
</defs>`;

/** A rose head: layered petals with a spiral, plus a soft glow for the blue ones. */
export function rose(x, y, r, color = 'blue', glow = true) {
  const c = color === 'blue' ? ['#1d4fd6', '#3f7dff', '#8cc6ff'] : color === 'pink' ? ['#b0305a', '#e2507c', '#ffb0c6'] : ['#8e1b2b', '#c9303f', '#ff8a8a'];
  return `${glow && color === 'blue' ? `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#tsBlue)" opacity=".55"/>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="${c[0]}"/><circle cx="${x - r * 0.15}" cy="${y - r * 0.15}" r="${r * 0.72}" fill="${c[1]}"/><path d="M${x - r * 0.35} ${y} a${r * 0.36} ${r * 0.36} 0 1 1 ${r * 0.5} ${r * 0.28} a${r * 0.2} ${r * 0.2} 0 1 1 ${-r * 0.22} ${-r * 0.3}" stroke="${c[2]}" stroke-width="${Math.max(1, r * 0.16)}" fill="none" stroke-linecap="round"/>`;
}

/** A clump of leaves with roses on it. */
function bush(x, y, w, h, n, r, seed, colors = ['blue', 'blue', 'blue', 'pink']) {
  const rnd = rng(seed);
  let out = '';
  for (let i = 0; i < 6; i++) {
    const bx = x + (rnd() - 0.5) * w * 0.8;
    out += `<ellipse cx="${bx}" cy="${y - rnd() * h * 0.4}" rx="${w * (0.22 + rnd() * 0.16)}" ry="${h * (0.4 + rnd() * 0.2)}" fill="${['#16352f', '#1d4238', '#12302b'][i % 3]}"/>`;
  }
  for (let i = 0; i < n; i++) out += rose(x + (rnd() - 0.5) * w * 0.85, y - h * 0.15 - rnd() * h * 0.7, r * (0.7 + rnd() * 0.5), colors[Math.floor(rnd() * colors.length)]);
  return out;
}

function lantern(x, top, h, glow = 1) {
  return `<circle cx="${x}" cy="${top + 18}" r="${150 * glow}" fill="url(#tsWarm)"/>
    <rect x="${x - 4}" y="${top + 34}" width="8" height="${h - 34}" fill="#14152a"/>
    <path d="M${x - 20} ${top + 6} L${x} ${top - 12} L${x + 20} ${top + 6}Z" fill="#14152a"/>
    <rect x="${x - 15}" y="${top + 6}" width="30" height="30" rx="3" fill="#ffd27a"/>
    <path d="M${x - 15} ${top + 21} H${x + 15} M${x} ${top + 6} V${top + 36}" stroke="#7a4e1c" stroke-width="2"/>
    <rect x="${x - 18}" y="${top + 34}" width="36" height="6" fill="#14152a"/>`;
}

/** The open iron gate with the light behind it, its stone posts and lanterns. */
function gate(L) {
  const { gateX: x, gateBase: b, gateH: h } = L;
  const half = h * 0.34;
  const top = b - h;
  const archTop = top - h * 0.12;
  const bars = (x0, x1, n) => Array.from({ length: n }, (_, i) => x0 + ((x1 - x0) * (i + 0.5)) / n);
  const leftLeaf = bars(x - half - half * 0.55, x - half, 5)
    .map((bx, i) => `<path d="M${bx} ${top + 30 + i * 6} V${b - 8 + i * 4}" stroke="#0c0d1c" stroke-width="5"/>`)
    .join('');
  const rightLeaf = bars(x + half, x + half + half * 0.55, 5)
    .map((bx, i) => `<path d="M${bx} ${top + 54 - i * 6} V${b + 12 - i * 4}" stroke="#0c0d1c" stroke-width="5"/>`)
    .join('');
  return `<ellipse cx="${x}" cy="${b - h * 0.32}" rx="${half * 2.6}" ry="${h * 0.8}" fill="url(#tsGate)"/>
    <path d="M${x - half} ${b} L${x - half} ${top} Q${x} ${archTop - 40} ${x + half} ${top} L${x + half} ${b}Z" fill="url(#tsGate)"/>
    <path d="M${x - half * 0.5} ${b} L${x - half * 0.12} ${top + h * 0.55} L${x + half * 0.12} ${top + h * 0.55} L${x + half * 0.5} ${b}Z" fill="#fff1cf" opacity=".55"/>
    <path d="M${x - half - 4} ${top + 4} Q${x} ${archTop - 46} ${x + half + 4} ${top + 4}" stroke="#0c0d1c" stroke-width="9" fill="none"/>
    <path d="M${x - half + 14} ${top + 20} Q${x} ${archTop - 18} ${x + half - 14} ${top + 20}" stroke="#0c0d1c" stroke-width="4" fill="none"/>
    ${leftLeaf}<path d="M${x - half - half * 0.55} ${top + 40} L${x - half} ${top + 30} M${x - half - half * 0.55} ${b - 30} L${x - half} ${b - 8}" stroke="#0c0d1c" stroke-width="6"/>
    ${rightLeaf}<path d="M${x + half} ${top + 54} L${x + half + half * 0.55} ${top + 26} M${x + half} ${b + 12} L${x + half + half * 0.55} ${b - 6}" stroke="#0c0d1c" stroke-width="6"/>
    <rect x="${x - half - 46}" y="${top - 10}" width="44" height="${h + 14}" fill="url(#tsWall)"/>
    <rect x="${x + half + 2}" y="${top - 10}" width="44" height="${h + 14}" fill="url(#tsWall)"/>
    <rect x="${x - half - 52}" y="${top - 20}" width="56" height="14" fill="#2c2f55"/>
    <rect x="${x + half - 4}" y="${top - 20}" width="56" height="14" fill="#2c2f55"/>
    ${lantern(x - half - 24, top - 64, 44, 0.9)}${lantern(x + half + 24, top - 64, 44, 0.9)}
    ${Array.from({ length: 11 }, (_, i) => {
      const a = Math.PI * (i / 10);
      return rose(x - Math.cos(a) * (half + 10), top + 6 - Math.sin(a) * (h * 0.2 + 30), 9 + (i % 3) * 2, i % 4 === 2 ? 'pink' : 'blue');
    }).join('')}`;
}

/** Ryan, seen from behind, walking into the light (a backlit silhouette). */
function ryan(L) {
  const h = L.gateH * 0.38; // small, far into the light: he stays a mystery
  const x = L.gateX - h / 4;
  const y = L.gateBase - h - 8;
  const svg = ryanSprite({ pose: 'walk', t: 0.2, shadow: true }).replace('<svg ', `<svg x="${x}" y="${y}" width="${h / 2}" height="${h}" `);
  return `<ellipse cx="${L.gateX}" cy="${L.gateBase - 6}" rx="${h * 0.22}" ry="6" fill="#0b0c1e" opacity=".45"/>${svg}`;
}

export function titleBackdrop(kind = 'wide') {
  const L = TITLE_LAYOUTS[kind];
  const { W, H } = L;
  const rnd = rng(kind === 'wide' ? 7 : 11);
  const stars = Array.from({ length: Math.round((W * L.horizon) / 9000) }, () => {
    const r = rnd() < 0.12 ? 1.8 : 1;
    return `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * L.horizon * 0.9).toFixed(0)}" r="${r}" fill="#fff6d0" opacity="${(0.35 + rnd() * 0.6).toFixed(2)}"/>`;
  }).join('');
  const [mx, my, mr] = L.moon;
  // distant trees, a dark band behind the walls
  let trees = '';
  for (let x = -40; x < W + 80; x += 70 + rnd() * 60) trees += `<ellipse cx="${x}" cy="${L.horizon - 20 - rnd() * 60}" rx="${70 + rnd() * 50}" ry="${80 + rnd() * 70}" fill="${rnd() < 0.5 ? '#141640' : '#191b4a'}"/>`;
  const wallTop = L.gateBase - L.wallH;
  const gx0 = L.gateX - L.gateH * 0.34 - 46;
  const gx1 = L.gateX + L.gateH * 0.34 + 46;
  const walls = `<rect x="-10" y="${wallTop}" width="${gx0 + 10}" height="${L.wallH + 10}" fill="url(#tsWall)"/><rect x="${gx1}" y="${wallTop}" width="${W - gx1 + 10}" height="${L.wallH + 10}" fill="url(#tsWall)"/>
    ${Array.from({ length: Math.ceil(W / 46) }, (_, i) => (i * 46 < gx0 - 30 || i * 46 > gx1 ? `<path d="M${i * 46} ${wallTop + 4} H${i * 46 + 40}" stroke="#4a4d78" stroke-width="3" opacity=".6"/>` : '')).join('')}`;
  // ivy and roses along the wall tops
  let wallRoses = '';
  for (let x = 20; x < W; x += 120) if (x < gx0 - 40 || x > gx1 + 40) wallRoses += bush(x, wallTop + 30, 150, 70, 4, 11, Math.round(x) + 3);
  // the path from the gate to the viewer
  const pw = L.gateH * 0.18;
  const path = `<path d="M${L.gateX - pw} ${L.gateBase} L${L.gateX + pw} ${L.gateBase} L${L.gateX + W * 0.32} ${H} L${L.gateX - W * 0.32} ${H}Z" fill="url(#tsPath)"/>`;
  const ground = `<rect x="0" y="${L.gateBase}" width="${W}" height="${H - L.gateBase}" fill="url(#tsGround)"/>`;
  // foreground bushes on both sides, lamps at the edges
  let fore = '';
  for (let i = 0; i < 4; i++) {
    fore += bush(W * (0.06 + i * 0.09), L.gateBase + 70 + i * 12, 220, 150, 7, 15, 40 + i);
    fore += bush(W * (0.94 - i * 0.09), L.gateBase + 70 + i * 12, 220, 150, 7, 15, 80 + i);
  }
  const lamps = L.lamps.map((x) => lantern(x, L.gateBase - L.gateH * 0.95, L.gateH * 1.4, 1.4)).join('');
  // fireflies / bokeh
  const flies = Array.from({ length: 26 }, () => `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(L.horizon * 0.6 + rnd() * (H - L.horizon * 0.6)).toFixed(0)}" r="${(1.5 + rnd() * 2.5).toFixed(1)}" fill="${rnd() < 0.5 ? '#ffe3a3' : '#bfe4ff'}" opacity="${(0.4 + rnd() * 0.5).toFixed(2)}"/>`).join('');
  // each composition gets its own gradient ids: one of the two is always
  // display:none, and gradients inside a hidden SVG don't paint everywhere
  return scopeIds(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="title-art title-art-${kind}" aria-hidden="true" focusable="false">
    ${DEFS}
    <rect width="${W}" height="${H}" fill="url(#tsSky)"/>
    ${stars}
    <circle cx="${mx}" cy="${my}" r="${mr * 5}" fill="url(#tsMoon)"/>
    <path d="M${mx} ${my - mr} A${mr} ${mr} 0 1 0 ${mx} ${my + mr} A${mr * 0.95} ${mr * 0.95} 0 1 1 ${mx} ${my - mr}Z" fill="#fff4d6"/>
    ${trees}
    ${ground}${path}
    ${walls}${wallRoses}
    ${gate(L)}${ryan(L)}
    ${lamps}${fore}
    <rect y="${L.gateBase + 60}" width="${W}" height="${H - L.gateBase - 60}" fill="url(#tsFloor)"/>
    ${flies}
    <rect width="${W}" height="${H}" fill="url(#tsVignette)"/>
  </svg>`, kind);
}

const scopeIds = (svg, scope) => svg.replaceAll('id="ts', `id="ts-${scope}-`).replaceAll('url(#ts', `url(#ts-${scope}-`);

/**
 * The low row of roses in front of Anji and Snooki: it only hides the
 * portraits' straight bottom edge. "meet", never "none"/"slice": the roses
 * keep their shape and the bush tops are never cut by the box.
 */
export function titleRoses() {
  const rnd = rng(201);
  let leaves = '';
  let flowers = '';
  for (let i = 0; i < 16; i++) {
    const x = 10 + i * 52 + rnd() * 20;
    leaves += `<ellipse cx="${x}" cy="${86 - rnd() * 8}" rx="${44 + rnd() * 16}" ry="${30 + rnd() * 16}" fill="${['#16352f', '#1d4238', '#12302b'][i % 3]}"/>`;
  }
  for (let i = 0; i < 26; i++) flowers += rose(14 + rnd() * 772, 46 + rnd() * 34, 9 + rnd() * 5, ['blue', 'blue', 'blue', 'pink', 'red'][Math.floor(rnd() * 5)]);
  return scopeIds(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 96" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"><defs><radialGradient id="tsBlue"><stop offset="0" stop-color="#8fd0ff" stop-opacity=".8"/><stop offset="1" stop-color="#3f7dff" stop-opacity="0"/></radialGradient></defs>${leaves}${flowers}</svg>`, 'roses');
}
