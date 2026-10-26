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

export const SCENES = {
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
};
