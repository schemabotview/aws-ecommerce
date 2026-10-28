import type { SceneModel, SceneNode } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { reportTree } from './files'
import code from '../../../spine/report/04-query/project/reports/yesterday.sql?raw'
import session from '../../../spine/report/04-query/session.txt?raw'
import exported from '../../../spine/report/02-export/session.txt?raw'

// §10.4 — querying it. An Athena workgroup (results bucket, a 1 GiB scan cutoff) and one SQL file,
// handed to Athena as typed: the emulator RECORDS the query (an id) and does not run it, and the frame
// says so. DuckDB runs the same file over a copy of the lake's files, with the catalog's table defined
// as the catalog defines it; its own EXPLAIN ANALYZE says how many of the day files it read. Every
// number is read from the transcript.
// source: https://docs.aws.amazon.com/athena/latest/ug/workgroups-setting-control-limits-cloudwatch.html
// source: https://duckdb.org/docs/data/partitioning/hive_partitioning
const top = session.split('\n').filter((l) => /^bk-\d+\s+\d+ copies/.test(l))
  .map((l) => l.split(/\s{2,}/).map((c) => c.trim()))
const [read, of] = (session.match(/^files read: (\d+)\/(\d+)$/m)?.slice(1) ?? ['?', '?']).map(Number)
// What the filter saved, in bytes: the day's file against the month (both from the export's transcript).
const dayBytes = Number(exported.match(/^\S+ \S+\s+(\d+) orders\.parquet$/m)?.[1] ?? NaN)
const monthKib = Number(exported.match(/, ([\d,]+) KiB$/m)?.[1].replace(/,/g, '') ?? NaN)
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KiB`
const day = code.match(/dt = '(\d{4}-\d{2}-(\d{2}))'/)?.[2] ?? '?'

// One chip per day folder: the day the filter names is read, every other is skipped unopened.
const days: SceneNode[] = Array.from({ length: of }, (_, i) => {
  const d = String(i + 1).padStart(2, '0')
  return { type: 'item', id: `day-${d}`, title: `dt=…-${d}`, muted: d !== day || undefined, tone: d === day ? 'ingest' : undefined }
})

export const reportQuery: SceneModel = ideFrame({
  tree: reportTree(4, { active: 'reports/yesterday.sql', fresh: ['infra/athena.tf', 'reports/yesterday.sql', 'tools/sales.py'] }),
  editor: { file: 'reports/yesterday.sql', code, lang: 'sql', highlight: [lineOf(code, 'WHERE dt =')] },
  session,
  keep: [['$ aws athena start-query-execution', 'files read:']],
  side: [
    {
      type: 'group', id: 'lake', title: `order_history: ${of} day folders, ${read} read`, tone: 'source', dir: 'grid', cols: 6, children: days,
    },
    {
      type: 'table', id: 'answer', title: `What sold on September ${Number(day)} (DuckDB, the same SQL)`, tone: 'ingest',
      columns: ['book', 'copies', 'sales'], rows: top.map(([book, copies, sales]) => [book, copies.replace(' copies', ''), sales]),
    },
    {
      type: 'table', id: 'saved', title: 'What the filter on dt saves', tone: 'source', columns: ['', 'read', 'billed as'], rows: [
        ['without it: the month', `${of} files, ${monthKib} KiB`, 'every byte'],
        { cells: [`with it: ${read} day`, `${read} file, ${kb(dayBytes)}`, `${Math.round((100 * dayBytes) / (monthKib * 1024))}% of that`], tone: 'ingest' },
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: Athena accepted the query and gave it an id; the emulator does not run it. DuckDB ran the same SQL over the same files.' },
  ],
  edges: [{ from: `day-${day}`, to: 'answer' }],
})
