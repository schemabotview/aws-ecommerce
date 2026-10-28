import type { SceneModel } from '@graphlearning/graphl-flow'

// §10.1 — ◆ full scene: state against history. The orders database holds the shop's PRESENT: one row
// per order, changed by every checkout, sized for many small reads and writes. A report asks about
// the PAST: a month of orders, read once, summed. Asked of the database, it competes with checkouts
// for the same instance. So history leaves nightly: an export job writes each day's orders as Parquet
// files to a lake bucket, under a folder per day; a catalog names the files' columns and partitions;
// a query engine reads only the files a question needs. This course builds that path (§10.2–10.4).
// source: https://docs.aws.amazon.com/prescriptive-guidance/latest/defining-bucket-names-data-lakes/data-layer-definitions.html
const part = (id: string, icon: string, title: string, sub: string, tone?: 'ingest' | 'consume' | 'serve' | 'store') =>
  ({ type: 'item' as const, id, icon, title, sub, stack: true, tone })

export const reportHistory: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'path', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'now', title: 'State: the shop now', tone: 'serve', children: [
            part('db', 'rds', 'orders database', 'one row per order, changed by every checkout'),
          ],
        },
        {
          type: 'group', id: 'past', title: 'History: what happened', tone: 'store', dir: 'row', children: [
            part('export', 'python', 'export job', 'nightly: yesterday\'s orders'),
            part('lake', 's3', 'lake bucket', 'Parquet, a folder per day, never changed'),
            part('catalog', 'glue', 'catalog', 'columns and partitions'),
            part('query', 'athena', 'query engine', 'reads only the days asked about'),
          ],
        },
      ],
    },
    {
      type: 'table', id: 'questions', title: 'Which one answers which question', tone: 'source', columns: ['question', 'asked of', 'because'], rows: [
        ['is order 12 paid?', 'the database', 'one row, right now'],
        ['how many copies of bk-1001 are left?', 'the database', 'it changes with every sale'],
        ['what did we sell yesterday?', 'the lake', 'a day of orders, read once'],
        ['how did September compare with August?', 'the lake', 'two months, summed'],
        { cells: ['a month\'s report, of the database', 'never', 'it slows every checkout while it runs'], tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'shapes', title: 'Two shapes of work', tone: 'ingest', columns: ['', 'the database', 'the lake'], rows: [
        ['reads and writes', 'many, each a few rows', 'few, each millions of rows'],
        ['data', 'changed in place', 'added, never changed'],
        ['stored as', 'rows', 'columns (Parquet), compressed'],
        ['paid for', 'an instance, all day', 'storage, and per query'],
      ],
    },
  ],
  edges: [
    { from: 'db', to: 'export', label: 'nightly' },
    { from: 'export', to: 'lake' },
    { from: 'lake', to: 'catalog' },
    { from: 'catalog', to: 'query' },
  ],
}
