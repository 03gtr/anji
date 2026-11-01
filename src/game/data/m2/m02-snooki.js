/**
 * Season 2, M2 — Mission 02 «سنوكي ضايع» (s2-13; docs/season-2/SEASON_2_LIVING_STORY_C1.md §3 item 02). A mission
 * module (docs/season-2/MISSION_MODULES.md): everything the mission adds lives here; M1's archive is only
 * extended, with every addition gated on this mission being open.
 *
 * Ryan is busy (his secret), so Sabri is walking Snooki — and Snooki walks Sabri to the archive. There Snooki
 * snatches Anji's case notebook (play, not theft), "returns" it to the wrong person (Sabri), then takes it back
 * and runs. Three legs of chase (minigames/s2-chase.js: the archive path, the lantern tree, the shed roof); twice
 * she loses the trail at a fork and must read it (paw size, wet or dry, which way the toes point —
 * puzzles s2-trail-1, s2-trail-2). The trail ends behind the shed, at her husky's stash: her notebook dropped
 * on top, and under it the torn register page of the lantern night — small tooth marks — with Ryan's sweets
 * wrapper folded inside. Snooki will not lead her any further (Ryan's surprise is Ryan's). Ryan comes, laughing;
 * Snooki goes back to him. Snooki is Ryan's dog and never becomes her companion (data/companions.js).
 *
 * Decisions made here: stash (return the husky's treasures, or keep them as evidence) — read at once by Ryan's
 * line, and again by the husky and the stash when she comes back (and Mission 06 reads it). Read here from M1:
 * office-cover (Sabri's first line). Optional finds on the chase's high routes (flags) are read at the end.
 * Fiction written for the game.
 */
import { PACK_S2 } from '../missions-s2.js';
import { GROUND } from '../../world/props.js';

const after = (id) => `flag:mission:${id}`;
const OPEN = after('s2-12');
const DONE_M = after('s2-13');
const F = (k) => `s2:13-${k}`;
const flag = (k) => `flag:${F(k)}`;
const MET = flag('met');
const GAVE = flag('gave');
const STOLEN = flag('stolen');
const LEG1 = flag('leg1');
const FORK1 = flag('fork1');
const LEG2 = flag('leg2');
const FORK2 = flag('fork2');
const LEG3 = flag('leg3');
const AT_STASH = flag('at-stash');
const DONE = flag('done');
const NB_TABLE = flag('nb-table');
const NB_DOG = flag('nb-dog');
const NB_SABRI = flag('nb-sabri');
const NOTEBOOK = flag('notebook'); // her notebook is back in her hands
const DECIDED = { any: ['dec:stash=return', 'dec:stash=keep'] };

/* ── the trail: paw prints drawn on the ground (no art to bake) ── */
const PRINT = {
  big: { rx: 4.6, ry: 3.8, toe: 2, spread: 4.2, reach: 7, claws: true },
  narrow: { rx: 2.8, ry: 4.4, toe: 1.4, spread: 2.9, reach: 6.6, claws: true },
  small: { rx: 2.6, ry: 2.6, toe: 1.25, spread: 2.7, reach: 4.6, claws: false },
};
/** One paw print: `dir` +1 toes away from her (into the path), -1 toes toward her (out of it). */
function paw(ctx, x, y, k, { kind, wet, dir }) {
  const p = PRINT[kind];
  const ink = wet ? '#2a1d16' : '#e2cfac';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k * 1.6, k * 1.6 * 0.7); // lying on the ground: flattened
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    // four toes in an arc ahead of the pad: the outer two a little further back
    const tx = (i - 1.5) * p.spread;
    const ty = -dir * (p.reach - (i === 0 || i === 3 ? p.toe * 0.8 : 0));
    ctx.beginPath();
    ctx.arc(tx, ty, p.toe, 0, Math.PI * 2);
    ctx.fill();
    if (p.claws) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(tx, ty - dir * p.toe);
      ctx.lineTo(tx * 1.15, ty - dir * (p.toe + 1.8));
      ctx.stroke();
    }
  }
  if (wet) {
    ctx.fillStyle = 'rgba(168, 212, 240, 0.85)'; // still shining
    ctx.beginPath();
    ctx.ellipse(-p.rx * 0.3, -p.ry * 0.25, p.rx * 0.35, p.ry * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#efe2c6'; // crumbling at the edges
    for (const [sx, sy] of [[p.rx + 0.8, 0.6], [-p.rx - 0.6, -0.4], [0.5, p.ry + 0.8], [-1.2, -p.ry - 0.8]]) ctx.fillRect(sx, sy, 0.9, 0.9);
  }
  ctx.restore();
}
/** A shoe print (Sabri's trainers, from the morning walk). */
function shoe(ctx, x, y, k) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k * 1.6, k * 1.6 * 0.7);
  ctx.fillStyle = '#e2cfac';
  ctx.beginPath();
  ctx.ellipse(0, -2, 3.4, 5.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 5, 2.6, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
/**
 * A path leading away from the fork (drawn as it recedes into the hedge), its name on a post, and the marks on
 * it: `lines` — 'in' (toes into the path), 'out' (toes out of it), both (in, and back out); `stop` — the prints
 * end half-way (at something to climb).
 */
function pathMouth(ctx, x, name, m, P) {
  ctx.save();
  ctx.fillStyle = '#1d2f2a'; // the gap in the hedge
  ctx.beginPath();
  ctx.ellipse(x, GROUND - 52, 17, 22, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#7a6448';
  ctx.beginPath();
  ctx.moveTo(x - 36, GROUND + 6);
  ctx.lineTo(x + 36, GROUND + 6);
  ctx.lineTo(x + 14, GROUND - 50);
  ctx.lineTo(x - 14, GROUND - 50);
  ctx.closePath();
  ctx.fill();
  const steps = m.stop ? [0.12, 0.4] : [0.12, 0.42, 0.72];
  const kinds = m.lines.length > 1 ? [-1, 1] : [0];
  m.lines.forEach((dirName, i) => {
    const dir = dirName === 'in' ? 1 : -1;
    for (const t of steps) {
      const k = 1 - 0.55 * t;
      paw(ctx, x + kinds[i] * 9 * k + (t * 10 % 2 ? 2 : -2) * k, GROUND + 2 - t * 52, k, { kind: m.kind, wet: m.wet, dir });
    }
  });
  if (m.shoes) for (const t of [0.25, 0.6]) shoe(ctx, x + 16 * (1 - 0.5 * t), GROUND + 2 - t * 52, 1 - 0.55 * t);
  ctx.restore();
  P.signPost(ctx, x, GROUND - 48, name);
}
function hedge(ctx, x0, x1) {
  ctx.save();
  ctx.fillStyle = '#244a3e';
  ctx.fillRect(x0, GROUND - 78, x1 - x0, 72);
  ctx.fillStyle = '#2f5c4c';
  for (let x = x0 + 6; x < x1; x += 13) {
    ctx.beginPath();
    ctx.arc(x, GROUND - 78 + ((x * 7) % 5), 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
/** Her case notebook: blue cloth, a cream page edge. */
function notebookAt(ctx, x, y, a = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = '#2f5d8a';
  ctx.fillRect(-9, -6, 18, 13);
  ctx.fillStyle = '#e9e4d8';
  ctx.fillRect(-8, -5, 3, 11);
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(3, -6, 2, 13);
  ctx.restore();
}
/** Wet paw prints across the archive floor, from Sabri to the door. */
function floorTrail(ctx, x0, x1) {
  for (let x = x1, i = 0; x > x0; x -= 34, i++) paw(ctx, x, GROUND + 6 + (i % 2) * 5, 0.8, { kind: 'big', wet: true, dir: 1 });
}
function shed(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(x - 120, GROUND - 120, 240, 120);
  ctx.strokeStyle = 'rgba(40,25,15,.45)';
  ctx.lineWidth = 1.5;
  for (let k = -110; k < 120; k += 16) {
    ctx.beginPath();
    ctx.moveTo(x + k, GROUND - 120);
    ctx.lineTo(x + k, GROUND);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a3b32';
  ctx.beginPath();
  ctx.moveTo(x - 136, GROUND - 116);
  ctx.lineTo(x, GROUND - 176);
  ctx.lineTo(x + 136, GROUND - 116);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4b2620';
  ctx.fillRect(x - 6, GROUND - 180, 12, 6);
  ctx.fillStyle = '#3b2a20'; // its small door
  ctx.fillRect(x - 22, GROUND - 78, 44, 78);
  ctx.fillStyle = '#c9a25c';
  ctx.beginPath();
  ctx.arc(x + 14, GROUND - 40, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function woodpile(ctx, x) {
  ctx.save();
  ctx.fillStyle = '#7a5232';
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k < 4 - row; k++) {
      const cx = x - 24 + k * 16 + row * 8;
      const cy = GROUND - 8 - row * 15;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c99a6a';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5232';
    }
  }
  ctx.restore();
}
function fence(ctx, x, open) {
  ctx.save();
  ctx.fillStyle = '#8a6a4a';
  for (let k = -70; k <= 70; k += 14) if (!open || Math.abs(k) > 20) ctx.fillRect(x + k - 4, GROUND - 120, 9, 120);
  ctx.fillRect(x - 74, GROUND - 96, 148, 7);
  ctx.fillRect(x - 74, GROUND - 40, 148, 7);
  if (open) {
    ctx.fillStyle = '#a07a52';
    ctx.save();
    ctx.translate(x - 20, GROUND);
    ctx.scale(0.35, 1); // the gate, swung open
    ctx.fillRect(0, -116, 40, 116);
    ctx.restore();
  } else {
    ctx.fillStyle = '#3b3b46'; // its latch (the inside)
    ctx.fillRect(x + 12, GROUND - 66, 8, 5);
  }
  ctx.restore();
}
/** The husky's stash: a hollow under the fence, her treasures — and, while it is there, the torn page. */
function stash(ctx, x, { page, book }) {
  ctx.save();
  ctx.fillStyle = '#3a2a1e';
  ctx.beginPath();
  ctx.ellipse(x, GROUND + 4, 40, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e2d6'; // an old striped sock
  ctx.fillRect(x - 30, GROUND - 6, 20, 7);
  ctx.fillStyle = '#c45a5a';
  for (let k = 0; k < 3; k++) ctx.fillRect(x - 28 + k * 6, GROUND - 6, 2, 7);
  ctx.fillStyle = '#9fb33a'; // a chewed ball
  ctx.beginPath();
  ctx.arc(x + 22, GROUND - 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d0506a'; // a ribbon
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, GROUND - 2);
  ctx.quadraticCurveTo(x + 4, GROUND - 14, x + 12, GROUND - 3);
  ctx.stroke();
  if (page) {
    // the register page: cream, one torn edge, a row of small tooth marks; a pink wrapper peeking out
    ctx.fillStyle = '#f2ead6';
    ctx.beginPath();
    ctx.moveTo(x - 14, GROUND - 22);
    ctx.lineTo(x + 12, GROUND - 24);
    for (let k = 0; k < 6; k++) ctx.lineTo(x + 12 + (k % 2 ? 3 : 0), GROUND - 24 + k * 3.4);
    ctx.lineTo(x - 14, GROUND - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a6a58';
    for (let k = 0; k < 4; k++) ctx.fillRect(x - 10 + k * 5, GROUND - 21, 1.6, 2.4);
    ctx.fillStyle = '#9aa3b8';
    for (let k = 0; k < 3; k++) ctx.fillRect(x - 11, GROUND - 15 + k * 4, 18, 1.1);
    ctx.fillStyle = '#e86a8a';
    ctx.fillRect(x + 4, GROUND - 9, 9, 5);
  }
  ctx.restore();
  if (book) notebookAt(ctx, x - 2, GROUND - 28, -0.15);
}

/* ── the six paths at each fork, and what is on them (what she reads; the answer is never written in a line
 *    said before the puzzle — only what she sees) ── */
const FORK_1 = [
  { id: 'a', x: 190, name: 'درب الأرشيف', marks: { kind: 'big', wet: true, lines: ['out'] } },
  { id: 'b', x: 340, name: 'ممر البركة', marks: { kind: 'big', wet: true, lines: ['in', 'out'] } },
  { id: 'c', x: 490, name: 'فتحة السياج', marks: { kind: 'small', wet: false, lines: ['in'] } },
  { id: 'd', x: 700, name: 'ممر الشجرة', marks: { kind: 'big', wet: true, lines: ['in'] } },
  { id: 'e', x: 850, name: 'درب البيت', marks: { kind: 'big', wet: false, lines: ['out'], shoes: true } },
  { id: 'f', x: 1000, name: 'ممر الورد', marks: { kind: 'narrow', wet: true, lines: ['in', 'out'] } },
];
const FORK_2 = [
  { id: 'a', x: 170, name: 'درب الشجرة', marks: { kind: 'big', wet: true, lines: ['out'] } },
  { id: 'b', x: 320, name: 'باب المشتل', marks: { kind: 'narrow', wet: true, lines: ['in', 'out'] } },
  { id: 'c', x: 470, name: 'ممر الخضرة', marks: { kind: 'big', wet: false, lines: ['in'] } },
  { id: 'd', x: 690, name: 'بوابة الشارع', marks: { kind: 'big', wet: true, lines: ['in', 'out'] } },
  { id: 'e', x: 820, name: 'ورا البرميل', marks: { kind: 'small', wet: false, lines: ['in'] } },
  { id: 'f', x: 930, name: 'كومة الحطب', marks: { kind: 'big', wet: true, lines: ['in'], stop: true } },
];
/** (tests: what is drawn on each path is what decides its reading) */
export const FORKS = [FORK_1, FORK_2];
const read1 = (p) => flag(`m1-${p.id}`);
const read2 = (p) => flag(`m2-${p.id}`);
const SIGN_1 = 595;
const SIGN_2 = 580;
const STASH_X = 1400;
const GATE_X = 1262;

/** The chase legs: a minigame, then the next place. Leaving the chase keeps the leg's last checkpoint. */
const leg = (n, then) => ({ game: 's2-chase', options: { leg: n }, then, else: [{ say: 's2.13-later' }] });
const LEG_1 = leg(0, [{ fx: LEG1, quiet: true }, { say: 's2.13-leg1-done' }, { fade: 'out' }, { goto: 's2-trail', x: 150 }]);
const LEG_2 = leg(1, [{ fx: LEG2, quiet: true }, { say: 's2.13-leg2-done' }, { fade: 'out' }, { goto: 's2-shed', x: 120 }]);
const LEG_3 = leg(2, [{ fx: LEG3, quiet: true }, { say: 's2.13-leg3-done' }, { fade: 'out' }, { goto: 's2-shed', x: 1330 }]);

/* ── مفترق الدروب: the first fork (after the archive path) ── */
const S2_TRAIL = {
  id: 's2-trail',
  title: 'مفترق الدروب',
  theme: 'meadow',
  music: 'garden',
  width: 1200,
  spawn: 150,
  seed: 1313,
  props: [{ type: 'bush', x: 70 }, { type: 'bush', x: 1130 }],
  dynamic: [
    { x: 600, reach: 700, draw: (ctx) => hedge(ctx, 110, 1080) },
    ...FORK_1.map((p) => ({ x: p.x, reach: 60, draw: (ctx, { P }) => pathMouth(ctx, p.x, p.name, p.marks, P) })),
    { x: SIGN_1, reach: 40, draw: (ctx, { P }) => P.signPost(ctx, SIGN_1, GROUND + 4, 'المفترق') },
  ],
  interact: [
    ...FORK_1.map((p) => ({
      id: `path-${p.id}`,
      x: p.x,
      w: 60,
      h: 100,
      label: p.name,
      icon: '🐾',
      cases: [
        // once the trail is read: the way he went is the way on
        ...(p.id === 'd' ? [{ if: [FORK1, `!${LEG2}`], run: [LEG_2] }] : []),
        { run: [{ all: [{ pose: 'anji', anim: 'crouch', for: 900 }, { move: 'husky', x: p.x + 30, speed: 220 }] }, { pose: 'husky', anim: 'sniff', for: 600 }, { say: `s2.13-m1-${p.id}` }, { fx: read1(p), quiet: true }] },
      ],
    })),
    {
      id: 'signpost',
      x: SIGN_1,
      w: 40,
      h: 80,
      label: 'المفترق',
      icon: '🪧',
      cases: [
        { if: FORK1, run: [{ say: 's2.13-sign1-again' }] },
        { if: { not: FORK_1.map(read1) }, run: [{ say: 's2.13-sign1-wait' }] },
        {
          run: [
            { if: '!seen:dlg:s2.13-sign1-intro', then: [{ say: 's2.13-sign1-intro' }] },
            { puzzle: 's2-trail-1', then: [{ say: 's2.13-fork1-done' }, LEG_2], else: [{ say: 's2.13-later' }] },
          ],
        },
      ],
    },
  ],
  triggers: [
    {
      id: 'arrive',
      x1: 100,
      x2: 420,
      once: false,
      if: [LEG1, `!${flag('in-trail')}`],
      run: [
        { camera: 600, ms: 900 },
        { say: 's2.13-trail-enter' },
        // her husky dashes into the rose path, sniffs, and comes back: she does not know either
        { move: 'husky', x: 1000, speed: 300 },
        { all: [{ pose: 'husky', anim: 'sniff', for: 800 }, { emote: 'husky', icon: '?', ms: 900 }] },
        { move: 'husky', x: 240, speed: 300 },
        { all: [{ pose: 'husky', anim: 'bark', for: 700 }, { sfx: 'bark' }, { bubble: 'husky', text: 'هاو! … شمّيت هواية. كلها سنوكي!', ms: 2400 }] },
        { camera: null, ms: 300 },
        { say: 's2.13-trail-read' },
        { fx: flag('in-trail'), quiet: true },
      ],
    },
  ],
  exits: [
    { side: 'left', to: 's2-archive', spawn: 1340 },
    { side: 'right', to: 's2-shed', spawn: 120, if: LEG2 },
  ],
  ambient: [{ t: 'ست دروب، وكل درب يحچي. بس لازم تعرفين تسمعين.' }],
};

/* ── ورا السقيفة: the second fork, the shed, and behind it the husky's stash ── */
const S2_SHED = {
  id: 's2-shed',
  title: 'السقيفة',
  theme: 'meadow',
  music: 'garden',
  width: 1500,
  spawn: 120,
  seed: 1314,
  props: [{ type: 'bush', x: 60 }, { type: 'pot', x: 1480 }],
  // the garden gate behind the shed is latched from the inside: she gets round only over the roof
  blockers: [{ x: GATE_X, w: 30, if: `!${LEG3}` }],
  actors: [
    // after the second fork: on the roof ridge, wagging, her notebook in his mouth
    { id: 'snooki', kind: 'snooki', x: 1080, y: GROUND - 176, facing: -1, mood: 'wag', if: [FORK2, `!${LEG3}`] },
    // behind the shed: sitting by the stash, the picture of innocence
    { id: 'snooki', kind: 'snooki', x: 1446, facing: -1, mood: 'sit', if: [LEG3, `!${DONE}`] },
  ],
  dynamic: [
    { x: 550, reach: 520, draw: (ctx) => hedge(ctx, 100, 1000) },
    { x: 1080, reach: 160, draw: (ctx) => shed(ctx, 1080) },
    { x: 960, reach: 40, draw: (ctx) => woodpile(ctx, 960) },
    ...FORK_2.map((p) => ({ x: p.x, reach: 60, draw: (ctx, { P }) => pathMouth(ctx, p.x, p.name, p.marks, P) })),
    { x: SIGN_2, reach: 40, draw: (ctx, { P }) => P.signPost(ctx, SIGN_2, GROUND + 4, 'المفترق') },
    { x: GATE_X, reach: 80, draw: (ctx, { game }) => fence(ctx, GATE_X, game.flag(F('leg3'))) },
    {
      x: STASH_X,
      reach: 50,
      draw: (ctx, { game }) => stash(ctx, STASH_X, { page: !game.has('s2.ev.e-page') || game.flag('s2:dec:stash') === 'return', book: game.flag(F('leg3')) && !game.flag(F('notebook')) }),
    },
    // her notebook in his mouth, on the roof
    { x: 1080, reach: 60, if: [FORK2, `!${LEG3}`], draw: (ctx, { world }) => { const s = world.actor('snooki'); if (s?.visible) notebookAt(ctx, s.x + s.facing * 20, s.y - 34, 0.2); } },
  ],
  interact: [
    ...FORK_2.map((p) => ({
      id: `path-${p.id}`,
      x: p.x,
      w: 60,
      h: 100,
      label: p.name,
      icon: '🐾',
      cases: [
        ...(p.id === 'f' ? [{ if: [FORK2, `!${LEG3}`], run: [LEG_3] }] : []),
        { run: [{ all: [{ pose: 'anji', anim: 'crouch', for: 900 }, { move: 'husky', x: p.x + 30, speed: 220 }] }, { pose: 'husky', anim: 'sniff', for: 600 }, { say: `s2.13-m2-${p.id}` }, { fx: read2(p), quiet: true }] },
      ],
    })),
    {
      id: 'signpost',
      x: SIGN_2,
      w: 40,
      h: 80,
      label: 'المفترق',
      icon: '🪧',
      cases: [
        { if: FORK2, run: [{ say: 's2.13-sign2-again' }] },
        { if: { not: FORK_2.map(read2) }, run: [{ say: 's2.13-sign1-wait' }] },
        {
          run: [
            { if: '!seen:dlg:s2.13-sign2-intro', then: [{ say: 's2.13-sign2-intro' }] },
            {
              puzzle: 's2-trail-2',
              then: [
                // up there: on the roof ridge, wagging, the notebook in his mouth
                { spawn: { id: 'snooki', kind: 'snooki', x: 1080, y: GROUND - 176, facing: -1, mood: 'wag', fadeIn: true } },
                { camera: 'snooki', ms: 700 },
                { all: [{ jolt: 'snooki', type: 'hop' }, { sfx: 'bark' }, { bubble: 'snooki', text: '😜', ms: 1600 }] },
                { say: 's2.13-fork2-done' },
                LEG_3,
              ],
              else: [{ say: 's2.13-later' }],
            },
          ],
        },
      ],
    },
    {
      id: 'gate',
      x: GATE_X,
      w: 50,
      h: 120,
      label: 'باب الحديقة',
      icon: '🚪',
      cases: [{ if: `!${LEG3}`, run: [{ say: 's2.13-gate-locked' }] }, { run: [{ say: 's2.13-gate-open' }] }],
    },
    {
      id: 'snooki',
      actor: 'snooki',
      x: 1446,
      w: 50,
      h: 70,
      label: 'سنوكي',
      icon: '🐾',
      if: [LEG3, `!${DONE}`],
      run: [{ all: [{ pose: 'snooki', anim: 'innocent', for: 1400 }, { bubble: 'snooki', text: '♪ …', ms: 1400 }] }, { say: 's2.13-snooki-stash' }],
    },
    {
      id: 'stash',
      x: STASH_X,
      w: 60,
      h: 60,
      label: 'كومة {husky}',
      icon: '🦴',
      if: LEG3,
      cases: [
        // her notebook, and what lies under it (once)
        {
          if: '!ev:e-page',
          run: [
            { all: [{ pose: 'anji', anim: 'crouch', for: 900 }, { move: 'husky', x: STASH_X - 50, speed: 200 }] },
            { fx: NOTEBOOK, quiet: true },
            { say: 's2.13-stash-find' },
            { fx: ['ev:e-page', 'ev:e-wrapper'] },
            { say: 's2.13-stash-choice' },
            { say: 's2.13-snooki-loyal' },
            ...ryanComes(),
          ],
        },
        // (an interrupted beat replays from where it stopped)
        { if: { not: DECIDED }, run: [{ say: 's2.13-stash-choice' }, { say: 's2.13-snooki-loyal' }, ...ryanComes()] },
        { if: `!${DONE}`, run: ryanComes() },
        // later: what she chose shows in the stash and in her husky
        { run: [{ if: 'dec:stash=return', then: [{ all: [{ move: 'husky', x: STASH_X + 30, speed: 200 }, { pose: 'husky', anim: 'celebrate', for: 1200 }] }], else: [{ all: [{ move: 'husky', x: STASH_X + 30, speed: 200 }, { pose: 'husky', anim: 'sit', for: 1400 }] }] }, { say: 's2.13-stash-again' }] },
      ],
    },
  ],
  triggers: [
    {
      id: 'arrive',
      x1: 80,
      x2: 380,
      once: false,
      if: [LEG2, `!${flag('in-shed')}`],
      run: [
        { say: 's2.13-shed-enter' },
        // her husky is sure: the nursery gate — she runs in, comes back out, and barks at it
        { move: 'husky', x: 330, speed: 300 },
        { pose: 'husky', anim: 'sniff', for: 700 },
        { move: 'husky', x: 280, speed: 260 },
        { all: [{ face: 'husky', dir: 1 }, { pose: 'husky', anim: 'bark', for: 900 }, { sfx: 'bark' }, { bubble: 'husky', text: 'هاو! هاو! من هنا!', ms: 2200 }] },
        { say: 's2.13-shed-husky' },
        { fx: flag('in-shed'), quiet: true },
      ],
    },
    {
      id: 'behind',
      x1: 1290,
      x2: 1500,
      once: false,
      if: [LEG3, `!${AT_STASH}`],
      run: [
        { camera: { between: ['snooki', 'anji'] }, ms: 600 },
        { all: [{ pose: 'snooki', anim: 'innocent', for: 1800 }, { bubble: 'snooki', text: '♪ …', ms: 1800 }] },
        { say: 's2.13-stash-arrive' },
        { move: 'husky', x: STASH_X - 44, speed: 240 },
        { all: [{ face: 'husky', dir: 1 }, { pose: 'husky', anim: 'sit', for: 2200 }, { bubble: 'husky', text: '… هاي مو مالتي.', ms: 2400 }] },
        { say: 's2.13-stash-husky' },
        { camera: null, ms: 200 },
        { fx: AT_STASH, quiet: true },
      ],
    },
  ],
  exits: [{ side: 'left', to: 's2-trail', spawn: 1080 }],
  ambient: [{ t: 'السقيفة تصرّ بالهوا. وورا الباب… ريحة كنز.' }],
};

/** Ryan comes, laughing; Snooki goes back to him; they leave her to her case. */
function ryanComes() {
  return [
    { spawn: { id: 'ryan', kind: 'ryan', x: 1500, facing: -1, fadeIn: true } },
    { move: 'ryan', x: 1476, speed: 110 },
    { camera: { between: ['ryan', 'anji'] }, ms: 500 },
    { all: [{ jolt: 'ryan', type: 'hop' }, { bubble: 'ryan', text: 'هههههه!', ms: 1800 }] },
    { all: [{ move: 'snooki', to: 'ryan', gap: 40, speed: 260 }, { sfx: 'bark' }] },
    { all: [{ face: 'snooki', toward: 'ryan' }, { pose: 'snooki', anim: 'excited', for: 1400 }, { jolt: 'ryan', type: 'hop' }] },
    { say: 's2.13-ryan' },
    { all: [{ move: 'ryan', x: 1620, speed: 120 }, { move: 'snooki', x: 1590, speed: 140 }] },
    { despawn: 'ryan', fade: true },
    { show: 'snooki', visible: false },
    { camera: null, ms: 200 },
    { fx: DONE },
  ];
}

/* ── the archive (M1's place), while this mission is open ── */
const NB_ON = (k) => [OPEN, k, `!${STOLEN}`];
const ARCHIVE = {
  actors: [
    { id: 'sabri', kind: 'sabri', x: 330, facing: 1, if: [OPEN, `!${DONE_M}`], notice: { dist: 130, emote: '!' } },
    // Snooki sits by Sabri, very well behaved (too well)
    { id: 'snooki', kind: 'snooki', x: 284, facing: -1, mood: 'sit', if: [OPEN, `!${STOLEN}`] },
  ],
  dynamic: [
    { x: 548, reach: 30, if: [...NB_ON(NB_TABLE), `!${GAVE}`], draw: (ctx) => notebookAt(ctx, 548, GROUND - 56) },
    { x: 300, reach: 700, if: NB_ON(NB_DOG), draw: (ctx, { world }) => { const s = world.actor('snooki'); if (s?.visible) notebookAt(ctx, s.x + s.facing * 25, s.y - 37, s.facing * 0.2); } },
    { x: 330, reach: 60, if: NB_ON(NB_SABRI), draw: (ctx, { world }) => { const s = world.actor('sabri'); if (s) notebookAt(ctx, s.x + s.facing * 15, s.y - 56, 0); } },
    { x: 215, reach: 220, if: [OPEN, STOLEN, `!${LEG1}`], draw: (ctx) => floorTrail(ctx, 50, 380) },
  ],
  interact: [
    {
      id: 'register',
      // she puts her notebook down to look at the register — and Snooki has it
      cases: [
        {
          if: [OPEN, `!${STOLEN}`, `!${GAVE}`],
          run: [
            { fx: [NB_TABLE, `!${NB_DOG}`, `!${NB_SABRI}`], quiet: true },
            { say: 's2.13-register' },
            { all: [{ jolt: 'snooki', type: 'hop' }, { emote: 'snooki', icon: '!', ms: 900 }] },
            { move: 'snooki', x: 560, speed: 340 },
            { all: [{ fx: [`!${NB_TABLE}`, NB_DOG], quiet: true }, { pose: 'snooki', anim: 'excited', for: 700 }, { jolt: 'anji', type: 'shake', ms: 500 }] },
            { camera: { between: ['snooki', 'anji'] }, ms: 400 },
            { say: 's2.13-snatch' },
            // …and "gives it back" — to Sabri
            { all: [{ move: 'snooki', x: 296, speed: 220 }, { camera: 'snooki', ms: 300 }] },
            { face: 'snooki', toward: 'sabri' },
            { all: [{ fx: [`!${NB_DOG}`, NB_SABRI], quiet: true }, { pose: 'snooki', anim: 'sit', for: 1600 }, { jolt: 'sabri', type: 'hop' }, { emote: 'sabri', icon: '?', ms: 1200 }] },
            { camera: { between: ['snooki', 'sabri'] }, ms: 400 },
            { say: 's2.13-wrong-person' },
            { fx: GAVE, quiet: true },
            { camera: null, ms: 200 },
          ],
        },
        { if: [OPEN, GAVE, `!${STOLEN}`], run: [{ say: 's2.13-register-later' }] },
      ],
    },
    {
      id: 'sabri',
      actor: 'sabri',
      x: 330,
      w: 50,
      h: 130,
      label: 'صبري',
      icon: '💬',
      if: [OPEN, `!${DONE_M}`],
      cases: [
        {
          // he holds it out to her — and Snooki takes it back, and is gone through the door
          if: [GAVE, `!${STOLEN}`],
          run: [
            { say: 's2.13-give-back' },
            { all: [{ pose: 'sabri', anim: 'point', for: 900 }, { face: 'snooki', toward: 'sabri' }] },
            { all: [{ jolt: 'snooki', type: 'lunge', ms: 400 }, { fx: [`!${NB_SABRI}`, NB_DOG], quiet: true }, { pose: 'sabri', anim: 'handsup', for: 1400 }, { puff: 'sabri', type: 'sweat', ms: 2200 }, { sfx: 'whoosh' }] },
            { all: [{ move: 'snooki', x: 30, speed: 400 }, { camera: 'snooki', ms: 600 }, { jolt: 'anji', type: 'shake', ms: 600 }, { pose: 'husky', anim: 'bark', for: 900 }, { sfx: 'bark' }] },
            { show: 'snooki', visible: false },
            { fx: [`!${NB_DOG}`, STOLEN], quiet: true },
            { camera: null, ms: 300 },
            { say: 's2.13-gone' },
          ],
        },
        { if: [STOLEN, `!${LEG1}`], run: [{ say: 's2.13-sabri-chase' }] },
        { if: STOLEN, run: [{ say: 's2.13-sabri-wait' }] },
        { run: [{ say: 's2.13-sabri-hello' }] },
      ],
    },
    { id: 'snooki', actor: 'snooki', x: 284, w: 50, h: 70, label: 'سنوكي', icon: '🐾', if: [OPEN, `!${STOLEN}`], run: [{ all: [{ pose: 'snooki', anim: 'innocent', for: 1300 }, { bubble: 'snooki', text: '♪ …', ms: 1300 }] }, { say: 's2.13-snooki-sit' }] },
    { id: 'trail', x: 70, w: 50, h: 60, label: 'آثار سنوكي', icon: '🐾', if: [OPEN, STOLEN, `!${LEG1}`, `!${DONE_M}`], run: [{ if: '!seen:dlg:s2.13-trail-start', then: [{ say: 's2.13-trail-start' }] }, LEG_1] },
  ],
  triggers: [{ id: 'm02', x1: 200, x2: 460, once: false, if: [OPEN, `!${MET}`, `!${DONE_M}`], run: [{ camera: { between: ['sabri', 'anji'] }, ms: 500 }, { say: 's2.13-archive-enter' }, { camera: null, ms: 200 }, { fx: MET, quiet: true }] }],
  // after the first leg, the archive's far door is the way back to the fork
  exits: [{ side: 'right', to: 's2-trail', spawn: 150, if: [OPEN, LEG1] }],
};

/* ── the trail-reading puzzles: every path, one reading (strict; no help; any order) ── */
const BINS = [
  { id: 'went', label: 'راح منه هسه', icon: 'paw' },
  { id: 'came', label: 'إجا منه هسه', icon: 'footprint' },
  { id: 'back', label: 'دخل ورجع', icon: 'claw' },
  { id: 'old', label: 'أثر قديم', icon: 'moon-crescent' },
  { id: 'other', label: 'مو أثر سنوكي', icon: 'cat' },
];
const card = (p, note, accepts) => ({ id: p.id, label: p.name, note, accepts: [accepts] });

/* ── the module ── */
export default {
  id: 'm02',
  missions: [
    {
      id: 's2-13',
      kind: 'story',
      pack: PACK_S2,
      act: 3,
      day: 14,
      world: ['s2-archive'],
      title: 'سنوكي ضايع',
      where: 'الأرشيف والدروب',
      summary: 'صبري يمشّي سنوكي اليوم. أو سنوكي يمشّي صبري. وبالأرشيف… دفتر تحقيقچ على الطاولة.',
      unlock: OPEN,
      locked: 'ينفتح بعد «سر المكتب».',
      // steps say what to do, never which path
      steps: [
        { done: STOLEN, world: 's2-archive', text: 'روحي للأرشيف. صبري هناك… ويا سنوكي.' },
        { done: LEG1, world: 's2-archive', text: 'الحگي سنوكي! طلع من باب الأرشيف.' },
        { done: FORK1, world: 's2-archive', text: 'ضاع الأثر بالمفترق. اقري الدروب.' },
        { done: LEG2, world: 's2-archive', text: 'الحگيه مرة ثانية.' },
        { done: FORK2, world: 's2-archive', text: 'ضاع الأثر مرة ثانية. اقري الدروب.' },
        { done: LEG3, world: 's2-archive', text: 'الحگيه للآخر.' },
        { done: ['ev:e-page', 'ev:e-wrapper'], world: 's2-archive', text: 'شنو اللي ورا السقيفة؟' },
        { done: DONE, world: 's2-archive', text: 'خلّصي اللي بديتيه ورا السقيفة.' },
      ],
      reward: ['journal:s2-snooki'],
      rewardText: 'كنز الهاسكي',
      leadsTo: ['s2-14'],
    },
  ],
  evidence: {
    'e-page': { rel: 'fact', icon: 'note', label: 'الصفحة المگطوعة', note: 'صفحة ليلة الفوانيس من سجل الحديقة. حافتها مگروضة: آثار سنون صغيرة… سنون كلب. محد گطعها بإيده.' },
    'e-wrapper': { rel: 'fact', icon: 'candy', label: 'ورقة حلويات ريان', note: 'چانت مطوية جوّا الصفحة. نفس الحلويات اللي ريان يجيبها. سنوكي شمّها وهز ذيله.' },
  },
  decisions: {
    stash: ['return', 'keep'], // 02: give the husky her treasures back, or keep them as evidence (read: Ryan's line, the stash later, 06)
  },
  case: [{ mission: 's2-13', ids: ['e-page', 'e-wrapper'] }],
  journal: {
    's2-snooki': { title: 'سنوكي ضايع', icon: 'paw', text: 'دفتر مخطوف، ثلاث مطاردات، ومفترقين قريتهم بالآثار. وورا السقيفة كنز {husky}: صفحة مگروضة، وبيها ورقة حلويات.' },
  },
  puzzles: {
    's2-trail-1': {
      type: 'sort',
      title: 'المفترق الأول',
      goal: 'ست دروب. اقري آثار كل درب، وحطيه بالعمود اللي يناسبه.',
      intro: 'الكف الكبيرة بمخالب: سنوكي. كف {husky} أضيق، والقطة ما تبيّن مخالبها. سنوكي طلع من الأرشيف وعبر العشب المسگي: كفوفه مبلولة هسه، والأثر القديم ناشف ومتفتّت. والأصابع تأشر للجهة اللي چان ماشي لها.',
      config: {
        stages: [
          {
            kind: 'sort',
            prompt: 'كل درب، شنو تگول آثاره؟',
            bins: BINS,
            cards: [
              card(FORK_1[0], 'كف كبيرة بمخالب، مبلولة. الأصابع طالعة من الدرب، صوب المفترق.', 'came'),
              card(FORK_1[1], 'كف كبيرة بمخالب، مبلولة. صف داخل للممر… وصف مثله طالع منه.', 'back'),
              card(FORK_1[2], 'كف صغيرة مدوّرة، بلا مخالب. داخلة للفتحة.', 'other'),
              card(FORK_1[3], 'كف كبيرة بمخالب، مبلولة. داخلة للممر، وماكو شي طالع.', 'went'),
              card(FORK_1[4], 'كف كبيرة بمخالب، ناشفة ومتفتتة، طالعة من الدرب. ويمها آثار جزمة رياضية.', 'old'),
              card(FORK_1[5], 'كف ضيقة، مبلولة. داخلة للممر… ورجعت طالعة.', 'other'),
            ],
          },
        ],
        labels: { check: 'هيچ قريتها ✔' },
      },
      success: 'ممر البركة؟ دخله ورجع منه. والأثر اللي دخل وما رجع… بممر الشجرة.',
      reward: ['flag:s2:13-fork1'],
    },
    's2-trail-2': {
      type: 'sort',
      title: 'المفترق الثاني',
      goal: 'ست دروب مرة ثانية. نفس القراءة: الكف، البلل، ووين تأشر الأصابع.',
      intro: 'سنوكي عبر الساقية بالشجرة: كفوفه بعدها مبلولة. و{husky} ركضت ويانا، فكفوفها هم مبلولة. الأثر القديم ناشف ومتفتّت.',
      config: {
        stages: [
          {
            kind: 'sort',
            prompt: 'كل درب، شنو تگول آثاره؟',
            bins: BINS,
            cards: [
              card(FORK_2[0], 'كف كبيرة بمخالب، مبلولة. طالعة من الدرب، صوب المفترق.', 'came'),
              card(FORK_2[1], 'كف ضيقة، مبلولة. داخلة… ورجعت طالعة. و{husky} وگفت گدامه تنبح.', 'other'),
              card(FORK_2[2], 'كف كبيرة بمخالب، ناشفة ومتفتتة. داخلة للممر.', 'old'),
              card(FORK_2[3], 'كف كبيرة بمخالب، مبلولة. صف داخل للبوابة… وصف مثله طالع.', 'back'),
              card(FORK_2[4], 'كف صغيرة مدوّرة، بلا مخالب، ناشفة.', 'other'),
              card(FORK_2[5], 'كف كبيرة بمخالب، مبلولة. داخلة صوب الحطب، وتوگف عند أول جذع. لا كمّلت على الگاع، ولا رجعت.', 'went'),
            ],
          },
        ],
        labels: { check: 'هيچ قريتها ✔' },
      },
      success: 'البوابة؟ دخل ورجع. و{husky}… نبحت على درب مو درب سنوكي. والأثر اللي وگف عند الحطب: صعد.',
      reward: ['flag:s2:13-fork2'],
    },
  },
  dialogue: {
    /* the archive */
    's2.13-archive-enter': [
      { s: 'sabri', e: 'surprised', t: 'أنجي! هلا! … لا تسأليني شجابني للأرشيف.', act: [{ jolt: 'sabri', type: 'hop' }, { pose: 'sabri', anim: 'handsup', for: 800 }] },
      { s: 'anji', e: 'curious', t: 'صبري؟ وسنوكي؟ وين ريان؟' },
      { s: 'sabri', e: 'smile', t: 'ريان مشغول. گال لي: «صبري، مشّي سنوكي ساعة.» وسنوكي مشّاني للأرشيف.', act: [{ pose: 'sabri', anim: 'point', for: 900 }] },
      // what she did about his slip at the office (Mission 01): he remembers
      { if: 'dec:office-cover=cover', then: [{ s: 'sabri', e: 'worried', t: 'وإذا أحد سألچ عن الطابعة… الطابعة بخير. ما گالت شي جديد.', act: [{ pose: 'sabri', anim: 'shrug', for: 900 }] }] },
      { if: 'dec:office-cover=truth', then: [{ s: 'sabri', e: 'smile', t: 'واليوم ما گلت لأحد أي شي. ولا جملة. فخور بنفسي.', act: [{ pose: 'sabri', anim: 'cross', for: 1000 }] }] },
      { s: 'anji', e: 'smirk', t: 'وسنوكي گاعد بأدب… هذا مو طبيعي.', act: [{ pose: 'snooki', anim: 'innocent', for: 1600 }] },
    ],
    's2.13-sabri-hello': [{ s: 'sabri', e: 'smile', t: 'سنوكي ما يسمع كلامي. يسمع كلام ريان بس… وكلام البسكويت.', act: [{ pose: 'sabri', anim: 'shrug', for: 900 }] }],
    's2.13-snooki-sit': [{ s: 'anji', e: 'skeptical', t: 'ذيله ما يتحرك، وعيونه على السگف. هذا الوجه أعرفه.' }],
    's2.13-register': [{ s: 'anji', e: 'thinking', t: 'السجل مرة ثانية. خليني أحط الدفتر على الطاولة… وأقارن.', act: [{ pose: 'anji', anim: 'crouch', for: 600 }] }],
    's2.13-snatch': [
      { s: 'anji', e: 'surprised', t: 'سنوكي! هذا دفتري! بيه كل القضية!' },
      { s: 'anji', e: 'soft', t: '(…ذيله يتحرك هسه.)' },
    ],
    's2.13-wrong-person': [
      { s: 'sabri', e: 'surprised', t: 'آآ… شكراً سنوكي؟ بس هذا مو دفتري.', act: [{ pose: 'sabri', anim: 'handsup', for: 900 }] },
      { s: 'sabri', e: 'worried', t: '«الفرضية B: ريان…» … أوه. أوه لا. آني ما قريت شي. ولا كلمة.', act: [{ puff: 'sabri', type: 'sweat', ms: 2200 }, { pose: 'sabri', anim: 'facepalm', for: 1200 }] },
      { s: 'anji', e: 'pout', t: 'صبري. الدفتر.' },
    ],
    's2.13-register-later': [{ s: 'anji', e: 'pout', t: 'السجل يگدر ينتظر. دفتري يم صبري.' }],
    's2.13-give-back': [{ s: 'sabri', e: 'smile', t: 'تفضلي، تفضلي! هاي مالتچ، كاملة، ما…', act: [{ pose: 'sabri', anim: 'point', for: 700 }] }],
    's2.13-gone': [
      { s: 'anji', e: 'surprised', t: 'سنوكي!!' },
      { s: 'sabri', e: 'worried', t: 'هو… هو يلعب! صح؟ هذا لعب؟', act: [{ pose: 'sabri', anim: 'handsup', for: 900 }] },
      { s: 'anji', e: 'determined', t: 'لعب أو مو لعب، دفتري وياه. {husky}، يلا!', act: [{ pose: 'husky', anim: 'excited', for: 1000 }] },
    ],
    's2.13-sabri-chase': [{ s: 'sabri', e: 'worried', t: 'طلع من الباب! آني… آني أحرس الأرشيف. هذا شغل مهم هم.', act: [{ pose: 'sabri', anim: 'point', for: 900 }] }],
    's2.13-sabri-wait': [{ s: 'sabri', e: 'worried', t: 'لگيتيه؟ لا تگولين لريان إني ضيّعته. گولي… سنوكي هو اللي ضيّعني.', act: [{ pose: 'sabri', anim: 'facepalm', for: 1000 }] }],
    's2.13-trail-start': [{ s: 'anji', e: 'thinking', t: 'آثار مبلولة على الگاع… لحد الباب. وبرّا، ممر الأرشيف.' }],
    's2.13-later': [{ s: 'anji', e: 'thinking', t: 'سنوكي ما يروح بعيد. يحب أحد يلحگه. أرجعله.' }],
    's2.13-leg1-done': [{ s: 'anji', e: 'surprised', t: 'وين راح؟! چان گدامي…' }],

    /* the first fork */
    's2.13-trail-enter': [{ s: 'anji', e: 'curious', t: 'ست دروب… وسنوكي اختفى. وين راح؟' }],
    's2.13-trail-read': [
      { s: 'anji', e: 'determined', t: 'لا. ما نخمّن. نقرا الآثار: كل درب، وحده.' },
      { s: 'anji', e: 'thinking', t: 'حجم الكف. مبلولة لو ناشفة. ووين تأشر الأصابع.' },
    ],
    's2.13-m1-a': [{ s: 'anji', e: 'thinking', t: 'درب الأرشيف: كف كبيرة بمخالب، مبلولة. الأصابع طالعة من الدرب، صوب المفترق.' }],
    's2.13-m1-b': [{ s: 'anji', e: 'thinking', t: 'ممر البركة: كف كبيرة بمخالب، مبلولة. صف داخل للممر… وصف مثله طالع منه.' }],
    's2.13-m1-c': [{ s: 'anji', e: 'thinking', t: 'فتحة السياج: كف صغيرة مدوّرة، بلا مخالب. داخلة للفتحة.' }],
    's2.13-m1-d': [{ s: 'anji', e: 'thinking', t: 'ممر الشجرة: كف كبيرة بمخالب، مبلولة. داخلة للممر، وماكو شي طالع.' }],
    's2.13-m1-e': [{ s: 'anji', e: 'thinking', t: 'درب البيت: كف كبيرة بمخالب، ناشفة ومتفتتة، طالعة من الدرب. ويمها آثار جزمة رياضية.' }],
    's2.13-m1-f': [{ s: 'anji', e: 'thinking', t: 'ممر الورد: كف ضيقة، مبلولة. داخلة للممر… ورجعت طالعة.' }],
    's2.13-sign1-wait': [{ s: 'anji', e: 'thinking', t: 'بعد أكو درب ما قريت آثاره.' }],
    's2.13-sign1-intro': [{ s: 'anji', e: 'determined', t: 'ست دروب، وكل درب حچى. هسه أرتّب اللي گالوه.' }],
    's2.13-fork1-done': [
      { s: 'anji', e: 'determined', t: 'ممر الشجرة. دخل، وما رجع.' },
      { s: 'narrator', t: '(من بعيد، بين الفوانيس: هاو!)' },
      { s: 'anji', e: 'smile', t: 'سمعتك! {husky}، يلا!', act: [{ pose: 'husky', anim: 'excited', for: 900 }] },
    ],
    's2.13-sign1-again': [{ s: 'anji', e: 'thinking', t: 'ممر الشجرة. هناك راح.' }],
    's2.13-leg2-done': [{ s: 'anji', e: 'pout', t: 'مرة ثانية؟! هذا الكلب عنده خريطة؟' }],

    /* the second fork */
    's2.13-shed-enter': [{ s: 'anji', e: 'curious', t: 'السقيفة… وست دروب ثانية. سنوكي يحب المفترقات.' }],
    's2.13-shed-husky': [{ s: 'anji', e: 'thinking', t: '{husky} تنبح على باب المشتل. … خليني أشوف الآثار بعيني.' }],
    's2.13-m2-a': [{ s: 'anji', e: 'thinking', t: 'درب الشجرة: كف كبيرة بمخالب، مبلولة. طالعة من الدرب، صوب المفترق.' }],
    's2.13-m2-b': [{ s: 'anji', e: 'thinking', t: 'باب المشتل: كف ضيقة، مبلولة. داخلة… ورجعت طالعة.' }],
    's2.13-m2-c': [{ s: 'anji', e: 'thinking', t: 'ممر الخضرة: كف كبيرة بمخالب، ناشفة ومتفتتة. داخلة للممر.' }],
    's2.13-m2-d': [{ s: 'anji', e: 'thinking', t: 'بوابة الشارع: كف كبيرة بمخالب، مبلولة. صف داخل للبوابة… وصف مثله طالع.' }],
    's2.13-m2-e': [{ s: 'anji', e: 'thinking', t: 'ورا البرميل: كف صغيرة مدوّرة، بلا مخالب، ناشفة.' }],
    's2.13-m2-f': [{ s: 'anji', e: 'thinking', t: 'كومة الحطب: كف كبيرة بمخالب، مبلولة. داخلة صوب الحطب، وتوگف عند أول جذع. لا كمّلت على الگاع، ولا رجعت.' }],
    's2.13-sign2-intro': [{ s: 'anji', e: 'determined', t: 'نفس القراءة. الكف، البلل، والأصابع. مو النباح.' }],
    's2.13-fork2-done': [
      { s: 'anji', e: 'surprised', t: 'فوگ السگف! من الحطب للسطح!' },
      { s: 'anji', e: 'smirk', t: 'و{husky}… ليش نبحتي على المشتل؟', act: [{ pose: 'husky', anim: 'sit', for: 1200 }, { bubble: 'husky', text: '… ما أدري شتگولين.', ms: 1800 }] },
    ],
    's2.13-sign2-again': [{ s: 'anji', e: 'thinking', t: 'الأثر وگف عند الحطب. لأنه صعد.' }],
    's2.13-gate-locked': [{ s: 'anji', e: 'thinking', t: 'باب الحديقة ورا السقيفة. مقفول… من جوّا.' }],
    's2.13-gate-open': [{ s: 'anji', e: 'smile', t: 'فتحته من جوّا. هسه الدرب سالك.' }],
    's2.13-leg3-done': [{ s: 'anji', e: 'surprised', t: 'نزل ورا السقيفة… ورا الباب المقفول!' }],

    /* the stash */
    's2.13-stash-arrive': [
      { s: 'anji', e: 'curious', t: 'سنوكي! … وهذا شنو؟ كومة أغراض، مدفونة نص دفن، ورا السقيفة؟' },
      { s: 'narrator', t: '(جوراب مخطط. كرة مگروضة. شريطة. … ودفترها، فوگ الكومة، كأنه رجع لمكانه.)' },
    ],
    's2.13-stash-husky': [{ s: 'anji', e: 'smirk', t: '{husky}… ليش گاعدة گدامها هيچ؟ هذا مخبأچ؟' }],
    's2.13-snooki-stash': [{ s: 'anji', e: 'skeptical', t: 'رجّعت الدفتر… لكومة {husky}؟ هنا تودّون الأشياء الضايعة؟' }],
    's2.13-stash-find': [
      { s: 'anji', e: 'smile', t: 'دفتري. سالم. بس مبلول شوية.' },
      { s: 'narrator', t: '(تحته، بين الجوراب والكرة: ورقة كبيرة، مطوية. صفحة… من سجل الحديقة.)' },
      { s: 'note', t: '«ليلة الفوانيس» — وبعدها أسماء، وساعات.' },
      { s: 'anji', e: 'surprised', t: 'الصفحة المگطوعة! … حافتها مو مگصوصة. مگروضة.' },
      { s: 'anji', e: 'thinking', t: 'سنون صغيرة. مو سنون سنوكي.', act: [{ face: 'husky', dir: -1 }, { bubble: 'husky', text: '…', ms: 1600 }] },
      { s: 'narrator', t: '(وجوّا الصفحة، مطوية زين: ورقة حلويات وردية.)' },
      { s: 'anji', e: 'soft', t: 'هاي الحلويات اللي ريان يجيبها دايماً.', act: [{ pose: 'snooki', anim: 'sniff', for: 1200 }] },
      { s: 'anji', e: 'thinking', t: 'يعني محد گطع الصفحة بإيده. {husky} لگت ريحة حلويات… وأخذت الصفحة وياها.' },
      // the bell she found up in the lantern tree's branches (an optional find on the chase)
      { if: 'flag:s2:13-find-bell', then: [{ s: 'anji', e: 'soft', t: 'وهذا جرسچ الضايع، {husky}. لگيته فوگ بالشجرة.', act: [{ pose: 'husky', anim: 'celebrate', for: 1200 }, { jolt: 'husky', type: 'hop' }] }] },
    ],
    's2.13-stash-choice': [
      { s: 'narrator', t: '({husky} حطت راسها على الكومة. وعيونها على الصفحة.)' },
      {
        s: 'anji',
        choice: [
          {
            t: 'هاي كنوزچ. أرجّعها… بس أكتب شنو شفت.',
            do: ['dec:stash=return'],
            then: [
              { s: 'narrator', t: '(أنجي ترسم الصفحة بدفترها: الأسماء، الساعات، آثار السنون. وترجّع الصفحة لمكانها.)' },
              { s: 'anji', e: 'smile', t: 'ودفتري يحفظ الباقي.', act: [{ pose: 'husky', anim: 'celebrate', for: 1400 }, { jolt: 'husky', type: 'hop' }] },
            ],
          },
          {
            t: 'آسفة، {husky}. هاي أدلة. تبقى ويايا.',
            do: ['dec:stash=keep'],
            then: [
              { s: 'narrator', t: '(أنجي تحط الصفحة والورقة بين أوراق دفترها. {husky} تدير ظهرها.)' },
              { s: 'anji', e: 'soft', t: 'أعوّضچ. بجوراب جديد.', act: [{ face: 'husky', dir: 1 }, { pose: 'husky', anim: 'sit', for: 1600 }] },
            ],
          },
        ],
      },
    ],
    's2.13-snooki-loyal': [
      { s: 'anji', e: 'determined', t: 'سنوكي. هاي ورقة حلويات ريان. وين ريان؟ وشنو يخبي؟', act: [{ face: 'snooki', dir: -1 }] },
      { s: 'narrator', t: '(سنوكي گعد. وباوع على السما. ولا خطوة.)', act: [{ pose: 'snooki', anim: 'stubborn', for: 2200 }, { bubble: 'snooki', text: 'لا.', ms: 1800 }] },
      { s: 'anji', e: 'smirk', t: 'وفي لصاحبه. حتى من وراه.' },
    ],
    's2.13-ryan': [
      { s: 'ryan', e: 'smile', t: 'لگيتيه! صبري دزّلي: «سنوكي ضاع». … سنوكي ما يضيع. صبري يضيع.' },
      { s: 'anji', e: 'pout', t: 'خطف دفتري! ودوّخني بثلاث مطاردات.' },
      { s: 'ryan', e: 'smile', t: 'إذا خطف منچ شي، يعني يحبچ. هيچ هو.' },
      // what she did with the stash, read at once
      { if: 'dec:stash=keep', then: [{ s: 'ryan', t: '… وهاي بإيدچ شنو؟ ورقة حلويات؟', act: [{ puff: 'ryan', type: 'sweat', ms: 2000 }] }, { s: 'anji', e: 'smirk', t: 'دليل. بقضية. مالتك؟' }, { s: 'ryan', t: 'حلويات؟ آني؟ … يعني إي. يعني… قصة طويلة.' }] },
      { if: 'dec:stash=return', then: [{ s: 'ryan', t: 'وهاي كومة شنو؟ … لحظة. هاي ورقة حلوياتي؟', act: [{ emote: 'ryan', icon: '?', ms: 1600 }] }, { s: 'anji', e: 'smile', t: 'كنز {husky}. رجّعتلها إياه. بس شفت كل شي.' }, { s: 'ryan', t: 'شفتي… كل شي؟', act: [{ puff: 'ryan', type: 'sweat', ms: 2000 }] }] },
      // what she found up on the chase's high routes
      { if: 'flag:s2:13-find-ball', then: [{ s: 'anji', e: 'smile', t: 'وهاي إله. لگيتها فوگ حايط الأرشيف.' }, { s: 'ryan', e: 'smile', t: 'كرته القديمة! دوّرناها شهر كامل.', act: [{ pose: 'snooki', anim: 'celebrate', for: 1400 }] }] },
      { if: 'flag:s2:13-find-glasses', then: [{ s: 'anji', e: 'smirk', t: 'وهاي على السطح. نظارة شمسية.' }, { s: 'ryan', e: 'smile', t: 'نظارة صبري! يدوّر عليها من أسبوع. أرجعها له… بعد ما يعتذر لسنوكي.' }] },
      { s: 'ryan', t: 'يلا سنوكي. خلّي أنجي تكمّل قضيتها.' },
      { s: 'anji', e: 'smirk', t: 'وإنت؟ ما عندك شي تگوله؟' },
      { s: 'ryan', e: 'smile', t: '…بعدين. صدگيني.' },
    ],
    // when she comes back to the stash
    's2.13-stash-again': [
      { if: 'dec:stash=return', then: [{ s: 'anji', e: 'smile', t: 'الصفحة بمكانها، و{husky} حارستها مثل كنز. ما تنطيني ياها حتى أشوفها.' }] },
      { if: 'dec:stash=keep', then: [{ s: 'anji', e: 'soft', t: 'الكومة بلا صفحة. و{husky} بدت تجمع جواريب جديدة… وتباوعني بطرف عينها.' }] },
    ],
  },
  scenes: [S2_TRAIL, S2_SHED],
  patches: { 's2-archive': ARCHIVE },
};
