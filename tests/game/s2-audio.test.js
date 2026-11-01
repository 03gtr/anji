/**
 * Season 2 complete release, Part 9: original, synthesised sound for the living world (core/audio.js).
 * - every sound the game names exists and plays without error (a stand-in Web Audio context);
 * - nothing is downloaded: no sound uses a file;
 * - sound off (the setting) means silence: no audio context is even created;
 * - the engine's reactions name only sounds that exist.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAudio } from '../../src/game/core/audio.js';
import { REACT_SFX } from '../../src/game/world/engine.js';

/** A Web Audio stand-in that records what is made. */
function fakeAudioContext() {
  const made = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
  const node = (kind) => {
    const n = { kind, frequency: param(), gain: param(), Q: param(), type: '', buffer: null, connect: (x) => x ?? n, start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() };
    made.push(n);
    return n;
  };
  class AC {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.state = 'running';
      this.destination = node('destination');
    }
    createOscillator() { return node('osc'); }
    createGain() { return node('gain'); }
    createBiquadFilter() { return node('filter'); }
    createBufferSource() { return node('buffer'); }
    createBuffer(ch, len) { const data = new Float32Array(len); return { getChannelData: () => data }; }
    resume() { return Promise.resolve(); }
  }
  return { AC, made };
}
const settings = (over = {}) => {
  const s = { sound: true, volume: 0.8, music: false, ...over };
  return { get: () => s, subscribe: () => () => {} };
};
afterEach(() => vi.unstubAllGlobals());

const NAMES = ['tap', 'pickup', 'success', 'fail', 'jump', 'page', 'sparkle', 'bark', 'boing', 'footstep', 'run', 'land', 'paper', 'printer', 'lantern', 'gasp', 'oops', 'giggle', 'click'];

describe('Season 2 sounds', () => {
  it('every sound plays (synthesised: oscillators, filters and noise — no file)', () => {
    const { AC, made } = fakeAudioContext();
    vi.stubGlobal('AudioContext', AC);
    const audio = createAudio(settings());
    for (const name of NAMES) {
      const before = made.length;
      expect(() => audio.play(name), name).not.toThrow();
      expect(made.length, `${name} made sound nodes`).toBeGreaterThan(before);
    }
  });

  it('sound off: silence, and no audio context is created at all', () => {
    const create = vi.fn();
    vi.stubGlobal('AudioContext', class { constructor() { create(); } });
    const audio = createAudio(settings({ sound: false }));
    for (const name of NAMES) audio.play(name);
    expect(create).not.toHaveBeenCalled();
  });

  it('no Web Audio (an old browser): every sound is a silent no-op', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    const audio = createAudio(settings());
    for (const name of NAMES) expect(() => audio.play(name)).not.toThrow();
  });

  it('the reactions the engine plays are all real sounds', () => {
    const { AC, made } = fakeAudioContext();
    vi.stubGlobal('AudioContext', AC);
    const audio = createAudio(settings());
    for (const table of Object.values(REACT_SFX)) {
      for (const name of Object.values(table)) {
        const before = made.length;
        audio.play(name);
        expect(made.length, name).toBeGreaterThan(before);
      }
    }
  });
});
