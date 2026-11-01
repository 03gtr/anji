/**
 * Season 3 «أصداء الـV8», Mission 08 — «لمن يحچي السكوت» (s3-08; SEASON_3_DESIGN.md §5, P-09).
 * Her street, night. Everyone is there; so is Jalal. She answers each of his statements with the evidence that
 * answers it — and a statement can never be answered with a statement (unverified or disproved cards are on the
 * table, and never accepted). He admits the caption, and why: a warning already on his licence, fear, then a lie
 * that let him stand somewhere other than the street. Ryan names him only then.
 * «When silence speaks»: Zefiro idles; the street's sound is in layers, and she names them one by one — each fades
 * and stays faded (a listening moment that cannot be failed) — until only the two of them are left, and Ryan turns
 * the engine OFF. What is said reads the season's decisions (v8-answer, ryan-trust, sabri-reply, marius-honest, road).
 * No confession is forced; no wedding, date or promise. Jalal is fiction, and not a villain.
 */
import { GROUND } from '../../world/props.js';
import { PACK_S3 } from './constants.js';
import { zefiro, carColor } from './art.js';
import { X as STREET } from './m02-v8.js';

const F = (k) => `s3:08-${k}`;
const flag = (k) => `flag:${F(k)}`;
const OPEN = 'flag:mission:s3-07';
const GATHERED = flag('gathered');
const DEFENDED = flag('defended');
const HUSH = flag('hush');
const DONE = flag('done');
const H = (k) => flag(`h-${k}`);
const HERE = [OPEN, `!${DONE}`];
const X = { marius: 470, lama: 540, sabri: 760, jalal: 980, ryan: STREET.car - 150 };

/* ── the defence (P-09): each statement of Jalal's, answered by the evidence that answers it ── */
const B = (id, label, icon = 'note') => ({ id, label, icon });
/** (exported for the tests: the bins that are statements, never an answer) */
export const STATEMENT_BINS = ['t-jalal', 'e-clip'];
export const DEFENCE_ANSWER = { j1: 'e-receipt', j2: 'e-original', j3: 'e-keyring', j4: 'd-source', j5: 'e-noise-notice' };
const j = (id, label) => ({ id, label, note: 'جلال.', accepts: [DEFENCE_ANSWER[id]] });
const DEFENCE = {
  type: 'sort',
  title: 'كل كلمة، بدليلها',
  goal: 'جلال يگول خمس شغلات. كل وحدة، بأي دليل تنرد؟',
  intro: 'الكلام ما ينرد بكلام. بس بشي ثابت.',
  config: {
    stages: [
      {
        kind: 'sort',
        prompt: 'كل جملة من جلال: أي دليل يردها؟',
        bins: [
          B('e-receipt', 'وصل البانزينخانة ١١:٢٠'),
          B('e-original', 'التسجيل الكامل', 'mark'),
          B('e-keyring', 'ميدالية النادي «٤٧»', 'car'),
          B('d-source', 'سلسلة الرسائل', 'mark'),
          B('e-noise-notice', 'إنذار البلدية'),
          B('t-jalal', 'كلام جلال نفسه', 'mark'),
          B('e-clip', 'المقطع اللي انتشر', 'mark'),
        ],
        cards: [
          j('j1', '«آني بالبيت من ١٠:٣٠.»'),
          j('j2', '«يمكن اللي بالمقطع زفيرو. منو يعرف؟»'),
          j('j3', '«٤٧؟ هواي سيارات تنتهي بـ٤٧. شيدريچ إنها مالتي؟»'),
          j('j4', '«آني ما دزيت شي لأحد.»'),
          j('j5', '«ما أحد اشتكى ذيج الليلة. كله حچي.»'),
        ],
      },
    ],
    labels: { check: 'هذا جوابي ✔' },
  },
  success: 'خمس جمل، خمس أدلة. ولا وحدة منها كلام.',
  reward: [],
};

const SAYS = (k) => ({ s: 'narrator', t: k });
export default {
  id: 'm08',
  missions: [
    {
      id: 's3-08',
      kind: 'story',
      pack: PACK_S3,
      act: 3,
      day: 8,
      world: ['s3-street'],
      title: 'لمن يحچي السكوت',
      where: 'شارع أنجي، بالليل',
      summary: 'الكل بالشارع الليلة. وجلال هم.',
      unlock: OPEN,
      locked: 'تنفتح بعد «ثلاث طرق وحقيقة وحدة».',
      steps: [
        { done: GATHERED, world: 's3-street', text: 'ارجعي لشارعچ. الليلة الكل هناك.' },
        { done: DEFENDED, world: 's3-street', text: 'كل جملة من جلال، ردّيها بدليلها.' },
        { done: DONE, world: 's3-street', text: 'وبعدين… اسمعي.' },
      ],
      reward: ['journal:s3-silence'],
      rewardText: 'لمن يحچي السكوت',
      leadsTo: [],
    },
  ],
  evidence: {
    'd-truth': { rel: 'deduction', source: 'board', icon: 'heart', label: 'اللي صار', note: 'زفيرو حچى مرة وحدة بـ٩:٤٠، وسكت. سيارة جلال فحّطت ١١:١٠. جلال كتب الكلام تحت المقطع، وخلّى الكذبة تمشي… وگلبها لريان. وريان ما سمّاه إلا بعد الدليل.' },
  },
  case: [{ mission: 's3-08', ids: ['d-truth'] }],
  links: [
    ['d-truth', 'depends', 'd-seven'],
    ['d-truth', 'depends', 'e-original'],
    ['d-truth', 'contradicts', 't-jalal'],
  ],
  journal: {
    's3-silence': { title: 'لمن يحچي السكوت', icon: 'heart', text: 'ريان ما لگى الكلمات، فخلّى زفيرو يحچي. والليلة، طفّى المحرك. بعض الأشياء تنگال أحسن بالسكوت.' },
  },
  puzzles: { 's3-defence': DEFENCE },
  patches: {
    's3-street': {
      actors: [
        { id: 'marius', kind: 'marius', x: X.marius, facing: 1, if: HERE },
        { id: 'lama', kind: 'lama', x: X.lama, facing: 1, if: HERE },
        { id: 'sabri', kind: 'sabri', x: X.sabri, facing: 1, if: HERE },
        { id: 'jalal', kind: 'jalal', x: X.jalal, facing: -1, if: [...HERE, `!${HUSH}`] },
        { id: 'ryan', kind: 'ryan', x: X.ryan, facing: -1, if: OPEN },
      ],
      dynamic: [
        {
          x: STREET.car,
          reach: 130,
          draw(ctx, { game, t }) {
            if (!game.flag(F('idle')) || game.flag(F('engine-off'))) return;
            zefiro(ctx, STREET.car, GROUND + 18, { color: carColor(game), lights: true, running: true, driver: false, dog: true, t });
          },
        },
      ],
      triggers: [
        {
          id: 'gather',
          x1: 300,
          x2: 700,
          if: [OPEN, `!${GATHERED}`],
          run: [
            { letterbox: true },
            { camera: 800, ms: 900 },
            { all: [{ pose: 'jalal', anim: 'shrug', for: 900 }, { pose: 'marius', anim: 'cross', for: 1400 }] },
            { camera: null, ms: 400 },
            { letterbox: false },
            { say: 's3.08-gather' },
            { fx: GATHERED, quiet: true },
          ],
        },
      ],
      interact: [
        {
          id: 'jalal',
          actor: 'jalal',
          x: X.jalal,
          w: 50,
          h: 124,
          label: 'جلال',
          icon: '💬',
          if: [GATHERED, `!${HUSH}`],
          cases: [
            {
              if: `!${DEFENDED}`,
              run: [
                { if: '!seen:dlg:s3.08-jalal', then: [{ say: 's3.08-jalal' }] },
                { puzzle: 's3-defence', then: [{ say: 's3.08-admits' }, { fx: DEFENDED }, { say: 's3.08-names' }], else: [{ say: 's3.08-later' }] },
              ],
            },
            {
              run: [
                { exit: 'jalal', side: 'right', speed: 120 },
                { fx: HUSH, quiet: true },
              ],
            },
          ],
        },
        {
          id: 'ryan',
          actor: 'ryan',
          x: X.ryan,
          w: 50,
          h: 130,
          label: 'ريان',
          icon: '💬',
          if: [DEFENDED, `!${DONE}`],
          cases: [
            {
              run: [
                { if: `!${HUSH}`, then: [{ exit: 'jalal', side: 'right', speed: 120 }, { fx: HUSH, quiet: true }] },
                { letterbox: true },
                { fx: flag('idle'), quiet: true },
                { sfx: 'v8-start' },
                { wait: 1200 },
                { sfx: 'hush-start' },
                { wait: 800 },
                { letterbox: false },
                { say: 's3.08-silence' },
                { sfx: 'hush-end' },
                { fx: flag('engine-off'), quiet: true },
                { say: 's3.08-end' },
                { fx: ['ev3:d-truth', DONE] },
              ],
            },
          ],
        },
      ],
    },
  },
  dialogue: {
    's3.08-gather': [
      SAYS('(الليل. الشارع. ماريوس، ولمى، وصبري… وجلال، يدخن ويضحك ضحكة ما تطلع من القلب. وريان واگف يم زفيرو، ساكت.)'),
      { s: 'marius', e: 'thinking', t: 'يلا، أختي. الكل هنا.' },
    ],
    's3.08-jalal': [
      { s: 'jalal', e: 'smile', t: 'أنجي! سمعت صرتي محققة. شنو، تريدين تحاكميني؟', act: [{ pose: 'jalal', anim: 'shrug', for: 900 }] },
      { s: 'anji', e: 'determined', t: 'لا. أريد أرد على كل كلمة گلتها. بدليلها.' },
    ],
    's3.08-admits': [
      { s: 'jalal', e: 'worried', t: '…', act: [{ pose: 'jalal', anim: 'think', for: 1400 }] },
      { s: 'jalal', e: 'worried', t: 'زين. آني چنت. سيارتي، شارعكم، ١١:١٠. وعندي إنذار قبل على الإجازة… إذا جاني ثاني، تنسحب.' },
      { s: 'jalal', e: 'worried', t: 'شفت المقطع بتلفوني، وكتبت تحته اسم ريان. گلت… يومين وينسون. وبعدين سمعت كلام صبري، وگلبته… وحچيته لريان. حتى يبعد عن الشارع.' },
      { s: 'sabri', e: 'surprised', t: 'إنت؟! وآني گاعد ألوم لساني؟!', act: [{ jolt: 'sabri', type: 'hop' }] },
    ],
    's3.08-names': [
      { s: 'ryan', e: 'smile', t: 'چنت أعرف من سمعت محركك بالنادي. نفس الصوت اللي بالمقطع. بس ما گلت اسمك… لحد ما صار عدها دليل.' },
      { s: 'ryan', e: 'smile', t: 'جلال. روح صلّح اللي كتبته. بنفس الكروب.' },
      { s: 'jalal', e: 'worried', t: '… ماشي.', act: [{ pose: 'jalal', anim: 'shrug', for: 700 }] },
      { if: 'dec3:road=sabri', then: [{ s: 'sabri', e: 'smile', t: 'وآني أتأكد إنه يكتبها. حرف بحرف. هاي شغلتي.' }] },
      { if: 'dec3:road=lama', then: [{ s: 'lama', e: 'smirk', t: 'وخالتي هم تتأكد. هي تشوف كلشي.' }] },
      { if: 'dec3:road=marius', then: [{ s: 'marius', e: 'smirk', t: 'وصاحبي يحتفظ بالملف. للاحتياط.' }] },
    ],
    's3.08-later': [{ s: 'anji', e: 'thinking', t: 'بعد شوية. خليني أرتّب أدلتي.' }],
    's3.08-silence': [
      SAYS('(جلال يمشي. الباقين يبتعدون شوية شوية. زفيرو يشتغل… والشارع كله يحچي.)'),
      { s: 'anji', e: 'thinking', t: 'اسمع. أكو أصوات هواي.' },
      {
        s: 'anji',
        choice: [
          { if: `!${H('hum')}`, t: 'زنّة عمود الإنارة.', do: [H('hum')], then: [{ s: 'narrator', t: '(الزنّة تخفت… وتروح.)', act: [{ sfx: 'hush-hum' }] }] },
          { if: `!${H('dog')}`, t: 'كلب الجيران.', do: [H('dog')], then: [{ s: 'narrator', t: '(الكلب يسكت. يمكن نام.)', act: [{ sfx: 'hush-dog' }] }] },
          { if: `!${H('fan')}`, t: 'مروحة المخبز.', do: [H('fan')], then: [{ s: 'narrator', t: '(المروحة تبطّئ… وتوگف.)', act: [{ sfx: 'hush-fan' }] }] },
        ],
      },
      {
        s: 'anji',
        choice: [
          { if: `!${H('hum')}`, t: 'زنّة عمود الإنارة.', do: [H('hum')], then: [{ s: 'narrator', t: '(الزنّة تخفت… وتروح.)', act: [{ sfx: 'hush-hum' }] }] },
          { if: `!${H('dog')}`, t: 'كلب الجيران.', do: [H('dog')], then: [{ s: 'narrator', t: '(الكلب يسكت. يمكن نام.)', act: [{ sfx: 'hush-dog' }] }] },
          { if: `!${H('fan')}`, t: 'مروحة المخبز.', do: [H('fan')], then: [{ s: 'narrator', t: '(المروحة تبطّئ… وتوگف.)', act: [{ sfx: 'hush-fan' }] }] },
        ],
      },
      {
        s: 'anji',
        choice: [
          { if: `!${H('hum')}`, t: 'زنّة عمود الإنارة.', do: [H('hum')], then: [{ s: 'narrator', t: '(الزنّة تخفت… وتروح.)', act: [{ sfx: 'hush-hum' }] }] },
          { if: `!${H('dog')}`, t: 'كلب الجيران.', do: [H('dog')], then: [{ s: 'narrator', t: '(الكلب يسكت. يمكن نام.)', act: [{ sfx: 'hush-dog' }] }] },
          { if: `!${H('fan')}`, t: 'مروحة المخبز.', do: [H('fan')], then: [{ s: 'narrator', t: '(المروحة تبطّئ… وتوگف.)', act: [{ sfx: 'hush-fan' }] }] },
        ],
      },
      { s: 'anji', e: 'shy', t: 'باقي بس… زفيرو.', act: [{ puff: 'anji', type: 'blush', ms: 1600 }] },
      SAYS('(ريان يمد إيده للمفتاح. ويطفّي المحرك.)'),
      { s: 'narrator', t: '(سكوت.)', act: [{ sfx: 'hush-engine' }, { sfx: 'v8-off' }] },
    ],
    's3.08-end': [
      { s: 'ryan', e: 'smile', t: 'ذيج الليلة، ما لگيت الكلمات. فخليته هو يحچي.' },
      { if: 'dec3:v8-answer=wave', then: [{ s: 'anji', e: 'smile', t: 'وآني أشرتلك من الباب. وضواياتك رمشت.' }] },
      { if: 'dec3:v8-answer=walk', then: [{ s: 'anji', e: 'smile', t: 'وآني مشيتلك. وسنوكي طلع راسه أول.' }] },
      { if: 'dec3:v8-answer=text', then: [{ s: 'anji', e: 'laugh', t: 'وآني دزيتلك رسالة. وجاوبتني بغيمة.' }] },
      { if: 'dec3:ryan-trust=trust', then: [{ s: 'ryan', e: 'smile', t: 'وگلتيلي «سوا». وچان سوا.' }], else: [{ s: 'ryan', e: 'smile', t: 'وگلتي تريدين تشوفين بعينچ. وشفتي. أحسن من أي كلام مني.' }] },
      { if: 'dec3:sabri-reply=deny', then: [{ s: 'anji', e: 'shy', t: '… وذاك «مجرد صديق أخوية ماريوس»…', act: [{ puff: 'anji', type: 'blush', ms: 1800 }] }, { s: 'ryan', e: 'smile', t: 'وصلني. بنسختين. وحدة صح.' }] },
      { if: 'dec3:sabri-reply=laugh', then: [{ s: 'anji', e: 'laugh', t: 'وصبري يگول ضحكت عليك…' }, { s: 'ryan', e: 'smile', t: 'إنتِ تضحكين ويا الناس، مو عليهم. أعرف.' }] },
      { if: 'dec3:sabri-reply=confront', then: [{ s: 'anji', e: 'smirk', t: 'وصبري يگول ما أريد أسمع اسمك…' }, { s: 'ryan', e: 'smile', t: 'وهسه سمعتيه، بالسكوت.' }] },
      { if: 'dec3:marius-honest=honest', then: [{ s: 'marius', e: 'smile', t: '(من بعيد) أختي! لا تتأخرين! … وريان، تعال باچر نلعب.', act: [{ pose: 'marius', anim: 'laugh', for: 900 }] }], else: [{ s: 'marius', e: 'smirk', t: '(من بعيد) أختي! «ولا شي، شغل»، ها؟ … ريان، باچر نحچي.', act: [{ pose: 'marius', anim: 'cross', for: 900 }] }] },
      SAYS('(الشارع ساكت. بس السكوت هالمرة… يحچي.)'),
    ],
  },
};
