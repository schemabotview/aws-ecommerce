import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { netTree } from './files'
import code from '../../../spine/network/06-filters/project/infra/security.tf?raw'
import session from '../../../spine/network/06-filters/session.txt?raw'

// §5.6 — security groups and network ACLs. The SG chain is the shop's: anyone → alb (443, 80) →
// app (8080, from the alb GROUP, not an address) → db (5432, from the app group). A NACL on the data
// subnets shows stateless: the reply needs its own rule. Rules are read back from the emulator by
// tools/sg_rules.py; that a packet is dropped is AWS's documented behaviour, not emulated.
// source: https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html#VPC_Security_Comparison
export const networkFilters: SceneModel = ideFrame({
  tree: netTree(6, { active: 'infra/security.tf', fresh: ['infra/security.tf', 'tools/sg_rules.py'] }),
  editor: {
    file: 'infra/security.tf', code,
    show: [[1, lineOf(code, 'resource "aws_security_group"') - 2], [lineOf(code, '# A network ACL'), lineOf(code, '# A network ACL') + 1]],
    highlight: [lineOf(code, 'app_alb'), lineOf(code, 'db_app')],
  },
  session,
  keep: ['$ terraform apply tfplan', 'Apply complete!', ['$ python tools/sg_rules.py', 'db   accepts']],
  side: [
    {
      type: 'group', id: 'chain', title: 'The chain: who may start a connection to whom', tone: 'source', children: [
        { type: 'item', id: 'anyone', icon: 'globe', title: 'anyone', stack: true },
        { type: 'item', id: 'alb', icon: 'alb', title: 'alb', sub: 'accepts 443, 80', stack: true },
        { type: 'item', id: 'app', icon: 'fargate', title: 'app', sub: 'accepts 8080 from the alb group', stack: true },
        { type: 'item', id: 'db', icon: 'rds', title: 'db', sub: 'accepts 5432 from the app group', stack: true },
      ],
    },
    {
      type: 'table', id: 'compare', title: 'Security group or network ACL', tone: 'ingest', columns: ['', 'security group', 'network ACL'], rows: [
        ['on', 'a network interface', 'a subnet'],
        ['rules', 'allow only', 'allow and deny, in order'],
        ['the reply', 'let back out', 'needs its own rule'],
      ],
    },
  ],
  edges: [
    { from: 'anyone', to: 'alb', label: '443' },
    { from: 'alb', to: 'app', label: '8080' },
    { from: 'app', to: 'db', label: '5432' },
  ],
})
