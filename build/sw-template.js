/* Secret Garden: Snooki & the Missing Creator — offline service worker.
 * Generated at build time by build/offline-plugin.js. Do not edit dist/sw.js.
 *
 * - install: downloads every file of this build into a versioned cache and
 *   reports genuine progress to open pages;
 * - activate: deletes only older caches of this game;
 * - fetch: serves from the cache first, so the game works with no network.
 * A new version waits until the page asks it to take over (see sw-client.js).
 */
const VERSION = __CACHE_VERSION__;
const PRECACHE = /*__PRECACHE_LIST__*/;
const PREFIX = 'snooki-game-';
const CACHE = `${PREFIX}${VERSION}`;
const BASE = new URL('./', self.location).href;

async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of clients) client.postMessage(message);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const total = PRECACHE.length;
      let done = 0;
      for (const path of PRECACHE) {
        const url = new URL(path, BASE).href;
        if (!(await cache.match(url, { ignoreVary: true }))) {
          const response = await fetch(url, { cache: 'reload' });
          if (!response.ok) throw new Error(`precache failed for ${path}: ${response.status}`);
          await cache.put(url, response);
        }
        done += 1;
        broadcast({ type: 'precache-progress', done, total, version: VERSION });
      }
      broadcast({ type: 'precache-complete', total, version: VERSION });
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skip-waiting') self.skipWaiting();
  if (event.data?.type === 'version?') event.source?.postMessage({ type: 'version', version: VERSION, total: PRECACHE.length });
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(BASE)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (request.mode === 'navigate') {
        // A directory URL (…/anji/) is the cached index.html; ignore ?query.
        const page = url.pathname.endsWith('/') ? new URL('index.html', url).href : url.origin + url.pathname;
        const hit = await cache.match(page, { ignoreSearch: true, ignoreVary: true });
        if (hit) return hit;
        try {
          return await fetch(request);
        } catch {
          return (await cache.match(new URL('index.html', BASE).href, { ignoreVary: true })) || new Response('Offline', { status: 503 });
        }
      }
      // ignoreVary: module scripts are requested in CORS mode (with an Origin
      // header) while the precache fetched them without one
      const hit = await cache.match(request.url, { ignoreSearch: true, ignoreVary: true });
      if (hit) return hit;
      try {
        return await fetch(request);
      } catch {
        return new Response('', { status: 504, statusText: 'Offline and not cached' });
      }
    })(),
  );
});
