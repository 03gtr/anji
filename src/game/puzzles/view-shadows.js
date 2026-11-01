/**
 * The «ظلال الفوانيس» view (Season 2, Mission 05): Lama's photograph above, the archive wall below with the
 * tree's hooks, and the basket of lanterns. She picks a lantern up and hangs it on a hook; every lantern on
 * the tree is lit and throws the stand's shadow on the wall, drawn live from the rule's geometry
 * (rules-shadows.js). Nothing here marks a hook, a lantern or a ray as right — the only judge is her eye on
 * the photograph, and the check, which says only whether the whole wall matches.
 *
 * `paintNight` draws the same tree, lanterns and rays on the world's canvas (data/m2/m05-night.js), so the
 * night she rebuilt is the night the world shows after.
 */
import { esc } from '../ui/dom.js';
import { raysOf, photoOf, mapOf, givensOf } from './rules-shadows.js';

const W = 360;
const H = 400;
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = (n) => String(n).replace(/\d/g, (d) => AR[d]);
const f1 = (v) => Math.round(v * 10) / 10;

/** Lantern bodies by shape: half-width, half-height (the view's units). */
const BODY = { small: [6, 8], round: [9, 9], tall: [6, 13], plain: [8, 10] };
const bodyOf = (l) => BODY[l.shape] || BODY.plain;

/** The branches the hooks hang from: one per height, from the trunk (left) to just past its last hook. */
function branches(config) {
  const tiers = new Map();
  for (const h of config.hooks) tiers.set(h.y, Math.max(tiers.get(h.y) ?? 0, h.x));
  return [...tiers.entries()].map(([y, x]) => ({ y: y - 9, x2: x + 22 }));
}

/* ── SVG ── */
function raySvg(peg, tip) {
  const dx = tip.x - peg.x;
  const dy = tip.y - peg.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts = [
    [peg.x + nx * 3.5, peg.y + ny * 3.5],
    [tip.x + nx * 1.6, tip.y + ny * 1.6],
    [tip.x - nx * 1.6, tip.y - ny * 1.6],
    [peg.x - nx * 3.5, peg.y - ny * 3.5],
  ];
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  // the card on the stand: its shadow at the ray's end
  return `<polygon points="${pts.map((p) => p.map(f1).join(',')).join(' ')}" fill="rgba(6,5,18,0.66)"/>
    <rect x="${f1(tip.x)}" y="${f1(tip.y - 5)}" width="11" height="10" rx="1.5" fill="rgba(6,5,18,0.66)" transform="rotate(${f1(deg)} ${f1(tip.x)} ${f1(tip.y)})"/>`;
}
function stoneSvg(id) {
  return `<defs>
    <pattern id="${id}" width="48" height="24" patternUnits="userSpaceOnUse">
      <rect width="48" height="24" fill="#2e3248"/>
      <path d="M0 0.5 H48 M0 12.5 H48 M24 0 V12 M12 12 V24 M36 12 V24" stroke="#262a3d" stroke-width="1.2"/>
    </pattern>
    <radialGradient id="${id}-glow"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
  </defs>`;
}
function pegSvg(peg) {
  return `<circle cx="${peg.x}" cy="${peg.y}" r="5" fill="#7a5a3a" stroke="#4a3522" stroke-width="1.5"/>
    <rect x="${peg.x - 4}" y="${peg.y - 13}" width="8" height="9" rx="1" fill="#f2ead8" stroke="#b9ad92" stroke-width="0.8"/>`;
}
function lanternSvg(l, hook, lit) {
  const [bw, bh] = bodyOf(l);
  const y = hook.y + l.drop;
  const glass = lit ? l.color : '#5a5468';
  return `<g class="shd-l" data-on="${hook.id}">
    <line x1="${hook.x}" y1="${hook.y}" x2="${hook.x}" y2="${y - bh}" stroke="#20160e" stroke-width="1.3"/>
    ${l.shape === 'round' ? `<circle cx="${hook.x}" cy="${y}" r="${bw}" fill="${glass}" stroke="#3a2a1a" stroke-width="1.4"/>` : `<rect x="${hook.x - bw}" y="${y - bh}" width="${bw * 2}" height="${bh * 2}" rx="3" fill="${glass}" stroke="#3a2a1a" stroke-width="1.4"/>`}
    ${lit ? `<ellipse cx="${hook.x}" cy="${y + 1}" rx="2.4" ry="3.6" fill="#fff6d2"/>` : ''}
    ${l.ribbon ? `<path d="M${hook.x - 5} ${y - bh - 2} l-4 7 M${hook.x + 5} ${y - bh - 2} l4 7" stroke="#d0506a" stroke-width="2"/>` : ''}
    <text x="${hook.x}" y="${y - bh - 4}" font-size="9" text-anchor="middle" fill="#f6efe0" stroke="#1b1426" stroke-width="2.4" paint-order="stroke">${ar(l.n)}</text>
  </g>`;
}

/** The wall as she has hung it: glows, the branches' and the stand's shadows, the tree, the lanterns. */
export function wallSvg(config, at) {
  const rays = raysOf(config, at);
  const map = mapOf(config);
  const tiers = branches(config);
  const glows = rays.map((r) => `<circle cx="${r.pos.x}" cy="${r.pos.y}" r="80" fill="url(#shd-w-glow)"/>`).join('');
  // each lit lantern throws its own branch's shadow on the wall above it (soft)
  const branchShadows = rays
    .map((r) => {
      const t = tiers.find((b) => b.y === lanternHookY(config, r.hook) - 9);
      const lift = 0.3 * (r.pos.y - t.y);
      return `<line x1="${Math.max(0, r.pos.x - 46)}" y1="${f1(t.y - lift)}" x2="${Math.min(W, r.pos.x + 46)}" y2="${f1(t.y - lift)}" stroke="rgba(6,5,18,0.2)" stroke-width="5" stroke-linecap="round"/>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="shd-wall" style="direction:ltr" role="img" aria-label="حايط الأرشيف والشجرة: ${ar(rays.length)} فانوس معلّگ">
    ${stoneSvg('shd-w')}
    <rect width="${W}" height="${H}" fill="url(#shd-w)"/>
    <rect y="${H - 8}" width="${W}" height="8" fill="#1d2130"/>
    ${glows}${branchShadows}
    ${rays.map((r) => raySvg(config.peg, r.tip)).join('')}
    ${pegSvg(config.peg)}
    <path d="M-4 ${H} L6 18 L16 18 L22 ${H}Z" fill="#2a1f18"/>
    ${tiers.map((b) => `<path d="M8 ${b.y + 4} Q ${b.x2 / 2} ${b.y - 6} ${b.x2} ${b.y}" stroke="#2a1f18" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('')}
    ${config.hooks
      .map((h) => `<path d="M${h.x} ${h.y - 9} V${h.y - 2} a3 3 0 1 0 3 3" stroke="#a89a86" stroke-width="1.6" fill="none"/>${map?.includes(h.id) ? `<path d="M${h.x + 7} ${h.y - 15} l6 6 m0 -6 l-6 6" stroke="#f3efe6" stroke-width="1.6" opacity="0.8"/>` : ''}`)
      .join('')}
    ${config.lanterns.filter((l) => at[l.id]).map((l) => lanternSvg(l, config.hooks.find((h) => h.id === at[l.id]), true)).join('')}
  </svg>`;
}
const lanternHookY = (config, hookId) => config.hooks.find((h) => h.id === hookId).y;

/** Lama's photograph: only the wall around the stand (the lanterns are above the frame), with her phone's time. */
export function photoSvg(config) {
  const rays = photoOf(config);
  const top = 205;
  return `<svg viewBox="10 ${top} 340 ${H - top}" style="direction:ltr" role="img" aria-label="صورة لمى: حامل البطاقات وظلاله على حايط الأرشيف">
    ${stoneSvg('shd-p')}
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#shd-p)"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#ffcf7a" opacity="0.12"/>
    <rect y="${H - 8}" width="${W}" height="8" fill="#1d2130"/>
    ${rays.map((r) => raySvg(config.peg, r.tip)).join('')}
    ${pegSvg(config.peg)}
    <text x="344" y="${top + 16}" font-size="11" text-anchor="end" fill="#ffb347" font-family="monospace">${esc(config.stamp || '')}</text>
  </svg>`;
}

/** A lantern in the basket: its colour, its number, and how long its cord is. */
function basketLantern(l) {
  const cord = 4 + (l.drop / 120) * 28;
  const [bw, bh] = bodyOf(l);
  const y = 6 + cord + bh * 0.8;
  const body = l.shape === 'round' ? `<circle cx="20" cy="${y}" r="${bw * 0.8}" fill="${l.color}" stroke="#3a2a1a" stroke-width="1.2"/>` : `<rect x="${20 - bw * 0.8}" y="${y - bh * 0.8}" width="${bw * 1.6}" height="${bh * 1.6}" rx="2.5" fill="${l.color}" stroke="#3a2a1a" stroke-width="1.2"/>`;
  return `<svg viewBox="0 0 40 60" width="34" height="51" aria-hidden="true">
    <path d="M8 4 H32" stroke="#7a5a3a" stroke-width="3" stroke-linecap="round"/>
    <line x1="20" y1="4" x2="20" y2="${6 + cord}" stroke="#d8cdb8" stroke-width="1.4"/>${body}
    ${l.ribbon ? `<path d="M16 ${y - bh * 0.8 - 1} l-3 5 M24 ${y - bh * 0.8 - 1} l3 5" stroke="#d0506a" stroke-width="1.8"/>` : ''}
    <text x="20" y="58" font-size="9" text-anchor="middle" fill="currentColor">${ar(l.n)}</text>
  </svg>`;
}

const STYLE = `
.shd{display:grid;gap:10px}
.shd-photo{margin:0 auto;width:100%;max-width:420px;background:#f4efe2;padding:6px 6px 3px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-0.8deg);box-sizing:border-box}
.shd-photo svg{display:block;width:100%;height:auto}
.shd-photo figcaption{font-size:.78rem;text-align:center;color:#3b2630;padding-top:2px}
.shd-notes{display:grid;gap:6px}
.shd-note{margin:0;font-size:.85rem;padding:6px 8px;border-radius:6px;background:rgba(127,127,160,.16)}
.shd-stage{position:relative;width:100%;max-width:420px;margin:0 auto}
.shd-stage svg{display:block;width:100%;height:auto;border-radius:6px}
.shd-hook{position:absolute;width:44px;height:44px;margin:0;padding:0;transform:translate(-50%,-50%);border-radius:50%;background:transparent;border:0;cursor:pointer;touch-action:manipulation}
.shd.is-holding .shd-hook{box-shadow:inset 0 0 0 2px rgba(255,217,138,.5)}
.shd-hook:focus-visible{outline:3px solid #ffd98a}
.shd-hand{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;margin:0}
.shd-hand .btn{min-height:44px}
.shd-basket{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.shd-lantern{width:48px;min-height:64px;display:grid;place-items:center;border-radius:8px;border:2px solid transparent;background:rgba(127,127,160,.14);padding:2px;color:inherit;cursor:pointer;touch-action:manipulation}
.shd-lantern[aria-pressed="true"]{border-color:#e2b544;background:rgba(226,181,68,.22)}
.shd-lantern.is-hung{opacity:.5}
`;
function ensureStyle() {
  if (typeof document === 'undefined' || document.getElementById('shd-style')) return;
  const s = document.createElement('style');
  s.id = 'shd-style';
  s.textContent = STYLE;
  document.head.append(s);
}

export const SHADOWS_VIEW = {
  render(body, api) {
    ensureStyle();
    const { config } = api.def;
    const s = api.state;
    const map = mapOf(config);
    const remembered = Object.keys(givensOf(config)).length > 0;
    const label = (id) => `الفانوس ${ar(config.lanterns.find((l) => l.id === id).n)}`;
    const hookName = (h) => `الحلگة ${ar(config.hooks.indexOf(h) + 1)}`;
    const onHook = (hookId) => Object.keys(s.at).find((id) => s.at[id] === hookId);
    const focused = document.activeElement?.closest?.('[data-k]')?.dataset.k;
    body.innerHTML = `<div class="shd ${s.held ? 'is-holding' : ''}">
      <figure class="shd-photo">${photoSvg(config)}<figcaption>صورة لمى — ليلة الفوانيس</figcaption></figure>
      ${
        remembered || map
          ? `<div class="shd-notes">${remembered ? '<p class="shd-note">صبري تذكّر وين وگف ريان: الفانوسين اللي فوگ راسه معلّگين من البداية.</p>' : ''}${map ? '<p class="shd-note">خريطة العم جوجو: علامة ✕ جنب كل حلگة انشغلت تلك الليلة.</p>' : ''}</div>`
          : ''
      }
      <div class="shd-stage">${wallSvg(config, s.at)}${config.hooks
        .map((h) => {
          const who = onHook(h.id);
          return `<button type="button" class="shd-hook" data-k="h${h.id}" data-hook="${h.id}" style="left:${f1((h.x / W) * 100)}%;top:${f1((h.y / H) * 100)}%" aria-label="${hookName(h)} — ${who ? `عليها ${label(who)}` : 'فارغة'}${map?.includes(h.id) ? '، معلّمة بالخريطة' : ''}"></button>`;
        })
        .join('')}</div>
      <p class="shd-hand" aria-live="polite"><span>${s.held ? `بإيدچ: <b>${label(s.held)}</b>` : 'إيدچ فاضية.'}</span>${s.held ? '<button type="button" class="btn btn-ghost" data-k="down" data-down>رجّعيه للسلة</button>' : ''}</p>
      <div class="shd-basket" role="group" aria-label="الفوانيس">${config.lanterns
        .map((l) => {
          const hung = s.at[l.id];
          return `<button type="button" class="shd-lantern ${hung ? 'is-hung' : ''}" data-k="l${l.id}" data-lantern="${l.id}" aria-pressed="${s.held === l.id}" aria-label="${label(l.id)} — ${s.held === l.id ? 'بإيدچ' : hung ? 'معلّگ' : 'بالسلة'}">${basketLantern(l)}</button>`;
        })
        .join('')}</div>
      <p class="muted small">المسي فانوس حتى تشيلينه، وبعدين المسي حلگة حتى تعلّگينه. المسي حلگة عليها فانوس حتى تنزّلينه. كل فانوس ينعلّگ ينضوى، ويرمي ظل الحامل على الحايط. التحقق يگول بس إذا الحايط كله صار مثل الصورة.</p>
      <button type="button" class="btn btn-primary" data-k="check" data-check>تحققي ✔</button>
    </div>`;
    body.querySelectorAll('[data-lantern]').forEach((b) => b.addEventListener('click', () => api.act(s.held === b.dataset.lantern ? 'down' : 'take', b.dataset.lantern)));
    body.querySelectorAll('[data-hook]').forEach((b) => b.addEventListener('click', () => api.act('hang', b.dataset.hook)));
    body.querySelector('[data-down]')?.addEventListener('click', () => api.act('down'));
    body.querySelector('[data-check]').addEventListener('click', () => api.act('check'));
    if (focused) body.querySelector(`[data-k="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
  },
};

/* ── the world's canvas: the same tree, lanterns and rays (data/m2/m05-night.js) ── */
/**
 * @param at   the layout to draw (lantern → hook)
 * @param lit  the lanterns that are lit (a Set of ids); the others hang dark and throw nothing
 * @param ox, oy, s  where the view's (0, 0) is in the world, and its scale
 */
export function paintNight(ctx, config, { at = {}, lit = new Set(), ox, oy, s, t = 0, reduced = false }) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(s, s);
  const rays = raysOf(config, at).filter((r) => lit.has(r.lantern));
  for (const r of rays) {
    const g = ctx.createRadialGradient(r.pos.x, r.pos.y, 4, r.pos.x, r.pos.y, 90);
    const a = reduced ? 0.42 : 0.38 + 0.06 * Math.sin(t * 3 + r.pos.x);
    g.addColorStop(0, `rgba(255,217,138,${a})`);
    g.addColorStop(1, 'rgba(255,217,138,0)');
    ctx.fillStyle = g;
    ctx.fillRect(r.pos.x - 90, r.pos.y - 90, 180, 180);
  }
  // the stand's shadows on the wall
  ctx.fillStyle = 'rgba(6,5,18,0.6)';
  for (const r of rays) {
    const { peg } = config;
    const dx = r.tip.x - peg.x;
    const dy = r.tip.y - peg.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(peg.x + nx * 3.5, peg.y + ny * 3.5);
    ctx.lineTo(r.tip.x + nx * 1.6, r.tip.y + ny * 1.6);
    ctx.lineTo(r.tip.x - nx * 1.6, r.tip.y - ny * 1.6);
    ctx.lineTo(peg.x - nx * 3.5, peg.y - ny * 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(r.tip.x, r.tip.y);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.fillRect(0, -5, 11, 10);
    ctx.restore();
  }
  // the stand
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.arc(config.peg.x, config.peg.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  ctx.fillRect(config.peg.x - 4, config.peg.y - 13, 8, 9);
  // the tree: trunk and branches, hooks
  ctx.fillStyle = '#2a1f18';
  ctx.beginPath();
  ctx.moveTo(-4, H);
  ctx.lineTo(6, 18);
  ctx.lineTo(16, 18);
  ctx.lineTo(22, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a1f18';
  ctx.lineCap = 'round';
  ctx.lineWidth = 6;
  for (const b of branches(config)) {
    ctx.beginPath();
    ctx.moveTo(8, b.y + 4);
    ctx.quadraticCurveTo(b.x2 / 2, b.y - 6, b.x2, b.y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#a89a86';
  ctx.lineWidth = 1.6;
  for (const h of config.hooks) {
    ctx.beginPath();
    ctx.moveTo(h.x, h.y - 9);
    ctx.lineTo(h.x, h.y - 2);
    ctx.arc(h.x + 3, h.y + 1, 3, Math.PI, 0, true);
    ctx.stroke();
  }
  // the lanterns (drawn a little larger than in the view, so they read at the world's scale)
  for (const l of config.lanterns) {
    const hook = config.hooks.find((h) => h.id === at[l.id]);
    if (!hook) continue;
    const on = lit.has(l.id);
    const [bw, bh] = bodyOf(l).map((v) => v * 1.25);
    const y = hook.y + l.drop;
    ctx.strokeStyle = '#20160e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(hook.x, hook.y);
    ctx.lineTo(hook.x, y - bh);
    ctx.stroke();
    ctx.fillStyle = on ? l.color : '#5a5468';
    ctx.strokeStyle = '#3a2a1a';
    ctx.beginPath();
    if (l.shape === 'round') ctx.arc(hook.x, y, bw, 0, Math.PI * 2);
    else ctx.rect(hook.x - bw, y - bh, bw * 2, bh * 2);
    ctx.fill();
    ctx.stroke();
    if (on) {
      ctx.fillStyle = '#fff6d2';
      ctx.beginPath();
      ctx.ellipse(hook.x, y + 1, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A lantern standing in the basket (the world), dark: its colour, its ribbon. */
export function paintBasketLantern(ctx, l, x, y, k = 0.55) {
  const [bw, bh] = bodyOf(l).map((v) => v * k * 1.6);
  ctx.fillStyle = l.ribbon ? 'rgba(230,240,255,0.7)' : l.color;
  ctx.globalAlpha = 0.85;
  if (l.shape === 'round') {
    ctx.beginPath();
    ctx.arc(x, y - bh, bw, 0, Math.PI * 2);
    ctx.fill();
  } else ctx.fillRect(x - bw, y - bh * 2, bw * 2, bh * 2);
  ctx.globalAlpha = 1;
  if (l.ribbon) {
    ctx.strokeStyle = '#d0506a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y - bh * 2 - 2, 3, Math.PI, 0);
    ctx.stroke();
  }
}
