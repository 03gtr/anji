import { SP2_GATE, SP2_FINAL_GATE } from './missions-sp2.js';
import { DEEP_OPEN } from './missions-deep.js';

/**
 * World map: the locations of the garden, how they connect, and when
 * each opens. Positions (x, y in %) sit on a 4 × 6 grid so no label or icon
 * overlaps another place on a phone, in landscape or on a desktop.
 * `scene` is the exploration scene to travel to; `ready` says
 * whether that location is playable in this build (unbuilt places are shown
 * honestly as "coming in a later update", never as broken screens).
 */
export const WORLDS = [
  { id: 'garden', name: 'الحديقة الضائعة', icon: 'rose', x: 12, y: 71, act: 1, scene: 'garden', spawn: 240, ready: true },
  { id: 'maze', name: 'متاهة السياج', icon: 'leaf', x: 37, y: 71, act: 1, game: 'maze', unlock: 'flag:maze-done', ready: true },
  { id: 'conservatory', name: 'البيت الزجاجي', icon: 'rose-white', x: 62, y: 71, act: 1, scene: 'conservatory', spawn: 140, unlock: 'flag:maze-done', ready: true },
  { id: 'house', name: 'البيت الغامض', icon: 'key', x: 62, y: 55.5, act: 2, scene: 'house', spawn: 140, unlock: 'flag:act1-done', ready: true },
  { id: 'wardrobe', name: 'غرفة الملابس', icon: 'crown', x: 87, y: 40, act: 2, scene: 'house', spawn: 470, unlock: 'flag:house-entered', ready: true },
  { id: 'kitchen', name: 'المطبخ الصحي', icon: 'apple', x: 37, y: 40, act: 2, scene: 'house', spawn: 950, unlock: 'flag:house-entered', ready: true },
  { id: 'garage', name: 'الكراج وطريق السباق', icon: 'car', x: 87, y: 55.5, act: 3, scene: 'garage', spawn: 160, unlock: 'flag:garage-open', ready: true },
  { id: 'academy', name: 'أكاديمية سنوكي', icon: 'paw', x: 37, y: 24.5, act: 4, scene: 'academy', spawn: 140, unlock: 'flag:act3-done', ready: true },
  { id: 'sanctuary', name: 'محمية الحيوانات', icon: 'feather', x: 12, y: 40, act: 4, scene: 'sanctuary', spawn: 140, unlock: 'flag:case-open', ready: true },
  { id: 'observatory', name: 'المرصد', icon: 'star', x: 62, y: 24.5, act: 5, scene: 'observatory', spawn: 140, unlock: 'flag:act4-done', ready: true },
  { id: 'library', name: 'المكتبة السرّية', icon: 'note', x: 87, y: 24.5, act: 5, scene: 'library', spawn: 140, unlock: 'flag:library-open', ready: true },
  { id: 'lake', name: 'البحيرة القمرية', icon: 'moon-full', x: 37, y: 9, act: 6, scene: 'lake', spawn: 140, unlock: 'flag:act5-done', ready: true },
  { id: 'corridor', name: 'ممر الذكريات', icon: 'heart', x: 12, y: 9, act: 6, scene: 'corridor', spawn: 140, unlock: 'flag:act5-done', ready: true },
  // Story Pack 02: Act VII also needs the archive seals (or that she is already past them)
  { id: 'workshop', name: 'ورشة الأشياء المفقودة', icon: 'dumbbell', x: 87, y: 9, act: 7, scene: 'workshop', spawn: 140, unlock: ['flag:act6-done', SP2_GATE], ready: true, locked: 'ينفتح بعد الفصل السادس وأختام أرشيف الأسرار.' },
  // V2 side locations
  { id: 'study', name: 'مكتب ريان', icon: 'note', x: 62, y: 40, act: 2, scene: 'study', spawn: 140, unlock: 'flag:house-entered', ready: true },
  { id: 'gameroom', name: 'صالة الألعاب', icon: 'crown', x: 37, y: 55.5, act: 2, scene: 'gameroom', spawn: 140, unlock: 'flag:house-entered', ready: true },
  { id: 'meadow', name: 'المرج الخلفي', icon: 'leaf', x: 12, y: 24.5, act: 4, scene: 'meadow', spawn: 140, unlock: 'flag:kitten-tracks', ready: true },
  // Phase 03: the finale is earned — Act VII and «خريطة الغد» (or she has already been there)
  { id: 'final', name: 'الحديقة المخفية', icon: 'mark', x: 62, y: 9, act: 8, scene: 'final', spawn: 140, unlock: ['flag:act7-done', SP2_FINAL_GATE], ready: true, locked: 'تنفتح لمن تكتمل «خريطة الغد» بالورشة.' },
  // Story Pack 01 «الطرق اللي تتذكر» (after the ending)
  { id: 'roads', name: 'طريق الذكريات', icon: 'leaf', x: 12, y: 86.5, act: 8, scene: 'roads', spawn: 160, unlock: 'flag:game-complete', ready: true, pack: 'sp1' },
  // Story Pack 02 «أرشيف الأسرار» (main story, after Act IV)
  { id: 'archives', name: 'أرشيف الأسرار', icon: 'map', x: 87, y: 71, act: 5, scene: 'archives', spawn: 140, unlock: 'flag:act4-done', ready: true, pack: 'sp2' },
  { id: 'roseclinic', name: 'عيادة الورد', icon: 'rose', x: 37, y: 86.5, act: 8, scene: 'roseclinic', spawn: 140, unlock: 'flag:sp1-embrace', ready: true, pack: 'sp1' },
  // «إحنا فريق» (after the ending): shared activities, marked as such on the map; it opens when Anji plans it
  { id: 'dogwalk', name: 'ممشى العصر', icon: 'paw', x: 12, y: 55.5, act: 8, scene: 'dogwalk', spawn: 140, unlock: 'flag:tu-walk-plan', ready: true, pack: 'team', together: true, locked: 'ينفتح لمن تخططين المشية بدفتر خططچ (الحديقة المخفية).' },
  { id: 'trainyard', name: 'صالة التمرين', icon: 'dumbbell', x: 62, y: 86.5, act: 8, scene: 'trainyard', spawn: 140, unlock: 'flag:tu-train-plan', ready: true, pack: 'team', together: true, locked: 'تنفتح لمن تختارين «تمرين سوا» بدفتر خططچ (الحديقة المخفية).' },
  // Phase 04 «الحديقة العميقة» (after the ending since Phase 05): the map's second page (`region: 'deep'`), its own 4 × 6 grid.
  // `from` is the garden place each one is entered from (drawn as «من …» under its name).
  ...[
    // `short`: the label drawn on the map (two words at most, so it fits a 320 px phone);
    // the full `name` is the accessible label and is used everywhere else
    { id: 'clockgarden', name: 'حديقة الساعات الساكتة', short: 'حديقة الساعات', icon: 'sun', x: 12, y: 86.5, from: 'garden', unlock: DEEP_OPEN },
    { id: 'letterhall', name: 'قاعة الرسائل', icon: 'note', x: 37, y: 86.5, from: 'house', unlock: DEEP_OPEN },
    { id: 'falsetrails', name: 'حديقة الآثار الكاذبة', short: 'الآثار الكاذبة', icon: 'footprint', x: 62, y: 86.5, from: 'workshop', unlock: DEEP_OPEN },
    { id: 'sealedroom', name: 'غرفة المرصد المختومة', short: 'الغرفة المختومة', icon: 'star', x: 87, y: 86.5, from: 'observatory', unlock: DEEP_OPEN },
    { id: 'musicroom', name: 'غرفة الموسيقى المهجورة', short: 'غرفة الموسيقى', icon: 'crown', x: 12, y: 71, optional: true, unlock: 'flag:dg-timeline', locked: 'تنفتح لمن ترتبين الليلة الضائعة.' },
    { id: 'hyporoom', name: 'غرفة الفرضيات الأربع', short: 'غرفة الفرضيات', icon: 'mark', x: 37, y: 71, unlock: 'flag:dg-trails', locked: 'تنفتح لمن تميّزين الأثر الحقيقي.' },
    { id: 'starchamber', name: 'قاعة خريطة النجوم', short: 'قاعة النجوم', icon: 'moon-half', x: 87, y: 71, unlock: 'flag:dg-pattern', locked: 'تنفتح لمن تفهمين حيطان الغرفة المختومة.' },
    { id: 'roots', name: 'سرداب الجذور', icon: 'leaf', x: 37, y: 55.5, from: 'conservatory', unlock: 'flag:dg-hypo', locked: 'تنفتح لمن تثبتين وين راحت البذرة.' },
    { id: 'mirrorhouse', name: 'بيت المرايا', icon: 'moon-crescent', x: 87, y: 55.5, unlock: 'flag:dg-wheel', locked: 'تنفتح لمن يدور دولاب النجوم صح.' },
    { id: 'hedgemaze', name: 'متاهة السياج الدوّارة', short: 'السياج الدوّار', icon: 'rose-white', x: 37, y: 40, unlock: 'flag:dg-roots-maze', locked: 'تنفتح لمن تعبرين سرداب الجذور.' },
    { id: 'lighthouse', name: 'منارة الذكريات', icon: 'heart', x: 12, y: 24.5, optional: true, unlock: 'flag:dg-bridge', locked: 'تنفتح لمن تعبرين الجسر المخفي.' },
    { id: 'bridge', name: 'الجسر المخفي', icon: 'drop', x: 37, y: 24.5, unlock: 'flag:dg-hedge', locked: 'تنفتح لمن تعبرين متاهة السياج.' },
    { id: 'forgottengreen', name: 'البيت الأخضر المنسي', short: 'البيت الأخضر', icon: 'rose', x: 62, y: 24.5, unlock: 'flag:dg-bridge', locked: 'وراء الجسر المخفي.' },
    { id: 'evidenceroom', name: 'غرفة الأدلة الأخيرة', short: 'غرفة الأدلة', icon: 'key', x: 62, y: 9, unlock: 'flag:dg-awake', locked: 'تنفتح لمن تصحى البذرة.' },
  ].map((w) => ({ act: 8, scene: w.id, spawn: 140, ready: true, pack: 'deep', region: 'deep', ...w, locked: w.locked ?? 'تنفتح بعد نهاية الحكاية، لمن تلگين علبة البذرة الأخيرة فارغة بالورشة.' })),
];

/** Map pages: the garden, and (Phase 04) the deep garden under and behind it. */
export const REGIONS = [
  { id: 'garden', name: 'الحديقة' },
  { id: 'deep', name: 'الحديقة العميقة' },
];
export const regionOf = (w) => w?.region ?? 'garden';

/** Paths drawn between locations (ids). */
export const ROUTES = [
  ['garden', 'maze'], ['maze', 'conservatory'], ['conservatory', 'house'], ['house', 'wardrobe'], ['house', 'kitchen'],
  ['house', 'garage'], ['kitchen', 'academy'], ['academy', 'sanctuary'], ['house', 'observatory'], ['observatory', 'library'],
  ['observatory', 'lake'], ['lake', 'corridor'], ['library', 'workshop'], ['observatory', 'final'], ['workshop', 'final'],
  ['house', 'study'], ['sanctuary', 'meadow'], ['house', 'gameroom'],
  ['garden', 'roads'], ['roads', 'roseclinic'],
  ['house', 'archives'],
  // «إحنا فريق»
  ['garden', 'dogwalk'], ['dogwalk', 'sanctuary'], ['conservatory', 'trainyard'],
  // Phase 04 — the deep garden (each line stays on its own page; entrances are the `from` places)
  ['clockgarden', 'letterhall'], ['clockgarden', 'musicroom'], ['letterhall', 'hyporoom'], ['falsetrails', 'hyporoom'],
  ['sealedroom', 'starchamber'], ['starchamber', 'mirrorhouse'], ['hyporoom', 'starchamber'],
  ['hyporoom', 'roots'], ['roots', 'hedgemaze'], ['hedgemaze', 'bridge'], ['bridge', 'lighthouse'], ['bridge', 'forgottengreen'],
  ['mirrorhouse', 'roots'], ['mirrorhouse', 'forgottengreen'], ['forgottengreen', 'evidenceroom'],
  // entrances (between pages: not drawn, used for routing)
  ['garden', 'clockgarden'], ['house', 'letterhall'], ['workshop', 'falsetrails'], ['observatory', 'sealedroom'], ['conservatory', 'roots'],
];

export const worldById = (id) => WORLDS.find((w) => w.id === id);
export const worldOfScene = (sceneId) => WORLDS.find((w) => w.scene === sceneId);
