/**
 * Season 2, M2 — the Living Story missions (docs/season-2/SEASON_2_LIVING_STORY_C1.md; owner-approved
 * 2026-10-30: six missions, s2-12 … s2-17, released together). Built one by one; this file holds the ones
 * that exist. Same pack and rules as M1 (missions-s2.js): every id has an `s2` segment, steps never name an
 * answer, and the reward text shows only once a mission is done (ui/menus.js).
 */
import { PACK_S2 } from './missions-s2.js';
import { gather } from './m2/index.js';

const after = (id) => `flag:mission:${id}`;

export const MISSIONS_S2_M2 = [
  {
    id: 's2-12',
    kind: 'story',
    pack: PACK_S2,
    act: 3,
    day: 13,
    world: ['s2-office'],
    title: 'سر المكتب',
    where: 'المكتب',
    summary: 'جملة وحدة دارت بالمكتب، ووصلت غير شكل. لمى تعرف من وين تبدين.',
    unlock: after('s2-11'),
    locked: 'ينفتح بعد «لوحة الدائرة» الثانية.',
    steps: [
      { done: 'flag:s2:in-office', world: 's2-office', text: 'روحي للمكتب. لمى تنتظرچ هناك.' },
      { done: ['ev:f-rota', 'ev:f-calendar'], world: 's2-office', text: 'دوري بالمكتب على أي شي يذكر الكلام اللي دار.' },
      { done: 'ev:f-sticky', world: 's2-office', text: 'صبري يخبي ورقة على شاشته. شوفيها بدون ما يحس.' },
      { done: 'flag:s2:12-tidy', world: 's2-office', text: 'اللي صار صار. رجّعي المكتب مثل ما چان.' },
      { done: 'ev:e-versions', world: 's2-office', text: 'ويا لمى: منو گال شنو، ولمن؟' },
      { done: 'flag:s2:12-done', world: 's2-office', text: 'أحد واصل للمكتب.' },
    ],
    reward: ['journal:s2-office'],
    rewardText: 'ثلاث نسخ من نفس الجملة',
    leadsTo: ['s2-13'],
  },
  // Missions 02–06: one module each (data/m2/)
  ...gather('missions'),
];
