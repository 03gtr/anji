/**
 * A lifetime scope for a scene, overlay or minigame. Everything registered
 * through it (DOM listeners, timers, animation frames, bus subscriptions,
 * child scopes) is released by one dispose() call, so leaving a scene can
 * never leave a loop running or a listener attached.
 */
export function createScope() {
  const cleanups = [];
  let disposed = false;
  const add = (fn) => {
    if (disposed) fn();
    else cleanups.push(fn);
    return fn;
  };

  const scope = {
    get disposed() {
      return disposed;
    },
    add,
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      return add(() => target.removeEventListener(type, fn, opts));
    },
    sub(unsubscribe) {
      return add(unsubscribe);
    },
    timeout(fn, ms) {
      const id = setTimeout(() => {
        if (!disposed) fn();
      }, ms);
      add(() => clearTimeout(id));
      return id;
    },
    interval(fn, ms) {
      const id = setInterval(fn, ms);
      add(() => clearInterval(id));
      return id;
    },
    wait(ms) {
      return new Promise((resolve) => scope.timeout(resolve, ms));
    },
    /**
     * Run fn(dt, now) every animation frame until the scope is disposed or the
     * returned controller is stopped. dt is in seconds and capped, so a tab
     * that was in the background does not cause a huge jump.
     */
    loop(fn, { maxDt = 0.05 } = {}) {
      let raf = 0;
      let last = 0;
      let running = false;
      let errored = false;
      // Dev/test only: drive the loop with timers when animation frames are
      // throttled (e.g. an automated browser in a hidden pane).
      const timer = Boolean(globalThis.__timerLoop);
      const request = timer ? (cb) => setTimeout(() => cb(performance.now()), 16) : (cb) => requestAnimationFrame(cb);
      const cancel = timer ? (id) => clearTimeout(id) : (id) => cancelAnimationFrame(id);
      const frame = (t) => {
        if (!running || disposed) return;
        const dt = last ? Math.min((t - last) / 1000, maxDt) : 0;
        last = t;
        try {
          fn(dt, t);
        } catch (err) {
          // one bad frame must not freeze the game: report it and keep going
          if (!errored) console.error('[loop] frame failed', err);
          errored = true;
        }
        raf = request(frame);
      };
      const ctrl = {
        start() {
          if (running || disposed) return;
          running = true;
          last = 0;
          raf = request(frame);
        },
        stop() {
          running = false;
          cancel(raf);
        },
        get running() {
          return running;
        },
      };
      add(() => ctrl.stop());
      return ctrl;
    },
    child() {
      const c = createScope();
      add(() => c.dispose());
      return c;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      while (cleanups.length) {
        try {
          cleanups.pop()();
        } catch (err) {
          console.error('[scope] cleanup failed', err);
        }
      }
    },
  };
  return scope;
}
