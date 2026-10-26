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
};

