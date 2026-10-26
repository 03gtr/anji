/**
 * Owner-supplied painted artwork (optional, never committed).
 *
 * Files placed in /private-art/*.webp (git-ignored) are bundled into a local
 * build and used for the title screen, cinematics and chapter cards. Without
 * them the game uses its own SVG illustrations, so a public build never needs
 * private images. NOTE: a build made WITH private art contains those images;
 * only deploy such a build if the owner explicitly agrees.
 */
const files = import.meta.glob('/private-art/*.webp', { eager: true, query: '?url', import: 'default' });

export const PAINTED = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace(/\.webp$/, ''), url]),
);

export const painted = (name) => (name && PAINTED[name]) || null;
export const hasPaintedArt = () => Object.keys(PAINTED).length > 0;
