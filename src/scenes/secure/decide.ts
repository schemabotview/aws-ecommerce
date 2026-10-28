import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/secure/05-decide/session.txt?raw'
import lab from '../../../spine/secure/05-decide/project/decide.py?raw'

// §4.5 — ◆ full scene: how IAM decides. AWS's evaluation logic for a request inside one account,
// drawn as the flowchart AWS draws: an explicit Deny anywhere ends it; then each policy type that
// applies must allow (SCPs, resource-based, identity-based, permissions boundary, session policy);
// nothing allowing it is an implicit deny. The lab's three requests (spine/secure/05-decide, run
// against the emulator under IAM enforcement) end at three places, each lit in its own colour. The
// OUTCOMES are the emulator's; which box each stops at is read from the lab's policy.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html
const policy = lab.slice(lab.indexOf('POLICY = '), lab.indexOf(']}') + 2)

const step = (id: string, title: string, sub: string, tone?: 'ingest' | 'consume' | 'serve') =>
  ({ type: 'item' as const, id, icon: 'search', title, sub, tone, stack: true })

export const secureDecide: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'chart', title: 'How IAM decides one request, inside one account: denied unless allowed', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'req', icon: 'file', title: 'a request', sub: 'principal, action, resource', stack: true },
        {
          type: 'group', id: 'steps', bare: true, dir: 'grid', cols: 6, children: [
            step('q1', 'an explicit Deny anywhere?', 'in any policy that applies'),
            step('q2', 'the organization allows it?', 'SCPs, RCPs, if any (§4.8)'),
            step('q3', 'a resource policy allows it?', 'e.g. a bucket policy (§4.7)'),
            step('q4', 'an identity policy allows it?', 'the role\'s own'),
            step('q5', 'a boundary, a session policy?', 'if set, it must allow too'),
            { type: 'item', id: 'allow2', icon: 'check', title: 'ALLOW', sub: 'all that apply agreed', tone: 'ingest', stack: true },
            { type: 'item', id: 'deny1', icon: 'lock', title: 'DENY: explicit', sub: 'nothing can override it', tone: 'consume', stack: true },
            { type: 'item', id: 'deny2', icon: 'lock', title: 'DENY: implicit', sub: 'the org did not allow it', tone: 'consume', stack: true },
            { type: 'item', id: 'allow1', icon: 'check', title: 'ALLOW', sub: 'one account: one allow is enough', tone: 'ingest', stack: true },
            { type: 'item', id: 'deny3', icon: 'lock', title: 'DENY: implicit', sub: 'no policy allowed it', tone: 'consume', stack: true },
          ],
        },
      ],
    },
    {
      type: 'group', id: 'lab-row', bare: true, dir: 'row', children: [
        { type: 'code', id: 'policy', filename: 'the role\'s policy · decide.py', lang: 'python', code: policy },
        { type: 'code', id: 'lab', terminal: true, filename: 'decide.py · emulated', code: trim(session) },
        {
          type: 'table', id: 'paths', title: 'Where each request stopped', tone: 'ingest', columns: ['request', 'stops at', 'why'], rows: [
            { cells: ['GetObject books/bk-1001.json', 'ALLOW', 'ReadBooks matches; nothing denies'], tone: 'ingest' },
            { cells: ['GetObject books/drafts/…', 'DENY: explicit', 'NoDrafts matches: Deny wins'], tone: 'consume' },
            { cells: ['PutObject books/bk-1002.json', 'DENY: implicit', 'no statement allows PutObject'], tone: 'consume' },
          ],
        },
      ],
    },
  ],
  edges: [
    { from: 'req', to: 'q1' },
    { from: 'q1', to: 'q2', label: 'no' },
    { from: 'q2', to: 'q3', label: 'yes' },
    { from: 'q3', to: 'q4', label: 'no' },
    { from: 'q4', to: 'q5', label: 'yes' },
    { from: 'q5', to: 'allow2', label: 'allows' },
    { from: 'q1', to: 'deny1', label: 'yes' },
    { from: 'q2', to: 'deny2', label: 'no' },
    { from: 'q3', to: 'allow1', label: 'yes' },
    { from: 'q4', to: 'deny3', label: 'no' },
  ],
}
