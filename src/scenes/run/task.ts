import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { runTree } from './files'
import code from '../../../spine/run/05-task/project/infra/task.tf?raw'
import session from '../../../spine/run/05-task/session.txt?raw'

// §6.5 — a task definition and its two roles. The EXECUTION role is ECS's: it pulls the image from
// ECR and creates log streams, before and around the app. The TASK role is the app's own, BookShopApp
// (Course 4): its code reads books with it. The terminal reads both ARNs back from the emulator.
// source: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
// source: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html
export const runTask: SceneModel = ideFrame({
  tree: runTree(5, { active: 'infra/task.tf', fresh: ['infra/task.tf'] }),
  editor: { file: 'infra/task.tf', code, show: [[lineOf(code, 'resource "aws_ecs_task_definition"'), lineOf(code, 'resource "aws_ecs_task_definition"') + 20]],
    highlight: linesFrom(code, 'execution_role_arn', 'task_role_arn') },
  session,
  keep: ['Apply complete!', ['$ aws ecs describe-task-definition', '"execution": "arn']],
  side: [
    {
      type: 'group', id: 'def', title: 'One task definition, two roles', tone: 'source', children: [
        { type: 'item', id: 'taskdef', icon: 'ecstask', title: 'book-shop, revision 1', sub: 'the image, 0.5 vCPU, 1 GiB, port 8080', stack: true },
        {
          type: 'group', id: 'roles', bare: true, dir: 'row', children: [
            { type: 'item', id: 'exec', icon: 'iamrole', title: 'BookShopExecution', sub: 'ECS uses it: pull the image, write logs', stack: true },
            { type: 'item', id: 'task', icon: 'iamrole', title: 'BookShopApp', sub: 'the app uses it: read books', stack: true },
          ],
        },
        {
          type: 'group', id: 'reach', bare: true, dir: 'row', children: [
            { type: 'item', id: 'ecr', icon: 'ecr', title: 'ECR + Logs', sub: 'before the app starts', stack: true },
            { type: 'item', id: 's3', icon: 's3', title: 'the catalog', sub: 'while the app runs', stack: true },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'which', title: 'Which role, when', tone: 'ingest', columns: ['moment', 'who acts', 'role'], rows: [
        ['pull book-shop:1.0.0', 'ECS', 'execution'],
        ['create the log stream', 'ECS', 'execution'],
        { cells: ['read books/bk-1001.json', 'the app', 'task'], tone: 'ingest' },
      ],
    },
    { type: 'note', id: 'why', tone: 'source', text: 'Two roles, so the app\'s credentials can read books and nothing else: they can neither pull images nor write to the logs.' },
  ],
  edges: [
    { from: 'taskdef', to: 'exec' },
    { from: 'taskdef', to: 'task' },
    { from: 'exec', to: 'ecr' },
    { from: 'task', to: 's3' },
  ],
})
