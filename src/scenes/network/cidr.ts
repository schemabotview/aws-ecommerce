import type { Group, SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/network/01-cidr/session.txt?raw'

// §5.1 — ◆ full scene: addresses and CIDR. A canonical big picture that does not fit a side pane:
// the VPC's /16 as address space, carved into nine /24s by tier and AZ, and one /24 opened up to show
// the five addresses AWS keeps. The real numbers are the lab's (spine/network/01-cidr, Python's
// ipaddress module, run locally) — the code node is its output, not a retyping of it.
// source: https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html (the 5 reserved addresses)
const tier = (id: string, title: string, tone: 'ingest' | 'serve' | 'store', third: number): Group => ({
  type: 'group', id, title, tone, dir: 'row', children: ['a', 'b', 'c'].map((az, i) => ({
    type: 'item', id: `${id}-${az}`, title: `10.20.${third + i}.0/24`, sub: `${id}-${az} · eu-west-2${az}`, chip: false,
  })),
})

export const networkCidr: SceneModel = {
  dir: 'row',
  nodes: [
    {
      type: 'group', id: 'anatomy', bare: true, children: [
        {
          type: 'table', id: 'notation', title: 'Reading 10.20.0.0/16', tone: 'source', columns: ['part', 'means'], rows: [
            ['10.20', 'the first 16 bits: fixed, the network'],
            ['.0.0', 'the last 16 bits: free, the hosts'],
            ['/16', '2^(32−16) = 65,536 addresses'],
            ['/24', '2^(32−24) = 256 addresses'],
          ],
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'cidr_plan.py · runs locally', code: trim(session) },
      ],
    },
    {
      type: 'group', id: 'vpc', icon: 'vpc', title: 'VPC 10.20.0.0/16', sub: '65,536 addresses · 2,304 used (3.5%)', tone: 'infra', children: [
        tier('public', 'Public: faces the internet', 'ingest', 0),
        tier('app', 'App: the shop\'s tasks', 'serve', 10),
        tier('data', 'Data: the database', 'store', 20),
        { type: 'item', id: 'room', icon: 'layers', title: '10.20.23.0 – 10.20.255.255', sub: 'free: room for 233 more /24s', tone: 'neutral' },
      ],
    },
    {
      type: 'table', id: 'one', title: 'Inside public-c: 256 addresses', tone: 'consume', columns: ['address', 'kept for'], rows: [
        { id: 'n0', cells: ['10.20.2.0', 'the network itself'], tone: 'consume' },
        { id: 'n1', cells: ['10.20.2.1', 'the VPC router'], tone: 'consume' },
        { id: 'n2', cells: ['10.20.2.2', 'the DNS resolver'], tone: 'consume' },
        { id: 'n3', cells: ['10.20.2.3', 'AWS, for later'], tone: 'consume' },
        { id: 'use', cells: ['10.20.2.4 – .254', '251 for the shop'], tone: 'ingest' },
        { id: 'n255', cells: ['10.20.2.255', 'broadcast'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'public-c', to: 'one', label: 'open one up' },
  ],
}
