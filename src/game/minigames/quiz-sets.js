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
