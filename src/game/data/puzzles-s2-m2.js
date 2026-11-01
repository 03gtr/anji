/**
 * Season 2, M2 «الخيوط الكاذبة» — the Living Story missions' puzzles (docs/season-2/SEASON_2_LIVING_STORY_C1.md).
 * Same rules as M1's: strict — no hint, no skip, no "show the answer", neutral replies to a wrong try;
 * an answer follows only from what she has found.
 * Fiction written for the game.
 */

import { gather } from './m2/index.js';

export const PUZZLES_S2_M2 = {
  ...gather('puzzles'),
  // Mission 01 «سر المكتب»: who said what, to whom, on which day — from the scraps she finds in the office.
  // Truth (story bible §3, rows 1–3): on Sunday Ryan asked Sabri to keep quiet; on Monday Sabri told Lama his
  // exact, true words; on Tuesday Lama passed on a shorter version, with a worry added, to someone outside the
  // office (who that was is Mission 04's question — never named here).
  's2-who-said': {
    type: 'logicgrid',
    title: 'منو گال شنو',
    goal: 'ثلاث أيام، ثلاث جمل. منو گال، ولمن، وأي جملة؟',
    intro: 'لمى: «كل ورقة لگيناها بالمكتب تشهد على شي. رتبيها ويايا.»',
    config: {
      rows: [
        { id: 'sun', label: 'الأحد', icon: 'sun' },
        { id: 'mon', label: 'الاثنين', icon: 'moon-crescent' },
        { id: 'tue', label: 'الثلاثاء', icon: 'moon-full' },
      ],
      cols: [
        { id: 'who', label: 'منو حچى', options: [{ id: 'ryan', label: 'ريان' }, { id: 'sabri', label: 'صبري' }, { id: 'lama', label: 'لمى' }] },
        { id: 'to', label: 'لمن', options: [{ id: 'sabri', label: 'صبري' }, { id: 'lama', label: 'لمى' }, { id: 'out', label: 'واحد من برا المكتب' }] },
        { id: 'said', label: 'شنو انگال', options: [{ id: 'quiet', label: '«لا تگول لأحد»' }, { id: 'clinic', label: '«ريان راح للعيادة بالسر»' }, { id: 'hides', label: '«ريان يخبي شي»' }] },
      ],
      clues: [
        { text: 'كل جملة من الثلاث انگالت مرة وحدة.', rule: { distinct: 'said' } },
        // the sticky note on Sabri's screen (Ryan's hand)
        { text: 'ورقة لاصقة بخط ريان: «صبري، لا تگول لأحد. — ر»', rule: { pair: ['who', 'ryan', 'said', 'quiet'] } },
        { text: 'وبزاوية نفس الورقة اللاصقة، مكتوب صغير: «الأحد».', rule: { is: ['sun', 'said', 'quiet'] } },
        // the coffee rota (Sabri's own line)
        { text: 'جدول الگهوة، بخط صبري: «آني أعيد الكلام مثل ما سمعته، حرف بحرف.» وصبري سمع ريان بالعيادة.', rule: { pair: ['who', 'sabri', 'said', 'clinic'] } },
        // the shared calendar
        { text: 'التقويم: «الأحد: ريان ويا صبري ببالة الگهوة.»', rule: { is: ['sun', 'to', 'sabri'] } },
        { text: 'التقويم: «الاثنين: لمى سمعت شي عن ريان!!»', rule: { is: ['mon', 'to', 'lama'] } },
        // the sheet from the printer (Lama's message, printed by mistake)
        { text: 'ورقة من الطابعة، رسالة لمى: «… وگلتلها: ريان يخبي شي.»', rule: { pair: ['who', 'lama', 'to', 'out'] } },
      ],
    },
    wrong: [],
    success: 'ريان طلب السكوت، صبري عاد الكلام بالضبط… ولمى اختصرته. نفس الجملة، ثلاث نسخ.',
    reward: ['ev:e-versions'],
  },
};

// like M1's story puzzles: solved, never skipped or shown
// Season 2's story puzzles are strict: no hint, no "show the answer", no skip, and a wrong try is answered
// neutrally (puzzles/host.js) — they are solved by reasoning only.
for (const p of Object.values(PUZZLES_S2_M2)) Object.assign(p, { strict: true, noSkip: true, noSolution: true });
