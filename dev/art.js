// Dev-only character sheet: every pose, outfit and expression side by side,
// to check the designs stay consistent. Open /dev/art.html on the dev server.
import { anjiSprite, anjiPortrait, anjiFront, anjiBack, OUTFITS, ANJI_EXPRESSIONS } from '../src/game/characters/anji.js';
import { snookiSprite, snookiPortrait, SNOOKI_EXPRESSIONS, SNOOKI_HATS } from '../src/game/characters/snooki.js';
import * as cast from '../src/game/characters/cast.js';

const out = document.getElementById('out');
const params = new URLSearchParams(location.search);
const zoom = Number(params.get('zoom')) || 1;
const only = params.get('only');
const section = (title, items) => {
  if (only && !title.toLowerCase().includes(only)) return;
  out.insertAdjacentHTML('beforeend', `<h2>${title}</h2><div class="row">${items
    .map(([label, svg, w = 90]) => `<figure><div style="width:${w * zoom}px">${svg}</div>${label}</figure>`).join('')}</div>`);
};
section('Anji poses', ['idle', 'walk', 'run', 'jump', 'fall', 'celebrate', 'surprised', 'think', 'crouch'].map((p) => [p, anjiSprite({ pose: p, t: 0.25 })]));
section('Anji views', [['front', anjiFront({})], ['side / three-quarter', anjiSprite({})], ['back', anjiBack({})], ['front gym', anjiFront({ outfit: 'sport' })], ['front evening', anjiFront({ outfit: 'evening', bow: 'sapphire' })]]);
section('Anji walk cycle', [0, 0.17, 0.33, 0.5, 0.67, 0.83].map((t) => [t, anjiSprite({ pose: 'walk', t })]));
section('Anji outfits', Object.keys(OUTFITS).map((o) => [o, anjiSprite({ outfit: o })]));
section('Anji portraits', ANJI_EXPRESSIONS.map((e) => [e, anjiPortrait({ expr: e }), 120]));
section('Snooki poses', ['idle', 'walk', 'run', 'sit', 'sniff', 'excited', 'confused', 'sleep', 'jump', 'bark', 'wag', 'innocent', 'stubborn', 'celebrate'].map((p) => [p, snookiSprite({ pose: p, t: 0.25 }), 130]));
section('Snooki hats', Object.keys(SNOOKI_HATS).map((h) => [h, snookiSprite({ hat: h }), 130]));
section('Snooki portraits', SNOOKI_EXPRESSIONS.map((e) => [e, snookiPortrait({ expr: e }), 120]));
if (cast.CAST) section('Cast', Object.entries(cast.CAST).map(([k, c]) => [k, c.portrait({}), 120]));
if (cast.ryanView) section('Ryan views', cast.RYAN_VIEWS.map((v) => [v, cast.ryanView(v), v === 'turn' ? 120 : 90]));
if (cast.MUNTHER_EXPRESSIONS) section('Uncle Munther', cast.MUNTHER_EXPRESSIONS.map((e) => [e, cast.CAST.munther.portrait({ expr: e }), 120]));
if (cast.ryanSprite) section('Ryan', [['back', cast.ryanSprite({})], ['walk', cast.ryanSprite({ pose: 'walk', t: 0.25 })], ['shadow', cast.ryanSprite({ shadow: true })]]);

// Story Pack 01: the white husky and the cinematic shots (?only=pack, ?zoom=2)
import { HUSKY_LOOK } from '../src/game/characters/sprites.js';
import { SP1_SCENES } from '../src/game/art/sp1-scenes.js';
section('Pack husky', ['idle', 'walk', 'sit', 'excited', 'wag', 'celebrate'].map((p) => [p, snookiSprite({ ...HUSKY_LOOK, pose: p, t: 0.25 }), 130]));
const cosmeticsOnly = { state: { cosmetics: {} } };
section('Pack shots', Object.entries(SP1_SCENES).map(([k, draw], i) => [k, draw(cosmeticsOnly, `dev${i}`), 360]));
