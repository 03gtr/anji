/**
 * Phase 04 «الحديقة العميقة» puzzles. Rules for every one of them:
 *  - the answer follows from evidence she can find in the game (named in each comment);
 *  - a wrong try keeps what she set and says only what is true (never "warmer", never a count);
 *  - multi-stage ones resume at the stage reached; grids and machines keep a draft;
 *  - hints are asked for (first tap asks «متأكدة؟»): nudge → which clue → nearly the answer.
 * Content tests (tests/game/deep-garden.test.js) prove each one solvable, the logic grid's
 * single solution with every clue needed, and that the budgets and gates really matter.
 */

/* ── shared evidence (journal ids; `if` = shown only once she has it) ── */
const FACT = {
  guestbook: { id: 'guestbook', label: 'دفتر زوار الورشة', icon: 'note', note: '«منذر — ١٠:٠٠ — رجّعت العدسة. البذرة تلمع، ما لمستها!»', if: 'flag:dg-guestbook' },
  log: { id: 'log', label: 'دفتر رصد منذر', icon: 'star', note: '«١٠:٠٠ نزلت للورشة. ١١:٠٠ من التلسكوب: ضوء البذرة الأزرق بعده بشباك الورشة.»', if: 'flag:dg-log' },
  bed: { id: 'bed', label: 'فراش سنوكي', icon: 'paw', note: 'بارد، وبيه تراب أحمر — نفس تراب سنادين البيت الزجاجي.', if: 'flag:dg-bed' },
  clock1: { id: 'clock1', label: 'ساعة الباب الشرقي', icon: 'feather', note: 'وگفت ٩:٣٠. على حجرها ريشة طاووس.', if: 'flag:dg-clock-1' },
  clock2: { id: 'clock2', label: 'ساعة الدرب', icon: 'sun', note: 'وگفت ١٠:٠٠. على حجرها غطا عدسة صغير.', if: 'flag:dg-clock-2' },
  clock3: { id: 'clock3', label: 'ساعة البركة', icon: 'drop', note: 'وگفت ١١:٤٠. على حجرها شعر أبيض مبلل.', if: 'flag:dg-clock-3' },
  clock4: { id: 'clock4', label: 'ساعة البيت الزجاجي', icon: 'rose-white', note: 'وگفت ١١:٥٥. على حجرها تراب أحمر.', if: 'flag:dg-clock-4' },
  trail: { id: 'trail', label: 'الأثر الحقيقي', icon: 'footprint', note: 'كفوف صغيرة مبللة من باب الورشة الخلفي للبيت الزجاجي — وما بيها أثر يطلع.', if: 'flag:dg-trails' },
  pot: { id: 'pot', label: 'السندانة المكسورة', icon: 'leaf', note: 'سندانة بالبيت الزجاجي محفورة جديد، وگاعها مكسور… وتحتها فراغ ونسمة باردة.', if: 'flag:dg-pot' },
  song: { id: 'song', label: 'تسجيل صندوق الموسيقى (اختياري)', icon: 'crown', note: '«١١:٣٥ — انفتح الباب الخلفي. خطوات صغيرة… وصوت قرمشة بسكويت.»', if: 'flag:dg-song' },
};

export const PUZZLES_DEEP = {
  /* ── A · the contradictory night ─────────────────────────────── */
  // Each witness wrote what they did. One claim per false testimony is disproved by a fact she
  // has SEEN (guest book in the workshop, Munther's log in the observatory, Snooki's bed in the
  // house); the peacock's letter is true from end to end — the obvious suspect is not the liar.
  // The white hair at the pond does not prove Snooki moved: a white husky lives in the garden too.
  'dg-testimony': {
    type: 'contradict',
    title: 'الشهادات الثلاث',
    goal: 'بكل شهادة: اختاري الجملة الغلط والدليل اللي يكذّبها — أو «كلها تركب».',
    intro: 'ثلاث رسائل عن ليلة البارحة. الشهادة ممكن تكون صادقة كلها. والدليل لازم يثبت، مو بس يخلّيچ تشكّين.',
    config: {
      evidence: [FACT.guestbook, FACT.log, FACT.bed, FACT.clock1, FACT.clock2, FACT.clock3, FACT.clock4],
      stages: [
        {
          who: 'السلطان',
          icon: 'feather',
          claims: ['وصلت الورشة تسعة ونص، والبذرة تلمع بعلبتها.', 'طلعت قبل العشرة، وما لمست شي — آني أُعجَب بس.', 'بنص الليل تقريباً، من المحمية، سمعت شي يلهث جهة البركة.'],
          answer: { claim: -1 },
          explain: 'السلطان صادق: ريشته على حجر ساعة الباب ٩:٣٠، ومنذر شاف البذرة بعده بالعلبة الساعة عشرة',
        },
        {
          who: 'العم منذر',
          icon: 'bird',
          claims: ['ما طلعت من المرصد طول الليل. أقسم بنظاراتي.', 'الساعة ١١ شفت ضوء البذرة بعده بشباك الورشة.'],
          answer: { claim: 0, evidence: ['guestbook', 'log'] },
          explain: 'منذر نزل للورشة الساعة عشرة — بخط إيده. (ليش خبّى؟ سؤال ثاني)',
        },
        {
          who: 'سنوكي',
          icon: 'paw',
          claims: ['نمت بفراشي من العشا لحد الصبح، ولا تحركت شبر.', 'البارحة ما چان بيها مطر.'],
          answer: { claim: 0, evidence: 'bed' },
          explain: 'فراش سنوكي بارد ومليان تراب البيت الزجاجي: ما نام بيه',
        },
      ],
      labels: { none: 'كل جملها تركب ويّا الأدلة', proof: 'الدليل اللي يكذّب الجملة', submit: 'هذا حكمي ⚖️' },
      messages: { wrong: 'هالدليل ما يثبت إن هالجملة غلط.', none: 'لا… وحدة من هالجمل يكذّبها دليل شفتيه.' },
    },
    hints: [
      'شهادة ممكن تكون صادقة كلها. والدليل الزين يگول شي أكيد، مو احتمال.',
      'منذر يگول ما طلع. منو كتب غير هيچ — وبخط منو؟ وسنوكي يذكر مكان معيّن: شفتيه؟',
      'منذر: الجملة الأولى، ودفتر الزوار أو دفتر رصده. سنوكي: الجملة الأولى، وفراشه. السلطان: كلها تركب. والشعر الأبيض؟ مو دليل كافي: أكو كلبة بيضاء ثانية بالحديقة.',
    ],
    wrong: [],
    success: 'الشهادات انفرزت ✨ — السلطان صادق، منذر خبّى نزلته، وسنوكي… ما نام.',
    reward: ['flag:dg-testimony', 'journal:dg-testimony'],
  },

  // The night in order: the clocks give the times, the corrected testimonies who. Two cards
  // have no evidence behind them at all (nobody saw Needle; Munther did not come back).
  'dg-order': {
    type: 'arrange',
    title: 'الليلة من أولها',
    goal: 'حطي كل شي صار بوقته. مو كل البطاقات صارت.',
    intro: 'خمس أوقات تعرفينها من الساعات ومن دفتر منذر. البطاقة اللي ما عليها دليل… تبقى برا.',
    config: {
      slots: [
        { id: 't930', label: '٩:٣٠', accepts: ['sultan'] },
        { id: 't1000', label: '١٠:٠٠', accepts: ['munther'] },
        { id: 't1100', label: '١١:٠٠', accepts: ['glow'] },
        { id: 't1140', label: '١١:٤٠', accepts: ['pond'] },
        { id: 't1155', label: '١١:٥٥', accepts: ['dig'] },
      ],
      pieces: [
        { id: 'pond', label: 'شي أبيض ومبلل يمر جنب البركة، شايل شي', icon: 'drop' },
        { id: 'needle', label: 'الممرضة إبرة تمر بالورشة', icon: 'stethoscope' },
        { id: 'munther', label: 'منذر يرجّع العدسة، والبذرة بعلبتها', icon: 'bird' },
        { id: 'dig', label: 'أحد يحفر بسندانة بالبيت الزجاجي', icon: 'rose-white' },
        { id: 'sultan', label: 'السلطان يتفرج على البذرة', icon: 'feather' },
        { id: 'back', label: 'منذر يرجع للورشة مرة ثانية', icon: 'star' },
        { id: 'glow', label: 'ضوء البذرة بعده بشباك الورشة', icon: 'moon-full' },
      ],
    },
    hints: [
      'كل وقت إله دليل: ساعة وگفت، أو سطر بدفتر. ابدي بالأوقات الأكيدة.',
      'الساعات الأربع تعطي ٩:٣٠ و١٠:٠٠ و١١:٤٠ و١١:٥٥. الساعة ١١ من دفتر رصد منذر.',
      'إبرة ورجعة منذر الثانية ما عليها ولا دليل: تبقى برا. الباقي حسب الساعات: الطاووس، العدسة، الضوء، البركة، السندانة.',
    ],
    wrong: [],
    success: 'الليلة صارت واضحة ✨ — البذرة چانت بالورشة لحد الساعة ١١ على الأقل، وطلعت ويّا شي أبيض مر جنب البركة ١١:٤٠.',
    reward: ['flag:dg-timeline', 'journal:dg-timeline', 'journal:dg-strip-a'],
  },

  /* ── D · the four hypotheses ─────────────────────────────────── */
  // Three trails leave the workshop's back door. The wide one is dusty (old: the peacock went
  // the other way before ten), the even one is the rake leaning on the door. Only the small wet
  // paw trail fits the pond clock — and Snooki's biscuits.
  'dg-tracks': {
    type: 'deduction',
    title: 'الآثار الثلاثة',
    goal: 'أي أثر انعمل بليلة البذرة؟ اختاريه، ووياه دليلين يثبتون.',
    intro: 'ثلاث آثار تطلع من باب الورشة الخلفي. اثنين منها كاذبة — مو لأن أحد كذب، لأنها تنقرى غلط.',
    config: {
      need: 2,
      labels: { who: 'أي أثر؟', submit: 'هذا الأثر 🐾' },
      suspects: [
        { id: 'wide', label: 'الأثر العريض', icon: 'feather', note: 'خط عريض يجر، يروح للمحمية' },
        { id: 'even', label: 'الخطوط المتساوية', icon: 'mark', note: 'تبين كفوف… بس المسافة بينها نفسها بالضبط' },
        { id: 'paws', label: 'الكفوف الصغيرة', icon: 'footprint', note: 'تروح للبيت الزجاجي، وبعضها مبلل' },
      ],
      evidence: [
        { id: 'wet', label: 'البلل', icon: 'drop', note: 'الأثر مبلل: صاحبه مر بماي قبل شوية' },
        { id: 'pond', label: 'ساعة البركة', icon: 'drop', note: 'وگفت ١١:٤٠ بشعر أبيض مبلل' },
        { id: 'dust', label: 'الغبار', icon: 'sun', note: 'طبقة غبار رقيقة على الأثر العريض' },
        { id: 'rake', label: 'الگرابة', icon: 'leaf', note: 'گرابة ريان مسنودة على الباب، أسنانها بيها طين ناشف' },
        { id: 'crumbs', label: 'فتات بسكويت', icon: 'bread', note: 'على طول الكفوف الصغيرة' },
      ],
      answer: { suspect: 'paws', evidence: ['wet', 'pond', 'crumbs'] },
    },
    hints: [
      'أثر «كاذب» ممكن يكون حقيقي… بس من وقت ثاني، أو من شي مو حيوان.',
      'الغبار يگول شنو عن عمر الأثر العريض؟ والگرابة شنو تسوي لو انجرّت؟',
      'الكفوف الصغيرة. ويّاها أي اثنين من: البلل، ساعة البركة، فتات البسكويت.',
    ],
    wrong: ['الأثر هذا ما يثبت بهالدليلين.'],
    success: 'الأثر الحقيقي ✨ — كفوف صغيرة مبللة من الورشة للبيت الزجاجي. والعريض قديم، والمتساوي گرابة.',
    reward: ['flag:dg-trails', 'journal:dg-trails'],
  },

  // Four explanations; three are each broken by one fact, one fits them all. The fourth only
  // becomes possible once she has seen the cracked pot ("what is missing": where the seed is now).
  'dg-board': {
    type: 'contradict',
    title: 'الفرضيات الأربع',
    goal: 'لكل فرضية: لگي الدليل اللي يكذّبها — أو اعلني إنها تصمد.',
    intro: 'أربع تفسيرات لاختفاء البذرة. فرضية وحدة بس تصمد گدام كل الأدلة. لا تختارين الأحلى… اختاري اللي ما ينكسر.',
    config: {
      evidence: [FACT.guestbook, FACT.log, FACT.trail, FACT.pot, FACT.clock3, FACT.clock4, FACT.bed, FACT.song],
      stages: [
        { who: 'الفرضية الأولى', icon: 'feather', claims: ['السلطان أخذها قبل ما يطلع، لأنه يحب كل شي يلمع.'], answer: { claim: 0, evidence: ['guestbook', 'log'] }, explain: 'البذرة چانت بعلبتها بعد ما طلع السلطان' },
        { who: 'الفرضية الثانية', icon: 'key', claims: ['أحد شالها وطلع بيها برا الحديقة كلها.'], answer: { claim: 0, evidence: ['trail', 'pot'] }, explain: 'الأثر ينتهي بالبيت الزجاجي، وما بيه أثر يطلع' },
        { who: 'الفرضية الثالثة', icon: 'sun', claims: ['الريح وگعت العلبة، والبذرة تدحرجت لزاوية بالورشة.'], answer: { claim: 0, evidence: ['clock3', 'trail', 'song'] }, explain: 'أحد شالها ومشى بيها جنب البركة — ما تدحرجت' },
        { who: 'الفرضية الرابعة', icon: 'paw', claims: ['سنوكي خبّاها بسندانة بالبيت الزجاجي، وطاحت من گاعها المكسور لتحت.'], answer: { claim: -1 }, explain: 'ولا دليل يكذّبها — وكل دليل يركب وياها' },
      ],
      labels: { none: 'هالفرضية تصمد گدام كل الأدلة', proof: 'الدليل اللي يكسرها', submit: 'هذا حكمي ⚖️' },
      messages: { wrong: 'هالدليل ما يكسر هالفرضية.', none: 'لا… أكو دليل يكسرها. دوّري.' },
    },
    hints: [
      'فرضية تنكسر بدليل واحد أكيد. والفرضية اللي تصمد لازم تفسّر كل شي، حتى وين البذرة هسه.',
      'دفتر الزوار يگول شنو عن البذرة بعد ما طلع السلطان؟ والأثر وين ينتهي؟',
      'الأولى: دفتر الزوار أو دفتر منذر. الثانية: الأثر أو السندانة. الثالثة: ساعة البركة أو الأثر. الرابعة تصمد.',
    ],
    wrong: [],
    success: 'ثلاث فرضيات انكسرت، ووحدة صمدت ✨ — سنوكي… عندك شي تگوله؟',
    reward: ['flag:dg-hypo', 'journal:dg-hypo', 'journal:dg-note-heat'],
  },

  /* ── B · the observatory cipher ──────────────────────────────── */
  // Pattern recognition on the sealed walls: the last level is a mirror (the second half repeats
  // the first backwards) — the idea she needs in the mirror house.
  'dg-pattern': {
    type: 'series',
    title: 'حيطان الغرفة المختومة',
    goal: 'كل حايط عليه نمط. لگي الرمز الناقص.',
    intro: 'ريان كتب على الحيطان بالرموز. قبل ما ينقرى أي شي، لازم تفهمين شلون يتكرر.',
    config: {
      stages: [
        {
          examples: [['sym:sun', 'sym:moon-crescent', 'sym:sun', 'sym:moon-crescent'], ['sym:star', 'sym:heart', 'sym:star', 'sym:heart']],
          question: ['sym:key', 'sym:drop', 'sym:key', null],
          options: ['sym:key', 'sym:drop', 'sym:star'],
          answer: 'sym:drop',
          rule: 'رمزين يتناوبون',
        },
        {
          examples: [['sym:sun', 'sym:sun', 'sym:moon-half', 'sym:sun', 'sym:sun', 'sym:moon-half'], ['sym:heart', 'sym:heart', 'sym:key', 'sym:heart', 'sym:heart', 'sym:key']],
          question: ['sym:drop', 'sym:drop', 'sym:star', 'sym:drop', 'sym:drop', null],
          options: ['sym:drop', 'sym:star', 'sym:heart'],
          answer: 'sym:star',
          rule: 'اثنين متشابهين، بعدين واحد مختلف',
        },
        {
          examples: [['sym:star', 'sym:heart', 'sym:key', 'sym:key', 'sym:heart', 'sym:star'], ['sym:sun', 'sym:drop', 'sym:moon-full', 'sym:moon-full', 'sym:drop', 'sym:sun']],
          question: ['sym:rose', 'sym:leaf', 'sym:note', 'sym:note', 'sym:leaf', null],
          options: ['sym:note', 'sym:leaf', 'sym:rose'],
          answer: 'sym:rose',
          rule: 'النص الثاني مراية للنص الأول',
        },
      ],
    },
    hints: ['قارني الخانة الأولى بالأخيرة بكل سطر.', 'بالحايط الأخير: اقرئي السطر من اليمين، وبعدين من اليسار.', 'الحايط الأخير مراية: الرمز الأخير نفس الأول.'],
    wrong: ['الحايط ما تحرك. النمط ما يركب.'],
    success: 'الحيطان انفهمت ✨ — وآخر حايط چان مراية. ريان يحب يكتب بالمقلوب.',
    reward: ['flag:dg-pattern', 'journal:dg-pattern'],
  },

  // The star wheel waits for "the hour the seed passed the water" — the pond clock (A).
  'dg-wheel': {
    type: 'clock',
    title: 'دولاب النجوم',
    goal: 'دوّري الدولاب للساعة اللي مرّت بيها البذرة جنب الماي.',
    intro: 'محفور على حافة الدولاب: «لمن تعرفين متى مرّت البذرة جنب الماي، النجوم تگول الباقي.»',
    config: { target: [11, 40], tolerance: 0, step: 5, start: [12, 0] },
    hints: ['الماي… أي ماي مرّت جنبه البذرة ليلة البارحة؟', 'ساعة البركة بحديقة الساعات الساكتة.', '١١:٤٠.'],
    wrong: ['النجوم تحركت شوية… ورجعت. مو هالساعة.'],
    success: 'الدولاب وگف ✨ — وتحت ثلاث رموز بانت حروف.',
    reward: ['flag:dg-wheel', 'journal:dg-key'],
  },

  // The mirror line, read in the mirror: four glyphs, two given by the wheel (moon = ق, rose = ر).
  // The heart is ي in every cipher of the garden (Act V's star cipher, Phase 03b's line); the drop
  // follows from the sentence. Shown as the mirror shows it, so it reads backwards: «يرمق».
  'dg-mirror': {
    type: 'cipher',
    title: 'سطر المراية',
    goal: 'حطي حرف تحت كل رمز. اقرئيه مثل ما المراية تقلبه.',
    intro: 'على المراية: «البذرة ما تصحى إلا بضوء ـــ». الكلمة الأخيرة رموز، والمراية قالبتها.',
    config: {
      word: ['ي', 'ر', 'م', 'ق'],
      glyphs: ['sym:heart', 'sym:rose', 'sym:drop', 'sym:moon-full'],
      given: { 1: 'ر', 3: 'ق' },
      letters: ['ق', 'م', 'ر', 'ي', 'ن', 'ب', 'ش', 'س', 'ل', 'و'],
    },
    hints: ['الدولاب أعطاچ حرفين. والقلب؟ شفتيه بشفرات قبل.', 'المراية تقلب الترتيب: اقرئي الحروف من الجهة الثانية.', 'ي، ر، م، ق — بالمراية: «قمري». ضوء قمري.'],
    wrong: ['الكلمة ما تنقرى. جرّبي تقرينها بالمقلوب.'],
    success: '«البذرة ما تصحى إلا بضوء قمري» ✨ — بس الضوء وحده؟ الجملة ناقصة… الماي؟ الدفا؟',
    reward: ['flag:dg-mirror', 'journal:dg-mirror', 'journal:dg-strip-b'],
  },

  /* ── C · the changing roots ──────────────────────────────────── */
  // Root gates: ☀ lets her in on odd beats, 🌙 on even ones; every command is a beat. Waiting
  // (or a wasted turn) shifts the beat. Budgets are the shortest route (+1); tests prove the
  // gates and the wait are really needed.
  'dg-roots-maze': {
    type: 'program',
    title: 'سرداب الجذور',
    goal: 'وصّلي سنوكي للبذرة الضاوية 🌱 — البوابات تتنفس.',
    intro: '«⬆» خطوة، «↶/↷» لفّة، «⏸» انتظار. كل أمر نبضة. البوابة ☀ تخليچ تدخلين بس بنبضة فردية، و🌙 بس بنبضة زوجية. خططي، وبعدين شغّلي.',
    config: {
      wait: true,
      look: { actor: '🐾', goal: '🌱', wall: '🪵', label: 'الجذور: سنوكي 🐾، البذرة 🌱، البوابات ☀ و🌙، المفتاح 🗝️ وبابه 🚪' },
      messages: { crash: 'دگ بجذر! شيلي الأمر الغلط.', short: 'وگف بالطريق.', gate: 'البوابة چانت مسدودة بهالنبضة. عدّي من الأول.', next: 'الجذور تحركت. المستوى {n} من {of}.' },
      stages: [
        { grid: ['..1.B'], start: { x: 0, y: 0, dir: 0 }, max: 5 },
        { grid: ['k.1.#', '#.#2.', '..K.B'], start: { x: 1, y: 0, dir: 1 }, max: 10 },
        { grid: ['.1.2.', '#2#1#', 'k.2.K', '#1#.B'], start: { x: 0, y: 0, dir: 0 }, max: 12 },
      ],
    },
    hints: ['عدّي: الأمر الأول نبضة ١، الثاني ٢… وشوفي بأي نبضة توصلين كل بوابة.', 'إذا وصلتي بوابة بالنبضة الغلط، انتظري مرة وحدة قبلها.', 'بالمستوى الأول: قدّام، انتظري، قدّام، قدّام، قدّام.'],
    wrong: [],
    success: 'عبرتي الجذور ✨ — النبض صار مفهوم: العدّ هو الطريق.',
    reward: ['flag:dg-roots-maze', 'journal:dg-roots'],
  },
  'dg-hedge': {
    type: 'program',
    title: 'متاهة السياج الدوّارة',
    goal: 'المتاهة تدور بين كل مستوى. وصّلي سنوكي للفتحة 🌀.',
    intro: 'نفس قواعد الجذور: ☀ نبضة فردية، 🌙 زوجية، والباب يحتاج مفتاحه. هنا الطريق أطول، والأوامر محدودة.',
    config: {
      wait: true,
      look: { actor: '🐾', goal: '🌀', wall: '🌿', label: 'السياج: سنوكي 🐾، الفتحة 🌀، البوابات ☀ و🌙، المفاتيح وأبوابها' },
      messages: { crash: 'دخل بالسياج! شيلي الأمر الغلط.', short: 'وگف قبل الفتحة.', gate: 'البوابة چانت مسدودة بهالنبضة.', door: 'الباب يحتاج مفتاحه.', next: 'السياج دار! المستوى {n} من {of}.' },
      stages: [
        { grid: ['..1q.', '#2##1', '.k1.Q', '2#K#.', '..1.B'], start: { x: 0, y: 0, dir: 0 }, max: 11 },
        { grid: ['.1.k.', '2##1#', '.K.2q', '#2#.#', 'B1Q..'], start: { x: 0, y: 0, dir: 0 }, max: 16 },
      ],
    },
    hints: ['تتبّعي الطريق بإصبعچ أول: وين المفتاح، وين بابه، ووين البوابات بالطريق.', 'بالمستوى الثاني تحتاجين المفتاحين، وانتظار وحيد بمكان واحد.', 'اكتبي النبضة فوق كل بوابة بطريقچ؛ وين ما تركب، انتظري قبلها بخطوة.'],
    wrong: [],
    success: 'السياج وگف ✨ — وانفتح ورا طريق للجسر.',
    reward: ['flag:dg-hedge', 'journal:dg-hedge'],
  },

  // Four planks (up/down), four ropes. The bell rope also lifts plank 1 — but only when plank 1
  // is down. Every level needs exactly 4 pulls; the conditional changes the answer.
  'dg-bridge': {
    type: 'machine',
    title: 'ألواح الجسر',
    goal: 'نزّلي الألواح الأربعة كلها، بعدد سحبات محدود.',
    intro: 'كل حبل يحرّك لوحين. واحد منهم… يسوي شي زايد بحالة معيّنة. اسحبي وشوفي السجل، وبعدين خططي.',
    config: {
      dials: [1, 2, 3, 4].map((n) => ({ label: `اللوح ${'١٢٣٤'[n - 1]}`, states: ['مرفوع', 'نازل'] })),
      levers: [
        { id: 'rock', label: 'حبل الصخرة', icon: 'mark', effects: [{ dial: 0, by: 1 }, { dial: 1, by: 1 }] },
        { id: 'tree', label: 'حبل الشجرة', icon: 'leaf', effects: [{ dial: 1, by: 1 }, { dial: 2, by: 1 }] },
        { id: 'bank', label: 'حبل الضفة', icon: 'drop', effects: [{ dial: 2, by: 1 }, { dial: 3, by: 1 }] },
        { id: 'bell', label: 'حبل الجرس', icon: 'crown', effects: [{ dial: 3, by: 1 }, { dial: 0, by: 1, if: { dial: 0, is: 1 } }] },
      ],
      stages: [
        { start: [1, 0, 0, 0], target: [1, 1, 1, 1], max: 4 },
        { start: [1, 1, 0, 1], target: [1, 1, 1, 1], max: 4 },
        { start: [0, 1, 1, 1], target: [1, 1, 1, 1], max: 4 },
      ],
      messages: { wrong: 'الجسر بعده ما يشيل.', next: 'الجسر نزل', max: 'خلصت السحبات. رجّعي الألواح وخططي من جديد.' },
    },
    hints: ['اسحبي كل حبل مرة وشوفي السجل: شنو يتغير؟ وحبل الجرس… جرّبيه بحالتين.', 'حبل الجرس يرفع اللوح الأول إذا چان نازل. فالترتيب يفرق.', 'اسحبي حبل الجرس قبل ما ينزل اللوح الأول — أو لمن تحتاجين ترفعه.'],
    wrong: [],
    success: 'الجسر نزل كله ✨ — وبآخره، ورا الضباب، بيت أخضر ما شفناه قبل.',
    reward: ['flag:dg-bridge', 'journal:dg-bridge', 'journal:dg-strip-c'],
  },

  /* ── synthesis ───────────────────────────────────────────────── */
  // The seasons machine: light (from the mirror), water (the note on the roots wall) and warmth
  // (the note that was stuck in Snooki's fur). Level 1 shows its target to learn the levers;
  // levels 2–3 need the evidence; level 3 limits the pulls (the stove's conditional matters).
  'dg-seasons': {
    type: 'machine',
    title: 'آلة الفصول',
    goal: 'اضبطي الآلة على الليلة اللي تصحى بيها البذرة، وشغّليها.',
    intro: 'آلة قديمة بثلاث عدادات وأربع أذرع. أول مرة تكتب الهدف… بعدين لازم تعرفينه من الأدلة.',
    config: {
      dials: [
        { label: 'الضوء', states: ['شمس', 'ظلمة', 'قمر'] },
        { label: 'الماي', states: ['جاف', 'رذاذ', 'مطر'] },
        { label: 'الدفا', states: ['بارد', 'معتدل', 'حار'] },
      ],
      levers: [
        { id: 'veil', label: 'الستارة', icon: 'moon-half', effects: [{ dial: 0, by: 1 }, { dial: 2, by: -1 }] },
        { id: 'pump', label: 'المضخة', icon: 'drop', effects: [{ dial: 1, by: 1 }, { dial: 2, by: -1 }] },
        { id: 'stove', label: 'الموقد', icon: 'sun', effects: [{ dial: 2, by: 1 }, { dial: 0, by: -1, if: { dial: 0, is: 2 } }] },
        { id: 'wheel', label: 'الدولاب', icon: 'star', effects: [{ dial: 2, by: 1 }, { dial: 0, by: -1 }] },
      ],
      stages: [
        { start: [0, 0, 0], target: [1, 2, 0] },
        { start: [0, 2, 0], target: [2, 1, 1], hidden: true, ask: 'الهدف مو مكتوب: الضوء، الماي، والدفا اللي تصحى بيها البذرة — من الأدلة.' },
        { start: [2, 2, 1], target: [2, 1, 1], hidden: true, max: 6, ask: 'نفس الليلة… بس من بداية ثانية، وبست سحبات بس.' },
      ],
      messages: { wrong: 'الآلة دارت… والبذرة ما تحركت.', next: 'البذرة رجفت', max: 'خلصت السحبات. رجّعي للبداية وخططي.' },
    },
    hints: [
      'أول شي: اسحبي كل ذراع وحده واقري السجل. أكو ذراع يسوي شي زايد بس بحالة معيّنة.',
      'الضوء من سطر المراية. الماي: «عطشانة… بس الغرق يموتها». الدفا: «تحب الدفا، بس مو دفا الصيف».',
      'قمر، رذاذ، معتدل. وبالمستوى الأخير: الموقد يطفي القمر إذا شغّلتيه والضوء قمر — شغّليه قبل.',
    ],
    wrong: [],
    success: 'البذرة صحت ✨ — ضوت زرگة، ورجفت، وبيّن تحتها آخر شريط من صفحة ريان.',
    reward: ['flag:dg-awake', 'journal:dg-awake', 'journal:dg-strip-d'],
  },

  // The last page: four strips (one from each investigation), two rules each. Exactly one way to
  // plant the last rose satisfies all eight, and each rule is needed (tested). It is the same
  // planting the finale shows — now she knows why.
  'dg-ritual': {
    type: 'logicgrid',
    title: 'الصفحة الأخيرة',
    goal: 'لكل خطوة بزراعة الوردة الأخيرة: منو يسويها، وبأي ترتيب.',
    intro: 'أربع أشرطة من صفحة ريان، بكل واحد قاعدتين. ركّبيها. التحقق يگول بس أي قاعدة انكسرت.',
    config: {
      rows: [
        { id: 'dig', label: 'الحفر', icon: 'paw' },
        { id: 'seed', label: 'البذرة', icon: 'rose' },
        { id: 'water', label: 'السقي', icon: 'drop' },
        { id: 'light', label: 'الضوء', icon: 'sun' },
      ],
      cols: [
        { id: 'who', label: 'منو؟', options: [{ id: 'snooki', label: 'سنوكي' }, { id: 'anji', label: 'أنجي' }, { id: 'ryan', label: 'ريان' }, { id: 'both', label: 'سوا' }] },
        { id: 'order', label: 'الترتيب', options: [{ id: '1', label: '١' }, { id: '2', label: '٢' }, { id: '3', label: '٣' }, { id: '4', label: '٤' }] },
      ],
      clues: [
        { text: 'الضوء آخر خطوة.', rule: { is: ['light', 'order', '4'] } },
        { text: 'ماكو خطوتين بنفس الوقت.', rule: { distinct: 'order' } },
        { text: 'البذرة مو أول خطوة.', rule: { notIn: ['seed', 'order', ['1']] } },
        { text: 'الضوء ما يشعله واحد بروحه.', rule: { is: ['light', 'who', 'both'] } },
        { text: 'الماي يجي مباشرة بعد البذرة.', rule: { next: ['seed', 'water', 'order'] } },
        { text: 'اللي يحفر يمشي على أربع.', rule: { is: ['dig', 'who', 'snooki'] } },
        { text: 'البذرة تنزرع بإيد اللي صحّتها.', rule: { is: ['seed', 'who', 'anji'] } },
        { text: 'كل واحد إله خطوة وحدة.', rule: { distinct: 'who' } },
      ],
    },
    hints: ['ابدي بالقواعد اللي تثبّت خانة وحدة. بعدين القواعد اللي تشطب.', 'منو صحّى البذرة؟ ومنو يمشي على أربع؟ والترتيب: الضوء آخر شي، والماي مباشرة بعد البذرة.', 'الحفر: سنوكي ١. البذرة: أنجي ٢. السقي: ريان ٣. الضوء: سوا ٤.'],
    wrong: [],
    success: 'الصفحة الأخيرة اكتملت ✨ — «هاي الوردة ما تنزرع بإيد وحدة.» ريان ينتظر بالحديقة المخفية.',
    reward: ['flag:dg-done', 'journal:dg-done'],
  },

  /* ── optional ────────────────────────────────────────────────── */
  // The bells carry what lay on each clock's stone; the song is the night in order (A).
  'dg-song': {
    type: 'sequence',
    title: 'أجراس الغرفة المهجورة',
    goal: 'دگي الأجراس بترتيب الليلة الضائعة.',
    intro: 'كل جرس محفور عليه شي: ريشة، غطا عدسة، شعرة، وتراب. والصندوق يحفظ الأغنية اللي تدگينها.',
    config: {
      items: [
        { id: 'soil', label: 'تراب أحمر', icon: 'rose-white' },
        { id: 'feather', label: 'ريشة', icon: 'feather' },
        { id: 'hair', label: 'شعرة بيضاء', icon: 'drop' },
        { id: 'lens', label: 'غطا عدسة', icon: 'sun' },
      ],
      answer: ['feather', 'lens', 'hair', 'soil'],
    },
    hints: ['هالأشياء شفتيها على حجار الساعات.', 'رتبيها حسب الساعة اللي وگفت بيها كل ساعة.', 'ريشة ٩:٣٠، غطا العدسة ١٠:٠٠، الشعرة ١١:٤٠، التراب ١١:٥٥.'],
    wrong: ['الأجراس سكتت. مو هالترتيب.'],
    success: 'الأغنية رجعت ✨ — والصندوق شغّل تسجيل قديم من ليلة البارحة.',
    reward: ['flag:dg-song', 'journal:dg-song'],
  },
  'dg-lights': {
    type: 'switches',
    title: 'فوانيس المنارة',
    goal: 'ضوّي الفوانيس كلها.',
    intro: 'كل فانوس تلمسينه يقلب نفسه وجيرانه. المنارة تضوي لمن كلها تضوي سوا.',
    config: { size: 3, scramble: 5, seed: 41 },
    hints: ['المسي فانوس وشوفي أي جيران تقلبوا.', 'ابدي من صف وحاولي تخلّينه كامل، بعدين انزلي.', 'كل فانوس يكفيه لمسة وحدة أو ولا لمسة — ما يحتاج أكثر.'],
    wrong: [],
    success: 'المنارة ضوت ✨',
    reward: ['flag:dg-lights', 'journal:dg-lights'],
  },
};
