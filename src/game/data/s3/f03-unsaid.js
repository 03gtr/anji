/**
 * The final story, Chapter 03 — «الحچي اللي تأجل» (s3-f3; docs/final/FINAL_STORY.md). The lane at dawn, where Snooky
 * once found the keyring. A quiet chapter: no puzzle, no score, nothing to fail. She walks the lane with Ryan, Snooky
 * ahead of them, and stops where she likes; each stop is one thing they had put off saying — what they were afraid of
 * (the grate), what each expected (the tyre marks), what each needs to feel respected (the oil stain: decision
 * `need`) — in any order, with pauses and faces more than words. Then Ryan asks the one question left, and she names
 * the place she will answer it. What they say reads Chapter 02 (`club-moment`, `after-words`, `forgive`).
 * Marius, from afar, covers for her — he knows more than he says. Fiction written for the game.
 */
import { PACK_S3 } from './constants.js';

const F = (k) => `s3:f3-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-f2';
const OPENED = flag('open');
const FEAR = flag('fear');
const HOPE = flag('hope');
const NEED = flag('need');
const DONE = flag('done');
const HERE = [OPEN, `!${DONE}`];
const TALKED = [FEAR, HOPE, NEED];
const X = { ryan: 220, grate: 420, marks: 1150, oil: 1300 };
const SAYS = (t, act) => ({ s: 'narrator', t, ...(act ? { act } : {}) });

export default {
  id: 'f03',
  missions: [
    {
      id: 's3-f3',
      kind: 'story',
      pack: PACK_S3,
      arc: 'final',
      act: 4,
      day: 11,
      world: ['s3-lane'],
      title: 'الحچي اللي تأجل',
      where: 'الدربونة، الفجر',
      summary: 'أكو حچي صارله شهور يتأجل. الفجر وقت زين حتى ينگال.',
      unlock: OPEN,
      locked: 'تنفتح بعد «مو كل مرة أسكت».',
      steps: [
        { done: OPENED, world: 's3-lane', text: 'روحي للدربونة. ريان وسنوكي هناك، من الفجر.' },
        { done: TALKED, world: 's3-lane', text: 'امشوا سوا. وين ما توگفين… أكو حچي تأجل.' },
        { done: DONE, world: 's3-lane', text: 'ريان عنده سؤال أخير.' },
      ],
      reward: ['journal:s3-f3'],
      rewardText: 'الحچي اللي تأجل',
      leadsTo: ['s3-f4'],
    },
  ],
  decisions: {
    // f3: what she needs to feel respected (read in f4: Ryan's promise is to THAT)
    need: ['seen', 'told', 'patience'],
  },
  journal: {
    's3-f3': { title: 'الحچي اللي تأجل', icon: 'heart', text: 'الخوف، واللي توقعناه، واللي نحتاجه. ثلاث وگفات بالدربونة… وسنوكي يسبقنا لكل وحدة.' },
  },
  patches: {
    's3-lane': {
      triggers: [
        {
          id: 'f3-open',
          x1: 80,
          x2: 400,
          if: [...HERE, `!${OPENED}`],
          run: [
            { letterbox: true },
            { all: [{ move: 'snooki', x: X.ryan + 70, speed: 240 }, { camera: X.ryan, ms: 900 }] },
            { all: [{ pose: 'snooki', anim: 'wag', for: 1400 }, { face: 'ryan', dir: -1 }] },
            { camera: null, ms: 400 },
            { letterbox: false },
            { say: 's3.f3-open' },
            { fx: OPENED, quiet: true },
          ],
        },
      ],
      interact: [
        // Snooky walks ahead and sits at each stop: on this walk he is company, not something to examine (so a tap or
        // E at a stop always reaches the stop)
        { id: 'snooki', if: ['flag:s3:05-opened', { not: HERE }] },
        {
          id: 'grate',
          cases: [{ if: [...HERE, OPENED, `!${FEAR}`], run: [{ move: 'snooki', x: X.grate + 40, speed: 220 }, { pose: 'snooki', anim: 'sit', for: 1600 }, { move: 'ryan', x: X.grate - 70, speed: 140 }, { say: 's3.f3-fear' }, { fx: FEAR }] }],
        },
        {
          id: 'marks',
          cases: [{ if: [...HERE, OPENED, `!${HOPE}`], run: [{ move: 'snooki', x: X.marks + 30, speed: 220 }, { pose: 'snooki', anim: 'sniff', for: 1400 }, { move: 'ryan', x: X.marks - 80, speed: 140 }, { say: 's3.f3-hope' }, { fx: HOPE }] }],
        },
        {
          id: 'oil',
          cases: [{ if: [...HERE, OPENED, `!${NEED}`], run: [{ move: 'snooki', x: X.oil - 40, speed: 220 }, { pose: 'snooki', anim: 'sit', for: 1600 }, { move: 'ryan', x: X.oil - 110, speed: 140 }, { say: 's3.f3-need' }, { fx: NEED }] }],
        },
        {
          id: 'ryan',
          cases: [
            { if: [...HERE, OPENED, { not: TALKED }], run: [{ say: 's3.f3-walk' }] },
            { if: [...HERE, ...TALKED], run: [{ camera: { between: ['ryan', 'anji'] }, ms: 600 }, { say: 's3.f3-question' }, { camera: null, ms: 400 }, { fx: DONE }] },
          ],
        },
      ],
    },
  },
  dialogue: {
    's3.f3-open': [
      { if: 'dec3:forgive=time', then: [SAYS('(مرّت أيام. وأنجي هي اللي دزت: «تعال للدربونة. الفجر. جيب سنوكي.»)')], else: [SAYS('(من يومها، ريان يحچي أقل… ويسمع أكثر. واليوم هو اللي طلب: «الدربونة، الفجر؟»)')] },
      { s: 'ryan', e: 'smile', t: 'صباح الخير.' },
      { s: 'anji', e: 'soft', t: 'صباح النور. … نمشي؟' },
      SAYS('(سنوكي ما ينتظر جواب. يمشي قدّامهم، وذيله يگول: «يلا».)', [{ pose: 'snooki', anim: 'wag', for: 1200 }]),
    ],
    's3.f3-walk': [{ s: 'ryan', e: 'smile', t: 'وين ما توگفين، أوگف وياچ.' }],
    // the grate: what they were afraid to say
    's3.f3-fear': [
      SAYS('(هنا لگى سنوكي الميدالية. هسه بس گاعد، يباوع للمجرى.)'),
      { s: 'anji', e: 'soft', t: 'تدري شنو چان أكثر شي خايفة منه؟ مو إنت. الناس.' },
      { s: 'anji', e: 'worried', t: 'إن يصير اسمي ويا اسمك جملة بكروب. «شفتوا أنجي ويا…» وكل واحد يكمّلها على كيفه.' },
      { wait: 500 },
      { s: 'ryan', e: 'back', t: 'وآني چنت خايف من شي ثاني.', act: [{ pose: 'ryan', anim: 'think', for: 1400 }] },
      { s: 'ryan', e: 'turn', t: 'إنچ تستحين بيّ. إني أبقى «صديق أخوية ماريوس» للأبد، وإنتِ تتفقين ويا الجملة.' },
      { if: 'dec3:club-moment=deny', then: [{ s: 'ryan', t: 'وبالنادي… حسيت خوفي صار صدگ.' }] },
      { s: 'anji', e: 'soft', t: 'ما استحيت بيك ولا يوم. استحيت من نفسي، إني خايفة.' },
    ],
    // the tyre marks: what each expected
    's3.f3-hope': [
      SAYS('(آثار التفحيط بعدها على الرصيف. سنوكي يشمها، ويعطس.)', [{ bubble: 'snooki', text: '🤧', ms: 1200 }]),
      { s: 'ryan', e: 'smile', t: 'چنت أتوقع… إنچ توگفين يمي. مو گدام الدنيا كلها. بس گدام اللي يهمونچ.' },
      { s: 'anji', e: 'thinking', t: 'وآني چنت أتوقع إنك تصبر. وطلع صبرك إله آخر.' },
      { if: 'dec3:after-words=stand', then: [{ s: 'ryan', e: 'turn', t: 'إله آخر. بس آخره ما يصير صياح. هاي تعلمتها منچ ذاك اليوم.' }] },
      { if: 'dec3:after-words=why', then: [{ s: 'ryan', e: 'turn', t: 'إله آخر. وإنتِ سألتيني «شبيك»… بدال ما تصيحين ويايا. هاي ما أنساها.' }] },
      { if: 'dec3:after-words=silent', then: [{ s: 'ryan', e: 'turn', t: 'إله آخر. وذاك اليوم سكتّي… وآني طلبت وقت. يمكن الاثنين چنا نحتاجه.' }] },
      { s: 'anji', e: 'smile', t: 'يعني الاثنين توقعنا من الثاني شي… وما گلناه.' },
      { s: 'ryan', e: 'smile', t: 'من هسه نگوله. حتى لو يطلع بايخ.' },
    ],
    // the oil stain: what each needs to feel respected
    's3.f3-need': [
      SAYS('(سنوكي يگعد يم البقعة، كأنه حارس.)'),
      { s: 'ryan', e: 'turn', t: 'شنو تحتاجين… حتى تحسين إني أحترمچ؟ مو شنو أسوي، شنو تحتاجين.' },
      {
        s: 'anji',
        choice: [
          { t: 'أريدك تشوفني… مو تشوف اللي الناس يگولونه عني.', do: ['dec3:need=seen'], then: [{ s: 'ryan', e: 'smile', t: 'أشوفچ. من أول ليلة بالحديقة.' }] },
          { t: 'أريدك تگلي لمن تنجرح. مو تسكت لحد ما تنفجر.', do: ['dec3:need=told'], then: [{ s: 'ryan', e: 'smile', t: 'أگلچ. بصوت عادي. وعلى طول.' }] },
          { t: 'أريد وقت أختار بيه بنفسي. بدون ضغط من أحد… حتى منك.', do: ['dec3:need=patience'], then: [{ s: 'ryan', e: 'smile', t: 'خذيه. الوقت مالچ، مو مالي.' }] },
        ],
      },
      { s: 'anji', e: 'soft', t: 'وإنت؟' },
      { s: 'ryan', e: 'back', t: 'آني أحتاج… ما أكون سر. مو لازم الدنيا كلها تعرف. بس اللي يهمونچ، يعرفون.' },
    ],
    's3.f3-question': [
      { wait: 600 },
      { s: 'ryan', e: 'turn', t: 'أنجي. إحنا… جاهزين نبني شي؟ سوا؟ مو قصة بكروب. شي إلنا.' },
      SAYS('(سكوت. بس هالمرة مو ثقيل.)', [{ pose: 'snooki', anim: 'sit', for: 1600 }]),
      { s: 'anji', e: 'soft', t: 'مو هنا. مو هسه.', act: [{ puff: 'anji', type: 'blush', ms: 1800 }] },
      { s: 'anji', e: 'smile', t: 'الليلة. يم بيتنا. تحت الشجر. هناك أجاوبك.' },
      { s: 'ryan', e: 'smile', t: 'تحت الشجر. زفيرو يعرف الطريق.' },
      SAYS('(وتلفونها يرن. ماريوس: «إذا أحد سأل، إنتِ ويا لمى. … لا تشكريني. ولا تسأليني شلون عرفت.»)'),
      { if: 'dec3:marius-ask=ask-back', then: [{ s: 'anji', e: 'surprised', t: '«عندي عيون»… گالها. وطلع صدگ.' }], else: [{ s: 'anji', e: 'surprised', t: 'ماريوس…؟ شلون عرف؟' }] },
    ],
  },
};
