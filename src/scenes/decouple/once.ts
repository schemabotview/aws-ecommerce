import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { decoupleTree } from './files'
import code from '../../../spine/decouple/08-once/project/functions/fulfil/handler.py?raw'
import session from '../../../spine/decouple/08-once/session.txt?raw'

// §8.8 — doing it exactly once. SQS standard delivers at least once; the fulfil function claims
// `fulfil#<order>` in DynamoDB with attribute_not_exists before packing, so a second delivery is
// skipped (and reported done, so it is deleted). Order 12 is sent twice by hand. Emulated: moto's
// DynamoDB applies the condition; the poller is tools/poll.py, as in §8.4. What was packed and
// skipped is read from the transcript.
// source: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html
// source: https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html
const packed = [...session.matchAll(/^\{"packed": (\d+)/gm)].map((m) => m[1])
const skipped = [...session.matchAll(/^\{"duplicate": (\d+)/gm)].map((m) => m[1])
const keys = session.split('\n').find((l) => /^fulfil#\d+/.test(l))?.split('\t') ?? []

export const decoupleOnce: SceneModel = ideFrame({
  tree: decoupleTree(8, { active: 'functions/fulfil/handler.py', fresh: ['functions/fulfil/handler.py', 'events/order-12.json'] }),
  editor: { file: 'functions/fulfil/handler.py', code, show: [[lineOf(code, 'def claim'), lineOf(code, 'return False')],
    [lineOf(code, 'if not claim('), lineOf(code, 'print(json.dumps({"packed"')]],
    highlight: [lineOf(code, 'ConditionExpression'), lineOf(code, 'if not claim(')] },
  session,
  keep: [['$ for copy in 1 2', '--query MessageId; done'], ['$ python -m tools.poll', 'deleted ']],
  side: [
    {
      type: 'group', id: 'twice', title: 'Order 12, delivered twice', tone: 'source', children: [
        {
          type: 'group', id: 'copies', bare: true, dir: 'row', children: [
            { type: 'item', id: 'd1', icon: 'sqs', title: 'delivery 1', sub: 'order 12', stack: true },
            { type: 'item', id: 'd2', icon: 'sqs', title: 'delivery 2', sub: 'the same order 12', stack: true },
          ],
        },
        { type: 'item', id: 'claim', icon: 'dynamodb', title: 'claim fulfil#12', sub: 'write only if the key is new', stack: true },
        {
          type: 'group', id: 'outcomes', bare: true, dir: 'row', children: [
            { type: 'item', id: 'won', icon: 'package', title: 'first: packed', sub: 'the key is written', stack: true, tone: 'ingest' },
            { type: 'item', id: 'dup', icon: 'check', title: 'second: skipped', sub: 'key taken: done, deleted', stack: true, tone: 'consume' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'result', title: 'This run', tone: 'ingest', columns: ['', ''], rows: [
        ['packed', packed.map((o) => `order ${o}`).join(', ')],
        ['skipped as duplicates', skipped.map((o) => `order ${o}`).join(', ') || '-'],
        ['keys in the table', keys.join(', ')],
        ['a skipped copy', 'reported done: deleted, not retried'],
      ],
    },
    { type: 'note', id: 'atomic', tone: 'source', text: 'The condition is checked and the key written in one step: two copies arriving at the same moment cannot both win.' },
  ],
  edges: [
    { from: 'd1', to: 'claim' },
    { from: 'd2', to: 'claim' },
    { from: 'claim', to: 'won' },
    { from: 'claim', to: 'dup' },
  ],
})
