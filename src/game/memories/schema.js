/**
 * Memory schema. A memory is one frame in the Memory Corridor: a short scene,
 * a question about it, and an optional reward.
 *
 * {
 *   id:          'unique-slug'                       required, a-z 0-9 -
 *   title:       'عنوان قصير'                         required
 *   category:    one of MEMORY_CATEGORIES             required
 *   kind:        'personal' | 'fictional'             required
 *   enabled:     true                                 personal memories default to false
 *   dateLabel:   'شتاء ٢٠٢٤'                          optional, free text (no real date needed)
 *   scene:       'وصف المشهد كما يُروى'                required
 *   puzzle:      'choice' | 'order' | 'reveal'        required
 *   question:    'السؤال'                             required unless puzzle = 'reveal'
 *   options:     [{ id, label }]                      choice / order
 *   answer:      'optionId'  |  ['id', 'id', …]       choice → id, order → full order
 *   hints:       ['تلميح ١', 'تلميح ٢']                optional
 *   dialogue:    [{ s: 'anji', e: 'soft', t: '…' }]   optional lines after solving
 *   reward:      'unlock:bow-gold'                     optional effect(s)
 *   art:         'private-art name'                   optional painted picture
 *   location:    'بالحديقة'                           optional place label (V3)
 *   object:      'picnic:sweet'                        optional game object it dresses (V3)
 *   status:      'fictional' | 'draft' | 'confirmed'   optional (V3); drafts are NEVER shown
 * }
 * Memory text lives only in private/ or on her device — never in this repo.
 */
export const MEMORY_CATEGORIES = {
  clinic: 'المستوصف',
  funny: 'مواقف مضحكة',
  racing: 'السيارات والسباق',
  colors: 'الألوان المفضلة',
  music: 'الموسيقى',
  birthday: 'أعياد الميلاد',
  gym: 'الجيم والحياة الصحية',
  animals: 'الحيوانات',
  flowers: 'الورد والهدايا',
  everyday: 'مغامرات يومية',
  story: 'من القصة',
};

const ID = /^[a-z0-9][a-z0-9-]{1,40}$/;
export const MEMORY_STATUS = ['fictional', 'draft', 'confirmed'];

/** @returns {{ ok: boolean, errors: string[] }} */
export function validateMemory(m) {
  const errors = [];
  const need = (cond, msg) => !cond && errors.push(msg);
  if (!m || typeof m !== 'object') return { ok: false, errors: ['not an object'] };
  need(typeof m.id === 'string' && ID.test(m.id), 'id: lowercase letters, digits and dashes');
  need(typeof m.title === 'string' && m.title.trim(), 'title is required');
  need(m.category in MEMORY_CATEGORIES, `category must be one of: ${Object.keys(MEMORY_CATEGORIES).join(', ')}`);
  need(m.kind === 'personal' || m.kind === 'fictional', "kind must be 'personal' or 'fictional'");
  need(typeof m.scene === 'string' && m.scene.trim(), 'scene is required');
  need(['choice', 'order', 'reveal'].includes(m.puzzle), "puzzle must be 'choice', 'order' or 'reveal'");
  if (m.puzzle === 'choice' || m.puzzle === 'order') {
    need(typeof m.question === 'string' && m.question.trim(), 'question is required');
    const opts = Array.isArray(m.options) ? m.options : [];
    need(opts.length >= 2 && opts.every((o) => o && typeof o.id === 'string' && typeof o.label === 'string'), 'options: at least two { id, label }');
    const ids = opts.map((o) => o.id);
    need(new Set(ids).size === ids.length, 'option ids must be unique');
    if (m.puzzle === 'choice') need(ids.includes(m.answer), 'answer must be one of the option ids');
    if (m.puzzle === 'order') need(Array.isArray(m.answer) && m.answer.length === ids.length && m.answer.every((a) => ids.includes(a)) && new Set(m.answer).size === ids.length, 'answer must list every option id once, in order');
  }
  if (m.hints !== undefined) need(Array.isArray(m.hints) && m.hints.every((h) => typeof h === 'string'), 'hints must be a list of text');
  if (m.dialogue !== undefined) need(Array.isArray(m.dialogue) && m.dialogue.every((l) => l && typeof l.t === 'string'), 'dialogue must be a list of { s, e, t } lines');
  if (m.reward !== undefined) need([].concat(m.reward).every((r) => typeof r === 'string'), 'reward must be effect text');
  if (m.location !== undefined) need(typeof m.location === 'string' && m.location.length <= 60, 'location must be short text');
  if (m.object !== undefined) need(typeof m.object === 'string' && /^[a-z]+:[a-z0-9-]+$/.test(m.object), "object looks like 'picnic:sweet'");
  if (m.status !== undefined) need(MEMORY_STATUS.includes(m.status), `status must be one of: ${MEMORY_STATUS.join(', ')}`);
  return { ok: errors.length === 0, errors };
}

/** Build a puzzle definition (see puzzles/rules.js) from a memory. */
export function memoryPuzzle(m) {
  const base = { id: `memory-${m.id}`, title: m.title, intro: m.question, hints: m.hints?.length ? m.hints : ['فكّري بالمشهد اللي شفتيه.', 'ارجعي للدفتر إذا تحتاجين.'], success: 'الإطار ضوى ✨', reward: [] };
  if (m.puzzle === 'order') {
    return { ...base, type: 'sequence', config: { items: m.options.map((o) => ({ id: o.id, label: o.label, icon: o.icon || 'heart' })), answer: m.answer } };
  }
  return { ...base, type: 'choice', config: { question: m.question, options: m.options.map((o) => ({ id: o.id, label: o.label, icon: o.icon })), answer: m.answer } };
}
