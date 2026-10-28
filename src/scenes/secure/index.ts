import type { SceneModel } from '@graphlearning/graphl-flow'
import { securePrincipals } from './principals'
import { secureRole } from './role'
import { secureAssume } from './assume'
import { secureStatements } from './statements'
import { secureDecide } from './decide'
import { secureDenied } from './denied'
import { secureResourcePolicy } from './resource-policy'
import { secureOrg } from './org'

export const secureScenes: Record<string, SceneModel> = {
  'secure-principals': securePrincipals,
  'secure-role': secureRole,
  'secure-assume': secureAssume,
  'secure-statements': secureStatements,
  'secure-decide': secureDecide,
  'secure-denied': secureDenied,
  'secure-resource-policy': secureResourcePolicy,
  'secure-org': secureOrg,
}
