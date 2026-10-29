import type { SceneModel } from '@graphlearning/graphl-flow'
import { evolveCdn } from './cdn'
import { evolveMeasure } from './measure'
import { evolveBill } from './bill'
import { evolveCosts } from './costs'
import { evolveAdr } from './adr'
import { evolveReview } from './review'

export const evolveScenes: Record<string, SceneModel> = {
  'evolve-cdn': evolveCdn,
  'evolve-measure': evolveMeasure,
  'evolve-bill': evolveBill,
  'evolve-costs': evolveCosts,
  'evolve-adr': evolveAdr,
  'evolve-review': evolveReview,
}
