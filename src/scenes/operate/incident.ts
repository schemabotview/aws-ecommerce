import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { operateTree } from './files'
import code from '../../../spine/operate/08-incident/project/infra/incident.tf?raw'
import session from '../../../spine/operate/08-incident/session.txt?raw'

// §11.8 — an incident. At 21:14 (the step's clock) a session of BookShopApp is issued and used — the
// "leaked" one. Two minutes on (`sleep 120` moves the frozen clock), an inline Deny on the role refuses
// every session issued before 21:15 (aws:TokenIssueTime, AWS's own "revoke active sessions" policy).
// The same leaked credentials are then refused, and a fresh session (tools/as-app.sh) still reads
// the catalog. Real IAM evaluation in the emulator (`token-issue-time` in scripts/moto_server.py);
// every outcome is read from the transcript.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html
const lists = [...session.matchAll(/^\S+ \S+\s+\d+ bk-1001\.json$/gm)].length
const denied = /AccessDenied/.test(session)
const cutoff = code.match(/values\s+= \["\d{4}-\d\d-\d\dT(\d\d:\d\d):\d\dZ"\]/)?.[1] ?? '?'

export const operateIncident: SceneModel = ideFrame({
  tree: operateTree(8, { active: 'infra/incident.tf', fresh: ['infra/incident.tf'] }),
  editor: { file: 'infra/incident.tf', code, show: [[lineOf(code, 'data "aws_iam_policy_document" "revoke"'), code.trimEnd().split('\n').length]],
    highlight: [lineOf(code, 'effect    = "Deny"'), lineOf(code, 'variable = "aws:TokenIssueTime"'), lineOf(code, 'values   = [')] },
  session,
  keep: ['$ read -r', ['$ AWS_ACCESS_KEY_ID', 'bk-1001.json'], '$ AWS_ACCESS_KEY_ID', ['aws: [ERROR]', 'bk-1001.json']],
  side: [
    {
      type: 'group', id: 'response', title: 'Detect, contain, eradicate, recover', tone: 'source', children: [
        { type: 'item', id: 'detect', icon: 'bell', title: '21:14 detect', sub: 'a key seen in a public chat', stack: true },
        { type: 'item', id: 'contain', icon: 'lock', title: '21:16 contain', sub: `deny sessions before ${cutoff}`, stack: true, tone: 'consume' },
        { type: 'item', id: 'eradicate', icon: 'search', title: 'eradicate', sub: 'how did it leak? the trail says', stack: true },
        { type: 'item', id: 'recover', icon: 'check', title: 'recover', sub: 'new sessions work; write it up', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'table', id: 'timeline', title: 'What the terminal showed', tone: 'ingest', columns: ['time', 'who', 'result'], rows: [
        ['21:14', 'the leaked session', lists >= 1 ? 'lists the catalog' : '?'],
        ['21:16', 'Terraform', `the Deny on BookShopApp`],
        { cells: ['21:16', 'the leaked session', denied ? 'AccessDenied' : '?'], tone: 'consume' },
        ['21:16', 'a new session', lists >= 2 ? 'lists the catalog' : '?'],
      ],
    },
  ],
  edges: [
    { from: 'detect', to: 'contain' },
    { from: 'contain', to: 'eradicate' },
    { from: 'eradicate', to: 'recover' },
  ],
})
