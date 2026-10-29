import type { SceneModel } from '@graphlearning/graphl-flow'
import { trim } from '../ide'
import session from '../../../spine/how-aws-runs/03-call/session.txt?raw'

// §2.4 — anatomy of a request. anatomy.py prints the ListBuckets request boto3 sends, as signed (a
// botocore before-send hook): method and URL, the date, the body's hash, and the SigV4 Authorization
// header's three fields; then the answer's status. The clock is the spine's frozen one, so the
// signature is the same on every run. The emulator checks no signature for this key (developer-key),
// and the frame says what AWS checks instead.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-signing-elements.html
const lines = trim(session).split('\n')
const from = lines.findIndex((l) => l.startsWith('$ python anatomy.py'))
const field = (name: string) => session.match(new RegExp(`^\\s*${name}[=:] ?(\\S+)`, 'm'))?.[1] ?? '?'
const credential = field('Credential').split('/')

export const howAnatomy: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        { type: 'code', id: 'lab', terminal: true, filename: 'anatomy.py · emulated', code: lines.slice(from).join('\n') },
        {
          type: 'table', id: 'parts', title: 'The request, part by part', tone: 'source', columns: ['part', 'here', 'says'], rows: [
            ['method, URL', 'GET, s3.eu-west-2…', 'which service, which Region'],
            ['X-Amz-Date', field('X-Amz-Date'), 'when: a signature is valid 15 minutes'],
            ['content hash', `${field('X-Amz-Content-SHA256').slice(0, 12)}…`, 'the body (empty) cannot be swapped'],
            ['credential', `${credential[0]?.slice(0, 8)}…/${credential.slice(1, 4).join('/')}`, 'whose key, which day, Region, service'],
            ['signed headers', field('SignedHeaders'), 'what the signature covers'],
            { cells: ['signature', `${field('Signature').slice(0, 12)}…`, 'proof of the secret key, never sent'], tone: 'ingest' },
          ],
        },
      ],
    },
    {
      type: 'group', id: 'checks', title: 'What AWS does with it, in order', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'tls', icon: 'lock', title: 'TLS', sub: 'the endpoint is really AWS', stack: true },
        { type: 'item', id: 'sig', icon: 'key', title: 'SigV4', sub: 'the same signature, recomputed', stack: true },
        { type: 'item', id: 'iam', icon: 'iam', title: 'IAM', sub: 'may this principal ListBuckets?', stack: true },
        { type: 'item', id: 'answer', icon: 's3', title: 'S3 answers', sub: 'HTTP 200 and XML', stack: true, tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'tls', to: 'sig' },
    { from: 'sig', to: 'iam' },
    { from: 'iam', to: 'answer' },
  ],
}
