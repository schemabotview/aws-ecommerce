import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { startTree } from './tree'
import backend from '../../../spine/start/07-remote-state/project/infra/backend.tf?raw'
import session from '../../../spine/start/07-remote-state/session.txt?raw'

// §3.7 — state in S3, locked. infra/bootstrap makes the state bucket with LOCAL state (it cannot
// keep its own); `init -migrate-state` copies the shop's state into it. use_lockfile: a run holds
// terraform.tfstate.tflock beside the state, and a second run waits instead of writing over it.
// source: https://developer.hashicorp.com/terraform/language/backend/s3 (use_lockfile)
export const startRemoteState: SceneModel = ideFrame({
  tree: startTree(7, { active: 'infra/backend.tf', fresh: ['infra/backend.tf', 'infra/bootstrap/main.tf'] }),
  editor: { file: 'infra/backend.tf', code: backend },
  session,
  keep: ['$ cd infra/bootstrap', '$ terraform apply -auto-approve', 'Plan: 3 to add',
    '$ terraform init -migrate-state', 'Successfully configured the backend "s3"', '$ aws s3 ls', 'book-shop/terraform.tfstate'],
  side: [
    {
      type: 'group', id: 'shared', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'people', title: 'Two runs', tone: 'source', spread: true, children: [
            { type: 'item', id: 'alex', icon: 'user', title: 'alex', sub: 'terraform apply', stack: true },
            { type: 'item', id: 'ci', icon: 'githubactions', title: 'the pipeline', sub: 'terraform apply', stack: true },
          ],
        },
        {
          type: 'group', id: 'bucket', icon: 's3', title: 'the state bucket', sub: 'book-shop-tfstate-444455556666', tone: 'ingest', spread: true, children: [
            { type: 'item', id: 'lock', icon: 'lock', title: 'terraform.tfstate.tflock', sub: 'written by the run that starts first', tone: 'consume' },
            { type: 'item', id: 'object', icon: 'file', title: 'book-shop/terraform.tfstate', sub: 'one state: versioned, every write kept' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'sequence', title: 'What the lock does', tone: 'consume', columns: ['', 'alex', 'the pipeline'], rows: [
        ['1', 'locks, plans', ''],
        ['2', 'applies', 'sees the lock: waits'],
        ['3', 'saves, unlocks', ''],
        ['4', '', 'locks, plans the NEW state'],
      ],
    },
    {
      type: 'group', id: 'egg', title: 'Who keeps whose state', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'boot', icon: 'terraform', title: 'infra/bootstrap', sub: 'its state: a local file', stack: true },
        { type: 'item', id: 'state-bucket', icon: 's3', title: 'the state bucket', sub: 'made once, kept forever', stack: true },
        { type: 'item', id: 'main', icon: 'terraform', title: 'infra', sub: 'its state: in the bucket', stack: true },
      ],
    },
    { type: 'note', id: 'keep', tone: 'consume', text: 'Bootstrap\'s local state is the only record of the state bucket, and .gitignore keeps every state file out of git: keep a copy somewhere safe.' },
  ],
  edges: [
    { from: 'alex', to: 'lock', label: 'holds' },
    { from: 'ci', to: 'lock', label: 'waits', dashed: true },
    { from: 'boot', to: 'state-bucket', label: 'makes' },
    { from: 'main', to: 'state-bucket', label: 'keeps' },
  ],
})
