/**
 * «إحنا فريق» puzzles. The walk's fork: three trails, where each goes and which dog follows it.
 * Every rule is something she saw at one of the three stops of that route (tested: one
 * solution, and dropping any stop's rule allows more). A wrong check names the first broken
 * rule, never how many cells are right; what she set survives closing (the grid's draft).
 */
const DOG = {
  id: 'dog',
  label: 'منو يلحقه؟',
  options: [
    { id: 'snooki', label: 'سنوكي' },
    { id: 'husky', label: 'الهاسكي' },
    { id: 'none', label: 'محد' },
  ],
};

export const PUZZLES_TEAM = {
  /* ── «تمرين سوا»: Anji's warm-up order, then her rep ladder (she changes a rule mid-way) ── */
  'tu-warmup': {
    type: 'sequence',
    title: 'إحماء أنجي',
    goal: 'رتّبي الإحماء مثل ما كتبت أنجي على السبورة.',
    intro: 'أنجي: «القاعدة على السبورة، والأوزان على كل محطة. يلا يا كابتن.»',
    config: {
      items: [
        { id: 'rope', label: 'الحبل' },
        { id: 'pushups', label: 'الضغط' },
        { id: 'squats', label: 'السكوات' },
        { id: 'plank', label: 'البلانك' },
      ],
      answer: ['squats', 'plank', 'rope', 'pushups'],
    },
    hints: [
      'أول شي الأوزان: كل محطة عليها كم دمبل. بعدين القاعدة الثانية بالسبورة لمن يتساوى وزنين.',
      'السكوات أخف شي، والضغط أثقل شي. الحبل والبلانك متساويين… وريان يكره واحد منهم.',
      'السكوات، البلانك، الحبل، الضغط.',
    ],
    wrong: ['أنجي تصفّر: «مو هيچ الترتيب. ارجع للسبورة.»'],
    success: 'إحماء مثالي! حتى سنوكي سوّى سكوات… واحد.',
    reward: ['flag:tu-train-warmup', 'journal:tu-train-warmup'],
  },
  'tu-ladder': {
    type: 'series',
    title: 'سلّم العدّات',
    goal: 'كل جولة بعدد عدّات. لگي العدد الجاي.',
    intro: 'أنجي: «سلّم العدّات. انتبه للسبورة… آني أحب أغيّر القواعد.»',
    config: {
      labels: { examples: 'جولات سابقة على السبورة:', question: 'وهاي الجولة الجاية:' },
      stages: [
        { examples: [[10, 8, 6, 4], [14, 12, 10, 8]], question: [12, 10, 8, null], options: [4, 6, 7], answer: 6, rule: 'عدّات أنجي: كل جولة تنقص ٢' },
        { examples: [[5, 10, 15, 20], [3, 6, 9, 12]], question: [4, 8, 12, null], options: [14, 16, 20], answer: 16, rule: 'عدّات ريان: كل جولة تزيد بقدر الجولة الأولى' },
        {
          note: '🔔 أنجي صفّرت: «قاعدة جديدة! هالمرة كل جولة ضعف اللي قبلها، ناقص واحد.»',
          examples: [[2, 3, 5, 9], [3, 5, 9, 17]],
          question: [4, 7, 13, null],
          options: [19, 25, 26],
          answer: 25,
          rule: 'قاعدة أنجي الجديدة: الضعف ناقص واحد',
        },
      ],
    },
    hints: [
      'قارني كل رقم باللي قبله. وبالجولة الأخيرة اقري التنبيه فوگ: القاعدة تغيّرت.',
      'الأخيرة: ٤ ← ٧ (٤×٢−١) ← ١٣ (٧×٢−١)…',
      'أنجي: ٦. ريان: ١٦. الجولة الأخيرة: ٢٥.',
    ],
    wrong: ['أنجي: «لا لا. شوف السبورة مرة ثانية.»'],
    success: 'خلص السلّم! ريان لاحظ القاعدة الجديدة… بعد ما أنجي صفّرت مرتين.',
    reward: ['flag:tu-train-ladder', 'journal:tu-train-ladder'],
  },

  'tu-trail-river': {
    type: 'logicgrid',
    title: 'مفترق النهر',
    goal: 'ثلاث آثار تطلع من المفترق. كل واحد لوين يوصل، ومنو من الكلبين يلحقه؟',
    intro: 'أنجي: «ثلاث آثار، وحدة بس توصل لسلتي. القواعد كلها شفتيها بالطريق.»',
    config: {
      rows: [
        { id: 'rock', label: 'عند الصخرة', icon: 'moon-full' },
        { id: 'fence', label: 'عند السياج', icon: 'leaf' },
        { id: 'bridge', label: 'عند الجسر', icon: 'drop' },
      ],
      cols: [
        { id: 'to', label: 'يوصل لـ', options: [{ id: 'basket', label: 'السلة' }, { id: 'tree', label: 'شجرة السنجاب' }, { id: 'pond', label: 'البركة' }] },
        DOG,
      ],
      clues: [
        { text: 'كل أثر يوصل لمكان غير.', rule: { distinct: 'to' } },
        { text: 'كل كلب يلحق أثر واحد، وأثر واحد محد يلحقه.', rule: { distinct: 'dog' } },
        { text: 'سنوكي ما يلحق إلا ريحة أكل.', rule: { pair: ['dog', 'snooki', 'to', 'basket'] } },
        { text: 'الهاسكي تلحق اللي يتحرك.', rule: { pair: ['dog', 'husky', 'to', 'tree'] } },
        { text: 'أثر السلة ما يبدأ عند الجسر.', rule: { notIn: ['bridge', 'to', ['basket']] } },
        { text: 'آثار الصخرة مبلولة: جاية من الماي.', rule: { is: ['rock', 'to', 'pond'] } },
      ],
    },
    hints: [
      'ابدي بالقاعدة اللي تثبّت خانة وحدة، وبعدين القواعد اللي تربط كلب بمكان.',
      'الصخرة للبركة. يعني السلة إما عند السياج أو عند الجسر… وأنجي گالت مو الجسر.',
      'الصخرة: البركة، محد. السياج: السلة، سنوكي. الجسر: شجرة السنجاب، الهاسكي.',
    ],
    wrong: [],
    success: 'هذا هو! أثر السياج… وسنوكي سبق الكل.',
    reward: ['flag:tu-trail-river', 'journal:tu-trail-river'],
  },
  'tu-trail-orchard': {
    type: 'logicgrid',
    title: 'مفترق البستان',
    goal: 'ثلاث آثار تطلع من المفترق. كل واحد لوين يوصل، ومنو من الكلبين يلحقه؟',
    intro: 'أنجي: «هالمرة صعبتها شوية. بس كل شي تحتاجه شفته بالطريق.»',
    config: {
      rows: [
        { id: 'gate', label: 'عند البوابة', icon: 'key' },
        { id: 'well', label: 'عند البير', icon: 'drop' },
        { id: 'apple', label: 'تحت التفاحة', icon: 'apple' },
      ],
      cols: [
        { id: 'to', label: 'يوصل لـ', options: [{ id: 'basket', label: 'السلة' }, { id: 'nest', label: 'عش الطيور' }, { id: 'stream', label: 'الساقية' }] },
        DOG,
      ],
      clues: [
        { text: 'كل أثر يوصل لمكان غير.', rule: { distinct: 'to' } },
        { text: 'كل كلب يلحق أثر واحد، وأثر واحد محد يلحقه.', rule: { distinct: 'dog' } },
        { text: 'سنوكي ما يلحق إلا ريحة أكل.', rule: { pair: ['dog', 'snooki', 'to', 'basket'] } },
        { text: 'الهاسكي تلحق اللي يطير.', rule: { pair: ['dog', 'husky', 'to', 'nest'] } },
        { text: 'البوابة بعيدة عن الساقية.', rule: { notIn: ['gate', 'to', ['stream']] } },
        { text: 'سنوكي ما يقرب البوابة: ريحة الصابون تخوفه.', rule: { notIn: ['gate', 'dog', ['snooki']] } },
        { text: 'سنوكي شم البير وعطس ورجع.', rule: { notIn: ['well', 'dog', ['snooki']] } },
      ],
    },
    hints: [
      'شوفي شنو ما يگدر يكون عند البوابة، بعدين عند البير.',
      'البوابة: لا ساقية ولا سنوكي (يعني لا سلة). يعني عش الطيور، والهاسكي.',
      'البوابة: العش، الهاسكي. البير: الساقية، محد. التفاحة: السلة، سنوكي.',
    ],
    wrong: [],
    success: 'تحت التفاحة! وسنوكي، طبعاً، وصل قبلنا.',
    reward: ['flag:tu-trail-orchard', 'journal:tu-trail-orchard'],
  },
};
