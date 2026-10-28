import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { runTree } from './files'
import code from '../../../spine/run/07-scaling/project/infra/scaling.tf?raw'
import session from '../../../spine/run/07-scaling/session.txt?raw'
import peak from '../../../spine/run/07-peak/session.txt?raw'

// §6.7 — scaling. Target tracking on the service's average CPU (60%), 3 to 12 tasks, read back from
// the emulator. The loop and the evening are the lab's (spine/run/07-peak, a MODEL: 100 req/s per
// task at full CPU, 2 minutes to start a task, an alarm after 3 minutes above target). The plots are
// drawn from the lab's own rows, parsed here, never typed.
// source: https://docs.aws.amazon.com/autoscaling/application/userguide/application-auto-scaling-target-tracking.html
const rows = peak.split('\n').map((l) => l.match(/^(\d+):(\d+)\s+(\d+)\s+(\d+)%\s+(\d+)\s+(\d+)/)).filter((m) => m !== null)
const at = (m: RegExpMatchArray) => (+m[1] - 17) * 60 + +m[2] - 40 // minutes after 17:40
const cpu = rows.map((m) => [at(m), +m[4]] as [number, number])
const tasks = rows.map((m) => [at(m), +m[5]] as [number, number])
const span = { min: at(rows[0]), max: at(rows[rows.length - 1]), step: 4, label: 'minutes after 17:40' }

export const runScaling: SceneModel = ideFrame({
  tree: runTree(7, { active: 'infra/scaling.tf', fresh: ['infra/scaling.tf'] }),
  editor: { file: 'infra/scaling.tf', code, show: [[lineOf(code, 'resource "aws_appautoscaling_policy"'), code.trimEnd().split('\n').length]], highlight: linesFrom(code, 'target_tracking_scaling_policy_configuration', 'scale_in_cooldown') },
  session,
  keep: ['Apply complete!', ['$ aws application-autoscaling describe-scalable-targets', '3\t12'], ['$ POLICY=', '60\t60\t300']],
  side: [
    {
      type: 'group', id: 'loop', title: 'The loop, once a minute', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'metric', icon: 'cloudwatch', title: 'average CPU', sub: 'of the service', stack: true },
        { type: 'item', id: 'alarm', icon: 'bell', title: 'alarm', sub: '3 minutes above 60%', stack: true },
        { type: 'item', id: 'desired', icon: 'ecsservice', title: 'desired count', sub: 'tasks × CPU ÷ 60', stack: true },
      ],
    },
    {
      type: 'plot', id: 'cpu-plot', compact: true, title: 'The evening peak: average CPU (a model)', x: span, y: { min: 0, max: 100, step: 20, label: '% CPU' },
      series: [{ kind: 'line', points: cpu, label: 'CPU', tone: 'consume' }, { kind: 'segment', from: [span.min, 60], to: [span.max, 60], label: 'target' }],
    },
    {
      type: 'plot', id: 'tasks-plot', compact: true, title: 'Tasks in service', x: span, y: { min: 0, max: 8, step: 2, label: 'tasks' },
      series: [{ kind: 'line', points: tasks, label: 'tasks', tone: 'serve' }],
    },
  ],
  edges: [
    { from: 'metric', to: 'alarm' },
    { from: 'alarm', to: 'desired' },
  ],
})
