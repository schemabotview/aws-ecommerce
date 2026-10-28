import type { SceneModel } from '@graphlearning/graphl-flow'
import { deliverModules } from './modules'
import { deliverEnvs } from './envs'
import { deliverPipeline } from './pipeline'
import { deliverPipelineRole } from './pipeline-role'
import { deliverChecks } from './checks'
import { deliverDrift } from './drift'
import { deliverReplace } from './replace'
import { deliverRelease } from './release'

export const deliverScenes: Record<string, SceneModel> = {
  'deliver-modules': deliverModules,
  'deliver-envs': deliverEnvs,
  'deliver-pipeline': deliverPipeline,
  'deliver-pipeline-role': deliverPipelineRole,
  'deliver-checks': deliverChecks,
  'deliver-drift': deliverDrift,
  'deliver-replace': deliverReplace,
  'deliver-release': deliverRelease,
}
