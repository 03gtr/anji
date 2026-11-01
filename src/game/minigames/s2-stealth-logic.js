/**
 * Season 2, Mission 04 «ظل الأخت»: following her sister across the home garden to the shed (pure rules;
 * s2-stealth.js draws it). Fiction written for the game.
 *
 * Her sister walks ahead with the blank card and her pencil notes. Her rhythm is a fixed script, the same every
 * time (learnable, never random): she walks, stops, and before every look back there is a TELL (she slows, sways,
 * her eyes slide back). Then she LOOKS: a glance cone reaches `range` behind her. Anji is safe from a look only
 * when she is hidden (crouched, still) inside a cover, or out of the cone's reach. Position matters both ways: too
 * close and her sister hears her; too far while she walks and Anji loses her. At the shed her sister goes in and
 * hides her notes, glancing out of the window now and then; Anji must watch from under the window.
 *
 * Being seen (or heard, or losing her) is never a penalty: a short playful confrontation, then a restart from the
 * last cover Anji was hiding in when a look ended — her sister rewound to that same moment.
 */

export const STEALTH = {
  length: 1560, // the shed door
  start: 40, // Anji, at the corner of the house
  sisterStart: 250,
  anjiSpeed: 140,
  sisterSpeed: 64,
  range: 520, // a look reaches this far behind her
  near: 64, // closer than this, she hears Anji's steps
  lose: 600, // farther than this while she walks: Anji has lost her
  peekFrom: 1260, // from inside the shed, a glance out of the window reaches this far back
  watchNeed: 1.2, // seconds Anji must watch through the window while her sister is busy inside
  reactTime: 1.7, // the confrontation, before the restart
};

/** Places to hide, as stretches of the path (world units). */
export const COVERS = [
  { id: 'corner', x1: 0, x2: 80, label: 'زاوية البيت' },
  { id: 'pots', x1: 300, x2: 350, label: 'السنادين' },
  { id: 'line', x1: 560, x2: 690, label: 'حبل الغسيل' },
  { id: 'bench', x1: 880, x2: 940, label: 'المصطبة' },
  { id: 'bush', x1: 1130, x2: 1190, label: 'الشجيرة' },
  { id: 'window', x1: 1420, x2: 1480, label: 'تحت الشباك' },
];

/**
 * Her rhythm. `respect` (Anji let her be in M1) → `gentle`; `push` → `wary`: she looks back more often and
 * sooner, with a shorter tell — harder from the start, still learnable.
 *   ['walk', x]  walk on to x       ['pause', s]  stand (a slow sway; not looking)
 *   ['tell']     the warning        ['look', s]   looking back (the cone)
 *   ['relocate', s]  she takes her notes out of the flowerpot by the bench (her back to Anji)
 *   ['enter']    into the shed; then `inside` repeats: ['busy', s] hiding things · ['tell'] · ['peek', s]
 */
export const RHYTHMS = {
  gentle: {
    tell: 0.9,
    script: [
      ['walk', 470], ['pause', 0.6], ['tell'], ['look', 1.4],
      ['walk', 760], ['tell'], ['look', 1.6],
      ['walk', 960], ['relocate', 1.8], ['tell'], ['look', 1.3],
      ['walk', 1250], ['pause', 0.5], ['tell'], ['look', 1.8],
      ['walk', 1560], ['enter'],
    ],
    inside: [['busy', 3.0], ['tell'], ['peek', 1.2]],
  },
  wary: {
    tell: 0.7,
    script: [
      ['walk', 440], ['tell'], ['look', 1.6],
      ['walk', 620], ['tell'], ['look', 1.0],
      ['walk', 700], ['tell'], ['look', 1.5],
      ['walk', 960], ['relocate', 1.6], ['tell'], ['look', 1.6],
      ['walk', 1180], ['tell'], ['look', 1.2],
      ['walk', 1290], ['tell'], ['look', 1.5],
      ['walk', 1560], ['enter'],
    ],
    inside: [['busy', 2.6], ['tell'], ['peek', 1.4]],
  },
};

/** The cover Anji stands in (or null). */
export const coverAt = (x) => COVERS.find((c) => x >= c.x1 && x <= c.x2) || null;

/** The step her sister is on: { kind, to?, dur? }. */
export function stepOf(s) {
  const r = RHYTHMS[s.rhythm];
  const raw = s.sister.inside ? r.inside[s.sister.step % r.inside.length] : r.script[s.sister.step];
  if (!raw) return { kind: 'gone' };
  const [kind, v] = raw;
  if (kind === 'walk') return { kind, to: v };
  if (kind === 'tell') return { kind, dur: r.tell };
  if (kind === 'enter') return { kind, dur: 0 };
  return { kind, dur: v };
}
/** What she is doing, as the drawing and the HUD see it. */
export const phaseOf = (s) => stepOf(s).kind;
/** Whether her look is on right now (outside: looking back; inside: peeking out of the window). */
export const isLooking = (s) => ['look', 'peek'].includes(phaseOf(s));

const clone = (o) => JSON.parse(JSON.stringify(o));
const snapshot = (s) => ({ x: s.x, sister: clone(s.sister), watch: s.watch });

export function createStealth(rhythm = 'gentle') {
  if (!RHYTHMS[rhythm]) throw new Error(`Unknown rhythm ${rhythm}`);
  const s = {
    rhythm,
    x: STEALTH.start,
    hidden: true,
    moving: false,
    facing: 1,
    sister: { x: STEALTH.sisterStart, step: 0, t: 0, inside: false, facing: 1 },
    watch: 0,
    caught: 0,
    lost: 0,
    react: null, // { kind: 'seen'|'heard'|'lost', t, x, sx } while the confrontation plays
    done: false,
    time: 0,
    checkpoint: null,
  };
  s.checkpoint = snapshot(s);
  return s;
}

/** Seconds until her next look starts (0 while one is on) — what a careful player reads from her tell. */
export function untilLook(s) {
  if (isLooking(s)) return 0;
  const r = RHYTHMS[s.rhythm];
  let total = 0;
  let x = s.sister.x;
  let inside = s.sister.inside;
  let k = s.sister.step;
  let left = s.sister.t; // time already spent in the current step
  for (let i = 0; i < 60; i++) {
    const raw = inside ? r.inside[k % r.inside.length] : r.script[k];
    if (!raw) return Infinity;
    const [kind, v] = raw;
    if (kind === 'look' || kind === 'peek') return total;
    if (kind === 'enter') {
      inside = true;
      k = 0;
      continue;
    }
    if (kind === 'walk') {
      total += Math.abs(v - x) / STEALTH.sisterSpeed;
      x = v;
    } else total += (kind === 'tell' ? r.tell : v) - left;
    left = 0;
    k += 1;
  }
  return Infinity;
}

function advanceSister(s, dt) {
  const sis = s.sister;
  let left = dt;
  for (let guard = 0; left > 0 && guard < 8; guard++) {
    const st = stepOf(s);
    if (st.kind === 'gone') return;
    if (st.kind === 'walk') {
      sis.facing = 1;
      const d = st.to - sis.x;
      const need = Math.abs(d) / STEALTH.sisterSpeed;
      if (need > left) {
        sis.x += Math.sign(d) * STEALTH.sisterSpeed * left;
        return;
      }
      sis.x = st.to;
      left -= need;
      next(s);
      continue;
    }
    if (st.kind === 'enter') {
      sis.inside = true;
      sis.step = 0;
      sis.t = 0;
      continue;
    }
    sis.facing = st.kind === 'look' ? -1 : 1;
    if (sis.t + left < st.dur) {
      sis.t += left;
      return;
    }
    left -= st.dur - sis.t;
    const ended = st.kind;
    next(s);
    // a look that ends with Anji hidden in a cover: that cover is where a restart begins
    if ((ended === 'look' || ended === 'peek') && s.hidden && coverAt(s.x)) s.checkpoint = snapshot(s);
  }
}
function next(s) {
  s.sister.step += 1;
  s.sister.t = 0;
}

/**
 * One frame. `input`: { dir: -1 | 0 | 1 (held), hide: boolean (pressed this frame: crouch / stand) }.
 * Moving always gives the hiding place up. Returns events for sounds and drawing.
 */
export function stepStealth(s, dt, input = {}) {
  const ev = { caught: null, restart: false, done: false, checkpoint: false, tell: false, look: false };
  if (s.done) return ev;
  s.time += dt;
  if (s.react) {
    s.react.t += dt;
    if (s.react.t >= STEALTH.reactTime) {
      restart(s);
      ev.restart = true;
    }
    return ev;
  }
  const dir = Math.sign(input.dir || 0);
  if (input.hide) s.hidden = !s.hidden;
  s.moving = dir !== 0;
  if (s.moving) {
    s.hidden = false;
    s.facing = dir;
    s.x = Math.max(0, Math.min(STEALTH.length - 40, s.x + dir * STEALTH.anjiSpeed * dt));
  }

  const before = phaseOf(s);
  const cp = s.checkpoint;
  advanceSister(s, dt);
  const phase = phaseOf(s);
  if (phase !== before && phase === 'tell') ev.tell = true;
  if (phase !== before && (phase === 'look' || phase === 'peek')) ev.look = true;
  if (s.checkpoint !== cp) ev.checkpoint = true;

  const sis = s.sister;
  const safe = s.hidden && coverAt(s.x);
  let caught = null;
  if (!sis.inside) {
    const dist = sis.x - s.x;
    if (dist < STEALTH.near) caught = 'heard';
    else if (phase === 'look' && dist <= STEALTH.range && !safe) caught = 'seen';
    else if (phase === 'walk' && dist > STEALTH.lose) caught = 'lost';
  } else if (phase === 'peek' && s.x >= STEALTH.peekFrom && !safe) caught = 'seen';
  else if (phase === 'busy' && coverAt(s.x)?.id === 'window' && !s.moving) {
    s.watch += dt;
    if (s.watch >= STEALTH.watchNeed) {
      s.done = true;
      ev.done = true;
      return ev;
    }
  }
  if (caught) {
    s.react = { kind: caught, t: 0, x: s.x, sx: sis.x };
    if (caught === 'lost') s.lost += 1;
    else s.caught += 1;
    ev.caught = caught;
  }
  return ev;
}

/** Back to the last cover: Anji crouched there, her sister exactly where she was at that moment. */
export function restart(s) {
  const cp = s.checkpoint;
  s.x = cp.x;
  s.sister = clone(cp.sister);
  s.watch = cp.watch;
  s.hidden = true;
  s.moving = false;
  s.react = null;
}
