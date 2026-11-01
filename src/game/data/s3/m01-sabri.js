/**
 * Season 3 «أصداء الـV8», Mission 01 — «صبري ولسانه الطويل» (s3-01; docs/season-3/SEASON_3_DESIGN.md §5,
 * PUZZLE_SPECIFICATIONS.md P-01). A mission module (data/s3/index.js): everything the mission adds lives here.
 *
 * «عيادة الورد», morning. Sabri — Ryan's friend and coworker (canon), here as a visitor for his own driving-licence
 * medical report — has spent an hour reading the clinic's visitor log, and counted five visits by Ryan. He asks Anji.
 * Her answer is the player's (decision `sabri-reply`), and it is what Sabri will repeat (Mission 04). Marius walks in
 * (her answer to him: `marius-honest`), confirms the report story — and asks the one question that sinks her: why did
 * Ryan go back? She gathers the clinic's records and proves the week (P-01, strict, two stages). Sabri deflates — and
 * lets slip that he already sent his count to «شباب الكراج».
 *
 * Decisions made here, each read at once (and later): sabri-reply (Sabri's reply; his admission at the end),
 * marius-honest (Marius's answer; his last line). Fiction written for the game: every record, habit and time.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3, S3_OPEN } from './constants.js';

const F = (k) => `s3:01-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPENED = flag('opened'); // the morning has been seen
const ASKED = flag('asked'); // Sabri asked his question
const MARIUS = flag('marius-in'); // Marius has walked in
const SOLVED = flag('solved'); // the week is proven
const DONE = flag('done'); // Sabri has owned up
/** The records she needs on the counter before she can lay out the week (evidence ids). */
export const RECORDS = ['e-visitor-log', 'e-appointments', 'e-test-schedule', 'e-print-queue', 'e-lama-note'];
const HAS_RECORDS = RECORDS.map((e) => `ev3:${e}`);
const ONCE = (key) => ({ if: `!seen:dlg:${key}`, then: [{ say: key }] });

/* ── the clinic, drawn (no new art to bake) ── */
const X = { door: 70, bench: 300, desk: 560, counter: 690, board: 820, printer: 950, doctor: 1110, coffee: 1300 };
function receptionDesk(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#d8c3a0';
  ctx.fillRect(x - 70, GROUND - 58, 140, 58);
  ctx.fillStyle = '#c3aa82';
  ctx.fillRect(x - 74, GROUND - 64, 148, 8);
  ctx.fillStyle = '#e86a8a'; // the clinic's rose stripe
  ctx.fillRect(x - 70, GROUND - 40, 140, 5);
  // the visitor log, open
  ctx.fillStyle = '#f6efe0';
  ctx.fillRect(x - 46, GROUND - 72, 36, 10);
  ctx.fillRect(x - 8, GROUND - 72, 36, 10);
  ctx.strokeStyle = '#7a6448';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 42, GROUND - 70 + i * 3);
    ctx.lineTo(x - 14, GROUND - 70 + i * 3);
    ctx.moveTo(x - 4, GROUND - 70 + i * 3);
    ctx.lineTo(x + 24, GROUND - 70 + i * 3);
    ctx.stroke();
  }
  ctx.restore();
}
function counterTable(ctx, x, laidOut) {
  ctx.save();
  ctx.fillStyle = '#b98a5a';
  ctx.fillRect(x - 44, GROUND - 46, 88, 8);
  ctx.fillRect(x - 38, GROUND - 38, 6, 38);
  ctx.fillRect(x + 32, GROUND - 38, 6, 38);
  if (laidOut) {
    // the week, laid out: six slips in a row and the printed report
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#f6efe0' : '#efe4cf';
      ctx.fillRect(x - 40 + i * 13, GROUND - 52, 11, 7);
    }
  }
  ctx.restore();
}
function noticeBoard(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#9a6f45';
  ctx.fillRect(x - 40, GROUND - 150, 80, 64);
  ctx.fillStyle = '#c99b66';
  ctx.fillRect(x - 36, GROUND - 146, 72, 56);
  ctx.fillStyle = '#f6efe0';
  ctx.fillRect(x - 30, GROUND - 140, 30, 22);
  ctx.fillRect(x + 4, GROUND - 136, 26, 30);
  ctx.fillStyle = '#e86a8a';
  for (const [px, py] of [[x - 15, GROUND - 140], [x + 17, GROUND - 136]]) {
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function printer(ctx, x, t, sheet) {
  ctx.save();
  ctx.fillStyle = '#5b6070';
  ctx.fillRect(x - 30, GROUND - 74, 60, 30);
  ctx.fillStyle = '#7a8090';
  ctx.fillRect(x - 30, GROUND - 78, 60, 6);
  ctx.fillStyle = '#41444f';
  ctx.fillRect(x - 34, GROUND - 44, 68, 44);
  // the ready light, blinking
  ctx.fillStyle = Math.sin(t * 4) > 0 ? '#7fe07f' : '#2f5a2f';
  ctx.fillRect(x + 18, GROUND - 70, 5, 4);
  if (sheet) {
    ctx.fillStyle = '#f8f5ec';
    ctx.fillRect(x - 18, GROUND - 92, 30, 18);
    ctx.fillStyle = '#c8c2b0';
    ctx.fillRect(x - 14, GROUND - 88, 18, 1.4);
    ctx.fillRect(x - 14, GROUND - 84, 22, 1.4);
  }
  ctx.restore();
}
function doctorDesk(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(x - 54, GROUND - 52, 108, 10);
  ctx.fillRect(x - 48, GROUND - 42, 8, 42);
  ctx.fillRect(x + 40, GROUND - 42, 8, 42);
  // the appointment book, and a stethoscope
  ctx.fillStyle = '#2f5a8a';
  ctx.fillRect(x - 30, GROUND - 60, 30, 8);
  ctx.strokeStyle = '#9aa3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 20, GROUND - 58, 7, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}
function coffeeCorner(ctx, x, t) {
  ctx.save();
  ctx.fillStyle = '#6b4a3a';
  ctx.fillRect(x - 24, GROUND - 60, 48, 60);
  ctx.fillStyle = '#2b2b33';
  ctx.fillRect(x - 14, GROUND - 92, 28, 32);
  ctx.fillStyle = '#f2f2f7';
  for (let i = 0; i < 2; i++) {
    const f = (t * 0.6 + i / 2) % 1;
    ctx.globalAlpha = 0.6 * (1 - f);
    ctx.beginPath();
    ctx.arc(x + (i ? 4 : -3), GROUND - 96 - f * 18, 3 + f * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function roseVase(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#7fa8c8';
  ctx.fillRect(x - 5, GROUND - 82, 10, 16);
  ctx.fillStyle = '#e0567f';
  for (const [dx, dy] of [[-4, -88], [3, -92], [0, -86]]) {
    ctx.beginPath();
    ctx.arc(x + dx, GROUND + dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ── the scene ── */
const S3_CLINIC = {
  id: 's3-clinic',
  title: 'عيادة الورد',
  theme: 'academy',
  music: 'calm',
  width: 1460,
  spawn: 150,
  seed: 3101,
  props: [{ type: 'bench', x: X.bench }, { type: 'bookshelf', x: 1400, w: 60, h: 130 }],
  actors: [
    // Sabri on the waiting bench, the log's page in his head; he stands once he has asked
    { id: 'sabri', kind: 'sabri', x: X.bench + 10, facing: 1, mood: 'thinking' },
    // Lama behind the reception desk
    { id: 'lama', kind: 'lama', x: X.desk + 30, facing: -1 },
    // Rabi' by the coffee (he signs the log every time he steps out)
    { id: 'rabi', kind: 'rabi', x: X.coffee - 40, facing: -1 },
    // Marius, once he has walked in (on a later visit he is simply here)
    { id: 'marius', kind: 'marius', x: X.bench + 120, facing: 1, if: MARIUS },
  ],
  dynamic: [
    { x: X.desk, reach: 90, draw: (ctx) => receptionDesk(ctx, X.desk) },
    { x: X.counter, reach: 60, draw: (ctx, { game }) => counterTable(ctx, X.counter, game.flag(F('solved'))) },
    { x: X.board, reach: 60, draw: (ctx) => noticeBoard(ctx, X.board) },
    { x: X.printer, reach: 50, draw: (ctx, { game, t }) => printer(ctx, X.printer, t, !game.has('s3.ev.e-print-queue')) },
    { x: X.doctor, reach: 70, draw: (ctx) => doctorDesk(ctx, X.doctor) },
    { x: X.coffee, reach: 40, draw: (ctx, { t }) => coffeeCorner(ctx, X.coffee, t) },
    { x: X.desk + 60, reach: 20, draw: (ctx) => roseVase(ctx, X.desk + 60) },
    { x: X.door, reach: 40, draw: (ctx, { P }) => P.door(ctx, X.door, GROUND, { color: '#7a5a6a', sign: 'عيادة الورد' }) },
  ],
  triggers: [
    {
      id: 'open',
      x1: 100,
      x2: 460,
      if: [S3_OPEN, `!${OPENED}`],
      run: [
        { letterbox: true },
        { camera: 520, ms: 900 },
        // the morning, acted before a word: Rabi' signs the log on his way out for coffee; Sabri counts on his
        // fingers; Lama hides a smile behind a file
        { move: 'rabi', x: X.desk - 30, speed: 140 },
        { all: [{ pose: 'rabi', anim: 'point', for: 700 }, { sfx: 'paper' }, { bubble: 'rabi', text: '«ر.» — گهوة، وراجع.', ms: 1600 }] },
        { move: 'rabi', x: X.coffee - 40, speed: 160, async: true },
        { all: [{ pose: 'sabri', anim: 'think', for: 1600 }, { bubble: 'sabri', text: '… ثلاثة، أربعة… خمسة!', ms: 1800 }] },
        { all: [{ pose: 'lama', anim: 'facepalm', for: 1400 }, { sfx: 'giggle' }] },
        { camera: null, ms: 400 },
        { letterbox: false },
        { say: 's3.01-open' },
        { fx: OPENED, quiet: true },
      ],
    },
  ],
  interact: [
    {
      id: 'sabri',
      actor: 'sabri',
      x: X.bench + 10,
      w: 50,
      h: 120,
      label: 'صبري',
      icon: '💬',
      cases: [
        // his question; her answer; then Marius walks in
        {
          if: `!${ASKED}`,
          run: [
            { face: 'sabri', dir: 1 },
            { say: 's3.01-sabri-asks' },
            { fx: [ASKED, 'ev3:e-sabri-count'], quiet: true },
            { letterbox: true },
            { sfx: 'paper' },
            { spawn: { id: 'marius', kind: 'marius', x: X.door - 30, facing: 1 } },
            { move: 'marius', x: X.bench + 120, speed: 130 },
            { all: [{ face: 'sabri', dir: -1 }, { face: 'lama', dir: -1 }, { jolt: 'sabri', type: 'hop' }] },
            { letterbox: false },
            { say: 's3.01-marius' },
            { fx: MARIUS, quiet: true },
          ],
        },
        // the week proven: he owns up (and his zip-my-lips promise)
        {
          if: [SOLVED, `!${DONE}`],
          run: [
            { say: 's3.01-sabri-admits' },
            { all: [{ pose: 'sabri', anim: 'facepalm', for: 1200 }, { bubble: 'sabri', text: '🤐', ms: 1600 }] },
            { fx: ['ev3:e-group-msg', DONE] },
          ],
        },
        { if: DONE, run: [{ say: 's3.01-sabri-after' }] },
        { run: [{ say: 's3.01-sabri-waits' }] },
      ],
    },
    {
      id: 'marius',
      actor: 'marius',
      x: X.bench + 120,
      w: 56,
      h: 140,
      label: 'ماريوس',
      icon: '💬',
      if: MARIUS,
      cases: [
        { if: DONE, run: [{ say: 's3.01-marius-after' }] },
        { run: [{ say: 's3.01-marius-waits' }] },
      ],
    },
    {
      id: 'lama',
      actor: 'lama',
      x: X.desk + 30,
      w: 50,
      h: 120,
      label: 'لمى',
      icon: '💬',
      cases: [
        // after Marius: Lama's own observation (she notices things), and her challenge
        { if: [MARIUS, '!ev3:e-lama-note'], run: [{ say: 's3.01-lama-note' }, { fx: 'ev3:e-lama-note' }] },
        { if: MARIUS, run: [{ say: 's3.01-lama-again' }] },
        { run: [{ say: 's3.01-lama-early' }] },
      ],
    },
    {
      id: 'log',
      x: X.desk - 30,
      w: 70,
      h: 80,
      label: 'سجل الزوار',
      icon: '📖',
      cases: [
        { if: [MARIUS, '!ev3:e-visitor-log'], run: [{ pose: 'anji', anim: 'think', for: 500 }, { sfx: 'paper' }, { say: 's3.01-log' }, { fx: 'ev3:e-visitor-log' }] },
        { if: MARIUS, run: [{ say: 's3.01-log-again' }] },
        { run: [{ say: 's3.01-log-early' }] },
      ],
    },
    {
      id: 'board',
      x: X.board,
      w: 80,
      h: 90,
      label: 'لوحة الإعلانات',
      icon: '📌',
      cases: [
        { if: [MARIUS, '!ev3:e-test-schedule'], run: [{ say: 's3.01-board' }, { fx: 'ev3:e-test-schedule' }] },
        { run: [{ say: 's3.01-board-again' }] },
      ],
    },
    {
      id: 'printer',
      x: X.printer,
      w: 70,
      h: 90,
      label: 'الطابعة',
      icon: '🖨️',
      cases: [
        { if: [MARIUS, '!ev3:e-print-queue'], run: [{ sfx: 'printer' }, { say: 's3.01-printer' }, { sfx: 'paper' }, { fx: 'ev3:e-print-queue' }] },
        { run: [{ say: 's3.01-printer-again' }] },
      ],
    },
    {
      id: 'appointments',
      x: X.doctor,
      w: 90,
      h: 80,
      label: 'دفتر المواعيد',
      icon: '📅',
      cases: [
        { if: [MARIUS, '!ev3:e-appointments'], run: [{ sfx: 'paper' }, { say: 's3.01-appointments' }, { fx: 'ev3:e-appointments' }] },
        { run: [{ say: 's3.01-appointments-again' }] },
      ],
    },
    {
      id: 'counter',
      x: X.counter,
      w: 80,
      h: 70,
      label: 'الطاولة',
      icon: '🗂️',
      if: MARIUS,
      cases: [
        { if: SOLVED, run: [{ say: 's3.01-counter-done' }] },
        { if: { not: HAS_RECORDS }, run: [{ say: 's3.01-counter-wait' }] },
        {
          run: [
            // the first time: Sabri comes round to the far side of the counter (clear of Lama), and arrives before a
            // word — a walk tied to a line would stop where the line was tapped away
            { if: '!seen:dlg:s3.01-counter-intro', then: [{ move: 'sabri', x: X.counter + 65, speed: 220 }, { say: 's3.01-counter-intro' }] },
            { puzzle: 's3-office', then: [{ say: 's3.01-solved' }, { fx: ['ev3:d-office', SOLVED] }], else: [{ say: 's3.01-later' }] },
          ],
        },
      ],
    },
    {
      id: 'rabi',
      actor: 'rabi',
      x: X.coffee - 40,
      w: 50,
      h: 120,
      label: 'ربيع',
      icon: '☕',
      cases: [{ run: [{ say: 's3.01-rabi' }] }],
    },
  ],
  exits: [],
  ambient: [{ t: 'ريحة گهوة وكحول تعقيم، وصوت طابعة تتنفس.' }],
};

/* ── the puzzle: «إعادة بناء الأسبوع» (P-01) ── */
const WHO = [
  { id: 'ryan', label: 'ريان', icon: 'car' },
  { id: 'rabi', label: 'ربيع', icon: 'coffee' },
  { id: 'sabri', label: 'صبري', icon: 'stethoscope' },
  { id: 'none', label: 'ما چانت زيارة', icon: 'note' },
];
const KIND = [
  { id: 'happened', label: 'صار — سجل يثبته', icon: 'note' },
  { id: 'saw', label: 'شافه بعينه — ما بيه سجل، بس چان حاضر', icon: 'mark' },
  { id: 'assumed', label: 'افترضه — لا سجل ولا شاهد', icon: 'moon-crescent' },
  { id: 'passed', label: 'نقله — حچاه لغيره', icon: 'heart' },
];
const card = (id, label, note, bin) => ({ id, label, note, accepts: [bin] });
/** (exported for the tests: the intended placement of every card) */
export const OFFICE_ANSWER = {
  l1: 'ryan', l2: 'rabi', l3: 'rabi', l4: 'ryan', l5: 'sabri', l6: 'rabi', sheet: 'none',
  c1: 'happened', c2: 'happened', c3: 'saw', c4: 'assumed', c5: 'assumed', c6: 'passed',
};
const OFFICE = {
  type: 'sort',
  title: 'إعادة بناء الأسبوع',
  goal: 'رتّبي الأسبوع من السجلات: منو كتب كل سطر، وشنو نوع كل كلام صبري.',
  intro: 'دفتر واحد للزوار وللموظفين لمن يطلعون. وكل واحد يوقّع بحرف.',
  config: {
    stages: [
      {
        kind: 'sort',
        prompt: 'كل سطر بالسجل (والورقة اللي بالطابعة)، منو؟',
        bins: WHO,
        cards: [
          card('l1', 'الأحد ٩:١٠ — «ر.» — تقرير طبي', 'سطر بسجل الزوار.', OFFICE_ANSWER.l1),
          card('l2', 'الأحد ١:٣٠ — «ر.» — گهوة', 'سطر بسجل الزوار.', OFFICE_ANSWER.l2),
          card('l3', 'الثلاثاء ١٢:٠٥ — «ر.» — تقرير', 'سطر بسجل الزوار.', OFFICE_ANSWER.l3),
          card('l4', 'الأربعاء ٤:٤٠ — «ر.» — توقيع', 'سطر بسجل الزوار.', OFFICE_ANSWER.l4),
          card('l5', 'الخميس ٩:٠٠ — «ص.» — تقرير طبي', 'سطر بسجل الزوار.', OFFICE_ANSWER.l5),
          card('l6', 'الخميس ٩:٠٢ — «ر.» — گهوة', 'سطر بسجل الزوار.', OFFICE_ANSWER.l6),
          card('sheet', 'تقرير ريان — «طُبع الخميس ٩:٠٤»', 'الورقة اللي لگيتها بالطابعة.', OFFICE_ANSWER.sheet),
        ],
      },
      {
        kind: 'sort',
        prompt: 'وكلام صبري: كل جملة، من أي نوع؟',
        bins: KIND,
        cards: [
          card('c1', '«ريان سجّل بالسجل الأحد ٩:١٠»', 'صبري.', OFFICE_ANSWER.c1),
          card('c2', '«ريان رجع الأربعاء»', 'صبري.', OFFICE_ANSWER.c2),
          card('c3', '«لمى ضحكت لمن جبت طاري ريان»', 'صبري.', OFFICE_ANSWER.c3),
          card('c4', '«ريان جه اليوم هم»', 'صبري.', OFFICE_ANSWER.c4),
          card('c5', '«ريان يجي هنا خمس مرات بالأسبوع»', 'صبري.', OFFICE_ANSWER.c5),
          card('c6', '«گلت لشباب الكراج إن ريان ساكن بالعيادة»', 'صبري.', OFFICE_ANSWER.c6),
        ],
      },
    ],
    labels: { check: 'هيچ صار الأسبوع ✔' },
  },
  success: 'ريان إجا مرتين، ولكل مرة سبب. والباقي… گهوة ربيع، وطابعة متأخرة يوم كامل.',
  reward: [],
};

/* ── the module ── */
export default {
  id: 'm01',
  missions: [
    {
      id: 's3-01',
      kind: 'story',
      pack: PACK_S3,
      act: 1,
      day: 1,
      world: ['s3-clinic'],
      title: 'صبري ولسانه الطويل',
      where: 'عيادة الورد',
      summary: 'صبري إجا للعيادة ياخذ تقرير طبي… وصارله ساعة يقرا سجل الزوار. وعنده سؤال.',
      unlock: S3_OPEN,
      locked: 'ينفتح بعد نهاية «حقيقة البطاقة».',
      // steps say what to do, never which line is whose
      steps: [
        { done: ASKED, world: 's3-clinic', text: 'صبري عنده سؤال… واضح من باوعته.' },
        { done: HAS_RECORDS, world: 's3-clinic', text: 'سجلات العيادة تحچي غير شي. لمّيها.' },
        { done: SOLVED, world: 's3-clinic', text: 'رتّبي الأسبوع من السجلات، على الطاولة.' },
        { done: DONE, world: 's3-clinic', text: 'رجعي لصبري ويا اللي طلع.' },
      ],
      reward: ['journal:s3-sabri'],
      rewardText: 'خمس زيارات… ولا وحدة',
      leadsTo: ['s3-02'],
    },
  ],
  evidence: {
    'e-visitor-log': { rel: 'fact', source: 'clinic-records', icon: 'note', label: 'سجل الزوار', note: 'دفتر واحد للزوار وللموظفين لمن يطلعون. ستة أسطر من الأحد لليوم: خمسة موقّعة «ر.» وواحد «ص.».' },
    'e-appointments': { rel: 'fact', source: 'clinic-records', icon: 'note', label: 'دفتر المواعيد', note: 'ريان: الأحد ٩:١٥ «فحص»، والأربعاء ٤:٣٠ «توقيع الطبيب — ما چان موجود الأحد». صبري: الخميس ٩:١٥.' },
    'e-test-schedule': { rel: 'fact', source: 'clinic-records', icon: 'car', label: 'جدول فحص السياقة', note: 'فحص ريان: الخميس ١١:٠٠. «لازم تقرير طبي موقّع».' },
    'e-print-queue': { rel: 'fact', source: 'clinic-records', icon: 'note', label: 'ورقة طابور الطابعة', note: '«تقرير — ريان»: انرسل الأربعاء ٤:٤٥… انحشر الورق… انطبع الخميس ٩:٠٤.' },
    'e-lama-note': { rel: 'fact', source: 'lama', icon: 'mark', label: 'ملاحظة لمى', note: '«ربيع يكتب بس «ر.»، كسلان. يطلع للگهوة كل يوم، وأيام الثلاثاء يجيب تقارير المختبر.»' },
    'e-sabri-count': { rel: 'claim', source: 'sabri', icon: 'stethoscope', label: 'عدّ صبري', note: '«ريان: الأحد، الأحد، الثلاثاء، الأربعاء، اليوم!! خمس مرات بأسبوع 😏»', disprovedBy: 'd-office' },
    'e-group-msg': { rel: 'fact', source: 'sabri', icon: 'heart', label: 'رسالة صبري للكروب', note: 'بكروب «شباب الكراج»: «ريان ساكن بالعيادة 😂». الرسالة موجودة… مو يعني صحيحة.' },
    'd-office': { rel: 'deduction', source: 'clinic-records', icon: 'mark', label: 'الأسبوع الحقيقي', note: 'ريان إجا مرتين، ولسبب: الفحص الأحد، والتوقيع الأربعاء. الباقي ربيع، وطابعة متأخرة.' },
  },
  decisions: {
    // 01: her answer to Sabri — read at once (his reply; his admission), and in 04 and 08 (DECISION_FLOW.md)
    'sabri-reply': ['deny', 'laugh', 'confront'],
    // 01: her answer to Marius — read at once (his answer; his last line), and in 03 and 07
    'marius-honest': ['honest', 'deflect'],
  },
  case: [{ mission: 's3-01', ids: [...RECORDS, 'e-sabri-count', 'e-group-msg', 'd-office'] }],
  journal: {
    's3-sabri': { title: 'خمس زيارات… ولا وحدة', icon: 'stethoscope', text: 'صبري عدّ خمس زيارات لريان. اثنين بس چانت ريان: الفحص والتوقيع. والباقي گهوة ربيع، وطابعة. بس العدّ الغلط… طلع من العيادة.' },
  },
  puzzles: { 's3-office': OFFICE },
  dialogue: {
    's3.01-open': [
      { s: 'anji', e: 'curious', t: 'صباح الخير… صبري؟ شتسوي هنا من الصبح؟' },
      { s: 'lama', e: 'smile', t: 'إجا ياخذ تقرير طبي لفحص السياقة. وصارله ساعة يقرا سجل الزوار.', act: [{ pose: 'lama', anim: 'facepalm', for: 1000 }] },
      { s: 'sabri', e: 'smile', t: 'أقرا وأتعلم. السجلات ما تچذب.', act: [{ pose: 'sabri', anim: 'point', for: 900 }] },
    ],
    's3.01-sabri-asks': [
      { s: 'sabri', e: 'smile', t: 'أنجي، سؤال بس لا تعصبين…', act: [{ pose: 'sabri', anim: 'handsup', for: 800 }] },
      { s: 'sabri', e: 'suspicious', t: 'واضح عندچ معزة خاصة يم ريان. ماكو شخص يتردد لعندچ بالسر ويسوي المستحيل حتى يشوفچ!', act: [{ pose: 'sabri', anim: 'point', for: 1200 }, { jolt: 'sabri', type: 'lunge' }] },
      { s: 'anji', e: 'shy', t: '…', act: [{ puff: 'anji', type: 'blush', ms: 2600 }, { jolt: 'anji', type: 'tilt' }, { face: 'anji', dir: -1 }] },
      {
        s: 'anji',
        choice: [
          {
            t: 'لا… لا لا! ريان مجرد صديق أخوية ماريوس. چان جاي علمود اختبار القيادة، يريد تقرير طبي!',
            do: ['dec3:sabri-reply=deny'],
            then: [
              { s: 'sabri', e: 'suspicious', t: 'إي طبعاً… تقرير طبي يحتاج كل هالزيارات؟', act: [{ pose: 'sabri', anim: 'cross', for: 1200 }] },
              { s: 'anji', e: 'pout', t: 'صبري! خلص عاد!', act: [{ puff: 'anji', type: 'blush', ms: 1800 }, { jolt: 'anji', type: 'shake' }] },
            ],
          },
          {
            t: '(تضحك) صبري… إنت لازم تشتغل محقق. محقق فاشل، بس محقق.',
            do: ['dec3:sabri-reply=laugh'],
            then: [
              { s: 'sabri', e: 'surprised', t: 'ضحكتي! يعني… صدگ؟!', act: [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'handsup', for: 900 }] },
              { s: 'anji', e: 'laugh', t: 'لا. يعني إنت مضحك.', act: [{ puff: 'anji', type: 'blush', ms: 1400 }] },
            ],
          },
          {
            t: 'منو گلك تعد زيارات الناس؟',
            do: ['dec3:sabri-reply=confront'],
            then: [
              { s: 'sabri', e: 'worried', t: 'لا لا… مو قصدي… بس السجل مفتوح، وآني چنت ضجران…', act: [{ pose: 'sabri', anim: 'shrug', for: 1200 }, { puff: 'sabri', type: 'sweat', ms: 1800 }] },
              { s: 'anji', e: 'determined', t: 'السجل مو إلك، صبري.' },
            ],
          },
        ],
      },
      { s: 'narrator', t: '(لمى تحاول ما تضحك. وتفشل.)', act: [{ pose: 'lama', anim: 'facepalm', for: 1400 }, { sfx: 'giggle' }] },
      { s: 'sabri', e: 'smile', t: 'آني ما أحچي من راسي. عندي أدلة. شوفي.', act: [{ pose: 'sabri', anim: 'point', for: 900 }] },
      { s: 'narrator', t: '(يمد تلفونه. ملاحظة: «ريان: الأحد، الأحد، الثلاثاء، الأربعاء، اليوم!! خمس مرات بأسبوع 😏»)' },
    ],
    's3.01-marius': [
      { s: 'marius', e: 'smile', t: 'شنو صاير؟ ليش كلكم صافنين بيّه؟', act: [{ pose: 'marius', anim: 'cross', for: 1400 }] },
      { s: 'sabri', e: 'surprised', t: 'ماريوس! … ولا شي. سؤال علمي.', act: [{ puff: 'sabri', type: 'sweat', ms: 1600 }] },
      {
        s: 'anji',
        choice: [
          {
            t: 'صبري يعد زيارات ريان للعيادة.',
            do: ['dec3:marius-honest=honest'],
            then: [
              { s: 'marius', e: 'laugh', t: 'ههه! صبري… ريان چان وياي الأحد. يريد تقرير لفحص السياقة.', act: [{ pose: 'marius', anim: 'laugh', for: 1200 }] },
              { s: 'sabri', e: 'thinking', t: '… وبعدين؟' },
              { s: 'marius', e: 'thinking', t: 'بس… التقرير أخذه من أول مرة. ليش رجع؟', act: [{ pose: 'marius', anim: 'think', for: 1400 }] },
            ],
          },
          {
            t: 'ولا شي… شغل.',
            do: ['dec3:marius-honest=deflect'],
            then: [
              { s: 'marius', e: 'suspicious', t: 'شغل؟ وصبري صاير أحمر… وإنتِ صايرة أحمر أكثر منه؟', act: [{ pose: 'marius', anim: 'cross', for: 1400 }, { puff: 'anji', type: 'blush', ms: 1800 }] },
              { s: 'sabri', e: 'smile', t: 'سؤال بسيط عن ريان! بس!' },
              { s: 'marius', e: 'thinking', t: 'ريان؟ چان وياي الأحد، علمود تقرير السياقة… بس التقرير أخذه من أول مرة. ليش رجع؟', act: [{ pose: 'marius', anim: 'think', for: 1400 }] },
            ],
          },
        ],
      },
      { s: 'anji', e: 'surprised', t: '…', act: [{ puff: 'anji', type: 'blush', ms: 1800 }, { face: 'anji', dir: -1 }] },
      { s: 'anji', e: 'determined', t: 'تعرفون شنو؟ السجلات تجاوب. خلّي أشوف بعيني.', act: [{ jolt: 'anji', type: 'nod' }] },
      { s: 'lama', e: 'smile', t: 'السجل عندي، والمواعيد عند الدكتور، واللوحة على الحايط… والطابعة، الله يعينچ ويا الطابعة.' },
    ],
    's3.01-log-early': [{ s: 'anji', e: 'thinking', t: 'سجل الزوار. صبري ما يرفع عينه منه.' }],
    's3.01-log': [
      { s: 'anji', e: 'thinking', t: 'دفتر واحد للزوار، وللموظفين لمن يطلعون. خمسة أسطر موقّعة «ر.»… وواحد «ص.».' },
      { s: 'anji', e: 'skeptical', t: 'حرف واحد. وصبري گرا الحرف وكمّل القصة من راسه.' },
    ],
    's3.01-log-again': [{ s: 'anji', e: 'thinking', t: 'نفس الأسطر. الحرف ما يتغيّر… السؤال منو كتبه.' }],
    's3.01-board': [
      { s: 'anji', e: 'curious', t: 'جدول فحص السياقة… فحص ريان الخميس ١١:٠٠. وتحته: «لازم تقرير طبي موقّع».' },
    ],
    's3.01-board-again': [{ s: 'anji', e: 'thinking', t: 'اللوحة. مواعيد، وورقة ضايعة عن قطة الجيران.' }],
    's3.01-printer': [
      { s: 'narrator', t: '(الطابعة تطگطگ… وتطلع ورقة بطيئة.)', act: [{ jolt: 'anji', type: 'hop' }] },
      { s: 'anji', e: 'surprised', t: 'تقرير ريان، بتوقيع الطبيب. وأسفله: «طُبع الخميس ٩:٠٤».' },
      { s: 'anji', e: 'thinking', t: 'وهاي ورقة صغيرة طالعة ويّاه… «انرسل الأربعاء ٤:٤٥… انحشر الورق».' },
    ],
    's3.01-printer-again': [{ s: 'anji', e: 'smirk', t: 'الطابعة ساكتة. هسه.' }],
    's3.01-appointments': [
      { s: 'anji', e: 'thinking', t: 'دفتر المواعيد. ريان: الأحد ٩:١٥ «فحص»… والأربعاء ٤:٣٠ «توقيع الطبيب — ما چان موجود الأحد».' },
      { s: 'anji', e: 'curious', t: 'وصبري: الخميس ٩:١٥. اليوم.' },
    ],
    's3.01-appointments-again': [{ s: 'anji', e: 'thinking', t: 'مواعيد. كل وحدة إلها سبب مكتوب.' }],
    's3.01-lama-early': [{ s: 'lama', e: 'smile', t: 'لا تسأليني. آني بس أشوف وأضحك.' }],
    's3.01-lama-note': [
      { s: 'lama', e: 'smile', t: 'تريدين شي ما مكتوب بأي سجل؟ آني أشوف هالمكان كل يوم.' },
      { s: 'lama', e: 'thinking', t: 'ربيع يكتب بس «ر.»… كسلان. يطلع للگهوة كل يوم. وأيام الثلاثاء يروح يجيب تقارير المختبر.', act: [{ pose: 'lama', anim: 'think', for: 1200 }] },
      { s: 'lama', e: 'suspicious', t: 'بس لا تستعجلين ويا ريان هم. الحرف ما يحچي. التاريخ يحچي.' },
      { s: 'narrator', t: '(لمى تكتبها على ورقة وتنطيها لأنجي.)' },
    ],
    's3.01-lama-again': [{ s: 'lama', e: 'smile', t: 'الحرف ما يحچي. التاريخ يحچي. والسبب يحچي أكثر.' }],
    's3.01-rabi': [
      { s: 'rabi', e: 'smile', t: 'گهوة؟ آني طالع للمرة الثالثة اليوم. لا تگولين للدكتور.', act: [{ pose: 'rabi', anim: 'shrug', for: 900 }] },
    ],
    's3.01-sabri-waits': [{ s: 'sabri', e: 'suspicious', t: 'خمسة، أنجي. خمسة. الأرقام ما تچذب.', act: [{ pose: 'sabri', anim: 'point', for: 900 }] }],
    's3.01-marius-waits': [{ s: 'marius', e: 'smile', t: 'آني گاعد. أريد أشوف شلون تنتهي هاي.', act: [{ pose: 'marius', anim: 'cross', for: 1200 }] }],
    's3.01-counter-wait': [{ s: 'anji', e: 'thinking', t: 'بعدني ناقصني سجلات. ما أرتب أسبوع بنصه.' }],
    's3.01-counter-intro': [
      { s: 'narrator', t: '(أنجي تفرش السجلات على الطاولة. صبري يلف ويگرب من الصوب الثاني. ماريوس يگرب أكثر.)' },
    ],
    's3.01-later': [{ s: 'anji', e: 'thinking', t: 'بعدين أرتبها. السجلات ما راح تهرب.' }],
    's3.01-counter-done': [{ s: 'anji', e: 'smile', t: 'الأسبوع مرتب. والطاولة بعد بيها ريحة گهوة ربيع.' }],
    's3.01-solved': [
      { s: 'anji', e: 'smirk', t: 'ريان إجا مرتين، صبري. الأحد للفحص… والأربعاء للتوقيع، لأن الطبيب ما چان موجود.' },
      { s: 'anji', e: 'smile', t: 'والباقي؟ گهوة ربيع. وطابعة متأخرة يوم كامل.' },
      { s: 'sabri', e: 'surprised', t: '…ربيع؟', act: [{ jolt: 'sabri', type: 'squash' }] },
      { s: 'rabi', e: 'smile', t: 'إي؟ نادوني؟', act: [{ jolt: 'rabi', type: 'hop' }] },
      { s: 'marius', e: 'laugh', t: 'وجوابي هم طلع. رجع علمود التوقيع.', act: [{ pose: 'marius', anim: 'laugh', for: 1200 }] },
    ],
    's3.01-sabri-admits': [
      { s: 'sabri', e: 'worried', t: 'طيب طيب… غلطت بالعد. بس…', act: [{ pose: 'sabri', anim: 'shrug', for: 1000 }] },
      { if: 'dec3:sabri-reply=deny', then: [{ s: 'sabri', e: 'worried', t: 'آني چنت كاتب بكروب «شباب الكراج»: «ريان ساكن بالعيادة». وكتبت هم… شنو گلتي عنه.' }, { s: 'anji', e: 'surprised', t: 'شنو گلت عنه؟!', act: [{ puff: 'anji', type: 'blush', ms: 2000 }] }, { s: 'sabri', e: 'worried', t: '«مجرد صديق أخوية ماريوس»… بالحرف.' }] },
      { if: 'dec3:sabri-reply=laugh', then: [{ s: 'sabri', e: 'worried', t: 'آني چنت كاتب بكروب «شباب الكراج»: «ريان ساكن بالعيادة». وكتبت هم… إنچ ضحكتي.' }, { s: 'anji', e: 'pout', t: 'وشنو يعني ضحكت؟', act: [{ puff: 'anji', type: 'blush', ms: 1600 }] }, { s: 'sabri', e: 'worried', t: 'هسه… ما أعرف شنو فهموا منها.' }] },
      { if: 'dec3:sabri-reply=confront', then: [{ s: 'sabri', e: 'worried', t: 'آني چنت كاتب بكروب «شباب الكراج»: «ريان ساكن بالعيادة». وكتبت هم… إنچ زعلتي.' }, { s: 'anji', e: 'determined', t: 'صبري!' }, { s: 'sabri', e: 'worried', t: 'هسه أمسحها! …ما تنمسح. صار لها ساعة.' }] },
      { s: 'sabri', e: 'shy', t: 'من هسه، آني قبر. ولا كلمة.', act: [{ pose: 'sabri', anim: 'facepalm', for: 900 }] },
      { s: 'lama', e: 'suspicious', t: 'سمعناها قبل، صبري.' },
    ],
    's3.01-sabri-after': [{ s: 'sabri', e: 'shy', t: 'قبر. ولا كلمة. …بس سؤال صغير—', act: [{ bubble: 'lama', text: 'صبري!', ms: 1200 }] }],
    's3.01-marius-after': [
      { if: 'dec3:marius-honest=honest', then: [{ s: 'marius', e: 'smile', t: 'شكراً لأنچ گلتيلي من أول. صبري يحچي… بس إنتِ تحچين الصح.', act: [{ pose: 'marius', anim: 'cross', for: 1200 }] }] },
      { if: 'dec3:marius-honest=deflect', then: [{ s: 'marius', e: 'suspicious', t: '«ولا شي… شغل». تذكرتها. المرة الجاية گوليلي من أول، أختي.', act: [{ pose: 'marius', anim: 'cross', for: 1200 }] }] },
    ],
  },
  scenes: [S3_CLINIC],
};
