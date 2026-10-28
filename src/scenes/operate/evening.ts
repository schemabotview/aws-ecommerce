import type { SceneModel } from '@graphlearning/graphl-flow'
import burn from '../../../spine/operate/03-alarms/session.txt?raw'

// §11.1 — ◆ full scene: one slow evening. The same incident three ways. The METRIC (error rate, 5
// minutes at a time) is last night's, from §11.3's tools/burn.py output; the LOG LINE has the app's
// own format (book_shop/web.py) and is one of the made-up evening's lines (tools/evening.py, §11.2);
// the TRACE is an example, labelled — the shop has no tracing yet, and the emulator records none.
// Joined by time, they answer when, which, and where the time went.
// source: https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/implement-observability.html
const rows = burn.split('\n').map((l) => l.match(/^(\d\d:\d\d)\s+(\d+)\s+([\d.]+)%/)).filter((m) => m !== null)

export const operateEvening: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'three', bare: true, dir: 'row', children: [
        {
          type: 'plot', id: 'metric', compact: true, title: 'A metric: when, and how much',
          x: { labels: rows.map((m) => m[1]), label: '1 November' }, y: { min: 0, max: 16, step: 4, label: 'errors, %' },
          series: [{ kind: 'bar', points: rows.map((m, i) => [i, Number(m[3])]), tone: 'consume' }],
        },
        {
          type: 'group', id: 'right', bare: true, children: [
            {
              type: 'code', id: 'log', filename: 'a log line: which request', lang: 'js', tone: 'ingest',
              code: '{"method": "POST", "path": "/checkout", "status": 503}',
            },
            {
              type: 'table', id: 'trace', title: 'A trace: where the time went (an example)', tone: 'serve', columns: ['span', 'took'], rows: [
                ['load balancer', '2 ms'],
                ['app: POST /checkout', '3,041 ms'],
                ['  orders database: INSERT', '4 ms'],
                { cells: ['  payments API: charge', '3,000 ms, timed out'], tone: 'consume' },
                ['app: 503 to the shopper', '1 ms'],
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'joined', title: 'Joined by time, they answer three questions', tone: 'source', columns: ['', 'answers', 'this evening'], rows: [
        ['the metric', 'is something wrong, since when?', `errors from ${rows.find((m) => +m[2] > 0)?.[1] ?? '?'} to ${[...rows].reverse().find((m) => +m[2] > 0)?.[1] ?? '?'}`],
        ['the log line', 'which requests failed?', 'POST /checkout, 503'],
        ['the trace', 'where did the time go?', 'the payments API, 3 s timeout'],
      ],
    },
  ],
  edges: [
    { from: 'metric', to: 'log', label: 'when' },
  ],
}
