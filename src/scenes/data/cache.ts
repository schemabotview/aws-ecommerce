import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal, trim } from '../ide'
import session from '../../../spine/data/09-cache/session.txt?raw'

// §7.9 — a cache for book pages. ElastiCache (Valkey, two nodes) is PLANNED, not applied: moto cannot
// run its replication groups (spike matrix: 07-elasticache). Cache-aside is SIMULATED (cache_aside.py:
// a dict and a stepped clock): the table is its output, the stale window read from it.
// source: https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html
const rows = terminal(session)
const lab = trim(session.slice(session.indexOf('$ python cache_aside.py')))

export const dataCache: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'paths', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'read', title: 'Read: the cache aside', tone: 'source', children: [
            { type: 'item', id: 'r-app', icon: 'fargate', title: 'the app', sub: 'GET /books/bk-1001', stack: true },
            { type: 'item', id: 'r-cache', icon: 'elasticache', title: 'the cache', sub: 'hit: return it', stack: true },
            { type: 'item', id: 'r-s3', icon: 's3', title: 'the catalog', sub: 'miss: read it, keep it 60 s', stack: true },
          ],
        },
        {
          type: 'group', id: 'write', title: 'Write: change the catalog, then…', tone: 'ingest', children: [
            { type: 'item', id: 'w-app', icon: 'python', title: 'a price change', sub: 'bk-1001: 12.99 → 10.99', stack: true },
            { type: 'item', id: 'w-s3', icon: 's3', title: 'the catalog', sub: 'the new page', stack: true },
            { type: 'item', id: 'w-cache', icon: 'elasticache', title: 'delete the cached page', sub: 'the next read is a miss', stack: true },
          ],
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'cache_aside.py · a simulation', code: lab },
      ],
    },
    {
      type: 'group', id: 'below', bare: true, dir: 'row', children: [
        {
          type: 'code', id: 'plan', terminal: true, filename: 'terminal — cache · planned, not applied', code: rows,
          show: keepLines(rows, ['$ terraform plan', 'aws_elasticache_replication_group.pages will be created', '+ engine ', '+ num_cache_clusters', 'Plan: 2 to add']),
        },
        {
          type: 'table', id: 'window', title: 'The stale window', tone: 'consume', columns: ['', 'ttl only', 'delete on write'], rows: [
            ['old price served', 'from 10 s to 59 s', 'never'],
            ['cost', 'none', 'one delete per change'],
            ['still', 'a TTL bounds the damage', 'keep a TTL anyway'],
          ],
        },
      ],
    },
  ],
  edges: [
    { from: 'r-app', to: 'r-cache', label: '1' },
    { from: 'r-cache', to: 'r-s3', label: '2 · miss' },
    { from: 'w-app', to: 'w-s3', label: '1' },
    { from: 'w-s3', to: 'w-cache', label: '2' },
  ],
}
