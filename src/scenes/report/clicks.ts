import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { reportTree } from './files'
import code from '../../../spine/report/05-clicks/project/infra/clicks.tf?raw'
import session from '../../../spine/report/05-clicks/session.txt?raw'
import lag from '../../../spine/report/05-lag/session.txt?raw'

// §10.5 — a stream of clicks. A Kinesis stream, two shards; tools/clicks.py sends 1,000 MADE-UP clicks
// keyed by session and reports the shard each landed on (PutRecords' own answer), then reads each shard
// back from its start. Emulated: moto assigns shards by the key's MD5 hash range, as Kinesis does. The
// lag plot is the lab spine/report/05-lag, a MODEL (600 clicks/s per consumer, an evening peak of
// 1,600/s), parsed from its rows, never typed.
// source: https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html
const shards = [...session.matchAll(/^ {2}(shardId-\d+): (\d+) clicks, (\d+) sessions$/gm)].map((m) => ({ id: m[1], clicks: m[2], sessions: m[3] }))
const rows = lag.split('\n').map((l) => l.match(/^(\d+):(\d+)\s+(\d+)\s+(\d+) s\s+(\d+) s$/)).filter((m) => m !== null)
const at = (m: RegExpMatchArray) => +m[1] + +m[2] / 60
const two = rows.map((m) => [at(m), +m[4]] as [number, number])
const four = rows.map((m) => [at(m), +m[5]] as [number, number])
const short = (id: string) => `shard ${Number(id.split('-')[1])}`

export const reportClicks: SceneModel = ideFrame({
  tree: reportTree(5, { active: 'infra/clicks.tf', fresh: ['infra/clicks.tf', 'tools/clicks.py'] }),
  editor: { file: 'infra/clicks.tf', code, highlight: [lineOf(code, 'shard_count'), lineOf(code, 'retention_period')] },
  session,
  keep: ['Apply complete!', ['$ python -m tools.clicks', 'read shardId-000000000001']],
  side: [
    {
      type: 'group', id: 'stream', title: 'One key, one shard, in order', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'pages', icon: 'fargate', title: 'shop pages', sub: 'key = the session', stack: true },
        {
          type: 'group', id: 'shards', title: 'book-shop-clicks', tone: 'ingest', children: shards.map((s) => (
            { type: 'item' as const, id: s.id, icon: 'kinesis', title: short(s.id), sub: `${s.clicks} clicks, ${s.sessions} sessions`, stack: true })),
        },
        { type: 'item', id: 'reader', icon: 'lambda', title: 'a consumer', sub: 'one per shard', stack: true },
      ],
    },
    {
      type: 'plot', id: 'lag-plot', compact: true, title: 'How far behind the consumer falls (a model)',
      x: { min: 17, max: 20, step: 0.5, label: 'evening (hours)' }, y: { min: 0, max: 400, step: 100, label: 'lag, s' },
      series: [{ kind: 'line', points: two, label: '2 shards', tone: 'consume' }],
    },
    { type: 'note', id: 'four', tone: 'ingest', text: `With 4 shards, each gets a quarter of the peak: the model's lag stays at ${Math.max(...four.map(([, s]) => s))} s all evening.` },
  ],
  edges: [
    { from: 'pages', to: 'shards', label: 'PutRecords' },
    { from: 'shards', to: 'reader' },
  ],
})
