import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/how-aws-runs/01-zones/session.txt?raw'

// §2.1 — ◆ full scene: Regions, AZs and the edge. eu-west-2 (London) and its three Availability Zones,
// named and identified as the lab's describe-availability-zones answered (emulated: the emulator answers
// as the API does; the zone IDs are its own), each one or more data centres; edge locations outside any
// Region. What fails together: a data centre, a zone, a Region — and what each design survives.
// source: https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html
const zones = session.split('\n').map((l) => l.match(/^(eu-west-2[a-z])\t(\S+)\t/)).filter((m) => m !== null)
const dc = (id: string) => ({ type: 'item' as const, id, icon: 'server', title: 'data centre', stack: true })

export const howRegions: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'region', title: 'Region eu-west-2 (London)', icon: 'region', dashed: true, tone: 'source', dir: 'row', children: zones.map((m) => ({
            type: 'group' as const, id: `az-${m[1]}`, title: `${m[1]} · ${m[2]}`, dashed: true, tone: 'ingest' as const, children: [dc(`${m[1]}-1`), dc(`${m[1]}-2`)],
          })),
        },
        {
          type: 'group', id: 'edge', title: 'Edge locations', tone: 'serve', children: [
            { type: 'item', id: 'e-london', icon: 'cloudfront', title: 'London', sub: 'and hundreds more, worldwide', stack: true },
            { type: 'item', id: 'e-sydney', icon: 'cloudfront', title: 'Sydney', sub: 'CloudFront, Route 53', stack: true },
          ],
        },
      ],
    },
    {
      type: 'group', id: 'bottom', bare: true, dir: 'row', children: [
        { type: 'code', id: 'lab', terminal: true, filename: 'terminal · emulated', code: trim(session) },
        {
          type: 'table', id: 'fails', title: 'What fails together, and what survives it', tone: 'source', columns: ['fails', 'survived by'], rows: [
            ['a server', 'any service that keeps 2 copies'],
            ['a data centre', 'its zone\'s other data centres'],
            { cells: ['a zone', 'running in 2 or 3 zones (the shop: 3)'], tone: 'ingest' },
            { cells: ['a Region', 'a second Region (Course 11)'], tone: 'consume' },
          ],
        },
      ],
    },
  ],
}
