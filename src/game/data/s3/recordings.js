/**
 * Season 3 — the five recordings of Friday night (Mission 03, P-02), in the engine model's terms
 * (core/engine-voice.js). Times are compressed (a recording is seconds long); the marks are the clock times printed
 * under each strip. Fiction written for the game.
 *
 * What a careful eye reads in them (tests/game/s3-engine-voice.test.js checks each):
 * - the 21:40 pair (her gate, the camera) burble — Zefiro — with ONE blip, then off; the shutter comes after;
 * - the 23:10 pair are smooth and higher, revved again and again with tyre noise, AFTER the street-light click;
 * - the circulated clip is the loudest of all and the least clear: far from its engine (a phone against a wall).
 */
export const RECORDINGS = {
  clip: {
    engine: 'other',
    dur: 8,
    distance: 40,
    gain: 3.4,
    floor: 0.14,
    // (cut out of the 23:10 event: no anchor of its own, no time — only its engine tells)
    events: [{ at: -1, kind: 'start' }, { at: 2, kind: 'rev' }, { at: 3, kind: 'rev' }, { at: 4, kind: 'rev' }, { at: 5, kind: 'rev' }],
    marks: [],
  },
  cam1: {
    engine: 'zefiro',
    dur: 10,
    distance: 10,
    gain: 1,
    floor: 0.06,
    events: [{ at: 1, kind: 'start' }, { at: 4.5, kind: 'blip' }, { at: 6.5, kind: 'off' }, { at: 8, kind: 'shutter' }],
    marks: [[1, '٩:٤٠'], [8, '٩:٤٥']],
  },
  cam2: {
    engine: 'other',
    dur: 10,
    distance: 12,
    gain: 1,
    floor: 0.06,
    events: [{ at: -1, kind: 'start' }, { at: 1, kind: 'relay' }, { at: 6, kind: 'rev' }, { at: 6.8, kind: 'rev' }, { at: 7.6, kind: 'rev' }, { at: 8.4, kind: 'rev' }],
    marks: [[1, '١١:٠٠'], [6, '١١:١٠']],
  },
  gate: {
    engine: 'zefiro',
    dur: 8,
    distance: 4,
    gain: 1.1,
    floor: 0.04,
    events: [{ at: 0.5, kind: 'hinge' }, { at: 2, kind: 'start' }, { at: 4.5, kind: 'blip' }, { at: 6.3, kind: 'off' }],
    marks: [[2, '٩:٤٠']],
  },
  note: {
    engine: 'other',
    dur: 6,
    distance: 25,
    gain: 1.5,
    floor: 0.1,
    events: [{ at: -1, kind: 'start' }, { at: 1.5, kind: 'rev' }, { at: 2.3, kind: 'rev' }, { at: 3.1, kind: 'rev' }, { at: 3.9, kind: 'rev' }],
    marks: [[0.2, '١١:١١']],
  },
};
