/**
 * Puzzle content. Every answer must be discoverable inside the game (the
 * clue's location is noted in a comment), hints go from gentle → which thing
 * matters → the exact action, and `reward` effects apply only on the first
 * solve (also when she skips: the story never stalls on a puzzle).
 * `goal` is the one-sentence objective shown above every puzzle.
 */
import { PUZZLES_V3 } from './puzzles-v3.js';
import { PUZZLES_SP1 } from './puzzles-sp1.js';
import { PUZZLES_SP2 } from './puzzles-sp2.js';
import { PUZZLES_DEEP } from './puzzles-deep.js';
import { PUZZLES_TEAM } from './puzzles-team.js';

export const PUZZLES = {
  // Clue: the fountain engraving "from darkness to full light".
  'moon-bloom': {
    type: 'sequence',
    title: 'ورود القمر',
    goal: 'المسي الورود الأربعة بالترتيب الصحيح.',
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
    goal: 'اختاري جواب واحد لسؤال البوابة.',
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

  // Clues: the hall clock stopped at 2:30, the recipe card timer 02:30,
  // and the note "the garage likes the time the clock stopped at".
  'garage-lock': {
    type: 'lock',
    title: 'قفل الكراج',
    goal: 'حطّي أربع أرقام وجرّبي الفتح.',
    intro: 'أربع خانات أرقام. الكراج «يحب الوقت اللي توقفت بيه الساعة».',
    config: {
      symbols: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
      answer: [0, 2, 3, 0],
      dialLabels: ['ساعة', 'ساعة', 'دقيقة', 'دقيقة'],
    },
    hints: ['الجواب وقت. شوفي الساعة الكبيرة بممر البيت.', 'الساعة واقفة على ثنتين ونص: يعني ٢ ساعة و٣٠ دقيقة.', 'حطّي الخانات: ٠ ٢ ٣ ٠، وبعدين «جرّبي الفتح».'],
    wrong: ['القفل ما تحرك.', 'سنوكي: جرّبي تاريخ ميلادي! …ما أعرفه بس جرّبي.', 'فكّري بالساعة.'],
    success: 'تك! الكراج انفتح.',
    reward: ['flag:garage-lock'],
  },

  // Evidence comes from the evidence table (hidden objects) and the tracks
  // quiz at the sanctuary. Any two husky-related clues prove it.
  'map-case': {
    type: 'deduction',
    title: 'لوحة التحقيق',
    goal: 'اختاري المشتبه به ودليلين يثبتون.',
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

  // V2 redesign (the 3×3 version was too hard): three short stages that
  // teach the one rule — a touch flips the candle AND its neighbours.
  // Stage 1 (3 in a row, one touch), stage 2 (5 in a row, two touches),
  // stage 3 (a plus shape on a 3×3 stand, one touch in the middle).
  'library-candles': {
    type: 'candles',
    title: 'شموع المكتبة',
    goal: 'شعّلي كل الشموع.',
    intro: 'كل لمسة تقلب الشمعة اللي لمستيها والشموع اللي جنبها: الشاعلة تنطفي، والطافية تشتعل.',
    example: `<div class="candle-example" aria-label="مثال: لمس الشمعة الوسطى يقلبها ويقلب جيرانها">
        <span class="ce-row"><i></i><i class="on"></i><i></i></span><span class="ce-arrow">👆 الوسطى ←</span><span class="ce-row"><i class="on"></i><i></i><i class="on"></i></span>
      </div>`,
    config: {
      stages: [
        { layout: 'row', size: 3, presses: [1] },
        { layout: 'row', size: 5, presses: [1, 3] },
        { layout: 'grid', size: 3, presses: [4] },
      ],
      stageDone: ['شعلت! هسه خمس شموع… نفس القاعدة.', 'ممتاز! آخر مرحلة: الشمعدان الكبير. هنا اللمسة تقلب فوق وتحت ويمين ويسار.'],
    },
    hints: [
      'باوعي على المثال فوق: لمسة وحدة تقلب ثلاث شموع (أو خمسة بالشمعدان الكبير).',
      'دوّري على شمعة طافية جيرانها طافيين هم: هاي هي المفتاح.',
      'المسي الشمعة اللي بنص كل مجموعة شموع طافية. إذا غلطتي، المسي نفس الشمعة مرة ثانية وترجع مثل ما چانت.',
    ],
    wrong: [],
    success: 'المكتبة ضوت كلها.',
    reward: ['flag:candles-lit'],
  },

  // Clue: Uncle Munther explains the golden arrow; the rings show the symbols
  // she has met on her way (rose, paw, moon).
  'star-rings': {
    type: 'rings',
    title: 'حلقات الكوكبة',
    goal: 'لفّي الحلقات لحد ما كل رمز يصير تحت السهم الذهبي.',
    intro: 'لفّي الحلقات الثلاث لحد ما كل رمز يوصل للسهم الذهبي فوق. انتبهي: الحلقة الخارجية تسحب اللي جوّاها.',
    config: {
      count: 3,
      steps: 8,
      start: [3, 5, 2],
      links: { 0: [1] },
      symbols: ['rose', 'paw', 'moon-full'],
      labels: ['الوردة', 'الكف', 'القمر'],
    },
    hints: ['ركّزي على الحلقة الخارجية (الوردة) أول، لأنها تسحب الوسطى (الكف) وياها.', 'لفّي الوردة لحد ما تصير تحت السهم الذهبي. لا تلمسينها بعدها.', 'هسه لفّي الكف لحد ما يوصل فوق، وبعدين القمر. الحلقات الداخلية ما تحرّك غيرها.'],
    solutionText: 'الوردة ⟲ خمس مرات (ترجع فوق)، بعدين صلّحي الكف والقمر كل وحدة لحالها لحد ما توصل للسهم.',
    wrong: [],
    success: 'النجوم ركبت… وطلع شكل.',
    reward: ['flag:rings-aligned'],
  },

  // Clue: the glyph key in the library note gives the first and last letter;
  // the word is the name the garden was made for.
  'star-cipher': {
    type: 'cipher',
    title: 'شفرة النجوم',
    goal: 'حطّي حرف لكل نجمة حتى تطلع الكلمة.',
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
    goal: 'شعّلي الفوانيس الستطعش كلها.',
    intro: 'ستطعش فانوس بالماكينة. كل لمسة تقلب الفانوس وجيرانه. شعّليهن كلهن.',
    config: { size: 4, scramble: 4, seed: 13 },
    hints: ['كل لمسة تقلب الفانوس واللي فوقه وتحته ويمينه ويساره.', 'اشتغلي صف صف: الصف الفوقاني أول.', 'إذا فانوس بالصف الفوقاني طافي، المسي الفانوس اللي تحته مباشرة. كرّري للصفوف اللي بعده.'],
    wrong: [],
    success: 'الفوانيس كلها شاعلة!',
    reward: ['flag:wk-stage2'],
  },

  // Each dial is one chapter of her journey: the full moon that opened the
  // maze, the key-coded garage, the blue car, Snooki's paw (the culprit).
  'workshop-lock': {
    type: 'lock',
    title: 'قفل الرحلة',
    goal: 'حطّي رمز لكل مكان من الرحلة، وجرّبي الفتح.',
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

  /* ── V2: the finale's shared action ────────────────────── */
  'plant-rose': {
    type: 'sequence',
    title: 'وردة زرقاء… سوا',
    goal: 'ازرعوا الوردة الأخيرة سوا، خطوة بخطوة.',
    intro: 'كل واحد إله خطوة. الخطوة الجاية تلمع.',
    guided: true,
    noSkip: true,
    config: {
      items: [
        { id: 'dig', label: '١. سنوكي يحفر', icon: 'paw' },
        { id: 'seed', label: '٢. أنجي تحط البذرة', icon: 'leaf' },
        { id: 'water', label: '٣. ريان يسقيها', icon: 'drop' },
        { id: 'light', label: '٤. سوا: ضوّوا الفانوس', icon: 'sun' },
      ],
      answer: ['dig', 'seed', 'water', 'light'],
    },
    hints: ['الأرقام على الخطوات.', 'أول شي الحفر، وآخر شي الضوء.', 'سنوكي، بعدين أنجي، بعدين ريان، بعدين سوا.'],
    wrong: ['سنوكي: «الحفر أول! هذا قانون الكلاب.»'],
    success: 'تفتحت الوردة 💙',
    reward: ['flag:rose-planted'],
  },

  /* ── V2: side missions ─────────────────────────────────── */

  // Unfinished Build. Clues: the hall clock (2:30, "after the shift" in the
  // comment → 14:30 in 24h), the gate that opens for her, the blue roses.
  'build-fix': {
    type: 'code',
    title: 'البناء الناقص',
    goal: 'صلّحي ثلاث كلمات بالكود حتى يشتغل.',
    intro: 'لابتوب ريان: مشروع «GardenCore» بيه ٣ أخطاء. المسي الكلمات الملوّنة حتى تتبدّل، وبعدين شغّليه.',
    config: {
      file: 'BlueRoseEngine.js',
      lines: [
        '// GardenCore v0.9 — BlueRoseEngine',
        '// ملاحظة: نفس وقت ساعة الممر، بس بعد الظهر (بعد الدوام)',
        'const WAIT_UNTIL = "{0}";',
        'function onArrive(guest) {',
        '  if (guest === "{1}") gate.open();',
        '  roses.bloom("{2}");',
        '}',
      ],
      slots: [
        { options: ['09:00', '02:30', '14:30', '00:00'], answer: 2 },
        { options: ['anyone', 'snooki', 'anji'], answer: 2 },
        { options: ['red', 'gray', 'blue'], answer: 2 },
      ],
    },
    hints: [
      'كل سطر بيه كلمة ملوّنة غلط. السطر ٢ (التعليق) يگول من وين تجين بالوقت.',
      'الوقت: ساعة الممر واقفة على ٢:٣٠، والتعليق يگول «بعد الظهر» — الكمبيوتر يكتبها بنظام ٢٤ ساعة. والبوابة تنفتح لوحدة بس.',
      'بدّلي السطر ٣ لـ 14:30، والسطر ٥ لـ anji، والسطر ٦ لـ blue، وبعدين «شغّلي».',
    ],
    wrong: [],
    success: '✓ build passed. الشاشة صارت زرقاء… ومكتوب: «إطفي الضوء.»',
    reward: ['flag:build-fixed'],
  },

  // Clue: the four symbols that glow on the study wall once the lamp is off,
  // read right to left (the way she reads): rose, car, paw, moon.
  'study-drawer': {
    type: 'lock',
    title: 'درج المكتب',
    goal: 'حطّي الرموز الأربعة بالترتيب وجرّبي الفتح.',
    intro: 'قفل بأربع خانات رموز. نفس الرموز اللي لمعت على الحايط بالظلام.',
    config: {
      symbols: ['sym:star', 'sym:rose', 'sym:car', 'sym:paw', 'sym:moon-full', 'sym:heart'],
      start: [0, 0, 0, 0],
      answer: [1, 2, 3, 4],
      dialLabels: ['١', '٢', '٣', '٤'],
    },
    hints: ['الرموز اللي لمعت على الحايط لمن طفيتي الأباجورة.', 'اقريها مثل ما تقرين العربي: من اليمين لليسار.', 'الترتيب: وردة، سيارة، كف، قمر. وبعدين «جرّبي الفتح».'],
    wrong: ['الدرج ما تحرّك.', 'سنوكي: «جرّبي كفّي بكل الخانات!» … لا.', 'رجعي شوفي الحايط بالظلام.'],
    success: 'تك! الدرج انفتح.',
    reward: ['flag:drawer-open'],
  },

  // Lost kitten: the tracks lesson at the sanctuary (cat prints have no
  // claw marks and four toes; husky prints show claws).
  'kitten-tracks': {
    type: 'choice',
    title: 'آثار صغيرة',
    goal: 'اختاري الأثر اللي يروح للقطوة الضايعة.',
    intro: 'جنب السياج أربع آثار بالطين. وحدة بس صغيرة ومدوّرة… وبدون مخالب.',
    config: {
      question: 'أي أثر هو أثر فيروز؟',
      options: [
        { id: 'husky', label: 'أثر كبير بمخالب', icon: 'paw', reply: 'سنوكي: «هذا أثري. أعرفه. هو أجمل أثر.»' },
        { id: 'bird', label: 'ثلاث خطوط رفيعة', icon: 'feather', reply: 'هذا أثر طير. فيروز ما تطير… بعد.' },
        { id: 'kitten', label: 'أثر صغير مدوّر بدون مخالب', icon: 'footprint' },
        { id: 'squirrel', label: 'أصابع طويلة رفيعة', icon: 'claw', reply: 'سنجاب. ومستعجل كالعادة.' },
      ],
      answer: 'kitten',
    },
    hints: ['تذكّري درس الآثار بالمحمية.', 'القطط تخبّي مخالبها وهي تمشي.', 'اختاري «أثر صغير مدوّر بدون مخالب».'],
    success: 'الآثار تروح ورا السياج… للمرج الخلفي.',
    reward: ['flag:kitten-tracks'],
  },

  'kitten-approach': {
    type: 'choice',
    title: 'فيروز خايفة',
    goal: 'اختاري أحسن طريقة تقربين بيها من قطوة خايفة.',
    intro: 'فيروز فوق الغصن، ترجف. إذا تخوّفت أكثر، تصعد أعلى.',
    config: {
      question: 'شتسوين؟',
      options: [
        { id: 'grab', label: 'أركض وأمسكها بسرعة', icon: 'claw', reply: 'فيروز صعدت غصن ثاني. الركض يخوّف.' },
        { id: 'bark', label: 'خلّي سنوكي ينبح يناديها', icon: 'paw', reply: 'سنوكي: «هاو!» … فيروز: «لا.» صعدت أعلى.' },
        { id: 'calm', label: 'أگعد واطية، أحچي بهدوء، وأمد إيدي ببطء', icon: 'heart' },
        { id: 'loud', label: 'أصفّق حتى تنزل', icon: 'note', reply: 'التصفيق خوّفها. جرّبي شي أهدأ.' },
      ],
      answer: 'calm',
    },
    hints: ['القطط الخايفة تحب الهدوء والحركات البطيئة.', 'لا ركض، لا صوت عالي.', 'اختاري «أگعد واطية، أحچي بهدوء…».'],
    success: 'فيروز نزلت خطوة… خطوة… وگعدت بحضنچ.',
    reward: ['flag:kitten-found', 'got:note.ryan.8'],
  },

  // Second Sky: Uncle Munther's star book shows each target shape; the
  // player joins the stars. Shapes: a paw, a car, a dumbbell ("a bone").
  'sky-paw': {
    type: 'connect',
    title: 'كوكبة الكف',
    goal: 'وصّلي النجوم حتى ترسمين الشكل اللي بكتاب العم منذر.',
    intro: 'المسي نجمة، بعدين نجمة ثانية حتى ينرسم خط بيناتهن. لمسة على الخط مرة ثانية تمسحه. الكتاب يگول: «كف صغير».',
    example: '<div class="cn-card">📖 الكتاب: <b>🐾</b> «كوكبة الكف»: أربع أصابع فوق، وكف مدوّر تحت.</div>',
    config: {
      points: [
        { x: 30, y: 25 }, { x: 45, y: 18 }, { x: 60, y: 18 }, { x: 75, y: 25 },
        { x: 38, y: 55 }, { x: 52, y: 48 }, { x: 66, y: 55 }, { x: 52, y: 75 },
      ],
      edges: [[4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 5], [3, 6]],
    },
    hints: ['ابدي بالكف المدوّر: النجوم الأربعة اللي تحت.', 'سوّي مربع (معيّن) من النجوم الأربعة التحتانية.', 'بعدين وصّلي كل نجمة فوگ لأقرب نجمة بالكف: الطرفين للزوايا، والنص للنجمة الفوقانية بالكف.'],
    success: 'العم منذر: «كف! …كف منو؟» سنوكي: «كفّي طبعاً.»',
    reward: ['flag:sky-1'],
  },
  'sky-car': {
    type: 'connect',
    title: 'كوكبة السيارة',
    goal: 'وصّلي النجوم حتى ترسمين السيارة اللي بالكتاب.',
    intro: 'نفس الطريقة. الكتاب يگول: «عربة سريعة، واطية، وإلها عجلتين».',
    example: '<div class="cn-card">📖 الكتاب: <b>🚗</b> «كوكبة العربة»: سقف واطي، وجسم طويل، وعجلتين.</div>',
    config: {
      points: [
        { x: 12, y: 60 }, { x: 30, y: 44 }, { x: 58, y: 40 }, { x: 74, y: 52 }, { x: 90, y: 58 },
        { x: 88, y: 70 }, { x: 14, y: 70 }, { x: 30, y: 74 }, { x: 72, y: 74 },
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [7, 6], [8, 5]],
    },
    hints: ['ارسمي جسم السيارة أول: خط يدور على النجوم البرّانية.', 'من اليسار: لفوق للسقف، على السقف، وانزلي لقدّام، وارجعي من تحت.', 'العجلتين: كل نجمة تحتانية تنربط بأقرب زاوية تحت.'],
    success: 'سيارة! العم منذر: «عربة الفضاء.» أنجي: «لا… هاي تشبه زفيرو.»',
    reward: ['flag:sky-2'],
  },
  'sky-bone': {
    type: 'connect',
    title: 'كوكبة «العظمة»',
    goal: 'وصّلي النجوم حتى ترسمين الشكل اللي بالكتاب.',
    intro: 'العم منذر متأكد إنها عظمة. سنوكي متحمس جداً. الكتاب يگول: «قضيب، وبكل طرف ثقل مدوّر».',
    example: '<div class="cn-card">📖 الكتاب: «قضيب بالنص، وبكل طرف دائرتين». (العم منذر كاتب جنبها: عظمة؟)</div>',
    config: {
      points: [
        { x: 15, y: 35 }, { x: 25, y: 35 }, { x: 15, y: 65 }, { x: 25, y: 65 },
        { x: 75, y: 35 }, { x: 85, y: 35 }, { x: 75, y: 65 }, { x: 85, y: 65 },
        { x: 25, y: 50 }, { x: 75, y: 50 },
      ],
      edges: [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [8, 9]],
    },
    hints: ['ابدي بالطرفين: كل طرف بيه أربع نجوم.', 'سوّي مربع من كل أربع نجوم بكل طرف.', 'آخر خط: وصّلي النجمتين اللي بالنص بخط طويل.'],
    success: 'أنجي: «هذا مو عظمة. هذا دمبل.» العم منذر: «…دمبل فضائي.» سنوكي: «حزين بس متقبّل.»',
    reward: ['flag:sky-3'],
  },

  // Robo-Snooki: three tiny programs (forward / turn left / turn right).
  'robo-code': {
    type: 'program',
    title: 'برمجة روبو-سنوكي',
    goal: 'رتّبي أوامر حتى يوصل الروبوت للعظمة 🦴.',
    intro: '«⬆ قدّام» = خطوة وحدة بالاتجاه اللي يباوع عليه. «↶» و«↷» يلف بمكانه. رتّبي الأوامر وبعدين «شغّلي».',
    config: {
      stages: [
        { grid: ['....B'], start: { x: 0, y: 0, dir: 0 }, max: 6 },
        { grid: ['..#', '..B'], start: { x: 0, y: 0, dir: 0 }, max: 6 },
        { grid: ['...#.', '.#...', '.#.#B', '...#.'], start: { x: 0, y: 3, dir: 3 }, max: 12 },
      ],
    },
    hints: ['الروبوت يباوع للسهم الصغير. «قدّام» يمشيه خطوة بهالاتجاه.', 'إذا الصندوق 📦 بالطريق، لفّي قبل ما توصلين له.', 'عدّي الخطوات للعظمة، وحطّي «↷/↶» بالمكان اللي لازم يلف بيه.'],
    wrong: [],
    success: 'روبو-سنوكي وصل! «بيب بيب… هاو؟»',
    reward: ['flag:robo-coded'],
  },

  // V3: games-room activities and pranks
  ...PUZZLES_V3,

  // Story Pack 01 «الطرق اللي تتذكر»
  ...PUZZLES_SP1,

  // Story Pack 02 «أرشيف الأسرار» (main story, Acts V–VI)
  ...PUZZLES_SP2,

  // Phase 04 «الحديقة العميقة» (Act VII, before the hidden garden)
  ...PUZZLES_DEEP,
  ...PUZZLES_TEAM,
};
