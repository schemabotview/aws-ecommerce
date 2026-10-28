import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import { BUILT, mapFrame } from '../map'
import session from '../../../spine/data/04-database/session.txt?raw'

// §7.4 — an orders database (map frame). RDS PostgreSQL 16.9, a Multi-AZ INSTANCE (one primary, one
// standby kept in step synchronously, not readable), in the data subnets behind sg db, its password
// managed by RDS in Secrets Manager. The zones are read back from the emulator (rds-standby patch);
// replication and failover are AWS's documented behaviour, not emulated.
// source: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html
const rows = terminal(session)
const zones = session.split('\n').find((l) => /^True\t/.test(l))?.split('\t') ?? []

export const dataDatabase: SceneModel = mapFrame({
  built: [...BUILT.run, 'photos'],
  fresh: ['db-a', 'db-b', 'secrets'],
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop · emulated', code: rows, fill: true,
      show: keepLines(rows, ['aws_db_instance.orders will be created', '+ engine_version', '+ multi_az', 'Apply complete!',
        ['$ aws rds describe-db-instances', 'eu-west-2b'], ['$ aws rds describe-db-instances', 'secret:rds!db']]),
    },
    {
      type: 'group', id: 'pair', title: 'A Multi-AZ instance: one name, two copies', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'primary', icon: 'rds', title: `primary, ${zones[1] ?? '?'}`, sub: 'takes every read and write', stack: true },
        { type: 'item', id: 'standby', icon: 'rds', title: `standby, ${zones[2] ?? '?'}`, sub: 'a synchronous copy; takes over', stack: true },
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the emulator records the instance, its zones and its secret; it runs no database. The SQL runs in PostgreSQL 16 locally (§7.5).' },
  ],
  edges: [{ from: 'primary', to: 'standby', label: 'every write, before it commits' }],
})
