import type { SceneModel } from '@graphlearning/graphl-flow'

// §2.2 — ◆ full scene: global, Regional and zonal services. The same Region picture, with services placed
// at the scope AWS gives them: IAM, Route 53 and CloudFront are global; S3 buckets, queues, functions
// and tables live in a Region (spread over its zones by AWS); an EC2 instance, a subnet, a volume and a
// database instance live in ONE zone — which is why the shop runs three of the things that are zonal.
// source: https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/global-services.html
const svc = (id: string, icon: string, title: string, sub?: string) => ({ type: 'item' as const, id, icon, title, sub, stack: true })

export const howScopes: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'global', title: 'Global: one, everywhere', tone: 'serve', dir: 'row', children: [
        svc('iam', 'iam', 'IAM', 'users, roles, policies'), svc('r53', 'route53', 'Route 53', 'names'), svc('cf', 'cloudfront', 'CloudFront', 'the edge'),
      ],
    },
    {
      type: 'group', id: 'region', title: 'Regional: in eu-west-2, across its zones', icon: 'region', dashed: true, tone: 'source', children: [
        {
          type: 'group', id: 'regional', bare: true, dir: 'row', children: [
            svc('s3', 's3', 'S3 bucket'), svc('sqs', 'sqs', 'SQS queue'), svc('lambda', 'lambda', 'Lambda function'), svc('ddb', 'dynamodb', 'DynamoDB table'),
          ],
        },
        {
          type: 'group', id: 'zones', bare: true, dir: 'row', children: ['a', 'b', 'c'].map((z) => ({
            type: 'group' as const, id: `az-${z}`, title: `Zonal: eu-west-2${z}`, dashed: true, tone: 'ingest' as const, dir: 'row' as const, children: [
              svc(`ec2-${z}`, 'ec2', 'an instance'), svc(`subnet-${z}`, 'privatesubnet', 'a subnet'),
            ],
          })),
        },
      ],
    },
    {
      type: 'table', id: 'means', title: 'What the scope means for the shop', tone: 'source', columns: ['scope', 'fails with', 'so the shop'], rows: [
        ['global', 'almost never; changes are slow to spread', 'creates IAM roles once'],
        ['Regional', 'the Region', 'needs nothing more inside eu-west-2'],
        { cells: ['zonal', 'its zone', 'runs subnets, tasks, NAT in each zone'], tone: 'consume' },
      ],
    },
  ],
}
