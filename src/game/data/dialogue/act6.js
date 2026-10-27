/**
 * ACT VI — ممر الذكريات والبحيرة القمرية (The Memory Corridor & the Moonlit Lake).
 * Fictional story content. The corridor's frames come from memories/registry.js.
 */
export const ACT6 = {
  'a6.corridor-enter': [
    { s: 'anji', e: 'soft', t: 'ممر طويل… وإطارات على الجهتين. كلهن فاضيات.' },
    { s: 'snooki', e: 'serious', t: 'هذا ممر الذكريات. ريان يگول: الأشياء تحفظ القصص، بس لازم أحد يتذكرها حتى تضوي.' },
    { s: 'anji', e: 'thinking', t: 'وآني اللي لازم أتذكر؟' },
    { s: 'snooki', e: 'happy', t: 'إنتي اللي لازم تشوفين. التذكر شغلي. آني ذاكرتي حديد. عدا القبعة.' },
    { do: 'flag:corridor-entered' },
  ],
  'a6.corridor-done': [
    { s: 'anji', e: 'soft', t: 'كل الإطارات ضوت. كل لحظة… چان يبنيها وهو يفكّر بشي واحد.' },
    { s: 'snooki', e: 'dramatic', t: 'بيچ. چان يفكّر بيچ. … گلتها. خلاص. ريان راح يزعل.' },
    { s: 'anji', e: 'smile', t: 'ما راح أگوله إنك گلتها.' },
    { s: 'snooki', e: 'guilty', t: 'شكراً. آني أعرف أخبّي. شفتي قضية الخريطة.' },
    { do: 'flag:corridor-done' },
  ],
  'a6.lake-enter': [
    { s: 'anji', e: 'soft', t: 'بحيرة… والقمر نايم بنصها.' },
    { s: 'snooki', e: 'serious', t: 'هنا ريان يجي لمن يتعب. يحط فوانيس بالماي ويطيّرها. يگول كل فانوس أمنية.' },
    { s: 'anji', e: 'thinking', t: 'وشنو چانت أمنياته؟' },
    { s: 'snooki', e: 'guilty', t: '…لو أگول، ما تتحقق. قوانين الفوانيس. مو قوانيني.' },
    { do: 'flag:lake-entered' },
  ],
  'a6.lake-after': [
    { s: 'anji', e: 'soft', t: '«شكراً لأنچ جيتي»…' },
    { s: 'snooki', e: 'dramatic', t: 'آني ما بچيت. هذا ماي البحيرة طار على عيوني.' },
    { s: 'anji', e: 'soft', t: 'سنوكي… إنت تشتاقله، صح؟' },
    { s: 'snooki', e: 'dramatic', t: 'كل يوم. حتى لو يرجع بالليل ويطلع قبل ما أصحى.' },
    { s: 'anji', e: 'determined', t: 'إذن نلگاه. سوا.' },
    { s: 'snooki', e: 'proud', t: 'سوا. محققة، ومساعدها، وفانوس مبلول.' },
    { do: 'flag:lake-done' },
  ],
  'a6.finale': [
    { s: 'anji', e: 'surprised', t: 'شي يلمع بالماي… مفتاح! بشكل وردة.' },
    { s: 'snooki', e: 'serious', t: 'مفتاح الورشة. «ورشة الأشياء المفقودة». الدرج اللي ينزل بالبيت.' },
    { s: 'anji', e: 'determined', t: 'آخر مكان.' },
    { s: 'snooki', e: 'guilty', t: 'تقريباً آخر مكان.' },
    { do: ['item:rose-key', 'flag:workshop-open', 'flag:act6-done', 'journal:rose-key'] },
  ],
};

export const ACT6_AMBIENT = [
  { t: 'الإطارات تحب الصبر. وآني ما عندي صبر. بس عندي إطارات.' },
  { t: 'البحيرة ريحتها ريحة مطر. حتى لو ما ممطرة.' },
  { t: 'أي إطار تعجبچ أكثر؟ لا تگولين. خليها مفاجأة لإلي.' },
];
