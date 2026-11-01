/**
 * Season 2, Mission 02 «سنوكي ضايع» — the chase after Snooki (pure rules; drawing and input in s2-chase.js).
 *
 * Anji runs on her own (one finger: tap to jump, a second control to slide), her husky at her heels, and
 * Snooki ahead with her case notebook in his mouth. Three legs, each its own place: the archive path, the
 * lantern tree, the shed roof. Each leg has:
 *  - low things to jump (books, roots, roof vents) — a hit only makes her stumble;
 *  - overhead things to slide under (a hanging sign, a low branch with its lanterns, a washing line);
 *  - pits (a ditch, the stream, the gap between two roofs): a fall sends her back to the leg's last
 *    checkpoint — never further back, and nothing she found is lost;
 *  - a fork: a springboard lifts her to a high route (a wall top, a long branch, the roof ridge). It is
 *    harder (gaps that drop her back to the low route) and has an optional find on it; the low route is
 *    easier and finds nothing. Both reach the end.
 * Snooki is never random: what he does follows from where she is (stepDog):
 *  - run     keeps a teasing distance ahead of her;
 *  - tease   when she falls behind (a stumble, a fall) he stops, looks back and wags until she is close;
 *  - dodge   when she gets too close he bursts ahead;
 *  - hide    at a cover (a barrel, a trunk, a chimney) he hides behind it, and waits;
 *  - innocent when she reaches his cover he sits and looks away, as if nothing happened — then dodges;
 *  - showoff at a big obstacle he does a show-off jump, then looks back to be admired;
 *  - escape  near the leg's end he is off and away: she has lost the trail (the story goes on from there).
 * Nothing here is timed against her: no clock, no score to beat; a slow run is as good as a fast one.
 */
export const RUN = {
  speed: 175, // her steady running speed (units/s)
  gravity: 1600,
  jump: 620, // apex ≈ 120: clears every low thing (≤ 44), never reaches a high route
  spring: 820, // from a springboard (apex ≈ 210): the only way up to a high route
  slide: 0.7, // seconds one slide lasts (≈ 122 units)
  stumble: 0.6,
  stumbleFactor: 0.45,
  standH: 78, // her body's height standing…
  slideH: 32, // …and sliding
  half: 12, // half her width
  fallTime: 0.85, // the fall into a pit, before she is back at the checkpoint
  buffer: 0.14, // a tap a moment early still jumps (touch screens)
  high: 128, // height of a high route (over every overhead thing of the low route)
};

/** Snooki's distances to her (units ahead of her). */
export const DOG = {
  gap: 120, // where he likes to be
  tease: 160, // further than this: he stops and waits for her (always on screen, even on a 300-unit phone view)
  resume: 110, // she is this close again: he runs on
  dodge: 64, // closer than this: he bursts ahead
  caught: 60, // she reached his cover: he acts innocent
  innocentTime: 0.8,
  hideTime: 3.2, // he gives up hiding when she does not come
  escapeFrom: 520, // this far from the end he is off for good
  hop: 520, // his own small jumps over things
  flip: 700, // the show-off jump
};

/* ── the three legs (hand-placed; the builder only adds up the distances) ── */
const low = (look, h = 34, w = 30) => ({ kind: 'low', look, h, w });
const pit = (look, w = 74) => ({ kind: 'pit', look, w });
const duck = (look, w = 44) => ({ kind: 'duck', look, w, y0: 50, y1: 104 });
const hide = (look) => ({ kind: 'hide', look });
const showoff = (look, h = 44) => ({ kind: 'low', look, h, w: 34, showoff: true });
const cp = () => ({ kind: 'cp' });
/**
 * A fork: a springboard, then a high route `len` long. `high` lists what is up there ([gap, item] from the
 * route's start: a low thing, or `{ kind: 'gap', w }` — a hole in the route that drops her to the low route),
 * and `find` is the optional thing up there ({ at, id }).
 */
const fork = (look, len, high, find) => ({ kind: 'fork', look, len, high, find });

/**
 * Build a leg from [distance from the previous thing, thing] pairs. Low things, pits and overhead things are
 * hazards; a fork places its springboard where it stands and its route just after.
 */
function leg(id, { title, theme, length, steps, finds }) {
  const out = { id, title, theme, length, checkpoints: [0], hazards: [], springs: [], platforms: [], highHazards: [], hides: [], finds: [] };
  let x = 0;
  for (const [dx, item] of steps) {
    x += dx;
    if (item.kind === 'cp') out.checkpoints.push(x);
    else if (item.kind === 'hide') out.hides.push({ x, look: item.look });
    else if (item.kind === 'fork') {
      out.springs.push({ x, w: 60, look: item.look });
      const x0 = x + 60;
      const x1 = x0 + item.len;
      // the route, cut by its gaps
      let from = x0;
      let at = x0;
      for (const [d, h] of item.high) {
        at += d;
        if (h.kind === 'gap') {
          out.platforms.push({ x0: from, x1: at - h.w / 2, y: RUN.high, look: item.look });
          from = at + h.w / 2;
        } else out.highHazards.push({ ...h, x: at, base: RUN.high });
      }
      out.platforms.push({ x0: from, x1, y: RUN.high, look: item.look });
      out.finds.push({ x: x0 + item.find.at, y: RUN.high + 34, id: item.find.id, label: finds[item.find.id] });
    } else out.hazards.push({ ...item, x, base: 0 });
  }
  out.length = length;
  return out;
}

export const LEGS = [
  leg('archive', {
    title: 'ممر الأرشيف',
    theme: 'meadow',
    length: 10900,
    finds: { ball: 'كرة سنوكي القديمة' },
    steps: [
      [420, low('books')],
      [300, low('crate', 40)],
      [300, pit('ditch', 70)],
      [250, hide('barrel')],
      [80, low('books')],
      [300, duck('sign')],
      [300, low('can', 30)],
      [300, pit('ditch', 76)],
      [320, showoff('cart')],
      [420, cp()],
      [380, fork('wall', 1260, [[230, low('pot', 30, 26)], [250, { kind: 'gap', w: 86 }], [240, low('pot', 30, 26)]], { at: 1010, id: 'ball' })],
      [300, low('books')], // (the low route, under the wall)
      [380, low('crate', 40)],
      [400, low('books')],
      [420, hide('cart')],
      [140, duck('sign')],
      [300, low('crate', 40)],
      [300, pit('ditch', 76)],
      [300, low('books')],
      [300, duck('line')],
      [320, cp()],
      [320, low('can', 30)],
      [300, pit('ditch', 80)],
      [260, hide('barrel')],
      [80, low('books')],
      [300, duck('sign')],
      [300, pit('ditch', 76)],
      [320, showoff('crate', 44)],
      [300, low('books')],
      [300, duck('line')],
      [300, pit('ditch', 84)],
      [300, low('can', 30)],
    ],
  }),
  leg('tree', {
    title: 'شجرة الفوانيس',
    theme: 'garden-night',
    length: 11900,
    finds: { bell: 'جرس {husky} الضايع' },
    steps: [
      [420, low('root', 28, 40)],
      [300, duck('branch', 52)],
      [300, pit('stream', 76)],
      [300, low('stand', 40, 24)],
      [260, hide('trunk')],
      [100, duck('branch', 52)],
      [300, low('root', 28, 40)],
      [300, pit('stream', 80)],
      [300, duck('branch', 52)],
      [320, showoff('stand', 44)],
      [400, cp()],
      [380, fork('branch', 1300, [[220, low('nest', 26, 26)], [240, { kind: 'gap', w: 90 }], [250, low('nest', 26, 26)], [220, { kind: 'gap', w: 80 }]], { at: 1080, id: 'bell' })],
      [320, duck('branch', 52)], // (the low route, under the branch)
      [400, low('root', 28, 40)],
      [400, duck('branch', 52)],
      [420, hide('stand')],
      [140, low('pot', 32, 28)],
      [300, pit('stream', 80)],
      [300, duck('branch', 52)],
      [300, low('root', 28, 40)],
      [340, cp()],
      [320, duck('branch', 52)],
      [300, pit('stream', 84)],
      [300, low('stand', 40, 24)],
      [260, hide('trunk')],
      [100, duck('branch', 52)],
      [300, pit('stream', 80)],
      [320, showoff('stand', 44)],
      [300, duck('branch', 52)],
      [300, low('root', 28, 40)],
      [300, pit('stream', 84)],
      [300, duck('branch', 52)],
    ],
  }),
  leg('roof', {
    title: 'سطح السقيفة',
    theme: 'meadow',
    length: 12700,
    finds: { glasses: 'نظارة صبري الشمسية' },
    steps: [
      [420, low('vent', 32, 28)],
      [300, pit('gap', 74)],
      [300, duck('wire', 48)],
      [300, low('tiles', 30, 36)],
      [260, hide('chimney')],
      [100, pit('gap', 80)],
      [300, duck('line', 48)],
      [300, low('vent', 32, 28)],
      [300, pit('gap', 80)],
      [320, showoff('chimney-pot', 44)],
      [400, cp()],
      [380, fork('ridge', 1320, [[220, low('vent', 30, 26)], [240, { kind: 'gap', w: 90 }], [240, low('tiles', 28, 30)], [230, { kind: 'gap', w: 86 }]], { at: 1110, id: 'glasses' })],
      [320, low('tiles', 30, 36)], // (the low route, under the ridge)
      [400, duck('line', 48)],
      [400, low('vent', 32, 28)],
      [420, hide('chimney')],
      [140, pit('gap', 80)],
      [300, duck('wire', 48)],
      [300, low('tiles', 30, 36)],
      [300, pit('gap', 84)],
      [340, cp()],
      [320, low('vent', 32, 28)],
      [300, duck('line', 48)],
      [300, pit('gap', 84)],
      [260, hide('chimney')],
      [100, low('tiles', 30, 36)],
      [300, pit('gap', 86)],
      [320, showoff('chimney-pot', 44)],
      [300, duck('wire', 48)],
      [300, pit('gap', 88)],
      [300, low('vent', 32, 28)],
      [300, duck('line', 48)],
    ],
  }),
];

/* ── her run ── */
/** A run of leg `c`, from checkpoint `cp` (an index: a leg left half-way resumes where she reached). */
export function createRun(c, { cp = 0 } = {}) {
  const k = Math.max(0, Math.min(c.checkpoints.length - 1, Number.isInteger(cp) ? cp : 0));
  const x = c.checkpoints[k];
  return {
    x,
    y: 0,
    vy: 0,
    support: 'ground', // 'ground' | a platform | null (in the air)
    slide: 0,
    stumble: 0,
    falling: 0,
    buffer: 0,
    cp: k,
    t: 0,
    stumbles: 0,
    falls: 0,
    hit: new Set(), // hazards already hit (each counts once per pass)
    found: new Set(),
    done: false,
    dog: { x: x + DOG.gap, y: 0, vy: 0, state: 'run', t: 0, flip: 0, used: new Set() },
  };
}

const overPit = (c, x) => c.hazards.some((h) => h.kind === 'pit' && Math.abs(x - h.x) < h.w / 2 - 6);
const springAt = (c, x) => c.springs.some((sp) => Math.abs(x - sp.x) <= sp.w / 2);
const platformUnder = (c, x) => c.platforms.find((p) => x >= p.x0 && x <= p.x1);
const bodyH = (s) => (s.slide > 0 ? RUN.slideH : RUN.standH);

/** Back to the leg's last checkpoint she passed (never further back); what she found stays found. */
function restart(c, s) {
  s.x = c.checkpoints[s.cp];
  s.y = 0;
  s.vy = 0;
  s.support = 'ground';
  s.slide = 0;
  s.stumble = 0;
  s.falling = 0;
  s.buffer = 0;
  for (const h of [...c.hazards, ...c.highHazards]) if (h.x > s.x) s.hit.delete(h);
  s.dog = { ...s.dog, x: s.x + DOG.gap + 40, y: 0, vy: 0, state: 'tease', t: 0, flip: 0, used: new Set([...s.dog.used].filter((x) => x < s.x)) };
}

/**
 * One step of her run.
 * @param input { jump?: boolean, slide?: boolean } — pressed this frame (every jump is full height: a quick tap is enough)
 * @returns events { jumped, spring, slid, hit, fell, restart, found, checkpoint, finished, dog }
 */
export function stepRun(c, s, dt, input = {}) {
  const ev = { jumped: false, spring: false, slid: false, hit: false, fell: false, restart: false, found: null, checkpoint: false, finished: false, dog: null };
  if (s.done) return ev;
  s.t += dt;
  if (s.falling > 0) {
    // down into the pit; then back to the checkpoint
    s.falling -= dt;
    s.vy -= RUN.gravity * dt;
    s.y = Math.max(-120, s.y + s.vy * dt);
    if (s.falling <= 0) {
      restart(c, s);
      ev.restart = true;
    }
    stepDog(c, s, dt, ev);
    return ev;
  }

  // what she pressed
  s.buffer = input.jump ? RUN.buffer : Math.max(0, s.buffer - dt);
  const grounded = s.support !== null;
  if (input.slide && grounded && s.slide <= 0) {
    s.slide = RUN.slide;
    ev.slid = true;
  }
  if (s.buffer > 0 && grounded) {
    const spring = s.support === 'ground' && springAt(c, s.x);
    s.vy = spring ? RUN.spring : RUN.jump;
    s.support = null;
    s.slide = 0;
    s.buffer = 0;
    ev.jumped = true;
    ev.spring = spring;
  }
  s.slide = Math.max(0, s.slide - dt);

  // across
  const factor = s.stumble > 0 ? RUN.stumbleFactor : 1;
  s.stumble = Math.max(0, s.stumble - dt);
  s.x += RUN.speed * factor * dt;

  // up and down: a high route holds her from above; the ground holds her unless she is over a pit
  if (s.support !== null && s.support !== 'ground') {
    if (s.x > s.support.x1 || s.x < s.support.x0) s.support = null; // off its end (or into one of its gaps)
  }
  if (s.support === null) {
    const prevY = s.y;
    s.vy -= RUN.gravity * dt;
    s.y += s.vy * dt;
    const p = platformUnder(c, s.x);
    if (p && s.vy <= 0 && prevY >= p.y && s.y <= p.y) {
      s.y = p.y;
      s.vy = 0;
      s.support = p;
    } else if (s.y <= 0) {
      if (overPit(c, s.x)) {
        s.falling = RUN.fallTime;
        s.falls += 1;
        ev.fell = true;
      } else {
        s.y = 0;
        s.vy = 0;
        s.support = 'ground';
      }
    }
  } else if (s.support === 'ground' && overPit(c, s.x)) {
    s.support = null;
    s.vy = 0;
    s.falling = RUN.fallTime;
    s.falls += 1;
    ev.fell = true;
  }

  // what she runs into (each thing once per pass)
  const H = bodyH(s);
  const across = (h) => s.x + RUN.half > h.x - h.w / 2 && s.x - RUN.half < h.x + h.w / 2;
  if (!s.falling) {
    for (const h of [...c.hazards, ...c.highHazards]) {
      if (h.kind === 'pit' || s.hit.has(h) || !across(h)) continue;
      const rel = s.y - h.base;
      const struck = h.kind === 'low' ? rel > -10 && rel < h.h - 4 : h.kind === 'duck' ? s.y < h.y1 && s.y + H > h.y0 : false;
      if (struck) {
        s.hit.add(h);
        s.stumble = RUN.stumble;
        s.stumbles += 1;
        ev.hit = true;
      }
    }
    for (const f of c.finds) {
      if (s.found.has(f.id)) continue;
      // only up on the high route (a jump from the low route never reaches it)
      if (Math.abs(s.x - f.x) < 24 && s.y >= RUN.high - 8 && s.y <= f.y + 10 && s.y + H >= f.y) {
        s.found.add(f.id);
        ev.found = f.id;
      }
    }
  }

  // checkpoints (a fall never takes her before the last one she passed)
  const k = c.checkpoints.reduce((n, x, i) => (s.x >= x ? i : n), 0);
  if (k > s.cp) {
    s.cp = k;
    ev.checkpoint = true;
  }
  if (s.x >= c.length) {
    s.done = true;
    ev.finished = true;
  }
  stepDog(c, s, dt, ev);
  return ev;
}

/* ── Snooki: what he does follows from where she is ── */
const setDog = (d, state, ev) => {
  if (d.state === state) return;
  d.state = state;
  d.t = 0;
  ev.dog = state;
};
const dogHop = (d, v) => {
  if (d.y <= 0) d.vy = v;
};

/** One step of Snooki (pure, deterministic): his state follows from the distance to her and the place. */
export function stepDog(c, s, dt, ev = {}) {
  const d = s.dog;
  d.t += dt;
  const gap = d.x - s.x;
  let speed = RUN.speed;
  if (d.state !== 'escape' && d.x >= c.length - DOG.escapeFrom) setDog(d, 'escape', ev);
  switch (d.state) {
    case 'run': {
      speed = RUN.speed + (DOG.gap - gap) * 0.6; // eases back to his distance (slowly: a stumble makes him stop and wait)
      if (gap > DOG.tease) setDog(d, 'tease', ev);
      else if (gap < DOG.dodge) setDog(d, 'dodge', ev);
      const cover = c.hides.find((h) => !d.used.has(h.x) && d.x >= h.x - 4 && d.x <= h.x + 30);
      if (cover && gap > DOG.dodge) {
        d.used.add(cover.x);
        d.x = cover.x;
        setDog(d, 'hide', ev);
        speed = 0;
      }
      const show = c.hazards.find((h) => h.showoff && !d.used.has(h.x) && h.x - d.x > 0 && h.x - d.x < 60);
      if (show && d.state === 'run' && d.y <= 0) {
        d.used.add(show.x);
        d.vy = DOG.flip;
        setDog(d, 'showoff', ev);
      }
      break;
    }
    case 'tease':
      speed = 0; // he stops, looks back at her and wags
      if (gap < DOG.resume && d.t > 0.4) {
        dogHop(d, DOG.hop * 0.6);
        setDog(d, 'run', ev);
      }
      break;
    case 'dodge':
      speed = RUN.speed * 1.9;
      if (gap > DOG.gap) setDog(d, 'run', ev);
      break;
    case 'hide':
      speed = 0; // behind his cover, peeking
      if (gap < DOG.caught) setDog(d, 'innocent', ev);
      else if (d.t > DOG.hideTime && gap < DOG.tease) setDog(d, 'run', ev);
      break;
    case 'innocent':
      speed = 0; // sits and looks away: nothing happened, nobody took any notebook
      if (d.t > DOG.innocentTime) setDog(d, 'dodge', ev);
      break;
    case 'showoff':
      speed = RUN.speed * 1.25;
      if (d.y <= 0 && d.vy <= 0 && d.t > 0.2) setDog(d, 'tease', ev); // landed: looks back to be admired
      break;
    case 'escape':
      speed = RUN.speed * 2.4;
      break;
    default:
      setDog(d, 'run', ev);
  }
  d.x += Math.max(0, speed) * dt;
  // his own little jumps over what is in his way (pits too); he runs under overhead things
  if (d.y <= 0 && d.state !== 'hide' && d.state !== 'innocent' && d.state !== 'tease') {
    const ahead = c.hazards.find((h) => (h.kind === 'low' || h.kind === 'pit') && !(d.state === 'run' && h.showoff && !d.used.has(h.x)) &&h.x - d.x > 0 && h.x - d.x < 34 + (h.w || 0) / 2);
    if (ahead) dogHop(d, DOG.hop);
  }
  if (d.y > 0 || d.vy > 0) {
    d.vy -= RUN.gravity * dt;
    d.y = Math.max(0, d.y + d.vy * dt);
    if (d.y === 0) d.vy = 0;
  }
  d.flip = d.state === 'showoff' ? Math.min(1, d.flip + dt * 1.8) : 0;
  return d;
}

/** The medal: no stumble and no fall → gold; a few stumbles and no fall → silver. */
export function runMedal(s) {
  if (s.stumbles === 0 && s.falls === 0) return 'gold';
  if (s.stumbles <= 2 && s.falls === 0) return 'silver';
  return 'bronze';
}

/**
 * What a good runner does now (tests, and the playtest bot): jump a low thing or a pit just before it, slide
 * under an overhead thing, and — if `high` — take the springboard and jump the gaps and things up there.
 */
export function goodInput(c, s, { high = false } = {}) {
  const onHigh = s.support && s.support !== 'ground';
  if (onHigh) {
    const h = c.highHazards.find((x) => x.x - s.x > 46 && x.x - s.x < 76);
    const edge = s.support.x1 - s.x;
    const more = c.platforms.some((p) => p !== s.support && p.x0 > s.support.x1 && p.x0 - s.support.x1 < 140);
    return { jump: Boolean(h) || (more && edge > 0 && edge < 26) };
  }
  if (high && s.support === 'ground' && c.springs.some((sp) => sp.x - s.x > -6 && sp.x - s.x < 14)) return { jump: true };
  const h = c.hazards.find((x) => x.x + x.w / 2 > s.x - RUN.half && x.x - s.x < 110);
  if (!h) return {};
  const d = h.x - s.x;
  if (h.kind === 'duck') return { slide: d < 70 && d > 42 && s.slide <= 0 };
  if (h.kind === 'pit') return { jump: d < h.w / 2 + 40 && d > h.w / 2 + 4 };
  return { jump: d < 76 && d > 46 };
}
