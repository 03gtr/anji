/** Speaker id → display name and portrait SVG (with the current cosmetics). */
import { anjiPortrait } from './anji.js';
import { snookiPortrait } from './snooki.js';
import { CAST } from './cast.js';

export const SPEAKERS = {
  anji: 'أنجي',
  snooki: 'سنوكي',
  narrator: '',
  ...Object.fromEntries(Object.entries(CAST).map(([k, v]) => [k, v.name])),
};

export function speakerName(id) {
  return SPEAKERS[id] ?? '';
}

export function portraitSvg(speaker, expr, cos = {}) {
  if (speaker === 'anji') return anjiPortrait({ expr: expr || 'neutral', outfit: cos.anjiOutfit, bow: cos.anjiBow });
  if (speaker === 'snooki') return snookiPortrait({ expr: expr || 'happy', hat: cos.snookiHat, collar: cos.snookiCollar });
  if (CAST[speaker]) return CAST[speaker].portrait({ expr });
  return '';
}

export const KNOWN_SPEAKERS = new Set(Object.keys(SPEAKERS));
