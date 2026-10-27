/**
 * Story Pack 02 «أرشيف الأسرار» — one new location (the archive, reached from
 * the map after Act IV) and small additions to existing locations (clues,
 * letter fragments, the husky's trail), merged in by data/scenes/index.js.
 * Nothing in the original scene files is changed by these extras.
 *
 * Beats that complete a step are guarded by their own result flag, so an
 * interrupted beat can be replayed and a finished one never repeats.
 */
import { GROUND } from '../../world/props.js';

const PLAN = 470;
const LEDGER = 760;
const DESK = 980;
const DOOR = 1300;
const FLOOR = 1430;
const MACHINE = 1600;

// seals on the gate plan: three required (archive, maze, letters), two optional (machine, trail)
const SEALS = [
  { flag: 'sp2-archives-done', icon: 'rose' },
  { flag: 'sp2-maze-done', icon: 'key' },
  { flag: 'sp2-letters-done', icon: 'note' },
  { flag: 'sp2-sequence-done', icon: 'robot', optional: true },
  { flag: 'sp2-trail-done', icon: 'paw', optional: true },
];

function gatePlan(ctx, { P, game, t, world }) {
  // the plan: parchment in a frame, an arched gate, five seal slots underneath
  ctx.fillStyle = '#5a3d2c';
  ctx.fillRect(PLAN - 58, GROUND - 176, 116, 104);
  ctx.fillStyle = '#efe2c4';
  ctx.fillRect(PLAN - 52, GROUND - 170, 104, 92);
  ctx.strokeStyle = '#8a6a45';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PLAN - 26, GROUND - 92);
  ctx.lineTo(PLAN - 26, GROUND - 132);
  ctx.arc(PLAN, GROUND - 132, 26, Math.PI, 0);
  ctx.lineTo(PLAN + 26, GROUND - 92);
  ctx.stroke();
  for (let k = -2; k <= 2; k++) {
    ctx.beginPath();
    ctx.moveTo(PLAN + k * 9, GROUND - 92);
    ctx.lineTo(PLAN + k * 9, GROUND - 128 - (2 - Math.abs(k)) * 6);
    ctx.stroke();
  }
  if (game.flag('sp2-done')) {
    // a crack of warm light in the drawn gate: the rest is for later
    const pulse = world.reduced ? 1 : 0.8 + 0.2 * Math.sin(t * 2);
    ctx.fillStyle = `rgba(255,214,140,${0.75 * pulse})`;
    ctx.fillRect(PLAN - 2, GROUND - 150, 4, 58);
  }
  SEALS.forEach((s, i) => {
    const x = PLAN - 44 + i * 22;
    const y = GROUND - 62;
    const lit = game.flag(s.flag);
    ctx.fillStyle = lit ? '#ffd977' : 'rgba(40,30,50,.55)';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = s.optional ? '#b8a4d8' : '#8a6a45';
    ctx.setLineDash(s.optional ? [2, 2] : []);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);
    if (lit && !world.reduced) P.sparkle(ctx, x + 6, y - 7, 2 + Math.sin(t * 3 + i), 0.7);
  });
}

function pawPrints(x, y = GROUND + 6) {
  return (ctx) => {
    ctx.fillStyle = 'rgba(70,50,40,.55)';
    for (let k = 0; k < 3; k++) {
      const px = x - 30 + k * 26;
      const py = y + (k % 2) * 6;
      ctx.beginPath();
      ctx.ellipse(px, py, 4.5, 3.4, 0, 0, Math.PI * 2);
      for (const [dx, dy] of [[-4, -5], [0, -6.5], [4, -5]]) ctx.ellipse(px + dx, py + dy, 1.5, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

export const ARCHIVES = {
  id: 'archives',
  title: 'أرشيف الأسرار',
  theme: 'library',
  music: 'garden',
  width: 1720,
  spawn: 140,
  seed: 307,
  props: [
    { type: 'bookshelf', x: 290, w: 90, h: 160 },
    { type: 'table', x: LEDGER, w: 80 },
    { type: 'table', x: DESK, w: 90, cloth: '#3a2a4a' },
    { type: 'bookshelf', x: 1120, w: 100, h: 170 },
    { type: 'bookshelf', x: 1680, w: 70, h: 150 },
  ],
  dynamic: [
    { x: PLAN, reach: 70, draw: gatePlan },
    {
      // the open ledger
      x: LEDGER,
      reach: 40,
      draw(ctx) {
        ctx.fillStyle = '#efe2c4';
        ctx.fillRect(LEDGER - 22, GROUND - 46, 20, 14);
        ctx.fillRect(LEDGER + 2, GROUND - 46, 20, 14);
        ctx.fillStyle = '#6b4e12';
        ctx.fillRect(LEDGER - 1, GROUND - 47, 2, 16);
      },
    },
    {
      // the letter desk: papers appear as fragments are found
      x: DESK,
      reach: 50,
      draw(ctx, { game }) {
        const n = ['sp2-letter-1', 'sp2-letter-2', 'sp2-letter-3'].filter((f) => game.flag(f)).length + 1;
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = k % 2 ? '#fff4dc' : '#efe2c4';
          ctx.fillRect(DESK - 34 + k * 17, GROUND - 46 - (k % 2) * 3, 14, 11);
        }
      },
    },
    {
      // the inner door: closed until the second key
      x: DOOR,
      reach: 40,
      draw(ctx, { game }) {
        const open = game.flag('sp2-inner-open');
        ctx.fillStyle = '#3a2a2a';
        ctx.fillRect(DOOR - 28, GROUND - 124, 56, 128);
        ctx.fillStyle = open ? '#ffd99a' : '#6a4a3a';
        ctx.fillRect(DOOR - 22, GROUND - 118, open ? 14 : 44, 122);
        if (!open) {
          ctx.fillStyle = '#e2b544';
          ctx.beginPath();
          ctx.arc(DOOR + 12, GROUND - 58, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
    {
      // the shifting floor: tiles that slowly change shade
      x: FLOOR,
      reach: 90,
      if: 'flag:sp2-inner-open',
      draw(ctx, { t, world, game }) {
        for (let i = 0; i < 6; i++) {
          const phase = world.reduced ? 0 : Math.sin(t * 1.2 + i);
          ctx.fillStyle = game.flag('sp2-maze-done') ? '#c9b07a' : `rgba(160,130,90,${0.55 + 0.25 * phase})`;
          ctx.fillRect(FLOOR - 66 + i * 22, GROUND + 6, 20, 8);
        }
      },
    },
    {
      // the old sequence machine
      x: MACHINE,
      reach: 50,
      if: 'flag:sp2-inner-open',
      draw(ctx, { t, world, game }) {
        ctx.fillStyle = '#4b4f78';
        ctx.fillRect(MACHINE - 26, GROUND - 74, 52, 78);
        ctx.fillStyle = '#2a2e44';
        ctx.fillRect(MACHINE - 20, GROUND - 66, 40, 22);
        const on = game.flag('sp2-sequence-done');
        for (let i = 0; i < 4; i++) {
          const blink = world.reduced ? 1 : 0.6 + 0.4 * Math.sin(t * 2 + i);
          ctx.fillStyle = on ? '#5cd0b5' : `rgba(255,217,119,${blink})`;
          ctx.fillRect(MACHINE - 16 + i * 9, GROUND - 60, 6, 10);
        }
      },
    },
  ],
  interact: [
    {
      id: 'gate-plan',
      x: PLAN,
      w: 110,
      h: 190,
      label: 'مخطط بوابة الغد',
      icon: '🗺️',
      cases: [
        { if: 'flag:sp2-done', run: [{ say: 'sp2.plan-after' }] },
        {
          // Mission 6: the required seals are lit → a crack of light, and the workshop opens
          if: 'flag:sp2-letters-done',
          run: [{ say: 'sp2.plan-lit' }, { shake: 0.25 }, { fx: ['flag:sp2-plan-studied', 'flag:sp2-done'] }, { say: 'sp2.plan-open' }],
        },
        { run: [{ say: 'sp2.plan-early' }] },
      ],
    },
    {
      id: 'ledger',
      x: LEDGER,
      w: 70,
      h: 70,
      label: 'السجل',
      icon: '📖',
      cases: [
        { if: '!flag:sp2-ledger-read', run: [{ say: 'sp2.ledger' }, { fx: ['flag:sp2-ledger-read', 'journal:sp2-ledger'] }] },
        {
          if: ['flag:sp2-clue-a', 'flag:sp2-clue-b', 'flag:sp2-clue-c', '!flag:sp2-deduced'],
          run: [{ puzzle: 'sp2-ledger', then: [{ say: 'sp2.deduced' }], else: [{ say: 'sp2.ledger-later' }] }],
        },
        { if: ['flag:sp2-deduced', '!flag:sp2-archives-done'], run: [{ say: 'sp2.go-observatory' }] },
        { if: '!flag:sp2-deduced', run: [{ say: 'sp2.ledger-wait' }] },
        { run: [{ say: 'sp2.ledger-done' }] },
      ],
    },
    {
      id: 'desk',
      x: DESK,
      w: 80,
      h: 70,
      label: 'ميز الرسائل',
      icon: '✉️',
      if: ['flag:sp2-maze-done', 'flag:act5-done'],
      cases: [
        { if: '!flag:sp2-desk-read', run: [{ say: 'sp2.desk' }, { fx: ['flag:sp2-desk-read', 'journal:sp2-letter-0'] }] },
        { if: ['flag:sp2-letters-done'], run: [{ say: 'sp2.desk-done' }] },
        {
          if: ['flag:sp2-letter-1', 'flag:sp2-letter-2', 'flag:sp2-letter-3', '!flag:sp2-letters-ordered'],
          run: [
            {
              puzzle: 'sp2-letters-order',
              then: [{ say: 'sp2.ordered' }, { puzzle: 'sp2-letters-facts', then: [{ say: 'sp2.letters-done' }], else: [{ say: 'sp2.facts-later' }] }],
              else: [{ say: 'sp2.letters-later' }],
            },
          ],
        },
        { if: 'flag:sp2-letters-ordered', run: [{ puzzle: 'sp2-letters-facts', then: [{ say: 'sp2.letters-done' }], else: [{ say: 'sp2.facts-later' }] }] },
        { run: [{ say: 'sp2.desk-missing' }] },
      ],
    },
    {
      id: 'inner-door',
      x: DOOR,
      w: 60,
      h: 130,
      label: 'الباب الداخلي',
      icon: '🚪',
      cases: [
        { if: 'flag:sp2-inner-open', run: [{ say: 'sp2.door-open' }] },
        { if: 'flag:sp2-archives-done', run: [{ say: 'sp2.door-unlock' }, { fx: 'flag:sp2-inner-open' }] },
        { run: [{ say: 'sp2.door-locked' }] },
      ],
    },
    {
      id: 'floor',
      x: FLOOR,
      w: 120,
      h: 60,
      label: 'الأرضية المتغيرة',
      icon: '🧭',
      if: 'flag:sp2-inner-open',
      cases: [
        { if: '!flag:sp2-maze-done', run: [{ say: 'sp2.maze-intro' }, { puzzle: 'sp2-shifting-maze', then: [{ say: 'sp2.maze-done' }], else: [{ say: 'sp2.maze-later' }] }] },
        { run: [{ say: 'sp2.maze-again' }] },
      ],
    },
    {
      id: 'machine',
      x: MACHINE,
      w: 60,
      h: 90,
      label: 'آلة التسلسل',
      icon: '⚙️',
      if: 'flag:sp2-inner-open',
      cases: [
        { if: '!flag:sp2-sequence-done', run: [{ say: 'sp2.machine' }, { puzzle: 'sp2-sequence', then: [{ say: 'sp2.machine-done' }], else: [{ say: 'sp2.machine-later' }] }] },
        { run: [{ say: 'sp2.machine-again' }] },
      ],
    },
  ],
  triggers: [{ id: 'enter', x1: 140, x2: 320, once: false, if: '!flag:sp2-entered', run: [{ say: 'sp2.enter' }, { fx: 'flag:sp2-entered' }] }],
  exits: [{ side: 'left', to: 'house', spawn: 1650 }],
  ambient: [
    { t: 'ريحة ورق قديم. ريحتي المفضلة بعد البسكويت.' },
    { t: 'كل رف هنا بيه سر. وآني أعرف… واحد. تقريباً.' },
    { t: 'المخطط يباوعلنا. لا تسأليني شلون.', if: '!flag:sp2-done' },
  ],
};

/** Additions to existing locations (appended to their lists; ids are unique per scene). */
const clue = (id, x, label, flag, say) => ({
  id,
  x,
  w: 50,
  h: 90,
  label,
  icon: '🔎',
  if: ['flag:sp2-ledger-read', `!flag:${flag}`],
  run: [{ say }, { fx: [`flag:${flag}`, `journal:${flag}`] }],
});
const LETTERS_OPEN = ['flag:sp2-maze-done', 'flag:act5-done'];
const letter = (id, x, flag, say) => ({ id, x, w: 50, h: 80, label: 'قطعة رسالة', icon: '✉️', if: [...LETTERS_OPEN, `!flag:${flag}`], run: [{ say }, { fx: [`flag:${flag}`, `journal:${flag}`] }] });
const TRAIL_OPEN = ['flag:sp1-husky-met', 'flag:sp2-archives-done'];
const trail = (id, x, flag, say) => ({ id, x, w: 70, h: 50, label: 'آثار كفوف', icon: '🐾', if: [...TRAIL_OPEN, `!flag:${flag}`], run: [{ say }, { fx: `flag:${flag}` }] });
const trailDraw = (x, flag) => ({ x, reach: 50, if: [...TRAIL_OPEN, `!flag:${flag}`], draw: pawPrints(x) });

export const SP2_EXTRAS = {
  house: { interact: [clue('sp2-tile', 1700, 'بلاطة منقوشة', 'sp2-clue-a', 'sp2.clue-a')] },
  academy: { interact: [clue('sp2-board-note', 1200, 'ورقة ورا اللوحة', 'sp2-clue-b', 'sp2.clue-b')] },
  sanctuary: {
    interact: [clue('sp2-post', 1120, 'عمود خشب', 'sp2-clue-c', 'sp2.clue-c'), trail('sp2-trail-3', 1730, 'sp2-trail-3', 'sp2.trail-3')],
    dynamic: [trailDraw(1730, 'sp2-trail-3')],
  },
  observatory: {
    interact: [
      {
        id: 'sp2-key',
        x: 1380,
        w: 50,
        h: 90,
        label: 'شي يلمع بالزاوية',
        icon: '🗝️',
        if: ['flag:sp2-deduced', '!flag:sp2-archives-done'],
        run: [{ say: 'sp2.key-found' }, { fx: ['item:archive-key', 'flag:sp2-archives-done'] }],
      },
      letter('sp2-letter-1', 400, 'sp2-letter-1', 'sp2.letter-1'),
    ],
  },
  library: { interact: [letter('sp2-letter-2', 470, 'sp2-letter-2', 'sp2.letter-2')] },
  lake: { interact: [letter('sp2-letter-3', 620, 'sp2-letter-3', 'sp2.letter-3')] },
  garden: { interact: [trail('sp2-trail-1', 1250, 'sp2-trail-1', 'sp2.trail-1')], dynamic: [trailDraw(1250, 'sp2-trail-1')] },
  meadow: { interact: [trail('sp2-trail-2', 640, 'sp2-trail-2', 'sp2.trail-2')], dynamic: [trailDraw(640, 'sp2-trail-2')] },
  roseclinic: {
    interact: [
      {
        id: 'sp2-trail-end',
        x: 1050,
        w: 60,
        h: 60,
        label: 'نهاية الأثر؟',
        icon: '🐾',
        if: ['flag:sp2-trail-1', 'flag:sp2-trail-2', 'flag:sp2-trail-3', '!flag:sp2-trail-done'],
        run: [{ say: 'sp2.trail-ask' }, { puzzle: 'sp2-trail', then: [{ say: 'sp2.trail-done' }], else: [] }],
      },
    ],
  },
};

/** Scene with its Story Pack 02 additions appended (a new object; the original is not mutated). */
export function withExtras(scene) {
  const extra = SP2_EXTRAS[scene.id];
  if (!extra) return scene;
  return {
    ...scene,
    interact: [...(scene.interact || []), ...(extra.interact || [])],
    dynamic: [...(scene.dynamic || []), ...(extra.dynamic || [])],
  };
}
