/**
 * Season 2 design graph: missions, evidence, hypotheses (DESIGN DATA, not game code).
 * `node docs/season-2/validate-graph.mjs` checks it for cycles, unreachable missions,
 * impossible prerequisites and orphaned evidence. During implementation this data moves
 * into src/game/data/ and the same checks become a content test.
 *
 * requires: mission ids that must be complete ({ any: [...], n } = at least n of them)
 * needs:    evidence ids the mission's puzzle/board uses (must be produced earlier)
 * yields:   evidence ids the mission produces
 */

// reliability: fact (observed, checkable) · claim (what someone says) · deduction (concluded)
export const EVIDENCE = {
  'e-register': { kind: 'document', rel: 'fact', label: 'سجل الحديقة: صفحة ليلة الفوانيس مگطوعة' },
  'e-copy': { kind: 'document', rel: 'claim', label: 'نسخة لمى: ثمان أسماء' },
  'e-count': { kind: 'observation', rel: 'fact', label: 'سبع فوانيس معلّگة بالشجرة' },
  'e-blank': { kind: 'object', rel: 'fact', label: 'بطاقة أمنية فارغة' },
  'e-moved': { kind: 'object', rel: 'fact', label: 'بطاقة ريان بفانوس ربيع' },
  'e-note': { kind: 'document', rel: 'fact', label: 'ورقة بلا توقيع: «إذا أكو سر، أنجي تستاهل تعرفه»' },
  'e-whisper': { kind: 'testimony', rel: 'claim', label: '«ريان دا يخبي شي عن أنجي»' },
  'e-wax': { kind: 'trace', rel: 'fact', label: 'الشمع: البطاقة انتقلت لفانوس مضوي' },
  't-rabi': { kind: 'testimony', rel: 'claim', label: 'ربيع: «نقلتها حتى لا تضيع بالظلمة»' },
  'h-rabi': { kind: 'sample', rel: 'fact', label: 'خط ربيع' },
  't-lama': { kind: 'testimony', rel: 'claim', label: 'لمى: «سمعت إن ريان يخبي شي»' },
  'e-copy-diff': { kind: 'deduction', rel: 'deduction', label: 'النسخة تحسب سنوكي ضيف' },
  'h-lama': { kind: 'sample', rel: 'fact', label: 'خط لمى' },
  't-sabri': { kind: 'testimony', rel: 'claim', label: 'صبري: «ريان راح للعيادة بالسر» (كلمات صحيحة)' },
  'e-receipt': { kind: 'document', rel: 'fact', label: 'وصل محل الورد والحلويات' },
  'h-sabri': { kind: 'sample', rel: 'fact', label: 'خط صبري' },
  'e-drift': { kind: 'trace', rel: 'fact', label: 'ساعة الحديقة متأخرة ساعة' },
  't-jojo': { kind: 'testimony', rel: 'claim', label: 'العم جوجو: ما شاف الساعة التسعة' },
  'h-jojo': { kind: 'sample', rel: 'fact', label: 'خط العم جوجو' },
  'e-imprint': { kind: 'trace', rel: 'fact', label: 'أثر الضغط على البطاقة الفارغة' },
  't-sister': { kind: 'testimony', rel: 'claim', label: 'أخت أنجي: جواب ناقص، وسؤال رفضت تجاوبه' },
  'h-sister': { kind: 'sample', rel: 'fact', label: 'خط أخت أنجي' },
  'd-elim': { kind: 'deduction', rel: 'deduction', label: 'الورقة مو بخط ثلاثة من الخمسة' },
  'e-oil': { kind: 'trace', rel: 'fact', label: 'درب الشمع = طريق فانوس الزيت مال العم جوجو' },
  'e-time-fix': { kind: 'deduction', rel: 'deduction', label: 'ربيع ما چان بالأرشيف وقت انگطعت الصفحة' },
  'e-versions': { kind: 'document', rel: 'claim', label: 'ثلاث نسخ من نفس الجملة' },
  'e-labels': { kind: 'deduction', rel: 'deduction', label: 'كل بطاقة: حقيقة، كلام، لو رأي' },
  'e-page': { kind: 'object', rel: 'fact', label: 'الصفحة المگطوعة… بيها آثار سنون' },
  'e-wrapper': { kind: 'object', rel: 'fact', label: 'ورقة حلويات ريان' },
  'e-surprise': { kind: 'observation', rel: 'fact', label: 'مكان مفاجأة ريان' },
  'e-loft': { kind: 'object', rel: 'fact', label: 'الفانوس الثامن: فانوس ريان المطفي' },
  'd-chain': { kind: 'deduction', rel: 'deduction', label: 'سلسلة الكلام: صبري ← لمى ← الأخت ← الورقة' },
  'd-timeline': { kind: 'deduction', rel: 'deduction', label: 'الليلة بالترتيب الصحيح' },
  'd-case': { kind: 'deduction', rel: 'deduction', label: 'الدائرة المغلقة: كل واحد شاف جزء' },
};

export const HYPOTHESES = {
  A: { title: 'واحد خرّب الليلة عن قصد', supports: ['e-blank', 'e-moved', 'e-note', 'e-register'], contradicts: ['e-wax', 'e-page', 'e-oil', 'e-time-fix'], outcome: 'broken' },
  B: { title: 'ريان يخبي شي يأذي أنجي', supports: ['e-whisper', 't-lama', 't-sabri'], contradicts: ['e-receipt', 'e-wrapper', 'e-loft'], outcome: 'broken (the secret is real, the conclusion was wrong)' },
  C: { title: 'الساعة غلطت الكل', supports: ['e-drift', 'e-copy-diff', 'e-time-fix'], contradicts: ['e-note', 'e-imprint'], outcome: 'partly true: merged into D' },
  D: { title: 'الدائرة المغلقة: سلسلة أخطاء صغيرة وفعلين مقصودين بنية طيبة', supports: ['d-chain', 'd-timeline', 'e-page', 'e-imprint', 'e-loft'], contradicts: [], outcome: 'kept, with one thing left open by choice' },
};

const W = ['s2-05', 's2-06', 's2-07', 's2-08', 's2-09'];

export const MISSIONS = [
  // Act I — The Unfinished Record (days 1–4)
  { id: 's2-01', act: 1, day: 1, requires: [], needs: [], yields: ['e-register', 'e-copy'], min: [20, 30] },
  { id: 's2-02', act: 1, day: 2, requires: ['s2-01'], needs: ['e-copy'], yields: ['e-count', 'e-blank', 'e-moved'], min: [30, 40] },
  { id: 's2-03', act: 1, day: 3, requires: ['s2-02'], needs: [], yields: ['e-note', 'e-whisper'], min: [20, 30] },
  { id: 's2-04', act: 1, day: 4, requires: ['s2-03'], needs: ['e-register', 'e-blank', 'e-moved', 'e-note', 'e-whisper'], yields: [], min: [25, 35] },
  // Act II — Five Perspectives (days 5–12), witnesses in any order
  { id: 's2-05', act: 2, day: 5, requires: ['s2-04'], needs: ['e-moved'], yields: ['e-wax', 't-rabi', 'h-rabi'], min: [35, 45] },
  { id: 's2-06', act: 2, day: 6, requires: ['s2-04'], needs: ['e-copy', 'e-count'], yields: ['t-lama', 'e-copy-diff', 'h-lama'], min: [35, 45] },
  { id: 's2-07', act: 2, day: 7, requires: ['s2-04'], needs: ['e-whisper'], yields: ['t-sabri', 'e-receipt', 'h-sabri'], min: [30, 40] },
  { id: 's2-08', act: 2, day: 8, requires: ['s2-04'], needs: ['e-register'], yields: ['e-drift', 't-jojo', 'h-jojo'], min: [40, 50] },
  { id: 's2-09', act: 2, day: 9, requires: ['s2-04'], needs: ['e-blank'], yields: ['e-imprint', 't-sister', 'h-sister'], min: [40, 50] },
  { id: 's2-10', act: 2, day: 10, requires: ['s2-04', { any: W, n: 3 }], needs: ['e-note'], needsAny: { of: ['h-rabi', 'h-lama', 'h-sabri', 'h-jojo', 'h-sister'], n: 3 }, yields: ['d-elim'], min: [25, 35] },
  { id: 's2-11', act: 2, day: 12, requires: [...W, 's2-10'], needs: [], yields: [], min: [25, 35] },
  // Act III — The False Trails (days 13–17)
  { id: 's2-12', act: 3, day: 13, requires: ['s2-11'], needs: ['e-wax', 't-jojo'], yields: ['e-oil'], min: [35, 45] },
  { id: 's2-13', act: 3, day: 14, requires: ['s2-11'], needs: ['e-drift', 't-rabi', 'e-register'], yields: ['e-time-fix'], min: [30, 40] },
  { id: 's2-14', act: 3, day: 15, requires: ['s2-11'], needs: ['t-sabri', 't-lama', 'e-whisper'], yields: ['e-versions'], min: [35, 45] },
  { id: 's2-15', act: 3, day: 15, requires: ['s2-11'], needs: [], yields: [], min: [20, 30], note: 'the accusation choice (optional to accuse)' },
  { id: 's2-16', act: 3, day: 16, requires: ['s2-12', 's2-13', 's2-14', 's2-15'], needs: ['e-oil', 'e-time-fix', 'e-receipt'], yields: [], min: [25, 35], note: 'midpoint reversal: A and B start to break' },
  { id: 's2-17', act: 3, day: 17, requires: ['s2-16'], needs: ['e-versions'], yields: ['e-labels'], min: [20, 30] },
  // Act IV — The Dogs Know the Way (days 18–21)
  { id: 's2-18', act: 4, day: 18, requires: ['s2-17'], needs: [], yields: [], min: [35, 45] },
  { id: 's2-19', act: 4, day: 19, requires: ['s2-18'], needs: [], yields: ['e-page', 'e-wrapper'], min: [35, 45], note: 'husky route' },
  { id: 's2-20', act: 4, day: 20, requires: ['s2-18'], needs: [], yields: ['e-surprise'], min: [35, 45], note: 'Snooky route' },
  { id: 's2-21', act: 4, day: 21, requires: ['s2-19', 's2-20'], needs: ['e-wrapper', 'e-surprise'], yields: ['e-loft'], min: [40, 50] },
  // Act V — The Closed Circle (days 22–28)
  { id: 's2-22', act: 5, day: 22, requires: ['s2-21'], needs: ['e-page', 'e-blank', 'e-moved'], yields: [], min: [30, 40] },
  { id: 's2-23', act: 5, day: 23, requires: ['s2-22'], needs: ['e-versions', 'd-elim', 'e-imprint', 'h-sister'], yields: ['d-chain'], min: [35, 45] },
  { id: 's2-24', act: 5, day: 24, requires: ['s2-22'], needs: ['e-drift', 'e-oil', 'e-time-fix', 'e-page'], yields: ['d-timeline'], min: [35, 45] },
  { id: 's2-25', act: 5, day: 25, requires: ['s2-23', 's2-24'], needs: ['d-chain', 'd-timeline', 'e-loft', 'e-labels'], yields: ['d-case'], min: [40, 50] },
  { id: 's2-26', act: 5, day: 26, requires: ['s2-25'], needs: ['d-case'], yields: [], min: [35, 45] },
  { id: 's2-27', act: 5, day: 27, requires: ['s2-26'], needs: ['e-imprint', 't-sister'], yields: [], min: [25, 35] },
  { id: 's2-28', act: 5, day: 28, requires: ['s2-26'], needs: ['t-jojo', 'd-timeline'], yields: [], min: [20, 30] },
  // Act VI — The Garden That Never Sleeps (days 29–30)
  { id: 's2-29', act: 6, day: 29, requires: ['s2-27', 's2-28'], needs: ['e-loft'], yields: [], min: [35, 45] },
  { id: 's2-30', act: 6, day: 30, requires: ['s2-29'], needs: [], yields: [], min: [15, 25] },
];

// Release milestones (owner-approved: three staged releases). Each ends at its terminal mission,
// which every other main mission of the milestone leads to, so a milestone never stops mid-thread.
export const MILESTONES = [
  { id: 'M1', acts: [1, 2], terminal: 's2-11', next: 'الخيوط الكاذبة' },
  { id: 'M2', acts: [3, 4], terminal: 's2-21', next: 'الدائرة المغلقة' },
  { id: 'M3', acts: [5, 6], terminal: 's2-30', next: null },
];
export const milestoneOf = (m) => m.ms ?? MILESTONES.find((x) => x.acts.includes(m.act)).id;

// Optional content: never yields evidence a main mission or hypothesis requires.
export const OPTIONAL = [
  { id: 'o-lanterns', ms: 'M1', requires: ['s2-02'], yields: [], min: [15, 25], what: 'lantern workshop (reuses the gift workshop)' },
  { id: 'o-training', ms: 'M1', requires: ['s2-03'], yields: [], min: [20, 30], what: 'dog training: husky scouting course, Snooky stay drill' },
  { id: 'o-prank', ms: 'M1', requires: ['s2-03'], yields: [], min: [15, 25], what: 'prank exchange over Ryan’s formal notebook' },
  { id: 'o-duel', ms: 'M1', requires: ['s2-04'], yields: [], min: [20, 40], what: 'puzzle duel Anji vs Ryan (replayable)' },
  { id: 'o-memories', ms: 'M1', requires: ['s2-01'], yields: [], min: [20, 30], what: 'memory archive (canon memories marked apart from invented ones)' },
  { id: 'o-outing', ms: 'M1', requires: ['s2-11'], yields: [], min: [25, 40], what: 'Anji picks an outing; Ryan responds' },
  { id: 'o-apology', ms: 'M2', requires: ['s2-15'], when: 'decision accuse = early', yields: [], min: [10, 15], what: 'repair after an early accusation' },
  { id: 'o-challenge', ms: 'M3', requires: ['s2-30'], yields: [], min: [45, 90], what: 'post-campaign cipher of the register' },
];
