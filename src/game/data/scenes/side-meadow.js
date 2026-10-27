/**
 * V2 location: the meadow behind the sanctuary («فيروز الضايعة»).
 * A climb over rocks and the big tree's branches to reach a frightened
 * kitten, then a calm approach (a choice puzzle about animal care).
 */
import { GROUND } from '../../world/props.js';
import { ACT4_AMBIENT } from '../dialogue/act4.js';

const TREE_X = 1200;

export const MEADOW = {
  id: 'meadow',
  title: 'المرج الخلفي',
  theme: 'meadow',
  music: 'garden',
  width: 1700,
  spawn: 140,
  seed: 71,
  props: [
    { type: 'bush', x: 380, w: 90, tone: 'pink' },
    { type: 'bush', x: 1560, w: 110, tone: 'blue' },
  ],
  // rocks, then the tree's two branches
  platforms: [
    { x: 840, y: 204, w: 70 },
    { x: 940, y: 160, w: 70 },
    { x: 1080, y: 140, w: 60 },
    { x: TREE_X, y: 118, w: 72 },
    { x: TREE_X - 66, y: 72, w: 66 },
  ],
  items: [
    { id: 'star.meadow.1', x: TREE_X - 30, y: -4 },
    { id: 'star.meadow.2', x: 975, y: 60 },
    { id: 'seed.meadow.1', x: 520, y: GROUND - 26 },
  ],
  dynamic: [
    {
      x: 900,
      reach: 120,
      draw(ctx) {
        for (const [x, y, w] of [[840, 204, 70], [940, 160, 70], [1080, 140, 60]]) {
          ctx.fillStyle = '#5a5f78';
          ctx.beginPath();
          ctx.moveTo(x - 4, GROUND + 4);
          ctx.lineTo(x + 6, y);
          ctx.lineTo(x + w - 6, y);
          ctx.lineTo(x + w + 4, GROUND + 4);
          ctx.fill();
          ctx.fillStyle = '#6f7590';
          ctx.fillRect(x + 4, y, w - 8, 5);
        }
      },
    },
    { x: TREE_X, reach: 260, draw: (ctx, { P, t }) => P.meadowTree(ctx, TREE_X, GROUND + 2, t) },
    {
      x: TREE_X - 40,
      reach: 60,
      if: '!flag:kitten-found',
      draw: (ctx, { P, t, world }) => P.cat(ctx, TREE_X - 40, 72, { small: true, t, facing: 1, sad: true, reduced: world.reduced }),
    },
  ],
  interact: [
    {
      id: 'kitten',
      x: TREE_X - 40,
      y: 72,
      w: 50,
      h: 60,
      label: 'فيروز',
      icon: '🐱',
      if: '!flag:kitten-found',
      run: [{ puzzle: 'kitten-approach', then: [{ say: 's.kitten-found' }, { say: 's.kitten-carry' }] }],
    },
  ],
  triggers: [
    { id: 'enter', x1: 160, x2: 280, if: '!flag:kitten-found', run: [{ say: 's.meadow-enter' }] },
    { id: 'tree', x1: 760, x2: 880, if: '!flag:kitten-found', run: [{ camera: TREE_X - 40, ms: 900 }, { say: 's.kitten-up' }] },
  ],
  exits: [{ side: 'left', to: 'sanctuary', spawn: 1980 }],
  ambient: ACT4_AMBIENT,
};
