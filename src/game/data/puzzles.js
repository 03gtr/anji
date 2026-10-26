/**
 * Puzzle content. Every answer must be discoverable inside the game (the
 * clue's location is noted in a comment), hints go from gentle to explicit,
 * and `reward` effects apply only on the first solve.
 */
export const PUZZLES = {
  // Clue: the fountain engraving "from darkness to full light".
  'moon-bloom': {
    type: 'sequence',
    title: 'ورود القمر',
    intro: 'أربع ورود بيضة، تحت كل وحدة قمر. المسيها بالترتيب الصحيح حتى تتفتح.',
    config: {
      items: [
        { id: 'half', label: 'نص قمر', icon: 'moon-half' },
        { id: 'new', label: 'قمر مظلم', icon: 'moon-new' },
        { id: 'full', label: 'بدر', icon: 'moon-full' },
        { id: 'crescent', label: 'هلال', icon: 'moon-crescent' },
      ],
      answer: ['new', 'crescent', 'half', 'full'],
    },
    hints: [
      'النافورة القريبة عليها نقش يحچي عن ترتيب.',
      '«من الظلام إلى النور الكامل»: القمر يكبر من مظلم إلى مضيء.',
      'ابدي بالقمر المظلم، وخلّصي بالبدر.',
    ],
    wrong: ['الورود رجعت بيضة. الترتيب مو هذا.', 'سنوكي: «جرّبي بالمقلوب!» … الأحسن لا تسمعين نصيحته.', 'تذكّري النقش اللي على النافورة.'],
    success: 'تفتّحت الورود الأربعة! 🌹',
    reward: ['flag:moon-bloom', 'flag:maze-open', 'item:map-1', 'journal:map-1'],
  },

  // Clue: the blue roses everywhere, the phone's blue glow, Snooki's blue tag.
  'gate-color': {
    type: 'choice',
    title: 'سؤال البوابة',
    intro: 'البوابة تسأل سؤال واحد. الجواب حوالينچ بكل مكان.',
    config: {
      question: '«أيُّ لونٍ اختاره صانعي لكل ما يهمّه؟»',
      options: [
        { id: 'red', label: 'أحمر', icon: 'rose-red', reply: 'البوابة: «الأحمر للعجلة، لا للقلب.»' },
        { id: 'gold', label: 'ذهبي', icon: 'rose-gold', reply: 'البوابة: «الذهب يلمع، لكنه لا يُزهر.»' },
        { id: 'blue', label: 'أزرق', icon: 'rose' },
        { id: 'white', label: 'أبيض', icon: 'rose-white', reply: 'البوابة: «الأبيض بدايةٌ لم تُكتب بعد.»' },
      ],
      answer: 'blue',
    },
    hints: ['شوفي الورد اللي حوالينچ.', 'شنو لون ضوء رسالة الموبايل؟ وقلادة سنوكي؟', 'الأزرق… بكل مكان.'],
    success: 'البوابة تبتسم… إذا البوابات تبتسم.',
    reward: ['flag:gate-open'],
  },

  // Clues: the hall clock stopped at 7:14, the recipe card timer 07:14,
  // and the note "the garage likes the time the clock stopped at".
  'garage-lock': {
    type: 'lock',
    title: 'قفل الكراج',
    intro: 'أربع خانات أرقام. الكراج «يحب الوقت اللي توقفت بيه الساعة».',
    config: {
      symbols: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
      answer: [0, 7, 1, 4],
      dialLabels: ['ساعة', 'ساعة', 'دقيقة', 'دقيقة'],
    },
    hints: ['شوفي الساعة الكبيرة بالممر.', 'الساعة واقفة على سبعة وأربعطعش دقيقة.', 'الرمز: ٠ ٧ ١ ٤'],
    wrong: ['القفل ما تحرك.', 'سنوكي: جرّبي تاريخ ميلادي! …ما أعرفه بس جرّبي.', 'فكّري بالساعة.'],
    success: 'تك! الكراج انفتح.',
    reward: ['flag:garage-lock'],
  },

  // Evidence comes from the evidence table (hidden objects) and the tracks
  // quiz at the sanctuary. Any two husky-related clues prove it.
  'map-case': {
    type: 'deduction',
    title: 'لوحة التحقيق',
    intro: 'منو أخذ قطعة الخريطة الثانية؟ اختاري المشتبه به ودليلين يثبتون.',
    config: {
      need: 2,
      suspects: [
        { id: 'sultan', label: 'السلطان', icon: 'feather', note: 'طاووس مغرور يحب الأشياء اللي تلمع' },
        { id: 'squirrels', label: 'عصابة السناجب', icon: 'claw', note: 'سرقات جوز سابقة' },
        { id: 'needle', label: 'الممرضة إبرة', icon: 'stethoscope', note: 'تتجول بالليل بدفتر مواعيد' },
        { id: 'snooki', label: 'سنوكي', icon: 'paw', note: 'المحقق الرئيسي بالقضية' },
      ],
      evidence: [
        { id: 'feather', label: 'ريشة طاووس', icon: 'feather', note: 'السلطان يخسر ريش كل ما يتحمّس' },
        { id: 'fur', label: 'فرو أبيض', icon: 'paw', note: 'ناعم، طويل، أبيض' },
        { id: 'teeth', label: 'آثار أسنان', icon: 'map', note: 'على غطاء الخريطة' },
        { id: 'acorn', label: 'قشرة جوز', icon: 'claw', note: 'تحت الطاولة' },
        { id: 'sticker', label: 'ملصق «شجاع»', icon: 'stethoscope', note: 'ملصقات الإبرة بكل مكان' },
        { id: 'paws', label: 'آثار كف هاسكي', icon: 'paw', note: 'جنب الجنطة بالطين' },
        { id: 'tape', label: 'تسجيل كلام بالنوم', icon: 'note', note: '«…لا تگولها بعد…»' },
      ],
      answer: { suspect: 'snooki', evidence: ['fur', 'teeth', 'paws', 'tape'] },
    },
    solution: [['pickSuspect', 'snooki'], ['toggleEvidence', 'fur'], ['toggleEvidence', 'paws'], ['submit']],
    hints: ['فكّري بالأدلة اللي ما إلها تفسير بريء.', 'منو بالحديقة عنده فرو أبيض وأسنان كبيرة؟', 'المحقق الرئيسي… مو دايماً بريء.'],
    wrong: ['سنوكي: «لا! الأدلة تگول غير هيچ!» … بعيونه خوف.', 'السلطان عنده حجة: چان يتصوّر ويّا القمر طول الليل.', 'الأدلة ما تركب. جرّبي ترتيب ثاني.'],
    success: 'سنوكي… نزّل راسه.',
    reward: ['flag:case-solved'],
  },

  // Pure logic: every candle press flips itself and its neighbours.
  'library-candles': {
    type: 'switches',
    title: 'شموع المكتبة',
    intro: 'كل شمعة تلمسينها تقلب نفسها والشموع اللي جنبها. شعّلي التسعة كلها.',
    config: { size: 3, scramble: 3, seed: 7 },
    hints: ['ابدي بالشموع الطافية اللي جنب بعض.', 'الشمعة بالنص تأثر على خمس شموع.', 'جرّبي تلمسين نفس الشمعة مرتين: ترجع مثل ما چانت.'],
    wrong: [],
    success: 'المكتبة ضوت كلها.',
    reward: ['flag:candles-lit'],
  },

  // Clue: Doctor Hoot explains the golden arrow; the rings show the symbols
  // she has met on her way (rose, paw, moon).
  'star-rings': {
    type: 'rings',
    title: 'حلقات الكوكبة',
    intro: 'لفّي الحلقات الثلاث لحد ما كل رمز يوصل للسهم الذهبي فوق. انتبهي: الحلقة الخارجية تسحب اللي جوّاها.',
    config: {
      count: 3,
      steps: 8,
      start: [3, 5, 2],
      links: { 0: [1] },
      symbols: ['rose', 'paw', 'moon-full'],
      labels: ['الوردة', 'الكف', 'القمر'],
    },
    hints: ['ركّزي على الحلقة الخارجية أول، لأنها تحرّك الوسطى.', 'لمن الوردة تصير فوق، صلّحي الكف والقمر بدون ما تلمسين الخارجية.', 'كل حلقة إلها ثمان مواقع.'],
    wrong: [],
    success: 'النجوم ركبت… وطلع شكل.',
    reward: ['flag:rings-aligned'],
  },

  // Clue: the glyph key in the library note gives the first and last letter;
  // the word is the name the garden was made for.
  'star-cipher': {
    type: 'cipher',
    title: 'شفرة النجوم',
    intro: 'تحت الكوكبة، أربع نجوم بأشكال مختلفة. كل شكل حرف. الكلمة اللي ريان كتبها بالسما…',
    config: {
      word: ['أ', 'ن', 'ج', 'ي'],
      glyphs: ['sym:star', 'sym:moon-crescent', 'sym:rose', 'sym:heart'],
      given: { 0: 'أ', 3: 'ي' },
      key: [['sym:star', 'أ'], ['sym:heart', 'ي']],
      letters: ['ر', 'ن', 'ج', 'س', 'م', 'ل'],
    },
    hints: ['الكلمة اسم.', 'اسم يبدي بألف وينتهي بياء… ومن أربع حروف.', 'الاسم اللي الحديقة تعرفه من أول يوم.'],
    wrong: ['النجوم ما ضوت. مو هاي الكلمة.', 'فكّري: ليش الحديقة تعرفچ؟'],
    success: '…أنجي.',
    reward: ['flag:cipher-solved'],
  },

  'workshop-lights': {
    type: 'switches',
    title: 'فوانيس الماكينة',
    intro: 'ستطعش فانوس بالماكينة. كل لمسة تقلب الفانوس وجيرانه. شعّليهن كلهن.',
    config: { size: 4, scramble: 4, seed: 13 },
    hints: ['اشتغلي صف صف من فوق لجوه.', 'لمن الصف الفوقاني كله شاعل، صلّحي اللي تحته باللمس تحت كل فانوس طافي.', 'نفس اللمسة مرتين ترجّع كل شي مثل ما چان.'],
    wrong: [],
    success: 'الفوانيس كلها شاعلة!',
    reward: ['flag:wk-stage2'],
  },

  // Each dial is one chapter of her journey: the full moon that opened the
  // maze, the key-coded garage, the blue car, Snooki's paw (the culprit).
  'workshop-lock': {
    type: 'lock',
    title: 'قفل الرحلة',
    intro: 'أربع خانات: الحديقة، البيت، الطريق، التحقيق. لكل مكان رمز فتح الطريق.',
    config: {
      symbols: ['sym:moon-full', 'sym:key', 'sym:car', 'sym:paw', 'sym:star', 'sym:rose', 'sym:heart', 'sym:note'],
      start: [4, 5, 6, 7],
      answer: [0, 1, 2, 3],
      dialLabels: ['الحديقة', 'البيت', 'الطريق', 'التحقيق'],
    },
    hints: ['كل خانة: شنو الشي اللي فتح الطريق بهذاك المكان؟', 'الحديقة: آخر وردة بالترتيب. البيت: قفل الكراج. الطريق: زفيرو. التحقيق: المجرم.', 'بدر، مفتاح، سيارة، كف.'],
    wrong: ['الماكينة تهز… بس ما تفتح.', 'سنوكي: «التحقيق؟ لا تحطين كفّي! …زين، حطيه.»', 'فكّري بكل فصل من الرحلة.'],
    success: 'الماكينة دارت!',
    reward: ['flag:wk-stage3'],
  },
};

