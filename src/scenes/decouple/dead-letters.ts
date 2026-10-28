import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { decoupleTree } from './files'
import code from '../../../spine/decouple/03-dead-letters/project/infra/queues.tf?raw'
import session from '../../../spine/decouple/03-dead-letters/session.txt?raw'

// §8.3 — when a message keeps failing. A redrive policy on the fulfilment queue: a message received
// maxReceiveCount (3) times and never deleted moves to the dead-letter queue on the next receive. Order
// 999 has no books, so no retry can pack it. Emulated: moto's SQS applies the redrive policy on
// receive, as SQS does; the 31 s waits are typed `sleep`s that move the machine's frozen clock.
// source: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html
const lines = session.split('\n')
const sent = lines[lines.findIndex((l) => l.includes('--message-body')) + 1]

export const decoupleDeadLetters: SceneModel = ideFrame({
  tree: decoupleTree(3, { active: 'infra/queues.tf', fresh: ['infra/queues.tf', 'tools/consume.py'] }),
  editor: { file: 'infra/queues.tf', code, show: [[lineOf(code, 'resource "aws_sqs_queue" "fulfilment"'), lineOf(code, 'message_retention_seconds = 1209600') + 1]], highlight: linesFrom(code, 'redrive_policy = jsonencode', 'maxReceiveCount') },
  session,
  keep: [['$ aws sqs send-message', sent], ['$ python -m tools.consume', 'cannot pack order 999'], 'receive count 3',
    ['$ aws sqs receive-message --queue-url $DLQ_URL', '"order": 999}']],
  side: [
    {
      type: 'group', id: 'tries', title: 'Order 999: received, never deleted', tone: 'source', children: [
        { type: 'item', id: 'r1', icon: 'sqs', title: 'receive 1', sub: 'cannot pack: no delete', stack: true },
        { type: 'item', id: 'r2', icon: 'sqs', title: 'receive 2', sub: 'the same, 31 s later', stack: true },
        { type: 'item', id: 'r3', icon: 'sqs', title: 'receive 3', sub: 'maxReceiveCount reached', stack: true },
        { type: 'item', id: 'dlq', icon: 'sqs', title: 'book-shop-fulfilment-dlq', sub: 'moved on the 4th receive', stack: true, tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'policy', title: 'The redrive policy', tone: 'ingest', columns: ['', ''], rows: [
        ['dead-letter queue', 'book-shop-fulfilment-dlq'],
        ['maxReceiveCount', '3: then it moves'],
        ['kept there', '14 days, for a person to read'],
        ['after the fix', 'redrive it back to the queue'],
      ],
    },
  ],
  edges: [
    { from: 'r1', to: 'r2' },
    { from: 'r2', to: 'r3' },
    { from: 'r3', to: 'dlq' },
  ],
})
