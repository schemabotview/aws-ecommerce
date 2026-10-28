import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import { BUILT, SUBNETS, mapFrame } from '../map'
import session from '../../../spine/network/08-alb/session.txt?raw'

// §5.8 — a load balancer and its health checks (map frame). The ALB stands in all three public
// subnets, behind sg alb; its target group holds no target yet (the app arrives in Course 6), so
// describe-target-health is empty. The health state machine is AWS's documented behaviour, with the
// shop's own settings (10 s apart, 3 passes in, 2 failures out, 30 s draining) — not emulated.
// source: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html
const rows = terminal(session)
export const networkAlb: SceneModel = mapFrame({
  built: [...BUILT.start, 'vpc', ...SUBNETS, 'igw', 'nat-a'],
  fresh: ['alb'],
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop', code: rows, fill: true,
      show: keepLines(rows, ['$ terraform apply tfplan', 'Apply complete!', ['$ aws elbv2 describe-load-balancers', 'active'],
        ['$ aws elbv2 describe-target-health', '}']]),
    },
    {
      type: 'group', id: 'health', title: 'A target\'s health, checked every 10 s on /health', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'initial', icon: 'clock', title: 'initial', sub: 'registered', stack: true },
        { type: 'item', id: 'healthy', icon: 'check', title: 'healthy', sub: 'gets requests', stack: true },
        { type: 'item', id: 'unhealthy', icon: 'zap', title: 'unhealthy', sub: 'gets none', stack: true },
        { type: 'item', id: 'draining', icon: 'clock', title: 'draining', sub: '30 s to finish', stack: true },
      ],
    },
  ],
  edges: [
    { from: 'initial', to: 'healthy', label: '3 passes' },
    { from: 'healthy', to: 'unhealthy', label: '2 fails' },
    { from: 'unhealthy', to: 'draining', label: 'removed' },
  ],
})
