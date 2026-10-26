/**
 * Build-time generation of the offline service worker.
 *
 * Every file this build emits (HTML, JS chunks, CSS, fonts, images) plus the
 * files in public/ is listed in the worker's precache, so after one complete
 * visit the game runs with no network. The cache version is a hash of the
 * emitted content: any change produces a new cache, and the old one is removed
 * only after the new worker takes over.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SW_FILE = 'sw.js';
export const PRECACHE_MARKER = '/*__PRECACHE_LIST__*/';

/** Files that must never be precached. */
export function isPrecacheable(fileName) {
  return fileName !== SW_FILE && !fileName.endsWith('.map') && !fileName.startsWith('.');
}

/** Sorted, de-duplicated, forward-slash list of files to precache. */
export function precacheList(fileNames) {
  return [...new Set(fileNames.map((f) => f.replace(/\\/g, '/')).filter(isPrecacheable))].sort();
}

export function cacheVersion(entries) {
  const h = createHash('sha256');
  for (const [name, content] of [...entries].sort(([a], [b]) => (a < b ? -1 : 1))) {
    h.update(name);
    h.update('\0');
    h.update(content);
  }
  return h.digest('hex').slice(0, 12);
}

export function renderServiceWorker(list, version) {
  const template = readFileSync(join(HERE, 'sw-template.js'), 'utf8');
  return template
    .replace('__CACHE_VERSION__', JSON.stringify(version))
    .replace(PRECACHE_MARKER, `${PRECACHE_MARKER}${JSON.stringify(list)}`);
}

function listFiles(dir) {
  if (!dir || !existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(dir);
  return out.map((p) => ({ name: relative(dir, p).replace(/\\/g, '/'), content: readFileSync(p) }));
}

export function offlinePlugin() {
  let publicDir = null;
  return {
    name: 'secret-garden-offline',
    // after Vite's own HTML plugin, so the HTML pages are in the bundle
    enforce: 'post',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const entries = Object.values(bundle).map((f) => [f.fileName, f.type === 'chunk' ? f.code : f.source]);
      for (const f of listFiles(publicDir)) entries.push([f.name, f.content]);
      const list = precacheList(entries.map(([name]) => name));
      const version = cacheVersion(entries.filter(([name]) => isPrecacheable(name)));
      this.emitFile({ type: 'asset', fileName: SW_FILE, source: renderServiceWorker(list, version) });
    },
  };
}
