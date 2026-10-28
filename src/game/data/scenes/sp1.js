/**
 * Story Pack 01 «الطرق اللي تتذكر» — two post-game locations.
 *
 *   roads       طريق الذكريات: the village entrance, two roads under dense trees.
 *               Mission 01 (the silent embrace), the unsigned-gift clues (04) and,
 *               once the gift is open, a new path to the closed «بوابة الغد» (05).
 *   roseclinic  عيادة الورد: a small, fictional garden clinic. The surprise visit with
 *               flowers and sweets (02), the white husky (03), Ryan's laptop (the
 *               optional «من سطر صغير» scene) and the AI-disclaimer notice board.
 *
 * Every story beat that must complete a mission uses a re-armable trigger
 * (`once: false`) guarded by its own result flag, so closing the game in the
 * middle of a scene replays it next time instead of losing the step.
 */
import { GROUND } from '../../world/props.js';

const ANJI_CAR = 820;
const RYAN_CAR = 1080;
const CLUE_TREE = 1450;
const CLIMB = 1720; // the tree with the high branch
const PATH = 1990; // where the new path opens
const GATE = 2300;

function fallenBranch(ctx) {
  ctx.fillStyle = '#3a2c2c';
  ctx.save();
  ctx.translate(PATH, GROUND - 8);
  ctx.rotate(-0.12);
  ctx.fillRect(-46, -6, 92, 12);
  ctx.restore();
  for (const [dx, dy, r, c] of [[-30, -24, 22, '#2f4626'], [4, -34, 26, '#3a5530'], [32, -20, 20, '#2f4626'], [0, -14, 24, '#24361f']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(PATH + dx, GROUND + dy, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The closed gate of «حديقة الغد» — the documented hook for the future finale. */
function tomorrowGate(ctx, P, t, reduced) {
  const x = GATE;
  const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 1.6);
  const g = ctx.createRadialGradient(x, GROUND - 80, 6, x, GROUND - 80, 120 * pulse);
  g.addColorStop(0, 'rgba(255,224,170,.55)');
  g.addColorStop(1, 'rgba(255,224,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 130, GROUND - 210, 260, 214);
  ctx.strokeStyle = '#2d2a3a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 52, GROUND + 4);
  ctx.lineTo(x - 52, GROUND - 120);
  ctx.arc(x, GROUND - 120, 52, Math.PI, 0);
  ctx.lineTo(x + 52, GROUND + 4);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(x + k * 14, GROUND + 4);
    ctx.lineTo(x + k * 14, GROUND - 120 - Math.sqrt(Math.max(0, 52 * 52 - (k * 14) ** 2)) + 4);
    ctx.stroke();
  }
  for (let a = 0; a < 9; a++) {
    const ang = Math.PI + (a * Math.PI) / 8;
    P.rose(ctx, x + Math.cos(ang) * 54, GROUND - 120 + Math.sin(ang) * 54, 4.4, a % 3 ? 'pink' : 'blue');
  }
}

export const ROADS = {
  id: 'roads',
  title: 'طريق الذكريات',
  theme: 'roads',
  music: 'warm',
  width: 2400,
  spawn: 160,
  seed: 211,
  props: [{ type: 'sign', x: 420, text: 'مدخل القرية' }, { type: 'car', x: ANJI_CAR, color: '#ece6dc' }],
  platforms: [
    { x: CLIMB - 70, y: 204, w: 56 },
    { x: CLIMB + 10, y: 160, w: 60 },
    { x: CLIMB + 90, y: 118, w: 62 },
  ],
  blockers: [{ x: PATH, w: 40, if: '!flag:sp1-gift-open' }],
  items: [{ id: 'star.roads.1', x: CLIMB + 120, y: 30 }],
  actors: [
    { id: 'husky', kind: 'husky', x: 1600, facing: -1, if: 'flag:sp1-husky-met' },
    // Ryan waits at the new path facing the gate — his back to her, as on the first day
    { id: 'ryan', kind: 'ryan', x: 2160, facing: 1, view: 'back', if: 'flag:sp1-gift-open' },
  ],
  dynamic: [
    // Ryan's car is part of the memory; afterwards it waits by the new path
    { x: RYAN_CAR, reach: 120, if: '!flag:sp1-embrace', draw: (ctx, { P }) => P.sportsCar(ctx, RYAN_CAR, GROUND + 18, { color: '#1f4fd1', lights: false }) },
    { x: 2060, reach: 120, if: 'flag:sp1-gift-open', draw: (ctx, { P }) => P.sportsCar(ctx, 2060, GROUND + 18, { color: '#1f4fd1', lights: false }) },
    {
      // the unsigned gift, beside her car
      x: ANJI_CAR + 50,
      reach: 40,
      if: ['flag:sp1-husky-met', '!flag:sp1-gift-open'],
      draw(ctx, { P, t, world }) {
        const x = ANJI_CAR + 50;
        ctx.fillStyle = '#7a2a4a';
        ctx.fillRect(x - 11, GROUND - 18, 22, 20);
        ctx.fillStyle = '#ffd977';
        ctx.fillRect(x - 2, GROUND - 18, 4, 20);
        ctx.fillRect(x - 11, GROUND - 11, 22, 3);
        P.sparkle(ctx, x + 9, GROUND - 24, world.reduced ? 3 : 2.5 + Math.sin(t * 3), 0.8);
      },
    },
    {
      // the carved trunk (clue 1)
      x: CLUE_TREE,
      reach: 80,
      draw(ctx, { game }) {
        ctx.fillStyle = '#3a2c2c';
        ctx.fillRect(CLUE_TREE - 14, GROUND - 170, 28, 174);
        if (game.flag('sp1-gift-box')) {
          ctx.strokeStyle = '#d9b48a';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(CLUE_TREE, GROUND - 92, 5, 0, Math.PI * 2);
          ctx.moveTo(CLUE_TREE, GROUND - 87);
          ctx.lineTo(CLUE_TREE, GROUND - 76);
          ctx.stroke();
        }
      },
    },
    {
      // the climbing tree: trunk, branches and the canopy (clue 3 hangs on the top branch)
      x: CLIMB + 40,
      reach: 220,
      draw(ctx, { P, game }) {
        ctx.fillStyle = '#3a2c2c';
        ctx.fillRect(CLIMB + 30, GROUND - 210, 26, 214);
        ctx.fillStyle = '#4a3838';
        for (const p of [[CLIMB - 70, 204, 56], [CLIMB + 10, 160, 60], [CLIMB + 90, 118, 62]]) ctx.fillRect(p[0], p[1], p[2], 7);
        for (const [dx, dy, r] of [[-40, -230, 46], [40, -250, 54], [110, -220, 44], [10, -200, 40]]) P.leafBlob(ctx, CLIMB + dx, GROUND + dy, r, r * 0.7, '#355130');
        if (game.flag('sp1-gift-box') && !game.flag('sp1-clue-3')) {
          ctx.fillStyle = '#fff4dc';
          ctx.fillRect(CLIMB + 114, 100, 12, 15);
          ctx.strokeStyle = '#c44a6a';
          ctx.beginPath();
          ctx.moveTo(CLIMB + 120, 100);
          ctx.lineTo(CLIMB + 120, 90);
          ctx.stroke();
        }
      },
    },
    { x: PATH, reach: 60, if: '!flag:sp1-gift-open', draw: fallenBranch },
    {
      // the new path: rose bushes and two lanterns, then the gate
      x: 2180,
      reach: 260,
      if: 'flag:sp1-gift-open',
      draw(ctx, { P, t, world }) {
        P.lanternPost(ctx, 2020, GROUND + 4, { height: 104 });
        P.lanternPost(ctx, 2240, GROUND + 4, { height: 104 });
        for (const [x, tone] of [[2110, 'pink'], [2370, 'blue']]) {
          for (let k = 0; k < 4; k++) P.rose(ctx, x + k * 8 - 12, GROUND - 6 - (k % 2) * 6, 4, tone);
        }
        tomorrowGate(ctx, P, t, world.reduced);
      },
    },
  ],
  interact: [
    { id: 'my-car', x: ANJI_CAR, w: 90, h: 50, label: 'سيارتي', icon: '🚗', if: 'flag:sp1-embrace', run: [{ say: 'sp1.my-car' }] },
    {
      id: 'gift-box',
      x: ANJI_CAR + 50,
      w: 30,
      h: 40,
      label: 'صندوق بلا توقيع',
      icon: '🎁',
      if: ['flag:sp1-husky-met', '!flag:sp1-gift-open'],
      cases: [
        { if: '!flag:sp1-gift-box', run: [{ say: 'sp1.gift-box' }, { fx: ['flag:sp1-gift-box', 'journal:sp1-clues'] }] },
        {
          if: ['flag:sp1-clue-1', 'flag:sp1-clue-2', 'flag:sp1-clue-3'],
          run: [{ puzzle: 'sp1-cipher', then: [{ shake: 0.2 }, { say: 'sp1.gift-open' }], else: [{ say: 'sp1.gift-later' }] }],
        },
        { run: [{ say: 'sp1.gift-locked' }] },
      ],
    },
    {
      id: 'tree-mark',
      x: CLUE_TREE,
      w: 40,
      h: 120,
      label: 'جذع الشجرة',
      icon: '🌳',
      if: ['flag:sp1-gift-box', '!flag:sp1-clue-1'],
      run: [{ say: 'sp1.clue-1' }, { fx: 'flag:sp1-clue-1' }],
    },
    {
      id: 'branch-note',
      x: CLIMB + 120,
      y: 118,
      w: 44,
      h: 60,
      label: 'ورقة بالغصن',
      icon: '📜',
      if: ['flag:sp1-gift-box', '!flag:sp1-clue-3'],
      run: [{ say: 'sp1.clue-3' }, { fx: 'flag:sp1-clue-3' }],
    },
    {
      id: 'husky',
      x: 1600,
      w: 50,
      h: 60,
      label: '{husky}',
      icon: '🐾',
      if: 'flag:sp1-husky-met',
      cases: [
        {
          // the shortcut: she fetches the high note instead of the climb (teamwork)
          if: ['flag:sp1-gift-box', '!flag:sp1-clue-3'],
          run: [
            { say: 'sp1.clue-3-ask' },
            { move: 'husky', x: CLIMB + 40, speed: 300 },
            { pose: 'husky', anim: 'excited', for: 800 },
            { move: 'husky', x: 1600, speed: 260 },
            { face: 'husky', dir: -1 },
            { say: 'sp1.clue-3-fetch' },
            { fx: 'flag:sp1-clue-3' },
          ],
        },
        { run: [{ pose: 'husky', anim: 'wag', for: 900 }, { say: 'sp1.husky-roads' }] },
      ],
    },
    {
      id: 'ryan',
      x: 2160,
      w: 60,
      h: 120,
      label: 'ريان',
      icon: '💙',
      if: 'flag:sp1-gift-open',
      cases: [
        { if: '!flag:sp1-done', run: [{ face: 'anji', toward: 'ryan' }, { say: 'sp1.tomorrow' }] },
        { run: [{ say: 'sp1.ryan-tomorrow' }] },
      ],
    },
    { id: 'gate', x: GATE, w: 90, h: 150, label: 'بوابة الغد', icon: '🌅', if: 'flag:sp1-gift-open', run: [{ say: 'sp1.gate' }] },
  ],
  triggers: [
    { id: 'arrive', x1: 0, x2: 420, once: false, if: '!flag:sp1-roads-seen', run: [{ fx: 'flag:sp1-roads-seen' }] },
    {
      // Mission 01: the silent embrace (no dialogue, no subtitles)
      id: 'embrace',
      x1: 560,
      x2: 720,
      once: false,
      if: '!flag:sp1-embrace',
      run: [
        { camera: 950, ms: 1600 },
        { cine: 'sp1-embrace' },
        // saved quietly (journal + keepsake): no announcements over the end of the scene
        { fx: ['flag:sp1-embrace', 'journal:sp1-roads', 'got:keepsake.roads.1'], quiet: true },
      ],
    },
    {
      // Mission 05: back on the old road, something has changed
      id: 'return',
      x1: 160,
      x2: 420,
      once: false,
      if: ['flag:sp1-gift-open', '!flag:sp1-return'],
      run: [{ say: 'sp1.return' }, { camera: 2160, ms: 1800 }, { fx: 'flag:sp1-return' }],
    },
  ],
  exits: [{ side: 'left', to: 'roseclinic', spawn: 1780, if: 'flag:sp1-embrace', locked: [{ say: 'sp1.roads-back' }] }],
  ambient: [
    { t: 'هالطريق ريحته… مثل المسا.', if: 'flag:sp1-embrace' },
    { t: 'آني ما شفت شي. ولا شي. 🙈', if: 'flag:sp1-embrace' },
    { t: 'سيارتين، طريقين، وآني. واضح منو المهم بالقصة.', if: 'flag:sp1-embrace' },
    { t: 'الشجر هنا كثيف. مكان ممتاز للتحقيق. أو للنوم.', if: 'flag:sp1-embrace' },
  ],
};

export const ROSE_CLINIC = {
  id: 'roseclinic',
  title: 'عيادة الورد',
  theme: 'meadow',
  music: 'garden',
  width: 1900,
  spawn: 140,
  seed: 223,
  props: [
    { type: 'bush', x: 250, w: 90, tone: 'pink' },
    { type: 'lantern', x: 560 },
    { type: 'bench', x: 700 },
    { type: 'pot', x: 1280, tone: 'pink' },
    { type: 'table', x: 1500, w: 70 },
    { type: 'bush', x: 1760, w: 110, tone: 'blue' },
  ],
  actors: [
    { id: 'ryan', kind: 'ryan', x: 790, facing: -1, if: 'flag:sp1-visit-done' },
    { id: 'husky', kind: 'husky', x: 880, facing: -1, if: 'flag:sp1-husky-met' },
  ],
  dynamic: [
    {
      // the little clinic (fictional): cream walls, a rose sign, a warm window
      x: 1020,
      reach: 220,
      draw(ctx, { P }) {
        ctx.fillStyle = '#efe6da';
        ctx.fillRect(880, GROUND - 130, 280, 134);
        ctx.fillStyle = '#8e4a5c';
        ctx.beginPath();
        ctx.moveTo(864, GROUND - 128);
        ctx.lineTo(1020, GROUND - 186);
        ctx.lineTo(1176, GROUND - 128);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6a4a3a';
        ctx.fillRect(1004, GROUND - 74, 34, 78);
        ctx.fillStyle = '#ffd9a0';
        ctx.fillRect(920, GROUND - 96, 46, 38);
        ctx.fillRect(1076, GROUND - 96, 46, 38);
        ctx.fillStyle = '#fff7ec';
        ctx.fillRect(966, GROUND - 124, 110, 22);
        ctx.fillStyle = '#8e2a4a';
        ctx.font = '700 11px "Baloo Bhaijaan 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('عيادة الورد', 1028, GROUND - 113);
        P.rose(ctx, 978, GROUND - 113, 5, 'pink');
      },
    },
    {
      // flowers and sweets on the bench, until the visit
      x: 700,
      reach: 40,
      if: '!flag:sp1-visit-done',
      draw(ctx, { P }) {
        for (let k = 0; k < 5; k++) P.rose(ctx, 684 + k * 5, GROUND - 40 - (k % 2) * 5, 4.2, k % 2 ? 'pink' : 'blue');
        ctx.strokeStyle = '#3f7a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(694, GROUND - 36);
        ctx.lineTo(692, GROUND - 22);
        ctx.stroke();
        ctx.fillStyle = '#e8b4c8';
        ctx.fillRect(704, GROUND - 32, 20, 12);
        ctx.fillStyle = '#c44a6a';
        ctx.fillRect(712, GROUND - 32, 3, 12);
      },
    },
    {
      // Ryan's laptop on the garden table (after the visit)
      x: 1500,
      reach: 40,
      if: 'flag:sp1-visit-done',
      draw(ctx, { t, world }) {
        ctx.fillStyle = '#2a2e44';
        ctx.fillRect(1484, GROUND - 42, 32, 4);
        ctx.fillStyle = '#1d2033';
        ctx.fillRect(1488, GROUND - 62, 24, 20);
        ctx.fillStyle = world.reduced ? '#7ab6ff' : `rgba(122,182,255,${0.75 + 0.25 * Math.sin(t * 2)})`;
        ctx.fillRect(1490, GROUND - 60, 20, 16);
      },
    },
    {
      // the notice board (the AI disclaimer)
      x: 400,
      reach: 40,
      draw(ctx) {
        ctx.fillStyle = '#5a3d2c';
        ctx.fillRect(398, GROUND - 60, 4, 64);
        ctx.fillStyle = '#c9a77a';
        ctx.fillRect(374, GROUND - 92, 52, 36);
        ctx.fillStyle = '#fff7ec';
        ctx.fillRect(380, GROUND - 87, 18, 14);
        ctx.fillRect(402, GROUND - 84, 18, 20);
        ctx.fillStyle = '#e0567f';
        ctx.beginPath();
        ctx.arc(389, GROUND - 87, 2, 0, Math.PI * 2);
        ctx.arc(411, GROUND - 84, 2, 0, Math.PI * 2);
        ctx.fill();
      },
    },
  ],
  interact: [
    { id: 'board', x: 400, w: 50, h: 100, label: 'لوحة الإعلانات', icon: '📌', run: [{ say: 'sp1.disclaimer' }] },
    {
      // Mission 02: flowers and sweets with no name… then, a little later, Ryan
      id: 'bench',
      x: 700,
      w: 60,
      h: 60,
      label: 'المصطبة',
      icon: '🌹',
      if: '!flag:sp1-visit-done',
      run: [
        { say: 'sp1.bench' },
        { wait: 1200 },
        { spawn: { id: 'ryan', kind: 'ryan', x: 1320, facing: -1, fadeIn: true } }, // just off-screen: a short walk
        { emote: 'anji', icon: '!' },
        { camera: 'ryan', ms: 500 },
        { move: 'ryan', x: 790, speed: 150 },
        { camera: 760, ms: 400 },
        { face: 'anji', toward: 'ryan' },
        { say: 'sp1.visit' },
        { fx: ['flag:sp1-visit-done', 'journal:sp1-visit', 'got:keepsake.roseclinic.1'] },
      ],
    },
    {
      id: 'ryan',
      x: 790,
      w: 60,
      h: 120,
      label: 'ريان',
      icon: '💙',
      if: 'flag:sp1-visit-done',
      cases: [
        {
          // Phase 03: she may already have met (and named) the husky at the sanctuary
          // before the ending — then this is a reunion: no second introduction, no renaming
          if: ['!flag:sp1-husky-met', 'flag:sp2-husky-early'],
          run: [
            { say: 'sp1.husky-call' },
            { spawn: { id: 'husky', kind: 'husky', x: 1400, facing: -1 } },
            { move: 'husky', x: 880, speed: 330 },
            { face: 'husky', dir: -1 },
            { pose: 'husky', anim: 'excited', for: 800 },
            { say: 'sp1.husky-reunion' },
            { pose: 'husky', anim: 'wag', for: 900 },
            { fx: ['flag:sp1-husky-met', 'journal:sp1-husky'] },
          ],
        },
        {
          // Mission 03: a name only she knows
          if: '!flag:sp1-husky-met',
          run: [
            { say: 'sp1.husky-call' },
            { spawn: { id: 'husky', kind: 'husky', x: 1400, facing: -1 } },
            { move: 'husky', x: 880, speed: 330 },
            { face: 'husky', dir: -1 },
            { pose: 'husky', anim: 'excited', for: 800 },
            { pose: 'snooki', anim: 'confused', for: 700 },
            { say: 'sp1.husky-meet' },
            { askName: 'husky' },
            { pose: 'husky', anim: 'wag', for: 900 },
            { say: 'sp1.husky-named' },
            { fx: ['flag:sp1-husky-met', 'journal:sp1-husky'] },
          ],
        },
        { run: [{ say: 'sp1.ryan-chat' }] },
      ],
    },
    {
      id: 'husky',
      x: 880,
      w: 50,
      h: 60,
      label: '{husky}',
      icon: '🐾',
      if: ['flag:husky-name', 'flag:sp1-husky-met'],
      cases: [
        {
          if: '!flag:sp1-ball-found',
          run: [
            { say: 'sp1.ball-lost' },
            { puzzle: 'sp1-lost-ball', then: [{ pose: 'husky', anim: 'celebrate', for: 900 }, { say: 'sp1.ball-found' }], else: [{ say: 'sp1.ball-later' }] },
          ],
        },
        { run: [{ pose: 'husky', anim: 'wag', for: 900 }, { say: 'sp1.husky-pet' }] },
      ],
    },
    {
      id: 'pot',
      x: 1280,
      w: 40,
      h: 50,
      label: 'الأصيص',
      icon: '🪴',
      if: ['flag:sp1-gift-box', '!flag:sp1-clue-2'],
      run: [{ say: 'sp1.clue-2' }, { fx: 'flag:sp1-clue-2' }],
    },
    {
      // optional: «من سطر صغير» — the 3-second code montage and the Sequence Machine
      id: 'laptop',
      x: 1500,
      w: 50,
      h: 70,
      label: 'لابتوب ريان',
      icon: '💻',
      if: 'flag:sp1-visit-done',
      cases: [
        {
          if: '!flag:sp1-steps-done',
          run: [
            { say: 'sp1.laptop-1' },
            { cine: 'sp1-montage' },
            { say: 'sp1.laptop-2' },
            { puzzle: 'sp1-build-steps', then: [], else: [{ say: 'sp1.laptop-later' }] },
          ],
        },
        { run: [{ cine: 'sp1-montage' }, { say: 'sp1.laptop-again' }] },
      ],
    },
  ],
  triggers: [
    { id: 'enter', x1: 140, x2: 320, once: false, if: '!flag:sp1-clinic-seen', run: [{ say: 'sp1.clinic-enter' }, { fx: 'flag:sp1-clinic-seen' }] },
    {
      // a surprise, once: Snooki steals the ball, the husky takes it back
      id: 'zoomies',
      x1: 200,
      x2: 640,
      once: false,
      if: ['flag:sp1-ball-found', '!flag:surprise:sp1-zoomies'],
      run: [
        { fx: 'flag:surprise:sp1-zoomies' },
        { bubble: 'snooki', text: 'الطابة إلي هسه! قانون الغابة!', ms: 2200 },
        { move: 'snooki', x: 1240, speed: 360, async: true },
        { wait: 400 },
        { bubble: 'husky', text: 'هاو!!', ms: 1600 },
        { move: 'husky', x: 1280, speed: 400 },
        { bubble: 'snooki', text: '…زين، زين. طابتچ. القانون تغيّر.', ms: 2800 },
        { move: 'husky', x: 880, speed: 260 },
        { face: 'husky', dir: -1 },
      ],
    },
  ],
  exits: [{ side: 'right', to: 'roads', spawn: 160 }],
  ambient: [
    { t: 'عيادة للورد. أخيراً مكان يفهم مشاكلي.' },
    { t: 'ريحة حلاوة بالهوا. آني ما أكلت شي. التحقيق مستمر.' },
    { t: '{husky} تنام أكثر مني. هذا تجاوز للصلاحيات.', if: 'flag:sp1-husky-met' },
  ],
};
