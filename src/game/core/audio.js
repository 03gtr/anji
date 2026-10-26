/**
 * Audio, synthesised with the Web Audio API so nothing has to be downloaded.
 * Owner-supplied files can be added later through `registerSample`.
 *
 * - The context is created on the first user gesture (autoplay rules).
 * - Missing Web Audio, a muted setting or a locked context are all silent
 *   no-ops: audio is never required to play.
 * - Ambience/music beds are owned by the scene that started them and are
 *   stopped when that scene ends (stopBed) or the tab is hidden.
 */
const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);

const SFX = {
  tap: [[76, 0, 0.05, 'triangle', 0.25]],
  pickup: [[84, 0, 0.08], [91, 0.06, 0.14]],
  success: [[72, 0, 0.12], [76, 0.1, 0.12], [79, 0.2, 0.12], [84, 0.3, 0.32]],
  fail: [[60, 0, 0.14, 'triangle'], [55, 0.12, 0.28, 'triangle']],
  gate: [[48, 0, 0.9, 'sine', 0.5], [55, 0.08, 0.9, 'sine', 0.4], [60, 0.16, 1.1, 'sine', 0.35]],
  whoosh: [[96, 0, 0.18, 'sine', 0.12]],
  bark: 'bark',
  jump: [[67, 0, 0.07, 'triangle', 0.18], [74, 0.04, 0.08, 'triangle', 0.14]],
  step: [[40, 0, 0.03, 'triangle', 0.08]],
  page: [[79, 0, 0.06, 'sine', 0.12]],
  sparkle: [[96, 0, 0.1, 'sine', 0.15], [100, 0.07, 0.12, 'sine', 0.12], [103, 0.14, 0.16, 'sine', 0.1]],
  boing: 'boing',
  hit: [[43, 0, 0.12, 'square', 0.12]],
};

// Gentle pentatonic phrases for the optional music bed.
const THEMES = {
  garden: [62, 69, 74, 76, 74, 69, 66, 69],
  mystery: [57, 60, 64, 62, 60, 57, 55, 57],
  warm: [65, 69, 72, 77, 76, 72, 69, 72],
  race: [64, 67, 71, 74, 71, 67, 69, 71],
};

export function createAudio(settings) {
  let ctx = null;
  let master = null;
  let bed = null; // { stop() }
  const samples = new Map();

  function ensure() {
    if (ctx) return ctx;
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
      applyVolume();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function applyVolume() {
    if (!master) return;
    const s = settings.get();
    master.gain.value = s.sound ? s.volume : 0;
  }
  settings.subscribe?.(() => {
    applyVolume();
    if (!settings.get().music || !settings.get().sound) stopBed();
  });

  const ready = () => {
    const s = settings.get();
    if (!s.sound) return null;
    const ac = ensure();
    if (!ac) return null;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  };

  function tone(ac, midi, at, dur, type = 'sine', vol = 0.22, dest = master) {
    const t0 = ac.currentTime + at;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = NOTE(midi);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function bark(ac) {
    // a short "woof": pitched-down chirp through a low-pass filter
    const t0 = ac.currentTime;
    for (const [at, f0] of [[0, 520], [0.16, 470]]) {
      const osc = ac.createOscillator();
      const filter = ac.createBiquadFilter();
      const g = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, t0 + at);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.45, t0 + at + 0.12);
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(0.28, t0 + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.13);
      osc.connect(filter).connect(g).connect(master);
      osc.start(t0 + at);
      osc.stop(t0 + at + 0.16);
    }
  }

  function boing(ac) {
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(620, t0 + 0.18);
    g.gain.setValueAtTime(0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.32);
  }

  function play(name) {
    const ac = ready();
    if (!ac) return;
    if (samples.has(name)) return playSample(ac, samples.get(name));
    const def = SFX[name];
    if (def === 'bark') return bark(ac);
    if (def === 'boing') return boing(ac);
    for (const [m, at, dur, type, vol] of def || []) tone(ac, m, at, dur, type, vol);
  }

  function playSample(ac, buffer) {
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.connect(master);
    src.start();
  }

  /** Soft wind noise + a slow melodic phrase. Returns nothing; owned until stopBed(). */
  function startBed(theme = 'garden') {
    stopBed();
    const s = settings.get();
    const ac = ready();
    if (!ac || !s.music) return;
    const out = ac.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(1, ac.currentTime + 1.5);
    out.connect(master);

    // wind: filtered noise
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const ng = ac.createGain();
    ng.gain.value = 0.025;
    noise.connect(lp).connect(ng).connect(out);
    noise.start();

    const phrase = THEMES[theme] || THEMES.garden;
    let i = 0;
    const timer = setInterval(() => {
      if (ac.state !== 'running') return;
      tone(ac, phrase[i % phrase.length], 0, 1.6, 'sine', 0.05, out);
      if (i % 4 === 0) tone(ac, phrase[i % phrase.length] - 12, 0, 2.6, 'sine', 0.035, out);
      i += 1;
    }, 900);

    bed = {
      stop() {
        clearInterval(timer);
        const t = ac.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(out.gain.value, t);
        out.gain.linearRampToValueAtTime(0, t + 0.4);
        setTimeout(() => {
          try {
            noise.stop();
          } catch {
            /* already stopped */
          }
          out.disconnect();
        }, 450);
      },
    };
  }

  function stopBed() {
    bed?.stop();
    bed = null;
  }

  return {
    play,
    startBed,
    stopBed,
    get bedPlaying() {
      return Boolean(bed);
    },
    /** Called from the first user gesture so later sounds are allowed. */
    unlock() {
      ready();
    },
    suspend() {
      stopBed();
      ctx?.suspend?.().catch(() => {});
    },
    resume() {
      if (settings.get().sound) ctx?.resume?.().catch(() => {});
    },
    /** Owner-supplied audio: an ArrayBuffer of a local, licensed file. */
    async registerSample(name, arrayBuffer) {
      const ac = ensure();
      if (!ac) return false;
      try {
        samples.set(name, await ac.decodeAudioData(arrayBuffer));
        return true;
      } catch {
        return false;
      }
    },
    vibrate(pattern = 30) {
      if (settings.get().vibration) globalThis.navigator?.vibrate?.(pattern);
    },
  };
}
