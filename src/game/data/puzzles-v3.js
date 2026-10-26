/**
 * V3 puzzles: the games room's activities (gentle, romantic) and the prank
 * board («مقالب ريان وسنوكي»). Same rules as every puzzle: a one-line goal,
 * hints that go gentle → thing → action, a solution, a skip, and every
 * reward applied once. Comedy targets Snooki's stubbornness and silly
 * situations — never Anji. No real-life details beyond what the owner gave.
 */
const ARROWS = ['↑', '→', '↓', '←'];

export const PUZZLES_V3 = {
  /* ── activities ──────────────────────────────────────────── */
  'deliver-clue': {
    type: 'choice',
    title: 'وين نحط الوردة؟',
    goal: 'اختاري أحسن مكان للوردة الزرقاء.',
    intro: 'ورقة صغيرة بخط ريان: «الورد الأزرق يحب ضوء القمر، ويزعل من الحرارة».',
    config: {
      question: 'وين توصل الوردة؟',
      options: [
        { id: 'window', label: 'الشباك اللي يجيه ضوء القمر', icon: 'moon-full' },
        { id: 'fire', label: 'جنب المدفأة', icon: 'sun', reply: 'سنوكي: «دافي ولطيف!» … الوردة: لا.' },
        { id: 'kitchen', label: 'بالمطبخ جنب الفرن', icon: 'apple', reply: 'حار وايد. الورقة گالت يزعل من الحرارة.' },
        { id: 'cupboard', label: 'بالكنتور المظلم', icon: 'moon-new', reply: 'ماكو ضوء قمر بالكنتور. حتى سنوكي يعرف.' },
      ],
      answer: 'window',
    },
    hints: ['اقرئي ورقة ريان مرة ثانية.', 'شي بارد، وبيه ضوء القمر.', 'اختاري «الشباك اللي يجيه ضوء القمر».'],
    success: 'المكان صحيح… بس منو يوصلها؟',
    reward: ['flag:deliver-place'],
  },
  'deliver-route': {
    type: 'program',
    title: 'سنوكي يوصّل الوردة',
    goal: 'برمجي طريق سنوكي حتى يوصّل الوردة للشباك 🦴.',
    intro: 'سنوكي أصرّ يشيل الوردة بحلگه. «آني أسرع». المشكلة: يوقف عند كل صندوق يشمه. رتّبي أوامره.',
    config: {
      stages: [
        { grid: ['...B'], start: { x: 0, y: 0, dir: 0 }, max: 5 },
        { grid: ['.#B', '...'], start: { x: 0, y: 0, dir: 1 }, max: 8 },
      ],
    },
    hints: ['«قدّام» خطوة وحدة بالاتجاه اللي يباوع عليه.', 'إذا الصندوق بالطريق، دوري حواليه من تحت.', 'المستوى الثاني: قدّام، يسار، قدّام، قدّام، يسار، قدّام.'],
    success: 'وصلت الوردة! …مع شوية لعاب سنوكي. بس وصلت.',
    reward: ['flag:deliver-done', 'journal:delivery'],
  },
  'chocolate-box': {
    type: 'arrange',
    title: 'علبة الشوكولاتة',
    goal: 'رتّبي الشوكولاتة حسب البطاقة.',
    intro: 'بطاقة على العلبة: «الذهبية بالنص، والزرقاء بالزوايا الأربعة، والبيضاء بالباقي.»',
    config: {
      grid: 3,
      slots: Array.from({ length: 9 }, (_, i) => {
        const corner = [0, 2, 6, 8].includes(i);
        return { id: `c${i}`, label: '', accepts: i === 4 ? ['g1'] : corner ? ['b1', 'b2', 'b3', 'b4'] : ['w1', 'w2', 'w3', 'w4'] };
      }),
      pieces: [
        ...[1, 2, 3, 4].map((n) => ({ id: `b${n}`, label: 'زرقاء', icon: 'rose' })),
        ...[1, 2, 3, 4].map((n) => ({ id: `w${n}`, label: 'بيضاء', icon: 'moon-full' })),
        { id: 'g1', label: 'ذهبية', icon: 'crown' },
      ],
      checkLabel: 'سكّري العلبة ✓',
    },
    hints: ['ابدي بالذهبية: هي وحدة بس.', 'الزوايا: فوق يمين، فوق يسار، تحت يمين، تحت يسار.', 'الذهبية بالمربع الوسطاني، الزرقاء بالزوايا، والبيضاء بالأربع اللي بقت.'],
    wrong: ['سنوكي: «بعضها مو بمكانه. وحدة… ممكن أكلتها. لا. ما أكلتها.»'],
    success: 'العلبة مرتبة. وبين الشوكولاتة… ورقة صغيرة.',
    reward: ['flag:chocolates-done', 'unlock:cardback-gold', 'journal:chocolates'],
  },
  picnic: {
    type: 'arrange',
    title: 'سلّة النزهة',
    goal: 'حطّي كل شي بمكانه بسلّة النزهة.',
    intro: 'نزهة صغيرة بالحديقة. خمس أماكن بالسلّة، وكل مكان إله شي واحد. (سنوكي حط أشياء ما إلها علاقة.)',
    memoryObjects: true,
    config: {
      slots: [
        { id: 'sweet', label: 'مفاجأة حلوة', accepts: ['sweets'] },
        { id: 'home', label: 'أكل من البيت', accepts: ['homefood'] },
        { id: 'flower', label: 'وردة', accepts: ['blue-rose'] },
        { id: 'drink', label: 'شي دافي', accepts: ['warm-drink'] },
        { id: 'note', label: 'ورقة صغيرة', accepts: ['note'] },
      ],
      pieces: [
        { id: 'sweets', label: 'علبة حلويات', icon: 'candy' },
        { id: 'homefood', label: 'أكل بيتي', icon: 'apple' },
        { id: 'blue-rose', label: 'وردة زرقاء', icon: 'rose' },
        { id: 'warm-drink', label: 'قهوة دافية', icon: 'coffee' },
        { id: 'note', label: 'ورقة مطوية', icon: 'note' },
        { id: 'umbrella', label: 'مظلة سنوكي', icon: 'drop' },
        { id: 'ball', label: 'طابة سنوكي', icon: 'paw' },
      ],
      checkLabel: 'السلّة جاهزة ✓',
    },
    hints: ['كل مكان مكتوب عليه شنو يحتاج.', 'المظلة والطابة مو للسلّة: هاي أشياء سنوكي.', 'حلويات، أكل بيتي، وردة زرقاء، قهوة، ورقة — كل وحدة بمكانها.'],
    wrong: ['سنوكي: «الطابة ضرورية! …لا؟ زين.»'],
    success: 'السلّة جاهزة. حتى سنوكي ما اعترض… كثير.',
    reward: ['flag:picnic-done', 'journal:picnic'],
  },
  'waiting-clock': {
    type: 'clock',
    title: 'ساعة الانتظار',
    goal: 'حطّي الساعة على الوقت اللي ريان يكون بيه ناطر… تقريباً.',
    intro: 'ساعة صغيرة بغرفة الألعاب، مثل ساعة الممر. مكتوب تحتها: «الوقت يتغير شوية كل يوم. المهم الانتظار الحلو، مو الدقيقة.»',
    config: { target: [2, 30], tolerance: 15, step: 5, start: [12, 0] },
    hints: ['تذكّري ساعة الممر بالبيت.', 'ثنتين ونص — وأي وقت قريب منها ينحسب.', 'الساعات على ٢، والدقايق بين ١٥ و٤٥.'],
    wrong: ['مو هذا الوقت. باوعي على ساعة الممر بالبيت.', 'قريب؟ لا، بعيد شوية.'],
    success: 'ثنتين ونص… تقريباً. الوقت يتغير، بس الانتظار الحلو ما يتغير.',
    reward: ['flag:waiting-clock-done', 'journal:waiting-clock'],
  },

  /* ── pranks (مقالب ريان وسنوكي) ─────────────────────────── */
  'treasure-lock': {
    type: 'lock',
    title: 'صندوق الكنز',
    goal: 'افتحي الصندوق بالرموز اللي بالخريطة.',
    intro: 'خريطة كنز (بخط سنوكي): «الرموز: كف، عظمة، كف، نجمة». الصندوق بقفل أربع خانات.',
    config: { symbols: ['sym:star', 'sym:paw', 'sym:bone', 'sym:rose'], start: [0, 0, 0, 0], answer: [1, 2, 1, 0], dialLabels: ['١', '٢', '٣', '٤'] },
    hints: ['الخريطة تگول الترتيب.', 'كف، عظمة، كف، نجمة.', 'الخانات: 🐾 🦴 🐾 ⭐ ثم «جرّبي الفتح».'],
    wrong: ['الصندوق ما انفتح. سنوكي يصفّر ببراءة.'],
    success: 'انفتح! وبداخله… ورقة: «الكنز الحقيقي هو الأصدقاء اللي سوّينا بالطريق. — سنوكي 🐾»',
    reward: ['flag:prank-treasure-1'],
  },
  'treasure-latch': {
    type: 'choice',
    title: 'الصندوق… بيه شي ثاني؟',
    goal: 'لگي القفل المخفي بالصندوق.',
    intro: 'الصندوق أثقل من ورقة وحدة. أكو صوت شي يتحرك جوّا.',
    config: {
      question: 'وين القفل المخفي؟',
      options: [
        { id: 'bottom', label: 'قاع الصندوق: لوح يتحرك', icon: 'key' },
        { id: 'lid', label: 'الغطاء من برّا', icon: 'star', reply: 'الغطاء عادي. بس سنوكي رسم عليه وجه.' },
        { id: 'side', label: 'الجنب اليمين', icon: 'paw', reply: 'آثار عضّ. بس ماكو قفل.' },
      ],
      answer: 'bottom',
    },
    hints: ['الصوت جاي من تحت.', 'القاع أعمق من اللازم.', 'اختاري «قاع الصندوق».'],
    success: 'القاع انفتح! تحته: ظهر ورق جديد للعب، ونجمة صغيرة.',
    reward: ['flag:prank-treasure', 'unlock:cardback-stars', 'journal:prank-treasure'],
  },
  signposts: {
    type: 'lock',
    title: 'اللوحات المگلوبة',
    goal: 'رجّعي كل لوحة تأشر على مكانها الصح.',
    intro: 'سنوكي «نظّف» لوحات الطريق ورجّعها بالمگلوب. حسب الخريطة: البيت فوگ، البحيرة يمين، المرصد يسار، والكراج جوّا.',
    example: '<div class="map-mini" aria-label="خريطة: البيت فوق، البحيرة يمين، المرصد يسار، الكراج تحت"><span>البيت ↑</span><span>المرصد ← ✦ → البحيرة</span><span>الكراج ↓</span></div>',
    config: { symbols: ARROWS, start: [2, 3, 0, 1], answer: [0, 1, 3, 2], dialLabels: ['البيت', 'البحيرة', 'المرصد', 'الكراج'] },
    hints: ['باوعي على الخريطة الصغيرة فوق.', 'كل لوحة تأشر لاتجاه مكانها.', 'البيت ↑، البحيرة →، المرصد ←، الكراج ↓.'],
    wrong: ['سنوكي: «الحديقة تحب التغيير!» … لا. رجّعيها.'],
    success: 'اللوحات رجعت. سنوكي يگول كان «يختبر حس الاتجاه».',
    reward: ['flag:prank-signs', 'journal:prank-signs'],
  },
  'decoy-boxes': {
    type: 'choice',
    title: 'علب سنوكي',
    goal: 'اختاري العلبة اللي بيها الشوكولاتة الحقيقية.',
    intro: 'ثلاث علب. على كل وحدة جملة، وسنوكي يحلف إن جملة وحدة بس صحيحة. ١: «الشوكولاتة هنا». ٢: «الشوكولاتة مو هنا». ٣: «الشوكولاتة مو بالعلبة ١».',
    config: {
      question: 'وين الشوكولاتة؟',
      options: [
        { id: 'b1', label: 'العلبة ١', icon: 'note', reply: 'لو بالعلبة ١، كانت ١ و٢ صحيحتين. جملة وحدة بس صحيحة.' },
        { id: 'b2', label: 'العلبة ٢', icon: 'note' },
        { id: 'b3', label: 'العلبة ٣', icon: 'note', reply: 'لو بالعلبة ٣، كانت ٢ و٣ صحيحتين.' },
      ],
      answer: 'b2',
    },
    hints: ['جرّبي كل علبة: إذا الشوكولاتة بيها، كم جملة تصير صحيحة؟', 'لازم جملة وحدة بس تكون صحيحة.', 'إذا بالعلبة ٢: بس جملة ٣ صحيحة. هذا الجواب.'],
    success: 'العلبة ٢! بيها شوكولاتة حقيقية (وورقة: «لا تشاركين سنوكي»).',
    reward: ['flag:prank-decoy', 'journal:prank-decoy'],
  },
  'error-404': {
    type: 'code',
    title: 'خطأ ٤٠٤',
    goal: 'صلّحي الكود حتى ترجع أضواء الحديقة.',
    intro: 'لابتوب ريان يطلع: «ERROR 404: Snooki\'s dignity not found». والأضواء طافية. ريان كاتب الكود بسرعة… وسنوكي داس على الكيبورد.',
    config: {
      file: 'lights.js',
      lines: ['// إصلاح سريع (ريان)', 'const lights = garden.find("{0}");', 'lights.{1}();', 'snooki.dignity = {2};'],
      slots: [
        { options: ['bones', 'lanterns', 'socks'], answer: 1 },
        { options: ['sleep', 'turnOn', 'bark'], answer: 1 },
        { options: ['null', 'undefined', 'true'], answer: 2 },
      ],
    },
    hints: ['كل سطر بيه كلمة غلط.', 'الحديقة تحتاج «فوانيس» وتحتاج «تشتغل». وكرامة سنوكي… خلّيها موجودة.', 'lanterns، turnOn، true — وبعدين شغّلي.'],
    success: '✓ الأضواء رجعت. «Snooki\'s dignity: found (tentatively)».',
    reward: ['flag:prank-404', 'journal:prank-404'],
  },
  'wake-snooki': {
    type: 'sequence',
    title: 'الحارس النايم',
    goal: 'صحّي سنوكي بلطف، بالترتيب الصح.',
    intro: 'سنوكي «يحرس» الباب… ونايم. ورقة على الباب بخط ريان: «يصحى بهدوء: أول صوت هادي، بعدين ريحة أكل، بعدين لمسة على راسه.»',
    config: {
      items: [
        { id: 'pat', label: 'لمسة على راسه', icon: 'heart' },
        { id: 'whisper', label: 'همسة «سنوكي»', icon: 'note' },
        { id: 'treat', label: 'كيس البسكويت', icon: 'bone' },
      ],
      answer: ['whisper', 'treat', 'pat'],
    },
    hints: ['الورقة على الباب تگول الترتيب.', 'أول شي صوت، آخر شي لمسة.', 'همسة، بعدين البسكويت، بعدين اللمسة.'],
    wrong: ['سنوكي يتقلب وينام أعمق. بلطف أكثر.'],
    success: 'سنوكي صحى: «آني ما چنت نايم. چنت أراقب بعيوني مسكّرة.»',
    reward: ['flag:prank-guard', 'unlock:snooki-hat-jester', 'journal:prank-guard'],
  },
  'shadow-treasure': {
    type: 'choice',
    title: 'الكنز اللي ما يبين',
    goal: 'لگي الشي اللي ظلّه ما يشبهه.',
    intro: 'سنوكي يگول خبّى «كنز غير مرئي». المصباح يرسم ظلال أربع أشياء على الحايط… وظل واحد غريب.',
    config: {
      question: 'أي ظل مو مال صاحبه؟',
      options: [
        { id: 'vase', label: 'المزهرية: ظلها مزهرية', icon: 'rose', reply: 'ظل صحيح.' },
        { id: 'cup', label: 'الكوب: ظله كوب', icon: 'coffee', reply: 'ظل صحيح.' },
        { id: 'box', label: 'الصندوق: ظله… عظمة', icon: 'bone' },
        { id: 'lamp', label: 'المصباح: ظله مصباح', icon: 'sun', reply: 'ظل صحيح.' },
      ],
      answer: 'box',
    },
    hints: ['قارني كل شي بظله.', 'واحد من الظلال شكله شي يحبه سنوكي.', 'الصندوق اللي ظله عظمة.'],
    success: 'وراه الصندوق… عظمة سنوكي المخفية، وظهر ورق بنقشة كفوف.',
    reward: ['flag:prank-shadow', 'unlock:cardback-paws', 'journal:prank-shadow'],
  },
  pawprints: {
    type: 'connect',
    title: 'لغز آثار الكفوف',
    goal: 'وصّلي آثار الكفوف حتى تلگين مخبأ سنوكي.',
    intro: 'الأرضية نظيفة… إلا من آثار كفوف بكل مكان. سنوكي: «مو آني». المسي الآثار بالترتيب من الباب للمخبأ.',
    config: {
      points: [
        { x: 10, y: 85 }, { x: 25, y: 70 }, { x: 40, y: 78 }, { x: 55, y: 60 }, { x: 45, y: 40 }, { x: 65, y: 30 }, { x: 85, y: 18 },
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
    },
    hints: ['الآثار تبدي من الباب (تحت يسار).', 'كل أثر يوصل للأثر اللي بعده: أقرب واحد بالاتجاه.', 'وصّلي النجوم بالترتيب ١→٢→٣… لحد الزاوية فوق يمين.'],
    success: 'المخبأ! بيه: جورب، فيونكة، ورقة لعب، وكتاب العم منذر. سنوكي: «…صدفة.»',
    reward: ['flag:prank-paws', 'journal:prank-paws'],
  },
  'surprise-box': {
    type: 'cipher',
    title: 'الطرد المفاجئ',
    goal: 'فكّي رسالة الطرد.',
    intro: 'طرد صغير على الباب، عليه ثلاث رموز. بطاقة صغيرة تعطي مفتاحين.',
    config: {
      word: ['ح', 'ل', 'و'],
      glyphs: ['sym:heart', 'sym:moon-crescent', 'sym:rose'],
      given: { 0: 'ح' },
      key: [['sym:heart', 'ح'], ['sym:rose', 'و']],
      letters: ['ل', 'م', 'ب', 'و', 'ر'],
    },
    hints: ['المفتاح يعطيچ أول حرف وآخر حرف.', 'الكلمة شي ينوكل… أو شي ينگال.', 'ح، ل، و.'],
    wrong: ['مو هاي الكلمة. شي حلو.'],
    success: '«حلو». بالطرد: حلويات، وورقة: «لأن الأيام تحتاج شي حلو.»',
    reward: ['flag:prank-delivery', 'journal:prank-delivery'],
  },
  'expert-mode': {
    type: 'candles',
    title: 'وضع الخبراء (حسب سنوكي)',
    goal: 'شعّلي الشموع… «الصعبة جداً».',
    intro: 'سنوكي: «هذا اللغز يحتاج خبرة خارقة. أنا بنفسي ما حليته. …ما جرّبت، بس أكيد صعب.»',
    config: { stages: [{ layout: 'row', size: 3, presses: [1] }] },
    hints: ['اللمسة تقلب الشمعة وجاراتها.', 'كلها طافية. شمعة وحدة بالنص تكفي.', 'المسي الشمعة الوسطى.'],
    wrong: [],
    success: 'لمسة وحدة. سنوكي: «…هذا وضع الخبراء للمبتدئين. اكو وضع أصعب. ما موجود.»',
    reward: ['flag:prank-expert', 'journal:prank-expert'],
  },
};
