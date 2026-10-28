import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { deliverTree } from './files'
import code from '../../../spine/deliver/06-drift/project/infra/returns.tf?raw'
import session from '../../../spine/deliver/06-drift/session.txt?raw'

// §9.6 — drift and import. Off screen (step.json `setup`), sam changes the fulfilment queue's visibility
// timeout to 60 s and makes a `book-shop-returns` queue by hand. The plan refreshes the state from the
// account, compares it with the code, and proposes to put the timeout back (60 → 30); an `import` block
// adopts the hand-made queue, and the plan shows where it differs from its resource block: AWS gave a
// queue made outside Terraform a 1 MiB maximum message size, the provider's default is 256 KiB. The
// fulfil function's policy is "known after apply" — it reads the queue being changed — and is not
// changed by the apply. Every value is read from the transcript. Emulated: the plan reads moto.
// source: https://developer.hashicorp.com/terraform/language/import
// source: https://developer.hashicorp.com/terraform/cli/commands/plan#planning-modes
const change = (attr: string) => session.match(new RegExp(`~ ${attr}\\s+= (\\S+) -> (\\S+)`))?.slice(1) ?? ['?', '?']
const [visWas, visNow] = change('visibility_timeout_seconds')
const [sizeWas, sizeNow] = change('max_message_size')
const plan = session.split('\n').find((l) => l.startsWith('Plan: ')) ?? ''
const read = session.match(/^ATTRIBUTES\t(\d+)$/m)?.[1] ?? '?'
const kib = (bytes: string) => `${Number(bytes) / 1024} KiB`

export const deliverDrift: SceneModel = ideFrame({
  tree: deliverTree(6, { active: 'infra/returns.tf', fresh: ['infra/returns.tf'] }),
  editor: { file: 'infra/returns.tf', code,
    highlight: [lineOf(code, 'import {'), lineOf(code, 'to = aws_sqs_queue.returns'), lineOf(code, 'resource "aws_sqs_queue" "returns"')] },
  session,
  keep: [['$ cd infra', '$ terraform plan -out=tfplan'], '~ visibility_timeout_seconds', '~ max_message_size', 'Plan: ',
    ['$ aws sqs get-queue-attributes', 'ATTRIBUTES']],
  side: [
    {
      type: 'group', id: 'versions', title: 'Three versions of the shop', tone: 'source', children: [
        { type: 'item', id: 'real', icon: 'account', title: 'the account', sub: 'what sam changed by hand', stack: true },
        { type: 'item', id: 'state', icon: 's3', title: 'the state', sub: 'refreshed from the account', stack: true },
        { type: 'item', id: 'code', icon: 'terraform', title: 'the code', sub: 'what the shop should be', stack: true },
        { type: 'item', id: 'apply', icon: 'check', title: 'plan, then apply', sub: 'the account made to match the code', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'table', id: 'differences', title: 'What the plan found, and what it does', tone: 'ingest',
      columns: ['', 'account', 'code', 'after apply'], rows: [
        ['fulfilment timeout', `${visWas} s`, `${visNow} s`, `${read} s (read back)`],
        ['returns queue', 'made by hand', 'import block', 'in the state'],
        { cells: ['returns max size', kib(sizeWas), `${kib(sizeNow)} (default)`, kib(sizeNow)], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'result', tone: 'ingest', text: `${plan.replace(/\.$/, '')}. Nothing destroyed: drift is put back, a hand-made queue adopted.` },
  ],
  edges: [
    { from: 'real', to: 'state', label: 'refresh' },
    { from: 'state', to: 'code', label: 'compare' },
    { from: 'code', to: 'apply' },
  ],
})
