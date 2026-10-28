import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { netTree } from './files'
import code from '../../../spine/network/10-endpoint/project/infra/endpoint.tf?raw'
import session from '../../../spine/network/10-endpoint/session.txt?raw'

// §5.10 — private paths to AWS services: an S3 gateway endpoint. One route appears in the private
// table — S3's prefix list → the endpoint — more specific than 0.0.0.0/0 → nat, so S3 traffic leaves
// the NAT path. which_route.py resolves the prefix list the emulator holds. Gateway endpoints for S3
// carry no hourly or per-GB charge; the NAT gateway charges per GB processed (doc-cited).
// source: https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html
export const networkEndpoint: SceneModel = ideFrame({
  tree: netTree(10, { active: 'infra/endpoint.tf', fresh: ['infra/endpoint.tf'] }),
  editor: { file: 'infra/endpoint.tf', code },
  session,
  keep: ['$ terraform apply tfplan', 'Apply complete!', ['$ python tools/which_route.py app-a', 'goes to vpce']],
  side: [
    { type: 'item', id: 'task', icon: 'fargate', title: 'a task, app-a', sub: 'GetObject on the catalog bucket', stack: true, muted: true },
    {
      type: 'group', id: 'paths', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'via-nat', tone: 'consume', children: [
            { type: 'item', id: 'nat', icon: 'natgateway', title: 'before: NAT gateway', sub: 'charged per GB', stack: true },
            { type: 'item', id: 'igw', icon: 'igw', title: 'internet gateway', stack: true },
          ],
        },
        {
          type: 'group', id: 'via-ep', tone: 'ingest', children: [
            { type: 'item', id: 'vpce', icon: 'vpcendpoint', title: 'now: gateway endpoint', sub: 'no charge', stack: true },
          ],
        },
      ],
    },
    { type: 'item', id: 's3', icon: 's3', title: 'S3', sub: 'book-shop-catalog-444455556666', stack: true },
    {
      type: 'table', id: 'rt', title: 'route table: private', tone: 'source', columns: ['destination', 'target'], rows: [
        ['10.20.0.0/16', 'local'],
        ['0.0.0.0/0', 'nat'],
        { id: 'pl', cells: ['S3\'s prefix list', 'vpce: more specific'], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'task', to: 'nat', dashed: true },
    { from: 'task', to: 'vpce' },
    { from: 'nat', to: 'igw', dashed: true },
    { from: 'igw', to: 's3', dashed: true },
    { from: 'vpce', to: 's3' },
  ],
})
