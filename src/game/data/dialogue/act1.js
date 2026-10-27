/**
 * ACT I — الحديقة الضائعة (The Lost Garden)
 * Fictional story content. Speakers: anji, snooki, needle, gate, phone, sign, note.
 * Expressions — Anji: neutral smile laugh surprised thinking skeptical soft worried determined smirk
 *               Snooki: happy smug confused shocked dramatic sniff proud guilty serious
 */
export const ACT1 = {
  'a1.wake': [
    { s: 'anji', e: 'thinking', t: 'وين آني؟' },
    { s: 'anji', e: 'thinking', t: 'آخر شي أتذكره… چنت راجعة من الدوام، تعبانة، وگلت أغمّض عيوني دقيقة وحدة.' },
    { s: 'anji', e: 'skeptical', t: 'هاي ما چانت دقيقة.' },
    { s: 'anji', e: 'smirk', t: 'حديقة غريبة، ليل، ورد أزرق يلمع، وماكو أحد. خوش بداية لفلم رعب.' },
    { s: 'anji', e: 'determined', t: 'زين. البطلة الذكية تتحرك قبل ما يبدي الفلم. يلا أنجي.' },
  ],

  'a1.gate-back': [
    { s: 'anji', e: 'skeptical', t: 'مقفولة. والقفل ما بيه حتى فتحة مفتاح… بس رمز وردة.' },
    { if: 'flag:met-snooki', s: 'snooki', e: 'smug', t: 'هاي البوابة اللي جيتي منها. ما تنفتح إلا من الجهة الثانية. أو بالدراما.' },
  ],

  'a1.roses': [
    { s: 'anji', e: 'surprised', t: 'الورد… دا يضوي من أقرّب عليه؟' },
    { s: 'anji', e: 'smirk', t: 'لا لا، آني أكيد بعدني نايمة. بس حلم حلو، خلّي أستمتع بيه.' },
    { do: 'flag:roses-touched' },
  ],

  'a1.snooki-meet': [
    { s: 'snooki', e: 'serious', t: 'گرررر… منو إنتي؟ وشلون دخلتي؟ هاي منطقة محمية!', cue: 'bark' },
    { s: 'anji', e: 'surprised', t: 'كلب… ويحچي؟' },
    { s: 'snooki', e: 'smug', t: 'كلب؟ آني مستشار أمني. بفرو. وهسه عندي أسئلة.' },
    { s: 'snooki', e: 'serious', t: 'السؤال الأول، وهو الأهم: عندچ أكل؟' },
    {
      s: 'anji',
      e: 'thinking',
      choice: [
        {
          t: 'ماكو. آسفة.',
          then: [{ s: 'snooki', e: 'dramatic', t: 'يعني لا أكل ولا تصريح دخول. وضعچ صعب، أختي.' }],
        },
        {
          t: 'عندي نص علچة بالجيب.',
          do: 'flag:gum-offered',
          then: [
            { s: 'snooki', e: 'shocked', t: 'علچ؟! … لا. ما أنخدع بالرشوة.' },
            { s: 'anji', e: 'smirk', t: 'زين، أرجّعها للجيب.' },
            { s: 'snooki', e: 'guilty', t: '…خلّيها. للتحقيق.' },
          ],
        },
        {
          t: 'إنت شنو نوعك؟ هاسكي؟',
          then: [
            { s: 'snooki', e: 'proud', t: 'هاسكي سيبيري. يعني ذكاء، أناقة، وفرو يكفي لثلث كلاب.' },
            { s: 'anji', e: 'smile', t: 'وتواضع.' },
            { s: 'snooki', e: 'smug', t: 'التواضع للي عندهم شي يخبّونه.' },
          ],
        },
      ],
    },
    { s: 'snooki', e: 'sniff', t: 'لحظة… هاي الريحة…', cue: 'sparkle' },
    { s: 'snooki', e: 'shocked', t: 'ريحتچ… نفس ريحة الورد الأزرق!' },
    { s: 'snooki', e: 'happy', t: 'إنتي… إنتي اللي الحديقة دتنطرها!', cue: 'bark' },
    { s: 'anji', e: 'skeptical', t: 'تنطرني؟ آني حتى ما أعرف وين آني.' },
    { s: 'snooki', e: 'happy', t: 'بالحديقة السرّية. حديقة ريان.' },
    { s: 'anji', e: 'thinking', t: 'ومنو ريان؟' },
    { s: 'snooki', e: 'proud', t: 'ريان هو اللي سوّى كل شي هنا. الورد، النافورة، البوابات… واسمي. آني ما مصنوع، بس هو اللي اختار الاسم.' },
    { s: 'snooki', e: 'dramatic', t: 'بس من فترة… اختفى. فجأة. لا رسالة، لا وداع، لا حتى صحن أكل زيادة.' },
    { s: 'anji', e: 'worried', t: 'اختفى؟ وإنت بقيت هنا وحدك؟' },
    { s: 'snooki', e: 'smug', t: 'وحدي؟ آني ويّا ذكائي. يعني اثنين.' },
    { s: 'snooki', e: 'proud', t: 'لا تقلقين. آني أعرف الطريق. اتبعيني.' },
  ],
  'a1.snooki-lost': [
    { s: 'snooki', e: 'guilty', t: '…الطريق چان هنا البارحة.' },
    { s: 'anji', e: 'laugh', t: 'زين يا مستشار. آني أمشي، وإنت تتبعني.' },
    { s: 'snooki', e: 'smug', t: 'هذا بالضبط اللي چنت راح أقترحه.' },
    { do: ['flag:met-snooki', 'journal:snooki'] },
  ],

  'a1.fountain': [
    {
      if: '!flag:read-engraving',
      then: [
        { s: 'anji', e: 'thinking', t: 'نافورة… ومحفور على حافتها كلام.' },
        { s: 'sign', t: '«من الظلام، إلى النور الكامل. هكذا تتفتح الوردة.»' },
        { s: 'anji', e: 'surprised', t: 'ونفس الرمز اللي طلعلي بالموبايل: وردة، وساقها ملفوف على شكل حرف R.' },
        { s: 'snooki', e: 'proud', t: 'هذا ختم ريان. يحطه على كل شي يسوّيه. حتى على صحن أكلي.' },
        { s: 'anji', e: 'smirk', t: 'لمسة رومانسية.' },
        { s: 'snooki', e: 'guilty', t: '…لا. حطه على صحني لأن آني چنت آكل من صحنه.' },
        { do: ['flag:read-engraving', 'journal:engraving', 'journal:mark'] },
      ],
      else: [{ s: 'sign', t: '«من الظلام، إلى النور الكامل. هكذا تتفتح الوردة.»' }],
    },
  ],

  'a1.pedestals-look': [
    { s: 'anji', e: 'thinking', t: 'أربع ورود بيضة، وكل وحدة تحتها قمر بطور مختلف.' },
    {
      if: '!flag:read-engraving',
      then: [
        { s: 'snooki', e: 'smug', t: 'سهلة! جرّبي كل الاحتمالات. هي بس أربعة وعشرين.' },
        { s: 'anji', e: 'skeptical', t: 'أو أدوّر على دليل بدل ما نگضّي الليل نجرّب.' },
      ],
      else: [{ s: 'anji', e: 'smile', t: 'الكلام اللي على النافورة… «من الظلام إلى النور الكامل». أعتقد فهمتها.' }],
    },
  ],
  'a1.pedestals-solved': [
    { s: 'anji', e: 'surprised', t: 'الورود صارت زرگة… كلها مرة وحدة!', cue: 'gate' },
    { s: 'snooki', e: 'shocked', t: 'والسياج… دا يتحرك! السياج عمره ما تحرك!' },
    { s: 'snooki', e: 'proud', t: 'شفتي؟ آني فتحته.' },
    { s: 'anji', e: 'skeptical', t: 'إنت؟' },
    { s: 'snooki', e: 'smug', t: 'دعم معنوي. مهم جداً بالفرق الناجحة.' },
    { s: 'anji', e: 'thinking', t: 'وهاي… قطعة من خريطة؟ ناقصة، بس مرسوم عليها المتاهة. بخط إيد.' },
    { s: 'note', t: 'بزاوية الورقة، بخط صغير: «للي تعرف تقرأ الطرق، مو بس الخرايط. — R»' },
  ],

  'a1.sign-maze': [
    { s: 'sign', t: '«المتاهة: للأذكياء فقط.»' },
    { s: 'snooki', e: 'proud', t: 'يعني إلي.' },
    { s: 'anji', e: 'smirk', t: 'وتحتها مكتوب بخط أصغر: «سنوكي، هذا يشملك. — R»' },
    { s: 'snooki', e: 'guilty', t: '…الخط مو واضح. ما يُعتمد.' },
  ],

  'a1.maze-enter': [
    { s: 'snooki', e: 'proud', t: 'المتاهة! أخيراً شي أعرفه. دخلتها مية مرة.' },
    { s: 'anji', e: 'skeptical', t: 'وكم مرة طلعت منها؟' },
    { s: 'snooki', e: 'guilty', t: '…السؤال مو منطقي.' },
  ],
  'a1.maze-blocked': [{ s: 'anji', e: 'thinking', t: 'السياج مسدود. لازم أكو طريقة تفتحه… يمكن عند الورود اللي على الأعمدة.' }],
  'a1.maze-later': [{ s: 'anji', e: 'neutral', t: 'خلّي أرجعلها بعدين. المتاهة مو راح تهرب.' }, { s: 'snooki', e: 'smug', t: 'بالضبط. المتاهات ما تهرب. بس الكلاب الذكية تهرب منها.' }],

  'a1.note-bench': [
    { s: 'note', t: '«إذا لگيتي هاي الورقة، يعني سنوكي ضيّع الطريق مرة ثانية. لا تعصّبين عليه، هو يحاول. — R»' },
    { s: 'snooki', e: 'dramatic', t: 'هاي… هاي تشهير!' },
    { s: 'anji', e: 'laugh', t: 'بالعكس. واضح يحبك.' },
    { s: 'snooki', e: 'guilty', t: '…يحبني، بس يحب يكتب عني أكثر.' },
  ],

  'a1.conservatory': [
    { s: 'anji', e: 'soft', t: 'بيت زجاج… وكله ورد. هنا أدفى بكثير.' },
    { s: 'snooki', e: 'sniff', t: 'أشم… كحول طبي. ولاصق جروح. وشي… حاد.' },
    { s: 'snooki', e: 'shocked', t: 'لا. لا لا لا. مستحيل. هي هنا.' },
    { s: 'anji', e: 'worried', t: 'منو؟' },
  ],
  'a1.needle': [
    { s: 'needle', e: 'cheerful', t: 'سنوووكي! يا أحلى مريض بالعالم!' },
    { s: 'snooki', e: 'dramatic', t: 'الممرضة إبرة.' },
    { s: 'needle', e: 'cheerful', t: 'موعد لقاحك السنوي متأخر… ثلاث سنين، أربع أشهر، وتسع أيام!' },
    { s: 'snooki', e: 'guilty', t: 'چنت مشغول. بالتحقيقات.' },
    { s: 'needle', e: 'determined', t: 'وإنتي منو؟ مساعدته؟ ممتاز! امسكيه، وأخلّص بثانية!' },
    {
      s: 'anji',
      e: 'thinking',
      choice: [
        {
          t: 'آني ويّا سنوكي.',
          do: 'flag:sided-snooki',
          then: [
            { s: 'needle', e: 'sneaky', t: 'خيانة! يعني سنوكي جنّد مساعدين!' },
            { s: 'snooki', e: 'proud', t: 'شريكة. مو مساعدة.' },
          ],
        },
        {
          t: 'هو لقاح ضروري صدگ؟',
          then: [
            { s: 'needle', e: 'cheerful', t: 'طبعاً! ضد… ضد العطسات الدرامية.' },
            { s: 'anji', e: 'skeptical', t: 'هاي مو حالة طبية.' },
            { s: 'snooki', e: 'proud', t: 'شكراً. أخيراً أحد درس.' },
          ],
        },
        {
          t: 'ممكن أشوف الإبرة؟ عندي خبرة.',
          do: 'flag:needle-respect',
          then: [
            { s: 'needle', e: 'cheerful', t: 'أخيراً أحد يقدّر مهنتي!' },
            { s: 'anji', e: 'smirk', t: 'على فكرة… راس الإبرة عليه كرة مطاط.' },
            { s: 'needle', e: 'cheerful', t: 'السلامة أولاً، حبيبتي. آني إبرة محترمة.' },
          ],
        },
      ],
    },
    { s: 'snooki', e: 'dramatic', t: 'أنجي. اسمعيني زين. على العد ثلاثة… اركضي!' },
    { s: 'snooki', e: 'shocked', t: 'ثلاثة!', cue: 'whoosh' },
  ],
  'a1.needle-retry': [
    { s: 'needle', e: 'sneaky', t: 'هه! ما خلصنا يا حلوين. واقفة هنا لحد ما سنوكي ياخذ لقاحه.' },
    { s: 'snooki', e: 'serious', t: 'لازم نهرب منها. محاولة ثانية. هالمرة آني أركض أول.' },
  ],
  'a1.needle-after': [
    { s: 'needle', e: 'determined', t: 'هاي مو النهاية يا سنوكي! راح أرجع! ومعي ملصقات كارتون للشجعان!' },
    { s: 'snooki', e: 'proud', t: 'شفتي شلون خلّصتچ؟' },
    { s: 'anji', e: 'laugh', t: 'خلّصتني؟ آني چنت شايلتك نص الطريق!' },
    { s: 'snooki', e: 'smug', t: 'تفاصيل. التاريخ يتذكر النتائج.' },
  ],

  'a1.gate': [
    { s: 'gate', t: 'مَن يطرق بوابة القلب؟' },
    { s: 'snooki', e: 'guilty', t: '(همس) هي هيچ دايماً. درامية.' },
    { s: 'gate', t: 'لا أنفتح إلا لمن تعرفه الحديقة. أجيبي.' },
  ],
  'a1.gate-open': [
    { s: 'gate', t: '…أزرق. لون الورد الذي زرعه صانعي من أجل—' },
    { s: 'gate', t: '—لا. هذا ليس دوري لأقوله.' },
    { s: 'anji', e: 'thinking', t: 'من أجل منو؟' },
    { s: 'gate', t: 'ادخلي، يا مَن تعرفين اللون.', cue: 'gate' },
  ],
  'a1.shadow': [
    { s: 'anji', e: 'surprised', t: 'استنى! … ريان؟!' },
  ],
  'a1.after-shadow': [
    { s: 'snooki', e: 'guilty', t: 'ما شفت شي.' },
    { s: 'anji', e: 'skeptical', t: 'شلون ما شفت؟ چان واگف هناك! وراح!' },
    { s: 'snooki', e: 'guilty', t: 'يمكن غيمة. غيمة طويلة… لابسة جنطة.' },
    { s: 'anji', e: 'determined', t: 'سنوكي. إنت تعرف شي ودتخبّيه.' },
    { s: 'snooki', e: 'dramatic', t: 'آني؟ آني كتاب مفتوح! … بس بعض الصفحات لازگة.' },
    { s: 'anji', e: 'smirk', t: 'زين. راح أقراها وحدة وحدة.' },
    { do: ['flag:act1-done', 'journal:shadow-1'] },
  ],
};

/** Snooki's idle remarks in Act I locations. */
export const ACT1_AMBIENT = [
  { t: 'تدرين؟ آني مو كلب. آني مستشار أمني بفرو.' },
  { t: 'ريان چان يگول آني أذكى كلب بالحديقة. صح آني الوحيد… بس برضو.' },
  { t: 'شمّيت شي! … لا، هاي ريحتي.', cue: 'bark' },
  { t: 'تمشين على راحتچ، بس بأناقة. أحترم هذا.' },
  { t: 'إذا شفتي سنجاب، لا تخافين. آني موجود. من بعيد.' },
  { t: 'جوعان. مو مهم. بس حبيت أسجّلها رسمياً.', if: '!flag:act1-done' },
];
