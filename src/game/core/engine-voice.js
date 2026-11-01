/**
 * Season 3 «أصداء الـV8»: one engine model for what she hears and what she reads (docs/season-3/
 * PUZZLE_SPECIFICATIONS.md P-02). The same events drive the synthesised sound (core/audio.js) and the drawn
 * waveforms of Mission 03's recordings, so a clue is never audio-only: every audible difference has a drawn one.
 *
 * - Zefiro is a cross-plane V8: its firing is uneven, so its idle "burbles" — a pulse at half the firing rate
 *   (drawn as alternating tall and short strokes). The other engine idles smooth and higher.
 * - A blip is one rise and fall of the revs; hard revving is several, with tyre noise.
 * - Distance shows in the ratio of engine to ambience, not in loudness: a phone held against a wall far away is the
 *   loudest recording and the farthest one.
 * Pure (no DOM, no audio): tested in tests/game/s3-engine-voice.test.js.
 */

export const ENGINES = {
  zefiro: { idle: 760, burble: 0.62, pitch: 1 },
  other: { idle: 1180, burble: 0.04, pitch: 1.18 },
};

const bump = (t, at, width) => Math.exp(-(((t - at) / width) ** 2));

/** Is the engine running at time t (between its last start and its next off)? 0…1 with short ramps. */
function running(events, t) {
  let on = 0;
  for (const e of events) {
    if (e.at > t) break;
    if (e.kind === 'start') on = Math.min(1, (t - e.at) / 0.35);
    if (e.kind === 'off') on = Math.max(0, 1 - (t - e.at) / 0.6);
  }
  return on;
}

/** The revs at time t. */
export function rpmAt(engine, events, t) {
  let rpm = ENGINES[engine].idle;
  for (const e of events) {
    if (e.kind === 'start') rpm += 900 * bump(t, e.at + 0.25, 0.22); // the catch and settle
    if (e.kind === 'blip') rpm += 2600 * bump(t, e.at, 0.28);
    if (e.kind === 'rev') rpm += 3600 * bump(t, e.at, 0.2);
  }
  return rpm;
}

/** Everything that is not the engine, at time t (0…1): the street's hum, the bakery shutter, tyres, a click. */
function ambienceAt(events, t, floor) {
  let a = floor;
  let click = 0;
  for (const e of events) {
    if (e.kind === 'shutter' && t >= e.at && t < e.at + 2.4) a += 0.55;
    if (e.kind === 'rev') a += 0.6 * bump(t, e.at + 0.05, 0.22); // tyres
    if (e.kind === 'hinge' && t >= e.at && t < e.at + 0.35) a += 0.3;
    if (e.kind === 'relay' && Math.abs(t - e.at) < 0.04) click = 1;
  }
  return { a, click };
}

/**
 * A recording: { engine, events, dur (s), distance (m), gain (the microphone's), floor (the street's hum) }.
 * `frame(rec, t)` is what the microphone caught at t, split into its parts (what the drawing shows).
 */
export function frame(rec, t) {
  const on = rec.engine ? running(rec.events, t) : 0;
  const rpm = rec.engine ? rpmAt(rec.engine, rec.events, t) : 0;
  const near = 1 / (1 + rec.distance / 6);
  const engine = on * near * Math.min(1, 0.35 + rpm / 5200);
  const { a, click } = ambienceAt(rec.events, t, rec.floor ?? 0.08);
  return { engine: engine * rec.gain, ambience: a * rec.gain, click: click * rec.gain, rpm, on };
}

/**
 * The drawn waveform: n columns. Each column's stroke height is the engine (Zefiro's burble makes every other
 * stroke shorter), on top of the ambience band; a click is a thin full-height spike.
 */
export function strokes(rec, n = 120) {
  const out = [];
  const burble = rec.engine ? ENGINES[rec.engine].burble : 0;
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) / n) * rec.dur;
    const f = frame(rec, t);
    const engine = f.engine * (i % 2 ? 1 - burble * 0.7 : 1);
    // a click is shorter than a column: mark the column whose span holds it
    const [t0, t1] = [(i / n) * rec.dur, ((i + 1) / n) * rec.dur];
    const click = rec.events.some((e) => e.kind === 'relay' && e.at >= t0 && e.at < t1);
    out.push({ engine, ambience: f.ambience, click });
  }
  return out;
}

/** Peak level (the number a level meter shows): the loudness trap's measure. */
export const peak = (rec, n = 240) => Math.max(...strokes(rec, n).map((s) => s.engine + s.ambience));
/** Engine against ambience: the distance measure (higher = closer). */
export function clarity(rec, n = 240) {
  const s = strokes(rec, n);
  const e = s.reduce((x, k) => x + k.engine, 0);
  const a = s.reduce((x, k) => x + k.ambience, 0);
  return e / Math.max(a, 1e-6);
}

/**
 * Sound samples for the same recording (core/audio.js plays them). A V8 fires four times a revolution; the
 * burble is a half-order modulation of that pulse train. Deterministic noise (a seeded generator).
 */
export function render(rec, rate = 22050) {
  const len = Math.max(1, Math.floor(rec.dur * rate));
  const out = new Float32Array(len);
  const burble = rec.engine ? ENGINES[rec.engine].burble : 0;
  const pitch = rec.engine ? ENGINES[rec.engine].pitch : 1;
  let phase = 0;
  let seed = 7;
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / rate;
    const f = frame(rec, t);
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const n = seed / 0x3fffffff - 1;
    lp += 0.08 * (n - lp); // a dull, low noise
    let s = 0;
    if (f.on > 0) {
      const fire = ((f.rpm / 60) * 4 * pitch) / 2; // the firing rate, an octave down (a deep voice)
      phase += fire / rate;
      const pulse = Math.max(0, Math.sin(2 * Math.PI * phase)) ** 3;
      const half = 1 - burble * (0.5 + 0.5 * Math.sin(Math.PI * phase));
      s += f.engine * (pulse * half * 1.4 + 0.25 * Math.sin(2 * Math.PI * phase * 0.5)) + f.engine * 0.3 * lp;
    }
    s += f.ambience * 0.5 * lp + f.click * (i % 2 ? 0.8 : -0.8);
    out[i] = Math.max(-1, Math.min(1, s * 0.6));
  }
  return out;
}

/** The sounds of Mission 02's street (played by core/audio.js by name). */
export const SOUNDS = {
  'v8-start': { engine: 'zefiro', dur: 2.6, distance: 3, gain: 1, floor: 0.02, events: [{ at: 0.1, kind: 'start' }] },
  'v8-idle': { engine: 'zefiro', dur: 2.4, distance: 3, gain: 1, floor: 0.02, events: [{ at: -1, kind: 'start' }] },
  'v8-blip': { engine: 'zefiro', dur: 2.2, distance: 3, gain: 1, floor: 0.02, events: [{ at: -1, kind: 'start' }, { at: 0.5, kind: 'blip' }] },
  'v8-off': { engine: 'zefiro', dur: 1.6, distance: 3, gain: 1, floor: 0.02, events: [{ at: -1, kind: 'start' }, { at: 0.4, kind: 'off' }] },
  'v8-other': {
    engine: 'other',
    dur: 3,
    distance: 8,
    gain: 0.9,
    floor: 0.03,
    events: [{ at: -1, kind: 'start' }, { at: 0.5, kind: 'rev' }, { at: 1.1, kind: 'rev' }, { at: 1.7, kind: 'rev' }],
  },
  shutter: { engine: null, dur: 2.6, distance: 0, gain: 0.7, floor: 0, events: [{ at: 0.1, kind: 'shutter' }] },
  relay: { engine: null, dur: 0.3, distance: 0, gain: 1, floor: 0, events: [{ at: 0.05, kind: 'relay' }] },
};
