import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/evolve/04-bill/session.txt?raw'

// §12.3 — the month's bill. The lab spine/evolve/04-bill applies HYPOTHETICAL round-number rates (NOT
// AWS's prices, and the frame says so in its title) to the finished shop's own quantities in production
// for 730 hours. Where the money goes is read from its rows; a one-year commitment's saving likewise.
// The surprise every first bill has is the NAT gateway: an hourly charge plus every GB it processes.
// source: https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html
const rows = session.split('\n').map((l) => l.match(/^(.+?)\s{2,}([\d.]+)\s+([\d.]+)%$/)).filter((m) => m !== null)
const total = session.match(/^total\s+([\d.]+)$/m)?.[1] ?? '?'
const saves = session.match(/saves ([\d.]+) a month \((\d+)%\)/)?.slice(1) ?? ['?', '?']
const top = rows.slice(0, 6)

export const evolveBill: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'plot', id: 'where', title: `A month in production: ${total} USD at HYPOTHETICAL rates`,
          x: { labels: top.map((m) => m[1].replace('ECS on ', '').replace(' gateway', '').replace(' PostgreSQL', '')), label: 'the six largest' },
          y: { min: 0, max: 80, step: 20, label: 'USD a month' },
          series: [{ kind: 'bar', points: top.map((m, i) => [i, Number(m[2])]), tone: 'store' }],
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'bill.py · hypothetical rates', code: trim(session) },
      ],
    },
    {
      type: 'table', id: 'levers', title: 'What moves it', tone: 'source', columns: ['lever', 'how', 'here'], rows: [
        ['commit for a year', 'a Savings Plan, reserved instances', `${saves[0]} USD a month (${saves[1]}%)`],
        { cells: ['the NAT gateway', 'S3 and ECR through endpoints, not NAT', `${rows.find((m) => m[1] === 'NAT gateway')?.[3] ?? '?'}% of the bill`], tone: 'consume' },
        ['right-size', 'measure first (§12.2), then shrink', 'tasks, the database'],
        ['switch off', 'dev at night and at weekends', 'two thirds of dev\'s hours'],
      ],
    },
  ],
}
