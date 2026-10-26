import { describe, it, expect } from 'vitest';
import { precacheList, cacheVersion, renderServiceWorker, isPrecacheable, PRECACHE_MARKER } from '../../build/offline-plugin.js';

describe('offline precache manifest', () => {
  it('lists every build file once, sorted, without the worker or source maps', () => {
    expect(precacheList(['b.js', 'index.html', 'assets\\a.css', 'sw.js', 'b.js', 'x.js.map'])).toEqual(['assets/a.css', 'b.js', 'index.html']);
    expect(isPrecacheable('sw.js')).toBe(false);
  });

  it('cache version changes whenever any content changes, and only then', () => {
    const a = cacheVersion([['index.html', 'v1'], ['a.js', 'x']]);
    expect(cacheVersion([['a.js', 'x'], ['index.html', 'v1']])).toBe(a);
    expect(cacheVersion([['index.html', 'v2'], ['a.js', 'x']])).not.toBe(a);
  });

  it('renders a worker with the list and version embedded', () => {
    const sw = renderServiceWorker(['index.html', 'a.js'], 'abc123');
    expect(sw).toContain('const VERSION = "abc123"');
    expect(sw).toContain(`${PRECACHE_MARKER}["index.html","a.js"]`);
    expect(sw).toContain("addEventListener('fetch'");
    // only this game's older caches are ever deleted
    expect(sw).toMatch(/key\.startsWith\(PREFIX\) && key !== CACHE/);
  });
});
