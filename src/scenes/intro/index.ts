import type { SceneModel } from '@graphlearning/graphl-flow'
import { introOrder } from './order'
import { introRenting } from './renting'
import { introCourses } from './courses'

export const introScenes: Record<string, SceneModel> = {
  'intro-order': introOrder,
  'intro-renting': introRenting,
  'intro-courses': introCourses,
}
