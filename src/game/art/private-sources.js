/**
 * Owner-supplied private content, bundled ONLY into the dev server and
 * `npm run build:private` (vite.config.js aliases `@private-sources` to this
 * file in those cases). A normal `npm run build` uses private-none.js, so a
 * public build can never contain the private art or memories by accident;
 * scripts/audit-private.mjs checks dist/ after every normal build.
 */
export const PRIVATE_ART = import.meta.glob('/private-art/*.webp', { eager: true, query: '?url', import: 'default' });
export const PRIVATE_MEMORIES = import.meta.glob('/private/memories.json', { eager: true, import: 'default' });
