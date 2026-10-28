import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { dataTree } from './files'
import code from '../../../spine/data/02-catalog/project/infra/s3.tf?raw'
import session from '../../../spine/data/02-catalog/session.txt?raw'

// §7.2 — the catalog bucket: versioning, a lifecycle rule for old versions, an HTTPS-only Deny. A
// price change (12.99 → 10.99) makes a second version; the listing is the emulator's. That a plain
// HTTP request is refused is AWS's documented behaviour — the emulator sees every request as the
// HTTPS one it stands for (scripts/moto_server.py, `conditions`), and the frame says so.
// source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html
// source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html (aws:SecureTransport)
const versions = session.split('\n').filter((l) => /^(True|False)\t/.test(l)).map((l) => l.split('\t'))

export const dataCatalog: SceneModel = ideFrame({
  tree: dataTree(2, { active: 'infra/s3.tf' }),
  editor: { file: 'infra/s3.tf', code, show: [[lineOf(code, 'resource "aws_s3_bucket_versioning"'), lineOf(code, 'depends_on') + 1]] },
  session,
  keep: ['Apply complete!', ['$ aws s3 cp', '1001.json'], ['$ aws s3api list-object-versions', 'null']],
  side: [
    {
      type: 'group', id: 'object', title: 'One key, two versions', tone: 'source', children: [
        { type: 'item', id: 'key', icon: 'file', title: 'books/bk-1001.json', sub: 'the key a reader asks for', stack: true },
        {
          type: 'group', id: 'versions', bare: true, dir: 'row', children: versions.map(([latest, id], i) => ({
            type: 'item' as const, id: `v${i}`, icon: 'layers', stack: true, tone: latest === 'True' ? 'ingest' as const : undefined,
            title: latest === 'True' ? 'latest: 10.99' : 'older: 12.99', sub: id === 'null' ? 'version null (before versioning)' : `version ${id.slice(0, 8)}…`,
          })),
        },
        { type: 'item', id: 'gone', icon: 'clock', title: 'after 30 days', sub: 'an older version is deleted', stack: true, muted: true },
      ],
    },
    {
      type: 'table', id: 'rules', title: 'What the bucket now does', tone: 'ingest', columns: ['setting', 'effect'], rows: [
        ['versioning', 'a write keeps the page it replaced'],
        ['lifecycle', 'an old version lives 30 days'],
        ['HttpsOnly', 'plain HTTP is denied (AWS\'s documentation)'],
      ],
    },
    { type: 'note', id: 'undo', tone: 'source', text: 'To undo a bad edit: copy the older version back over the key. It becomes the latest; nothing is lost.' },
  ],
  edges: [
    { from: 'key', to: 'v0', label: 'reads' },
    { from: 'v1', to: 'gone', label: 'noncurrent', dashed: true },
  ],
})
