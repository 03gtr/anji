/**
 * Story Pack 02 «أرشيف الأسرار» (The Secret Archives) — part of the MAIN story,
 * played between Act IV and Act VII, before the ending (unlike Story Pack 01,
 * which is post-game).
 *
 * Order (each opens only after the previous one, never all at once):
 *   sp2-archives   (main)   after Act IV: the hidden archive, its ledger, three clues
 *                           in the house / academy / sanctuary, a deduction, a key in the observatory
 *   sp2-maze       (main)   the shifting maze on the archive floor (keys, doors, planning)
 *   sp2-sequence   (puzzle, optional) the old sequence machine
 *   sp2-letters    (main)   after Act V: three letter fragments, put them in order, sort facts from guesses
 *   sp2-gate       (main)   light the seals on the plan of «بوابة الغد» → opens Act VII
 * A step's `world` may list places as `{ id, done }`: the map then lights only those still to visit.
 *
 *   sp2-trail      (side, optional) the husky's trail — needs the husky, who is only met
 *                           after the ending (Story Pack 01), so in practice it is post-game
 *
 * Act VII (the workshop) now needs `sp2-done` — unless she has already been in
 * the workshop (any save at or past Act VII, finished games included), so no
 * existing progress is ever blocked or undone.
 */
export const PACK_SP2 = 'sp2';
export const SP2_UNLOCK = 'flag:act4-done';
/** The workshop opens when the archive seals are lit — or if she is already past that point. */
export const SP2_GATE = { any: ['flag:sp2-done', 'flag:workshop-entered'] };

export const PACKS_SP2 = [
  { id: PACK_SP2, title: 'أرشيف الأسرار', unlock: SP2_UNLOCK, scene: 'archives', world: 'archives', notice: 'أنجي، بالحديقة انفتح مكان سري جديد: أرشيف الأسرار 🗝️' },
];

export const MISSIONS_SP2 = [
  {
    id: 'sp2-archives',
    kind: 'story',
    pack: PACK_SP2,
    chapter: 5,
    world: 'archives',
    title: 'أرشيف الأسرار',
    where: 'أرشيف الأسرار · البيت · الأكاديمية · المحمية · المرصد',
    summary: 'غرفة مخفية مليانة رفوف وسجلات. سجل واحد مفتوح، وبيه رموز تأشر على أماكن ثانية.',
    unlock: SP2_UNLOCK,
    locked: 'تنفتح بعد ما تخلصين تحقيق سنوكي الكبير (الفصل الرابع).',
    steps: [
      { done: 'flag:sp2-entered', world: 'archives', text: 'ادخلي أرشيف الأسرار (من الخريطة).', hint: 'على الخريطة: تحت البيت الغامض، يمين البيت الزجاجي.' },
      { done: 'flag:sp2-ledger-read', world: 'archives', text: 'اقرئي السجل المفتوح على الطاولة.', hint: 'الطاولة بنص الأرشيف.' },
      {
        done: ['flag:sp2-clue-a', 'flag:sp2-clue-b', 'flag:sp2-clue-c'],
        world: [{ id: 'house', done: 'flag:sp2-clue-a' }, { id: 'academy', done: 'flag:sp2-clue-b' }, { id: 'sanctuary', done: 'flag:sp2-clue-c' }],
        text: 'لگي العلامات الثلاث اللي يذكرها السجل.',
        hint: 'وحدة بالبيت (قرب الدرج)، وحدة بالأكاديمية (ورا لوحة التحقيق)، ووحدة بالمحمية (على عمود خشب).',
      },
      { done: 'flag:sp2-deduced', world: 'archives', text: 'استنتجي من العلامات وين المفتاح الثاني.', hint: 'كل علامة تشطب مكان واحد. العلامات الثلاث سوا تخلّي مكان واحد بس.' },
      { done: 'flag:sp2-archives-done', world: 'observatory', text: 'جيبي المفتاح من المكان اللي استنتجتيه.', hint: 'المكان اللي يشوف السما، بعيد عن الماي، وما بيه ورد.' },
    ],
    reward: ['journal:sp2-key'],
    rewardText: 'مفتاح الأرشيف الثاني + أول ختم بالمخطط',
    leadsTo: ['sp2-maze'],
  },
  {
    id: 'sp2-maze',
    kind: 'story',
    pack: PACK_SP2,
    chapter: 5,
    world: 'archives',
    title: 'المتاهة المتغيرة',
    where: 'أرشيف الأسرار · الأرضية',
    summary: 'أرضية الأرشيف مربعات تتحرك، وبيها أبواب صغيرة ومفاتيح. لازم تخططين الطريق قبل ما تمشين.',
    unlock: 'flag:sp2-archives-done',
    locked: 'تنفتح لمن تلگين مفتاح الأرشيف الثاني.',
    steps: [
      { done: 'flag:sp2-inner-open', world: 'archives', text: 'افتحي الباب الداخلي بالأرشيف بالمفتاح الثاني.', hint: 'الباب بآخر الأرشيف، يمين الرفوف.' },
      { done: 'flag:sp2-maze-done', world: 'archives', text: 'اعبري المتاهة المتغيرة (ثلاث مستويات).', hint: 'كل باب يحتاج مفتاحه. خططي: المفتاح أول، بعدين الباب.' },
    ],
    reward: ['journal:sp2-maze'],
    rewardText: 'الختم الثاني بالمخطط',
    leadsTo: ['sp2-letters', 'sp2-sequence'],
  },
  {
    id: 'sp2-sequence',
    kind: 'puzzle',
    pack: PACK_SP2,
    chapter: 5,
    world: 'archives',
    title: 'آلة التسلسل',
    where: 'أرشيف الأسرار · الزاوية',
    summary: 'آلة قديمة تكمّل الأنماط. ما تقول القاعدة… بس تعطي أمثلة.',
    unlock: 'flag:sp2-inner-open',
    locked: 'تنفتح لمن تفتحين الباب الداخلي بالأرشيف.',
    steps: [
      { done: 'seen:it.archives.machine', world: 'archives', text: 'افحصي الآلة القديمة بزاوية الأرشيف.', hint: 'ورا الباب الداخلي، جنب الرفوف العالية.' },
      { done: 'flag:sp2-sequence-done', world: 'archives', text: 'شغّلي آلة التسلسل (أربع مستويات).', hint: 'قارني الأمثلة: شنو يتغير من رقم للي بعده؟ بالمستوى الأخير أكو قاعدتين يتناوبن.' },
    ],
    reward: ['journal:sp2-sequence'],
    rewardText: 'ختم إضافي (اختياري) بالمخطط',
    leadsTo: [],
  },
  {
    id: 'sp2-letters',
    kind: 'story',
    pack: PACK_SP2,
    chapter: 6,
    world: 'archives',
    title: 'الرسائل المفقودة',
    where: 'المرصد · المكتبة السرية · البحيرة القمرية · الأرشيف',
    summary: 'رسالة على ميز الأرشيف ناقصة. القطع الباقية بأماكن ثانية — وبعضها ما يفهم إلا لمن تنقرى ويّا غيرها.',
    unlock: ['flag:sp2-maze-done', 'flag:act5-done'],
    locked: 'تنفتح بعد المتاهة المتغيرة وبعد الفصل الخامس.',
    steps: [
      {
        done: ['flag:sp2-letter-1', 'flag:sp2-letter-2', 'flag:sp2-letter-3'],
        world: [{ id: 'observatory', done: 'flag:sp2-letter-1' }, { id: 'library', done: 'flag:sp2-letter-2' }, { id: 'lake', done: 'flag:sp2-letter-3' }],
        text: 'لگي قطع الرسائل الثلاث.',
        hint: 'وحدة بالمرصد (قرب المدخل)، وحدة بالمكتبة السرية (بين الرفوف)، ووحدة بالبحيرة القمرية (على الشط).',
      },
      { done: 'flag:sp2-letters-ordered', world: 'archives', text: 'رتّبي الرسائل حسب وقتها على ميز الأرشيف.', hint: 'كل رسالة تذكر شي صار بالرسالة اللي قبلها.' },
      { done: 'flag:sp2-letters-done', world: 'archives', text: 'ميّزي المكتوب بالرسائل عن الاستنتاج.', hint: 'المؤكد: مكتوب حرفياً. الاستنتاج: شي نفكر بيه، بس محد كتبه.' },
    ],
    reward: ['journal:sp2-letters'],
    rewardText: 'الختم الثالث بالمخطط',
    leadsTo: ['sp2-gate'],
  },
  {
    id: 'sp2-gate',
    kind: 'story',
    pack: PACK_SP2,
    chapter: 6,
    world: 'archives',
    title: 'بوابة الغد',
    where: 'أرشيف الأسرار · المخطط',
    summary: 'على حايط الأرشيف مخطط بوابة اسمها «بوابة الغد»، بيه أختام فارغة. كل سر ينحل يضوي ختم.',
    unlock: 'flag:sp2-letters-done',
    locked: 'تنفتح لمن تخلصين الرسائل المفقودة.',
    steps: [
      { done: 'flag:sp2-plan-studied', world: 'archives', text: 'افحصي مخطط بوابة الغد بعد ما ضوت أختامه.', hint: 'المخطط معلّق على الحايط بأول الأرشيف.' },
      { done: 'flag:sp2-done', world: 'archives', text: 'ضوّي الأختام الثلاثة.', hint: 'الأرشيف، المتاهة، والرسائل: كل وحدة ختم.' },
    ],
    reward: ['journal:sp2-gate'],
    rewardText: 'باب الورشة ينفتح (الفصل السابع)',
    leadsTo: [],
  },
  {
    id: 'sp2-trail',
    kind: 'side',
    pack: PACK_SP2,
    chapter: 9,
    world: ['garden', 'meadow', 'sanctuary', 'roseclinic'],
    title: 'أثر الهاسكي',
    where: 'الحديقة الضائعة · المرج · المحمية · عيادة الورد',
    summary: '{husky} لگت أثر كفوف قديم بالحديقة، ومصرّة نتبعه.',
    unlock: ['flag:sp1-husky-met', 'flag:sp2-archives-done'],
    locked: 'تنفتح لمن تتعرفين على الهاسكي البيضاء (بعد نهاية الحكاية) وتلگين مفتاح الأرشيف.',
    steps: [
      {
        done: ['flag:sp2-trail-1', 'flag:sp2-trail-2', 'flag:sp2-trail-3'],
        world: [{ id: 'garden', done: 'flag:sp2-trail-1' }, { id: 'meadow', done: 'flag:sp2-trail-2' }, { id: 'sanctuary', done: 'flag:sp2-trail-3' }],
        text: 'اتبعي آثار الكفوف الثلاثة.',
        hint: 'جنب النافورة بالحديقة الضائعة، تحت الشجرة الكبيرة بالمرج، وقرب السياج بالمحمية.',
      },
      { done: 'flag:sp2-trail-done', world: 'roseclinic', text: 'گولي لـ{husky} وين ينتهي الأثر.', hint: 'المكان اللي بيه ماي، وضوء قمر، وقارب.' },
    ],
    reward: ['journal:sp2-trail'],
    rewardText: 'ختم إضافي (اختياري) + جرس فضي صغير',
    leadsTo: [],
  },
];
