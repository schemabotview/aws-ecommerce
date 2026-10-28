import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import session from '../../../spine/run/09-ec2/session.txt?raw'

// §6.9 — ◆ full scene: the same app on EC2. Beside the shop's Fargate service, what EC2 would take: an
// AMI (Amazon Linux, from AWS's public parameter), a launch template whose user data installs Docker
// and runs the same image, and an Auto Scaling group across the three app subnets. The lab
// (spine/run/09-ec2) PLANS it against the emulator from its own root; nothing is applied to the shop.
// source: https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html
const rows = terminal(session)

export const runEc2: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'both', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'fargate', icon: 'fargate', title: 'The shop: ECS on Fargate', tone: 'serve', children: [
            { type: 'item', id: 'f-svc', icon: 'ecsservice', title: 'service book-shop', sub: 'desired 3, tracking 60% CPU', stack: true },
            { type: 'item', id: 'f-task', icon: 'ecstask', title: '3 tasks', sub: 'the image, 0.5 vCPU each', stack: true },
            { type: 'item', id: 'f-aws', icon: 'cloud', title: 'servers, OS, patches', sub: 'AWS\'s', stack: true, tone: 'ingest' },
          ],
        },
        {
          type: 'group', id: 'ec2', icon: 'ec2', title: 'The same app on EC2 (planned)', tone: 'consume', children: [
            { type: 'item', id: 'e-asg', icon: 'autoscaling', title: 'Auto Scaling group', sub: '3 to 12 servers, three AZs', stack: true },
            { type: 'item', id: 'e-lt', icon: 'file', title: 'launch template', sub: 't3.small, user data: install Docker, run the image', stack: true },
            { type: 'item', id: 'e-ami', icon: 'ec2', title: 'the AMI: Amazon Linux', sub: 'yours to update and roll', stack: true },
          ],
        },
        { type: 'code', id: 'lab', terminal: true, filename: 'terminal — ec2 · planned, not applied', code: rows,
          show: keepLines(rows, ['$ cd ec2', '$ terraform init', 'Terraform has been successfully initialized!', '$ terraform plan',
            'aws_autoscaling_group.app will be created', 'aws_launch_template.app will be created', '+ instance_type', 'Plan: 2 to add']) },
      ],
    },
    {
      type: 'table', id: 'moves', title: 'What moves to you on EC2', tone: 'consume', columns: ['', 'Fargate', 'EC2'], rows: [
        ['the OS and its patches', 'AWS', 'you: a new AMI, rolled through the group'],
        ['server size', 'per task: 0.5 vCPU', 'per server: t3.small, packed by you'],
        ['scaling', 'tasks', 'servers, and tasks on them'],
        ['paying for', 'what tasks ask for', 'whole servers, busy or not'],
      ],
    },
  ],
  edges: [
    { from: 'f-svc', to: 'f-task' },
    { from: 'f-task', to: 'f-aws', label: 'run on' },
    { from: 'e-asg', to: 'e-lt', label: 'launches' },
    { from: 'e-lt', to: 'e-ami', label: 'boots' },
  ],
}
