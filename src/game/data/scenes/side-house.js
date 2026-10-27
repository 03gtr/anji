/**
 * V2 locations in the house: Ryan's study (a programmer's workspace; the
 * main-story desk search plus the «البناء الناقص» chain) and the hidden
 * passage behind its bookshelf, ending in the small waiting room.
 */
import { GROUND } from '../../world/props.js';
import { SIDE_AMBIENT_STUDY, SIDE_AMBIENT_PASSAGE } from '../dialogue/side.js';

const DESK_X = 640;
const DESK_TOP = GROUND + 2 - 62;

export const STUDY = {
  id: 'study',
  title: 'مكتب ريان',
  theme: 'study',
  music: 'mystery',
  width: 1150,
  spawn: 140,
  seed: 61,
  props: [
    { type: 'window', x: 250, y: 56, w: 60, h: 80 },
    { type: 'rug', x: 640, w: 150, color: '#2b3a8c' },
  ],
  // a wooden step stool beside the tall shelf
  platforms: [{ x: 930, y: 204, w: 46, hidden: true }],
  items: [
    { id: 'scrap.study.1', x: 300, y: GROUND - 20, if: 'flag:recipe-torn' },
    { id: 'star.study.1', x: 958, y: 96 },
  ],
  dynamic: [
    { x: 340, reach: 60, draw: (ctx, { P }) => P.circuitDiagram(ctx, 340, 74) },
    { x: 430, reach: 60, draw: (ctx, { P }) => P.circuitPoster(ctx, 430, 66) },
    {
      x: DESK_X,
      reach: 180,
      draw(ctx, { P, game, t, world }) {
        const reduced = world.reduced;
        P.programmerDesk(ctx, DESK_X, GROUND + 2, { fixed: game.flag('build-fixed'), drawerOpen: game.flag('drawer-open'), t, reduced });
        P.coffeeMug(ctx, DESK_X + 50, DESK_TOP, t, reduced);
        P.deskLamp(ctx, DESK_X + 120, DESK_TOP, !game.flag('study-dark'));
      },
    },
    { x: 860, reach: 60, draw: (ctx, { P }) => P.officeChair(ctx, 860, GROUND + 2) },
    {
      x: 953,
      reach: 40,
      draw(ctx) {
        ctx.fillStyle = '#6b4a3a';
        ctx.fillRect(930, 204, 46, 6);
        ctx.fillStyle = '#4a3026';
        ctx.fillRect(934, 210, 5, GROUND - 208);
        ctx.fillRect(967, 210, 5, GROUND - 208);
      },
    },
    { x: 1010, reach: 70, draw: (ctx, { P, game }) => P.secretShelf(ctx, 1010, GROUND + 2, { open: game.flag('passage-open') ? 1 : 0 }) },
    {
      // lamp off: the room goes dark; the screens glow; the symbols appear
      x: 600,
      reach: 2000,
      if: 'flag:study-dark',
      draw(ctx, { P, game, t, world }) {
        ctx.fillStyle = 'rgba(3,4,16,.72)';
        ctx.fillRect(world.camX - 10, -400, world.viewW + 20, 800);
        const g = ctx.createRadialGradient(DESK_X - 20, DESK_TOP - 30, 4, DESK_X - 20, DESK_TOP - 30, 120);
        g.addColorStop(0, game.flag('build-fixed') ? 'rgba(80,140,255,.28)' : 'rgba(255,84,112,.2)');
        g.addColorStop(1, 'rgba(80,140,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(DESK_X - 160, DESK_TOP - 160, 320, 260);
        if (game.flag('build-fixed')) P.wallSymbols(ctx, DESK_X - 60, 52, 1, t);
      },
    },
  ],
  interact: [
    { id: 'poster', x: 430, w: 70, h: 200, label: 'مخطط دوائر', icon: '📐', run: [{ say: 's.poster' }] },
    { id: 'monitor', x: 548, w: 50, h: 140, label: 'الشاشة الثانية', icon: '🖥', glowIf: ['flag:build-fixed', '!flag:egg-terminal'], run: [{ say: 's.terminal' }] },
    {
      id: 'search',
      x: 632,
      w: 70,
      h: 140,
      label: 'فتّشي الميز',
      icon: '🔎',
      if: '!flag:study-done',
      run: [{ game: 'study', then: [{ say: 'a2.study-done' }] }],
    },
    {
      id: 'laptop',
      x: 632,
      w: 70,
      h: 140,
      label: 'لابتوب ريان',
      icon: '💻',
      if: 'flag:study-done',
      glowIf: '!flag:build-fixed',
      cases: [
        { if: 'flag:build-fixed', run: [{ say: 's.laptop-done' }] },
        { if: 'flag:build-seen', run: [{ puzzle: 'build-fix', then: [{ say: 's.build-fixed' }] }] },
        { run: [{ say: 's.laptop' }, { puzzle: 'build-fix', then: [{ say: 's.build-fixed' }] }] },
      ],
    },
    { id: 'coffee', x: 690, w: 30, h: 120, label: 'كوب قهوة', icon: '☕', run: [{ say: 's.coffee' }] },
    {
      id: 'drawer',
      x: 732,
      w: 40,
      h: 100,
      label: 'درج الميز',
      icon: '🗄',
      glowIf: ['flag:symbols-seen', '!flag:drawer-open'],
      cases: [
        { if: 'flag:drawer-open', run: [{ say: 's.drawer-done' }] },
        { if: 'flag:symbols-seen', run: [{ puzzle: 'study-drawer', then: [{ say: 's.drawer' }] }] },
        { run: [{ say: 's.drawer-locked' }] },
      ],
    },
    {
      id: 'lamp',
      x: 776,
      w: 30,
      h: 140,
      label: 'الأباجورة',
      icon: '💡',
      glowIf: ['flag:build-fixed', '!flag:symbols-seen'],
      cases: [
        { if: 'flag:study-dark', run: [{ fx: '!flag:study-dark' }, { sfx: 'tap' }, { say: 's.lamp-on' }] },
        { if: ['flag:build-fixed', '!flag:symbols-seen'], run: [{ fx: 'flag:study-dark' }, { sfx: 'tap' }, { camera: DESK_X - 40, ms: 700 }, { say: 's.symbols' }] },
        { run: [{ fx: 'flag:study-dark' }, { sfx: 'tap' }, { say: 's.lamp-off' }] },
      ],
    },
    { id: 'chair', x: 862, w: 40, h: 100, label: 'الكرسي', icon: '🪑', run: [{ say: 's.chair' }] },
    {
      id: 'shelf',
      x: 1010,
      w: 80,
      h: 180,
      label: 'رف الكتب العالي',
      icon: '📚',
      glowIf: ['item:shelf-key', '!flag:passage-open'],
      cases: [
        { if: 'flag:passage-open', run: [{ fade: 'out' }, { goto: 'passage', x: 120 }] },
        { if: 'item:shelf-key', run: [{ fx: 'flag:passage-open' }, { say: 's.shelf-open' }, { fade: 'out' }, { goto: 'passage', x: 120 }] },
        { run: [{ say: 's.shelf-locked' }] },
      ],
    },
  ],
  triggers: [
    { id: 'enter', x1: 160, x2: 300, if: '!flag:study-done', run: [{ say: 's.study-enter' }] },
  ],
  exits: [{ side: 'left', to: 'house', spawn: 1380 }],
  ambient: SIDE_AMBIENT_STUDY,
};

export const PASSAGE = {
  id: 'passage',
  title: 'الممر المخفي',
  theme: 'passage',
  music: 'mystery',
  width: 1700,
  spawn: 120,
  seed: 67,
  props: [],
  // climb the old shelves to the lever, then the stone door opens
  platforms: [
    { x: 400, y: 204, w: 70 },
    { x: 500, y: 158, w: 70 },
    { x: 600, y: 112, w: 90 },
    { x: 760, y: 150, w: 60 },
    { x: 860, y: 196, w: 60 },
  ],
  blockers: [{ x: 1180, w: 60, if: '!flag:passage-lever' }],
  items: [
    { id: 'star.passage.1', x: 645, y: 14 },
    { id: 'star.passage.2', x: 890, y: 120 },
    { id: 'seed.passage.1', x: 1000, y: GROUND - 26 },
  ],
  dynamic: [
    ...[200, 560, 920, 1320].map((x) => ({ x, reach: 80, draw: (ctx, { P, t, world }) => P.wallTorch(ctx, x, 90, t, world.reduced) })),
    { x: 640, reach: 40, draw: (ctx, { P, game }) => P.lever(ctx, 650, 114, game.flag('passage-lever')) },
    { x: 1180, reach: 60, draw: (ctx, { P, game }) => P.stoneDoor(ctx, 1180, GROUND + 2, game.flag('passage-lever') ? 1 : 0) },
    { x: 1480, reach: 200, draw: (ctx, { P, t }) => P.waitingWindow(ctx, 1480, GROUND + 2, t) },
  ],
  interact: [
    { id: 'lever', x: 650, y: 112, w: 40, h: 70, label: 'عتلة', icon: '🕹', if: '!flag:passage-lever', run: [{ say: 's.lever' }] },
    { id: 'door', x: 1140, w: 40, h: 130, label: 'باب حجري', icon: '🚪', if: '!flag:passage-lever', run: [{ say: 's.door-shut' }] },
    {
      id: 'window',
      x: 1480,
      w: 120,
      h: 180,
      label: 'شباك الانتظار',
      icon: '🪟',
      cases: [
        { if: 'flag:passage-done', run: [{ say: 's.waiting-again' }] },
        { run: [{ camera: 1480, ms: 900 }, { say: 's.waiting' }] },
      ],
    },
  ],
  triggers: [{ id: 'enter', x1: 160, x2: 280, run: [{ say: 's.passage-enter' }] }],
  exits: [
    { side: 'left', to: 'study', spawn: 1000 },
    // a shortcut out to the garage, once the waiting room has been found
    { side: 'right', to: 'garage', spawn: 160, if: 'flag:passage-done' },
  ],
  ambient: SIDE_AMBIENT_PASSAGE,
};
