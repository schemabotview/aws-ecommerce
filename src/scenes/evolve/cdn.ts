import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import { BUILT, mapFrame } from '../map'
import session from '../../../spine/evolve/02-cdn/session.txt?raw'
import model from '../../../spine/evolve/02-latency/session.txt?raw'

// §12.1 — a CDN in front (map frame). A CloudFront distribution with the load balancer as its origin
// (HTTPS only): book pages cached up to 5 minutes (cache policy book-shop-pages), /checkout* never
// (book-shop-never, every method). Status and behaviours are read back (emulated: the emulator stores
// the distribution and serves no requests). The plot is the lab spine/evolve/02-latency, a MODEL
// (Sydney 280 ms from London, 15 ms from an edge), parsed from its rows.
// source: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html
const rows = terminal(session)
const points = model.split('\n').map((l) => l.match(/^\s*(\d+)%\s+(\d+) ms\s+(\d+) ms$/)).filter((m) => m !== null)
const noCdn = model.match(/^no CDN:\s+(\d+) ms\s+(\d+) ms$/m)?.slice(1).map(Number) ?? [NaN, NaN]

export const evolveCdn: SceneModel = mapFrame({
  built: BUILT.operate,
  fresh: ['cdn'],
  side: [
    {
      type: 'code', id: 'terminal', terminal: true, filename: 'terminal — book-shop · emulated', code: rows, fill: true,
      show: keepLines(rows, ['Plan: ', 'Apply complete!', ['$ aws cloudfront get-distribution ', 'cloudfront.net'],
        ['$ aws cloudfront get-distribution-config', '"/checkout*"']]),
    },
    {
      type: 'plot', id: 'latency', compact: true, title: 'A book page from Sydney (a model)',
      x: { min: 0, max: 100, step: 20, label: 'pages served by the edge, %' }, y: { min: 0, max: 350, step: 50, label: 'ms' },
      series: [
        { kind: 'line', points: points.map((m) => [Number(m[1]), Number(m[2])]), label: 'with CloudFront', tone: 'ingest' },
        { kind: 'segment', from: [0, noCdn[0]], to: [100, noCdn[0]], label: `no CDN: ${noCdn[0]} ms` },
      ],
    },
    {
      type: 'table', id: 'behaviours', title: 'Two behaviours', tone: 'ingest', columns: ['path', 'cached', 'methods'], rows: [
        ['everything else (pages)', 'up to 5 minutes', 'GET, HEAD'],
        { cells: ['/checkout*', 'never', 'all of them'], tone: 'consume' },
      ],
    },
  ],
})
