/**
 * Phase 04 «الحديقة العميقة» — fourteen new locations (the map's second page) and the
 * entrances / evidence added to five garden places (workshop, house, observatory,
 * conservatory, garden), merged in by data/scenes/index.js like Story Pack 02's extras.
 *
 * Conventions (same as sp2.js): a beat that completes a step is guarded by its own result
 * flag, so an interrupted beat replays and a finished one never repeats; an intro line is
 * said once (`seen:`), never on every visit; a puzzle closed half-way keeps its stage/draft.
 * Facts picked up become journal entries (the evidence notebook lists them by place).
 */
import { GROUND } from '../../world/props.js';
import { DEEP_OPEN, DEEP_UNLOCK } from '../missions-deep.js';

const once = (key) => ({ if: `!seen:${key}`, then: [{ say: key }] });
/** A door to another place (the same place the map would take her). */
const door = (id, x, label, to, cond, spawn = 140) => ({ id, x, w: 56, h: 120, label, icon: '🚪', if: cond, run: [{ fade: 'out' }, { goto: to, x: spawn }] });
/** A fact to read once: it goes to the journal, and the object stays readable from there. */
const fact = (id, x, label, icon, flag, say, cond = []) => ({
  id,
  x,
  w: 56,
  h: 90,
  label,
  icon,
  if: [...[].concat(cond), `!flag:${flag}`],
  run: [{ say }, { fx: [`flag:${flag}`, `journal:${flag}`] }],
});
/** A puzzle station: intro once, the puzzle (resumes), a line when done, a line on return. */
const station = (id, x, label, icon, { puzzle, flag, intro, done, later = 'dg.later', again, waits = [] }) => ({
  id,
  x,
  w: 80,
  h: 110,
  label,
  icon,
  cases: [
    { if: `flag:${flag}`, run: [{ say: again }] },
    ...waits.map(([cond, say]) => ({ if: { not: cond }, run: [{ say }] })),
    { run: [...(intro ? [once(intro)] : []), { puzzle, then: [{ say: done }], else: [{ say: later }] }] },
  ],
});
const torches = (xs) => xs.map((x) => ({ x, reach: 80, draw: (ctx, { P, t, world }) => P.wallTorch(ctx, x, 90, t, world.reduced) }));
const enter = (id) => [{ id: 'enter', x1: 140, x2: 320, once: false, if: `!flag:dg-in-${id}`, run: [{ say: `dg.${id}-enter` }, { fx: `flag:dg-in-${id}` }] }];

/** A small glowing sign on the floor where a door leads deeper (drawn under the door's icon). */
const doorGlow = (x, cond) => ({
  x,
  reach: 40,
  if: cond,
  draw(ctx, { t, world }) {
    const a = world.reduced ? 0.6 : 0.4 + 0.25 * Math.sin(t * 2);
    ctx.fillStyle = '#2a2140';
    ctx.fillRect(x - 22, GROUND - 110, 44, 112);
    ctx.strokeStyle = `rgba(159,215,255,${a})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 22, GROUND - 110, 44, 112);
  },
});

/* ── the deep garden: fourteen places ─────────────────────────── */
const CLOCKS = [
  { x: 300, h: 9, m: 30 },
  { x: 600, h: 10, m: 0 },
  { x: 900, h: 11, m: 40 },
  { x: 1200, h: 11, m: 55 },
];
export const CLOCKGARDEN = {
  id: 'clockgarden',
  title: 'حديقة الساعات الساكتة',
  theme: 'meadow',
  music: 'mystery',
  width: 1500,
  spawn: 140,
  seed: 401,
  props: [{ type: 'bush', x: 160 }, { type: 'bench', x: 750 }, { type: 'bush', x: 1420 }],
  dynamic: [
    { x: 1040, reach: 120, draw: (ctx, { P, t }) => P.pond(ctx, 1040, GROUND - 6, 110, t) },
    ...CLOCKS.map((c) => ({ x: c.x, reach: 60, draw: (ctx, { P }) => P.grandfatherClock(ctx, c.x, GROUND + 2, { h: c.h, m: c.m }) })),
    doorGlow(1420, 'flag:dg-timeline'),
  ],
  interact: [
    ...CLOCKS.map((c, i) => fact(`clock-${i + 1}`, c.x, 'ساعة ساكتة', '🕰', `dg-clock-${i + 1}`, `dg.clock-${i + 1}`)),
    door('music-door', 1420, 'باب صغير بالسياج', 'musicroom', 'flag:dg-timeline'),
  ],
  triggers: enter('clockgarden'),
  exits: [{ side: 'left', to: 'garden', spawn: 1630 }],
  ambient: [{ t: 'كل ساعة هنا وگفت بوقت. يعني كل وحدة شافت شي.' }, { t: 'تك… تك… لا، ولا وحدة تتكتك. هذا المخيف.' }],
};

export const LETTERHALL = {
  id: 'letterhall',
  title: 'قاعة الرسائل',
  theme: 'library',
  music: 'mystery',
  width: 1400,
  spawn: 140,
  seed: 402,
  props: [{ type: 'bookshelf', x: 260, w: 90, h: 150 }, { type: 'table', x: 640, w: 120 }, { type: 'bookshelf', x: 1240, w: 80, h: 160 }],
  dynamic: [
    { x: 1000, reach: 80, draw: (ctx, { P }) => P.corkBoard(ctx, 1000, 70, 'heart') },
    {
      x: 640,
      reach: 60,
      draw(ctx) {
        // three letters on the long table
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = k % 2 ? '#fff4dc' : '#efe2c4';
          ctx.fillRect(600 + k * 26, GROUND - 46 - (k % 2) * 2, 20, 13);
        }
      },
    },
    doorGlow(1320, 'flag:dg-trails'),
  ],
  interact: [
    {
      id: 'letters',
      x: 640,
      w: 110,
      h: 80,
      label: 'الشهادات',
      icon: '✉️',
      cases: [
        { if: '!flag:dg-letters-read', run: [{ say: 'dg.letters' }, { fx: ['flag:dg-letters-read', 'journal:dg-letters'] }] },
        { if: 'flag:dg-testimony', run: [{ say: 'dg.letters-again' }] },
        { run: [once('dg.testimony-intro'), { puzzle: 'dg-testimony', then: [{ say: 'dg.testimony-done' }], else: [{ say: 'dg.testimony-later' }] }] },
      ],
    },
    {
      id: 'night-board',
      x: 1000,
      w: 90,
      h: 120,
      label: 'لوحة الليلة',
      icon: '📌',
      if: 'flag:dg-letters-read',
      cases: [
        { if: 'flag:dg-timeline', run: [{ say: 'dg.order-again' }] },
        { if: '!flag:dg-testimony', run: [{ say: 'dg.order-wait' }] },
        { run: [{ puzzle: 'dg-order', then: [{ say: 'dg.order-done' }], else: [{ say: 'dg.later' }] }] },
      ],
    },
    door('hypo-door', 1320, 'باب غرفة الفرضيات', 'hyporoom', 'flag:dg-trails'),
  ],
  triggers: enter('letterhall'),
  exits: [{ side: 'left', to: 'house', spawn: 1480 }],
  ambient: [{ t: 'كل رسالة بالحديقة توصل هنا. حتى رسايلي للبسكويت.' }, { t: 'ريحة حبر… وريحة كذب صغير. أشمها.', if: '!flag:dg-testimony' }],
};

// three trails leave the workshop's back door: a wide dusty drag, even rake marks, small wet paws
const trailMarks = (x, kind) => ({
  x,
  reach: 120,
  draw(ctx) {
    ctx.fillStyle = kind === 'paws' ? 'rgba(60,45,40,.6)' : 'rgba(70,55,45,.45)';
    for (let k = 0; k < 6; k++) {
      const px = x - 100 + k * 40;
      if (kind === 'wide') ctx.fillRect(px - 16, GROUND + 4, 34, 6);
      else if (kind === 'even') ctx.fillRect(px - 2, GROUND + 3, 4, 9);
      else {
        ctx.beginPath();
        ctx.ellipse(px, GROUND + 6 + (k % 2) * 4, 4.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
});
export const FALSETRAILS = {
  id: 'falsetrails',
  title: 'حديقة الآثار الكاذبة',
  theme: 'sanctuary',
  music: 'mystery',
  width: 1500,
  spawn: 140,
  seed: 403,
  props: [{ type: 'bush', x: 330 }, { type: 'tree', x: 1380 }],
  dynamic: [trailMarks(520, 'wide'), trailMarks(860, 'even'), trailMarks(1180, 'paws')],
  interact: [
    { id: 'rake', x: 230, w: 50, h: 90, label: 'گرابة مسنودة', icon: '🧹', run: [{ say: 'dg.rake' }] },
    { id: 'trail-wide', x: 520, w: 90, h: 50, label: 'أثر عريض', icon: '🔎', run: [{ say: 'dg.trail-wide' }] },
    { id: 'trail-even', x: 860, w: 90, h: 50, label: 'خطوط متساوية', icon: '🔎', run: [{ say: 'dg.trail-even' }] },
    { id: 'trail-paws', x: 1180, w: 90, h: 50, label: 'كفوف صغيرة', icon: '🔎', run: [{ say: 'dg.trail-paws' }] },
    station('trails', 1330, 'أي أثر؟', '🐾', {
      puzzle: 'dg-tracks',
      flag: 'dg-trails',
      intro: 'dg.tracks-intro',
      done: 'dg.tracks-done',
      again: 'dg.tracks-again',
      waits: [[['seen:dg.trail-wide', 'seen:dg.trail-even', 'seen:dg.trail-paws', 'seen:dg.rake'], 'dg.tracks-wait']],
    }),
  ],
  triggers: enter('falsetrails'),
  exits: [{ side: 'left', to: 'workshop', spawn: 1500 }],
  ambient: [{ t: 'آثار، آثار، آثار. وكلها تگول «اتبعني». مو كلها صادقة.' }],
};

export const SEALEDROOM = {
  id: 'sealedroom',
  title: 'غرفة المرصد المختومة',
  theme: 'observatory',
  music: 'mystery',
  width: 1300,
  spawn: 140,
  seed: 404,
  props: [],
  dynamic: [
    ...torches([200, 1100]),
    { x: 480, reach: 140, draw: (ctx, { P, t }) => P.wallSymbols(ctx, 420, 52, 1, t) },
    { x: 820, reach: 140, draw: (ctx, { P, t }) => P.wallSymbols(ctx, 760, 52, 1, t + 1) },
    doorGlow(1220, 'flag:dg-pattern'),
  ],
  interact: [
    station('walls', 640, 'حيطان الرموز', '✶', { puzzle: 'dg-pattern', flag: 'dg-pattern', intro: 'dg.pattern-intro', done: 'dg.pattern-done', again: 'dg.pattern-again' }),
    door('star-door', 1220, 'باب دولاب النجوم', 'starchamber', 'flag:dg-pattern'),
  ],
  triggers: enter('sealedroom'),
  exits: [{ side: 'left', to: 'observatory', spawn: 1450 }],
  ambient: [{ t: 'محد فتح هالغرفة من زمان. حتى الغبار نايم.' }],
};

export const STARCHAMBER = {
  id: 'starchamber',
  title: 'قاعة خريطة النجوم',
  theme: 'observatory',
  music: 'mystery',
  width: 1200,
  spawn: 140,
  seed: 405,
  props: [],
  dynamic: [
    { x: 300, reach: 120, draw: (ctx, { P }) => P.starChart(ctx, 300, 70) },
    {
      // the star wheel: turns to 11:40 once set
      x: 660,
      reach: 90,
      draw(ctx, { game, t, world }) {
        const cx = 660;
        const cy = GROUND - 90;
        ctx.fillStyle = '#1b1f4a';
        ctx.beginPath();
        ctx.arc(cx, cy, 62, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd977';
        ctx.lineWidth = 2;
        ctx.stroke();
        const turn = game.flag('dg-wheel') ? (11 * 30 + 20) * (Math.PI / 180) : world.reduced ? 0 : Math.sin(t * 0.3) * 0.2;
        for (let i = 0; i < 12; i++) {
          const a = turn + (i / 12) * Math.PI * 2;
          ctx.fillStyle = i === 0 ? '#ffd977' : 'rgba(159,215,255,.7)';
          ctx.beginPath();
          ctx.arc(cx + Math.sin(a) * 48, cy - Math.cos(a) * 48, i === 0 ? 4 : 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
    doorGlow(1120, 'flag:dg-wheel'),
  ],
  interact: [
    station('wheel', 660, 'دولاب النجوم', '✷', {
      puzzle: 'dg-wheel',
      flag: 'dg-wheel',
      intro: 'dg.wheel-intro',
      done: 'dg.wheel-done',
      again: 'dg.wheel-again',
      waits: [['flag:dg-timeline', 'dg.wheel-wait']],
    }),
    door('mirror-door', 1120, 'باب بيت المرايا', 'mirrorhouse', 'flag:dg-wheel'),
  ],
  triggers: enter('starchamber'),
  exits: [{ side: 'left', to: 'sealedroom', spawn: 1150 }],
  ambient: [{ t: 'النجوم هنا مرسومة… بس تتحرك. لا تسأليني. آني كلب.' }],
};

const mirror = (x) => ({
  x,
  reach: 50,
  draw(ctx, { t, world }) {
    ctx.fillStyle = '#5a3d2c';
    ctx.fillRect(x - 30, GROUND - 150, 60, 150);
    const g = ctx.createLinearGradient(x - 24, 0, x + 24, 0);
    const s = world.reduced ? 0.5 : 0.5 + 0.2 * Math.sin(t + x);
    g.addColorStop(0, '#9fb6d8');
    g.addColorStop(s, '#eaf4ff');
    g.addColorStop(1, '#8aa4cc');
    ctx.fillStyle = g;
    ctx.fillRect(x - 24, GROUND - 144, 48, 138);
  },
});
export const MIRRORHOUSE = {
  id: 'mirrorhouse',
  title: 'بيت المرايا',
  theme: 'conservatory',
  music: 'mystery',
  width: 1300,
  spawn: 140,
  seed: 406,
  props: [{ type: 'pot', x: 260, tone: 'blue' }, { type: 'pot', x: 1180, tone: 'pink' }],
  dynamic: [mirror(420), mirror(700), mirror(980)],
  interact: [
    { id: 'mirror-1', x: 420, w: 60, h: 150, label: 'مراية', icon: '🪞', run: [{ say: 'dg.mirror-side' }] },
    station('mirror-line', 700, 'المراية الكبيرة', '🪞', { puzzle: 'dg-mirror', flag: 'dg-mirror', intro: 'dg.mirror-intro', done: 'dg.mirror-done', again: 'dg.mirror-again' }),
    { id: 'mirror-3', x: 980, w: 60, h: 150, label: 'مراية', icon: '🪞', run: [{ say: 'dg.mirror-side2' }] },
  ],
  triggers: enter('mirrorhouse'),
  exits: [{ side: 'left', to: 'starchamber', spawn: 1050 }],
  ambient: [{ t: 'ثلاث سنوكيات بالمرايا. وكلهم وسيمين.' }],
};

export const HYPOROOM = {
  id: 'hyporoom',
  title: 'غرفة الفرضيات الأربع',
  theme: 'study',
  music: 'mystery',
  width: 1200,
  spawn: 140,
  seed: 407,
  props: [{ type: 'table', x: 340, w: 80 }, { type: 'bookshelf', x: 1120, w: 80, h: 150 }],
  dynamic: [{ x: 680, reach: 90, draw: (ctx, { P }) => P.corkBoard(ctx, 680, 70, 'heart') }],
  interact: [
    station('hypotheses', 680, 'لوحة الفرضيات', '📌', {
      puzzle: 'dg-board',
      flag: 'dg-hypo',
      intro: 'dg.board-intro',
      done: 'dg.confess',
      again: 'dg.board-again',
      waits: [
        ['flag:dg-timeline', 'dg.board-wait-night'],
        ['flag:dg-pot', 'dg.board-wait-pot'],
      ],
    }),
  ],
  triggers: enter('hyporoom'),
  exits: [{ side: 'left', to: 'letterhall', spawn: 1250 }],
  ambient: [{ t: 'أربع فرضيات. وآني بريء بكلها. تقريباً.', if: '!flag:dg-hypo' }, { t: 'آني اعترفت. خلاص. لا تكررونها.', if: 'flag:dg-hypo' }],
};

export const ROOTS = {
  id: 'roots',
  title: 'سرداب الجذور',
  theme: 'passage',
  music: 'mystery',
  width: 1400,
  spawn: 140,
  seed: 408,
  props: [],
  dynamic: [
    ...torches([220, 760, 1240]),
    {
      // roots across the floor, breathing
      x: 820,
      reach: 260,
      draw(ctx, { t, world }) {
        ctx.strokeStyle = '#5b3d2a';
        ctx.lineWidth = 6;
        for (let k = 0; k < 5; k++) {
          const sway = world.reduced ? 0 : Math.sin(t * 1.4 + k) * 4;
          ctx.beginPath();
          ctx.moveTo(600 + k * 90, GROUND - 160);
          ctx.quadraticCurveTo(620 + k * 90 + sway, GROUND - 60, 600 + k * 90, GROUND + 4);
          ctx.stroke();
        }
      },
    },
    doorGlow(1320, 'flag:dg-roots-maze'),
  ],
  interact: [
    fact('note-water', 420, 'ورقة على الحايط', '📜', 'dg-note-water', 'dg.note-water'),
    station('root-gates', 820, 'بوابات الجذور', '🌱', { puzzle: 'dg-roots-maze', flag: 'dg-roots-maze', intro: 'dg.roots-intro', done: 'dg.roots-done', again: 'dg.roots-again' }),
    door('hedge-door', 1320, 'فتحة بالجذور', 'hedgemaze', 'flag:dg-roots-maze'),
  ],
  triggers: enter('roots'),
  exits: [{ side: 'left', to: 'conservatory', spawn: 1370 }],
  ambient: [{ t: 'الجذور تتنفس. شهيق… زفير… لا، هذا آني.' }],
};

export const HEDGEMAZE = {
  id: 'hedgemaze',
  title: 'متاهة السياج الدوّارة',
  theme: 'meadow',
  music: 'mystery',
  width: 1300,
  spawn: 140,
  seed: 409,
  props: [{ type: 'bush', x: 300 }, { type: 'bush', x: 420 }, { type: 'bush', x: 980 }, { type: 'bush', x: 1100 }],
  dynamic: [doorGlow(1220, 'flag:dg-hedge')],
  interact: [
    station('hedge', 700, 'مدخل المتاهة', '🌿', { puzzle: 'dg-hedge', flag: 'dg-hedge', intro: 'dg.hedge-intro', done: 'dg.hedge-done', again: 'dg.hedge-again' }),
    door('bridge-door', 1220, 'درب الجسر', 'bridge', 'flag:dg-hedge'),
  ],
  triggers: enter('hedgemaze'),
  exits: [{ side: 'left', to: 'roots', spawn: 1250 }],
  ambient: [{ t: 'السياج يدور لمن ما نباوعله. وقح.' }],
};

export const BRIDGE = {
  id: 'bridge',
  title: 'الجسر المخفي',
  theme: 'lake',
  music: 'mystery',
  width: 1400,
  spawn: 140,
  seed: 410,
  props: [],
  dynamic: [
    {
      // four planks: hanging until the bridge is down
      x: 760,
      reach: 220,
      draw(ctx, { game }) {
        const down = game.flag('dg-bridge');
        ctx.fillStyle = '#7a5a3a';
        for (let k = 0; k < 4; k++) {
          const x = 620 + k * 80;
          if (down) ctx.fillRect(x - 34, GROUND - 6, 70, 10);
          else ctx.fillRect(x - 4, GROUND - 90 + (k % 2) * 16, 10, 70);
        }
        ctx.strokeStyle = '#c9b07a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(560, GROUND - 120);
        ctx.lineTo(960, GROUND - 120);
        ctx.stroke();
      },
    },
    doorGlow(1320, 'flag:dg-bridge'),
    doorGlow(1080, 'flag:dg-bridge'),
  ],
  interact: [
    station('ropes', 470, 'حبال الجسر', '🪢', { puzzle: 'dg-bridge', flag: 'dg-bridge', intro: 'dg.bridge-intro', done: 'dg.bridge-done', again: 'dg.bridge-again' }),
    door('light-door', 1080, 'درب المنارة (اختياري)', 'lighthouse', 'flag:dg-bridge'),
    door('green-door', 1320, 'باب البيت الأخضر', 'forgottengreen', 'flag:dg-bridge'),
  ],
  triggers: enter('bridge'),
  exits: [{ side: 'left', to: 'hedgemaze', spawn: 1150 }],
  ambient: [{ t: 'الماي تحت الجسر يلمع. مثل عيوني لمن أشوف بسكويت.' }],
};

export const LIGHTHOUSE = {
  id: 'lighthouse',
  title: 'منارة الذكريات',
  theme: 'lake',
  music: 'warm',
  width: 1100,
  spawn: 140,
  seed: 411,
  props: [],
  actors: [{ id: 'husky', kind: 'husky', x: 820, facing: -1, if: { any: ['flag:sp2-husky-early', 'flag:sp1-husky-met'] } }],
  dynamic: [
    {
      x: 560,
      reach: 120,
      draw(ctx, { game, t, world }) {
        const lit = game.flag('dg-lights');
        ctx.fillStyle = '#e8e2d4';
        ctx.fillRect(530, GROUND - 230, 60, 232);
        ctx.fillStyle = '#b5443a';
        for (let k = 0; k < 3; k++) ctx.fillRect(530, GROUND - 200 + k * 70, 60, 18);
        ctx.fillStyle = lit ? `rgba(255,226,140,${world.reduced ? 0.9 : 0.7 + 0.3 * Math.sin(t * 2)})` : '#3a3550';
        ctx.fillRect(540, GROUND - 256, 40, 26);
      },
    },
  ],
  interact: [
    {
      id: 'lamps',
      x: 560,
      w: 80,
      h: 200,
      label: 'فوانيس المنارة',
      icon: '🏮',
      cases: [
        { if: 'flag:dg-lights', run: [{ say: 'dg.lights-again' }] },
        { run: [once('dg.lights-intro'), { puzzle: 'dg-lights', then: [{ say: 'dg.lights-done' }], else: [{ say: 'dg.later' }] }] },
      ],
    },
  ],
  triggers: enter('lighthouse'),
  exits: [{ side: 'left', to: 'bridge', spawn: 1000 }],
  ambient: [{ t: 'منارة بنص الحديقة؟ ريان يحب المبالغة. آني أحترم هذا.' }],
};

export const FORGOTTENGREEN = {
  id: 'forgottengreen',
  title: 'البيت الأخضر المنسي',
  theme: 'conservatory',
  music: 'mystery',
  width: 1300,
  spawn: 140,
  seed: 412,
  props: [{ type: 'pot', x: 300, tone: 'blue' }, { type: 'pot', x: 380, tone: 'pink' }, { type: 'lantern', x: 1100, height: 110 }],
  dynamic: [
    {
      // the seasons machine with the sleeping seed in its glass
      x: 700,
      reach: 120,
      draw(ctx, { game, t, world }) {
        ctx.fillStyle = '#4b4f78';
        ctx.fillRect(640, GROUND - 120, 120, 122);
        ctx.fillStyle = '#2a2e44';
        ctx.fillRect(656, GROUND - 106, 88, 40);
        const awake = game.flag('dg-awake');
        const a = world.reduced ? 0.8 : 0.55 + 0.3 * Math.sin(t * (awake ? 3 : 1));
        ctx.fillStyle = awake ? `rgba(120,190,255,${a})` : `rgba(160,170,200,${a * 0.5})`;
        ctx.beginPath();
        ctx.arc(700, GROUND - 86, 9, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#c9b07a';
          ctx.fillRect(652 + i * 26, GROUND - 52, 12, 30);
        }
      },
    },
    doorGlow(1220, 'flag:dg-awake'),
  ],
  interact: [
    station('seasons', 700, 'آلة الفصول', '⚙️', {
      puzzle: 'dg-seasons',
      flag: 'dg-awake',
      intro: 'dg.seasons-intro',
      done: 'dg.seasons-done',
      again: 'dg.seasons-again',
      // the warmth note comes with Snooki's confession (dg-hypo)
      waits: [[['flag:dg-mirror', 'flag:dg-note-water', 'flag:dg-hypo'], 'dg.seasons-wait']],
    }),
    door('evidence-door', 1220, 'باب غرفة الأدلة', 'evidenceroom', 'flag:dg-awake'),
  ],
  triggers: enter('forgottengreen'),
  exits: [{ side: 'left', to: 'bridge', spawn: 1250 }],
  ambient: [{ t: 'هنا الهوا ريحته مثل أول يوم بالحديقة.' }],
};

export const EVIDENCEROOM = {
  id: 'evidenceroom',
  title: 'غرفة الأدلة الأخيرة',
  theme: 'academy',
  music: 'warm',
  width: 1200,
  spawn: 140,
  seed: 413,
  props: [{ type: 'table', x: 620, w: 120, cloth: '#3a2a4a' }],
  dynamic: [
    {
      x: 620,
      reach: 80,
      draw(ctx, { game }) {
        // the four strips on the table; whole once the page is put together
        const n = ['dg-strip-a', 'dg-strip-b', 'dg-strip-c', 'dg-strip-d'].filter((j) => game.inJournal(j)).length;
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = '#efe2c4';
          ctx.fillRect(570 + k * 26, GROUND - 48, game.flag('dg-done') ? 26 : 20, 12);
        }
      },
    },
  ],
  interact: [station('page', 620, 'الصفحة الأخيرة', '📜', { puzzle: 'dg-ritual', flag: 'dg-done', intro: 'dg.ritual-intro', done: 'dg.ritual-done', again: 'dg.ritual-again' })],
  triggers: enter('evidenceroom'),
  exits: [{ side: 'left', to: 'forgottengreen', spawn: 1150 }],
  ambient: [{ t: 'كل شي لگيناه… صار على هالطاولة.' }],
};

export const MUSICROOM = {
  id: 'musicroom',
  title: 'غرفة الموسيقى المهجورة',
  theme: 'gameroom',
  music: 'warm',
  width: 1100,
  spawn: 140,
  seed: 414,
  props: [{ type: 'rug', x: 560 }],
  dynamic: [
    {
      x: 560,
      reach: 140,
      draw(ctx, { game, t, world }) {
        // four bells on a beam
        ctx.fillStyle = '#5a3d2c';
        ctx.fillRect(420, GROUND - 170, 280, 8);
        for (let k = 0; k < 4; k++) {
          const x = 450 + k * 74;
          const swing = world.reduced || !game.flag('dg-song') ? 0 : Math.sin(t * 3 + k) * 3;
          ctx.fillStyle = '#d8a73a';
          ctx.beginPath();
          ctx.moveTo(x - 16 + swing, GROUND - 120);
          ctx.quadraticCurveTo(x + swing, GROUND - 170, x + 16 + swing, GROUND - 120);
          ctx.closePath();
          ctx.fill();
        }
      },
    },
  ],
  interact: [station('bells', 560, 'الأجراس', '🔔', { puzzle: 'dg-song', flag: 'dg-song', intro: 'dg.song-intro', done: 'dg.song-done', again: 'dg.song-again' })],
  triggers: enter('musicroom'),
  exits: [{ side: 'left', to: 'clockgarden', spawn: 1350 }],
  ambient: [{ t: 'غرفة موسيقى بلا موسيقى. حزينة. مثل صحن بلا أكل.' }],
};

export const DEEP_SCENES = [CLOCKGARDEN, LETTERHALL, FALSETRAILS, SEALEDROOM, STARCHAMBER, MIRRORHOUSE, HYPOROOM, ROOTS, HEDGEMAZE, BRIDGE, LIGHTHOUSE, FORGOTTENGREEN, EVIDENCEROOM, MUSICROOM];

/* ── entrances and evidence in garden places ──────────────────── */
export const DEEP_EXTRAS = {
  workshop: {
    interact: [
      {
        id: 'dg-seedbox',
        x: 760,
        w: 50,
        h: 70,
        label: 'علبة البذرة الأخيرة',
        icon: '📦',
        if: DEEP_UNLOCK,
        cases: [
          // Snooki (with Ryan since the ending) comes running at the word «علبة», and stays for the case
          { if: '!flag:dg-box', run: [{ place: 'snooki', x: 690, facing: 1 }, { show: 'snooki' }, { say: 'dg.box' }, { fx: ['flag:dg-box', 'journal:dg-box'] }] },
          { if: 'flag:dg-done', run: [{ say: 'dg.box-done' }] },
          { run: [{ say: 'dg.box-again' }] },
        ],
      },
      fact('dg-guestbook', 1110, 'دفتر الزوار', '📖', 'dg-guestbook', 'dg.guestbook', 'flag:dg-box'),
      door('dg-backdoor', 1660, 'الباب الخلفي', 'falsetrails', DEEP_OPEN),
    ],
    dynamic: [
      {
        x: 760,
        reach: 40,
        if: DEEP_UNLOCK,
        draw(ctx, { P }) {
          P.table(ctx, 760, GROUND + 2, 50, { cloth: '#2b3a8c' });
          ctx.fillStyle = '#6b4e2a';
          ctx.fillRect(748, GROUND - 44, 24, 12);
        },
      },
      doorGlow(1660, DEEP_OPEN),
    ],
  },
  house: {
    interact: [
      fact('dg-bed', 560, 'فراش سنوكي', '🛏', 'dg-bed', 'dg.bed', 'flag:dg-letters-read'),
      door('dg-letterdoor', 1550, 'باب قاعة الرسائل', 'letterhall', DEEP_OPEN),
    ],
    dynamic: [doorGlow(1550, DEEP_OPEN)],
  },
  observatory: {
    interact: [
      fact('dg-log', 680, 'دفتر رصد منذر', '📓', 'dg-log', 'dg.log', 'flag:dg-letters-read'),
      door('dg-hatch', 1520, 'باب تحت القبة', 'sealedroom', DEEP_OPEN),
    ],
    dynamic: [doorGlow(1520, DEEP_OPEN)],
  },
  conservatory: {
    interact: [
      {
        id: 'dg-pot',
        x: 1450,
        w: 60,
        h: 70,
        label: 'سندانة مكسورة',
        icon: '🪴',
        if: { any: ['flag:dg-trails', 'flag:dg-pot'] },
        cases: [
          { if: '!flag:dg-pot', run: [{ say: 'dg.pot' }, { fx: ['flag:dg-pot', 'journal:dg-pot'] }] },
          { if: 'flag:dg-hypo', run: [{ say: 'dg.pot-down' }, { fade: 'out' }, { goto: 'roots', x: 140 }] },
          { run: [{ say: 'dg.pot-again' }] },
        ],
      },
    ],
  },
  garden: {
    interact: [door('dg-clockgate', 1700, 'بوابة الساعات', 'clockgarden', DEEP_OPEN)],
    dynamic: [doorGlow(1700, DEEP_OPEN)],
  },
  // the epilogue: the woken seed is planted with Ryan, next to the first rose (after the ending only)
  final: {
    interact: [
      {
        id: 'dg-second-rose',
        x: 1290,
        w: 50,
        h: 60,
        label: 'جنب الوردة الأولى',
        icon: '🌱',
        if: ['flag:game-complete', 'flag:dg-done', '!flag:dg-planted'],
        run: [
          { say: 'dg.plant-intro' },
          { move: 'snooki', x: 1290, speed: 240 },
          { pose: 'snooki', anim: 'excited', for: 800 },
          { say: 'dg.plant' },
          { shake: 0.2 },
          { fx: ['flag:dg-planted', 'journal:dg-planted'] },
          { say: 'dg.plant-done' },
        ],
      },
      { id: 'dg-rose-2', x: 1290, w: 40, h: 60, label: 'الوردة الثانية', icon: '🌹', glow: false, if: 'flag:dg-planted', run: [{ say: 'dg.rose-2' }] },
    ],
    dynamic: [
      {
        x: 1290,
        reach: 40,
        if: 'flag:dg-planted',
        draw(ctx, { P }) {
          ctx.strokeStyle = '#3f7a4a';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(1290, GROUND + 2);
          ctx.quadraticCurveTo(1294, GROUND - 10, 1290, GROUND - 18);
          ctx.stroke();
          P.rose(ctx, 1290, GROUND - 22, 5, 'pink');
        },
      },
    ],
  },
};

/** Scene with the deep garden's entrances and evidence appended (a new object). */
export function withDeep(scene) {
  const extra = DEEP_EXTRAS[scene.id];
  if (!extra) return scene;
  return {
    ...scene,
    interact: [...(scene.interact || []), ...(extra.interact || [])],
    dynamic: [...(scene.dynamic || []), ...(extra.dynamic || [])],
  };
}
