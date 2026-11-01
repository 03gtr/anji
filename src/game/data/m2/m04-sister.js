/**
 * Season 2, M2 — Mission 04 «ظل الأخت» (s2-15; docs/season-2/SEASON_2_LIVING_STORY_C1.md §3). A mission module
 * (docs/season-2/MISSION_MODULES.md): everything the mission adds lives here. M1's home garden (s2-home) is only
 * extended, every addition gated on this mission (or on a flag only this mission sets).
 *
 * Anji's sister is drawn as her own silhouette: a slow sway when she stands, a rise and a quick lean-in when she is
 * challenged, watchful eyes. She is confident and protective, never a villain. The chain of words ends with her:
 *   Ryan → Sabri «لا تگول لأحد» → Lama «ريان راح للعيادة بالسر» → «ريان يخبي شي» → it reached her → the unsigned note.
 * The day: Lama comes to apologise; her sister slips out with the blank card and her pencil notes; Anji follows her
 * to the shed unseen (minigames/s2-stealth.js), finds where she hid her notes, and pegs the words on the shed's line
 * in the order they travelled (a strict puzzle) while her sister watches. At dusk, under the flickering lantern, her
 * sister owns the note: she wrote it to protect Anji. The blank card's wish can be made out under the lantern —
 * Anji chooses whether to read it.
 *
 * Decisions read here: sister-refusal (M1 s2-09: her opening attitude, a line in the shed, and how wary her rhythm
 * is in the stealth); office-cover (Mission 01: Lama's apology). Made here: sister-wish (read: her line when Anji
 * comes back to her, the lantern; Mission 06's ending). Fiction written for the game.
 */
import { PACK_S2 } from '../missions-s2.js';
import { GROUND } from '../../world/props.js';

const after = (id) => `flag:mission:${id}`;
const OPEN = after('s2-14');
const AFTER_BOARD = after('s2-04'); // M1: when her sister is in the home garden at all
const START = 'flag:s2:15-start';
const AWAY = 'flag:s2:15-away'; // she has left the house with her things (until the mission ends)
const FOLLOWED = 'flag:s2:15-tracked';
const HEARD = 'flag:s2:15-slip-heard';
const DRAFT = 'flag:s2:15-slip-draft';
const WHISPER = 'flag:s2:15-slip-whisper';
const FACED = 'flag:s2:15-faced'; // her sister found her in the shed
const CHAIN = 'ev:d-chain';
const TRUTH = 'flag:s2:15-truth';
const LANTERN_X = 700;

/* ── drawn on the canvas (no new art to bake) ── */

/** A soft shade over the place (drawn over the people), with pools of light cut out of it. */
function shade() {
  let mask = null;
  return (ctx, { world, camX, viewW }, color, pools) => {
    const top = world?.topY ?? -100;
    const H = Math.ceil((world?.viewH ?? 420) / 2);
    const W = Math.ceil(viewW / 2);
    if (!mask) mask = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!mask) return;
    if (mask.width !== W) mask.width = W;
    if (mask.height !== H) mask.height = H;
    const m = mask.getContext('2d');
    if (!m) return;
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, W, H);
    m.fillStyle = color;
    m.fillRect(0, 0, W, H);
    m.globalCompositeOperation = 'destination-out';
    for (const p of pools) {
      const x = (p.x - camX) / 2;
      const y = (p.y - top) / 2;
      const r = p.r / 2;
      const g = m.createRadialGradient(x, y, r * 0.15, x, y, r);
      g.addColorStop(0, `rgba(0, 0, 0, ${p.a ?? 1})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      m.fillStyle = g;
      m.fillRect(x - r, y - r, r * 2, r * 2);
    }
    m.globalCompositeOperation = 'source-over';
    ctx.drawImage(mask, camX, top, W * 2, H * 2);
  };
}
const shedShade = shade();
const duskShade = shade();

/** The lantern's flicker: a steady flame that trembles, with a small dip now and then. */
const flicker = (t, reduced) => (reduced ? 1 : 1 + 0.05 * Math.sin(t * 13.7) + 0.035 * Math.sin(t * 7.1 + 1) - (Math.sin(t * 1.9) > 0.96 ? 0.12 : 0));

function workbench(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#6a4a34';
  ctx.fillRect(x - 60, GROUND - 62, 120, 10);
  ctx.fillRect(x - 56, GROUND - 52, 7, 52);
  ctx.fillRect(x + 49, GROUND - 52, 7, 52);
  ctx.fillStyle = '#8a8f96'; // the seed tin
  ctx.fillRect(x - 14, GROUND - 92, 28, 30);
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(x - 15, GROUND - 95, 30, 5);
  ctx.fillStyle = '#4c6b3a'; // a trowel and string
  ctx.fillRect(x + 22, GROUND - 68, 26, 4);
  ctx.restore();
}
function wateringCan(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#4f7f8f';
  ctx.beginPath();
  ctx.moveTo(x - 16, GROUND);
  ctx.lineTo(x - 13, GROUND - 32);
  ctx.lineTo(x + 13, GROUND - 32);
  ctx.lineTo(x + 16, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4f7f8f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 13, GROUND - 22);
  ctx.lineTo(x + 32, GROUND - 40);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, GROUND - 34, 9, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}
function potStack(ctx, x, P) {
  const r = () => 0.5;
  P.pot(ctx, x - 22, GROUND, r, { tone: 'pink' });
  P.pot(ctx, x + 6, GROUND, r);
  P.pot(ctx, x + 30, GROUND, r, { tone: 'pink' });
}
/** The line over the workbench: five pegs; once the chain is found, five slips linked by a red thread. */
const LINE_X1 = 330;
const LINE_X2 = 560;
const lineY = (x) => {
  const u = (x - LINE_X1) / (LINE_X2 - LINE_X1);
  return GROUND - 160 + Math.sin(Math.PI * u) * 12;
};
const PEGS = [0, 1, 2, 3, 4].map((i) => LINE_X1 + 30 + i * 42.5);
function shedLine(ctx, game) {
  ctx.save();
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(LINE_X1 - 6, GROUND - 170, 6, 14);
  ctx.fillRect(LINE_X2, GROUND - 170, 6, 14);
  ctx.strokeStyle = '#e8dfcc';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(LINE_X1, GROUND - 162);
  ctx.quadraticCurveTo((LINE_X1 + LINE_X2) / 2, GROUND - 136, LINE_X2, GROUND - 162);
  ctx.stroke();
  const done = game.has('s2.ev.d-chain');
  if (done) {
    ctx.strokeStyle = '#c0394f'; // the red thread from slip to slip
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    PEGS.forEach((x, i) => (i ? ctx.lineTo(x, lineY(x) + 22) : ctx.moveTo(x, lineY(x) + 22)));
    ctx.stroke();
  }
  PEGS.forEach((x, i) => {
    const y = lineY(x);
    if (done) {
      ctx.fillStyle = i === 4 ? '#ffffff' : '#f4efe2';
      ctx.save();
      ctx.translate(x, y + 4);
      ctx.rotate((i % 2 ? 1 : -1) * 0.06);
      ctx.fillRect(-11, 0, 22, 30);
      ctx.fillStyle = '#9aa3b8';
      for (let k = 0; k < 3; k++) ctx.fillRect(-7, 7 + k * 6, 14, 1.4);
      ctx.restore();
    }
    ctx.fillStyle = '#b07a4a';
    ctx.fillRect(x - 2, y - 6, 4, 11);
  });
  ctx.restore();
}
function shedWindow(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#ffe4a8';
  ctx.fillRect(x - 30, GROUND - 170, 60, 50);
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 30, GROUND - 170, 60, 50);
  ctx.beginPath();
  ctx.moveTo(x, GROUND - 170);
  ctx.lineTo(x, GROUND - 120);
  ctx.stroke();
  const g = ctx.createLinearGradient(x, GROUND - 120, x - 80, GROUND);
  g.addColorStop(0, 'rgba(255, 228, 168, 0.35)');
  g.addColorStop(1, 'rgba(255, 228, 168, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND - 120);
  ctx.lineTo(x + 30, GROUND - 120);
  ctx.lineTo(x - 30, GROUND);
  ctx.lineTo(x - 130, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
/** The garden path's end: a gap in the hedge, a small sign to the shed. */
function pathSign(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#6b5a48';
  ctx.fillRect(x - 3, GROUND - 70, 6, 70);
  ctx.fillStyle = '#e9dcc0';
  ctx.beginPath();
  ctx.moveTo(x - 26, GROUND - 82);
  ctx.lineTo(x + 20, GROUND - 82);
  ctx.lineTo(x + 30, GROUND - 72);
  ctx.lineTo(x + 20, GROUND - 62);
  ctx.lineTo(x - 26, GROUND - 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a2c';
  ctx.font = '700 11px "Baloo Bhaijaan 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillText('السقيفة', x - 2, GROUND - 72);
  ctx.restore();
}
/** The garden's lantern on its post, its glow trembling. */
function lantern(ctx, { t, P, world }) {
  const f = flicker(t, world?.reduced);
  ctx.save();
  P.lanternPost(ctx, LANTERN_X, GROUND, { height: 150, lit: true });
  const y = GROUND - 150;
  const g = ctx.createRadialGradient(LANTERN_X, y, 4, LANTERN_X, y, 120 * f);
  g.addColorStop(0, `rgba(255, 206, 120, ${0.42 * f})`);
  g.addColorStop(1, 'rgba(255, 206, 120, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(LANTERN_X - 130, y - 130, 260, 260);
  ctx.restore();
}
/** Dusk over the whole garden (behind the people): the sky goes orange, then violet. */
function duskSky(ctx, { camX, viewW, world }) {
  const top = world?.topY ?? -100;
  const h = (world?.viewH ?? 420) + 20;
  ctx.save();
  const g = ctx.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, 'rgba(70, 40, 110, 0.55)');
  g.addColorStop(0.55, 'rgba(230, 120, 80, 0.32)');
  g.addColorStop(1, 'rgba(40, 24, 60, 0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(camX - 4, top, viewW + 8, h);
  ctx.restore();
}
/** Over the people: the dusk shade with the lantern's pool, and letterbox bars while the encounter plays. */
let bars = 0;
let barsT = 0;
function duskFront(ctx, args) {
  const { t, world, camX, viewW, game } = args;
  const f = flicker(t, world?.reduced);
  duskShade(ctx, args, 'rgba(24, 14, 46, 0.5)', [
    { x: LANTERN_X, y: GROUND - 110, r: 230 * f },
    { x: world?.player?.x ?? 0, y: GROUND - 60, r: 90, a: 0.5 },
  ]);
  const want = world?.mode === 'cutscene' && !game.flag('s2:15-truth') ? 1 : 0;
  const dt = Math.min(0.1, Math.max(0, t - barsT));
  barsT = t;
  bars += (want - bars) * Math.min(1, dt * 4);
  if (bars > 0.01) {
    const top = world?.topY ?? 0;
    const hh = 24 * bars;
    ctx.fillStyle = '#05040c';
    ctx.fillRect(camX - 4, top, viewW + 8, hh);
    ctx.fillRect(camX - 4, top + (world?.viewH ?? 300) - hh, viewW + 8, hh + 4);
  }
}

/* ── the puzzle's drawing: a line with five pegs (shown above the slips) ── */
const ROPE = (() => {
  const pegs = [0, 1, 2, 3, 4].map((i) => {
    const x = 42 + i * 54;
    const u = (x - 8) / 284;
    const y = 12 + Math.sin(Math.PI * u) * 16;
    return `<rect x="${x - 3}" y="${y - 7}" width="6" height="14" rx="2" fill="#b07a4a"/><text x="${x}" y="${y + 24}" font-size="12" text-anchor="middle" fill="currentColor">${'١٢٣٤٥'[i]}</text>`;
  });
  return `<svg viewBox="0 0 300 64" width="100%" height="64" role="img" aria-label="حبل بخمس ملاقط"><path d="M8 12 Q150 44 292 12" stroke="#e9e1cf" stroke-width="2.5" fill="none"/>${pegs.join('')}</svg>`;
})();

/* ── the places ── */
const S2_SHED = {
  id: 's2-shed-in',
  title: 'سقيفة الحديقة',
  theme: 'garage',
  music: 'mystery',
  width: 900,
  spawn: 110,
  seed: 1515,
  props: [],
  actors: [{ id: 'sister', kind: 'sister', x: 250, facing: 1, if: [FACED, `!${CHAIN}`], idleFx: 'sway', mood: 'suspicious', notice: { dist: 110, jolt: 'lunge' } }],
  dynamic: [
    { x: 640, reach: 160, draw: (ctx) => shedWindow(ctx, 640) },
    { x: 300, reach: 80, draw: (ctx) => workbench(ctx, 300) },
    { x: 445, reach: 140, draw: (ctx, { game }) => shedLine(ctx, game) },
    { x: 520, reach: 50, draw: (ctx) => wateringCan(ctx, 520) },
    { x: 740, reach: 70, draw: (ctx, { P }) => potStack(ctx, 740, P) },
    { x: 450, reach: 2000, front: true, draw: (ctx, args) => shedShade(ctx, args, 'rgba(14, 10, 26, 0.42)', [{ x: 600, y: GROUND - 90, r: 260 }, { x: args.world?.player?.x ?? 0, y: GROUND - 60, r: 120, a: 0.6 }]) },
  ],
  interact: [
    {
      id: 'tin',
      x: 300,
      w: 70,
      h: 100,
      label: 'علبة البذور',
      icon: '🥫',
      cases: [
        { if: `!${DRAFT}`, run: [{ pose: 'anji', anim: 'think', for: 500 }, { say: 's2.15-tin' }, { fx: DRAFT, quiet: true }] },
        { run: [{ say: 's2.15-tin-again' }] },
      ],
    },
    {
      id: 'can',
      x: 520,
      w: 50,
      h: 60,
      label: 'المرشّة',
      icon: '🪣',
      cases: [
        { if: `!${HEARD}`, run: [{ pose: 'anji', anim: 'crouch', for: 700 }, { say: 's2.15-can' }, { fx: HEARD, quiet: true }] },
        { run: [{ say: 's2.15-can-again' }] },
      ],
    },
    {
      id: 'pots',
      x: 740,
      w: 80,
      h: 70,
      label: 'السنادين',
      icon: '🪴',
      cases: [
        { if: `!${WHISPER}`, run: [{ all: [{ pose: 'husky', anim: 'sniff', for: 1200 }, { sfx: 'bark' }] }, { say: 's2.15-pots' }, { fx: WHISPER, quiet: true }] },
        { run: [{ say: 's2.15-pots-again' }] },
      ],
    },
    {
      id: 'line',
      x: 445,
      w: 120,
      h: 180,
      label: 'حبل وملاقط',
      icon: '📎',
      cases: [
        { if: CHAIN, run: [{ say: 's2.15-line-done' }] },
        { if: { any: [`!${HEARD}`, `!${DRAFT}`, `!${WHISPER}`] }, run: [{ say: 's2.15-line-empty' }] },
        {
          if: `!${FACED}`,
          run: [
            // her sister comes back in: she finds Anji at her things, rises, and leans in
            { spawn: { id: 'sister', kind: 'sister', x: 30, facing: 1, idleFx: 'sway', mood: 'suspicious', fadeIn: true } },
            { move: 'sister', to: 'anji', gap: 86, speed: 130 },
            { camera: { between: ['anji', 'sister'] }, ms: 300 },
            { all: [{ face: 'anji', toward: 'sister' }, { jolt: 'sister', type: 'rise', ms: 1000 }, { bubble: 'sister', text: 'شتسوين؟', ms: 1800 }, { pose: 'anji', anim: 'surprised', for: 900 }] },
            { jolt: 'sister', type: 'lunge', ms: 600 },
            { say: 's2.15-shed-faced' },
            { fx: FACED, quiet: true },
            { puzzle: 's2-chain', then: 'CHAIN_DONE', else: 'CHAIN_LATER' },
          ],
        },
        { run: [{ say: 's2.15-chain-again' }, { puzzle: 's2-chain', then: 'CHAIN_DONE', else: 'CHAIN_LATER' }] },
      ],
    },
    { id: 'sister', actor: 'sister', x: 250, w: 46, h: 120, label: 'أختي', icon: '💬', if: [FACED, `!${CHAIN}`], run: [{ say: 's2.15-shed-sister' }] },
    {
      id: 'door',
      x: 40,
      w: 50,
      h: 130,
      label: 'باب السقيفة',
      icon: '🚪',
      cases: [
        { if: [CHAIN, `!${TRUTH}`], run: [{ say: 's2.15-door-dusk' }, { fade: 'out' }, { goto: 's2-dusk', x: 140 }] },
        { run: [{ fade: 'out' }, { goto: 's2-home', x: 1200 }] },
      ],
    },
  ],
  triggers: [{ id: 'arrive', x1: 80, x2: 300, once: false, if: '!flag:s2:in-shed', run: [{ say: 's2.15-shed-enter' }, { fx: 'flag:s2:in-shed', quiet: true }] }],
  exits: [{ side: 'left', to: 's2-home', spawn: 1200 }],
  ambient: [{ t: 'ريحة تراب ومي، وأكياس بذور مرتبة… أكثر من اللازم.' }],
};

// after the chain: what the line shows her sister, and what happens next (filled in below, shared by both cases)
const CHAIN_DONE = [
  { say: 's2.15-chain-done' },
  { move: 'sister', x: 20, speed: 100 },
  { despawn: 'sister', fade: true },
  { say: 's2.15-chain-after' },
  { fade: 'out' },
  { goto: 's2-dusk', x: 140 },
];
// she closes the line without finishing: her challenge (a rise, a lean-in), nothing lost
const CHAIN_LATER = [{ all: [{ jolt: 'sister', type: 'rise', ms: 1000 }, { pose: 'sister', anim: 'cross', for: 1400 }] }, { say: 's2.15-chain-later' }];
for (const c of S2_SHED.interact.find((i) => i.id === 'line').cases) {
  for (const a of c.run) {
    if (a.then === 'CHAIN_DONE') a.then = CHAIN_DONE;
    if (a.else === 'CHAIN_LATER') a.else = CHAIN_LATER;
  }
}

// the encounter at dusk: she turns; both in one frame; the lantern flickers over them
const ENCOUNTER = [
  { camera: 'sister', ms: 900 },
  { say: 's2.15-dusk-call' },
  { all: [{ face: 'sister', toward: 'anji' }, { jolt: 'sister', type: 'rise', ms: 1000 }, { mood: 'sister', expr: 'suspicious' }] },
  { move: 'anji', to: 'sister', gap: 96, speed: 90 },
  { face: 'anji', toward: 'sister' },
  { camera: { between: ['anji', 'sister'] }, ms: 800 },
  { say: 's2.15-dusk-admit' },
  { say: 's2.15-dusk-card' },
  { fx: [TRUTH, `!${AWAY}`], quiet: true },
  { say: 's2.15-dusk-end' },
];

const S2_DUSK = {
  id: 's2-dusk',
  title: 'حديقة البيت — المغرب',
  theme: 'meadow', // the garden itself, as the stealth shows it, at dusk
  music: 'night',
  width: 1300,
  spawn: 140,
  seed: 807, // the home garden's own (scenes/s2.js S2_HOME), at another hour
  props: [{ type: 'bench', x: 560 }, { type: 'table', x: 860, w: 100 }, { type: 'bush', x: 1180 }],
  actors: [{ id: 'sister', kind: 'sister', x: 724, facing: 1, if: CHAIN, idleFx: 'sway', mood: 'thinking', notice: { dist: 90, jolt: 'lunge' } }],
  dynamic: [
    { x: 650, reach: 2000, draw: duskSky },
    { x: LANTERN_X, reach: 160, draw: lantern },
    { x: 650, reach: 2000, front: true, draw: duskFront },
  ],
  interact: [
    {
      id: 'sister',
      actor: 'sister',
      x: 724,
      w: 46,
      h: 120,
      label: 'أختي',
      icon: '💬',
      if: CHAIN,
      cases: [{ if: `!${TRUTH}`, run: ENCOUNTER }, { run: [{ say: 's2.15-sister-again' }] }],
    },
    {
      id: 'lantern',
      x: LANTERN_X - 40,
      w: 30,
      h: 160,
      label: 'الفانوس',
      icon: '🏮',
      cases: [
        { if: 'dec:sister-wish=read', run: [{ say: 's2.15-lantern-read' }] },
        { if: 'dec:sister-wish=leave', run: [{ say: 's2.15-lantern-leave' }] },
        { run: [{ say: 's2.15-lantern' }] },
      ],
    },
  ],
  triggers: [{ id: 'meet', x1: 60, x2: 560, once: false, if: [CHAIN, `!${TRUTH}`], run: ENCOUNTER }],
  exits: [{ side: 'left', to: 's2-archive', spawn: 1180 }],
  ambient: [{ t: 'الفانوس يرجف، والحديقة تصير بنفسجية.' }],
};

// the opening in the home garden: Lama's apology; her sister, packing her things, turns, and slips away
const OPENING = [
  { camera: { between: ['anji', 'lama'] }, ms: 500 },
  { say: 's2.15-lama-sorry' },
  // (her sister, as her own silhouette: the place's figure is swapped for one that sways)
  { despawn: 'sister' },
  { spawn: { id: 'sister', kind: 'sister', x: 650, facing: -1, idleFx: 'sway', mood: 'thinking' } },
  // the camera finds her at the table, packing; she feels Anji's look, turns, rises
  { camera: 'sister', ms: 900 },
  { say: 's2.15-sister-seen' },
  { all: [{ face: 'sister', toward: 'anji' }, { jolt: 'sister', type: 'rise', ms: 1000 }, { mood: 'sister', expr: 'suspicious' }] },
  // Anji goes over to her: the two of them in one frame (a phone shows ~160 units)
  { move: 'anji', to: 'sister', gap: 92, speed: 120 },
  { face: 'anji', toward: 'sister' },
  { camera: { between: ['anji', 'sister'] }, ms: 600 },
  { say: 's2.15-sister-open' },
  { move: 'sister', x: 1380, speed: 95 },
  { despawn: 'sister', fade: true },
  { fx: [START, AWAY], quiet: true },
  // Lama catches up
  { all: [{ move: 'lama', to: 'anji', gap: 70, speed: 140 }, { camera: 'anji', ms: 400 }] },
  { face: 'anji', toward: 'lama' },
  { camera: { between: ['anji', 'lama'] }, ms: 400 },
  { say: 's2.15-lama-points' },
];
const FOLLOW_DONE = [{ fx: FOLLOWED, quiet: true }, { say: 's2.15-followed' }, { fade: 'out' }, { goto: 's2-shed-in', x: 110 }];
const FOLLOW_LATER = [{ say: 's2.15-follow-later' }];
// how wary her rhythm is depends on how Anji met her refusal in M1 (s2-09)
const FOLLOW = [
  { say: 's2.15-follow' },
  {
    if: 'dec:sister-refusal=push',
    then: [{ game: 's2-stealth', options: { rhythm: 'wary' }, then: FOLLOW_DONE, else: FOLLOW_LATER }],
    else: [{ game: 's2-stealth', options: { rhythm: 'gentle' }, then: FOLLOW_DONE, else: FOLLOW_LATER }],
  },
];

/* ── the module ── */
export default {
  id: 'm04',
  missions: [
    {
      id: 's2-15',
      kind: 'story',
      pack: PACK_S2,
      act: 3,
      day: 16,
      world: ['s2-home'],
      title: 'ظل الأخت',
      where: 'حديقة البيت',
      summary: 'أختي من الصبح رايحة جاية بالحديقة، وبإيدها بطاقة بيضة. وكلما سألتها… تبتسم وتسكت.',
      unlock: OPEN,
      locked: 'ينفتح بعد «قصص جوجو الثلاث».',
      // steps say what to do, never which link goes where
      steps: [
        { done: START, world: 's2-home', text: 'روحي لحديقة البيت. لمى تنتظرچ هناك.' },
        { done: FOLLOWED, world: 's2-home', text: 'أختي شايلة شي للسقيفة. الحگيها بدون ما تحس بيچ.' },
        { done: [HEARD, DRAFT, WHISPER], world: 's2-home', text: 'دوري بالسقيفة على اللي خبّته.' },
        { done: CHAIN, world: 's2-home', text: 'كل ورقة كلمة مشت من واحد لواحد. علّگيها على الحبل بترتيبها.' },
        { done: TRUTH, world: 's2-home', text: 'لمن تغيب الشمس… يم الفانوس.' },
      ],
      reward: ['journal:s2-sister-shadow'],
      rewardText: 'آخر حلقة بالسلسلة',
      leadsTo: ['s2-16'],
    },
  ],
  evidence: {
    'd-chain': {
      rel: 'deduction',
      icon: 'mark',
      label: 'سلسلة الكلام',
      note: 'ريان لصبري: «لا تگول لأحد» ← صبري للمى: «ريان راح للعيادة بالسر» ← لمى لأختي: «ريان يخبي شي» ← أختي: الورقة اللي بلا توقيع. ولا حلقة بيها كذب… بس كل حلقة نقّصت شي.',
    },
  },
  decisions: {
    'sister-wish': ['read', 'leave'], // 04: read the blank card's wish under the lantern, or leave it to her (read: her line after, the lantern; 06's ending)
  },
  case: [{ mission: 's2-15', ids: ['d-chain'] }],
  journal: {
    's2-sister-shadow': { title: 'ظل الأخت', icon: 'heart', text: 'جملة وحدة مشت من ريان لصبري، ومن صبري للمى، ومن لمى لأختي… وصارت ورقة بلا اسم. أختي ما چانت تأذيني. چانت تحميني، بطريقتها.' },
  },
  puzzles: {
    // The line in the shed: five pegs, seven slips (Anji's from the office, her sister's from the shed). A link is
    // someone saying something to someone; the whisper (nobody knows who started it) and Sabri's printer excuse
    // (another matter) are no link. Order: Sunday's sticky note, Monday's words, Tuesday's message, what her sister
    // wrote down that Tuesday, then the note under Ryan's cup (her draft in the seed tin bridges the last two).
    's2-chain': {
      type: 'arrange',
      title: 'حبل الكلام',
      goal: 'علّگي الكلام اللي مشى، حلقة ورا حلقة: كل حلقة واحد گال شي لواحد… لحد آخر ورقة انكتبت. مو كل ورقة إلها ملقط.',
      intro: 'خمس ملاقط على الحبل. أوراقچ من المكتب، وأوراق أختي من السقيفة. وأختي واگفة، ذراعها مكتوفة… تباوع.',
      example: ROPE,
      config: {
        slots: ['quiet', 'clinic', 'hides', 'heard', 'note'].map((id, i) => ({ id: `p${i + 1}`, label: '١٢٣٤٥'[i], accepts: [id] })),
        pieces: [
          { id: 'heard', label: 'ورقة أختي بالمرشّة: «الثلاثاء. لمى گالتلي: ريان يخبي شي.»' },
          { id: 'printer', label: 'صبري بالمكتب: «الطابعة هي اللي گالتها!»' },
          { id: 'clinic', label: 'صبري، حرف بحرف: «ريان راح للعيادة بالسر.»' },
          { id: 'note', label: 'الورقة اللي تحت كوب ريان: «إذا أكو سر، أنجي تستاهل تعرفه.»' },
          { id: 'whisper', label: 'ورقة أختي بالسنادين: «ريان دا يخبي شي عن أنجي.» منو بداها؟؟' },
          { id: 'quiet', label: 'ورقة ريان اللاصقة: «صبري، لا تگول لأحد.»' },
          { id: 'hides', label: 'رسالة لمى المطبوعة: «… وگلتلها: ريان يخبي شي.»' },
        ],
        checkLabel: 'علّگتها ✓',
      },
      success: 'خمس ورقات، وخيط واحد بيناتها. ولا ورقة بيها كذب… بس كل وحدة نقّصت شي.',
      reward: ['ev:d-chain'],
    },
  },
  dialogue: {
    /* ── the home garden: Lama's apology; her sister slips away ── */
    's2.15-lama-sorry': [
      { s: 'lama', e: 'worried', t: 'أنجي! استنيتچ. آني… جيت أعتذر.', act: [{ move: 'lama', to: 'anji', gap: 72, speed: 110 }] },
      { s: 'anji', e: 'curious', t: 'تعتذرين؟ على شنو؟' },
      { s: 'lama', e: 'shy', t: '«ريان يخبي شي». آني اللي اختصرتها. صبري گال جملة صحيحة، وآني گصّيتها… وطلعت أخوف من الحقيقة.', act: [{ pose: 'lama', anim: 'facepalm', for: 1300 }] },
      // what she said at the office (Mission 01: office-cover)
      { if: 'dec:office-cover=truth', then: [{ s: 'lama', e: 'smile', t: 'وعلى الأقل، الشي الوحيد اللي انگال بالمكتب وطلع صحيح… إنتِ وريان.', act: [{ pose: 'lama', anim: 'laugh', for: 1000 }] }, { s: 'anji', e: 'shy', t: 'لمى!' }] },
      { if: 'dec:office-cover=cover', then: [{ s: 'lama', e: 'suspicious', t: 'وبعدني ما صدّگت قصة الطابعة. بس ماشي… ما أسأل.', act: [{ pose: 'lama', anim: 'lean', for: 1100 }] }, { s: 'anji', e: 'smirk', t: 'طابعة حساسة. گلتلچ.' }] },
      { s: 'anji', e: 'soft', t: 'ما أزعل منچ، لمى. چنتي خايفة عليّ. هذا مو ذنب.' },
      { s: 'lama', e: 'smile', t: 'إنتِ أطيب من اللازم.', act: [{ jolt: 'lama', type: 'hop' }] },
    ],
    's2.15-sister-seen': [{ s: 'narrator', t: '(أختي يم الميز، تلم أوراق مطوية… وبينها بطاقة بيضة. لمن تحس بيّ، ترفع راسها.)' }],
    's2.15-sister-open': [
      // how Anji met her refusal in M1 (s2-09: sister-refusal)
      {
        if: 'dec:sister-refusal=respect',
        then: [
          { s: 'sister', e: 'shy', t: 'أنجي. … گلتلچ «يمكن بعدين». وبعدين بعده ما وصل.', act: [{ pose: 'sister', anim: 'cross', for: 1300 }] },
          { s: 'anji', e: 'soft', t: 'ما جيت أضغط عليچ.' },
          { s: 'sister', e: 'smile', t: 'أعرف. إنتِ الوحيدة اللي ما تضغط.' },
        ],
      },
      {
        if: 'dec:sister-refusal=push',
        then: [
          { s: 'sister', e: 'suspicious', t: 'إذا جاية تسألين نفس السؤال… الجواب نفسه.', act: [{ jolt: 'sister', type: 'lunge', ms: 600 }, { pose: 'sister', anim: 'lean', for: 1000 }] },
          { s: 'anji', e: 'determined', t: 'ما سألت شي بعد.' },
          { s: 'sister', e: 'suspicious', t: '«بعد». حلوة «بعد».', act: [{ pose: 'sister', anim: 'cross', for: 1300 }] },
        ],
      },
      { s: 'sister', e: 'thinking', t: 'عندي شغلة بالحديقة. لا تلحگيني.', act: [{ pose: 'sister', anim: 'lean', for: 800 }] },
      { s: 'narrator', t: '(تدسّ البطاقة البيضة بجيبها، وتمشي… بهدوء، مثل ظل.)' },
    ],
    's2.15-lama-points': [
      { s: 'lama', e: 'suspicious', t: 'شفتي؟ من الصبح هيچ. رايحة جاية بين البيت والسقيفة اللي بآخر الحديقة.', act: [{ pose: 'lama', anim: 'point', for: 1000 }] },
      { s: 'anji', e: 'thinking', t: 'وبإيدها بطاقة بيضة.' },
      { s: 'lama', e: 'smile', t: 'إذا تلحگينها، لحگيها بهدوء. أختچ تحس بالنملة إذا مشت وراها.', act: [{ pose: 'lama', anim: 'laugh', for: 900 }] },
      { if: 'flag:sp1-husky-met', then: [{ s: 'narrator', t: '({husky} تميل راسها صوب السقيفة. حتى هي لاحظت.)' }] },
    ],
    's2.15-lama-again': [{ s: 'lama', e: 'thinking', t: 'درب السقيفة بآخر الحديقة. وأختچ… عيونها بظهرها.', act: [{ pose: 'lama', anim: 'point', for: 900 }] }],
    's2.15-path-early': [{ s: 'anji', e: 'thinking', t: 'درب السقيفة، بآخر الحديقة.' }],
    's2.15-follow': [{ s: 'anji', e: 'determined', t: '(أمشي بس لمن ما تباوع… وأختبي ورا أي شي. وقبل ما تلتفت، تبطّي.)' }],
    's2.15-follow-later': [{ s: 'anji', e: 'thinking', t: '(بعدين. هي ما راح تبطّل تروح وتجي.)' }],
    's2.15-followed': [
      { s: 'anji', e: 'surprised', t: '(خبّت أوراقها بالسقيفة… وطلعت من الباب الوراني.)' },
      { s: 'anji', e: 'determined', t: 'هسه دوري.' },
    ],
    's2.15-path-dusk': [{ s: 'narrator', t: '(الشمس دا تغيب. الفانوس بنص الحديقة يتولّع.)' }],

    /* ── the shed ── */
    's2.15-shed-enter': [
      { s: 'anji', e: 'curious', t: 'السقيفة. ريحة تراب ومي، وكل شي بمكانه… إلا شوية أشياء.' },
      { if: 'flag:sp1-husky-met', then: [{ s: 'narrator', t: '({husky} تشم الأرض، وتمشي على أثر خطوات صغيرة.)' }] },
    ],
    's2.15-tin': [
      { s: 'narrator', t: '(بعلبة البذور، تحت الأكياس: ورقة مشخوطة، بالقلم الرصاص.)' },
      { s: 'note', t: '«ريان يخبي شي؟ — لازم أنجي تعرف — لا، مو هيچ — إذا أكو…»' },
      { s: 'anji', e: 'curious', t: 'مسودة. شخطت وعادت… وبطّلت بنص الجملة.' },
    ],
    's2.15-tin-again': [{ s: 'anji', e: 'thinking', t: 'علبة البذور. رجّعت الأكياس مثل ما چانت.' }],
    's2.15-can': [
      { s: 'narrator', t: '(بقاع المرشّة، ورقة مطوية… بالقلم الرصاص.)' },
      { s: 'note', t: '«الثلاثاء. لمى گالتلي: "ريان يخبي شي." بس هيچ. ما گالت شنو.»' },
      { s: 'anji', e: 'thinking', t: 'خط أختي. الياء ملفوفة لفة كاملة، مثل ورقة المسابقة.' },
    ],
    's2.15-can-again': [{ s: 'anji', e: 'thinking', t: 'المرشّة. فارغة هسه.' }],
    's2.15-pots': [
      { s: 'narrator', t: '({husky} تحفر بين السنادين… وتطلّع ورقة مدعبلة، وذيلها يگول: آني لگيتها.)' },
      { s: 'note', t: '«ليلة الفوانيس، يم الشجرة: "ريان دا يخبي شي عن أنجي." منو بداها؟؟»' },
      { s: 'anji', e: 'thinking', t: 'حتى هي ما تعرف منو بداها.' },
    ],
    's2.15-pots-again': [{ s: 'anji', e: 'smile', t: 'السنادين. {husky} بعدها تشم بيها، فخورة بنفسها.' }],
    's2.15-line-empty': [{ s: 'anji', e: 'thinking', t: 'حبل وملاقط فوگ الميز. والملاقط فارغة… كأن أحد شال اللي چان معلّگ عليها.' }],
    's2.15-shed-faced': [
      { s: 'sister', e: 'suspicious', t: 'شتسوين بأغراضي؟', act: [{ pose: 'sister', anim: 'lean', for: 900 }] },
      { s: 'anji', e: 'shy', t: 'آآ… أرتبها؟' },
      { s: 'sister', e: 'suspicious', t: 'لحگتيني من البيت. وما حسّيت. … هذا يزعّلني أكثر من الأوراق.', act: [{ pose: 'sister', anim: 'cross', for: 1400 }] },
      { if: 'dec:sister-refusal=respect', then: [{ s: 'sister', e: 'shy', t: 'ذاك اليوم ما ضغطتي عليّ… واليوم دخلتي سقيفتي.' }] },
      { if: 'dec:sister-refusal=push', then: [{ s: 'sister', e: 'suspicious', t: 'گلتلچ لا… فجيتي تدورين بنفسچ. طبعاً.', act: [{ jolt: 'sister', type: 'lunge', ms: 500 }] }] },
      { s: 'anji', e: 'determined', t: 'كل ورقة هنا كلمة. وكل كلمة مشت من واحد لواحد. خليني أعلّگها.' },
      { s: 'sister', e: 'suspicious', t: 'علّگيها. وإذا غلطتي… أگولچ.', act: [{ pose: 'sister', anim: 'lean', for: 900 }] },
    ],
    's2.15-chain-again': [{ s: 'sister', e: 'suspicious', t: 'رجعتي للحبل؟ يلا. أباوع.', act: [{ pose: 'sister', anim: 'cross', for: 1200 }] }],
    's2.15-chain-later': [
      { s: 'sister', e: 'smile', t: 'وگفتي؟ الأوراق ما تهرب… بس آني ممكن.', act: [{ jolt: 'sister', type: 'lunge', ms: 600 }] },
      { s: 'anji', e: 'thinking', t: '(أرجعلها لمن أتأكد.)' },
    ],
    's2.15-shed-sister': [{ s: 'sister', e: 'suspicious', t: 'الحبل هناك. وآني هنا… أباوع.', act: [{ pose: 'sister', anim: 'cross', for: 1000 }] }],
    's2.15-chain-done': [
      { s: 'narrator', t: '(خمس ورقات على الحبل، وخيط أحمر بيناتها: من ورقة ريان… لحد الورقة اللي بلا توقيع.)' },
      { s: 'anji', e: 'determined', t: '«لا تگول لأحد» صارت «راح للعيادة بالسر»، وصارت «يخبي شي»… ووصلتلچ إنتِ. والورقة الأخيرة جت بعدها.' },
      { s: 'sister', e: 'worried', t: '…', act: [{ mood: 'sister', expr: 'worried' }, { face: 'sister', dir: -1 }] },
      { s: 'sister', e: 'shy', t: 'مو هنا. … لمن تغيب الشمس، تعالي يم الفانوس.', act: [{ pose: 'sister', anim: 'cross', for: 1400 }] },
    ],
    's2.15-chain-after': [{ s: 'anji', e: 'soft', t: '(يم الفانوس… لمن تغيب الشمس.)' }],
    's2.15-line-done': [{ s: 'anji', e: 'thinking', t: 'الحبل. خمس ورقات، وخيط واحد بيناتها.' }],
    's2.15-door-dusk': [{ s: 'narrator', t: '(برا، السما صارت برتقالية… والفانوس بنص الحديقة يتولّع.)' }],

    /* ── dusk, under the lantern ── */
    's2.15-dusk-call': [
      { s: 'narrator', t: '(المغرب. الفانوس بنص الحديقة يرجف ضوّه، وأختي واگفة تحته… ظهرها إلي.)' },
      { s: 'anji', e: 'soft', t: 'أختي.' },
    ],
    's2.15-dusk-admit': [
      { s: 'sister', e: 'suspicious', t: 'جيتي ويا الشمس بالضبط.' },
      { s: 'anji', e: 'determined', t: 'الحبل بالسقيفة. السلسلة كلها. وآخر ورقة بيها… هي اللي لگوها تحت كوب ريان.' },
      { s: 'sister', e: 'worried', t: '… إي. آني كتبتها.', act: [{ jolt: 'sister', type: 'rise', ms: 1000 }, { pose: 'sister', anim: 'cross', for: 1600 }] },
      { s: 'anji', e: 'soft', t: 'ليش؟ وليش بلا اسم؟' },
      { s: 'sister', e: 'worried', t: 'لمى گالتلي «ريان يخبي شي». وآني… خفت عليچ. ما ردت أكون آني اللي تجيبلچ خبر يزعلچ.', act: [{ jolt: 'sister', type: 'lunge', ms: 600 }, { pose: 'sister', anim: 'lean', for: 1200 }] },
      { s: 'sister', e: 'shy', t: 'فكتبتها وخليتها يم كوبه. گلت: إذا عنده سر، خلّي يحچيه هو. … طلعت فكرة غبية، صح؟ ورقة بلا اسم صارت قضية.', act: [{ pose: 'sister', anim: 'facepalm', for: 1400 }] },
      { s: 'anji', e: 'smile', t: 'طلعت فكرة… مالتچ. وچنتي تحميني بيها.' },
      { s: 'sister', e: 'smile', t: 'أحميچ. حتى من نفسي، على ما يبين.', act: [{ pose: 'sister', anim: 'laugh', for: 1100 }] },
    ],
    's2.15-dusk-card': [
      { s: 'narrator', t: '(تطلّع البطاقة البيضة من جيبها. تحت ضو الفانوس، الضغط اللي بالورق يبين… كلمات.)', act: [{ pose: 'sister', anim: 'point', for: 1500 }] },
      { s: 'sister', e: 'shy', t: 'وهاي… بطاقة أمنيتي. كتبتلچ عليها، وبعدين استحيت ومسحتها.' },
      { s: 'sister', e: 'thinking', t: 'تحت هالضو تنقرى. إذا تريدين.', act: [{ jolt: 'sister', type: 'lunge', ms: 500 }] },
      {
        s: 'anji',
        choice: [
          {
            t: 'أريد أقراها.',
            do: ['dec:sister-wish=read'],
            then: [
              { s: 'narrator', t: '(تميل البطاقة تحت الفانوس. الحروف المضغوطة تطلع وحدة وحدة.)' },
              { s: 'note', t: '«إلى أنجي — أتمنى تبقين سعيدة، مثل ما إنتِ هسه. وإذا أحد زعّلچ… خلّيه عليّ.»' },
              { s: 'anji', e: 'soft', t: '…' },
              { s: 'sister', e: 'shy', t: 'لا تباوعيني هيچ. چانت لحظة ضعف.', act: [{ puff: 'sister', type: 'steam', ms: 1600 }, { pose: 'sister', anim: 'facepalm', for: 1200 }] },
              { s: 'anji', e: 'smile', t: 'أحلى لحظة ضعف بالحديقة كلها.' },
            ],
          },
          {
            t: 'خلّيها إلچ. گوليها يوم تريدين.',
            do: ['dec:sister-wish=leave'],
            then: [
              { s: 'sister', e: 'surprised', t: '… ما تريدين تعرفين؟', act: [{ jolt: 'sister', type: 'hop', ms: 500 }] },
              { s: 'anji', e: 'soft', t: 'أعرف إنچ كتبتيها إلي. هذا يكفيني.' },
              { s: 'sister', e: 'smile', t: 'زين. بس لا تتعودين على الطيبة. المسابقة الجاية مالتي.', act: [{ pose: 'sister', anim: 'cross', for: 1200 }] },
            ],
          },
        ],
      },
    ],
    's2.15-dusk-end': [
      { s: 'sister', e: 'thinking', t: 'وريان؟ إذا يخبي شي… خلّي يگوله بلسانه. مو بورقة مني.' },
      { s: 'anji', e: 'determined', t: 'هذا اللي راح أعرفه.' },
    ],
    // when Anji comes back to her: what she chose with the card
    's2.15-sister-again': [
      { if: 'dec:sister-wish=read', then: [{ s: 'sister', e: 'shy', t: 'لا ترجعين تذكريني بالبطاقة. … بس إي، كل كلمة بيها چانت صدگ.' }] },
      { if: 'dec:sister-wish=leave', then: [{ s: 'sister', e: 'smile', t: 'البطاقة بجيبي بعدها. يمكن يوم أگولها بلساني… يمكن.', act: [{ pose: 'sister', anim: 'cross', for: 1200 }] }] },
    ],
    's2.15-lantern': [{ s: 'anji', e: 'thinking', t: 'الفانوس. ضوّه يرجف… بس ما ينطفي.' }],
    's2.15-lantern-read': [{ s: 'anji', e: 'soft', t: 'تحت هالضو انقرت الأمنية. «خلّيه عليّ.»' }],
    's2.15-lantern-leave': [{ s: 'anji', e: 'soft', t: 'تحت هالضو چانت الأمنية تنقرى… لو ردت. وما ردت.' }],
  },
  scenes: [S2_SHED, S2_DUSK],
  // additions to M1's home garden, each only while this mission is open (or after it)
  patches: {
    's2-home': {
      actors: [
        // her sister is in the garden as in M1 — until she leaves with her things (a flag only this mission sets)
        { id: 'sister', if: [AFTER_BOARD, `!${AWAY}`] },
        { id: 'lama', kind: 'lama', x: 300, facing: 1, if: [OPEN, `!${TRUTH}`], mood: 'worried', notice: { dist: 130, emote: '!' } },
      ],
      dynamic: [{ x: 1250, reach: 40, if: OPEN, draw: (ctx) => pathSign(ctx, 1250) }],
      interact: [
        {
          id: 'sister',
          if: [AFTER_BOARD, `!${AWAY}`],
          cases: [
            { if: [OPEN, `!${START}`], run: OPENING },
            { if: TRUTH, run: [{ say: 's2.15-sister-again' }] }, // back home: what she chose with the card
          ],
        },
        {
          id: 'lama',
          actor: 'lama',
          x: 300,
          w: 46,
          h: 120,
          label: 'لمى',
          icon: '💬',
          if: [OPEN, `!${TRUTH}`],
          cases: [{ if: `!${START}`, run: OPENING }, { run: [{ say: 's2.15-lama-again' }] }],
        },
        {
          id: 's2-15-path',
          x: 1250,
          w: 60,
          h: 150,
          label: 'درب السقيفة',
          icon: '🌿',
          if: OPEN,
          cases: [
            { if: `!${START}`, run: [{ say: 's2.15-path-early' }] },
            { if: `!${FOLLOWED}`, run: FOLLOW },
            { if: [CHAIN, `!${TRUTH}`], run: [{ say: 's2.15-path-dusk' }, { fade: 'out' }, { goto: 's2-dusk', x: 140 }] },
            { run: [{ fade: 'out' }, { goto: 's2-shed-in', x: 110 }] },
          ],
        },
      ],
      triggers: [{ id: '15-open', x1: 80, x2: 560, once: false, if: [OPEN, `!${START}`], run: OPENING }],
      exits: [{ side: 'right', to: 's2-shed-in', spawn: 110, if: FOLLOWED }],
    },
  },
};
