import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import { BUILT, SUBNETS, mapFrame } from '../map'
import session from '../../../spine/network/05-nat/session.txt?raw'

// §5.5 — the way out: a NAT gateway in public-a, and 0.0.0.0/0 → nat in the PRIVATE table. A task
// can start a connection out (to the payments API); nothing outside can start one in. One NAT in dev
// is a cost trade: if eu-west-2a fails, the private subnets lose the internet (production: one per AZ).
// source: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html
const rows = terminal(session)
export const networkNat: SceneModel = mapFrame({
  built: [...BUILT.start, 'vpc', ...SUBNETS, 'igw'],
  fresh: ['nat-a'],
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop', code: rows, fill: true,
      show: keepLines(rows, ['$ terraform apply tfplan', 'Apply complete!', ['$ python tools/which_route.py app-a', 'goes to nat'],
        ['$ python tools/which_route.py data-b', 'goes to local']]),
    },
    {
      type: 'group', id: 'who-starts', title: 'Who may START a connection', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'task', icon: 'fargate', title: 'a task, app-a', sub: 'starts: allowed', stack: true },
        { type: 'item', id: 'nat', icon: 'natgateway', title: 'NAT, public-a', sub: 'rewrites the source', stack: true },
        { type: 'item', id: 'out', icon: 'globe', title: 'the internet', sub: 'starts: no way in', stack: true },
      ],
    },
  ],
  edges: [
    { from: 'task', to: 'nat' },
    { from: 'nat', to: 'out' },
  ],
})
