import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/how-aws-runs/05-arns/session.txt?raw'

// §2.5 — ARNs: every resource has a name. arns.py splits three ARNs into their six fields: the caller
// (as the emulator names it: user/moto — on AWS, alex's session would read assumed-role/
// BookShopDeveloper/alex, and the frame says so), an AWS-managed policy (account "aws"), and the bucket
// Course 3 will make (S3 bucket ARNs carry no Region or account). The table is the lab's rows.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html
const rows = session.split('\n').slice(2).map((l) => l.trim().split(/\s+/)).filter((r) => r.length === 5)
const field = (id: string, title: string, sub: string) => ({ type: 'item' as const, id, title, sub, stack: true })

export const howArns: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'shape', title: 'arn : partition : service : region : account : resource (the shop\'s fulfilment queue, Course 8)', tone: 'source', dir: 'row', children: [
        field('f-arn', 'arn', 'it is an ARN'),
        field('f-partition', 'aws', 'aws, aws-cn, aws-us-gov'),
        field('f-service', 'sqs', 'who owns the name'),
        field('f-region', 'eu-west-2', 'empty if global'),
        field('f-account', '444455556666', 'empty if unique anyway'),
        { ...field('f-resource', 'book-shop-fulfilment', 'what, in that service'), tone: 'ingest' as const },
      ],
    },
    {
      type: 'group', id: 'bottom', bare: true, dir: 'row', children: [
        {
          type: 'table', id: 'three', title: 'Three ARNs, split by arns.py', tone: 'ingest', columns: ['partition', 'service', 'region', 'account', 'resource'],
          rows: rows.map((r) => r),
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'arns.py · emulated', code: trim(session) },
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the caller is the emulator\'s own user/moto. On AWS, alex\'s session reads arn:aws:sts::444455556666:assumed-role/BookShopDeveloper/alex.' },
  ],
  edges: [
    { from: 'f-arn', to: 'f-partition' },
    { from: 'f-partition', to: 'f-service' },
    { from: 'f-service', to: 'f-region' },
    { from: 'f-region', to: 'f-account' },
    { from: 'f-account', to: 'f-resource' },
  ],
}
