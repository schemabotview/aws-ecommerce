import type { SceneModel } from '@graphlearning/graphl-flow'
import { howRegions } from './regions'
import { howScopes } from './scopes'
import { howCall } from './call'
import { howAnatomy } from './anatomy'
import { howArns } from './arns'
import { howShared } from './shared'
import { howMeters } from './meters'

export const howScenes: Record<string, SceneModel> = {
  'how-regions': howRegions,
  'how-scopes': howScopes,
  'how-call': howCall,
  'how-anatomy': howAnatomy,
  'how-arns': howArns,
  'how-shared': howShared,
  'how-meters': howMeters,
}
