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

export const CORRIDOR_SLOTS = 6;
export const LOCAL_KEY = 'snooki-game:memories';

const built = import.meta.glob('/private/memories.json', { eager: true, import: 'default' });
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
    if (m.enabled !== true || seen.has(m.id)) continue;
    seen.add(m.id);
    memories.push({ kind: 'personal', ...m });
  }
  return { memories, skipped };
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
