import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { operateTree } from './files'
import code from '../../../spine/operate/05-keys/project/infra/keys.tf?raw'
import session from '../../../spine/operate/05-keys/session.txt?raw'

// §11.5 — keys and encryption. A customer managed KMS key (alias/book-shop-data, rotated yearly, a
// key policy naming the account and the app's role) and the lake bucket's default encryption with it
// (SSE-KMS, bucket key). tools/envelope.py does by hand what S3 does per object: GenerateDataKey,
// AES-GCM here, keep only the encrypted data key, Decrypt it to read. KMS here is the emulator's — it
// really generates and decrypts data keys; the AES-GCM is the cryptography library's. Sizes are read
// from the transcript.
// source: https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html#enveloping
const stored = session.match(/^stored: (\d+) bytes of data, (\d+) bytes/m)?.slice(1) ?? ['?', '?']
const bits = session.match(/^data key: (\d+) bits/m)?.[1] ?? '?'

export const operateKeys: SceneModel = ideFrame({
  tree: operateTree(5, { active: 'infra/keys.tf', fresh: ['infra/keys.tf', 'tools/envelope.py'] }),
  editor: { file: 'infra/keys.tf', code, show: [[lineOf(code, 'resource "aws_kms_key" "data"'), lineOf(code, 'target_key_id') + 1],
    [lineOf(code, 'resource "aws_s3_bucket_server_side_encryption_configuration"'), code.trimEnd().split('\n').length]],
    highlight: [lineOf(code, 'enable_key_rotation'), lineOf(code, 'sse_algorithm     = "aws:kms"'), lineOf(code, 'kms_master_key_id')] },
  session,
  keep: ['Apply complete!', '"SSEAlgorithm": "aws:kms"', ['$ python -m tools.envelope', 'read:']],
  side: [
    {
      type: 'group', id: 'paths', bare: true, dir: 'row', children: [
    {
      type: 'group', id: 'write', title: 'Writing', tone: 'source', children: [
        { type: 'item', id: 'kms', icon: 'kms', title: 'the KMS key', sub: 'never leaves KMS', stack: true },
        { type: 'item', id: 'datakey', icon: 'key', title: `a ${bits}-bit data key`, sub: 'plaintext + encrypted copy', stack: true },
        { type: 'item', id: 'sealed', icon: 'lock', title: 'stored together', sub: 'ciphertext + encrypted key', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'group', id: 'read', title: 'Reading', tone: 'serve', children: [
        { type: 'item', id: 'ask', icon: 'lock', title: 'the encrypted key', sub: 'sent to Decrypt', stack: true },
        { type: 'item', id: 'policy', icon: 'permissions', title: 'the key policy', sub: 'may this principal?', stack: true },
        { type: 'item', id: 'open', icon: 'key', title: 'the plaintext key', sub: 'decrypts, then dropped', stack: true },
      ],
    },
      ],
    },
    {
      type: 'table', id: 'sizes', title: 'What tools/envelope.py stored', tone: 'ingest', columns: ['', 'bytes'], rows: [
        ['the order, encrypted (AES-GCM)', stored[0]],
        ['its data key, encrypted by KMS', stored[1]],
        ['the plaintext data key', /^the plaintext data key: dropped$/m.test(session) ? 'none: dropped' : '?'],
      ],
    },
  ],
  edges: [
    { from: 'kms', to: 'datakey', label: 'GenerateDataKey' },
    { from: 'datakey', to: 'sealed' },
    { from: 'ask', to: 'policy' },
    { from: 'policy', to: 'open' },
  ],
})
