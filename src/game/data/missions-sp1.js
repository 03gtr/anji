/**
 * Story Pack 01 «الطرق اللي تتذكر» — missions (same model as data/missions.js:
 * stable ids, an unlock condition, steps that are conditions over story
 * flags, and a reward applied exactly once through `flag:mission:<id>`).
 *
 * The pack opens after the main ending (`flag:game-complete`): Ryan is only
 * found in Act VIII, so meeting him earlier would break the main story.
 * Optional activities (`kind: 'side'`) never block the story missions.
 */
export const PACK_SP1 = 'sp1';
export const SP1_UNLOCK = 'flag:game-complete';

/**
 * Content packs, for the one-time "new places" notice (ui/content-notice.js).
 * A future pack adds an entry here plus its scenes, map nodes and missions.
 */
export const PACKS = [
  { id: PACK_SP1, title: 'الطرق اللي تتذكر', unlock: SP1_UNLOCK, scene: 'roads', world: 'roads', notice: 'أنجي، أكو أماكن جديدة تنتظرج بالحديقة! 🌷' },
];

export const MISSIONS_SP1 = [
  {
    id: 'sp1-two-roads',
    kind: 'story',
    pack: PACK_SP1,
    title: 'حيث يلتقي الطريقان',
    where: 'طريق الذكريات',
    summary: 'مدخل قرية، طريقين تحت شجر كثيف، وسيارتين. بعض الأماكن تتذكر أكثر منّا.',
    unlock: SP1_UNLOCK,
    steps: [
      { done: 'flag:sp1-roads-seen', text: 'روحي لطريق الذكريات من الخريطة.', hint: 'الخريطة ← «طريق الذكريات»، تحت يسار الخريطة.' },
      { done: 'flag:sp1-embrace', text: 'امشي بالطريق لحد السيارتين.', hint: 'قريب من مدخل القرية، تحت الشجر.' },
    ],
    reward: [],
    rewardText: 'ورقة من شجرة الطريق',
    leadsTo: ['sp1-sweets-roses'],
  },
  {
    id: 'sp1-sweets-roses',
    kind: 'story',
    pack: PACK_SP1,
    title: 'ورد وحلويات',
    where: 'عيادة الورد',
    summary: 'بالعيادة الصغيرة اللي جنب الطريق، أحد ترك شي على المصطبة. بلا موعد، وبلا اسم.',
    unlock: 'flag:sp1-embrace',
    steps: [
      { done: 'flag:sp1-clinic-seen', text: 'روحي لعيادة الورد.', hint: 'من طريق الذكريات امشي لليسار، أو من الخريطة.' },
      { done: 'flag:sp1-visit-done', text: 'شوفي شنو على المصطبة.', hint: 'المصطبة جنب الفانوس، قبل باب العيادة.' },
    ],
    reward: [],
    rewardText: 'غلاف حلاوة مطوي',
    leadsTo: ['sp1-husky-name'],
  },
  {
    id: 'sp1-husky-name',
    kind: 'story',
    pack: PACK_SP1,
    title: 'اسم محد يعرفه غيرها',
    where: 'عيادة الورد',
    summary: 'ريان گال إن بعد شي بالسيارة… «بس هذا مو حلاوة».',
    unlock: 'flag:sp1-visit-done',
    steps: [
      { done: 'seen:it.roseclinic.ryan', text: 'احچي ويّا ريان بعيادة الورد.', hint: 'ريان واگف جنب المصطبة.' },
      { done: 'flag:sp1-husky-met', text: 'اختاري اسم للهاسكي البيضاء.', hint: 'المسي اسم من الأسماء، أو اكتبي اسم على ذوقچ.' },
    ],
    reward: [],
    rewardText: 'صفحة «صديقتنا البيضاء» بالدفتر',
    leadsTo: ['sp1-unsigned-gift', 'sp1-lost-ball'],
  },
  {
    id: 'sp1-unsigned-gift',
    kind: 'story',
    pack: PACK_SP1,
    title: 'الهدية اللي بلا توقيع',
    where: 'طريق الذكريات · عيادة الورد',
    summary: 'صندوق صغير جنب سيارتچ، بقفل بثلاث رموز. محد يعرف منو تركه. (سنوكي يعرف.)',
    unlock: 'flag:sp1-husky-met',
    steps: [
      { done: 'flag:sp1-gift-box', text: 'شوفي الصندوق اللي جنب سيارتچ بطريق الذكريات.', hint: 'جنب سيارتچ البيضاء، قريب من مدخل القرية.' },
      {
        done: ['flag:sp1-clue-1', 'flag:sp1-clue-2', 'flag:sp1-clue-3'],
        text: 'لگي الأدلة الثلاثة: نقش، ورقة بأصيص، وورقة فوق غصن.',
        hint: 'النقش بجذع شجرة بطريق الذكريات، الأصيص بعيادة الورد، والغصن العالي بآخر الطريق — تسلقيه، أو اطلبي من {husky} تجيبه.',
      },
      { done: 'flag:sp1-gift-open', text: 'افتحي الصندوق بالشفرة.', hint: 'كل رمز حرف. الأدلة مكتوبة بالدفتر.' },
    ],
    reward: [],
    rewardText: 'بطاقة بلا توقيع',
    leadsTo: ['sp1-garden-remembers'],
  },
  {
    id: 'sp1-garden-remembers',
    kind: 'story',
    pack: PACK_SP1,
    title: 'الحديقة تتذكر',
    where: 'طريق الذكريات',
    summary: 'سنوكي يگول الطريق تغيّر. نفس الطريق… بس بيه درب ما چان موجود.',
    unlock: 'flag:sp1-gift-open',
    steps: [
      { done: 'flag:sp1-return', text: 'ارجعي لأول طريق الذكريات.', hint: 'من الخريطة، أو من عيادة الورد لليمين.' },
      { done: 'flag:sp1-done', text: 'امشي بالدرب الجديد لآخره.', hint: 'ريان واگف جنب البوابة. على راحتچ.' },
    ],
    reward: ['unlock:collar-rose'],
    rewardText: 'قلادة وردية لسنوكي (حتى ما يغار)',
    leadsTo: [],
  },
  // optional activities
  {
    id: 'sp1-lost-ball',
    kind: 'side',
    pack: PACK_SP1,
    title: 'الطابة الضايعة',
    where: 'عيادة الورد',
    summary: '{husky} تدور على شي. وسنوكي يباوع لكل مكان إلا عليها.',
    unlock: 'flag:sp1-husky-met',
    steps: [
      { done: 'seen:it.roseclinic.husky', text: 'شوفي شبيها {husky}.', hint: 'المسي {husky} بعيادة الورد.' },
      { done: 'flag:sp1-ball-found', text: 'ساعدي {husky} توصل لطابتها.', hint: 'رتّبي الأوامر خطوة بخطوة. التلميحات تساعد.' },
    ],
    reward: [],
    rewardText: 'الطابة الضايعة (تذكار)',
    leadsTo: [],
  },
  {
    id: 'sp1-little-lines',
    kind: 'side',
    pack: PACK_SP1,
    title: 'من سطر صغير',
    where: 'عيادة الورد · ميز الحديقة',
    summary: 'لابتوب ريان مفتوح على ميز الحديقة، وجنبه ماكنة صغيرة واگفة.',
    unlock: 'flag:sp1-visit-done',
    steps: [
      { done: 'seen:cine:sp1-montage', text: 'شوفي لابتوب ريان على ميز الحديقة.', hint: 'الميز جنب الأصيص، يمين العيادة.' },
      { done: 'flag:sp1-steps-done', text: 'شغّلي ماكنة الأفكار جنب اللابتوب.', hint: 'رتّبي: فكرة، رسمة، كود، تجربة، وبعدين توصل للناس.' },
    ],
    reward: [],
    rewardText: 'صفحة «من سطر صغير» بالدفتر',
    leadsTo: [],
  },
];
