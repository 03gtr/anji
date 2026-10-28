/**
 * «إحنا فريق» dialogue: after the ending, Ryan is here and the four of them do things together.
 * Anji makes the plans and sets the games; Ryan joins in, jokes, and sometimes loses on purpose
 * (he says he doesn't). Snooki follows food, the husky follows anything that moves; they start
 * as rivals and slowly become a team (tu-dogs-1 → tu-dogs-2). Invented scenes for the game, not
 * real memories. Every rule of a puzzle is said out loud at a stop, by whoever noticed it.
 */
export const TEAM = {
  'tu.later': [{ s: 'anji', e: 'smile', t: 'نفكر بيها شوية. الآثار ما راح تهرب.' }],

  /* ── Anji's plan notebook (the hidden garden) ── */
  'tu.plan-first': [
    { s: 'anji', e: 'smirk', t: 'دفتر خططي. أول صفحة: «مشية العصر — ويّا لعبة».' },
    { s: 'ryan', e: 'turn', t: 'لعبة؟ يعني أكو فخ.' },
    { s: 'anji', e: 'smile', t: 'يعني أكو سلة أكل مخبية بآخر الطريق، وثلاث آثار. وإنت تلگاها… بمساعدة الكلاب.' },
    { s: 'snooki', e: 'happy', t: 'سمعت «أكل». آني بالفريق.' },
    { s: 'narrator', t: '{husky} تهز ذيلها وتركض للباب، كأنها فهمت «مشية» قبل الكل.' },
  ],
  'tu.plan-route': [
    {
      s: 'anji',
      e: 'thinking',
      choice: [
        {
          t: 'طريق النهر',
          then: [
            { s: 'anji', e: 'smile', t: 'النهر. {husky} تحب الماي، وسنوكي… يتحمّل.' },
            { do: ['flag:tu-route-river', '!flag:tu-route-orchard'] },
          ],
        },
        {
          t: 'طريق البستان',
          then: [
            { s: 'anji', e: 'smirk', t: 'البستان. التفاح واگع بكل مكان، وسنوكي راح ينسى اللعبة كلها.' },
            { s: 'snooki', e: 'dramatic', t: 'افتراء. …شگد تفاحة؟' },
            { do: ['flag:tu-route-orchard', '!flag:tu-route-river'] },
          ],
        },
      ],
    },
  ],
  'tu.plan-go': [
    { s: 'ryan', e: 'turn', t: 'يلا. بس إذا خسرت، ما أريد أسمع عنها سنة.' },
    { s: 'anji', e: 'smirk', t: 'شهرين. كرم مني.' },
  ],
  'tu.plan-again': [{ s: 'anji', e: 'thinking', t: 'المشية بعدها مفتوحة. نكمل بنفس الطريق، لو نبدّل؟' }],
  'tu.plan-second': [
    { s: 'anji', e: 'smile', t: 'المشية الأولى چانت حلوة. وأكو طريق ثاني ما مشيناه…' },
    { s: 'ryan', e: 'turn', t: 'وأكيد خبيتي سلة ثانية.' },
    { s: 'anji', e: 'smirk', t: 'ما أگول. بس جيب جوعك.' },
  ],
  'tu.plan-done': [
    { s: 'anji', e: 'soft', t: 'مشينا الطريقين. الدفتر بعد بيه صفحات فاضية… هاي نكتبها سوا.' },
    { s: 'ryan', e: 'turn', t: 'وأگدر أكتب وحدة آني؟' },
    { s: 'anji', e: 'smirk', t: 'إذا تكتبها زين.' },
  ],

  /* ── the walk ── */
  'tu.walk-enter': [
    { s: 'anji', e: 'smile', t: 'القاعدة الأولى: محد يركض گدام. …{husky}!' },
    { s: 'narrator', t: '{husky} ركضت گدام.' },
    { s: 'snooki', e: 'proud', t: 'آني ملتزم بالقاعدة. لأن رجليّ قصار. مو لأن ملتزم.' },
  ],
  'tu.walk-noplan': [{ s: 'anji', e: 'thinking', t: 'خطتي بالدفتر، بالحديقة المخفية. أختار الطريق أول.' }],
  'tu.obs-again': [{ s: 'anji', e: 'soft', t: 'اللي شفته هنا محفوظ بالدفتر.' }],

  // the river route
  'tu.obs-river-1': [
    { s: 'note', t: '«قواعد اللعبة: ثلاث آثار، وكل أثر يوصل لمكان غير. وأثر السلة ما يبدأ عند الجسر. — أ»' },
    { s: 'ryan', e: 'turn', t: 'كتبتيها من الصبح؟' },
    { s: 'anji', e: 'smile', t: 'من البارحة. التخطيط نص المتعة.' },
  ],
  'tu.obs-river-2': [
    { s: 'snooki', e: 'sniff', t: 'فتات خبز! … سنوكي ما يلحق إلا ريحة أكل. هذا مو ضعف، هذا تخصص.' },
    { s: 'narrator', t: '{husky} ما عبّرت الفتات أصلاً. عيونها فوق، على الشجر.' },
    { s: 'anji', e: 'thinking', t: 'وكل كلب يلزم أثر واحد. يعني أثر واحد محد راح يلحقه.' },
  ],
  'tu.obs-river-3': [
    { s: 'narrator', t: 'سنجاب يركض على غصن، و{husky} توگف مثل التمثال وتلحقه بعيونها.' },
    { s: 'anji', e: 'smile', t: 'الهاسكي تلحق اللي يتحرك. دائماً.' },
    { s: 'ryan', e: 'turn', t: 'وهاي الصخرة مبلولة… الآثار اللي عليها جاية من الماي.' },
    { s: 'snooki', e: 'smug', t: 'ماي. ماكو أكل بالماي. مو قضيتي.' },
  ],
  // the orchard route
  'tu.obs-orchard-1': [
    { s: 'note', t: '«قواعد اللعبة: كل أثر يوصل لمكان غير. والبوابة بعيدة عن الساقية. — أ»' },
    { s: 'ryan', e: 'turn', t: 'هالمرة ما گلتيلي وين ما تبدأ السلة.' },
    { s: 'anji', e: 'smirk', t: 'لأن هالمرة إنت صرت محترف.' },
  ],
  'tu.obs-orchard-2': [
    { s: 'snooki', e: 'shocked', t: 'هاي البوابة ريحتها صابون! سنوكي ما يقرب البوابة. أبداً. ذكريات الحمّام.' },
    { s: 'snooki', e: 'serious', t: '…وللتذكير: سنوكي ما يلحق إلا ريحة أكل.' },
    { s: 'anji', e: 'thinking', t: 'وكل كلب يلزم أثر واحد، وأثر واحد محد يلحقه. نفس قاعدة النهر.' },
  ],
  'tu.obs-orchard-3': [
    { s: 'narrator', t: 'سنوكي يشم البير… ويعطس ويرجع لورا خطوتين.' },
    { s: 'narrator', t: 'وبنفس اللحظة طيور تطير من الشجرة، و{husky} تركض وراها لحد السياج.' },
    { s: 'anji', e: 'smile', t: 'الهاسكي تلحق اللي يطير.' },
    { s: 'ryan', e: 'turn', t: 'وسنوكي شم البير وعطس ورجع. سجّلتها.' },
  ],

  /* ── the fork ── */
  'tu.fork-wait': [{ s: 'anji', e: 'thinking', t: 'مستعجلين؟ بعد ما شفنا الوگفات الثلاث بالطريق.' }],
  'tu.fork-intro': [
    { s: 'ryan', e: 'turn', t: 'ثلاث آثار. وكل واحد يأشر على شي.' },
    { s: 'anji', e: 'smile', t: 'وكل اللي تحتاجه شفته بالطريق. بس رتّبه.' },
  ],
  'tu.trail-done': [
    { s: 'ryan', e: 'turn', t: 'لگيته! … لا، إنتي لگيتيه. آني بس مشيت وراه.' },
    { s: 'anji', e: 'smirk', t: 'لگيناه. يلا للسلة قبل ما يوصلها سنوكي.' },
    { s: 'snooki', e: 'smug', t: '(من بعيد) متأخرين.' },
  ],
  'tu.trail-again': [{ s: 'anji', e: 'soft', t: 'الأثر واضح هسه. السلة بآخر الممشى.' }],

  /* ── the picnic (a quiet moment) ── */
  'tu.picnic-river': [
    { s: 'narrator', t: 'السلة تحت شجرة، وجنبها بطانية مطوية. وسنوكي گاعد بنصها، فخور، ووجهه كله فتات.' },
    { s: 'ryan', e: 'turn', t: 'خبّيتيها هنا من الصبح؟' },
    { s: 'anji', e: 'smirk', t: 'من الظهر. خطة محترمة.' },
  ],
  'tu.picnic-orchard': [
    { s: 'narrator', t: 'السلة تحت شجرة التفاح، وتفاحة وحدة واگعة جوّه… وعليها أثر سنون صغيرة.' },
    { s: 'anji', e: 'surprised', t: 'سنوكي!' },
    { s: 'snooki', e: 'guilty', t: 'هي وگعت. آني بس… فحصتها. للأمان.' },
  ],
  'tu.dogs-first': [
    { s: 'narrator', t: 'سنوكي و{husky} يتسابقون على آخر قطعة خبز. ولا واحد يربح: القطعة وگعت بالحشيش، وصارت للنمل.' },
    { s: 'snooki', e: 'dramatic', t: 'تعادل. بس آني أخلاقياً الفايز.' },
  ],
  'tu.dogs-second': [
    { s: 'narrator', t: 'هالمرة سنوكي يحفر، و{husky} تحرس الحفرة. ويتقاسمون القطعة الأخيرة… تقريباً بالتساوي.' },
    { s: 'snooki', e: 'proud', t: 'صرنا فريق. بس آني القائد. تقريباً بالتساوي.' },
  ],
  'tu.picnic-quiet': [
    { s: 'narrator', t: 'گعدوا على البطانية. الكلبين ناموا بالظل، واحد يم الثاني، وكل واحد يدّعي إنه مو نايم.' },
    { s: 'ryan', e: 'turn', t: 'حلوة هالمشية.' },
    { s: 'anji', e: 'soft', t: 'المرة الجاية إنت تخطط.' },
    { s: 'ryan', e: 'turn', t: 'حتى تغلبيني بلعبتي آني؟' },
    { s: 'anji', e: 'smirk', t: 'أكيد.' },
  ],
  'tu.picnic-again': [{ s: 'anji', e: 'soft', t: 'بقايا النزهة… والكلبين نايمين بالظل.' }],
};
