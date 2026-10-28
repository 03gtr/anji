/**
 * «إحنا فريق» — the afternoon walk («ممشى العصر») and Anji's plan notebook in the hidden
 * garden. Same conventions as the deep garden: a beat that completes a step is guarded by its
 * own result flag (an interrupted beat replays, a finished one never repeats); intro lines are
 * said once (`seen:`); a puzzle closed half-way keeps its draft. The route is two boolean flags
 * (`tu-route-river` / `tu-route-orchard`): the stops, the fork and the basket follow it.
 */
import { GROUND } from '../../world/props.js';
import { TEAM_UNLOCK, WALK_ROUTES } from '../missions-team.js';
import { HUSKY_MET } from '../missions-sp2.js';

const once = (key) => ({ if: `!seen:${key}`, then: [{ say: key }] });
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
  actors: [
    { id: 'ryan', kind: 'ryan', x: 300, facing: 1 },
    { id: 'husky', kind: 'husky', x: 420, facing: 1, if: HUSKY_MET },
  ],
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

export const TEAM_SCENES = [DOGWALK];

/* ── Anji's plan notebook, in the hidden garden (after the ending) ── */
const NOTEBOOK = 1760;
const goWalk = [{ say: 'tu.plan-go' }, { fade: 'out' }, { goto: 'dogwalk', x: 140 }];
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
        if: TEAM_UNLOCK,
        cases: [
          { if: ['flag:tu-walk-river', 'flag:tu-walk-orchard'], run: [{ say: 'tu.plan-done' }] },
          { if: '!flag:tu-walk-plan', run: [{ say: 'tu.plan-first' }, { say: 'tu.plan-route' }, { fx: ['flag:tu-walk-plan', 'journal:tu-plan'] }, ...goWalk] },
          { if: { any: ['flag:tu-walk-river', 'flag:tu-walk-orchard'] }, run: [{ say: 'tu.plan-second' }, { say: 'tu.plan-route' }, ...goWalk] },
          { run: [{ say: 'tu.plan-again' }, { say: 'tu.plan-route' }, ...goWalk] },
        ],
      },
    ],
    dynamic: [
      {
        x: NOTEBOOK,
        reach: 60,
        if: TEAM_UNLOCK,
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
