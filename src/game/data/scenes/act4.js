/**
 * ACT IV locations: Snooki's Detective Academy (a garden shed turned
 * classroom) and the Animal Sanctuary. The case is solved by combining
 * clues from both places on the academy's investigation board.
 */
import { GROUND } from '../../world/props.js';
import { ACT4_AMBIENT } from '../dialogue/act4.js';

export const ACADEMY = {
  id: 'academy',
  title: 'أكاديمية سنوكي',
  theme: 'academy',
  music: 'mystery',
  width: 1700,
  spawn: 140,
  seed: 23,
  props: [
    { type: 'window', x: 230, y: 70 },
    { type: 'bookshelf', x: 1250, w: 90, h: 140 },
    { type: 'pot', x: 1560, tone: 'blue' },
  ],
  platforms: [
    { x: 1205, y: 200, w: 40 },
    { x: 1250, y: 150, w: 90 },
  ],
  items: [
    { id: 'star.academy.1', x: 1295, y: 20 },
    { id: 'seed.academy.1', x: 1600, y: GROUND - 26 },
  ],
  dynamic: [
    {
      x: 520,
      reach: 90,
      draw: (ctx, { P, game }) =>
        P.chalkboard(ctx, 520, GROUND + 2, {
          title: 'قضية الخريطة المختفية',
          lines: game.flag('case-solved') ? ['المجرم: …سنوكي', 'الدافع: تعليمات ريان'] : ['المشتبه بهم: ؟', game.flag('evidence-done') ? 'الأدلة: ✓' : 'الأدلة: …', game.flag('tracks-done') ? 'الآثار: ✓' : 'الآثار: …'],
        }),
    },
    { x: 700, reach: 40, draw: (ctx, { P }) => P.schoolDesk(ctx, 700, GROUND + 2) },
    { x: 780, reach: 40, draw: (ctx, { P }) => P.schoolDesk(ctx, 780, GROUND + 2) },
    { x: 380, reach: 40, draw: (ctx, { P }) => P.diploma(ctx, 380, 70) },
    { x: 420, reach: 40, draw: (ctx, { P }) => P.diploma(ctx, 420, 84) },
    { x: 960, reach: 70, draw: (ctx, { P }) => P.table(ctx, 960, GROUND + 2, 110, { cloth: '#2b3a8c' }) },
  ],
  interact: [
    { id: 'diplomas', x: 400, w: 70, h: 200, label: 'شهادات سنوكي', icon: '🎓', run: [{ say: [{ s: 'anji', e: 'smirk', t: '«شهادة تقدير لسنوكي: أفضل كلب.» … موقّعة من سنوكي.' }, { s: 'snooki', e: 'proud', t: 'الاعتراف الذاتي أصدق اعتراف.' }] }] },
    {
      id: 'board',
      x: 520,
      w: 140,
      h: 200,
      label: 'لوحة التحقيق',
      icon: '🔎',
      cases: [
        { if: 'flag:case-solved', run: [{ bubble: 'snooki', text: 'القضية انحلّت. للأسف.' }] },
        { if: { not: ['flag:evidence-done', 'flag:tracks-done'] }, run: [{ say: 'a4.board-early' }] },
        { run: [{ puzzle: 'map-case', then: [{ say: 'a4.confession' }, { chapter: { act: 4, end: true } }] }] },
      ],
    },
    {
      id: 'cards',
      x: 740,
      w: 120,
      h: 60,
      label: 'تمرين الذاكرة',
      icon: '🃏',
      cases: [
        { if: 'flag:cards-done', run: [{ game: 'cards' }] },
        { run: [{ say: 'a4.cards-first' }, { game: 'cards', then: [{ say: 'a4.cards-done' }] }] },
      ],
    },
    {
      id: 'evidence',
      x: 960,
      w: 110,
      h: 60,
      label: 'طاولة الأدلة',
      icon: '🧾',
      if: 'flag:cards-done',
      cases: [
        { if: 'flag:evidence-done', run: [{ game: 'evidence' }] },
        { run: [{ say: 'a4.evidence-first' }, { game: 'evidence', then: [{ say: 'a4.evidence-done' }] }] },
      ],
    },
  ],
  triggers: [{ id: 'start', x1: 200, x2: 300, if: '!flag:case-open', run: [{ say: 'a4.start' }, { chapter: { act: 4 } }] }],
  exits: [
    { side: 'right', to: 'sanctuary', spawn: 140, if: 'flag:case-open' },
    { side: 'left', to: 'house', spawn: 950 },
  ],
  ambient: ACT4_AMBIENT,
};

export const SANCTUARY = {
  id: 'sanctuary',
  title: 'محمية الحيوانات',
  theme: 'sanctuary',
  music: 'garden',
  width: 2100,
  spawn: 140,
  seed: 29,
  props: [
    { type: 'tree', x: 980, h: 210 },
    { type: 'bush', x: 1720, w: 90, tone: 'pink' },
  ],
  platforms: [
    { x: 940, y: 196, w: 80 },
    { x: 990, y: 150, w: 70 },
  ],
  items: [
    { id: 'star.sanctuary.1', x: 1025, y: 22 },
    { id: 'star.sanctuary.2', x: 1980, y: GROUND - 30 },
  ],
  dynamic: [
    { x: 600, reach: 120, draw: (ctx, { P, t, game }) => P.peacock(ctx, 600, GROUND + 2, { fan: game.flag('sanctuary-met') ? 0.6 + 0.4 * Math.abs(Math.sin(t * 0.6)) : 0, t, facing: -1 }) },
    { x: 1300, reach: 120, draw: (ctx, { P, t }) => P.pond(ctx, 1300, GROUND - 6, 180, t) },
    { x: 1420, reach: 60, draw: (ctx, { P, t }) => P.deer(ctx, 1420, GROUND + 2, t) },
    { x: 380, reach: 40, draw: (ctx, { P, t }) => P.bunny(ctx, 380, GROUND + 4, t) },
    { x: 410, reach: 40, draw: (ctx, { P, t }) => P.bunny(ctx, 410, GROUND + 6, t + 1.3) },
    { x: 1150, reach: 40, draw: (ctx, { P, t }) => P.squirrel(ctx, 1150, GROUND + 2, t) },
    { x: 1640, reach: 160, draw: (ctx, { P, game }) => P.fence(ctx, 1560, 1720, GROUND + 4, { thread: !game.flag('thread-found') }) },
  ],
  interact: [
    { id: 'bunny', x: 395, w: 70, h: 50, label: 'الأرانب', icon: '🐇', if: '!flag:fed-bunny', run: [{ say: 'a4.bunny' }] },
    { id: 'sultan', x: 600, w: 70, h: 100, label: 'السلطان', icon: '🦚', run: [{ say: 'a4.sultan' }] },
    {
      id: 'tracks',
      x: 1300,
      w: 160,
      h: 60,
      label: 'آثار بالطين',
      icon: '🐾',
      cases: [
        { if: 'flag:tracks-done', run: [{ game: 'tracks' }] },
        { run: [{ say: 'a4.tracks-first' }, { game: 'tracks', then: [{ say: 'a4.tracks-done' }] }] },
      ],
    },
    { id: 'fence', x: 1600, w: 60, h: 60, label: 'خيط بالسياج', icon: '🧵', if: '!flag:thread-found', run: [{ say: 'a4.fence' }] },
  ],
  triggers: [{ id: 'enter', x1: 200, x2: 320, if: '!flag:sanctuary-met', run: [{ say: 'a4.sanctuary' }] }],
  exits: [{ side: 'left', to: 'academy', spawn: 1560 }],
  ambient: ACT4_AMBIENT,
};
