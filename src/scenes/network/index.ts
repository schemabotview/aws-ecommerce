import type { SceneModel } from '@graphlearning/graphl-flow'
import { networkCidr } from './cidr'
import { networkVpc } from './vpc'
import { networkRoutes } from './routes'
import { networkIgw } from './igw'
import { networkNat } from './nat'
import { networkFilters } from './filters'
import { networkRequest } from './request'
import { networkAlb } from './alb'
import { networkDns } from './dns'
import { networkEndpoint } from './endpoint'

export const networkScenes: Record<string, SceneModel> = {
  'network-cidr': networkCidr,
  'network-vpc': networkVpc,
  'network-routes': networkRoutes,
  'network-igw': networkIgw,
  'network-nat': networkNat,
  'network-filters': networkFilters,
  'network-request': networkRequest,
  'network-alb': networkAlb,
  'network-dns': networkDns,
  'network-endpoint': networkEndpoint,
}
