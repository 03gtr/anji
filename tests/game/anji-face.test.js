/**
 * Anji's face must not go through the SVG lighting filter: in browsers where
 * feDiffuseLighting yields no light, only the 40 % ambient term survives and
 * the face renders dark grey (owner report). The face keeps its own skin
 * gradient instead.
 */
import { describe, it, expect } from 'vitest';
import { anjiPortrait, anjiSprite, anjiFront, ANJI_EXPRESSIONS } from '../../src/game/characters/anji.js';

const faces = (svg) => {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  return [...doc.querySelectorAll('path')].filter((p) => (p.getAttribute('fill') || '').startsWith('url(#skin'));
};

describe("Anji's face is never inside a lighting filter", () => {
  it('dialogue portraits (every expression), the world sprite and the front view', () => {
    const svgs = [...ANJI_EXPRESSIONS.map((expr) => anjiPortrait({ expr })), anjiSprite({ pose: 'idle' }), anjiSprite({ pose: 'run', t: 0.3 }), anjiFront({})];
    for (const svg of svgs) {
      const found = faces(svg);
      expect(found.length).toBeGreaterThan(0);
      for (const f of found) expect(f.closest('[filter]')).toBeNull();
    }
  });
});
