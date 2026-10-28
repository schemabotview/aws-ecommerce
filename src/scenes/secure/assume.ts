import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, linesFrom } from '../ide'
import { secureTree } from './files'
import code from '../../../spine/secure/03-assume/project/tools/as-app.sh?raw'
import session from '../../../spine/secure/03-assume/session.txt?raw'

// §4.3 — assuming the role. AssumeRole returns temporary credentials (ASIA…, a session token, an
// expiry); requests signed with them ARE the role. From this step the emulator evaluates every
// request against IAM — except alex's own, which stand for BookShopDeveloper (scripts/moto_server.py,
// `developer-key`) — so the app's GetObject is really refused: the role has no permissions policy.
// Not AWS: the emulator does not hold alex to the trust policy, so alex can stand in for ECS here.
// The frame says so.
// source: https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html (default duration 1 hour)
export const secureAssume: SceneModel = ideFrame({
  tree: secureTree(3, { active: 'tools/as-app.sh', fresh: ['tools/as-app.sh', 'data/books/bk-1001.json'] }),
  editor: { file: 'tools/as-app.sh', code, highlight: linesFrom(code, 'read -r AWS_ACCESS_KEY_ID', '--output text)') },
  session,
  side: [
    {
      type: 'group', id: 'steps', title: 'Becoming the role', tone: 'source', children: [
        { type: 'item', id: 'caller', icon: 'ecstask', title: 'ECS, for a task', sub: 'here alex stands in: emulated', stack: true },
        { type: 'item', id: 'sts', icon: 'sts', title: 'STS: AssumeRole', sub: 'checks the trust policy (on AWS)', stack: true },
        { type: 'item', id: 'creds', icon: 'key', title: 'temporary credentials', sub: 'ASIA… + session token, 1 hour', stack: true },
        { type: 'item', id: 's3', icon: 's3', title: 'S3: GetObject', sub: 'AccessDenied: no permissions yet', stack: true, tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'same', title: 'Same command, two principals', tone: 'ingest', columns: ['who', 'signs as', 'reading bk-1001'], rows: [
        { cells: ['alex', 'BookShopDeveloper', 'uploaded it'], tone: 'ingest' },
        { cells: ['the app', 'BookShopApp/task-1', 'AccessDenied'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'caller', to: 'sts', label: '1 · role ARN' },
    { from: 'sts', to: 'creds', label: '2 · credentials' },
    { from: 'creds', to: 's3', label: '3 · signed request' },
  ],
})
