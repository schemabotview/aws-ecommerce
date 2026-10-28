import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, trim } from '../ide'
import { deliverTree } from './files'
import code from '../../../spine/deliver/07-replace/project/infra/topic.tf?raw'
import session from '../../../spine/deliver/07-replace/session.txt?raw'

// §9.7 — replacement and protecting state. The loyalty queue is renamed book-shop-points: a name cannot
// change in place, so the queue, its subscription and its queue policy are REPLACED. Terraform's default
// is destroy, then create (-/+); `create_before_destroy` reverses it (+/-), on all three, and the
// subscription waits for the new policy (depends_on). The order the apply really ran in is read from
// the transcript. Then `plan -replace` on the orders database is refused by `prevent_destroy` before
// anything changes. Emulated: the plan and apply talk to moto.
// source: https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle
// source: https://developer.hashicorp.com/terraform/cli/commands/plan#replace-address
const NAMES: [string, string][] = [
  ['aws_sns_topic_subscription.listeners["loyalty"]', 'subscription'],
  ['aws_sqs_queue_policy.from_topic["loyalty"]', 'queue policy'],
  ['aws_sqs_queue.loyalty', 'queue'],
]
// The pane wraps at 80 columns: a row exactly 80 wide goes on in the next one.
const rows = trim(session).split('\n')
const lines: string[] = []
for (let i = 0; i < rows.length; i++) {
  let line = rows[i]
  while (line.length === 80 && i + 1 < rows.length) line += rows[++i]
  lines.push(line)
}
const apply = lines.slice(lines.indexOf('$ terraform apply tfplan'), lines.findIndex((l) => l.startsWith('Apply complete!')))
const order = apply.flatMap((l) => {
  const name = NAMES.find(([address]) => l.startsWith(address))?.[1]
  if (!name) return []
  if (/: Creating\.\.\.$/.test(l)) return [`new ${name} made`]
  if (/\(deposed object \w+\): Destroying\.\.\./.test(l)) return [`old ${name} removed`]
  return []
})
const refused = lines.some((l) => l === 'Error: Instance cannot be destroyed')

export const deliverReplace: SceneModel = ideFrame({
  tree: deliverTree(7, { active: 'infra/topic.tf', fresh: ['infra/topic.tf', 'infra/database.tf'] }),
  editor: { file: 'infra/topic.tf', code,
    show: [[lineOf(code, '# The loyalty team renamed'), lineOf(code, 'resource "aws_sqs_queue" "fraud_check"') - 1],
      [lineOf(code, 'resource "aws_sns_topic_subscription" "listeners"'), lineOf(code, 'resource "aws_sns_topic_subscription" "listeners"')],
      [lineOf(code, 'depends_on = [aws_sqs_queue_policy.from_topic]') - 1, lineOf(code, 'depends_on = [aws_sqs_queue_policy.from_topic]')]],
    highlight: [lineOf(code, 'name = "book-shop-points"'), lineOf(code, 'create_before_destroy = true'),
      lineOf(code, 'depends_on = [aws_sqs_queue_policy.from_topic]')] },
  session,
  keep: [['$ cd infra', '$ terraform plan -out=tfplan'], ['= "book-shop-loyalty" -> "book-shop-po', 'ints" # forces replacement'],
    'Apply complete!', '$ terraform plan -replace=aws_db_instance.orders', 'Error: Instance cannot be destroyed'],
  side: [
    {
      type: 'group', id: 'orders', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'destroy-first', title: '-/+ the default', tone: 'consume', children: [
            { type: 'item', id: 'd-old', icon: 'sqs', title: 'old queue removed', stack: true },
            { type: 'item', id: 'd-gap', icon: 'clock', title: 'nothing there', sub: 'an OrderPlaced is lost', stack: true },
            { type: 'item', id: 'd-new', icon: 'sqs', title: 'new queue made', stack: true },
          ],
        },
        {
          type: 'group', id: 'create-first', title: '+/- create_before_destroy', tone: 'ingest', children: [
            { type: 'item', id: 'c-new', icon: 'sqs', title: 'new queue made', stack: true },
            { type: 'item', id: 'c-both', icon: 'sns', title: 'both subscribed', sub: 'a copy may come twice', stack: true },
            { type: 'item', id: 'c-old', icon: 'sqs', title: 'old queue removed', stack: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'ran', title: 'The order this apply ran in', tone: 'ingest', columns: ['', 'step'],
      rows: order.map((step, i) => [String(i + 1), step]),
    },
    {
      type: 'note', id: 'protected', tone: 'consume',
      text: refused ? 'plan -replace on the orders database: refused by prevent_destroy, before anything changed.' : '?',
    },
  ],
  edges: [
    { from: 'd-old', to: 'd-gap' },
    { from: 'd-gap', to: 'd-new' },
    { from: 'c-new', to: 'c-both' },
    { from: 'c-both', to: 'c-old' },
  ],
})
