/**
 * Optional sound: a few soft tones synthesised with the Web Audio API, so
 * there are no audio files to download. Off by default, only ever started
 * by her tapping the sound toggle, never autoplayed.
 */
const SONGS = {
  chime: [[880, 0, 0.18], [1318.5, 0.09, 0.28]],
  pop: [[659.3, 0, 0.09]],
  win: [[523.3, 0, 0.14], [659.3, 0.12, 0.14], [784, 0.24, 0.14], [1046.5, 0.36, 0.35]],
  soft: [[587.3, 0, 0.2], [880, 0.1, 0.3]],
};

export function createSound(store) {
  let ctx = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function play(name) {
    if (!store.get().sound) return;
    const ac = ensure();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t0 = ac.currentTime + 0.02;
    for (const [freq, at, dur] of SONGS[name] || []) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0 + at);
      gain.gain.linearRampToValueAtTime(0.12, t0 + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0 + at);
      osc.stop(t0 + at + dur + 0.05);
    }
  }

  return {
    play,
    enabled: () => store.get().sound,
    toggle() {
      const on = !store.get().sound;
      store.set({ sound: on });
      if (on) play('soft');
      return on;
    },
  };
}
