import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { evolveTree } from './files'
import code from '../../../spine/evolve/06-adr/project/docs/adr/001-order-platform.md?raw'
import session from '../../../spine/evolve/06-adr/session.txt?raw'

// §12.5 — a decision record. docs/adr/001-order-platform.md: where the orders live, with MUSTS (an
// option failing one is out) and weighted WANTS; tools/score.py computes the ranking from the record's
// own tables, so the numbers on screen are arithmetic over the file. The scores are the team's
// judgement, and the record says so by being one.
// source: https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html
const ranked = session.split('\n').map((l) => l.match(/^(.+?)\s{2,}(\d+ of \d+|out: fails a must)$/)).filter((m) => m !== null)

export const evolveAdr: SceneModel = ideFrame({
  tree: evolveTree(6, { active: 'docs/adr/001-order-platform.md', fresh: ['docs/adr/001-order-platform.md', 'tools/score.py'] }),
  editor: { file: 'docs/adr/001-order-platform.md', code, lang: 'text', show: [[lineOf(code, '## Musts'), lineOf(code, '| headroom')], [lineOf(code, 'Stay on RDS PostgreSQL'), lineOf(code, 'Stay on RDS PostgreSQL') + 1]],
    highlight: [lineOf(code, '| the reports\' SQL runs unchanged'), lineOf(code, '| monthly cost at today\'s load'), lineOf(code, 'Stay on RDS PostgreSQL')] },
  session,
  side: [
    {
      type: 'group', id: 'process', title: 'How a decision is made, once', tone: 'source', children: [
        { type: 'item', id: 'musts', icon: 'filter', title: 'musts', sub: 'fail one and the option is out', stack: true },
        { type: 'item', id: 'wants', icon: 'table', title: 'wants, weighted', sub: 'score × weight, summed', stack: true },
        { type: 'item', id: 'record', icon: 'file', title: 'the record', sub: 'kept beside the code', stack: true, tone: 'ingest' },
        { type: 'item', id: 'revisit', icon: 'clock', title: 'a reason to revisit', sub: 'here: 10 times the orders', stack: true },
      ],
    },
    {
      type: 'table', id: 'result', title: 'tools/score.py, from the record', tone: 'ingest', columns: ['option', 'result'],
      rows: ranked.map((m, i) => (i === 0 ? { cells: [m[1], m[2]], tone: 'ingest' as const } : [m[1], m[2]])),
    },
  ],
  edges: [
    { from: 'musts', to: 'wants' },
    { from: 'wants', to: 'record' },
    { from: 'record', to: 'revisit' },
  ],
})
