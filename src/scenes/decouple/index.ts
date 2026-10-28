import type { SceneModel } from '@graphlearning/graphl-flow'
import { decoupleSyncAsync } from './sync-async'
import { decoupleQueue } from './queue'
import { decoupleDeadLetters } from './dead-letters'
import { decoupleFunction } from './function'
import { decoupleFanout } from './fanout'
import { decoupleEvents } from './events'
import { decoupleWorkflow } from './workflow'
import { decoupleOnce } from './once'
import { decoupleChoose } from './choose'

export const decoupleScenes: Record<string, SceneModel> = {
  'decouple-sync-async': decoupleSyncAsync,
  'decouple-queue': decoupleQueue,
  'decouple-dead-letters': decoupleDeadLetters,
  'decouple-function': decoupleFunction,
  'decouple-fanout': decoupleFanout,
  'decouple-events': decoupleEvents,
  'decouple-workflow': decoupleWorkflow,
  'decouple-once': decoupleOnce,
  'decouple-choose': decoupleChoose,
}
