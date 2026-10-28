import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, linesFrom } from '../ide'
import { decoupleTree } from './files'
import code from '../../../spine/decouple/04-function/project/functions/fulfil/handler.py?raw'
import session from '../../../spine/decouple/04-function/session.txt?raw'

// §8.4 — a consumer as a function. book-shop-fulfil (Lambda, python3.13, arm64) and an event source
// mapping on the fulfilment queue: batch 10, a 5 s window, ReportBatchItemFailures. The emulator
// records the function and the mapping and runs NEITHER (moto would run the function in Docker
// inside SendMessage; the no-poller patch stops that). tools/poll.py plays the poller: a real
// receive, the event Lambda builds, the real handler, real deletes. Said on screen.
// source: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
// source: https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html
const batch = session.match(/^batch of (\d+)/m)?.[1] ?? '?'
const result = session.match(/^deleted (\d+), left (\d+)/m)

export const decoupleFunction: SceneModel = ideFrame({
  tree: decoupleTree(4, { active: 'functions/fulfil/handler.py', fresh: ['functions/fulfil/handler.py', 'infra/function.tf', 'tools/poll.py'] }),
  editor: { file: 'functions/fulfil/handler.py', code, highlight: linesFrom(code, 'if "books" not in order', 'return {"batchItemFailures"') },
  session,
  keep: [['$ aws lambda list-event-source-mappings', 'Enabled'], ['$ python -m tools.checkout c-19', 'order '], ['$ python -m tools.poll', 'deleted ']],
  side: [
    {
      type: 'group', id: 'poller', title: 'The event source mapping: Lambda polls for you', tone: 'source', children: [
        { type: 'item', id: 'queue', icon: 'sqs', title: 'book-shop-fulfilment', sub: `${batch} messages waiting`, stack: true },
        { type: 'item', id: 'esm', icon: 'lambda', title: 'the poller', sub: 'up to 10 messages, or 5 s', stack: true },
        { type: 'item', id: 'fn', icon: 'lambda', title: 'book-shop-fulfil', sub: 'one call per batch', stack: true },
        {
          type: 'group', id: 'after', bare: true, dir: 'row', children: [
            { type: 'item', id: 'ok', icon: 'check', title: `${result?.[1] ?? '?'} deleted`, sub: 'packed', stack: true, tone: 'ingest' },
            { type: 'item', id: 'back', icon: 'clock', title: `${result?.[2] ?? '?'} left`, sub: 'reported failed: retried', stack: true, tone: 'consume' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'who', title: 'A worker by hand, or a function', tone: 'ingest', columns: ['', 'tools.consume', 'Lambda'], rows: [
        ['who polls', 'your loop', 'the mapping'],
        ['more messages', 'you start workers', 'more pollers, more calls'],
        ['one bad message', 'your code', 'batchItemFailures'],
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the emulator records the function and the mapping and runs neither. tools/poll.py plays the poller, with the real handler.' },
  ],
  edges: [
    { from: 'queue', to: 'esm', label: 'receive' },
    { from: 'esm', to: 'fn', label: 'invoke' },
    { from: 'fn', to: 'ok' },
    { from: 'fn', to: 'back' },
  ],
})
