/**
 * Season 2 «ملف الدائرة المغلقة» — M1 puzzles (docs/season-2/SEASON_2_PUZZLE_SPEC.md).
 *  - every answer follows from evidence she has SEEN (named in each comment), and puzzles that use
 *    evidence list only what she has (`if: 'ev:…'`);
 *  - no hints, no solution, no skip (strict: see the loop at the end);
 *  - a wrong try keeps what she set and is answered neutrally, never with the answer or how close it was;
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
  // The register's stub ends at line 7 (e-register); the copy says eight (e-copy). The tutorial: the copy's claims,
  // then the register's own — each part one false claim and the one thing she read that breaks it.
  's2-compare': {
    type: 'contradict',
    title: 'السجل والنسخة',
    goal: 'بكل جزء: اختاري الجملة اللي ما تركب، والدليل اللي يثبت.',
    intro: 'النسخة اللي باللوحة تگول شي، والسجل يگول شي ثاني. الدليل لازم يثبت، مو بس يشككچ.',
    config: {
      evidence: [EV.register, EV.copy, { id: 'stub', label: 'طرف الصفحة', icon: 'mark', note: 'صفحة ليلة الفوانيس انگطعت من السجل، وبقى طرفها.', if: 'ev:e-register' }],
      stages: [
        {
          who: 'نسخة لمى',
          icon: 'note',
          claims: ['ليلة الفوانيس چانت بحديقتنا.', 'العم جوجو كتب السجل بإيده.', 'چان عدنا ثمان ضيوف.', 'كل ضيف علّگ فانوس.'],
          answer: { claim: 2, evidence: 'register' },
          explain: 'سطور الضيوف بالسجل تنتهي بسبعة',
        },
        {
          who: 'السجل نفسه',
          icon: 'note',
          claims: ['السجل انكتب كل ليلة بنفس الحبر.', 'سجل ليلة الفوانيس كامل، ما ناقصه شي.', 'سطور الضيوف مرقمة.'],
          answer: { claim: 1, evidence: 'stub' },
          explain: 'صفحة الليلة نفسها انگطعت',
        },
      ],
      labels: { none: 'كلها تركب', proof: 'الدليل', submit: 'هذا حكمي ⚖️' },
      messages: { wrong: 'هالدليل ما يثبت إن هالجملة غلط.', none: 'لا… وحدة منها يكذّبها شي شفتيه.' },
    },
    wrong: [],
    success: 'السجل والنسخة ما يتفقون. يا ترى الشجرة شتگول؟',
    reward: ['flag:s2:01-compared'],
  },

  // She tapped every lantern, the hidden seventh included (step 1 of s2-02): seven on the tree; the register's
  // guest lines end at seven (e-register); the copy says eight (e-copy). Three numbers, side by side: 13³ settings,
  // and none of them is printed in the puzzle — she counted one and read the other two.
  's2-count': {
    type: 'lock',
    title: 'ثلاث أرقام',
    goal: 'حطّي الأرقام الثلاثة جنب بعض: الشجرة، والسجل، والنسخة.',
    intro: 'كل رقم من مكان: واحد عدّيتيه بنفسچ، واثنين قريتيهم. حطّيهم جنب بعض، وشوفي شنو ما يركب.',
    config: {
      symbols: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١', '١٢'],
      answer: [7, 7, 8],
      start: [0, 0, 0],
      dialLabels: ['فوانيس الشجرة', 'سطور الضيوف بالسجل', 'ضيوف النسخة'],
      labels: { submit: 'هاي الأرقام 📏' },
    },
    wrong: [],
    success: 'سبع فوانيس. النسخة غلطانة بواحد… ليش؟',
    reward: ['flag:s2:02-counted', 'ev:e-count'],
  },

  // The five things she has (s2-02, s2-03): what she saw herself vs what someone said.
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
            { id: 'blank', label: 'البطاقة البيضاء', note: 'بالفانوس الرابع', accepts: ['fact'] },
          ],
        },
      ],
    },
    wrong: [],
    success: 'ثلاث أدلة، وكلامين. ريان ختم الصفحة: «تحقيق رسمي» 📎',
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
          prompt: 'هسه، اللوحة كلها: شنو ينگال بثقة؟',
          options: [
            { id: 'real', label: 'أشياء غريبة صدگ صارت بليلة الفوانيس.' },
            { id: 'proven', label: 'A ثابتة: أكو مخرّب.' },
            { id: 'needs', label: 'A تحتاج «منو» و«ليش»، وما عدنا ولا وحدة.' },
            { id: 'wrong', label: 'A غلط.' },
            { id: 'talk', label: 'B مبنية على كلام، مو على شي شفته بعيني.' },
            { id: 'b-proven', label: 'B ثابتة: ريان يخبي شي يأذي أنجي.' },
          ],
          answers: ['real', 'needs', 'talk'],
        },
      ],
    },
    wrong: [],
    success: 'اللوحة تحچي: عدنا أسئلة، مو أجوبة. هذا زين — هسه نعرف شنو ندوّر.',
    reward: ['flag:s2:board-1'],
  },

  /* ── Act II ────────────────────────────────────────────────────── */
  // Wax only drips from a lit lantern; the drops on Ryan's card (seen at lantern 6) mean it sat in a lit one.
  // A conclusion and the two observations that carry it (4 × 10 pairs): the drops on the card and the lit
  // lantern it sits in. The intro names what she sees, never the rule that links them.
  's2-wax': {
    type: 'deduction',
    title: 'شمع الفانوس السادس',
    goal: 'شنو تگدرين تگولين عن مكان البطاقة؟ اختاري الجواب، ودليلين يثبتونه.',
    intro: 'على حافة بطاقة ريان نقاط شمع جامد، نازلة لتحت. ربيع گال إنه نقلها. شنو تگول الأشياء نفسها؟',
    config: {
      need: 2,
      labels: { who: 'شنو تگدرين تگولين؟', submit: 'هذا اللي يثبت 🕯️' },
      suspects: [
        { id: 'lit', label: 'البطاقة گعدت وقت بفانوس مضوي.' },
        { id: 'dark', label: 'البطاقة بقت بفانوس مطفي طول الليل.' },
        { id: 'burn', label: 'أحد قرّب البطاقة من نار عن قصد.' },
        { id: 'none', label: 'الشمع ما يگول شي عن مكانها.' },
      ],
      evidence: [
        { id: 'drops', label: 'نقاط الشمع', icon: 'drop', note: 'على حافة البطاقة، جامدة، نازلة لتحت.' },
        { id: 'rabi', label: 'فانوس ربيع', icon: 'moon-full', note: 'السادس. مضوي، والبطاقة بداخله.' },
        { id: 'seventh', label: 'الفانوس السابع', icon: 'moon-crescent', note: 'ورا الغصن، مطفي.' },
        { id: 'blank', label: 'البطاقة البيضاء', icon: 'mark', note: 'بالفانوس الرابع، ولا حرف.' },
        { id: 'copy', label: 'نسخة لمى', icon: 'note', note: '«كل البطاقات بفوانيس أصحابها.»' },
      ],
      answer: { suspect: 'lit', evidence: ['drops', 'rabi'] },
    },
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
        // three or four claims each (one false), four proofs: at least 13 ways per part, the false one never in the same place
        { who: 'نسخة لمى: الضيوف', icon: 'note', claims: ['كل ضيف علّگ فانوس.', 'ثمان ضيوف.', 'الضيوف كتبوا أمنياتهم بإيدهم.', 'الحفلة بدت بعد المغرب.'], answer: { claim: 1, evidence: ['count', 'register'] }, explain: 'سبع فوانيس وسبع سطور' },
        { who: 'نسخة لمى: البطاقات', icon: 'note', claims: ['الفوانيس انعلّگت قبل المغرب.', 'البطاقات انعلّگت وية الفوانيس.', 'كل البطاقات مكتوبة.'], answer: { claim: 2, evidence: 'blank' }, explain: 'أكو بطاقة بيضاء' },
        { who: 'نسخة لمى: الأماكن', icon: 'note', claims: ['كل بطاقة بفانوس صاحبها.', 'العم جوجو كتب السجل.', 'الشجرة نفسها اللي بالحديقة.'], answer: { claim: 0, evidence: 'moved' }, explain: 'بطاقة ريان بفانوس ربيع' },
      ],
      labels: { none: 'كلها تركب', proof: 'الدليل', submit: 'هذا حكمي ⚖️' },
      messages: { wrong: 'هالدليل ما يثبت إن هالجملة غلط.', none: 'لا… وحدة منها يكذّبها شي شفتيه.' },
    },
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
    wrong: [],
    success: '«ريان راح للعيادة بالسر.» كل كلمة صحيحة… والجملة اللي دارت تختلف.',
    reward: ['ev:t-sabri', 'ev:h-sabri'],
  },

  // The lamp-change notice on the lamphouse wall: «from tonight the clocks go forward an hour»; the garden clock
  // was not moved. The puzzle says only what the clock shows: the rule is on the wall, for her to read and connect.
  's2-clock': {
    type: 'clock',
    title: 'ساعة الحديقة',
    goal: 'خلّي ساعة الحديقة تگول الوقت الصحيح.',
    intro: 'ساعة الحديقة تگول ٩:٤٠. العم جوجو يگول هاي أدق ساعة بالحديقة.',
    config: { target: [10, 40], tolerance: 0, step: 5, start: [9, 40], drag: true },
    wrong: [],
    success: 'الساعة صارت ويا الكل. يعني ليلة الفوانيس، كل وقت قريته عليها چان ناقص.',
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
      // tick every statement the rubbing proves, and only those: 2⁶ sets
      question: 'شنو تگدرين تگولين بثقة؟',
      options: [
        { id: 'to-anji', label: 'البطاقة انكتبت لأنجي.' },
        { id: 'signed', label: 'صاحب البطاقة وقّع بآخرها.' },
        { id: 'erased', label: 'اللي انكتب انشال بعدين.' },
        { id: 'wish', label: 'الأمنية كاملة تنقرى.' },
        { id: 'ryan', label: 'ريان هو اللي كتبها.' },
        { id: 'empty', label: 'البطاقة ما انكتب بيها شي أبد.' },
      ],
      answers: ['to-anji', 'erased'],
    },
    wrong: [],
    success: 'أحد كتب لأنجي… وشال كلامه. ليش؟',
    reward: ['ev:e-imprint'],
  },

  // The note's hand against the samples she has (any three of five): eliminate, never accuse.
  's2-hands': {
    type: 'sort',
    title: 'الورقة اللي ما انوقّعت',
    goal: 'قارني كل خط عدچ بخط الورقة، بعدين گولي شنو تعرفين.',
    // three features of the note's hand; every sample shares one or two of them, only one shares all three
    intro: 'خط الورقة بيه ثلاث علامات: الحروف مايلة شوية، والياء ملفوفة، والنقاط لازگة بالحرف. «يشبه» مو «هو».',
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
            { id: 'rabi', label: 'خط ربيع', note: 'مرتب ومايل شوية. الياء قصيرة. النقاط لازگة بالحرف.', accepts: ['no'], if: 'ev:h-rabi' },
            { id: 'lama', label: 'خط لمى', note: 'مدور كبير وواگف. الياء ملفوفة. النقاط دوائر بعيدة.', accepts: ['no'], if: 'ev:h-lama' },
            { id: 'sabri', label: 'خط صبري', note: 'حروف واگفة منفصلة. الياء طويلة. النقاط لازگة بالحرف.', accepts: ['no'], if: 'ev:h-sabri' },
            { id: 'jojo', label: 'خط العم جوجو', note: 'صغير متصل، مايل شوية. الياء ملفوفة. النقاط فوگ بعيد.', accepts: ['no'], if: 'ev:h-jojo' },
            { id: 'sister', label: 'خط أختي', note: 'مايل شوية. الياء ملفوفة لفة كاملة. النقاط لازگة بالحرف.', accepts: ['maybe'], if: 'ev:h-sister' },
          ],
          done: 'كل خط بمكانه.',
        },
        {
          kind: 'pick',
          prompt: 'شنو تگدرين تگولين هسه؟',
          options: [
            { id: 'who', label: 'لگيت منو كتب الورقة.' },
            { id: 'elim', label: 'الخطوط اللي استبعدتها مو خط الورقة.' },
            { id: 'none', label: 'ماكو أحد بالحديقة كتبها.' },
            { id: 'like', label: 'الخط اللي يشبه بعده «يشبه»، مو «هو».' },
            { id: 'pen', label: 'الورقة انكتبت بقلم ريان.' },
          ],
          answers: ['elim', 'like'],
        },
      ],
    },
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
          prompt: 'شهادة ربيع: «نقلتها لفانوس مضوي حتى لا تضيع». علّمي كل دليل يسندها.',
          options: [
            { id: 'copy', label: 'نسخة لمى' },
            { id: 'wax', label: 'الشمع على حافة البطاقة' },
            { id: 'receipt', label: 'وصل الورد' },
            { id: 'moved', label: 'بطاقة ريان بفانوس ربيع' },
            { id: 'drift', label: 'ساعة الحديقة متأخرة ساعة' },
            { id: 'blank', label: 'البطاقة البيضاء' },
          ],
          answers: ['wax', 'moved'],
          done: 'شهادة ربيع مسنودة بدليل.',
        },
        {
          kind: 'pick',
          prompt: 'اللوحة كلها: علّمي كل جملة صحيحة هسه.',
          options: [
            { id: 'hides', label: 'ريان يخبي شي — وهذا عليه دليل.' },
            { id: 'harms', label: 'ريان يخبي شي يأذي أنجي — وهذا عليه دليل.' },
            { id: 'times', label: 'الساعة تفسر ليش الأوقات ما تركب.' },
            { id: 'all', label: 'الساعة تفسر كل شي، حتى البطاقة البيضاء.' },
            { id: 'rabi', label: 'ربيع نقل بطاقة ريان، وعنده سبب.' },
            { id: 'none', label: 'ولا نظرية ثابتة لحد هسه.' },
          ],
          answers: ['hides', 'times', 'rabi', 'none'],
        },
      ],
    },
    wrong: [],
    success: 'ثلاث نظريات، ولا وحدة ثابتة — وهذا صدق، مو فشل. الخيوط الجاية راح تكشف.',
    reward: ['flag:s2:board-2'],
  },
};

// Season 2's story puzzles are solved, never skipped or shown: help ends at the method (owner decision,
// Stage B). Closing a puzzle keeps what she did, so she can go and look, and come back.
// Season 2's story puzzles are strict: no hint, no "show the answer", no skip, and a wrong try is answered
// neutrally (puzzles/host.js) — they are solved by reasoning only.
for (const p of Object.values(PUZZLES_S2)) Object.assign(p, { strict: true, noSkip: true, noSolution: true });
