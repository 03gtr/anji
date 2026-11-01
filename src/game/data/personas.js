/**
 * How each person moves when nobody is telling them what to do (world/engine.js): their walk, their
 * small habits while standing about, and whether their face is drawn from the front (so a talking
 * mouth can move on it). Data only — the same few drawn gestures, different people.
 *
 *  bob     how much the walk bounces (units); none: a glide
 *  habits  a gesture now and then (every few seconds, never during a story beat): { pose, ms }
 *  front   the face is drawn from the front (Season 2's people)
 *  watch   standing still with nobody to face, a glance over the shoulder now and then (watchful)
 *  glance  standing still, a look toward Anji now and then (he notices her)
 */
export const PERSONAS = {
  // Uncle Jojo: measured; checks the time, thinks with his hand on his chin
  jojo: { front: true, bob: 1.2, habits: [{ pose: 'think', ms: 1500 }, { pose: 'point', ms: 900 }] },
  // Sabri: too quick, can't keep still
  sabri: { front: true, bob: 3.4, habits: [{ pose: 'shrug', ms: 800 }, { pose: 'laugh', ms: 900 }, { pose: 'handsup', ms: 600 }] },
  // Lama: steady; arms crossed, counting things
  lama: { front: true, bob: 1.6, habits: [{ pose: 'cross', ms: 1600 }, { pose: 'think', ms: 1200 }] },
  // her sister: a glide (and her slow sway, `idleFx`), arms folded, a knowing tilt
  sister: { front: true, bob: 0, watch: true, habits: [{ pose: 'cross', ms: 1800 }, { pose: 'lean', ms: 900 }] },
  // Rabi': polite, a little stiff
  rabi: { front: true, bob: 1.4, habits: [{ pose: 'think', ms: 1300 }] },
  // Marius (Season 3): an easy, unhurried stride; arms crossed when something amuses him; a shrug, never a fuss
  marius: { front: true, bob: 1.8, habits: [{ pose: 'cross', ms: 1700 }, { pose: 'shrug', ms: 800 }] },
  // Jalal (Season 3, fiction): restless — a hand to the neck, a shrug that comes too fast
  jalal: { front: true, bob: 2.2, habits: [{ pose: 'shrug', ms: 700 }, { pose: 'think', ms: 1100 }] },
  // Ryan: calm and observant — he keeps an eye on her; quietly sure of himself (a small nod), patient
  ryan: { bob: 1, glance: true },
  // Anji and the dogs keep their own drawn animations
  anji: { bob: 1.2 },
};
