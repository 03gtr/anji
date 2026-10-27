/**
 * Clue-quiz content. Every answer is explained after a correct pick, so the
 * player learns the reasoning (and it feeds the deduction board later).
 */
const ANIMALS = (answer, extra = {}) =>
  [
    { id: 'husky', label: 'هاسكي', icon: 'paw', reply: extra.husky },
    { id: 'peacock', label: 'طاووس', icon: 'feather', reply: extra.peacock },
    { id: 'squirrel', label: 'سنجاب', icon: 'claw', reply: extra.squirrel },
    { id: 'deer', label: 'غزال', icon: 'hoof', reply: extra.deer },
  ].map((o) => ({ ...o, reply: o.reply || (o.id === answer ? undefined : 'لا… شوفي الشكل مرة ثانية.') }));

export const QUIZ_SETS = {
  // V2 «امتحان المحقق»: questions about clues found during the story
  exam: {
    intro: 'امتحان سنوكي النهائي: ست أسئلة عن أدلة الرحلة. الدفتر يساعد… بس سنوكي يراقب.',
    doneTitle: 'محققة معتمدة! 🎓',
    rounds: [
      {
        icon: 'moon-half',
        clue: 'ساعة الممر بالبيت واقفة على أي وقت؟',
        options: [
          { id: 'a', label: '٦:٣٠', icon: 'moon-new', reply: 'سنوكي: «لا. هذا وقت الفطور. أعرفه زين.»' },
          { id: 'b', label: '٢:٣٠', icon: 'moon-half' },
          { id: 'c', label: '١٢:٠٠', icon: 'moon-full', reply: 'سنوكي: «الساعة ١٢ هي وقت البسكويت. مو الساعة.»' },
          { id: 'd', label: '٩:٠٠', icon: 'sun', reply: 'لا. رجعي للممر.' },
        ],
        answer: 'b',
        explain: 'ثنتين ونص. «كأن صاحب البيت چان ينتظر أحد».',
      },
      {
        icon: 'paw',
        clue: 'منو أخذ قطعة الخريطة الثانية من جنطتچ؟',
        options: [
          { id: 'sultan', label: 'السلطان', icon: 'feather', reply: 'السلطان عنده حجة: چان يتصوّر ويّا القمر.' },
          { id: 'snooki', label: 'سنوكي', icon: 'paw' },
          { id: 'needle', label: 'الممرضة إبرة', icon: 'stethoscope', reply: 'هي تريد تطعيم، مو خرايط.' },
          { id: 'squirrels', label: 'السناجب', icon: 'claw', reply: 'السناجب بريئة. هالمرة.' },
        ],
        answer: 'snooki',
        explain: 'سنوكي… بتعليمات من ريان. سنوكي يگول: «سؤال ظالم.»',
      },
      {
        icon: 'mark',
        clue: 'ختم الصانع: وردة ساقها حرف R… والورقة اللي جنب الساق شنو؟',
        options: [
          { id: 'leaf', label: 'ورقة عادية', icon: 'leaf', reply: 'باوعي مرة ثانية بالتلسكوب.' },
          { id: 'a', label: 'حرف A', icon: 'heart' },
          { id: 'star', label: 'نجمة', icon: 'star', reply: 'قريبة… بس لا.' },
          { id: 'paw', label: 'كف سنوكي', icon: 'paw', reply: 'سنوكي: «يا ريت.»' },
        ],
        answer: 'a',
        explain: 'حرف A. الختم مو بس R.',
      },
      {
        icon: 'moon-full',
        clue: 'ورود القمر تتفتح بأي ترتيب؟',
        options: [
          { id: 'a', label: 'من البدر للمظلم', icon: 'moon-full', reply: 'بالمقلوب! مثل نصيحة سنوكي.' },
          { id: 'b', label: 'من المظلم للبدر', icon: 'moon-new' },
          { id: 'c', label: 'عشوائي', icon: 'star', reply: 'الحديقة ما تحب العشوائية.' },
        ],
        answer: 'b',
        explain: '«من الظلام إلى النور الكامل».',
      },
      {
        icon: 'rose',
        clue: 'أي لون اختاره الصانع لكل شي يهمّه؟',
        options: [
          { id: 'red', label: 'أحمر', icon: 'rose-red', reply: '«الأحمر للعجلة، لا للقلب.»' },
          { id: 'blue', label: 'أزرق', icon: 'rose' },
          { id: 'gold', label: 'ذهبي', icon: 'rose-gold', reply: '«الذهب يلمع، لكنه لا يُزهر.»' },
        ],
        answer: 'blue',
        explain: 'الأزرق. بكل مكان.',
      },
      {
        icon: 'paw',
        clue: 'آخر سؤال، وأهم سؤال: منو أفضل محقق بالحديقة؟',
        options: [
          { id: 'snooki', label: 'سنوكي', icon: 'paw', reply: 'سنوكي: «صح! …لا، لحظة. الجواب الصحيح مكتوب غير هيچ. مع الأسف.»' },
          { id: 'anji', label: 'أنجي', icon: 'heart' },
          { id: 'munther', label: 'العم منذر', icon: 'star', reply: 'العم منذر يحقق بالنجوم، مو بالجرايم.' },
        ],
        answer: 'anji',
        explain: 'سنوكي: «…صح. بس آني الثاني. اكتبيها.»',
      },
    ],
  },

  tracks: {
    intro: 'آثار بطين المحمية. كل أثر يحچي قصة. منو مرّ من هنا؟',
    doneTitle: 'قارئة آثار محترفة! 🐾',
    rounds: [
      {
        icon: 'hoof',
        clue: 'أثر نصّين متقابلين، مثل قلب مقلوب، وغاطس بالطين.',
        options: ANIMALS('deer', { husky: 'الكلاب ما عدها حوافر. حتى سنوكي، رغم ادعاءاته.' }),
        answer: 'deer',
        explain: 'حافر مشقوق: غزال المحمية. مر يشرب من البركة.',
      },
      {
        icon: 'bird',
        clue: 'ثلاث أصابع لگدّام وواحد لورا، وريشة زرقاء خضراء قريبة.',
        options: ANIMALS('peacock', { squirrel: 'السناجب ما تمشي على أصابع طويلة هيچ.' }),
        answer: 'peacock',
        explain: 'أثر طير كبير وريشة بعيون ذهبية: السلطان الطاووس.',
      },
      {
        icon: 'claw',
        clue: 'آثار صغيرة بأصابع رفيعة، وحواليها قشور جوز مكسور.',
        options: ANIMALS('squirrel', { peacock: 'الطاووس ما ياكل جوز. يگول هو «أكل فقراء».' }),
        answer: 'squirrel',
        explain: 'مخالب صغيرة وقشور جوز: عصابة السناجب.',
      },
      {
        icon: 'paw',
        clue: 'أربع أصابع وكف مدوّر… وشعر أبيض ناعم لازگ بالطين.',
        options: ANIMALS('husky', { deer: 'الغزال ما عنده كف مدوّر.', squirrel: 'كبير وايد على سنجاب.' }),
        answer: 'husky',
        explain: 'كف كلب كبير وفرو أبيض: هاسكي. وما أعرف بالحديقة غير هاسكي واحد…',
      },
      {
        icon: 'paw',
        clue: 'والآثار اللي جنب جنطتچ، يوم اختفت الخريطة: نفس الكف… ونفس الفرو الأبيض.',
        options: ANIMALS('husky', { squirrel: 'السناجب ما تشيل خرايط. تشيل جوز.', peacock: 'السلطان چان مشغول يتصوّر ويّا القمر طول الليل.' }),
        answer: 'husky',
        explain: 'الأدلة كلها تأشر على نفس الاتجاه. وسنوكي… صار يتجنب عيونچ.',
      },
    ],
  },
};
