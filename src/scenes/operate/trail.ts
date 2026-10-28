import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { operateTree } from './files'
import code from '../../../spine/operate/04-trail/project/infra/trail.tf?raw'
import session from '../../../spine/operate/04-trail/session.txt?raw'

// §11.4 — who changed what. A multi-Region trail with log file validation, delivering to its own
// bucket, whose policy lets only CloudTrail write (and only bucket-owner-full-control objects). The
// trail's settings and status are read back. The emulator records NO events (LookupEvents is not
// implemented): the record in the side pane is the shape AWS documents, filled with §9.6's console
// change (sam raising the fulfilment queue's visibility timeout), and labelled as an example.
// source: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-record-contents.html
const trail = session.match(/^(book-shop-audit)\t(True|False)\t(True|False)$/m)?.slice(1) ?? ['?', '?', '?']
const logging = /\$ aws cloudtrail get-trail-status[^\n]*\ntrue$/m.test(session)

export const operateTrail: SceneModel = ideFrame({
  tree: operateTree(4, { active: 'infra/trail.tf', fresh: ['infra/trail.tf'] }),
  editor: { file: 'infra/trail.tf', code, show: [[1, 4], [lineOf(code, 'resource "aws_cloudtrail" "audit"'), code.trimEnd().split('\n').length]],
    highlight: [lineOf(code, 'is_multi_region_trail'), lineOf(code, 'enable_log_file_validation')] },
  session,
  keep: ['Apply complete!', ['$ aws cloudtrail describe-trails', 'true']],
  side: [
    {
      type: 'group', id: 'path', title: 'Every API call, kept', tone: 'source', children: [
        { type: 'item', id: 'caller', icon: 'user', title: 'sam, in the console', sub: 'SetQueueAttributes', stack: true },
        { type: 'item', id: 'trail', icon: 'cloudtrail', title: trail[0], sub: logging ? 'logging, every Region' : '?', stack: true },
        { type: 'item', id: 'bucket', icon: 's3', title: 'book-shop-trail-…', sub: 'records + signed digests', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'table', id: 'record', title: 'One record, as AWS documents it (an example)', tone: 'ingest', columns: ['field', 'value'], rows: [
        ['eventTime', '2026-10-31T19:02:11Z'],
        ['eventSource', 'sqs.amazonaws.com'],
        ['eventName', 'SetQueueAttributes'],
        ['userIdentity.arn', '…:assumed-role/BookShopDeveloper/sam'],
        ['sourceIPAddress', '203.0.113.24'],
        ['requestParameters', 'VisibilityTimeout: 60, book-shop-fulfilment'],
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the trail is stored and logging, but the emulator records no events. The record is the documented shape, filled with §9.6\'s console change.' },
  ],
  edges: [
    { from: 'caller', to: 'trail', label: 'recorded' },
    { from: 'trail', to: 'bucket' },
  ],
})
