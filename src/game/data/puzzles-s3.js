/**
 * Season 3 «أصداء الـV8» — its puzzles (gathered from the mission modules, data/s3/). Same rules as Season 2's:
 * strict — no hint, no "show the answer", no skip; a wrong try gets a neutral line that never names what is wrong
 * (puzzles/host.js STRICT_WRONG); what she placed stays placed.
 */
import { gather } from './s3/index.js';

export const PUZZLES_S3 = gather('puzzles');

for (const p of Object.values(PUZZLES_S3)) Object.assign(p, { strict: true, noSkip: true, noSolution: true });
