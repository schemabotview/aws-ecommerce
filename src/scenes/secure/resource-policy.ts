import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { secureTree } from './files'
import code from '../../../spine/secure/07-resource-policy/project/infra/s3.tf?raw'
import session from '../../../spine/secure/07-resource-policy/session.txt?raw'

// §4.7 — resource policies and a second account. A bucket policy names a PRINCIPAL: the Auditor
// role in the audit account, 777788889999. Across accounts BOTH sides must allow: this bucket policy
// and an identity policy in the audit account (not the shop's to write). The bucket policy is applied
// and read back from the emulator; the emulator stores it but does not evaluate resource policies
// or a second account, so the both-sides rule is AWS's documentation, and the frame says so.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_identity-vs-resource.html
export const secureResourcePolicy: SceneModel = ideFrame({
  tree: secureTree(7, { active: 'infra/s3.tf' }),
  editor: { file: 'infra/s3.tf', code, show: [[lineOf(code, '# A RESOURCE policy'), code.trimEnd().split('\n').length]], highlight: linesFrom(code, 'principals {', '}') },
  session,
  keep: ['will be created', 'Apply complete!', ['$ aws s3api get-bucket-policy', '--query Policy'], '"AWS": "arn:aws:iam::777788889999:role/Auditor"', '"Sid": "AuditorReads"'],
  side: [
    {
      type: 'group', id: 'accounts', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'audit', icon: 'account', title: 'Account 777788889999', sub: 'audit: not the shop\'s', children: [
            { type: 'item', id: 'people', icon: 'users', title: 'the auditors', sub: 'sign in to their own account', stack: true },
            { type: 'item', id: 'auditor', icon: 'iamrole', title: 'Auditor', sub: 'role', stack: true },
            { type: 'item', id: 'id-policy', icon: 'permissions', title: 'its identity policy', sub: 'must allow reading the catalog', stack: true },
          ],
        },
        {
          type: 'group', id: 'dev', icon: 'account', title: 'Account 444455556666', sub: 'development: the shop\'s', tone: 'ingest', children: [
            { type: 'item', id: 'bucket', icon: 'bucket', title: 'the catalog bucket', sub: 'book-shop-catalog-…', stack: true },
            { type: 'item', id: 'bucket-policy', icon: 'permissions', title: 'its bucket policy', sub: 'AuditorReads: applied here', stack: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'kinds', title: 'Identity policy or resource policy', tone: 'source', columns: ['', 'identity', 'resource'], rows: [
        ['attached to', 'a role or user', 'a bucket, a queue'],
        ['names a principal', 'never', 'always'],
        ['one account', 'enough alone', 'enough alone'],
        { cells: ['across accounts', 'must allow', 'must allow too'], tone: 'ingest' },
        ['the shop\'s so far', 'BookShopApp\'s', 'AuditorReads'],
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the emulator stores the bucket policy and returns it, but evaluates neither resource policies nor a second account. The both-sides rule is AWS\'s documented logic.' },
  ],
  edges: [
    { from: 'people', to: 'auditor', label: 'assume' },
    { from: 'auditor', to: 'bucket', label: 'both must allow' },
    { from: 'auditor', to: 'id-policy', label: 'its own' },
    { from: 'bucket', to: 'bucket-policy', label: 'its own' },
  ],
})
