/** In-memory stand-in for localStorage. */
export function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    dump: () => Object.fromEntries(data),
  };
}

/** Deterministic pseudo-random sequence. */
export const seq = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};
