import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/intro/02-demand/session.txt?raw'

// §1.2 — owning against renting. The lab spine/intro/02-demand is a MODEL of one day of the shop's
// traffic (60 / 240 / 560 requests a second) against servers bought for the peak and servers rented
// hour by hour at ~60% busy (Course 6's rule). The plot and the totals are its rows, parsed.
// source: https://docs.aws.amazon.com/whitepapers/latest/aws-overview/six-advantages-of-cloud-computing.html
const rows = session.split('\n').map((l) => l.match(/^(\d\d):00\s+(\d+)\s+(\d+)\s+(\d+)$/)).filter((m) => m !== null)
const hours = session.match(/^server-hours a day: owned (\d+), rented (\d+)$/m)?.slice(1).map(Number) ?? [NaN, NaN]

export const introRenting: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'plot', id: 'day', title: 'One day: servers needed, owned and rented (a model)',
          x: { min: 0, max: 23, step: 3, label: 'hour of the day' }, y: { min: 0, max: 12, step: 2, label: 'servers' },
          series: [
            { kind: 'line', points: rows.map((m) => [Number(m[1]), Number(m[3])]), label: 'owned: bought for the peak', tone: 'consume' },
            { kind: 'line', points: rows.map((m) => [Number(m[1]), Number(m[4])]), label: 'rented: hour by hour', tone: 'ingest' },
          ],
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'demand.py · a model', code: trim(session) },
      ],
    },
    {
      type: 'table', id: 'trade', title: 'The trade', tone: 'source', columns: ['', 'owned', 'rented'], rows: [
        ['server-hours a day', String(hours[0]), String(hours[1])],
        ['paid for', 'the peak, all day, for years', 'what runs, by the hour'],
        ['a busier day than planned', 'turned away', 'more servers, in minutes'],
        { cells: ['what you give up', 'nothing: it is yours', 'control of the hardware'], tone: 'consume' },
      ],
    },
  ],
}
