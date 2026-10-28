import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, linesFrom } from '../ide'
import { secureTree } from './files'
import code from '../../../spine/secure/02-role/project/infra/iam.tf?raw'
import session from '../../../spine/secure/02-role/session.txt?raw'

// §4.2 — a role for the app. A role answers two questions with two policies: the TRUST policy (who
// may assume it — here ECS, for the shop's tasks) and PERMISSIONS policies (what it may do — none
// yet: list-role-policies is empty). The terminal reads both back from the emulator.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html (trust policy vs permissions policy)
// source: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html (ecs-tasks.amazonaws.com)
export const secureRole: SceneModel = ideFrame({
  tree: secureTree(2, { active: 'infra/iam.tf', fresh: ['infra/iam.tf'] }),
  editor: { file: 'infra/iam.tf', code, highlight: linesFrom(code, 'data "aws_iam_policy_document" "app_trust"', 'assume_role_policy') },
  session,
  keep: ['Apply complete!', ['$ aws iam get-role', "t'"], '"Service": "ecs-tasks.amazonaws.com"', ['$ aws iam list-role-policies', '"PolicyNames"']],
  side: [
    {
      type: 'group', id: 'two', title: 'One role, two questions', tone: 'source', children: [
        { type: 'item', id: 'ecs', icon: 'ecstask', title: 'ECS, for a task', sub: 'ecs-tasks.amazonaws.com', stack: true },
        { type: 'item', id: 'role', icon: 'iamrole', title: 'BookShopApp', sub: 'a role: no password, no key', stack: true },
        { type: 'item', id: 'bucket', icon: 'bucket', title: 'the catalog bucket', sub: 'and everything else', stack: true, muted: true },
      ],
    },
    {
      type: 'table', id: 'policies', title: 'Two policies', tone: 'ingest', columns: ['', 'trust policy', 'permissions policy'], rows: [
        ['answers', 'who may become the role', 'what the role may do'],
        ['names', 'a principal', 'actions and resources'],
        ['how many', 'exactly one', 'any number'],
        { cells: ['BookShopApp has', 'ECS tasks', 'none yet: denied everything'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'ecs', to: 'role', label: 'trust: may assume' },
    { from: 'role', to: 'bucket', label: 'permissions: none', dashed: true },
  ],
})
