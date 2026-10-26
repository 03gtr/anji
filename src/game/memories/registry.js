/**
 * Which memories the corridor shows.
 *
 * Personal memories come from two private sources, never from this
 * repository:
 *  1. private/memories.json at build time (git-ignored; a build made with it
 *     contains it — only deploy such a build if the owner agrees), or
 *  2. a memories file imported on the device from the settings screen
 *     (stored only in that browser).
 * Invalid entries are skipped and reported. When fewer than CORRIDOR_SLOTS
 * personal memories are enabled, story memories fill the remaining frames,
 * so the corridor is never empty or broken.
 */
import { validateMemory } from './schema.js';
import { STORY_MEMORIES } from './templates.js';
import { PRIVATE_MEMORIES } from '@private-sources';

export const CORRIDOR_SLOTS = 6;
export const LOCAL_KEY = 'snooki-game:memories';

const built = PRIVATE_MEMORIES; // empty in public builds (art/private-sources.js)
const BUILD_MEMORIES = Object.values(built)[0];

function readLocal(storage) {
  try {
    const ls = storage ?? globalThis.localStorage;
    const raw = ls?.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.memories)) return data.memories;
  return [];
}

/** @returns {{ memories: object[], skipped: { id: string, errors: string[] }[] }} */
export function loadPersonal({ storage, sources } = {}) {
  const lists = sources ?? [asList(BUILD_MEMORIES), asList(readLocal(storage))];
  const seen = new Set();
  const memories = [];
  const skipped = [];
  for (const m of lists.flat()) {
    const v = validateMemory({ kind: 'personal', ...m });
    if (!v.ok) {
      skipped.push({ id: m?.id ?? '?', errors: v.errors });
      continue;
    }
    // drafts stay in the owner's file and never appear in normal play
    if (m.enabled !== true || m.status === 'draft' || seen.has(m.id)) continue;
    seen.add(m.id);
    memories.push({ kind: 'personal', ...m });
  }
  return { memories, skipped };
}

/**
 * Owner memories that dress a game object (e.g. the picnic basket's slots):
 * `object: 'picnic:sweet'`. Only enabled, non-draft personal memories; when
 * there are none, the object keeps its fictional placeholder.
 */
export function objectMemories(prefix, opts = {}) {
  return loadPersonal(opts).memories.filter((m) => typeof m.object === 'string' && m.object.startsWith(`${prefix}:`));
}

/** A puzzle definition with its slot labels taken from owner memories (if any). */
export function withMemoryLabels(def, prefix, opts = {}) {
  const mems = objectMemories(prefix, opts);
  if (!mems.length) return def;
  const bySlot = Object.fromEntries(mems.map((m) => [m.object.split(':')[1], m.title]));
  const pieces = def.config.pieces.map((p) => {
    const slot = def.config.slots.find((sl) => sl.accepts.includes(p.id));
    return slot && bySlot[slot.id] ? { ...p, label: bySlot[slot.id] } : p;
  });
  return { ...def, config: { ...def.config, pieces } };
}

/** The memories shown in the corridor frames, in order. */
export function corridorMemories(opts = {}) {
  const personal = loadPersonal(opts).memories;
  const story = STORY_MEMORIES.filter((m) => m.enabled !== false);
  return [...personal, ...story].slice(0, CORRIDOR_SLOTS);
}

/** Extra personal memories beyond the corridor (shown in the journal album). */
export function allMemories(opts = {}) {
  return [...loadPersonal(opts).memories, ...STORY_MEMORIES];
}

/**
 * Import a memories file on this device (settings screen).
 * @returns {{ ok: boolean, count?: number, skipped?: object[], error?: string }}
 */
export function importMemoriesText(text, { storage } = {}) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not-json' };
  }
  const list = asList(data);
  if (!list.length) return { ok: false, error: 'empty' };
  const { memories, skipped } = loadPersonal({ sources: [list] });
  try {
    (storage ?? globalThis.localStorage)?.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    return { ok: false, error: 'storage' };
  }
  return { ok: true, count: memories.length, skipped };
}

export function clearImportedMemories({ storage } = {}) {
  try {
    (storage ?? globalThis.localStorage)?.removeItem(LOCAL_KEY);
  } catch {
    /* ignore */
  }
}
