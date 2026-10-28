import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { operateTree } from './files'
import code from '../../../spine/operate/06-waf/project/infra/waf.tf?raw'
import session from '../../../spine/operate/06-waf/session.txt?raw'

// §11.6 — protecting the edge. A regional WAF web ACL on the load balancer: AWS's common managed rule
// group (known attacks) and a rate rule (1,000 requests per 5 minutes per address → block). The
// rules are read back from the ACL the load balancer reports. Emulated: the emulator stores the ACL
// and its association; it inspects no requests. The layers table is AWS's documented split of duties
// between WAF, the load balancer, security groups and the app.
// source: https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html
const rules = session.split('\n').map((l) => l.match(/^(\d)\t([\w-]+)$/)).filter((m) => m !== null)

export const operateWaf: SceneModel = ideFrame({
  tree: operateTree(6, { active: 'infra/waf.tf', fresh: ['infra/waf.tf'] }),
  editor: { file: 'infra/waf.tf', code, show: [[lineOf(code, 'name     = "aws-common"'), lineOf(code, 'vendor_name') + 1],
    [lineOf(code, 'name     = "per-address"'), lineOf(code, 'aggregate_key_type')]],
    highlight: [lineOf(code, 'name        = "AWSManagedRulesCommonRuleSet"'), lineOf(code, 'limit              = 1000')] },
  session,
  keep: ['Apply complete!', ['$ aws wafv2 get-web-acl-for-resource', `${rules.length - 1}\t`]],
  side: [
    {
      type: 'group', id: 'layers', title: 'A request passes four layers', tone: 'source', children: [
        { type: 'item', id: 'waf', icon: 'waf', title: 'WAF: book-shop', sub: rules.map((m) => m[2]).join(', '), stack: true, tone: 'ingest' },
        { type: 'item', id: 'alb', icon: 'alb', title: 'load balancer', sub: 'HTTPS only; 80 redirects', stack: true },
        { type: 'item', id: 'sg', icon: 'lock', title: 'security group app', sub: '8080 from the load balancer only', stack: true },
        { type: 'item', id: 'app', icon: 'fargate', title: 'the app', sub: 'checks every input itself', stack: true },
      ],
    },
    {
      type: 'table', id: 'stops', title: 'What each one stops', tone: 'ingest', columns: ['layer', 'stops'], rows: [
        ['WAF', 'SQL injection, bad bots, a flood from one address'],
        ['load balancer', 'plain HTTP, old TLS'],
        ['security group', 'anything not from the load balancer'],
        ['the app', 'what only the shop knows is wrong'],
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the ACL and its association are stored and read back; the emulator inspects no requests.' },
  ],
  edges: [
    { from: 'waf', to: 'alb' },
    { from: 'alb', to: 'sg' },
    { from: 'sg', to: 'app' },
  ],
})
