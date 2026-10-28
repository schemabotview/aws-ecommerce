import type { SceneModel } from '@graphlearning/graphl-flow'

// §5.7 — ◆ full scene: the life of a request. One page view, hop by hop, on the shop's own
// network as Course 5 builds it: the name (Route 53), the door (the internet gateway, the public
// subnet's route), the first check (sg alb), TLS ending at the load balancer, the second check
// (sg app, by group), the task — and every reply going back the way it came (stateful groups).
// CloudFront and WAF join in Course 12; the task arrives in Course 6. A concept: no packet moves in
// the emulator, so there is no terminal here.
// source: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html
export const networkRequest: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'path', bare: true, dir: 'row', children: [
        { type: 'item', id: 'browser', icon: 'screen', title: 'a shopper\'s browser', sub: 'book-shop.example.com/books/bk-1001', stack: true },
        {
          type: 'group', id: 'aws', icon: 'region', title: 'eu-west-2', dashed: true, dir: 'row', children: [
            { type: 'item', id: 'r53', icon: 'route53', title: 'Route 53', sub: 'the name → the load balancer\'s addresses', stack: true },
            {
              type: 'group', id: 'vpc', icon: 'vpc', title: 'VPC 10.20.0.0/16', tone: 'infra', dir: 'row', children: [
                { type: 'item', id: 'igw', icon: 'igw', title: 'internet gateway', stack: true },
                {
                  type: 'group', id: 'public', icon: 'publicsubnet', title: 'public subnets', tone: 'ingest', children: [
                    { type: 'item', id: 'alb', icon: 'alb', title: 'load balancer', sub: 'sg alb · TLS ends here', stack: true },
                  ],
                },
                {
                  type: 'group', id: 'app', icon: 'privatesubnet', title: 'app subnets', tone: 'serve', children: [
                    { type: 'item', id: 'task', icon: 'fargate', title: 'a task', sub: 'sg app · port 8080', stack: true, muted: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'hops', title: 'One request, hop by hop', tone: 'source', columns: ['', 'what happens', 'who decides', 'built in'], rows: [
        { id: 'h1', cells: ['1', 'the browser asks: where is book-shop.example.com?', 'DNS → Route 53 (alias)', '§5.9'], tone: 'ingest' },
        { id: 'h2', cells: ['2', 'it connects to an address of the load balancer, port 443', 'the public route table → igw', '§5.4'] },
        { id: 'h3', cells: ['3', 'the packet reaches the load balancer\'s interface', 'sg alb: 443 from anyone', '§5.6'] },
        { id: 'h4', cells: ['4', 'TLS: the certificate proves the name; the request is decrypted', 'the HTTPS listener, ACM', '§5.9'], tone: 'ingest' },
        { id: 'h5', cells: ['5', 'it picks a HEALTHY task and sends plain HTTP to port 8080', 'target group, health checks', '§5.8'] },
        { id: 'h6', cells: ['6', 'the task\'s interface lets it in', 'sg app: 8080 from the alb group', '§5.6'] },
        { id: 'h7', cells: ['7', 'the reply goes back the same way', 'stateful: no rule needed', '—'], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'browser', to: 'r53', label: '1 · where?', bidirectional: true },
    { from: 'igw', to: 'alb', label: '2–4 · 443', bidirectional: true },
    { from: 'alb', to: 'task', label: '5–6 · 8080', bidirectional: true },
  ],
}
