/**
 * The final story, Chapter 04 — «الباقي إلنا» (s3-f4; docs/final/FINAL_STORY.md). Her street, night, under the trees
 * where Zefiro once spoke for him. Ryan says it himself this time: what he feels, and the future he hopes for — to come
 * properly, and ask for her hand. He does not press; she decides (decision `final`), and the choice is hers alone.
 *  - Ending A «إي. أختارك.»: earned and hopeful — his tears and his laugh at once, a quiet embrace, Zefiro's lights,
 *    and Marius, who finally sees what he had guessed all week, half laughing and half proud. No ceremony, no date.
 *  - Ending B «مو هسه.»: a real ending, not a punishment — he respects it without bargaining, she is not cruel and he is
 *    not worthless; he drives away slowly, and the silence carries it. Marius does not ask; he stands with her.
 * The ending is recorded by `end3:` (core/effects.js): the FIRST ending is kept for ever (`s3:end:first`), the latest
 * (`s3:end:last`) and every choice in order (`s3:end:history`) beside it. «الاختيار الأخير، مرة ثانية» — from the
 * journal or the street — plays the choice again without restarting anything, and never overwrites the first.
 * Fiction written for the game.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3 } from './constants.js';
import { zefiro, carColor } from './art.js';
import { X as STREET } from './m02-v8.js';

const F = (k) => `s3:f4-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-f3';
const ARRIVED = flag('arrived');
const DONE = flag('done'); // the first choice is made (the mission is complete)
const LIGHTS = flag('lights'); // Zefiro running, lights on, for the moment
const BLINK = flag('blink');
/** Zefiro drives off (ending B): the parked car of Mission 02 is not drawn while she is away (m02-v8.js). */
export const AWAY = flag('away');
const GONE = flag('gone');
/** Set by «الاختيار الأخير، مرة ثانية»: the street plays the choice again on arrival. */
export const REPLAY = flag('replay');
const ASK_AGAIN = flag('ask-again');
const X = { gate: 200, tree: 1020, ryan: STREET.car - 150 };
const SAYS = (t, act) => ({ s: 'narrator', t, ...(act ? { act } : {}) });

/** The moment of choice, the same the first time and on a replay. */
const CHOICE = [
  { letterbox: true },
  { fx: [LIGHTS, `!${AWAY}`, `!${GONE}`], quiet: true },
  { sfx: 'v8-start' },
  { wait: 900 },
  { camera: { between: ['ryan', 'anji'] }, ms: 700 },
  { letterbox: false },
  { say: 's3.f4-ryan' },
  { say: 's3.f4-choice' },
  { if: 'dec3:final=yes', then: [{ say: 's3.f4-yes' }, { camera: STREET.car - 110, ms: 700 }, { move: 'anji', to: 'ryan', gap: 30 }, { all: [{ face: 'anji', toward: 'ryan' }, { face: 'ryan', toward: 'anji' }, { puff: 'anji', type: 'blush', ms: 3000 }, { fx: BLINK, quiet: true }, { sfx: 'v8-blip' }] }, { say: 's3.f4-embrace' }, { spawn: { id: 'marius', kind: 'marius', x: X.gate, facing: 1, fadeIn: true } }, { move: 'marius', x: X.ryan - 260, speed: 150 }, { say: 's3.f4-marius-yes' }, { fx: 'end3:yes' }, { camera: null, ms: 500 }, { chapter: { kicker: 'النهاية', title: 'الباقي إلنا', sub: 'اختارته. ومن هنا… يبدأ الباقي.' } }] },
  {
    if: 'dec3:final=later',
    then: [
      { say: 's3.f4-later' },
      { letterbox: true },
      { all: [{ camera: STREET.car - 60, ms: 900 }, { move: 'ryan', x: STREET.car - 40, speed: 100 }] },
      { despawn: 'ryan', fade: true },
      { fx: AWAY, quiet: true },
      { sfx: 'v8-idle' },
      { wait: 2600 },
      { fx: [GONE, `!${LIGHTS}`, `!${BLINK}`], quiet: true },
      { camera: 'anji', ms: 900 },
      { wait: 900 },
      { letterbox: false },
      { say: 's3.f4-silence' },
      { spawn: { id: 'marius', kind: 'marius', x: X.gate, facing: 1, fadeIn: true } },
      { move: 'marius', to: 'anji', gap: 70, speed: 120 },
      { say: 's3.f4-marius-later' },
      { fx: 'end3:later' },
      { camera: null, ms: 500 },
      { chapter: { kicker: 'النهاية', title: 'مو هسه', sub: 'بعض الأجوبة تحتاج وقت. وهذا مو نهاية الحچي… هذا جوابها.' } },
    ],
  },
  { fx: [DONE, `!${REPLAY}`] },
];

let leftAt = null; // when the car started off (a drawing's own clock; nothing saved)

export default {
  id: 'f04',
  missions: [
    {
      id: 's3-f4',
      kind: 'story',
      pack: PACK_S3,
      arc: 'final',
      act: 4,
      day: 12,
      world: ['s3-street'],
      title: 'الباقي إلنا',
      where: 'شارع أنجي، بالليل',
      summary: 'تحت الشجر، يم البيت. الجواب صار إلها.',
      unlock: OPEN,
      locked: 'تنفتح بعد «الحچي اللي تأجل».',
      steps: [
        { done: ARRIVED, world: 's3-street', text: 'ارجعي لشارعچ بالليل. ريان ينتظر تحت الشجر.' },
        { done: DONE, world: 's3-street', text: 'ريان هنا. والجواب… إلچ.' },
      ],
      reward: ['journal:s3-final'],
      rewardText: 'الاختيار الأخير',
      leadsTo: [],
    },
  ],
  decisions: {
    // f4: her answer — the LATEST choice (the first is kept apart by end3:, and never overwritten)
    final: ['yes', 'later'],
  },
  journal: {
    's3-final': {
      title: 'الاختيار الأخير',
      icon: 'heart',
      text: 'تحت الشجر، يم البيت، ريان گال اللي بقلبه بنفسه. والجواب چان إلها. اللي اختارته أول مرة يبقى محفوظ… وتگدر ترجع للحظة إذا تريد.',
      open: 'final-choice',
      openLabel: 'رجعي للاختيار الأخير',
    },
  },
  patches: {
    's3-street': {
      actors: [
        // (Season 3's finale put him here; after ending B he has driven away, until the choice is played again)
        { id: 'ryan', if: ['flag:mission:s3-07', `!${GONE}`] },
      ],
      dynamic: [
        {
          x: STREET.car,
          reach: 900,
          draw(ctx, { game, t }) {
            if (game.flag(F('gone'))) return void (leftAt = null);
            if (game.flag(F('away'))) {
              leftAt ??= t;
              const x = STREET.car + (t - leftAt) * 140;
              zefiro(ctx, x, GROUND + 18, { color: carColor(game), lights: true, running: true, driver: true, dog: true, t });
              return;
            }
            leftAt = null;
            if (!game.flag(F('lights'))) return;
            const blip = game.flag(F('blink')) ? Math.max(0, Math.sin(t * 2.2)) : 0;
            zefiro(ctx, STREET.car, GROUND + 18, { color: carColor(game), lights: true, running: true, blip, driver: false, dog: true, t });
          },
        },
      ],
      triggers: [
        {
          id: 'f4-arrive',
          x1: 0,
          x2: 1640,
          if: [OPEN, `!${ARRIVED}`],
          run: [{ say: 's3.f4-arrive' }, { fx: ARRIVED, quiet: true }],
        },
        // «الاختيار الأخير، مرة ثانية» (from the journal or the street): the moment again, on arrival
        // (repeatable: every replay; it waits for REPLAY, which the moment itself clears)
        { id: 'f4-replay', once: false, x1: 0, x2: 1640, if: [DONE, REPLAY], run: [{ say: 's3.f4-replay' }, ...CHOICE] },
      ],
      interact: [
        {
          id: 'ryan-final',
          actor: 'ryan',
          x: X.ryan,
          w: 50,
          h: 130,
          label: 'ريان',
          icon: '💬',
          if: [ARRIVED, `!${DONE}`],
          cases: [{ run: CHOICE }],
        },
        {
          id: 'again',
          x: X.tree,
          w: 80,
          h: 140,
          label: 'الاختيار الأخير، مرة ثانية',
          icon: '↺',
          if: [DONE, `!${REPLAY}`],
          cases: [{ run: [{ say: 's3.f4-ask-again' }, { if: ASK_AGAIN, then: [{ fx: [`!${ASK_AGAIN}`, REPLAY, `!${AWAY}`, `!${GONE}`], quiet: true }, { fade: 'out' }, { goto: 's3-street', x: X.ryan - 160 }], else: [] }] }],
        },
      ],
    },
  },
  dialogue: {
    's3.f4-arrive': [
      SAYS('(الليل. نفس الشارع. نفس الشجر. وزفيرو واگف، وريان يمه… ساكت، مثل أول ليلة.)'),
      { s: 'anji', e: 'soft', t: 'گلتله أجاوبه الليلة. تحت الشجر.', act: [{ puff: 'anji', type: 'blush', ms: 1600 }] },
    ],
    's3.f4-replay': [SAYS('(نفس الليلة. نفس الشجر. واللحظة ترجع… مثل ما چانت.)')],
    's3.f4-ryan': [
      { s: 'ryan', e: 'turn', t: 'ذيج الليلة، ما لگيت الكلمات. فخليت زفيرو يحچي.' },
      { s: 'ryan', e: 'smile', t: 'الليلة أحچي بنفسي.', act: [{ pose: 'ryan', anim: 'think', for: 1200 }] },
      { s: 'ryan', e: 'smile', t: 'من أول وردة زرگة بالحديقة… لحد هالشارع. ما چان أكو يوم ما فكرت بيچ.' },
      { s: 'ryan', e: 'smile', t: 'أريد مستقبل وياچ. صبح عادي، وسنوكي يخرّب كل شي، وزفيرو يعرف طريقين: طريقي، وطريقچ.' },
      { s: 'ryan', e: 'smile', t: 'وأريد أطلب إيدچ. رسمي. مو بكروب ولا بمقطع… گدام كل اللي يهمنا. إذا إنتِ تريدين. بس إذا إنتِ تريدين.' },
      { if: 'dec3:need=seen', then: [{ s: 'ryan', e: 'turn', t: 'وگلتيلي شوفني، مو كلام الناس. أشوفچ. وهالسؤال إلچ إنتِ، مو إلهم.' }] },
      { if: 'dec3:need=told', then: [{ s: 'ryan', e: 'turn', t: 'وگلتيلي گول لمن تنجرح. فراح أگول هسه: آني خايف. بس الخوف مو سبب أسكت.' }] },
      { if: 'dec3:need=patience', then: [{ s: 'ryan', e: 'turn', t: 'وگلتيلي تحتاجين وقت تختارين بنفسچ. فخذيه. حتى لو الجواب يطلع «لا».' }] },
      { s: 'ryan', e: 'smile', t: 'ومو لازم تجاوبين علمودي. جاوبي علمودچ.' },
    ],
    's3.f4-choice': [
      SAYS('(زفيرو يدوّر بالراحة. نبضة طويلة، ونبضة قصيرة. والشارع كله ينتظر.)'),
      {
        s: 'anji',
        choice: [
          { t: 'إي. أختارك.', do: ['dec3:final=yes'] },
          { t: 'مو هسه.', do: ['dec3:final=later'] },
        ],
      },
    ],
    's3.f4-yes': [
      { s: 'anji', e: 'smile', t: 'إي. أختارك. مو لأن الشارع ساكت، ولا لأن زفيرو يحچي. لأني أريد.', act: [{ puff: 'anji', type: 'blush', ms: 2600 }] },
      SAYS('(ريان يضحك ويمسح عيونه بنفس الوقت. ما يعرف يسوي وحدة بس.)', [{ pose: 'ryan', anim: 'facepalm', for: 1400 }]),
      { s: 'ryan', e: 'smile', t: 'گوليها مرة ثانية. … لا، لا تگوليها. خليني أصدگ الأولى.', act: [{ pose: 'ryan', anim: 'laugh', for: 1200 }] },
      { s: 'anji', e: 'laugh', t: 'لا تبچي، يمعود. سنوكي يباوع من الشباك.' },
    ],
    's3.f4-embrace': [
      SAYS('(حضن هادي، تحت الشجر. وزفيرو يرمش ضواياته مرتين… مثل أول ليلة.)'),
      { if: 'dec3:forgive=time', then: [{ s: 'anji', e: 'soft', t: 'وذاك اليوم بالنادي… خذيت وقتي. وهذا جوابي.' }] },
      { if: 'dec3:club-moment=own', then: [{ s: 'ryan', e: 'smile', t: 'وهالمرة گوليها بصوت عالي إذا تريدين.' }, { s: 'anji', e: 'laugh', t: 'بس مو بالكروب.' }] },
    ],
    's3.f4-marius-yes': [
      { s: 'marius', e: 'surprised', t: 'أختي، العشا —', act: [{ jolt: 'marius', type: 'hop' }] },
      SAYS('(ماريوس يوگف. يباوع عليهم. ويباوع على زفيرو اللي يرمش.)', [{ pose: 'marius', anim: 'think', for: 1400 }]),
      { if: 'dec3:sabri-reply=deny', then: [{ s: 'marius', e: 'laugh', t: '… «مجرد صديق أخوية ماريوس»، ها؟' }] },
      { if: 'dec3:marius-ask=joke', then: [{ s: 'marius', e: 'laugh', t: '«معجب بزفيرو وبس»، ها؟ زفيرو، شكلك ما چنت الوحيد.' }] },
      { if: { not: { any: ['dec3:sabri-reply=deny', 'dec3:marius-ask=joke'] } }, then: [{ s: 'marius', e: 'laugh', t: '… «ولا شي»، ها؟ أي «ولا شي» هذا.' }] },
      { s: 'anji', e: 'pout', t: 'ماريوس!', act: [{ puff: 'anji', type: 'blush', ms: 2000 }] },
      { s: 'marius', e: 'smile', t: 'شنو؟ آني مو أعمى. من أسبوع وآني ساكت.' },
      { s: 'marius', e: 'smile', t: 'ريان. تعال باچر للبيت. رسمي. وجيب وياك جواب لكل سؤال أسأله آني… وآني أسأل هواي.' },
      { s: 'marius', e: 'smile', t: '… وأهلاً بيك. صدگ.', act: [{ pose: 'marius', anim: 'handsup', for: 1000 }] },
      { s: 'ryan', e: 'smile', t: 'باچر. رسمي.' },
    ],
    's3.f4-later': [
      { wait: 1200 },
      { s: 'anji', e: 'soft', t: 'مو هسه، ريان.' },
      SAYS('(سكوت طويل. ريان ما يتحرك.)', [{ pose: 'ryan', anim: 'think', for: 2000 }]),
      { s: 'ryan', e: 'turn', t: '… أفهم.' },
      { s: 'anji', e: 'worried', t: 'مو لأن ما أحبك. لأن ما أريد أختار شي بهالكبر وآني بعدني خايفة. أريد أختار يوم ما أخاف.' },
      { if: 'dec3:need=patience', then: [{ s: 'anji', e: 'soft', t: 'گلتلك أحتاج وقت أختار بيه بنفسي. وهذا هو، الوقت.' }] },
      { s: 'ryan', e: 'smile', t: 'وآني ما أريدچ تختاريني وإنتِ خايفة. هذا مو اختيار.' },
      { s: 'ryan', e: 'smile', t: 'أحترم جوابچ. وما راح أسأل مرة ثانية… إلا إذا إنتِ فتحتي الباب.' },
      { s: 'ryan', e: 'turn', t: 'زفيرو يعرف الطريق لهنا. إذا يوم احتجتي شي… أي شي.' },
      SAYS('(يركب. ما يصفگ الباب. ويمشي على مهله، كأنه يخلي للشارع وقت يتعود.)'),
    ],
    's3.f4-silence': [
      SAYS('(الشارع ساكت. هالمرة السكوت… ثقيل. بس مو فارغ.)', [{ mood: 'anji', expr: 'soft' }]),
      { s: 'anji', e: 'soft', t: '…' },
    ],
    's3.f4-marius-later': [
      SAYS('(باب البيت ينفتح. ماريوس يطلع، يشوف وجهها… وما يسأل.)'),
      SAYS('(يوگف يمها. ويباوع وياها للشارع اللي راح بيه زفيرو.)', [{ face: 'marius', dir: 1 }]),
      { if: 'dec3:marius-ask=ask-back', then: [{ s: 'marius', e: 'smile', t: 'گتلچ عندي عيون. بس مو لازم تحچين.' }], else: [{ s: 'marius', e: 'smile', t: 'مو لازم تحچين.' }] },
      { s: 'marius', e: 'smile', t: 'تعالي. أسويلچ چاي. بشكر، مثل ما تحبينه… مو مثل ما أحبه آني.' },
      { s: 'anji', e: 'soft', t: '… إي.' },
    ],
    's3.f4-ask-again': [
      SAYS('(تحت الشجر. نفس المكان اللي اختارت بيه.)'),
      { if: 'flag:s3:end:first', then: [SAYS('(اللي اختارته أول مرة محفوظ، مهما تختار هسه. الدفتر ما يمسح شي.)')] },
      {
        s: 'anji',
        choice: [
          { t: 'أرجع للحظة الاختيار.', do: [ASK_AGAIN] },
          { t: 'لا. خليها مثل ما هي.', then: [{ s: 'anji', e: 'soft', t: 'خليها.' }] },
        ],
      },
    ],
  },
};
