import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import { BUILT, mapFrame } from '../map'
import session from '../../../spine/run/06-service/session.txt?raw'

// §6.6 — a service on Fargate (map frame). The cluster and the service: three tasks in the three app
// subnets, behind sg app, registered in the load balancer's target group. EMULATED: the emulator
// records the service and starts nothing — desired 3, running 0, no tasks — and the frame says so;
// what ECS would do (start three tasks, register them, replace one that fails) is its documentation.
// source: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_services.html
const rows = terminal(session)
export const runService: SceneModel = mapFrame({
  built: [...BUILT.network, 'ecr', 'watch'],
  fresh: ['task-a', 'task-b', 'task-c'],
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop · emulated', code: rows, fill: true,
      show: keepLines(rows, ['aws_ecs_service.app will be created', '+ desired_count', '+ launch_type', 'Apply complete!',
        ['$ aws ecs describe-services', '}'], ['$ aws ecs list-tasks', '0']]),
    },
    {
      type: 'group', id: 'keeps', title: 'The service keeps three tasks alive', tone: 'source', dir: 'row', children: [
        { type: 'item', id: 'svc', icon: 'ecsservice', title: 'service book-shop', sub: 'desired 3 · Fargate', stack: true },
        { type: 'item', id: 'tasks', icon: 'ecstask', title: '3 tasks', sub: 'one per app subnet', stack: true },
        { type: 'item', id: 'tg', icon: 'alb', title: 'target group', sub: 'each task\'s IP, port 8080', stack: true },
      ],
    },
    { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the emulator records the service and starts no containers: running 0. On AWS, ECS starts three tasks, registers them, and replaces any that fails.' },
  ],
  edges: [
    { from: 'svc', to: 'tasks', label: 'starts' },
    { from: 'tasks', to: 'tg', label: 'register' },
  ],
})
