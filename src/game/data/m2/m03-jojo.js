/**
 * Season 2, M2 — Mission 03 «قصص جوجو الثلاث» (s2-14; docs/season-2/SEASON_2_LIVING_STORY_C1.md §3, owner
 * decisions §8.2–8.3). A mission module (docs/season-2/MISSION_MODULES.md): everything the mission adds lives
 * here, and the M2 registries pick it up; M1's lamphouse (s2-08) stays as first shipped and is only extended,
 * with every addition gated on this mission being open.
 *
 * Uncle Jojo is an embellishing storyteller — harmless motives, never malice. Three versions, acted out in the
 * lamphouse (ui/testimony.js); only evidence breaks one:
 *   v1 «I went for oil»        ← the oil can she lifts: full, its seal intact (e-oilcan)
 *   v2 «nine sharp»            ← the garden clock that was not put forward (e-drift, M1)
 *   v3 «not up the loft in a year» ← his own logbook, found in the dark loft by the light she carries up (e-logbook)
 * His last truth: he forgot the clock (embarrassed), and he kept the eighth lantern unlit because Ryan asked him
 * to — a friend's surprise, kept. Decisions read here: jojo-why (M1, his opening line); made here: jojo-confront
 * (read: his line after, and Mission 05's hooks map). Fiction written for the game.
 */
import { PACK_S2 } from '../missions-s2.js';
import { GROUND } from '../../world/props.js';
import { darkness } from '../../world/lighting.js';

const after = (id) => `flag:mission:${id}`;
const OPEN = after('s2-13');
const MET = 'flag:s2:14-met';
const V1 = 'flag:s2:14-v1';
const V2 = 'flag:s2:14-v2';
const SISTER = 'flag:s2:14-sister';
const LIT_ID = 's2:14-shelf-lit';
const LIT = `flag:${LIT_ID}`;
const TRUTH = 'flag:s2:14-truth';
const LAMP = 's2-lamp';

/* ── drawn on the canvas (no new art to bake) ── */
function oilCan(ctx, x) {
  const y = GROUND;
  ctx.save();
  ctx.fillStyle = '#5b6470';
  ctx.fillRect(x - 18, y - 46, 36, 46);
  ctx.fillStyle = '#727c89';
  ctx.fillRect(x - 18, y - 46, 36, 6);
  ctx.fillRect(x - 18, y - 22, 36, 4);
  ctx.strokeStyle = '#3e454e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 46);
  ctx.quadraticCurveTo(x + 22, y - 62, x + 26, y - 50);
  ctx.stroke();
  ctx.fillStyle = '#9c2f2f'; // the wax seal on the cap
  ctx.beginPath();
  ctx.arc(x - 6, y - 49, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function handLamp(ctx, x, y, lit = true) {
  ctx.save();
  if (lit) {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 40);
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.5)');
    glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 40, y - 40, 80, 80);
  }
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 10, 6, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = lit ? '#ffd98a' : '#8d8a80';
  ctx.fillRect(x - 6, y - 8, 12, 15);
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(x - 7, y + 7, 14, 3);
  ctx.restore();
}
function ladder(ctx, x) {
  ctx.save();
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 16, GROUND);
  ctx.lineTo(x - 10, GROUND - 230);
  ctx.moveTo(x + 16, GROUND);
  ctx.lineTo(x + 10, GROUND - 230);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 1; i < 9; i++) {
    const y = GROUND - i * 26;
    const k = (i * 26) / 230;
    ctx.beginPath();
    ctx.moveTo(x - 16 + 6 * k, y);
    ctx.lineTo(x + 16 - 6 * k, y);
    ctx.stroke();
  }
  ctx.restore();
}
/** The eighth lantern, new, its wick never burnt, a ribbon round its handle. */
function eighthLantern(ctx, x) {
  const y = GROUND - 30;
  ctx.save();
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(x - 14, y - 34, 28, 6);
  ctx.fillStyle = 'rgba(230, 240, 255, 0.55)';
  ctx.fillRect(x - 12, y - 28, 24, 30);
  ctx.strokeStyle = '#c9a25c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 12, y - 28, 24, 30);
  ctx.fillStyle = '#f2efe6'; // the unburnt wick
  ctx.fillRect(x - 1.5, y - 14, 3, 8);
  ctx.strokeStyle = '#d0506a'; // the ribbon
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 40, 7, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 36);
  ctx.lineTo(x - 10, y - 26);
  ctx.moveTo(x + 4, y - 36);
  ctx.lineTo(x + 10, y - 26);
  ctx.stroke();
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(x - 15, y + 2, 30, 5);
  ctx.restore();
}
function shelf(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 50, GROUND - 120, 100, 8);
  ctx.fillRect(x - 46, GROUND - 112, 6, 112);
  ctx.fillRect(x + 40, GROUND - 112, 6, 112);
  ctx.fillStyle = '#2f5d8a'; // the logbook: blue cloth, like the register's ink
  ctx.fillRect(x - 20, GROUND - 146, 30, 26);
  ctx.fillStyle = '#e9e4d8';
  ctx.fillRect(x - 18, GROUND - 144, 3, 22);
  ctx.restore();
}
function hook(ctx, x, lit) {
  ctx.save();
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 4, GROUND - 230, 8, 230);
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 12, GROUND - 160, 7, -Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.restore();
  if (lit) handLamp(ctx, x + 12, GROUND - 140, true);
}

/** The loft is dark: a soft pool around the lamp in her hand, and a wide one once it hangs on the hook. */
const LOFT_DARK = darkness({
  alpha: 0.9,
  lights: ({ game, world }) => [
    world?.player && { x: world.player.x, y: world.player.y - 40, r: /lamp/.test(String(game.flag('s2:hold'))) ? 170 : 44, flicker: 0.4 },
    game.flag(LIT_ID) && { x: HOOK_X + 12, y: GROUND - 140, r: 680, flicker: 0.3 }, // as far as the shelf and the far corner
  ],
});
const HOOK_X = 420;

/* ── the loft (reached by the lamphouse ladder once his second story breaks) ── */
const S2_LOFT = {
  id: 's2-loft',
  title: 'علّية بيت الفانوس',
  theme: 'passage',
  music: 'mystery',
  width: 900,
  spawn: 120,
  seed: 1414,
  props: [],
  dynamic: [
    { x: 120, reach: 60, draw: (ctx) => ladder(ctx, 70) },
    { x: HOOK_X, reach: 80, draw: (ctx, { game }) => hook(ctx, HOOK_X, game.flag(LIT_ID)) },
    { x: 560, reach: 80, draw: (ctx) => shelf(ctx, 560) },
    { x: 740, reach: 50, draw: (ctx) => eighthLantern(ctx, 740) },
    LOFT_DARK,
  ],
  interact: [
    {
      id: 'hook',
      x: HOOK_X,
      w: 50,
      h: 160,
      label: 'حلگة على العمود',
      icon: '🪝',
      cases: [
        { if: `hold:${LAMP}`, run: [{ fx: ['!hold:', LIT], quiet: true }, { all: [{ pose: 'anji', anim: 'point', for: 600 }, { jolt: 'anji', type: 'squash', ms: 300 }, { sfx: 'lantern' }] }, { say: 's2.14-hang' }] },
        { if: LIT, run: [{ say: 's2.14-hook-lit' }] },
        { run: [{ say: 's2.14-hook' }] },
      ],
    },
    {
      id: 'logbook',
      x: 560,
      w: 90,
      h: 150,
      label: 'الرف',
      icon: '📕',
      cases: [
        { if: `!${LIT}`, run: [{ say: 's2.14-dark' }] },
        { if: '!ev:e-logbook', run: [{ pose: 'anji', anim: 'crouch', for: 500 }, { say: 's2.14-logbook' }, { fx: 'ev:e-logbook' }] },
        { run: [{ say: 's2.14-logbook-again' }] },
      ],
    },
    {
      id: 'eighth',
      x: 740,
      w: 50,
      h: 80,
      label: 'شي بالزاوية',
      icon: '🏮',
      cases: [
        { if: `!${LIT}`, run: [{ say: 's2.14-dark' }] },
        { if: '!ev:e-loft', run: [{ jolt: 'anji', type: 'hop' }, { say: 's2.14-eighth' }, { fx: 'ev:e-loft' }] },
        { run: [{ say: 's2.14-eighth-again' }] },
      ],
    },
  ],
  triggers: [{ id: 'arrive', x1: 80, x2: 300, once: false, if: '!flag:s2:in-loft', run: [{ say: 's2.14-loft-enter' }, { fx: 'flag:s2:in-loft' }] }],
  exits: [{ side: 'left', to: 's2-lamphouse', spawn: 1080 }],
  ambient: [{ t: 'خشب يطگطگ… وريحة غبار وفتايل قديمة.' }],
};

/* ── his three versions (the testimony's data: acted out by the people in the lamphouse) ── */
const VERSIONS = [
  {
    id: 'v1',
    title: 'النسخة الأولى',
    intro: [{ camera: { between: ['jojo', 'anji'] }, ms: 500 }, { mood: 'jojo', expr: 'smile' }],
    beats: [
      { id: 'b1', t: 'ليلة الفوانيس چنت هنا، أصلّح الفانوس الرابع.', stage: [{ move: 'jojo', x: 500 }, { pose: 'jojo', anim: 'think', for: 900 }], press: 's2.jv1-press-fix' },
      { id: 'b2', t: 'قبل التسعة بشوية خلص الزيت، فطلعت أجيب زيت من السوگ.', stage: [{ move: 'jojo', x: 330, speed: 120 }, { pose: 'jojo', anim: 'point', for: 900 }], press: 's2.jv1-press-oil' },
      { id: 'b3', t: 'رجعت بعد العشرة، والفوانيس مضوية من وكتها.', stage: [{ move: 'jojo', x: 640 }, { pose: 'jojo', anim: 'shrug', for: 900 }], press: 's2.jv1-press-back' },
      { id: 'b4', t: 'يعني ساعة التسعة ما چنت هنا. وما أشهد على شي ما شفته.', stage: [{ pose: 'jojo', anim: 'cross', for: 1200 }] },
    ],
    breaks: ['b2', 'e-oilcan'],
    deflect: ['s2.jv-deflect-1', 's2.jv-deflect-2', 's2.jv-deflect-3'],
    onWrong: [{ mood: 'jojo', expr: 'smile' }, { jolt: 'jojo', type: 'hop' }],
    broken: [
      { jolt: 'jojo', type: 'shake', ms: 700 },
      { puff: 'jojo', type: 'sweat', ms: 2600 },
      { mood: 'jojo', expr: 'worried' },
      { say: 's2.jv1-broken' },
      { fx: [V1, SISTER], quiet: true },
      // the door: Anji's sister, who heard the raised voices (her own silhouette, a slow sway)
      { spawn: { id: 'sister', kind: 'sister', x: 40, facing: 1, idleFx: 'sway', mood: 'suspicious', notice: { dist: 100, jolt: 'lunge' }, fadeIn: true } },
      { move: 'sister', to: 'anji', gap: 74, speed: 110 },
      { all: [{ face: 'jojo', toward: 'sister' }, { jolt: 'sister', type: 'lunge', ms: 500 }] },
      { say: 's2.jv-sister-arrives' },
    ],
  },
  {
    id: 'v2',
    title: 'النسخة الثانية',
    intro: [{ camera: { between: ['jojo', 'sister'] }, ms: 500 }, { mood: 'jojo', expr: 'smile' }, { pose: 'jojo', anim: 'laugh', for: 900 }, { mood: 'sister', expr: 'suspicious' }],
    beats: [
      { id: 'c1', t: 'صح، ما طلعت. چنت هنا طول الليل، وياي الفوانيس.', stage: [{ pose: 'jojo', anim: 'shrug', for: 900 }] },
      {
        id: 'c2',
        t: 'وبالتسعة بالضبط ولّعت فوانيس الحديقة، مثل كل سنة.',
        // he acts it out so "precisely" that he trips over his own lantern stand
        stage: [{ move: 'jojo', x: 470, speed: 150 }, { jolt: 'jojo', type: 'squash', ms: 500 }, { puff: 'jojo', type: 'dust', ms: 800 }, { mood: 'jojo', expr: 'surprised' }, { pose: 'jojo', anim: 'handsup', for: 700 }, { mood: 'jojo', expr: 'smile' }, { pose: 'jojo', anim: 'point', for: 900 }],
        press: 's2.jv2-press-nine',
      },
      { id: 'c3', t: 'أربعين سنة ولا مرة تأخرت عن موعد الفوانيس.', stage: [{ move: 'jojo', x: 640 }, { pose: 'jojo', anim: 'cross', for: 1000 }], press: 's2.jv2-press-years' },
      { id: 'c4', t: 'اسألي أي واحد: الفوانيس ولعت بوكتها.', stage: [{ pose: 'jojo', anim: 'handsup', for: 900 }, { all: [{ jolt: 'sister', type: 'lunge', ms: 500 }, { bubble: 'sister', text: 'أي واحد؟ هممم.', ms: 1800 }] }] },
    ],
    breaks: ['c2', 'e-drift'],
    deflect: ['s2.jv-deflect-1', 's2.jv-deflect-2', 's2.jv-deflect-3'],
    onWrong: [{ mood: 'jojo', expr: 'smile' }, { jolt: 'jojo', type: 'hop' }, { pose: 'sister', anim: 'cross', for: 1200 }],
    broken: [
      { jolt: 'jojo', type: 'shake', ms: 800 },
      { puff: 'jojo', type: 'steam', ms: 2200 },
      { mood: 'jojo', expr: 'shy' },
      { pose: 'jojo', anim: 'facepalm', for: 1800 },
      { all: [{ jolt: 'sister', type: 'lunge', ms: 500 }, { pose: 'sister', anim: 'laugh', for: 1400 }, { pose: 'husky', anim: 'excited', for: 1400 }, { sfx: 'bark' }] },
      { say: 's2.jv2-broken' },
      { fx: V2, quiet: true },
    ],
  },
  {
    id: 'v3',
    title: 'النسخة الثالثة',
    intro: [{ camera: { between: ['jojo', 'anji'] }, ms: 500 }, { mood: 'jojo', expr: 'smile' }, { pose: 'jojo', anim: 'think', for: 900 }],
    beats: [
      { id: 'd1', t: 'زين، زين. ولّعتها متأخر شوية. بس السبعة كلها ولعت، بنفس الليلة.', stage: [{ pose: 'jojo', anim: 'shrug', for: 900 }], press: 's2.jv3-press-seven' },
      { id: 'd2', t: 'والعلّية؟ ما طلعتلها من سنة. الدرج يصيح، وركبي تصيح وياه.', stage: [{ move: 'jojo', x: 1020, speed: 110 }, { pose: 'jojo', anim: 'point', for: 1000 }, { jolt: 'jojo', type: 'tilt', ms: 500 }], press: 's2.jv3-press-loft' },
      { id: 'd3', t: 'العلّية بيها بس صناديق قديمة. محد يحتاجها.', stage: [{ move: 'jojo', x: 700 }, { pose: 'jojo', anim: 'cross', for: 1000 }], press: 's2.jv3-press-boxes' },
      { id: 'd4', t: 'خلصت القصة. هاي الأخيرة، والله.', stage: [{ pose: 'jojo', anim: 'handsup', for: 900 }, { all: [{ jolt: 'sister', type: 'lunge', ms: 500 }, { bubble: 'sister', text: 'الأخيرة؟', ms: 1600 }] }] },
    ],
    breaks: ['d2', 'e-logbook'],
    deflect: ['s2.jv-deflect-1', 's2.jv-deflect-2', 's2.jv-deflect-3'],
    onWrong: [{ mood: 'jojo', expr: 'smile' }, { jolt: 'jojo', type: 'hop' }, { pose: 'sister', anim: 'shrug', for: 1000 }],
    broken: [
      { letterbox: true }, // a set piece: his last story collapses (the bars stay for his truth; back to play, they go)
      { jolt: 'jojo', type: 'shake', ms: 900 },
      { puff: 'jojo', type: 'sweat', ms: 2600 },
      { mood: 'jojo', expr: 'worried' },
      { pose: 'jojo', anim: 'facepalm', for: 1600 },
      { all: [{ face: 'sister', toward: 'jojo' }, { jolt: 'sister', type: 'lunge', ms: 500 }] },
      { say: 's2.jv3-broken' },
    ],
  },
];

/* ── the module ── */
export default {
  id: 'm03',
  missions: [
    {
      id: 's2-14',
      kind: 'story',
      pack: PACK_S2,
      act: 3,
      day: 15,
      world: ['s2-lamphouse'],
      title: 'قصص جوجو الثلاث',
      where: 'بيت الفانوس',
      summary: 'العم جوجو عنده قصة عن ليلة الفوانيس. وكل مرة يحچيها… تتغيّر.',
      unlock: OPEN,
      locked: 'ينفتح بعد «سنوكي ضايع».',
      // steps say what to do, never which statement or which piece of evidence
      steps: [
        { done: V1, world: 's2-lamphouse', text: 'اسمعي قصة العم جوجو، ولگي اللي ما يركب بيها.' },
        { done: V2, world: 's2-lamphouse', text: 'قصته تغيّرت… وبعدها ما تركب.' },
        { done: ['ev:e-logbook', 'ev:e-loft'], world: 's2-lamphouse', text: 'نسخة ثالثة. شنو تحتاجين حتى تكسرينها؟' },
        { done: ['ev:t-jojo-true', TRUTH], world: 's2-lamphouse', text: 'رجعي للعم جوجو ويا اللي لگيتيه.' },
      ],
      reward: ['journal:s2-jojo3'],
      rewardText: 'سر الفانوس الثامن',
      leadsTo: ['s2-15'],
    },
  ],
  evidence: {
    'e-oilcan': { rel: 'fact', icon: 'mark', label: 'تنكة الزيت', note: 'ثگيلة لحد ما گدرت أشيلها، وختم الشمع على غطاها سليم وعليه غبرة. محد فتحها من زمان.' },
    'e-logbook': { rel: 'fact', icon: 'note', label: 'دفتر بيت الفانوس', note: 'بخط العم جوجو، بتاريخ ليلة الفوانيس: الأول… السابع، ولعت. وبآخر سطر: «الثامن — العلّية — يبقى مطفي، مثل ما انطلب.»' },
    'e-loft': { rel: 'fact', icon: 'moon-crescent', label: 'الفانوس الثامن', note: 'بالعلّية: فانوس جديد، فتيلته ما انحرگت أبد، وعلى إيده شريطة.' },
    't-jojo-true': { rel: 'claim', icon: 'moon-crescent', label: 'العم جوجو: آخر نسخة', note: '«ما قدّمت ساعة الحديقة، فولّعت متأخر ساعة. والثامن خليته مطفي لأن ريان طلب.» ليش؟ «هذا سره، مو سري.»' },
  },
  decisions: {
    'jojo-confront': ['gentle', 'blunt'], // 03: how she meets his last truth (read: his line after; 05's hooks map; 06)
  },
  case: [{ mission: 's2-14', ids: ['e-oilcan', 'e-logbook', 'e-loft', 't-jojo-true'] }],
  journal: {
    's2-jojo3': { title: 'قصص جوجو الثلاث', icon: 'moon-crescent', text: 'زيت ما انشرى، وتسعة چانت عشرة، وفانوس ثامن ينتظر بالعلّية. والسر… مو سر جوجو.' },
  },
  puzzles: {
    's2-jojo-versions': {
      type: 'testimony',
      title: 'قصص العم جوجو',
      goal: 'اسمعي قصته جملة جملة. لمن جملة ما تركب ويا دليل عندچ، قدّميه عليها.',
      intro: 'العم جوجو يحچي، وكل جملة تنعاد گدامچ. توگفين على أي جملة، تضغطين عليه، أو تقدّمين دليل.',
      versions: VERSIONS,
      config: { versions: VERSIONS.map((v) => ({ id: v.id, beats: v.beats.map((b) => b.id), breaks: v.breaks })) },
      reward: ['ev:t-jojo-true'],
    },
  },
  dialogue: {
    // his opening reads how she answered him in M1 (jojo-why): she once asked why he never testifies to what he did not see
    's2.14-jojo-open': [
      { if: 'dec:jojo-why=ask', then: [{ s: 'jojo', e: 'smile', t: 'أنجي. مرة سألتيني ليش ما أشهد على اللي ما شفته. اليوم… أحچيلچ اللي شفته. كله.', act: [{ pose: 'jojo', anim: 'handsup', for: 800 }] }] },
      { if: 'dec:jojo-why=accept', then: [{ s: 'jojo', e: 'smile', t: 'أنجي! مرة گلتيلي «مفهوم، عمو» ومشيتي. اليوم عندي أكثر من «مفهوم»… عندي قصة.', act: [{ pose: 'jojo', anim: 'handsup', for: 800 }] }] },
      { if: ['!dec:jojo-why=ask', '!dec:jojo-why=accept'], then: [{ s: 'jojo', e: 'smile', t: 'أنجي! تعالي، تعالي. عندي قصة عن ليلة الفوانيس… أحلى من اللي گلتها أول.', act: [{ pose: 'jojo', anim: 'handsup', for: 800 }] }] },
      { s: 'anji', e: 'curious', t: 'قصة جديدة، عمو؟ هسه صارت قصص؟' },
      { s: 'jojo', e: 'smile', t: 'گعدي، گعدي. آني أحلى واحد يحچي قصص بالحديقة.', act: [{ jolt: 'jojo', type: 'hop' }, { pose: 'jojo', anim: 'laugh', for: 900 }] },
    ],
    's2.14-jojo-resume': [{ s: 'jojo', e: 'smile', t: 'رجعتي؟ زين. وين وصلنا بالقصة؟', act: [{ pose: 'jojo', anim: 'shrug', for: 700 }] }],
    's2.14-jojo-later': [{ s: 'jojo', e: 'smile', t: 'روحي دوري براحتچ، بنتي. القصة ما تتغير.' }],
    's2.jv1-press-fix': [{ s: 'jojo', e: 'thinking', t: 'الفتيلة بالرابع چانت محروگة. أربعين سنة وآني أبدّل فتايل، بعيوني مسكّرة.', act: [{ pose: 'jojo', anim: 'think', for: 900 }] }],
    's2.jv1-press-oil': [
      { s: 'jojo', e: 'smile', t: 'التنكة اللي بالزاوية؟ فارغة. هزّيتها بإيدي، والله. فطلعت.', act: [{ pose: 'jojo', anim: 'point', for: 900 }] },
      { s: 'anji', e: 'thinking', t: '(تنكة بالزاوية… هممم.)' },
    ],
    's2.jv1-press-back': [{ s: 'jojo', e: 'thinking', t: 'ومن ضوّاها بغيابي؟ … مو مهم. المهم مضوية.', act: [{ pose: 'jojo', anim: 'shrug', for: 900 }] }],
    's2.jv-deflect-1': [{ s: 'jojo', e: 'smile', t: 'هذا؟ هذا ما يثبت شي، بنتي.', act: [{ pose: 'jojo', anim: 'laugh', for: 800 }] }],
    's2.jv-deflect-2': [{ s: 'jojo', e: 'smile', t: 'أربعين سنة أحچي هالقصة. ما تتغير بورقة.', act: [{ pose: 'jojo', anim: 'cross', for: 900 }] }],
    's2.jv-deflect-3': [{ s: 'jojo', e: 'smile', t: 'هههه. حلوة. بس لا.', act: [{ jolt: 'jojo', type: 'hop' }] }],
    's2.jv1-broken': [
      { s: 'anji', e: 'determined', t: 'عمو… التنكة ثگيلة لحد ما گدرت أشيلها. وختمها سليم، وعليه غبرة. محد فتحها.' },
      { s: 'jojo', e: 'worried', t: 'آآ… الزيت. إي. يعني… ما طلعت. بس هذا ما يغيّر شي!', act: [{ pose: 'jojo', anim: 'handsup', for: 900 }] },
    ],
    's2.jv-sister-arrives': [
      { s: 'sister', e: 'suspicious', t: 'شنو هالأصوات؟ عمو جوجو يحچي قصة؟' },
      { s: 'anji', e: 'soft', t: 'قصتين، لحد هسه.' },
      { s: 'sister', e: 'smile', t: 'هههه. خليني أسمع الثالثة. أحسن من التلفزيون.', act: [{ pose: 'sister', anim: 'cross', for: 1200 }] },
    ],
    's2.jv2-press-nine': [{ s: 'jojo', e: 'smile', t: 'التسعة بالضبط. شفتها بعيني على ساعة الحديقة. هاي أدق ساعة بالحديقة كلها.', act: [{ pose: 'jojo', anim: 'point', for: 1000 }] }],
    's2.jv2-press-years': [
      { s: 'jojo', e: 'smile', t: 'أربعين سنة! اسألي أختچ.', act: [{ pose: 'jojo', anim: 'point', for: 800 }] },
      { s: 'sister', e: 'suspicious', t: 'لا تدخّلني، عمو.', act: [{ jolt: 'sister', type: 'lunge', ms: 500 }] },
    ],
    's2.jv2-broken': [
      { s: 'anji', e: 'determined', t: 'عمو… ساعة الحديقة ما انقدّمت ليلة الفوانيس. «التسعة بالضبط» بيها… چانت عشرة.' },
      { s: 'jojo', e: 'shy', t: 'ههه… إي.' },
      { s: 'sister', e: 'smile', t: 'أربعين سنة!', act: [{ pose: 'sister', anim: 'laugh', for: 1200 }] },
      { s: 'jojo', e: 'worried', t: 'مو… مو گدام أختچ!', act: [{ jolt: 'jojo', type: 'shake' }] },
    ],
    's2.jv3-press-seven': [{ s: 'jojo', e: 'smile', t: 'سبعة ضيوف، سبع فوانيس. حساب بسيط، بنتي.', act: [{ pose: 'jojo', anim: 'point', for: 800 }] }],
    's2.jv3-press-loft': [
      { s: 'jojo', e: 'smile', t: 'شوفي الدرج. شوفي ركبي. هذا جواب.', act: [{ pose: 'jojo', anim: 'point', for: 900 }, { jolt: 'jojo', type: 'tilt', ms: 500 }] },
      { s: 'sister', e: 'suspicious', t: 'ركبتك ممتازة لمن تركض ورا القطط.', act: [{ pose: 'sister', anim: 'cross', for: 1000 }] },
    ],
    's2.jv3-press-boxes': [{ s: 'jojo', e: 'thinking', t: 'صناديق، وفتايل قديمة، وظلمة. لا تطلعين، بنتي. ما بيها ضو.', act: [{ pose: 'jojo', anim: 'shrug', for: 900 }] }],
    's2.jv3-broken': [
      { s: 'anji', e: 'determined', t: 'عمو… دفترك. بخطك، بتاريخ ليلة الفوانيس. والدفتر بالعلّية.' },
      { s: 'jojo', e: 'worried', t: 'إنتِ… طلعتي؟ بالظلمة؟', act: [{ pose: 'jojo', anim: 'handsup', for: 900 }] },
      { s: 'sister', e: 'smile', t: 'وإنت ما طلعت من سنة. بس دفترك طلع وحده؟', act: [{ pose: 'sister', anim: 'laugh', for: 1200 }] },
    ],
    's2.14-truth': [
      { s: 'jojo', e: 'shy', t: 'نسيت أقدّم ساعة الحديقة. أول مرة بأربعين سنة. ولّعت الفوانيس متأخر ساعة… والكل چان ينتظر.' },
      { s: 'jojo', e: 'worried', t: 'استحيت. فگلت قصة الزيت. وبعدين قصة التسعة. وبعدين… العلّية.', act: [{ pose: 'jojo', anim: 'facepalm', for: 1400 }] },
      { s: 'anji', e: 'curious', t: 'والفانوس الثامن؟ «مثل ما انطلب». منو طلب، عمو؟' },
      { s: 'jojo', e: 'thinking', t: 'ريان. گال: «عمو، الثامن خليه مطفي، وخليه فوگ. ولا تسألني ليش.» وآني ما سألت.', act: [{ pose: 'jojo', anim: 'point', for: 900 }] },
      { s: 'jojo', e: 'smile', t: 'هذا سره، مو سري. وآني أحفظ الأسرار… بس مو الساعات، على ما يبين.' },
      { s: 'sister', e: 'suspicious', t: 'ريان يخبي فانوس؟ همم. مسجّلة.', act: [{ pose: 'sister', anim: 'cross', for: 1200 }] },
      {
        s: 'anji',
        choice: [
          {
            t: 'الكل ينسى، عمو. والسر يبقى بمكانه.',
            do: ['dec:jojo-confront=gentle', TRUTH, 'flag:s2:14-hooks-map'], // the hooks map: Mission 05 reads it
            then: [
              { s: 'jojo', e: 'smile', t: 'الله يخليچ. خذي هاي: خريطة الحلگات اللي علّگنا بيها الفوانيس. يمكن تحتاجينها.', act: [{ mood: 'jojo', expr: 'smile' }, { jolt: 'jojo', type: 'hop' }] },
              { s: 'sister', e: 'suspicious', t: 'طيبة زايدة.', act: [{ pose: 'sister', anim: 'shrug', for: 1200 }] },
            ],
          },
          {
            t: 'عمو، ثلاث قصص؟! والقضية تنتظر.',
            do: ['dec:jojo-confront=blunt', TRUTH],
            then: [
              { s: 'jojo', e: 'worried', t: 'صح… بس ما چان لازم تگولينها هيچ.', act: [{ mood: 'jojo', expr: 'worried' }, { pose: 'jojo', anim: 'cross', for: 1600 }] },
              { s: 'sister', e: 'smile', t: 'هيچ! هاي أختي.', act: [{ pose: 'sister', anim: 'laugh', for: 1200 }] },
            ],
          },
        ],
      },
    ],
    's2.14-jojo-again': [
      { if: 'dec:jojo-confront=gentle', then: [{ s: 'jojo', e: 'smile', t: 'الفوانيس ما تنتظر. والثامن… ينتظر ريان.' }] },
      { if: 'dec:jojo-confront=blunt', then: [{ s: 'jojo', e: 'thinking', t: 'هممم. ثلاث قصص، وحقيقة وحدة. راضية؟' }] },
    ],
    's2.14-sister': [
      { if: `!${TRUTH}`, then: [{ s: 'sister', e: 'suspicious', t: 'آني بس جاية أسمع قصص عمو. كمّلي، كمّلي.' }] },
      { if: TRUTH, then: [{ s: 'sister', e: 'smile', t: 'ثلاث قصص بليلة وحدة. عمو جوجو لازم يكتب كتاب.' }] },
    ],
    's2.14-oil-lift': [
      { s: 'anji', e: 'surprised', t: 'هاي ثگيلة! بالكاد تنشال.', act: [{ pose: 'anji', anim: 'crouch', for: 1300 }, { jolt: 'anji', type: 'shake', ms: 700 }, { puff: 'anji', type: 'dust', ms: 900 }] },
      { s: 'anji', e: 'thinking', t: 'وختم الشمع على غطاها سليم… وعليه غبرة. محد فتحها من زمان.' },
    ],
    's2.14-oil-again': [{ s: 'anji', e: 'thinking', t: 'التنكة بمكانها. ثگيلة مثل ما چانت.' }],
    's2.14-ladder': [{ s: 'anji', e: 'curious', t: 'سلّم العلّية…' }],
    's2.14-lamp-take': [{ s: 'anji', e: 'smile', t: 'فانوس اليد. ضوّه صغير… بس يكفي لزاوية.', act: [{ pose: 'anji', anim: 'crouch', for: 400 }] }],
    's2.14-lamp': [{ s: 'anji', e: 'thinking', t: 'فانوس يد صغير، مضوي.' }],
    's2.14-loft-enter': [
      { if: `!hold:${LAMP}`, then: [{ s: 'anji', e: 'surprised', t: 'ظلمة! ما أشوف حتى إيدي.' }] },
      { if: `hold:${LAMP}`, then: [{ s: 'anji', e: 'curious', t: 'العلّية. الضو يوصل لشبر گدامي بس.' }] },
    ],
    's2.14-dark': [{ s: 'anji', e: 'thinking', t: 'ظلمة. أحس أكو شي، بس ما أشوفه.' }],
    's2.14-hook': [{ s: 'anji', e: 'thinking', t: 'حلگة على العمود… مكان يتعلّگ بيه شي.' }],
    's2.14-hang': [
      { s: 'anji', e: 'smile', t: 'هنا.' },
      { s: 'narrator', t: '(الضو يوصل للرف… وللزاوية البعيدة.)' },
    ],
    's2.14-hook-lit': [{ s: 'anji', e: 'smile', t: 'الفانوس بمكانه. والعلّية صارت تبين.' }],
    's2.14-logbook': [
      { s: 'narrator', t: '(على الرف: دفتر بيت الفانوس. صفحة ليلة الفوانيس، بخط صغير متصل، والحبر أزرق.)' },
      { s: 'note', t: '«الأول، الثاني، الثالث… السابع: ولعت.»' },
      { s: 'note', t: '«الثامن — العلّية — يبقى مطفي، مثل ما انطلب.»' },
      { s: 'anji', e: 'thinking', t: 'دفتره. بخطه. وتاريخ الليلة نفسها.' },
    ],
    's2.14-logbook-again': [{ s: 'anji', e: 'thinking', t: 'دفتر بيت الفانوس. آخر سطر بليلة الفوانيس… عن الثامن.' }],
    's2.14-eighth': [
      { s: 'anji', e: 'surprised', t: 'فانوس! جديد… فتيلته ما انحرگت أبد.' },
      { s: 'anji', e: 'curious', t: 'وعلى إيده شريطة. منو يلف فانوس بشريطة؟' },
    ],
    's2.14-eighth-again': [{ s: 'anji', e: 'soft', t: 'الفانوس الثامن. خليه بمكانه.' }],
  },
  scenes: [S2_LOFT],
  // additions to M1's lamphouse, each one only while this mission is open (or after it)
  patches: {
    's2-lamphouse': {
      actors: [
        // he notices her and turns; he works with a thinking face until the story starts
        { id: 'jojo', mood: 'thinking', notice: { dist: 130, emote: '!' } },
        // her sister comes in when his first version breaks, and stays
        { id: 'sister', kind: 'sister', x: 380, facing: 1, if: [OPEN, SISTER], idleFx: 'sway', mood: 'suspicious', notice: { dist: 100, jolt: 'lunge' } },
      ],
      dynamic: [
        { x: 1200, reach: 40, if: OPEN, draw: (ctx) => oilCan(ctx, 1200) },
        { x: 1100, reach: 60, if: [OPEN, V2], draw: (ctx) => ladder(ctx, 1100) },
        { x: 500, reach: 40, if: [OPEN, V2, `!hold:${LAMP}`, `!${LIT}`], draw: (ctx) => handLamp(ctx, 500, GROUND - 62, true) },
      ],
      interact: [
        {
          id: 'jojo',
          actor: 'jojo', // follows him wherever his story walks him
          cases: [
            { if: [OPEN, `!${MET}`], run: [{ social: { cat: 'greeting' } }, { say: 's2.14-jojo-open' }, { fx: MET }, { testimony: 's2-jojo-versions', then: [{ say: 's2.14-truth' }], else: [{ say: 's2.14-jojo-later' }] }] },
            { if: [OPEN, `!${TRUTH}`], run: [{ say: 's2.14-jojo-resume' }, { testimony: 's2-jojo-versions', then: [{ say: 's2.14-truth' }], else: [{ say: 's2.14-jojo-later' }] }] },
            { if: TRUTH, run: [{ say: 's2.14-jojo-again' }] },
          ],
        },
        { id: 'sister', actor: 'sister', x: 380, w: 46, h: 120, label: 'أختي', icon: '💬', if: [OPEN, SISTER], run: [{ say: 's2.14-sister' }] },
        {
          id: 'oil',
          x: 1200,
          w: 50,
          h: 70,
          label: 'تنكة الزيت',
          icon: '🫙',
          if: OPEN,
          cases: [{ if: '!ev:e-oilcan', run: [{ say: 's2.14-oil-lift' }, { fx: 'ev:e-oilcan' }] }, { run: [{ say: 's2.14-oil-again' }] }],
        },
        {
          id: 'lamp',
          x: 500,
          w: 40,
          h: 60,
          label: 'فانوس يد',
          icon: '🏮',
          if: [OPEN, V2, `!hold:${LAMP}`, `!${LIT}`],
          cases: [{ if: 'hold:', run: [{ fx: `hold:${LAMP}`, quiet: true }, { say: 's2.14-lamp-take' }] }, { run: [{ say: 's2.14-lamp' }] }],
        },
        { id: 'ladder', x: 1100, w: 50, h: 200, label: 'سلّم العلّية', icon: '🪜', if: [OPEN, V2], run: [{ say: 's2.14-ladder' }, { fade: 'out' }, { goto: 's2-loft', x: 140 }] },
      ],
    },
  },
};

