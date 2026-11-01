/**
 * Season 2, M2 — Mission 05 «ليلة الفوانيس» (s2-16; docs/season-2/SEASON_2_LIVING_STORY_C1.md §3, item 05).
 * A mission module (docs/season-2/MISSION_MODULES.md): everything the mission adds lives here.
 *
 * The night is rebuilt at the lantern tree, after dark: Lama keeps the times (her phone moved forward by
 * itself that night; the garden clock in her arms did not), Sabri holds the ladder (and wobbles), Ryan
 * watches. Lama's photograph of the wish-card stand and its shadows on the archive wall is the evidence:
 * hanging the eight lanterns so the wall throws exactly the photograph's shadows puts every one where it
 * really was (puzzles/rules-shadows.js — one layout only, proven by the solver). Then the night plays again
 * in order: the late lighting, the card written and erased the moment the shadows showed, the page torn
 * after it. Ryan's surprise was meant for "nine" — which, by the clock nobody put forward, was ten.
 * (What the surprise was stays his until Mission 06.)
 *
 * Decisions read here:
 *   office-cover (01)  truth: Sabri remembers where Ryan stood — two lanterns are hung from the start;
 *                      cover: he saw "only the ladder's steps" — the photograph alone.
 *   jojo-confront (03) gentle: Uncle Jojo comes, and his hooks map (flag s2:14-hooks-map) marks the hooks
 *                      used that night; blunt: he stays away, no map — Sabri does the lighting.
 *   tree-tease (M1)    Ryan's line about his card, once the night is in order.
 * Fiction written for the game.
 */
import { PACK_S2 } from '../missions-s2.js';
import { GROUND } from '../../world/props.js';
import { paintNight, paintBasketLantern } from '../../puzzles/view-shadows.js';

const OPEN = 'flag:mission:s2-15';
const DONE = 'flag:mission:s2-16';
const IN = 'flag:s2:in-tree-night';
const PLACED_KEY = 's2:16-placed';
const PLACED = `flag:${PLACED_KEY}`; // (a condition; drawings read the flag itself, PLACED_KEY)
const LIT_KEY = 's2:16-lit';
const MAP = 'flag:s2:14-hooks-map'; // set by Mission 03's gentle answer (m03-jojo.js)
const PHOTO = 's2-photo';

/* ── the night's lanterns and hooks (the puzzle's units: a 360 × 400 wall, the ground at 400) ── */
const LANTERNS = [
  { id: 'l1', n: 1, color: '#d9534f', shape: 'small', drop: 15 }, // the small red one (a wish for the sea)
  { id: 'l2', n: 2, color: '#f0ad4e', shape: 'round', drop: 45 }, // the round one (rounded handwriting)
  { id: 'l3', n: 3, color: '#c9a25c', shape: 'tall', drop: 30 }, // the tall one
  { id: 'l4', n: 4, color: '#efe6d0', drop: 60 }, // the blank card's
  { id: 'l5', n: 5, color: '#5cb85c', drop: 75 }, // the green one
  { id: 'l6', n: 6, color: '#5b8fd9', drop: 90 }, // Rabi's
  { id: 'l7', n: 7, color: '#9b7fd1', drop: 105 }, // behind the far branch
  { id: 'l8', n: 8, color: '#e6f0ff', ribbon: true, drop: 120 }, // the eighth: new, on a long ribbon, its wick never burnt
];
// numbered as she reads, right to left; two heights of branch, every hook at its own distance along (spaced so
// that, on a 320 px phone, no two hooks' 44 px targets overlap)
const HOOKS = Array.from({ length: 11 }, (_, i) => ({ id: `h${i + 1}`, x: 335 - 31 * i, y: i % 2 ? 85 : 30 }));
/** Where every lantern was that night (the photograph is computed from it; never shown, never said). */
const NIGHT = { l1: 'h11', l2: 'h10', l3: 'h8', l4: 'h7', l5: 'h5', l6: 'h2', l7: 'h1', l8: null };
/** The order Uncle Jojo lit them in (the seventh, hung last, lit last). */
const LIGHT_ORDER = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'];
const CONFIG = {
  peg: { x: 180, y: 225 },
  k: 0.9,
  stamp: '١٠:٠٥ م',
  hooks: HOOKS,
  lanterns: LANTERNS,
  answer: NIGHT,
  // what earlier choices earned her (kept only when she has it: puzzles/host.js resolveConfig)
  stages: [
    {
      kind: 'notes',
      cards: [
        { id: 'sabri', if: 'dec:office-cover=truth', given: { l6: 'h2', l7: 'h1' } }, // where Ryan stood
        { id: 'map', if: MAP, hooks: ['h1', 'h2', 'h5', 'h7', 'h8', 'h10', 'h11'] }, // Uncle Jojo's hooks map
      ],
    },
  ],
};

/* ── the place: the tree in front of the archive wall, after dark ── */
const OX = 590; // the puzzle's (0, 0) in the world
const S = 0.45;
const OY = GROUND - 400 * S;
const world = (x, y) => ({ x: OX + x * S, y: OY + y * S });
const PEG = world(CONFIG.peg.x, CONFIG.peg.y);
const RYAN_SPOT = Math.round(world(315, 0).x); // under the far lanterns, where Sabri remembers Ryan stood
const BASKET_X = 540;
const LADDER_X = 790;
const TABLE_X = 1060;

const litCount = (game) => (game.has('s2.ev.e-surprise') ? LIGHT_ORDER.length : Number(game.flag(LIT_KEY)) || 0);

function archiveWall(ctx) {
  const y0 = GROUND - 190;
  ctx.save();
  ctx.fillStyle = '#2e3248';
  ctx.fillRect(430, y0, 560, 190);
  ctx.strokeStyle = '#262a3d';
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 190 / 12; r++) {
    const y = y0 + r * 12;
    ctx.beginPath();
    ctx.moveTo(430, y);
    ctx.lineTo(990, y);
    ctx.stroke();
    for (let x = 430 + (r % 2 ? 12 : 0); x < 990; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 12);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#3a3f58'; // its coping
  ctx.fillRect(424, y0 - 8, 572, 10);
  ctx.restore();
}
function basket(ctx, game) {
  const placed = game.flag(PLACED_KEY);
  ctx.save();
  const left = LANTERNS.filter((l) => !placed || !NIGHT[l.id]);
  left.forEach((l, i) => paintBasketLantern(ctx, l, BASKET_X - 26 + (i % 4) * 17, GROUND - 26 - Math.floor(i / 4) * 4));
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.moveTo(BASKET_X - 36, GROUND - 30);
  ctx.lineTo(BASKET_X + 36, GROUND - 30);
  ctx.lineTo(BASKET_X + 28, GROUND);
  ctx.lineTo(BASKET_X - 28, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(BASKET_X - 34 + i * 2, GROUND - 30 + i * 10);
    ctx.lineTo(BASKET_X + 34 - i * 2, GROUND - 30 + i * 10);
    ctx.stroke();
  }
  ctx.restore();
}
function ladder(ctx, t, reduced) {
  // leaning on the tree's far branch; it never quite stops swaying (Sabri holds it)
  const sway = reduced ? 0 : Math.sin(t * 2.2) * 0.025;
  ctx.save();
  ctx.translate(LADDER_X + 10, GROUND);
  ctx.rotate(-0.16 + sway);
  ctx.strokeStyle = '#8a6a44';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-9, -170);
  ctx.moveTo(12, 0);
  ctx.lineTo(9, -170);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(-12 + i * 0.4, -i * 21);
    ctx.lineTo(12 - i * 0.4, -i * 21);
    ctx.stroke();
  }
  ctx.restore();
}
/** The garden clock in Lama's arms (an hour behind: nobody put it forward), drawn where she stands. */
function lamaClock(ctx, { world: w, t }) {
  const a = w?.actor('lama');
  if (!a?.visible) return;
  const x = a.x + a.facing * 13;
  const y = a.y - 58;
  ctx.save();
  ctx.fillStyle = '#f3e3c3';
  ctx.strokeStyle = '#3b2630';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(t * 0.05) * 6, y - Math.cos(t * 0.05) * 6);
  ctx.moveTo(x, y);
  ctx.lineTo(x - 4, y + 1);
  ctx.stroke();
  ctx.restore();
}
function table(ctx) {
  ctx.save();
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(TABLE_X - 40, GROUND - 44, 80, 7);
  ctx.fillRect(TABLE_X - 34, GROUND - 37, 5, 37);
  ctx.fillRect(TABLE_X + 29, GROUND - 37, 5, 37);
  ctx.fillStyle = '#2f5d8a'; // the register, open, as it lay that night
  ctx.fillRect(TABLE_X - 22, GROUND - 49, 44, 5);
  ctx.fillStyle = '#e9e4d8';
  ctx.fillRect(TABLE_X - 20, GROUND - 52, 19, 4);
  ctx.fillRect(TABLE_X + 1, GROUND - 52, 19, 4);
  ctx.restore();
}

/**
 * The night's darkness: one soft mask over the people, with pools of light — a little around each of them
 * (a phone, a hand lamp), around Lama's lamp on the basket, and a big one round every lit lantern.
 */
let mask = null;
function darkness(ctx, { game, world: w, camX, viewW }) {
  const Wd = Math.ceil(viewW / 2);
  const Hd = 300; // world units GROUND-400 … GROUND+200, at half resolution
  if (!mask) mask = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!mask) return;
  if (mask.width !== Wd) mask.width = Wd;
  if (mask.height !== Hd) mask.height = Hd;
  const m = mask.getContext('2d');
  if (!m) return;
  m.globalCompositeOperation = 'source-over';
  m.clearRect(0, 0, Wd, Hd);
  m.fillStyle = 'rgba(8, 7, 24, 0.74)';
  m.fillRect(0, 0, Wd, Hd);
  m.globalCompositeOperation = 'destination-out';
  const pool = (wx, wy, r, a = 1) => {
    const x = (wx - camX) / 2;
    const y = (wy - (GROUND - 400)) / 2;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return; // (never let one bad number stop the frame)
    const g = m.createRadialGradient(x, y, r * 0.12, x, y, r);
    g.addColorStop(0, `rgba(0, 0, 0, ${a})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    m.fillStyle = g;
    m.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (const id of ['anji', 'lama', 'sabri', 'ryan', 'jojo', 'husky', 'snooki']) {
    const a = w?.actor(id);
    if (a?.visible) pool(a.x, a.y - 50, id === 'lama' ? 46 : 34, 0.85);
  }
  pool(BASKET_X, GROUND - 30, 40, 0.9); // Lama's lamp on the basket's rim
  pool(PEG.x, PEG.y, 34, 0.55); // the moon on the wall
  if (game.flag(PLACED_KEY)) {
    for (const id of LIGHT_ORDER.slice(0, litCount(game))) {
      const h = HOOKS.find((x) => x.id === NIGHT[id]);
      const l = LANTERNS.find((x) => x.id === id);
      const p = world(h.x, h.y + l.drop);
      pool(p.x, p.y, 62, 1);
    }
  }
  m.globalCompositeOperation = 'source-over';
  ctx.drawImage(mask, camX, GROUND - 400, Wd * 2, Hd * 2);
}

/**
 * The night in order (after the wall matches the photograph): the lanterns go up, Lama reads the times, they
 * light one by one, the card, the page — and Ryan's "nine". Every step is guarded by its own result, so an
 * interrupted night replays from its start and a finished one never repeats.
 */
const NIGHT_IN_ORDER = [
  { fx: ['!hold:', `!flag:${LIT_KEY}`], quiet: true },
  { camera: Math.round(PEG.x), ms: 700 },
  // Sabri hangs them, the ladder sways under him
  { move: 'sabri', x: LADDER_X, speed: 150 },
  { all: [{ jolt: 'sabri', type: 'shake', ms: 900 }, { puff: 'sabri', type: 'sweat', ms: 1800 }, { shake: 0.3 }] },
  { say: 's2.16-solved' },
  // the times, from Lama's phone and the clock in her arms
  { all: [{ face: 'lama', toward: 'anji' }, { pose: 'lama', anim: 'point', for: 900 }] },
  { camera: { between: ['lama', 'anji'] }, ms: 500 },
  { say: 's2.16-times' },
  // the lighting, one by one: Uncle Jojo (if he came), or Sabri with a lighter
  {
    if: MAP,
    then: [{ move: 'jojo', x: OX + 40, speed: 120 }, { pose: 'jojo', anim: 'point', for: 600 }],
    else: [{ all: [{ jolt: 'sabri', type: 'tilt', ms: 700 }, { pose: 'sabri', anim: 'handsup', for: 700 }] }],
  },
  { camera: Math.round(PEG.x), ms: 500 },
  ...LIGHT_ORDER.flatMap(() => [{ fx: `num:${LIT_KEY}+1`, quiet: true }, { sfx: 'tap' }, { wait: 420 }]),
  { say: 's2.16-lit' },
  // the blank card: the fourth lantern's light shows the writing inside
  { camera: Math.round(world(150, 0).x), ms: 600 },
  { all: [{ pose: 'lama', anim: 'think', for: 900 }, { pose: 'anji', anim: 'think', for: 900 }] },
  { say: 's2.16-card' },
  // the page: the register open on the table; the sweets wrapper; her husky
  { camera: TABLE_X - 40, ms: 600 },
  { all: [{ move: 'husky', x: TABLE_X + 5, speed: 240 }, { move: 'anji', x: TABLE_X - 75, speed: 160 }] },
  { all: [{ pose: 'husky', anim: 'excited', for: 1200 }, { sfx: 'bark' }, { pose: 'lama', anim: 'laugh', for: 1200 }] },
  { say: 's2.16-page' },
  { fx: 'ev:d-timeline' },
  // Ryan's "nine": he steps up to her (and, in his lines, over to the basket, to the eighth)
  { move: 'ryan', x: TABLE_X - 150, speed: 120 },
  { camera: { between: ['ryan', 'anji'] }, ms: 500 },
  { say: 's2.16-surprise' },
  { fx: 'ev:e-surprise' },
  { camera: null, ms: 300 },
];
const STAND_PUZZLE = [
  { if: '!seen:dlg:s2.16-stand-intro', then: [{ say: 's2.16-stand-intro' }] },
  { puzzle: 's2-shadows', then: NIGHT_IN_ORDER, else: [{ say: 's2.later' }] },
];

const S2_TREE_NIGHT = {
  id: 's2-tree-night',
  title: 'شجرة الفوانيس — بالليل',
  theme: 'garden-night',
  music: 'night',
  width: 1300,
  spawn: 160,
  seed: 1616,
  props: [{ type: 'bush', x: 110 }, { type: 'bush', x: 1220 }],
  actors: [
    { id: 'lama', kind: 'lama', x: 470, facing: 1, mood: 'smile', notice: { dist: 120, emote: '!' } },
    { id: 'sabri', kind: 'sabri', x: LADDER_X + 34, facing: -1, notice: { dist: 110, emote: '!' } },
    { id: 'ryan', kind: 'ryan', x: 920, facing: -1 }, // (Snooki sits at his side)
    // Uncle Jojo comes only if she was kind to him (Mission 03): he lent her the hooks map
    { id: 'jojo', kind: 'jojo', x: 380, facing: 1, if: MAP, mood: 'smile', notice: { dist: 110, emote: '!' } },
  ],
  dynamic: [
    { x: 710, reach: 320, draw: (ctx) => archiveWall(ctx) },
    {
      x: 680,
      reach: 200,
      draw: (ctx, { game, t, world: w }) => {
        const placed = game.flag(PLACED_KEY);
        const lit = new Set(LIGHT_ORDER.slice(0, placed ? litCount(game) : 0));
        paintNight(ctx, CONFIG, { at: placed ? NIGHT : {}, lit, ox: OX, oy: OY, s: S, t, reduced: w?.reduced });
      },
    },
    { x: BASKET_X, reach: 50, draw: (ctx, { game }) => basket(ctx, game) },
    { x: LADDER_X, reach: 80, draw: (ctx, { t, world: w }) => ladder(ctx, t, w?.reduced) },
    { x: TABLE_X, reach: 50, draw: (ctx) => table(ctx) },
    { x: 700, reach: 2000, front: true, draw: lamaClock },
    { x: 650, reach: 2000, front: true, draw: darkness },
  ],
  interact: [
    {
      id: 'lama',
      actor: 'lama',
      x: 470,
      w: 46,
      h: 120,
      label: 'لمى',
      icon: '💬',
      cases: [
        { if: '!ev:f-photo', run: [{ say: 's2.16-lama-photo' }, { fx: ['ev:f-photo', `hold:${PHOTO}`] }, { say: 's2.16-photo-hand' }] },
        { if: [PLACED, '!ev:e-surprise'], run: NIGHT_IN_ORDER }, // an interrupted night, from its start
        { if: [`!${PLACED}`, 'hold:'], run: [{ say: 's2.16-lama-photo-again' }, { fx: `hold:${PHOTO}`, quiet: true }] },
        { if: `!${PLACED}`, run: [{ say: 's2.16-lama-wait' }] },
        { run: [{ say: 's2.16-lama-after' }] },
      ],
    },
    {
      id: 'stand',
      x: Math.round(PEG.x),
      w: 50,
      h: 150,
      label: 'حامل البطاقات',
      icon: '🪧',
      cases: [
        { if: '!ev:f-photo', run: [{ say: 's2.16-stand' }] },
        { if: [`hold:${PHOTO}`, `!${PLACED}`], run: STAND_PUZZLE },
        { if: `!${PLACED}`, run: [{ say: 's2.16-stand-nophoto' }] },
        { if: '!ev:e-surprise', run: NIGHT_IN_ORDER }, // an interrupted night, from its start
        { run: [{ say: 's2.16-stand-after' }] },
      ],
    },
    { id: 'basket', x: BASKET_X, w: 70, h: 60, label: 'سلة الفوانيس', icon: '🏮', run: [{ say: 's2.16-basket' }] },
    { id: 'sabri', actor: 'sabri', x: LADDER_X + 34, w: 46, h: 120, label: 'صبري', icon: '💬', run: [{ all: [{ jolt: 'sabri', type: 'shake', ms: 600 }, { say: 's2.16-sabri' }] }] },
    { id: 'ryan', actor: 'ryan', x: 920, w: 50, h: 130, label: 'ريان', icon: '💬', run: [{ say: 's2.16-ryan' }] },
    { id: 'jojo', actor: 'jojo', x: 380, w: 46, h: 120, label: 'العم جوجو', icon: '💬', if: MAP, run: [{ say: 's2.16-jojo' }] },
    { id: 'table', x: TABLE_X, w: 80, h: 70, label: 'طاولة ريان', icon: '☕', run: [{ say: 's2.16-table' }] },
  ],
  triggers: [{ id: 'arrive', x1: 100, x2: 360, once: false, if: `!${IN}`, run: [{ say: 's2.16-enter' }, { fx: IN }] }],
  exits: [{ side: 'left', to: 's2-tree', spawn: 300 }],
  ambient: [{ t: 'الفوانيس بالسلة تنتظر. وحايط الأرشيف ينتظر ظلالها.' }, { t: 'ريحة شمع، وهوا بارد. ليلة مثل تلك الليلة.' }],
};

/* ── the module ── */
export default {
  id: 'm05',
  missions: [
    {
      id: 's2-16',
      kind: 'story',
      pack: PACK_S2,
      act: 3,
      day: 17,
      world: ['s2-tree'],
      title: 'ليلة الفوانيس',
      where: 'شجرة الفوانيس',
      summary: 'لمى صوّرت ليلة الفوانيس. والليلة نرجّعها مثل ما چانت… فانوس فانوس.',
      unlock: OPEN,
      locked: 'ينفتح بعد «ظل الأخت».',
      // steps say what to do, never where a lantern goes
      steps: [
        { done: IN, world: 's2-tree', text: 'لمى تنتظرچ عند شجرة الفوانيس. الليلة نرجّع تلك الليلة.' },
        { done: 'ev:f-photo', world: 's2-tree', text: 'اسمعي لمى. عدها شي من تلك الليلة.' },
        { done: PLACED, world: 's2-tree', text: 'علّگي الفوانيس وين چانت بالضبط. الصورة هي الشاهد.' },
        { done: ['ev:d-timeline', 'ev:e-surprise'], world: 's2-tree', text: 'الليلة بالترتيب: خلّي لمى تگرا الأوقات.' },
      ],
      reward: ['journal:s2-night'],
      rewardText: 'الليلة بالترتيب',
      leadsTo: ['s2-17'],
    },
  ],
  evidence: {
    'f-photo': { rel: 'fact', icon: 'moon-full', label: 'صورة لمى', note: 'من تلفونها، ليلة الفوانيس: حامل البطاقات على حايط الأرشيف، وظلاله طالعة منه. بزاوية الصورة: ١٠:٠٥ م.' },
    'd-timeline': {
      rel: 'deduction',
      icon: 'moon-crescent',
      label: 'الليلة بالترتيب',
      note: '٨:٣٠ (ساعة الحديقة ٧:٣٠): الضيوف علّگوا فوانيسهم، والثامن بقى بالعلّية. ٩:٠٠: ريان ينتظر، والشجرة ظلمة. ١٠:٠٠ («التسعة» بساعة الحديقة): العم جوجو ولّع السبعة واحد واحد؛ بطاقة ريان واگعة جنب السابع وهو بعده مطفي، وربيع نقلها للسادس المضوي. ١٠:٠٥: ضو الرابع بيّن كتابة البطاقة، وأختي شالتها ومسحتها. ١٠:٢١: ورقة الحلويات بالسجل المفتوح، والهاسكي گطعت الصفحة.',
    },
    'e-surprise': { rel: 'fact', icon: 'heart', label: 'موعد ريان: «التسعة»', note: 'مفاجأة ريان چانت على التسعة، لحظة ما تولع الفوانيس. بس بساعة الحديقة اللي ما انقدّمت، التسعة چانت عشرة. وگف ينتظر ساعة وخمس دقايق. شنو چانت؟ «مو الليلة.»' },
  },
  decisions: {},
  case: [{ mission: 's2-16', ids: ['f-photo', 'd-timeline', 'e-surprise'] }],
  journal: {
    's2-night': { title: 'ليلة الفوانيس', icon: 'moon-full', text: 'سبع فوانيس، سبع ظلال، وساعة ما انقدّمت. الليلة صارت بالترتيب… إلا موعد ريان، اللي بعده ينتظر.' },
  },
  puzzles: {
    's2-shadows': {
      type: 'shadows',
      title: 'ظلال الفوانيس',
      goal: 'علّگي الفوانيس على الشجرة حتى يصير الحايط مثل صورة لمى.',
      intro: 'كل فانوس ينعلّگ ينضوى، ويرمي ظل حامل البطاقات على حايط الأرشيف. الصورة من تلك الليلة.',
      config: CONFIG,
      success: 'الحايط صار مثل الصورة. هيچ چانت الشجرة تلك الليلة.',
      wrong: [],
      reward: [PLACED],
    },
  },
  dialogue: {
    /* ── by day, at the tree ── */
    's2.16-tree-lama': [
      { s: 'lama', e: 'smile', t: 'أنجي! الليلة، لمن تظلم، نرجّع ليلة الفوانيس مثل ما چانت. صبري جايب السلّم، وريان جايب… نفسه.', act: [{ pose: 'lama', anim: 'point', for: 900 }] },
      { s: 'anji', e: 'curious', t: 'نرجّعها؟ شلون؟' },
      { s: 'lama', e: 'laugh', t: 'عندي شي من تلك الليلة. تعالي وشوفي.', act: [{ pose: 'lama', anim: 'laugh', for: 900 }] },
      { s: 'narrator', t: '(وتظلم الدنيا…)' },
    ],
    's2.16-ryan-day': [
      { s: 'ryan', e: 'smile', t: 'لمى گالت الليلة نرجّع الفوانيس. آني جاي… بس محد يگولي اصعد السلّم.' },
      { s: 'snooki', e: 'smug', t: 'السلّم يخاف منه.' },
    ],
    /* ── at night ── */
    's2.16-enter': [
      { s: 'narrator', t: '(الليل. حايط الأرشيف ورا الشجرة، والفوانيس نازلة بسلة جنب الجذع.)' },
      { s: 'lama', e: 'smile', t: 'إجيتي! كل الفوانيس نزّلناها. الليلة نعلّگها وين چانت بالضبط… مو تقريباً.', act: [{ pose: 'lama', anim: 'point', for: 900 }] },
      { s: 'sabri', e: 'worried', t: 'آني ماسك السلّم. السلّم مو ماسكني. هذا الفرق.', act: [{ jolt: 'sabri', type: 'shake', ms: 700 }, { puff: 'sabri', type: 'sweat', ms: 1400 }] },
      { s: 'ryan', t: 'وآني أتفرج. وظيفة مهمة.', act: [{ face: 'ryan', toward: 'anji' }] },
      { s: 'snooki', e: 'smug', t: 'وآني أتفرج على اللي يتفرج.' },
      { if: MAP, then: [{ s: 'jojo', e: 'smile', t: 'وآني إجيت. ما أخلي أحد يعلّگ فوانيسي بغيابي.', act: [{ jolt: 'jojo', type: 'hop' }, { pose: 'jojo', anim: 'cross', for: 1000 }] }] },
      { if: 'dec:jojo-confront=blunt', then: [{ s: 'lama', e: 'thinking', t: 'عمو جوجو ما إجه. گال: «ثلاث قصص بليلة وحدة تكفي.»', act: [{ pose: 'lama', anim: 'shrug', for: 1000 }] }] },
    ],
    's2.16-lama-photo': [
      { s: 'lama', e: 'smile', t: 'تلك الليلة صوّرت كل شي. الأكل، الضيوف، سنوكي بنص كل صورة…', act: [{ pose: 'lama', anim: 'laugh', for: 900 }] },
      { s: 'lama', e: 'smile', t: 'بس هاي أحلى وحدة. حامل البطاقات على الحايط، وظلاله طالعة منه مثل نجمة.', act: [{ pose: 'lama', anim: 'point', for: 900 }] },
      { s: 'narrator', t: '(صورة من تلفون لمى: الحامل، وظلال تطلع منه على حايط الأرشيف. وبالزاوية: ١٠:٠٥ م.)' },
      { s: 'anji', e: 'thinking', t: 'كل فانوس مضوي يرمي ظل للحامل… يعني الظلال تعرف وين چان كل فانوس.' },
      { s: 'lama', e: 'smile', t: 'بالضبط! وكل فانوس نعلّگه، نولّعه. مثل تلك الليلة.' },
      // office-cover (Mission 01): Sabri, who chose not to hide things any more, remembers — or saw only the ladder
      {
        if: 'dec:office-cover=truth',
        then: [
          { s: 'sabri', e: 'smile', t: 'لحظة! آني أتذكر شي. من يوم المكتب گررت ما أخبي شي… فأحچي.', act: [{ jolt: 'sabri', type: 'hop' }] },
          { s: 'sabri', e: 'smile', t: 'ريان وگف هنا. بالضبط هنا.', act: [{ move: 'sabri', x: RYAN_SPOT, speed: 170 }, { pose: 'sabri', anim: 'point', for: 1100 }] },
          { s: 'sabri', e: 'laugh', t: 'والفانوسين اللي فوگ راسه… الواطي دگ براسه مرتين. أتذكرهم مثل اسمي.', act: [{ jolt: 'sabri', type: 'squash', ms: 500 }, { pose: 'sabri', anim: 'laugh', for: 900 }] },
          { s: 'ryan', t: 'مرة وحدة. مو مرتين.', act: [{ puff: 'ryan', type: 'steam', ms: 1400 }] },
          { s: 'sabri', e: 'smile', t: 'مرتين. آني أعيد اللي صار مثل ما صار، حرف بحرف.', act: [{ move: 'sabri', x: LADDER_X + 34, speed: 170 }] },
          { s: 'lama', e: 'smile', t: 'زين! هذولي الاثنين نعلّگهم مثل ما يگول صبري، من هسه.' },
        ],
      },
      {
        if: 'dec:office-cover=cover',
        then: [
          { s: 'anji', e: 'curious', t: 'صبري، إنت چنت ماسك السلّم. شفت وين وگف كل واحد؟' },
          { s: 'sabri', e: 'worried', t: 'آني؟ آني ما شفت غير درجات السلّم. والطابعة… لا، الطابعة مو هنا.', act: [{ jolt: 'sabri', type: 'shake', ms: 700 }, { pose: 'sabri', anim: 'handsup', for: 900 }] },
          { s: 'lama', e: 'suspicious', t: 'يعني الصورة وبس.', act: [{ pose: 'lama', anim: 'cross', for: 1000 }] },
        ],
      },
      // jojo-confront (Mission 03): his hooks map, lent when she was kind
      { if: MAP, then: [{ s: 'jojo', e: 'smile', t: 'وخريطة الحلگات اللي عطيتچ ياها. عليها علامة جنب كل حلگة انشغلت تلك الليلة.', act: [{ pose: 'jojo', anim: 'point', for: 900 }] }, { s: 'anji', e: 'smile', t: 'محفوظة عندي، عمو.' }] },
      { if: `!${MAP}`, then: [{ s: 'lama', e: 'thinking', t: 'لو عدنا خريطة عمو جوجو للحلگات… بس ما عدنا. والحلگات هواية.', act: [{ pose: 'lama', anim: 'think', for: 1000 }] }] },
    ],
    's2.16-photo-hand': [
      { s: 'narrator', t: '(الصورة صارت بإيدچ.)' },
      { s: 'lama', e: 'smile', t: 'خذيها للحامل، وقارني. آني أمسك الساعة وأگرا الأوقات.', act: [{ pose: 'lama', anim: 'point', for: 800 }] },
    ],
    's2.16-lama-photo-again': [{ s: 'lama', e: 'smile', t: 'الصورة؟ هاي هي. لا تضيعينها، ما عندي غيرها مطبوعة.' }],
    's2.16-lama-wait': [{ s: 'lama', e: 'thinking', t: 'الحامل هناك، على الحايط. قارني ظلاله بالصورة.', act: [{ pose: 'lama', anim: 'point', for: 800 }] }],
    's2.16-lama-after': [{ s: 'lama', e: 'smile', t: 'الليلة بالترتيب. كتبتها بدفتري، بخط مدور. وهالمرة… الأوقات صح.', act: [{ pose: 'lama', anim: 'cross', for: 900 }] }],
    's2.16-stand': [{ s: 'anji', e: 'thinking', t: 'حامل البطاقات: وتد خشب طالع من الحايط، وعليه بطاقة. بلا ضو، ما يرمي ظل.' }],
    's2.16-stand-intro': [
      { s: 'anji', e: 'determined', t: 'الصورة بإيد، والفوانيس بالسلة. فانوس فانوس.' },
      { s: 'lama', e: 'smile', t: 'قارني الحايط بالصورة. لا تستعجلين.' },
    ],
    's2.16-stand-nophoto': [{ s: 'anji', e: 'thinking', t: 'الصورة… لازم تكون بإيدي حتى أقارن. لمى عدها.' }],
    's2.16-stand-after': [{ s: 'anji', e: 'smile', t: 'الحامل وظلاله. هسه الحايط يحچي نفس الصورة.' }],
    's2.16-basket': [
      { if: `!${PLACED}`, then: [
        { s: 'anji', e: 'curious', t: 'ثمان فوانيس. السبعة اللي فحصتها بالشجرة… والثامن الجديد، على إيده شريطة.' },
        { s: 'anji', e: 'thinking', t: 'وكل واحد حبله بطول. الحبل يقرر شگد ينزل الفانوس.' },
      ] },
      { if: PLACED, then: [{ s: 'anji', e: 'soft', t: 'بالسلة بقى الثامن، بشريطته. فتيلته بيضاء… ينتظر.' }] },
    ],
    's2.16-sabri': [
      { if: 'dec:office-cover=truth', then: [{ s: 'sabri', e: 'smile', t: 'من يوم المكتب ما أخبي شي. بس السلّم… هذا يخبي إنه مو ثابت.' }] },
      { if: 'dec:office-cover=cover', then: [{ s: 'sabri', e: 'worried', t: 'الطابعة مو هنا، الحمد لله. بس السلّم… نفس طبعها.' }] },
      { if: ['!dec:office-cover=truth', '!dec:office-cover=cover'], then: [{ s: 'sabri', e: 'worried', t: 'آني ماسك السلّم. لا تحچين وياي هواية، أفقد التركيز.' }] },
    ],
    's2.16-ryan': [
      { if: `!${PLACED}`, then: [{ s: 'ryan', e: 'smile', t: 'آني أتفرج بس. اليوم ما أصعد سلالم.' }, { s: 'snooki', e: 'smug', t: 'يخاف من السلّم. آني لا.' }] },
      { if: PLACED, then: [{ s: 'ryan', e: 'smile', t: 'التسعة… خليها بيناتنا شوية بعد.' }] },
    ],
    's2.16-jojo': [
      { if: `!${PLACED}`, then: [{ s: 'jojo', e: 'smile', t: 'الفوانيس تنتظر. وآني أنتظر وياها… هالمرة على الوقت.', act: [{ pose: 'jojo', anim: 'think', for: 900 }] }] },
      { if: PLACED, then: [{ s: 'jojo', e: 'shy', t: 'تسعة ساعتي، عشرة ساعتكم. الحساب بسيط، بنتي… وأنا اللي غلطت بيه.' }] },
    ],
    's2.16-table': [
      { if: '!ev:d-timeline', then: [{ s: 'anji', e: 'thinking', t: 'طاولة ريان. لمى حطت السجل مفتوح، مثل ما چان تلك الليلة.' }] },
      { if: 'ev:d-timeline', then: [{ s: 'anji', e: 'smirk', t: 'هنا انگطعت الصفحة. والمتهمة تهز ذيلها.' }] },
    ],
    /* ── the night in order ── */
    's2.16-solved': [
      { s: 'narrator', t: '(صبري يعلّگ الفوانيس وحدة وحدة، والسلّم يتمايل وياه.)' },
      { s: 'sabri', e: 'worried', t: 'ثابت! السلّم ثابت! … آني اللي مو ثابت.', act: [{ jolt: 'sabri', type: 'shake', ms: 900 }] },
      { s: 'anji', e: 'smile', t: 'هيچ چانت. نفس الظلال، نفس الصورة.' },
      { s: 'lama', e: 'surprised', t: 'والثامن؟ ما علّگتيه؟' },
      { s: 'anji', e: 'determined', t: 'سبع ظلال بالصورة، وثمان فوانيس. والثامن فتيلته ما انحرگت أبد… ما چان بالشجرة. بقى بالعلّية، مثل ما انطلب.' },
    ],
    's2.16-times': [
      { s: 'lama', e: 'smile', t: 'هسه الأوقات. تلفوني تقدّم ساعة وحده تلك الليلة. ساعة الحديقة… لا.', act: [{ pose: 'lama', anim: 'point', for: 900 }] },
      { s: 'lama', e: 'thinking', t: 'صورة الضيوف يعلّگون فوانيسهم: تلفوني ٨:٣٠. ساعة الحديقة چانت تگول ٧:٣٠.' },
      { s: 'lama', e: 'thinking', t: 'وصورة الشجرة ظلمة، ريان واگف ينتظر: تلفوني ٩:٠٠.' },
      { s: 'lama', e: 'surprised', t: 'والفوانيس ولعت لمن ساعة الحديقة گالت تسعة. تلفوني گال عشرة!', act: [{ jolt: 'lama', type: 'hop' }] },
      { if: MAP, then: [{ s: 'jojo', e: 'shy', t: 'تسعة ساعتي. ولّعتها واحد واحد، مثل كل سنة… بس متأخر ساعة.', act: [{ pose: 'jojo', anim: 'facepalm', for: 1400 }, { puff: 'jojo', type: 'sweat', ms: 1600 }] }] },
      { if: `!${MAP}`, then: [{ s: 'anji', e: 'thinking', t: 'ودفتر العم جوجو يگول: الأول… السابع، ولعت. بتسعته هو.' }, { s: 'sabri', e: 'smile', t: 'هسه آني أولّعها. عندي قداحة… وعندي إيمان.', act: [{ jolt: 'sabri', type: 'hop' }] }] },
    ],
    's2.16-lit': [
      { s: 'narrator', t: '(الفوانيس تولع وحدة وحدة… وعلى الحايط تطلع الظلال، مثل الصورة بالضبط.)' },
      { s: 'anji', e: 'thinking', t: 'والسابع آخر واحد. انعلّگ آخر شي، وولع آخر شي. ولمن چان بعده مطفي…' },
      { s: 'anji', e: 'curious', t: '… بطاقة ريان چانت واگعة جنبه. وربيع شالها لأقرب فانوس مضوي: فانوسه، السادس.' },
    ],
    's2.16-card': [
      { s: 'narrator', t: '(لمن ولع الرابع، ضوه بيّن البطاقة اللي بداخله: ظل كتابة على الورق، يتگرا من بعيد.)' },
      { s: 'lama', e: 'worried', t: 'صورتي اللي بعدها، ١٠:٠٦… إيد تمد للرابع.', act: [{ pose: 'lama', anim: 'shrug', for: 1000 }] },
      { s: 'anji', e: 'soft', t: 'أختي. كتبت أمنية، وبالضو صارت تنگرا لكل واحد… فشالتها ومسحتها.' },
      { s: 'anji', e: 'thinking', t: 'البطاقة البيضاء ما چانت فارغة. انمسحت باللحظة اللي بانت بيها الظلال.' },
    ],
    's2.16-page': [
      { s: 'lama', e: 'laugh', t: 'وهاي ١٠:٢١… صورة مهزوزة. ذيل أبيض راكض!' },
      { s: 'narrator', t: '(السجل چان مفتوح على طاولة ريان. ورقة حلويات طاحت بين صفحاته… والهاسكي شمّت الحلو.)' },
      { if: 'flag:sp1-husky-met', then: [{ s: 'anji', e: 'smirk', t: '{husky}… گطعتي الصفحة ورحتي بيها لمخبأچ.' }, { s: 'narrator', t: '({husky} تهز ذيلها، وما تنكر شي.)' }] },
      { s: 'anji', e: 'thinking', t: 'يعني الصفحة انگطعت بعد ما ولعت الفوانيس. بعد العشرة. محد گطعها حتى يخبي شي.' },
      { s: 'lama', e: 'smile', t: 'الليلة كلها بالترتيب. أكتبها؟', act: [{ pose: 'lama', anim: 'point', for: 800 }] },
    ],
    's2.16-surprise': [
      { s: 'ryan', t: '… التسعة.' },
      { s: 'anji', e: 'curious', t: 'شبيها التسعة؟' },
      { s: 'ryan', t: 'چانت عندي… شي. على التسعة بالضبط، لحظة ما تولع الفوانيس.' },
      { s: 'ryan', t: 'وگفت أنتظر. التسعة إجت، والشجرة ظلمة.', act: [{ puff: 'ryan', type: 'steam', ms: 1400 }] },
      { s: 'snooki', e: 'smug', t: 'وگف ساعة وخمس دقايق. آني عدّيت.' },
      { s: 'lama', e: 'surprised', t: 'لأن تسعة ساعة الحديقة… چانت عشرة!', act: [{ jolt: 'lama', type: 'hop' }] },
      { s: 'anji', e: 'smile', t: 'وشنو چان هذا «الشي»؟' },
      { s: 'ryan', e: 'smile', t: 'مو الليلة.', act: [{ move: 'ryan', x: BASKET_X + 50, speed: 120 }, { face: 'ryan', dir: -1 }] },
      { s: 'ryan', e: 'smile', t: 'هذا يبقى مطفي. ليلته بعدها جاية.' },
      // tree-tease (M1): what she said at the moved card
      {
        if: 'dec:tree-tease=yes',
        then: [
          { s: 'ryan', t: 'وبطاقتي اللي لگيناها بفانوس ربيع؟ گلتي: «يمكن ربيع يحب خطك».' },
          { s: 'anji', e: 'smirk', t: 'وهسه؟' },
          { s: 'ryan', e: 'smile', t: 'هسه نعرف: طاحت جنب فانوس مطفي، وربيع حطها بالمضوي. مو حب بخطي.', act: [{ puff: 'ryan', type: 'steam', ms: 1200 }] },
          { s: 'anji', e: 'smirk', t: 'أكيد؟' },
          { s: 'ryan', t: '… أكيد.' },
        ],
      },
      {
        if: 'dec:tree-tease=no',
        then: [
          { s: 'ryan', t: 'تتذكرين عند بطاقتي، الصبح؟ گلتي: «هسه نعرف».' },
          { s: 'anji', e: 'smile', t: 'وهسه نعرف أكثر.' },
          { s: 'ryan', e: 'smile', t: 'رسمياً.' },
        ],
      },
    ],
  },
  scenes: [S2_TREE_NIGHT],
  // M1's lantern tree, by day: Lama, while this mission is open, takes her to the night
  patches: {
    's2-tree': {
      actors: [{ id: 'lama', kind: 'lama', x: 290, facing: 1, if: [OPEN, `!${DONE}`], notice: { dist: 110, emote: '!' } }],
      interact: [
        { id: 'lama', actor: 'lama', x: 290, w: 46, h: 120, label: 'لمى', icon: '🌙', if: [OPEN, `!${DONE}`], run: [{ say: 's2.16-tree-lama' }, { fade: 'out' }, { goto: 's2-tree-night', x: 160 }] },
        { id: 'ryan', cases: [{ if: [OPEN, `!${DONE}`], run: [{ say: 's2.16-ryan-day' }] }] },
      ],
    },
  },
};

export { CONFIG as SHADOWS_CONFIG, NIGHT as NIGHT_LAYOUT, RYAN_SPOT };
