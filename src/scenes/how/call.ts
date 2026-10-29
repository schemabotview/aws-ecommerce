import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/how-aws-runs/03-call/session.txt?raw'

// §2.3 — every action is an API call. ListBuckets from the AWS CLI and from boto3 give the same answer
// (an empty list: a fresh emulated account); the endpoint both reach is read from anatomy.py's output
// (the emulator's address shown as the regional endpoint the call has on AWS). Console, CLI, SDKs and
// Terraform are four ways to send one kind of request to one HTTPS endpoint.
// source: https://docs.aws.amazon.com/general/latest/gr/rande.html
const endpoint = session.match(/^GET https:\/\/(\S+?)\/?$/m)?.[1] ?? '?'
const answers = session.split('\n').filter((l) => l === '[]').length
const lines = trim(session).split('\n')
const upTo = lines.findIndex((l) => l.startsWith('$ python anatomy.py'))

export const howCall: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'flow', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'callers', title: 'Four ways to ask', tone: 'source', children: [
            { type: 'item', id: 'console', icon: 'screen', title: 'the console', sub: 'a web page that calls the API' },
            { type: 'item', id: 'cli', icon: 'terminal', title: 'the AWS CLI', sub: 'aws s3api list-buckets' },
            { type: 'item', id: 'sdk', icon: 'python', title: 'an SDK', sub: 'boto3: s3.list_buckets()' },
            { type: 'item', id: 'tf', icon: 'terraform', title: 'Terraform', sub: 'the Go SDK, underneath' },
          ],
        },
        { type: 'item', id: 'endpoint', icon: 'globe', title: 'one HTTPS endpoint', sub: endpoint, stack: true, tone: 'ingest' },
        { type: 'item', id: 's3', icon: 's3', title: 'Amazon S3', sub: 'ListBuckets', stack: true },
      ],
    },
    {
      type: 'group', id: 'bottom', bare: true, dir: 'row', children: [
        { type: 'code', id: 'lab', terminal: true, filename: 'terminal · emulated', code: lines.slice(0, upTo).join('\n') },
        {
          type: 'table', id: 'same', title: 'Same question, same answer', tone: 'source', columns: ['asked from', 'answered'], rows: [
            ['the CLI', answers >= 1 ? '[]: no buckets yet' : '?'],
            ['Python (boto3)', answers >= 2 ? '[]: no buckets yet' : '?'],
            { cells: ['so', 'what the console can do, code can do'], tone: 'ingest' },
          ],
        },
      ],
    },
  ],
  edges: [
    { from: 'callers', to: 'endpoint' },
    { from: 'endpoint', to: 's3' },
  ],
}
