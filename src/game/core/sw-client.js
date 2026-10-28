/**
 * Service worker registration and offline status, for the UI.
 *
 * status: 'unsupported' | 'dev' | 'installing' | 'ready' | 'update' | 'error'
 * progress: { done, total } while installing (reported by the worker itself).
 * Updates never interrupt play: a new version waits until she chooses to
 * reload from the settings screen.
 */
export function createOfflineStatus({ enabled, swUrl = './sw.js' }) {
  const listeners = new Set();
  let info = { status: 'dev', done: 0, total: 0, version: null };
  let waiting = null;
  const set = (patch) => {
    info = { ...info, ...patch };
    listeners.forEach((fn) => fn(info));
  };

  async function start() {
    const sw = globalThis.navigator?.serviceWorker;
    if (!enabled) return set({ status: 'dev' });
    if (!sw) return set({ status: 'unsupported' });
    sw.addEventListener('message', (e) => {
      const m = e.data || {};
      // only the first install reports 'installing': a new version precaching in the background
      // (one already controls the page) must not turn 'ready' or 'update' back into it — its last
      // progress messages can arrive after it is already installed and waiting
      if (m.type === 'precache-progress') set(sw.controller ? { done: m.done, total: m.total } : { status: 'installing', done: m.done, total: m.total });
      if (m.type === 'precache-complete') set({ done: m.total, total: m.total });
      if (m.type === 'version') set({ version: m.version, total: m.total });
    });
    try {
      const reg = await sw.register(swUrl);
      const track = (worker) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') {
            if (sw.controller) {
              waiting = worker;
              set({ status: 'update' });
            } else set({ status: 'ready' });
          }
          if (worker.state === 'activated' && !sw.controller) set({ status: 'ready' });
          if (worker.state === 'redundant' && info.status === 'installing') set({ status: 'error' });
        });
      };
      if (reg.waiting && sw.controller) {
        waiting = reg.waiting;
        set({ status: 'update' });
      } else if (reg.active && !reg.installing) set({ status: 'ready' });
      else set({ status: 'installing' });
      track(reg.installing);
      reg.addEventListener('updatefound', () => track(reg.installing));
      if (reg.active) reg.active.postMessage({ type: 'version?' });
      // ask the browser to keep this storage (no prompt in most browsers)
      globalThis.navigator.storage?.persist?.().catch(() => {});
    } catch (err) {
      console.warn('[offline] service worker registration failed', err);
      set({ status: 'error' });
    }
  }

  return {
    start,
    get: () => info,
    subscribe(fn) {
      listeners.add(fn);
      fn(info);
      return () => listeners.delete(fn);
    },
    /** Switch to the waiting version and reload. */
    applyUpdate() {
      if (!waiting) return;
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      waiting.postMessage({ type: 'skip-waiting' });
    },
  };
}

export function offlineText(info) {
  switch (info.status) {
    case 'ready':
      return 'جاهزة للعب بدون إنترنت ✓';
    case 'installing':
      return info.total ? `دا تتحضّر للعب بدون إنترنت… ${info.done}/${info.total}` : 'دا تتحضّر للعب بدون إنترنت…';
    case 'update':
      return 'أكو نسخة جديدة جاهزة — من الإعدادات تقدرين تحدّثين';
    case 'unsupported':
      return 'هذا المتصفح ما يدعم اللعب بدون إنترنت';
    case 'error':
      return 'ما گدرنا نحضّر اللعب بدون إنترنت. جرّبي تفتحين اللعبة مرة ثانية وإنتي متصلة.';
    default:
      return 'وضع التطوير: اللعب بدون إنترنت يشتغل بالنسخة المبنية فقط';
  }
}
