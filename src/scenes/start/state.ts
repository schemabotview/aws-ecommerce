import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { startTree } from './tree'
import s3 from '../../../spine/start/06-state/project/infra/s3.tf?raw'
import session from '../../../spine/start/06-state/session.txt?raw'

// §3.6 — state. Between sections sam tagged the bucket in the console (step.json `setup`: the one
// thing that happens off screen). The state still says what Terraform made; the refresh finds the
// real bucket differs, and the plan puts it back. Drift is found by a plan, not by the state alone.
export const startState: SceneModel = ideFrame({
  tree: startTree(6, { active: 'infra/s3.tf' }),
  editor: { file: 'infra/s3.tf', code: s3, highlight: [lineOf(s3, 'app =')] },
  session,
  keep: ['$ terraform state list', 'aws_s3_bucket.catalog', '$ aws s3api get-bucket-tagging', '"Value": "sam"',
    '$ terraform plan', '- "owner" = "sam" -> null', 'Plan: 0 to add, 1 to change'],
  side: [
    { type: 'item', id: 'sam', icon: 'user', title: 'sam, in the console', sub: 'adds a tag: owner = sam', tone: 'consume', stack: true },
    {
      type: 'group', id: 'three', title: 'Three places a tag can be', tone: 'source', dir: 'row', children: [
        { type: 'table', id: 'cfg', title: 'the code', columns: ['tag'], rows: [['app = book-shop']] },
        { type: 'table', id: 'st', title: 'the state', columns: ['tag'], rows: [['app = book-shop']] },
        { type: 'table', id: 'live', title: 'the bucket', columns: ['tag'], rows: [['app = book-shop'], { id: 'owner', cells: ['owner = sam'], tone: 'consume' }] },
      ],
    },
    { type: 'item', id: 'refresh', icon: 'search', title: 'plan refreshes', sub: 'reads the bucket, compares with the code', tone: 'ingest', stack: true },
    { type: 'item', id: 'fix', icon: 'zap', title: '~ remove owner = sam', sub: 'the code wins, unless the code changes', tone: 'consume', stack: true },
    {
      type: 'table', id: 'rules', title: 'Drift', tone: 'source', columns: ['', ''], rows: [
        ['who made it', 'sam, in the console'],
        ['who noticed', 'terraform plan'],
        ['the cure', 'change the code, or let apply put it back'],
      ],
    },
  ],
  edges: [
    { from: 'sam', to: 'three' },
    { from: 'three', to: 'refresh' },
    { from: 'refresh', to: 'fix' },
  ],
})
