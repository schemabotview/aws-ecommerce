import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { startTree } from './tree'
import env from '../../../spine/start/03-emulator/project/env.sh?raw'
import session from '../../../spine/start/03-emulator/session.txt?raw'

// §3.3 — the emulator beside AWS. The same CLI, SDK and Terraform; AWS_ENDPOINT_URL decides where
// the request goes. moto keeps API state and answers the API; it moves no packets and bills nothing.
export const startEmulator: SceneModel = ideFrame({
  tree: startTree(3, { active: 'env.sh', fresh: ['env.sh'] }),
  editor: { file: 'env.sh', code: env, highlight: [8, 9, 10] },
  session,
  side: [
    {
      type: 'group', id: 'clients', title: 'The real tools', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'cli', icon: 'terminal', title: 'AWS CLI', stack: true },
        { type: 'item', id: 'sdk', icon: 'python', title: 'boto3', stack: true },
        { type: 'item', id: 'tf', icon: 'terraform', title: 'Terraform', stack: true },
      ],
    },
    { type: 'item', id: 'decide', icon: 'settings', title: 'AWS_ENDPOINT_URL', sub: 'set by env.sh?', stack: true },
    {
      type: 'group', id: 'targets', bare: true, dir: 'row', children: [
        { type: 'item', id: 'moto', icon: 'server', title: 'localhost:5000', sub: 'set: moto, emulated', tone: 'ingest', stack: true },
        { type: 'item', id: 'aws', icon: 'cloud', title: 'sts.eu-west-2.amazonaws.com', sub: 'unset: AWS itself', stack: true },
      ],
    },
    {
      type: 'table', id: 'shows', title: 'What the emulator can show', tone: 'ingest', columns: ['', 'emulated'], rows: [
        ['every API call and its answer', 'yes'],
        ['state: what exists, with its ids', 'yes'],
        ['IAM allowing or denying a request', 'yes, when on'],
        { cells: ['packets, latency, a failing AZ', 'no: a model'], tone: 'consume' },
        { cells: ['a bill', 'no: a rate card'], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'label', tone: 'source', text: 'Every pane that talks to the emulator says so. Its account is 444455556666: the course builds in the development account.' },
  ],
  edges: [
    { from: 'clients', to: 'decide' },
    { from: 'decide', to: 'moto' },
    { from: 'decide', to: 'aws', dashed: true },
  ],
})
