/** Exploration scenes by id. Add new locations here. */
import { GARDEN, CONSERVATORY } from './act1.js';
import { HOUSE } from './act2.js';
import { GARAGE } from './act3.js';
import { ACADEMY, SANCTUARY } from './act4.js';
import { OBSERVATORY, LIBRARY } from './act5.js';
import { CORRIDOR, LAKE } from './act6.js';
import { WORKSHOP, FINAL } from './act78.js';
import { STUDY, PASSAGE } from './side-house.js';
import { MEADOW } from './side-meadow.js';
import { GAMEROOM } from './side-gameroom.js';
import { ROADS, ROSE_CLINIC } from './sp1.js';
import { ARCHIVES, withExtras } from './sp2.js';
import { DEEP_SCENES, withDeep } from './deep.js';
import { TEAM_SCENES, withTeam } from './team.js';
import { S2_SCENES } from './s2.js';

const BASE = {
  [GARDEN.id]: GARDEN,
  [CONSERVATORY.id]: CONSERVATORY,
  [HOUSE.id]: HOUSE,
  [GARAGE.id]: GARAGE,
  [ACADEMY.id]: ACADEMY,
  [SANCTUARY.id]: SANCTUARY,
  [OBSERVATORY.id]: OBSERVATORY,
  [LIBRARY.id]: LIBRARY,
  [CORRIDOR.id]: CORRIDOR,
  [LAKE.id]: LAKE,
  [WORKSHOP.id]: WORKSHOP,
  [FINAL.id]: FINAL,
  [STUDY.id]: STUDY,
  [PASSAGE.id]: PASSAGE,
  [MEADOW.id]: MEADOW,
  [GAMEROOM.id]: GAMEROOM,
  // Story Pack 01 «الطرق اللي تتذكر»
  [ROADS.id]: ROADS,
  [ROSE_CLINIC.id]: ROSE_CLINIC,
  // Story Pack 02 «أرشيف الأسرار»
  [ARCHIVES.id]: ARCHIVES,
  // Phase 04 «الحديقة العميقة»
  ...Object.fromEntries(DEEP_SCENES.map((s) => [s.id, s])),
  // «إحنا فريق»
  ...Object.fromEntries(TEAM_SCENES.map((s) => [s.id, s])),
  // Season 2 «ملف الدائرة المغلقة», M1 (the map's third page)
  ...Object.fromEntries(S2_SCENES.map((s) => [s.id, s])),
};

// Story Pack 02 adds clues, letter fragments and trail marks to existing locations; Phase 04
// adds the deep garden's entrances and evidence
export const SCENES = Object.fromEntries(Object.entries(BASE).map(([id, scene]) => [id, withTeam(withDeep(withExtras(scene)))]));
