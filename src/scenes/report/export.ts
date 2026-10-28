import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { reportTree } from './files'
import code from '../../../spine/report/02-export/project/jobs/export_orders.py?raw'
import session from '../../../spine/report/02-export/session.txt?raw'

// §10.2 — exporting orders to a lake. `infra/lake.tf` makes the lake bucket (private); migration 002
// gives every order the time it was placed; `jobs/seed_september.py` writes a MADE-UP September (30,000
// orders, seeded: the shop's real orders are the few from Courses 7 and 8, and the frame says so);
// `jobs/export_orders.py` writes each day's order lines as one Parquet file under
// order_history/dt=<day>/. Real PostgreSQL 16 and real Parquet; the bucket is emulated. Every number
// is read from the transcript.
// source: https://docs.aws.amazon.com/athena/latest/ug/partitions.html
const seeded = session.match(/^September 2026: ([\d,]+) orders, ([\d,.]+) GBP$/m)?.slice(1) ?? ['?', '?']
const [files, lines, kib] = session.match(/^(\d+) files, ([\d,]+) order lines, ([\d,]+) KiB$/m)?.slice(1) ?? ['?', '?', '?']
const one = session.match(/^\S+ \S+\s+(\d+) orders\.parquet$/m)?.[1] ?? '?'

export const reportExport: SceneModel = ideFrame({
  tree: reportTree(2, { active: 'jobs/export_orders.py', fresh: ['infra/lake.tf', 'db/migrations/002_placed.sql',
    'jobs/seed_september.py', 'jobs/export_orders.py'] }),
  editor: { file: 'jobs/export_orders.py', code, show: [[lineOf(code, 'SCHEMA = pa.schema'), lineOf(code, 'ORDER BY o.id"""')],
    [lineOf(code, 'while day <= last:'), lineOf(code, 'print(f"{files} files')]],
    highlight: [lineOf(code, 'WHERE o.placed >= %s'), lineOf(code, 'pq.write_table'), lineOf(code, 'Key=f"order_history/dt={day}')] },
  session,
  keep: [['$ psql -q -f db/migrations/002_placed.sql', 'orders.parquet']],
  side: [
    {
      type: 'group', id: 'path', title: 'Every night, yesterday leaves the database', tone: 'source', children: [
        { type: 'item', id: 'db', icon: 'rds', title: 'orders database', sub: 'one day\'s order lines, by placed', stack: true },
        { type: 'item', id: 'job', icon: 'python', title: 'jobs/export_orders.py', sub: 'one Parquet file per day', stack: true },
        {
          type: 'tree', id: 'layout', title: 'book-shop-lake-444455556666', entries: [
            { name: 'order_history', children: [
              { name: 'dt=2026-09-01', children: [{ name: 'orders.parquet', note: `${one} bytes` }] },
              { name: 'dt=2026-09-02', children: [{ name: 'orders.parquet' }] },
              { name: `… ${Number(files) - 3} more days`, state: 'muted' },
              { name: 'dt=2026-09-30', children: [{ name: 'orders.parquet', state: 'new' }] },
            ] },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'numbers', title: 'September, exported', tone: 'ingest', columns: ['', 'count'], rows: [
        ['orders (made up, seeded)', seeded[0]],
        ['order lines', lines],
        ['files, one per day', files],
        ['all of them, Parquet + zstd', `${kib} KiB`],
      ],
    },
  ],
  edges: [
    { from: 'db', to: 'job' },
    { from: 'job', to: 'layout', label: 'put_object' },
  ],
})
