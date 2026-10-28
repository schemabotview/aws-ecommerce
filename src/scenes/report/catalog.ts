import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { reportTree } from './files'
import code from '../../../spine/report/03-catalog/project/infra/catalog.tf?raw'
import session from '../../../spine/report/03-catalog/session.txt?raw'

// §10.3 — a catalog for the lake. A Glue database and an external table over order_history/: the
// files' columns (matching the export's fixed Parquet schema) and one partition key, dt, found by
// PARTITION PROJECTION — the engine works out a day's folder from the template and the query's
// filter, so no crawler or ALTER TABLE ever adds a partition. The columns are read back from the
// emulated Glue (stored, as Glue stores them; projection is applied by Athena, not by Glue).
// source: https://docs.aws.amazon.com/athena/latest/ug/partition-projection.html
const columns = session.split('\n').filter((l) => /^\w+\t[\w(),]+$/.test(l)).map((l) => l.split('\t'))
const PARQUET: Record<string, string> = { int: 'int32', string: 'string', 'decimal(8,2)': 'decimal128(8, 2)', timestamp: 'timestamp, UTC' }

export const reportCatalog: SceneModel = ideFrame({
  tree: reportTree(3, { active: 'infra/catalog.tf', fresh: ['infra/catalog.tf'] }),
  editor: { file: 'infra/catalog.tf', code, show: [[lineOf(code, 'resource "aws_glue_catalog_table"'), lineOf(code, 'type = "string"') + 1]],
    highlight: [lineOf(code, '"projection.enabled"'), lineOf(code, '"storage.location.template"'), lineOf(code, 'name = "dt"')] },
  session,
  keep: ['Apply complete!', ['$ aws glue get-table', 'placed\ttimestamp']],
  side: [
    {
      type: 'group', id: 'lookup', title: 'How a query finds a day\'s files', tone: 'source', children: [
        { type: 'item', id: 'query', icon: 'athena', title: 'WHERE dt = \'2026-09-30\'', sub: 'a query names a day', stack: true },
        { type: 'item', id: 'table', icon: 'glue', title: 'book_shop_lake.order_history', sub: 'columns; dt is a projected partition', stack: true },
        { type: 'item', id: 'folder', icon: 's3', title: 'order_history/dt=2026-09-30/', sub: 'worked out from the template: no lookup', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'table', id: 'columns', title: 'The table\'s columns, read back, and the files\'', tone: 'ingest', columns: ['column', 'catalog', 'Parquet file'],
      rows: columns.map(([name, type]) => [name, type, PARQUET[type] ?? '?']),
    },
  ],
  edges: [
    { from: 'query', to: 'table' },
    { from: 'table', to: 'folder', label: 'storage.location.template' },
  ],
})
