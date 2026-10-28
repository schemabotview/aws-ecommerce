import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, linesFrom } from '../ide'
import { netTree } from './files'
import code from '../../../spine/network/04-igw/project/infra/routes.tf?raw'
import session from '../../../spine/network/04-igw/session.txt?raw'

// §5.4 — the way in: an internet gateway, and 0.0.0.0/0 → igw in the PUBLIC table only. That
// route is what makes a subnet "public". The private table still has no way out.
const igw = linesFrom(code, 'resource "aws_internet_gateway"', 'gateway_id')
export const networkIgw: SceneModel = ideFrame({
  tree: netTree(4, { active: 'infra/routes.tf' }),
  editor: { file: 'infra/routes.tf', code, show: [[igw[0] - 3, igw.at(-1)! + 1]], highlight: igw },
  session,
  keep: ['$ terraform apply tfplan', ['$ python tools/which_route.py public-a', 'goes to igw'],
    ['$ python tools/which_route.py app-a', 'no route matches']],
  side: [
    { type: 'item', id: 'internet', icon: 'globe', title: 'the internet', sub: '198.51.100.7: a payments API', stack: true },
    { type: 'item', id: 'igw', icon: 'igw', title: 'internet gateway', sub: 'one per VPC, highly available', stack: true },
    {
      type: 'group', id: 'two', bare: true, dir: 'row', children: [
        {
          type: 'table', id: 'rt-public', title: 'public: a door', tone: 'ingest', columns: ['destination', 'target'], rows: [
            ['10.20.0.0/16', 'local'], { id: 'out', cells: ['0.0.0.0/0', 'igw'], tone: 'ingest' },
          ],
        },
        {
          type: 'table', id: 'rt-private', title: 'private: no door', tone: 'consume', columns: ['destination', 'target'], rows: [
            ['10.20.0.0/16', 'local'], { id: 'none', cells: ['anything else', 'dropped'], tone: 'consume' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'tests', title: 'which_route.py, to 198.51.100.7', tone: 'source', columns: ['from', 'matches', 'goes to'], rows: [
        { cells: ['public-a', '0.0.0.0/0', 'igw'], tone: 'ingest' },
        { cells: ['app-a', 'nothing', 'dropped'], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'public', tone: 'source', text: 'A subnet is public because its route table sends 0.0.0.0/0 to an internet gateway — nothing else. The name on the subnet is only a label.' },
  ],
  edges: [
    { from: 'internet', to: 'igw', bidirectional: true },
    { from: 'igw', to: 'rt-public.out', bidirectional: true },
  ],
})
