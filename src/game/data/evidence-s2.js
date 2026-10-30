/**
 * Season 2 «ملف الدائرة المغلقة»: the case file — evidence, theories, decisions, journal entries.
 * Fiction written for the game (docs/season-2/SEASON_2_STORY_BIBLE.md §1): nothing here describes
 * real events or real people's motives.
 *
 * Evidence is collected once (`ev:<id>` → the collectible `s2.ev.<id>` in Season 2's own document)
 * and each piece says what KIND of thing it is, because the season teaches the difference:
 *   fact      — seen with her own eyes, checkable          «عندي دليل»
 *   claim     — what someone says (sincere or not)         «هذا كلام»
 *   deduction — what follows from facts                    «استنتاج»
 * The ids are those of the approved graph (docs/season-2/graph.mjs); a content test keeps them in step.
 * Milestone M1 covers Acts I–II (s2-01 … s2-11).
 */
export const EVIDENCE_S2 = {
  // Act I
  'e-register': { rel: 'fact', icon: 'note', label: 'سجل الحديقة', note: 'صفحة ليلة الفوانيس مگطوعة. آخر سطر باقي رقمه ٧.' },
  'e-copy': { rel: 'claim', icon: 'note', label: 'نسخة لمى', note: 'معلّگة باللوحة: «ثمان ضيوف، وكل البطاقات بفوانيس أصحابها.»' },
  'e-count': { rel: 'fact', icon: 'moon-full', label: 'سبع فوانيس', note: 'عدّيتها بنفسي: سبعة، وحتى اللي ورا الغصن.' },
  'e-blank': { rel: 'fact', icon: 'mark', label: 'بطاقة فارغة', note: 'بالفانوس الرابع: بطاقة أمنية بيضاء، بس الورق بيه أثر ضغط.' },
  'e-moved': { rel: 'fact', icon: 'mark', label: 'بطاقة ريان بفانوس ربيع', note: 'خط ريان، بالفانوس السادس، فانوس ربيع.' },
  'e-note': { rel: 'fact', icon: 'note', label: 'الورقة اللي بلا توقيع', note: 'چانت تحت كوب ريان: «إذا أكو سر، أنجي تستاهل تعرفه.» الورقة موجودة — بس اللي مكتوب بيها كلام.' },
  'e-whisper': { rel: 'claim', icon: 'heart', label: '«ريان يخبي شي عن أنجي»', note: 'جملة دايرة بين الضيوف. منو گالها أول؟ ما معروف.' },
  // Act II — the five perspectives
  'e-wax': { rel: 'fact', icon: 'sun', label: 'شمع الفانوس', note: 'تقطير الشمع على حافة بطاقة ريان: البطاقة انتقلت لفانوس مضوي.' },
  't-rabi': { rel: 'claim', icon: 'stethoscope', label: 'شهادة ربيع', note: '«لگيت بطاقة واگعة جنب فانوس مطفي. حطيتها بأقرب فانوس مضوي حتى لا تضيع بالظلمة.»' },
  'h-rabi': { rel: 'fact', icon: 'note', label: 'خط ربيع', note: 'خط مرتب ومايل لليمين، الياء نهايتها قصيرة.' },
  't-lama': { rel: 'claim', icon: 'heart', label: 'شهادة لمى', note: '«سمعت إن ريان يخبي شي. گلتها لأني خفت على أنجي.»' },
  'e-copy-diff': { rel: 'deduction', icon: 'paw', label: 'ليش ثمانية؟', note: 'لمى حسبت سنوكي ضيف رسمي. والنسخة كتبتها من ذاكرتها، مو من الشجرة.' },
  'h-lama': { rel: 'fact', icon: 'note', label: 'خط لمى', note: 'حروف مدورة كبيرة، والنقاط دوائر صغيرة.' },
  't-sabri': { rel: 'claim', icon: 'dumbbell', label: 'كلمات صبري بالضبط', note: '«ريان راح للعيادة بالسر.» — أربع كلمات صحيحة. «يخبي» مو كلمته.' },
  'e-receipt': { rel: 'fact', icon: 'rose', label: 'وصل محل الورد والحلويات', note: 'وگع من جيب ريان: ورد وعلبة حلويات، بنفس يوم ليلة الفوانيس.' },
  'h-sabri': { rel: 'fact', icon: 'note', label: 'خط صبري', note: 'حروف منفصلة، وكلها واگفة، ماكو ميلان.' },
  'e-drift': { rel: 'fact', icon: 'sun', label: 'ساعة الحديقة متأخرة ساعة', note: 'ورقة الفوانيس: «من الليلة قدّموا الساعات ساعة.» ساعة الحديقة ما انقدّمت.' },
  't-jojo': { rel: 'claim', icon: 'moon-crescent', label: 'كلمة العم جوجو', note: '«ساعة التسعة ما چنت هنا، رحت أجيب زيت. وما أشهد على شي ما شفته.»' },
  'h-jojo': { rel: 'fact', icon: 'note', label: 'خط العم جوجو', note: 'خط السجل نفسه: صغير ومتصل، والأرقام دائماً بالحبر الأزرق.' },
  'e-imprint': { rel: 'fact', icon: 'mark', label: 'أثر الضغط على البطاقة الفارغة', note: 'بالقلم بان: «إلى أنجي —» وبعدها كلمات ما تنقرى. انكتبت وانشالت.' },
  't-sister': { rel: 'claim', icon: 'heart', label: 'كلام أختي', note: 'جاوبت على كل شي إلا سؤال واحد: ليش طلعت قبل الكل.' },
  'h-sister': { rel: 'fact', icon: 'note', label: 'خط أختي', note: 'من ورقة المسابقة: الياء ملفوفة لفة كاملة.' },
  'd-elim': { rel: 'deduction', icon: 'mark', label: 'الورقة مو بخط…', note: 'الخطوط اللي قارنتها: أغلبها ما يشبه خط الورقة. وهذا مو اتهام لأحد — بس استبعاد.' },
};

/** The theories on «لوحة الدائرة» in M1 (D comes in Act V). Each can be supported AND broken. */
export const HYPOTHESES_S2 = {
  A: { title: 'واحد خرّب الليلة عن قصد', short: 'تخريب' },
  B: { title: 'ريان يخبي شي يأذي أنجي', short: 'سر ريان' },
  C: { title: 'الساعة غلطت الكل', short: 'الساعة' },
};

/** Decisions (named values; `dec:key=value`). Every value continues the story — none is "right". */
export const DECISIONS_S2 = {
  lead: ['ryan', 'anji'], // s2-03: who chairs the case
  'tree-tease': ['yes', 'no'], // s2-02: a first tease at the moved card
  'rabi-reply': ['polite', 'subject', 'tease-ryan'], // s2-05: answering a compliment
  sabri: ['press', 'let-be'], // s2-07
  'jojo-why': ['ask', 'accept'], // s2-08
  'sister-refusal': ['respect', 'push'], // s2-09
  'jealous-talk': ['reassure', 'tease', 'challenge', 'boundary', 'subject'], // s2-11
};

/** The case notebook (journal → «الأدلة»): Season 2's evidence by mission, in order. */
export const CASE_S2 = [
  { mission: 's2-01', ids: ['e-register', 'e-copy'] },
  { mission: 's2-02', ids: ['e-count', 'e-blank', 'e-moved'] },
  { mission: 's2-03', ids: ['e-note', 'e-whisper'] },
  { mission: 's2-05', ids: ['t-rabi', 'h-rabi', 'e-wax'] },
  { mission: 's2-06', ids: ['t-lama', 'h-lama', 'e-copy-diff'] },
  { mission: 's2-07', ids: ['t-sabri', 'h-sabri', 'e-receipt'] },
  { mission: 's2-08', ids: ['t-jojo', 'h-jojo', 'e-drift'] },
  { mission: 's2-09', ids: ['t-sister', 'h-sister', 'e-imprint'] },
  { mission: 's2-10', ids: ['d-elim'] },
];

export const REL_LABEL = { fact: 'دليل', claim: 'كلام', deduction: 'استنتاج' };

/** Journal entries (the notes tab). */
export const JOURNAL_S2 = {
  's2-case-open': { title: 'ليلة الفوانيس… والصبح', icon: 'moon-full', text: 'السجل مگطوع، ونسخة لمى بيها ثمان أسماء. شي ما يركب. بدت القضية.' },
  's2-tree': { title: 'شجرة الفوانيس', icon: 'moon-full', text: 'سبع فوانيس، مو ثمانية. بطاقة فارغة، وبطاقة ريان بفانوس ربيع.' },
  's2-notebook': { title: 'دفتر التحقيق الرسمي', icon: 'note', text: 'ريان فتح دفتر تحقيق بختم. أول دليل بيه چان تحت كوبه. صار عدنا: دليل، وكلام.' },
  's2-board-1': { title: 'لوحة الدائرة', icon: 'mark', text: 'علّگت أدلتي على نظريتين. التخريب يحتاج سبب، وما عندنا سبب بعد. النظرية مو دليل.' },
  's2-rabi': { title: 'ربيع والفانوس المضوي', icon: 'stethoscope', text: 'ربيع نقل بطاقة ريان لفانوس مضوي حتى لا تضيع. الشمع يثبت إنها انتقلت لفانوس مضوي — مو ليش.' },
  's2-lama': { title: 'نسخة لمى', icon: 'paw', text: 'نسخة لمى من ذاكرتها، وحسبت سنوكي ضيف. صادقة… بس ناقصة.' },
  's2-sabri': { title: 'صبري والكلمات الصحيحة', icon: 'dumbbell', text: 'صبري گال أربع كلمات صحيحة: «ريان راح للعيادة بالسر». «يخبي» انضافت بالطريق.' },
  's2-jojo': { title: 'العم جوجو والساعة', icon: 'moon-crescent', text: 'ساعة الحديقة متأخرة ساعة. والعم جوجو ما يشهد على شي ما شافه — وهذا مو دليل على شي.' },
  's2-sister': { title: 'أختي والمسابقة', icon: 'heart', text: 'البطاقة الفارغة چانت مكتوبة «إلى أنجي». أختي جاوبت على كل شي إلا سؤال. ورفضها مو اعتراف.' },
  's2-elim': { title: 'الورقة اللي ما انوقّعت', icon: 'mark', text: 'قارنت الخطوط اللي عندي. استبعدت، ما اتهمت. الورقة بعدها بلا صاحب أكيد.' },
  's2-board-2': { title: 'اجتماع الدفترين', icon: 'mark', text: 'ريان وآني قارنّا دفاترنا. ثلاث نظريات على اللوحة، ولا وحدة ثابتة. بس هسه نعرف شنو اللي نعرفه.' },
  's2-m1-end': { title: 'يتبع…', icon: 'moon-crescent', text: 'خيوط كاذبة تنتظر: شمع على الدرب، ووقت غلط، وجملة تغيّرت بالطريق. القصة تكمل بالتحديث الجاي.' },
};
