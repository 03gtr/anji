/**
 * Campaign structure: acts and their objectives. Objectives are derived from
 * story flags (never stored separately), so the HUD can never disagree with
 * the actual progress.
 */
import { check } from '../core/conditions.js';

export const ACTS = [
  {
    act: 1,
    title: 'الحديقة الضائعة',
    subtitle: 'حيث يبدأ كل شي… بوردة زرقاء.',
    art: 'world-1-garden',
    objectives: [
      { done: 'flag:met-snooki', text: 'استكشفي الحديقة… شي دا يتحرك ورا الشجيرة.' },
      { done: 'flag:read-engraving', text: 'افحصي النافورة اللي بنص الحديقة.' },
      { done: 'flag:moon-bloom', text: 'فتّحي ورود القمر بالترتيب الصحيح.' },
      { done: 'flag:maze-done', text: 'اعبري متاهة السياج.' },
      { done: 'flag:needle-met', text: 'استكشفي البيت الزجاجي… ليش سنوكي متوتر؟' },
      { done: 'flag:chase-done', text: 'اهربي ويا سنوكي من الممرضة إبرة!' },
      { done: 'flag:gate-open', text: 'جاوبي سؤال البوابة الكبيرة.' },
      { done: 'flag:act1-done', text: 'الحقي الظل اللي ورا البوابة.' },
    ],
  },
  {
    act: 2,
    title: 'البيت اللي يتذكر',
    subtitle: 'كل غرفة بيها شي ناقص… وشي زايد.',
    art: 'world-3-house',
    objectives: [
      { done: 'flag:house-entered', text: 'ادخلي البيت الغامض.' },
      { done: 'flag:study-done', text: 'دوّري بمكتب ريان على أدلة.' },
      { done: 'flag:garage-open', text: 'افتحي قفل الكراج. الجواب مخبّى بالبيت نفسه.' },
    ],
  },
  {
    act: 3,
    title: 'طريق الأضواء الزرقاء',
    subtitle: 'سيارة، طريق، ورسالة مخبّية.',
    art: 'world-2-road',
    objectives: [
      { done: 'flag:car-uncovered', text: 'اكتشفي شنو مغطّى بنص الكراج.' },
      { done: 'flag:car-ready', text: 'رجّعي الحياة للسيارة من لوحة الكهرباء.' },
      { done: 'record:game:race-moon', text: 'سوقي على طريق القمر.' },
      { done: 'flag:glovebox', text: 'افتحي درج السيارة… أكو شي يلمع.' },
      { done: 'record:game:race-rose', text: 'سوقي على طريق الورد.' },
      { done: 'flag:act3-done', text: 'اوصلي لجسر منتصف الليل… وباوعي يمين.' },
    ],
  },
  { act: 4, title: 'تحقيق سنوكي الكبير', subtitle: 'أعظم محقق بالعالم. حسب رأيه.', art: 'world-4-academy', objectives: [] },
  { act: 5, title: 'مرصد النجوم الضائعة', subtitle: 'النجوم ما تكذب. بس ترمّز.', art: null, objectives: [] },
  { act: 6, title: 'ممر الذكريات', subtitle: 'الأشياء تحفظ القصص.', art: 'world-7-memories', objectives: [] },
  { act: 7, title: 'ورشة الأشياء المفقودة', subtitle: 'كل أداة لها مكان.', art: null, objectives: [] },
  { act: 8, title: 'ما وراء الحديقة', subtitle: 'النهاية… أو البداية.', art: 'world-8-ending', objectives: [] },
];

/** The act she is currently in: the first one with an unfinished objective. */
export function currentAct(game) {
  return ACTS.find((a) => a.objectives.length && a.objectives.some((o) => !check(o.done, game))) ?? ACTS[ACTS.length - 1];
}

export function currentObjective(game) {
  for (const act of ACTS) {
    const next = act.objectives.find((o) => !check(o.done, game));
    if (next) return { act: act.act, title: act.title, text: next.text };
  }
  return { act: null, title: '', text: 'استكشفي الحديقة على راحتچ ✨' };
}
