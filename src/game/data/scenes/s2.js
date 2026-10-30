/**
 * Season 2 «ملف الدائرة المغلقة» — M1 places (the map's third page, `region: 's2'`).
 * Every scene id starts with `s2-`, so everything a scene writes (visits, triggers, seen objects,
 * location) goes to Season 2's own save document (core/game.js) — never the original campaign's.
 *
 * Conventions (as in deep.js): a beat that completes a step is guarded by its own result, so an
 * interrupted beat replays and a finished one never repeats; an arrival line is said once and its
 * flag is set LAST (after the line); an intro line is said once (`seen:`); a puzzle closed half-way
 * keeps its stage. People are where the story puts them; Snooki stands with Ryan when Ryan is here
 * (data/companions.js), her husky walks with her once she has met her. Fiction written for the game.
 */
import { GROUND } from '../../world/props.js';
import { S2_OPEN, S2_HANDS_OPEN } from '../missions-s2.js';

const once = (key) => ({ if: `!seen:dlg:${key}`, then: [{ say: key }] });
const done = (id) => `flag:mission:${id}`;
const later = 's2.later';
const AFTER_BOARD = done('s2-04');
const WITNESSES = ['s2-05', 's2-06', 's2-07', 's2-08', 's2-09'].map(done);
/** An arrival line, once; the flag is set after it (an interrupted arrival replays). */
const arrive = (id, cond) => [{ id: 'arrive', x1: 100, x2: 340, once: false, if: [...[].concat(cond ?? []), `!flag:s2:in-${id}`], run: [{ say: `s2.${id}-enter` }, { fx: `flag:s2:in-${id}` }] }];
/** The same pseudo-random sequence every frame (a tree drawn twice looks the same). */
const seeded = (seed) => {
  let v = seed;
  return () => (v = (v * 9301 + 49297) % 233280) / 233280;
};
const toArchive = { side: 'left', to: 's2-archive', spawn: 1180 };

/** A paper lantern hanging from a branch: lit (a warm glow, a flame) or dark. */
function hangingLantern(ctx, x, y, lit, t, reduced) {
  ctx.strokeStyle = '#2a2236';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y - 12);
  ctx.stroke();
  if (lit) {
    const a = reduced ? 0.5 : 0.42 + 0.12 * Math.sin(t * 3 + x);
    const g = ctx.createRadialGradient(x, y, 2, x, y, 34);
    g.addColorStop(0, `rgba(255,206,120,${a})`);
    g.addColorStop(1, 'rgba(255,206,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = lit ? '#f4c066' : '#5a5170';
  ctx.beginPath();
  ctx.ellipse(x, y, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lit ? '#fff1c8' : '#3a344c';
  ctx.fillRect(x - 6, y - 13, 12, 3);
  ctx.fillRect(x - 6, y + 10, 12, 3);
}

/* ── أرشيف الحديقة: the register, the copy, the lamp notice ─────────────── */
export const S2_ARCHIVE = {
  id: 's2-archive',
  title: 'أرشيف الحديقة',
  theme: 'library',
  music: 'mystery',
  width: 1400,
  spawn: 140,
  seed: 801,
  props: [{ type: 'bookshelf', x: 260, w: 90, h: 150 }, { type: 'table', x: 520, w: 130 }, { type: 'bookshelf', x: 1180, w: 80, h: 160 }],
  dynamic: [
    { x: 520, reach: 70, draw: (ctx, { P }) => P.paper(ctx, 520, GROUND - 52, 0) },
    { x: 860, reach: 80, draw: (ctx, { P }) => P.corkBoard(ctx, 860, 70, 'note') },
    { x: 1060, reach: 50, draw: (ctx, { P }) => P.paper(ctx, 1060, GROUND - 120, 0) },
  ],
  interact: [
    {
      id: 'register',
      x: 520,
      w: 120,
      h: 90,
      label: 'سجل الحديقة',
      icon: '📖',
      cases: [
        { if: '!ev:e-register', run: [{ say: 's2.register' }, { fx: 'ev:e-register' }] },
        { if: ['ev:e-copy', '!flag:s2:01-compared'], run: [{ puzzle: 's2-compare', then: [{ say: 's2.compare-done' }], else: [{ say: later }] }] },
        { if: '!ev:e-copy', run: [{ say: 's2.register-wait' }] },
        { run: [{ say: 's2.register-again' }] },
      ],
    },
    {
      id: 'copy',
      x: 860,
      w: 90,
      h: 120,
      label: 'النسخة المعلّگة',
      icon: '📌',
      cases: [{ if: '!ev:e-copy', run: [{ say: 's2.copy' }, { fx: 'ev:e-copy' }] }, { run: [{ say: 's2.copy-again' }] }],
    },
    { id: 'notice', x: 1060, w: 60, h: 90, label: 'ورقة الفوانيس', icon: '🏮', run: [{ say: 's2.notice' }, { fx: 'flag:s2:read-notice', quiet: true }] },
    { id: 'case-door', x: 1300, w: 56, h: 120, label: 'غرفة الدائرة', icon: '🚪', if: 'flag:s2:caseroom-open', run: [{ fade: 'out' }, { goto: 's2-caseroom', x: 140 }] },
  ],
  triggers: arrive('archive', S2_OPEN),
  exits: [{ side: 'left', to: 'garden', spawn: 1630 }],
  ambient: [{ t: 'ريحة ورق قديم وشمع. السجل هنا يكتب كل ليلة.' }, { t: 'كل شي بالأرشيف له رقم. حتى الصفحات اللي ضاعت.' }],
};

/* ── شجرة الفوانيس: seven lanterns, Ryan's table ─────────────────────────── */
const LANTERNS = [
  { n: 1, x: 220, lit: true },
  { n: 2, x: 360, lit: true },
  { n: 3, x: 500, lit: true },
  { n: 4, x: 640, lit: true, ev: 'e-blank' },
  { n: 5, x: 800, lit: true },
  { n: 6, x: 940, lit: true, ev: 'e-moved' },
  { n: 7, x: 1420, lit: false }, // behind the far branch
];
export const S2_TREE = {
  id: 's2-tree',
  title: 'شجرة الفوانيس',
  theme: 'garden-night',
  music: 'night',
  width: 1520,
  spawn: 140,
  seed: 802,
  props: [{ type: 'bush', x: 120 }, { type: 'bench', x: 700 }, { type: 'table', x: 1240, w: 90 }, { type: 'bush', x: 1360 }],
  actors: [{ id: 'ryan', kind: 'ryan', x: 1130, facing: -1, if: done('s2-01') }],
  dynamic: [
    { x: 700, reach: 420, draw: (ctx, { P }) => P.tree(ctx, 700, GROUND, 230, seeded(7), { color: '#1f3b46' }) },
    ...LANTERNS.map((l) => ({ x: l.x, reach: 40, draw: (ctx, { t, world }) => hangingLantern(ctx, l.x, GROUND - 150 - (l.n % 2) * 18, l.lit, t, world.reduced) })),
    { x: 1400, reach: 60, draw: (ctx, { P }) => P.tree(ctx, 1400, GROUND, 150, seeded(11), { color: '#1a3340' }) },
    { x: 1240, reach: 40, if: done('s2-01'), draw: (ctx, { P, t, world }) => P.coffeeMug(ctx, 1240, GROUND - 50, t, world.reduced) },
  ],
  interact: [
    ...LANTERNS.map((l) => ({
      id: `lantern-${l.n}`,
      x: l.x,
      w: 50,
      h: 200,
      label: `الفانوس ${['', '١', '٢', '٣', '٤', '٥', '٦', '٧'][l.n]}`,
      icon: '🏮',
      if: done('s2-01'),
      cases: [
        { if: `!flag:s2:lantern-${l.n}`, run: [{ say: `s2.lantern-${l.n}` }, { fx: [`flag:s2:lantern-${l.n}`, ...(l.ev ? [`ev:${l.ev}`] : [])] }] },
        // Rabi's lantern, once he has said why: the wax on Ryan's card (s2-05)
        ...(l.n === 6 ? [{ if: ['ev:t-rabi', '!ev:e-wax'], run: [once('s2.wax-intro'), { puzzle: 's2-wax', then: [{ say: 's2.wax-done' }], else: [{ say: later }] }] }] : []),
        { run: [{ say: `s2.lantern-${l.n}-again` }] },
      ],
    })),
    {
      id: 'trunk',
      x: 700,
      w: 60,
      h: 160,
      label: 'جذع الشجرة',
      icon: '🌳',
      if: done('s2-01'),
      cases: [
        { if: 'flag:s2:02-counted', run: [{ say: 's2.trunk-again' }] },
        { if: { not: LANTERNS.map((l) => `flag:s2:lantern-${l.n}`) }, run: [{ say: 's2.trunk-wait' }] },
        { run: [{ puzzle: 's2-count', then: [{ say: 's2.count-done' }], else: [{ say: later }] }] },
      ],
    },
    {
      id: 'ryan',
      x: 1130,
      w: 50,
      h: 130,
      label: 'ريان',
      icon: '💬',
      if: done('s2-01'),
      cases: [
        { if: '!flag:mission:s2-02', run: [{ say: 's2.ryan-tree-early' }] },
        { if: '!ev:e-note', run: [{ say: 's2.ryan-notebook' }] },
        { if: '!ev:e-whisper', run: [{ say: 's2.ryan-whisper' }, { fx: 'ev:e-whisper' }] },
        { if: '!flag:s2:03-sorted', run: [{ say: 's2.ryan-sort' }] },
        { run: [{ say: 's2.ryan-tree-again' }] },
      ],
    },
    {
      id: 'table',
      x: 1240,
      w: 80,
      h: 80,
      label: 'طاولة ريان',
      icon: '☕',
      if: done('s2-01'),
      cases: [
        { if: ['flag:mission:s2-02', '!ev:e-note'], run: [{ say: 's2.cup' }, { fx: 'ev:e-note' }] },
        { if: ['ev:e-whisper', '!flag:s2:03-sorted'], run: [{ puzzle: 's2-sort-1', then: [{ say: 's2.sort-done' }], else: [{ say: later }] }] },
        { run: [{ say: 's2.table-again' }] },
      ],
    },
  ],
  triggers: arrive('tree', done('s2-01')),
  exits: [{ side: 'left', to: 's2-archive', spawn: 1180 }],
  ambient: [{ t: 'كل فانوس بيه أمنية… وكل أمنية بيها حكاية.' }, { t: 'الشجرة ما تنام. حتى بالنهار، الفوانيس تلمع شوية.' }],
};

/* ── غرفة الدائرة: the case board ────────────────────────────────────────── */
export const S2_CASEROOM = {
  id: 's2-caseroom',
  title: 'غرفة الدائرة',
  theme: 'library',
  music: 'mystery',
  width: 1300,
  spawn: 140,
  seed: 803,
  props: [{ type: 'bookshelf', x: 240, w: 80, h: 150 }, { type: 'table', x: 1100, w: 110 }],
  actors: [{ id: 'ryan', kind: 'ryan', x: 980, facing: -1, if: done('s2-10') }],
  dynamic: [
    { x: 700, reach: 120, draw: (ctx, { P }) => P.corkBoard(ctx, 700, 60, 'mark') },
    { x: 760, reach: 60, draw: (ctx, { P }) => P.corkBoard(ctx, 790, 92, 'heart') },
  ],
  interact: [
    {
      id: 'board',
      x: 720,
      w: 160,
      h: 150,
      label: 'لوحة الدائرة',
      icon: '📌',
      cases: [
        { if: '!flag:s2:board-1', run: [once('s2.board-intro'), { puzzle: 's2-board-1', then: [{ say: 's2.board-1-done' }], else: [{ say: later }] }] },
        { if: [S2_HANDS_OPEN, '!ev:d-elim'], run: [once('s2.hands-intro'), { puzzle: 's2-hands', then: [{ say: 's2.hands-done' }], else: [{ say: later }] }] },
        { if: { not: S2_HANDS_OPEN }, run: [{ say: 's2.board-wait' }] },
        { if: ['flag:s2:11-talked', '!flag:s2:board-2'], run: [{ puzzle: 's2-board-2', then: [{ say: 's2.board-2-done' }], else: [{ say: later }] }] },
        { if: 'flag:s2:board-2', run: [{ say: 's2.board-m1' }] },
        { run: [{ say: 's2.board-again' }] },
      ],
    },
    {
      id: 'ryan',
      x: 980,
      w: 50,
      h: 130,
      label: 'ريان',
      icon: '💬',
      if: done('s2-10'),
      cases: [
        { if: { not: WITNESSES }, run: [{ say: 's2.ryan-room-wait' }] },
        { if: '!flag:s2:11-talked', run: [{ say: 's2.11-talk' }, { fx: ['flag:s2:11-talked', 'num:s2:rel:trust+1'] }] },
        { run: [{ say: 's2.ryan-room-again' }] },
      ],
    },
  ],
  triggers: arrive('caseroom'),
  exits: [toArchive],
  ambient: [{ t: 'اللوحة تنتظر. النظرية مو دليل… بس سؤال زين.' }],
};

/* ── العيادة: Rabi', Lama ─────────────────────────────────────────────────── */
export const S2_CLINIC = {
  id: 's2-clinic',
  title: 'العيادة',
  theme: 'academy',
  music: 'calm',
  width: 1400,
  spawn: 140,
  seed: 804,
  props: [{ type: 'bookshelf', x: 640, w: 70, h: 130 }, { type: 'table', x: 760, w: 100 }],
  actors: [
    { id: 'rabi', kind: 'rabi', x: 520, facing: 1, if: AFTER_BOARD },
    { id: 'lama', kind: 'lama', x: 1000, facing: -1, if: AFTER_BOARD },
    // Ryan, only while Rabi' has not told his side: he came for coffee, of course
    { id: 'ryan', kind: 'ryan', x: 300, facing: 1, if: [AFTER_BOARD, '!flag:mission:s2-05'] },
  ],
  dynamic: [{ x: 1180, reach: 80, draw: (ctx, { P }) => P.corkBoard(ctx, 1180, 70, 'note') }],
  interact: [
    {
      id: 'rabi',
      x: 520,
      w: 50,
      h: 130,
      label: 'ربيع',
      icon: '💬',
      if: AFTER_BOARD,
      cases: [
        {
          if: '!ev:t-rabi',
          run: [
            { say: 's2.rabi-1' },
            { social: { cat: 'compliment', replyFrom: 'rabi-reply' } },
            { say: 's2.rabi-2' },
            { fx: ['ev:t-rabi', 'ev:h-rabi'] },
          ],
        },
        { run: [{ social: { cat: 'professional' } }, { say: 's2.rabi-again' }] },
      ],
    },
    {
      id: 'lama',
      x: 1000,
      w: 50,
      h: 130,
      label: 'لمى',
      icon: '💬',
      if: AFTER_BOARD,
      cases: [
        { if: '!ev:t-lama', run: [{ social: { cat: 'greeting' } }, { say: 's2.lama-1' }, { fx: ['ev:t-lama', 'ev:h-lama'] }] },
        { if: '!ev:e-copy-diff', run: [{ say: 's2.lama-copy' }] },
        { run: [{ say: 's2.lama-again' }] },
      ],
    },
    {
      id: 'clinic-board',
      x: 1180,
      w: 90,
      h: 110,
      label: 'لوحة الإعلانات',
      icon: '📌',
      if: AFTER_BOARD,
      cases: [
        { if: '!ev:t-lama', run: [{ say: 's2.clinic-board-wait' }] },
        { if: '!ev:e-copy-diff', run: [once('s2.copy-intro'), { puzzle: 's2-copy', then: [{ say: 's2.copy-done' }], else: [{ say: later }] }] },
        { run: [{ say: 's2.clinic-board-again' }] },
      ],
    },
    { id: 'ryan', x: 300, w: 50, h: 130, label: 'ريان', icon: '💬', if: [AFTER_BOARD, '!flag:mission:s2-05'], run: [{ say: 's2.ryan-clinic' }] },
  ],
  triggers: arrive('clinic', AFTER_BOARD),
  exits: [toArchive],
  ambient: [{ t: 'ريحة معقم وورد. العيادة هادئة اليوم.' }],
};

/* ── صالة التمرين: Sabri (and Ryan) ──────────────────────────────────────── */
export const S2_GYM = {
  id: 's2-gym',
  title: 'صالة التمرين',
  theme: 'academy',
  music: 'calm',
  width: 1300,
  spawn: 140,
  seed: 805,
  props: [{ type: 'bench', x: 900 }],
  actors: [
    { id: 'sabri', kind: 'sabri', x: 700, facing: -1, if: AFTER_BOARD },
    { id: 'ryan', kind: 'ryan', x: 440, facing: 1, if: AFTER_BOARD },
  ],
  dynamic: [{ x: 520, reach: 30, if: ['ev:t-sabri', '!ev:e-receipt'], draw: (ctx, { P }) => P.paper(ctx, 520, GROUND - 6, 0) }],
  interact: [
    {
      id: 'sabri',
      x: 700,
      w: 50,
      h: 130,
      label: 'صبري',
      icon: '💬',
      if: AFTER_BOARD,
      cases: [
        { if: '!flag:s2:07-talked', run: [{ social: { cat: 'greeting' } }, { say: 's2.sabri-1' }, { fx: 'flag:s2:07-talked' }] },
        { if: '!ev:t-sabri', run: [{ puzzle: 's2-sentence', then: [{ say: 's2.sentence-done' }], else: [{ say: later }] }] },
        { if: '!ev:e-receipt', run: [{ say: 's2.sabri-look' }] },
        { run: [{ say: 's2.sabri-again' }] },
      ],
    },
    { id: 'receipt', x: 520, w: 50, h: 50, label: 'ورقة على الگاع', icon: '🧾', if: ['ev:t-sabri', '!ev:e-receipt'], run: [{ say: 's2.receipt' }, { fx: 'ev:e-receipt' }] },
    { id: 'ryan', x: 440, w: 50, h: 130, label: 'ريان', icon: '💬', if: AFTER_BOARD, cases: [{ if: 'ev:e-receipt', run: [{ say: 's2.ryan-gym-after' }] }, { run: [{ say: 's2.ryan-gym' }] }] },
  ],
  triggers: arrive('gym', AFTER_BOARD),
  exits: [toArchive],
  ambient: [{ t: 'صوت أثقال… وصبري يعدّ بصوت عالي.' }],
};

/* ── بيت الفانوس: Uncle Jojo, the garden clock ──────────────────────────── */
export const S2_LAMPHOUSE = {
  id: 's2-lamphouse',
  title: 'بيت الفانوس',
  theme: 'workshop',
  music: 'mystery',
  width: 1300,
  spawn: 140,
  seed: 806,
  props: [{ type: 'table', x: 460, w: 110 }],
  actors: [{ id: 'jojo', kind: 'jojo', x: 640, facing: -1, if: AFTER_BOARD }],
  dynamic: [
    { x: 460, reach: 60, draw: (ctx, { P }) => P.lanternPost(ctx, 430, GROUND - 40, { height: 26, lit: true }) },
    { x: 940, reach: 50, draw: (ctx, { P }) => P.grandfatherClock(ctx, 940, GROUND + 2, { h: 9, m: 40 }) },
    { x: 1060, reach: 40, draw: (ctx, { P }) => P.paper(ctx, 1060, GROUND - 120, 0) },
  ],
  interact: [
    {
      id: 'jojo',
      x: 640,
      w: 50,
      h: 130,
      label: 'العم جوجو',
      icon: '💬',
      if: AFTER_BOARD,
      cases: [{ if: '!ev:t-jojo', run: [{ social: { cat: 'greeting' } }, { say: 's2.jojo-1' }, { fx: ['ev:t-jojo', 'ev:h-jojo'] }] }, { run: [{ say: 's2.jojo-again' }] }],
    },
    {
      id: 'clock',
      x: 940,
      w: 60,
      h: 160,
      label: 'ساعة الحديقة',
      icon: '🕰',
      if: AFTER_BOARD,
      cases: [
        { if: '!ev:t-jojo', run: [{ say: 's2.clock-wait' }] },
        { if: '!ev:e-drift', run: [once('s2.clock-intro'), { puzzle: 's2-clock', then: [{ say: 's2.clock-done' }], else: [{ say: later }] }] },
        { run: [{ say: 's2.clock-again' }] },
      ],
    },
    { id: 'notice', x: 1060, w: 60, h: 90, label: 'ورقة الفوانيس', icon: '🏮', run: [{ say: 's2.notice' }, { fx: 'flag:s2:read-notice', quiet: true }] },
  ],
  triggers: arrive('lamphouse', AFTER_BOARD),
  exits: [toArchive],
  ambient: [{ t: 'كل فانوس بالرف عليه ورقة صغيرة بخط العم جوجو.' }],
};

/* ── حديقة البيت: Anji's sister ──────────────────────────────────────────── */
export const S2_HOME = {
  id: 's2-home',
  title: 'حديقة البيت',
  theme: 'house',
  music: 'calm',
  width: 1300,
  spawn: 140,
  seed: 807,
  props: [{ type: 'bench', x: 560 }, { type: 'table', x: 860, w: 100 }, { type: 'bush', x: 1180 }],
  actors: [{ id: 'sister', kind: 'sister', x: 650, facing: -1, if: AFTER_BOARD }],
  dynamic: [{ x: 860, reach: 40, if: AFTER_BOARD, draw: (ctx, { P }) => P.paper(ctx, 860, GROUND - 48, 0) }],
  interact: [
    {
      id: 'sister',
      x: 650,
      w: 50,
      h: 130,
      label: 'أختي',
      icon: '💬',
      if: AFTER_BOARD,
      cases: [
        { if: '!flag:s2:09-quiz', run: [{ say: 's2.quiz' }, { fx: ['flag:s2:09-quiz', 'ev:h-sister'] }] },
        { if: '!ev:e-imprint', run: [{ say: 's2.sister-pencil' }] },
        { if: '!ev:t-sister', run: [{ say: 's2.sister-talk' }, { fx: 'ev:t-sister' }] },
        { run: [{ say: 's2.sister-again' }] },
      ],
    },
    {
      id: 'pencil',
      x: 860,
      w: 80,
      h: 70,
      label: 'الطاولة',
      icon: '✏️',
      if: AFTER_BOARD,
      cases: [
        { if: '!flag:s2:09-quiz', run: [{ say: 's2.home-table-wait' }] },
        { if: '!ev:e-imprint', run: [once('s2.rub-intro'), { puzzle: 's2-rubbing', then: [{ say: 's2.rub-done' }], else: [{ say: later }] }] },
        { run: [{ say: 's2.home-table-again' }] },
      ],
    },
  ],
  triggers: arrive('home', AFTER_BOARD),
  exits: [toArchive],
  ambient: [{ t: 'حديقة البيت. كلشي مألوف، وكلشي مرتب على ذوق غيري.' }],
};

export const S2_SCENES = [S2_ARCHIVE, S2_TREE, S2_CASEROOM, S2_CLINIC, S2_GYM, S2_LAMPHOUSE, S2_HOME];
