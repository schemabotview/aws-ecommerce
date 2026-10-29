import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/how-aws-runs/07-meters/session.txt?raw'

// §2.7 — what costs money. The lab spine/how-aws-runs/07-meters applies HYPOTHETICAL round-number rates
// (NOT AWS's prices; the frame says so) to one small server in three states: running, stopped,
// terminated. The meters are AWS's documented ones: instance time while running; the disk while it
// exists; a public IPv4 address while held; data sent out to the internet. Totals read from the lab.
// source: https://aws.amazon.com/ec2/pricing/on-demand/
const rows = session.split('\n').map((l) => l.match(/^(running all month|stopped all month|terminated)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/)).filter((m) => m !== null)

export const howMeters: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'plot', id: 'bill', title: 'One small server, one month, at HYPOTHETICAL rates',
          x: { labels: rows.map((m) => m[1].replace(' all month', '')), label: 'the server is …' }, y: { min: 0, max: 30, step: 5, label: 'USD' },
          series: [{ kind: 'bar', points: rows.map((m, i) => [i, Number(m[6])]), tone: 'store' }],
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'meters.py · hypothetical rates', code: trim(session) },
      ],
    },
    {
      type: 'table', id: 'meters', title: 'The meters, and when each one runs', tone: 'source', columns: ['meter', 'runs while', 'stopped?'], rows: [
        ['instance time', 'the instance runs', 'off'],
        { cells: ['disk (EBS)', 'the volume exists', 'still on'], tone: 'consume' },
        { cells: ['public IPv4 address', 'the address is held', 'still on'], tone: 'consume' },
        ['data out to the internet', 'bytes leave AWS', 'off'],
        ['requests (S3, APIs)', 'something calls', 'off'],
      ],
    },
  ],
}
