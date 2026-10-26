/**
 * The games room's two boards: gentle activities («أنشطة الحديقة») and the
 * prank board («مقالب ريان وسنوكي»). Each entry is an action list run by the
 * world (say / puzzle / game), so it plays exactly like story content.
 * Every one is optional, can be left at any time, and resolves with a reward
 * (journal entry, card back, decoration, outfit or hat) applied once.
 */
const intro = (lines) => ({ say: lines });

export const ACTIVITIES = [
  {
    id: 'delivery',
    title: 'توصيل الوردة',
    text: 'وردة زرقاء لازم توصل لمكانها. سنوكي مصرّ يشيلها بنفسه.',
    icon: 'rose',
    done: 'flag:deliver-done',
    run: [
      intro([
        { s: 'snooki', e: 'proud', t: 'مهمة توصيل! آني أشيلها. بحلگي. هذا أسرع وأأمن. نوعاً ما.' },
        { s: 'anji', e: 'skeptical', t: 'أول خلّي نعرف وين نوصلها.' },
      ]),
      { puzzle: 'deliver-clue', then: [{ say: [{ s: 'snooki', e: 'happy', t: 'الشباك! يلا. آني أعرف الطريق. …نصه.' }] }, { puzzle: 'deliver-route' }] },
    ],
  },
  {
    id: 'chocolates',
    title: 'علبة الشوكولاتة',
    text: 'علبة شوكولاتة ملخبطة وبطاقة ترتيب.',
    icon: 'candy',
    done: 'flag:chocolates-done',
    run: [intro([{ s: 'snooki', e: 'guilty', t: 'العلبة چانت مرتبة. بعدين… ما أعرف شصار. ولا وحدة ناقصة. تقريباً.' }]), { puzzle: 'chocolate-box' }],
  },
  {
    id: 'picnic',
    title: 'سلّة النزهة',
    text: 'رتّبي سلّة نزهة صغيرة بالحديقة.',
    icon: 'apple',
    done: 'flag:picnic-done',
    run: [intro([{ s: 'snooki', e: 'happy', t: 'نزهة! آني جبت أشياء مهمة: طابة ومظلة. ضرورية.' }]), { puzzle: 'picnic' }],
  },
  {
    id: 'waiting-clock',
    title: 'ساعة الانتظار',
    text: 'ساعة صغيرة مثل ساعة الممر. حطّيها على وقت الانتظار الحلو.',
    icon: 'moon-half',
    done: 'flag:waiting-clock-done',
    run: [intro([{ s: 'snooki', e: 'serious', t: 'هاي الساعة ما تحتاج دقة. تحتاج… تذكّر.' }]), { puzzle: 'waiting-clock' }],
  },
  {
    id: 'duet',
    title: 'دويتو الحديقة',
    text: 'أضواء وورد بنمط يكبر. بدون وقت.',
    icon: 'sun',
    done: 'flag:duet-done',
    run: [{ game: 'duet' }],
  },
  {
    id: 'gift',
    title: 'ورشة الهدايا',
    text: 'لفّي هدية صغيرة للمجموعة وللحديقة.',
    icon: 'heart',
    done: 'flag:gift-made',
    repeat: true,
    run: [{ game: 'gift' }],
  },
  {
    id: 'promise',
    title: 'وعد الوردة الزرقاء',
    text: 'ممر بين طرفين الحديقة يحتاج يتصلح من الطرفين.',
    icon: 'rose',
    done: 'flag:promise-done',
    run: [
      intro([
        { s: 'anji', e: 'thinking', t: 'ممر مقطوع من الطرفين. إذا صلحت طرف واحد، ما يكفي.' },
        { s: 'snooki', e: 'serious', t: 'مثل الحبل: ينسحب من الطرفين. أو مثل البسكويت: ينكسر من النص. لا، الحبل أحسن مثال.' },
      ]),
      { game: 'promise' },
    ],
  },
];

export const PRANKS = [
  {
    id: 'treasure',
    title: 'صندوق الكنز',
    text: 'خريطة كنز بخط سنوكي… مشبوهة.',
    icon: 'key',
    done: 'flag:prank-treasure',
    run: [
      intro([{ s: 'snooki', e: 'proud', t: 'لگيت خريطة كنز! مو آني رسمتها. الخط يشبه خطي بالصدفة.' }]),
      { puzzle: 'treasure-lock', then: [{ say: [{ s: 'anji', e: 'smirk', t: '«الكنز الحقيقي هو الأصدقاء»؟ سنوكي…' }, { s: 'snooki', e: 'guilty', t: 'هه. هه. …بس الصندوق ثقيل، ما لاحظتي؟' }] }, { puzzle: 'treasure-latch' }] },
    ],
  },
  {
    id: 'signs',
    title: 'اللوحات المگلوبة',
    text: 'لوحات الطريق كلها تأشر غلط.',
    icon: 'map',
    done: 'flag:prank-signs',
    run: [intro([{ s: 'snooki', e: 'innocent', t: 'آني نظّفت اللوحات. ورجّعتها… بمكان ما.' }]), { puzzle: 'signposts' }],
  },
  {
    id: 'decoy',
    title: 'علب سنوكي',
    text: 'ثلاث علب، جملة وحدة بس صحيحة.',
    icon: 'note',
    done: 'flag:prank-decoy',
    run: [intro([{ s: 'snooki', e: 'smug', t: 'تحدي منطق! وحدة بس صحيحة. آني كتبت الجمل، فأكيد صعبة.' }]), { puzzle: 'decoy-boxes' }],
  },
  {
    id: '404',
    title: 'خطأ ٤٠٤',
    text: 'لابتوب ريان طلّع خطأ غريب، والأضواء طافية.',
    icon: 'mark',
    done: 'flag:prank-404',
    run: [intro([{ s: 'ryanpc', t: 'آه… ERROR 404. «كرامة سنوكي مو موجودة». آني ما كتبت هاي. …أكيد ما كتبتها.' }, { s: 'snooki', e: 'dramatic', t: 'كرامتي موجودة! بس مو بهالملف.' }]), { puzzle: 'error-404' }],
  },
  {
    id: 'guard',
    title: 'الحارس النايم',
    text: 'سنوكي «يحرس» الباب… بعيون مسكّرة.',
    icon: 'paw',
    done: 'flag:prank-guard',
    run: [intro([{ s: 'anji', e: 'smile', t: 'الحارس نايم. لازم أصحّيه بلطف.' }]), { puzzle: 'wake-snooki' }],
  },
  {
    id: 'shadow',
    title: 'الكنز اللي ما يبين',
    text: 'كنز «غير مرئي». الظلال تحچي.',
    icon: 'sun',
    done: 'flag:prank-shadow',
    run: [intro([{ s: 'snooki', e: 'proud', t: 'خبّيت كنز غير مرئي. حتى آني ما أشوفه. هذا مستوى عالي.' }]), { puzzle: 'shadow-treasure' }],
  },
  {
    id: 'paws',
    title: 'لغز آثار الكفوف',
    text: 'الغرفة نظيفة… إلا من آثار كفوف.',
    icon: 'footprint',
    done: 'flag:prank-paws',
    run: [intro([{ s: 'snooki', e: 'innocent', t: 'آثار كفوف؟ يمكن قطة. قطة كبيرة. بيضة. تحب البسكويت.' }]), { puzzle: 'pawprints' }],
  },
  {
    id: 'revenge',
    title: 'جولة ثأر ريان',
    text: 'ريان خسر، وحضّر خطة للثأر. سنوكي اهتم بالخطة… بأسنانه.',
    icon: 'crown',
    done: 'flag:prank-revenge',
    run: [{ game: 'revenge' }],
  },
  {
    id: 'delivery',
    title: 'الطرد المفاجئ',
    text: 'طرد صغير على الباب، عليه رموز.',
    icon: 'heart',
    done: 'flag:prank-delivery',
    run: [intro([{ s: 'snooki', e: 'happy', t: 'طرد! يمكن إلي. كل الطرود إلي حتى يثبت العكس.' }]), { puzzle: 'surprise-box' }],
  },
  {
    id: 'expert',
    title: 'وضع الخبراء',
    text: 'سنوكي يگول هذا اللغز «للخبراء فقط».',
    icon: 'star',
    done: 'flag:prank-expert',
    run: [{ puzzle: 'expert-mode' }],
  },
];
