import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom, trim } from '../ide'
import { decoupleTree } from './files'
import code from '../../../spine/decouple/06-events/project/infra/events.tf?raw'
import session from '../../../spine/decouple/06-events/session.txt?raw'

// §8.6 — routing events. An EventBridge bus book-shop and two rules: uk-vat (source checkout,
// OrderPlaced, detail.country GB) → the vat queue; refunds (source returns, RefundRequested) → the
// refunds queue. Three sample events are put; where each landed is read from tools/routed.py's output,
// and test-event-pattern asks the rule about the FR order. Emulated: moto's EventBridge matches
// the patterns and delivers to SQS.
// source: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html
const routed = session.split('\n').filter((l) => /^(vat|refunds) /.test(l))
const landed = (q: string) => routed.filter((l) => l.startsWith(q + ' ') && !l.trim().endsWith(' -')).length
const last = trim(session).split('\n').at(-1) ?? ''

export const decoupleEvents: SceneModel = ideFrame({
  tree: decoupleTree(6, { active: 'infra/events.tf', fresh: ['infra/events.tf', 'events/samples.json', 'events/fr-order.json', 'tools/routed.py'] }),
  editor: { file: 'infra/events.tf', code, show: [[lineOf(code, 'locals {'), lineOf(code, 'resource "aws_cloudwatch_event_rule"') - 2]], highlight: linesFrom(code, 'uk-vat = {', 'detail        = { country') },
  session,
  keep: [['$ aws events put-events', 'refunds '], ['$ PATTERN=', last]],
  side: [
    {
      type: 'group', id: 'flow', title: 'Three events, one bus, two rules', tone: 'source', children: [
        {
          type: 'group', id: 'sent', bare: true, dir: 'row', children: [
            { type: 'item', id: 'e-gb', icon: 'file', title: 'OrderPlaced', sub: 'order 8, GB', stack: true },
            { type: 'item', id: 'e-fr', icon: 'file', title: 'OrderPlaced', sub: 'order 9, FR: no rule', stack: true, muted: true },
            { type: 'item', id: 'e-ref', icon: 'file', title: 'RefundRequested', sub: 'order 4, returns', stack: true },
          ],
        },
        { type: 'item', id: 'bus', icon: 'eventbridge', title: 'bus book-shop', sub: 'every rule sees every event', stack: true },
        {
          type: 'group', id: 'rules', bare: true, dir: 'row', children: [
            { type: 'item', id: 'r-vat', icon: 'filter', title: 'rule uk-vat', sub: 'OrderPlaced, country GB', stack: true },
            { type: 'item', id: 'r-ref', icon: 'filter', title: 'rule refunds', sub: 'RefundRequested', stack: true },
          ],
        },
        {
          type: 'group', id: 'targets', bare: true, dir: 'row', children: [
            { type: 'item', id: 'q-vat', icon: 'sqs', title: 'vat queue', sub: `${landed('vat')} event`, stack: true, tone: 'ingest' },
            { type: 'item', id: 'q-ref', icon: 'sqs', title: 'refunds queue', sub: `${landed('refunds')} event`, stack: true, tone: 'ingest' },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'vs', title: 'A topic, or a bus', tone: 'ingest', columns: ['', 'SNS topic', 'EventBridge bus'], rows: [
        ['who sends', 'one producer', 'many sources'],
        ['who gets it', 'every subscriber', 'whoever a rule matches'],
        ['matching on', 'a filter per subscription', 'any field, in a rule'],
      ],
    },
  ],
  edges: [
    { from: 'e-gb', to: 'bus' },
    { from: 'e-fr', to: 'bus' },
    { from: 'e-ref', to: 'bus' },
    { from: 'bus', to: 'r-vat' },
    { from: 'bus', to: 'r-ref' },
    { from: 'r-vat', to: 'q-vat' },
    { from: 'r-ref', to: 'q-ref' },
  ],
})
