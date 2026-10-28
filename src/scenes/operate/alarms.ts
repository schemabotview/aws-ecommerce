import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { operateTree } from './files'
import code from '../../../spine/operate/03-alarms/project/infra/alerts.tf?raw'
import session from '../../../spine/operate/03-alarms/session.txt?raw'

// §11.3 — objectives and alarms. An SLO (99.5% of requests succeed over 30 days) leaves an error budget
// of 0.5%; two burn-rate alarms on errors / requests (metric math) notify book-shop-alerts → alex's
// email: fast, 14.4× over 5 minutes; slow, 6× over the hour (the multi-window idea from Google's SRE
// workbook, here as two single windows). The emulator STORES alarms and never evaluates them:
// tools/burn.py reads the same metrics and applies the same thresholds, and the frame says so. The
// plot is its rows, parsed.
// source: https://sre.google/workbook/alerting-on-slos/
// source: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create-alarm-on-metric-math-expression.html
const rows = session.split('\n').map((l) => l.match(/^(\d\d:\d\d)\s+(\d+)\s+([\d.]+)%\s+([\d.]+)x/)).filter((m) => m !== null)
const hour = session.match(/^the hour: ([\d.]+)%, burn ([\d.]+)x, slow alarm: (\w+)$/m)?.slice(1) ?? ['?', '?', '?']
const firing = rows.filter((m) => /ALARM$/.test(m.input ?? ''))

export const operateAlarms: SceneModel = ideFrame({
  tree: operateTree(3, { active: 'infra/alerts.tf', fresh: ['infra/alerts.tf', 'tools/burn.py'] }),
  editor: { file: 'infra/alerts.tf', code, show: [[lineOf(code, 'locals {'), lineOf(code, 'alarm_actions')]],
    highlight: [lineOf(code, 'fast = {'), lineOf(code, 'slow = {'), lineOf(code, 'alarm_actions')] },
  session,
  keep: [['$ aws cloudwatch describe-alarms', 'book-shop-burn-slow'], '$ python -m tools.burn', ['18:20', '18:30'], 'the hour:'],
  side: [
    {
      type: 'group', id: 'path', title: 'From a burning budget to a person', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'rate', icon: 'activity', title: 'errors ÷ requests', sub: 'metric math', stack: true },
        { type: 'item', id: 'alarm', icon: 'bell', title: 'burn alarms', sub: 'fast 7.2%, slow 3%', stack: true },
        { type: 'item', id: 'topic', icon: 'sns', title: 'book-shop-alerts', sub: 'an email to alex', stack: true, tone: 'consume' },
      ],
    },
    {
      type: 'plot', id: 'burn-plot', compact: true, title: 'Last night\'s burn rate (dashed: the fast alarm, 14.4×)',
      x: { labels: rows.map((m) => m[1].slice(3)), label: 'minutes after 18:00, 1 November' }, y: { min: 0, max: 30, step: 10, label: 'burn (×)' },
      series: [
        { kind: 'bar', points: rows.map((m, i) => [i, Number(m[4])]), tone: 'consume' },
        { kind: 'segment', from: [-0.5, 14.4], to: [rows.length - 0.5, 14.4] },
      ],
    },
    {
      type: 'table', id: 'verdict', title: 'What the alarms would have said (tools/burn.py)', tone: 'ingest', columns: ['alarm', 'window', 'last night'], rows: [
        ['fast: 14.4×', '5 minutes', `ALARM ${firing.map((m) => m[1]).join(', ')}`],
        ['slow: 6×', 'the hour', `${hour[2]}: ${hour[0]}%, ${hour[1]}×`],
        ['the budget', '30 days', '0.5% of requests may fail'],
      ],
    },
  ],
  edges: [
    { from: 'rate', to: 'alarm' },
    { from: 'alarm', to: 'topic' },
  ],
})
