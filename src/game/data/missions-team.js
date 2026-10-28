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
 *   tu-train  «تمرين سوا» — Anji sets a workout for the two of them in a training yard: her
 *             warm-up rule is on a chalkboard and the weights are on four stations (and Ryan
 *             lets slip which one he hates), so the order has to be worked out; then her rep
 *             ladder, where she blows the whistle and changes the rule for the last round
 *             (shown on the board). A cool-down where Ryan has his own surprise. No husky
 *             needed; no real exercise, timing or health tracking.
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

/** After the ending: the activities that do not need the husky (and the notebook itself). */
export const TEAM_OPEN = 'flag:game-complete';
/** What she reads in the training yard before the warm-up: four station cards and the chalkboard. */
export const TRAIN_FACTS = ['tu-st-squats', 'tu-st-rope', 'tu-st-plank', 'tu-st-pushups', 'tu-st-board'];

/** The returning-player notice (content-notice.js): once, pointing at the notebook. */
export const PACKS_TEAM = [
  { id: PACK_TEAM, title: 'إحنا فريق', unlock: TEAM_OPEN, scene: 'final', world: 'final', notice: 'أنجي، دفتر خططچ بالحديقة المخفية… وبيه فكرة جديدة 📒' },
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
  {
    id: 'tu-train',
    kind: 'together',
    pack: PACK_TEAM,
    world: ['final', 'trainyard'],
    title: 'تمرين سوا',
    where: 'الحديقة المخفية · صالة التمرين',
    summary: 'أنجي حضّرت تمرين إلنا الاثنين… بقواعدها هي. وهي تحب تغيّر القواعد بالنص.',
    unlock: TEAM_OPEN,
    locked: 'تنفتح بعد نهاية الحكاية.',
    steps: [
      { done: 'flag:tu-train-plan', world: 'final', text: 'اختاري «تمرين سوا» من دفتر خططچ.', hint: 'الدفتر على المصطبة، ورا شجرة الورد.' },
      { done: TRAIN_FACTS.map((f) => `flag:${f}`), world: 'trainyard', text: 'اقري السبورة وبطاقات المحطات الأربع.', hint: 'السبورة جنب الباب، والمحطات على طول الصالة.' },
      { done: 'flag:tu-train-warmup', world: 'trainyard', text: 'رتّبي الإحماء.', hint: 'الأوزان من البطاقات، والقاعدة من السبورة. واسمعي شنو يگول ريان.' },
      { done: 'flag:tu-train-ladder', world: 'trainyard', text: 'خلّصي سلّم العدّات.', hint: 'وانتبهي: أنجي تحب تغيّر القواعد.' },
      { done: 'flag:tu-train-done', world: 'trainyard', text: 'استراحة بعد التمرين.', hint: 'المصطبة بآخر الصالة.' },
    ],
    reward: ['journal:tu-train'],
    rewardText: 'صافرة أنجي + استراحة ويا ريان',
    leadsTo: [],
  },
];
