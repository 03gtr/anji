/**
 * After `vite build`: checks that dist/sw.js precaches exactly the files that
 * exist in dist/ (no missing file would break offline play, no stale entry
 * would make installation fail).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PRECACHE_MARKER, isPrecacheable } from '../build/offline-plugin.js';

const DIST = 'dist';
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
const start = sw.indexOf(PRECACHE_MARKER);
if (start < 0) throw new Error('dist/sw.js has no precache list');
const listText = sw.slice(start + PRECACHE_MARKER.length, sw.indexOf(';', start));
const listed = new Set(JSON.parse(listText));

const onDisk = [];
const walk = (d) => {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else onDisk.push(relative(DIST, p).replace(/\\/g, '/'));
  }
};
walk(DIST);
const files = new Set(onDisk.filter(isPrecacheable));

const missing = [...files].filter((f) => !listed.has(f));
const stale = [...listed].filter((f) => !files.has(f));
if (missing.length || stale.length) {
  console.error('Offline precache mismatch.');
  if (missing.length) console.error('  not precached:', missing);
  if (stale.length) console.error('  listed but missing from dist:', stale);
  process.exit(1);
}
console.log(`Offline precache OK: ${listed.size} files.`);
