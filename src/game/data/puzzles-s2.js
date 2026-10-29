/**
 * Season 2 «ملف الدائرة المغلقة» — M1 puzzles (docs/season-2/SEASON_2_PUZZLE_SPEC.md).
 *  - every answer follows from evidence she has SEEN (named in each comment), and puzzles that use
 *    evidence list only what she has (`if: 'ev:…'`);
 *  - exactly three hints each: attention → which pieces to compare → nearly the answer (tested);
 *  - a wrong try keeps what she set and says only what is true about her choice, never the answer;
 *  - the case board accepts every consistent layout (a card lists every column it fits).
 * Fiction written for the game.
 */
const EV = {
  register: { id: 'register', label: 'سجل الحديقة', icon: 'note', note: 'آخر سطر قبل الصفحة المگطوعة رقمه ٧.', if: 'ev:e-register' },
  count: { id: 'count', label: 'سبع فوانيس', icon: 'moon-full', note: 'عدّيتها بنفسي: سبعة.', if: 'ev:e-count' },
  blank: { id: 'blank', label: 'البطاقة الفارغة', icon: 'mark', note: 'بالفانوس الرابع، بيضاء.', if: 'ev:e-blank' },
  moved: { id: 'moved', label: 'بطاقة ريان بفانوس ربيع', icon: 'mark', note: 'خط ريان، بالفانوس السادس.', if: 'ev:e-moved' },
  copy: { id: 'copy', label: 'نسخة لمى', icon: 'note', note: '«ثمان ضيوف، وكل البطاقات بفوانيس أصحابها.»', if: 'ev:e-copy' },
};

export const PUZZLES_S2 = {
  /* ── Act I ─────────────────────────────────────────────────────── */
  // The register's stub ends at line 7 (e-register); the copy says eight (e-copy). Tutorial: one claim, one proof.
  's2-compare': {
    type: 'contradict',
    title: 'السجل والنسخة',
    goal: 'اختاري الجملة اللي ما تركب، والدليل اللي يثبت.',
    intro: 'النسخة اللي باللوحة تگول شي، والسجل يگول شي ثاني. الدليل لازم يثبت، مو بس يشككچ.',
    config: {
      evidence: [EV.register, EV.copy],
      stages: [
        {
          who: 'نسخة لمى',
          icon: 'note',
          claims: ['ليلة الفوانيس چانت بحديقتنا.', 'چان عدنا ثمان ضيوف.'],
          answer: { claim: 1, evidence: 'register' },
          explain: 'سطور الضيوف بالسجل تنتهي بسبعة',
        },
      ],
      labels: { none: 'كلها تركب', proof: 'الدليل', submit: 'هذا حكمي ⚖️' },
      messages: { wrong: 'هالدليل ما يثبت إن هالجملة غلط.', none: 'لا… وحدة منها يكذّبها شي شفتيه.' },
    },
    hints: ['الأرقام هي المفتاح.', 'قارني عدد الضيوف بالنسخة ويا آخر رقم سطر بالسجل.', 'النسخة تگول ثمانية… والسجل وگف على سطر سبعة.'],
    wrong: [],
    success: 'السجل والنسخة ما يتفقون. يا ترى الشجرة شتگول؟',
    reward: ['flag:s2:01-compared'],
  },

  // She tapped every lantern, the hidden seventh included (step 1 of s2-02): seven.
  's2-count': {
    type: 'choice',
    title: 'كم فانوس؟',
    goal: 'جاوبي بالعد اللي سويتيه بنفسچ.',
    intro: 'النسخة تگول ثمان ضيوف، وكل ضيف علّگ فانوس. الشجرة شتگول؟',
    config: {
      question: 'كم فانوس معلّگ بالشجرة؟',
      options: [
        { id: '6', label: 'ستة', reply: 'عدّي مرة ثانية… أكو فانوس ورا الغصن البعيد.' },
        { id: '7', label: 'سبعة' },
        { id: '8', label: 'ثمانية', reply: 'هذا رقم النسخة، مو رقم الشجرة. شنو شفتي بعينچ؟' },
      ],
      answer: '7',
    },
    hints: ['اللي شفتيه بعينچ أقوى من اللي مكتوب.', 'كم فانوس فحصتي بالشجرة، ويا اللي ورا الغصن؟', 'سبعة. والنسخة تگول ثمانية.'],
    wrong: [],
    success: 'سبع فوانيس. النسخة غلطانة بواحد… ليش؟',
    reward: ['flag:s2:02-counted', 'ev:e-count'],
  },

  // The four things she has (s2-02, s2-03): what she saw herself vs what someone said.
  's2-sort-1': {
    type: 'sort',
    title: 'دفتر التحقيق: أول صفحة',
    goal: 'كل بطاقة: دليل شفتيه بعينچ، لو كلام أحد گاله؟',
    intro: 'ريان كتب كل شي بنفس الخط ونفس الحجم. بس مو كل شي بنفس القوة.',
    config: {
      stages: [
        {
          kind: 'sort',
          prompt: 'المسي بطاقة، بعدين العمود.',
          bins: [
            { id: 'fact', label: 'دليل — شفته بعيني', icon: 'mark' },
            { id: 'claim', label: 'كلام — أحد گاله', icon: 'heart' },
          ],
          cards: [
            { id: 'moved', label: 'بطاقة ريان بفانوس ربيع', accepts: ['fact'] },
            { id: 'whisper', label: '«ريان يخبي شي»', accepts: ['claim'] },
            { id: 'note', label: 'الورقة اللي تحت الكوب', note: 'الورقة نفسها', accepts: ['fact'] },
            { id: 'notetext', label: 'اللي مكتوب بالورقة', note: '«إذا أكو سر…»', accepts: ['claim'] },
          ],
        },
      ],
    },
    hints: ['شفتيه بعينچ؟ لو سمعتيه؟', 'الورقة نفسها شي، واللي مكتوب بيها شي ثاني.', 'البطاقة والورقة: دليل. الجملة الدايرة واللي مكتوب بالورقة: كلام.'],
    wrong: [],
    success: 'دليلين، وكلامين. ريان ختم الصفحة: «تحقيق رسمي» 📎',
    reward: ['flag:s2:03-sorted'],
  },

  // The first board: five cards on two theories, then what can be said about A (no motive yet).
  's2-board-1': {
    type: 'sort',
    title: 'لوحة الدائرة',
    goal: 'علّگي كل بطاقة تحت النظرية اللي تساعدها، بعدين گولي شنو ناقص.',
    intro: 'نظريتين على اللوحة. النظرية مو دليل: هي سؤال ينتظر جواب.',
    config: {
      stages: [
        {
          kind: 'sort',
          prompt: 'وين تساعد كل بطاقة؟ (بطاقة ممكن تساعد نظريتين: أي وحدة منهن تمشي.)',
          bins: [
            { id: 'A', label: 'A · واحد خرّب الليلة عن قصد' },
            { id: 'B', label: 'B · ريان يخبي شي يأذي أنجي' },
          ],
          cards: [
            { id: 'register', label: 'الصفحة المگطوعة', accepts: ['A'] },
            { id: 'blank', label: 'البطاقة الفارغة', accepts: ['A'] },
            { id: 'moved', label: 'بطاقة ريان بفانوس ربيع', accepts: ['A'] },
            { id: 'note', label: 'الورقة: «إذا أكو سر…»', accepts: ['A', 'B'] },
            { id: 'whisper', label: '«ريان يخبي شي»', accepts: ['B'] },
          ],
          done: 'كل بطاقة بمكان يركب.',
        },
        {
          kind: 'pick',
          prompt: 'هسه: شنو ينگال عن A؟',
          options: [
            { id: 'proven', label: 'A ثابتة: أكو مخرّب.', why: 'ثابتة؟ عدنا أشياء غريبة… بس منو؟ وليش؟ ما عدنا ولا سبب.' },
            { id: 'needs', label: 'A تحتاج سبب، وما عدنا سبب بعد.' },
            { id: 'wrong', label: 'A غلط.', why: 'غلط؟ ما عدنا ولا شي يكسرها بعد. لا تستعجلين بالاتجاهين.' },
          ],
          answer: 'needs',
        },
      ],
    },
    hints: ['كل بطاقة: شنو تشبه؟ شي انخرب، لو شي انگال؟', 'الأشياء اللي تغيّرت (صفحة، بطاقة، فانوس) تروح للتخريب. الكلام عن ريان يروح للثانية.', 'بعد ما تعلّگين: التخريب يحتاج «منو» و«ليش». عدچ واحد منهم؟'],
    wrong: [],
    success: 'اللوحة تحچي: عدنا أسئلة، مو أجوبة. هذا زين — هسه نعرف شنو ندوّر.',
    reward: ['flag:s2:board-1'],
  },

  /* ── Act II ────────────────────────────────────────────────────── */
  // Wax only drips from a lit lantern; the drops on Ryan's card (seen at lantern 6) mean it sat in a lit one.
  's2-wax': {
    type: 'choice',
    title: 'شمع الفانوس السادس',
    goal: 'شنو يگول الشمع، بالضبط؟',
    intro: 'على حافة بطاقة ريان نقاط شمع جامد، نازلة لتحت. الشمع يقطر بس من فانوس مضوي.',
    config: {
      question: 'شنو تگدرين تگولين؟',
      options: [
        { id: 'lit', label: 'البطاقة گعدت بفانوس مضوي — يعني انتقلت لفانوس مضوي.' },
        { id: 'dark', label: 'البطاقة چانت بفانوس مطفي من الأول.', reply: 'لو بقت بمطفي… منين إجا الشمع؟' },
        { id: 'burn', label: 'أحد حاول يحرقها.', reply: 'ماكو سواد ولا حرق — بس نقاط شمع. لا تضيفين قصة ما عليها دليل.' },
      ],
      answer: 'lit',
    },
    hints: ['الشمع من وين يجي؟', 'قارني اللي على البطاقة ويا فانوس ريان (مطفي) وفانوس ربيع (مضوي).', 'الشمع ما يقطر إلا من فانوس مضوي. البطاقة انتقلت لفانوس مضوي.'],
    wrong: [],
    success: 'الشمع يثبت المكان، مو النية. ربيع گال ليش — والشمع يگول وين.',
    reward: ['ev:e-wax'],
  },

  // The copy (e-copy) against what she saw (e-count, e-register, e-blank, e-moved): three claims, three proofs.
  's2-copy': {
    type: 'contradict',
    title: 'نسخة لمى، سطر سطر',
    goal: 'بكل جزء من النسخة: اختاري الجملة اللي ما تركب، والدليل.',
    intro: 'النسخة صادقة بنيتها. بس الصدق مو نفس الدقة.',
    config: {
      evidence: [EV.count, EV.register, EV.blank, EV.moved],
      stages: [
        { who: 'نسخة لمى: الضيوف', icon: 'note', claims: ['ثمان ضيوف.', 'كل ضيف علّگ فانوس.'], answer: { claim: 0, evidence: ['count', 'register'] }, explain: 'سبع فوانيس وسبع سطور' },
        { who: 'نسخة لمى: البطاقات', icon: 'note', claims: ['كل البطاقات مكتوبة.', 'الفوانيس انعلّگت قبل المغرب.'], answer: { claim: 0, evidence: 'blank' }, explain: 'أكو بطاقة بيضاء' },
        { who: 'نسخة لمى: الأماكن', icon: 'note', claims: ['كل بطاقة بفانوس صاحبها.', 'العم جوجو كتب السجل.'], answer: { claim: 0, evidence: 'moved' }, explain: 'بطاقة ريان بفانوس ربيع' },
      ],
      labels: { none: 'كلها تركب', proof: 'الدليل', submit: 'هذا حكمي ⚖️' },
      messages: { wrong: 'هالدليل ما يثبت إن هالجملة غلط.', none: 'لا… وحدة منها يكذّبها شي شفتيه.' },
    },
    hints: ['بكل جزء جملة وحدة بس تتعارض ويا اللي شفتيه.', 'الضيوف ← عدّ الفوانيس. البطاقات ← البطاقة البيضاء. الأماكن ← بطاقة ريان.', 'الجملة الأولى بكل جزء، ويا: الفوانيس السبعة، البطاقة الفارغة، بطاقة ريان بفانوس ربيع.'],
    wrong: [],
    success: 'ثلاث جمل ما تركب. لمى كتبتها من ذاكرتها… ومن عدّها.',
    reward: ['ev:e-copy-diff'],
  },

  // Sabri remembers four words, the first is Ryan's name and the last «بالسر»; «يخبي» is not his word (dialogue).
  's2-sentence': {
    type: 'arrange',
    title: 'كلمات صبري',
    goal: 'رتّبي الجملة مثل ما گالها صبري، بالضبط. مو كل كلمة إله.',
    intro: 'صبري يتذكر حرفياً: «أربع كلمات. أول وحدة اسمه، وآخر وحدة بالسر. وكلمة يخبي؟ مو مالتي.»',
    config: {
      slots: [
        { id: 'w1', label: '١', accepts: ['ryan'] },
        { id: 'w2', label: '٢', accepts: ['went'] },
        { id: 'w3', label: '٣', accepts: ['clinic'] },
        { id: 'w4', label: '٤', accepts: ['secret'] },
      ],
      pieces: [
        { id: 'hides', label: 'يخبي', icon: 'heart' },
        { id: 'clinic', label: 'للعيادة', icon: 'stethoscope' },
        { id: 'ryan', label: 'ريان', icon: 'mark' },
        { id: 'thing', label: 'شي', icon: 'mark' },
        { id: 'secret', label: 'بالسر', icon: 'key' },
        { id: 'went', label: 'راح', icon: 'footprint' },
        { id: 'anji', label: 'عن أنجي', icon: 'heart' },
      ],
    },
    hints: ['صبري گال أول وآخر كلمة بنفسه.', 'أربع كلمات: اسم، وشي سوّاه، ووين، وكيف.', 'ريان · راح · للعيادة · بالسر.'],
    wrong: [],
    success: '«ريان راح للعيادة بالسر.» كل كلمة صحيحة… والجملة اللي دارت تختلف.',
    reward: ['ev:t-sabri', 'ev:h-sabri'],
  },

  // The lamp-change notice beside the clock: «from tonight the clocks go forward an hour»; the garden clock was not moved.
  's2-clock': {
    type: 'clock',
    title: 'ساعة الحديقة',
    goal: 'دوّري العقارب للوقت الصحيح، لمن ساعة الحديقة چانت تگول ٩:٤٠.',
    intro: 'الورقة جنب الساعة: «من ليلة الفوانيس: قدّموا الساعات ساعة.» ساعة الحديقة بعدها تگول ٩:٤٠.',
    config: { target: [10, 40], tolerance: 0, step: 5, start: [9, 40] },
    hints: ['الورقة جنب الساعة تگول شي عن كل الساعات.', 'ساعة الحديقة انقدّمت لو لا؟ إذا لا، شكد ناقصها؟', 'ساعة كاملة لقدّام: ١٠:٤٠.'],
    wrong: ['العقارب تحركت… بس مو هذا الوقت.'],
    success: 'كل وقت بالسجل متأخر ساعة. «التسعة» بالسجل چانت عشرة!',
    reward: ['ev:e-drift'],
  },

  // The blank card (e-blank) and the sister's pencil: the pressed-in words. Only «إلى أنجي —» is legible.
  's2-rubbing': {
    type: 'rubbing',
    title: 'البطاقة الفارغة',
    goal: 'مرّي القلم على كل البطاقة، وگولي شنو ينقرى — بثقة.',
    intro: 'البطاقة بيضاء… بس الورق بيه أثر ضغط. قلم أختي ناعم وعريض.',
    config: {
      regions: [
        { id: 'r1', text: 'إلى' },
        { id: 'r2', text: 'أنجي —' },
        { id: 'r3', text: '(خدوش ما تنقرى)' },
        { id: 'r4', text: '… أتمنى …' },
        { id: 'r5', text: '(خدوش ما تنقرى)' },
        { id: 'r6', text: '… ما أعرف أگو…' },
      ],
      question: 'شنو تگدرين تگولين بثقة؟',
      options: [
        { id: 'for-anji', label: 'بطاقة انكتبت لأنجي، وبعدين انشالت.' },
        { id: 'whole', label: 'الأمنية كاملة.', why: 'نص البطاقة خدوش. الباقي تخمين، مو قراءة.' },
        { id: 'who', label: 'منو كتبها.', why: 'ماكو توقيع. والضغط ما يگول اسم.' },
      ],
      answer: 'for-anji',
    },
    hints: ['مرّي على كل مكان أول.', 'فرّقي بين الكلمات اللي بانت والخدوش.', 'ينقرى «إلى أنجي» وكم كلمة. يعني: بطاقة لأنجي، وانشالت.'],
    wrong: [],
    success: 'أحد كتب لأنجي… وشال كلامه. ليش؟',
    reward: ['ev:e-imprint'],
  },

  // The note's hand against the samples she has (any three of five): eliminate, never accuse.
  's2-hands': {
    type: 'sort',
    title: 'الورقة اللي ما انوقّعت',
    goal: 'قارني كل خط عدچ بخط الورقة، بعدين گولي شنو تعرفين.',
    intro: 'خط الورقة: حروف مايلة شوية، والياء ملفوفة لفة كاملة. «يشبه» مو «هو».',
    config: {
      stages: [
        {
          kind: 'sort',
          prompt: 'كل خط عدچ: يشبه خط الورقة، لو لا؟',
          bins: [
            { id: 'no', label: 'مو هالخط' },
            { id: 'maybe', label: 'يشبه' },
          ],
          cards: [
            { id: 'rabi', label: 'خط ربيع', note: 'مرتب ومايل، الياء قصيرة.', accepts: ['no'], if: 'ev:h-rabi' },
            { id: 'lama', label: 'خط لمى', note: 'مدور كبير، نقاط دوائر.', accepts: ['no'], if: 'ev:h-lama' },
            { id: 'sabri', label: 'خط صبري', note: 'حروف واگفة منفصلة.', accepts: ['no'], if: 'ev:h-sabri' },
            { id: 'jojo', label: 'خط العم جوجو', note: 'صغير متصل، حبر أزرق.', accepts: ['no'], if: 'ev:h-jojo' },
            { id: 'sister', label: 'خط أختي', note: 'الياء ملفوفة لفة كاملة.', accepts: ['maybe'], if: 'ev:h-sister' },
          ],
          done: 'كل خط بمكانه.',
        },
        {
          kind: 'pick',
          prompt: 'شنو تگدرين تگولين هسه؟',
          options: [
            { id: 'who', label: 'لگيت منو كتبها.', why: '«يشبه» مو «هو». خطوط هواية تتشابه، وآني نفسي ألف الياء هيچ أحياناً.' },
            { id: 'elim', label: 'الخطوط اللي استبعدتها مو خط الورقة. الباقي بعده مفتوح.' },
            { id: 'none', label: 'ماكو أحد منهم كتبها.', why: 'ما قارنت كل خط بالحديقة. هذا أكثر من اللي عدچ.' },
          ],
          answer: 'elim',
        },
      ],
    },
    hints: ['قارني الياء، والميلان، والنقاط.', 'خط الورقة مايل شوية، وياءه ملفوفة. أي خط عدچ بيه نفس الشي؟', 'اللي ياءه قصيرة، أو حروفه واگفة، أو مدورة، أو متصلة صغيرة: مو هالخط. وبعدها: استبعاد، مو اسم.'],
    wrong: [],
    success: 'استبعدت، وما اتهمت. الورقة بعدها بلا صاحب أكيد.',
    reward: ['ev:d-elim'],
  },

  // The second board (all five perspectives heard): three theories; Rabi's account backed by the wax; nothing proven yet.
  's2-board-2': {
    type: 'sort',
    title: 'اللوحة، من جديد',
    goal: 'علّگي البطاقات الجديدة، اربطي شهادة بدليل، وگولي وين واگفين.',
    intro: 'نظرية ثالثة على اللوحة: «الساعة غلطت الكل». ثلاث نظريات… ولا وحدة لازم تربح.',
    config: {
      stages: [
        {
          kind: 'sort',
          prompt: 'وين تساعد كل بطاقة؟',
          bins: [
            { id: 'A', label: 'A · تخريب عن قصد' },
            { id: 'B', label: 'B · ريان يخبي شي' },
            { id: 'C', label: 'C · الساعة غلطت الكل' },
          ],
          cards: [
            { id: 'receipt', label: 'وصل الورد والحلويات', accepts: ['B'] },
            { id: 'sabri', label: '«ريان راح للعيادة بالسر»', accepts: ['B'] },
            { id: 'drift', label: 'ساعة الحديقة متأخرة ساعة', accepts: ['C'] },
            { id: 'jojo', label: 'العم جوجو: «ساعة التسعة ما چنت هنا»', accepts: ['C'] },
            { id: 'imprint', label: '«إلى أنجي —» انكتبت وانشالت', accepts: ['A'] },
          ],
          done: 'البطاقات الجديدة بأماكنها.',
        },
        {
          kind: 'pick',
          prompt: 'شهادة ربيع: «نقلتها لفانوس مضوي حتى لا تضيع». شنو يسندها؟',
          options: [
            { id: 'wax', label: 'الشمع على حافة البطاقة' },
            { id: 'copy', label: 'نسخة لمى', why: 'النسخة تگول البطاقات بفوانيس أصحابها — وهذا اللي ما صار.' },
            { id: 'receipt', label: 'وصل الورد', why: 'الوصل يخص ريان، مو الفانوس.' },
          ],
          answer: 'wax',
          done: 'شهادة ربيع مسنودة بدليل.',
        },
        {
          kind: 'pick',
          prompt: 'اللوحة كلها: شنو الصحيح هسه؟',
          options: [
            { id: 'b-proven', label: 'B ثابتة: ريان يخبي شي يأذي أنجي.', why: 'إنه يخبي شي — عدنا وصل. بس «يأذي»؟ هذا استنتاج ما عليه دليل.' },
            { id: 'open', label: 'ولا نظرية ثابتة: A ضعفت، B بيها حقيقة واستنتاج ما انثبت، وC مفتوحة.' },
            { id: 'c-proven', label: 'C ثابتة: الساعة تفسر كل شي.', why: 'الساعة تفسر الأوقات. والورقة اللي بلا توقيع؟ والبطاقة اللي انمسحت؟' },
          ],
          answer: 'open',
        },
      ],
    },
    hints: ['كل بطاقة جديدة: تخص شنو؟ شي انخرب، ريان، لو الوقت؟', 'شهادة ربيع تحچي عن شمع وفانوس. أي دليل عدچ يخص الشمع؟', 'النظرية تثبت لمن ما يبقى شي يكسرها. هسه كل وحدة بيها شي ناقص.'],
    wrong: [],
    success: 'ثلاث نظريات، ولا وحدة ثابتة — وهذا صدق، مو فشل. الخيوط الجاية راح تكشف.',
    reward: ['flag:s2:board-2'],
  },
};
