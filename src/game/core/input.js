/**
 * Unified keyboard + on-screen touch input for real-time play.
 *
 * Scenes ask `down(action)` for held state and `take(action)` for a press that
 * should only fire once. Touch buttons use pointer capture, so sliding a thumb
 * off a button or the browser cancelling the touch always releases it — no
 * "stuck walking" state. Everything is released when the window loses focus.
 */
export const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
  KeyE: 'interact',
  Enter: 'interact',
  KeyF: 'interact',
  Escape: 'pause',
  KeyP: 'pause',
  KeyM: 'map',
  KeyJ: 'journal',
};

export function createInput({ target = globalThis.window, scope } = {}) {
  const held = new Map(); // action → set of sources (key codes / pointer ids)
  const pressed = new Set();
  let enabled = true;

  const press = (action, source) => {
    if (!held.has(action)) held.set(action, new Set());
    const set = held.get(action);
    if (set.size === 0) pressed.add(action);
    set.add(source);
  };
  const release = (action, source) => held.get(action)?.delete(source);
  const releaseAll = () => {
    held.clear();
    pressed.clear();
  };

  const isTyping = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '') || e.target?.isContentEditable;

  const onKeyDown = (e) => {
    const action = KEYMAP[e.code];
    if (!enabled || !action || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (!e.repeat) press(action, `key:${e.code}`);
  };
  const onKeyUp = (e) => {
    const action = KEYMAP[e.code];
    if (action) release(action, `key:${e.code}`);
  };

  const listen = (t, type, fn, opts) => {
    if (!t) return;
    if (scope) scope.on(t, type, fn, opts);
    else t.addEventListener(type, fn, opts);
  };
  listen(target, 'keydown', onKeyDown);
  listen(target, 'keyup', onKeyUp);
  listen(target, 'blur', releaseAll);

  return {
    down: (action) => enabled && (held.get(action)?.size ?? 0) > 0,
    /** true once per physical press */
    take(action) {
      if (!enabled || !pressed.has(action)) return false;
      pressed.delete(action);
      return true;
    },
    /** Drop presses nobody consumed this frame (call at the end of a frame). */
    endFrame() {
      pressed.clear();
    },
    setEnabled(v) {
      enabled = v;
      if (!v) releaseAll();
    },
    get enabled() {
      return enabled;
    },
    releaseAll,
    /** Make an element behave as a held button for `action`. */
    bindButton(el, action, bscope = scope) {
      const id = (e) => `ptr:${e.pointerId}`;
      const on = (type, fn, opts) => (bscope ? bscope.on(el, type, fn, opts) : el.addEventListener(type, fn, opts));
      // a held button never becomes a page gesture: with a thumb on «يمين», a second finger on
      // «قفزة» must not start a pinch/scroll that cancels the walk (browsers that ignore
      // `touch-action: none` on buttons). Pointer events still arrive; only the gesture is stopped.
      on('touchstart', (e) => e.cancelable && e.preventDefault(), { passive: false });
      on('pointerdown', (e) => {
        if (!enabled) return;
        e.preventDefault();
        el.setPointerCapture?.(e.pointerId);
        el.classList.add('is-down');
        press(action, id(e));
      });
      const up = (e) => {
        el.classList.remove('is-down');
        release(action, id(e));
      };
      on('pointerup', up);
      on('pointercancel', up);
      on('lostpointercapture', up);
      on('contextmenu', (e) => e.preventDefault());
    },
  };
}
