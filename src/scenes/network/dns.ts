import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { netTree } from './files'
import code from '../../../spine/network/09-dns-tls/project/infra/dns.tf?raw'
import session from '../../../spine/network/09-dns-tls/session.txt?raw'

// §5.9 — a name and a certificate. Route 53 holds the zone; ACM issues a certificate once its DNS
// validation record exists (Terraform writes it); the HTTPS listener ends TLS at the load balancer,
// and port 80 only redirects. Delegation from the .com registry is described, not emulated; behind
// the load balancer the request is plain HTTP inside the VPC (encrypting that hop is a choice).
// source: https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html
export const networkDns: SceneModel = ideFrame({
  tree: netTree(9, { active: 'infra/dns.tf', fresh: ['infra/dns.tf'] }),
  editor: {
    file: 'infra/dns.tf', code,
    show: [[lineOf(code, 'resource "aws_acm_certificate" "shop"'), lineOf(code, 'validation_method')], [lineOf(code, 'resource "aws_route53_record" "shop"'), lineOf(code, 'evaluate_target_health') + 2]],
    highlight: [lineOf(code, 'alias {'), lineOf(code, 'name                   =')],
  },
  session,
  keep: [['$ aws route53 list-resource-record-sets', 'CNAME'], ['$ aws elbv2 describe-listeners', 'forward']],
  side: [
    {
      type: 'group', id: 'resolve', title: 'Finding book-shop.example.com', tone: 'source', children: [
        { type: 'item', id: 'resolver', icon: 'search', title: 'the shopper\'s resolver', stack: true },
        { type: 'item', id: 'com', icon: 'globe', title: '.com, then example.com', sub: 'delegate to Route 53\'s name servers', stack: true },
        { type: 'item', id: 'zone', icon: 'route53', title: 'the hosted zone', sub: 'A (alias) → the load balancer; a CNAME proves to ACM we own the name', stack: true },
      ],
    },
    {
      type: 'group', id: 'tls', title: 'Where encryption ends', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'b', icon: 'screen', title: 'browser', stack: true },
        { type: 'item', id: 'lb', icon: 'alb', title: 'load balancer', sub: 'certificate from ACM', stack: true },
        { type: 'item', id: 't', icon: 'fargate', title: 'task', stack: true, muted: true },
      ],
    },
  ],
  edges: [
    { from: 'resolver', to: 'com' },
    { from: 'com', to: 'zone' },
    { from: 'b', to: 'lb', label: 'HTTPS' },
    { from: 'lb', to: 't', label: 'HTTP', dashed: true },
  ],
})
