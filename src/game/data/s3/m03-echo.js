/**
 * Season 3 «أصداء الـV8», Mission 03 — «لا تصدّقين كلشي ينقال» (s3-03; SEASON_3_DESIGN.md §5, P-02).
 * Saturday, her room. A clip reaches her phone: engine noise in the dark, captioned «ريان يسابق جوه بيت أنجي
 * بالليل». Marius arrives with it too — how depends on `marius-honest` (honest: he comes to her first, worried and
 * teasing; deflect: he has heard it from the group, and his teasing has an edge). Ryan calls: «لا تصدّكين كلشي
 * ينقال…» — he names no one. Her answer (`ryan-trust`). She gathers the night's recordings and proves two engines,
 * not one («الصدى», strict, three stages, every clue drawn as well as heard), and tells Marius what that makes of the
 * clip.
 * Fiction written for the game.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3 } from './constants.js';
import { RECORDINGS } from './recordings.js';
import { waveSvg } from './art.js';

const F = (k) => `s3:03-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-02';
const OPENED = flag('opened');
const SOLVED = flag('solved');
/** The papers pinned on her wall once the recordings are solved (the cork board's drawing). */
const PINNED = 'flag:s3:board-open';
/** The step's old ending (a thread drawn on the investigation board, since removed): older saves keep it as done. */
const OLD_LINK = 'flag:s3:link:d-two-engines~contradicts~e-clip';
export const TOLD = flag('told');
const RECS = ['e-clip', 'e-rec-cam', 'e-rec-gate', 'e-rec-lama'];
const ANCHORS = ['e-light-timer', 'e-bakery-hours'];
const HAS = (ids) => ids.map((e) => `ev3:${e}`);
const HONEST = 'dec3:marius-honest=honest';
const X = { door: 80, bed: 300, desk: 620, window: 860, board: 1040 };

function desk(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#6b463c';
  ctx.fillRect(x - 60, GROUND - 52, 120, 8);
  ctx.fillRect(x - 54, GROUND - 44, 6, 44);
  ctx.fillRect(x + 48, GROUND - 44, 6, 44);
  ctx.fillStyle = '#2a2e48';
  ctx.fillRect(x - 26, GROUND - 82, 52, 30);
  ctx.fillStyle = '#9fd7ff';
  ctx.fillRect(x - 22, GROUND - 78, 44, 22);
  ctx.fillStyle = '#ffd27a';
  for (let k = 0; k < 10; k++) ctx.fillRect(x - 20 + k * 4, GROUND - 68 - ((k * 7) % 9), 2, 2 + ((k * 7) % 9) * 1.4);
  ctx.restore();
}
function bed(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#5b1f34';
  ctx.fillRect(x - 80, GROUND - 34, 160, 34);
  ctx.fillStyle = '#efe2cf';
  ctx.fillRect(x - 76, GROUND - 44, 50, 12);
  ctx.fillStyle = '#e86a8a';
  ctx.fillRect(x - 20, GROUND - 40, 96, 8);
  ctx.restore();
}
function window(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#0d1038';
  ctx.fillRect(x - 40, GROUND - 170, 80, 90);
  ctx.strokeStyle = '#e9dcc0';
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 40, GROUND - 170, 80, 90);
  ctx.beginPath();
  ctx.moveTo(x, GROUND - 170);
  ctx.lineTo(x, GROUND - 80);
  ctx.stroke();
  ctx.restore();
}
function corkBoard(ctx, x, open) {
  ctx.save();
  ctx.fillStyle = '#b98a5a';
  ctx.fillRect(x - 56, GROUND - 160, 112, 80);
  ctx.fillStyle = '#d6a873';
  ctx.fillRect(x - 52, GROUND - 156, 104, 72);
  const cards = [[-40, -148], [8, -146], [-20, -116], [24, -112]];
  for (const [dx, dy] of cards) {
    ctx.fillStyle = '#f6efe0';
    ctx.fillRect(x + dx, GROUND + dy, 22, 16);
  }
  if (open) {
    ctx.strokeStyle = '#e04a5a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 29, GROUND - 140);
    ctx.lineTo(x + 35, GROUND - 104);
    ctx.stroke();
  }
  ctx.restore();
}

const S3_HOME = {
  id: 's3-home',
  title: 'غرفة أنجي',
  theme: 'house',
  music: 'calm',
  width: 1200,
  spawn: 200,
  seed: 3301,
  actors: [{ id: 'marius', kind: 'marius', x: X.window - 60, facing: -1, if: OPENED }],
  dynamic: [
    { x: X.bed, reach: 90, draw: (ctx) => bed(ctx, X.bed) },
    { x: X.desk, reach: 70, draw: (ctx) => desk(ctx, X.desk) },
    { x: X.window, reach: 50, draw: (ctx) => window(ctx, X.window) },
    { x: X.board, reach: 60, draw: (ctx, { game }) => corkBoard(ctx, X.board, game.flag('s3:board-open')) },
    { x: X.door, reach: 40, draw: (ctx, { P }) => P.door(ctx, X.door, GROUND, { color: '#5a3a4a' }) },
  ],
  triggers: [
    {
      id: 'open',
      x1: 100,
      x2: 500,
      if: [OPEN, `!${OPENED}`],
      run: [
        { sfx: 'tap' },
        { say: 's3.03-clip' },
        { fx: 'ev3:e-clip', quiet: true },
        { letterbox: true },
        { spawn: { id: 'marius', kind: 'marius', x: X.door, facing: 1 } },
        { move: 'marius', x: X.window - 60, speed: 150 },
        { letterbox: false },
        { say: 's3.03-marius' },
        { say: 's3.03-ryan' },
        { fx: ['ev3:t-ryan', OPENED] },
      ],
    },
  ],
  interact: [
    {
      id: 'marius',
      actor: 'marius',
      x: X.window - 60,
      w: 56,
      h: 140,
      label: 'ماريوس',
      icon: '💬',
      if: OPENED,
      cases: [
        { if: '!ev3:e-rec-cam', run: [{ say: 's3.03-marius-cam' }, { sfx: 'paper' }, { fx: 'ev3:e-rec-cam' }] },
        { if: [SOLVED, { not: { any: [TOLD, OLD_LINK] } }], run: [{ say: 's3.03-tell' }, { fx: TOLD }] },
        { if: SOLVED, run: [{ say: 's3.03-marius-after' }] },
        { run: [{ say: 's3.03-marius-waits' }] },
      ],
    },
    {
      id: 'phone',
      x: X.bed + 60,
      w: 60,
      h: 60,
      label: 'تلفونها',
      icon: '📱',
      if: OPENED,
      cases: [
        { if: { not: HAS(['e-rec-gate', 'e-rec-lama']) }, run: [{ say: 's3.03-phone' }, { fx: ['ev3:e-rec-gate', 'ev3:e-rec-lama'] }] },
        { run: [{ say: 's3.03-phone-again' }] },
      ],
    },
    {
      id: 'desk',
      x: X.desk,
      w: 90,
      h: 80,
      label: 'اللابتوب',
      icon: '🎧',
      if: OPENED,
      cases: [
        { if: SOLVED, run: [{ say: 's3.03-desk-done' }] },
        { if: { not: HAS(RECS) }, run: [{ say: 's3.03-desk-wait' }] },
        // the night's anchors are on the street: if she walked past them, she goes back (never a dead end)
        { if: { not: HAS(ANCHORS) }, run: [{ say: 's3.03-desk-street' }] },
        {
          run: [
            { if: '!seen:dlg:s3.03-desk-intro', then: [{ say: 's3.03-desk-intro' }] },
            { puzzle: 's3-echo', then: [{ say: 's3.03-solved' }, { fx: ['ev3:d-two-engines', SOLVED, PINNED] }, { say: 's3.03-pinned' }], else: [{ say: 's3.03-later' }] },
          ],
        },
      ],
    },
  ],
  exits: [],
  ambient: [{ t: 'غرفة هادئة، وتلفون ما يسكت.' }],
};

/* ── «الصدى» (P-02): two engines, not one ── */
const ENGINE_BINS = [
  { id: 'zefiro', label: 'زفيرو — يرجف بالراحة، نبضة طويلة ونبضة قصيرة', icon: 'car' },
  { id: 'other', label: 'محرك ثاني — ناعم وأعلى', icon: 'mark' },
];
const rec = (id, label, note, key, bin) => ({ id, label, note, art: waveSvg(RECORDINGS[key], { marks: RECORDINGS[key].marks }), accepts: [bin] });
/** (exported for the tests) */
export const ECHO_ANSWER = {
  clip: 'other', cam1: 'zefiro', cam2: 'other', gate: 'zefiro', note: 'other',
  blip: 't940', shutter: 't945', relay: 't1100', revs: 't1110',
  far: 'wall',
  statements: ['wall', 'gate', 'same'],
};
const ECHO = {
  type: 'sort',
  title: 'الصدى',
  goal: 'اسمعي، أو باوعي: كل تسجيل أي محرك بيه؟ وكل صوت بأي وقت؟',
  intro: 'فوق الخط، بالأصفر: المحرك. جوه الخط، بالرمادي: كل شي غيره. الخيط الأزرق: تكّة.',
  config: {
    stages: [
      {
        kind: 'sort',
        prompt: 'كل تسجيل: أي محرك؟',
        bins: ENGINE_BINS,
        cards: [
          rec('clip', 'المقطع اللي انتشر', '«ريان يسابق جوه بيت أنجي بالليل» — بلا وقت.', 'clip', ECHO_ANSWER.clip),
          rec('cam1', 'كاميرا الجيران — الأول', 'ملف الساعة ٩:٤٠م.', 'cam1', ECHO_ANSWER.cam1),
          rec('cam2', 'كاميرا الجيران — الثاني', 'ملف الساعة ١١:٠٠م.', 'cam2', ECHO_ANSWER.cam2),
          rec('gate', 'تسجيلها من الباب', 'رسالة صوتية بدت تسجلها للمى.', 'gate', ECHO_ANSWER.gate),
          rec('note', 'رسالتها للمى من الغرفة', 'انرسلت ١١:١١م.', 'note', ECHO_ANSWER.note),
        ],
      },
      {
        kind: 'sort',
        prompt: 'وكل صوت: بأي ساعة صار؟',
        bins: [
          { id: 't940', label: '٩:٤٠', icon: 'moon-crescent' },
          { id: 't945', label: '٩:٤٥', icon: 'moon-crescent' },
          { id: 't1100', label: '١١:٠٠', icon: 'moon-full' },
          { id: 't1110', label: '١١:١٠', icon: 'moon-full' },
        ],
        cards: [
          { id: 'blip', label: 'نفخة وحدة… وبعدين سكت', note: 'محرك.', accepts: [ECHO_ANSWER.blip] },
          { id: 'shutter', label: 'خشخشة حديد طويلة', note: 'مو محرك.', accepts: [ECHO_ANSWER.shutter] },
          { id: 'relay', label: 'تكّة وحدة', note: 'مو محرك.', accepts: [ECHO_ANSWER.relay] },
          { id: 'revs', label: 'تدوير ورا تدوير، وصريخ تايرات', note: 'محرك.', accepts: [ECHO_ANSWER.revs] },
        ],
      },
      {
        kind: 'pick',
        prompt: 'المقطع اللي انتشر أعلى صوت من كل التسجيلات. علّمي كل جملة تصح — وبس اللي تصح.',
        options: [
          { id: 'wall', label: 'انسجل من بعيد: الضجة اللي حواليه أعلى من المحرك نفسه.' },
          { id: 'close', label: 'انسجل جنب السيارة، لأن صوته أعلى.' },
          { id: 'gate', label: 'تسجيلها من الباب أقرب تسجيل لمحركه.' },
          { id: 'burble', label: 'محرك المقطع يرجف بنبضة طويلة وقصيرة، مثل زفيرو.' },
          { id: 'same', label: 'المقطع وملف الكاميرا الثاني: نفس المحرك.' },
          { id: 'once', label: 'بالمقطع نفخة وحدة، وبعدين سكت.' },
        ],
        answers: ECHO_ANSWER.statements,
      },
    ],
    labels: { check: 'هيچ صارت الليلة ✔' },
  },
  success: 'محركين، مو واحد. زفيرو حچى مرة وحدة بـ٩:٤٠ وسكت. والضجة بـ١١:١٠… محرك ثاني، والمقطع انسجل من بعيد.',
  reward: [],
};

export default {
  id: 'm03',
  missions: [
    {
      id: 's3-03',
      kind: 'story',
      pack: PACK_S3,
      act: 1,
      day: 3,
      world: ['s3-home', 's3-street'],
      title: 'لا تصدّقين كلشي ينقال',
      where: 'غرفة أنجي',
      summary: 'السبت. مقطع يدور على التلفونات، وتحته كلام عن ريان… وعنها.',
      unlock: OPEN,
      locked: 'تنفتح بعد «رسالة بثمانية أسطوانات».',
      steps: [
        { done: OPENED, world: 's3-home', text: 'تلفونچ ما يسكت.' },
        { done: HAS(RECS), world: 's3-home', text: 'لمّي كل تسجيل لتلك الليلة.' },
        { done: SOLVED, world: 's3-home', text: 'اسمعي التسجيلات، أو باوعي عليها، على اللابتوب.' },
        { done: { any: [TOLD, OLD_LINK] }, world: 's3-home', text: 'گولي لماريوس شنو طلع بالتسجيلات.' },
      ],
      reward: ['journal:s3-echo'],
      rewardText: 'محركين، مو واحد',
      leadsTo: ['s3-04'],
    },
  ],
  evidence: {
    'e-clip': { rel: 'claim', source: 'clip', icon: 'mark', label: 'المقطع', note: 'صوت محرك بالظلمة، ومكتوب تحته: «ريان يسابق جوه بيت أنجي بالليل». بلا وقت، بلا صورة.', disprovedBy: 'd-two-engines' },
    'e-rec-cam': { rel: 'fact', source: 'camera', icon: 'mark', label: 'ملفات كاميرا الجيران', note: 'ملفين: ٩:٤٠م و١١:٠٠م. صوت بس، والصورة سودة.' },
    'e-rec-gate': { rel: 'fact', source: 'anji', icon: 'heart', label: 'تسجيلها من الباب', note: 'رسالة صوتية بدت تسجلها للمى عند الباب، ٩:٤٠م. صرير الباب، وبعدين زفيرو.' },
    'e-rec-lama': { rel: 'fact', source: 'anji', icon: 'heart', label: 'رسالتها للمى ١١:١١م', note: 'من غرفتها. ولمى ردّت: «شنو هالصوت ورا صوتچ؟»' },
    't-ryan': { rel: 'claim', source: 'ryan', icon: 'car', label: 'كلام ريان', note: '«لا تصدّكين كلشي ينقال. أكو خفايا كثيرة راح أحچيلچ ياها بالوقت المناسب.» ما سمّى أحد.' },
    'd-two-engines': { rel: 'deduction', source: 'recordings', icon: 'mark', label: 'محركين، مو واحد', note: 'زفيرو بـ٩:٤٠: نفخة وحدة وانطفى. وبـ١١:١٠، بعد تكّة الإنارة: محرك ثاني يدوّر ويفحّط. والمقطع انسجل من بعيد.' },
  },
  decisions: {
    // 03: her answer to Ryan — read at once (his reply), and in 07 and 08
    'ryan-trust': ['trust', 'see'],
  },
  case: [{ mission: 's3-03', ids: [...RECS, 't-ryan', 'd-two-engines'] }],
  journal: {
    's3-echo': { title: 'محركين، مو واحد', icon: 'car', text: 'المقطع يگول «ريان يسابق». بس التسجيلات تگول: زفيرو حچى نفخة وحدة بـ٩:٤٠ وسكت. والتفحيط بـ١١:١٠ كان محرك ثاني. ريان گال: «لا تصدّكين كلشي ينقال».' },
  },
  puzzles: { 's3-echo': ECHO },
  scenes: [S3_HOME],
  dialogue: {
    's3.03-clip': [
      { s: 'narrator', t: '(السبت الصبح. التلفون يرن، ويرن، ويرن.)' },
      { s: 'narrator', t: '(مقطع: ظلمة، وصوت محرك يدوّر، وصريخ تايرات. ومكتوب تحته: «ريان يسابق جوه بيت أنجي بالليل».)' },
      { s: 'anji', e: 'surprised', t: 'شنو؟! … هذا مو اللي صار.' },
    ],
    's3.03-marius': [
      { if: HONEST, then: [
        { s: 'marius', e: 'worried', t: 'أنجي. وصلچ المقطع؟ گلت أجي أول واحد قبل ما يوصلچ من غيري.', act: [{ pose: 'marius', anim: 'cross', for: 1200 }] },
        { s: 'marius', e: 'smile', t: 'وبعدين… «مجرد صديق» ها؟ صديق يسابق جوه بيتچ؟', act: [{ pose: 'marius', anim: 'laugh', for: 900 }, { puff: 'anji', type: 'blush', ms: 1600 }] },
        { s: 'anji', e: 'pout', t: 'ماريوس! هذا مو وقته.' },
      ], else: [
        { s: 'marius', e: 'suspicious', t: 'كروب الكراج كله يحچي. «ريان يسابق جوه بيت أختك». حلو. وآني آخر من يعرف.', act: [{ pose: 'marius', anim: 'cross', for: 1400 }] },
        { s: 'anji', e: 'worried', t: 'لأن ماكو شي تعرفه! ما صار هيچ!' },
        { s: 'marius', e: 'thinking', t: 'زين. أريد أصدگچ. بس أريد أعرف شنو صار بالضبط.' },
      ] },
    ],
    's3.03-ryan': [
      { s: 'narrator', t: '(التلفون. ريان.)' },
      { s: 'ryan', e: 'smile', t: 'شفتي المقطع؟ … لا تصدّكين كلشي ينقال. أكو خفايا كثيرة راح أحچيلچ ياها بالوقت المناسب.' },
      { s: 'ryan', e: 'smile', t: 'وحدة منها تخصنا احنا الاثنين. عرفتها من واحد چنت أثق بيه. الله كشفلي شي ما چنت منتبهله.' },
      {
        s: 'anji',
        choice: [
          {
            t: 'أصدگك. خلينا نلگاها سوا.',
            do: ['dec3:ryan-trust=trust'],
            then: [{ s: 'ryan', e: 'smile', t: 'سوا. بس بهدوء… ما أريد أسمّي أحد قبل ما يكون عندي دليل.' }],
          },
          {
            t: 'لازم أشوفها بعيني أول.',
            do: ['dec3:ryan-trust=see'],
            then: [{ s: 'ryan', e: 'smile', t: 'هذا اللي أحبه بيچ. شوفيها بعينچ… وآني هنا.' }],
          },
        ],
      },
    ],
    's3.03-marius-cam': [
      { s: 'marius', e: 'smile', t: 'دگيت باب الجيران الصبح. الكاميرا مالتهم تسجل صوت. خذ، ملفين: ٩:٤٠ و١١:٠٠.', act: [{ pose: 'marius', anim: 'point', for: 900 }] },
      { s: 'anji', e: 'surprised', t: 'إنت… سويت هذا علمودي؟' },
      { s: 'marius', e: 'smirk', t: 'علمود أختي. وعلمود ريان. ولا تگولين له.' },
    ],
    's3.03-marius-waits': [{ s: 'marius', e: 'thinking', t: 'التسجيلات ما تچذب. الناس تچذب.' }],
    's3.03-marius-after': [{ s: 'marius', e: 'smile', t: 'محركين؟ … يعني واحد ثاني چان بالشارع. ومنو هو؟', act: [{ pose: 'marius', anim: 'think', for: 1200 }] }],
    's3.03-phone': [
      { s: 'anji', e: 'thinking', t: 'تلفوني. … الرسالة اللي بديتها عند الباب للمى، ٩:٤٠. نسيت أوقفها.' },
      { s: 'anji', e: 'thinking', t: 'وبعدها، ١١:١١، دزيتلها رسالة من الغرفة. ولمى ردّت: «شنو هالصوت ورا صوتچ؟»' },
    ],
    's3.03-phone-again': [{ s: 'anji', e: 'smirk', t: 'التلفون. سبعين رسالة عن المقطع. ولا وحدة صحيحة.' }],
    's3.03-desk-wait': [{ s: 'anji', e: 'thinking', t: 'بعد ناقصني تسجيلات. كل صوت لتلك الليلة.' }],
    's3.03-desk-street': [
      { s: 'anji', e: 'thinking', t: 'عندي الأصوات… بس ما أعرف ساعاتها. الشارع يعرف.' },
      { s: 'anji', e: 'determined', t: 'لازم أرجع للشارع، وأباوع على اللي مريت جنبه.' },
    ],
    's3.03-desk-intro': [
      { s: 'anji', e: 'determined', t: 'كل التسجيلات على وحدة. اللون الأصفر المحرك، والرمادي كل شي غيره.' },
      { if: HONEST, then: [{ s: 'marius', e: 'smile', t: 'يلا يا محققة.' }], else: [{ s: 'marius', e: 'smirk', t: 'إذا طلع ريان… أنا أحچي وياه.' }] },
    ],
    's3.03-solved': [
      { s: 'anji', e: 'determined', t: 'زفيرو حچى مرة وحدة بـ٩:٤٠، وانطفى. بعده المخبز سدّ.' },
      { s: 'anji', e: 'determined', t: 'والتفحيط؟ بعد تكّة الإنارة، ١١:١٠. محرك ثاني. ناعم، وأعلى.' },
      { s: 'marius', e: 'surprised', t: 'والمقطع… أعلى صوت، لأن انسجل من بعيد؟', act: [{ jolt: 'marius', type: 'hop' }] },
      { s: 'anji', e: 'smirk', t: 'الصوت العالي مو دايماً القريب.' },
    ],
    's3.03-pinned': [{ s: 'narrator', t: '(أنجي تعلّق المقطع على الحايط، وجنبه التسجيلات.)' }],
    's3.03-tell': [
      { s: 'anji', e: 'determined', t: 'المقطع يگول ريان سابق جوه البيت. والتسجيلات تگول محركين، مو واحد.' },
      { s: 'anji', e: 'determined', t: 'زفيرو حچى مرة وحدة وانطفى. والتفحيط اللي بالمقطع؟ محرك ثاني، بعدين.' },
      { s: 'marius', e: 'thinking', t: 'يعني الصوت صدگ… بس الكلام اللي تحته مو صدگ.', act: [{ pose: 'marius', anim: 'think', for: 1200 }] },
      { s: 'anji', e: 'smirk', t: 'بالضبط. المقطع ما يكذب. اللي كتب تحته هو اللي كذب.' },
      { s: 'marius', e: 'smile', t: 'زين. هسه نعرف شنو مو صدگ. باقي نعرف منو.' },
    ],
    's3.03-desk-done': [{ s: 'anji', e: 'smile', t: 'محركين. ثابت.' }],
    's3.03-later': [{ s: 'anji', e: 'thinking', t: 'بعدين. الأصوات ما راح تهرب.' }],
  },
};
