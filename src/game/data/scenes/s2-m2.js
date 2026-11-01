/**
 * Season 2, M2 — the Living Story's places (docs/season-2/SEASON_2_LIVING_STORY_C1.md). Same conventions as
 * M1's (scenes/s2.js): ids start with `s2-`, so visits, triggers and what she has examined go to Season 2's own
 * save; a beat that completes a step is guarded by its own result. Fiction written for the game.
 */
import { GROUND } from '../../world/props.js';
import { gather } from '../m2/index.js';

const toArchive = { side: 'left', to: 's2-archive', spawn: 1180 };
const arrive = (id) => [{ id: 'arrive', x1: 100, x2: 360, once: false, if: `!flag:s2:in-${id}`, run: [{ say: `s2.${id}-enter` }, { fx: `flag:s2:in-${id}` }] }];

/* ── small office things, drawn on the canvas (no new art to bake) ── */
function coffeeMachine(ctx, x) {
  ctx.fillStyle = '#3b3f4a';
  ctx.fillRect(x - 18, GROUND - 92, 36, 52);
  ctx.fillStyle = '#596070';
  ctx.fillRect(x - 14, GROUND - 86, 28, 12);
  ctx.fillStyle = '#e8e2d6';
  ctx.fillRect(x - 6, GROUND - 56, 12, 14);
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(x - 30, GROUND - 40, 60, 40); // the cabinet under it
}
function sheet(ctx, x, y, w = 26, h = 30, tone = '#f4efe2') {
  ctx.fillStyle = tone;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = '#9aa3b8';
  for (let i = 0; i < 4; i++) ctx.fillRect(x - w / 2 + 4, y - h / 2 + 6 + i * 6, w - 8, 1.6);
}
function calendar(ctx, x) {
  ctx.fillStyle = '#e9e4d8';
  ctx.fillRect(x - 30, GROUND - 168, 60, 52);
  ctx.fillStyle = '#c45a5a';
  ctx.fillRect(x - 30, GROUND - 168, 60, 10);
  ctx.strokeStyle = '#b7b0a2';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 30 + i * 15, GROUND - 158);
    ctx.lineTo(x - 30 + i * 15, GROUND - 116);
    ctx.stroke();
  }
}
function monitor(ctx, x, sticky) {
  ctx.fillStyle = '#23262e';
  ctx.fillRect(x - 24, GROUND - 92, 48, 32);
  ctx.fillStyle = '#4e86c9';
  ctx.fillRect(x - 21, GROUND - 89, 42, 26);
  ctx.fillStyle = '#23262e';
  ctx.fillRect(x - 3, GROUND - 60, 6, 8);
  if (sticky) {
    ctx.fillStyle = '#ffd84d';
    ctx.fillRect(x + 12, GROUND - 92, 13, 13);
  }
}
function printer(ctx, x, t, jam) {
  const wob = jam ? Math.sin(t * 40) * 2.5 : 0;
  ctx.save();
  ctx.translate(wob, jam ? -Math.abs(Math.sin(t * 20)) * 2 : 0);
  ctx.fillStyle = '#d9dce3';
  ctx.fillRect(x - 32, GROUND - 82, 64, 36);
  ctx.fillStyle = '#b7bcc8';
  ctx.fillRect(x - 28, GROUND - 90, 56, 10);
  ctx.fillStyle = jam ? '#e24a4a' : '#5fd18a'; // its little light
  ctx.beginPath();
  ctx.arc(x + 24, GROUND - 74, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4efe2';
  ctx.fillRect(x - 20, GROUND - 50, 40, 6); // the tray
  ctx.restore();
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(x - 36, GROUND - 46, 72, 46); // its stand
}
function whiteboard(ctx, x) {
  ctx.fillStyle = '#f2f4f7';
  ctx.fillRect(x - 46, GROUND - 170, 92, 62);
  ctx.strokeStyle = '#8a92a5';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 46, GROUND - 170, 92, 62);
  ctx.fillStyle = '#e86a8a';
  for (const [dx, dy] of [[-30, -158], [6, -150], [28, -132]]) ctx.fillRect(x + dx, GROUND + dy, 10, 10);
}

const PAPERS = [
  { id: 'paper-1', x: 1010 },
  { id: 'paper-2', x: 1070 },
  { id: 'paper-3', x: 1230 }, // Lama's message, printed by mistake
  { id: 'paper-4', x: 1300 },
];
const PAPERS_OUT = 'flag:s2:12-papers';
const placed = (p) => `flag:s2:12-${p.id}`;

/* ── المكتب: Mission 01 «سر المكتب» ───────────────────────────────────────────── */
export const S2_OFFICE = {
  id: 's2-office',
  title: 'المكتب',
  theme: 'house',
  music: 'mystery',
  width: 1500,
  spawn: 140,
  seed: 1201,
  props: [
    { type: 'window', x: 430, y: 52, w: 60, h: 74 },
    { type: 'window', x: 1060, y: 52, w: 60, h: 74 },
    { type: 'table', x: 520, w: 100 },
    { type: 'table', x: 900, w: 120 },
    { type: 'table', x: 1380, w: 100 },
    { type: 'bookshelf', x: 760, w: 70, h: 120 },
  ],
  actors: [
    // Lama walks with her until she goes to keep Sabri talking (then stays by the coffee), and is at her desk after
    // (close behind her: a phone shows only ~180 units, and she must stay on screen to be tapped)
    { id: 'lama', kind: 'lama', x: 230, facing: 1, if: ['!flag:s2:12-distract'], companion: true, gap: 44, notice: { dist: 100, emote: '!' } },
    { id: 'lama', kind: 'lama', x: 820, facing: 1, if: ['flag:s2:12-distract', '!ev:e-versions'] },
    { id: 'lama', kind: 'lama', x: 520, facing: 1, if: ['flag:s2:12-distract', 'ev:e-versions'], notice: { dist: 100, emote: '!' } },
    // Sabri at his desk: he watches her — unless Lama is talking coffee with him (then he turns to her, mostly)
    {
      id: 'sabri',
      kind: 'sabri',
      x: 900,
      facing: -1,
      notice: { dist: 130, emote: '!' },
      routines: [
        { if: ['flag:s2:12-distract', '!ev:f-sticky'], steps: [{ face: 'lama', pose: 'laugh', ms: 2600 }, { face: 'lama', ms: 900 }, { face: 'anji', ms: 1300 }] },
        { if: '!ev:f-sticky', steps: [{ face: 'anji', ms: 400 }] },
      ],
    },
    // Ryan comes in at the end (listed so his drawings are ready before he walks in)
    { id: 'ryan', kind: 'ryan', x: 1380, facing: -1, if: 'flag:s2:12-done' },
  ],
  dynamic: [
    { x: 300, reach: 60, draw: (ctx) => coffeeMachine(ctx, 300) },
    { x: 340, reach: 30, draw: (ctx) => sheet(ctx, 345, GROUND - 130) }, // the coffee rota
    { x: 700, reach: 40, draw: (ctx) => calendar(ctx, 700) },
    { x: 600, reach: 50, draw: (ctx) => whiteboard(ctx, 600) },
    { x: 930, reach: 40, draw: (ctx, { game }) => monitor(ctx, 930, !game.has('s2.ev.f-sticky')) },
    { x: 1150, reach: 50, draw: (ctx, { t, game }) => printer(ctx, 1150, t, game.flag('s2:12-jam')) },
    ...PAPERS.map((p) => ({ x: p.x, reach: 20, if: [PAPERS_OUT, `!${placed(p)}`, `!hold:${p.id}`], draw: (ctx) => sheet(ctx, p.x, GROUND - 6, 28, 10, '#f7f5ee') })),
  ],
  interact: [
    { id: 'rota', x: 340, w: 50, h: 120, label: 'جدول الگهوة', icon: '☕', cases: [{ if: '!ev:f-rota', run: [{ say: 's2.12-rota' }, { fx: 'ev:f-rota' }] }, { run: [{ say: 's2.12-rota-again' }] }] },
    { id: 'calendar', x: 700, w: 60, h: 120, label: 'تقويم المكتب', icon: '📅', cases: [{ if: '!ev:f-calendar', run: [{ say: 's2.12-calendar' }, { fx: 'ev:f-calendar' }] }, { run: [{ say: 's2.12-calendar-again' }] }] },
    {
      id: 'lama',
      actor: 'lama',
      x: 230,
      w: 46,
      h: 120,
      label: 'لمى',
      icon: '💬',
      cases: [
        // she offers to keep Sabri talking, once Anji has found the office's papers and seen him guard his screen
        // (she stands by the coffee, on Sabri's far side from his screen: when he turns to her, he turns away from it)
        { if: ['ev:f-rota', 'ev:f-calendar', 'seen:dlg:s2.12-sabri-guard', '!flag:s2:12-distract'], run: [{ say: 's2.12-lama-plan' }, { if: 'flag:s2:12-distract', then: [{ stay: 'lama' }, { move: 'lama', x: 820, speed: 120 }, { face: 'lama', toward: 'sabri' }] }] },
        { if: ['flag:s2:12-distract', '!ev:f-sticky'], run: [{ say: 's2.12-lama-distracting' }] },
        { if: ['flag:s2:12-tidy', '!ev:e-versions'], run: [{ say: 's2.12-board-wait' }] },
        { run: [{ say: 's2.12-lama-chat' }] },
      ],
    },
    {
      id: 'sabri',
      actor: 'sabri',
      x: 900,
      w: 50,
      h: 130,
      label: 'صبري',
      icon: '💬',
      cases: [{ if: '!seen:dlg:s2.12-sabri-guard', run: [{ say: 's2.12-sabri-guard' }] }, { run: [{ say: 's2.12-sabri-chat' }] }],
    },
    {
      // Ryan's note on Sabri's screen: read it only while Sabri is looking elsewhere
      id: 'sticky',
      x: 940,
      w: 40,
      h: 90,
      label: 'ورقة لاصقة',
      icon: '🟨',
      if: '!ev:f-sticky',
      cases: [
        {
          unseenBy: 'sabri',
          run: [
            { say: 's2.12-sticky-read' },
            { fx: 'ev:f-sticky' },
            // the slip: Sabri, meaning well, says it out loud — then makes it worse
            { all: [{ face: 'sabri', toward: 'anji' }, { face: 'lama', toward: 'anji' }] },
            { letterbox: true }, // a set piece: the printer disaster
            { camera: { between: ['sabri', 'anji'] }, ms: 400 },
            { say: 's2.12-slip' },
            { move: 'sabri', x: 1120, speed: 300 },
            { all: [{ pose: 'sabri', anim: 'point', for: 500 }, { fx: 'flag:s2:12-jam', quiet: true }] },
            { camera: 'sabri', ms: 400 },
            { all: [{ puff: 'sabri', type: 'papers', ms: 2200 }, { shake: 0.5 }, { sfx: 'printer' }, { jolt: 'sabri', type: 'shake', ms: 700 }] },
            { wait: 500 },
            { all: [{ jolt: 'sabri', type: 'tilt', ms: 700 }, { pose: 'sabri', anim: 'handsup', for: 900 }] },
            { say: 's2.12-printer-chaos' },
            { fx: [PAPERS_OUT, '!flag:s2:12-jam'], quiet: true },
            { camera: null, ms: 300 },
            { letterbox: false },
          ],
        },
        { run: [{ all: [{ jolt: 'sabri', type: 'hop' }, { emote: 'sabri', icon: '!' }] }, { say: 's2.12-sticky-caught' }] },
      ],
    },
    // the papers on the floor: one at a time, back to the printer's tray
    ...PAPERS.map((p) => ({
      id: p.id,
      x: p.x,
      w: 36,
      h: 50,
      label: 'ورقة',
      icon: '📄',
      if: [PAPERS_OUT, `!${placed(p)}`, `!hold:${p.id}`],
      cases: [
        { if: 'hold:', run: [{ fx: `hold:${p.id}`, quiet: true }, { all: [{ pose: 'anji', anim: 'crouch', for: 500 }, { puff: 'anji', type: 'dust', ms: 600 }, { sfx: 'paper' }] }, ...(p.id === 'paper-3' ? [{ say: 's2.12-print-read' }, { fx: 'ev:f-print' }] : [])] },
        { run: [{ say: 's2.12-hands-full' }] },
      ],
    })),
    {
      id: 'tray',
      x: 1150,
      w: 60,
      h: 90,
      label: 'صينية الطابعة',
      icon: '🖨',
      if: [PAPERS_OUT, '!flag:s2:12-tidy'],
      cases: [
        ...PAPERS.map((p) => ({ if: `hold:${p.id}`, run: [{ fx: ['!hold:', placed(p)], quiet: true }, { jolt: 'anji', type: 'squash', ms: 300 }, { if: PAPERS.map(placed), then: [{ say: 's2.12-cover-choice' }] }] })),
        { run: [{ say: 's2.12-tray' }] },
      ],
    },
    {
      id: 'board',
      x: 600,
      w: 90,
      h: 120,
      label: 'لوحة المكتب',
      icon: '📌',
      cases: [
        { if: ['ev:f-rota', 'ev:f-calendar', 'ev:f-sticky', 'ev:f-print', 'flag:s2:12-tidy', '!ev:e-versions'], run: [{ if: '!seen:dlg:s2.12-board-intro', then: [{ say: 's2.12-board-intro' }] }, { puzzle: 's2-who-said', then: [{ say: 's2.12-board-done' }, { spawn: { id: 'ryan', kind: 'ryan', x: 40, facing: 1, fadeIn: true } }, { move: 'ryan', to: 'anji', gap: 70, speed: 130 }, { camera: { between: ['ryan', 'anji'] }, ms: 400 }, { say: 's2.12-ryan-arrives' }, { fx: 'flag:s2:12-done' }], else: [{ say: 's2.12-board-wait' }] }] },
        { if: '!ev:e-versions', run: [{ say: 's2.12-board-wait' }] },
        { run: [{ say: 's2.12-board-again' }] },
      ],
    },
  ],
  triggers: arrive('office'),
  exits: [toArchive],
  ambient: [{ t: 'على كل مكتب أوراق، وعلى كل ورقة اسم.' }],
};

export const S2_M2_SCENES = [S2_OFFICE, ...gather('scenes')];
