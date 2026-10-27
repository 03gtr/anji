// Writes every public character asset (transparent SVG) and one sheet per
// character into docs/art/, from the same generators the game uses.
//   npm run art:export
// Private owner images are never touched.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTER_ASSETS } from '../src/game/art/manifest.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const byChar = new Map();
for (const a of CHARACTER_ASSETS) {
  const svg = a.render();
  const out = resolve(root, a.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${svg.trim()}\n`);
  if (!byChar.has(a.character)) byChar.set(a.character, []);
  byChar.get(a.character).push({ a, svg });
}

// one sheet per character: a grid of labelled cells on a midnight background
for (const [name, items] of byChar) {
  const cols = 6;
  const cw = 170;
  const ch = 230;
  const rows = Math.ceil(items.length / cols);
  const cells = items
    .map(({ a, svg }, i) => {
      const x = (i % cols) * cw;
      const y = Math.floor(i / cols) * ch;
      const inner = svg.replace(/^<svg /, `<svg x="${x + 10}" y="${y + 8}" width="${cw - 20}" height="${ch - 40}" `);
      const label = a.pose || a.expression || a.view;
      return `<rect x="${x + 4}" y="${y + 4}" width="${cw - 8}" height="${ch - 8}" rx="12" fill="#23286a"/>${inner}<text x="${x + cw / 2}" y="${y + ch - 14}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#fff7ec">${a.kind}: ${label}</text>`;
    })
    .join('\n');
  const sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * cw} ${rows * ch + 40}" width="${cols * cw}" height="${rows * ch + 40}">
<rect width="100%" height="100%" fill="#0d1038"/>
<text x="16" y="28" font-family="sans-serif" font-size="20" font-weight="700" fill="#ffd977">${name} — character sheet (generated, public-safe)</text>
<g transform="translate(0 40)">${cells}</g>
</svg>
`;
  const out = resolve(root, `docs/art/sheets/${name}.svg`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, sheet);
}
console.log(`exported ${CHARACTER_ASSETS.length} assets and ${byChar.size} sheets to docs/art/`);
