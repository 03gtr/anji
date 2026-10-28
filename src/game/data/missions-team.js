/**
 * «إحنا فريق» (Team Us) — life after the ending: Anji, Ryan, Snooki and the husky doing
 * things together. Every activity is optional, opens only after the ending, and is started by
 * Anji from her plan notebook in the hidden garden (she proposes, Ryan joins in).
 * Invented scenes for the game, not real memories. No wedding: that is a future milestone.
 *
 *   tu-walk   «مشية العصر» — Anji plans a walk with a game in it: she chooses the route (river
 *             or orchard); at three stops each dog notices something different (Snooki smells,
 *             the husky watches); at the fork a small logic grid says which trail leads to her
 *             hidden basket and who follows it; then a quiet picnic. The other route can be
 *             walked later: a second keepsake, and the dogs' friendship moves on (tu-dogs-1 → 2).
 *
 * State is additive flags only (`tu-*`, `pdraft:tu-*`), so SAVE_VERSION stays the same.
 * Missions are APPENDED to data/missions.js, so no older display number moves.
 */
import { HUSKY_MET } from './missions-sp2.js';

export const PACK_TEAM = 'team';
/** After the ending, once she has met the husky (two dogs, four of them on the walk). */
export const TEAM_UNLOCK = ['flag:game-complete', HUSKY_MET];
export const WALK_ROUTES = ['river', 'orchard'];
const obs = (route) => [1, 2, 3].map((n) => `flag:tu-obs-${route}-${n}`);

/** The returning-player notice (content-notice.js): once, pointing at the notebook. */
export const PACKS_TEAM = [
  { id: PACK_TEAM, title: 'إحنا فريق', unlock: TEAM_UNLOCK, scene: 'final', world: 'final', notice: 'أنجي، دفتر خططچ بالحديقة المخفية… وبيه فكرة جديدة 📒' },
];

export const MISSIONS_TEAM = [
  {
    id: 'tu-walk',
    kind: 'together',
    pack: PACK_TEAM,
    world: ['final', 'dogwalk'],
    title: 'مشية العصر',
    where: 'الحديقة المخفية · ممشى العصر',
    summary: 'أنجي عندها خطة: مشية ويا ريان والكلبين. بس الخطة بيها لعبة صغيرة… وسلة مخبية بآخر الطريق.',
    unlock: TEAM_UNLOCK,
    locked: 'تنفتح بعد نهاية الحكاية، لمن تتعرفين على الهاسكي.',
    steps: [
      { done: 'flag:tu-walk-plan', world: 'final', text: 'افتحي دفتر خططچ واختاري طريق المشية.', hint: 'الدفتر على المصطبة، ورا شجرة الورد.' },
      {
        done: { any: [obs('river'), obs('orchard')] },
        world: 'dogwalk',
        text: 'بثلاث وگفات بالطريق: شنو يلاحظ كل كلب؟',
        hint: 'سنوكي يقرا الگاع بخشمه؛ الهاسكي تباوع اللي يتحرك. كل وگفة عليها علامة.',
      },
      {
        done: { any: ['flag:tu-trail-river', 'flag:tu-trail-orchard'] },
        world: 'dogwalk',
        text: 'عند المفترق: كل أثر لوين يوصل، ومنو يلحقه؟',
        hint: 'اللي لاحظتيه بالوگفات محفوظ بالدفتر ← الأدلة. كل ملاحظة تشطب احتمال.',
      },
      { done: { any: ['flag:tu-walk-river', 'flag:tu-walk-orchard'] }, world: 'dogwalk', text: 'لحقي الأثر لآخره.', hint: 'السلة بآخر الممشى، بعد المفترق.' },
    ],
    reward: ['journal:tu-walk'],
    rewardText: 'نزهة صغيرة + تذكار من الطريق',
    leadsTo: [],
  },
];
