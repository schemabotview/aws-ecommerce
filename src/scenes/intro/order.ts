import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import { BUILT, mapFrame } from '../map'
import session from '../../../spine/intro/01-order/session.txt?raw'

// §1.1 — the finished shop takes an order (map frame). Recorded at the END of the chain (intro/01-order,
// after Course 12): the app runs here against the emulator and real PostgreSQL, serves bk-1001's page,
// takes an order with tools/checkout.py (recorded in the orders database, OrderPlaced published once),
// and tools/listeners.py shows which queues heard it — fraud-check filtered it out (under 500). It also
// fixes a real bug: the tool still named the loyalty queue by its old name (renamed in §9.7). Every
// value is read from the transcript.
// source: https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html
const rows = terminal(session)
const placed = session.match(/^order (\d+) placed, total ([\d.]+)/m)?.slice(1) ?? ['?', '?']
const heard = Object.fromEntries(session.split('\n').map((l) => l.match(/^(fulfilment|points|fraud-check)\s+(.+)$/)).filter((m) => m !== null)
  .map((m) => [m[1], m[2]]))

export const introOrder: SceneModel = mapFrame({
  built: BUILT.evolve,
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop · emulated', code: rows, fill: true,
      show: keepLines(rows, [['$ curl -s', 'currency'], ['$ python -m tools.checkout', 'fraud-check']]),
    },
    {
      type: 'group', id: 'path', title: `One order, end to end: order ${placed[0]}, ${placed[1]} GBP`, tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'page', icon: 'fargate', title: 'the page', sub: 'GET /books/bk-1001', stack: true },
        { type: 'item', id: 'order', icon: 'rds', title: 'the order', sub: 'one transaction', stack: true },
        { type: 'item', id: 'event', icon: 'sns', title: 'OrderPlaced', sub: 'published once', stack: true },
        {
          type: 'group', id: 'heard', bare: true, children: [
            { type: 'item', id: 'q-fulfil', icon: 'sqs', title: 'fulfilment', sub: heard.fulfilment === '-' ? 'nothing' : 'heard it' },
            { type: 'item', id: 'q-points', icon: 'sqs', title: 'points', sub: heard.points === '-' ? 'nothing' : 'heard it' },
            { type: 'item', id: 'q-fraud', icon: 'sqs', title: 'fraud-check', sub: heard['fraud-check'] === '-' ? 'filtered: under 500' : 'heard it', muted: heard['fraud-check'] === '-' || undefined },
          ],
        },
      ],
    },
    { type: 'note', id: 'emulated', tone: 'source', text: 'Run on this machine: the app and PostgreSQL are real; AWS is the emulator. Every course from here builds one part of this map.' },
  ],
  edges: [
    { from: 'page', to: 'order' },
    { from: 'order', to: 'event' },
    { from: 'event', to: 'q-fulfil' },
    { from: 'event', to: 'q-points' },
    { from: 'event', to: 'q-fraud' },
  ],
})
