/**
 * Cinematic shot lists. `art` names optional owner artwork (private-art/);
 * `scene` names a built-in SVG illustration used when that art is absent.
 */
export const CINEMATICS = {
  opening: [
    { scene: 'black', caption: 'بمكانٍ ما… بين النوم والصحو.', sfx: 'whoosh', ms: 2600 },
    { art: 'story-1-awakening', scene: 'awaken', caption: 'ريحة ورد. صوت ماي. ونسمة باردة على الوجه.', ms: 3600 },
    { art: 'world-1-garden', scene: 'gate', caption: 'وبمكانٍ قريب… بوابة انسدّت.', sfx: 'gate', ms: 3200 },
    {
      scene: 'phone',
      say: [
        { s: 'phone', t: 'لا توجد شبكة.' },
        { s: 'phone', t: 'رسالة محلية جديدة:' },
        { s: 'phone', t: '«إذا وصلتِ هنا، فالحديقة صارت تعرفچ. لا تخافين. — R»' },
        { s: 'anji', e: 'skeptical', t: 'منو R؟ … وليش موبايلي صار يحچي عراقي أحسن مني؟' },
      ],
    },
    { scene: 'roses', caption: 'والورد الأزرق… فتّح عيونه.', sfx: 'sparkle', ms: 3000 },
  ],
  // Story Pack 01. The embrace is silent: no caption, no dialogue, no tap prompt (tap still
  // advances and «تخطي» still leaves). Storyboards: docs/STORY_PACK_01.md.
  'sp1-embrace': [
    { scene: 'roads-wide', silent: true, ms: 3800 },
    { scene: 'roads-stop', silent: true, ms: 3600 },
    { scene: 'roads-near', silent: true, ms: 3400 },
    { scene: 'roads-embrace', silent: true, sfx: 'sparkle', ms: 5200 },
    { scene: 'roads-after', silent: true, ms: 3200 },
  ],
  // «من سطر صغير»: about three seconds, then back to the garden
  'sp1-montage': [
    { scene: 'code-lines', silent: true, quick: true, ms: 1000 },
    { scene: 'code-shape', silent: true, quick: true, ms: 900 },
    { scene: 'code-product', silent: true, quick: true, ms: 1100, caption: 'رسم توضيحي' },
  ],
  credits: [
    { art: 'world-8-ending', scene: 'roses', caption: 'الحديقة السرّية: سنوكي والصانع المفقود', ms: 3600 },
    { art: 'hero-anji-snooki', scene: 'awaken', caption: 'بطولة: أنجي', ms: 3200 },
    { art: 'world-4-academy', scene: 'roses', caption: 'المحقق والمساعد الوسيم: سنوكي', ms: 3200 },
    { art: 'ryan-gate', scene: 'gate', caption: 'الصانع: ريان', ms: 3200 },
    { art: 'story-5-ending', scene: 'roses', caption: 'شكراً لأنچ مشيتي بكل الحديقة 💙', ms: 4200 },
    { art: 'finale-drawing', scene: 'roses', caption: 'الباقي… مو باللعبة 💙', ms: 5200 },
  ],
};
