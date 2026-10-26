/**
 * Minigame registry. Each entry is lazy-loaded (its code is fetched only when
 * first played — and precached for offline use), so adding a game never
 * slows the first load. `reward` effects apply on the first completion only.
 */
export const MINIGAMES = {
  maze: {
    title: 'متاهة السياج',
    goal: 'طلّعي أنجي وسنوكي من متاهة السياج المظلمة. الفانوس يضوي بس الطريق القريب.',
    controls: ['اسحبي على المتاهة حتى تمشين لحد أقرب تقاطع', 'أو استخدمي الأسهم (اضغطي مطوّل للمشي المستمر)', 'البتلات الزرقاء اختيارية'],
    icon: 'leaf',
    load: () => import('./maze.js'),
    options: { layout: 'hedge' },
    reward: ['flag:maze-done'],
  },
  'maze-night': {
    title: 'متاهة منتصف الليل',
    goal: 'نفس السياج… بس بالليل، والفانوس أضعف. تحدي إضافي.',
    controls: ['اسحبي حتى تمشين لأقرب تقاطع', 'الأسهم للخطوة الوحدة'],
    icon: 'moon-crescent',
    load: () => import('./maze.js'),
    options: { layout: 'hedge-night', fog: 2.4 },
    reward: ['unlock:snooki-hat-crown'],
  },
  chase: {
    title: 'هروب من الممرضة إبرة',
    goal: 'اركضي ويا سنوكي لآخر البيت الزجاجي. اقفزي فوق السنادين والخراطيم، والإبرة وراكم!',
    controls: ['اضغطي بأي مكان (أو المسافة / ↑) حتى تقفزين', 'البسكويت لسنوكي اختياري', 'إذا مسكتكم، ترجعون لآخر فانوس'],
    icon: 'stethoscope',
    load: () => import('./chase.js'),
    options: { course: 'conservatory' },
    reward: ['flag:chase-done'],
  },
};

export const MINIGAME_IDS = Object.keys(MINIGAMES);
