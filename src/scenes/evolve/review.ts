import type { SceneModel } from '@graphlearning/graphl-flow'
import { BUILT, mapFrame2 } from '../map'

// §12.6 — ◆ full scene: a Well-Architected review (map frame). The finished map, every part the course
// built in colour and what it did not (a cache, a NAT per AZ) muted, judged against AWS's six
// pillars: for each, what the shop has (with the section that built it) and the next step. The verdicts
// are the course's own reading of its work, not a tool's.
// source: https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html
export const evolveReview: SceneModel = mapFrame2({
  built: BUILT.evolve,
  side: [
    {
      type: 'table', id: 'pillars', title: 'Six pillars, judged', tone: 'source', columns: ['pillar', 'the shop has', 'next'], rows: [
        ['operations', 'Terraform, a pipeline, alarms', 'a runbook per alarm'],
        ['security', 'roles, keys, WAF, a trail', 'GuardDuty'],
        ['reliability', '3 AZs, a queue, backups', 'a NAT per AZ'],
        ['performance', 'scaling, a CDN, a lake', 'p99 at every peak'],
        ['cost', 'tags, a budget, a bill', 'a commitment'],
        { cells: ['sustainability', 'Graviton functions', 'Graviton tasks'], tone: 'ingest' },
      ],
    },
    {
      type: 'group', id: 'next', title: 'Next, in this order', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'drill', icon: 'backup', title: 'a restore drill', sub: 'until it is done, the backups are a hope', stack: true },
        { type: 'item', id: 'nats', icon: 'natgateway', title: 'a NAT gateway per AZ', sub: 'one AZ down must not stop the tasks', stack: true },
        { type: 'item', id: 'commit', icon: 'costexplorer', title: 'a one-year commitment', sub: 'once a month of real bills says how much', stack: true },
      ],
    },
  ],
  edges: [
    { from: 'drill', to: 'nats' },
    { from: 'nats', to: 'commit' },
  ],
})
