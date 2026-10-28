import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { deliverTree } from './files'
import code from '../../../spine/deliver/04-pipeline-role/project/infra/modules/pipeline/main.tf?raw'
import session from '../../../spine/deliver/04-pipeline-role/session.txt?raw'

// §9.4 — a role for the pipeline. modules/pipeline: GitHub's OIDC provider and a role whose trust policy
// accepts a GitHub token only for this repository and, in prod, only the `production` environment;
// its permissions are the shop's services and BookShop* roles. Applied in both accounts (emulated);
// the trust policy is read back from prod. The token exchange itself (GitHub signs a JWT, STS checks
// it against the provider's keys and the conditions) is AWS's and GitHub's documentation: the
// emulator stores the trust policy and does not verify tokens.
// source: https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html
export const deliverPipelineRole: SceneModel = ideFrame({
  tree: deliverTree(4, { active: 'infra/modules/pipeline/main.tf', fresh: ['infra/modules/pipeline/main.tf', 'infra/pipeline.tf', 'infra/envs/prod/main.tf'] }),
  editor: { file: 'infra/modules/pipeline/main.tf', code,
    show: [[lineOf(code, 'data "aws_iam_policy_document" "trust"'), lineOf(code, 'resource "aws_iam_role" "pipeline"') - 2]],
    highlight: [lineOf(code, 'variable = "token.actions.githubusercontent.com:sub"'), lineOf(code, 'values   = var.subjects')] },
  session,
  keep: [['$ aws iam get-role', '>   book-shop-prod-admin'], '"Action": "sts:AssumeRoleWithWebIdentity"',
    ['token.actions.githubusercontent.com:sub', 'environment:production'], ['"Federated"', 'ons.githubusercontent.com"']],
  side: [
    {
      type: 'group', id: 'exchange', title: 'A job gets credentials, with no stored key', tone: 'source', children: [
        { type: 'item', id: 'job', icon: 'githubactions', title: 'a workflow job', sub: 'asks GitHub for a token', stack: true },
        { type: 'item', id: 'token', icon: 'key', title: 'an OIDC token, signed by GitHub', sub: 'sub: repo:…:environment:production', stack: true },
        { type: 'item', id: 'sts', icon: 'sts', title: 'STS AssumeRoleWithWebIdentity', sub: 'signature, audience, subject checked', stack: true },
        { type: 'item', id: 'role', icon: 'iamrole', title: 'BookShopPipeline', sub: 'credentials for one hour', stack: true, tone: 'ingest' },
      ],
    },
    {
      type: 'table', id: 'who', title: 'Who may assume which role', tone: 'ingest', columns: ['account', 'trusts a run from'], rows: [
        ['dev 444455556666', 'main, or a pull request (plan only)'],
        { cells: ['prod 111122223333', 'the production environment only'], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'stored', tone: 'consume', text: 'Emulated: the emulator stores the provider and the trust policy; it does not check tokens. The exchange is GitHub\'s and AWS\'s documentation.' },
  ],
  edges: [
    { from: 'job', to: 'token' },
    { from: 'token', to: 'sts' },
    { from: 'sts', to: 'role' },
  ],
})
