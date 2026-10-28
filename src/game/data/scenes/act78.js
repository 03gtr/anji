/**
 * ACT VII location: the Workshop of Missing Things (three-stage machine).
 * ACT VIII location: the Hidden Garden — Ryan, the ending, and afterwards
 * the garden she designs herself.
 */
import { GROUND } from '../../world/props.js';
import { ACT78_AMBIENT } from '../dialogue/act78.js';
import { COLS } from '../../minigames/garden-logic.js';
import { rng } from '../../core/rng.js';

const hasMaps = ['item:map-1', 'item:map-2', 'item:map-3'];

const stage3 = [{ say: 'a7.stage3' }, { puzzle: 'workshop-lock', then: [{ say: 'a7.letter' }, { chapter: { act: 7, end: true } }] }];
const stage2 = [{ say: 'a7.stage2' }, { puzzle: 'workshop-lights', then: stage3 }];
const stage1 = [{ say: 'a7.stage1' }, { game: 'pipes-workshop', then: stage2 }];

export const WORKSHOP = {
  id: 'workshop',
  title: 'ورشة الأشياء المفقودة',
  theme: 'workshop',
  music: 'mystery',
  width: 1700,
  spawn: 140,
  seed: 47,
  props: [{ type: 'bookshelf', x: 1460, w: 90, h: 130 }],
  platforms: [
    { x: 1420, y: 196, w: 50 },
    { x: 1470, y: 150, w: 70 },
  ],
  items: [{ id: 'star.workshop.1', x: 1505, y: 20 }],
  dynamic: [
    { x: 380, reach: 60, draw: (ctx, { P }) => P.bicycle(ctx, 380, GROUND + 2) },
    { x: 560, reach: 40, draw: (ctx, { P, t }) => { P.table(ctx, 560, GROUND + 2, 60, { cloth: '#5b1f34' }); P.musicBox(ctx, 560, GROUND - 38, t); } },
    { x: 1250, reach: 50, if: 'flag:act7-done', draw: (ctx, { P, game, t, world }) => P.roboDog(ctx, 1250, GROUND + 2, { awake: game.flag('robo-coded'), t, facing: -1, reduced: world.reduced }) },
    {
      x: 950,
      reach: 160,
      draw: (ctx, { P, game, t }) =>
        P.machine(ctx, 950, GROUND + 2, { stage: ['wk-stage1', 'wk-stage2', 'wk-stage3'].filter((f) => game.flag(f)).length, t, done: game.flag('act7-done') }),
    },
  ],
  interact: [
    { id: 'bicycle', x: 380, w: 60, h: 60, label: 'دراجة بفيونكة', icon: '🚲', run: [{ say: [{ s: 'anji', e: 'soft', t: 'دراجة… بنفس لون فيونكتي.' }, { s: 'snooki', e: 'guilty', t: 'صدفة. أكبر صدفة بالتاريخ.' }] }] },
    { id: 'musicbox', x: 560, w: 50, h: 70, label: 'صندوق موسيقى', icon: '🎵', run: [{ say: [{ s: 'anji', e: 'thinking', t: 'صندوق موسيقى ناقصه المفتاح… وعليه ورقة: «الأغنية تنضاف لمن هي تختارها».' }] }] },
    {
      id: 'robo',
      x: 1250,
      w: 50,
      h: 70,
      label: 'روبوت صغير',
      icon: '🤖',
      if: 'flag:act7-done',
      cases: [
        { if: 'flag:robo-done', run: [{ say: 's.robo-done' }] },
        { if: 'flag:robo-coded', run: [{ say: 's.robo-meet' }] },
        { if: 'record:game:pipes-robo', run: [{ say: 's.robo-powered' }, { puzzle: 'robo-code', then: [{ say: 's.robo-meet' }] }] },
        { if: 'flag:robo-found', run: [{ game: 'pipes-robo', then: [{ say: 's.robo-powered' }, { puzzle: 'robo-code', then: [{ say: 's.robo-meet' }] }] }] },
        { run: [{ say: 's.robo-found' }, { game: 'pipes-robo', then: [{ say: 's.robo-powered' }, { puzzle: 'robo-code', then: [{ say: 's.robo-meet' }] }] }] },
      ],
    },
    {
      id: 'machine',
      x: 950,
      w: 180,
      h: 160,
      label: 'ماكينة الأشياء المفقودة',
      icon: '⚙',
      cases: [
        { if: 'flag:act7-done', run: [{ bubble: 'snooki', text: 'الماكينة خلصت شغلها. هسه دورچ.' }] },
        { if: { not: hasMaps }, run: [{ say: 'a7.need-maps' }] },
        { if: '!item:blue-thread', run: [{ say: 'a7.need-thread' }, { toast: 'الخيط الأزرق علگان بسياج محمية الحيوانات 🧵', kind: 'hint' }] },
        { if: '!flag:wk-stage1', run: stage1 },
        { if: '!flag:wk-stage2', run: stage2 },
        { run: stage3 },
      ],
    },
  ],
  triggers: [
    { id: 'enter', x1: 200, x2: 300, if: '!flag:workshop-entered', run: [{ say: 'a7.enter' }, { chapter: { act: 7 } }] },
    { id: 'machine', x1: 700, x2: 800, if: '!flag:wk-intro', run: [{ say: 'a7.machine' }, { fx: 'flag:wk-intro' }] },
  ],
  exits: [{ side: 'left', to: 'house', spawn: 2150 }],
  ambient: ACT78_AMBIENT,
};

/* ── the Hidden Garden ─────────────────────────────────────── */
const PLOT_X0 = 520;
const PLOT_DX = 70;
const plotPos = (cell) => {
  const col = cell % COLS;
  const row = Math.floor(cell / COLS);
  // rows alternate sides of the path so the garden fills the clearing
  const side = row % 2 ? 1 : -1;
  return { x: PLOT_X0 + col * PLOT_DX + (row >> 1) * 300 + (side > 0 ? 0 : 0), y: GROUND + 2 - (row % 2) * 6 };
};

export const FINAL = {
  id: 'final',
  title: 'الحديقة المخفية',
  theme: 'final',
  music: 'warm',
  width: 2200,
  spawn: 140,
  seed: 53,
  props: [{ type: 'lantern', x: 380 }, { type: 'lantern', x: 2000 }],
  platforms: [
    { x: 1820, y: 196, w: 60 },
    { x: 1890, y: 146, w: 60 },
  ],
  items: [
    { id: 'star.final.1', x: 1920, y: 14 },
    { id: 'seed.final.1', x: 300, y: GROUND - 26 },
  ],
  actors: [{ id: 'ryan', kind: 'ryan', x: 1480, facing: 1, if: 'flag:act7-done' }],
  dynamic: [
    { x: 1560, reach: 260, draw: (ctx, { P, t }) => P.roseTree(ctx, 1560, GROUND + 2, t) },
    {
      // the rose planted together in the finale
      x: 1360,
      reach: 60,
      if: 'flag:rose-planted',
      draw(ctx, { P, t, world }) {
        const pulse = world.reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 2);
        const g = ctx.createRadialGradient(1360, GROUND - 26, 2, 1360, GROUND - 26, 40 * pulse);
        g.addColorStop(0, 'rgba(159,215,255,.6)');
        g.addColorStop(1, 'rgba(159,215,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(1360, GROUND - 26, 40 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3f7a4a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(1360, GROUND + 2);
        ctx.quadraticCurveTo(1356, GROUND - 14, 1360, GROUND - 24);
        ctx.stroke();
        P.rose(ctx, 1360, GROUND - 28, 6, 'blue');
      },
    },
    {
      // the garden she planted with the designer
      x: 1000,
      reach: 1200,
      draw(ctx, { P, game, t }) {
        for (const p of game.state.garden) {
          const { x, y } = plotPos(p.cell);
          P.gardenPiece(ctx, p.id, x, y, rng(p.cell * 31 + 7), t);
        }
      },
    },
  ],
  interact: [
    {
      id: 'ryan',
      x: 1480,
      w: 60,
      h: 120,
      label: 'ريان',
      icon: '💙',
      if: 'flag:game-complete',
      run: [{ say: 'a8.ryan-idle' }],
    },
    {
      id: 'planted-rose',
      x: 1360,
      w: 40,
      h: 60,
      label: 'الوردة اللي زرعناها',
      icon: '🌹',
      if: 'flag:rose-planted',
      glow: false,
      run: [{ say: [{ s: 'anji', e: 'soft', t: 'وردتنا. تضوي أكثر لمن نكون قريبين.' }] }, { drawing: { revisit: true } }],
    },
    {
      id: 'plots',
      x: 760,
      w: 200,
      h: 80,
      label: 'ازرعي الحديقة',
      icon: '🌱',
      if: 'flag:game-complete',
      run: [{ game: 'garden' }],
    },
  ],
  triggers: [
    { id: 'enter', x1: 200, x2: 300, if: '!flag:final-entered', run: [{ say: 'a8.enter' }, { fx: 'flag:final-entered' }, { chapter: { act: 8 } }] },
    {
      id: 'meet',
      x1: 1150,
      x2: 1300,
      // Not a one-time trigger: the engine saves a one-time trigger's flag BEFORE its actions run,
      // and every change is written to the save at once, so an ending closed half-way (the app
      // shut, a reload) left `t.final.meet` set and `game-complete` not — and the meeting never
      // played again. It is bounded by its own condition instead: it re-arms after leaving the
      // zone and stops for good once the ending has completed. Replaying from the start is safe:
      // every effect in it (flags, journal, unlocks) is idempotent.
      once: false,
      if: ['flag:act7-done', '!flag:game-complete'],
      run: [
        // the meeting has begun: the canonical turning point (data/companions.js), same moment as before
        { fx: 'flag:t.final.meet' },
        { camera: 1420, ms: 900 },
        { move: 'snooki', x: 1400, speed: 300 },
        // the meeting: Snooki's mission ends here, he stays with Ryan (data/companions.js)
        { stay: 'snooki' },
        { pose: 'snooki', anim: 'excited', for: 900 },
        { face: 'ryan', dir: -1 },
        { say: 'a8.meet' },
        { drawing: true },
        { say: 'a8.drawing' },
        { say: 'a8.plant-intro' },
        { move: 'snooki', x: 1330, speed: 220 },
        { pose: 'snooki', anim: 'excited', for: 700 },
        { puzzle: 'plant-rose', then: [], else: [{ fx: 'flag:rose-planted' }] },
        { shake: 0.3 },
        { say: 'a8.plant-done' },
        { say: 'a8.ending' },
        { chapter: { act: 8, end: true } },
        { cine: 'credits' },
        { say: 'a8.after' },
        // the open ending: this chapter is complete; the next adventures come with later updates
        { say: 'a8.open' },
        { toast: 'المسي «ازرعي الحديقة» حتى تزرعين البذور اللي جمعتيها 🌱', kind: 'hint' },
      ],
    },
    {
      // the open ending for a game that finished before it existed (or was closed during it):
      // once, under the rose tree, after the ending; it is "seen" only when it has been read through
      id: 'open',
      x1: 1150,
      x2: 1300,
      once: false,
      if: ['flag:game-complete', '!seen:dlg:a8.open'],
      run: [{ say: 'a8.open' }],
    },
  ],
  exits: [{ side: 'left', to: 'garden', spawn: 1900 }],
  ambient: ACT78_AMBIENT,
};
