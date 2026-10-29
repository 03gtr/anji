/**
 * Season 2's own save document (core/s2-store.js, localStorage `snooki-game:s2`).
 *
 * Why its own key (tests/game/s2-compat-baseline.test.js): every released build touches only its own
 * three save keys, so Season 2 progress kept apart cannot be reset or overwritten by an older tab,
 * a rolled-back release or an older build's "new game".
 *
 * Rules tested here: backup on every write; a corrupt document recovers from the backup; a document
 * from a NEWER build is read-only (never reset, never written); keys this build does not know are kept
 * (a later milestone's progress survives a rollback); the document belongs to one playthrough (the main
 * save's createdAt) — another playthrough's is moved to `:previous`, never deleted; a second tab that
 * wrote in between is never overwritten.
 */
import { describe, it, expect } from 'vitest';
import { createS2Store, s2DefaultState, normalizeS2, S2_KEY, S2_VERSION } from '../../src/game/core/s2-store.js';
import { memoryStorage } from '../helpers.js';

const OWNER = 1_800_000_000_000;
const store = (storage, now = () => OWNER + 5) => createS2Store({ storage, now });

describe('Season 2 save document', () => {
  it('starts empty for this playthrough, and saves and loads the same progress', () => {
    const storage = memoryStorage();
    const s = store(storage);
    const { state, status } = s.load(OWNER);
    expect(status).toBe('new');
    expect(state).toMatchObject({ v: S2_VERSION, owner: OWNER, flags: {}, collected: [], journal: [], seen: [] });
    state.flags['s2:board'] = 2;
    state.flags['mission:s2-01'] = true;
    state.collected.push('s2.ev.e-register');
    state.journal.push('s2-case-open');
    state.location = { scene: 's2-archive', x: 120 };
    expect(s.save(state).ok).toBe(true);
    const again = store(storage).load(OWNER);
    expect(again.status).toBe('loaded');
    expect(again.state.flags).toEqual({ 's2:board': 2, 'mission:s2-01': true });
    expect(again.state.collected).toEqual(['s2.ev.e-register']);
    expect(again.state.location).toEqual({ scene: 's2-archive', x: 120 });
  });

  it('keeps a backup and recovers from a corrupt document', () => {
    const storage = memoryStorage();
    const s = store(storage);
    const { state } = s.load(OWNER);
    state.flags.a = true;
    s.save(state);
    state.flags.b = true;
    s.save(state); // backup = {a}
    storage.setItem(S2_KEY, '{"broken":');
    const r = store(storage).load(OWNER);
    expect(r.status).toBe('recovered');
    expect(r.state.flags).toEqual({ a: true });
    expect(storage.getItem(`${S2_KEY}:broken`)).toBe('{"broken":');
  });

  it('a document from a NEWER build is read-only: nothing is reset, nothing is written', () => {
    const newer = JSON.stringify({ v: S2_VERSION + 1, owner: OWNER, rev: 9, flags: { 's2:future': true }, collected: ['s2.ev.x'] });
    const storage = memoryStorage({ [S2_KEY]: newer, [`${S2_KEY}:backup`]: newer });
    const s = store(storage);
    const r = s.load(OWNER);
    expect(r.status).toBe('future');
    expect(s.readOnly).toBe(true);
    expect(r.state.flags['s2:future']).toBe(true); // shown as it is
    r.state.flags['s2:x'] = true;
    expect(s.save(r.state)).toEqual({ ok: false, error: 'readonly' });
    expect(storage.getItem(S2_KEY)).toBe(newer);
    expect(storage.getItem(`${S2_KEY}:backup`)).toBe(newer);
    expect(storage.getItem(`${S2_KEY}:broken`)).toBeNull();
  });

  it('keeps keys this build does not know (a later milestone, then a rollback): written back unchanged', () => {
    const later = {
      v: S2_VERSION, owner: OWNER, rev: 4,
      flags: { 's2:board': 3, 'mission:s2-21': true, 's2:dec:accuse': 'wait', 's2:rel:trust': 2 },
      collected: ['s2.ev.e-loft'], journal: ['s2-loft'], seen: ['dlg:s2.21-enter'],
      records: { 's2-duo': { plays: 1, best: null, medal: null, completed: true } },
      milestone3: { anything: [1, 2] }, // a field a later build might add
    };
    const storage = memoryStorage({ [S2_KEY]: JSON.stringify(later) });
    const s = store(storage);
    const { state } = s.load(OWNER);
    state.flags['s2:here'] = true;
    expect(s.save(state).ok).toBe(true);
    const saved = JSON.parse(storage.getItem(S2_KEY));
    expect(saved.flags).toMatchObject(later.flags);
    expect(saved.collected).toEqual(['s2.ev.e-loft']);
    expect(saved.journal).toEqual(['s2-loft']);
    expect(saved.records['s2-duo']).toEqual(later.records['s2-duo']);
    expect(saved.milestone3).toEqual({ anything: [1, 2] });
  });

  it("another playthrough's document is moved to :previous on the first write — never deleted", () => {
    const old = JSON.stringify({ v: S2_VERSION, owner: OWNER - 999, rev: 3, flags: { 's2:old': true } });
    const storage = memoryStorage({ [S2_KEY]: old });
    const s = store(storage);
    const r = s.load(OWNER);
    expect(r.status).toBe('new');
    expect(r.state.flags).toEqual({});
    expect(storage.getItem(S2_KEY)).toBe(old); // loading writes nothing
    r.state.flags['s2:new'] = true;
    expect(s.save(r.state).ok).toBe(true);
    expect(storage.getItem(`${S2_KEY}:previous`)).toBe(old);
    expect(JSON.parse(storage.getItem(S2_KEY)).owner).toBe(OWNER);
  });

  it('a second tab that wrote in between is never overwritten: this one becomes read-only', () => {
    const storage = memoryStorage();
    const a = store(storage);
    const b = store(storage);
    const sa = a.load(OWNER).state;
    const sb = b.load(OWNER).state;
    sa.flags['s2:a'] = true;
    expect(a.save(sa).ok).toBe(true);
    sb.flags['s2:b'] = true;
    expect(b.save(sb)).toEqual({ ok: false, error: 'other-tab' });
    expect(b.readOnly).toBe(true);
    expect(JSON.parse(storage.getItem(S2_KEY)).flags).toEqual({ 's2:a': true });
    expect(a.save(sa).ok).toBe(true); // the tab that wrote last carries on
  });

  it('normalizes bad values without dropping good ones, and is bounded', () => {
    const n = normalizeS2({ v: 1, owner: OWNER, flags: { ok: true, bad: { x: 1 }, n: 3, s: 'x' }, collected: ['a', 'a', 7, 'b'], records: { r: 'nope' }, lines: { k: 2, j: -1 } }, OWNER);
    expect(n.flags).toEqual({ ok: true, n: 3, s: 'x' });
    expect(n.collected).toEqual(['a', 'b']);
    expect(n.records).toEqual({});
    expect(n.lines).toEqual({ k: 2 });
    expect(s2DefaultState(OWNER, 1).rev).toBe(0);
  });

  it('works without storage (nothing persists, nothing throws)', () => {
    const s = createS2Store({ storage: null });
    const { state } = s.load(OWNER);
    expect(s.save(state)).toEqual({ ok: false, error: 'unavailable' });
  });
});
