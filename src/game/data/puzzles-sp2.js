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
      'اقرئي وصف كل مكان على بطاقته. أي مكان ما يشوف السما؟ وأي مكان بيه ماي؟',
      'خذي العلامات وحدة وحدة واشطبي اللي ما ينطبق. اللي يبقى بعد الثلاث هو الجواب — والدليل هو العلامات الثلاث، مو أقل.',
    ],
    // Phase 04: a wrong try says only that it does not fit (the hints are asked for, not pushed)
    wrong: ['السجل ما تحرك. هالمكان ويّا هالأدلة ما يركبون.'],
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
      'اسألي: أي باب يجي أول بطريقچ للنجمة؟ مفتاحه لازم يكون وياچ قبل ما توصلين له. خططي الطريق كله على الشبكة قبل ما تحطين أول أمر.',
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
      'بالأخير احسبي شنو صار بين كل خانتين: مرة جمع ومرة ضرب. أي عملية يجي دورها بعد آخر خانة؟',
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
      'ابدي بالرسالة اللي ما تذكر ولا حدث قبلها، وبعدين دوّري الرسالة اللي تذكر حدثها — وكمّلي السلسلة.',
    ],
    wrong: ['الرسائل ما تركب بهالترتيب.'],
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
      'لكل جملة دوّري السطر اللي يگولها بالرسائل. إذا ما لگيتي سطر، فهي استنتاج — حتى لو تبين صحيحة.',
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
    hints: ['كل علامة شرط. المكان الصح يحقق الثلاث.', 'اشطبي كل مكان ينقصه شرط واحد على الأقل.', 'العلامة الأخيرة أندر شرط بالثلاث. ابدي بيها.'],
    wrong: [],
    success: 'البحيرة القمرية! {husky} نبحت نبحة فخورة. ✨',
    reward: ['flag:sp2-trail-done', 'got:keepsake.roseclinic.3'],
  },
  // Phase 03 — «خريطة الغد» (final preparation). The three inscriptions are the examples:
  // corridor → level 1, lake → level 2, observatory → level 3. Each level has one answer.
  'sp2-final-rule': {
    type: 'series',
    title: 'قاعدة النقوش',
    goal: 'النقوش الثلاثة تتبع قواعد. لگي كل قاعدة وكمّلي السطر.',
    intro: 'نفس النقوش اللي لگيتيها، منسوخة على الخريطة. القاعدة مو مكتوبة — لازم تطلع من الأمثلة.',
    config: {
      stages: [
        { examples: [[1, 1, 2, 3, 5], [2, 2, 4, 6, 10]], question: [3, 3, 6, 9, null], options: [12, 15, 18], answer: 15, rule: 'كل خانة مجموع الخانتين اللي قبلها' },
        { examples: [[1, 10, 2, 20, 3, 30], [5, 7, 6, 14, 7, 21]], question: [4, 9, 5, 18, 6, null], options: [24, 27, 36], answer: 27, rule: 'سطرين متداخلين: واحد يزيد ١، والثاني يزيد بقدر أول قيمة بيه' },
        {
          examples: [['sym:moon-new', 'sym:moon-half', 'sym:moon-new', 'sym:moon-half'], ['sym:moon-crescent', 'sym:moon-full', 'sym:moon-crescent', 'sym:moon-full']],
          question: ['sym:moon-half', 'sym:moon-new', 'sym:moon-half', null],
          options: ['sym:moon-crescent', 'sym:moon-new', 'sym:moon-full'],
          answer: 'sym:moon-new',
          rule: 'القمر يقفز طورين كل مرة ويرجع',
        },
      ],
    },
    hints: [
      'لا تقارنين كل خانة بالي بعدها بس — جربي تقارنينها بالخانتين اللي قبلها.',
      'بالنقش الثاني أكو سطرين داخلين ببعض: الخانات الفردية سطر، والزوجية سطر.',
      'بالقمر: كم طور يقفز بين كل رسمة واللي بعدها؟ عدّي الأطوار.',
    ],
    wrong: ['النقوش ما ضوت. القاعدة لازم تنطبق على المثالين.'],
    success: 'النقوش الثلاثة ضوت. ✨ — كل قاعدة چانت مخبّية بالأمثلة: مجموع، سطرين متداخلين، وقفزة طورين.',
    reward: ['flag:sp2-final-rule', 'journal:sp2-final-rule'],
  },

  // Phase 03 — «الطريق الأخير»: the maze rules (keys before their doors), longer and tighter.
  'sp2-final-route': {
    type: 'program',
    title: 'الطريق الأخير',
    goal: 'وصّلي سنوكي للنجمة ⭐ على الخريطة المخيّطة.',
    intro: 'نفس قواعد المتاهة المتغيرة. بس الطريق أطول، والأوامر قليلة: أي لفّة زايدة تخرّب الخطة. المستوى اللي توصلين له ينحفظ.',
    config: {
      look: { actor: '🐾', goal: '⭐', wall: '🌿', label: 'الخريطة: سنوكي 🐾، النجمة ⭐، المفاتيح 🗝️🔑، الأبواب 🚪' },
      messages: {
        crash: 'دگ بالسياج! شيلي الأمر الغلط وجرّبي.',
        short: 'وگف قبل النجمة. الخطة تحتاج أوامر أكثر (أو غير).',
        door: 'الباب مقفول. مفتاحه بعده بالأرض.',
        next: 'الخريطة انطوت على صفحة جديدة: المستوى {n} من {of}.',
      },
      stages: [
        { grid: ['...KB', '.#.##', '.###.', 'k....'], start: { x: 0, y: 0, dir: 0 }, max: 16 },
        { grid: ['....#B', '.##.#K', '.#....', '.#.###', 'q..Qk.'], start: { x: 0, y: 0, dir: 1 }, max: 25 },
      ],
    },
    hints: [
      'قبل أي أمر: شوفي أي باب يحرس النجمة، ووين مفتاحه.',
      'بالمستوى الثاني المفتاح الذهبي ورا باب ثاني. يعني أكو مفتاح لازم تاخذينه قبل المفتاح.',
      'ارسمي الطريق كله على الشبكة: المفتاح الأول، بعده بابه، بعده المفتاح الثاني، وآخر شي الباب اللي جنب النجمة.',
    ],
    wrong: [],
    success: 'وصل! ✨ — الطريق الأخير چان كل اللي تعلمتيه سوا: تخطيط، مفاتيح قبل الأبواب، وأقل عدد خطوات.',
    reward: ['flag:sp2-final-done'],
  },

  // Phase 03 (optional) — the expert route: two keys in the right order, almost no spare moves.
  'sp2-maze-expert': {
    type: 'program',
    title: 'مسار الخبراء',
    goal: 'وصّلي سنوكي للنجمة ⭐ بأقل عدد أوامر.',
    intro: 'اختياري وصعب: مفتاحين، بابين، وأوامر بالكاد تكفي. كل شي يعتمد على الترتيب.',
    config: {
      look: { actor: '🐾', goal: '⭐', wall: '📚', label: 'المتاهة: سنوكي 🐾، النجمة ⭐، المفاتيح 🗝️🔑، الأبواب 🚪' },
      messages: {
        crash: 'دگ بالرف! جربي من جديد.',
        short: 'وگف قبل النجمة.',
        door: 'الباب مقفول. مفتاحه وين؟',
        next: 'المستوى {n} من {of}.',
      },
      stages: [{ grid: ['BK...#q', '##.#...', 'k.Q#.#.', '##.#.#.', '.......'], start: { x: 3, y: 4, dir: 3 }, max: 38 }],
    },
    hints: [
      'المفتاح الذهبي محبوس ورا باب. فكري: أي مفتاح لازم يجي أول؟',
      'المفتاح الثاني بأبعد زاوية. الطريق له من الجهة اليمنى.',
      'قسّمي الطريق لثلاث رحلات: للمفتاح الأول، للمفتاح الثاني، وللنجمة. وعدّي أوامر كل رحلة.',
    ],
    wrong: [],
    success: 'مسار الخبراء انحل! ✨ — ترتيب المفاتيح چان هو اللغز كله.',
    reward: ['flag:sp2-expert-done'],
  },
  // Phase 03b — «الافتراض الغلط». (1) The coded line: heart = ي and moon = ن are known from
  // the star cipher (Act V); the sun and the key glyphs come from the sentence's meaning.
  'sp2-coded': {
    type: 'cipher',
    title: 'السطر المكتوب بالرموز',
    goal: 'فكّي الكلمة الأخيرة من السطر.',
    intro: 'ورا المخطط، بخط ريان: «البوابة ما تنفتح بموعد… تنفتح ـــــ.» والكلمة الناقصة مكتوبة برموز. رمزين تعرفينهم من شفرة النجوم؛ الباقي يطلع من معنى الجملة.',
    config: {
      word: ['ب', 'ي', 'د', 'ي', 'ن'],
      glyphs: ['sym:sun', 'sym:heart', 'sym:key', 'sym:heart', 'sym:moon-crescent'],
      key: [['sym:heart', 'ي'], ['sym:moon-crescent', 'ن']],
      letters: ['ب', 'د', 'ت', 'ر', 'م', 'ل'],
    },
    hints: [
      'حطي الرموز المعروفة أول. شوفي شكل الكلمة: ؟ي؟ين.',
      'الجملة تقارن: مو «بموعد»… لكن بـ شنو؟ فكري بشي ينفتح بيه الباب.',
      'الرمز الأول حرف صغير يجي بأول الكلمة بمعنى «بواسطة». بعدين اختاري الحرف اللي يكمّل كلمة تعرفينها.',
    ],
    wrong: ['الرموز ما تحركت. الكلمة لازم تكمّل معنى الجملة.'],
    success: '«بيدين». ✨ — الرمزين المعروفين حطّوا شكل الكلمة، ومعنى الجملة كمّل الباقي.',
    reward: ['flag:sp2-coded-done', 'journal:sp2-coded'],
  },

  // (2) Which conclusion from the letters does the line prove wrong? Facts were written; only
  // one inference is contradicted ("not by an appointment").
  'sp2-assumption': {
    type: 'choice',
    title: 'الافتراض الغلط',
    goal: 'أي جملة من استنتاجاتچ يكذّبها السطر الجديد؟',
    intro: 'السطر يگول: «البوابة ما تنفتح بموعد… تنفتح بيدين.» قارنيه بالجمل اللي صنّفتيها بالرسائل.',
    config: {
      question: 'وحدة بس طلعت غلط:',
      answer: 'i-day',
      options: [
        { id: 'f-before', label: 'الوردة انزرعت قبل ما تنركب العدسة.', icon: 'rose', reply: 'هذا مكتوب بالرسائل، والسطر ما يحچي عنه.' },
        { id: 'i-tomorrow', label: 'ريان چان يخطط لشي يخص الغد.', icon: 'heart', reply: 'السطر ما ينفي هذا… يمكن بعده صح.' },
        { id: 'f-plan', label: 'رسم البوابة بدأ بعد ما انكتب الاسم بالنجوم.', icon: 'key', reply: 'مكتوب بالرسائل، والسطر ما يحچي عن الوقت.' },
        { id: 'i-day', label: 'البوابة راح تنفتح بيوم مهم.', icon: 'sun' },
      ],
    },
    hints: ['الجمل المكتوبة بالرسائل ما تغيّرت. دوّري بين الاستنتاجات.', 'السطر يذكر شي البوابة «ما» تنفتح بيه.', 'السطر يذكر كلمة وحدة بس عن البوابة نفسها. خذيها، ومرّي على كل استنتاج: منو يعتمد عليها؟'],
    wrong: [],
    success: 'هذا هو. ✨ — «يوم مهم» چان استنتاج، والسطر الجديد كذّبه: البوابة ما تنتظر يوم، تنتظر إيدين. لهذا نميّز المكتوب عن المستنتج.',
    reward: ['flag:sp2-assumption-done', 'journal:sp2-assumption'],
  },

  // (3) «بيدين»: four locks, each needs what only one of them can do.
  'sp2-two-hands': {
    type: 'arrange',
    title: 'بيدين',
    goal: 'وزّعي الأقفال الأربعة: كل قفل على اللي يگدر يفتحه.',
    intro: 'أربع أقفال حول المخطط. أنجي تقرى وتوصل للعالي؛ سنوكي يشم ويدخل الأماكن الضيقة. محد يگدر يسويها كلها وحده.',
    config: {
      slots: [
        { id: 'high', label: 'قفل فوق الرف العالي', accepts: ['anji1', 'anji2'] },
        { id: 'gap', label: 'فتحة واطية بقد كف صغير', accepts: ['snooki1', 'snooki2'] },
        { id: 'words', label: 'قفل يفتح بكلمة لازم تنقرى', accepts: ['anji1', 'anji2'] },
        { id: 'scent', label: 'مقبض يتعرف على ريحة البسكويت', accepts: ['snooki1', 'snooki2'] },
      ],
      pieces: [
        { id: 'anji1', label: 'أنجي', icon: 'heart' },
        { id: 'snooki1', label: 'سنوكي', icon: 'paw' },
        { id: 'anji2', label: 'أنجي', icon: 'heart' },
        { id: 'snooki2', label: 'سنوكي', icon: 'paw' },
      ],
      checkLabel: 'نفتحها سوا ✓',
    },
    hints: ['اقرئي كل قفل: شنو يحتاج؟ طول، قراية، حجم صغير، لو أنف؟', 'سنوكي ما يقرا (يگول يقرا، بس لا).', 'كل واحد منكم يفتح قفلين.'],
    wrong: ['قفل واحد على الأقل ما انفتح.'],
    success: 'انفتحت الأقفال الأربعة! ✨ — «بيدين» ما چانت يدين وحدة. چانت أنجي وسنوكي سوا.',
    reward: ['flag:sp2-twist-done'],
  },
};
