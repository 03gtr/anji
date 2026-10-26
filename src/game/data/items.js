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
  'shadow-1': { title: 'الظل عند البوابة', icon: 'mark', text: 'شخص طويل بجنطة ظهر، اختفى ورا البوابة. سنوكي يگول «غيمة».' },
};

/** Cosmetic unlocks: id → { slot, value, name } */
export const COSMETICS = {
  'outfit-classic': { slot: 'anjiOutfit', value: 'classic', name: 'الجاكيت الأسود', free: true },
  'outfit-cozy': { slot: 'anjiOutfit', value: 'cozy', name: 'البلوزة الدافية' },
  'outfit-clinic': { slot: 'anjiOutfit', value: 'clinic', name: 'الصدرية البيضاء' },
  'outfit-racer': { slot: 'anjiOutfit', value: 'racer', name: 'جاكيت السباق' },
  'outfit-evening': { slot: 'anjiOutfit', value: 'evening', name: 'فستان السهرة' },
  'outfit-detective': { slot: 'anjiOutfit', value: 'detective', name: 'معطف المحققة' },
  'bow-burgundy': { slot: 'anjiBow', value: 'burgundy', name: 'فيونكة خمرية', free: true },
  'bow-sapphire': { slot: 'anjiBow', value: 'sapphire', name: 'فيونكة زرقاء' },
  'bow-rose': { slot: 'anjiBow', value: 'rose', name: 'فيونكة وردية' },
  'bow-midnight': { slot: 'anjiBow', value: 'midnight', name: 'فيونكة ليلية' },
  'bow-gold': { slot: 'anjiBow', value: 'gold', name: 'فيونكة ذهبية' },
  'snooki-hat-none': { slot: 'snookiHat', value: 'none', name: 'بدون قبعة', free: true },
  'snooki-hat-detective': { slot: 'snookiHat', value: 'detective', name: 'قبعة المحقق' },
  'snooki-hat-party': { slot: 'snookiHat', value: 'party', name: 'قبعة الحفلة' },
  'snooki-hat-crown': { slot: 'snookiHat', value: 'crown', name: 'تاج الملك' },
  'snooki-hat-rose': { slot: 'snookiHat', value: 'rose', name: 'وردة زرقاء' },
  'snooki-hat-goggles': { slot: 'snookiHat', value: 'goggles', name: 'نظارات السباق' },
  'collar-navy': { slot: 'snookiCollar', value: 'navy', name: 'قلادة كحلية', free: true },
  'collar-rose': { slot: 'snookiCollar', value: 'rose', name: 'قلادة وردية' },
  'collar-gold': { slot: 'snookiCollar', value: 'gold', name: 'قلادة ذهبية' },
  'collar-mint': { slot: 'snookiCollar', value: 'mint', name: 'قلادة نعناعية' },
  'car-cobalt': { slot: 'carColor', value: 'cobalt', name: 'كوبالت', free: true },
  'car-midnight': { slot: 'carColor', value: 'midnight', name: 'منتصف الليل' },
  'car-rose': { slot: 'carColor', value: 'rose', name: 'وردي ناري' },
  'car-pearl': { slot: 'carColor', value: 'pearl', name: 'لؤلؤي' },
};

export function itemName(id) {
  return ITEMS[id]?.name ?? COLLECTIBLES[id]?.name ?? JOURNAL[id]?.title ?? COSMETICS[id]?.name ?? id;
}

/** found / total collectibles for one world (completion tracking). */
export function worldCompletion(game, world) {
  const ids = Object.entries(COLLECTIBLES).filter(([, c]) => c.world === world).map(([id]) => id);
  return { found: ids.filter((id) => game.has(id)).length, total: ids.length };
}
