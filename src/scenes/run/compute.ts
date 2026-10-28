import type { Group, Item, SceneModel } from '@graphlearning/graphl-flow'

// §6.3 — ◆ full scene: choosing compute. The same layers for each way AWS runs code, coloured by
// who runs them: you (consume) or AWS (ingest). EC2: you run everything from the OS up; ECS on
// Fargate: AWS runs servers, OS and capacity, you run the image and how many tasks; Lambda: you run
// only the code; EKS: Kubernetes itself is managed, its nodes and everything on them are yours (or
// Fargate's). The shop's choice is Fargate (COURSE-PLAN, decision 7).
// source: https://docs.aws.amazon.com/whitepapers/latest/aws-overview/compute-services.html
// source: https://aws.amazon.com/compliance/shared-responsibility-model/
type Who = 'you' | 'aws'
const OPTIONS: [string, string, string, Who[]][] = [
  ['ec2', 'ec2', 'EC2', ['you', 'you', 'you', 'you', 'aws']],
  ['fargate', 'fargate', 'ECS on Fargate', ['you', 'you', 'aws', 'aws', 'aws']],
  ['lambda', 'lambda', 'Lambda', ['you', 'aws', 'aws', 'aws', 'aws']],
  ['eks', 'eks', 'EKS', ['you', 'you', 'you', 'you', 'aws']],
]
const LAYERS = ['your code', 'its packaging: image, runtime', 'how many copies, where', 'the OS and its patches', 'the hardware']
const cell = (id: string, who: Who, layer: string): Item => ({
  type: 'item', id, title: who === 'you' ? 'you' : 'AWS', sub: layer, tone: who === 'you' ? 'consume' : 'ingest', chip: true,
})
const column = ([id, icon, title, who]: (typeof OPTIONS)[number]): Group => ({
  type: 'group', id, icon, title, tone: id === 'fargate' ? 'serve' : undefined, children: who.map((w, i) => cell(`${id}-${i}`, w, LAYERS[i])),
})

export const runCompute: SceneModel = {
  nodes: [
    { type: 'group', id: 'options', bare: true, dir: 'row', children: OPTIONS.map(column) },
    {
      type: 'table', id: 'fits', title: 'Fits when…', tone: 'source', columns: ['', 'fits when', 'the shop'], rows: [
        ['EC2', 'you need the server itself: special hardware, an OS you control', 'compared in §6.9'],
        { cells: ['ECS on Fargate', 'a long-running web service in containers, no servers to run', 'its choice'], tone: 'serve' },
        ['Lambda', 'short pieces of work triggered by events', 'the fulfilment function, Course 8'],
        ['EKS', 'a team already running Kubernetes, many services', 'not needed'],
      ],
    },
  ],
}
