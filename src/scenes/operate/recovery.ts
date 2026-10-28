import type { SceneModel } from '@graphlearning/graphl-flow'

// §11.9 — ◆ full scene: disaster recovery. The four strategies of AWS's DR whitepaper, ordered by
// how fast they recover and so by what keeps running in a second Region; the recovery times are the
// whitepaper's own orders of magnitude, not measurements. The shop's choice is the first, with §11.7's
// copy in another ACCOUNT (not yet another Region), and the frame says what moving right would add.
// source: https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html
const strategy = (id: string, title: string, sub: string, tone?: 'ingest' | 'serve' | 'consume' | 'store') =>
  ({ type: 'group' as const, id, title, tone, children: [{ type: 'item' as const, id: `${id}-what`, icon: 'region', title: sub, stack: true }] })

export const operateRecovery: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'ladder', bare: true, dir: 'row', children: [
        strategy('backup', 'Backup and restore', 'backups only; rebuild when needed', 'ingest'),
        strategy('pilot', 'Pilot light', 'data copied live; servers off', 'serve'),
        strategy('warm', 'Warm standby', 'a small copy, always running', 'store'),
        strategy('active', 'Active / active', 'two full shops, both serving', 'consume'),
      ],
    },
    {
      type: 'table', id: 'compare', title: 'Faster recovery costs more of a second Region (AWS\'s DR whitepaper)', tone: 'source',
      columns: ['', 'recovery time', 'data lost', 'runs in the second Region'], rows: [
        ['backup and restore', 'hours', 'since the last backup', 'nothing'],
        ['pilot light', 'tens of minutes', 'seconds to minutes', 'the data, replicated'],
        ['warm standby', 'minutes', 'seconds', 'everything, scaled down'],
        ['active / active', 'none to seconds', 'none to seconds', 'everything, at full size'],
        { cells: ['the shop today', 'hours', 'up to a day', 'nothing: copies in the audit account'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'backup', to: 'pilot' },
    { from: 'pilot', to: 'warm' },
    { from: 'warm', to: 'active' },
  ],
}
