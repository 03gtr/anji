/**
 * The final story, Chapter 02 — «مو كل مرة أسكت» (s3-f2; docs/final/FINAL_STORY.md). The club, the next day. Ryan
 * passed his driving test (Season 3's clinic: the medical report was for it) and made her a small card: «أول راكبة:
 * أنجي». Sabri teases him in front of everyone, and she answers (decision `club-moment`).
 * Ryan is hurt, and how far it goes is earned by what she has done before, not forced:
 *  - she brushes the card off in front of the club AND has denied him before (to Marius in f1, or to Sabri in Mission
 *    01): he loses his temper and says the one sharp line — «يا معفنة، مو كل مرة أتحمل وأسكت!»;
 *  - she brushes it off with no history behind it: he raises his voice, without the insult;
 *  - she owns it but asks for secrecy, or says nothing: he is hurt, and says so quietly.
 * She is never made to take it: she answers him (decision `after-words`), and that decides HIS way back — she stands
 * up for herself: he names the line he crossed and apologises for it specifically, and keeps his boundary; she asks
 * why: he explains; she goes silent: he asks for time. Both own their part: her fear of the rumour (the whole of
 * Season 3) and the denials; his voice and the word. She need not forgive at once (decision `forgive`). No violence,
 * nothing about the anger is romantic. Fiction written for the game.
 */
import { PACK_S3 } from './constants.js';

const F = (k) => `s3:f2-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-f1';
const OPENED = flag('open');
const TEASED = flag('teased');
const DONE = flag('done');
const HERE = [OPEN, `!${DONE}`];
const X = { door: 90, ryan: 260, board: 470, sabri: 820 };
/** The insult is earned only by a public brush-off on top of an earlier denial. */
export const EARNED = ['dec3:club-moment=deny', { any: ['dec3:marius-ask=deny', 'dec3:sabri-reply=deny'] }];
const NOT_EARNED = { not: EARNED };

export default {
  id: 'f02',
  missions: [
    {
      id: 's3-f2',
      kind: 'story',
      pack: PACK_S3,
      arc: 'final',
      act: 4,
      day: 10,
      world: ['s3-garage'],
      title: 'مو كل مرة أسكت',
      where: 'نادي السيارات',
      summary: 'ريان نجح، وعنده شي يوريها ياه. والنادي كله حاضر.',
      unlock: OPEN,
      locked: 'تنفتح بعد «ماريوس مو أعمى».',
      steps: [
        { done: OPENED, world: 's3-garage', text: 'روحي للنادي. ريان ينتظرچ.' },
        { done: TEASED, world: 's3-garage', text: 'ريان عنده شي بإيده. شوفي شنو.' },
        { done: DONE, world: 's3-garage', text: 'ريان ما يحچي. احچي وياه.' },
      ],
      reward: ['journal:s3-f2'],
      rewardText: 'الحد',
      leadsTo: ['s3-f3'],
    },
  ],
  decisions: {
    // f2: what she says when Sabri teases (read at once, and in f3 and the endings)
    'club-moment': ['deny', 'own', 'quiet'],
    // f2: how she answers his anger (decides his way back: sorry / explain / space; read in f3 and f4)
    'after-words': ['stand', 'why', 'silent'],
    // f2: whether she forgives now, or needs time (read in f3 and f4)
    forgive: ['now', 'time'],
  },
  journal: {
    's3-f2': { title: 'مو كل مرة أسكت', icon: 'heart', text: 'ريان صاح. وأنجي ما سكتت. كل واحد گال اللي جرحه… وكل واحد شال حصته من الغلط.' },
  },
  patches: {
    's3-garage': {
      triggers: [
        {
          id: 'f2-open',
          x1: 100,
          x2: 520,
          if: [...HERE, `!${OPENED}`],
          run: [
            { letterbox: true },
            { camera: X.ryan, ms: 800 },
            { all: [{ face: 'ryan', dir: -1 }, { pose: 'ryan', anim: 'handsup', for: 1200 }, { bubble: 'ryan', text: '🪪✨', ms: 1600 }] },
            { all: [{ pose: 'sabri', anim: 'lean', for: 1400 }, { bubble: 'sabri', text: '👀', ms: 1400 }] },
            { camera: null, ms: 400 },
            { letterbox: false },
            { say: 's3.f2-open' },
            { fx: OPENED, quiet: true },
          ],
        },
      ],
      interact: [
        {
          id: 'ryan',
          cases: [
            {
              if: [...HERE, OPENED, `!${TEASED}`],
              run: [
                { say: 's3.f2-card' },
                { all: [{ move: 'sabri', x: X.board + 90, speed: 200 }, { pose: 'sabri', anim: 'point', for: 1200 }] },
                { say: 's3.f2-tease' },
                { fx: TEASED, quiet: true },
                { all: [{ exit: 'sabri', side: 'right', speed: 170 }, { exit: 'jalal', side: 'right', speed: 150 }] },
                { camera: { between: ['ryan', 'anji'] }, ms: 600 },
                { if: EARNED, then: [{ letterbox: true }, { shake: 0.25 }], else: [] },
                { say: 's3.f2-hurt' },
                { wait: 900 },
                { letterbox: false },
                { say: 's3.f2-answer' },
                { say: 's3.f2-both' },
                { say: 's3.f2-forgive' },
                { camera: null, ms: 400 },
                { spawn: { id: 'marius', kind: 'marius', x: X.door, facing: 1, fadeIn: true } },
                { say: 's3.f2-marius' },
                { exit: 'marius', side: 'left', speed: 140 },
                { fx: DONE },
              ],
            },
            { if: [...HERE, TEASED], run: [{ say: 's3.f2-after' }] },
          ],
        },
      ],
    },
  },
  dialogue: {
    's3.f2-open': [
      { s: 'narrator', t: '(ريان ينتظر يم باب النادي، وبإيده كارت. صبري يباوع من بعيد، ومسويها ما يباوع.)' },
      { s: 'ryan', e: 'smile', t: 'إجيتي! تعالي، تعالي.' },
    ],
    's3.f2-card': [
      { s: 'ryan', e: 'smile', t: 'إجازة السياقة. باسمي. رسمي.', act: [{ pose: 'ryan', anim: 'point', for: 900 }] },
      { s: 'ryan', e: 'smile', t: 'وهاي… سويتها إلچ.', act: [{ bubble: 'ryan', text: '🎫', ms: 1400 }] },
      { s: 'narrator', t: '(كارت صغير، مكتوب بخطه: «أول راكبة: أنجي».)' },
      { s: 'anji', e: 'shy', t: 'ريان…', act: [{ puff: 'anji', type: 'blush', ms: 2400 }] },
    ],
    's3.f2-tease': [
      { s: 'sabri', e: 'laugh', t: 'هاااا! صديق أخوية ماريوس جاب هدية؟! «أول راكبة»؟! الكروب لازم يعرف! دا أكتب هسه!', act: [{ jolt: 'sabri', type: 'hop' }] },
      { s: 'narrator', t: '(كل اللي بالنادي يلتفتون. حتى جلال، من ورا سيارته.)' },
      {
        s: 'anji',
        choice: [
          {
            t: 'صبري! ماكو شي! هاي… ورقة نادي. ريان يوزّع على الكل.',
            do: ['dec3:club-moment=deny'],
            then: [{ s: 'narrator', t: '(تحط الكارت على الطاولة. بسرعة. كأنه يحرگ.)', act: [{ pose: 'anji', anim: 'shrug', for: 900 }] }],
          },
          {
            t: 'إي، جاب هدية. وشنو يعني؟ … بس لا تكتب بالكروب، الله يخليك.',
            do: ['dec3:club-moment=own'],
            then: [{ s: 'sabri', e: 'surprised', t: '… ماشي. ماشي! آني ولا شي.', act: [{ pose: 'sabri', anim: 'handsup', for: 900 }] }],
          },
          {
            t: '(ما تگول شي.)',
            do: ['dec3:club-moment=quiet'],
            then: [{ s: 'narrator', t: '(تباوع للگاع. والكارت يبقى بإيد ريان… ممدود، ومحد ياخذه.)', act: [{ face: 'anji', dir: -1 }] }],
          },
        ],
      },
      { s: 'sabri', e: 'worried', t: 'آني… رايح أشوف البانزين.' },
    ],
    's3.f2-hurt': [
      // the brush-off in front of everyone, after she had denied him before: the line he will regret
      {
        if: EARNED,
        then: [
          { s: 'ryan', e: 'back', t: '«ورقة نادي».', act: [{ pose: 'ryan', anim: 'cross', for: 1600 }, { mood: 'anji', expr: 'worried' }] },
          { if: 'dec3:marius-ask=deny', then: [{ s: 'ryan', t: 'ماريوس گالي البارحة: «أختي تگول ريان صديقي، مو صديقها».' }] },
          { if: 'dec3:sabri-reply=deny', then: [{ s: 'ryan', t: 'وبالعيادة: «مجرد صديق أخوية ماريوس». وصلتني من صبري، بالحرف.' }] },
          { s: 'ryan', t: 'وهسه گدام النادي كله، كأني غلطة لازم تنخبى.' },
          { s: 'ryan', t: 'يا معفنة، مو كل مرة أتحمل وأسكت!', act: [{ jolt: 'ryan', type: 'shake', ms: 600 }, { jolt: 'anji', type: 'tilt' }] },
          { s: 'narrator', t: '(صوته يرن بالنادي الفاضي. وبعدين… سكوت.)', act: [{ mood: 'anji', expr: 'surprised' }] },
        ],
      },
      // the brush-off with nothing behind it: his voice rises, the insult does not come
      {
        if: ['dec3:club-moment=deny', NOT_EARNED],
        then: [
          { s: 'ryan', e: 'back', t: '«ورقة نادي»؟', act: [{ pose: 'ryan', anim: 'cross', for: 1400 }, { mood: 'anji', expr: 'worried' }] },
          { s: 'ryan', t: 'مو كل مرة أتحمل وأسكت، أنجي!', act: [{ jolt: 'ryan', type: 'shake', ms: 500 }] },
          { s: 'narrator', t: '(صوته أعلى من اللازم. وهو نفسه انتبه.)' },
        ],
      },
      {
        if: 'dec3:club-moment=own',
        then: [
          { s: 'ryan', e: 'turn', t: '«لا تكتب بالكروب».', act: [{ pose: 'ryan', anim: 'think', for: 1400 }, { mood: 'anji', expr: 'worried' }] },
          { s: 'ryan', t: 'يعني آني شي لازم ينخبى؟ حتى لمن تگولين «إي»… تگولينها بصوت واطي.' },
          { s: 'ryan', t: 'مو كل مرة أسكت، أنجي. هالمرة لا.' },
        ],
      },
      {
        if: 'dec3:club-moment=quiet',
        then: [
          { s: 'ryan', e: 'back', t: 'ما گلتي ولا كلمة. ولا كلمة.', act: [{ pose: 'ryan', anim: 'cross', for: 1400 }, { mood: 'anji', expr: 'worried' }] },
          { s: 'ryan', t: 'تعبت أكون السر اللي محد يشوفه. مو كل مرة أسكت.' },
        ],
      },
    ],
    // she answers him: her way decides his way back
    's3.f2-answer': [
      {
        s: 'anji',
        choice: [
          {
            t: 'لا تحچي ويايا هيچ.',
            do: ['dec3:after-words=stand'],
            then: [
              { if: EARNED, then: [{ s: 'anji', e: 'determined', t: '«معفنة»؟! هيچ تشوفني؟ زعلان، إي. بس هالكلمة؟ لا.', act: [{ pose: 'anji', anim: 'cross', for: 1400 }] }], else: [{ s: 'anji', e: 'determined', t: 'زعلان، إي. بس لا تصيح عليّ. ولا مرة.', act: [{ pose: 'anji', anim: 'cross', for: 1400 }] }] },
              { s: 'narrator', t: '(ريان يفتح حلگه… ويسده. يحط إيده على وجهه.)', act: [{ pose: 'ryan', anim: 'facepalm', for: 1600 }] },
              { if: EARNED, then: [{ s: 'ryan', e: 'turn', t: 'إنتِ صح. «معفنة»… ما چانت لازم تطلع مني. ولا بأي زعل. آسف على الكلمة. آسف إني صحت.' }], else: [{ s: 'ryan', e: 'turn', t: 'إنتِ صح. ما چان لازم أصيح. آسف على الصوت.' }] },
              { s: 'ryan', t: 'بس اللي ورا الصوت صدگ: ما أگدر أبقى الشي اللي تنكرينه كل ما أحد سأل. هذا حدّي.' },
            ],
          },
          {
            t: '… شبيك؟ گولي شصار، مو تصيح.',
            do: ['dec3:after-words=why'],
            then: [
              { s: 'ryan', e: 'turn', t: 'لأن كل مرة أحد يسأل، تختفين. وآني أبقى واگف… مثل الغلط اللي لازم يتصلّح.', act: [{ pose: 'ryan', anim: 'think', for: 1400 }] },
              { s: 'ryan', t: 'جبت الكارت لأني ردت أول شي أسويه بالإجازة… يكون إنتِ. وطلع آخر شي تريدين ينشاف.' },
              { if: { any: [EARNED, 'dec3:club-moment=deny'] }, then: [{ s: 'ryan', t: 'وصوتي… آسف عليه.' }] },
              { if: EARNED, then: [{ s: 'ryan', t: 'والكلمة اللي گلتها… آسف عليها بالذات. ما تستاهليها، ومحد يستاهلها.' }] },
            ],
          },
          {
            t: '(تسكت، وتلتفت.)',
            do: ['dec3:after-words=silent'],
            then: [
              { s: 'narrator', t: '(تلتفت للشباك. تحس الدموع، وما تخليها تنزل.)', act: [{ face: 'anji', dir: -1 }, { mood: 'anji', expr: 'worried' }] },
              { s: 'ryan', e: 'back', t: '… أحتاج شوية وقت. مو زعل منچ بس. زعلان من نفسي هم.', act: [{ pose: 'ryan', anim: 'think', for: 1400 }] },
              { if: EARNED, then: [{ s: 'ryan', t: 'وهاي الكلمة… آسف. ما أريد أكون الشخص اللي يحچي هيچ.' }], else: [{ s: 'ryan', t: 'وصوتي… ما چان لازم يعلى.' }] },
            ],
          },
        ],
      },
    ],
    // both own their part
    's3.f2-both': [
      { s: 'anji', e: 'worried', t: 'آني خايفة، ريان. شفت شنو صار بالمقطع؟ كلمة وحدة صارت قصة بكل الكروبات.', act: [{ face: 'anji', dir: 1 }] },
      { s: 'anji', e: 'soft', t: 'خفت إذا گلت «إي»… يصير كلامنا بتلفون كل واحد. فصرت أگول «لا» قبل لا أفكر.' },
      { s: 'anji', e: 'soft', t: 'بس إنت صح بشي: أنكرتك هواي. وهذا مو عدل عليك.' },
      { s: 'ryan', e: 'smile', t: 'وآني ما فكرت شكد صعبة عليچ. ردت تگولينها گدام الكل… وإنتِ بعدچ طالعة من قصة كلها كلام.', act: [{ mood: 'anji', expr: 'soft' }] },
    ],
    's3.f2-forgive': [
      {
        s: 'anji',
        choice: [
          {
            t: 'خلص… بس لا تعيدها.',
            do: ['dec3:forgive=now'],
            then: [{ if: EARNED, then: [{ s: 'anji', e: 'soft', t: 'ولا هالصوت. ولا هالكلمة.' }], else: [{ s: 'anji', e: 'soft', t: 'ولا هالصوت.' }] }, { s: 'ryan', e: 'smile', t: 'ما أعيدها. وإذا انجرحت، أگلچ قبل لا أنفجر.' }],
          },
          {
            t: 'أحتاج وقت آني هم. مو هسه.',
            do: ['dec3:forgive=time'],
            then: [{ s: 'ryan', e: 'smile', t: '… مفهوم. خذي وقتچ. آني هنا لمن تكونين جاهزة.' }, { s: 'narrator', t: '(تاخذ الكارت من إيده. ما تگول شي. بس تاخذه.)' }],
          },
        ],
      },
    ],
    's3.f2-marius': [
      { s: 'marius', e: 'surprised', t: 'شكو؟ ليش الوجوه هيچ؟ واحد مات؟' },
      { s: 'ryan', e: 'turn', t: 'ولا شي. شغلة بيناتنا.' },
      { s: 'narrator', t: '(ماريوس يباوع على ريان، وعلى أخته، وعلى الكارت. ويسكت. ثاني مرة يسكت هالأسبوع.)', act: [{ pose: 'marius', anim: 'think', for: 1600 }] },
      { s: 'marius', e: 'smile', t: 'زين. آني جيت أجيب مفتاح. وما شفت شي.' },
    ],
    's3.f2-after': [{ s: 'ryan', e: 'turn', t: 'روحي ارتاحي. اليوم چان طويل… علينا الاثنين.' }],
  },
};
