import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { deliverTree } from './files'
import code from '../../../spine/deliver/02-modules/project/infra/network.tf?raw'
import session from '../../../spine/deliver/02-modules/session.txt?raw'

// §9.1 — modules. Course 5's network (network.tf, routes.tf, nat.tf, endpoint.tf) becomes one module,
// modules/network, with two inputs (name, cidr); the root calls it, and a `moved` block per resource
// tells Terraform that the address changed and the thing did not. The plan moves everything in the
// state and changes nothing: read from the transcript. Emulated: the plan reads moto.
// source: https://developer.hashicorp.com/terraform/language/modules/develop/refactoring
const moved = (session.match(/has moved to/g) ?? []).length
const plan = session.split('\n').find((l) => l.startsWith('Plan: ')) ?? ''

export const deliverModules: SceneModel = ideFrame({
  tree: deliverTree(2, { active: 'infra/network.tf', fresh: ['infra/network.tf', 'infra/modules/network/main.tf',
    'infra/modules/network/variables.tf', 'infra/modules/network/outputs.tf'] }),
  editor: { file: 'infra/network.tf', code, show: [[1, lineOf(code, 'to   = module.network.aws_subnet.this') + 1]],
    highlight: [lineOf(code, 'module "network" {'), lineOf(code, 'from = aws_vpc.shop'), lineOf(code, 'to   = module.network.aws_vpc.this')] },
  session,
  keep: [['Initializing modules...', '- network in modules/network'], '# aws_vpc.shop has moved to', ['Plan: ', 'Plan: ']],
  side: [
    {
      type: 'group', id: 'graph', title: 'The root, and the module it calls', tone: 'source', children: [
        { type: 'item', id: 'root', icon: 'terraform', title: 'infra/ (the root)', sub: 'the shop: service, data, checkout …', stack: true },
        { type: 'item', id: 'module', icon: 'terraform', title: 'module "network"', sub: 'name = "book-shop", cidr = "10.20.0.0/16"', stack: true },
        {
          type: 'group', id: 'inside', bare: true, dir: 'row', children: [
            { type: 'item', id: 'vpc', icon: 'vpc', title: 'VPC', sub: '1', stack: true },
            { type: 'item', id: 'subnets', icon: 'privatesubnet', title: 'subnets', sub: '9', stack: true },
            { type: 'item', id: 'routing', icon: 'router', title: 'routes, gateways', sub: 'IGW, NAT, S3 endpoint', stack: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'addresses', title: 'Same things, new addresses', tone: 'ingest', columns: ['before', 'after'], rows: [
        ['aws_vpc.shop', 'module.network.aws_vpc.this'],
        ['aws_subnet.this["app-a"]', 'module.network.aws_subnet.this["app-a"]'],
        ['aws_nat_gateway.a', 'module.network.aws_nat_gateway.a'],
      ],
    },
    { type: 'note', id: 'result', tone: 'ingest', text: `${moved} resources moved in the state. ${plan.replace(/\.$/, '')}: nothing destroyed, nothing made.` },
  ],
  edges: [
    { from: 'root', to: 'module', label: 'source = ./modules/network' },
    { from: 'module', to: 'inside' },
  ],
})
