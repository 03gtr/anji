/**
 * ACT II location: the house. A hall of doors — each room is a gameplay
 * activity (wardrobe = dress-up, kitchen = cooking logic, study = hidden
 * objects) and the garage needs a code found in the house itself.
 */
import { GROUND } from '../../world/props.js';
import { ACT2_AMBIENT } from '../dialogue/act2.js';
import { SP2_GATE } from '../missions-sp2.js';

const SCONCES = [170, 700, 1290, 1790, 2380];

const doorDyn = (x, sign, state) => ({
  x,
  reach: 80,
  draw(ctx, { P, game }) {
    P.door(ctx, x, GROUND + 2, { state: typeof state === 'function' ? state(game) : state, sign, color: '#5a3a4a' });
  },
});

export const HOUSE = {
  id: 'house',
  title: 'البيت الغامض',
  theme: 'house',
  music: 'warm',
  width: 2600,
  spawn: 140,
  seed: 11,
  props: [
    { type: 'window', x: 230, y: 70 },
    { type: 'window', x: 1050, y: 70 },
    { type: 'window', x: 2000, y: 70 },
    { type: 'table', x: 570, w: 100, cloth: '#5b1f34' },
    { type: 'bookshelf', x: 1530, w: 110, h: 150 },
    { type: 'rug', x: 1150, w: 120, color: '#2b3a8c' },
    { type: 'pot', x: 820, tone: 'blue' },
    { type: 'pot', x: 1980, tone: 'pink' },
  ],
  platforms: [
    { x: 520, y: 210, w: 100, hidden: true },
    { x: 1470, y: 200, w: 50 },
    { x: 1530, y: 152, w: 70 },
  ],
  items: [
    { id: 'star.house.1', x: 1565, y: 24 },
    { id: 'star.house.2', x: 570, y: 26 },
  ],
  dynamic: [
    {
      // the house "remembers": lamps light up as she walks in for the first time
      x: 1300,
      reach: 2000,
      draw(ctx, { P, game, world }) {
        const remembered = game.flag('house-entered');
        for (const sx of SCONCES) {
          const lit = remembered ? 1 : Math.max(0, Math.min(1, (world.player.x - (sx - 160)) / 120));
          P.sconce(ctx, sx, 96, lit);
        }
      },
    },
    { x: 300, reach: 60, draw: (ctx, { P, game }) => P.blankFrame(ctx, 300, 70, 46, 56, { glow: game.flag('act7-done') ? 1 : 0 }) },
    { x: 760, reach: 60, draw: (ctx, { P, game }) => P.blankFrame(ctx, 760, 64, 40, 50, { glow: game.flag('act7-done') ? 1 : 0 }) },
    { x: 1700, reach: 60, draw: (ctx, { P, game }) => P.blankFrame(ctx, 1700, 70, 50, 40, { glow: game.flag('act7-done') ? 1 : 0 }) },
    { x: 2280, reach: 60, draw: (ctx, { P, game }) => P.blankFrame(ctx, 2280, 66, 44, 56, { glow: game.flag('act7-done') ? 1 : 0 }) },
    // stopped at 2:30 — the time Ryan is usually outside, waiting after her shift
    { x: 1150, reach: 60, draw: (ctx, { P }) => P.grandfatherClock(ctx, 1150, GROUND + 2, { h: 2, m: 30 }) },
    { x: 990, reach: 40, draw: (ctx, { P, game }) => P.recipeBoard(ctx, 990, 96, { torn: !game.flag('mission:missing-recipe') }) },
    doorDyn(420, 'الملابس', 'closed'),
    doorDyn(900, 'المطبخ', 'closed'),
    doorDyn(700, 'الألعاب', 'closed'),
    doorDyn(1380, 'المكتب', 'closed'),
    doorDyn(1880, 'المكتبة', (g) => (g.flag('library-open') ? 'open' : 'locked')),
    doorDyn(2480, 'الكراج', (g) => (g.flag('garage-open') ? 'open' : 'locked')),
    { x: 2150, reach: 60, draw: (ctx, { P, game }) => P.stairsDown(ctx, 2150, GROUND + 2, { open: game.flag('workshop-open') }) },
  ],
  interact: [
    { id: 'frames', x: 760, w: 50, h: 200, label: 'إطار فاضي', icon: '🖼', run: [{ say: 'a2.frames' }] },
    {
      id: 'wardrobe',
      x: 420,
      w: 60,
      h: 110,
      label: 'غرفة الملابس',
      icon: '👗',
      cases: [
        // V2 challenge: Snooki the stylist
        { if: ['flag:wardrobe-done', 'flag:act4-done', '!flag:style-offered'], run: [{ say: 's.style-offer' }, { game: 'wardrobe-challenge' }] },
        { if: ['flag:style-offered', '!record:game:wardrobe-challenge'], run: [{ game: 'wardrobe-challenge' }] },
        { if: 'flag:wardrobe-done', run: [{ game: 'wardrobe' }] },
        { run: [{ say: 'a2.wardrobe-first' }, { game: 'wardrobe', then: [{ say: 'a2.wardrobe-after' }] }] },
      ],
    },
    {
      id: 'kitchen',
      x: 900,
      w: 60,
      h: 110,
      label: 'المطبخ',
      icon: '🍳',
      cases: [
        // V2: the missing recipe, once the three scraps are back
        { if: ['flag:recipe-torn', 'count:scrap>=3', '!record:game:kitchen-home'], run: [{ say: 's.kitchen-home' }, { game: 'kitchen-home', then: [{ say: 's.kitchen-home-done' }] }] },
        { if: 'flag:kitchen-done', run: [{ game: 'kitchen' }] },
        { run: [{ say: 'a2.kitchen-first' }, { game: 'kitchen', then: [{ say: 'a2.kitchen-done' }] }] },
      ],
    },
    {
      id: 'gameroom',
      x: 700,
      w: 60,
      h: 110,
      label: 'صالة الألعاب',
      icon: '🃏',
      run: [{ fade: 'out' }, { goto: 'gameroom', x: 140 }],
    },
    {
      id: 'clock',
      x: 1150,
      w: 50,
      h: 160,
      label: 'الساعة الكبيرة',
      icon: '🕰',
      cases: [
        { if: 'flag:clock-seen', run: [{ say: 'a2.clock-again' }] },
        { run: [{ say: 'a2.clock' }] },
      ],
    },
    {
      id: 'recipes',
      x: 990,
      w: 50,
      h: 170,
      label: 'لوح الوصفات',
      icon: '📌',
      if: 'flag:kitchen-done',
      glowIf: '!flag:recipe-torn',
      cases: [
        { if: 'flag:mission:missing-recipe', run: [{ say: 's.recipe-board-done' }] },
        { if: 'flag:recipe-torn', run: [{ say: 's.recipe-board-again' }] },
        { run: [{ say: 's.recipe-board' }] },
      ],
    },
    {
      id: 'study',
      x: 1380,
      w: 60,
      h: 110,
      label: 'مكتب ريان',
      icon: '💻',
      run: [{ fade: 'out' }, { goto: 'study', x: 140 }],
    },
    {
      id: 'library',
      x: 1880,
      w: 60,
      h: 110,
      label: 'المكتبة',
      icon: '📚',
      cases: [
        { if: 'flag:library-open', run: [{ goto: 'library', x: 140 }] },
        { run: [{ say: 'a2.library-locked' }] },
      ],
    },
    {
      id: 'stairs',
      x: 2150,
      w: 80,
      h: 70,
      label: 'الدرج',
      icon: '⬇',
      cases: [
        // Story Pack 02: the workshop door carries the archive seals (open if she is already past them)
        { if: ['flag:workshop-open', SP2_GATE], run: [{ goto: 'workshop', x: 140 }] },
        { if: 'flag:workshop-open', run: [{ say: 'sp2.stairs-sealed' }] },
        { run: [{ say: 'a2.stairs-locked' }] },
      ],
    },
    {
      id: 'garage',
      x: 2480,
      w: 60,
      h: 110,
      label: 'باب الكراج',
      icon: '🔒',
      cases: [
        { if: 'flag:garage-open', run: [{ fade: 'out' }, { goto: 'garage', x: 140 }] },
        {
          run: [
            { say: 'a2.garage-look' },
            { puzzle: 'garage-lock', then: [{ say: 'a2.garage-open' }, { chapter: { act: 2, end: true } }, { fade: 'out' }, { goto: 'garage', x: 140 }] },
          ],
        },
      ],
    },
  ],
  triggers: [{ id: 'enter', x1: 260, x2: 360, if: '!flag:house-entered', run: [{ say: 'a2.enter' }, { chapter: { act: 2 } }] }],
  exits: [{ side: 'left', to: 'conservatory', spawn: 2160 }],
  ambient: ACT2_AMBIENT,
};
