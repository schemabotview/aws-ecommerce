import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { startTree } from './tree'
import config from '../../../spine/start/02-profile/project/aws-config?raw'
import session from '../../../spine/start/02-profile/session.txt?raw'

// §3.2 — a profile and a first session. aws-config names two profiles that share one sign-in
// (sso-session book-shop). The CLI refuses before it calls AWS: there is no token yet, and getting
// one needs a browser and the real portal — which is where the emulator comes in (§3.3).
// source: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html
export const startProfile: SceneModel = ideFrame({
  tree: startTree(2, { active: 'aws-config', fresh: ['aws-config'] }),
  editor: { file: 'aws-config', code: config, highlight: [4, 5, 6, 7, 8] },
  session,
  side: [
    {
      type: 'group', id: 'flow', title: 'aws … --profile book-shop-dev', tone: 'source', children: [
        { type: 'item', id: 'cli', icon: 'terminal', title: 'the CLI', sub: 'reads the profile', stack: true },
        { type: 'item', id: 'session-cfg', icon: 'file', title: 'sso-session book-shop', sub: 'the portal and its Region', stack: true },
        { type: 'item', id: 'portal', icon: 'identitycenter', title: 'the access portal', sub: 'alex signs in, in a browser', stack: true },
        { type: 'item', id: 'token', icon: 'key', title: 'a token, cached', sub: 'none yet: the CLI stops here', tone: 'consume', stack: true },
        { type: 'item', id: 'creds', icon: 'sts', title: 'role credentials', sub: 'BookShopDeveloper, for hours', stack: true },
      ],
    },
    {
      type: 'table', id: 'profiles', title: 'Two profiles, one sign-in', tone: 'ingest', columns: ['profile', 'account', 'role'], rows: [
        ['book-shop-dev', '444455556666', 'BookShopDeveloper'],
        ['book-shop-prod', '111122223333', 'BookShopReadOnly'],
      ],
    },
    { type: 'note', id: 'refused', tone: 'consume', text: 'No token yet, so the CLI stops before it calls AWS at all: nothing was sent, nothing was denied.' },
  ],
  edges: [
    { from: 'cli', to: 'session-cfg' },
    { from: 'session-cfg', to: 'portal' },
    { from: 'portal', to: 'token' },
    { from: 'token', to: 'creds' },
  ],
})
