import type { SceneModel } from '@graphlearning/graphl-flow'
import { startAccount } from './account'
import { startProfile } from './profile'
import { startEmulator } from './emulator'
import { startScript } from './script'
import { startTerraform } from './terraform'
import { startState } from './state'
import { startRemoteState } from './remote-state'
import { startBudget } from './budget'

export const startScenes: Record<string, SceneModel> = {
  'start-account': startAccount,
  'start-profile': startProfile,
  'start-emulator': startEmulator,
  'start-script': startScript,
  'start-terraform': startTerraform,
  'start-state': startState,
  'start-remote-state': startRemoteState,
  'start-budget': startBudget,
}
