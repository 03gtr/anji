/**
 * Season 3 «أصداء الـV8», Mission 07 — «ثلاث طرق وحقيقة وحدة» (s3-07; SEASON_3_DESIGN.md §5, P-08,
 * DECISION_FLOW.md §3). Three roads to the one missing piece — the original, uncut recording:
 * - Marius: a friend's dashcam, parked on her street that night (its clock runs fast);
 * - Lama: the neighbour's camera's full log (the neighbour is her aunt);
 * - Sabri: his own phone's backup — the file exactly as Jalal sent it.
 * Earlier decisions decide WHO VOLUNTEERS and WHAT THEY ASK IN RETURN (the lines), never whether the mission can be
 * finished: every road is open from every save, and each ends in its own small strict puzzle that yields the same
 * `e-original`. The road she takes is remembered (decision `road`, read in the finale).
 * Fiction written for the game.
 */
import { PACK_S3 } from './constants.js';

const F = (k) => `s3:07-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-06';
const CHOSEN = flag('chosen');
const GOT = flag('original');
const ROAD = (v) => `dec3:road=${v}`;

const opt = (id, label) => ({ id, label });
const roadPuzzle = (title, goal, intro, first, second) => ({
  type: 'sort',
  title,
  goal,
  intro,
  config: { stages: [{ kind: 'pick', ...first }, { kind: 'pick', ...second }], labels: { check: 'هذا هو ✔' } },
  success: 'التسجيل الكامل: أربعين ثانية. وبالأخير، السيارة تمر تحت عمود الإنارة… ولوحتها تنتهي بـ٤٧.',
  reward: [],
});
// what the clip cut away (the same truth on every road): tick everything that is in the full file and not in the clip
const FULL = 'الملف الكامل: أربعين ثانية — محرك يدوّر وتايرات، وبالأخير السيارة تمر تحت عمود الإنارة، لوحتها تبين، وواحد يضحك: «صوّر صوّر!». والمقطع اللي انتشر: ثمان ثواني، تدوير وتايرات بس.';
const CUT = {
  prompt: 'شنو انقطع من المقطع اللي انتشر؟ علّمي كل اللي انقطع — وبس اللي انقطع.',
  options: [
    opt('engine', 'صوت المحرك.'),
    opt('car', 'السيارة وهي تمر تحت العمود.'),
    opt('plate', 'اللوحة.'),
    opt('laugh', 'واحد يضحك: «صوّر صوّر!».'),
    opt('tyres', 'صوت التايرات.'),
  ],
  answers: ['car', 'plate', 'laugh'],
};
const files = (list, answer) => ({ prompt: 'أي واحد؟', options: list.map(([id, label]) => opt(id, label)), answer });
/** (exported for the tests) */
export const ROADS = {
  's3-dashcam': roadPuzzle(
    'كاميرا السيارة',
    'كاميرا صاحب ماريوس تحفظ ملف لكل دقيقة. أي ملف بيه اللي صار ١١:١٠؟',
    `الكاميرا مو مضبوطة: تكّة الإنارة (١١:٠٠ بالضبط) طالعة بملفها بساعة ١١:٠٣. ${FULL}`,
    files([['f1103', 'ملف ١١:٠٣'], ['f1107', 'ملف ١١:٠٧'], ['f1110', 'ملف ١١:١٠'], ['f1111', 'ملف ١١:١١'], ['f1113', 'ملف ١١:١٣'], ['f1114', 'ملف ١١:١٤'], ['f1116', 'ملف ١١:١٦'], ['f1120', 'ملف ١١:٢٠']], 'f1113'),
    CUT,
  ),
  's3-camlog': roadPuzzle(
    'سجل الكاميرا',
    'سجل كاميرا الجيران كامل. أي حدث هو اللي انقص منه المقطع؟',
    `السجل: «حركة ٩:٢٠ (٥ ث)»، «حركة ٩:٤٠ (٣٠ ث)»، «صوت عالي ٩:٤٥ (٢٥ ث)»، «حركة ١٠:١٥ (٨ ث)»، «تكّة ١١:٠٠ (٢ ث)»، «صوت عالي ١١:١٠ (٤٠ ث)»، «حركة ١١:٢٢ (١٠ ث)»، «حركة ٦:٠٥ص (١٢ ث)». المقطع اللي انتشر: محرك ثاني، بعد تكّة الإنارة. ${FULL}`,
    files([['e920', 'حركة ٩:٢٠'], ['e940', 'حركة ٩:٤٠'], ['e945', 'صوت عالي ٩:٤٥'], ['e1015', 'حركة ١٠:١٥'], ['e1100', 'تكّة ١١:٠٠'], ['e1110', 'صوت عالي ١١:١٠'], ['e1122', 'حركة ١١:٢٢'], ['e605', 'حركة ٦:٠٥ص']], 'e1110'),
    CUT,
  ),
  's3-backup': roadPuzzle(
    'نسخة صبري',
    'بتلفون صبري ثمان نسخ من المقطع. أي وحدة مثل ما دزها جلال؟',
    `النسخ: «١٢:٠٢ص، ٤٠ ث، بلا علامة»، «١٢:٣٠ص، ٤٠ ث، مُعاد توجيهه»، «٨:١٥ص، ٨ ث، مُعاد توجيهه»، «٨:٤٠ص، ٨ ث، مُعاد توجيهه كثيراً»، «٩:١٠ص، ٨ ث، مُعاد توجيهه كثيراً»، «٩:٤٠ص، ٨ ث، مُعاد توجيهه كثيراً»، «١٠:٠٠ص، ٤ ث، مُعاد توجيهه كثيراً»، «١١:٠٠ص، ٤ ث، مُعاد توجيهه كثيراً». ${FULL}`,
    files([['v0002', '١٢:٠٢ص'], ['v0030', '١٢:٣٠ص'], ['v0815', '٨:١٥ص'], ['v0840', '٨:٤٠ص'], ['v0910', '٩:١٠ص'], ['v0940', '٩:٤٠ص'], ['v1000', '١٠:٠٠ص'], ['v1100', '١١:٠٠ص']], 'v0002'),
    CUT,
  ),
};
const solve = (puzzle, fact) => ({ puzzle, then: [{ say: 's3.07-got' }, { fx: ['ev3:e-original', `ev3:${fact}`, GOT] }], else: [{ say: 's3.07-later' }] });

export default {
  id: 'm07',
  missions: [
    {
      id: 's3-07',
      kind: 'story',
      pack: PACK_S3,
      act: 3,
      day: 7,
      world: ['s3-home', 's3-clinic', 's3-garage'],
      title: 'ثلاث طرق وحقيقة وحدة',
      where: 'غرفة أنجي، والعيادة، والنادي',
      summary: 'باقي شي واحد: التسجيل الكامل، قبل ما ينقص. وأكثر من واحد يگدر يجيبه.',
      unlock: OPEN,
      locked: 'تنفتح بعد «غرفة الحقائق السبعة».',
      steps: [
        { done: CHOSEN, world: 's3-home', text: 'منو يگدر يجيب التسجيل الكامل؟ فكري من غرفتچ.' },
        { done: GOT, world: [{ id: 's3-home', done: GOT }, { id: 's3-clinic', done: GOT }, { id: 's3-garage', done: GOT }], text: 'روحي بالطريق اللي اخترتيه.' },
      ],
      reward: ['journal:s3-roads'],
      rewardText: 'التسجيل الكامل',
      leadsTo: ['s3-08'],
    },
  ],
  evidence: {
    'e-original': { rel: 'fact', source: 'original', icon: 'mark', label: 'التسجيل الكامل', note: 'أربعين ثانية. محرك ناعم يدوّر، تايرات… وبالأخير السيارة تمر تحت العمود: لوحتها تنتهي بـ٤٧. وواحد يضحك: «صوّر صوّر!».' },
    'e-dashcam': { rel: 'fact', source: 'original', icon: 'car', label: 'كاميرا صاحب ماريوس', note: 'ساعتها مقدّمة ثلاث دقايق. ملف ١١:١٣ هو اللي صار ١١:١٠.' },
    'e-cctv-log': { rel: 'fact', source: 'original', icon: 'mark', label: 'سجل كاميرا الجيران', note: 'حدث «صوت عالي ١١:١٠» — أربعين ثانية كاملة.' },
    'e-sabri-sender': { rel: 'fact', source: 'original', icon: 'note', label: 'نسخة صبري الأولى', note: 'المقطع مثل ما وصله من جلال: ١٢:٠٢ص، أربعين ثانية، بلا علامة.' },
  },
  decisions: {
    // 07: the road she took — read at once (who goes with her) and in the finale
    road: ['marius', 'lama', 'sabri'],
  },
  case: [{ mission: 's3-07', ids: ['e-original'] }],
  journal: {
    's3-roads': { title: 'التسجيل الكامل', icon: 'mark', text: 'المقطع اللي انتشر چان مقصوص: انقطع قبل ما تبين اللوحة. بالتسجيل الكامل، السيارة تمر تحت العمود: ٤٧.' },
  },
  puzzles: ROADS,
  patches: {
    's3-home': {
      interact: [
        {
          id: 'phone',
          cases: [
            { if: [OPEN, `!${CHOSEN}`], run: [{ say: 's3.07-roads' }, { fx: CHOSEN, quiet: true }] },
          ],
        },
        {
          id: 'marius',
          cases: [{ if: [OPEN, ROAD('marius'), `!${GOT}`], run: [{ say: 's3.07-marius' }, solve('s3-dashcam', 'e-dashcam')] }],
        },
      ],
    },
    's3-clinic': {
      interact: [
        {
          id: 'lama',
          cases: [{ if: [OPEN, ROAD('lama'), `!${GOT}`], run: [{ say: 's3.07-lama' }, solve('s3-camlog', 'e-cctv-log')] }],
        },
      ],
    },
    's3-garage': {
      interact: [
        {
          id: 'sabri',
          cases: [{ if: [OPEN, ROAD('sabri'), `!${GOT}`], run: [{ say: 's3.07-sabri' }, solve('s3-backup', 'e-sabri-sender')] }],
        },
      ],
    },
  },
  dialogue: {
    's3.07-roads': [
      { s: 'anji', e: 'thinking', t: 'التسجيل الكامل. منو عنده؟' },
      // who volunteers first, and what they ask — read from earlier decisions
      { if: 'dec3:marius-honest=honest', then: [{ s: 'narrator', t: '(رسالة من ماريوس: «صاحبي چان واگف بشارعكم ذيج الليلة. عنده كاميرا بالسيارة. بس تعزميني على عشا.»)' }], else: [{ s: 'narrator', t: '(رسالة من ماريوس: «صاحبي عنده كاميرا بالسيارة. وبعدها تحچيلي كلشي. كلشي.»)' }] },
      { if: 'dec3:lama-secret=trust', then: [{ s: 'narrator', t: '(لمى: «الجيران؟ هاي خالتي! سجلها كامل يم بنتها. ولا تشكريني، احچيلي بس.»)' }], else: [{ s: 'narrator', t: '(لمى: «خالتي عدها كاميرا بشارعكم… إذا تريدين. بس هالمرة احچيلي شصاير.»)' }] },
      { if: 'dec3:sabri-reply=confront', then: [{ s: 'narrator', t: '(صبري: «أنجي… النسخة الأولى بعدها بتلفوني. خليني أصلّح اللي خربته. بلا شروط.»)' }], else: [{ s: 'narrator', t: '(صبري: «النسخة الأولى بتلفوني. بس… لا تگولين لريان إني دزيتها للكروب. ماشي؟»)' }] },
      {
        s: 'anji',
        choice: [
          { t: 'ماريوس، وكاميرا صاحبه.', do: ['dec3:road=marius'], then: [{ s: 'anji', e: 'smile', t: 'ماريوس. لاقيني بالغرفة.' }] },
          { t: 'لمى، وسجل خالتها.', do: ['dec3:road=lama'], then: [{ s: 'anji', e: 'smile', t: 'لمى. جاية للعيادة.' }] },
          { t: 'صبري، ونسخته الأولى.', do: ['dec3:road=sabri'], then: [{ s: 'anji', e: 'smirk', t: 'صبري. هالمرة لسانك يفيد. جاية للنادي.' }] },
        ],
      },
    ],
    's3.07-marius': [
      { s: 'marius', e: 'smile', t: 'خذي، ملفات صاحبي كلها. بس الكاميرا مالته… ساعتها على كيفها.', act: [{ pose: 'marius', anim: 'shrug', for: 900 }] },
      { s: 'anji', e: 'determined', t: 'الساعة تچذب. بس التكّة ما تچذب.' },
    ],
    's3.07-lama': [
      { s: 'lama', e: 'smile', t: 'خالتي دزت السجل كله. كل حركة، كل صوت. بالدقيقة.', act: [{ pose: 'lama', anim: 'point', for: 900 }] },
      { s: 'anji', e: 'determined', t: 'وبيه حدث واحد بطول أربعين ثانية.' },
    ],
    's3.07-sabri': [
      { s: 'sabri', e: 'worried', t: 'خمس نسخ. كلهن نفس المقطع… بس مو كلهن نفس الطول.', act: [{ pose: 'sabri', anim: 'handsup', for: 900 }] },
      { s: 'anji', e: 'determined', t: 'أوريك أي وحدة مثل ما دزها جلال.' },
    ],
    's3.07-got': [
      { s: 'narrator', t: '(أربعين ثانية. محرك ناعم يدوّر، تايرات… وبالأخير، السيارة تمر تحت عمود الإنارة. اللوحة تبين: …٤٧. وصوت يضحك: «صوّر صوّر!».)' },
      { s: 'anji', e: 'determined', t: 'قصّوه قبل ما تبين اللوحة. هاي مو صدفة.' },
    ],
    's3.07-later': [{ s: 'anji', e: 'thinking', t: 'بعدين. التسجيل ما راح يهرب.' }],
  },
};
