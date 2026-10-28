/**
 * «إحنا فريق» — the afternoon walk («ممشى العصر») and Anji's plan notebook in the hidden
 * garden. Same conventions as the deep garden: a beat that completes a step is guarded by its
 * own result flag (an interrupted beat replays, a finished one never repeats); intro lines are
 * said once (`seen:`); a puzzle closed half-way keeps its draft. The route is two boolean flags
 * (`tu-route-river` / `tu-route-orchard`): the stops, the fork and the basket follow it.
 */
import { GROUND } from '../../world/props.js';
import { TEAM_OPEN, TRAIN_FACTS, WALK_ROUTES } from '../missions-team.js';
import { HUSKY_MET } from '../missions-sp2.js';

// (the dialogue box records a line it has played as `dlg:<key>`)
const once = (key) => ({ if: `!seen:dlg:${key}`, then: [{ say: key }] });
const STOPS = [520, 940, 1360];
const STOP_LOOK = {
  river: [
    ['ورقة على العمود', '📝'],
    ['فتات على الطريق', '🍞'],
    ['صخرة على الساقية', '💦'],
  ],
  orchard: [
    ['ورقة على العمود', '📝'],
    ['البوابة الخشب', '🚪'],
    ['البير القديم', '⛲'],
  ],
};
const FORK = 1660;
const BASKET = 1880;

/** One stop of one route: noticed once (a journal fact), then just a short line. */
const stop = (route, n) => ({
  id: `stop-${route}-${n}`,
  x: STOPS[n - 1],
  w: 60,
  h: 100,
  label: STOP_LOOK[route][n - 1][0],
  icon: STOP_LOOK[route][n - 1][1],
  if: `flag:tu-route-${route}`,
  cases: [
    { if: `!flag:tu-obs-${route}-${n}`, run: [{ say: `tu.obs-${route}-${n}` }, { fx: [`flag:tu-obs-${route}-${n}`, `journal:tu-obs-${route}-${n}`] }] },
    { run: [{ say: 'tu.obs-again' }] },
  ],
});
const fork = (route) => ({
  id: `fork-${route}`,
  x: FORK,
  w: 90,
  h: 100,
  label: 'المفترق',
  icon: '🐾',
  if: `flag:tu-route-${route}`,
  cases: [
    { if: `flag:tu-trail-${route}`, run: [{ say: 'tu.trail-again' }] },
    { if: { not: [1, 2, 3].map((n) => `flag:tu-obs-${route}-${n}`) }, run: [{ say: 'tu.fork-wait' }] },
    { run: [once('tu.fork-intro'), { puzzle: `tu-trail-${route}`, then: [{ say: 'tu.trail-done' }], else: [{ say: 'tu.later' }] }] },
  ],
});
/** The basket: the picnic plays once per route; the dogs' friendship moves on with each walk. */
const basket = (route) => {
  const other = WALK_ROUTES.find((r) => r !== route);
  return {
    id: `basket-${route}`,
    x: BASKET,
    w: 70,
    h: 80,
    label: 'السلة',
    icon: '🍎',
    if: [`flag:tu-route-${route}`, `flag:tu-trail-${route}`],
    cases: [
      { if: `flag:tu-walk-${route}`, run: [{ say: 'tu.picnic-again' }] },
      {
        run: [
          { move: 'snooki', x: BASKET - 40, speed: 260 },
          { pose: 'snooki', anim: 'excited', for: 700 },
          { say: `tu.picnic-${route}` },
          { if: 'flag:tu-dogs-1', then: [{ say: 'tu.dogs-second' }], else: [{ say: 'tu.dogs-first' }] },
          { say: 'tu.picnic-quiet' },
          { if: `flag:tu-walk-${other}`, then: [{ fx: 'flag:tu-dogs-2' }] },
          { fx: [`flag:tu-walk-${route}`, 'flag:tu-dogs-1', `journal:tu-walk-${route}`, `got:keepsake.walk.${route}`] },
        ],
      },
    ],
  };
};

/** Paw trails leaving the fork in three directions (drawn on the ground). */
function trails(ctx) {
  ctx.fillStyle = 'rgba(40, 30, 24, 0.45)';
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < 6; i++) {
      const x = FORK - 30 + i * 18 + (k - 1) * 6;
      const y = GROUND + 6 + k * 9 + (i % 2) * 3;
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const DOGWALK = {
  id: 'dogwalk',
  title: 'ممشى العصر',
  theme: 'meadow',
  music: 'warm',
  width: 2000,
  spawn: 140,
  seed: 611,
  props: [{ type: 'bush', x: 200 }, { type: 'bench', x: 760 }, { type: 'bush', x: 1180 }, { type: 'tree', x: 1940 }],
  dynamic: [
    // route dressing: the river's water and squirrel, the orchard's trees and well
    { x: 1360, reach: 140, if: 'flag:tu-route-river', draw: (ctx, { P, t }) => P.pond(ctx, 1400, GROUND - 6, 150, t) },
    { x: 1300, reach: 60, if: 'flag:tu-route-river', draw: (ctx, { P, t }) => P.squirrel(ctx, 1250, GROUND + 2, t) },
    ...[900, 1240, 1820].map((x) => ({ x, reach: 120, if: 'flag:tu-route-orchard', draw: (ctx, { P, t }) => P.meadowTree(ctx, x, GROUND + 2, t) })),
    { x: 940, reach: 80, if: 'flag:tu-route-orchard', draw: (ctx, { P }) => P.fence(ctx, 890, 990, GROUND + 2) },
    { x: 520, reach: 60, draw: (ctx, { P }) => P.signPost(ctx, 520, GROUND + 2, 'أ') },
    { x: FORK, reach: 80, draw: trails },
    {
      x: BASKET,
      reach: 60,
      if: { any: ['flag:tu-trail-river', 'flag:tu-trail-orchard'] },
      draw(ctx) {
        ctx.fillStyle = '#c99a5b';
        ctx.fillRect(BASKET - 18, GROUND - 22, 36, 22);
        ctx.strokeStyle = '#8a6236';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(BASKET, GROUND - 22, 14, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = '#e57f9a';
        ctx.fillRect(BASKET - 60, GROUND - 2, 34, 6);
      },
    },
  ],
  // all four walk together: Snooki and her husky follow her (data/companions.js), Ryan too
  together: true,
  actors: [{ id: 'ryan', kind: 'ryan', x: 260, facing: 1, companion: true, gap: 178 }],
  interact: [
    {
      id: 'no-plan',
      x: 520,
      w: 60,
      h: 100,
      label: 'ورقة على العمود',
      icon: '📝',
      if: { not: { any: ['flag:tu-route-river', 'flag:tu-route-orchard'] } },
      run: [{ say: 'tu.walk-noplan' }],
    },
    ...WALK_ROUTES.flatMap((r) => [stop(r, 1), stop(r, 2), stop(r, 3), fork(r), basket(r)]),
  ],
  triggers: [{ id: 'enter', x1: 140, x2: 320, if: { any: ['flag:tu-route-river', 'flag:tu-route-orchard'] }, run: [{ say: 'tu.walk-enter' }] }],
  exits: [{ side: 'left', to: 'garden', spawn: 160 }],
  ambient: [
    { t: 'المشي أحلى لمن أحد يحمل الأكل. آني أتطوع أشمه.' },
    { t: 'الهاسكي تركض گدام وترجع، وتركض وترجع. هي تمشي ضعف المشية.' },
  ],
};

/* ── «تمرين سوا»: the training yard ── */
const YARD = { board: 300, warmup: 430, squats: 560, rope: 800, plank: 1040, pushups: 1280, ladder: 1440, bench: 1590 };
/** A card to read once (a journal fact), then a short line. */
const card = (id, x, label, icon, flag, say) => ({
  id,
  x,
  w: 56,
  h: 100,
  label,
  icon,
  cases: [
    { if: `!flag:${flag}`, run: [{ say }, { fx: [`flag:${flag}`, `journal:${flag}`] }] },
    { run: [{ say: 'tu.st-again' }] },
  ],
});
const DUMBBELLS = { squats: 1, rope: 2, plank: 2, pushups: 3 };
export const TRAINYARD = {
  id: 'trainyard',
  title: 'صالة التمرين',
  theme: 'academy',
  music: 'warm',
  width: 1700,
  spawn: 140,
  seed: 733,
  props: [{ type: 'bush', x: 200 }, { type: 'bench', x: YARD.bench }],
  dynamic: [
    { x: YARD.board, reach: 80, draw: (ctx, { P }) => P.chalkboard(ctx, YARD.board, GROUND - 60, { title: 'قواعد أنجي', lines: ['الأخف ← الأثقل', 'تساوى؟ اللي يكرهه ريان أول'] }) },
    ...Object.entries(DUMBBELLS).map(([k, n]) => ({ x: YARD[k], reach: 60, draw: (ctx, { P }) => P.signPost(ctx, YARD[k], GROUND + 2, '🏋'.repeat(n)) })),
  ],
  // Ryan trains at the stations; Snooki stays beside him (data/companions.js); her husky follows her
  actors: [{ id: 'ryan', kind: 'ryan', x: 930, facing: -1 }],
  interact: [
    card('st-board', YARD.board, 'السبورة', '📋', 'tu-st-board', 'tu.st-board'),
    card('st-squats', YARD.squats, 'محطة السكوات', '🦵', 'tu-st-squats', 'tu.st-squats'),
    card('st-rope', YARD.rope, 'محطة الحبل', '➰', 'tu-st-rope', 'tu.st-rope'),
    card('st-plank', YARD.plank, 'محطة البلانك', '🧘', 'tu-st-plank', 'tu.st-plank'),
    card('st-pushups', YARD.pushups, 'محطة الضغط', '💪', 'tu-st-pushups', 'tu.st-pushups'),
    {
      id: 'warmup',
      x: YARD.warmup,
      w: 60,
      h: 90,
      label: 'الإحماء',
      icon: '📣',
      cases: [
        { if: 'flag:tu-train-warmup', run: [{ say: 'tu.warmup-again' }] },
        { if: { not: TRAIN_FACTS.map((f) => `flag:${f}`) }, run: [{ say: 'tu.warmup-wait' }] },
        { run: [{ puzzle: 'tu-warmup', then: [{ say: 'tu.warmup-done' }], else: [{ say: 'tu.later' }] }] },
      ],
    },
    {
      id: 'ladder',
      x: YARD.ladder,
      w: 60,
      h: 90,
      label: 'سلّم العدّات',
      icon: '📈',
      cases: [
        { if: 'flag:tu-train-ladder', run: [{ say: 'tu.ladder-again' }] },
        { if: '!flag:tu-train-warmup', run: [{ say: 'tu.ladder-wait' }] },
        { run: [{ puzzle: 'tu-ladder', then: [{ say: 'tu.ladder-done' }], else: [{ say: 'tu.later' }] }] },
      ],
    },
    {
      id: 'cooldown',
      x: YARD.bench,
      w: 80,
      h: 80,
      label: 'المصطبة',
      icon: '🧃',
      cases: [
        { if: 'flag:tu-train-done', run: [{ say: 'tu.cooldown-again' }] },
        { if: '!flag:tu-train-ladder', run: [{ say: 'tu.cooldown-wait' }] },
        { run: [{ say: 'tu.cooldown' }, { fx: ['flag:tu-train-done', 'journal:tu-train-cooldown', 'got:keepsake.train.1'] }] },
      ],
    },
  ],
  triggers: [{ id: 'enter', x1: 140, x2: 320, if: 'flag:tu-train-plan', run: [{ say: 'tu.train-enter' }] }],
  exits: [{ side: 'left', to: 'garden', spawn: 160 }],
  ambient: [{ t: 'آني الحَكَم. الحَكَم ما يتمرن. هاي القاعدة.' }],
};

export const TEAM_SCENES = [DOGWALK, TRAINYARD];

/* ── Anji's plan notebook, in the hidden garden (after the ending) ── */
const NOTEBOOK = 1760;
const goWalk = [{ say: 'tu.plan-go' }, { fade: 'out' }, { goto: 'dogwalk', x: 140 }];
const goTrain = [{ fade: 'out' }, { goto: 'trainyard', x: 140 }];
/** The walk: the first plan, a second route, or the walk still in progress. */
const WALK_FLOW = [
  {
    if: '!flag:tu-walk-plan',
    then: [{ say: 'tu.plan-first' }, { say: 'tu.plan-route' }, { fx: ['flag:tu-walk-plan', 'journal:tu-plan'] }, ...goWalk],
    else: [
      {
        if: { any: ['flag:tu-walk-river', 'flag:tu-walk-orchard'] },
        then: [{ say: 'tu.plan-second' }, { say: 'tu.plan-route' }, ...goWalk],
        else: [{ say: 'tu.plan-again' }, { say: 'tu.plan-route' }, ...goWalk],
      },
    ],
  },
];
const TRAIN_FLOW = [
  {
    if: '!flag:tu-train-plan',
    then: [{ say: 'tu.train-plan' }, { fx: ['flag:tu-train-plan', 'journal:tu-train-plan'] }, ...goTrain],
    else: [{ say: 'tu.train-again' }, ...goTrain],
  },
];
/** Everything in the notebook that is possible for this save has been done. */
export const ALL_PLANS_DONE = ['flag:tu-train-done', { any: [{ not: HUSKY_MET }, ['flag:tu-walk-river', 'flag:tu-walk-orchard']] }];
export const TEAM_EXTRAS = {
  final: {
    interact: [
      {
        id: 'tu-notebook',
        x: NOTEBOOK,
        w: 60,
        h: 80,
        label: 'دفتر خطط أنجي',
        icon: '📒',
        if: TEAM_OPEN,
        cases: [
          { if: ALL_PLANS_DONE, run: [{ say: 'tu.plan-done' }] },
          // she picks one of her plans that is possible today (the walk needs her husky)
          {
            run: [
              { say: 'tu.plan-menu' },
              { if: 'flag:tu-pick-walk', then: WALK_FLOW, else: [{ if: 'flag:tu-pick-train', then: TRAIN_FLOW, else: [{ say: 'tu.plan-later' }] }] },
            ],
          },
        ],
      },
    ],
    dynamic: [
      {
        x: NOTEBOOK,
        reach: 60,
        if: TEAM_OPEN,
        draw(ctx, { P, t }) {
          P.bench(ctx, NOTEBOOK, GROUND + 2);
          P.paper(ctx, NOTEBOOK, GROUND - 34, t);
        },
      },
    ],
  },
};

/** Scene with Team Us's additions appended (a new object). */
export function withTeam(scene) {
  const extra = TEAM_EXTRAS[scene.id];
  if (!extra) return scene;
  return {
    ...scene,
    interact: [...(scene.interact || []), ...(extra.interact || [])],
    dynamic: [...(scene.dynamic || []), ...(extra.dynamic || [])],
  };
}
