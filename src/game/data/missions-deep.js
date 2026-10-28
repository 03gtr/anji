/**
 * Phase 04 «الحديقة العميقة» (The Deep Garden) — an optional continuation AFTER the
 * published ending (Phase 05). The blue rose is planted; Ryan's box for its second
 * seed, «البذرة الأخيرة», turns out to be empty. Finding it, waking it and planting
 * it next to the first rose is a new chapter, never a condition of the ending.
 * Fiction about the garden, not real memories.
 *
 * Four investigations run side by side and feed each other:
 *   dg-night   A · the contradictory night   (clocks, letters, a bed, a log, a guest book)
 *   dg-trails  D · the four hypotheses       (true and false trails, then a board that needs A)
 *   dg-stars   B · the observatory cipher    (a pattern, a star wheel set to A's hour, a mirror)
 *   dg-roots   C · the changing roots        (opens once D proves where the seed went)
 *   dg-seed    the synthesis: the seasons machine (B's light, C's and D's notes) and the
 *              last page (one strip from each investigation) → planting the second rose
 *              with Ryan in the hidden garden (`dg-planted`)
 * Optional: dg-music (the abandoned music room), dg-lighthouse (the lighthouse of memories).
 *
 * Every new location sits on the map's second page («الحديقة العميقة», `region: 'deep'`).
 * Old saves: nothing that existed before needs anything here. A finished game (any version,
 * the live one included) can start it straight away — no Story Pack 02 needed, nothing
 * replayed. Finishing the old ending never marks any of it done.
 * Missions are APPENDED to data/missions.js, so no older display number moves.
 */
export const PACK_DEEP = 'deep';
/**
 * The way in: the ending. `dg-box` also counts, so a Phase 04 preview save that started the
 * chain before its ending (it was never published) is not shut out of what it began.
 */
export const DEEP_UNLOCK = { any: ['flag:game-complete', 'flag:dg-box'] };
/** The deep places open once the empty box has been seen (which needs DEEP_UNLOCK). */
export const DEEP_OPEN = [DEEP_UNLOCK, 'flag:dg-box'];
/** The whole chain is done: the last page was put together. */
export const DEEP_DONE = 'flag:dg-done';

/** The returning-player notice (content-notice.js): once, after the ending, pointing at the box. */
export const PACKS_DEEP = [
  { id: PACK_DEEP, title: 'الحديقة العميقة', unlock: 'flag:game-complete', scene: 'workshop', world: 'workshop', notice: 'أنجي، ريان ترك علبة صغيرة بالورشة… وطلعت فارغة 📦' },
];

const OPEN_TEXT = 'تنفتح بعد نهاية الحكاية، لمن تلگين علبة البذرة الأخيرة فارغة بالورشة.';

export const MISSIONS_DEEP = [
  {
    id: 'dg-night',
    kind: 'story',
    pack: PACK_DEEP,
    world: ['workshop', 'clockgarden', 'letterhall'],
    title: 'الليلة الضائعة',
    where: 'الورشة · حديقة الساعات الساكتة · قاعة الرسائل · …',
    summary: 'علبة «البذرة الأخيرة» بالورشة فارغة. كل واحد مر بالورشة البارحة كتب شنو سوّى… بس الشهادات ما تركب ويا بعض.',
    unlock: DEEP_UNLOCK,
    locked: 'تنفتح بعد نهاية الحكاية.',
    steps: [
      { done: 'flag:dg-box', world: 'workshop', text: 'افحصي علبة البذرة الأخيرة بالورشة.', hint: 'العلبة على الطاولة الصغيرة، بين صندوق الموسيقى والماكينة.' },
      {
        done: ['flag:dg-clock-1', 'flag:dg-clock-2', 'flag:dg-clock-3', 'flag:dg-clock-4'],
        world: 'clockgarden',
        text: 'اقرئي الساعات الساكتة: كل وحدة وگفت بوقت.',
        hint: 'كل ساعة وگفت لمن أحد داس على حجرها. شوفي شنو بقى على الحجر.',
      },
      { done: 'flag:dg-letters-read', world: 'letterhall', text: 'اقرئي الشهادات اللي وصلت لقاعة الرسائل.', hint: 'ثلاث رسائل على المنضدة الطويلة.' },
      {
        done: 'flag:dg-testimony',
        world: 'letterhall',
        text: 'بكل شهادة: أي جملة غلط، وشنو يثبت؟',
        hint: 'الرسائل تذكر أماكن وأشياء. الدليل اللي يكذّب جملة لازم تشوفينه بعينچ — بمكانه.',
      },
      { done: 'flag:dg-timeline', world: 'letterhall', text: 'رتّبي الليلة من أولها لآخرها.', hint: 'الساعات تعطي الوقت؛ الشهادات المصححة تگول منو.' },
    ],
    reward: ['journal:dg-timeline'],
    rewardText: 'وقت اختفاء البذرة + شريط من الصفحة الأخيرة',
    leadsTo: ['dg-trails', 'dg-stars', 'dg-music'],
  },
  {
    id: 'dg-trails',
    kind: 'story',
    pack: PACK_DEEP,
    world: ['falsetrails', 'hyporoom'],
    title: 'الفرضيات الأربع',
    where: 'حديقة الآثار الكاذبة · غرفة الفرضيات الأربع',
    summary: 'من باب الورشة الخلفي تطلع آثار… أكثر من أثر. وأربع تفسيرات لاختفاء البذرة، كلها تبين معقولة.',
    unlock: 'flag:dg-box',
    locked: OPEN_TEXT,
    steps: [
      { done: 'flag:dg-trails', world: 'falsetrails', text: 'ميّزي الأثر الحقيقي من الآثار الكاذبة.', hint: 'افحصي الآثار الثلاثة والگرابة اللي عند الباب، وبعدين «أي أثر؟» بآخر الطريق. أي أثر انعمل ليلة البارحة؟ وأي أثر يرجع لشي ثاني؟' },
      {
        done: 'flag:dg-hypo',
        world: 'hyporoom',
        text: 'امتحني الفرضيات الأربع: أي وحدة تصمد گدام كل الأدلة؟',
        hint: 'لوحة الفرضيات تحتاج الليلة مرتبة أول. وفرضية وحدة بس ما يكذّبها ولا دليل.',
      },
    ],
    reward: ['journal:dg-hypo'],
    rewardText: 'وين راحت البذرة + طريق الجذور',
    leadsTo: ['dg-roots'],
  },
  {
    id: 'dg-stars',
    kind: 'story',
    pack: PACK_DEEP,
    world: ['sealedroom', 'starchamber', 'mirrorhouse'],
    title: 'شفرة المرصد',
    where: 'غرفة المرصد المختومة · قاعة خريطة النجوم · بيت المرايا',
    summary: 'تحت المرصد غرفة كانت مختومة، حيطانها رموز. ريان كتب شي بالنجوم… بس محد يگدر يقراه بدون مفتاح.',
    unlock: 'flag:dg-box',
    locked: OPEN_TEXT,
    steps: [
      { done: 'flag:dg-pattern', world: 'sealedroom', text: 'لگي النمط اللي يتكرر على حيطان الغرفة المختومة.', hint: 'كل سطر ينتهي بنفس الشي؟ شوفي شنو يتغير وشنو يثبت.' },
      { done: 'flag:dg-wheel', world: 'starchamber', text: 'اضبطي دولاب النجوم على الساعة الصحيحة.', hint: 'الدولاب ينتظر ساعة شي صار. أي ساعة بالقصة تهمنا هسه؟' },
      { done: 'flag:dg-mirror', world: 'mirrorhouse', text: 'اقرئي السطر اللي بالمراية بالمفتاح.', hint: 'بعض الرموز أعطاها الدولاب. الباقي يطلع من معنى الجملة.' },
    ],
    reward: ['journal:dg-mirror'],
    rewardText: 'نوع الضوء اللي تصحى بيه البذرة + شريط من الصفحة الأخيرة',
    leadsTo: ['dg-seed'],
  },
  {
    id: 'dg-roots',
    kind: 'story',
    pack: PACK_DEEP,
    world: ['roots', 'hedgemaze', 'bridge'],
    title: 'طريق الجذور',
    where: 'سرداب الجذور · متاهة السياج الدوّارة · الجسر المخفي',
    summary: 'البذرة طاحت تحت البيت الزجاجي، بين الجذور. والجذور تتنفس: بواباتها تنفتح وتنسد على نبض.',
    unlock: 'flag:dg-hypo',
    locked: 'تنفتح لمن تثبتين وين راحت البذرة.',
    steps: [
      { done: 'flag:dg-roots-maze', world: 'roots', text: 'اعبري سرداب الجذور.', hint: 'كل أمر نبضة. عدّي النبضات قبل كل بوابة.' },
      { done: 'flag:dg-hedge', world: 'hedgemaze', text: 'اعبري متاهة السياج الدوّارة.', hint: 'المفتاح أول، والنبضة لازم تركب لمن توصلين البوابة.' },
      { done: 'flag:dg-bridge', world: 'bridge', text: 'عدّلي ألواح الجسر المخفي بعدد حركات قليل.', hint: 'جربي كل ذراع وحده وشوفي السجل: بعض الأذرع تسوي شي زايد بحالات معينة.' },
    ],
    reward: ['journal:dg-bridge'],
    rewardText: 'الطريق للبيت الأخضر المنسي + شريط من الصفحة الأخيرة',
    leadsTo: ['dg-seed', 'dg-lighthouse'],
  },
  {
    id: 'dg-seed',
    kind: 'story',
    pack: PACK_DEEP,
    world: ['forgottengreen', 'evidenceroom'],
    title: 'البذرة الأخيرة',
    where: 'البيت الأخضر المنسي · غرفة الأدلة الأخيرة',
    summary: 'البذرة نايمة بآلة قديمة. الآلة ما تگول شنو تحتاج… بس كل تحقيق خلّى عندچ قطعة من الجواب.',
    unlock: ['flag:dg-bridge', 'flag:dg-mirror'],
    locked: 'تنفتح لمن توصلين البيت الأخضر المنسي وتقرين سطر المراية.',
    steps: [
      { done: 'flag:dg-awake', world: 'forgottengreen', text: 'صحّي البذرة بآلة الفصول.', hint: 'الضوء من المراية؛ الماي والدفا من ورقتين: وحدة بالجذور، ووحدة چانت بفرو سنوكي.' },
      { done: 'flag:dg-done', world: 'evidenceroom', text: 'ركّبي الصفحة الأخيرة من الأشرطة الأربعة.', hint: 'كل شريط فيه قاعدتين. القاعدة اللي ما تنطبق يذكرها التحقق.' },
      { done: 'flag:dg-planted', world: 'final', text: 'ازرعي البذرة ويا ريان، جنب الوردة الأولى.', hint: 'ريان بالحديقة المخفية، جنب الوردة اللي زرعتوها.' },
    ],
    reward: ['journal:dg-planted'],
    rewardText: 'وردة ثانية بالحديقة المخفية',
    leadsTo: [],
  },
  // optional
  {
    id: 'dg-music',
    kind: 'side',
    pack: PACK_DEEP,
    world: 'musicroom',
    title: 'غرفة الموسيقى المهجورة',
    where: 'غرفة الموسيقى المهجورة',
    summary: 'ورا حديقة الساعات غرفة بيها أجراس. صندوق الموسيقى بالورشة ناقصه مفتاح… يمكن هنا.',
    unlock: 'flag:dg-timeline',
    locked: 'تنفتح لمن ترتبين الليلة الضائعة.',
    steps: [
      { done: 'flag:dg-in-musicroom', world: 'musicroom', text: 'ادخلي غرفة الموسيقى المهجورة.', hint: 'بابها الصغير بآخر حديقة الساعات الساكتة.' },
      { done: 'flag:dg-song', world: 'musicroom', text: 'دگي الأجراس بالترتيب اللي تعرفينه.', hint: 'كل جرس عليه شي شفتيه على حجر ساعة.' },
    ],
    reward: ['journal:dg-song'],
    rewardText: 'تسجيل قديم بالصندوق + دليل إضافي (اختياري)',
    leadsTo: [],
  },
  {
    id: 'dg-lighthouse',
    kind: 'side',
    pack: PACK_DEEP,
    world: 'lighthouse',
    title: 'منارة الذكريات',
    where: 'منارة الذكريات',
    summary: 'بآخر الجسر منارة صغيرة مطفية. سنوكي يگول إنها تضوي لمن أحد يتذكر صح.',
    unlock: 'flag:dg-bridge',
    locked: 'تنفتح لمن تعبرين الجسر المخفي.',
    steps: [
      { done: 'flag:dg-in-lighthouse', world: 'lighthouse', text: 'روحي للمنارة بآخر الجسر.', hint: 'درب المنارة بنص الجسر المخفي.' },
      { done: 'flag:dg-lights', world: 'lighthouse', text: 'ضوّي فوانيس المنارة كلها.', hint: 'كل فانوس يقلب جيرانه. ابدي من الزوايا.' },
    ],
    reward: ['journal:dg-lights', 'got:keepsake.lighthouse.1'],
    rewardText: 'ذكرى صغيرة + مشهد للكلاب',
    leadsTo: [],
  },
];
