import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame } from '../ide'
import { startTree } from './tree'
import script from '../../../spine/start/04-script/project/scripts/make-bucket.sh?raw'
import session from '../../../spine/start/04-script/session.txt?raw'

// §3.4 — why not a script. The script records what to DO; run it twice and the second run fails on
// what the first one made. It cannot tell what exists, so it cannot be re-run, reviewed against
// reality, or undone. The bucket is removed at the end: Terraform will own it from §3.5.
export const startScript: SceneModel = ideFrame({
  tree: startTree(4, { active: 'scripts/make-bucket.sh', fresh: ['scripts/make-bucket.sh'] }),
  editor: { file: 'scripts/make-bucket.sh', code: script, highlight: [5, 6, 7, 8] },
  session,
  side: [
    {
      type: 'group', id: 'runs', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'run1', title: 'Run 1', tone: 'ingest', children: [
            { type: 'item', id: 'r1-create', icon: 'check', title: 'CreateBucket', sub: 'made it', stack: true },
            { type: 'item', id: 'r1-tag', icon: 'check', title: 'PutBucketTagging', sub: 'tagged it', stack: true },
          ],
        },
        { type: 'item', id: 'bucket', icon: 's3', title: 'the bucket', sub: 'the catalog', stack: true },
        {
          type: 'group', id: 'run2', title: 'Run 2', tone: 'consume', children: [
            { type: 'item', id: 'r2-create', icon: 'zap', title: 'CreateBucket', sub: 'already yours', stack: true },
            { type: 'item', id: 'r2-tag', icon: 'check', title: 'PutBucketTagging', sub: 'never ran (set -e)', stack: true, muted: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'compare', title: 'A script says what to DO, not what should EXIST', tone: 'consume', columns: ['when…', 'the script'], rows: [
        ['you run it twice', 'fails on its own work'],
        ['someone changes the bucket', 'never knows'],
        ['you want it gone', 'needs another script'],
        ['you review a change', 'reads commands, not results'],
      ],
    },
    {
      type: 'group', id: 'next', title: 'Then', tone: 'ingest', dir: 'row', children: [
        { type: 'item', id: 'rb', icon: 'bucket', title: 'aws s3 rb', sub: 'the bucket removed', stack: true },
        { type: 'item', id: 'tf', icon: 'terraform', title: 'Terraform', sub: 'makes it, and owns it', stack: true },
      ],
    },
  ],
  edges: [
    { from: 'r1-create', to: 'bucket', label: 'makes' },
    { from: 'r2-create', to: 'bucket', label: 'exists', dashed: true },
    { from: 'r1-create', to: 'r1-tag' },
    { from: 'rb', to: 'tf', label: 'next section' },
  ],
})
