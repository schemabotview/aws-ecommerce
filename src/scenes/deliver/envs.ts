import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { deliverTree } from './files'
import code from '../../../spine/deliver/03-envs/project/infra/envs/prod/main.tf?raw'
import session from '../../../spine/deliver/03-envs/session.txt?raw'

// §9.2 — two environments, two accounts. Production is a second root, infra/envs/prod, calling the SAME
// module with its own inputs, in account 111122223333, with its own state bucket there. It is reached
// through OrganizationAccountAccessRole (the role Organizations creates in a member account; the
// emulator does not evaluate its sessions — the developer-key note in scripts/moto_server.py) until
// §9.4 gives the pipeline its own role. Which account owns which VPC is read from the transcript.
// source: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_access-cross-account-role.html
const vpcs = session.split('\n').filter((l) => /^\d{12}\t10\./.test(l)).map((l) => l.split('\t'))

export const deliverEnvs: SceneModel = ideFrame({
  tree: deliverTree(3, { active: 'infra/envs/prod/main.tf', fresh: ['aws-config', 'infra/envs/prod/state/main.tf', 'infra/envs/prod/main.tf'] }),
  editor: { file: 'infra/envs/prod/main.tf', code, show: [[lineOf(code, 'backend "s3" {'), lineOf(code, 'backend "s3" {') + 8],
    [lineOf(code, 'module "network" {'), lineOf(code, 'cidr   = "10.40.0.0/16"') + 1]],
    highlight: [lineOf(code, 'bucket       = "book-shop-tfstate-111122223333"'), lineOf(code, 'cidr   = "10.40.0.0/16"')] },
  session,
  keep: ['Apply complete! Resources: 3 added', 'Apply complete! Resources: 27 added',
    ['$ aws ec2 describe-vpcs', '444455556666\t10.20'], ['$ aws ec2 describe-vpcs', '111122223333\t10.40']],
  side: [
    { type: 'item', id: 'module', icon: 'terraform', title: 'modules/network', sub: 'one module, written once', stack: true },
    {
      type: 'group', id: 'accounts', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'dev', title: 'dev · infra/', tone: 'ingest', children: [
            { type: 'item', id: 'dev-acct', icon: 'account', title: vpcs[0]?.[0] ?? '?', sub: `VPC ${vpcs[0]?.[1] ?? '?'}`, stack: true },
            { type: 'item', id: 'dev-state', icon: 's3', title: 'its own state', sub: 'book-shop-tfstate-444455556666', stack: true },
          ],
        },
        {
          type: 'group', id: 'prod', title: 'prod · infra/envs/prod', tone: 'serve', children: [
            { type: 'item', id: 'prod-acct', icon: 'account', title: vpcs[1]?.[0] ?? '?', sub: `VPC ${vpcs[1]?.[1] ?? '?'}`, stack: true },
            { type: 'item', id: 'prod-state', icon: 's3', title: 'its own state', sub: 'book-shop-tfstate-111122223333', stack: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'differs', title: 'What differs, and what does not', tone: 'source', columns: ['', 'dev', 'prod'], rows: [
        ['the code', 'modules/network', 'modules/network'],
        ['inputs', 'cidr 10.20.0.0/16', 'cidr 10.40.0.0/16'],
        ['account, state', '4444…, its bucket', '1111…, its bucket'],
        ['a mistake reaches', 'dev only', 'prod only'],
      ],
    },
  ],
  edges: [
    { from: 'module', to: 'dev' },
    { from: 'module', to: 'prod' },
  ],
})
