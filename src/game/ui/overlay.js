/**
 * Modal overlays (dialogue, puzzles, minigames, menus). One stack; each
 * overlay gets its own scope that is disposed when it closes, and focus
 * returns to where it was. While any overlay is open the bus announces
 * 'overlay' so real-time scenes can pause.
 */
import { createScope } from '../core/scope.js';
import { h } from './dom.js';

export function createOverlays(root, bus) {
  const stack = [];

  function open(build, { className = '', label = '', modal = true, dismissible = false } = {}) {
    return new Promise((resolve) => {
      const scope = createScope();
      const previousFocus = document.activeElement;
      const el = h(`<div class="overlay ${className}" ${modal ? 'role="dialog" aria-modal="true"' : ''}></div>`);
      if (label) el.setAttribute('aria-label', label);
      let closed = false;
      const close = (value) => {
        if (closed) return;
        closed = true;
        scope.dispose();
        el.remove();
        stack.splice(stack.indexOf(entry), 1);
        bus?.emit('overlay', { count: stack.length, kinds: stack.map((e) => e.kind) });
        if (previousFocus && previousFocus.isConnected) previousFocus.focus?.({ preventScroll: true });
        resolve(value);
      };
      const entry = { el, close, dismissible, kind: className };
      stack.push(entry);
      root.append(el);
      bus?.emit('overlay', { count: stack.length, kinds: stack.map((e) => e.kind) });
      if (dismissible) {
        scope.on(el, 'keydown', (e) => {
          if (e.key === 'Escape' && stack[stack.length - 1] === entry) {
            e.stopPropagation();
            close(undefined);
          }
        });
      }
      build(el, { close, scope });
      // focus the first sensible control
      queueMicrotask(() => {
        const f = el.querySelector('[data-autofocus]') || el.querySelector('button, [tabindex="0"]');
        f?.focus?.({ preventScroll: true });
      });
    });
  }

  return {
    open,
    get count() {
      return stack.length;
    },
    closeTop(value) {
      stack[stack.length - 1]?.close(value);
    },
    closeAll() {
      while (stack.length) stack[stack.length - 1].close(undefined);
    },
  };
}
