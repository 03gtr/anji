/**
 * The journal's mission list as data (pure, tested): the eight acts as main
 * chapters plus every mission, each with a stable DISPLAY number, a category
 * for the filters, a status, where to go, and what to do next.
 *
 * Display numbers are for reading only («٥·٢» = chapter 5, second entry). They
 * come from the chapter and from the order missions are listed in
 * data/missions.js — which is append-only — so new content never renumbers
 * old entries. Mission ids (stored in saves) never change.
 *
 * status: 'locked' | 'available' (open, not started) | 'active' (started) | 'complete'
 */
import { check } from '../core/conditions.js';
import { ACTS } from '../data/chapters.js';
import { MISSIONS, KIND_NAMES } from '../data/missions.js';
import { WORLDS } from '../data/worlds.js';
import { missionState } from './missions.js';

export const POST_GAME = 9; // chapter number used for content after the ending

export const FILTERS = [
  ['all', 'الكل'],
  ['main', 'الرئيسية'],
  ['side', 'الجانبية'],
  ['puzzle', 'الألغاز'],
  ['done', 'المكتملة'],
];

export const STATUS_NAMES = { locked: 'مقفلة', available: 'متاحة', active: 'جارية', complete: 'مكتملة' };

const CATEGORY = { story: 'main', side: 'side', arcade: 'side', collect: 'side', challenge: 'puzzle', puzzle: 'puzzle' };

/** Chapter and place for the missions written before chapters were shown (V2). */
const MISSION_META = {
  'unfinished-build': { chapter: 2, world: 'study' },
  'hidden-passage': { chapter: 2, world: 'study' },
  'night-run': { chapter: 3, world: 'garage' },
  'missing-recipe': { chapter: 2, world: 'kitchen' },
  'lost-kitten': { chapter: 4, world: ['sanctuary', 'meadow'] },
  'second-sky': { chapter: 6, world: 'observatory' },
  'robo-snooki': { chapter: 8, world: 'workshop' },
  'detective-exam': { chapter: 6, world: 'academy' },
  'wardrobe-challenge': { chapter: 5, world: 'wardrobe' },
  'letters-archive': { chapter: 7, world: 'corridor' },
  'garden-plus': { chapter: POST_GAME, world: 'final' },
  'sp1-two-roads': { chapter: POST_GAME, world: 'roads' },
  'sp1-sweets-roses': { chapter: POST_GAME, world: 'roseclinic' },
  'sp1-husky-name': { chapter: POST_GAME, world: 'roseclinic' },
  'sp1-unsigned-gift': { chapter: POST_GAME, world: ['roads', 'roseclinic'] },
  'sp1-garden-remembers': { chapter: POST_GAME, world: 'roads' },
  'sp1-lost-ball': { chapter: POST_GAME, world: 'roseclinic' },
  'sp1-little-lines': { chapter: POST_GAME, world: 'roseclinic' },
};

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
/** Place ids for the map: `{ id, done }` places drop out once done (all stay if every one is). */
const placesOf = (v, game) => {
  const all = list(v);
  const open = all.filter((p) => typeof p === 'string' || !safe(p.done, game));
  return (open.length ? open : all).map((p) => (typeof p === 'string' ? p : p.id));
};
const safe = (cond, game) => {
  try {
    return check(cond, game);
  } catch {
    return false;
  }
};

const chapterOf = (m) => m.chapter ?? MISSION_META[m.id]?.chapter ?? POST_GAME;

/** Readable unlock condition when a mission does not spell one out (never a solution). */
function lockedText(m) {
  if (m.locked) return m.locked;
  const atoms = JSON.stringify(m.unlock ?? '');
  const act = atoms.match(/flag:act(\d)-done/);
  if (/game-complete/.test(atoms)) return 'تنفتح بعد نهاية الحكاية.';
  if (act) return `تنفتح بعد ما تخلصين الفصل ${['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'][Number(act[1])]}.`;
  return 'تنفتح بالقصة… كمّلي المغامرة.';
}

function actEntries(game) {
  const firstOpen = ACTS.findIndex((a) => a.objectives.some((o) => !safe(o.done, game)));
  return ACTS.map((a, i) => {
    const done = a.objectives.filter((o) => safe(o.done, game)).length;
    const next = a.objectives.find((o) => !safe(o.done, game)) ?? null;
    const status = done === a.objectives.length ? 'complete' : i === firstOpen ? (done ? 'active' : 'available') : i < firstOpen || firstOpen === -1 ? 'active' : 'locked';
    const worlds = WORLDS.filter((w) => w.act === a.act && !w.pack).map((w) => w.id);
    return {
      id: `act:${a.act}`,
      category: 'main',
      chapter: a.act,
      no: 0,
      title: a.title,
      kindLabel: 'فصل',
      status,
      where: WORLDS.filter((w) => worlds.includes(w.id)).map((w) => w.name).join(' · '),
      worlds,
      next: next?.text ?? null,
      hint: null,
      locked: i > 0 ? `ينفتح بعد ما تخلصين «${ACTS[i - 1].title}».` : '',
      reward: '',
      steps: { done, total: a.objectives.length },
      pack: null,
      objective: next,
    };
  });
}

function missionEntries(game) {
  const counters = {};
  return MISSIONS.map((m) => {
    const chapter = chapterOf(m);
    counters[chapter] = (counters[chapter] ?? 0) + 1;
    const st = missionState(m, game);
    const status = st.status === 'complete' ? 'complete' : st.status === 'locked' ? 'locked' : st.step === 0 ? 'available' : 'active';
    const stepWorld = st.next?.world;
    return {
      id: m.id,
      category: CATEGORY[m.kind] ?? 'side',
      chapter,
      no: counters[chapter],
      title: m.title,
      kindLabel: KIND_NAMES[m.kind] ?? '',
      status,
      where: m.where,
      worlds: placesOf(stepWorld ?? m.world ?? MISSION_META[m.id]?.world, game),
      next: st.next?.text ?? null,
      hint: st.next?.hint ?? null,
      locked: lockedText(m),
      reward: m.rewardText,
      summary: m.summary,
      steps: { done: st.step, total: m.steps.length },
      pack: m.pack ?? null,
    };
  });
}

/** The entry the story currently points at (same rule as the HUD objective). */
function currentId(game, entries) {
  for (const a of ACTS) {
    const next = a.objectives.find((o) => !safe(o.done, game));
    if (!next) continue;
    if (next.pack) {
      const m = entries.find((e) => e.pack === next.pack && e.category === 'main' && (e.status === 'active' || e.status === 'available'));
      if (m) return m.id;
    }
    return `act:${a.act}`;
  }
  return entries.find((e) => e.category === 'main' && e.chapter === POST_GAME && (e.status === 'active' || e.status === 'available'))?.id ?? null;
}

const ORDER = { active: 1, available: 2, locked: 3, complete: 4 };

/**
 * Every entry, sorted: the current one first, then started, open, locked,
 * finished — each group in chapter / display-number order.
 */
export function journalEntries(game) {
  const entries = [...actEntries(game), ...missionEntries(game)];
  const cur = currentId(game, entries);
  const reach = Math.max(0, ...entries.filter((e) => e.status !== 'locked' && e.chapter < POST_GAME).map((e) => e.chapter));
  for (const e of entries) {
    e.isCurrent = e.id === cur;
    // far-future locked entries keep their secret (no spoilers), but still say how they open
    e.hidden = e.status === 'locked' && e.chapter > reach + 1;
  }
  return entries.sort((a, b) => (b.isCurrent - a.isCurrent) || ORDER[a.status] - ORDER[b.status] || a.chapter - b.chapter || a.no - b.no);
}

export function filterEntries(entries, filter) {
  if (filter === 'done') return entries.filter((e) => e.status === 'complete');
  if (filter === 'all' || !filter) return entries;
  return entries.filter((e) => e.category === filter);
}

/** «٥·٢» for missions, «الفصل ٥» for acts, «✦٢» after the ending. */
export function displayNo(e, num = String) {
  if (e.no === 0) return `الفصل ${num(e.chapter)}`;
  if (e.chapter === POST_GAME) return `✦${num(e.no)}`;
  return `${num(e.chapter)}·${num(e.no)}`;
}
