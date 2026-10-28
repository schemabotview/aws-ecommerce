import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { startTree } from './tree'
import s3 from '../../../spine/start/05-terraform/project/infra/s3.tf?raw'
import session from '../../../spine/start/05-terraform/session.txt?raw'

// §3.5 — Terraform: init, plan, apply. ◆ side pane: the loop every later section runs. Terraform
// compares what the code DECLARES with what its state says EXISTS (refreshed against the real
// cloud), and the difference is the plan; apply makes the calls and writes the state back.
// plan -out saves exactly that plan, so apply cannot do anything the plan did not show.
export const startTerraform: SceneModel = ideFrame({
  tree: startTree(5, { active: 'infra/s3.tf', fresh: ['infra/s3.tf', 'infra/providers.tf', '.gitignore'] }),
  editor: { file: 'infra/s3.tf', code: s3, highlight: [lineOf(s3, 'resource'), lineOf(s3, 'bucket =')] },
  session,
  keep: [['$ cd infra', '$ terraform init'], 'Installed hashicorp/aws', '$ terraform plan -out=tfplan', 'Plan: 1 to add',
    '$ terraform apply tfplan', 'Apply complete!'],
  side: [
    {
      type: 'group', id: 'inputs', title: 'plan compares three things', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'desired', icon: 'terraform', title: 'the code', sub: 'infra/*.tf', stack: true },
        { type: 'item', id: 'known', icon: 'file', title: 'the state', sub: 'what it made', stack: true },
        { type: 'item', id: 'real', icon: 'cloud', title: 'the account', sub: 'what is there', stack: true },
      ],
    },
    { type: 'item', id: 'plan', icon: 'search', title: 'plan: + 1 bucket', sub: 'the difference, saved to tfplan', tone: 'ingest', stack: true },
    { type: 'item', id: 'apply', icon: 'zap', title: 'apply tfplan', sub: 'only what the plan showed', tone: 'ingest', stack: true },
    {
      type: 'group', id: 'outputs', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'made', icon: 's3', title: 'the account', sub: 'gets the bucket', stack: true },
        { type: 'item', id: 'recorded', icon: 'file', title: 'the state', sub: 'records it', stack: true },
      ],
    },
    {
      type: 'table', id: 'commands', title: 'Three commands', tone: 'source', columns: ['command', 'does'], rows: [
        ['init', 'downloads the provider, writes the lock file'],
        ['plan', 'compares the three, saves the difference'],
        ['apply', 'makes the calls, records the result'],
      ],
    },
  ],
  edges: [
    { from: 'desired', to: 'plan' },
    { from: 'known', to: 'plan' },
    { from: 'real', to: 'plan' },
    { from: 'plan', to: 'apply' },
    { from: 'apply', to: 'made' },
    { from: 'apply', to: 'recorded' },
  ],
})
