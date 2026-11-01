/**
 * Season 3 «أصداء الـV8», Mission 02 — «رسالة بثمانية أسطوانات» (s3-02; docs/season-3/SEASON_3_DESIGN.md §5,
 * PUZZLE_SPECIFICATIONS.md P-07). Friday night, her street.
 *
 * She walks home. The street has details — a lamp's timer box, the bakery's hours, a neighbour's camera, a parked
 * car's plate — and nothing tells her which matter (a non-punishing observation pass: each one she notices is a
 * fact; one she skipped can be noticed later, the street stays open). Then Zefiro, under the trees, Ryan inside:
 * ignition, a burbling idle, ONE controlled blip, the engine falls back… and off. The car never moves. Her whisper,
 * and her answer (decision `v8-answer`: a wave, walking over, or a text) — read at once and in the finale.
 * The bakery's shutter rolls down after it (21:45): an anchor in Mission 03's recordings.
 * Fiction written for the game: the street's times and details.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3 } from './constants.js';
import { zefiro, streetLamp, bakery, gate, camera, carColor } from './art.js';

const F = (k) => `s3:02-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-01'; // after Mission 01
const ARRIVED = flag('arrived');
const ON = flag('engine-on');
const BLIP = flag('blip');
const OFF = flag('engine-off');
const ANSWERED = flag('answered');
const SHUT = flag('shutter');
/** The details of the street (evidence ids) — none is required here; Mission 03 reads two of them. */
export const DETAILS = ['e-light-timer', 'e-bakery-hours', 'e-neighbour-cam', 'e-plate'];

export const X = { gate: 200, cam: 420, lamp: 640, bakery: 900, car: 1300 };
const HUSKY = 'flag:sp1-husky-met';

const S3_STREET = {
  id: 's3-street',
  title: 'شارع أنجي',
  theme: 'street-night',
  music: 'calm',
  width: 1640,
  spawn: 120,
  seed: 3201,
  actors: [{ id: 'husky', kind: 'husky', x: 170, facing: 1, mood: 'sit', if: HUSKY }],
  dynamic: [
    { x: X.gate, reach: 50, draw: (ctx) => gate(ctx, X.gate) },
    { x: X.cam, reach: 50, draw: (ctx, { t }) => (gate(ctx, X.cam), camera(ctx, X.cam, { t })) },
    { x: X.lamp, reach: 160, draw: (ctx, { game, t }) => streetLamp(ctx, X.lamp, { t, night: game.flag(F('relay')) }) },
    { x: X.bakery, reach: 90, draw: (ctx, { game }) => bakery(ctx, X.bakery, { shut: game.flag(F('shutter')) }) },
    {
      x: X.car,
      reach: 130,
      draw(ctx, { game, t }) {
        const running = game.flag(F('engine-on')) && !game.flag(F('engine-off'));
        const blip = running && game.flag(F('blip')) ? Math.max(0, Math.sin(t * 2.2)) : 0;
        zefiro(ctx, X.car, GROUND + 18, { color: carColor(game), lights: running, running, blip, driver: true, dog: true, t });
      },
    },
  ],
  triggers: [
    {
      id: 'arrive',
      x1: 60,
      x2: 400,
      if: [OPEN, `!${ARRIVED}`],
      run: [{ say: 's3.02-arrive' }, { fx: ARRIVED, quiet: true }],
    },
    {
      // under the trees: the message in eight cylinders (seen once)
      id: 'v8',
      x1: X.car - 260,
      x2: X.car - 120,
      if: [ARRIVED, `!${OFF}`],
      run: [
        { letterbox: true },
        { camera: X.car - 40, ms: 900 },
        { wait: 500 },
        { sfx: 'v8-start' },
        { fx: ON, quiet: true },
        { wait: 1400 },
        { if: HUSKY, then: [{ all: [{ jolt: 'husky', type: 'hop' }, { bubble: 'husky', text: '!', ms: 900 }] }] },
        { sfx: 'v8-idle' },
        { wait: 1600 },
        // one controlled blip — then it falls back to idle
        { all: [{ sfx: 'v8-blip' }, { fx: BLIP, quiet: true }, { shake: 2, ms: 300 }] },
        { wait: 1700 },
        { sfx: 'v8-off' },
        { fx: OFF, quiet: true },
        { wait: 1200 },
        { camera: null, ms: 500 },
        { letterbox: false },
        { say: 's3.02-whisper' },
        { fx: 'ev3:e-blip' },
        { say: 's3.02-answer' },
        { fx: ANSWERED, quiet: true },
        // 21:45: the bakery closes, as every night
        { all: [{ sfx: 'shutter' }, { fx: SHUT, quiet: true }] },
        { say: 's3.02-shutter' },
      ],
    },
  ],
  interact: [
    {
      id: 'lamp',
      x: X.lamp,
      w: 60,
      h: 120,
      label: 'عمود الإنارة',
      icon: '💡',
      cases: [
        { if: '!ev3:e-light-timer', run: [{ say: 's3.02-lamp' }, { fx: 'ev3:e-light-timer' }] },
        { run: [{ say: 's3.02-lamp-again' }] },
      ],
    },
    {
      id: 'bakery',
      x: X.bakery,
      w: 130,
      h: 110,
      label: 'المخبز',
      icon: '🥖',
      cases: [
        { if: '!ev3:e-bakery-hours', run: [{ say: 's3.02-bakery' }, { fx: 'ev3:e-bakery-hours' }] },
        { run: [{ say: 's3.02-bakery-again' }] },
      ],
    },
    {
      id: 'camera',
      x: X.cam,
      w: 60,
      h: 100,
      label: 'كاميرا الجيران',
      icon: '📷',
      cases: [
        { if: '!ev3:e-neighbour-cam', run: [{ say: 's3.02-camera' }, { fx: 'ev3:e-neighbour-cam' }] },
        { run: [{ say: 's3.02-camera-again' }] },
      ],
    },
    {
      id: 'plate',
      x: X.car - 90,
      w: 60,
      h: 60,
      label: 'لوحة السيارة',
      icon: '🚗',
      cases: [
        { if: '!ev3:e-plate', run: [{ say: 's3.02-plate' }, { fx: 'ev3:e-plate' }] },
        { run: [{ say: 's3.02-plate-again' }] },
      ],
    },
    {
      id: 'car',
      x: X.car + 20,
      w: 120,
      h: 70,
      label: 'زفيرو',
      icon: '💬',
      if: OFF,
      cases: [{ run: [{ say: 's3.02-car-after' }] }],
    },
    {
      id: 'home',
      x: X.gate,
      w: 60,
      h: 90,
      label: 'باب البيت',
      icon: '🏠',
      cases: [
        { if: ANSWERED, run: [{ say: 's3.02-home' }] },
        { run: [{ say: 's3.02-home-early' }] },
      ],
    },
  ],
  exits: [],
  ambient: [{ t: 'ريحة خبز طالع من الفرن، وهوا بارد، وشارع ساكت إلا من شي واحد.' }],
};

export default {
  id: 'm02',
  missions: [
    {
      id: 's3-02',
      kind: 'story',
      pack: PACK_S3,
      act: 1,
      day: 2,
      world: ['s3-street'],
      title: 'رسالة بثمانية أسطوانات',
      where: 'شارع أنجي، بالليل',
      summary: 'الجمعة بالليل. الشارع ساكت… إلا من شي واحد.',
      unlock: OPEN,
      locked: 'تنفتح بعد «صبري ولسانه الطويل».',
      steps: [
        { done: ARRIVED, world: 's3-street', text: 'ارجعي للبيت. الشارع بالليل يحچي، إذا تسمعين.' },
        { done: ANSWERED, world: 's3-street', text: 'تحت الشجر، شي ينتظر.' },
      ],
      reward: ['journal:s3-v8'],
      rewardText: 'رسالة بلا كلام',
      leadsTo: ['s3-03'],
    },
  ],
  evidence: {
    'e-light-timer': { rel: 'fact', source: 'street', icon: 'note', label: 'صندوق مؤقّت الإنارة', note: 'ورقة على العمود: «الإنارة تتحول للوضع الليلي ١١:٠٠». كل ليلة، تكّة وحدة، والضوا يخف.' },
    'e-bakery-hours': { rel: 'fact', source: 'street', icon: 'note', label: 'دوام المخبز', note: 'على باب المخبز: «نسد ٩:٤٥ بالليل». والسكّة تنزل بصوت تسمعه الحارة كلها.' },
    'e-neighbour-cam': { rel: 'fact', source: 'street', icon: 'mark', label: 'كاميرا الجيران', note: 'كاميرا فوق باب الجيران، ضوها يرمش. تسجل الشارع… والصوت.' },
    'e-plate': { rel: 'fact', source: 'street', icon: 'car', label: 'لوحة زفيرو', note: 'لوحة زفيرو تنتهي بـ«١٩».' },
    'e-blip': { rel: 'fact', source: 'anji', icon: 'heart', label: 'الصوت اللي سمعته', note: 'الجمعة ٩:٤٠ بالليل: زفيرو اشتغل، نفخة وحدة… وانطفى. ما تحرك من مكانه.' },
  },
  decisions: {
    // 02: her answer to the blip — read at once (Ryan's reply), and in the finale (DECISION_FLOW.md)
    'v8-answer': ['wave', 'walk', 'text'],
  },
  case: [{ mission: 's3-02', ids: [...DETAILS, 'e-blip'] }],
  journal: {
    's3-v8': { title: 'رسالة بلا كلام', icon: 'car', text: 'ريان ما لگى الكلمات. فخلّى زفيرو يحچي: نفخة وحدة، وبعدين سكت المحرك. وأنجي فهمت.' },
  },
  scenes: [S3_STREET],
  dialogue: {
    's3.02-arrive': [
      { s: 'narrator', t: '(الجمعة، ٩:٣٠ بالليل. أنجي راجعة للبيت. الشارع ساكت، والمخبز بعده فاتح.)' },
      { if: HUSKY, then: [{ s: 'narrator', t: '({husky} تمشي جنبها… وفجأة توگف، وأذانها لگدام، صوب الشجر.)' }] },
      { s: 'anji', e: 'curious', t: 'شبيچ؟ … ماكو شي. يلا.' },
    ],
    's3.02-lamp': [
      { s: 'anji', e: 'thinking', t: 'صندوق صغير على العمود، ضوه أخضر يرمش.' },
      { s: 'narrator', t: '(ورقة ملصوگة: «الإنارة تتحول للوضع الليلي ١١:٠٠».)' },
      { s: 'anji', e: 'smile', t: 'يعني كل ليلة بالحادية عشر… تكّة، والشارع يعتم شوية. حلو.' },
    ],
    's3.02-lamp-again': [{ s: 'anji', e: 'thinking', t: 'الصندوق يرمش. ينتظر الحادية عشر.' }],
    's3.02-bakery': [
      { s: 'anji', e: 'smile', t: 'مخبز الحارة. ريحته تخلي الواحد يرجع عشر سنين.' },
      { s: 'narrator', t: '(على الباب: «نسد ٩:٤٥ بالليل».)' },
      { s: 'anji', e: 'thinking', t: 'وكل ليلة نفس السالفة: السكّة تنزل، والحارة كلها تعرف الساعة.' },
    ],
    's3.02-bakery-again': [{ s: 'anji', e: 'smile', t: 'خبز حار. لا… ركّزي.' }],
    's3.02-camera': [
      { s: 'anji', e: 'thinking', t: 'كاميرا الجيران. ضوها الأحمر يرمش.' },
      { s: 'anji', e: 'smirk', t: 'تسجل الشارع كله… حتى الصوت. الله يساعد اللي يعطس هنا.' },
    ],
    's3.02-camera-again': [{ s: 'anji', e: 'thinking', t: 'الضو الأحمر. تسجل.' }],
    's3.02-plate': [
      { s: 'anji', e: 'surprised', t: 'هاي… لوحة زفيرو. تنتهي بـ«١٩».' },
      { s: 'anji', e: 'shy', t: 'يعني… هو هنا.', act: [{ puff: 'anji', type: 'shy', ms: 1600 }] },
    ],
    's3.02-plate-again': [{ s: 'anji', e: 'smile', t: '«١٩». أعرفها من بعيد.' }],
    's3.02-whisper': [
      { s: 'narrator', t: '(السكوت يرجع للشارع، شوية شوية.)' },
      { s: 'anji', e: 'shy', t: 'مجنون… حتى السيارة يحچي بيها وياي.', act: [{ puff: 'anji', type: 'shy', ms: 2200 }] },
    ],
    's3.02-answer': [
      // the moment before she answers: cheeks warm, eyes away (as with Sabri's question, Mission 01)
      { s: 'anji', e: 'shy', t: '…', act: [{ puff: 'anji', type: 'blush', ms: 2600 }, { face: 'anji', dir: -1 }] },
      {
        s: 'anji',
        choice: [
          {
            t: '(تأشر له من الباب.)',
            do: ['dec3:v8-answer=wave'],
            then: [
              { s: 'narrator', t: '(ضوايات زفيرو ترمش مرة وحدة. بس مرة.)' },
              { s: 'anji', e: 'smile', t: 'حتى الضوايات صارت تحچي. زين.' },
            ],
          },
          {
            t: '(تمشي له.)',
            do: ['dec3:v8-answer=walk'],
            then: [
              { s: 'narrator', t: '(الشباك ينزل. سنوكي يطلع راسه أول.)' },
              { s: 'ryan', e: 'smile', t: 'ما گدرت أگول شي. فخليته هو يگول.' },
              { s: 'anji', e: 'shy', t: 'وأنا فهمت. … تصبح على خير، ريان.', act: [{ puff: 'anji', type: 'shy', ms: 1800 }] },
            ],
          },
          {
            t: '(ترسله رسالة.)',
            do: ['dec3:v8-answer=text'],
            then: [
              { s: 'narrator', t: '(«وصلت الرسالة. كلها ثمانية أسطوانات.»)' },
              { s: 'narrator', t: '(الجواب يجي بعد ثانية: «😶‍🌫️ … تصبحين على خير».)' },
              { s: 'anji', e: 'laugh', t: 'حتى بالرسائل ما يعرف يحچي. أحسن.' },
            ],
          },
        ],
      },
    ],
    's3.02-shutter': [
      { s: 'narrator', t: '(وراها، سكّة المخبز تنزل. ٩:٤٥، مثل كل ليلة.)' },
      { if: HUSKY, then: [{ s: 'narrator', t: '({husky} تقعد، وتهز ذيلها مرة. خلصت الحفلة.)' }] },
    ],
    's3.02-car-after': [{ s: 'anji', e: 'smile', t: 'المحرك بارد. بس اللي گاله بعده دافي.' }],
    's3.02-home-early': [{ s: 'anji', e: 'thinking', t: 'بعد شوية. الشارع بعده… يحچي.' }],
    's3.02-home': [{ s: 'anji', e: 'smile', t: 'ليلة هادئة. أخيراً.' }],
  },
};
