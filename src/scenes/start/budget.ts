import type { SceneModel } from '@graphlearning/graphl-flow'
import { terminal, keepLines } from '../ide'
import { mapFrame } from '../map'
import session from '../../../spine/start/08-budget/session.txt?raw'

// §3.8 — destroy, tags and a budget (map frame: the shop's map, first time). default_tags puts
// app / env / managed-by on everything; the apply also removes sam's owner tag (the drift from §3.6).
// A budget is an alarm: it emails at 80% of the forecast and stops nothing. `plan -destroy` shows
// what cleaning up would remove — and the state bucket is not in it: bootstrap owns that.
// source: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
const rows = terminal(session)
export const startBudget: SceneModel = mapFrame({
  built: ['catalog', 'state'],
  fresh: ['budget'],
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop', code: rows, fill: true,
      show: keepLines(rows, ['$ cd infra', '$ terraform plan -out=tfplan', 'aws_budgets_budget.dev will be created', 'aws_s3_bucket.catalog will be updated',
        '"env"        = "dev"', '"managed-by" = "terraform"', '"owner"      = "sam" -> null', 'Plan: 1 to add, 1 to change',
        '$ terraform apply tfplan', 'Apply complete!', '$ terraform plan -destroy', 'Plan: 0 to add, 0 to change, 2 to destroy']),
    },
    {
      type: 'group', id: 'alarm', title: 'A budget is an alarm, not a cap', tone: 'consume', dir: 'row', children: [
        { type: 'item', id: 'spend', icon: 'costexplorer', title: 'forecast spend', sub: 'this month, dev', stack: true },
        { type: 'item', id: 'limit', icon: 'budgets', title: '80% of $20', sub: 'book-shop-dev-monthly', stack: true },
        { type: 'item', id: 'mail', icon: 'bell', title: 'an email', sub: 'to alex: nothing stops', stack: true },
      ],
    },
  ],
  edges: [
    { from: 'spend', to: 'limit' },
    { from: 'limit', to: 'mail' },
  ],
})
