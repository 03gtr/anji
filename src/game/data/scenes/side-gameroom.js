/**
 * V3 location: «صالة ألعاب ريان وأنجي» — a cozy room in the house. The card
 * table opens every table game; the checkers board has a sleepy Snooki on
 * it; two boards hold the activities and the pranks; the laptop holds
 * «ريان — نسخة اللعب» (a recorded playing version, never live); the trophy
 * shelf keeps records and the replay gallery. Useful before and after the
 * main story; nothing here is required to finish it.
 */
import { GROUND } from '../../world/props.js';
import { pickLines } from '../hub-lines.js';
import { openGamesTable, openBoard, openTrophies, activityById, dailyChallenge } from '../../ui/hub.js';

const lines = (app, key) => pickLines('room', key, (k, n) => app.game.nextLine(k, n));

/** Open a panel, then run what she picked (inside the same cutscene). */
const tableRun = async (api) => {
  const id = await openGamesTable(api.app);
  if (id) await api.run([{ game: id }]);
};
const boardRun = (kind) => async (api) => {
  const id = await openBoard(api.app, kind);
  const a = id && activityById(kind, id);
  if (a) await api.run(a.run);
};
const NAMES = { memory: 'الذاكرة', highcard: 'الورقة الأعلى', rosetrick: 'سباق الورد', checkers: 'الداما', cardtrick: 'خدعة سنوكي' };
const LEVELS = { easy: 'سهلة', normal: 'عادية', hard: 'صعبة' };

export const GAMEROOM = {
  id: 'gameroom',
  title: 'صالة ألعاب ريان وأنجي',
  theme: 'gameroom',
  music: 'warm',
  width: 1560,
  spawn: 140,
  seed: 83,
  props: [
    { type: 'window', x: 230, y: 56, w: 60, h: 80 },
    { type: 'rug', x: 640, w: 170, color: '#5b1f34' },
  ],
  platforms: [{ x: 960, y: 196, w: 70, hidden: true }],
  items: [{ id: 'star.gameroom.1', x: 990, y: 92 }],
  dynamic: [
    { x: 330, reach: 80, draw: (ctx, { P, game }) => P.trophyShelf(ctx, 330, 70, { medals: Object.values(game.state.records).filter((r) => r.medal).length }) },
    { x: 520, reach: 120, draw: (ctx, { P, t }) => P.cardTable(ctx, 520, GROUND + 2, t) },
    { x: 600, reach: 60, draw: (ctx, { P, t, world }) => P.roseLamp(ctx, 610, GROUND + 2, t, world.reduced) },
    { x: 780, reach: 90, draw: (ctx, { P, game, t, world }) => P.checkersTable(ctx, 780, GROUND + 2, { snooki: !game.flag('gameroom-snooki-awake'), t, reduced: world.reduced }) },
    { x: 990, reach: 70, draw: (ctx, { P }) => P.gameShelf(ctx, 990, GROUND + 2) },
    { x: 1150, reach: 60, draw: (ctx, { P }) => P.corkBoard(ctx, 1150, 70, 'heart') },
    { x: 1270, reach: 60, draw: (ctx, { P }) => P.corkBoard(ctx, 1270, 70, 'paw') },
    { x: 1420, reach: 100, draw: (ctx, { P, t }) => P.ryanLaptop(ctx, 1420, GROUND + 2, t) },
  ],
  interact: [
    {
      id: 'trophies',
      x: 330,
      w: 80,
      h: 200,
      label: 'رف الجوائز',
      icon: '🏆',
      run: [
        async (api) => {
          const pick = await openTrophies(api.app);
          if (pick?.replay === 'drawing') await api.run([{ drawing: { revisit: true } }]);
          else if (pick?.replay) await api.run([{ cine: pick.replay }]);
        },
      ],
    },
    { id: 'table', x: 520, w: 110, h: 120, label: 'طاولة الألعاب', icon: '🃏', run: [tableRun] },
    {
      id: 'checkers',
      x: 780,
      w: 90,
      h: 110,
      label: 'رقعة الداما',
      icon: '♟',
      cases: [
        { if: 'flag:gameroom-snooki-awake', run: [{ game: 'checkers' }] },
        {
          run: [
            { say: [{ s: 'snooki', e: 'sleepy', t: 'خمس دقايق بس… الرقعة دافية…' }, { s: 'anji', e: 'smirk', t: 'سنوكي. إنت نايم على الداما.' }, { s: 'snooki', e: 'innocent', t: 'آني أحرس القطع. من فوق.' }] },
            { fx: 'flag:gameroom-snooki-awake' },
            { game: 'checkers' },
          ],
        },
      ],
    },
    { id: 'shelf', x: 990, w: 70, h: 160, label: 'رف الألعاب', icon: '📦', run: [tableRun] },
    { id: 'activities', x: 1150, w: 70, h: 180, label: 'لوح الأنشطة', icon: '💙', run: [boardRun('activities')] },
    { id: 'pranks', x: 1270, w: 70, h: 180, label: 'لوح المقالب', icon: '🐾', run: [boardRun('pranks')] },
    {
      id: 'laptop',
      x: 1420,
      w: 90,
      h: 130,
      label: 'لابتوب ريان',
      icon: '💻',
      run: [
        (api) => api.run([{ say: lines(api.app, 'again') }]),
        async (api) => {
          const d = dailyChallenge();
          await api.run([
            {
              say: [
                { s: 'ryanpc', t: `تحدي اليوم (اختياري، بدون ضغط): ${NAMES[d.game]} — ${LEVELS[d.difficulty]}.` },
                {
                  s: 'anji',
                  e: 'smile',
                  choice: [
                    { t: 'يلا نلعبه', do: 'flag:daily-accept', then: [] },
                    { t: 'بعدين', then: [{ s: 'ryanpc', t: 'ولا يهمچ. التحدي ما يهرب.' }] },
                  ],
                },
              ],
            },
            {
              if: 'flag:daily-accept',
              then: [{ fx: '!flag:daily-accept' }, { game: d.game, options: { difficulty: d.difficulty, seed: d.seed }, then: [(a) => a.app.game.setDaily(d.day)] }],
            },
          ]);
        },
      ],
    },
  ],
  triggers: [
    {
      id: 'enter',
      x1: 160,
      x2: 300,
      if: '!flag:gameroom-entered',
      run: [{ camera: 1420, ms: 900 }, (api) => api.run([{ say: lines(api.app, 'first') }]), { fx: ['flag:gameroom-entered', 'journal:gameroom'] }],
    },
  ],
  exits: [{ side: 'left', to: 'house', spawn: 700 }],
  ambient: [
    { t: 'الأوراق تحب سنوكي. هو يحب ياكل زواياها. علاقة معقدة.' },
    { t: 'الداما لعبة نبلاء. والنبلاء يناموا على الرقعة. معلومة.' },
    { t: 'لابتوب ريان يطلع أصوات. لا تخافين، هاي «نسخة اللعب». مو ريان. نفس الغرور بس.' },
  ],
};
