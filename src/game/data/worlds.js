/**
 * World map: the fifteen locations of the garden, how they connect, and when
 * each opens. `scene` is the exploration scene to travel to; `ready` says
 * whether that location is playable in this build (unbuilt places are shown
 * honestly as "coming in a later update", never as broken screens).
 */
export const WORLDS = [
  { id: 'garden', name: 'الحديقة الضائعة', icon: 'rose', x: 18, y: 78, act: 1, scene: 'garden', spawn: 240, ready: true },
  { id: 'maze', name: 'متاهة السياج', icon: 'leaf', x: 34, y: 66, act: 1, game: 'maze', unlock: 'flag:maze-done', ready: true },
  { id: 'conservatory', name: 'البيت الزجاجي', icon: 'rose-white', x: 48, y: 76, act: 1, scene: 'conservatory', spawn: 140, unlock: 'flag:maze-done', ready: true },
  { id: 'house', name: 'البيت الغامض', icon: 'key', x: 58, y: 56, act: 2, scene: 'house', spawn: 140, unlock: 'flag:act1-done', ready: true },
  { id: 'wardrobe', name: 'غرفة الملابس', icon: 'crown', x: 72, y: 50, act: 2, scene: 'house', spawn: 470, unlock: 'flag:house-entered', ready: true },
  { id: 'kitchen', name: 'المطبخ الصحي', icon: 'apple', x: 46, y: 46, act: 2, scene: 'house', spawn: 950, unlock: 'flag:house-entered', ready: true },
  { id: 'garage', name: 'الكراج وطريق السباق', icon: 'car', x: 84, y: 66, act: 3, scene: 'garage', spawn: 160, unlock: 'flag:garage-open', ready: true },
  { id: 'academy', name: 'أكاديمية سنوكي', icon: 'paw', x: 30, y: 40, act: 4, unlock: 'flag:act3-done', ready: false },
  { id: 'sanctuary', name: 'محمية الحيوانات', icon: 'feather', x: 14, y: 52, act: 4, unlock: 'flag:act3-done', ready: false },
  { id: 'observatory', name: 'المرصد', icon: 'star', x: 62, y: 22, act: 5, unlock: 'flag:act4-done', ready: false },
  { id: 'library', name: 'المكتبة السرّية', icon: 'note', x: 80, y: 32, act: 5, unlock: 'flag:act4-done', ready: false },
  { id: 'lake', name: 'البحيرة القمرية', icon: 'moon-full', x: 40, y: 22, act: 6, unlock: 'flag:act5-done', ready: false },
  { id: 'corridor', name: 'ممر الذكريات', icon: 'heart', x: 22, y: 24, act: 6, unlock: 'flag:act5-done', ready: false },
  { id: 'workshop', name: 'ورشة الأشياء المفقودة', icon: 'dumbbell', x: 90, y: 14, act: 7, unlock: 'flag:act6-done', ready: false },
  { id: 'final', name: 'الحديقة المخفية', icon: 'mark', x: 52, y: 8, act: 8, unlock: 'flag:act7-done', ready: false },
];

/** Paths drawn between locations (ids). */
export const ROUTES = [
  ['garden', 'maze'], ['maze', 'conservatory'], ['conservatory', 'house'], ['house', 'wardrobe'], ['house', 'kitchen'],
  ['house', 'garage'], ['kitchen', 'academy'], ['academy', 'sanctuary'], ['house', 'observatory'], ['observatory', 'library'],
  ['observatory', 'lake'], ['lake', 'corridor'], ['library', 'workshop'], ['observatory', 'final'], ['workshop', 'final'],
];

export const worldById = (id) => WORLDS.find((w) => w.id === id);
export const worldOfScene = (sceneId) => WORLDS.find((w) => w.scene === sceneId);
