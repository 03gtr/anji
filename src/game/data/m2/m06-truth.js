/**
 * Season 2, M2 — Mission 06 «حقيقة البطاقة» (s2-17), the season's finale (docs/season-2/SEASON_2_LIVING_STORY_C1.md
 * §3 item 06; the canon: SEASON_2_STORY_BIBLE.md §3–§4). A mission module (docs/season-2/MISSION_MODULES.md).
 *
 * Everyone comes to the case room (M1's place, extended here; every addition is gated on this mission):
 *   1. the rebuild: she puts six moments of the night in order on the board (an `arrange`, 720 orders, from facts
 *      she found in every mission);
 *   2. the defence (puzzles/defend.js + ui/defend.js): she pins a theory and defends it; each person raises a
 *      challenge in turn and she answers with evidence she holds. A, B and C each meet a challenge nothing answers:
 *      the theory breaks, and the person it would have blamed reacts; she chooses again. Only D («الدائرة المغلقة»)
 *      survives every challenge. Challenges read earlier decisions (office-cover: Sabri's; jojo-confront: Jojo's;
 *      stash: the husky's, or Snooki's; sister-wish: her sister's);
 *   3. the ending, in the garden at night (a new place, s2-finale): Ryan lights the eighth lantern, his riddle
 *      leads her to white roses and sweets, and she says it reminds her of that day at the clinic. It reads
 *      office-cover, stash, jojo-confront, lead, jealous-talk, and sister-wish (the last scene: read, or left
 *      open). No wedding, no promise; jealousy stays playful. The register gets a new page, in Anji's hand.
 *
 * Evidence from the missions before it (02: e-page, e-wrapper; 04: d-chain; 05: d-timeline, e-surprise) is
 * registered by those modules. Fiction written for the game.
 */
import { PACK_S2 } from '../missions-s2.js';
import { GROUND } from '../../world/props.js';
import { defenceAction } from '../../ui/defend.js';

const after = (id) => `flag:mission:${id}`;
const OPEN = after('s2-16');
const GATHERED = 'flag:s2:17-gather';
const ORDERED = 'flag:s2:17-order';
const DEFENDED = 'flag:s2:17-defended';
const HOLDS = 'flag:s2:17-holds'; // set by the defence bar when the theory survives every challenge
const GARDEN = 'flag:s2:17-garden';
const LIT = 'flag:s2:17-lit';
const ROSES = 'flag:s2:17-roses';
const END = 'flag:s2:17-end';
/** M1 has Ryan in the case room (from s2-10); he leaves with everyone for the garden. */
const RYAN_IN_ROOM = [after('s2-10'), { any: [`!${OPEN}`, `!${GARDEN}`] }];
const once = (key) => ({ if: `!seen:dlg:${key}`, then: [{ say: key }] });

/** Where everyone stands in the case room (and goes back to after a challenge). */
const HOME = { rabi: 330, lama: 440, sabri: 545, jojo: 860, ryan: 980, sister: 1170 };
const SNOOKI_HOME = HOME.ryan - 58; // beside Ryan (data/companions.js)

/* ── drawn on the canvas (no new art to bake) ── */
const seeded = (seed) => {
  let v = seed;
  return () => (v = (v * 9301 + 49297) % 233280) / 233280;
};
function paperLantern(ctx, x, y, lit, t, reduced, glow = 34) {
  ctx.save();
  ctx.strokeStyle = '#2a2236';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y - 12);
  ctx.stroke();
  if (lit) {
    const a = reduced ? 0.5 : 0.42 + 0.12 * Math.sin(t * 3 + x);
    const g = ctx.createRadialGradient(x, y, 2, x, y, glow);
    g.addColorStop(0, `rgba(255,206,120,${a})`);
    g.addColorStop(1, 'rgba(255,206,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - glow, y - glow, glow * 2, glow * 2);
  }
  ctx.fillStyle = lit ? '#f4c066' : '#5a5170';
  ctx.beginPath();
  ctx.ellipse(x, y, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lit ? '#fff1c8' : '#3a344c';
  ctx.fillRect(x - 6, y - 13, 12, 3);
  ctx.fillRect(x - 6, y + 10, 12, 3);
  ctx.restore();
}
/** The eighth lantern: new, a ribbon round its handle, a riddle card hanging from it. */
function eighthLantern(ctx, x, y, lit, t, reduced) {
  ctx.save();
  if (lit) {
    const a = reduced ? 0.6 : 0.5 + 0.12 * Math.sin(t * 2.4);
    const g = ctx.createRadialGradient(x, y, 3, x, y, 64);
    g.addColorStop(0, `rgba(255,222,150,${a})`);
    g.addColorStop(1, 'rgba(255,222,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 64, y - 64, 128, 128);
  }
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(x - 12, y - 16, 24, 5);
  ctx.fillStyle = lit ? 'rgba(255,236,190,0.95)' : 'rgba(230,240,255,0.55)';
  ctx.fillRect(x - 10, y - 11, 20, 24);
  ctx.strokeStyle = '#c9a25c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 10, y - 11, 20, 24);
  if (lit) {
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 2.6, 5 + (reduced ? 0 : Math.sin(t * 9) * 0.8), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#d0506a'; // the ribbon
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(x, y - 21, 6, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#f2efe6'; // the riddle card
  ctx.fillRect(x + 8, y + 10, 12, 9);
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(x - 12, y + 13, 24, 4);
  ctx.restore();
}
function hookPost(ctx, x) {
  ctx.save();
  ctx.strokeStyle = '#3a2c22';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND);
  ctx.lineTo(x - 30, GROUND - 196);
  ctx.quadraticCurveTo(x - 30, GROUND - 214, x - 6, GROUND - 212);
  ctx.lineTo(x, GROUND - 200);
  ctx.stroke();
  ctx.restore();
}
function sweetsBox(ctx, x) {
  const y = GROUND;
  ctx.save();
  ctx.fillStyle = '#f2d9e4';
  ctx.fillRect(x - 15, y - 16, 30, 16);
  ctx.fillStyle = '#e7c2d3';
  ctx.fillRect(x - 16, y - 19, 32, 5);
  ctx.strokeStyle = '#d0506a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x, y - 19);
  ctx.lineTo(x, y);
  ctx.moveTo(x - 16, y - 9);
  ctx.lineTo(x + 16, y - 9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - 4, y - 22, 4, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 22, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
/** The way the eighth lantern's light points: a soft line of light on the grass, as far as the white roses. */
function lightPath(ctx, { t, world }) {
  ctx.save();
  for (let x = 1000; x <= 1290; x += 24) {
    const a = world.reduced ? 0.5 : 0.3 + 0.28 * Math.max(0, Math.sin(t * 3 - x * 0.025));
    const g = ctx.createRadialGradient(x, GROUND - 3, 1, x, GROUND - 3, 13);
    g.addColorStop(0, `rgba(255,226,150,${a})`);
    g.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 13, GROUND - 16, 26, 26);
  }
  ctx.restore();
}

const TREE_LANTERNS = [
  { x: 450, y: -150 },
  { x: 520, y: -178 },
  { x: 590, y: -150 },
  { x: 660, y: -182 }, // the fourth: her sister's
  { x: 730, y: -152 },
  { x: 800, y: -176 },
  { x: 870, y: -148 },
];
const EIGHTH = { x: 960, y: GROUND - 186 };
const ROSE_X = 1330;

/** The night: a soft veil over the garden, with a pool of light round every lit lantern (and round her). */
let veil = null;
function night(ctx, { game, world, camX, viewW }) {
  const W = Math.ceil(viewW / 2);
  const H = 300;
  if (!veil) veil = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!veil) return;
  if (veil.width !== W) veil.width = W;
  if (veil.height !== H) veil.height = H;
  const m = veil.getContext('2d');
  if (!m) return;
  m.globalCompositeOperation = 'source-over';
  m.clearRect(0, 0, W, H);
  m.fillStyle = 'rgba(8, 9, 30, 0.52)';
  m.fillRect(0, 0, W, H);
  m.globalCompositeOperation = 'destination-out';
  const pool = (wx, wy, r) => {
    const x = (wx - camX) / 2;
    const y = (wy - (GROUND - 400)) / 2;
    const g = m.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(0, 0, 0, 1)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    m.fillStyle = g;
    m.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // (radii in the mask's half-resolution pixels: twice as wide in the world)
  for (const l of TREE_LANTERNS) pool(l.x, GROUND + l.y + 60, 52);
  if (game.flag('s2:17-lit')) {
    pool(EIGHTH.x, EIGHTH.y + 60, 80);
    pool(ROSE_X, GROUND - 30, 48);
  }
  const p = world?.player;
  if (p) pool(p.x, p.y - 50, 40);
  m.globalCompositeOperation = 'source-over';
  ctx.drawImage(veil, camX, GROUND - 400, W * 2, H * 2);
}
/** Letterbox bars while the ending is acted out (the season's last set piece); they ease in and out. */
const bars = { k: 0, t: 0 };
function letterbox(ctx, { world, camX, viewW, t }) {
  const dt = Math.min(0.1, Math.max(0, t - bars.t));
  bars.t = t;
  const want = world.mode === 'cutscene' ? 1 : 0;
  bars.k = world.reduced ? want : bars.k + (want - bars.k) * Math.min(1, dt * 3);
  if (bars.k < 0.01) return;
  const hgt = world.viewH * 0.08 * bars.k;
  ctx.save();
  ctx.fillStyle = '#04050d';
  ctx.fillRect(camX - 4, world.topY, viewW + 8, hgt);
  ctx.fillRect(camX - 4, world.topY + world.viewH - hgt, viewW + 8, hgt);
  ctx.restore();
}

/* ── the case room, during this mission: the night in order on a string, the four theories' tags ── */
function caseLine(ctx, { game }) {
  const y = GROUND - 92;
  ctx.save();
  ctx.strokeStyle = '#b8323c';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(612, y);
  ctx.quadraticCurveTo(700, y + 10, 788, y);
  ctx.stroke();
  const ordered = game.flag('s2:17-order');
  for (let i = 0; i < 6; i++) {
    const x = 622 + i * 31;
    const yy = y + 3 + Math.sin((i / 5) * Math.PI) * 6;
    ctx.fillStyle = ordered ? ['#fff7ec', '#ffe28a', '#f7b6cb', '#9fd7ff', '#ffd98a', '#c9c5e6'][i] : 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - 9, yy, 18, 14);
    ctx.fillStyle = '#e2405f';
    ctx.beginPath();
    ctx.arc(x, yy + 1.5, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ['A', 'B', 'C', 'D'].forEach((hyp, i) => {
    const x = [606, 630, 770, 794][i];
    const yy = GROUND - 136;
    ctx.fillStyle = '#efe2cf';
    ctx.fillRect(x - 9, yy, 18, 18);
    ctx.fillStyle = '#2b2340';
    ctx.font = '700 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hyp, x, yy + 13);
    if (game.flag(`s2:17-broke-${hyp.toLowerCase()}`)) {
      ctx.strokeStyle = '#c9304a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 8, yy + 1);
      ctx.lineTo(x + 8, yy + 17);
      ctx.moveTo(x + 8, yy + 1);
      ctx.lineTo(x - 8, yy + 17);
      ctx.stroke();
    }
    if (hyp === 'D' && game.flag('s2:17-defended')) {
      ctx.strokeStyle = '#e9b949';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, yy + 9, 13, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  ctx.restore();
}

/* ── the rebuild: six moments of the night (story bible §3; facts from every mission) ── */
const CLUES = [
  'لمى: «الجملة؟ گلتها لأختچ قبل ليلة الفوانيس بيومين.»',
  'ريان: «الورقة اللي بلا توقيع لگيتها تحت كوبي الساعة ثمانية ونص… والشجرة بعدها ظلمة.»',
  'لمى: «أختچ بقت واگفة جنب الفانوس الرابع لحد ما ولع. بعدها، ما شفتها.»',
  'العم جوجو: «ولّعت لحظة ما ساعة الحديقة گالت تسعة. ولا شي صار بيناتهن.»',
  'بالصفحة المگطوعة، آخر سطر بخط العم جوجو: «ولعت السبعة. الرابع بيه بطاقة بيضاء.» وبنصها ورقة حلويات ريان.',
];
const CLUES_HTML = `<p style="margin:0 0 4px;font-weight:700">من دفتري:</p><ol style="margin:0;padding-inline-start:1.4em;font-size:14px;line-height:1.6">${CLUES.map((c) => `<li>${c}</li>`).join('')}</ol>`;
// truth (as Mission 05 shows it): the words reach her sister (days before) → the note under Ryan's cup (8:30, the tree
// still dark) → the garden clock says nine → seven lanterns lit → the fourth's light shows her card's writing and she
// erases it (10:05) → the page torn (10:21)
const ORDER = ['words', 'note', 'clock', 'lanterns', 'card', 'page'];
const SLOT_LABELS = ['أول شي', '٢', '٣', '٤', '٥', 'آخر شي'];

/* ── the defence ── */
/** A person steps up to her with a challenge: they walk over, the two face each other, the camera frames them. */
const stepUp = (who, extra = []) => [
  { move: who, to: 'anji', gap: 86, speed: 140 },
  { all: [{ face: who, toward: 'anji' }, { face: 'anji', toward: who }] },
  { camera: { between: [who, 'anji'] }, ms: 450 },
  ...extra,
];
const goHome = (who) => ({ move: who, x: who === 'snooki' ? SNOOKI_HOME : HOME[who], speed: 150, async: true });

const HYPOTHESES = {
  A: {
    title: 'واحد خرّب الليلة عن قصد',
    intro: [{ pose: 'anji', anim: 'think', for: 500 }, { bubble: 'anji', text: 'A.', ms: 1000 }],
    broken: [{ say: 's2.17-broke-a' }],
  },
  B: {
    title: 'ريان يخبي شي يأذيني',
    intro: [{ pose: 'anji', anim: 'think', for: 500 }, { bubble: 'anji', text: 'B.', ms: 1000 }],
    broken: [{ say: 's2.17-broke-b' }],
  },
  C: {
    title: 'الساعة غلطت الكل',
    intro: [{ pose: 'anji', anim: 'think', for: 500 }, { bubble: 'anji', text: 'C.', ms: 1000 }],
    broken: [{ say: 's2.17-broke-c' }],
  },
  D: {
    title: 'الدائرة المغلقة: محد خرّب، كل واحد سوّى شي صغير',
    intro: [{ pose: 'anji', anim: 'think', for: 500 }, { bubble: 'anji', text: 'D.', ms: 1000 }],
  },
};

const CHALLENGES = {
  A: [
    {
      id: 'a-rabi',
      answer: null, // nothing done that night was done to spoil it
      variants: [
        {
          who: 'rabi',
          name: 'ربيع يسأل',
          t: 'تخريب عن قصد؟ زين. گوليلي شي واحد انسوّى بليلة الفوانيس حتى يخرّبها، ويا دليل يگول «عن قصد».',
          intro: stepUp('rabi', [{ pose: 'rabi', anim: 'think', for: 900 }]),
          onWrong: [{ pose: 'rabi', anim: 'shrug', for: 800 }],
          deflect: 's2.17-deflect-rabi',
        },
      ],
    },
  ],
  B: [
    {
      id: 'b-jojo',
      answer: null, // his secret is real; "hurts" has no evidence at all
      variants: [
        {
          who: 'jojo',
          name: 'العم جوجو يسأل',
          t: 'ريان يخبي شي، صح. بس «يأذيچ»؟ وريني دليل واحد على الأذى، بنتي.',
          intro: stepUp('jojo', [{ pose: 'jojo', anim: 'point', for: 900 }]),
          onWrong: [{ pose: 'jojo', anim: 'shrug', for: 800 }],
          deflect: 's2.17-deflect-jojo-b',
        },
      ],
    },
  ],
  C: [
    {
      id: 'c-sister',
      answer: null, // a clock writes no note and rubs out no card
      variants: [
        {
          who: 'sister',
          name: 'أختي تسأل',
          t: 'الساعة؟ الساعة كتبت ورقة بلا توقيع؟ الساعة مسحت بطاقة؟ قدّمي دليل إن الساعة سوّتهن.',
          intro: stepUp('sister', [{ jolt: 'sister', type: 'hop', ms: 400 }, { jolt: 'sister', type: 'lunge', ms: 500 }, { pose: 'sister', anim: 'cross', for: 900 }]),
          onWrong: [{ pose: 'sister', anim: 'lean', for: 800 }],
          deflect: 's2.17-deflect-sister',
        },
      ],
    },
  ],
  D: [
    {
      id: 'd-lama',
      answer: ['e-drift', 'd-timeline'], // her copy used the garden clock's times: an hour behind
      variants: [
        {
          who: 'lama',
          name: 'لمى تسأل',
          t: 'إذا كلشي غلطات صغيرة… ليش أوقات نسختي ما تركب ويا اللي صار؟ آني ما أغلط بالأرقام!',
          intro: stepUp('lama', [{ pose: 'lama', anim: 'point', for: 900 }]),
          onWrong: [{ pose: 'lama', anim: 'cross', for: 800 }],
          deflect: 's2.17-deflect-lama',
          answered: [{ say: 's2.17-ok-lama' }, goHome('lama')],
        },
      ],
    },
    {
      id: 'd-sabri',
      answer: ['e-versions', 'd-chain'], // every mouth made it shorter and scarier; nobody lied
      variants: [
        {
          if: 'dec:office-cover=cover',
          who: 'sabri',
          name: 'صبري يسأل',
          t: 'سؤال… مو عن الطابعة. لا، الطابعة بريئة. سؤالي: الجملة اللي وصلت لأختچ مو اللي انگالت أول. أكيد أحد غيّرها عن قصد. لا؟',
          intro: stepUp('sabri', [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'handsup', for: 700 }, { pose: 'sabri', anim: 'point', for: 800 }]),
          onWrong: [{ pose: 'sabri', anim: 'shrug', for: 700 }],
          deflect: 's2.17-deflect-sabri',
          answered: [{ say: 's2.17-ok-sabri-cover' }, goHome('sabri')],
        },
        {
          if: 'dec:office-cover=truth',
          who: 'sabri',
          name: 'صبري يسأل',
          t: 'آني گلتها، حرف بحرف. بس اللي وصل لأختچ مو كلامي. أكيد أحد غيّره عن قصد… لا؟',
          intro: stepUp('sabri', [{ pose: 'sabri', anim: 'think', for: 800 }, { pose: 'sabri', anim: 'point', for: 800 }]),
          onWrong: [{ pose: 'sabri', anim: 'shrug', for: 700 }],
          deflect: 's2.17-deflect-sabri',
          answered: [{ say: 's2.17-ok-sabri' }, goHome('sabri')],
        },
      ],
    },
    {
      id: 'd-jojo',
      answer: ['e-logbook', 't-jojo-true'], // dark on purpose: because Ryan asked, for a surprise
      variants: [
        {
          if: 'dec:jojo-confront=blunt',
          who: 'jojo',
          name: 'العم جوجو يسأل',
          t: 'زين، يا محققة. سؤال صريح مثل كلامچ: فانوس ظل مطفي طول الليل، فوگ بالعلّية. هذا مو تخريب عن قصد؟',
          intro: stepUp('jojo', [{ mood: 'jojo', expr: 'suspicious' }, { pose: 'jojo', anim: 'cross', for: 1000 }]),
          onWrong: [{ pose: 'jojo', anim: 'cross', for: 800 }],
          deflect: 's2.17-deflect-jojo',
          answered: [{ say: 's2.17-ok-jojo-blunt' }, goHome('jojo')],
        },
        {
          if: 'dec:jojo-confront=gentle',
          who: 'jojo',
          name: 'العم جوجو يسأل',
          t: 'بنتي، خليني أسألچ السؤال الصعب، حتى تصير نظريتچ قوية: فانوس ظل مطفي طول الليل، فوگ بالعلّية. مو هذا شي انسوّى عن قصد؟',
          intro: stepUp('jojo', [{ mood: 'jojo', expr: 'smile' }, { pose: 'jojo', anim: 'think', for: 1000 }]),
          onWrong: [{ pose: 'jojo', anim: 'shrug', for: 800 }],
          deflect: 's2.17-deflect-jojo',
          answered: [{ say: 's2.17-ok-jojo-gentle' }, goHome('jojo')],
        },
      ],
    },
    {
      id: 'd-page',
      answer: ['e-page'], // her teeth: the husky took the page, with the wrapper in it
      variants: [
        {
          // she kept the husky's treasures as evidence: the husky raises it herself, her own way
          if: 'dec:stash=keep',
          who: 'husky',
          name: '{husky}',
          t: '({husky} تسحب ورقة «صفحة السجل» من اللوحة، تلف بيها الغرفة كلها، وترجع تحطها گدام رجلچ. عيونها تسأل: منو گطعها؟)',
          intro: [
            { camera: { between: ['husky', 'anji'] }, ms: 300 },
            { all: [{ move: 'husky', x: 720, speed: 320 }, { sfx: 'whoosh' }] },
            { pose: 'husky', anim: 'excited', for: 500 },
            { all: [{ move: 'husky', x: 380, speed: 360 }, { pose: 'lama', anim: 'laugh', for: 1100 }, { jolt: 'sabri', type: 'hop' }] },
            { move: 'husky', to: 'anji', gap: 46, speed: 360 },
            { face: 'husky', toward: 'anji' },
            { pose: 'husky', anim: 'sit', for: 1200 },
          ],
          onWrong: [{ pose: 'husky', anim: 'sniff', for: 900 }],
          deflect: 's2.17-deflect-husky',
          answered: [{ say: 's2.17-ok-husky' }],
        },
        {
          // she gave the treasures back: Snooki, who knew all along, wants to hear her say it
          if: 'dec:stash=return',
          who: 'snooki',
          name: 'سنوكي يسأل',
          t: 'الصفحة بيها ريحة حلويات ريان. يعني ريان هو اللي گطعها؟ … آني ما أتهم. آني أسأل.',
          intro: [{ move: 'snooki', to: 'anji', gap: 58, speed: 120 }, { face: 'snooki', toward: 'anji' }, { camera: { between: ['snooki', 'anji'] }, ms: 400 }, { pose: 'snooki', anim: 'sit', for: 1000 }],
          onWrong: [{ pose: 'snooki', anim: 'stubborn', for: 900 }],
          deflect: 's2.17-deflect-snooki',
          answered: [{ say: 's2.17-ok-snooki' }, goHome('snooki')],
        },
      ],
    },
    {
      id: 'd-sister',
      answer: ['d-chain'], // the chain of words ends with her: a note written to protect her sister
      variants: [
        {
          if: 'dec:sister-wish=read',
          who: 'sister',
          name: 'أختي تسأل',
          t: 'گريتي اللي ما كملته. يعني تعرفين ليش كتبت الورقة؟ لا تگولين «نية طيبة». جيبي دليل، مو نية.',
          intro: stepUp('sister', [{ jolt: 'sister', type: 'hop', ms: 400 }, { jolt: 'sister', type: 'lunge', ms: 500 }, { pose: 'sister', anim: 'lean', for: 900 }]),
          onWrong: [{ pose: 'sister', anim: 'cross', for: 900 }],
          deflect: 's2.17-deflect-sister',
          answered: [{ say: 's2.17-ok-sister-read' }, goHome('sister')],
        },
        {
          if: 'dec:sister-wish=leave',
          who: 'sister',
          name: 'أختي تسأل',
          t: 'ما گريتي البطاقة. زين… شكراً. بس الورقة اللي بلا توقيع: منو يكتب ورقة بلا اسمه، إذا ما ناوي شر؟',
          intro: stepUp('sister', [{ jolt: 'sister', type: 'hop', ms: 400 }, { pose: 'sister', anim: 'cross', for: 900 }, { jolt: 'sister', type: 'lunge', ms: 500 }]),
          onWrong: [{ pose: 'sister', anim: 'cross', for: 900 }],
          deflect: 's2.17-deflect-sister',
          answered: [{ say: 's2.17-ok-sister-left' }, goHome('sister')],
        },
      ],
    },
    {
      id: 'd-ryan',
      answer: ['e-surprise', 'e-loft', 'e-receipt'], // what he hid was a surprise, for her
      variants: [
        {
          who: 'ryan',
          name: 'ريان يسأل',
          t: 'وآني؟ چنت أخبي شي. صح. إذا هاي دائرة بنية طيبة… شنو اللي چنت أخبيه؟',
          intro: [...stepUp('ryan'), { jolt: 'ryan', type: 'tilt', ms: 500 }],
          onWrong: [{ jolt: 'ryan', type: 'hop' }],
          deflect: 's2.17-deflect-ryan',
          answered: [{ say: 's2.17-ok-ryan' }],
        },
      ],
    },
  ],
};

export const DEFENCE = {
  id: 's2-defence',
  title: 'الدفاع عن نظرية',
  save: 's2:17',
  solved: 's2:17-holds',
  config: {
    hypotheses: Object.keys(HYPOTHESES),
    challenges: Object.fromEntries(Object.entries(CHALLENGES).map(([hyp, list]) => [hyp, list.map((c) => ({ id: c.id, answer: c.answer }))])),
  },
  hypotheses: HYPOTHESES,
  challenges: CHALLENGES,
  homes: { ...HOME, snooki: SNOOKI_HOME },
  labels: {
    board: 'لوحة الدائرة',
    choose: 'أي نظرية تدافعين عنها گدام الكل؟',
    brokenTag: 'انكسرت مرة',
    present: 'أي دليل يجاوب على سؤاله؟',
    broken: 'النظرية انكسرت. اللوحة تنتظر: اختاري من جديد.',
    stepBack: [{ say: 's2.17-step-back' }],
  },
};

/* ── the ending (the garden at night) ── */
const ENDING_LIGHT = [
  { camera: 660, ms: 800 },
  { say: 's2.17-garden' },
  { all: [{ move: 'anji', x: 800, speed: 150 }, { camera: { between: ['anji', 'ryan'] }, ms: 700 }] },
  { face: 'ryan', toward: 'anji' },
  { say: 's2.17-match' },
  { move: 'ryan', x: 935, speed: 110 },
  { face: 'ryan', dir: 1 },
  { jolt: 'ryan', type: 'hop', ms: 500 },
  { fx: LIT, quiet: true },
  { sfx: 'sparkle' },
  {
    all: [
      { puff: 'ryan', type: 'sparkle', ms: 1800 },
      { pose: 'lama', anim: 'laugh', for: 1400 },
      { jolt: 'sabri', type: 'hop' },
      { pose: 'sabri', anim: 'handsup', for: 1200 },
      { pose: 'rabi', anim: 'point', for: 1200 },
      { jolt: 'sister', type: 'lunge', ms: 500 },
      { pose: 'jojo', anim: 'laugh', for: 1200 },
      { pose: 'husky', anim: 'excited', for: 1400 },
      { pose: 'snooki', anim: 'wag', for: 1400 },
    ],
  },
  { face: 'ryan', toward: 'anji' },
  { camera: { between: ['anji', 'ryan'] }, ms: 400 },
  { say: 's2.17-light' },
  { camera: 1150, ms: 900 },
  { say: 's2.17-follow' },
];
const ENDING_SURPRISE = [
  { pose: 'anji', anim: 'crouch', for: 900 },
  { fx: ROSES, quiet: true },
  { say: 's2.17-roses' },
  { move: 'ryan', to: 'anji', gap: 74, speed: 130 },
  { camera: { between: ['ryan', 'anji'] }, ms: 500 },
  { say: 's2.17-clinic' },
  // everyone comes over while the two of them talk
  { move: 'jojo', x: 960, speed: 150, async: true },
  { move: 'rabi', x: 1010, speed: 200, async: true },
  { move: 'lama', x: 1060, speed: 190, async: true },
  { move: 'sabri', x: 1110, speed: 210, async: true },
  { say: 's2.17-stamp' },
  { camera: { between: ['rabi', 'anji'] }, ms: 500 },
  { say: 's2.17-rabi' },
  { say: 's2.17-husky' },
  { say: 's2.17-sabri' },
  { say: 's2.17-page' },
  // her sister, last: the two of them under the lanterns
  { move: 'ryan', x: 1400, speed: 130, async: true },
  { move: 'sister', to: 'anji', gap: 76, speed: 120 },
  { camera: { between: ['sister', 'anji'] }, ms: 600 },
  { say: 's2.17-sister' },
  { camera: EIGHTH.x, ms: 1000 },
  { say: 's2.17-close' },
  { fx: END },
];

/* ── the garden at night: the season's last place ── */
const S2_FINALE = {
  id: 's2-finale',
  title: 'الحديقة اللي ما تنام',
  theme: 'garden-night',
  music: 'night',
  width: 1500,
  spawn: 140,
  seed: 1717,
  props: [{ type: 'bush', x: 120 }, { type: 'bench', x: 1160 }, { type: 'bush', x: 1450 }],
  actors: [
    { id: 'rabi', kind: 'rabi', x: 300, facing: 1, mood: 'smile', if: DEFENDED },
    { id: 'lama', kind: 'lama', x: 380, facing: 1, mood: 'smile', if: DEFENDED },
    { id: 'sabri', kind: 'sabri', x: 460, facing: 1, if: DEFENDED },
    { id: 'jojo', kind: 'jojo', x: 560, facing: -1, mood: 'smile', if: DEFENDED },
    { id: 'sister', kind: 'sister', x: 700, facing: -1, idleFx: 'sway', mood: 'suspicious', notice: { dist: 100, jolt: 'lunge' }, if: DEFENDED },
    { id: 'ryan', kind: 'ryan', x: 900, facing: -1, if: DEFENDED },
  ],
  dynamic: [
    { x: 640, reach: 420, draw: (ctx, { P }) => P.tree(ctx, 640, GROUND, 240, seeded(17), { color: '#1f3b46' }) },
    ...TREE_LANTERNS.map((l) => ({ x: l.x, reach: 60, draw: (ctx, { t, world }) => paperLantern(ctx, l.x, GROUND + l.y, true, t, world.reduced) })),
    { x: EIGHTH.x, reach: 80, draw: (ctx) => hookPost(ctx, EIGHTH.x + 6) },
    { x: EIGHTH.x, reach: 90, if: LIT, draw: (ctx, { t, world }) => eighthLantern(ctx, EIGHTH.x, EIGHTH.y, true, t, world.reduced) },
    {
      // before it is lit, Ryan holds it
      x: 900,
      reach: 2000,
      if: `!${LIT}`,
      draw: (ctx, { t, world }) => {
        const r = world.actor('ryan');
        if (r?.visible) eighthLantern(ctx, r.x + r.facing * 18, r.y - 62, false, t, world.reduced);
      },
    },
    { x: ROSE_X, reach: 80, draw: (ctx, { P }) => P.roseBush(ctx, ROSE_X, GROUND, 74, 46, seeded(23), { tone: 'white', roses: 9 }) },
    { x: ROSE_X - 34, reach: 40, if: LIT, draw: (ctx) => sweetsBox(ctx, ROSE_X - 34) },
    { x: 750, reach: 3000, front: true, draw: night },
    { x: 1150, reach: 200, front: true, if: [LIT, `!${ROSES}`], draw: lightPath },
    { x: 750, reach: 3000, front: true, draw: letterbox },
  ],
  interact: [
    {
      id: 'eighth',
      x: EIGHTH.x,
      w: 50,
      h: 230,
      label: 'الفانوس الثامن',
      icon: '🏮',
      if: LIT,
      run: [{ say: 's2.17-riddle' }],
    },
    {
      id: 'roses',
      x: ROSE_X,
      w: 80,
      h: 90,
      label: 'الورد الأبيض',
      icon: '🌹',
      if: LIT,
      // after the ending, the same scene again (the ending can be replayed: the case room's door leads here)
      cases: [{ if: `!${END}`, run: ENDING_SURPRISE }, { run: [{ say: 's2.17-replay' }, ...ENDING_SURPRISE] }],
    },
    ...['rabi', 'lama', 'sabri', 'jojo', 'sister', 'ryan'].map((id) => ({
      id,
      actor: id,
      x: { rabi: 300, lama: 380, sabri: 460, jojo: 560, sister: 700, ryan: 900 }[id],
      w: 46,
      h: 120,
      label: { rabi: 'ربيع', lama: 'لمى', sabri: 'صبري', jojo: 'العم جوجو', sister: 'أختي', ryan: 'ريان' }[id],
      icon: '💬',
      if: DEFENDED,
      run: [{ say: `s2.17-night-${id}` }],
    })),
  ],
  triggers: [{ id: 'arrive', x1: 100, x2: 360, once: false, if: [DEFENDED, `!${LIT}`], run: ENDING_LIGHT }],
  exits: [{ side: 'left', to: 's2-caseroom', spawn: 1180 }],
  ambient: [{ t: 'ثمان فوانيس… والحديقة ساكتة، تسمع.' }, { t: 'ريحة ورد أبيض، وشمع، وشوية حلويات.' }],
};

/* ── the module ── */
export default {
  id: 'm06',
  missions: [
    {
      id: 's2-17',
      kind: 'story',
      pack: PACK_S2,
      act: 3,
      day: 18,
      world: ['s2-caseroom'],
      title: 'حقيقة البطاقة',
      where: 'غرفة الدائرة',
      summary: 'اللوحة مليانة أدلة، والكل جا لغرفة الدائرة. وقت تگولين شنو صار بليلة الفوانيس… وتثبتينه گدامهم.',
      unlock: OPEN,
      locked: 'ينفتح بعد «ليلة الفوانيس».',
      // steps say what to do, never which order, which theory or which piece of evidence
      steps: [
        { done: ORDERED, world: 's2-caseroom', text: 'الكل بغرفة الدائرة. رتّبي ليلة الفوانيس على اللوحة، من أولها لآخرها.' },
        { done: DEFENDED, world: 's2-caseroom', text: 'اختاري نظرية، ودافعي عنها گدام الكل. كل واحد عنده سؤال.' },
        { done: LIT, world: 's2-caseroom', text: 'الكل طلع للحديقة. الحگيهم.' },
        { done: END, world: 's2-caseroom', text: 'امشي ورا الضو.' },
      ],
      reward: ['journal:s2-truth', 'journal:s2-m2-end'],
      rewardText: 'الدائرة المغلقة',
      leadsTo: [], // the season's last mission (M2's terminal)
    },
  ],
  evidence: {
    'd-case': { rel: 'deduction', icon: 'mark', label: 'الدائرة المغلقة', note: 'محد خرّب. كل واحد شاف جزء من الليلة وسوّى شي صغير. وفعلين انسوّوا بنية طيبة: سر ريان، وورقة أختي.' },
  },
  decisions: {}, // this mission makes none: it reads them all
  case: [{ mission: 's2-17', ids: ['d-case'] }],
  journal: {
    's2-truth': { title: 'حقيقة البطاقة', icon: 'heart', text: 'محد خرّب ليلة الفوانيس. جملة انگالت صح ووصلت غلط، وساعة ما انقدّمت، وكلبة تحب الحلويات. وفعلين بنية طيبة: سر ريان، وورقة أختي.' },
    's2-m2-end': { title: 'الحديقة اللي ما تنام', icon: 'moon-full', text: 'ثمان فوانيس مضوية، وصفحة جديدة بالسجل، بخطي. ملف الدائرة المغلقة… انسدّ.' },
  },
  puzzles: {
    's2-night-order': {
      type: 'arrange',
      title: 'الليلة لحظة لحظة',
      goal: 'رتّبي ست لحظات من ليلة الفوانيس، من أولها لآخرها.',
      intro: 'كل لحظة عليها شي لگيتيه بنفسچ. اقرئي دفترچ، وفكري: شنو لازم يصير قبل شنو؟',
      example: CLUES_HTML,
      config: {
        slots: ORDER.map((id, i) => ({ id: `t${i + 1}`, label: SLOT_LABELS[i], accepts: [id] })),
        pieces: [
          { id: 'lanterns', label: 'سبع فوانيس تولع، والثامن يبقى بالعلّية', icon: 'star' },
          { id: 'page', label: 'صفحة السجل تنگطع', icon: 'paw' },
          { id: 'words', label: 'الجملة «ريان يخبي شي» توصل لأختي', icon: 'bird' },
          { id: 'clock', label: 'ساعة الحديقة تگول: تسعة', icon: 'moon-half' },
          { id: 'note', label: 'ورقة بلا توقيع تنحط على طاولة ريان', icon: 'feather' },
          { id: 'card', label: '«إلى أنجي —» تنمسح من البطاقة', icon: 'heart' },
        ],
        checkLabel: 'هذا ترتيب الليلة ✓',
      },
      wrong: [],
      success: 'هاي هي الليلة، لحظة لحظة.',
      reward: [ORDERED],
    },
  },
  dialogue: {
    /* ── the case room ── */
    's2.17-gather': [
      { s: 'narrator', t: '(غرفة الدائرة مليانة. الكل جا.)', act: [{ camera: { between: ['rabi', 'sister'] }, ms: 600 }] },
      { s: 'lama', e: 'smile', t: 'أنجي! جبت الكل. عدّيتهم: ستة، وسنوكي. وسنوكي هالمرة مو ضيف رسمي.', act: [{ camera: 'lama', ms: 350 }, { pose: 'lama', anim: 'point', for: 900 }] },
      { s: 'snooki', e: 'smug', t: 'إهانة رسمية.', act: [{ camera: 'snooki', ms: 350 }] },
      { s: 'sabri', e: 'smile', t: 'آني جيت بالوقت. الوقت الصدگ، مو وقت ساعة الحديقة.', act: [{ camera: 'sabri', ms: 350 }, { jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'laugh', for: 900 }] },
      { s: 'jojo', e: 'shy', t: 'سمعتك، صبري.', act: [{ camera: 'jojo', ms: 350 }, { pose: 'jojo', anim: 'facepalm', for: 1100 }] },
      { s: 'rabi', e: 'smile', t: 'إذا تحتاجين أحد يمسك اللوحة، آني هنا.', act: [{ camera: 'rabi', ms: 350 }, { pose: 'rabi', anim: 'point', for: 800 }] },
      { s: 'sister', e: 'suspicious', t: 'يلا يا محققة. خلي نشوف.', act: [{ camera: 'sister', ms: 350 }, { jolt: 'sister', type: 'lunge', ms: 500 }, { pose: 'sister', anim: 'cross', for: 1200 }] },
      { s: 'ryan', e: 'smile', t: 'الدفاتر مفتوحة، واللوحة يمّچ.', act: [{ camera: 'ryan', ms: 350 }, { jolt: 'ryan', type: 'hop' }] },
      { s: 'anji', e: 'determined', t: 'اليوم نرتب الليلة، من أولها لآخرها. وبعدين كل واحد يسأل اللي يريده.', act: [{ camera: 'anji', ms: 350 }] },
    ],
    's2.17-board-intro': [{ s: 'anji', e: 'thinking', t: 'ست لحظات من الليلة. على كل وحدة عندي شي لگيته… بس مو بالترتيب.' }],
    's2.17-order-done': [
      { s: 'anji', e: 'soft', t: 'هاي هي الليلة. لحظة لحظة.' },
      { s: 'lama', e: 'smile', t: 'نفس الترتيب اللي بقلبي! … تقريباً.', act: [{ pose: 'lama', anim: 'laugh', for: 1000 }] },
      { s: 'jojo', e: 'thinking', t: 'والساعة… بمكانها الصح بالحكاية. مو أكثر.', act: [{ pose: 'jojo', anim: 'think', for: 1000 }] },
      { s: 'anji', e: 'determined', t: 'عرفنا متى. هسه: شنو صار. أختار نظرية… وأدافع عنها.' },
    ],
    's2.17-defend-intro': [
      { s: 'ryan', t: 'أربع نظريات على اللوحة. تختارين وحدة، وكلنا نسأل.', act: [{ jolt: 'ryan', type: 'hop' }] },
      { s: 'sister', e: 'smile', t: 'وآني أسأل أصعب سؤال.', act: [{ jolt: 'sister', type: 'lunge', ms: 500 }] },
      { s: 'anji', e: 'smirk', t: 'جربي.' },
    ],
    's2.17-board-garden': [{ s: 'anji', e: 'soft', t: 'اللوحة صارت ساكتة. الكل طلع للحديقة… والباب مفتوح.' }],
    's2.17-board-closed': [{ s: 'anji', e: 'soft', t: 'القضية انسدّت. والحديقة بالليل تنتظر، إذا ردت أرجعلها.' }],
    's2.17-ryan-room': [{ s: 'ryan', e: 'smile', t: 'الكل هنا. اللوحة يمّچ. آني بس أمسك الختم… مؤقتاً.' }],
    's2.17-talk-rabi': [{ s: 'rabi', e: 'smile', t: 'خذي وقتچ. اللوحة ما تهرب.' }],
    's2.17-talk-lama': [{ s: 'lama', e: 'smile', t: 'إذا تحتاجين أحد يعدّ شي، آني موجودة. … هالمرة بدون سنوكي.' }],
    's2.17-talk-sabri': [
      { if: 'dec:office-cover=cover', then: [{ s: 'sabri', e: 'smile', t: 'الطابعة تسلّم عليچ. … لا تباوعيني هيچ.' }] },
      { if: '!dec:office-cover=cover', then: [{ s: 'sabri', e: 'smile', t: 'آني اليوم ساكت. حرف بحرف… ساكت.' }] },
    ],
    's2.17-talk-jojo': [{ s: 'jojo', e: 'smile', t: 'شيكت ساعتي ثلاث مرات قبل ما أجي. احتياط.' }],
    's2.17-talk-sister': [{ s: 'sister', e: 'suspicious', t: 'آني بس جاية أسمع. وأسأل. وأربح.' }],

    /* ── the defence: what people say when an answer is not one (it never says how close) ── */
    's2.17-deflect-rabi': [{ s: 'rabi', e: 'thinking', t: 'هذا صار، صح. بس «عن قصد»؟ مو هذا اللي يگوله.' }],
    's2.17-deflect-jojo-b': [{ s: 'jojo', e: 'thinking', t: 'هذا يثبت شي، بنتي. بس مو الأذى.' }],
    's2.17-deflect-sister': [{ s: 'sister', e: 'suspicious', t: 'هممم. لا.', act: [{ pose: 'sister', anim: 'cross', for: 900 }] }],
    's2.17-deflect-lama': [{ s: 'lama', e: 'thinking', t: 'هذا دليل… بس مو على سؤالي.' }],
    's2.17-deflect-sabri': [{ s: 'sabri', e: 'thinking', t: 'حلو. بس مو جواب.' }],
    's2.17-deflect-jojo': [{ s: 'jojo', e: 'smile', t: 'هذا؟ حلو. بس مو جوابي، بنتي.' }],
    's2.17-deflect-husky': [{ s: 'narrator', t: '({husky} تشم الدليل… وتعطس. وترجع تباوع للورقة.)' }],
    's2.17-deflect-snooki': [{ s: 'snooki', e: 'serious', t: 'لا. هذا مو جواب. فكري.' }],
    's2.17-deflect-ryan': [{ s: 'ryan', e: 'smile', t: 'لا… مو هذا. بس حلوة المحاولة.' }],
    's2.17-step-back': [{ s: 'anji', e: 'thinking', t: 'لحظة. خلّي أرتب أفكاري، وأرجع.' }],

    /* ── a theory breaks: the person it would have blamed reacts ── */
    's2.17-broke-a': [
      { s: 'rabi', e: 'worried', t: 'يعني… آني المخرّب؟ آني بس نقلت بطاقة حتى لا تضيع بالظلمة.', act: [{ camera: { between: ['rabi', 'anji'] }, ms: 350 }, { pose: 'rabi', anim: 'facepalm', for: 1200 }] },
      { s: 'jojo', e: 'worried', t: 'ولا آني! آني بس… نسيت ساعة.', act: [{ camera: 'jojo', ms: 350 }, { jolt: 'jojo', type: 'shake', ms: 700 }, { puff: 'jojo', type: 'sweat', ms: 2200 }] },
      { s: 'sister', e: 'suspicious', t: 'مخرّب؟ بيناتنا؟ باوعي زين لوجوهنا.', act: [{ camera: 'sister', ms: 350 }, { jolt: 'sister', type: 'hop', ms: 400 }, { jolt: 'sister', type: 'lunge', ms: 500 }, { pose: 'sister', anim: 'cross', for: 1200 }] },
      { s: 'anji', e: 'soft', t: 'معاكم حق. ماكو شي واحد انسوّى حتى يخرّب. هاي النظرية… تنشال.', act: [{ camera: 'anji', ms: 350 }] },
    ],
    's2.17-broke-b': [
      { s: 'narrator', t: '(ريان ما يحچي. يرجع خطوة، ويباوع للگاع.)', act: [{ camera: 'ryan', ms: 350 }, { move: 'ryan', x: 1040, speed: 70 }, { face: 'ryan', dir: 1 }, { emote: 'ryan', icon: '…', ms: 1800 }] },
      { s: 'ryan', t: '… إذا هيچ شفتيها، أفهم ليش.' },
      { s: 'ryan', e: 'smile', t: 'بس مو هيچ. ما زعلت منچ. انتظري شوية… وتشوفين.', act: [{ face: 'ryan', toward: 'anji' }, { jolt: 'ryan', type: 'tilt', ms: 500 }] },
      { s: 'snooki', e: 'serious', t: 'ريان ما يأذي حتى نملة. … مرة داس على وحدة. بالغلط. وزعل.', act: [{ camera: 'snooki', ms: 350 }, { pose: 'snooki', anim: 'stubborn', for: 1200 }] },
      { s: 'anji', e: 'soft', t: '… «يأذي» ما عندي عليها ولا دليل. تنشال.', act: [{ camera: 'anji', ms: 350 }] },
    ],
    's2.17-broke-c': [
      { s: 'jojo', e: 'shy', t: 'الساعة… يعني آني اللي نسيتها. بس الساعة ما تكتب، بنتي. ولا تمسح.', act: [{ camera: { between: ['jojo', 'anji'] }, ms: 350 }, { pose: 'jojo', anim: 'facepalm', for: 1300 }, { puff: 'jojo', type: 'steam', ms: 1600 }] },
      { s: 'sister', e: 'smile', t: 'شفتي؟ حتى عمو جوجو يدافع عن الساعة.', act: [{ camera: 'sister', ms: 350 }, { pose: 'sister', anim: 'laugh', for: 1100 }] },
      { s: 'anji', e: 'thinking', t: 'الساعة جزء من الحكاية… مو الحكاية كلها. تنزل من اللوحة.', act: [{ camera: 'anji', ms: 350 }] },
    ],

    /* ── D: each challenge answered ── */
    's2.17-ok-lama': [
      { s: 'anji', e: 'determined', t: 'أرقامچ صح، لمى. نسختچ كتبت وكت ساعة الحديقة… والساعة چانت متأخرة ساعة.' },
      { s: 'lama', e: 'surprised', t: 'يعني آني صح… والساعة اللي غلط!', act: [{ jolt: 'lama', type: 'hop' }, { pose: 'lama', anim: 'laugh', for: 1100 }] },
      { s: 'lama', e: 'smile', t: 'أكتبها بالأحمر. «الساعة غلطت، مو لمى.»' },
    ],
    's2.17-ok-sabri-cover': [
      { s: 'anji', e: 'determined', t: 'محد غيّرها عن قصد، صبري. كل واحد اختصرها شوية… وكل مرة صارت أخوف.' },
      { s: 'sabri', e: 'worried', t: 'يعني… الطابعة بريئة؟ أوكي. آني گلتها. حرف بحرف. هاي، اعترفت.', act: [{ pose: 'sabri', anim: 'facepalm', for: 1200 }, { jolt: 'sabri', type: 'shake', ms: 500 }] },
      { s: 'lama', e: 'smile', t: 'أخيراً.', act: [{ camera: 'lama', ms: 350 }, { pose: 'lama', anim: 'cross', for: 1000 }] },
    ],
    's2.17-ok-sabri': [
      { s: 'anji', e: 'determined', t: 'محد غيّرها عن قصد، صبري. كل واحد اختصرها شوية… وكل مرة صارت أخوف.' },
      { s: 'sabri', e: 'smile', t: 'أقصر… وأخوف. ولا واحد كذب. أوكي. هاي أريحتني.', act: [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'laugh', for: 1000 }] },
    ],
    's2.17-ok-jojo-gentle': [
      { s: 'anji', e: 'soft', t: 'عن قصد، إي، عمو. بس مثل ما انطلب: واحد طلب، وواحد حفظ. هذا مو تخريب.' },
      { s: 'jojo', e: 'smile', t: 'وآني حفظته. الله يخليچ، بنتي.', act: [{ jolt: 'jojo', type: 'hop' }, { pose: 'jojo', anim: 'laugh', for: 1000 }] },
    ],
    's2.17-ok-jojo-blunt': [
      { s: 'anji', e: 'determined', t: 'عن قصد، إي. بس مثل ما انطلب: واحد طلب، وواحد حفظ. هذا مو تخريب، عمو.' },
      { s: 'jojo', e: 'thinking', t: 'عن قصد… ومو تخريب. صح. وهالمرة ما عندي قصة رابعة.', act: [{ pose: 'jojo', anim: 'cross', for: 1200 }] },
      { s: 'jojo', e: 'smile', t: '… جواب قوي. مثل صاحبته.' },
    ],
    's2.17-ok-husky': [
      { s: 'narrator', t: '({husky} تشوف آثار سنونها على الصفحة… وتسوي نفسها ما تعرف شي.)', act: [{ pose: 'husky', anim: 'wag', for: 1400 }] },
      { s: 'ryan', e: 'smile', t: 'المخرّبة الوحيدة بالقضية… تحب الحلويات.', act: [{ camera: 'ryan', ms: 350 }, { jolt: 'ryan', type: 'hop' }] },
      { s: 'lama', e: 'smile', t: 'وگطعت الصفحة لأن ورقة الحلويات بنصها! منطقي جداً.', act: [{ camera: 'lama', ms: 350 }, { pose: 'lama', anim: 'laugh', for: 1200 }, { pose: 'husky', anim: 'celebrate', for: 1200 }] },
    ],
    's2.17-ok-snooki': [
      { s: 'snooki', e: 'proud', t: 'صح. آني چنت أعرف. بس ردت أسمعها منچ.', act: [{ pose: 'snooki', anim: 'wag', for: 1300 }] },
      { s: 'narrator', t: '({husky} تحط راسها على رجلها، وتسوي نفسها نايمة.)', act: [{ pose: 'husky', anim: 'sit', for: 1400 }] },
    ],
    's2.17-ok-sister-read': [
      { s: 'anji', e: 'soft', t: 'الكلام وصل لچ مخيف، وإنتِ خفتي عليّ. فكتبتي الورقة. هاي آخر حلقة بالسلسلة، مو شر.' },
      { s: 'sister', e: 'shy', t: '… إي. آني. ردت أحميچ… بطريقة غبية.', act: [{ pose: 'sister', anim: 'shrug', for: 1200 }] },
    ],
    's2.17-ok-sister-left': [
      { s: 'anji', e: 'soft', t: 'الكلام وصل لچ مخيف، وإنتِ خفتي عليّ. فكتبتي الورقة. هاي آخر حلقة بالسلسلة، مو شر.' },
      { s: 'sister', e: 'smile', t: 'إي. الورقة مالتي. والبطاقة… خليها إلي.', act: [{ pose: 'sister', anim: 'cross', for: 1200 }] },
    ],
    's2.17-ok-ryan': [
      { s: 'ryan', e: 'smile', t: '… إي. هذا هو. وبعده ما خلص.', act: [{ puff: 'ryan', type: 'sparkle', ms: 1600 }, { jolt: 'ryan', type: 'hop' }] },
    ],
    's2.17-held': [
      { s: 'narrator', t: '(محد عنده سؤال ثاني.)', act: [{ camera: { between: ['rabi', 'sister'] }, ms: 600 }] },
      { s: 'anji', e: 'soft', t: 'محد خرّب. كل واحد شاف جزء من الليلة… وسوّى شي صغير. وفعلين انسوّوا بنية طيبة.', act: [{ camera: 'anji', ms: 350 }] },
      {
        s: 'anji',
        e: 'determined',
        t: 'عندي دليل. عندي نظرية. وهسه… أعرف شنو صار.',
        act: [{ all: [{ pose: 'lama', anim: 'laugh', for: 1200 }, { jolt: 'sabri', type: 'hop' }, { pose: 'rabi', anim: 'point', for: 1000 }, { pose: 'jojo', anim: 'laugh', for: 1000 }, { pose: 'husky', anim: 'celebrate', for: 1200 }] }],
      },
      { s: 'jojo', e: 'smile', t: 'دائرة مغلقة، وما بيها أحد شرير. حتى الساعة.', act: [{ camera: 'jojo', ms: 350 }] },
      { s: 'sister', e: 'shy', t: '… حتى آني؟', act: [{ camera: { between: ['sister', 'anji'] }, ms: 350 }, { jolt: 'sister', type: 'lunge', ms: 400 }] },
      { s: 'anji', e: 'soft', t: 'حتى إنتِ. ورقتچ چانت خوف عليّ. مو شر.' },
    ],
    's2.17-to-garden': [
      { s: 'ryan', e: 'smile', t: 'زين. القضية انحلّت. وهسه… أكو شي لازم يصير من زمان. تعالوا كلكم للحديقة.', act: [{ camera: 'ryan', ms: 350 }, { jolt: 'ryan', type: 'hop' }] },
      { s: 'snooki', e: 'proud', t: 'أخيراً. آني ساكت من أسبوع.' },
    ],

    /* ── the garden at night ── */
    's2.17-garden': [
      { s: 'narrator', t: '(الحديقة بالليل. سبع فوانيس بالشجرة، وكلها مضوية.)' },
      { s: 'lama', e: 'smile', t: 'سبعة! عدّيتهم مرتين. وسنوكي ما عدّيته.', act: [{ camera: 'lama', ms: 350 }, { pose: 'lama', anim: 'think', for: 1000 }] },
      { s: 'snooki', e: 'smug', t: 'إهانة ثانية.', act: [{ camera: 'snooki', ms: 350 }] },
      { s: 'ryan', t: 'بس… بقى واحد.', act: [{ camera: 'ryan', ms: 350 }, { jolt: 'ryan', type: 'hop' }] },
    ],
    's2.17-match': [
      {
        if: 'dec:jojo-confront=gentle',
        then: [
          { s: 'jojo', e: 'smile', t: 'خذ، ابني. والساعة هالمرة مضبوطة… شيكتها ثلاث مرات.', act: [{ move: 'jojo', to: 'ryan', gap: 60, speed: 130 }, { jolt: 'jojo', type: 'hop' }] },
          { s: 'ryan', e: 'smile', t: 'شكراً عمو. على العلّية… وعلى السكوت.' },
          { s: 'jojo', e: 'smile', t: 'السر سرك. آني بس حرسته.', act: [{ pose: 'jojo', anim: 'laugh', for: 900 }] },
        ],
      },
      {
        if: 'dec:jojo-confront=blunt',
        then: [
          { s: 'jojo', e: 'thinking', t: 'تفضل. وإذا أحد يسأل: الساعة مضبوطة.', act: [{ move: 'jojo', to: 'ryan', gap: 60, speed: 130 }, { pose: 'jojo', anim: 'cross', for: 1000 }] },
          { s: 'anji', e: 'soft', t: 'عمو… يمكن چنت قاسية وياك، يوم القصص.' },
          { s: 'jojo', e: 'smile', t: 'القاسي الصدگ، بنتي. وإنتِ گلتيه. … بس الساعة مضبوطة.', act: [{ jolt: 'jojo', type: 'hop' }] },
        ],
      },
      {
        if: ['!dec:jojo-confront=gentle', '!dec:jojo-confront=blunt'],
        then: [{ s: 'jojo', e: 'smile', t: 'تفضل، ابني. الساعة مضبوطة.', act: [{ move: 'jojo', to: 'ryan', gap: 60, speed: 130 }] }],
      },
    ],
    's2.17-light': [
      { s: 'narrator', t: '(ريان يعلّگ الفانوس الثامن على الحلگة… ويولعه.)' },
      { s: 'ryan', e: 'smile', t: 'الثامن. چان لازم يولع بالتسعة. التسعة الصدگ.' },
      { s: 'anji', e: 'smirk', t: 'اللي چانت عشرة.' },
      { s: 'ryan', t: '… إي. هاي.', act: [{ emote: 'ryan', icon: '…', ms: 1400 }] },
      { s: 'note', t: 'بطاقة على الفانوس، بخط ريان: «ضويني… وامشي ورا ضوي. بآخره شي تعرفينه من قبل.»' },
    ],
    's2.17-follow': [{ s: 'anji', e: 'curious', t: 'ورا الضو…' }],
    's2.17-riddle': [
      { s: 'note', t: '«ضويني… وامشي ورا ضوي. بآخره شي تعرفينه من قبل.»' },
      { s: 'anji', e: 'smile', t: 'الفانوس الثامن. أخيراً مضوي.' },
    ],
    's2.17-roses': [
      { s: 'narrator', t: '(تحت الورد الأبيض: علبة حلويات، ملفوفة بشريطة… مثل شريطة الفانوس الثامن.)' },
      { s: 'anji', e: 'surprised', t: 'ورد أبيض… وحلويات. من نفس المحل اللي بالوصل.' },
    ],
    's2.17-clinic': [
      { s: 'ryan', e: 'smile', t: 'چانت لازم تبين بالتسعة. بعدين صارت عشرة… وبعدين صارت قضية.' },
      { s: 'anji', e: 'soft', t: 'تذكرني بذاك اليوم بالعيادة.' },
      { s: 'ryan', e: 'smile', t: '… هذا چان القصد.', act: [{ pose: 'snooki', anim: 'wag', for: 1200 }] },
      {
        if: 'flag:s2:17-broke-b',
        then: [
          { s: 'ryan', e: 'smile', t: 'ونظرية B؟' },
          { s: 'anji', e: 'smirk', t: 'انكسرت. وإنت شفتها تنكسر.' },
          { s: 'ryan', e: 'smile', t: 'شفتها. وما زعلت… هواية.' },
        ],
        else: [
          { s: 'ryan', e: 'smile', t: 'حتى ما شكّيتي بيّه؟ ولا مرة؟' },
          { s: 'anji', e: 'smirk', t: 'ما گلت هيچ.' },
        ],
      },
    ],
    's2.17-stamp': [
      {
        if: 'dec:lead=ryan',
        then: [
          { s: 'ryan', e: 'smile', t: 'الدفتر الرسمي يحتاج آخر ختم. … تفضلي. الرئيس يسلّم الختم.', act: [{ jolt: 'ryan', type: 'hop' }] },
          { s: 'anji', e: 'smirk', t: 'الرئيس؟ من امتى تسلّم شي بسهولة؟' },
          { s: 'ryan', e: 'smile', t: 'من الليلة.' },
          { s: 'narrator', t: '(أنجي تختم الصفحة الأخيرة: طگ!) «القضية رقم واحد: انحلّت.»', act: [{ pose: 'anji', anim: 'celebrate', for: 900 }] },
        ],
      },
      {
        if: 'dec:lead=anji',
        then: [
          { s: 'anji', e: 'smirk', t: 'الختم وياي، تذكر؟ من أول يوم.', act: [{ pose: 'anji', anim: 'celebrate', for: 900 }] },
          { s: 'narrator', t: '(أنجي تختم دفتر ريان الرسمي: طگ!) «القضية رقم واحد: انحلّت.»' },
          { s: 'ryan', t: 'الانقلاب اكتمل.', act: [{ puff: 'ryan', type: 'steam', ms: 1200 }] },
          { s: 'snooki', e: 'proud', t: 'آني شاهد.' },
        ],
      },
      {
        if: ['!dec:lead=ryan', '!dec:lead=anji'],
        then: [{ s: 'narrator', t: '(ريان يطلّع دفتره الرسمي، ويختمه: «القضية رقم واحد: انحلّت.»)' }],
      },
    ],
    's2.17-rabi': [
      { s: 'rabi', e: 'smile', t: 'ريان، الفانوس الثامن أحلى فانوس الليلة. واضح تعبت عليه.', act: [{ pose: 'rabi', anim: 'point', for: 900 }] },
      {
        if: 'dec:jealous-talk=reassure',
        then: [
          { s: 'ryan', e: 'smile', t: 'شكراً ربيع.' },
          { s: 'narrator', t: '(ريان يباوع لأنجي ويبتسم. ولا ملاحظة، ولا دفتر.)' },
          { s: 'anji', e: 'smile', t: 'شفت؟ ما يحتاج تحقيق.' },
        ],
      },
      {
        if: 'dec:jealous-talk=tease',
        then: [
          { s: 'ryan', e: 'smile', t: '… لحظة.', act: [{ puff: 'ryan', type: 'steam', ms: 1400 }] },
          { s: 'narrator', t: '(ريان يطلّع دفتر ثاني، ختمه أكبر، ويكتب: «ربيع: مجاملة. التقييم: ممتازة.»)' },
          { s: 'anji', e: 'laugh', t: 'الدفتر الثاني وصل!' },
          { s: 'ryan', e: 'smile', t: 'گلتلچ ختمه أكبر.' },
        ],
      },
      {
        if: 'dec:jealous-talk=challenge',
        then: [
          { s: 'ryan', e: 'smile', t: 'شكراً ربيع.' },
          { s: 'ryan', e: 'smile', t: 'أنجي… عجبچ الفانوس؟ هالمرة أسألچ، مو أكتب.', act: [{ face: 'ryan', toward: 'anji' }] },
          { s: 'anji', e: 'soft', t: 'عجبني. وعجبني إنك سألت.' },
        ],
      },
      {
        if: 'dec:jealous-talk=boundary',
        then: [
          { s: 'ryan', e: 'smile', t: 'شكراً ربيع.' },
          { s: 'narrator', t: '(ريان يطلّع دفتره، يفتحه على الصفحة المشطوبة… ويسدّه، ويرجعه لجيبه.)' },
          { s: 'anji', e: 'smile', t: '… شكراً.' },
        ],
      },
      {
        if: 'dec:jealous-talk=subject',
        then: [
          { s: 'ryan', t: 'شكراً ربيع. … القضية. صح. القضية انحلّت.' },
          { s: 'sabri', e: 'laugh', t: 'أخيراً موضوع ثاني!', act: [{ pose: 'sabri', anim: 'laugh', for: 1000 }] },
          { s: 'anji', e: 'laugh', t: 'الموضوع الثاني: الحلويات.' },
        ],
      },
      {
        if: ['!dec:jealous-talk=reassure', '!dec:jealous-talk=tease', '!dec:jealous-talk=challenge', '!dec:jealous-talk=boundary', '!dec:jealous-talk=subject'],
        then: [{ s: 'ryan', e: 'smile', t: 'شكراً ربيع.' }],
      },
    ],
    's2.17-husky': [
      {
        if: 'dec:stash=keep',
        then: [
          { s: 'narrator', t: '({husky} تشم علبة الحلويات… وتگعد گدامها، وعيونها كلها حزن رسمي.)', act: [{ camera: 'husky', ms: 350 }, { pose: 'husky', anim: 'sit', for: 1600 }] },
          { s: 'anji', e: 'laugh', t: 'أخذنا كنوزچ أدلة… فهاي تعويض.' },
          { s: 'narrator', t: '(حبة حلويات وحدة. {husky} تاكلها بكرامة كاملة.)', act: [{ pose: 'husky', anim: 'excited', for: 1200 }] },
        ],
      },
      {
        if: 'dec:stash=return',
        then: [
          { s: 'narrator', t: '({husky} تختفي لحظة… وترجع وبحلگها شي من مخبأها: شريطة صغيرة. تحطها جنب الورد.)', act: [{ camera: 'husky', ms: 350 }, { move: 'husky', x: 1180, speed: 300 }, { move: 'husky', x: 1300, speed: 300 }, { pose: 'husky', anim: 'wag', for: 1400 }] },
          { s: 'anji', e: 'soft', t: 'هدية منچ؟ رجّعنالچ كنوزچ… وإنتِ رجّعتيلنا وحدة.' },
        ],
      },
      {
        if: ['!dec:stash=keep', '!dec:stash=return'],
        then: [{ s: 'narrator', t: '({husky} تشم الورد الأبيض… وتعطس.)', act: [{ camera: 'husky', ms: 350 }, { pose: 'husky', anim: 'sniff', for: 1000 }] }],
      },
    ],
    's2.17-sabri': [
      {
        if: 'dec:office-cover=cover',
        then: [
          { s: 'sabri', e: 'smile', t: 'أنجي، ريان… الطابعة تسلّم عليكم.', act: [{ camera: 'sabri', ms: 350 }, { pose: 'sabri', anim: 'point', for: 900 }] },
          { s: 'lama', e: 'suspicious', t: 'صبري.', act: [{ pose: 'lama', anim: 'cross', for: 1000 }] },
          { s: 'sabri', e: 'worried', t: 'أوكي، أوكي. آني أسلّم. الطابعة ما تعرف تحچي.', act: [{ pose: 'sabri', anim: 'handsup', for: 900 }] },
        ],
      },
      {
        if: 'dec:office-cover=truth',
        then: [
          { s: 'sabri', e: 'smile', t: 'آني ما گلت شي. ولا كلمة. شفتوني؟ ساكت.', act: [{ camera: 'sabri', ms: 350 }, { pose: 'sabri', anim: 'handsup', for: 900 }] },
          { s: 'lama', e: 'laugh', t: 'من امتى؟', act: [{ pose: 'lama', anim: 'laugh', for: 1000 }] },
          { s: 'sabri', e: 'smile', t: 'من الليلة. … تقريباً.' },
        ],
      },
      {
        if: ['!dec:office-cover=cover', '!dec:office-cover=truth'],
        then: [{ s: 'sabri', e: 'smile', t: 'ليلة حلوة. وآني ما خربطت شي… هالمرة.', act: [{ camera: 'sabri', ms: 350 }, { jolt: 'sabri', type: 'hop' }] }],
      },
    ],
    's2.17-page': [
      { s: 'jojo', e: 'smile', t: 'السجل ناقصه صفحة. … وهاي صفحة جديدة. اكتبيها إنتِ، بنتي.', act: [{ camera: { between: ['jojo', 'anji'] }, ms: 350 }, { move: 'jojo', to: 'anji', gap: 70, speed: 120 }] },
      { s: 'narrator', t: '(أنجي تكتب بخطها، بالحبر الأزرق:)', act: [{ pose: 'anji', anim: 'think', for: 1200 }] },
      { s: 'note', t: '«ليلة الفوانيس — مرة ثانية. ثمان فوانيس، كلها مضوية. محد خرّب شي. — أنجي»' },
      { s: 'jojo', e: 'smile', t: 'أحلى صفحة بالسجل. وأول وحدة مو بخطي.', act: [{ move: 'jojo', x: 960, speed: 130 }] },
    ],
    's2.17-sister': [
      {
        if: 'dec:sister-wish=read',
        then: [
          { s: 'sister', e: 'shy', t: 'گريتيها، صح؟ البطاقة.' },
          { s: 'anji', e: 'soft', t: 'گريتها. وتبقى بيناتنا.' },
          { s: 'sister', e: 'smile', t: 'لا تبچين گدام الناس. هاي أوامر.', act: [{ jolt: 'sister', type: 'lunge', ms: 500 }] },
          { s: 'anji', e: 'laugh', t: 'ما أبچي. … شوية.' },
          { s: 'narrator', t: '(أختي تلف إيدها على كتف أنجي، ثانية وحدة بس… وترجع تكتّف إيديها.)', act: [{ pose: 'sister', anim: 'cross', for: 1600 }] },
        ],
      },
      {
        if: 'dec:sister-wish=leave',
        then: [
          { s: 'narrator', t: '(أختي واگفة يمها. البطاقة البيضاء بإيدها.)' },
          { s: 'sister', e: 'thinking', t: 'ما گريتيها. ليش؟' },
          { s: 'anji', e: 'soft', t: 'لأنها مالتچ. إذا يوم ردتي تگوليها… أسمعها منچ.' },
          { s: 'sister', e: 'shy', t: '… يمكن.', act: [{ pose: 'sister', anim: 'shrug', for: 1200 }] },
          { s: 'narrator', t: '(ترجّع البطاقة لفانوسها، الرابع. لساتها بيضاء.)', act: [{ move: 'sister', x: 680, speed: 110 }, { face: 'sister', toward: 'anji' }] },
          { s: 'anji', e: 'soft', t: '(شي واحد يبقى مفتوح. وهذا زين.)' },
        ],
      },
      {
        if: ['!dec:sister-wish=read', '!dec:sister-wish=leave'],
        then: [
          { s: 'sister', e: 'smile', t: 'ورقة بلا توقيع، وأخت محققة. ما چان عندي فرصة.', act: [{ pose: 'sister', anim: 'cross', for: 1200 }] },
          { s: 'anji', e: 'soft', t: 'ولا چان عندچ داعي. آني هنا.' },
        ],
      },
    ],
    's2.17-close': [
      { s: 'narrator', t: '(ثمان فوانيس. سبع ضيوف، وكلبين، وسجل بصفحة جديدة.)' },
      { s: 'ryan', e: 'smile', t: 'الحديقة اللي ما تنام…' },
      { s: 'anji', e: 'soft', t: 'الليلة… ترتاح شوية.' },
      { s: 'narrator', t: 'ملف الدائرة المغلقة — انسدّ.' },
    ],
    's2.17-replay': [{ s: 'narrator', t: '(الورد الأبيض بمكانه… والليلة تنعاد، مثل ما چانت.)' }],
    's2.17-night-rabi': [{ s: 'rabi', e: 'smile', t: 'ليلة حلوة. وبدون ما أنقل ولا بطاقة.' }],
    's2.17-night-lama': [{ s: 'lama', e: 'smile', t: 'ثمان فوانيس، سبع ضيوف، وكلبين. هالمرة الحساب مضبوط.' }],
    's2.17-night-sabri': [{ s: 'sabri', e: 'smile', t: 'آني ساكت. شوفي شلون ساكت.' }],
    's2.17-night-jojo': [{ s: 'jojo', e: 'smile', t: 'الساعة مضبوطة. شيكتها. مرة رابعة.' }],
    's2.17-night-sister': [{ s: 'sister', e: 'smile', t: 'لا تتعودين. مسابقة الجاية آني أربحها.' }],
    's2.17-night-ryan': [
      { if: `!${ROSES}`, then: [{ s: 'ryan', e: 'smile', t: 'لا تباوعيني. باوعي الضو.' }] },
      { if: ROSES, then: [{ s: 'ryan', e: 'smile', t: 'الفانوس الثامن مضوي. وآني… مرتاح.' }] },
    ],
  },
  scenes: [S2_FINALE],
  // additions to M1's case room, each one only while this mission is open (or after it)
  patches: {
    's2-caseroom': {
      actors: [
        { id: 'ryan', if: RYAN_IN_ROOM },
        { id: 'rabi', kind: 'rabi', x: HOME.rabi, facing: 1, mood: 'smile', if: [OPEN, `!${GARDEN}`], notice: { dist: 110 } },
        { id: 'lama', kind: 'lama', x: HOME.lama, facing: 1, mood: 'smile', if: [OPEN, `!${GARDEN}`], notice: { dist: 110 } },
        { id: 'sabri', kind: 'sabri', x: HOME.sabri, facing: 1, if: [OPEN, `!${GARDEN}`], notice: { dist: 110, emote: '!' } },
        { id: 'jojo', kind: 'jojo', x: HOME.jojo, facing: -1, mood: 'thinking', if: [OPEN, `!${GARDEN}`], notice: { dist: 110 } },
        { id: 'sister', kind: 'sister', x: HOME.sister, facing: -1, idleFx: 'sway', mood: 'suspicious', if: [OPEN, `!${GARDEN}`], notice: { dist: 100, jolt: 'lunge' } },
      ],
      dynamic: [
        { x: 700, reach: 140, if: OPEN, draw: caseLine },
        { x: 1250, reach: 60, if: DEFENDED, draw: (ctx, { P }) => P.door(ctx, 1250, GROUND, { state: 'open', glow: true }) },
      ],
      interact: [
        {
          id: 'board',
          cases: [
            { if: [OPEN, `!${GATHERED}`], run: [{ say: 's2.17-gather' }, { fx: GATHERED, quiet: true }] },
            { if: [OPEN, `!${ORDERED}`], run: [once('s2.17-board-intro'), { puzzle: 's2-night-order', then: [{ say: 's2.17-order-done' }], else: [{ say: 's2.later' }] }] },
            {
              if: [OPEN, `!${DEFENDED}`],
              run: [
                once('s2.17-defend-intro'),
                defenceAction(DEFENCE),
                // (what follows is plain data, so content checks see it: the bar sets HOLDS when D survives)
                {
                  if: HOLDS,
                  then: [{ say: 's2.17-held' }, { fx: ['ev:d-case', DEFENDED] }, { say: 's2.17-to-garden' }, { fx: GARDEN, quiet: true }, { fade: 'out' }, { goto: 's2-finale', x: 140 }],
                  else: [{ say: 's2.later' }],
                },
              ],
            },
            { if: [OPEN, `!${END}`], run: [{ say: 's2.17-board-garden' }] },
            { if: END, run: [{ say: 's2.17-board-closed' }] },
          ],
        },
        {
          id: 'ryan',
          if: RYAN_IN_ROOM, // (M1's own condition, until everyone leaves for the garden)
          cases: [{ if: [OPEN, `!${DEFENDED}`], run: [{ say: 's2.17-ryan-room' }] }],
        },
        ...['rabi', 'lama', 'sabri', 'jojo', 'sister'].map((id) => ({
          id,
          actor: id,
          x: HOME[id],
          w: 46,
          h: 120,
          label: { rabi: 'ربيع', lama: 'لمى', sabri: 'صبري', jojo: 'العم جوجو', sister: 'أختي' }[id],
          icon: '💬',
          if: [OPEN, `!${GARDEN}`],
          run: [{ say: `s2.17-talk-${id}` }],
        })),
        { id: 'garden-door', x: 1250, w: 60, h: 120, label: 'للحديقة', icon: '🌙', if: DEFENDED, run: [{ fade: 'out' }, { goto: 's2-finale', x: 140 }] },
      ],
      triggers: [{ id: '17-gather', x1: 100, x2: 420, once: false, if: [OPEN, `!${GATHERED}`], run: [{ say: 's2.17-gather' }, { fx: GATHERED, quiet: true }] }],
    },
  },
};
