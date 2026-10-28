import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, linesFrom } from '../ide'
import { secureTree } from './files'
import code from '../../../spine/secure/04-statements/project/infra/iam.tf?raw'
import session from '../../../spine/secure/04-statements/session.txt?raw'

// §4.4 — policy statements. A statement is effect + action + resource (+ an optional condition).
// ReadBooks allows s3:GetObject on the objects under books/; the role's first permissions policy is
// put inline, and the app's read — refused in §4.3 — now works (evaluated by the emulator).
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
export const secureStatements: SceneModel = ideFrame({
  tree: secureTree(4, { active: 'infra/iam.tf' }),
  editor: { file: 'infra/iam.tf', code, show: [[1, 1], [linesFrom(code, '# The permissions policy')[0], code.trimEnd().split('\n').length]], highlight: linesFrom(code, 'statement {', 'resources') },
  session,
  keep: ['$ tools/as-app.sh aws s3 cp s3://$BUCKET/books/bk-1001.json -', '"title"', ['$ tools/as-app.sh aws s3 cp s3://$BUCKET/orders.csv -', 'Forbidden'],
    ["$ echo '{}'", 'Access Denied']],
  side: [
    {
      type: 'group', id: 'anatomy', icon: 'permissions', title: 'ReadBooks: one statement, four parts', tone: 'source', dir: 'grid', cols: 2, children: [
        { type: 'item', id: 'effect', icon: 'check', title: 'Effect: Allow', sub: 'or Deny', stack: true },
        { type: 'item', id: 'action', icon: 'zap', title: 'Action: s3:GetObject', sub: 'service:operation', stack: true },
        { type: 'item', id: 'resource', icon: 'bucket', title: 'Resource: …/books/*', sub: 'an ARN; * matches within it', stack: true },
        { type: 'item', id: 'condition', icon: 'filter', title: 'Condition: none', sub: 'optional: when it applies', stack: true, muted: true },
      ],
    },
    {
      type: 'group', id: 'match', title: 'Matching a request', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'request', icon: 'file', title: 'a request', sub: 'action + resource', stack: true },
        { type: 'item', id: 'every', icon: 'search', title: 'EVERY part matches?', sub: 'one miss: no match', stack: true },
        { type: 'item', id: 'allowed', icon: 'check', title: 'Allow', sub: 'else: denied, implicitly', stack: true },
      ],
    },
    {
      type: 'table', id: 'matches', title: 'The app\'s three requests', tone: 'ingest', columns: ['request', 'action', 'resource', 'result'], rows: [
        { cells: ['read books/bk-1001.json', '✓', '✓', 'allowed'], tone: 'ingest' },
        { cells: ['read orders.csv', '✓', '✗', '403'], tone: 'consume' },
        { cells: ['write books/bk-1002.json', '✗', '✓', 'AccessDenied'], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'nothing', tone: 'source', text: 'Least privilege: a role starts with nothing, and each statement allows exactly one thing the app needs.' },
  ],
  edges: [
    { from: 'request', to: 'every' },
    { from: 'every', to: 'allowed', label: 'yes' },
  ],
})
