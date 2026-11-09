import type { SceneModel } from '@graphlearning/graphl-flow'
import { terminalRows } from '../ide'
import { BUILT, mapFrame2 } from '../map'
import session from '../../../spine/decouple/05-fanout/session.txt?raw'

// §8.5 — fan-out (map frame). checkout publishes OrderPlaced ONCE to the SNS topic book-shop-orders;
// three SQS queues subscribe with raw delivery; fraud-check's filter policy (message body scope)
// passes totals ≥ 500 only. What each queue received is read from tools/listeners.py's output (it
// only looks: visibility 0). Emulated: moto's SNS delivers to the queues and applies the filter.
// source: https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html
const term = terminalRows(session, ['Plan: ', 'Apply complete!', ['$ python -m tools.checkout c-20', 'published'],
        ['$ python -m tools.checkout c-21', 'published'], ['$ python -m tools.listeners', 'fraud-check']])
const heard = Object.fromEntries(session.split('\n').filter((l) => /^(fulfilment|loyalty|fraud-check) /.test(l))
  .map((l) => [l.split(' ')[0], l.slice(12).trim()]))

export const decoupleFanout: SceneModel = mapFrame2({
  built: [...BUILT.data, 'queue', 'fulfil'],
  fresh: ['topic'],
  open: ['books', 'checkout', 'reports'],
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop · emulated', code: term.rows, show: term.tshow, fill: true,
    },
    {
      type: 'group', id: 'fan', title: 'One OrderPlaced, three copies', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'topic-x', icon: 'sns', title: 'book-shop-orders', sub: 'published once', stack: true },
        {
          type: 'group', id: 'subs', bare: true, children: [
            { type: 'item', id: 'q-fulfil', icon: 'sqs', title: 'fulfilment', sub: heard.fulfilment ?? '?' },
            { type: 'item', id: 'q-loyalty', icon: 'sqs', title: 'loyalty', sub: heard.loyalty ?? '?' },
            { type: 'item', id: 'q-fraud', icon: 'sqs', title: 'fraud-check · total ≥ 500', sub: heard['fraud-check'] ?? '?', tone: 'consume' },
          ],
        },
      ],
    },
  ],
  edges: [
    { from: 'topic-x', to: 'q-fulfil' },
    { from: 'topic-x', to: 'q-loyalty' },
    { from: 'topic-x', to: 'q-fraud' },
  ],
})
