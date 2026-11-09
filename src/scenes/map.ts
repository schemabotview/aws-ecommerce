import type { Edge, Group, Item, SceneModel, SceneNode } from '@graphlearning/graphl-flow'
import { FRAME_H, FULL_W, GAP, WORK_W as SIDE2_W } from './grid'

// THE BOOK SHOP'S MAP — one architecture diagram, drawn the way AWS draws its own: the Region a
// dashed boundary, the VPC inside it, three dashed Availability Zones, each with a public, an app
// and a data subnet; the Regional services beside the VPC; the account's controls along the bottom;
// the shoppers and the edge on the left.
//
// It is the WHOLE finished shop from its first appearance (Course 3) to the end. A part the shop
// does not have yet is drawn — same size, same place — greyed (graphl-flow's `muted`). So the map
// never moves, a viewer always knows where a part will be, and a section
// shows what it ADDS by colour, not by layout. check-render asserts every map frame lands on one fit.
//
// `BUILT[n]` is what the shop has at the END of course n — extend it as courses are authored, and
// never rename a part: section focus and later scenes name these ids.

type State = 'later' | 'built' | 'new'

interface Part { id: string; icon: string; title: string; sub?: string }

const p = (id: string, icon: string, title: string, sub?: string): Part => ({ id, icon, title, sub })

const EDGE = [p('shoppers', 'users', 'Shoppers'), p('dns', 'route53', 'Route 53'), p('cdn', 'cloudfront', 'CloudFront'), p('waf', 'waf', 'WAF')]
const ALB = p('alb', 'alb', 'Load balancer', 'across 3 AZs')
const IGW = p('igw', 'igw', 'Internet gateway')
const ENDPOINT = p('s3-endpoint', 'vpcendpoint', 'S3 endpoint')
const AZS = ['a', 'b', 'c'] as const
const TIER = {
  public: (az: string) => p(`nat-${az}`, 'natgateway', 'NAT gateway'),
  app: (az: string) => p(`task-${az}`, 'fargate', 'App task'),
  data: (az: string) => az === 'c' ? p('cache', 'elasticache', 'Cache') : p(`db-${az}`, 'rds', az === 'a' ? 'Orders DB' : 'Standby'),
}
const SERVICES: [string, string, Part[]][] = [
  ['books', 'Books and carts', [p('catalog', 's3', 'Catalog bucket'), p('carts', 'dynamodb', 'Carts table'), p('photos', 's3', 'Uploads bucket')]],
  ['checkout', 'Checkout', [p('queue', 'sqs', 'Fulfilment queue'), p('topic', 'sns', 'Order events'), p('bus', 'eventbridge', 'Event bus'),
    p('fulfil', 'lambda', 'Fulfil function'), p('payment', 'stepfunctions', 'Payment workflow')]],
  ['reports', 'Reports', [p('lake', 's3', 'Lake bucket'), p('glue', 'glue', 'Catalog tables'), p('athena', 'athena', 'Queries'), p('clicks', 'kinesis', 'Click stream')]],
]
const CONTROLS = [p('iam', 'iam', 'Roles'), p('state', 's3', 'Terraform state'), p('budget', 'budgets', 'Budget'), p('cert', 'acm', 'Certificate'),
  p('ecr', 'ecr', 'Images'), p('secrets', 'secretsmanager', 'Secrets'), p('kms', 'kms', 'Keys'), p('watch', 'cloudwatch', 'Metrics, logs'),
  p('trail', 'cloudtrail', 'Audit trail'), p('backup', 'backup', 'Backups')]

/** What the shop has at the end of each course (cumulative). */
const SUBNETS = ['public', 'app', 'data'].flatMap((t) => AZS.map((a) => `${t}-${a}`))
export const BUILT: Record<string, string[]> = {
  start: ['catalog', 'state', 'budget'],
  secure: ['catalog', 'state', 'budget', 'iam'],
  network: ['catalog', 'state', 'budget', 'iam', 'vpc', ...SUBNETS, 'igw', 'nat-a', 'alb', 'dns', 'cert', 's3-endpoint'],
  run: ['catalog', 'state', 'budget', 'iam', 'vpc', ...SUBNETS, 'igw', 'nat-a', 'alb', 'dns', 'cert', 's3-endpoint',
    'ecr', 'watch', 'task-a', 'task-b', 'task-c'],
  data: ['catalog', 'state', 'budget', 'iam', 'vpc', ...SUBNETS, 'igw', 'nat-a', 'alb', 'dns', 'cert', 's3-endpoint',
    'ecr', 'watch', 'task-a', 'task-b', 'task-c', 'photos', 'db-a', 'db-b', 'secrets', 'carts'],
}
BUILT.decouple = [...BUILT.data, 'queue', 'topic', 'bus', 'fulfil', 'payment']
// Course 9 adds production (a second account, drawn by no part) and the pipeline: the dev map is unchanged.
BUILT.deliver = [...BUILT.decouple]
BUILT.report = [...BUILT.deliver, 'lake', 'glue', 'athena', 'clicks']
BUILT.operate = [...BUILT.report, 'trail', 'kms', 'waf', 'backup']
BUILT.evolve = [...BUILT.operate, 'cdn']
export { SUBNETS }

function item(part: Part, state: State): Item {
  // A part not built yet keeps its place, its size and its mark — greyed (graphl-flow `muted`).
  // What a section adds is ringed by the section's `focus`, not drawn differently.
  return { type: 'item', id: part.id, title: part.title, sub: part.sub, icon: part.icon, muted: state === 'later' || undefined }
}

/** The map, for a section of course `course` (what earlier courses built) adding `fresh`. */
export function shopMap(built: string[], fresh: string[] = []): SceneNode {
  const st = (id: string): State => (fresh.includes(id) ? 'new' : built.includes(id) ? 'built' : 'later')
  const it = (part: Part) => item(part, st(part.id))
  // The VPC and its subnets are parts too: a muted outline until Course 5 builds them.
  const muted = (id: string) => st(id) === 'later' || undefined
  const az = (a: string): Group => ({
    type: 'group', id: `az-${a}`, title: `AZ eu-west-2${a}`, dashed: true, children: [
      { type: 'group', id: `public-${a}`, icon: 'publicsubnet', title: 'Public', muted: muted(`public-${a}`), children: [it(TIER.public(a))] },
      { type: 'group', id: `app-${a}`, icon: 'privatesubnet', title: 'App', muted: muted(`app-${a}`), children: [it(TIER.app(a))] },
      { type: 'group', id: `data-${a}`, icon: 'privatesubnet', title: 'Data', muted: muted(`data-${a}`), children: [it(TIER.data(a))] },
    ],
  })
  const vpc: Group = {
    type: 'group', id: 'vpc', icon: 'vpc', title: 'VPC 10.20.0.0/16', tone: 'infra', dir: 'grid', cols: 3, muted: muted('vpc'),
    children: [
      { type: 'group', id: 'vpc-edge', bare: true, dir: 'row', span: 'all', children: [it(ALB), it(IGW), it(ENDPOINT)] },
      ...AZS.map(az),
    ],
  }
  const services: Group = {
    type: 'group', id: 'services', bare: true, children: SERVICES.map(([id, title, parts]) => (
      { type: 'group', id, title, dir: 'grid', cols: id === 'checkout' ? 2 : 1, children: parts.map(it) } as Group)),
  }
  const region: Group = {
    type: 'group', id: 'region', icon: 'region', title: 'Region eu-west-2 (London)', dashed: true, dir: 'row', children: [vpc, services],
  }
  const controls: Group = {
    type: 'group', id: 'controls', icon: 'account', title: 'Account 444455556666 (dev)', dir: 'grid', cols: 10, span: 'all',
    children: CONTROLS.map(it),
  }
  const edge: Group = { type: 'group', id: 'edge', bare: true, children: EDGE.map(it) }
  return {
    type: 'group', id: 'map', bare: true, dir: 'grid', cols: 2,
    children: [edge, region, controls],
  }
}

/** The request path, always drawn — an edge to a part not built yet is still where it will run. */
export const MAP_EDGES: Edge[] = [
  { from: 'shoppers', to: 'dns' },
  { from: 'dns', to: 'cdn' },
  { from: 'cdn', to: 'alb' },
]

/** A full-frame map (Course 1's "what we'll build", and the pilot's measure). */
export function mapScene(built: string[], fresh: string[] = []): SceneModel {
  return { nodes: [shopMap(built, fresh)], edges: MAP_EDGES }
}

// ── the map frame ─────────────────────────────────────────────────────────────────────────────────
//
//   the map (MAP_W × MAP_H, fixed)  |  side pane (SIDE_W): a terminal of 80 columns, and a diagram
//
// Both columns are FIXED, width AND height (a side pane that grows past MAP_H would change the zoom of
// that one frame: 5.2's code-and-terminal pane did), so every map frame has the same natural box and the same fit (check-render
// asserts it), and the map's parts sit at the same pixels in every section of every course.
// The side terminal is the IDE terminal's width — the 80 columns scripts/spine.py wraps at.

export const MAP_W = 1150
export const MAP_H = 1040
export const MAP_SIDE_W = 787

export interface MapFrame {
  /** What the shop has before this section (BUILT of the previous course, plus this course's so far). */
  built: string[]
  /** What this section adds: drawn in colour. */
  fresh?: string[]
  /** The side pane's nodes: usually a terminal, then a small diagram. */
  side: SceneNode[]
  /** Edges inside the side pane. */
  edges?: Edge[]
}

export function mapFrame({ built, fresh = [], side, edges = [] }: MapFrame): SceneModel {
  return {
    dir: 'row',
    nodes: [
      { type: 'group', id: 'map-pane', bare: true, w: MAP_W, h: MAP_H, children: [shopMap(built, fresh)] },
      { type: 'group', id: 'map-side', bare: true, w: MAP_SIDE_W, h: MAP_H, children: side },
    ],
    edges: [...MAP_EDGES, ...edges],
  }
}

// ── map frame v2 (pilot: Course 5) ────────────────────────────────────────────────────────────────
//
//   the map (MAP2_W × FRAME_H)  |  side pane (SIDE2_W = the IDE workbench's 715): terminal, diagram
//
// On the shared 1344 × 756 grid at a 1% margin, as every IDE frame: the same zoom (≈ 2.8× at 4K), so
// a map frame's text is as large as an IDE frame's. The side column is the IDE workbench's width, so
// its terminal draws the same 72 columns (ide.ts `terminalRows`). The map is the same parts with the
// same ids, drawn upright: the Region holds the VPC (its three AZs side by side) over the Regional
// services; the account's controls run along the bottom; the edge stands to the left. Everything
// not built yet stays in place, greyed.
export const MAP2_W = FULL_W - SIDE2_W - GAP

/** The map's areas: each is drawn OPEN (every part) or FOLDED (one line saying what it holds). */
export type Area = 'vpc' | 'books' | 'checkout' | 'reports' | 'controls'
const AREA_PARTS: Record<Area, string[]> = {
  vpc: ['vpc', ...['public', 'app', 'data'].flatMap((t) => AZS.map((a) => `${t}-${a}`)), ALB.id, IGW.id, ENDPOINT.id,
    ...AZS.flatMap((a) => [TIER.public(a).id, TIER.app(a).id, TIER.data(a).id])],
  books: SERVICES[0][2].map((x) => x.id), checkout: SERVICES[1][2].map((x) => x.id), reports: SERVICES[2][2].map((x) => x.id),
  controls: CONTROLS.map((x) => x.id),
}

function shopMap2(built: string[], fresh: string[], open: Area[]): SceneNode {
  const st = (id: string): State => (fresh.includes(id) ? 'new' : built.includes(id) ? 'built' : 'later')
  const it = (part: Part) => ({ ...item(part, st(part.id)), sub: undefined })
  const muted = (id: string) => st(id) === 'later' || undefined
  // a folded area: one line, coloured when the shop has any of it, saying how much
  const folded = (area: Area, icon: string, title: string): Item => {
    const parts = AREA_PARTS[area].filter((id) => !SUBNETS.includes(id) && id !== 'vpc')
    const have = parts.filter((id) => st(id) !== 'later').length
    return { type: 'item', id: `${area}-folded`, icon, title: title || (have ? `${have} of ${parts.length}` : `${parts.length} parts`), sub: title ? undefined : have ? 'built' : 'later', muted: !have || undefined }
  }
  // inside a subnet the tier says what a part is for: its title can be short, so a cell stays one line
  const SHORT: Record<string, string> = { 'NAT gateway': 'NAT', 'App task': 'Task', 'Orders DB': 'Orders' }
  const subnet = (id: string, title: string, icon: string, part: Part): Group =>
    ({ type: 'group', id, icon, title, muted: muted(id), children: [{ ...it(part), title: SHORT[part.title] ?? part.title }] })
  const az = (a: string): Group => ({
    type: 'group', id: `az-${a}`, title: `eu-west-2${a}`, dashed: true, children: [
      subnet(`public-${a}`, 'Public', 'publicsubnet', TIER.public(a)),
      subnet(`app-${a}`, 'App', 'privatesubnet', TIER.app(a)),
      subnet(`data-${a}`, 'Data', 'privatesubnet', TIER.data(a)),
    ],
  })
  const vpc: Group = open.includes('vpc')
    ? {
      type: 'group', id: 'vpc', icon: 'vpc', title: 'VPC 10.20.0.0/16', tone: 'infra', dir: 'grid', cols: 3, muted: muted('vpc'),
      children: [
        { type: 'group', id: 'vpc-edge', bare: true, dir: 'row', span: 'all', children: [it(ALB), it(IGW), it(ENDPOINT)] },
        ...AZS.map(az),
      ],
    }
    : { type: 'group', id: 'vpc', icon: 'vpc', title: 'VPC 10.20.0.0/16', tone: 'infra', muted: muted('vpc'), children: [folded('vpc', 'privatesubnet', '3 AZs, 9 subnets')] }
  const services: Group = {
    type: 'group', id: 'services', bare: true, dir: 'row', children: SERVICES.map(([id, title, parts]) => (
      { type: 'group', id, title, children: open.includes(id as Area) ? parts.map(it) : [folded(id as Area, parts[0].icon, '')] } as Group)),
  }
  const region: Group = {
    type: 'group', id: 'region', icon: 'region', title: 'Region eu-west-2 (London)', dashed: true, children: [vpc, services],
  }
  // the account's controls stand under the edge, in the left column the Region leaves free
  const controls: Group = {
    type: 'group', id: 'controls', title: 'Account (dev)',
    children: open.includes('controls') ? CONTROLS.map(it) : [{ ...folded('controls', 'iam', ''), stack: true }],
  }
  const edge: Group = { type: 'group', id: 'edge', bare: true, children: EDGE.map((part) => ({ ...it(part), stack: true })) }
  const left: Group = { type: 'group', id: 'left', bare: true, children: [edge, controls] }
  return { type: 'group', id: 'map', bare: true, dir: 'row', children: [left, region] }
}

/** The areas a frame opens by default: those holding a part the section adds, and the VPC once it exists. */
const openFor = (built: string[], fresh: string[]): Area[] =>
  (Object.keys(AREA_PARTS) as Area[]).filter((a) => AREA_PARTS[a].some((id) => fresh.includes(id)) || (a === 'vpc' && built.includes('vpc')))

export interface MapFrame2 extends MapFrame {
  /** Areas drawn open; default: those holding a part the section adds, and the VPC once it exists. */
  open?: Area[]
}

export function mapFrame2({ built, fresh = [], open, side, edges = [] }: MapFrame2): SceneModel {
  const areas = open ?? openFor([...built, ...fresh], fresh)
  return {
    dir: 'row', padding: 0.01,
    nodes: [
      { type: 'group', id: 'map-pane', bare: true, spread: true, w: MAP2_W, h: FRAME_H, children: [shopMap2(built, fresh, areas)] },
      { type: 'group', id: 'map-side', bare: true, w: SIDE2_W, h: FRAME_H, children: side },
    ],
    edges: [...MAP_EDGES, ...edges],
  }
}

