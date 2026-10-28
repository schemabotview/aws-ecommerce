import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { decoupleTree } from './files'
import code from '../../../spine/decouple/07-workflow/project/workflows/checkout.asl.json?raw'
import session from '../../../spine/decouple/07-workflow/session.txt?raw'

// §8.7 — the payment workflow. workflows/checkout.asl.json, a Step Functions state machine whose
// tasks are four Lambda functions: reserve → charge (retry PaymentTimeout 2 s × 2.0, twice; catch
// all → release → OrderFailed) → ship. The state machine and the functions are emulated (recorded);
// moto runs no task, so tools/run_workflow.py WALKS the definition: each task calls the step's real
// code (the stock changes are real, in the emulator's table) and only the payment provider's answers
// are stand-ins. Both runs are read from the transcript. Retry timing: AWS's documented formula.
// source: https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html
const runs: Record<string, string[][]> = {}
let current = ''
for (const line of session.split('\n')) {
  const head = line.match(/^order (\d+), stand-in/)
  if (head) current = head[1]
  const step = line.match(/^\s*(\d+) s {2}(\S+)\s+(.*)$/)
  if (step && current) (runs[current] ??= []).push([`${step[1]} s`, step[2], step[3]])
}

export const decoupleWorkflow: SceneModel = ideFrame({
  tree: decoupleTree(7, { active: 'workflows/checkout.asl.json', fresh: ['workflows/checkout.asl.json', 'functions/checkout/steps.py', 'infra/workflow.tf', 'tools/run_workflow.py'] }),
  editor: { file: 'workflows/checkout.asl.json', code, show: [[lineOf(code, '"ChargePayment": {'), lineOf(code, '"Next": "ShipOrder"')]],
    highlight: [lineOf(code, '"Retry": ['), lineOf(code, '"Catch": [')] },
  session,
  keep: ['ACTIVE', ['$ python -m tools.run_workflow 10', 'execution SUCCEEDED']],
  side: [
    {
      type: 'group', id: 'machine', title: 'book-shop-checkout, as Step Functions runs it', tone: 'source', children: [
        { type: 'item', id: 's-reserve', icon: 'lambda', title: 'ReserveStock', sub: 'take the copies', stack: true },
        { type: 'item', id: 's-charge', icon: 'lambda', title: 'ChargePayment', sub: 'timeout: retry at 2 s, then 4 s', stack: true },
        {
          type: 'group', id: 'ends', bare: true, dir: 'row', children: [
            { type: 'item', id: 's-ship', icon: 'package', title: 'ShipOrder', sub: 'succeeded', stack: true, tone: 'ingest' },
            { type: 'item', id: 's-release', icon: 'lambda', title: 'ReleaseStock', sub: 'give the copies back', stack: true, tone: 'consume' },
            { type: 'item', id: 's-failed', icon: 'lock', title: 'OrderFailed', sub: 'the execution fails', stack: true, tone: 'consume' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'run11', title: 'Order 11: the card is declined', tone: 'consume', columns: ['at', 'state', 'result'],
      rows: runs['11'] ?? [],
    },
    { type: 'note', id: 'walked', tone: 'consume', text: 'Walked locally: the emulator records the state machine and runs no step. The stock changes are real; the payment answers are stand-ins.' },
  ],
  edges: [
    { from: 's-reserve', to: 's-charge' },
    { from: 's-charge', to: 's-ship', label: 'paid' },
    { from: 's-charge', to: 's-release', label: 'catch' },
    { from: 's-release', to: 's-failed' },
  ],
})
