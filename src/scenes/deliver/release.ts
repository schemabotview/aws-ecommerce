import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/deliver/08-release/session.txt?raw'

// §9.8 — ◆ full scene: releasing a new version. Book shop 1.2.0 fails 2% of requests; the error alarm
// fires 120 s after the first failure and the release is rolled back. The failed requests per
// strategy are release_model.py's (a lab, spine/deliver/08-release), read from its output: a MODEL,
// said on screen. ECS's own deployment options (rolling, blue/green with CodeDeploy, canary or
// linear shifts) are its documentation.
// source: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html
const rows = session.split('\n').filter((l) => /^\s+\d+\s+\d+/.test(l)).map((l) => l.trim().split(/\s+/).map(Number))
const series = (i: number) => [[0, 0], ...rows.map((r) => [r[0], r[i]])] as [number, number][]
const total = (i: number) => rows.at(-1)?.[i] ?? 0

export const deliverRelease: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'ways', title: 'Four ways to replace 1.1.0 with 1.2.0', tone: 'source', children: [
            { type: 'item', id: 'all', icon: 'zap', title: 'all at once', sub: 'every task replaced together' },
            { type: 'item', id: 'rolling', icon: 'layers', title: 'rolling', sub: 'one task of 7 a minute (ECS default style)' },
            { type: 'item', id: 'bluegreen', icon: 'ecsservice', title: 'blue/green', sub: 'a full new set; traffic switches; going back is one switch' },
            { type: 'item', id: 'canary', icon: 'search', title: 'canary', sub: '10% of traffic first; the rest after it proves itself', tone: 'ingest' },
          ],
        },
        {
          type: 'plot', id: 'failed', title: 'Failed requests before the alarm (a model)', x: { min: 0, max: 120, step: 20, label: 'seconds after release' },
          y: { min: 0, max: 1100, step: 200, label: 'failed requests' },
          series: [
            { kind: 'line', points: series(1), label: `all at once ${total(1)}`, tone: 'consume' },
            { kind: 'line', points: series(2), label: `rolling ${total(2)}`, tone: 'store' },
            { kind: 'line', points: series(3), label: `canary ${total(3)}`, tone: 'ingest' },
          ],
        },
      ],
    },
    {
      type: 'group', id: 'bottom', bare: true, dir: 'row', children: [
        { type: 'code', id: 'lab', terminal: true, filename: 'release_model.py · a model', code: trim(session) },
        {
          type: 'table', id: 'trade', title: 'What each one costs', tone: 'source', columns: ['', 'exposed to a bad version', 'needs'], rows: [
            ['all at once', 'everyone, at once', 'nothing extra'],
            ['rolling', 'a growing share', 'room for one more task'],
            ['blue/green', 'everyone, but back in one switch', 'twice the tasks, briefly'],
            { cells: ['canary', 'a tenth, until it is trusted', 'traffic splitting, an alarm'], tone: 'ingest' },
          ],
        },
      ],
    },
  ],
}
