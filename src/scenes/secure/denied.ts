import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { secureTree } from './files'
import code from '../../../spine/secure/06-denied/project/infra/iam.tf?raw'
import session from '../../../spine/secure/06-denied/session.txt?raw'

// §4.6 — a request denied, and fixed. The app lists the books: s3:ListBucket, an action on the
// BUCKET. ReadBooks names objects (…/books/*), so nothing matches and the emulator refuses it — an
// implicit deny. The fix is a second statement whose resource is the bucket's own ARN; the plan
// shows it as an in-place change to the inline policy, and the same listing then works.
// source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-policy-actions.html (ListBucket's resource is the bucket)
export const secureDenied: SceneModel = ideFrame({
  tree: secureTree(6, { active: 'infra/iam.tf' }),
  editor: { file: 'infra/iam.tf', code, show: [[lineOf(code, '# The permissions policy'), lineOf(code, '# The permissions policy') + 17]], highlight: linesFrom(code, 'sid       = "ListBooks"', 'resources = [aws_s3_bucket.catalog.arn]') },
  session,
  keep: [['$ tools/as-app.sh aws s3 ls', 'Access Denied'], ['+ Action   = "s3:ListBucket"', '+ Resource'], ['$ tools/as-app.sh aws s3 ls', 'bk-1001.json']],
  side: [
    {
      type: 'group', id: 'eval', title: 'Listing books/: what IAM compared', tone: 'source', children: [
        { type: 'item', id: 'request', icon: 'file', title: 's3:ListBucket', sub: 'resource: arn:aws:s3:::book-shop-catalog-…', stack: true },
        {
          type: 'group', id: 'stmts', bare: true, dir: 'row', children: [
            { type: 'item', id: 'read', icon: 'permissions', title: 'ReadBooks', sub: 'GetObject on …/books/* · no match', stack: true, tone: 'consume' },
            { type: 'item', id: 'list', icon: 'permissions', title: 'ListBooks (new)', sub: 'ListBucket on the bucket · match', stack: true, tone: 'ingest' },
          ],
        },
        {
          type: 'group', id: 'outcomes', bare: true, dir: 'row', children: [
            { type: 'item', id: 'before', icon: 'lock', title: 'before: AccessDenied', sub: 'implicit: nothing allowed it', stack: true, tone: 'consume' },
            { type: 'item', id: 'after', icon: 'check', title: 'after apply: listed', sub: 'one statement allowed it', stack: true, tone: 'ingest' },
          ],
        },
      ],
    },
    { type: 'note', id: 'mistake', tone: 'consume', text: 'The usual mistake: …/books/* as ListBucket\'s resource. It names objects, so no listing ever matches it.' },
    {
      type: 'table', id: 'on', title: 'What an S3 action acts on', tone: 'ingest', columns: ['action', 'resource ARN'], rows: [
        ['s3:GetObject', 'arn:aws:s3:::bucket/key'],
        ['s3:PutObject', 'arn:aws:s3:::bucket/key'],
        { cells: ['s3:ListBucket', 'arn:aws:s3:::bucket'], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'request', to: 'read' },
    { from: 'request', to: 'list' },
    { from: 'read', to: 'before' },
    { from: 'list', to: 'after' },
  ],
})
