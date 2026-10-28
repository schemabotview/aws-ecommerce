import type { SceneModel } from '@graphlearning/graphl-flow'
import { reportHistory } from './history'
import { reportExport } from './export'
import { reportCatalog } from './catalog'
import { reportQuery } from './query'
import { reportClicks } from './clicks'
import { reportChoose } from './choose'

export const reportScenes: Record<string, SceneModel> = {
  'report-history': reportHistory,
  'report-export': reportExport,
  'report-catalog': reportCatalog,
  'report-query': reportQuery,
  'report-clicks': reportClicks,
  'report-choose': reportChoose,
}
