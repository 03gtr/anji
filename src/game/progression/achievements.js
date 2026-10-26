/**
 * Achievements: derived from progress (never granted by time or streaks).
 * When a condition first becomes true the achievement is recorded as the
 * flag `ach:<id>` and its reward (if any) is applied once.
 */
import { check } from '../core/conditions.js';
import { applyEffects } from '../core/effects.js';

export const ACHIEVEMENTS = [
  { id: 'first-steps', name: 'أول خطوة', text: 'التقيتي بسنوكي.', icon: 'paw', when: 'flag:met-snooki' },
  { id: 'gardener', name: 'قارئة النقوش', text: 'فتّحتي ورود القمر.', icon: 'moon-full', when: 'flag:moon-bloom' },
  { id: 'escape', name: 'هروب بطولي', text: 'هربتي من الممرضة إبرة.', icon: 'stethoscope', when: 'flag:chase-done' },
  { id: 'house', name: 'البيت يتذكرچ', text: 'دخلتي البيت الغامض.', icon: 'key', when: 'flag:house-entered' },
  { id: 'driver', name: 'سائقة الأضواء', text: 'خلّصتي الحلبات الثلاث.', icon: 'car', when: ['record:game:race-moon', 'record:game:race-rose', 'record:game:race-bridge'] },
  { id: 'detective', name: 'محققة محترفة', text: 'حليتي قضية الخريطة.', icon: 'paw', when: 'flag:case-solved' },
  { id: 'stargazer', name: 'اسمي بالنجوم', text: 'قريتي رسالة المرصد.', icon: 'star', when: 'flag:act5-done' },
  { id: 'memories', name: 'حارسة الذكريات', text: 'ضوّيتي كل إطارات الممر.', icon: 'heart', when: 'flag:corridor-done' },
  { id: 'ending', name: 'ما وراء الحديقة', text: 'وصلتي للحديقة المخفية.', icon: 'rose', when: 'flag:game-complete' },
  { id: 'stars-10', name: 'جامعة نجوم', text: 'لگيتي ١٠ نجوم مخفية.', icon: 'star', when: 'count:star>=10', reward: 'unlock:bow-gold' },
  { id: 'stars-all', name: 'كل النجوم', text: 'لگيتي كل النجوم بالحديقة.', icon: 'star', when: (g) => g.countGroup('star') >= g.totalOf?.('star') },
  { id: 'notes-all', name: 'كل الرسائل', text: 'قريتي كل رسائل ريان.', icon: 'note', when: (g) => g.countGroup('note') >= g.totalOf?.('note') },
  { id: 'seeds', name: 'كيس بذور مليان', text: 'جمعتي كل أكياس البذور.', icon: 'leaf', when: (g) => g.countGroup('seed') >= g.totalOf?.('seed'), reward: 'unlock:snooki-hat-rose' },
  { id: 'golden-road', name: 'الطريق الذهبي', text: 'ذهبية بكل السباقات.', icon: 'car', when: ['medal:game:race-moon:gold', 'medal:game:race-rose:gold', 'medal:game:race-bridge:gold'], reward: 'unlock:collar-gold' },
  { id: 'needle-gold', name: 'ولا وخزة', text: 'ذهبية بهروب الإبرة.', icon: 'stethoscope', when: 'medal:game:chase:gold', reward: 'unlock:collar-rose' },
  { id: 'chef', name: 'شيف الطاقة', text: 'ذهبية بالمطبخ.', icon: 'apple', when: 'medal:game:kitchen:gold' },
  { id: 'planter', name: 'حديقتي', text: 'زرعتي الحديقة المخفية.', icon: 'rose', when: (g) => g.state.garden.length >= 5 },
];

/** Check all achievements; returns newly earned ones (and applies rewards). */
export function syncAchievements(game) {
  const earned = [];
  for (const a of ACHIEVEMENTS) {
    const key = `ach:${a.id}`;
    if (game.flag(key)) continue;
    let ok = false;
    try {
      ok = check(a.when, game);
    } catch {
      ok = false;
    }
    if (ok) {
      game.setFlag(key);
      const changes = a.reward ? applyEffects(a.reward, game) : [];
      earned.push({ ...a, changes });
    }
  }
  return earned;
}
