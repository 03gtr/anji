import { describe, it, expect } from 'vitest';
import { createStore } from '../src/store.js';
import { memoryStorage } from './helpers.js';

describe('store', () => {
  it('starts empty and records discoveries once', () => {
    const storage = memoryStorage();
    const s = createStore({ storage, key: 'k' });
    expect(s.get().found).toEqual([]);
    expect(s.discover('roses')).toBe(true);
    expect(s.discover('roses')).toBe(false);
    expect(s.has('roses')).toBe(true);
    expect(JSON.parse(storage.dump().k).found).toEqual(['roses']);
  });

  it('restores saved progress', () => {
    const storage = memoryStorage({ k: JSON.stringify({ welcomed: true, found: ['star-1'], sound: true }) });
    const s = createStore({ storage, key: 'k' });
    expect(s.get()).toMatchObject({ welcomed: true, found: ['star-1'], sound: true, guideMin: false });
  });

  it('ignores corrupted data', () => {
    const s = createStore({ storage: memoryStorage({ k: '{not json' }), key: 'k' });
    expect(s.get().found).toEqual([]);
    const t = createStore({ storage: memoryStorage({ k: JSON.stringify({ found: [1, 'a', null] }) }), key: 'k' });
    expect(t.get().found).toEqual(['a']);
  });

  it('keeps working when storage throws', () => {
    const broken = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('quota');
      },
    };
    const s = createStore({ storage: broken, key: 'k' });
    expect(s.discover('bunny')).toBe(true);
    expect(s.has('bunny')).toBe(true);
  });

  it('reset clears progress but keeps the sound preference', () => {
    const s = createStore({ storage: memoryStorage(), key: 'k' });
    s.set({ sound: true, welcomed: true });
    s.discover('roses');
    s.reset();
    expect(s.get()).toMatchObject({ welcomed: false, found: [], sound: true });
  });
});
