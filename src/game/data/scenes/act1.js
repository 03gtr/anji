/**
 * ACT I locations: the Lost Garden and the Rose Conservatory.
 * Scene format: see world/engine.js. Positions are in world units
 * (the ground is at y = 250; Anji is ~112 units tall, jumps ~105).
 */
import { GROUND } from '../../world/props.js';
import { ACT1_AMBIENT } from '../dialogue/act1.js';
import { rng as mulberry } from '../../core/rng.js';

const PEDESTAL_ORDER = ['half', 'new', 'full', 'crescent'];

export const GARDEN = {
  id: 'garden',
  title: 'الحديقة الضائعة',
  theme: 'garden-night',
  music: 'garden',
  width: 2200,
  spawn: 240,
  seed: 3,
  snookiHidden: '!flag:met-snooki',
  props: [
    { type: 'bush', x: 380, w: 90, tone: 'blue', roses: 9 },
    { type: 'lantern', x: 460 },
    { type: 'fountain', x: 820, reach: 120 },
    { type: 'bench', x: 990 },
    { type: 'lantern', x: 1060, height: 130 },
    { type: 'tree', x: 1250, h: 230 },
    { type: 'lantern', x: 1460 },
    { type: 'sign', x: 1830, text: 'المتاهة' },
    { type: 'hedgeArch', x: 1980, reach: 140 },
    { type: 'bush', x: 140, w: 70, tone: 'pink', roses: 5 },
  ],
  platforms: [
    { x: 1090, y: 202, w: 90 },
    { x: 1215, y: 160, w: 90 },
    { x: 1345, y: 122, w: 80 },
    { x: 1650, y: 196, w: 70 },
    { x: 1735, y: 148, w: 70 },
  ],
  blockers: [{ x: 2110, w: 60 }],
  items: [
    { id: 'star.garden.1', x: 1385, y: 18 },
    { id: 'star.garden.2', x: 120, y: GROUND - 34 },
    { id: 'star.garden.3', x: 1770, y: 14 },
    { id: 'seed.garden.1', x: 700, y: GROUND - 26 },
  ],
  dynamic: [
    {
      x: 60,
      draw(ctx, { P, game }) {
        P.ironGate(ctx, 60, 252, { w: 96, h: 150, open: 0, glow: game.flag('met-snooki') ? 0 : 0.4 });
      },
    },
    {
      // Snooki's hiding bush rustles until they meet
      x: 600,
      if: '!flag:met-snooki',
      draw(ctx, { P, t }) {
        ctx.save();
        ctx.translate(600, 252);
        ctx.rotate(Math.sin(t * 9) * 0.03 * (Math.sin(t * 1.3) > 0.4 ? 1 : 0));
        ctx.translate(-600, -252);
        P.roseBush(ctx, 600, 254, 110, 64, mulberry(5), { tone: 'blue', roses: 8 });
        ctx.restore();
      },
    },
    {
      x: 600,
      if: 'flag:met-snooki',
      draw(ctx, { P }) {
        P.roseBush(ctx, 600, 254, 110, 64, mulberry(5), { tone: 'blue', roses: 8 });
      },
    },
    {
      // the blue roses brighten when Anji is close
      x: 380,
      draw(ctx, { world, t }) {
        const d = Math.abs(world.player.x - 380);
        if (d > 160) return;
        const a = (1 - d / 160) * (0.5 + 0.2 * Math.sin(t * 3));
        const g = ctx.createRadialGradient(380, 222, 4, 380, 222, 80);
        g.addColorStop(0, `rgba(143,178,255,${a})`);
        g.addColorStop(1, 'rgba(143,178,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(300, 140, 160, 120);
      },
    },
    {
      x: 1560,
      reach: 260,
      draw(ctx, { P, game, t }) {
        const lit = game.flag('moon-bloom');
        PEDESTAL_ORDER.forEach((phase, i) => P.pedestal(ctx, 1500 + i * 46, 252, { lit, phase, t: t + i }));
      },
    },
    {
      // the hedge door of the maze, until the roses bloom
      x: 1980,
      if: '!flag:maze-open',
      draw(ctx, { P }) {
        P.hedgeWall(ctx, 1946, 2014, 130, 256, mulberry(9), { roses: 0.12 });
      },
    },
  ],
  interact: [
    { id: 'gate-back', x: 60, w: 100, h: 150, label: 'البوابة', run: [{ say: 'a1.gate-back' }] },
    { id: 'roses', x: 380, w: 80, h: 60, label: 'الورد الأزرق', icon: '🌹', run: [{ say: 'a1.roses' }] },
    { id: 'fountain', x: 820, w: 100, h: 80, label: 'النافورة', icon: '👁', if: 'flag:met-snooki', run: [{ say: 'a1.fountain' }] },
    {
      id: 'note-bench',
      x: 990,
      w: 60,
      h: 50,
      label: 'ورقة',
      icon: '📜',
      if: '!got:note.ryan.1',
      run: [{ say: 'a1.note-bench' }, { fx: 'got:note.ryan.1' }],
    },
    {
      id: 'pedestals',
      x: 1569,
      w: 190,
      h: 90,
      label: 'ورود القمر',
      icon: '🌙',
      if: 'flag:met-snooki',
      cases: [
        { if: 'flag:moon-bloom', run: [{ bubble: 'snooki', text: 'شوفي شلون حلوات. بفضلي طبعاً.' }] },
        { run: [{ say: 'a1.pedestals-look' }, { puzzle: 'moon-bloom', then: [{ say: 'a1.pedestals-solved' }] }] },
      ],
    },
    { id: 'sign', x: 1830, w: 50, h: 70, label: 'اللافتة', icon: '🪧', run: [{ say: 'a1.sign-maze' }] },
    {
      id: 'maze',
      x: 1980,
      w: 70,
      h: 140,
      label: 'المتاهة',
      icon: '🌿',
      if: 'flag:met-snooki',
      cases: [
        { if: '!flag:maze-open', run: [{ say: 'a1.maze-blocked' }] },
        { if: 'flag:maze-done', run: [{ fade: 'out' }, { goto: 'conservatory', x: 140 }] },
        { run: [{ say: 'a1.maze-enter' }, { game: 'maze', then: [{ fade: 'out' }, { goto: 'conservatory', x: 140 }], else: [{ say: 'a1.maze-later' }] }] },
      ],
    },
  ],
  triggers: [
    {
      id: 'snooki',
      x1: 470,
      x2: 560,
      if: '!flag:met-snooki',
      run: [
        { shake: 0.5 },
        { sfx: 'whoosh' },
        { emote: 'anji', icon: '!' },
        { face: 'anji', dir: 1 },
        { wait: 500 },
        { place: 'snooki', x: 640, facing: -1 },
        { show: 'snooki' },
        { pose: 'snooki', anim: 'growl' },
        { move: 'snooki', x: 600, speed: 90 },
        { say: 'a1.snooki-meet' },
        { pose: 'snooki', anim: 'excited', for: 800 },
        { move: 'snooki', x: 780, speed: 280 },
        { emote: 'snooki', icon: '?' },
        { wait: 400 },
        { move: 'snooki', x: 330, speed: 280 },
        { emote: 'snooki', icon: '…' },
        { wait: 400 },
        { move: 'snooki', x: 440, speed: 160 },
        { face: 'snooki', toward: 'anji' },
        { say: 'a1.snooki-lost' },
        { toast: 'سنوكي صار يمشي وياچ 🐾' },
      ],
    },
  ],
  enter: [
    {
      if: '!flag:intro-done',
      then: [
        { cine: 'opening' },
        { pose: 'anji', anim: 'sleep', for: 900 },
        { pose: 'anji', anim: 'surprised', for: 700 },
        { say: 'a1.wake' },
        { fx: 'flag:intro-done' },
        { toast: 'امشي بالأسهم ◀ ▶، اقفزي بـ ⤒، والمسي الأشياء حتى تفحصينها.', kind: 'hint' },
      ],
    },
  ],
  ambient: ACT1_AMBIENT,
};

export const CONSERVATORY = {
  id: 'conservatory',
  title: 'البيت الزجاجي',
  theme: 'conservatory',
  music: 'mystery',
  width: 2300,
  spawn: 140,
  seed: 5,
  props: [
    { type: 'pot', x: 330, tone: 'pink' },
    { type: 'pot', x: 1120, tone: 'blue' },
    { type: 'pot', x: 1180, tone: 'pink' },
    { type: 'pot', x: 1240, tone: 'blue' },
    { type: 'lantern', x: 760, height: 120 },
    { type: 'lantern', x: 1480, height: 120 },
    { type: 'bush', x: 2050, w: 120, tone: 'blue', roses: 10 },
  ],
  platforms: [
    { x: 890, y: 196, w: 130 },
    { x: 1580, y: 186, w: 90 },
    { x: 1690, y: 140, w: 80 },
  ],
  blockers: [
    { x: 660, w: 40, if: '!flag:chase-done' },
    { x: 1880, w: 150, if: '!flag:gate-open' },
  ],
  items: [
    { id: 'star.conservatory.1', x: 955, y: 100 },
    { id: 'star.conservatory.2', x: 1728, y: 14 },
    { id: 'seed.conservatory.1', x: 1400, y: GROUND - 26 },
  ],
  actors: [{ id: 'needle', kind: 'needle', x: 620, facing: -1, if: ['flag:needle-met', '!flag:chase-done'] }],
  dynamic: [
    {
      x: 1880,
      reach: 220,
      draw(ctx, { P, game, world, t }) {
        const open = game.flag('gate-open') ? 1 : 0;
        const near = Math.max(0, 1 - Math.abs(world.player.x - 1880) / 260);
        P.ironGate(ctx, 1880, 252, { w: 130, h: 190, open, glow: open ? 0 : near * (0.6 + 0.2 * Math.sin(t * 3)) });
      },
    },
  ],
  interact: [
    {
      id: 'needle',
      x: 620,
      w: 50,
      h: 90,
      label: 'الممرضة إبرة',
      icon: '💉',
      if: ['flag:needle-met', '!flag:chase-done'],
      run: [{ say: 'a1.needle-retry' }, { game: 'chase', then: [{ say: 'a1.needle-after' }, { despawn: 'needle', fade: true }] }],
    },
    {
      id: 'note-pots',
      x: 1180,
      w: 140,
      h: 60,
      label: 'ورقة بين السنادين',
      icon: '📜',
      if: '!got:note.ryan.2',
      run: [{ say: [{ s: 'note', t: '«الورد الأزرق ما ينبت طبيعياً. لازم أحد يصرّ عليه. أنا مصرّ. — R»' }, { s: 'anji', e: 'soft', t: 'مصرّ على شنو بالضبط، ريان؟' }] }, { fx: 'got:note.ryan.2' }],
    },
    {
      id: 'gate',
      x: 1880,
      w: 160,
      h: 190,
      label: 'البوابة الكبيرة',
      icon: '🗝',
      cases: [
        { if: 'flag:gate-open', run: [{ bubble: 'snooki', text: 'البوابة مفتوحة. والمغامرة… كذلك.' }] },
        {
          run: [
            { say: 'a1.gate' },
            {
              puzzle: 'gate-color',
              then: [
                { say: 'a1.gate-open' },
                { camera: 2080, ms: 700 },
                { spawn: { id: 'shadow', kind: 'shadow', x: 2010, facing: 1, alpha: 0.95, fadeIn: true } },
                { wait: 700 },
                { emote: 'anji', icon: '!' },
                { say: 'a1.shadow' },
                { move: 'shadow', x: 2260, speed: 150 },
                { despawn: 'shadow', fade: true },
                { camera: null },
                { face: 'anji', toward: 'snooki' },
                { say: 'a1.after-shadow' },
                { chapter: { act: 1, end: true } },
                { fx: 'flag:map-open' },
                { toast: 'انفتحت خريطة الحديقة 🗺️ — المسي زر الخريطة فوق.', kind: 'hint' },
              ],
            },
          ],
        },
      ],
    },
  ],
  triggers: [
    {
      id: 'needle',
      x1: 230,
      x2: 320,
      if: '!flag:chase-done',
      run: [
        { say: 'a1.conservatory' },
        { spawn: { id: 'needle', kind: 'needle', x: 760, facing: -1, fadeIn: true } },
        { sfx: 'boing' },
        { move: 'needle', x: 620, speed: 160 },
        { fx: 'flag:needle-met' },
        { say: 'a1.needle' },
        { game: 'chase', then: [{ say: 'a1.needle-after' }, { despawn: 'needle', fade: true }], else: [{ say: 'a1.needle-retry' }] },
      ],
    },
  ],
  exits: [
    { side: 'left', to: 'garden', spawn: 1900, if: 'flag:maze-done' },
    { side: 'right', to: 'house', spawn: 120, if: 'flag:act1-done', locked: [{ bubble: 'snooki', text: 'بعد ما خلصنا هنا.' }] },
  ],
  ambient: ACT1_AMBIENT,
};
