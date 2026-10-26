/**
 * «دويتو الحديقة» — a pattern (Simon-style) game. Pure rules.
 * Lanterns and flowers light up in a sequence that grows by one each round;
 * Anji and Snooki repeat it. A mistake simply replays the same round (no
 * game over), and by default there is no time limit at all.
 */
import { rng } from '../core/rng.js';

export const PADS = ['lantern', 'rose', 'moon', 'paw'];

export function createDuet(seed = 1, { length = 6 } = {}) {
  const r = rng(seed);
  const seq = Array.from({ length }, () => Math.floor(r() * PADS.length));
  return { seq, round: 1, input: [], mistakes: 0, done: false };
}

/** The pattern to show this round. */
export const shownPattern = (s) => s.seq.slice(0, s.round);

/** Press a pad. Returns 'ok' | 'round' (round cleared) | 'done' | 'miss'. */
export function pressPad(s, pad) {
  if (s.done) return 'noop';
  const want = s.seq[s.input.length];
  if (pad !== want) {
    s.mistakes += 1;
    s.input = [];
    return 'miss';
  }
  s.input.push(pad);
  if (s.input.length < s.round) return 'ok';
  s.input = [];
  if (s.round >= s.seq.length) {
    s.done = true;
    return 'done';
  }
  s.round += 1;
  return 'round';
}

export const duetMedal = (s) => (s.mistakes === 0 ? 'gold' : s.mistakes <= 2 ? 'silver' : 'bronze');
