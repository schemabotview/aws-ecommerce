import type { SceneModel } from '@graphlearning/graphl-flow'

// §8.9 — ◆ full scene: choosing the mechanism. The finished checkout as this course built it, every
// part named by its resource, with each mechanism in its place: a QUEUE where one consumer works
// through jobs at its own pace (§8.2–8.4, 8.8); a TOPIC where one event has several listeners that
// must all hear it (§8.5); a BUS where events from several sources are routed by what they say
// (§8.6); a WORKFLOW where steps must run in order with retries and an undo (§8.7). AWS's own
// decision guide draws the same four.
// source: https://docs.aws.amazon.com/decision-guides/latest/sns-or-sqs-or-eventbridge/sns-or-sqs-or-eventbridge.html
const part = (id: string, icon: string, title: string, sub: string) => ({ type: 'item' as const, id, icon, title, sub, stack: true })

export const decoupleChoose: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'checkout', title: 'The shop\'s checkout, as this course built it', tone: 'source', dir: 'row', children: [
        part('app', 'fargate', 'checkout', 'records the order'),
        {
          type: 'group', id: 'after', bare: true, children: [
            {
              type: 'group', id: 'fan', title: 'topic', tone: 'ingest', children: [
                part('topic', 'sns', 'book-shop-orders', 'OrderPlaced, once'),
              ],
            },
            {
              type: 'group', id: 'pay', title: 'workflow', tone: 'serve', children: [
                part('flow', 'stepfunctions', 'book-shop-checkout', 'reserve → charge → ship; else release'),
              ],
            },
          ],
        },
        {
          type: 'group', id: 'queues', title: 'queues', tone: 'infra', children: [
            part('q-fulfil', 'sqs', 'fulfilment', '→ book-shop-fulfil, claims each order once'),
            part('q-loyalty', 'sqs', 'loyalty', 'every order'),
            part('q-fraud', 'sqs', 'fraud-check', 'total ≥ 500 only'),
          ],
        },
      ],
    },
    {
      type: 'group', id: 'routing', title: 'bus', tone: 'store', dir: 'row', children: [
        part('sources', 'users', 'checkout, returns desk', 'put events on one bus'),
        part('bus', 'eventbridge', 'book-shop', 'rules: uk-vat, refunds'),
        part('targets', 'sqs', 'vat, refunds queues', 'each gets what matched'),
      ],
    },
    {
      type: 'table', id: 'which', title: 'Which one, when', tone: 'source', columns: ['mechanism', 'use it when', 'the shop'], rows: [
        ['queue (SQS)', 'one consumer works through jobs, at its pace, retried', 'packing orders'],
        ['topic (SNS)', 'one event, several listeners that must all hear it', 'OrderPlaced to three queues'],
        ['bus (EventBridge)', 'many sources; route by what the event says', 'VAT for GB orders, refunds'],
        ['workflow (Step Functions)', 'steps in order, with retries and an undo', 'payment, release on failure'],
        { cells: ['a direct call', 'the caller needs the answer now', 'recording the order itself'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'app', to: 'flow' },
    { from: 'app', to: 'topic' },
    { from: 'topic', to: 'queues', label: 'a copy each' },
    { from: 'sources', to: 'bus' },
    { from: 'bus', to: 'targets' },
  ],
}
