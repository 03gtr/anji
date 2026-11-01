/**
 * Season 2, M2 — the Living Story missions' case file (docs/season-2/SEASON_2_LIVING_STORY_C1.md):
 * evidence, decisions and journal entries, kept apart from M1's registry (data/evidence-s2.js), which the
 * shipped milestone's content tests compare with the approved graph. Everything is stored in Season 2's own
 * document (`s2.ev.<id>`, `s2:dec:<key>`), never in the original campaign's save. Fiction written for the game.
 */
import { gather } from './m2/index.js';

export const EVIDENCE_S2_M2 = {
  // Mission 01 «سر المكتب»: the scraps she finds in the office (clues of «منو گال شنو»), and what they add up to
  'f-rota': { rel: 'fact', icon: 'note', label: 'جدول الگهوة', note: 'بخط صبري، بالزاوية: «آني أعيد الكلام مثل ما سمعته، حرف بحرف.»' },
  'f-calendar': { rel: 'fact', icon: 'note', label: 'تقويم المكتب', note: '«الأحد: ريان ويا صبري ببالة الگهوة.» و«الاثنين: لمى سمعت شي عن ريان!!»' },
  'f-sticky': { rel: 'fact', icon: 'note', label: 'ورقة ريان اللاصقة', note: 'على شاشة صبري، بخط ريان: «صبري، لا تگول لأحد. — ر» وبالزاوية: «الأحد».' },
  'f-print': { rel: 'fact', icon: 'note', label: 'رسالة لمى المطبوعة', note: 'طلعت من الطابعة بالغلط: «… وگلتلها: ريان يخبي شي.»' },
  ...gather('evidence'),
  'e-versions': { rel: 'claim', icon: 'note', label: 'ثلاث نسخ من نفس الجملة', note: 'ريان: «لا تگول لأحد». صبري: «ريان راح للعيادة بالسر». لمى: «ريان يخبي شي». كل وحدة صارت أقصر… وأخوف.' },
};

/** Decisions of the Living Story (named values; `dec:key=value`). Every value continues the story. */
export const DECISIONS_S2_M2 = {
  'office-cover': ['cover', 'truth'], // 01: help Sabri blame the printer, or let the truth stand (read: 01's end, 04, 06)
  ...gather('decisions'),
};

/** The case notebook, M2: evidence by mission, in order. */
export const CASE_S2_M2 = [{ mission: 's2-12', ids: ['f-rota', 'f-calendar', 'f-sticky', 'f-print', 'e-versions'] }, ...gather('case')];

export const JOURNAL_S2_M2 = {
  ...gather('journal'),
  's2-office': { title: 'سر المكتب', icon: 'note', text: 'جملة وحدة، ثلاث نسخ. وبالمكتب صار الكل يعرف شي… بفضل صبري، والطابعة.' },
};
