/**
 * Story Pack 01 puzzles. Each one reuses an existing rule type (rules.js),
 * so the hint ladder, «شوفي الحل», skip and the solver tests come for free.
 *
 *   sp1-cipher       Garden Cipher (cipher)   — pattern + deduction; the three clues are in the world
 *   sp1-lost-ball    The Lost Path (program)  — plan a route; algorithmic thinking
 *   sp1-build-steps  The Sequence Machine (arrange) — order the steps of building something useful
 */
export const PUZZLES_SP1 = {
  'sp1-cipher': {
    type: 'cipher',
    title: 'شفرة الصندوق',
    goal: 'حطّي حرف لكل رمز حتى ينفتح الصندوق.',
    // clues: 🌹 = و (tree carving, roads), 💙 = د (flower pot, rose clinic),
    // 🌙 = «أول حرف من عيد» (note on the high branch / fetched by the husky)
    intro: 'ثلاث رموز على القفل. الأدلة اللي لگيتيها تگول شنو يعني كل رمز… والقمر يحتاج تفكير صغير.',
    config: {
      word: ['و', 'ع', 'د'],
      glyphs: ['sym:rose', 'sym:moon-crescent', 'sym:heart'],
      key: [['sym:rose', 'و'], ['sym:heart', 'د']],
      // the key's letters (و, د) are on the pad too: she places them herself, as the key says
      letters: ['د', 'ع', 'ن', 'و', 'غ', 'ر', 'س', 'ل'],
    },
    hints: [
      'الوردة والقلب مكتوبين بالمفتاح. بقى القمر.',
      'ورقة الغصن تگول: القمر بالنص… وهو أول حرف من «عيد».',
      'الوردة والقلب معروفين من المفتاح. القمر يحتاج الدليل الثالث: شنو أول حرف بالكلمة اللي يذكرها؟',
    ],
    wrong: ['القفل ما تحرك. رجعي للأدلة: كل رمز إله حرف واحد.', 'مو هيچ. اقرئي ورقة الغصن مرة ثانية.'],
    success: 'وعد. ✨ — كل رمز چان حرف، والأدلة چانت مفتاح الشفرة. هيچ تنحل أغلب الألغاز: نمط صغير، ودليل، وتفكير.',
    reward: ['flag:sp1-gift-open', 'got:keepsake.roads.2', 'journal:sp1-promise'],
  },

  'sp1-lost-ball': {
    type: 'program',
    title: 'الطابة الضايعة',
    goal: 'رتّبي أوامر حتى توصل {husky} لطابتها 🎾.',
    intro: '«⬆ قدّام» = خطوة وحدة بالاتجاه اللي تباوع عليه {husky}. «↶» و«↷» تلف بمكانها. الشجر 🌳 ما ينعبر. خططي الطريق كله، وبعدين «شغّلي».',
    config: {
      look: { actor: '🐾', goal: '🎾', wall: '🌳', label: 'الشبكة: الهاسكي 🐾 والطابة 🎾 والشجر 🌳' },
      messages: {
        crash: 'دنگ! خشمها دگ بالشجرة. (هي بخير، بس زعلت.) شيلي الأمر الغلط وجرّبي.',
        short: 'وگفت بنص الطريق تباوعلچ. تحتاج أوامر أكثر (أو غير).',
        next: 'لگت الطابة! بس سنوكي ذبها مرة ثانية… المستوى {n} من {of}.',
      },
      stages: [
        { grid: ['...B'], start: { x: 0, y: 0, dir: 0 }, max: 5 },
        { grid: ['.#B', '...'], start: { x: 0, y: 0, dir: 0 }, max: 8 },
        { grid: ['..#B', '.#..', '....'], start: { x: 0, y: 2, dir: 3 }, max: 10 },
      ],
    },
    hints: [
      'السهم الصغير يراوي وين تباوع. «قدّام» يمشيها خطوة بهالاتجاه بس.',
      'إذا شجرة بالطريق، لفّي قبلها. جربي ترسمين الطريق بإصبعچ على الشبكة أول.',
      'عدّي المربعات للطابة، وحطّي «↷/↶» بكل زاوية لازم تلف بيها.',
    ],
    wrong: [],
    success: 'وصلت! ✨ — اللي سوّيتيه اسمه «خوارزمية»: خطوات مرتبة توصل لهدف. نفس الشي اللي يكتبه المبرمج، بس بلغة الكمبيوتر.',
    reward: ['flag:sp1-ball-found', 'got:keepsake.roseclinic.2'],
  },

  'sp1-build-steps': {
    type: 'arrange',
    title: 'ماكنة الأفكار',
    goal: 'رتّبي خطوات بناء شي مفيد، من الفكرة لحد ما يوصل للناس.',
    intro: 'ماكنة صغيرة على ميز ريان وقفت لأن خطواتها متلخبطة. كل خطوة إلها مكان. شنو يجي أول… وشنو لازم يجي قبل ما يوصل للناس؟',
    config: {
      slots: [
        { id: 's1', label: '١', accepts: ['idea'] },
        { id: 's2', label: '٢', accepts: ['sketch'] },
        { id: 's3', label: '٣', accepts: ['code'] },
        { id: 's4', label: '٤', accepts: ['test'] },
        { id: 's5', label: '٥', accepts: ['share'] },
      ],
      pieces: [
        { id: 'code', label: 'سطور كود', icon: 'robot' },
        { id: 'share', label: 'يوصل للناس', icon: 'heart' },
        { id: 'idea', label: 'فكرة صغيرة', icon: 'sun' },
        { id: 'test', label: 'تجربة وتصليح', icon: 'key' },
        { id: 'sketch', label: 'رسمة للشاشة', icon: 'note' },
      ],
      checkLabel: 'شغّلي الماكنة ✓',
    },
    hints: ['كل شي يبدي بفكرة صغيرة.', 'قبل الكود نرسم شلون راح يبين. وقبل ما يوصل للناس… لازم ينجرّب.', 'اسألي لكل خطوة: شنو لازم يكون جاهز قبلها؟ الخطوة اللي ما تحتاج شي قبلها هي الأولى.'],
    wrong: ['الماكنة كحّت دخان صغير. بعض الخطوات مو بمكانها.'],
    success: 'الماكنة اشتغلت! ✨ — الترتيب مهم: الفكرة تصير رسمة، الرسمة تصير كود، والتجربة تصلّح الأخطاء قبل ما يوصل للناس. وإذا طلع خطأ؟ نرجع خطوة ونكمل.',
    reward: ['flag:sp1-steps-done', 'journal:sp1-workshop'],
  },
};
