import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { decoupleTree } from './files'
import code from '../../../spine/decouple/02-queue/project/book_shop/checkout.py?raw'
import session from '../../../spine/decouple/02-queue/session.txt?raw'

// §8.2 — a queue for fulfilment. checkout.py records the order, then sends OrderPlaced to an SQS
// queue and returns; a consumer receives, works, and DELETES. A receive hides the message for the
// visibility timeout (30 s); a consumer that crashes before the delete gets it back after that,
// with its receive count up by one. Emulated: moto's SQS; the 30 s pass by a typed `sleep 31`,
// which on this machine moves the frozen clock (scripts/spine.py) — the timeout then ends in moto.
// source: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
const order = session.match(/^order (\d+) placed/m)?.[1] ?? '?'
const counts = [...session.matchAll(/receive count (\d+)/g)].map((m) => m[1])

export const decoupleQueue: SceneModel = ideFrame({
  tree: decoupleTree(2, { active: 'book_shop/checkout.py', fresh: ['infra/queues.tf', 'book_shop/checkout.py', 'tools/checkout.py', 'tools/consume.py'] }),
  editor: { file: 'book_shop/checkout.py', code, show: [[lineOf(code, 'from book_shop import orders'), code.trimEnd().split('\n').length]], highlight: [lineOf(code, 'url = sqs.get_queue_url'), lineOf(code, 'sqs.send_message')] },
  session,
  keep: [['$ python -m tools.checkout', 'OrderPlaced sent'], ['received order', 'crashed before the delete'], ['$ sleep 31', 'deleted: done']],
  side: [
    {
      type: 'group', id: 'path', title: 'Checkout no longer waits for packing', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'producer', icon: 'fargate', title: 'checkout', sub: 'records, sends, answers', stack: true },
        { type: 'item', id: 'queue', icon: 'sqs', title: 'book-shop-fulfilment', sub: 'kept up to 4 days', stack: true },
        { type: 'item', id: 'consumer', icon: 'package', title: 'a worker', sub: 'receive, pack, delete', stack: true },
      ],
    },
    {
      type: 'group', id: 'clock', title: `Order ${order}'s message, by the clock`, tone: 'ingest', children: [
        { type: 'item', id: 't0', icon: 'clock', title: `0 s · receive, count ${counts[0] ?? '?'}`, sub: 'the worker crashes: no delete', stack: true },
        { type: 'item', id: 'hidden', icon: 'lock', title: '0–30 s · hidden', sub: 'in flight: a receive finds nothing', stack: true },
        { type: 'item', id: 't31', icon: 'check', title: `31 s · receive, count ${counts[1] ?? '?'}`, sub: 'packed, then deleted', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'table', id: 'promise', title: 'What the queue promises', tone: 'source', columns: ['', ''], rows: [
        ['delivery', 'at least once: maybe twice (§8.8)'],
        ['while a worker works', 'hidden from the others'],
        ['done', 'only when the worker deletes it'],
      ],
    },
  ],
  edges: [
    { from: 'producer', to: 'queue', label: 'send' },
    { from: 'queue', to: 'consumer', label: 'receive' },
    { from: 't0', to: 'hidden' },
    { from: 'hidden', to: 't31', label: 'timeout ends' },
  ],
})
