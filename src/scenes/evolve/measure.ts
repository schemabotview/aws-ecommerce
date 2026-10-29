import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/evolve/03-knee/session.txt?raw'

// §12.2 — ◆ full scene: measuring before tuning. The lab spine/evolve/03-knee SIMULATES one task (10 ms
// a request on average, Course 6's 100 requests/s; random arrivals, seeded) at loads from 10% to 95%
// busy, and reports the median and 99th percentile. Latency does not grow in proportion to load: it
// bends sharply past ~70–80%. That knee is why the shop's scaling target is 60% (Course 6), and why a
// tuning change is judged on the p99 at the load that matters, measured, not on an average.
// source: https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf-process.html
const rows = session.split('\n').map((l) => l.match(/^\s*(\d+)%\s+(\d+) ms\s+(\d+) ms$/)).filter((m) => m !== null)
const at = (busy: number) => rows.find((m) => +m[1] === busy)
const p99 = (busy: number) => at(busy)?.[3] ?? '?'

export const evolveMeasure: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'plot', id: 'knee', title: 'One task: how long a request takes, by how busy (a simulation; dashed: the shop scales out)',
          x: { min: 0, max: 100, step: 10, label: 'busy, %' }, y: { min: 0, max: 700, step: 100, label: 'ms' },
          series: [
            { kind: 'line', points: rows.map((m) => [Number(m[1]), Number(m[3])]), label: '99th percentile', tone: 'consume' },
            { kind: 'line', points: rows.map((m) => [Number(m[1]), Number(m[2])]), label: 'median', tone: 'ingest' },
            { kind: 'segment', from: [60, 0], to: [60, 700] },
          ],
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'knee.py · a simulation', code: trim(session) },
      ],
    },
    {
      type: 'table', id: 'lessons', title: 'What the knee says', tone: 'source', columns: ['', 'from the simulation'], rows: [
        ['at 60% busy', `p99 ${p99(60)} ms: comfortable`],
        ['at 80%', `p99 ${p99(80)} ms: twice as slow for 20 points more`],
        { cells: ['at 95%', `p99 ${p99(95)} ms: the shopper notices`], tone: 'consume' },
        ['so', 'measure the p99 at peak, change one thing, measure again'],
      ],
    },
  ],
}
