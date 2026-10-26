/**
 * Owner-supplied painted artwork (optional, never committed).
 *
 * Files placed in /private-art/*.webp (git-ignored) are used by the dev
 * server and by `npm run build:private` (title screen, cinematics, chapter
 * cards, the finale drawing). A normal `npm run build` contains none of them
 * (see art/private-sources.js) and the game falls back to its own art.
 * NOTE: a build:private output contains those images — never deploy it
 * unless the owner explicitly agrees.
 */
import { PRIVATE_ART as files } from '@private-sources';

export const PAINTED = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace(/\.webp$/, ''), url]),
);

export const painted = (name) => (name && PAINTED[name]) || null;
export const hasPaintedArt = () => Object.keys(PAINTED).length > 0;
