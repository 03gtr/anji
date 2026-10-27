// Private-asset audit for a build in dist/ (runs after every `npm run build`).
// Fails if any owner image from private-art/ or the private memories file made
// it into the public build — by file name, by content hash, or by being listed
// in the service worker's precache.
//   node scripts/audit-private.mjs            (public build: must be clean)
//   node scripts/audit-private.mjs --report   (just list what a build contains)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const reportOnly = process.argv.includes('--report');
if (!existsSync(dist)) {
  console.error('audit-private: no dist/ — build first');
  process.exit(1);
}

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const files = walk(dist);

const privateDir = join(root, 'private-art');
const privateFiles = existsSync(privateDir) ? readdirSync(privateDir).map((f) => join(privateDir, f)) : [];
const privateNames = privateFiles.map((f) => basename(f, extname(f)));
const privateHashes = new Set(privateFiles.map((f) => sha(readFileSync(f))));
const memoriesFile = join(root, 'private', 'memories.json');

const findings = [];
for (const f of files) {
  const name = basename(f);
  const buf = readFileSync(f);
  if (privateHashes.has(sha(buf))) findings.push(`same bytes as a private image: ${name}`);
  if (privateNames.some((p) => name.startsWith(`${p}-`) || name.startsWith(`${p}.`))) findings.push(`private file name: ${name}`);
  if (/\.(js|html|json)$/.test(name)) {
    const text = buf.toString('utf8');
    if (text.includes('/private-art/') || text.includes('private-art/')) findings.push(`reference to private-art in ${name}`);
    if (existsSync(memoriesFile)) {
      const mem = JSON.parse(readFileSync(memoriesFile, 'utf8'));
      for (const m of mem.memories || []) if (m.scene && m.scene.length > 12 && text.includes(m.scene)) findings.push(`private memory text in ${name}`);
    }
  }
}

console.log(`audit-private: ${files.length} files in dist/, ${privateFiles.length} private images checked`);
if (findings.length) {
  for (const f of findings) console.log(`  ✗ ${f}`);
  if (!reportOnly) {
    console.error('audit-private: FAILED — this build contains private content. Do not publish it.');
    process.exit(1);
  }
} else console.log('audit-private: clean — no private art or memories in this build');
