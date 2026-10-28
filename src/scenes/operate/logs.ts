import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { operateTree } from './files'
import code from '../../../spine/operate/02-logs/project/infra/observe.tf?raw'
import session from '../../../spine/operate/02-logs/session.txt?raw'

// §11.2 — logs and metrics. Two metric filters on the app's log group (every request; status ≥ 500)
// turn the JSON lines the app already prints into metrics. tools/evening.py writes a MADE-UP evening
// (seeded: 200 requests a minute, payments down 18:20–18:34) into the real log group;
// the emulator STORES metric filters but never runs them, so tools/count_errors.py applies the same
// two rules to the events it reads back and publishes the counts, as CloudWatch would. The read-back
// (get-metric-statistics, 10-minute sums) is the emulator's. Every number is read from the transcript.
// source: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/MonitoringLogData.html
const sums = session.split('\n').map((l) => l.match(/^2026-11-01T(\d\d:\d\d):00\+00:00\t([\d.]+)$/)).filter((m) => m !== null)
const [total, errors] = session.match(/^([\d,]+) requests, ([\d,]+) errors/m)?.slice(1) ?? ['?', '?']
const worst = session.match(/^worst minute (\d\d:\d\d): (\d+) of (\d+) failed$/m)?.slice(1) ?? ['?', '?', '?']

export const operateLogs: SceneModel = ideFrame({
  tree: operateTree(2, { active: 'infra/observe.tf', fresh: ['infra/observe.tf', 'tools/evening.py', 'tools/count_errors.py'] }),
  editor: { file: 'infra/observe.tf', code, show: [[lineOf(code, 'locals {'), code.trimEnd().split('\n').length]],
    highlight: [lineOf(code, 'Errors5xx = "{ $.status >= 500 }"'), lineOf(code, 'log_group_name'), lineOf(code, 'namespace     = "BookShop"')] },
  session,
  keep: [['$ python -m tools.evening', 'worst minute'], '$ aws cloudwatch get-metric-statistics',
    ['2026-11-01T18:20', '2026-11-01T18:30']],
  side: [
    {
      type: 'group', id: 'path', title: 'From a log line to a number', tone: 'source', children: [
        { type: 'item', id: 'app', icon: 'fargate', title: 'the app', sub: '{"status": 503, …}', stack: true },
        { type: 'item', id: 'group', icon: 'cloudwatch', title: '/book-shop/app', sub: 'every line, 30 days', stack: true },
        { type: 'item', id: 'filter', icon: 'filter', title: 'metric filters', sub: 'status >= 500', stack: true },
        { type: 'item', id: 'metric', icon: 'activity', title: 'BookShop/Errors5xx', sub: 'a count a minute', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'plot', id: 'errors-plot', compact: true, title: `Errors, 10 minutes at a time (${errors} of ${total})`,
      x: { labels: sums.map((m) => m[1]), label: '1 November' }, y: { min: 0, max: 300, step: 100, label: 'errors' },
      series: [{ kind: 'bar', points: sums.map((m, i) => [i, Number(m[2])]), tone: 'consume' }],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: `Emulated: the filters are stored, not run. tools/count_errors.py applied the same rules to the events and published the counts (worst minute ${worst[0]}: ${worst[1]} of ${worst[2]}).` },
  ],
  edges: [
    { from: 'app', to: 'group' },
    { from: 'group', to: 'filter' },
    { from: 'filter', to: 'metric' },
  ],
})
