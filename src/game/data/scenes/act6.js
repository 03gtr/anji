/**
 * ACT VI locations: the Memory Corridor (six frames, filled from the memory
 * registry — personal memories first, story memories otherwise) and the
 * Moonlit Lake (lantern release).
 */
import { GROUND } from '../../world/props.js';
import { ACT6_AMBIENT } from '../dialogue/act6.js';
import { corridorMemories, CORRIDOR_SLOTS } from '../../memories/registry.js';
import { painted } from '../../art/painted.js';

const FRAME_X = Array.from({ length: CORRIDOR_SLOTS }, (_, i) => 330 + i * 250);

let slots = null;
const images = new Map();
/** Memories shown in the frames (recomputed whenever the corridor is entered). */
export function refreshCorridor() {
  slots = corridorMemories();
  for (const m of slots) {
    const url = painted(m.art);
    if (url && !images.has(url) && typeof Image === 'function') {
      const img = new Image();
      img.src = url;
      images.set(url, img);
    }
  }
  return slots;
}
const slotAt = (i) => (slots ?? refreshCorridor())[i];

const allSolved = (game) => (slots ?? refreshCorridor()).every((m) => game.memory(m.id).solved);

const finaleCheck = { if: ['flag:corridor-done', 'flag:lake-done', '!flag:act6-done'], then: [{ say: 'a6.finale' }, { chapter: { act: 6, end: true } }] };

export const CORRIDOR = {
  id: 'corridor',
  title: 'ممر الذكريات',
  theme: 'corridor',
  music: 'warm',
  width: 1900,
  spawn: 140,
  seed: 41,
  props: [{ type: 'pot', x: 200, tone: 'blue' }],
  platforms: [],
  items: [{ id: 'seed.corridor.1', x: 1800, y: GROUND - 26 }],
  dynamic: [
    {
      // V2: the letters archive
      x: 1720,
      reach: 60,
      if: 'flag:act6-done',
      draw: (ctx, { P, game }) => P.archiveCabinet(ctx, 1720, GROUND + 2, { filled: Math.min(8, game.countGroup('note')), open: game.flag('archive-open') }),
    },
    ...FRAME_X.map((x, i) => ({
    x,
    reach: 70,
    draw(ctx, { P, game, t }) {
      const m = slotAt(i);
      if (!m) return;
      P.memoryFrame(ctx, x, 70, { lit: game.memory(m.id).solved, image: images.get(painted(m.art)) || null, icon: m.category === 'story' ? 'rose' : 'heart', t, index: i });
      P.sconce(ctx, x, 46, game.memory(m.id).solved ? 1 : 0.15);
    },
  })),
  ],
  interact: [
    {
      id: 'archive',
      x: 1720,
      w: 80,
      h: 110,
      label: 'خزانة الأرشيف',
      icon: '🗄',
      if: 'flag:act6-done',
      glowIf: ['count:note>=8', '!flag:archive-open'],
      cases: [
        { if: 'flag:archive-open', run: [{ say: 's.archive-done' }] },
        { if: 'count:note>=8', run: [{ say: 's.archive-open' }] },
        { run: [{ say: 's.archive-early' }] },
      ],
    },
    ...FRAME_X.map((x, i) => ({
    id: `frame-${i + 1}`,
    x,
    w: 90,
    h: 200,
    label: `الإطار ${['١', '٢', '٣', '٤', '٥', '٦'][i]}`,
    icon: '🖼',
    run: [
      {
        memory: i,
        then: [
          {
            if: (g) => allSolved(g) && !g.flag('corridor-done'),
            then: [{ say: 'a6.corridor-done' }, finaleCheck],
          },
        ],
      },
    ],
  })),
  ],
  triggers: [{ id: 'enter', x1: 200, x2: 300, if: '!flag:corridor-entered', run: [{ say: 'a6.corridor-enter' }, { chapter: { act: 6 } }] }],
  enter: [() => refreshCorridor()],
  exits: [{ side: 'right', to: 'lake', spawn: 140, if: 'flag:corridor-entered' }],
  ambient: ACT6_AMBIENT,
};

export const LAKE = {
  id: 'lake',
  title: 'البحيرة القمرية',
  theme: 'lake',
  music: 'warm',
  width: 1500,
  spawn: 140,
  seed: 43,
  props: [{ type: 'lantern', x: 420 }, { type: 'bench', x: 560 }],
  platforms: [
    { x: 1260, y: 196, w: 60 },
    { x: 1330, y: 148, w: 60 },
  ],
  items: [
    { id: 'star.lake.1', x: 1360, y: 16 },
    { id: 'star.lake.2', x: 260, y: GROUND - 30 },
  ],
  dynamic: [
    { x: 900, reach: 140, draw: (ctx, { P }) => P.dock(ctx, 900, GROUND - 4, 260) },
    { x: 960, reach: 60, draw: (ctx, { P, t }) => P.lanternBoat(ctx, 960, GROUND - 12, t) },
  ],
  interact: [
    {
      id: 'boat',
      x: 960,
      w: 80,
      h: 70,
      label: 'قارب الفوانيس',
      icon: '🏮',
      cases: [
        { if: 'flag:lake-done', run: [{ game: 'lanterns' }, finaleCheck] },
        { run: [{ game: 'lanterns', then: [{ say: 'a6.lake-after' }, finaleCheck] }] },
      ],
    },
  ],
  triggers: [{ id: 'enter', x1: 200, x2: 300, if: '!flag:lake-entered', run: [{ say: 'a6.lake-enter' }] }],
  exits: [{ side: 'left', to: 'corridor', spawn: 1760 }],
  ambient: ACT6_AMBIENT,
};
