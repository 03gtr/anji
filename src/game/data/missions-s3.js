/**
 * Season 3 «أصداء الـV8» — its missions (gathered from the mission modules, data/s3/), and its returning-player
 * notice (ui/content-notice.js). Season 3's ids live in its own save (core/game.js routes every `s3` id).
 */
import { gather } from './s3/index.js';
import { PACK_S3, S3_OPEN } from './s3/constants.js';

export { PACK_S3, S3_OPEN };

/** The returning-player notice (once, after Season 2's finale). */
export const PACKS_S3 = [
  {
    id: PACK_S3,
    title: 'أصداء الـV8',
    unlock: S3_OPEN,
    scene: 's3-clinic',
    world: 's3-clinic',
    notice: 'أنجي، صبري بالعيادة من الصبح… ويعدّ شي على أصابعه 🩺',
  },
];

export const MISSIONS_S3 = gather('missions');
