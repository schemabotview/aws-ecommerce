import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { operateTree } from './files'
import code from '../../../spine/operate/07-backup/project/infra/backup.tf?raw'
import session from '../../../spine/operate/07-backup/session.txt?raw'

// §11.7 — backups that restore. AWS Backup: a vault encrypted with the shop's key, a nightly plan
// (03:00 UTC, kept 35 days) with a copy to the audit account's vault (kept 90), and a selection of
// the orders database and the carts and stock tables, under the BookShopBackup role (AWS's managed
// backup policy). The plan's rule and the selection are read back. Emulated: the emulator stores the
// plan and selection and takes no backups; the copy's vault lives in the audit account, outside this
// chain. A backup is only proved by a restore: the drill's steps are AWS's documented ones.
// source: https://docs.aws.amazon.com/aws-backup/latest/devguide/restoring-a-backup.html
const rule = session.match(/^(\w+)\tcron\(([^)]+)\)$/m)?.slice(1) ?? ['?', '?']
// The selection's ARNs, with the pane's 80-column wrapping undone.
const chosen = session.replace(/^(.{80})\n/gm, '$1')

export const operateBackup: SceneModel = ideFrame({
  tree: operateTree(7, { active: 'infra/backup.tf', fresh: ['infra/backup.tf'] }),
  editor: { file: 'infra/backup.tf', code, show: [[lineOf(code, 'resource "aws_backup_plan" "nightly"'), lineOf(code, 'delete_after = 90') + 3]],
    highlight: [lineOf(code, 'schedule'), lineOf(code, 'delete_after = 35'), lineOf(code, 'destination_vault_arn')] },
  session,
  keep: ['Apply complete!', ['$ aws backup get-backup-plan', 'nightly\t'], ['$ aws backup get-backup-selection', 'book-shop-stock']],
  side: [
    {
      type: 'group', id: 'path', title: `Every night at 03:00 (${rule[0]}: ${rule[1]})`, tone: 'source', children: [
        {
          type: 'group', id: 'chosen', title: 'selected', tone: 'serve', dir: 'row', children: [
            { type: 'item', id: 'db', icon: 'rds', title: 'orders database', stack: true, muted: !chosen.includes('db:book-shop-orders') || undefined },
            { type: 'item', id: 'carts', icon: 'dynamodb', title: 'carts, stock', stack: true, muted: !chosen.includes('book-shop-stock') || undefined },
          ],
        },
        { type: 'item', id: 'vault', icon: 'backup', title: 'vault book-shop', sub: 'kept 35 days, our key', stack: true },
        { type: 'item', id: 'copy', icon: 'account', title: 'audit 7777…', sub: 'a copy, kept 90 days', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'table', id: 'drill', title: 'The restore drill, every quarter (AWS\'s steps)', tone: 'ingest', columns: ['step', 'proves'], rows: [
        ['pick last night\'s recovery point', 'a backup exists'],
        ['restore it as a NEW instance', 'it restores, and how long it takes'],
        ['run the app\'s checks against it', 'the data is whole'],
        ['write down the time taken', 'the real recovery time'],
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the plan and selection are stored and read back; the emulator takes no backups.' },
  ],
  edges: [
    { from: 'chosen', to: 'vault' },
    { from: 'vault', to: 'copy', label: 'copy' },
  ],
})
