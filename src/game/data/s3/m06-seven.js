/**
 * Season 3 «أصداء الـV8», Mission 06 — «غرفة الحقائق السبعة» (s3-06; SEASON_3_DESIGN.md §5, P-06).
 * The clinic's archive room after hours (Lama has the key). Seven facts on the wall, two statements that are only
 * statements, a night with gaps. Two layers, strict: put the night in order (and set the statements apart); then
 * prove «the clip is another car, not Zefiro» with TWO independent chains — one from what was heard, one from what
 * was written — that share no source (the source of each card is data; the tests compute the independence).
 * Fiction written for the game.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3 } from './constants.js';

const F = (k) => `s3:06-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-05';
const OPENED = flag('opened');
const SOLVED = flag('solved');
const X = { door: 90, lama: 300, wall: 640, shelves: 1000 };

function factWall(ctx, x, done) {
  ctx.save();
  ctx.fillStyle = '#3a2f2a';
  ctx.fillRect(x - 120, GROUND - 190, 240, 120);
  ctx.fillStyle = '#c9a26e';
  ctx.fillRect(x - 114, GROUND - 184, 228, 108);
  for (let k = 0; k < 7; k++) {
    ctx.fillStyle = '#f6efe0';
    ctx.fillRect(x - 104 + k * 30, GROUND - 170 + (k % 2) * 40, 24, 18);
  }
  ctx.strokeStyle = done ? '#e04a5a' : 'rgba(224,74,90,.25)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let k = 0; k < 7; k++) ctx[k ? 'lineTo' : 'moveTo'](x - 92 + k * 30, GROUND - 161 + (k % 2) * 40);
  ctx.stroke();
  ctx.restore();
}

const S3_ARCHIVE = {
  id: 's3-archive',
  title: 'أرشيف العيادة',
  theme: 'library',
  music: 'calm',
  width: 1200,
  spawn: 150,
  seed: 3601,
  props: [{ type: 'bookshelf', x: X.shelves, w: 90, h: 150 }, { type: 'bookshelf', x: X.shelves + 110, w: 70, h: 130 }],
  actors: [{ id: 'lama', kind: 'lama', x: X.lama, facing: 1 }],
  dynamic: [{ x: X.wall, reach: 130, draw: (ctx, { game }) => factWall(ctx, X.wall, game.flag(F('solved'))) }],
  triggers: [
    {
      id: 'open',
      x1: 100,
      x2: 420,
      if: [OPEN, `!${OPENED}`],
      run: [
        { sfx: 'click' },
        { all: [{ pose: 'lama', anim: 'point', for: 900 }, { bubble: 'lama', text: '🔑 بس ساعة. ولا تلمسين ملفات المرضى.', ms: 2000 }] },
        { say: 's3.06-open' },
        { fx: OPENED, quiet: true },
      ],
    },
  ],
  interact: [
    {
      id: 'lama',
      actor: 'lama',
      x: X.lama,
      w: 50,
      h: 120,
      label: 'لمى',
      icon: '💬',
      cases: [
        { if: SOLVED, run: [{ say: 's3.06-lama-after' }] },
        { run: [{ say: 's3.06-lama' }] },
      ],
    },
    {
      id: 'wall',
      x: X.wall,
      w: 220,
      h: 120,
      label: 'حايط الحقائق',
      icon: '🧵',
      if: OPENED,
      cases: [
        { if: SOLVED, run: [{ say: 's3.06-wall-done' }] },
        {
          run: [
            { if: '!seen:dlg:s3.06-wall-intro', then: [{ say: 's3.06-wall-intro' }] },
            { puzzle: 's3-seven', then: [{ say: 's3.06-solved' }, { fx: ['ev3:d-seven', SOLVED] }], else: [{ say: 's3.06-later' }] },
          ],
        },
      ],
    },
  ],
  exits: [],
  ambient: [{ t: 'ريحة ورق قديم، وساعة حايط تدگ أعلى من اللازم.' }],
};

/* ── «غرفة الحقائق السبعة» (P-06) ── */
const T = (id, label) => ({ id, label, icon: 'moon-full' });
/** (exported for the tests: each card's place, and — for the proof — each card's evidence id) */
export const SEVEN_ANSWER = {
  blip: 't2140', shutter: 't2145', relay: 't2300', revs: 't2310', receipt: 't2320', first: 't0002', group: 't0815', home: 'talk', caption: 'talk',
  p1: 'sound', p2: 'sound', p3: 'paper', p4: 'paper', p5: 'paper', p6: 'none', p7: 'none',
};
export const PROOF_EVIDENCE = { p1: 'd-two-engines', p2: 'e-rec-cam', p3: 'e-noise-notice', p4: 'e-keyring', p5: 'e-receipt', p6: 't-jalal', p7: 'e-sabri-count' };
const c = (id, label, note) => ({ id, label, note, accepts: [SEVEN_ANSWER[id]] });
const SEVEN = {
  type: 'sort',
  title: 'غرفة الحقائق السبعة',
  goal: 'رتّبي الليلة، وافرزي الكلام عن الحقيقة. بعدين ثبّتي: المقطع مو زفيرو — بطريقين ما يعتمدون على نفس الشي.',
  intro: 'كل ورقة على الحايط إجت من مكان. والمكان مهم.',
  config: {
    stages: [
      {
        kind: 'sort',
        prompt: 'كل شي على الحايط: بأي ساعة صار؟ أو… ما صار، بس انگال؟',
        bins: [T('t2140', '٩:٤٠م'), T('t2145', '٩:٤٥م'), T('t2300', '١١:٠٠م'), T('t2310', '١١:١٠م'), T('t2320', '١١:٢٠م'), T('t0002', '١٢:٠٢ص'), T('t0815', '٨:١٥ص'), { id: 'talk', label: 'كلام بس — ما ثابت', icon: 'mark' }],
        cards: [
          c('blip', 'نفخة وحدة، وانطفى المحرك', 'تسجيلها من الباب.'),
          c('shutter', 'سكّة المخبز تنزل', 'دوام المخبز.'),
          c('relay', 'الإنارة تتحول لليلي', 'صندوق المؤقّت.'),
          c('revs', 'تفحيط، وشكوى للبلدية', 'إنذار البلدية.'),
          c('receipt', 'جلال بالبانزينخانة، بعد شارعين', 'الوصل.'),
          c('first', 'جلال يدز المقطع لصبري', 'تلفون صبري.'),
          c('group', 'المقطع ينزل بكروب الكراج', 'الكروب.'),
          c('home', '«رجعت للبيت ١٠:٣٠»', 'جلال.'),
          c('caption', '«ريان يسابق جوه بيت أنجي»', 'تحت المقطع.'),
        ],
      },
      {
        kind: 'sort',
        prompt: 'المقطع مو زفيرو. ثبّتيها بطريقين: واحد من اللي انسمع، وواحد من اللي انكتب. واللي ما يثبت شي، على صفحة.',
        bins: [
          { id: 'sound', label: 'طريق الصوت', icon: 'mark' },
          { id: 'paper', label: 'طريق الورق', icon: 'note' },
          { id: 'none', label: 'ما يثبت شي', icon: 'moon-crescent' },
        ],
        cards: [
          c('p1', 'محركين، مو واحد', 'استنتاجچ من التسجيلات.'),
          c('p2', 'ملفات كاميرا الجيران', 'كاميرا.'),
          c('p3', 'إنذار البلدية: «٤٧»', 'البلدية.'),
          c('p4', 'ميدالية النادي: «٤٧»', 'المجرى.'),
          c('p5', 'وصل البانزينخانة ١١:٢٠', 'البانزينخانة.'),
          c('p6', 'كلام جلال', 'جلال.'),
          c('p7', 'عدّ صبري', 'صبري.'),
        ],
      },
    ],
    labels: { check: 'هيچ ثابتة ✔' },
  },
  success: 'طريقين، ولا واحد يعتمد على الثاني: الصوت يگول محرك ثاني، والورق يگول ٤٧ — وجلال بعد شارعين.',
  reward: [],
};

export default {
  id: 'm06',
  missions: [
    {
      id: 's3-06',
      kind: 'story',
      pack: PACK_S3,
      act: 2,
      day: 6,
      world: ['s3-archive'],
      title: 'غرفة الحقائق السبعة',
      where: 'أرشيف العيادة',
      summary: 'لمى عندها مفتاح الأرشيف، وساعة وحدة. وأنجي عندها حايط، وورق، وخيوط.',
      unlock: OPEN,
      locked: 'تنفتح بعد «سنوكي يعرف شي».',
      steps: [
        { done: OPENED, world: 's3-archive', text: 'لمى تنتظرچ بالأرشيف، بعد الدوام.' },
        { done: SOLVED, world: 's3-archive', text: 'على الحايط: رتّبي الليلة، وثبّتي بطريقين.' },
      ],
      reward: ['journal:s3-seven'],
      rewardText: 'طريقين لنفس الحقيقة',
      leadsTo: ['s3-07'],
    },
  ],
  evidence: {
    'd-seven': { rel: 'deduction', source: 'board', icon: 'mark', label: 'طريقين لنفس الحقيقة', note: 'الصوت: محرك ثاني بعد ١١:٠٠. الورق: لوحة ٤٧، وميدالية ٤٧، وجلال ١١:٢٠ بعد شارعين. المقطع مو زفيرو.' },
  },
  case: [{ mission: 's3-06', ids: ['d-seven'] }],
  links: [
    ['d-two-engines', 'different-source', 'e-noise-notice'],
    ['e-bakery-hours', 'before', 'e-light-timer'],
    ['d-seven', 'depends', 'd-two-engines'],
    ['d-seven', 'depends', 'e-noise-notice'],
  ],
  journal: {
    's3-seven': { title: 'طريقين لنفس الحقيقة', icon: 'mark', text: 'بالأرشيف، رتّبت أنجي الليلة كلها. وثبّتت بطريقين ما يعتمدون على بعض: الصوت والورق. المقطع مو زفيرو.' },
  },
  puzzles: { 's3-seven': SEVEN },
  scenes: [S3_ARCHIVE],
  dialogue: {
    's3.06-open': [
      { s: 'lama', e: 'smile', t: 'هاي غرفة الأرشيف. ما أحد يجيها إلا الغبار وآني.' },
      { s: 'anji', e: 'determined', t: 'أحتاج حايط. وخيوط. وساعة.' },
      { s: 'lama', e: 'smirk', t: 'عندچ الثلاثة. والساعة تدگ.' },
    ],
    's3.06-lama': [
      { if: 'dec3:lama-secret=trust', then: [{ s: 'lama', e: 'thinking', t: 'گلتيلي ريان يشك بواحد. لا تثبتين الشك. ثبّتي الحقيقة… والشك يصير وراها.' }], else: [{ s: 'lama', e: 'thinking', t: 'ما أعرف شنو تدورين. بس أعرف: إذا الدليلين جايين من نفس المكان، هذا دليل واحد.' }] },
    ],
    's3.06-lama-after': [{ s: 'lama', e: 'smile', t: 'طريقين. ما أحد يگدر يگول «صدفة».', act: [{ pose: 'lama', anim: 'nod', for: 900 }] }],
    's3.06-wall-intro': [
      { s: 'anji', e: 'thinking', t: 'سبع حقايق… وجملتين بس جمل.' },
      { s: 'lama', e: 'smile', t: 'والجملة اللي ما وراها ورقة… مكانها مو بالساعات.' },
    ],
    's3.06-solved': [
      { s: 'anji', e: 'determined', t: 'الصوت يگول: محرك ثاني، بعد تكّة الإنارة. والورق يگول: ٤٧، وجلال بعد شارعين، ١١:٢٠.' },
      { s: 'anji', e: 'determined', t: 'ولا طريق يعتمد على الثاني. المقطع… مو زفيرو.' },
      { s: 'lama', e: 'smile', t: 'وهسه؟' },
      { s: 'anji', e: 'thinking', t: 'هسه أحتاج الشي اللي ما أحد شافه: التسجيل الكامل. قبل ما ينقص.' },
    ],
    's3.06-wall-done': [{ s: 'anji', e: 'smile', t: 'الخيوط بمكانها.' }],
    's3.06-later': [{ s: 'anji', e: 'thinking', t: 'بعدين. الحايط ما راح يتحرك… بس الساعة تدگ.' }],
  },
};
