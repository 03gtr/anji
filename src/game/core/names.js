/**
 * Names the player chooses (Story Pack 01: the white husky). A name is
 * stored as a string story flag, so it travels with saves, backups and
 * imports without a schema change. It is set once and never overwritten by
 * content updates; anything unusable falls back to the default name.
 */
export const HUSKY_FLAG = 'husky-name';
export const HUSKY_DEFAULT = 'ثلجة';
export const HUSKY_SUGGESTIONS = ['ثلجة', 'لولو', 'سما', 'بلّورة', 'ميرا'];
export const NAME_MAX = 14;

/**
 * Clean a typed name: Unicode letters (any script, with their marks) and
 * single spaces, 1–NAME_MAX characters. Control and direction-override
 * characters, digits, symbols and markup are refused, not silently kept.
 * @returns {string|null} the cleaned name, or null when it is not usable
 */
export function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!s || [...s].length > NAME_MAX) return null;
  return /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u.test(s) ? s : null;
}

/** The husky's saved name (or the default before she is named / if invalid). */
export const huskyName = (game) => cleanName(game.flag(HUSKY_FLAG)) ?? HUSKY_DEFAULT;

/** Fill name placeholders in story text: `{husky}`. */
export const fillNames = (text, game) => (typeof text === 'string' && text.includes('{') ? text.replaceAll('{husky}', huskyName(game)) : text);
