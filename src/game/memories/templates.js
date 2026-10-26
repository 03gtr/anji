/**
 * Memory content that ships with the game.
 *
 * STORY_MEMORIES are fictional, in-story memories: moments the player has
 * lived through in this game, re-told from Ryan's side while he built the
 * garden. They are clearly part of the fiction and are used whenever no
 * personal memories are configured.
 *
 * PERSONAL_TEMPLATES are neutral, disabled examples showing the format for
 * the owner's real memories. They contain no real events. Real memories
 * must NOT be written here (this repository is public) — see
 * docs/MEMORIES.md for the private, local way to add them.
 */
export const STORY_MEMORIES = [
  {
    id: 'story-moon-roses',
    art: 'story-3-map',
    title: 'ليلة ورود القمر',
    category: 'story',
    kind: 'fictional',
    enabled: true,
    scene: 'ريان گاعد بالحديقة بالليل، يزرع أربع ورود بيضة ويكتب على النافورة بإيد ترجف: «من الظلام إلى النور الكامل». سنوكي نايم على رجله.',
    puzzle: 'order',
    question: 'رتّبي أطوار القمر مثل ما فتّحت الورود.',
    options: [
      { id: 'full', label: 'بدر', icon: 'moon-full' },
      { id: 'new', label: 'قمر مظلم', icon: 'moon-new' },
      { id: 'half', label: 'نص قمر', icon: 'moon-half' },
      { id: 'crescent', label: 'هلال', icon: 'moon-crescent' },
    ],
    answer: ['new', 'crescent', 'half', 'full'],
    dialogue: [{ s: 'snooki', e: 'proud', t: 'آني چنت نايم بالذكرى. بس نايم بأهمية.' }],
  },
  {
    id: 'story-blue',
    art: 'world-1-garden',
    title: 'اللون',
    category: 'story',
    kind: 'fictional',
    enabled: true,
    scene: 'ريان يصبغ البوابة ويجرب ألوان: أحمر، ذهبي، أبيض… وبالآخر يرمي كل العلب ويگول لسنوكي: «هي تحب هذا. أعرف.»',
    puzzle: 'choice',
    question: 'شنو اللون اللي اختاره بالآخر؟',
    options: [
      { id: 'red', label: 'أحمر', icon: 'rose-red' },
      { id: 'blue', label: 'أزرق', icon: 'rose' },
      { id: 'gold', label: 'ذهبي', icon: 'rose-gold' },
    ],
    answer: 'blue',
    dialogue: [{ s: 'anji', e: 'soft', t: '«هي تحب هذا. أعرف.» … چان يعرف.' }],
  },
  {
    id: 'story-clock',
    art: 'story-4-clues',
    title: 'الساعة اللي وقفت',
    category: 'story',
    kind: 'fictional',
    enabled: true,
    scene: 'ريان يوقف ساعة الممر بيده، ويگول: «خلّي هالوقت يبقى. هذا الوقت اللي قررت بيه أبني كل شي.»',
    puzzle: 'choice',
    question: 'على أي وقت وقّف الساعة؟',
    options: [
      { id: 't1', label: '٦:٣٠' },
      { id: 't2', label: '٧:١٤' },
      { id: 't3', label: '٩:٠٠' },
      { id: 't4', label: '١٢:٠٠' },
    ],
    answer: 't2',
  },
  {
    id: 'story-car',
    art: 'world-2-road',
    title: 'حادثة الإطار',
    category: 'funny',
    kind: 'fictional',
    enabled: true,
    scene: 'أول يوم وصلت السيارة الزرقاء للكراج. سنوكي ينبح على الإطار ساعة كاملة، وبعدين يعضّه. ريان يضحك لحد ما يگعد على القاع.',
    puzzle: 'choice',
    question: 'شنو اسم السيارة؟',
    options: [
      { id: 'a', label: 'زفيرو', icon: 'car' },
      { id: 'b', label: 'لونا', icon: 'car' },
      { id: 'c', label: 'روزا', icon: 'car' },
    ],
    answer: 'a',
    dialogue: [{ s: 'snooki', e: 'dramatic', t: 'التاير بدا. للتوثيق.' }],
  },
  {
    id: 'story-case',
    art: 'world-4-academy',
    title: 'التعليمات',
    category: 'funny',
    kind: 'fictional',
    enabled: true,
    scene: 'ريان يكتب ورقة لسنوكي ويقراها بصوت عالي مرتين، لأن سنوكي «ما يقرأ». سنوكي يهز راسه بكل جدية… ويضيّعها خلال دقيقة.',
    puzzle: 'choice',
    question: 'منو خبّى قطعة الخريطة الثانية؟',
    options: [
      { id: 'sultan', label: 'السلطان', icon: 'feather' },
      { id: 'snooki', label: 'سنوكي', icon: 'paw' },
      { id: 'squirrels', label: 'السناجب', icon: 'claw' },
    ],
    answer: 'snooki',
  },
  {
    id: 'story-stars',
    art: 'world-8-ending',
    title: 'ليلة المرصد',
    category: 'story',
    kind: 'fictional',
    enabled: true,
    scene: 'ريان بالمرصد طول الليل، يحرك النجوم المرسومة وحدة وحدة لحد ما تكتب اسم. دكتور هوت يتذمّر بس ما يروح ينام.',
    puzzle: 'choice',
    question: 'شنو الاسم اللي كتبه بالنجوم؟',
    options: [
      { id: 'a', label: 'أنجي', icon: 'heart' },
      { id: 'b', label: 'سنوكي', icon: 'paw' },
      { id: 'c', label: 'زفيرو', icon: 'car' },
    ],
    answer: 'a',
    dialogue: [{ s: 'anji', e: 'soft', t: 'طول الليل… عشان اسم.' }],
  },
];

/** Disabled, neutral examples of the personal-memory format (no real content). */
export const PERSONAL_TEMPLATES = [
  {
    id: 'example-choice',
    title: 'عنوان الذكرى',
    category: 'everyday',
    kind: 'personal',
    enabled: false,
    dateLabel: 'موسم / سنة (اختياري)',
    scene: 'وصف قصير للمشهد كما تحب تحكيه.',
    puzzle: 'choice',
    question: 'سؤال جوابه بالمشهد أو تعرفه هي.',
    options: [
      { id: 'a', label: 'الخيار الأول' },
      { id: 'b', label: 'الخيار الثاني' },
      { id: 'c', label: 'الخيار الثالث' },
    ],
    answer: 'b',
    hints: ['تلميح لطيف أول', 'تلميح أوضح'],
    dialogue: [{ s: 'anji', e: 'soft', t: 'سطر بعد ما تحل الذكرى (اختياري).' }],
  },
  {
    id: 'example-order',
    title: 'ترتيب أحداث',
    category: 'funny',
    kind: 'personal',
    enabled: false,
    scene: 'مشهد فيه عدة لحظات بالترتيب.',
    puzzle: 'order',
    question: 'رتّبي اللحظات مثل ما صارت.',
    options: [
      { id: 'one', label: 'اللحظة الأولى' },
      { id: 'two', label: 'اللحظة الثانية' },
      { id: 'three', label: 'اللحظة الثالثة' },
    ],
    answer: ['one', 'two', 'three'],
  },
];
