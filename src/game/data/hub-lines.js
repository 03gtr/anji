/**
 * Games-room dialogue («صالة ألعاب ريان وأنجي»), as data.
 *
 * Ryan here is «ريان — نسخة اللعب»: a playing version of himself he built into
 * the garden's laptop before he left (recorded challenges + his playing style).
 * It never claims to be live, never watches her, and never pressures her to
 * play: every invitation can be declined.
 *
 * Pools are keyed `<game>:<moment>`; `any:<moment>` is the fallback.
 * Moments: before, win (Anji won), lose (Ryan won), draw, rematch, leave,
 * record. Each entry is a short script (1–3 lines). Lines rotate (save-safe,
 * game.nextLine) so the same joke rarely repeats.
 */
const R = (t) => ({ s: 'ryanpc', t });
const S = (t, e = 'smug') => ({ s: 'snooki', e, t });

export const MOMENTS = ['before', 'win', 'lose', 'draw', 'rematch', 'leave', 'record'];
export const HUB_GAMES = ['memory', 'highcard', 'rosetrick', 'checkers', 'cardtrick'];

export const HUB_LINES = {
  /* first visit and later visits */
  'room:first': [
    [
      R('هااا، وصلتي! هاي صالة الألعاب. سوّيتها قبل ما أطلع، وخلّيت بيها نسخة مني تلعب.'),
      R('مو آني بالضبط… بس تلعب مثلي. وتخسر مثلي. أحياناً.'),
      S('لا تصدگينه. آخر مرة خسر بالداما گال الرقعة مقلوبة.', 'smug'),
      R('سنوكي، لا تفضح أسرار البطولة.'),
      R('إذا تحبين نلعب، الطاولة جاهزة. وإذا لا، الحديقة كلها إلچ. ما أزعل… هواية.'),
    ],
  ],
  'room:again': [
    [R('رجعتي! النسخة جاهزة ومشحونة. اليوم دوري أفوز… نظرياً.')],
    [R('أهلاً بالبطلة. اختاري لعبة، أو باوعي على الجوائز وارجعي للحديقة. كلّه مسموح.'), S('آني أنصح بالبسكويت. مو لعبة، بس أنصح.', 'happy')],
    [S('ريان، النسخة، لمّع الأوراق. أو أنا لحستها. واحد منا.', 'guilty')],
  ],

  /* generic */
  'any:before': [
    [R('جاهزة؟ اليوم دوري أفوز، مو كل مرة أتركچ تربحين!')],
    [R('قوانين بسيطة، وأخطاء كثيرة. من طرفي طبعاً.')],
    [R('خلّينا نلعب بنزاهة. سنوكي، ابعد عن الطاولة.'), S('آني الحكم! الحكم يگعد على الطاولة.', 'proud')],
  ],
  'any:win': [
    [R('هااا، هاي الجولة إلچ. بس لا تتعودين، أريد فرصة ثانية!')],
    [R('خسرت؟ لا، آني «سمحت للفوز يزورچ». هاي استراتيجية.'), S('هاي خسارة. سجّلتها.', 'smug')],
    [R('حلوة اللعبة. والفوز أحلى عليچ.')],
  ],
  'any:lose': [
    [R('أخيراً! سجلوا التاريخ، فزت بجولة كاملة بدون ما سنوكي يلمس الأوراق.'), S('اعتراض. چنت أراقب النزاهة.', 'dramatic')],
    [R('فزت! …خلّيني أتمتع بهاللحظة. اللحظة خلصت. ردّ؟')],
    [R('هاي الجولة إلي، بس لعبتي أحلى. صدگ.')],
  ],
  'any:draw': [
    [R('تعادل! يعني كلنا أبطال. أو كلنا لا. أختار الأولى.')],
    [S('تعادل. يعني البسكويت يتقسم… عليّ.', 'happy')],
  ],
  'any:rematch': [
    [R('مرة ثانية؟ هذا اللي كنت أتمناه. بس بدون رحمة هالمرة.')],
    [R('جولة الثأر! …ثأر مين؟ مو مهم. يلا.')],
  ],
  'any:leave': [
    [R('زين، نكمّل بعدين. الطاولة تنطر، ما تزعل.')],
    [R('روحي للحديقة. آني هنا إذا رجعتي… النسخة ما تنام.'), S('النسخة ما تنام. آني أنام. هاي ميزتي.', 'proud')],
  ],
  'any:record': [
    [R('رقم قياسي جديد! راح أعلّقه بالجوائز… جنب جوائزي القليلة.')],
    [S('رقم جديد! آني ساعدت. معنوياً.', 'proud')],
  ],

  /* per game */
  'memory:before': [[S('لعبة الذاكرة. آني أتذكر كل شي. وين دفنت العظم؟ …كل شي ثاني.', 'confused')]],
  'memory:win': [[S('ذاكرة حديد! أو ذاكرة فرو. نفس الشي.', 'happy')]],
  'highcard:before': [[R('الورقة الأعلى: ماكو تخطيط، بس حظ وأعصاب. وأعصابي حديد.')]],
  'highcard:lose': [[R('شفتي؟ الحظ يحبني. اليوم بس.')]],
  'rosetrick:before': [[R('سباق الورد: الورد الأزرق يغلب كل شي. مثل… خلّيها.'), S('مثل الكلاب البيض. كمّل.', 'smug')]],
  'rosetrick:win': [[R('لعبتيها مثل محترفة. منو علّمچ؟ …آني؟ لا، آني ما أعرف ألعب هيچ.')]],
  'rosetrick:lose': [[R('الوردة الأخيرة چانت عندي. سامحيني، الورد يحبني اليوم.')]],
  'checkers:before': [[R('الداما. الرقعة مو مقلوبة هالمرة. فحصتها ثلاث مرات.'), S('آني قلبتها مرة. للتجربة.', 'guilty')]],
  'checkers:win': [[R('خلّيتيني بلا حركات. هاي إهانة… محترمة.')]],
  'checkers:lose': [[R('فوز بالداما! سنوكي، صوّرني.'), S('ما عندي إيدين.', 'serious')]],
  'checkers:draw': [[R('أربعين حركة وماكو أكل… كأننا نتمشى على الرقعة. تعادل.')]],
  'cardtrick:before': [[S('خدعتي الكبرى! ثلاث جولات. آني خبير خدع. اسألي أي ورقة.', 'proud')]],
  'cardtrick:win': [[S('كشفتي خدعتي… كلها. هاي أول مرة. ثاني مرة اليوم.', 'dramatic')]],
  'cardtrick:lose': [[S('هاها! الخدعة نجحت! …بس عطيتچ تلميح. لأن آني طيب.', 'happy')]],
  'revenge:before': [
    [R('جولة الثأر بالداما. حضّرت خطة كاملة.'), S('وآني أكلت نص الخطة. الورقة چانت طعمها حبر.', 'guilty'), R('…نلعب بالنص الباقي.')],
  ],
};

/** Lines for a moment of a game (falls back to the generic pool). */
export function linesFor(game, moment) {
  return HUB_LINES[`${game}:${moment}`] || HUB_LINES[`any:${moment}`] || [];
}

/**
 * Pick one script from the pools of a moment, rotating through the
 * game-specific and generic pools. `next(key, size)` is game.nextLine.
 */
export function pickLines(game, moment, next = () => 0) {
  const pool = [...(HUB_LINES[`${game}:${moment}`] || []), ...(HUB_LINES[`any:${moment}`] || [])];
  if (!pool.length) return [];
  return pool[next(`${game}:${moment}`, pool.length)];
}
