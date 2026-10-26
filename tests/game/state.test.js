import { describe, it, expect, vi } from 'vitest';
import { createGame, groupOf } from '../../src/game/core/game.js';
import { createSaveManager } from '../../src/game/core/save.js';
import { createBus } from '../../src/game/core/bus.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { applyEffects, isValidEffect } from '../../src/game/core/effects.js';
import { createScope } from '../../src/game/core/scope.js';
import { createSettings, sanitizeSettings } from '../../src/game/core/settings.js';
import { memoryStorage } from '../helpers.js';
import { ACHIEVEMENTS, syncAchievements } from '../../src/game/progression/achievements.js';
import { COSMETICS } from '../../src/game/data/items.js';

const make = () => {
  const storage = memoryStorage();
  const bus = createBus();
  const saves = createSaveManager({ storage, key: 'k' });
  return { game: createGame({ saveManager: saves, bus }), storage, bus, saves };
};

describe('game state', () => {
  it('saves after every change and announces it', () => {
    const { game, saves, bus } = make();
    const seen = vi.fn();
    bus.on('change', seen);
    game.setFlag('met-snooki');
    expect(saves.load().state.flags['met-snooki']).toBe(true);
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ kind: 'flag', id: 'met-snooki' }));
  });

  it('collects each collectible once (no duplicate entries)', () => {
    const { game } = make();
    expect(game.collect('star.garden.1')).toBe(true);
    expect(game.collect('star.garden.1')).toBe(false);
    expect(game.state.collected).toEqual(['star.garden.1']);
    expect(game.countGroup('star')).toBe(1);
    expect(groupOf('note.ryan.2')).toBe('note');
  });

  it('inventory never goes negative', () => {
    const { game } = make();
    game.addItem('treat', 2);
    expect(game.removeItem('treat', 3)).toBe(false);
    expect(game.itemCount('treat')).toBe(2);
    expect(game.removeItem('treat', 2)).toBe(true);
    expect(game.hasItem('treat')).toBe(false);
    expect(game.state.inventory).toEqual({});
  });

  it('keeps the best score and best medal', () => {
    const { game } = make();
    expect(game.recordResult('game:maze', { completed: true, score: 60, medal: 'bronze', lowerIsBetter: true })).toEqual({ newBest: false, firstClear: true });
    expect(game.recordResult('game:maze', { completed: true, score: 44, medal: 'gold', lowerIsBetter: true })).toEqual({ newBest: true, firstClear: false });
    game.recordResult('game:maze', { completed: true, score: 50, medal: 'silver', lowerIsBetter: true });
    game.recordResult('game:maze', { completed: false });
    expect(game.record('game:maze')).toEqual({ plays: 4, best: 44, medal: 'gold', completed: true });
  });

  it('emits save-error once when saving fails', () => {
    const bus = createBus();
    const err = vi.fn();
    bus.on('save-error', err);
    const game = createGame({ saveManager: { save: () => ({ ok: false, error: 'quota' }) }, bus });
    game.setFlag('a');
    game.setFlag('b');
    expect(err).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalledWith('quota');
  });
});

describe('conditions', () => {
  const { game } = make();
  game.setFlag('a');
  game.addItem('map-1');
  game.collect('star.x.1');
  game.collect('star.x.2');
  game.markSeen('cine:opening');
  game.recordResult('game:maze', { completed: true, medal: 'silver' });

  it.each([
    [undefined, true],
    ['flag:a', true],
    ['flag:b', false],
    ['!flag:b', true],
    ['item:map-1', true],
    ['got:star.x.1', true],
    ['seen:cine:opening', true],
    ['record:maze', false],
    ['record:game:maze', true],
    ['medal:game:maze:silver', true],
    ['medal:game:maze:gold', false],
    ['count:star>=2', true],
    ['count:star>2', false],
    [['flag:a', 'item:map-1'], true],
    [['flag:a', 'flag:b'], false],
    [{ any: ['flag:b', 'flag:a'] }, true],
    [{ not: 'flag:a' }, false],
  ])('%j → %s', (cond, expected) => {
    expect(check(cond, game)).toBe(expected);
  });

  it('rejects unknown condition kinds loudly', () => {
    expect(() => check('mood:happy', game)).toThrow();
  });

  it('lists atoms for content validation', () => {
    expect(atoms(['flag:a', { any: ['!item:b', { not: 'got:c' }] }])).toEqual(['flag:a', 'item:b', 'got:c']);
  });
});

describe('effects', () => {
  it('applies data effects and reports what changed', () => {
    const { game } = make();
    const changes = applyEffects(['flag:x', 'item:map-1', 'got:star.a.1', 'journal:snooki', 'unlock:bow-gold'], game);
    expect(game.flag('x')).toBe(true);
    expect(changes.map((c) => c.kind)).toEqual(['item', 'collect', 'journal', 'unlock']);
    // repeating does not re-announce collectibles / journal / unlocks
    expect(applyEffects(['got:star.a.1', 'journal:snooki', 'unlock:bow-gold'], game)).toEqual([]);
    applyEffects(['!flag:x', '-item:map-1'], game);
    expect(game.flag('x')).toBeUndefined();
    expect(game.hasItem('map-1')).toBe(false);
  });

  it('validates effect strings', () => {
    expect(isValidEffect('flag:a')).toBe(true);
    expect(isValidEffect('-item:a')).toBe(true);
    expect(isValidEffect('dance:a')).toBe(false);
    expect(() => applyEffects(['dance:a'], make().game)).toThrow();
  });
});

describe('scope (lifecycle)', () => {
  it('releases listeners, timers and child scopes on dispose', () => {
    vi.useFakeTimers();
    const scope = createScope();
    const target = new EventTarget();
    const onEvent = vi.fn();
    const onTimer = vi.fn();
    scope.on(target, 'ping', onEvent);
    scope.timeout(onTimer, 100);
    const child = scope.child();
    const childCleanup = vi.fn();
    child.add(childCleanup);
    scope.dispose();
    target.dispatchEvent(new Event('ping'));
    vi.advanceTimersByTime(200);
    expect(onEvent).not.toHaveBeenCalled();
    expect(onTimer).not.toHaveBeenCalled();
    expect(childCleanup).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('settings', () => {
  it('sanitises and persists preferences', () => {
    expect(sanitizeSettings({ volume: 4, textSpeed: 'ludicrous', sound: 'yes' })).toMatchObject({ volume: 1, textSpeed: 'normal', sound: true });
    const storage = memoryStorage();
    const s = createSettings({ storage, key: 's' });
    s.set({ textSpeed: 'fast', motion: 'reduce' });
    expect(createSettings({ storage, key: 's' }).get()).toMatchObject({ textSpeed: 'fast', motion: 'reduce' });
    expect(s.reducedMotion()).toBe(true);
    expect(s.charDelay()).toBe(10);
  });

  it('follows the system reduced-motion setting by default', () => {
    const s = createSettings({ storage: memoryStorage(), key: 's', systemReducedMotion: () => true });
    expect(s.reducedMotion()).toBe(true);
    s.set({ motion: 'full' });
    expect(s.reducedMotion()).toBe(false);
  });
});

describe('achievements', () => {
  it('have unique ids, valid rewards, and nothing is earned on a new game', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) {
      if (a.reward) {
        expect(isValidEffect(a.reward)).toBe(true);
        expect(COSMETICS[a.reward.split(':')[1]], a.id).toBeTruthy();
      }
    }
    const { game } = make();
    game.totalOf = () => 99;
    expect(syncAchievements(game)).toEqual([]);
  });

  it('are earned once when their condition becomes true, with their reward', () => {
    const { game } = make();
    game.totalOf = () => 99;
    for (let i = 0; i < 10; i++) game.collect(`star.x.${i}`);
    game.setFlag('met-snooki');
    const first = syncAchievements(game).map((a) => a.id);
    expect(first).toEqual(expect.arrayContaining(['first-steps', 'stars-10']));
    expect(game.isUnlocked('bow-gold')).toBe(true);
    expect(syncAchievements(game)).toEqual([]);
  });
});
