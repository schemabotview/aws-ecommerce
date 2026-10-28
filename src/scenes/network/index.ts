import type { SceneModel } from '@graphlearning/graphl-flow'
import { networkCidr } from './cidr'

export const networkScenes: Record<string, SceneModel> = {
  'network-cidr': networkCidr,
}
