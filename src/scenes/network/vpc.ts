import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, lineOf, terminal, trim } from '../ide'
import { BUILT, SUBNETS, mapFrame } from '../map'
import code from '../../../spine/network/02-vpc/project/infra/network.tf?raw'
import session from '../../../spine/network/02-vpc/session.txt?raw'

// §5.2 — a VPC across three AZs (map frame). The network appears on the map: the VPC and nine
// subnets, three tiers in three AZs, all from ONE resource block with for_each over a map that
// locals builds from the CIDR plan of §5.1. The account also has a default VPC (172.31.0.0/16), as
// every AWS account does; the shop does not use it, and the query filters it out by the VPC's id.
const rows = terminal(session)
export const networkVpc: SceneModel = mapFrame({
  built: BUILT.start,
  fresh: ['vpc', ...SUBNETS],
  side: [
    {
      type: 'code', id: 'editor', filename: 'infra/network.tf', lang: 'hcl', code: trim(code), fill: true, tone: 'ingest',
      show: [[lineOf(code, 'locals {'), lineOf(code, ']...)') + 1], [lineOf(code, 'resource "aws_subnet"'), lineOf(code, 'tags              =') + 1]],
      highlight: [lineOf(code, 'for tier, base'), lineOf(code, 'for i, az'), lineOf(code, 'for_each          =')],
    },
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop', code: rows, fill: true,
      show: keepLines(rows, ['$ terraform apply tfplan', 'Apply complete!', ['$ aws ec2 describe-subnets', 'public-c']]),
    },
  ],
})
