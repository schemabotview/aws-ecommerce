import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { netTree } from './files'
import code from '../../../spine/network/03-routes/project/infra/routes.tf?raw'
import session from '../../../spine/network/03-routes/session.txt?raw'

// §5.3 — route tables. Every subnet answers to one table; a new table holds only the local route,
// so the VPC talks to itself and to nothing else. tools/which_route.py reads the REAL tables from
// the emulator and picks as the VPC router does (the router itself, and packets, are not emulated).
export const networkRoutes: SceneModel = ideFrame({
  tree: netTree(3, { active: 'infra/routes.tf', fresh: ['infra/routes.tf', 'tools/which_route.py'] }),
  editor: { file: 'infra/routes.tf', code, highlight: [13, 14, 15, 16, 17, 18, 19] },
  session,
  keep: ['$ terraform apply tfplan', 'Apply complete!', ['$ python tools/which_route.py app-a', 'goes to local'],
    ['$ python tools/which_route.py public-a', 'no route matches']],
  side: [
    {
      type: 'group', id: 'subnets', title: 'Nine subnets, two tables', tone: 'source', dir: 'row', children: [
        {
          type: 'group', id: 'who', bare: true, spread: true, children: [
            { type: 'item', id: 'pub', icon: 'publicsubnet', title: 'public-a, b, c', stack: true },
            { type: 'item', id: 'priv', icon: 'privatesubnet', title: 'app-a … data-c', sub: 'six subnets', stack: true },
            { type: 'item', id: 'island', icon: 'network', title: 'only local: an island', sub: 'nothing in or out yet; doors are routes, added on purpose', stack: true, muted: true },
          ],
        },
        {
          type: 'group', id: 'tables', bare: true, children: [
            { type: 'table', id: 'rt-public', title: 'route table: public', columns: ['destination', 'target'], rows: [['10.20.0.0/16', 'local']] },
            { type: 'table', id: 'rt-private', title: 'route table: private', columns: ['destination', 'target'], rows: [['10.20.0.0/16', 'local']] },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'picks', title: 'The router: the most specific match wins', tone: 'ingest', columns: ['from', 'to', 'route'], rows: [
        { cells: ['app-a', '10.20.20.15 (data-a)', 'local'], tone: 'ingest' },
        { cells: ['public-a', '198.51.100.7', 'none: dropped'], tone: 'consume' },
        { cells: ['data-b', '10.20.11.4 (app-b)', 'local'], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'pub', to: 'rt-public' },
    { from: 'priv', to: 'rt-private' },
  ],
})
