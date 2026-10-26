/**
 * ACT III location: the garage. Reveal the car, restore its three circuits
 * (logic machine), paint it, then take the Road of Blue Lights (three races).
 */
import { GROUND } from '../../world/props.js';
import { ACT3_AMBIENT } from '../dialogue/act3.js';

const CAR_COLORS = { cobalt: '#1f4fd1', midnight: '#1a1f5e', rose: '#e0567f', pearl: '#e9e7f2' };

export const GARAGE = {
  id: 'garage',
  title: 'الكراج',
  theme: 'garage',
  music: 'race',
  width: 1900,
  spawn: 140,
  seed: 17,
  props: [
    { type: 'bookshelf', x: 260, w: 70, h: 120 },
    { type: 'pot', x: 1560, tone: 'blue' },
  ],
  platforms: [
    { x: 330, y: 210, w: 140, hidden: true },
    { x: 1300, y: 190, w: 70 },
    { x: 1380, y: 140, w: 70 },
  ],
  items: [
    { id: 'star.garage.1', x: 400, y: 70 },
    { id: 'star.garage.2', x: 1420, y: 18 },
  ],
  dynamic: [
    { x: 400, reach: 90, draw: (ctx, { P }) => P.toolRack(ctx, 400, GROUND + 2) },
    {
      x: 900,
      reach: 140,
      draw(ctx, { P, game, t }) {
        P.sportsCar(ctx, 900, GROUND + 18, { color: CAR_COLORS[game.state.cosmetics.carColor] || CAR_COLORS.cobalt, lights: game.flag('car-ready'), t: 0 });
        if (!game.flag('car-uncovered')) P.carSheet(ctx, 900, GROUND + 14);
        if (game.flag('car-ready')) {
          ctx.fillStyle = `rgba(111,211,255,${0.15 + 0.1 * Math.sin(t * 3)})`;
          ctx.fillRect(820, GROUND + 6, 160, 6);
        }
      },
    },
    { x: 1150, reach: 60, draw: (ctx, { P, game, t }) => P.controlPanel(ctx, 1150, GROUND + 2, { on: game.flag('car-ready'), t }) },
    {
      x: 1760,
      reach: 90,
      draw(ctx, { P, game, world }) {
        const near = Math.max(0, 1 - Math.abs(world.player.x - 1760) / 200);
        P.shutter(ctx, 1760, GROUND + 2, { open: game.flag('car-ready') ? 0.85 : 0, glow: game.flag('car-ready') ? near : 0 });
      },
    },
  ],
  interact: [
    {
      id: 'car',
      x: 900,
      w: 170,
      h: 70,
      label: 'زفيرو',
      icon: '🚗',
      cases: [
        { if: '!flag:car-uncovered', run: [{ say: 'a3.reveal' }] },
        { if: ['record:game:race-moon', '!flag:glovebox'], run: [{ say: 'glovebox' }] },
        { if: '!flag:car-ready', run: [{ bubble: 'snooki', text: 'ما تشتغل. جرّبي اللوحة اللي على الحايط.' }] },
        { run: [{ bubble: 'snooki', text: 'زفيرو جاهزة. الطريق من الباب الكبير.' }] },
      ],
    },
    {
      id: 'panel',
      x: 1150,
      w: 60,
      h: 160,
      label: 'لوحة الكهرباء',
      icon: '⚡',
      if: 'flag:car-uncovered',
      cases: [
        { if: 'flag:car-ready', run: [{ game: 'pipes-car' }] },
        { run: [{ say: 'a3.panel' }, { game: 'pipes-car', then: [{ shake: 0.6 }, { say: 'a3.car-ready' }] }] },
      ],
    },
    {
      id: 'paint',
      x: 1560,
      w: 60,
      h: 90,
      label: 'ورشة الصبغ',
      icon: '🎨',
      cases: [
        { if: '!flag:car-ready', run: [{ say: 'a3.paint-locked' }] },
        { run: [{ game: 'paint' }] },
      ],
    },
    {
      id: 'road',
      x: 1760,
      w: 130,
      h: 150,
      label: 'الطريق الأزرق',
      icon: '🏁',
      cases: [
        { if: '!flag:car-ready', run: [{ say: 'a3.road-locked' }] },
        { if: '!record:game:race-moon', run: [{ say: 'a3.road-intro' }, { game: 'race-moon', then: [{ say: 'a3.after-moon' }, { say: 'glovebox' }] }] },
        { if: '!record:game:race-rose', run: [{ game: 'race-rose', then: [{ say: 'a3.after-rose' }] }] },
        { if: '!record:game:race-bridge', run: [{ game: 'race-bridge', then: [{ say: 'a3.after-bridge' }, { chapter: { act: 3, end: true } }] }] },
        { run: [{ journal: 'challenges' }] },
      ],
    },
  ],
  triggers: [{ id: 'enter', x1: 220, x2: 320, if: '!flag:car-uncovered', run: [{ say: 'a3.enter' }, { chapter: { act: 3 } }] }],
  exits: [{ side: 'left', to: 'house', spawn: 2420 }],
  ambient: ACT3_AMBIENT,
};
