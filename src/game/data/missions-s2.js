/**
 * Season 2 «ملف الدائرة المغلقة» — Milestone M1: Acts I–II, missions s2-01 … s2-11
 * (docs/season-2/SEASON_2_MISSION_CATALOG.md). Fiction written for the game.
 *
 * It opens after the original ending (`game-complete`) — nothing else, and nothing already done is
 * replayed or re-locked. Its progress lives in Season 2's own save document (every id starts with
 * `s2`, core/game.js). Steps complete on flags and evidence, never on dialogue text. A locked or
 * blocked step says what KIND of thing is missing, never the answer.
 *
 * M1 ends at s2-11 with a coherent stopping point: the board holds three open theories, the journal
 * says «يتبع…», and nothing points at a place that does not exist yet.
 */
export const PACK_S2 = 's2';
export const S2_OPEN = 'flag:game-complete';
const WITNESSES = ['s2-05', 's2-06', 's2-07', 's2-08', 's2-09'];
export const S2_M1_DONE = 'flag:mission:s2-11';

/** The returning-player notice (content-notice.js): once, after the ending. */
export const PACKS_S2 = [
  {
    id: PACK_S2,
    title: 'ملف الدائرة المغلقة',
    unlock: S2_OPEN,
    scene: 's2-archive',
    world: 's2-archive',
    notice: 'أنجي، ليلة الفوانيس صارت… بس الصبح شي بالحديقة ما ينفهم 🏮',
  },
];

const after = (id) => `flag:mission:${id}`;
/** Any three of the five witnesses (each gives a handwriting sample): s2-10 opens. */
export const S2_HANDS_OPEN = { any: [[after('s2-05'), after('s2-06'), after('s2-07')], [after('s2-05'), after('s2-06'), after('s2-08')], [after('s2-05'), after('s2-06'), after('s2-09')], [after('s2-05'), after('s2-07'), after('s2-08')], [after('s2-05'), after('s2-07'), after('s2-09')], [after('s2-05'), after('s2-08'), after('s2-09')], [after('s2-06'), after('s2-07'), after('s2-08')], [after('s2-06'), after('s2-07'), after('s2-09')], [after('s2-06'), after('s2-08'), after('s2-09')], [after('s2-07'), after('s2-08'), after('s2-09')]] };

export const MISSIONS_S2 = [
  {
    id: 's2-01',
    kind: 'story',
    pack: PACK_S2,
    act: 1,
    day: 1,
    world: ['s2-archive'],
    title: 'الصفحة المگطوعة',
    where: 'أرشيف الحديقة',
    summary: 'ليلة الفوانيس خلصت، والصبح سجل الحديقة مگطوع منه صفحة. والنسخة المعلّگة بالأرشيف تگول شي ثاني.',
    unlock: S2_OPEN,
    locked: 'ينفتح بعد نهاية الحكاية.',
    steps: [
      { done: 'ev:e-register', world: 's2-archive', text: 'افحصي سجل الحديقة بالأرشيف.', hint: 'السجل الكبير على المنضدة بنص الأرشيف.' },
      { done: 'ev:e-copy', world: 's2-archive', text: 'اقرئي النسخة المعلّگة باللوحة.', hint: 'اللوحة على الحايط، جنب الشباك.' },
      { done: 'flag:s2:01-compared', world: 's2-archive', text: 'قارني النسخة بالسجل: شنو ما يركب؟', hint: 'رجعي للسجل. الأرقام هي المفتاح.' },
    ],
    reward: ['journal:s2-case-open'],
    rewardText: 'بداية القضية',
    leadsTo: ['s2-02'],
  },
  {
    id: 's2-02',
    kind: 'story',
    pack: PACK_S2,
    act: 1,
    day: 2,
    world: ['s2-tree'],
    title: 'شجرة الفوانيس',
    where: 'شجرة الفوانيس',
    summary: 'الشجرة اللي علّگنا بيها الأمنيات. كل فانوس يحچي حكايته… إذا انفحص.',
    unlock: after('s2-01'),
    locked: 'تنفتح بعد «الصفحة المگطوعة».',
    steps: [
      {
        done: ['flag:s2:lantern-1', 'flag:s2:lantern-2', 'flag:s2:lantern-3', 'flag:s2:lantern-4', 'flag:s2:lantern-5', 'flag:s2:lantern-6', 'flag:s2:lantern-7'],
        world: 's2-tree',
        text: 'افحصي كل فانوس بالشجرة.',
        hint: 'الفوانيس على طول الشجرة… ووحد منها ورا الغصن البعيد.',
      },
      { done: 'flag:s2:02-counted', world: 's2-tree', text: 'كم فانوس صدگ؟ قارني بالنسخة.', hint: 'جذع الشجرة، بالنص. عدّي اللي شفتيه بعينچ.' },
    ],
    reward: ['journal:s2-tree'],
    rewardText: 'سبع فوانيس، وبطاقتين غريبات',
    leadsTo: ['s2-03'],
  },
  {
    id: 's2-03',
    kind: 'story',
    pack: PACK_S2,
    act: 1,
    day: 3,
    world: ['s2-tree'],
    title: 'دفتر التحقيق الرسمي',
    where: 'شجرة الفوانيس · طاولة ريان',
    summary: 'ريان فتح دفتر تحقيق رسمي، بختم. ومن أول صفحة ضيّع الدليل الأول.',
    unlock: after('s2-02'),
    locked: 'ينفتح بعد «شجرة الفوانيس».',
    steps: [
      { done: 'ev:e-note', world: 's2-tree', text: 'ريان ضيّع «الدليل الأول». ساعديه يلگاه.', hint: 'طاولة ريان. شي على الطاولة چان واگف فوگ شي.' },
      { done: 'ev:e-whisper', world: 's2-tree', text: 'اسمعي شنو سمع ريان.', hint: 'احچي ويا ريان عند طاولته.' },
      { done: 'flag:s2:03-sorted', world: 's2-tree', text: 'افرزي اللي عدچ: دليل، لو كلام؟', hint: 'دفتر ريان على الطاولة.' },
    ],
    reward: ['journal:s2-notebook', 'flag:s2:caseroom-open'],
    rewardText: 'غرفة الدائرة تنفتح',
    leadsTo: ['s2-04'],
  },
  {
    id: 's2-04',
    kind: 'story',
    pack: PACK_S2,
    act: 1,
    day: 4,
    world: ['s2-caseroom'],
    title: 'لوحة الدائرة',
    where: 'غرفة الدائرة',
    summary: 'إذا راح نفكر، نفكر صح: كل دليل بمكانه، وكل نظرية شنو ناقصها.',
    unlock: after('s2-03'),
    locked: 'تنفتح بعد «دفتر التحقيق الرسمي».',
    steps: [
      { done: 'flag:s2:in-caseroom', world: 's2-caseroom', text: 'ادخلي غرفة الدائرة.', hint: 'من الباب بآخر الأرشيف، لو من الخريطة.' },
      { done: 'flag:s2:board-1', world: 's2-caseroom', text: 'علّگي أدلتچ على لوحة الدائرة.', hint: 'اللوحة الكبيرة بنص الغرفة.' },
    ],
    reward: ['journal:s2-board-1'],
    rewardText: 'خمس زوايا للحكاية تنفتح',
    leadsTo: ['s2-05', 's2-06', 's2-07', 's2-08', 's2-09'],
  },
  // Act II — five perspectives, in any order
  {
    id: 's2-05',
    kind: 'story',
    pack: PACK_S2,
    act: 2,
    day: 5,
    world: ['s2-clinic', 's2-tree'],
    title: 'ربيع والفانوس المضوي',
    where: 'العيادة · شجرة الفوانيس',
    summary: 'بطاقة ريان چانت بفانوس ربيع. ربيع بالعيادة… وريان صادف جاي يجيب گهوة.',
    unlock: after('s2-04'),
    locked: 'ينفتح بعد «لوحة الدائرة».',
    steps: [
      { done: 'ev:t-rabi', world: 's2-clinic', text: 'احچي ويا ربيع بالعيادة.', hint: 'ربيع جنب الرف الأبيض.' },
      { done: 'ev:e-wax', world: 's2-tree', text: 'افحصي شمع فانوس ربيع: وين انتقلت البطاقة؟', hint: 'الفانوس السادس بالشجرة. شوفي الشمع على حافة البطاقة.' },
    ],
    reward: ['journal:s2-rabi'],
    rewardText: 'شهادة، وخط، ودليل شمع',
    leadsTo: ['s2-10', 's2-11'],
  },
  {
    id: 's2-06',
    kind: 'story',
    pack: PACK_S2,
    act: 2,
    day: 6,
    world: ['s2-clinic'],
    title: 'نسخة لمى',
    where: 'العيادة',
    summary: 'لمى هي اللي كتبت النسخة. تحب تعدّ… بس شنو عدّت بالضبط؟',
    unlock: after('s2-04'),
    locked: 'ينفتح بعد «لوحة الدائرة».',
    steps: [
      { done: 'ev:t-lama', world: 's2-clinic', text: 'احچي ويا لمى بالعيادة.', hint: 'لمى عند لوحة الإعلانات.' },
      { done: 'ev:e-copy-diff', world: 's2-clinic', text: 'قارني نسختها باللي شفتيه بعينچ.', hint: 'لوحة الإعلانات بالعيادة: نسختها الأصلية هناك.' },
    ],
    reward: ['journal:s2-lama'],
    rewardText: 'ليش ثمانية؟',
    leadsTo: ['s2-10', 's2-11'],
  },
  {
    id: 's2-07',
    kind: 'story',
    pack: PACK_S2,
    act: 2,
    day: 7,
    world: ['s2-gym'],
    title: 'صبري والكلمات الصحيحة',
    where: 'صالة التمرين',
    summary: 'صبري صاحب ريان، ويتذكر الكلام حرفياً. شنو گال بالضبط؟',
    unlock: after('s2-04'),
    locked: 'ينفتح بعد «لوحة الدائرة».',
    steps: [
      { done: 'flag:s2:07-talked', world: 's2-gym', text: 'احچي ويا صبري بصالة التمرين.', hint: 'صبري جنب الأثقال.' },
      { done: 'ev:t-sabri', world: 's2-gym', text: 'رتّبي كلمات صبري مثل ما گالها.', hint: 'المسي صبري مرة ثانية. هو يتذكر أول وآخر كلمة.' },
      { done: 'ev:e-receipt', world: 's2-gym', text: 'شي وگع من ريان…', hint: 'على الگاع، جنب مكان ريان.' },
    ],
    reward: ['journal:s2-sabri'],
    rewardText: 'الجملة الأصلية',
    leadsTo: ['s2-10', 's2-11'],
  },
  {
    id: 's2-08',
    kind: 'story',
    pack: PACK_S2,
    act: 2,
    day: 8,
    world: ['s2-lamphouse'],
    title: 'العم جوجو وساعة الحديقة',
    where: 'بيت الفانوس',
    summary: 'العم جوجو يكتب السجل كل ليلة، بخطه الصغير. بس ساعته… وساعة الحديقة؟',
    unlock: after('s2-04'),
    locked: 'ينفتح بعد «لوحة الدائرة».',
    steps: [
      { done: 'ev:t-jojo', world: 's2-lamphouse', text: 'احچي ويا العم جوجو ببيت الفانوس.', hint: 'العم جوجو جنب الفوانيس اللي يصلّحها.' },
      { done: 'ev:e-drift', world: 's2-lamphouse', text: 'ساعة الحديقة: شكد چان الوقت صدگ؟', hint: 'ساعة الحديقة على الحايط، وورقة الفوانيس معلّگة جنبها.' },
    ],
    reward: ['journal:s2-jojo'],
    rewardText: 'ساعة تختلف ساعة',
    leadsTo: ['s2-10', 's2-11'],
  },
  {
    id: 's2-09',
    kind: 'story',
    pack: PACK_S2,
    act: 2,
    day: 9,
    world: ['s2-home'],
    title: 'أختي والمسابقة',
    where: 'حديقة البيت',
    summary: 'أختي تحب المسابقات وتلعب حتى تربح. وعدها قلم… والبطاقة الفارغة يمي.',
    unlock: after('s2-04'),
    locked: 'ينفتح بعد «لوحة الدائرة».',
    steps: [
      { done: 'flag:s2:09-quiz', world: 's2-home', text: 'العبي ويا أختي مسابقتها.', hint: 'أختي على الكراسي بحديقة البيت.' },
      { done: 'ev:e-imprint', world: 's2-home', text: 'مرّي قلمها على البطاقة الفارغة.', hint: 'المسي الطاولة: القلم هناك، والبطاقة الفارغة وياچ.' },
      { done: 'ev:t-sister', world: 's2-home', text: 'اسأليها عن ليلة الفوانيس.', hint: 'احچي ويا أختي مرة ثانية.' },
    ],
    reward: ['journal:s2-sister'],
    rewardText: 'أثر ضغط، وجواب ناقص',
    leadsTo: ['s2-10', 's2-11'],
  },
  {
    id: 's2-10',
    kind: 'story',
    pack: PACK_S2,
    act: 2,
    day: 10,
    world: ['s2-caseroom'],
    title: 'الورقة اللي ما انوقّعت',
    where: 'غرفة الدائرة',
    summary: 'الورقة اللي تحت الكوب بلا توقيع. عدچ خطوط تقارنين بيها — مو للاتهام، للاستبعاد.',
    // any three of the five witnesses: each gives a handwriting sample
    unlock: [after('s2-04'), S2_HANDS_OPEN],
    locked: 'تنفتح لمن تسمعين ثلاث زوايا على الأقل (كل وحدة تعطيچ خط).',
    steps: [
      { done: 'seen:dlg:s2.hands-intro', world: 's2-caseroom', text: 'رجعي للوحة ويا الورقة اللي بلا توقيع.', hint: 'اللوحة بغرفة الدائرة.' },
      { done: 'ev:d-elim', world: 's2-caseroom', text: 'قارني الخطوط اللي عدچ بخط الورقة.', hint: 'المسي اللوحة. الورقة والخطوط هناك.' },
    ],
    reward: ['journal:s2-elim'],
    rewardText: 'استبعاد، مو اتهام',
    leadsTo: ['s2-11'],
  },
  {
    id: 's2-11',
    kind: 'story',
    pack: PACK_S2,
    act: 2,
    day: 12,
    world: ['s2-caseroom'],
    title: 'اجتماع الدفترين',
    where: 'غرفة الدائرة',
    summary: 'ريان جاب دفتره، وآني جبت دفتري. وقت نقارن… ونحچي.',
    unlock: [...WITNESSES.map(after), after('s2-10')],
    locked: 'ينفتح لمن تسمعين الزوايا الخمس، وتقارنين الخطوط.',
    steps: [
      { done: 'flag:s2:11-talked', world: 's2-caseroom', text: 'احچي ويا ريان بغرفة الدائرة.', hint: 'ريان واگف جنب اللوحة، ودفتره بإيده.' },
      { done: 'flag:s2:board-2', world: 's2-caseroom', text: 'رتّبي اللوحة من جديد: النظرية الثالثة جت.', hint: 'اللوحة الكبيرة بنص الغرفة.' },
    ],
    reward: ['journal:s2-board-2', 'journal:s2-m1-end'],
    rewardText: 'يتبع…',
    leadsTo: [],
  },
];
