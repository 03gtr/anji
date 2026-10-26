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
  // V2
  'shelf-key': { name: 'مفتاح صغير بشكل وردة', icon: 'key', text: 'من درج ميز ريان. يفتح الرف العالي بالمكتب.' },
  'night-key': { name: 'مفتاح زفيرو الاحتياطي', icon: 'car', text: 'مكتوب عليه بقلم: «للطريق للبيت».' },
  lunchbox: { name: 'علبة أكل البيت', icon: 'apple', text: 'أكل البيت، مطبوخ من وصفة كانت ممزقة. ريحته… ريحة بيت.' },
  diploma: { name: 'شهادة محققة', icon: 'paw', text: '«تشهد أكاديمية سنوكي إن أنجي محققة ممتازة. التوقيع: 🐾». الختم بالبسكويت.' },
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
  // V2 side missions
  'star.study.1': { name: 'نجمة فوق رف المكتب', world: 'study' },
  'scrap.study.1': { name: 'قصاصة وصفة: «بروتين»', world: 'study', text: '«…شي يقوّي: بيض أو سمچ…»' },
  'scrap.conservatory.1': { name: 'قصاصة وصفة: «خضرة»', world: 'conservatory', text: '«…شي أخضر من الأرض…»' },
  'scrap.sanctuary.1': { name: 'قصاصة وصفة: «يشبّع»', world: 'sanctuary', text: '«…شي يشبّع: تمّن أو خبز. وبدون أكل سريع!»' },
  'star.passage.1': { name: 'نجمة فوق رفوف الممر', world: 'passage' },
  'star.passage.2': { name: 'نجمة جنب العتلة', world: 'passage' },
  'seed.passage.1': { name: 'بذور بالممر المخفي', world: 'passage' },
  'note.ryan.7': {
    name: 'ورقة على شباك الانتظار',
    world: 'passage',
    text: '«من هالشباك أشوف الطريق اللي تجين منه. الوقت مو دايماً نفسه، وهذا طبيعي. أحلى شي بالانتظار… إنه ينتهي بيچ. — R»',
  },
  'star.meadow.1': { name: 'نجمة فوق الشجرة الكبيرة', world: 'meadow' },
  'star.meadow.2': { name: 'نجمة فوق الصخور', world: 'meadow' },
  'seed.meadow.1': { name: 'بذور بين الزهور', world: 'meadow' },
  'note.ryan.8': {
    name: 'ورقة بطوق فيروز',
    world: 'meadow',
    text: '«إذا لگيتي فيروز، فإنتي لگيتي أكثر مخلوق عنيد بالحديقة. ثاني أكثر واحد. — R»',
  },
  'star.observatory.2': { name: 'نجمة من السما الثانية', world: 'observatory' },
  'note.ryan.9': {
    name: 'الرسالة التاسعة (من الأرشيف)',
    world: 'corridor',
    text: '«كل رسالة كتبتها چانت جملة وحدة بس. لأن الكلام الطويل… أحب أگوله وجهاً لوجه. — R»',
  },
  'petal.hedge.1': { name: 'بتلة المتاهة', world: 'maze' },
  'petal.hedge.2': { name: 'بتلة المتاهة', world: 'maze' },
  'petal.hedge.3': { name: 'بتلة المتاهة', world: 'maze' },
};

export const GROUP_NAMES = { star: 'نجوم', note: 'رسائل ريان', seed: 'بذور', petal: 'بتلات', scrap: 'قصاصات الوصفة' };

/** Journal entries (story knowledge). */
export const JOURNAL = {
  snooki: { title: 'سنوكي', icon: 'paw', text: 'هاسكي سيبيري، أبيض، يسمّي نفسه «مستشار أمني بفرو». ما يعرف الطريق، بس واثق.' },
  engraving: { title: 'نقش النافورة', icon: 'moon-full', text: '«من الظلام، إلى النور الكامل. هكذا تتفتح الوردة.»' },
  mark: { title: 'ختم الصانع', icon: 'mark', text: 'وردة ساقها ملفوف على شكل حرف R. موجود على كل شي سوّاه ريان.' },
  'map-1': { title: 'قطعة الخريطة الأولى', icon: 'map', text: 'خريطة المتاهة. تقدرين تلقين نظرة عليها مرتين داخل المتاهة.' },
  house: { title: 'البيت اللي يتذكر', icon: 'key', text: 'الأضواء تشتعل ويّا خطواتي، والإطارات كلها فاضية. «الإطارات تنطر الوجوه الصح.»' },
  clock: { title: 'الساعة الواقفة', icon: 'moon-half', text: 'ساعة الممر واقفة على ٢:٣٠. سنوكي يگول: «كأن صاحب البيت چان ينتظر أحد». وآني أعرف هالوقت… وقت ما يخلص الدوام، تقريباً.' },
  recipe: { title: 'بطاقة الوصفة', icon: 'honey', text: 'زبادي، توت، عسل… «خلّي المؤقت على ٠٢:٣٠».' },
  'letter-1': { title: 'رسالة من المستقبل', icon: 'heart', text: 'رسالة ريان مكتوب عليها تاريخ باچر. «لا تدوّرين عليّ هسه.»' },
  contradiction: { title: 'التناقض الأول', icon: 'coffee', text: 'ريان «مختفي»… بس القهوة على ميزه بعدها دافية. سنوكي يعرف أكثر مما يگول.' },
  'voice-1': { title: 'صوت ريان بالراديو', icon: 'note', text: '«الطريق الأزرق إله ثلاث مراحل… وإذا وصلتي للجسر بالليل، باوعي يمين.»' },
  'map-2': { title: 'قطعة الخريطة الثانية', icon: 'map', text: 'تل، وفوقه برج بقبة: المرصد.' },
  'observatory-light': { title: 'ضوء بالمرصد', icon: 'star', text: 'من فوق الجسر شفت ضوء بالمرصد. أحد هناك… ريان؟' },
  case: { title: 'قضية الخريطة المختفية', icon: 'map', text: 'قطعة الخريطة الثانية اختفت من جنطتي بالليل. سنوكي فتح «أكاديمية» للتحقيق.' },
  confession: { title: 'اعتراف سنوكي', icon: 'paw', text: 'سنوكي خبّى الخريطة بتعليمات من ريان: «خلّيها تعرف الحديقة قبل ما تعرف ليش انبنت.» والمرصد يضوي بالليل.' },
  munther: { title: 'العم منذر', icon: 'star', text: 'بومة فلكية طيبة وغريبة الأطوار. واثق من نفسه أكثر من اللازم، ويسمّي سنوكي «ذيب». «الصانع شال العدسة للمكتبة… لحد ما تجي هي».' },
  'mark-a': { title: 'الختم الحقيقي', icon: 'mark', text: 'الورقة اللي جنب ساق الوردة مو ورقة: هي حرف A. الختم مو بس R.' },
  name: { title: 'اسمي بالنجوم', icon: 'heart', text: 'ريان كتب «أنجي» بالنجوم. الحديقة انبنت إلي.' },
  'map-3': { title: 'قطعة الخريطة الثالثة', icon: 'map', text: 'ممر طويل بإطارات، وبحيرة يضويها القمر.' },
  'rose-key': { title: 'مفتاح الوردة', icon: 'key', text: 'لمن الإطارات ضوت والفوانيس طارت، طلع مفتاح من البحيرة.' },
  'final-letter': { title: 'الرسالة الأخيرة', icon: 'heart', text: 'الماكينة خيّطت قطع الخريطة سوا، وبنصها رسالة: «تعالي.»' },
  ending: { title: 'الحديقة المخفية', icon: 'rose', text: 'لگيت ريان تحت شجرة الورد الزرقاء. گال الحقيقة بوضوح، وما طلب شي. زرعنا وردة زرقاء سوا — والباقي نحچيه إحنا.' },
  'shadow-1': { title: 'الظل عند البوابة', icon: 'mark', text: 'شخص طويل بجنطة ظهر، اختفى ورا البوابة. سنوكي يگول «غيمة».' },
  // V2
  symbols: { title: 'رموز بالظلام', icon: 'moon-new', text: 'لمن طفيت الأباجورة، لمعت أربع رموز على الحايط. من اليمين لليسار: وردة، سيارة، كف، قمر.' },
  'build-message': { title: 'رسالة الدرج', icon: 'note', text: '«الساعة بالممر؟ وقفتها على الوقت اللي دايماً أكون بيه ناطر برّا… الوقت يتغير، وماكو مشكلة. بس هذا صار أحلى وقت باليوم.»' },
  'waiting-room': { title: 'غرفة الانتظار', icon: 'heart', text: 'ورا رف المكتب، غرفة صغيرة بشباك يطل على الطريق. كرسي واحد، وساعة واقفة على ٢:٣٠. الانتظار هنا مو ثقل… هو عادة حلوة.' },
  'night-run': { title: 'الطريق للبيت', icon: 'car', text: 'سباق ليلي للبيت، وسيارة رصاصية قدّامنا. سنوكي رفض يگول منو ربح. «الحكم محايد».' },
  'home-meal': { title: 'أكل البيت', icon: 'apple', text: 'ريان كتب: «أطيب أكل چان اللي جابته من البيت. ما أعرف الوصفة… بس أعرف شلون حسّيت.» هسه الوصفة كاملة.' },
  kitten: { title: 'فيروز', icon: 'paw', text: 'قطوة صغيرة بعيون فيروزية ضاعت بالمرج. نزلت من الشجرة لمن گعدت واطية وحچيت بهدوء. هسه بأمان ويّا أمها.' },
  'second-sky': { title: 'السما الثانية', icon: 'star', text: 'ثلاث كوكبات بكتاب العم منذر: كف، سيارة، و«عظمة» — اللي طلعت دمبل. العم منذر: «دمبل فضائي.»' },
  robo: { title: 'روبو-سنوكي', icon: 'paw', text: 'روبوت صغير بشكل جرو، v0.3. برمجته يمشي للعظمة. سنوكي غار… بعدين صاروا أصدقاء. تقريباً.' },
  diploma: { title: 'شهادة المحققة', icon: 'paw', text: 'نجحت بامتحان سنوكي. هو يگول الامتحان «أصعب امتحان بالتاريخ». أغلب الأسئلة چانت عنه.' },
  style: { title: 'منسّق الأزياء', icon: 'crown', text: 'سنوكي حكم على ثلاث إطلالات. رأيه قاسي، بس بالآخر عطاني فيونكة.' },
  archive: { title: 'أرشيف الرسائل', icon: 'note', text: 'ثمان رسائل بثمان فتحات… وبالدرج رسالة تاسعة: «الكلام الطويل أحب أگوله وجهاً لوجه.»' },
  gardener: { title: 'حديقتي', icon: 'rose', text: 'الحديقة المخفية صار بيها أشياء من كل مغامرة: بيت فيروز، روبو-سنوكي، طاولة أكل البيت… على ذوقي.' },
  drawing: { title: 'الرسمة', icon: 'heart', text: 'ورقة مطوية صغيرة، بيها رسمة بخط اليد. محفوظة هنا، أفتحها وقت ما أريد.', open: 'drawing', openLabel: 'افتحي الرسمة' },
  'ending-hope': { title: 'حديقة الأمل', icon: 'rose', text: 'زرعنا وردة زرقاء سوا. كل الأدلة چانت تگول نفس الشي: الوقت اللي نختاره لبعض أهم من أي شي ثاني.' },
  'ending-memories': { title: 'حديقة الذكريات', icon: 'rose', text: 'زرعنا وردة زرقاء سوا، والرسائل كلها صارت أوراق بالشجرة. اللي فات حلو… واللي جاي نكتبه سوا.' },
  'ending-growing': { title: 'حديقة بعدها تكبر', icon: 'rose', text: 'زرعنا وردة زرقاء سوا. بعد أكو أبواب ما انفتحت وأسرار ما انلگت — والحديقة، مثلنا، بعدها تكبر.' },
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
  'bow-emerald': { slot: 'anjiBow', value: 'emerald', name: 'فيونكة زمردية', hint: 'تحدي الإطلالة' },
  'outfit-sport': { slot: 'anjiOutfit', value: 'sport', name: 'بدلة الجيم', hint: 'تحدي الإطلالة' },
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
  'collar-sky': { slot: 'snookiCollar', value: 'sky', name: 'قلادة سماوية', hint: 'مهمة فيروز' },
  'car-cobalt': { slot: 'carColor', value: 'cobalt', name: 'كوبالت', free: true },
  'car-midnight': { slot: 'carColor', value: 'midnight', name: 'منتصف الليل', hint: 'خلّصي الحلبة الثانية' },
  'car-rose': { slot: 'carColor', value: 'rose', name: 'وردي ناري', hint: 'ذهبية بالحلبة الأولى' },
  'car-pearl': { slot: 'carColor', value: 'pearl', name: 'لؤلؤي', hint: 'خلّصي كل الحلبات' },
  'car-emerald': { slot: 'carColor', value: 'emerald', name: 'زمردي', hint: 'الطريق للبيت' },
};

export function itemName(id) {
  return ITEMS[id]?.name ?? COLLECTIBLES[id]?.name ?? JOURNAL[id]?.title ?? COSMETICS[id]?.name ?? id;
}

/** found / total collectibles for one world (completion tracking). */
export function worldCompletion(game, world) {
  const ids = Object.entries(COLLECTIBLES).filter(([, c]) => c.world === world).map(([id]) => id);
  return { found: ids.filter((id) => game.has(id)).length, total: ids.length };
}
