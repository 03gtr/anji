/**
 * Season 3 «أصداء الـV8», Mission 05 — «سنوكي يعرف شي» (s3-05; SEASON_3_DESIGN.md §5, P-05).
 * Dawn, the lane behind the bakery and her street. Snooky (Ryan's dog), out with Ryan, will not leave a drain grate;
 * then follows a scent the way a dog does — off after a cat, digging at the wrong spot, back again, sitting where it
 * matters. A car-club keyring in the drain, tyre marks on the far kerb, a fresh oil drop. Then she places both cars on
 * the street from what was seen and not seen («وين وگفت السيارة الثانية», a logic grid, unique by enumeration).
 * Snooky is Ryan's; Anji's husky is hers (ownership never swaps). Fiction written for the game.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3 } from './constants.js';

const F = (k) => `s3:05-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-04';
const OPENED = flag('opened');
const S1 = flag('scent-1'); // after the cat
const S2 = flag('scent-2'); // the wrong dig
const S3 = flag('scent-3'); // sitting by the marks
const PLACED = flag('placed');
export const TRACES = ['e-keyring', 'e-tyre-marks', 'e-oil'];
const HAS = (ids) => ids.map((e) => `ev3:${e}`);
const X = { ryan: 220, grate: 420, cat: 760, dig: 940, marks: 1150, oil: 1300 };

function grate(ctx, x, shine) {
  ctx.save();
  ctx.fillStyle = '#2a2c36';
  ctx.fillRect(x - 22, GROUND + 4, 44, 10);
  ctx.strokeStyle = '#5a5e70';
  ctx.lineWidth = 2;
  for (let k = -18; k <= 18; k += 6) {
    ctx.beginPath();
    ctx.moveTo(x + k, GROUND + 4);
    ctx.lineTo(x + k, GROUND + 14);
    ctx.stroke();
  }
  if (shine) {
    ctx.fillStyle = '#ffe2a8';
    ctx.fillRect(x + 3, GROUND + 8, 3, 3);
  }
  ctx.restore();
}
function marks(ctx, x) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20,20,26,.55)';
  ctx.lineWidth = 4;
  for (const dy of [0, 8]) {
    ctx.beginPath();
    ctx.moveTo(x - 70, GROUND + 26 + dy);
    ctx.quadraticCurveTo(x, GROUND + 14 + dy, x + 70, GROUND + 30 + dy);
    ctx.stroke();
  }
  ctx.restore();
}
function oil(ctx, x) {
  ctx.save();
  ctx.fillStyle = 'rgba(30,26,40,.7)';
  ctx.beginPath();
  ctx.ellipse(x, GROUND + 30, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(160,120,255,.25)';
  ctx.beginPath();
  ctx.ellipse(x - 3, GROUND + 29, 5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const S3_LANE = {
  id: 's3-lane',
  title: 'الدربونة ورا المخبز',
  theme: 'roads',
  music: 'calm',
  width: 1460,
  spawn: 120,
  seed: 3501,
  actors: [
    { id: 'ryan', kind: 'ryan', x: X.ryan, facing: 1 },
    // Snooky: at the grate, then along the scent
    { id: 'snooki', kind: 'snooki', x: X.grate + 30, facing: -1, mood: 'sit', if: `!${S1}` },
    { id: 'snooki', kind: 'snooki', x: X.cat - 60, facing: 1, mood: 'wag', if: [S1, `!${S2}`] },
    { id: 'snooki', kind: 'snooki', x: X.dig + 40, facing: 1, mood: 'wag', if: [S2, `!${S3}`] },
    { id: 'snooki', kind: 'snooki', x: X.marks + 20, facing: -1, mood: 'sit', if: S3 },
  ],
  dynamic: [
    { x: X.grate, reach: 30, draw: (ctx, { game }) => grate(ctx, X.grate, !game.has('s3.ev.e-keyring')) },
    { x: X.marks, reach: 80, draw: (ctx) => marks(ctx, X.marks) },
    { x: X.oil, reach: 20, draw: (ctx) => oil(ctx, X.oil) },
  ],
  triggers: [
    {
      id: 'open',
      x1: 80,
      x2: 360,
      if: [OPEN, `!${OPENED}`],
      run: [{ say: 's3.05-open' }, { fx: OPENED, quiet: true }],
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
        { if: PLACED, run: [{ say: 's3.05-ryan-after' }] },
        { run: [{ say: 's3.05-ryan' }] },
      ],
    },
    {
      id: 'snooki',
      actor: 'snooki',
      x: X.grate + 30,
      w: 60,
      h: 60,
      label: 'سنوكي',
      icon: '🐾',
      if: OPENED,
      cases: [
        // he will not leave the grate — until she has looked into it
        { if: ['!ev3:e-keyring'], run: [{ all: [{ jolt: 'snooki', type: 'hop' }, { sfx: 'bark' }] }, { say: 's3.05-snooki-grate' }] },
        // then the scent: a cat first (a dog is a dog)
        {
          if: `!${S1}`,
          run: [
            { bubble: 'snooki', text: '👃', ms: 900 },
            { move: 'snooki', x: X.cat + 40, speed: 260 },
            { bubble: 'snooki', text: '🐈!', ms: 900 },
            { sfx: 'bark' },
            { move: 'snooki', x: X.cat - 60, speed: 200 },
            { say: 's3.05-snooki-cat' },
            { fx: S1, quiet: true },
          ],
        },
        {
          if: `!${S2}`,
          run: [
            { move: 'snooki', x: X.dig + 40, speed: 220 },
            { all: [{ jolt: 'snooki', type: 'shake' }, { bubble: 'snooki', text: '⛏️', ms: 1100 }] },
            { say: 's3.05-snooki-dig' },
            { fx: S2, quiet: true },
          ],
        },
        {
          if: `!${S3}`,
          run: [
            { move: 'snooki', x: X.marks + 20, speed: 220 },
            { face: 'snooki', dir: -1 },
            { bubble: 'snooki', text: '…', ms: 900 },
            { say: 's3.05-snooki-sits' },
            { fx: S3, quiet: true },
          ],
        },
        { run: [{ say: 's3.05-snooki-again' }] },
      ],
    },
    {
      id: 'grate',
      x: X.grate,
      w: 60,
      h: 40,
      label: 'المجرى',
      icon: '✨',
      if: OPENED,
      cases: [
        { if: '!ev3:e-keyring', run: [{ pose: 'anji', anim: 'think', for: 500 }, { say: 's3.05-keyring' }, { fx: 'ev3:e-keyring' }] },
        { run: [{ say: 's3.05-grate-again' }] },
      ],
    },
    {
      id: 'marks',
      x: X.marks,
      w: 140,
      h: 50,
      label: 'آثار التايرات',
      icon: '🛞',
      if: S3,
      cases: [
        { if: '!ev3:e-tyre-marks', run: [{ say: 's3.05-marks' }, { fx: 'ev3:e-tyre-marks' }] },
        { run: [{ say: 's3.05-marks-again' }] },
      ],
    },
    {
      id: 'oil',
      x: X.oil,
      w: 50,
      h: 40,
      label: 'بقعة',
      icon: '💧',
      if: S3,
      cases: [
        { if: '!ev3:e-oil', run: [{ say: 's3.05-oil' }, { fx: 'ev3:e-oil' }] },
        { run: [{ say: 's3.05-oil-again' }] },
      ],
    },
    {
      id: 'street',
      x: X.marks - 120,
      w: 70,
      h: 80,
      label: 'الشارع كله',
      icon: '🗺️',
      if: HAS(TRACES),
      cases: [
        { if: PLACED, run: [{ say: 's3.05-placed-again' }] },
        { run: [{ puzzle: 's3-park', then: [{ say: 's3.05-placed' }, { fx: ['ev3:d-second-car', PLACED] }], else: [{ say: 's3.05-later' }] }] },
      ],
    },
  ],
  exits: [],
  ambient: [{ t: 'الفجر. ريحة أول خبزة، وبرد، وسنوكي يشم كل شي.' }],
};

/* ── «وين وگفت السيارة الثانية» (P-05) ── */
const bay = (n, label) => ({ id: `b${n}`, label });
/** (exported for the tests) */
export const PARK = {
  type: 'logicgrid',
  title: 'وين وگفت السيارة الثانية',
  goal: 'الشارع ستة مواقف على كل رصيف. وين وگف زفيرو الساعة ٩:٤٠، ووين وگفت السيارة الثانية ١١:١٠؟',
  intro: 'كاميرا الجيران فوق الموقف ٢، على رصيف بيت أنجي.',
  config: {
    rows: [
      { id: 'zefiro', label: 'زفيرو', icon: 'car' },
      { id: 'other', label: 'السيارة الثانية', icon: 'mark' },
    ],
    cols: [
      { id: 'kerb', label: 'أي رصيف', options: [{ id: 'near', label: 'رصيف بيت أنجي' }, { id: 'far', label: 'الرصيف المقابل' }] },
      { id: 'bay', label: 'أي موقف', options: [bay(1, '١'), bay(2, '٢'), bay(3, '٣'), bay(4, '٤'), bay(5, '٥'), bay(6, '٦')] },
    ],
    clues: [
      { text: 'زفيرو وگف يم رصيف بيتها: شافته من الباب.', rule: { is: ['zefiro', 'kerb', 'near'] } },
      { text: 'آثار التفحيط على الرصيف المقابل.', rule: { is: ['other', 'kerb', 'far'] } },
      { text: 'الكاميرا تشوف المواقف ١ و٢ و٣ بس، وملف ٩:٤٠ بيه ضوايات زفيرو.', rule: { notIn: ['zefiro', 'bay', ['b4', 'b5', 'b6']] } },
      { text: 'ملف ١١:١٠ ما بيه ضوايات أبد.', rule: { notIn: ['other', 'bay', ['b1', 'b2', 'b3']] } },
      { text: 'زفيرو وگف تحت شجرة، والشجر بس يم الموقف ٣ والموقف ٥.', rule: { notIn: ['zefiro', 'bay', ['b1', 'b2', 'b4', 'b6']] } },
      { text: 'بقعة الزيت الجديدة مو بالموقف ٤ ولا بالموقف ٦.', rule: { notIn: ['other', 'bay', ['b4', 'b6']] } },
    ],
  },
  wrong: [],
  success: 'زفيرو بالموقف ٣، يم بيتها. والثانية بالموقف ٥، على الرصيف المقابل — بعيد عن عين الكاميرا.',
  reward: [],
};

export default {
  id: 'm05',
  missions: [
    {
      id: 's3-05',
      kind: 'story',
      pack: PACK_S3,
      act: 2,
      day: 5,
      world: ['s3-lane'],
      title: 'سنوكي يعرف شي',
      where: 'الدربونة ورا المخبز',
      summary: 'الفجر. سنوكي ما يرضى يتحرك من يم مجرى… وريان يگول: «خليه. هو يعرف شي».',
      unlock: OPEN,
      locked: 'تنفتح بعد «الشخص ورا القصة».',
      steps: [
        { done: OPENED, world: 's3-lane', text: 'ريان وسنوكي بالدربونة، من الفجر.' },
        { done: S3, world: 's3-lane', text: 'سنوكي شام شي. امشي وراه… حتى لو لف.' },
        { done: HAS(TRACES), world: 's3-lane', text: 'كل شي وگف عليه سنوكي، شوفيه.' },
        { done: PLACED, world: 's3-lane', text: 'حطي السيارتين بمكانهن بالشارع.' },
      ],
      reward: ['journal:s3-snooki'],
      rewardText: 'أنف يعرف أكثر',
      leadsTo: ['s3-06'],
    },
  ],
  evidence: {
    'e-keyring': { rel: 'fact', source: 'lane', icon: 'car', label: 'ميدالية النادي', note: 'ميدالية «نادي السيارات» بالمجرى، وعليها ورقة صغيرة: «٤٧».' },
    'e-tyre-marks': { rel: 'fact', source: 'lane', icon: 'car', label: 'آثار التفحيط', note: 'دوائر سودة على الرصيف المقابل، قبال الشجرة الثانية.' },
    'e-oil': { rel: 'fact', source: 'lane', icon: 'mark', label: 'بقعة زيت', note: 'بقعة زيت جديدة، على الرصيف المقابل. زفيرو ما يخر زيت.' },
    'd-second-car': { rel: 'deduction', source: 'lane', icon: 'mark', label: 'السيارة الثانية', note: 'زفيرو بالموقف ٣، يم بيتها. سيارة ثانية بالموقف ٥ على الرصيف المقابل، بعيد عن عين الكاميرا.' },
  },
  case: [{ mission: 's3-05', ids: [...TRACES, 'd-second-car'] }],
  journal: {
    's3-snooki': { title: 'أنف يعرف أكثر', icon: 'paw', text: 'سنوكي لگى ميدالية النادي بالمجرى، وعليها «٤٧». وآثار التايرات والزيت على الرصيف المقابل: سيارة ثانية وگفت هناك، مو زفيرو.' },
  },
  puzzles: { 's3-park': PARK },
  scenes: [S3_LANE],
  dialogue: {
    's3.05-open': [
      { s: 'narrator', t: '(الفجر. ريان واگف بالدربونة، وسنوكي گاعد يم مجرى، ما يتحرك.)' },
      { s: 'ryan', e: 'smile', t: 'من ربع ساعة هيچ. خليه. هو يعرف شي.' },
    ],
    's3.05-ryan': [{ s: 'ryan', e: 'smile', t: 'سنوكي ما يچذب. يلف شوية… بس يرجع.' }],
    's3.05-ryan-after': [{ s: 'ryan', e: 'smile', t: '٤٧. … هسه صار عندچ اللي يكفي حتى تسمّين.' }],
    's3.05-snooki-grate': [{ s: 'anji', e: 'curious', t: 'شبيك على هالمجرى؟ … اكو شي يلمع جوه.' }],
    's3.05-keyring': [
      { s: 'anji', e: 'surprised', t: 'ميدالية! «نادي السيارات». وورقة صغيرة عليها: «٤٧».' },
      { s: 'anji', e: 'thinking', t: '٤٧… نفس اللي بإنذار البلدية.' },
    ],
    's3.05-grate-again': [{ s: 'anji', e: 'thinking', t: 'المجرى فاضي هسه.' }],
    's3.05-snooki-cat': [
      { s: 'anji', e: 'laugh', t: 'سنوكي! قطة؟ هسه وقت القطط؟' },
      { s: 'ryan', e: 'smile', t: 'كلب. شنسوي.' },
    ],
    's3.05-snooki-dig': [
      { s: 'narrator', t: '(سنوكي يحفر… ويطلع طابة قديمة. ويباوع لأنجي بفخر.)' },
      { s: 'anji', e: 'laugh', t: 'شكراً. طابة. مفيدة جداً.' },
    ],
    's3.05-snooki-sits': [
      { s: 'narrator', t: '(سنوكي يرجع، يركض، ويگعد على الرصيف المقابل. ما يتحرك. يباوع للأرض.)' },
      { s: 'anji', e: 'thinking', t: 'هنا. شنو هنا؟' },
    ],
    's3.05-snooki-again': [{ s: 'anji', e: 'smile', t: 'شاطر. أشطر من نص النادي.' }],
    's3.05-marks': [
      { s: 'anji', e: 'thinking', t: 'آثار تايرات. دوائر. أحد چان يفحّط هنا.' },
      { s: 'anji', e: 'thinking', t: 'على الرصيف المقابل… مو يمنا.' },
    ],
    's3.05-marks-again': [{ s: 'anji', e: 'thinking', t: 'دوائر سودة. قبال الشجرة الثانية.' }],
    's3.05-oil': [
      { s: 'anji', e: 'thinking', t: 'بقعة زيت جديدة. زفيرو ما يخر زيت. ريان يدلّعه أكثر مني.' },
      { s: 'ryan', e: 'smile', t: 'سمعت.' },
    ],
    's3.05-oil-again': [{ s: 'anji', e: 'thinking', t: 'زيت. مو زفيرو.' }],
    's3.05-placed': [
      { s: 'anji', e: 'determined', t: 'زفيرو بالموقف ٣، تحت الشجرة، يم بيتنا. الكاميرا شافته.' },
      { s: 'anji', e: 'determined', t: 'والثانية؟ بالموقف ٥، الرصيف المقابل. بعيد عن الكاميرا… وقريبة من تلفون أحد.' },
    ],
    's3.05-placed-again': [{ s: 'anji', e: 'thinking', t: 'سيارتين. موقفين. ورصيفين.' }],
    's3.05-later': [{ s: 'anji', e: 'thinking', t: 'بعدين. الشارع ما راح يتحرك.' }],
  },
};
