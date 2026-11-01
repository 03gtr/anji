/**
 * Season 2, M2 — the Living Story missions' dialogue (docs/season-2/SEASON_2_LIVING_STORY_C1.md).
 * Keys start with `s2.`, so what she has seen is kept in Season 2's own save. Every line's `e:` is the face
 * the speaker shows in the world too, and `act` plays while the line is read. Nothing said before a puzzle is
 * solved names its answer (tests/game/s2-living.test.js scans for it). Fiction written for the game.
 *
 * Mission 01 «سر المكتب»: at work, Ryan and Anji's relationship is private (owner decision) — until Sabri,
 * meaning well, says it out loud. Nobody is a villain; the comedy is his, and it is kind.
 */
import { gather } from '../m2/index.js';

export const S2_M2 = {
  ...gather('dialogue'),
  /* ── Mission 01 · المكتب ── */
  's2.office-enter': [
    { s: 'anji', e: 'curious', t: 'المكتب. صوت طابعة، ريحة گهوة، وصبري يطگطگ على الكيبورد.' },
    { s: 'lama', e: 'smile', t: 'أنجي! تعالي. إذا الجملة دارت، فهنا بدت. كل شي بهالمكتب ينكتب على ورقة.', act: [{ pose: 'lama', anim: 'point', for: 900 }] },
    { s: 'anji', e: 'determined', t: 'زين. نشوف الأوراق… قبل ما نسأل الناس.' },
  ],
  's2.12-rota': [
    { s: 'anji', e: 'thinking', t: 'جدول الگهوة. كل يوم منو يسوّي الگهوة… وبالزاوية سطر بخط صبري.' },
    { s: 'narrator', t: '«آني أعيد الكلام مثل ما سمعته، حرف بحرف.»' },
    { s: 'anji', e: 'smile', t: '(صبري يفتخر بهالشي. حتى على جدول گهوة.)' },
  ],
  's2.12-rota-again': [{ s: 'anji', e: 'thinking', t: '«حرف بحرف.» صبري ما يزيد ولا ينقص.' }],
  's2.12-calendar': [
    { s: 'anji', e: 'thinking', t: 'تقويم المكتب. كل واحد يكتب عليه شنو عنده.' },
    { s: 'narrator', t: '«الأحد: ريان ويا صبري ببالة الگهوة.» … «الاثنين: لمى سمعت شي عن ريان!!»' },
    { s: 'lama', e: 'shy', t: 'آآ… هاي علامات التعجب مو مالتي. يعني… مالتي. بس مو هواية.', act: [{ pose: 'lama', anim: 'facepalm', for: 1100 }] },
  ],
  's2.12-calendar-again': [{ s: 'anji', e: 'thinking', t: 'الأحد ويا صبري. الاثنين لمى. والثلاثاء؟ فارغ.' }],

  's2.12-sabri-guard': [
    { s: 'sabri', e: 'surprised', t: 'أنجي! أهلاً! هلا! شلونچ! … ليش تباوعين على شاشتي؟', act: [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'handsup', for: 700 }] },
    { s: 'anji', e: 'smile', t: 'ولا شي. شاشة حلوة.' },
    { s: 'sabri', e: 'worried', t: 'إي. حلوة. خاصة. جداً خاصة. مثل… مثل سر دولة.', act: [{ pose: 'sabri', anim: 'cross', for: 1200 }] },
    // what she did at the gym when Ryan dropped the receipt (M1 s2-07: dec sabri) — he remembers
    { if: 'dec:sabri=press', then: [{ s: 'sabri', e: 'suspicious', t: 'وبالصالة سألتيني «شنو الموضوع؟». ما گلت وقتها… ولا هسه أگول!', act: [{ jolt: 'sabri', type: 'tilt', ms: 500 }] }] },
    { if: 'dec:sabri=let-be', then: [{ s: 'sabri', e: 'smile', t: 'وبالصالة ما سألتي عن الوصل. شكراً… فلا تسأليني هسه هم، زين؟', act: [{ pose: 'sabri', anim: 'handsup', for: 700 }] }] },
    { s: 'anji', e: 'thinking', t: '(أكو ورقة لاصقة على الشاشة. وهو ما يشيل عينه عنها.)' },
  ],
  's2.12-lama-plan': [
    { s: 'lama', e: 'suspicious', t: 'صبري يحرس شاشته؟ أعرف علاجه: الگهوة. إذا حچيته عن الگهوة، ينسى الدنيا.' },
    {
      s: 'anji',
      choice: [
        { t: 'شغليه بالحچي، وآني أشوف الورقة.', do: ['flag:s2:12-distract'], then: [{ s: 'lama', e: 'smile', t: 'خمس دقايق عن الهيل والسكر. راح يدوخ.', act: [{ jolt: 'lama', type: 'hop' }] }] },
        { t: 'خلّينا نصبر شوية.', then: [{ s: 'lama', e: 'thinking', t: 'زين. بس هو ما راح يغفل لوحده.' }] },
      ],
    },
  ],
  's2.12-lama-distracting': [{ s: 'lama', e: 'smile', t: '(تغمز) …والهيل، صبري، لازم يتحمص أول. مو؟', act: [{ pose: 'lama', anim: 'laugh', for: 800 }] }],
  's2.12-sticky-caught': [
    { s: 'sabri', e: 'surprised', t: 'إيييي! هاي خاصة! ممنوع! منطقة صبري!', act: [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'handsup', for: 900 }] },
    { s: 'anji', e: 'shy', t: '(لاحظني. لازم أنتظر لحظة ما يباوع.)' },
  ],
  's2.12-sticky-read': [
    { s: 'narrator', t: 'ورقة لاصقة بخط ريان: «صبري، لا تگول لأحد. — ر» وبالزاوية، صغير: «الأحد».' },
    { s: 'anji', e: 'surprised', t: '(خط ريان. «لا تگول لأحد»… شنو؟)' },
  ],
  's2.12-slip': [
    { s: 'sabri', e: 'surprised', t: 'أنجي! لگيتيها؟ … لا تزعلين من ريان! هو يحبچ هوايه، والله!', act: [{ jolt: 'sabri', type: 'hop' }] },
    { s: 'sabri', e: 'smile', t: 'آني أعرف إنتي وياه… يعني… سوى! من زمان! مبروك!', act: [{ pose: 'sabri', anim: 'laugh', for: 900 }] },
    { s: 'lama', e: 'surprised', t: 'شنووو؟! إنتي وريان؟!', act: [{ pose: 'lama', anim: 'handsup', for: 1200 }, { jolt: 'lama', type: 'hop' }] },
    { s: 'anji', e: 'shy', t: '…' },
    { s: 'sabri', e: 'worried', t: '… أوه.', act: [{ puff: 'sabri', type: 'sweat', ms: 2400 }] },
  ],
  's2.12-printer-chaos': [
    { s: 'sabri', e: 'surprised', t: 'الطابعة! الطابعة هي اللي گالتها! طابعة حساسة! تطبع إشاعات!' },
    { s: 'lama', e: 'suspicious', t: 'صبري… الطابعة گاعدة تطلّع أوراق بالهوا.', act: [{ pose: 'lama', anim: 'cross', for: 1200 }] },
    { s: 'sabri', e: 'worried', t: 'آني بخير! كلشي تحت السيطرة! … الأوراق مو تحت السيطرة.', act: [{ pose: 'sabri', anim: 'facepalm', for: 1300 }] },
  ],
  's2.12-paper-pick': [{ s: 'anji', e: 'soft', t: 'ورقة… أرجعها للطابعة.' }],
  's2.12-print-read': [
    { s: 'anji', e: 'thinking', t: 'هاي مو من شغل المكتب. رسالة لمى… انطبعت بالغلط.' },
    { s: 'narrator', t: '«… وگلتلها: ريان يخبي شي.»' },
    { s: 'lama', e: 'shy', t: 'هاي… آآ… خليها بالصينية. بسرعة.', act: [{ pose: 'lama', anim: 'facepalm', for: 1100 }] },
  ],
  's2.12-hands-full': [{ s: 'anji', e: 'thinking', t: 'إيدي مليانة. أرجّع هاي أول.' }],
  's2.12-tray': [{ s: 'anji', e: 'soft', t: 'رجعت مكانها.' }],
  's2.12-cover-choice': [
    { s: 'sabri', e: 'worried', t: 'أنجي… إذا أحد سأل، گولي الطابعة اللي گالت. الله يخليچ. آني ما أگدر أشيل لساني.', act: [{ pose: 'sabri', anim: 'handsup', for: 1000 }] },
    {
      s: 'anji',
      choice: [
        {
          t: 'إي… هاي طابعة حساسة. تطبع إشاعات.',
          do: ['dec:office-cover=cover', 'flag:s2:12-tidy'],
          then: [
            { s: 'sabri', e: 'smile', t: 'بطلة! أنجي بطلة!', act: [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'laugh', for: 900 }] },
            { s: 'lama', e: 'suspicious', t: 'طابعة. إي. أكيد. همممم.', act: [{ pose: 'lama', anim: 'lean', for: 1200 }] },
          ],
        },
        {
          t: 'لا يا صبري. الصدگ أحلى. إي، آني وريان.',
          do: ['dec:office-cover=truth', 'flag:s2:12-tidy', 'flag:s2:12-lama-knows'],
          then: [
            { s: 'lama', e: 'smile', t: 'عرفتها! من زمان عرفتها! بس ردت تگولينها إنتي.', act: [{ pose: 'lama', anim: 'laugh', for: 1200 }, { jolt: 'lama', type: 'hop' }] },
            { s: 'sabri', e: 'worried', t: 'يعني… ما سويت شي غلط؟' },
            { s: 'anji', e: 'smile', t: 'سويت. بس طلعت حلوة.' },
          ],
        },
      ],
    },
  ],
  's2.12-board-wait': [{ s: 'lama', e: 'thinking', t: 'لوحة المكتب. بس بعد ناقصتنا أوراق. كل ورقة تشهد على شي.' }],
  's2.12-board-intro': [
    { s: 'lama', e: 'determined', t: 'نرتبها: ثلاث أيام، ثلاث جمل. منو حچى، لمن، وشنو گال.', act: [{ pose: 'lama', anim: 'point', for: 900 }] },
    { s: 'anji', e: 'determined', t: 'بس من الأوراق. مو من اللي نتوقعه.' },
  ],
  's2.12-board-done': [
    { s: 'anji', e: 'thinking', t: 'نفس الجملة… ثلاث نسخ. وكل نسخة أقصر من اللي قبلها، وأخوف.' },
    { s: 'lama', e: 'worried', t: 'والنسخة الأخيرة… آني اختصرتها. ما چنت أقصد.', act: [{ pose: 'lama', anim: 'shrug', for: 1200 }] },
    { s: 'anji', e: 'soft', t: 'أعرف. وچنتي خايفة عليّ. هذا مو ذنب.' },
  ],
  's2.12-board-again': [{ s: 'anji', e: 'thinking', t: 'ريان طلب السكوت، صبري عاد الكلام، لمى اختصرته. باقي: ليش السكوت؟' }],
  's2.12-ryan-arrives': [
    { if: 'dec:office-cover=truth', then: [
      { s: 'ryan', t: 'ليش الكل يبتسم هيچ؟' },
      { s: 'lama', e: 'smile', t: 'مبروك ريان!', act: [{ pose: 'lama', anim: 'laugh', for: 1000 }] },
      { s: 'ryan', t: '… صبري؟', act: [{ puff: 'ryan', type: 'steam', ms: 1600 }] },
      { s: 'sabri', e: 'worried', t: 'الطابعة! … لا. آني. آني گلتها. آسف.', act: [{ pose: 'sabri', anim: 'facepalm', for: 1200 }] },
    ] },
    { if: 'dec:office-cover=cover', then: [
      { s: 'ryan', t: 'ليش الطابعة مطفية… وكلكم تباوعون عليها؟' },
      { s: 'sabri', e: 'smile', t: 'الطابعة… گالت أشياء. أشياء كبيرة.', act: [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'point', for: 900 }] },
      { s: 'ryan', t: '…', act: [{ emote: 'ryan', icon: '?', ms: 1600 }] },
      { s: 'anji', e: 'shy', t: 'بعدين أحچيلك.' },
    ] },
    { s: 'ryan', t: 'لگيتي شي؟' },
    { s: 'anji', e: 'determined', t: 'ثلاث نسخ من نفس الجملة. وحدة منها بخطك: «لا تگول لأحد».' },
    { s: 'ryan', t: '… چانت لسبب. وراح تعرفينه. بس مو هسه.' },
  ],
  's2.12-lama-chat': [
    { if: 'flag:s2:12-lama-knows', then: [{ s: 'lama', e: 'smile', t: 'إنتي وريان. بالمكتب. وآني آخر من يدري! … لا، صبري آخر من يسكت.' }] },
    { if: 'dec:office-cover=cover', then: [{ s: 'lama', e: 'suspicious', t: 'الطابعة… أكيد؟ أنجي، آني صديقتچ. يوم تحبين تحچين، آني هنا.' }] },
    { if: '!dec:office-cover=cover', then: [{ if: '!flag:s2:12-lama-knows', then: [{ s: 'lama', e: 'thinking', t: 'كل ورقة بهالمكتب تشهد على شي. نلگاها.' }] }] },
  ],
  's2.12-sabri-chat': [
    { if: 'dec:office-cover=truth', then: [{ s: 'sabri', e: 'smile', t: 'آني من اليوم ساكت. بس… مبروك. مرة ثانية. آخر مرة.' }] },
    { if: 'dec:office-cover=cover', then: [{ s: 'sabri', e: 'smile', t: 'الطابعة صارت صديقتي. نتفاهم.' }] },
    { if: '!flag:s2:12-tidy', then: [{ s: 'sabri', e: 'worried', t: 'كلشي تمام. كلشي طبيعي. لا تباوعين على الشاشة.' }] },
  ],
};
