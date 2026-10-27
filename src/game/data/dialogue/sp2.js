/**
 * Story Pack 02 «أرشيف الأسرار»: dialogue. Played before the ending, while Ryan
 * is still "missing", so he never appears here: the archive speaks through his
 * ledger, his letters and his plans. All of it is fiction about the garden's
 * making — no real memories, and nothing about the ending is revealed.
 */
const SEAL_LINES = [
  { if: 'flag:sp2-archives-done', s: 'anji', e: 'smile', t: '🌹 ختم الأرشيف ضاوي.' },
  { if: 'flag:sp2-maze-done', s: 'anji', e: 'smile', t: '🗝️ ختم المتاهة ضاوي.' },
  { if: 'flag:sp2-letters-done', s: 'anji', e: 'smile', t: '✉️ ختم الرسائل ضاوي.' },
];

export const SP2 = {
  'sp2.enter': [
    { s: 'anji', e: 'surprised', t: 'رفوف لحد السقف… وسجلات، وخرايط، وريحة ورق قديم.' },
    { s: 'snooki', e: 'proud', t: 'أرشيف الأسرار. ما اكتشفته آني. بس كنت راح أكتشفه. باچر.' },
    { s: 'anji', e: 'thinking', t: 'وعلى الحايط… مخطط بوابة. وعلى الطاولة سجل مفتوح.' },
  ],

  /* ── Mission 1: the ledger and its three marks ── */
  'sp2.ledger': [
    { s: 'note', t: '«المفتاح الثاني للأرشيف بواحد من أربع أماكن: البحيرة القمرية، الكراج، المرصد، البيت الزجاجي.»' },
    { s: 'note', t: '«ثلاث علامات تدل عليه: وحدة بالبيت، وحدة بالأكاديمية، ووحدة بالمحمية.»' },
    { s: 'anji', e: 'determined', t: 'يعني ما أگدر أعرف هسه. لازم ألگى العلامات الثلاث أول.' },
    { s: 'snooki', e: 'serious', t: 'تحقيق. أخيراً شغل محترم.' },
  ],
  'sp2.ledger-wait': [
    { s: 'anji', e: 'thinking', t: 'بعد ناقصتني علامات:' },
    { if: '!flag:sp2-clue-a', s: 'anji', e: 'thinking', t: '— وحدة بالبيت، قرب الدرج.' },
    { if: '!flag:sp2-clue-b', s: 'anji', e: 'thinking', t: '— وحدة بالأكاديمية، ورا لوحة التحقيق.' },
    { if: '!flag:sp2-clue-c', s: 'anji', e: 'thinking', t: '— وحدة بالمحمية، على عمود خشب.' },
  ],
  'sp2.clue-a': [
    { s: 'anji', e: 'curious', t: 'بلاطة منقوشة بنفس رمز السجل: «مو قرب الماي.»' },
    { s: 'snooki', e: 'smug', t: 'يعني مو بالبحيرة. شطبنا وحدة. أعطوني ميدالية.' },
  ],
  'sp2.clue-b': [
    { s: 'anji', e: 'curious', t: 'ورا لوحة التحقيق، بخط صغير: «بمكان يشوف السما.»' },
    { s: 'snooki', e: 'guilty', t: 'هاي الورقة چانت ورا لوحتي من البداية؟ … محد يگول لأحد.' },
  ],
  'sp2.clue-c': [
    { s: 'anji', e: 'curious', t: 'محفور على العمود: «ما بيه ولا وردة.»' },
    { s: 'snooki', e: 'confused', t: 'مكان بالحديقة بلا ورد؟ هذا أغرب دليل لحد هسه.' },
  ],
  'sp2.deduced': [
    { s: 'anji', e: 'smile', t: 'المرصد. بعيد عن الماي، يشوف السما، وما بيه ولا وردة.' },
    { s: 'snooki', e: 'proud', t: 'آني گلت الكراج… بس حتى العباقرة يغلطون مرة بالأسبوع.' },
  ],
  'sp2.ledger-later': [{ s: 'anji', e: 'soft', t: 'العلامات محفوظة بالدفتر. أرجعلها لمن أفكر أوضح.' }],
  'sp2.go-observatory': [{ s: 'anji', e: 'determined', t: 'المفتاح بالمرصد. يلا.' }],
  'sp2.ledger-done': [{ s: 'anji', e: 'smile', t: 'السجل حچى كل اللي عنده. بقية الأسرار ورا الباب الداخلي.' }],
  'sp2.key-found': [
    { s: 'anji', e: 'surprised', t: 'هنا! مفتاح نحاسي… مربوط بشريط أزرق.' },
    { s: 'snooki', e: 'dramatic', t: 'الشريط الأزرق چان مكتوب بالسجل. يعني آني چنت صح… جزئياً.' },
  ],

  /* ── Mission 2: the inner door and the shifting maze ── */
  'sp2.door-locked': [{ s: 'anji', e: 'thinking', t: 'باب مقفول بقفل نحاسي. يحتاج المفتاح الثاني اللي يذكره السجل.' }],
  'sp2.door-unlock': [
    { s: 'anji', e: 'smile', t: 'المفتاح لف بسهولة… الباب انفتح.' },
    { s: 'snooki', e: 'shocked', t: 'الأرضية تتحرك! مربعات تمشي وحدها. هذا ضد قوانين الطبيعة. وضد قوانيني.' },
  ],
  'sp2.door-open': [{ s: 'anji', e: 'soft', t: 'الباب الداخلي مفتوح. ورا: الأرضية المتغيرة، والآلة القديمة.' }],
  'sp2.maze-intro': [
    { s: 'anji', e: 'thinking', t: 'مربعات، رفوف، مفاتيح، وأبواب صغيرة. ما أگدر أمشي وأشوف — لازم أخطط أول.' },
    { s: 'snooki', e: 'proud', t: 'آني أمشي، وإنتِ تخططين. تقسيم عادل.' },
  ],
  'sp2.maze-done': [
    { s: 'anji', e: 'laugh', t: 'عبرناها!' },
    { s: 'snooki', e: 'dramatic', t: 'كفوفي تعبت. أحتاج إجازة. وبسكويت. بهذا الترتيب.' },
  ],
  'sp2.maze-later': [{ s: 'anji', e: 'soft', t: 'المتاهة تحفظ المستوى اللي وصلتله. أرجعلها بعدين.' }],
  'sp2.maze-again': [{ s: 'snooki', e: 'smug', t: 'الأرضية هدت. شكلها خافت منّا.' }],

  /* ── Mission 3 (optional): the sequence machine ── */
  'sp2.machine': [
    { s: 'anji', e: 'curious', t: 'آلة قديمة بأضواء وأرقام. كل ما أدوس الزر تطلع أمثلة… بس ما تگول القاعدة.' },
    { s: 'snooki', e: 'serious', t: 'مثل جدتي. ما تگول الوصفة، بس تخليك تتذوق.' },
  ],
  'sp2.machine-done': [{ s: 'snooki', e: 'shocked', t: 'الآلة ضوّت ختم إضافي بالمخطط! حتى الآلات تحبچ. مو بس آني.' }],
  'sp2.machine-later': [{ s: 'anji', e: 'soft', t: 'الآلة ما تهرب. أرجعلها لمن أحب.' }],
  'sp2.machine-again': [{ s: 'anji', e: 'smile', t: '+٢، ×٢… الآلة صارت صديقة.' }],

  /* ── Mission 4: the missing letters ── */
  'sp2.desk': [
    { s: 'anji', e: 'curious', t: 'رسالة على الميز، بخط ريان: «اليوم زرعت أول وردة زرقاء بالحديقة.» … وبس. الباقي مگطوع.' },
    { s: 'snooki', e: 'sniff', t: 'أشم ورق بالمرصد… وبالمكتبة… وبالبحيرة. لا تسأليني شلون. أنفي عبقري.' },
  ],
  'sp2.desk-missing': [
    { s: 'anji', e: 'thinking', t: 'بعد ناقصتني قطع:' },
    { if: '!flag:sp2-letter-1', s: 'anji', e: 'thinking', t: '— بالمرصد.' },
    { if: '!flag:sp2-letter-2', s: 'anji', e: 'thinking', t: '— بالمكتبة السرية.' },
    { if: '!flag:sp2-letter-3', s: 'anji', e: 'thinking', t: '— بالبحيرة القمرية.' },
  ],
  'sp2.letter-1': [{ s: 'anji', e: 'curious', t: 'قطعة رسالة: «الوردة الزرقاء فتّحت، وركّبت أول عدسة بالمرصد.»' }],
  'sp2.letter-2': [{ s: 'anji', e: 'curious', t: 'قطعة رسالة بين الكتب: «بعد ما ضوّت العدسة، كتبت اسمچ بالنجوم.»' }],
  'sp2.letter-3': [
    { s: 'anji', e: 'curious', t: 'قطعة رسالة على الشط: «الاسم بالنجوم بعده يلمع… وبديت أرسم بوابة الغد.»' },
    { s: 'snooki', e: 'serious', t: 'بوابة الغد. نفس المخطط اللي بالأرشيف.' },
  ],
  'sp2.ordered': [{ s: 'anji', e: 'smile', t: 'هسه مرتبة. بس لحظة… مو كل اللي نفكر بيه مكتوب بيها.' }],
  'sp2.letters-done': [
    { s: 'anji', e: 'soft', t: 'المكتوب واضح. والباقي… استنتاجات. يمكن صح، يمكن لا.' },
    { s: 'snooki', e: 'proud', t: 'هذا الفرق بين محققة ممتازة… وكلب واثق من الكراج.' },
  ],
  'sp2.letters-later': [{ s: 'anji', e: 'soft', t: 'الرسائل بمكانها على الميز. أرجعلها بعدين.' }],
  'sp2.facts-later': [{ s: 'anji', e: 'soft', t: 'الترتيب محفوظ. بقى أميّز المكتوب عن الاستنتاج.' }],
  'sp2.desk-done': [{ s: 'anji', e: 'smile', t: 'الوردة، العدسة، النجوم، والمخطط. القصة كاملة… لحد هسه.' }],

  /* ── Mission 6: the gate plan ── */
  'sp2.plan-early': [
    { s: 'anji', e: 'thinking', t: 'مخطط «بوابة الغد». تحته خمس أختام: ثلاثة كاملة، واثنين مرسومين بخط متقطع.' },
    ...SEAL_LINES,
    { if: '!flag:sp2-archives-done', s: 'snooki', e: 'serious', t: 'الأختام فارغة. يمكن كل سر ينحل يضوي واحد.' },
  ],
  'sp2.plan-lit': [
    { s: 'anji', e: 'surprised', t: 'الأختام الثلاثة ضاوية… والمخطط نفسه دا يضوي!' },
    ...SEAL_LINES,
  ],
  'sp2.plan-open': [
    { s: 'anji', e: 'soft', t: 'انفتح شق صغير بالبوابة المرسومة… ضوء دافي، وكلمتين بخط ريان: «الباقي… مو هسه.»' },
    { s: 'snooki', e: 'dramatic', t: 'وسمعتي؟ صوت قفل انفتح بعيد. بالبيت. جهة الدرج. باب الورشة!' },
    { s: 'anji', e: 'determined', t: 'يلا للورشة.' },
  ],
  'sp2.plan-after': [
    { s: 'anji', e: 'soft', t: 'شق الضوء بعده بالمخطط. البوابة الحقيقية… بمكان ثاني، وبوقت ثاني.' },
    { if: ['flag:sp2-sequence-done', 'flag:sp2-trail-done'], s: 'snooki', e: 'proud', t: 'والأختام الخمسة كلها ضاوية. حتى الاختيارية. إحنا مبالغين بالاجتهاد.' },
  ],
  'sp2.stairs-sealed': [
    { s: 'anji', e: 'thinking', t: 'مفتاح الوردة لف… بس الباب ما انفتح. عليه ثلاث أختام فارغة — نفس أختام مخطط بوابة الغد.' },
    { s: 'snooki', e: 'serious', t: 'يعني الجواب بأرشيف الأسرار. شوفيه بالخريطة، تحت البيت.' },
  ],

  /* ── Mission 5 (optional): the husky's trail ── */
  'sp2.trail-1': [
    { s: 'narrator', t: '{husky} تشم الأرض جنب النافورة وتأشر بخشمها: آثار كفوف قديمة، وجنبها علامة: «مكان بيه ماي…»' },
  ],
  'sp2.trail-2': [{ s: 'narrator', t: 'تحت الشجرة الكبيرة بالمرج، نفس الكفوف، وعلامة ثانية: «…ويضويه القمر…»' }],
  'sp2.trail-3': [{ s: 'narrator', t: 'قرب السياج بالمحمية، آخر الكفوف، وعلامة ثالثة: «…وبيه قارب ينتظر.»' }],
  'sp2.trail-ask': [
    { s: 'anji', e: 'curious', t: '{husky}، تعالي. خلّي نفكر سوا وين ينتهي الأثر.' },
    { s: 'snooki', e: 'smug', t: 'آني أعرف. بس خلّيها تحس إنها لگته.' },
  ],
  'sp2.trail-done': [
    { s: 'narrator', t: '{husky} ركضت للبحيرة القمرية ورجعت بجرس فضي صغير بحلگها.' },
    { s: 'snooki', e: 'guilty', t: 'زين… ما چنت أعرف. وهذا آخر اعتراف إلي هالأسبوع.' },
  ],
};
