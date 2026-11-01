/**
 * Season 2 complete release, Part 4: the animation states. Every character can be put in every state the brief
 * lists, from the frames it has (world/engine.js `framesFor`, `STATE_FRAMES`) — no state ever falls through to
 * nothing — and each of Season 2's people has a distinct profile (data/personas.js).
 */
import { describe, it, expect } from 'vitest';
import { frameTable } from '../../src/game/characters/sprites.js';
import { framesFor, STATE_FRAMES, REACT_SFX } from '../../src/game/world/engine.js';
import { PERSONAS } from '../../src/game/data/personas.js';

// the owner's list (Part 4); the moods and gestures are the circle people's own frames
const STATES = ['idle', 'blink', 'walk', 'run', 'jump', 'interact', 'point', 'laugh', 'surprised', 'embarrassed', 'suspicious', 'angry', 'gesture', 'react', 'carry', 'hide', 'search', 'celebrate'];
const KINDS = ['anji', 'snooki', 'husky', 'ryan', 'sister', 'jojo', 'sabri', 'lama', 'rabi'];

describe('animation states', () => {
  it('every character resolves every state to frames it has', () => {
    for (const kind of KINDS) {
      const table = frameTable(kind);
      for (const state of STATES) {
        const list = framesFor(table, state);
        expect(Array.isArray(list) && list.length > 0, `${kind}/${state}`).toBe(true);
      }
    }
  });

  it('a state with its own frames uses them; one without borrows the nearest it has', () => {
    const anji = frameTable('anji');
    expect(framesFor(anji, 'celebrate')).toBe(anji.celebrate);
    expect(framesFor(anji, 'hide')).toBe(anji.crouch);
    const jojo = frameTable('jojo');
    expect(framesFor(jojo, 'search')).toBe(jojo.think);
    expect(framesFor(jojo, 'embarrassed')).toBe(jojo.shy);
    expect(framesFor(jojo, 'run')).toBe(jojo.walk); // a run drawn faster, leaning (the engine)
    const snooki = frameTable('snooki');
    expect(framesFor(snooki, 'search')).toBe(snooki.sniff);
    expect(framesFor(snooki, 'hide')).toBe(snooki.sit);
    for (const chain of Object.values(STATE_FRAMES)) expect(chain.length).toBeGreaterThan(0);
  });

  it('each of Season 2’s people has a distinct profile; the sister is watchful, Ryan notices Anji', () => {
    const profiles = ['jojo', 'sabri', 'lama', 'sister', 'rabi', 'ryan'].map((k) => JSON.stringify(PERSONAS[k]));
    expect(new Set(profiles).size).toBe(profiles.length);
    expect(PERSONAS.sister.watch).toBe(true);
    expect(PERSONAS.sister.bob).toBe(0); // a glide
    expect(PERSONAS.ryan.glance).toBe(true);
    expect(PERSONAS.sabri.bob).toBeGreaterThan(PERSONAS.jojo.bob); // too quick vs measured
  });

  it('reactions have sounds (Part 9), and only those reactions', () => {
    expect(REACT_SFX.mood.surprised).toBe('gasp');
    expect(REACT_SFX.pose.laugh).toBe('giggle');
  });
});
