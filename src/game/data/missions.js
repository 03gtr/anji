/**
 * Side missions, optional challenges, arcade runs and collections (V2).
 * The main story stays in data/chapters.js; these chains hang off it.
 *
 * Like chapter objectives, mission progress is never stored separately: each
 * step is a condition over story flags, so the journal can never disagree
 * with what she actually did. `progression/missions.js` records completion
 * (`flag:mission:<id>`) and applies the reward once.
 *
 *   kind: 'side' | 'arcade' | 'challenge' | 'collect'
 *   unlock: condition that makes the mission appear
 *   steps: [{ done: condition, text, hint }]   — shown one at a time
 *   reward: effects applied on completion; rewardText: what the card shows
 *   leadsTo: missions this one opens (documentation + journal)
 */
import { PIECES } from '../minigames/garden-logic.js';
import { check } from '../core/conditions.js';
import { MISSIONS_SP1 } from './missions-sp1.js';
import { MISSIONS_SP2 } from './missions-sp2.js';

export const KIND_NAMES = { side: 'مهمة جانبية', arcade: 'سباق', challenge: 'تحدي', collect: 'مجموعة', story: 'حكاية', puzzle: 'لغز' };

const special = Object.entries(PIECES).filter(([, p]) => p.special);

export const MISSIONS = [
  {
    id: 'unfinished-build',
    kind: 'side',
    title: 'البناء الناقص',
    where: 'البيت · مكتب ريان',
    summary: 'لابتوب ريان بعده مفتوح على مشروع ما خلص. شنو اللي چان يحاول يصلحه… وليش الساعة واقفة؟',
    unlock: 'flag:study-done',
    steps: [
      { done: 'flag:clock-seen', text: 'افحصي الساعة الكبيرة بممر البيت.', hint: 'الساعة الطويلة بنص الممر، بين المطبخ والمكتب.' },
      { done: 'flag:build-seen', text: 'شوفي لابتوب ريان بالمكتب.', hint: 'ادخلي المكتب من الممر، اللابتوب على الميز.' },
      { done: 'flag:build-fixed', text: 'صلّحي الكود الناقص باللابتوب.', hint: 'الوقت بالكود هو وقت الساعة… بس الكمبيوتر يحسب ٢٤ ساعة.' },
      { done: 'flag:symbols-seen', text: 'اطفي ضوء المكتب… وشوفي شنو يلمع بالظلام.', hint: 'المسي الأباجورة اللي على الميز.' },
      { done: 'flag:drawer-open', text: 'افتحي درج الميز بالرموز اللي لمعت.', hint: 'الرموز الأربعة على الحايط، من اليمين لليسار.' },
    ],
    reward: ['item:shelf-key', 'journal:build-message'],
    rewardText: 'مفتاح صغير + رسالة من ريان',
    leadsTo: ['hidden-passage'],
  },
  {
    id: 'hidden-passage',
    kind: 'side',
    title: 'الممر المخفي',
    where: 'البيت · خلف رف المكتب',
    summary: 'المفتاح الصغير يفتح رف الكتب بالمكتب. وراه طريق ما مكتوب بأي خريطة.',
    unlock: 'flag:drawer-open',
    steps: [
      { done: 'flag:passage-open', text: 'استخدمي المفتاح الصغير على رف الكتب بالمكتب.', hint: 'الرف العالي يمين المكتب.' },
      { done: 'flag:passage-lever', text: 'اعبري الممر المخفي وشغّلي العتلة بآخره.', hint: 'الرفوف تتسلق، والعتلة بآخر الممر.' },
      { done: 'flag:passage-done', text: 'اقرئي اللي تركه ريان بغرفة الانتظار.', hint: 'الغرفة الصغيرة بآخر الممر، جنب الشباك.' },
    ],
    reward: ['item:night-key', 'journal:waiting-room'],
    rewardText: 'مفتاح زفيرو الاحتياطي',
    leadsTo: ['night-run'],
  },
  {
    id: 'night-run',
    kind: 'arcade',
    title: 'الطريق للبيت',
    where: 'الكراج · زفيرو',
    summary: 'مفتاح احتياطي مكتوب عليه «للطريق للبيت». طريق ليلي، وسيارة ثانية قدّامچ.',
    unlock: 'flag:passage-done',
    steps: [
      { done: 'flag:act3-done', text: 'خلّصي «طريق الأضواء الزرقاء» بالقصة أول.', hint: 'الكراج بآخر البيت.' },
      { done: 'flag:night-key-used', text: 'جرّبي المفتاح الاحتياطي بزفيرو بالكراج.', hint: 'المسي السيارة بالكراج.' },
      { done: 'record:game:race-night', text: 'سوقي «الطريق للبيت» لحد خط النهاية.', hint: 'الطريق طويل: اجمعي الأضواء الزرقاء حتى يتعبّى التسارع ⚡.' },
    ],
    reward: ['unlock:car-emerald', 'journal:night-run'],
    rewardText: 'لون زمردي لزفيرو',
    leadsTo: [],
  },
  {
    id: 'missing-recipe',
    kind: 'side',
    title: 'الوصفة الناقصة',
    where: 'البيت · المطبخ',
    summary: 'بطاقة وصفة ممزقة بخط ريان: «أكل البيت». القصاصات تفرّقت بالحديقة.',
    unlock: 'flag:kitchen-done',
    steps: [
      { done: 'flag:recipe-torn', text: 'شوفي لوح الوصفات جنب باب المطبخ.', hint: 'اللوح المعلّق بالممر يمين المطبخ.' },
      { done: 'count:scrap>=3', text: 'لگي ٣ قصاصات من الوصفة.', hint: 'وحدة بمكتب ريان، وحدة بالبيت الزجاجي، ووحدة بمحمية الحيوانات.' },
      { done: 'record:game:kitchen-home', text: 'اطبخي «أكل البيت» بالمطبخ.', hint: 'القصاصات تگول: بروتين، خضرة، شي يشبّع، وبدون أكل سريع.' },
    ],
    reward: ['item:lunchbox', 'journal:home-meal'],
    rewardText: 'علبة أكل + قطعة «طاولة» للحديقة',
    leadsTo: ['garden-plus'],
  },
  {
    id: 'lost-kitten',
    kind: 'side',
    title: 'فيروز الضايعة',
    where: 'محمية الحيوانات · المرج الخلفي',
    summary: 'قطة بالمحمية ما تبطّل تنادي. صغيرها ضاع، والآثار تروح لمكان ما شفتيه.',
    unlock: 'flag:tracks-done',
    steps: [
      { done: 'flag:kitten-heard', text: 'شنو هالصوت بالمحمية؟ روحي للقطة الحزينة.', hint: 'جنب السياج بآخر المحمية.' },
      { done: 'flag:kitten-tracks', text: 'اقرئي الآثار الصغيرة جنب السياج.', hint: 'أثر صغير، أربع أصابع، وبدون مخالب.' },
      { done: 'flag:kitten-found', text: 'لگي فيروز بالمرج الخلفي.', hint: 'فوق الشجرة الكبيرة… لازم تتسلقين الصخور.' },
      { done: 'flag:kitten-home', text: 'رجّعي فيروز لأمها بالمحمية.', hint: 'روحي للقطة جنب السياج.' },
    ],
    reward: ['unlock:collar-sky', 'journal:kitten'],
    rewardText: 'قلادة سماوية لسنوكي + بيت قطط للحديقة',
    leadsTo: ['garden-plus'],
  },
  {
    id: 'second-sky',
    kind: 'side',
    title: 'السما الثانية',
    where: 'المرصد',
    summary: 'العم منذر عنده خريطة نجوم «ما شافها حتى ريان». بس الخطوط ممسوحة.',
    unlock: 'flag:act5-done',
    steps: [
      { done: 'flag:sky-started', text: 'احچي ويّا العم منذر عن «السما الثانية».', hint: 'البومة بنص المرصد.' },
      { done: 'flag:sky-1', text: 'وصّلي نجوم الكوكبة الأولى.', hint: 'المسي خريطة النجوم الكبيرة بالمرصد.' },
      { done: 'flag:sky-2', text: 'وصّلي نجوم الكوكبة الثانية.', hint: 'نفس الخريطة.' },
      { done: 'flag:sky-3', text: 'وصّلي نجوم الكوكبة الأخيرة.', hint: 'نفس الخريطة… والعم منذر واثق إنها عظمة.' },
    ],
    reward: ['got:star.observatory.2', 'journal:second-sky'],
    rewardText: 'نجمة + تلسكوب صغير للحديقة',
    leadsTo: ['garden-plus'],
  },
  {
    id: 'robo-snooki',
    kind: 'side',
    title: 'روبو-سنوكي',
    where: 'ورشة الأشياء المفقودة',
    summary: 'بزاوية الورشة، روبوت صغير بشكل جرو. عليه ورقة: «v0.3 — ما يمشي عدل بعد».',
    unlock: 'flag:act7-done',
    steps: [
      { done: 'flag:robo-found', text: 'فحصي الروبوت الصغير بزاوية الورشة.', hint: 'يمين الماكينة الكبيرة.' },
      { done: 'record:game:pipes-robo', text: 'صلّحي دائرة الروبوت.', hint: 'نفس لعبة الكهرباء: لفّي القطع لحد ما توصل الطاقة.' },
      { done: 'flag:robo-coded', text: 'برمجي روبو-سنوكي يوصل للعظمة.', hint: 'رتّبي الأوامر: كل «قدّام» خطوة وحدة.' },
      { done: 'flag:robo-done', text: 'عرّفي روبو-سنوكي على سنوكي.', hint: 'المسي الروبوت مرة ثانية.' },
    ],
    reward: ['journal:robo'],
    rewardText: 'روبو-سنوكي يصير قطعة بالحديقة',
    leadsTo: ['garden-plus'],
  },
  {
    id: 'detective-exam',
    kind: 'challenge',
    title: 'امتحان المحقق',
    where: 'أكاديمية سنوكي',
    summary: 'سنوكي سوّى امتحان «رسمي» عن كل الأدلة اللي لگيتيها. يگول صعب. محد يصدّقه.',
    unlock: 'flag:act5-done',
    steps: [
      { done: 'flag:exam-offered', text: 'روحي للسبورة بأكاديمية سنوكي.', hint: 'الأكاديمية من الخريطة.' },
      { done: 'record:game:exam', text: 'انجحي بامتحان المحقق.', hint: 'كل الأسئلة عن أشياء صارت بالقصة. الدفتر يساعد.' },
    ],
    reward: ['item:diploma', 'journal:diploma'],
    rewardText: 'شهادة محققة (موقّعة بكف)',
    leadsTo: [],
  },
  {
    id: 'wardrobe-challenge',
    kind: 'challenge',
    title: 'تحدي الإطلالة',
    where: 'البيت · غرفة الملابس',
    summary: 'سنوكي صار «منسّق أزياء». عنده ثلاث طلبات، ورأيه قاسي.',
    unlock: ['flag:wardrobe-done', 'flag:act4-done'],
    steps: [
      { done: 'flag:style-offered', text: 'روحي لغرفة الملابس… سنوكي ينتظر.', hint: 'الباب الأول بالبيت.' },
      { done: 'record:game:wardrobe-challenge', text: 'طلّعي ثلاث إطلالات حسب طلبات سنوكي.', hint: 'اقرئي الطلب: كل طلب إله ملابس تناسبه.' },
    ],
    reward: ['unlock:bow-emerald', 'journal:style'],
    rewardText: 'فيونكة زمردية',
    leadsTo: [],
  },
  {
    id: 'letters-archive',
    kind: 'collect',
    title: 'أرشيف الرسائل',
    where: 'ممر الذكريات',
    summary: 'درج أرشيف بممر الذكريات عليه ثمان فتحات صغيرة… بقد رسائل ريان.',
    unlock: 'flag:act6-done',
    steps: [
      { done: 'count:note>=8', text: 'اجمعي ثمان رسائل من رسائل ريان.', hint: 'بعض الرسائل بالمهمات الجانبية: الممر المخفي، والمرج.' },
      { done: 'flag:archive-open', text: 'افتحي درج الأرشيف بممر الذكريات.', hint: 'آخر الممر، جنب الإطار السادس.' },
    ],
    reward: ['got:note.ryan.9', 'journal:archive'],
    rewardText: 'الرسالة التاسعة',
    leadsTo: [],
  },
  {
    id: 'garden-plus',
    kind: 'collect',
    title: 'حديقة على ذوقچ',
    where: 'الحديقة المخفية',
    summary: 'المهمات الجانبية تفتح قطع خاصة للحديقة المخفية. ازرعيها وين ما تحبين.',
    unlock: 'flag:game-complete',
    steps: [
      {
        done: (g) => special.filter(([, p]) => check(p.unlock, g)).length >= 2,
        text: 'افتحي قطعتين خاصتين من المهمات الجانبية.',
        hint: 'الوصفة، فيروز، السما الثانية، وروبو-سنوكي… كل وحدة تفتح قطعة.',
      },
      {
        done: (g) => g.state.garden.filter((p) => PIECES[p.id]?.special).length >= 2,
        text: 'ازرعي قطعتين خاصتين بالحديقة المخفية.',
        hint: 'المسي «ازرعي الحديقة» جنب الأحواض.',
      },
    ],
    reward: ['journal:gardener'],
    rewardText: 'صفحة «حديقتي» بالدفتر',
    leadsTo: [],
  },
  // Story Pack 01 «الطرق اللي تتذكر» (post-game story chapters + optional activities)
  ...MISSIONS_SP1,
  // Story Pack 02 «أرشيف الأسرار» (main story, between Act IV and Act VII)
  ...MISSIONS_SP2,
];

export const missionById = (id) => MISSIONS.find((m) => m.id === id);
