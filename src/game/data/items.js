/**
 * Items (inventory), collectibles (stars, Ryan's notes, rose seeds, petals),
 * journal entries and cosmetic unlocks. Stable ids: they are stored in saves.
 */
export const ITEMS = {
  'map-1': { name: 'قطعة خريطة (١)', icon: 'map', text: 'مرسوم عليها طريق المتاهة بخط إيد ريان.' },
  'map-2': { name: 'قطعة خريطة (٢)', icon: 'map', text: 'طريق بين البيت والكراج.' },
  'map-3': { name: 'قطعة خريطة (٣)', icon: 'map', text: 'نجوم مرسومة فوق برج المرصد.' },
  'garage-key': { name: 'مفتاح الكراج', icon: 'key', text: 'مفتاح صغير عليه وردة زرقاء.' },
  'star-lens': { name: 'عدسة النجوم', icon: 'star', text: 'عدسة زرقاء تكمّل تلسكوب المرصد.' },
  'blue-thread': { name: 'خيط أزرق', icon: 'leaf', text: 'خيط من فستان قديم. سنوكي يگول «دليل».' },
  'rose-key': { name: 'مفتاح الوردة', icon: 'key', text: 'مفتاح على شكل وردة، طلع من البحيرة. يفتح الورشة.' },
  treat: { name: 'بسكويت سنوكي', icon: 'bone', text: 'عملة سنوكي الرسمية.' },
};

/** Collectibles: id → { name, world, text? } */
export const COLLECTIBLES = {
  'star.garden.1': { name: 'نجمة فوق السور', world: 'garden' },
  'star.garden.2': { name: 'نجمة ورا الشجيرة', world: 'garden' },
  'star.garden.3': { name: 'نجمة بآخر الحديقة', world: 'garden' },
  'star.conservatory.1': { name: 'نجمة الرفوف', world: 'conservatory' },
  'star.conservatory.2': { name: 'نجمة البيت الزجاجي', world: 'conservatory' },
  'seed.garden.1': { name: 'بذور ورد أزرق', world: 'garden' },
  'seed.conservatory.1': { name: 'بذور ورد أزرق', world: 'conservatory' },
  'note.ryan.1': {
    name: 'ورقة على المصطبة',
    world: 'garden',
    text: '«إذا لگيتي هاي الورقة، يعني سنوكي ضيّع الطريق مرة ثانية. لا تعصّبين عليه، هو يحاول. — R»',
  },
  'note.ryan.2': {
    name: 'ورقة بين السنادين',
    world: 'conservatory',
    text: '«الورد الأزرق ما ينبت طبيعياً. لازم أحد يصرّ عليه. أنا مصرّ. — R»',
  },
  'star.house.1': { name: 'نجمة فوق رف الكتب', world: 'house' },
  'star.house.2': { name: 'نجمة فوق البوفيه', world: 'house' },
  'seed.house.1': { name: 'بذور ورد من المطبخ', world: 'house' },
  'note.ryan.3': {
    name: 'رسالة مختومة من المكتب',
    world: 'house',
    text: '«إذا قريتي هاي، فإنتي وصلتي أبكر مما توقعت. لا تدوّرين عليّ هسه. خلّي الحديقة تعرّفچ بنفسها أول. — R» (والتاريخ: باچر.)',
  },
  'star.garage.1': { name: 'نجمة فوق الطاولة', world: 'garage' },
  'star.garage.2': { name: 'نجمة قرب السقف', world: 'garage' },
  'note.ryan.4': { name: 'ورقة بدرج السيارة', world: 'garage', text: '«سنوكي، إذا دتقرا هاي: لا. — R»' },
  'star.academy.1': { name: 'نجمة فوق رف المحقق', world: 'academy' },
  'seed.academy.1': { name: 'بذور بزاوية الأكاديمية', world: 'academy' },
  'star.sanctuary.1': { name: 'نجمة فوق الشجرة', world: 'sanctuary' },
  'star.sanctuary.2': { name: 'نجمة بآخر المحمية', world: 'sanctuary' },
  'star.observatory.1': { name: 'نجمة قرب القبة', world: 'observatory' },
  'seed.observatory.1': { name: 'بذور تحت خرايط النجوم', world: 'observatory' },
  'star.library.1': { name: 'نجمة فوق السلّم', world: 'library' },
  'note.ryan.5': { name: 'ورقة بالمكتبة', world: 'library', text: '«بعض الأسماء لازم تنكتب بالنجوم، لأن الورق ما يكفيها. — R»' },
  'seed.corridor.1': { name: 'بذور بآخر الممر', world: 'corridor' },
  'star.lake.1': { name: 'نجمة فوق الصخور', world: 'lake' },
  'star.lake.2': { name: 'نجمة جنب الفانوس', world: 'lake' },
  'star.workshop.1': { name: 'نجمة فوق رفوف الورشة', world: 'workshop' },
  'star.final.1': { name: 'نجمة فوق الحديقة المخفية', world: 'final' },
  'seed.final.1': { name: 'بذور عند المدخل', world: 'final' },
  'note.ryan.6': {
    name: 'الرسالة الأخيرة',
    world: 'workshop',
    text: '«أنجي. ما اختفيت. چنت أبني آخر غرفة… وهاي الغرفة ما تنفتح من جوّا. تنفتح بس من برّا، بإيد اللي انبنت إلها. وهسه… تعالي. — R»',
  },
  'petal.hedge.1': { name: 'بتلة المتاهة', world: 'maze' },
  'petal.hedge.2': { name: 'بتلة المتاهة', world: 'maze' },
  'petal.hedge.3': { name: 'بتلة المتاهة', world: 'maze' },
};

export const GROUP_NAMES = { star: 'نجوم', note: 'رسائل ريان', seed: 'بذور', petal: 'بتلات' };

/** Journal entries (story knowledge). */
export const JOURNAL = {
  snooki: { title: 'سنوكي', icon: 'paw', text: 'هاسكي سيبيري، أبيض، يسمّي نفسه «مستشار أمني بفرو». ما يعرف الطريق، بس واثق.' },
  engraving: { title: 'نقش النافورة', icon: 'moon-full', text: '«من الظلام، إلى النور الكامل. هكذا تتفتح الوردة.»' },
  mark: { title: 'ختم الصانع', icon: 'mark', text: 'وردة ساقها ملفوف على شكل حرف R. موجود على كل شي سوّاه ريان.' },
  'map-1': { title: 'قطعة الخريطة الأولى', icon: 'map', text: 'خريطة المتاهة. تقدرين تلقين نظرة عليها مرتين داخل المتاهة.' },
  house: { title: 'البيت اللي يتذكر', icon: 'key', text: 'الأضواء تشتعل ويّا خطواتي، والإطارات كلها فاضية. «الإطارات تنطر الوجوه الصح.»' },
  clock: { title: 'الساعة الواقفة', icon: 'moon-half', text: 'ساعة الممر واقفة على ٧:١٤. «الوحيدة اللي تعرف الوقت الصح.»' },
  recipe: { title: 'بطاقة الوصفة', icon: 'honey', text: 'زبادي، توت، عسل… «خلّي المؤقت على ٠٧:١٤».' },
  'letter-1': { title: 'رسالة من المستقبل', icon: 'heart', text: 'رسالة ريان مكتوب عليها تاريخ باچر. «لا تدوّرين عليّ هسه.»' },
  contradiction: { title: 'التناقض الأول', icon: 'coffee', text: 'ريان «مختفي»… بس الشاي على مكتبه بعده دافي. سنوكي يعرف أكثر مما يگول.' },
  'voice-1': { title: 'صوت ريان بالراديو', icon: 'note', text: '«الطريق الأزرق إله ثلاث مراحل… وإذا وصلتي للجسر بالليل، باوعي يمين.»' },
  'map-2': { title: 'قطعة الخريطة الثانية', icon: 'map', text: 'تل، وفوقه برج بقبة: المرصد.' },
  'observatory-light': { title: 'ضوء بالمرصد', icon: 'star', text: 'من فوق الجسر شفت ضوء بالمرصد. أحد هناك… ريان؟' },
  case: { title: 'قضية الخريطة المختفية', icon: 'map', text: 'قطعة الخريطة الثانية اختفت من جنطتي بالليل. سنوكي فتح «أكاديمية» للتحقيق.' },
  confession: { title: 'اعتراف سنوكي', icon: 'paw', text: 'سنوكي خبّى الخريطة بتعليمات من ريان: «خلّيها تعرف الحديقة قبل ما تعرف ليش انبنت.» والمرصد يضوي بالليل.' },
  hoot: { title: 'دكتور هوت', icon: 'star', text: 'بومة فلكية متعبة. «الصانع شال العدسة للمكتبة… لحد ما تجي هي».' },
  'mark-a': { title: 'الختم الحقيقي', icon: 'mark', text: 'الورقة اللي جنب ساق الوردة مو ورقة: هي حرف A. الختم مو بس R.' },
  name: { title: 'اسمي بالنجوم', icon: 'heart', text: 'ريان كتب «أنجي» بالنجوم. الحديقة انبنت إلي.' },
  'map-3': { title: 'قطعة الخريطة الثالثة', icon: 'map', text: 'ممر طويل بإطارات، وبحيرة يضويها القمر.' },
  'rose-key': { title: 'مفتاح الوردة', icon: 'key', text: 'لمن الإطارات ضوت والفوانيس طارت، طلع مفتاح من البحيرة.' },
  'final-letter': { title: 'الرسالة الأخيرة', icon: 'heart', text: 'الماكينة خيّطت قطع الخريطة سوا، وبنصها رسالة: «تعالي.»' },
  ending: { title: 'الحديقة المخفية', icon: 'rose', text: 'لگيت ريان تحت شجرة الورد الزرقاء. «الحديقة إلچ. وآني راح أكون هنا.» — وعد.' },
  'shadow-1': { title: 'الظل عند البوابة', icon: 'mark', text: 'شخص طويل بجنطة ظهر، اختفى ورا البوابة. سنوكي يگول «غيمة».' },
};

/** Cosmetic unlocks: id → { slot, value, name } */
export const COSMETICS = {
  'outfit-classic': { slot: 'anjiOutfit', value: 'classic', name: 'الجاكيت الأسود', free: true },
  'outfit-cozy': { slot: 'anjiOutfit', value: 'cozy', name: 'البلوزة الدافية', hint: 'لگيها بغرفة الملابس' },
  'outfit-clinic': { slot: 'anjiOutfit', value: 'clinic', name: 'الصدرية البيضاء', hint: 'بالمستوصف… إذا تجرّئين' },
  'outfit-racer': { slot: 'anjiOutfit', value: 'racer', name: 'جاكيت السباق', hint: 'اربحي سباق بطريق الأضواء الزرقاء' },
  'outfit-evening': { slot: 'anjiOutfit', value: 'evening', name: 'فستان السهرة', hint: 'بنهاية الحكاية' },
  'outfit-detective': { slot: 'anjiOutfit', value: 'detective', name: 'معطف المحققة', hint: 'خلّصي تحقيق سنوكي الكبير' },
  'bow-burgundy': { slot: 'anjiBow', value: 'burgundy', name: 'فيونكة خمرية', free: true },
  'bow-sapphire': { slot: 'anjiBow', value: 'sapphire', name: 'فيونكة زرقاء', hint: 'بغرفة الملابس' },
  'bow-rose': { slot: 'anjiBow', value: 'rose', name: 'فيونكة وردية', hint: 'بغرفة الملابس' },
  'bow-midnight': { slot: 'anjiBow', value: 'midnight', name: 'فيونكة ليلية', hint: 'ذهبية بفوانيس البحيرة' },
  'bow-gold': { slot: 'anjiBow', value: 'gold', name: 'فيونكة ذهبية', hint: 'اجمعي ١٠ نجوم' },
  'snooki-hat-none': { slot: 'snookiHat', value: 'none', name: 'بدون قبعة', free: true },
  'snooki-hat-detective': { slot: 'snookiHat', value: 'detective', name: 'قبعة المحقق', hint: 'أكاديمية سنوكي' },
  'snooki-hat-party': { slot: 'snookiHat', value: 'party', name: 'قبعة الحفلة', hint: 'ذهبية بمطبخ الطاقة' },
  'snooki-hat-crown': { slot: 'snookiHat', value: 'crown', name: 'تاج الملك', hint: 'متاهة منتصف الليل' },
  'snooki-hat-rose': { slot: 'snookiHat', value: 'rose', name: 'وردة زرقاء', hint: 'اجمعي كل بذور الورد' },
  'snooki-hat-goggles': { slot: 'snookiHat', value: 'goggles', name: 'نظارات السباق', hint: 'خلّصي أول سباق' },
  'collar-navy': { slot: 'snookiCollar', value: 'navy', name: 'قلادة كحلية', free: true },
  'collar-rose': { slot: 'snookiCollar', value: 'rose', name: 'قلادة وردية', hint: 'ذهبية بهروب الإبرة' },
  'collar-gold': { slot: 'snookiCollar', value: 'gold', name: 'قلادة ذهبية', hint: 'ذهبية بكل سباقات الطريق' },
  'collar-mint': { slot: 'snookiCollar', value: 'mint', name: 'قلادة نعناعية', hint: 'محمية الحيوانات' },
  'car-cobalt': { slot: 'carColor', value: 'cobalt', name: 'كوبالت', free: true },
  'car-midnight': { slot: 'carColor', value: 'midnight', name: 'منتصف الليل', hint: 'خلّصي الحلبة الثانية' },
  'car-rose': { slot: 'carColor', value: 'rose', name: 'وردي ناري', hint: 'ذهبية بالحلبة الأولى' },
  'car-pearl': { slot: 'carColor', value: 'pearl', name: 'لؤلؤي', hint: 'خلّصي كل الحلبات' },
};

export function itemName(id) {
  return ITEMS[id]?.name ?? COLLECTIBLES[id]?.name ?? JOURNAL[id]?.title ?? COSMETICS[id]?.name ?? id;
}

/** found / total collectibles for one world (completion tracking). */
export function worldCompletion(game, world) {
  const ids = Object.entries(COLLECTIBLES).filter(([, c]) => c.world === world).map(([id]) => id);
  return { found: ids.filter((id) => game.has(id)).length, total: ids.length };
}
