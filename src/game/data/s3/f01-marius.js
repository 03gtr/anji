/**
 * The final story, Chapter 01 — «ماريوس مو أعمى» (s3-f1; docs/final/FINAL_STORY.md). Her room, the day after the
 * street. Marius — her older brother, Ryan's friend — has noticed how close Ryan is to her, and asks, plainly. She is
 * embarrassed and answers her own way (decision `marius-ask`); he reads more in her face than in her words, and
 * decides, quietly, not to push. Then her phone: Ryan has news, and wants her to be the first to know.
 * Marius finds out gradually across the four chapters; he is never hostile or controlling. Fiction written for the game.
 */
import { PACK_S3 } from './constants.js';

const F = (k) => `s3:f1-${k}`;
const flag = (k) => `flag:${F(k)}`;
export const F1_OPEN = 'flag:mission:s3-08';
const MET = flag('met');
const ASKED = flag('asked');
const DONE = flag('done');
const HERE = [F1_OPEN, `!${DONE}`];
const X = { door: 80, desk: 620, window: 860 };

export default {
  id: 'f01',
  missions: [
    {
      id: 's3-f1',
      kind: 'story',
      pack: PACK_S3,
      arc: 'final',
      act: 4,
      day: 9,
      world: ['s3-home'],
      title: 'ماريوس مو أعمى',
      where: 'غرفة أنجي',
      summary: 'ماريوس صارله يومين يباوع… ويسكت. اليوم ما سكت.',
      unlock: F1_OPEN,
      locked: 'تنفتح بعد «لمن يحچي السكوت».',
      steps: [
        { done: MET, world: 's3-home', text: 'ارجعي لغرفتچ. ماريوس هناك… من الصبح.' },
        { done: ASKED, world: 's3-home', text: 'ماريوس عنده سؤال. وواضح ما راح يروح بدونه.' },
        { done: DONE, world: 's3-home', text: 'تلفونچ يرن. منو؟' },
      ],
      reward: ['journal:s3-f1'],
      rewardText: 'سؤال ماريوس',
      leadsTo: ['s3-f2'],
    },
  ],
  decisions: {
    // f1: how she answers her brother — read in f2 (what Ryan heard), f3 (what she owns) and the endings (Marius)
    'marius-ask': ['deny', 'joke', 'ask-back'],
  },
  journal: {
    's3-f1': { title: 'ماريوس مو أعمى', icon: 'mark', text: 'ماريوس سأل: «معجب بيچ لو شنو؟» … وسكت بعدها. ماريوس ما يسكت إلا إذا عرف شي.' },
  },
  patches: {
    's3-home': {
      // Marius is in her room for this chapter (not only once Mission 03 has opened it)
      actors: [{ id: 'marius', if: { any: ['flag:s3:03-opened', F1_OPEN] } }],
      triggers: [
        {
          id: 'f1-open',
          x1: 100,
          x2: 700,
          if: [...HERE, `!${MET}`],
          run: [
            { letterbox: true },
            { camera: X.window - 60, ms: 900 },
            { all: [{ face: 'marius', dir: -1 }, { pose: 'marius', anim: 'cross', for: 1600 }] },
            { wait: 600 },
            { camera: null, ms: 400 },
            { letterbox: false },
            { say: 's3.f1-open' },
            { fx: MET, quiet: true },
          ],
        },
      ],
      interact: [
        {
          id: 'marius',
          cases: [
            { if: [...HERE, MET, `!${ASKED}`], run: [{ say: 's3.f1-ask' }, { wait: 500 }, { say: 's3.f1-thinks' }, { fx: ASKED }, { all: [{ bubble: 'anji', text: '📱', ms: 1600 }, { sfx: 'tap' }] }] },
            { if: [...HERE, ASKED], run: [{ say: 's3.f1-marius-after' }] },
          ],
        },
        {
          id: 'phone',
          cases: [{ if: [...HERE, ASKED], run: [{ sfx: 'page' }, { say: 's3.f1-phone' }, { fx: DONE }] }],
        },
      ],
    },
  },
  dialogue: {
    's3.f1-open': [
      { s: 'narrator', t: '(ماريوس واگف يم الشباك. ما يسوي شي. بس يباوع… عليها.)' },
      { s: 'marius', e: 'thinking', t: 'أنجي. تعالي لحظة.' },
    ],
    's3.f1-ask': [
      { s: 'marius', e: 'thinking', t: 'ملاحظ ريان كلش مقرّب منچ بالفترة الأخيرة… معجب بيچ لو شنو؟', act: [{ pose: 'marius', anim: 'cross', for: 1400 }] },
      { s: 'anji', e: 'surprised', t: '…', act: [{ puff: 'anji', type: 'blush', ms: 2600 }, { jolt: 'anji', type: 'hop' }] },
      {
        s: 'anji',
        choice: [
          {
            t: 'لا! شنو هالحچي؟ ريان صديقك، مو صديقي.',
            do: ['dec3:marius-ask=deny'],
            then: [
              { s: 'anji', e: 'pout', t: 'و… شفت المقطع الجديد بالكروب؟ واحد يگلّد صبري. يموّت.', act: [{ face: 'anji', dir: -1 }] },
              { s: 'marius', e: 'smile', t: 'المقطع. إي. أكيد. نحچي عن المقطع.' },
            ],
          },
          {
            t: 'معجب؟ ريان معجب بزفيرو. وبس.',
            do: ['dec3:marius-ask=joke'],
            then: [
              { s: 'anji', e: 'laugh', t: 'روح شوف الطبخة، يمعود. صارلها ساعة تفور.', act: [{ pose: 'anji', anim: 'shrug', for: 800 }] },
              { s: 'marius', e: 'laugh', t: 'ما تفور. بس حلوة المحاولة.' },
            ],
          },
          {
            t: '… ليش تسأل؟ أحد گلك شي؟',
            do: ['dec3:marius-ask=ask-back'],
            then: [
              { s: 'marius', e: 'smile', t: 'لا. محد گال. بس عندي عيون.' },
              { s: 'anji', e: 'pout', t: 'عيونك خليها على الطبخة اللي على النار.', act: [{ puff: 'anji', type: 'blush', ms: 1600 }] },
            ],
          },
        ],
      },
    ],
    's3.f1-thinks': [
      { s: 'narrator', t: '(ماريوس يباوع على خدودها. على إيدها اللي ما تعرف وين تحطها. ويبتسم بنص حلگه.)', act: [{ pose: 'marius', anim: 'think', for: 1800 }] },
      { s: 'narrator', t: '(ماريوس، بينه وبين نفسه: «إي… واضح أكو شي، بس خليني ساكت. مو كلشي لازم أسأل عنه.»)' },
      { s: 'marius', e: 'smile', t: 'زين زين. ولا شي. آني ما سألت.' },
    ],
    's3.f1-marius-after': [{ s: 'marius', e: 'smile', t: 'آني ما سألت. وإنتِ ما جاوبتي. اتفقنا.' }],
    's3.f1-phone': [
      { s: 'narrator', t: '(رسالة من ريان: «نجحت. اختبار السياقة. أريد أول وحدة تعرف… تكونين إنتِ.»)' },
      { s: 'narrator', t: '(وبعدها بثانية: «تعالي للنادي باچر؟ عندي شي أريد أوريچ ياه.»)' },
      { s: 'anji', e: 'shy', t: 'نجح…', act: [{ puff: 'anji', type: 'blush', ms: 2000 }] },
      { s: 'anji', e: 'smile', t: '(تكتب، وتمسح، وتكتب مرة ثانية) «مبروك 💙 أجي.»' },
    ],
  },
};
