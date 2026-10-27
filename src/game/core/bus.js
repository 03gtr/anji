/** Minimal synchronous event bus. `on` returns an unsubscribe function. */
export function createBus() {
  const handlers = new Map();
  return {
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
      return () => handlers.get(type)?.delete(fn);
    },
    emit(type, payload) {
      for (const fn of [...(handlers.get(type) || [])]) fn(payload);
    },
    count(type) {
      return handlers.get(type)?.size ?? 0;
    },
  };
}
