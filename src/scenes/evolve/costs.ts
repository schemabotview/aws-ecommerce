import { SIDE_PLOT_W } from '../grid'
import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { evolveTree } from './files'
import code from '../../../spine/evolve/05-costs/project/infra/costs.tf?raw'
import session from '../../../spine/evolve/05-costs/session.txt?raw'

// §12.4 — allocating cost. The default tags every resource already carries (app, env) activated as cost
// allocation tags, read back. tools/spend.py reads a MADE-UP October in the shape of a Cost Explorer
// export (data/spend-october.csv, seeded), totals it by env, finds the day dev passed its 20 USD budget
// (Course 3), and flags a day costing more than twice its 7-day median: the dev NAT gateway on 21–22
// October. Every number is read from the transcript. Emulated: the emulator stores the tag status; it
// keeps no bill.
// source: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html
const envs = session.split('\n').map((l) => l.match(/^env=(\w+)\s+([\d.]+) USD\s+(\d+)%$/)).filter((m) => m !== null)
const passed = session.match(/^dev passed its ([\d.]+) USD budget on (\S+)$/m)?.slice(1) ?? ['?', '?']
const unusual = session.split('\n').map((l) => l.match(/^unusual: (\S+) (.+), env=(\w+): ([\d.]+) against ([\d.]+) \(([\d.]+)x\)$/)).filter((m) => m !== null)

export const evolveCosts: SceneModel = ideFrame({
  tree: evolveTree(5, { active: 'infra/costs.tf', fresh: ['infra/costs.tf', 'data/spend-october.csv', 'tools/spend.py'] }),
  editor: { file: 'infra/costs.tf', code, highlight: [lineOf(code, 'for_each = toset(["app", "env"])'), lineOf(code, 'status   = "Active"')] },
  session,
  keep: [['$ aws ce list-cost-allocation-tags', 'env\tActive'], ['$ python -m tools.spend', `unusual: ${unusual.at(-1)?.[1] ?? '?'}`]],
  side: [
    {
      type: 'group', id: 'diagram', bare: true, children: [
        {
          type: 'plot', id: 'by-env', compact: true, w: SIDE_PLOT_W, title: 'October by env tag (made up)',
          x: { labels: envs.map((m) => m[1]), label: 'env' }, y: { min: 0, max: 250, step: 50, label: 'USD' },
          series: [{ kind: 'bar', points: envs.map((m, i) => [i, Number(m[2])]), tone: 'store' }],
        },
        { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the tags are activated and read back; the emulator keeps no bill. October\'s spend is made up, in the shape of a Cost Explorer export.' },
      ],
    },
    {
      type: 'table', id: 'found', title: 'What the tags made visible (October)', tone: 'ingest', columns: ['day', 'what', 'cost'], rows: [
        { cells: [passed[1].slice(5), `dev > ${passed[0]} USD`, 'email to alex'], tone: 'consume' },
        ...unusual.map((m) => ({ cells: [m[1].slice(5), `${m[2]}, ${m[3]}`, `${m[4]} (${m[6]}×)`], tone: 'consume' as const })),
      ],
    },
  ],
})
