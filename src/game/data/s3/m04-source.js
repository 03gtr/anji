/**
 * Season 3 «أصداء الـV8», Mission 04 — «الشخص ورا القصة» (s3-04; SEASON_3_DESIGN.md §5, P-03, P-04).
 * The car club, Sunday. She traces the clip back through its forwards (who sent it to whom, and which one was never
 * forwarded at all), reads the municipal noise notice (a plate ending «٤٧» — and no colour: Zefiro's colour is the
 * player's own choice, so a colour clue would be unfair to some saves), and hears Jalal's account: home by 22:30. A
 * petrol-station receipt in the club's bin, 23:20 two streets from her house, says otherwise. Then the versions of
 * her own Mission 01 sentence (which version depends on `sabri-reply`): she finds the one link where the meaning
 * changed. Lama, on the phone (decision `lama-secret`), challenges her first theory either way.
 * Jalal is fiction. He is not drawn as a villain: what he did, and why, is reached only through the evidence.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3 } from './constants.js';

const F = (k) => `s3:04-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-03';
const OPENED = flag('opened');
const CHAIN = flag('chain'); // the forward chain proven
const WORDS = flag('words'); // the changed link found
const LAMA = flag('lama'); // Lama's call
export const CLUES = ['e-forward-chain', 'e-noise-notice', 'e-receipt', 't-jalal'];
const HAS = (ids) => ids.map((e) => `ev3:${e}`);
const X = { door: 90, ryan: 260, board: 470, bin: 640, sabri: 820, jalalCar: 1080, jalal: 1200 };
const REPLY = (v) => `dec3:sabri-reply=${v}`;

function clubBoard(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#3a2f2a';
  ctx.fillRect(x - 50, GROUND - 150, 100, 70);
  ctx.fillStyle = '#efe6d2';
  ctx.fillRect(x - 42, GROUND - 142, 40, 30);
  ctx.fillStyle = '#f6efe0';
  ctx.fillRect(x + 4, GROUND - 140, 38, 46);
  ctx.fillStyle = '#c9a64a';
  ctx.fillRect(x + 18, GROUND - 144, 8, 6);
  ctx.restore();
}
function bin(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#4a5468';
  ctx.fillRect(x - 16, GROUND - 40, 32, 40);
  ctx.fillStyle = '#5a6478';
  ctx.fillRect(x - 19, GROUND - 44, 38, 6);
  ctx.fillStyle = '#f6efe0';
  ctx.fillRect(x - 4, GROUND - 50, 10, 7);
  ctx.restore();
}

const S3_GARAGE = {
  id: 's3-garage',
  title: 'نادي السيارات',
  theme: 'garage',
  music: 'calm',
  width: 1400,
  spawn: 140,
  seed: 3401,
  props: [{ type: 'car', x: X.jalalCar, color: '#8a8f9c' }],
  actors: [
    { id: 'ryan', kind: 'ryan', x: X.ryan, facing: 1 },
    { id: 'sabri', kind: 'sabri', x: X.sabri, facing: -1 },
    { id: 'jalal', kind: 'jalal', x: X.jalal, facing: -1 },
  ],
  dynamic: [
    { x: X.board, reach: 60, draw: (ctx) => clubBoard(ctx, X.board) },
    { x: X.bin, reach: 30, draw: (ctx) => bin(ctx, X.bin) },
  ],
  triggers: [
    {
      id: 'open',
      x1: 100,
      x2: 420,
      if: [OPEN, `!${OPENED}`],
      run: [
        { letterbox: true },
        { camera: 700, ms: 900 },
        { all: [{ pose: 'jalal', anim: 'shrug', for: 900 }, { bubble: 'jalal', text: 'ههه… مقطع وانتشر، شنسوي.', ms: 1800 }] },
        { all: [{ pose: 'sabri', anim: 'facepalm', for: 1200 }, { bubble: 'sabri', text: '🤐', ms: 1400 }] },
        { camera: null, ms: 400 },
        { letterbox: false },
        { say: 's3.04-open' },
        { fx: OPENED, quiet: true },
      ],
    },
  ],
  interact: [
    {
      id: 'ryan',
      actor: 'ryan',
      x: X.ryan,
      w: 50,
      h: 130,
      label: 'ريان',
      icon: '💬',
      cases: [
        { if: WORDS, run: [{ say: 's3.04-ryan-after' }] },
        { run: [{ say: 's3.04-ryan' }] },
      ],
    },
    {
      id: 'sabri',
      actor: 'sabri',
      x: X.sabri,
      w: 50,
      h: 120,
      label: 'صبري',
      icon: '💬',
      if: OPENED,
      cases: [
        { if: '!ev3:e-forward-chain', run: [{ say: 's3.04-sabri' }, { fx: 'ev3:e-forward-chain' }] },
        // her words, as they reached him and went on: the versions (the puzzle)
        { if: [CHAIN, `!${WORDS}`, REPLY('deny')], run: [{ say: 's3.04-words-intro' }, { puzzle: 's3-whisper-deny', then: [{ say: 's3.04-words-solved' }, { fx: ['ev3:d-twisted', WORDS] }], else: [{ say: 's3.04-later' }] }] },
        { if: [CHAIN, `!${WORDS}`, REPLY('laugh')], run: [{ say: 's3.04-words-intro' }, { puzzle: 's3-whisper-laugh', then: [{ say: 's3.04-words-solved' }, { fx: ['ev3:d-twisted', WORDS] }], else: [{ say: 's3.04-later' }] }] },
        { if: [CHAIN, `!${WORDS}`, REPLY('confront')], run: [{ say: 's3.04-words-intro' }, { puzzle: 's3-whisper-confront', then: [{ say: 's3.04-words-solved' }, { fx: ['ev3:d-twisted', WORDS] }], else: [{ say: 's3.04-later' }] }] },
        { if: WORDS, run: [{ say: 's3.04-sabri-after' }] },
        { run: [{ say: 's3.04-sabri-waits' }] },
      ],
    },
    {
      id: 'jalal',
      actor: 'jalal',
      x: X.jalal,
      w: 50,
      h: 124,
      label: 'جلال',
      icon: '💬',
      if: OPENED,
      cases: [
        { if: '!ev3:t-jalal', run: [{ say: 's3.04-jalal' }, { fx: 'ev3:t-jalal' }] },
        { if: 'ev3:e-receipt', run: [{ say: 's3.04-jalal-receipt' }] },
        { run: [{ say: 's3.04-jalal-again' }] },
      ],
    },
    {
      id: 'board',
      x: X.board,
      w: 100,
      h: 80,
      label: 'لوحة النادي',
      icon: '📌',
      cases: [
        { if: '!ev3:e-noise-notice', run: [{ sfx: 'paper' }, { say: 's3.04-notice' }, { fx: 'ev3:e-noise-notice' }] },
        { run: [{ say: 's3.04-notice-again' }] },
      ],
    },
    {
      id: 'bin',
      x: X.bin,
      w: 50,
      h: 60,
      label: 'سلة النادي',
      icon: '🗑️',
      if: 'ev3:t-jalal',
      cases: [
        { if: '!ev3:e-receipt', run: [{ pose: 'anji', anim: 'think', for: 500 }, { sfx: 'paper' }, { say: 's3.04-receipt' }, { fx: 'ev3:e-receipt' }] },
        { run: [{ say: 's3.04-bin-again' }] },
      ],
    },
    {
      id: 'phone',
      x: X.door + 40,
      w: 60,
      h: 80,
      label: 'تلفونها',
      icon: '📱',
      if: OPENED,
      cases: [
        { if: CHAIN, run: [{ say: 's3.04-chain-done' }] },
        { if: { not: HAS(CLUES) }, run: [{ say: 's3.04-chain-wait' }] },
        {
          run: [
            { puzzle: 's3-forward', then: [{ say: 's3.04-chain-solved' }, { fx: ['ev3:d-source', CHAIN] }, { if: `!${LAMA}`, then: [{ say: 's3.04-lama' }, { fx: LAMA, quiet: true }] }], else: [{ say: 's3.04-later' }] },
          ],
        },
      ],
    },
  ],
  exits: [],
  ambient: [{ t: 'ريحة زيت وبنزين، وراديو قديم يغني وحده.' }],
};

/* ── «سلسلة الإعادة» (P-04): who sent it to whom, and which message was never a forward ── */
const opt = (id, label) => ({ id, label });
/** (exported for the tests) */
export const FORWARD = {
  type: 'logicgrid',
  title: 'سلسلة الإعادة',
  goal: 'ثلاث رسائل بيها نفس المقطع. منو دز، لمن، وشنو مكتوب فوق كل وحدة؟',
  intro: 'تلفون صبري، والكروب، وتلفونها. كل واحد يشهد على رسالة.',
  config: {
    rows: [
      { id: 'f1', label: '١٢:٠٢ بالليل', icon: 'moon-full' },
      { id: 'f2', label: '٨:١٥ الصبح', icon: 'sun' },
      { id: 'f3', label: '٩:٤٠ الصبح', icon: 'sun' },
    ],
    cols: [
      { id: 'who', label: 'منو دز', options: [opt('jalal', 'جلال'), opt('sabri', 'صبري'), opt('member', 'رقم من الكروب')] },
      { id: 'to', label: 'لمن', options: [opt('sabri', 'صبري'), opt('group', 'كروب الكراج'), opt('anji', 'أنجي')] },
      { id: 'mark', label: 'شنو مكتوب فوقه', options: [opt('none', 'ولا شي'), opt('fwd', '«مُعاد توجيهه»'), opt('many', '«مُعاد توجيهه كثيراً»')] },
    ],
    clues: [
      { text: 'كل رسالة راحت لمكان غير.', rule: { distinct: 'to' } },
      { text: 'تلفون صبري: المقطع وصله الساعة ١٢:٠٢ بالليل.', rule: { is: ['f1', 'to', 'sabri'] } },
      { text: 'كروب الكراج: المقطع نزل بيه ٨:١٥ الصبح.', rule: { is: ['f2', 'to', 'group'] } },
      { text: 'اللي وصل صبري، وصله من رقم جلال.', rule: { pair: ['who', 'jalal', 'to', 'sabri'] } },
      { text: 'بالكروب: المقطع نازل من رقم صبري.', rule: { pair: ['who', 'sabri', 'to', 'group'] } },
      { text: 'اللي وصل أنجي مكتوب فوقه: «مُعاد توجيهه كثيراً».', rule: { pair: ['to', 'anji', 'mark', 'many'] } },
      { text: 'اللي دزه صبري مكتوب فوقه: «مُعاد توجيهه».', rule: { pair: ['who', 'sabri', 'mark', 'fwd'] } },
    ],
  },
  wrong: [],
  success: 'رسالة جلال لصبري ما مكتوب فوقها شي. يعني ما وصلته من أحد… هو أول واحد دزّها.',
  reward: [],
};

/* ── «الصدى المحرّف» (P-03): her own sentence, five times retold; one link changed the meaning ── */
const LINKS = [
  { id: 'k1', label: 'من أنجي → لصبري' },
  { id: 'k2', label: 'من صبري → للكروب' },
  { id: 'k3', label: 'من الكروب → لجلال' },
  { id: 'k4', label: 'من جلال → لريان' },
  { id: 'k5', label: 'من جلال → لتعليقه بالكروب' },
];
/** The one link where the meaning changed (the others change only the form). */
export const CHANGED_LINK = 'k3';
const whisper = (versions, words) => ({
  type: 'sort',
  title: 'الصدى المحرّف',
  goal: 'نفس الجملة، خمس مرات. وين تغيّر معناها، وأي كلمة؟',
  intro: `القاعدة: تغيير ما يبدّل المعنى… مو تغيير. ${versions}`,
  config: {
    stages: [
      {
        kind: 'sort',
        prompt: 'كل حلقة: الكلام بقى بنفس معناه، لو تغيّر؟',
        bins: [
          { id: 'same', label: 'نفس المعنى، بكلمات ثانية', icon: 'note' },
          { id: 'changed', label: 'تغيّر المعنى', icon: 'mark' },
        ],
        cards: LINKS.map((k) => ({ ...k, accepts: [k.id === CHANGED_LINK ? 'changed' : 'same'] })),
      },
      { kind: 'pick', prompt: 'وشنو اللي تبدّل بيها؟ علّمي كل اللي يصح — وبس اللي يصح.', options: words.options, answers: [words.answer] },
    ],
    labels: { check: 'هنا انگلبت ✔' },
  },
  success: 'لحد الكروب، نفس الكلام بكلمات ثانية. وبعدين وصل جلال… وصار شي ثاني.',
  reward: [],
});
/** (exported for the tests: each reply's chain of versions, and the one changed word) */
export const VERSIONS = {
  deny: ['«ريان مجرد صديق أخوية ماريوس»', '«أنجي تگول ريان مجرد صديق أخوها»', '«أنجي گالت ريان بس صديق أخوها»', '«أنجي تگول ريان ما يعني لها شي»', '«تگول إنت ما تعني لها شي»', '«أنجي ما يهمها ريان»'],
  laugh: ['«صبري… إنت لازم تشتغل محقق»', '«أنجي ضحكت لمن سألتها عن ريان»', '«أنجي ضحكت من سألوها على ريان»', '«أنجي تضحك على ريان»', '«تضحك عليك»', '«أنجي تتمسخر على ريان»'],
  confront: ['«منو گلك تعد زيارات الناس؟»', '«أنجي زعلت لمن سألتها عن ريان»', '«أنجي انزعجت من سألوها عن ريان»', '«أنجي ما تريد تسمع اسم ريان»', '«ما تريد تسمع اسمك»', '«أنجي ما تطيق ريان»'],
};
const chain = (v) => v.map((s, i) => `${['أنجي', 'صبري', 'الكروب', 'جلال', 'جلال لريان', 'تعليق جلال بالكروب'][i]}: ${s}`).join(' ← ');
const WHISPER = {
  's3-whisper-deny': whisper(chain(VERSIONS.deny), {
    options: [opt('w1', '«مجرد صديق» صارت «بس صديق»'), opt('w2', '«مجرد صديق» صارت «ما يعني لها شي»'), opt('w3', '«أخوية ماريوس» صارت «أخوها»'), opt('w4', '«تگول» صارت «گالت»')],
    answer: 'w2',
  }),
  's3-whisper-laugh': whisper(chain(VERSIONS.laugh), {
    options: [opt('w1', '«ضحكت لمن سألتها» صارت «ضحكت من سألوها»'), opt('w2', '«ضحكت» صارت «تضحك على ريان»'), opt('w3', '«محقق» صارت «سألتها عن ريان»'), opt('w4', '«سألتها» صارت «سألوها»')],
    answer: 'w2',
  }),
  's3-whisper-confront': whisper(chain(VERSIONS.confront), {
    options: [opt('w1', '«زعلت» صارت «انزعجت»'), opt('w2', '«زعلت لمن سألتها» صارت «ما تريد تسمع اسمه»'), opt('w3', '«سألتها» صارت «سألوها»'), opt('w4', '«زيارات الناس» صارت «سألتها عن ريان»')],
    answer: 'w2',
  }),
};

export default {
  id: 'm04',
  missions: [
    {
      id: 's3-04',
      kind: 'story',
      pack: PACK_S3,
      act: 2,
      day: 4,
      world: ['s3-garage'],
      title: 'الشخص ورا القصة',
      where: 'نادي السيارات',
      summary: 'المقطع إجا من مكان. والكلام اللي تحته… من شخص.',
      unlock: OPEN,
      locked: 'تنفتح بعد «لا تصدّقين كلشي ينقال».',
      steps: [
        { done: OPENED, world: 's3-garage', text: 'روحي للنادي. المقطع بدا من هناك.' },
        { done: HAS(CLUES), world: 's3-garage', text: 'كل واحد بالنادي عنده جزء. والورق هم يحچي.' },
        { done: CHAIN, world: 's3-garage', text: 'رتّبي الرسائل: منو دز، لمن، ومنو أول واحد.' },
        { done: WORDS, world: 's3-garage', text: 'جملتچ لفّت على الناس. لگي وين انگلبت.' },
      ],
      reward: ['journal:s3-source'],
      rewardText: 'جملة وحدة، خمس نسخ',
      leadsTo: ['s3-05'],
    },
  ],
  evidence: {
    'e-forward-chain': { rel: 'fact', source: 'phones', icon: 'note', label: 'رسائل المقطع', note: 'تلفون صبري، والكروب، وتلفونها: ثلاث رسائل بيها نفس المقطع، وكل وحدة بساعتها.' },
    'e-noise-notice': { rel: 'fact', source: 'municipality', icon: 'note', label: 'إنذار البلدية', note: 'إنذار ضوضاء: «سيارة لوحتها تنتهي بـ٤٧، شارع الورد، الجمعة ١١:١٠م». ما مكتوب لون.' },
    'e-receipt': { rel: 'fact', source: 'petrol-station', icon: 'note', label: 'وصل البانزينخانة', note: 'وصل من السلة: البانزينخانة اللي بعد شارعين من بيت أنجي، الجمعة ١١:٢٠م. «بطاقة النادي — جلال».' },
    't-jalal': { rel: 'claim', source: 'jalal', icon: 'mark', label: 'كلام جلال', note: '«آني رجعت للبيت ١٠:٣٠. ما طلعت بعدها.»', contradictedBy: 'e-receipt', disprovedBy: 'd-truth' },
    'd-source': { rel: 'deduction', source: 'phones', icon: 'mark', label: 'منين بدا المقطع', note: 'أول رسالة بيها المقطع، ما مكتوب فوقها «مُعاد توجيهه»: من رقم جلال، لصبري. جلال أول من دزّه.' },
    'd-twisted': { rel: 'deduction', source: 'phones', icon: 'heart', label: 'وين انگلب الكلام', note: 'جملتها مرّت على صبري والكروب بنفس المعنى. وبعدين وصلت جلال… وصارت شي ثاني.' },
  },
  decisions: {
    // 04: whether she trusts Lama with what Ryan suspects — read at once (Lama's reply), and in 07
    'lama-secret': ['trust', 'keep'],
  },
  case: [{ mission: 's3-04', ids: [...CLUES, 'd-source', 'd-twisted'] }],
  journal: {
    's3-source': { title: 'جملة وحدة، خمس نسخ', icon: 'mark', text: 'المقطع بدا من تلفون جلال. وجملتها، اللي گالتها لصبري، لفّت على الكروب بنفس المعنى… لحد ما وصلت جلال وانگلبت.' },
  },
  puzzles: { 's3-forward': FORWARD, ...WHISPER },
  scenes: [S3_GARAGE],
  dialogue: {
    's3.04-open': [
      { s: 'narrator', t: '(الأحد. نادي السيارات. ريحة زيت، وضحك عالي، وسكوت يوگف أول ما دخلت أنجي.)' },
      { s: 'anji', e: 'determined', t: 'المقطع بدا من هنا. وأحد هنا يعرف منين.' },
    ],
    's3.04-ryan': [
      { s: 'ryan', e: 'smile', t: 'آني هنا. بس ما راح أسمّي أحد… لحد ما يگول الدليل.' },
      { if: 'dec3:ryan-trust=trust', then: [{ s: 'ryan', e: 'smile', t: 'گلتي «سوا». فسوا.' }], else: [{ s: 'ryan', e: 'smile', t: 'گلتي تريدين تشوفين بعينچ. شوفي.' }] },
    ],
    's3.04-ryan-after': [{ s: 'ryan', e: 'smile', t: 'شفتي؟ الكلام يمشي… ويتغيّر بالطريق.' }],
    's3.04-sabri': [
      { s: 'sabri', e: 'worried', t: 'أنجي… آني ما سجلت شي! والله! المقطع وصلني بالليل، وآني… دزيته للكروب. مثل ما هو.', act: [{ pose: 'sabri', anim: 'handsup', for: 1200 }] },
      { s: 'anji', e: 'thinking', t: 'وريني تلفونك. والكروب.' },
      { s: 'narrator', t: '(ثلاث رسائل بيها نفس المقطع: تلفون صبري، والكروب، وتلفونها.)' },
    ],
    's3.04-sabri-waits': [{ s: 'sabri', e: 'worried', t: 'آني بس… أعيد الكلام. حرف بحرف. هاي مشكلتي.' }],
    's3.04-sabri-after': [{ s: 'sabri', e: 'worried', t: 'آني گلت اللي سمعته… بس صدگ، ما گلت هيچ.', act: [{ puff: 'sabri', type: 'sweat', ms: 1400 }] }],
    's3.04-words-intro': [
      { s: 'sabri', e: 'worried', t: 'الكلام اللي گلتيه إلي… وصل ريان بغير شكل. خذي، كل اللي دار بالكروب وبعده.' },
      { s: 'anji', e: 'determined', t: 'خليني أشوف وين انگلب.' },
    ],
    's3.04-words-solved': [
      { s: 'anji', e: 'determined', t: 'لحد الكروب، نفس الكلام بكلمات ثانية. بعدها… وصل جلال.' },
      { s: 'sabri', e: 'surprised', t: 'يعني آني… مو آني اللي غيّرته؟', act: [{ jolt: 'sabri', type: 'hop' }] },
      { s: 'anji', e: 'smirk', t: 'لا. إنت بس لسانك طويل. مو مزوّر.' },
    ],
    's3.04-jalal': [
      { s: 'jalal', e: 'smile', t: 'أنجي، صح؟ سمعت بالسالفة. والله مقطع وانتشر، الناس فاضية.', act: [{ pose: 'jalal', anim: 'shrug', for: 900 }] },
      { s: 'jalal', e: 'smile', t: 'آني؟ الجمعة رجعت للبيت ١٠:٣٠. ما طلعت بعدها.' },
      { s: 'anji', e: 'thinking', t: '١٠:٣٠. … زين.' },
    ],
    's3.04-jalal-again': [{ s: 'jalal', e: 'smile', t: 'گلتلچ، ١٠:٣٠ بالبيت.', act: [{ pose: 'jalal', anim: 'think', for: 900 }] }],
    's3.04-jalal-receipt': [
      { s: 'anji', e: 'thinking', t: '(وصل البانزينخانة، ١١:٢٠. وجلال يگول ١٠:٣٠ بالبيت.)' },
      { s: 'jalal', e: 'worried', t: '… شنو؟ ليش تباوعين هيچ؟', act: [{ pose: 'jalal', anim: 'shrug', for: 700 }] },
      { s: 'anji', e: 'determined', t: 'ولا شي. بعد.' },
    ],
    's3.04-notice': [
      { s: 'anji', e: 'thinking', t: 'إنذار من البلدية، ملصوگ على اللوحة.' },
      { s: 'narrator', t: '(«شكوى ضوضاء: سيارة لوحتها تنتهي بـ٤٧، شارع الورد، الجمعة ١١:١٠م». ما مكتوب لون.)' },
      { s: 'anji', e: 'surprised', t: 'شارعنا. ١١:١٠. … ولوحة مو ١٩.' },
    ],
    's3.04-notice-again': [{ s: 'anji', e: 'thinking', t: '«تنتهي بـ٤٧». مو زفيرو.' }],
    's3.04-receipt': [
      { s: 'anji', e: 'thinking', t: 'وصل… بالسلة.' },
      { s: 'narrator', t: '(وصل بانزينخانة، الجمعة ١١:٢٠م. البانزينخانة اللي بعد شارعين من بيتها. «بطاقة النادي — جلال».)' },
      { s: 'anji', e: 'surprised', t: '١١:٢٠. مو بالبيت.' },
    ],
    's3.04-bin-again': [{ s: 'anji', e: 'smirk', t: 'سلة. بس هاي السلة تعرف أكثر من نص النادي.' }],
    's3.04-chain-wait': [{ s: 'anji', e: 'thinking', t: 'بعد ناقصني شي. كل واحد هنا عنده جزء.' }],
    's3.04-chain-solved': [
      { s: 'anji', e: 'determined', t: 'رسالة جلال لصبري… ما مكتوب فوقها «مُعاد توجيهه». يعني ما وصلته من أحد.' },
      { s: 'anji', e: 'determined', t: 'جلال أول واحد دز المقطع.' },
    ],
    's3.04-chain-done': [{ s: 'anji', e: 'thinking', t: 'جلال، صبري، الكروب، أنا. بهالترتيب.' }],
    's3.04-lama': [
      { s: 'narrator', t: '(التلفون. لمى.)' },
      { s: 'lama', e: 'smile', t: 'شلونچ يا محققة؟ صوتچ مو طبيعي. شكو؟' },
      {
        s: 'anji',
        choice: [
          {
            t: 'ريان يشك بواحد چان يثق بيه. وآني هم صرت أشك.',
            do: ['dec3:lama-secret=trust'],
            then: [
              { s: 'lama', e: 'thinking', t: 'زين. بس اسمعيني: اللي دز المقطع أول… مو لازم هو اللي سجله. ولا لازم هو اللي سابق.' },
              { s: 'lama', e: 'smile', t: 'لا تقفزين. ثبّتي كل خطوة بروحها. وآني وياچ.' },
            ],
          },
          {
            t: 'ولا شي… شغلة صغيرة.',
            do: ['dec3:lama-secret=keep'],
            then: [
              { s: 'lama', e: 'suspicious', t: 'شغلة صغيرة وصوتچ هيچ؟ زين، ما أسأل.' },
              { s: 'lama', e: 'thinking', t: 'بس إذا تشكّين بأحد: أول واحد دز الشي… مو دايماً هو اللي سواه. ثبّتي.' },
            ],
          },
        ],
      },
    ],
    's3.04-later': [{ s: 'anji', e: 'thinking', t: 'بعدين. الرسائل ما راح تنمسح.' }],
  },
};
