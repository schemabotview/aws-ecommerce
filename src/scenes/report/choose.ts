import type { SceneModel } from '@graphlearning/graphl-flow'

// §10.6 — ◆ full scene: lake, warehouse or cluster. Three ways to answer questions about history, each
// placed by the shape of the work, not by fashion: query the files where they lie (Athena: nothing to
// run, paid per data scanned), load them into a warehouse (Redshift: tables kept warm for many
// repeated queries, joins and dashboards), or run a cluster of your own code over them (EMR: Spark, for
// transformations SQL does not express). The shop is at the first: 30,000 orders a month, a few
// reports a day. AWS's decision guide draws the same three.
// source: https://docs.aws.amazon.com/decision-guides/latest/analytics-on-aws-how-to-choose/analytics-on-aws-how-to-choose.html
const part = (id: string, icon: string, title: string, sub: string) => ({ type: 'item' as const, id, icon, title, sub, stack: true })

export const reportChoose: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'files', title: 'The lake: the same Parquet files, read by any of them', tone: 'store', dir: 'row', children: [
        part('lake', 's3', 'book-shop-lake', 'order_history/dt=…/'),
        part('catalog', 'glue', 'the catalog', 'one table definition, shared'),
      ],
    },
    {
      type: 'group', id: 'engines', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'athena', title: 'Query in place', tone: 'ingest', children: [
            part('athena-e', 'athena', 'Athena', 'SQL over the files; nothing runs between queries'),
          ],
        },
        {
          type: 'group', id: 'redshift', title: 'Load into a warehouse', tone: 'serve', children: [
            part('redshift-e', 'redshift', 'Redshift', 'tables kept ready; many queries, many people'),
          ],
        },
        {
          type: 'group', id: 'emr', title: 'Run a cluster', tone: 'infra', children: [
            part('emr-e', 'emr', 'EMR', 'your own Spark code over the files'),
          ],
        },
      ],
    },
    {
      type: 'table', id: 'fits', title: 'Which one fits', tone: 'source', columns: ['', 'Athena', 'Redshift', 'EMR'], rows: [
        ['queries', 'a few a day, ad hoc', 'many, repeated, dashboards', 'jobs, not queries'],
        ['you write', 'SQL', 'SQL, plus loading', 'code (Spark, Python)'],
        ['you pay for', 'data each query scans', 'the cluster, or the work done', 'the cluster while it runs'],
        ['you run', 'nothing', 'a cluster, or serverless', 'a cluster'],
        { cells: ['the shop today', 'yes: 30,000 orders a month', 'when reports become dashboards', 'when SQL is not enough'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'files', to: 'athena' },
    { from: 'files', to: 'redshift' },
    { from: 'files', to: 'emr' },
  ],
}
