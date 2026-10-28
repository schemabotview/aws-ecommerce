import type { SceneModel } from '@graphlearning/graphl-flow'
import { operateEvening } from './evening'
import { operateLogs } from './logs'
import { operateAlarms } from './alarms'
import { operateTrail } from './trail'
import { operateKeys } from './keys'
import { operateWaf } from './waf'
import { operateBackup } from './backup'
import { operateIncident } from './incident'
import { operateRecovery } from './recovery'

export const operateScenes: Record<string, SceneModel> = {
  'operate-evening': operateEvening,
  'operate-logs': operateLogs,
  'operate-alarms': operateAlarms,
  'operate-trail': operateTrail,
  'operate-keys': operateKeys,
  'operate-waf': operateWaf,
  'operate-backup': operateBackup,
  'operate-incident': operateIncident,
  'operate-recovery': operateRecovery,
}
