/**
 * Story Pack 02 puzzles. Every answer comes from what she can find or see in the
 * game; hints go general → which clue matters → nearly the answer; nothing
 * depends on luck or timing. Multi-stage ones resume at the stage reached.
 */
export const PUZZLES_SP2 = {
  // Mission 1 — evidence-based deduction. The three clues are in the house,
  // the academy and the sanctuary; each rules out one place; only all three
  // together leave a single answer (tested).
  'sp2-ledger': {
    type: 'deduction',
    title: 'سجل الأرشيف',
    goal: 'اختاري وين مخبّى المفتاح الثاني، والعلامات الثلاث اللي تثبت.',
    intro: 'السجل يگول: المفتاح بواحد من أربع أماكن. اختاري المكان، وبعدين العلامات اللي تثبته. انتبهي: مو كل ورقة دليل.',
    config: {
      need: 3,
      labels: { who: 'وين؟', submit: 'هذا المكان 🗝️' },
      suspects: [
        { id: 'lake', label: 'البحيرة القمرية', icon: 'moon-full', note: 'ماي، وقمر، وقارب' },
        { id: 'garage', label: 'الكراج', icon: 'car', note: 'سقف حديد، بلا شبابيك' },
        { id: 'observatory', label: 'المرصد', icon: 'star', note: 'قبة تنفتح على السما' },
        { id: 'conservatory', label: 'البيت الزجاجي', icon: 'rose-white', note: 'سقف زجاج، ورد بكل مكان' },
      ],
      evidence: [
        { id: 'water', label: 'علامة البيت', icon: 'drop', note: '«مو قرب الماي.»' },
        { id: 'sky', label: 'علامة الأكاديمية', icon: 'star', note: '«بمكان يشوف السما.»' },
        { id: 'roses', label: 'علامة المحمية', icon: 'leaf', note: '«ما بيه ولا وردة.»' },
        { id: 'ribbon', label: 'هامش السجل', icon: 'note', note: '«المفتاح مربوط بشريط أزرق.»' },
        { id: 'opinion', label: 'رأي سنوكي', icon: 'paw', note: '«أكيد بالكراج. حاسّته.»' },
      ],
      answer: { suspect: 'observatory', evidence: ['water', 'sky', 'roses'] },
    },
    hints: [
      'كل علامة من العلامات الثلاث تشطب مكان واحد بس. الشريط ورأي سنوكي ما يشطبون شي.',
      '«مو قرب الماي» تشطب البحيرة. «يشوف السما» تشطب الكراج. بقى مكانين.',
      '«ما بيه ولا وردة» تشطب البيت الزجاجي. الجواب: المرصد، بالعلامات الثلاث.',
    ],
    wrong: ['السجل ما تحرك. راجعي: كل علامة لازم تنطبق على المكان.', 'رأي سنوكي مو دليل… حتى لو هو واثق.'],
    success: 'المرصد. ✨ — العلامات الثلاث سوا تخلّي مكان واحد بس. هذا هو الاستنتاج: مو تخمين، شطب الاحتمالات وحدة وحدة.',
    reward: ['flag:sp2-deduced'],
  },

  // Mission 2 — plan a route with keys (🗝️ / 🔑) and their doors (🚪). Steps are counted.
  'sp2-shifting-maze': {
    type: 'program',
    title: 'المتاهة المتغيرة',
    goal: 'رتّبي أوامر توصل سنوكي للنجمة ⭐ — كل باب يحتاج مفتاحه.',
    intro: '«⬆ قدّام» خطوة وحدة، «↶/↷» لفّة بمكانه. المفتاح ينشال لمن يمشي عليه، والباب ينفتح بس إذا مفتاحه وياه. عدد الأوامر محدود، فخططي قبل «شغّلي». الغلط ما يمسح شي: جربي من جديد.',
    config: {
      look: { actor: '🐾', goal: '⭐', wall: '📚', label: 'المتاهة: سنوكي 🐾، النجمة ⭐، المفاتيح 🗝️🔑، الأبواب 🚪' },
      messages: {
        crash: 'دگ بالرف! شيلي الأمر الغلط وجرّبي.',
        short: 'وگف قبل النجمة. يحتاج أوامر أكثر (أو غير).',
        door: 'الباب مقفول. مفتاحه بعده بالأرض — مرّي عليه أول.',
        next: 'الأرضية تحركت! المستوى {n} من {of}.',
      },
      stages: [
        { grid: ['.kK.B'], start: { x: 0, y: 0, dir: 0 }, max: 6 },
        { grid: ['.##B', '.#.K', 'k...'], start: { x: 0, y: 0, dir: 1 }, max: 10 },
        { grid: ['..##B', 'k.#.K', '.qQ..', '.#...'], start: { x: 1, y: 0, dir: 1 }, max: 14 },
      ],
    },
    hints: [
      'قبل ما تحطين الأوامر، تتبّعي الطريق بإصبعچ: وين المفتاح، ووين بابه؟',
      'بالمستوى الأخير أكو مفتاحين: الذهبي 🗝️ يفتح الباب اللي جنب النجمة، والثاني 🔑 يفتح الباب اللي بالنص. الاثنين بالجهة اليسرى.',
      'المستوى الأخير: خطوة لتحت، لفّة يمين وخطوة للمفتاح الذهبي، لفّة يسار وخطوة لتحت، لفّة يسار وخطوة للمفتاح الثاني، اعبري الباب اللي بالنص وكمّلي ليمين لآخر الصف، وبعدين لفّة يسار وصعود للنجمة.',
    ],
    wrong: [],
    success: 'وصل! ✨ — الطريق الأقصر مو دايماً الأول: أحياناً لازم تروحين للمفتاح قبل الباب. هذا التخطيط.',
    reward: ['flag:sp2-maze-done'],
  },

  // Mission 3 (optional) — infer a hidden rule from examples; the last level alternates two rules.
  'sp2-sequence': {
    type: 'series',
    title: 'آلة التسلسل',
    goal: 'شوفي الأمثلة، لگي القاعدة، واختاري اللي يجي بعدين.',
    intro: 'الآلة ما تحچي. بس كل مرة تشغّلها تطلع أمثلة بنفس القاعدة. باوعي شنو يتغير من خانة للي بعدها.',
    config: {
      stages: [
        { examples: [[1, 4, 7, 10], [5, 8, 11, 14]], question: [2, 5, 8, null], options: [10, 11, 12], answer: 11, rule: 'كل خانة تزيد ٣' },
        { examples: [[1, 2, 4, 8], [3, 6, 12, 24]], question: [5, 10, 20, null], options: [25, 30, 40], answer: 40, rule: 'كل خانة ضعف اللي قبلها' },
        {
          examples: [['sym:moon-new', 'sym:moon-crescent', 'sym:moon-half', 'sym:moon-full'], ['sym:moon-crescent', 'sym:moon-half', 'sym:moon-full', 'sym:moon-new']],
          question: ['sym:moon-half', 'sym:moon-full', 'sym:moon-new', null],
          options: ['sym:moon-crescent', 'sym:moon-half', 'sym:moon-full'],
          answer: 'sym:moon-crescent',
          rule: 'القمر يكمل دورته ويرجع من جديد',
        },
        { examples: [[1, 3, 6, 8, 16], [2, 4, 8, 10, 20]], question: [3, 5, 10, 12, null], options: [14, 22, 24], answer: 24, rule: '+٢ بعدين ×٢، بالتناوب' },
      ],
    },
    hints: [
      'قارني كل خانة بالي بعدها بالأمثلة. القاعدة نفسها بالسطرين.',
      'بالمستوى الأخير القاعدة مو وحدة: خطوة تزيد، وخطوة تضرب.',
      'الأخير: ٣ +٢ = ٥، ×٢ = ١٠، +٢ = ١٢، ×٢ = ٢٤.',
    ],
    wrong: ['الآلة صفّرت. القاعدة ما تنطبق على الأمثلة.'],
    success: 'الآلة اشتغلت! ✨ — كل قاعدة طلعت من الأمثلة، مو من التخمين. والأخيرة چانت قاعدتين يتناوبن.',
    reward: ['flag:sp2-sequence-done'],
  },

  // Mission 4a — chronological order. Each letter mentions what happened in the one before it.
  'sp2-letters-order': {
    type: 'arrange',
    title: 'ترتيب الرسائل',
    goal: 'رتّبي الرسائل الأربع من الأقدم للأحدث.',
    intro: 'ماكو تواريخ. بس كل رسالة تذكر شي صار قبلها. اقرئيها كلها أول.',
    config: {
      slots: [
        { id: 't1', label: 'الأقدم', accepts: ['seed'] },
        { id: 't2', label: '٢', accepts: ['lens'] },
        { id: 't3', label: '٣', accepts: ['stars'] },
        { id: 't4', label: 'الأحدث', accepts: ['plan'] },
      ],
      pieces: [
        { id: 'stars', label: '«بعد ما ضوّت العدسة، كتبت اسمچ بالنجوم.»', icon: 'star' },
        { id: 'plan', label: '«الاسم بالنجوم بعده يلمع… وبديت أرسم بوابة الغد.»', icon: 'key' },
        { id: 'seed', label: '«اليوم زرعت أول وردة زرقاء بالحديقة.»', icon: 'rose' },
        { id: 'lens', label: '«الوردة الزرقاء فتّحت، وركّبت أول عدسة بالمرصد.»', icon: 'moon-full' },
      ],
      checkLabel: 'هذا ترتيبها ✓',
    },
    hints: [
      'دوّري على الرسالة اللي ما تذكر ولا شي صار قبلها.',
      'الوردة ← العدسة ← النجوم ← …',
      'الأقدم: الوردة الأولى. بعدها العدسة، بعدها الاسم بالنجوم، والأحدث: رسم البوابة.',
    ],
    wrong: ['الرسائل ما تركب. شوفي كل رسالة شنو تذكر من اللي قبلها.'],
    success: 'هسه القصة واضحة. ✨ — حتى بدون تواريخ، كل رسالة چانت تأشر على اللي قبلها.',
    reward: ['flag:sp2-letters-ordered'],
  },

  // Mission 4b — evidence vs inference.
  'sp2-letters-facts': {
    type: 'arrange',
    title: 'المكتوب والمستنتج',
    goal: 'حطّي كل جملة بمكانها: مكتوب بالرسائل، لو استنتاج.',
    intro: 'بعض الجمل مكتوبة حرفياً بالرسائل. وبعضها إحنا نفكر بيها، بس محد كتبها. المحقق الزين يفرّق بينهن.',
    config: {
      slots: [
        { id: 'f1', label: 'مكتوب بالرسائل', accepts: ['f-before', 'f-plan'] },
        { id: 'f2', label: 'مكتوب بالرسائل', accepts: ['f-before', 'f-plan'] },
        { id: 'i1', label: 'استنتاج', accepts: ['i-tomorrow', 'i-day'] },
        { id: 'i2', label: 'استنتاج', accepts: ['i-tomorrow', 'i-day'] },
      ],
      pieces: [
        { id: 'f-before', label: 'الوردة انزرعت قبل ما تنركب العدسة.', icon: 'rose' },
        { id: 'i-tomorrow', label: 'ريان چان يخطط لشي يخص الغد.', icon: 'heart' },
        { id: 'f-plan', label: 'رسم البوابة بدأ بعد ما انكتب الاسم بالنجوم.', icon: 'key' },
        { id: 'i-day', label: 'البوابة راح تنفتح بيوم مهم.', icon: 'sun' },
      ],
      checkLabel: 'هذا تصنيفي ✓',
    },
    hints: [
      'اسألي لكل جملة: أگدر أأشر على السطر اللي كاتبها؟',
      'الجمل عن الترتيب (قبل/بعد) موجودة بالرسائل. الجمل عن النوايا والمستقبل… لا.',
      'المكتوب: «الوردة قبل العدسة» و«البوابة بعد الاسم». الاستنتاج: «يخطط للغد» و«يوم مهم».',
    ],
    wrong: ['مو بالضبط. وحدة على الأقل مكتوبة بالرسائل، لو بالعكس.'],
    success: 'تمام. ✨ — المكتوب نثبته بسطر. الاستنتاج ممكن يكون صح… بس يبقى استنتاج لحد ما يثبت.',
    reward: ['flag:sp2-letters-done'],
  },

  // Mission 5 (optional, needs the husky) — where does the trail lead?
  'sp2-trail': {
    type: 'choice',
    title: 'نهاية الأثر',
    goal: 'وين يروح الأثر؟',
    intro: 'ثلاث علامات جنب الكفوف: «مكان بيه ماي»، «…ويضويه القمر»، «…وبيه قارب ينتظر». {husky} تباوعلچ تنتظر.',
    config: {
      question: 'وين ينتهي الأثر؟',
      answer: 'lake',
      options: [
        { id: 'garden', label: 'نافورة الحديقة الضائعة', icon: 'rose', reply: 'بيها ماي وقمر… بس ماكو قارب.' },
        { id: 'lake', label: 'البحيرة القمرية', icon: 'moon-full' },
        { id: 'observatory', label: 'المرصد', icon: 'star', reply: 'يشوف القمر، بس ماكو ماي ولا قارب.' },
        { id: 'meadow', label: 'المرج الخلفي', icon: 'leaf', reply: 'ماكو ماي بالمرج.' },
      ],
    },
    hints: ['كل علامة شرط. المكان الصح يحقق الثلاث.', 'أي مكان بيه قارب؟', 'البحيرة القمرية: ماي، قمر، وقارب.'],
    wrong: [],
    success: 'البحيرة القمرية! {husky} نبحت نبحة فخورة. ✨',
    reward: ['flag:sp2-trail-done', 'got:keepsake.roseclinic.3'],
  },
};
