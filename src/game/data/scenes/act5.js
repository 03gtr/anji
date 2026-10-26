/**
 * ACT V locations: the Observatory of Lost Stars and the Secret Library
 * (behind the star door in the house).
 */
import { GROUND } from '../../world/props.js';
import { ACT5_AMBIENT } from '../dialogue/act5.js';

export const OBSERVATORY = {
  id: 'observatory',
  title: 'المرصد',
  theme: 'observatory',
  music: 'mystery',
  width: 1600,
  spawn: 140,
  seed: 31,
  props: [
    { type: 'rug', x: 820, w: 140, color: '#2b3a8c' },
    { type: 'table', x: 360, w: 70, cloth: '#2b3a8c' },
  ],
  platforms: [
    { x: 1180, y: 200, w: 60 },
    { x: 1250, y: 150, w: 70 },
  ],
  items: [
    { id: 'star.observatory.1', x: 1285, y: 20 },
    { id: 'seed.observatory.1', x: 1500, y: GROUND - 26 },
  ],
  dynamic: [
    { x: 300, reach: 60, draw: (ctx, { P }) => P.starChart(ctx, 300, 70) },
    { x: 1050, reach: 60, draw: (ctx, { P }) => P.starChart(ctx, 1050, 60, 80, 60) },
    { x: 360, reach: 40, draw: (ctx) => { ctx.fillStyle = '#f3f1ff'; ctx.fillRect(352, GROUND - 52, 12, 12); ctx.strokeStyle = '#c9b8de'; ctx.beginPath(); ctx.moveTo(355, GROUND - 56); ctx.quadraticCurveTo(352, GROUND - 62, 356, GROUND - 68); ctx.stroke(); } },
    { x: 820, reach: 140, draw: (ctx, { P, game, t }) => P.telescope(ctx, 820, GROUND + 2, { lens: game.flag('lens-placed'), t }) },
    { x: 560, reach: 60, draw: (ctx, { P, game, t }) => P.owl(ctx, 560, GROUND + 2, { awake: game.flag('observatory-entered'), t }) },
  ],
  interact: [
    {
      id: 'munther',
      x: 560,
      w: 60,
      h: 140,
      label: 'العم منذر',
      icon: '🦉',
      cases: [
        { if: ['flag:act5-done', '!flag:sky-started'], run: [{ say: 'a5.munther-done' }, { say: 's.munther-sky' }] },
        { if: ['flag:sky-started', '!flag:sky-3'], run: [{ say: 's.sky-next' }] },
        { if: 'flag:sky-3', run: [{ say: 's.skychart-done' }] },
        { if: 'flag:act5-done', run: [{ say: 'a5.munther-done' }] },
        { if: 'flag:library-open', run: [{ say: 'a5.munther-again' }] },
        { run: [{ say: 'a5.munther' }, { toast: 'باب المكتبة بالبيت انفتح ✨', kind: 'hint' }] },
      ],
    },
    {
      id: 'skychart',
      x: 1050,
      w: 90,
      h: 200,
      label: 'خريطة السما الثانية',
      icon: '✨',
      if: 'flag:sky-started',
      glowIf: '!flag:sky-3',
      cases: [
        { if: 'flag:sky-3', run: [{ puzzle: 'sky-bone' }] },
        { if: 'flag:sky-2', run: [{ puzzle: 'sky-bone', then: [{ say: 's.sky-done' }] }] },
        { if: 'flag:sky-1', run: [{ puzzle: 'sky-car' }] },
        { run: [{ puzzle: 'sky-paw' }] },
      ],
    },
    {
      id: 'telescope',
      x: 820,
      w: 140,
      h: 130,
      label: 'التلسكوب',
      icon: '🔭',
      cases: [
        { if: 'flag:act5-done', run: [{ bubble: 'snooki', text: 'اسمچ بعده بالسما. ما راح يروح.' }] },
        { if: '!item:star-lens', run: [{ bubble: 'snooki', text: 'ناقصته العدسة. عمو منذر يعرف وين.' }] },
        {
          if: '!flag:rings-done',
          run: [
            { fx: 'flag:lens-placed' },
            { say: 'a5.lens' },
            { puzzle: 'star-rings', then: [{ say: 'a5.rings-done' }] },
          ],
        },
        { run: [{ puzzle: 'star-cipher', then: [{ say: 'a5.reveal' }, { chapter: { act: 5, end: true } }] }] },
      ],
    },
  ],
  triggers: [{ id: 'enter', x1: 200, x2: 300, if: '!flag:observatory-entered', run: [{ say: 'a5.enter' }, { chapter: { act: 5 } }] }],
  exits: [{ side: 'left', to: 'house', spawn: 1880 }],
  ambient: ACT5_AMBIENT,
};

export const LIBRARY = {
  id: 'library',
  title: 'المكتبة السرّية',
  theme: 'library',
  music: 'mystery',
  width: 1500,
  spawn: 140,
  seed: 37,
  props: [],
  platforms: [
    { x: 600, y: 196, w: 70 },
    { x: 680, y: 146, w: 70 },
  ],
  items: [{ id: 'star.library.1', x: 715, y: 16 }],
  dynamic: [
    { x: 300, reach: 60, draw: (ctx, { P, game, t }) => P.candleStand(ctx, 300, GROUND + 2, { lit: game.flag('candles-lit'), t }) },
    { x: 980, reach: 60, draw: (ctx, { P, game, t }) => P.candleStand(ctx, 980, GROUND + 2, { lit: game.flag('candles-lit'), t, h: 90 }) },
    { x: 1300, reach: 60, draw: (ctx, { P, game, t }) => P.candleStand(ctx, 1300, GROUND + 2, { lit: game.flag('candles-lit'), t }) },
    { x: 560, reach: 60, draw: (ctx, { P }) => P.ladder(ctx, 560, GROUND + 2, 150) },
    { x: 1150, reach: 60, draw: (ctx, { P }) => P.table(ctx, 1150, GROUND + 2, 80, { cloth: '#5b1f34' }) },
    {
      // without light the library is barely visible
      x: 750,
      reach: 2000,
      if: '!flag:candles-lit',
      draw(ctx, { world }) {
        ctx.fillStyle = 'rgba(5,6,20,.55)';
        ctx.fillRect(world.camX - 10, -400, world.viewW + 20, 800);
        const g = ctx.createRadialGradient(world.player.x, 190, 10, world.player.x, 190, 140);
        g.addColorStop(0, 'rgba(255,214,140,.25)');
        g.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g;
        ctx.fillRect(world.player.x - 140, 50, 280, 260);
      },
    },
  ],
  interact: [
    {
      id: 'candles',
      x: 980,
      w: 60,
      h: 130,
      label: 'الشمعدان الكبير',
      icon: '🕯',
      cases: [
        { if: 'flag:lens-found', run: [{ bubble: 'snooki', text: 'الشموع تحب الضوء. مثلي.' }] },
        { if: 'flag:candles-lit', run: [{ say: 'a5.candles-done' }] },
        { run: [{ puzzle: 'library-candles', then: [{ say: 'a5.candles-done' }] }] },
      ],
    },
    { id: 'note', x: 1150, w: 80, h: 60, label: 'ورقة على الطاولة', icon: '📜', if: ['flag:candles-lit', '!got:note.ryan.5'], run: [{ say: 'a5.library-note' }] },
  ],
  triggers: [{ id: 'enter', x1: 200, x2: 300, if: '!flag:candles-lit', run: [{ say: 'a5.library' }] }],
  exits: [{ side: 'left', to: 'house', spawn: 1880 }],
  ambient: ACT5_AMBIENT,
};
