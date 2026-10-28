/**
 * ACT VII — ورشة الأشياء المفقودة (The Workshop of Missing Things)
 * ACT VIII — ما وراء الحديقة (Beyond the Garden). Fictional story content.
 */
export const ACT78 = {
  'a7.enter': [
    { s: 'anji', e: 'surprised', t: 'ورشة… مليانة أشياء ناقصة. دراجة بفيونكة زرقاء، صندوق موسيقى بلا مفتاح، مرجوحة نصها مركّبة.' },
    { s: 'snooki', e: 'serious', t: '«ورشة الأشياء المفقودة». كل شي هنا ناقصه قطعة. ريان يگول: «القطعة الناقصة دايماً هي الأهم».' },
    { s: 'anji', e: 'thinking', t: 'وكل شي عليه ورقة صغيرة… «إلها».' },
    { s: 'snooki', e: 'guilty', t: '«إلها» يعني… هي. الغايبة. ضمير. لا تحللين الضمائر. عمو منذر حاول، وصارت كارثة.' },
    { do: 'flag:workshop-entered' },
  ],
  'a7.machine': [
    { s: 'anji', e: 'thinking', t: 'وبالنص… ماكينة كبيرة. بيها ثلاث فتحات بشكل قطع خريطة… ومكان لخيط.' },
    { s: 'snooki', e: 'proud', t: '«ماكينة الأشياء المفقودة». تجمع القطع اللي ضاعت وترجّعها وحدة.' },
  ],
  'a7.need-thread': [
    { s: 'anji', e: 'thinking', t: 'القطع الثلاث عندي… بس الماكينة تحتاج خيط يربطهن.' },
    { s: 'snooki', e: 'sniff', t: 'خيط… أزرق… ريحته ورد! السياج اللي بالمحمية! الخيط اللي چان عالگ بيه!' },
  ],
  'a7.need-maps': [{ s: 'anji', e: 'thinking', t: 'ثلاث فتحات لقطع الخريطة… ناقصني قطعة.' }, { s: 'snooki', e: 'guilty', t: 'لا تباوعيني. هالمرة مو آني.' }],
  'a7.stage1': [{ s: 'snooki', e: 'serious', t: 'المرحلة الأولى: الطاقة. نفس لوحة الكراج… بس أصعب. ريان يحب «بس أصعب».' }],
  'a7.stage2': [{ s: 'anji', e: 'determined', t: 'الطاقة واصلة. هسه الفوانيس الستطعش… لازم كلها تشتعل.' }],
  'a7.stage3': [
    { s: 'anji', e: 'thinking', t: 'آخر قفل. أربع خانات، وكل خانة مكتوب جنبها مكان: الحديقة، البيت، الطريق، التحقيق.' },
    { s: 'snooki', e: 'proud', t: 'يعني الرحلة كلها. إنتي عشتيها. آني چنت هناك. بس إنتي اللي حليتها.' },
  ],
  'a7.letter': [
    { s: 'anji', e: 'surprised', t: 'الماكينة… دا تخيّط القطع سوا. صارت خريطة وحدة!', cue: 'gate' },
    { s: 'anji', e: 'soft', t: 'وبنصها… رسالة.' },
    { s: 'note', t: '«أنجي. ما اختفيت. چنت أبني آخر غرفة… وهاي الغرفة ما تنفتح من جوّا. تنفتح بس من برّا، بإيد اللي انبنت إلها.»' },
    { s: 'note', t: '«إذا وصلتي هنا، فإنتي شفتي كل شي: الورد، البيت، الطريق، النجوم، والذكريات. وهسه… تعالي. — R»' },
    { s: 'anji', e: 'soft', t: '«تعالي».' },
    { s: 'snooki', e: 'happy', t: 'يلا! الحديقة المخفية! آني أعرف الطريق!' },
    { s: 'anji', e: 'laugh', t: 'سنوكي.' },
    { s: 'snooki', e: 'guilty', t: '…إنتي تعرفين الطريق. آني أتبعچ. بكرامة.' },
    { do: ['flag:act7-done', 'got:note.ryan.6', 'journal:final-letter', '-item:blue-thread'] },
  ],

  'a8.enter': [
    { s: 'anji', e: 'surprised', t: 'هاي… هاي هي.' },
    { s: 'snooki', e: 'dramatic', t: 'الحديقة المخفية. حتى آني ما شفتها. وآني شفت كل شي. تقريباً.' },
    { s: 'anji', e: 'soft', t: 'شجرة ورد زرقاء… بقد بيت. وكل ورقة بيها تضوي.' },
  ],
  /*
   * The finale. Tone rules (owner's request): Ryan's absence was work and
   * responsibilities — said plainly, not excused by ambition; nothing is
   * owed; anything next is a mutual choice made by talking and making time;
   * Anji is free to read it her own way. Snooki keeps it light.
   */
  'a8.meet': [
    { s: 'snooki', e: 'happy', t: 'رياااان!', cue: 'bark' },
    { s: 'ryan', e: 'turn', t: '…وصلتي.' },
    {
      s: 'anji',
      e: 'soft',
      choice: [
        {
          t: 'وين چنت؟',
          then: [
            { s: 'ryan', e: 'turn', t: 'هنا… وبالشغل. الشغل والمسؤوليات أخذت من وقتي أكثر مما لازم، وصرت أغيب حتى لمن ما أريد أغيب.' },
            { s: 'ryan', e: 'turn', t: 'وهذا مو عذر. ما راح أگول «چنت أبني مستقبل» وأخلّيها حجة. هي بس الحقيقة، وأريد أگولها بوضوح.' },
          ],
        },
        {
          t: 'سنوكي چان يعرف؟',
          then: [
            { s: 'ryan', e: 'turn', t: 'سنوكي يعرف كل شي. بس تعليماته چانت: يتصرف طبيعي.' },
            { s: 'snooki', e: 'proud', t: 'وتصرفت طبيعي!' },
            { s: 'anji', e: 'laugh', t: 'لا.' },
            { s: 'ryan', e: 'turn', t: 'لا.' },
            { s: 'ryan', e: 'turn', t: 'وبصراحة… الشغل أخذني أكثر مما لازم. هذا الشي اللي چان لازم أگوله قبل أي حديقة.' },
          ],
        },
        { t: '…', then: [{ s: 'ryan', e: 'turn', t: 'ما يحتاج تگولين شي هسه. وصولچ لهنا گال هواية. وآني عندي شي لازم أگوله بوضوح: الشغل أخذ وقتي أكثر مما لازم. وهذا مو عذر.' }] },
      ],
    },
    { s: 'ryan', e: 'turn', t: 'وما أريدچ تحسين إنچ مديونة إلي بشي لأن تعبت بهالحديقة. التعب چان اختياري. والحديقة هدية… مو دين.' },
    { s: 'snooki', e: 'dramatic', t: 'لحظة لحظة! قبل الحچي الكبير: أكو أحد گال «بسكويت»؟ … لا؟ زين. كمّلوا. آني هنا للدعم النفسي بس.' },
    { s: 'anji', e: 'smirk', t: 'سنوكي.' },
    { s: 'snooki', e: 'guilty', t: 'ساكت. ساكت رسمياً. هاي آخر جملة. …هاي هم.' },
    { s: 'ryan', e: 'turn', t: 'الشي اللي تعلمته وآني أبني: الأشياء الحلوة تحتاج وقت… وتحتاج اثنين يختارونها. مو واحد يبني، وواحد ينتظر.' },
    { s: 'ryan', e: 'turn', t: 'فإذا نكمل، نكمل لأن إحنا الاثنين نريد. نحچي، ونلگى وقت لبعض. مو لأن أحد مجبور.' },
    {
      if: 'flag:mission:hidden-passage',
      then: [
        { s: 'anji', e: 'soft', t: 'لگيت غرفة الانتظار. والساعة اللي على ثنتين ونص.' },
        { s: 'ryan', e: 'turn', t: '…هذا السر الوحيد اللي سنوكي ما عرفه.' },
        { s: 'snooki', e: 'shocked', t: 'ولحد هسه زعلان.' },
      ],
    },
    {
      if: 'count:star>=20',
      then: [{ s: 'ryan', e: 'turn', t: 'ولگيتي حتى النجوم اللي خبّيتها بأصعب الأماكن. چنت أعرف إنچ عنيدة… بالطريقة الحلوة.' }],
    },
    {
      if: 'count:note>=5',
      then: [
        { s: 'anji', e: 'smirk', t: 'قريت رسائلك، على فكرة.' },
        { s: 'ryan', e: 'turn', t: 'كلها؟ … حتى اللي عن سنوكي؟' },
        { s: 'snooki', e: 'dramatic', t: 'تشهير. موثّق.' },
      ],
    },
    { s: 'ryan', e: 'turn', t: 'عندي شي أخير. مو بالماكينة، ولا بالنجوم. بجيبي من زمان.' },
    { s: 'anji', e: 'thinking', t: 'ورقة… مطوية؟' },
  ],
  'a8.drawing': [
    { s: 'ryan', e: 'turn', t: 'هاي الرسمة... مو محتاجة شرح طويل.' },
    { s: 'ryan', e: 'turn', t: 'ما أطلب بيها شي. بس حبيت تكون عندچ… وإنتي تقريها مثل ما تحبين.' },
    { s: 'snooki', e: 'proud', t: 'آني شفتها أول واحد. هذا يحسب كمساعدة فنية.' },
    {
      if: 'item:lunchbox',
      then: [
        { s: 'anji', e: 'smile', t: 'وآني جبتلك شي هم… أكل البيت. من الوصفة اللي چانت ممزقة.' },
        { s: 'ryan', e: 'turn', t: '…ريحته نفس الريحة. شكراً.' },
        { s: 'snooki', e: 'sniff', t: 'آني أتذوق الأول. للأمان.' },
      ],
    },
  ],
  'a8.plant-intro': [
    { s: 'ryan', e: 'turn', t: 'الحديقة بعدها ناقصها وردة وحدة. ما زرعتها… لأن هاي الوردة ما تنزرع بإيد وحدة.' },
    { s: 'snooki', e: 'happy', t: 'آني أحفر! الحفر تخصصي. اسألوا كل حديقة بالمنطقة.' },
    { s: 'anji', e: 'smile', t: 'يلا. نزرعها سوا.' },
  ],
  'a8.plant-done': [
    { s: 'anji', e: 'surprised', t: 'تفتحت… وضوت.' },
    { s: 'ryan', e: 'turn', t: 'الشي اللي يكبر بالاهتمام من الاثنين، يكبر أحلى. مثل هالوردة.' },
    { s: 'snooki', e: 'dramatic', t: 'ومن الكلب. الكلب حفر. سجّلوها.' },
  ],
  'a8.ending': [
    {
      if: ['flag:mission:unfinished-build', 'flag:mission:hidden-passage'],
      then: [
        { s: 'note', t: '🌹 حديقة الأمل' },
        { s: 'ryan', e: 'turn', t: 'لگيتي الساعة، والدرج، وغرفة الانتظار… يعني تعرفين ليش الوقت مهم عندي. الباقي نحچيه وجهاً لوجه.' },
        { do: ['flag:ending-hope', 'journal:ending-hope'] },
      ],
      else: [
        {
          if: { any: ['count:note>=7', (g) => ['missing-recipe', 'lost-kitten', 'second-sky', 'robo-snooki', 'letters-archive', 'detective-exam', 'wardrobe-challenge'].filter((m) => g.flag(`mission:${m}`)).length >= 4] },
          then: [
            { s: 'note', t: '🌹 حديقة الذكريات' },
            { s: 'ryan', e: 'turn', t: 'قريتي الرسائل، ولگيتي الذكريات. اللي فات حلو… واللي جاي ما ينكتب برسائل. ينكتب سوا.' },
            { do: ['flag:ending-memories', 'journal:ending-memories'] },
          ],
          else: [
            { s: 'note', t: '🌱 حديقة بعدها تكبر' },
            { s: 'ryan', e: 'turn', t: 'بعد أكو أبواب ما انفتحت وأسرار ما انلگت. ماكو عجلة. الحديقة بعدها تكبر… ونگدر نرجعلها وقت ما نريد.' },
            { do: ['flag:ending-growing', 'journal:ending-growing'] },
          ],
        },
      ],
    },
    { s: 'snooki', e: 'serious', t: 'وهسه؟' },
    { s: 'anji', e: 'soft', t: 'هسه… الباقي مو باللعبة.' },
    { do: ['flag:game-complete', 'flag:act8-done', 'unlock:outfit-evening', 'journal:ending', 'unlock:snooki-hat-rose'] },
  ],
  'a8.after': [
    { s: 'ryan', e: 'turn', t: 'بالمناسبة… البذور اللي جمعتيها بالطريق؟ هنا مكانها. ازرعيها وين ما تحبين.' },
    { s: 'snooki', e: 'proud', t: 'وأي مكان بيه عظم، هو مكاني.' },
  ],
  // The open ending: this chapter is complete, the hope stays, and the next adventures are hers to
  // ask for — they come with later updates (nothing here sends a message or promises a date).
  'a8.open': [
    { s: 'anji', e: 'thinking', t: 'يعني… هنا تخلص الحكاية؟' },
    { s: 'ryan', e: 'smile', t: 'هالحكاية، إي. بس الحديقة ما تخلص.' },
    { s: 'anji', e: 'smirk', t: 'زين، لأن عندي بعد أفكار. ألغاز أصعب، أماكن ما شفناها… وتحديات إلك إنت.' },
    { s: 'ryan', e: 'turn', t: 'بصراحة؟ صرتي أذكى من ألغازي. آني بعدني أحاول أفهم اللغز القديم مالتي.' },
    { s: 'snooki', e: 'smug', t: 'أشهد. شفته يحچي ويا الدفتر بنص الليل.' },
    { s: 'anji', e: 'smile', t: 'يعني تصمملي مهمات جديدة؟' },
    { s: 'ryan', e: 'smile', t: 'إنتِ اطلبي، وآني أصمم. بس انطيني وقت أتمرن.' },
    { s: 'note', t: '🌹 هنا تخلص هالحكاية… والحديقة بعدها تكبر.' },
    { s: 'note', t: 'إذا تحسين بعدچ تريدين مغامرات أصعب، اتصلي بريان وخليه يصمملچ مهمات جديدة… لأن دماغچ شكله تفوّق على دماغ ريان، وهو بعده يحاول يفهم اللغز القديم 😂❤️' },
    { s: 'note', t: 'المغامرات الجاية توصل ويا تحديثات جاية. ولحد ذاك الوقت الحديقة مفتوحة: ازرعي، استكشفي، وارجعي وقت ما تحبين.' },
    { do: ['journal:ending-open'] },
  ],
  'a8.ryan-idle': [
    // Phase 05: the way into the deep garden, once the ending is over (never a must)
    { if: '!flag:dg-box', s: 'ryan', e: 'turn', t: 'بالورشة علبة صغيرة إلچ، على الطاولة جنب الماكينة. افتحيها وقت ما تحبين… ماكو عجلة.' },
    { if: ['flag:dg-done', '!flag:dg-planted'], s: 'ryan', e: 'turn', t: 'شايفچ مبتسمة. شنو مخبية بإيدچ؟' },
    { s: 'ryan', e: 'turn', t: 'الوردة اللي زرعناها كبرت شوية. الحديقة تكبر لمن نهتم بيها… سوا.' },
    { s: 'snooki', e: 'smug', t: 'وآني أسقيها. بطريقتي. لا تسألون.' },
  ],
};

export const ACT78_AMBIENT = [
  { t: 'الورشة تخوّف شوية. بس بيها أشياء حلوة. مثلي.' },
  { t: 'هنا الهوا أدفى. أو آني متحمس. صعب أفرّق.' },
  { t: 'ريان قريب. أشمه. أشم الشاي الدافي.' },
];
