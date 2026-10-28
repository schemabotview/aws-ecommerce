import type { SceneModel } from '@graphlearning/graphl-flow'

// §7.1 — ◆ full scene: choosing where data lives. The decision tree AWS's storage guidance draws:
// first, is it a FILE (an object, a disk, a shared file system) or a RECORD (relational, key-value,
// a cache)? Each of the shop's needs sits at its leaf; EBS and EFS are shown and not used (Fargate
// tasks keep nothing on disk). No command: each store arrives in its own section.
// source: https://docs.aws.amazon.com/decision-guides/latest/storage-on-aws-how-to-choose/choosing-aws-storage-service.html
// source: https://docs.aws.amazon.com/decision-guides/latest/databases-on-aws-how-to-choose/databases-on-aws-how-to-choose.html
const leaf = (id: string, icon: string, title: string, sub: string, used = true) =>
  ({ type: 'item' as const, id, icon, title, sub, stack: true, muted: used ? undefined : true })

export const dataChoose: SceneModel = {
  nodes: [
    { type: 'item', id: 'need', icon: 'search', title: 'What does the shop need to keep?', stack: true, tone: 'source' },
    {
      type: 'group', id: 'kinds', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'files', title: 'Files and blobs', tone: 'ingest', dir: 'row', children: [
            leaf('s3', 's3', 'S3: objects', 'book pages, review photos (§7.2, 7.3)'),
            leaf('ebs', 'disk', 'EBS: a disk', 'one server\'s volume: not used', false),
            leaf('efs', 'folder', 'EFS: shared files', 'many servers, one tree: not used', false),
          ],
        },
        {
          type: 'group', id: 'records', title: 'Records', tone: 'serve', dir: 'row', children: [
            leaf('rds', 'rds', 'RDS: relational', 'orders: rows that must agree (§7.4–7.6)'),
            leaf('ddb', 'dynamodb', 'DynamoDB: key-value', 'carts, stock: by key, any scale (§7.7, 7.8)'),
            leaf('cache', 'elasticache', 'ElastiCache: in memory', 'hot book pages, a copy (§7.9)'),
          ],
        },
      ],
    },
    {
      type: 'table', id: 'why', title: 'Why each need lands where it does', tone: 'source', columns: ['need', 'store', 'because'], rows: [
        ['a book\'s page, a photo', 'S3', 'whole objects by key; durable, cheap, no server'],
        ['an order and its lines', 'RDS PostgreSQL', 'several rows that change together, or not at all; SQL for reports'],
        ['a cart, a stock count', 'DynamoDB', 'one key, read and written fast, by any number of tasks'],
        ['the same page, thousands of times', 'ElastiCache', 'memory in front of S3; a copy that can be stale'],
      ],
    },
  ],
  edges: [
    { from: 'need', to: 'files', label: 'a file' },
    { from: 'need', to: 'records', label: 'a record' },
  ],
}
