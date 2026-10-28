import type { SceneModel } from '@graphlearning/graphl-flow'
import { dataChoose } from './choose'
import { dataCatalog } from './catalog'
import { dataUploads } from './uploads'
import { dataDatabase } from './database'
import { dataOrders } from './orders'
import { dataSecrets } from './secrets'
import { dataCarts } from './carts'
import { dataLastUnit } from './last-unit'
import { dataCache } from './cache'

export const dataScenes: Record<string, SceneModel> = {
  'data-choose': dataChoose,
  'data-catalog': dataCatalog,
  'data-uploads': dataUploads,
  'data-database': dataDatabase,
  'data-orders': dataOrders,
  'data-secrets': dataSecrets,
  'data-carts': dataCarts,
  'data-last-unit': dataLastUnit,
  'data-cache': dataCache,
}
