import type { SceneModel } from '@graphlearning/graphl-flow'

// §8.1 — ◆ full scene: synchronous against asynchronous. The same checkout drawn twice. Above, as a
// request chain: the shopper waits while the app records the order, takes the payment, asks the
// warehouse and the loyalty service, one after another; the slowest link sets the wait and any
// link down fails the checkout. Below, as events: the app records the order and publishes
// OrderPlaced; the shopper's request ends there, and each listener works from its own queue, at
// its own pace, retried on its own. The step timings are illustrative. No command: the rest of the
// course builds the lower half.
// source: https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/welcome.html
const step = (id: string, icon: string, title: string, sub: string, tone?: 'ingest' | 'consume') =>
  ({ type: 'item' as const, id, icon, title, sub, stack: true, tone })

export const decoupleSyncAsync: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'sync', title: 'Synchronous: one request waits for every step', tone: 'consume', dir: 'row', children: [
        step('s-shopper', 'user', 'shopper', 'waits for all of it'),
        step('s-app', 'fargate', 'checkout', 'calls each in turn'),
        step('s-db', 'rds', 'record the order', '20 ms'),
        step('s-pay', 'server', 'payment provider', '300 ms, or down'),
        step('s-ship', 'package', 'warehouse', '200 ms, or down'),
        step('s-loyal', 'users', 'loyalty points', '100 ms, or down'),
      ],
    },
    {
      type: 'group', id: 'async', title: 'Asynchronous: record it, announce it, answer', tone: 'ingest', dir: 'row', children: [
        step('a-shopper', 'user', 'shopper', 'answered at once'),
        step('a-app', 'fargate', 'checkout', 'records, then publishes'),
        step('a-db', 'rds', 'record the order', 'the one thing it waits for'),
        step('a-topic', 'sns', 'OrderPlaced', 'one event, many copies'),
        {
          type: 'group', id: 'listeners', bare: true, children: [
            step('a-ship', 'sqs', 'fulfilment queue', 'packs it when it can'),
            step('a-loyal', 'sqs', 'loyalty queue', 'adds the points later'),
            step('a-fraud', 'sqs', 'fraud-check queue', 'large orders only'),
          ],
        },
      ],
    },
    {
      type: 'table', id: 'fails', title: 'What each one fails like', tone: 'source', columns: ['', 'synchronous', 'asynchronous'], rows: [
        ['the shopper waits for', 'the sum of every step', 'the order\'s own write'],
        ['the warehouse is down', 'checkout fails', 'orders wait in its queue'],
        ['an evening\'s peak', 'every service at the peak', 'queues absorb it; workers catch up'],
        ['a step fails half way', 'undo by hand, or not at all', 'the message comes back; retry'],
        { cells: ['the price', 'simple to follow', 'eventual: packed later, maybe twice'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 's-shopper', to: 's-app' },
    { from: 's-app', to: 's-db', label: '1' },
    { from: 's-db', to: 's-pay', label: '2' },
    { from: 's-pay', to: 's-ship', label: '3' },
    { from: 's-ship', to: 's-loyal', label: '4' },
    { from: 'a-shopper', to: 'a-app' },
    { from: 'a-app', to: 'a-db', label: '1' },
    { from: 'a-db', to: 'a-topic', label: '2' },
    { from: 'a-topic', to: 'a-ship' },
    { from: 'a-topic', to: 'a-loyal' },
    { from: 'a-topic', to: 'a-fraud' },
  ],
}
