/**
 * Season 2 never writes the original campaign's save (requirement B, owner-approved design).
 *
 * Every Season 2 id starts with `s2` (flags `s2:…`, missions `s2-…`, evidence `s2.ev.…`, journal `s2-…`,
 * scenes `s2-…`, dialogue `dlg:s2.…`, line pools `s2:…`), and `game` routes each id by that prefix to
 * Season 2's own document. Engine-made keys follow (a scene `s2-archive` gives `visited:s2-archive`,
 * `t.s2-archive.enter`, `it.s2-archive.box`). The main save (`snooki-game:save`, its backup and shadow),
 * the settings and the memories key stay byte-identical through any Season 2 operation. There is no
 * exception: the season opens from `game-complete`, which it only reads.
 */
import { describe, it, expect } from 'vitest';
import { createGame, isS2 } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store, S2_KEY } from '../../src/game/core/s2-store.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { check } from '../../src/game/core/conditions.js';
import { memoryStorage } from '../helpers.js';
import { JOURNAL, COLLECTIBLES, ITEMS, COSMETICS } from '../../src/game/data/items.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { WORLDS } from '../../src/game/data/worlds.js';

const T0 = 1_800_000_000_000;
function setup() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج', 'sp1-husky-met': true };
  main.journal = ['ending-hope'];
  main.location = { scene: 'final', x: 900 };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  storage.setItem('snooki-game:settings', JSON.stringify({ tips: false }));
  const saveManager = createSaveManager({ storage, now: () => T0 + 1 });
  const loaded = saveManager.load();
  const s2Store = createS2Store({ storage, now: () => T0 + 2 });
  const s2 = s2Store.load(loaded.state.createdAt);
  const game = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2.state, now: () => T0 + 3 });
  const snapshot = () => ['', ':backup', ':shadow'].map((k) => storage.getItem(SAVE_KEY + k)).concat(storage.getItem('snooki-game:settings'), storage.getItem('snooki-game:memories'));
  return { storage, game, snapshot };
}

describe('Season 2 ids are routed to their own document', () => {
  it('every Season 2 id kind routes to Season 2', () => {
    for (const id of ['s2:board', 's2:dec:accuse', 's2:rel:trust', 'mission:s2-01', 'mission-seen:s2-01', 's2.ev.e-wax', 's2-case-open', 'dlg:s2.01-enter', 'visited:s2-archive', 't.s2-archive.enter', 'it.s2-tree.lantern-3', 'pstage:s2-board', 'pdraft:s2-sort', 's2-sort', 's2:husky-ambient', 'notice:s2'])
      expect(isS2(id), id).toBe(true);
  });

  it('no id of the original game, its packs or the deep garden routes to Season 2', () => {
    const ids = [
      ...Object.keys(JOURNAL), ...Object.keys(COLLECTIBLES), ...Object.keys(ITEMS), ...Object.keys(COSMETICS), ...Object.keys(PUZZLES),
      ...MISSIONS.filter((m) => m.pack !== 's2').flatMap((m) => [`mission:${m.id}`, `mission-seen:${m.id}`]),
      ...Object.keys(SCENES).filter((s) => !s.startsWith('s2-')).flatMap((s) => [`visited:${s}`, `t.${s}.enter`, `it.${s}.x`]),
      ...Object.keys(DIALOGUE).filter((k) => !k.startsWith('s2.')).map((k) => `dlg:${k}`),
      ...WORLDS.filter((w) => w.region !== 's2').map((w) => w.id),
      'sp2-done', 'sp2-final-done', 'husky-ambient', 'game-complete', 'notice:sp2', 'pstage:sp2-ledger',
    ];
    expect(ids.length).toBeGreaterThan(300);
    expect(ids.filter((id) => isS2(id))).toEqual([]);
  });
});

describe('Season 2 operations leave the main save, settings and memories byte-identical', () => {
  it('each state operation, one by one', () => {
    const ops = [
      (g) => g.setFlag('s2:board', 2),
      (g) => g.setFlags(['s2:a', 's2:b']),
      (g) => g.setFlag('mission:s2-01'),
      (g) => g.setFlag('mission-seen:s2-02'),
      (g) => g.collect('s2.ev.e-register'),
      (g) => g.addJournal('s2-case-open'),
      (g) => g.markSeen('dlg:s2.01-enter'),
      (g) => g.markSeen('it.s2-archive.register'),
      (g) => g.setFlag('t.s2-archive.enter'),
      (g) => g.setFlag('visited:s2-archive'),
      (g) => g.recordResult('s2-compare', { completed: true }),
      (g) => g.nextLine('s2:husky-ambient', 6),
      (g) => g.setLocation('s2-archive', 140),
      (g) => g.addPlayTime(30000), // while she is in a Season 2 place
      (g) => g.save(), // the tab hiding
      (g) => applyEffects(['flag:s2:x', 'got:s2.ev.e-copy', 'journal:s2-tree', 'seen:dlg:s2.02-a'], g),
    ];
    for (const op of ops) {
      const t = setup();
      t.game.setLocation('s2-archive', 100); // she is in Season 2
      const before = t.snapshot();
      op(t.game);
      expect(t.snapshot(), op.toString()).toEqual(before);
      expect(t.storage.getItem(S2_KEY)).not.toBeNull();
    }
  });

  it('a scripted Season 2 session: the Season 1 state deep-equals its snapshot, and Season 2 has it all', () => {
    const t = setup();
    const main = structuredClone(t.game.state);
    const before = t.snapshot();
    t.game.setLocation('s2-archive', 100);
    for (let i = 1; i <= 11; i++) {
      t.game.setFlag(`mission:s2-${String(i).padStart(2, '0')}`);
      t.game.collect(`s2.ev.e-${i}`);
      t.game.addJournal(`s2-j${i}`);
      t.game.markSeen(`dlg:s2.${i}-enter`);
      t.game.setLocation(i % 2 ? 's2-tree' : 's2-archive', 100 + i);
      t.game.addPlayTime(30000);
    }
    t.game.save();
    expect(t.snapshot()).toEqual(before);
    expect(t.game.state).toEqual(main);
    const s2 = JSON.parse(t.storage.getItem(S2_KEY));
    expect(s2.flags['mission:s2-11']).toBe(true);
    expect(s2.collected).toHaveLength(11);
    expect(s2.playMs).toBe(11 * 30000);
    expect(s2.location.scene).toBe('s2-tree');
  });

  it('reads see both documents: conditions, journal, collected counts, location', () => {
    const t = setup();
    t.game.addJournal('s2-case-open');
    t.game.collect('s2.ev.e-wax');
    t.game.setLocation('s2-archive', 140);
    expect(check(['flag:game-complete', 'got:s2.ev.e-wax', '!flag:s2:nothing'], t.game)).toBe(true);
    expect(t.game.inJournal('s2-case-open')).toBe(true);
    expect(t.game.inJournal('ending-hope')).toBe(true);
    expect(t.game.journalIds()).toEqual(['ending-hope', 's2-case-open']);
    expect(t.game.countGroup('s2')).toBe(1);
    expect(t.game.location()).toEqual({ scene: 's2-archive', x: 140 });
    // back in the original game: its own location again, written to the main save
    t.game.setLocation('final', 900);
    expect(t.game.location()).toEqual({ scene: 'final', x: 900 });
    expect(JSON.parse(t.storage.getItem(SAVE_KEY)).location.scene).toBe('final');
  });

  it('Season 1 operations still go to the main save (and only there)', () => {
    const t = setup();
    const s2Before = t.storage.getItem(S2_KEY);
    t.game.setFlag('dg-box');
    t.game.addJournal('dg-night');
    expect(JSON.parse(t.storage.getItem(SAVE_KEY)).flags['dg-box']).toBe(true);
    expect(t.storage.getItem(S2_KEY)).toBe(s2Before);
  });

  it('a new game (in this build) starts Season 2 over too, keeping the old document aside', () => {
    const t = setup();
    t.game.setFlag('s2:board', 2);
    const old = t.storage.getItem(S2_KEY);
    t.game.replace(defaultState(T0 + 100));
    expect(t.game.flag('s2:board')).toBeUndefined();
    t.game.setFlag('s2:fresh');
    expect(t.storage.getItem(`${S2_KEY}:previous`)).toBe(old);
    expect(JSON.parse(t.storage.getItem(S2_KEY)).owner).toBe(T0 + 100);
  });
});
