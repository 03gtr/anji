/**
 * Season 2: how Ryan reacts when someone talks to Anji (docs/season-2/SEASON_2_CHARACTER_STATES.md §3).
 * Contextual, never a counter: what was said (its category), the scene's tone, whether it was
 * repeated, Anji's reply, and Ryan's trust stage (earned through story beats, never by soothing him).
 *
 * Invariants (tests/game/s2-social.test.js):
 *  - a greeting never draws a reaction; a professional exchange only sends him back to work;
 *  - "none" is always one of the possible reactions to anything else (sometimes he is not jealous);
 *  - no reaction is physical, threatening or controlling — the set below is all there is;
 *  - Anji's reply never costs progress; challenging or setting a boundary can draw an apology.
 * Within a cell the reaction rotates (game.nextLine), so the same moment never plays the same way twice in a row.
 */
export const CATEGORIES = ['greeting', 'professional', 'compliment', 'flirt', 'repeat'];
export const REPLIES = ['polite', 'subject', 'accept', 'tease-ryan', 'challenge-ryan', 'boundary'];
export const REACTIONS = ['none', 'focus', 'joke', 'pause', 'compete', 'cartoon', 'apologize'];

/** cat → trust stage (0–3) → the reactions possible there. */
const TABLE = {
  greeting: [['none'], ['none'], ['none'], ['none']],
  professional: [['focus'], ['focus'], ['focus'], ['focus']],
  compliment: [['none', 'joke', 'pause'], ['none', 'joke'], ['none', 'joke'], ['none']],
  flirt: [['joke', 'compete', 'pause', 'none'], ['joke', 'compete', 'none'], ['joke', 'none'], ['none', 'joke']],
  flirtSerious: [['pause', 'none'], ['pause', 'none'], ['none'], ['none']],
  repeat: [['cartoon', 'compete', 'none'], ['cartoon', 'joke', 'none'], ['joke', 'compete', 'none'], ['joke', 'none']],
};

/** The reactions possible for a moment (pure). */
export function possibleReactions({ cat, trust = 0, tone = 'light', reply = null }) {
  if (!CATEGORIES.includes(cat)) throw new Error(`Unknown social category ${cat}`);
  const stage = Math.max(0, Math.min(3, Math.floor(trust)));
  const row = cat === 'flirt' && tone === 'serious' ? TABLE.flirtSerious : TABLE[cat];
  const base = row[stage];
  // after she challenges him or sets a boundary he may apologize (once he trusts a little)
  if ((reply === 'challenge-ryan' || reply === 'boundary') && stage >= 1 && cat !== 'greeting' && cat !== 'professional') return [...base, 'apologize'];
  if (reply === 'tease-ryan' && cat !== 'greeting' && cat !== 'professional') return base.includes('joke') ? ['joke'] : base;
  return base;
}

/**
 * The reaction for this moment, rotating within its cell, and the dialogue key that plays it
 * (`s2.react.<cat>.<reaction>`; 'none' plays nothing).
 */
export function reaction(game, { cat, tone = 'light', reply: given = null, replyFrom = null }) {
  // her reply, when it was a choice she made just before (a decision: `s2:dec:<replyFrom>`)
  const reply = given ?? (replyFrom ? game.flag(`s2:dec:${replyFrom}`) ?? null : null);
  const trust = Number(game.flag('s2:rel:trust') ?? 0);
  const list = possibleReactions({ cat, trust, tone, reply });
  const pick = list.length > 1 ? list[game.nextLine(`s2:react:${cat}:${Math.min(3, trust)}:${tone}:${reply ?? '-'}`, list.length)] : list[0];
  return { reaction: pick, say: pick === 'none' ? null : `s2.react.${cat}.${pick}` };
}

/** Every dialogue key the table can ask for (content tests check each exists). */
export function reactionKeys() {
  const keys = new Set();
  for (const cat of CATEGORIES)
    for (const trust of [0, 1, 2, 3])
      for (const tone of ['light', 'serious'])
        for (const reply of [null, ...REPLIES]) for (const r of possibleReactions({ cat, trust, tone, reply })) if (r !== 'none') keys.add(`s2.react.${cat}.${r}`);
  return [...keys];
}
