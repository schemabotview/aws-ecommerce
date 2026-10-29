import type { SceneModel } from '@graphlearning/graphl-flow'

// §2.6 — ◆ full scene: shared responsibility. The stack from the building to the data, and who runs each
// layer for the four kinds of service the shop uses: an EC2 instance (you from the operating system up),
// a task on Fargate, a Lambda function, and S3. AWS always runs the facility and the hardware; the
// customer always owns its data and who may reach it. Where the line falls between is the choice.
// source: https://aws.amazon.com/compliance/shared-responsibility-model/
const A = 'AWS'
const Y = 'you'

export const howShared: SceneModel = {
  nodes: [
    {
      type: 'table', id: 'stack', title: 'Who runs each layer', tone: 'source', columns: ['layer', 'EC2 instance', 'ECS on Fargate', 'Lambda', 'S3'], rows: [
        { cells: ['your data, and who may read it', Y, Y, Y, Y], tone: 'consume' },
        ['your code', Y, Y, Y, '—'],
        ['the runtime (Python, its packages)', Y, Y, `${A}, you pick it`, A],
        ['the operating system, its patches', Y, A, A, A],
        ['scaling and placing servers', Y, `${A}, you set the count`, A, A],
        { cells: ['hardware, network, the buildings', A, A, A, A], tone: 'ingest' },
      ],
    },
    {
      type: 'group', id: 'line', title: 'Where the line falls', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'ec2', icon: 'ec2', title: 'EC2', sub: 'you from the OS up', stack: true },
        { type: 'item', id: 'fargate', icon: 'fargate', title: 'Fargate', sub: 'you from the container up', stack: true },
        { type: 'item', id: 'lambda', icon: 'lambda', title: 'Lambda', sub: 'you: the function', stack: true },
        { type: 'item', id: 's3', icon: 's3', title: 'S3', sub: 'you: the data and its policy', stack: true, tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'ec2', to: 'fargate', label: 'less to run' },
    { from: 'fargate', to: 'lambda' },
    { from: 'lambda', to: 's3' },
  ],
}
