import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { runTree } from './files'
import code from '../../../spine/run/08-graceful/project/book_shop/web.py?raw'
import session from '../../../spine/run/08-graceful/session.txt?raw'

// §6.8 — stateless and graceful. A task can be stopped at any time (scale-in, a deploy, a failed
// health check), so it keeps nothing it needs (the catalog is in S3) and stops cleanly: on SIGTERM
// the app stops accepting, finishes what is in flight, exits. tools/drain.py proves it on a real
// request caught halfway; 1.1.0 then ships as task definition revision 2. The scale-in order (drain
// the target, then SIGTERM, then SIGKILL after stopTimeout) is AWS's documented behaviour.
// source: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html (stopTimeout)
// source: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-target-group-attributes.html (deregistration delay)
export const runGraceful: SceneModel = ideFrame({
  tree: runTree(8, { active: 'book_shop/web.py', fresh: ['tools/drain.py'] }),
  editor: { file: 'book_shop/web.py', code, show: [[lineOf(code, 'def main() -> None:'), code.trimEnd().split('\n').length]],
    highlight: linesFrom(code, 'def stop(signum, frame):', 'signal.signal(signal.SIGTERM, stop)') },
  session,
  keep: [['$ python tools/drain.py', 'the app exited with 0'], ['{"stopping"', '{"stopped"'], ['$ aws ecs describe-services', 'book-shop:2']],
  side: [
    {
      type: 'group', id: 'stop', title: 'Removing a task, in order', tone: 'source', children: [
        { type: 'item', id: 'drain', icon: 'alb', title: '1 · the target drains', sub: 'no new requests; 30 s for those in flight', stack: true },
        { type: 'item', id: 'term', icon: 'zap', title: '2 · ECS sends SIGTERM', sub: 'the app stops accepting, finishes, exits 0', stack: true },
        { type: 'item', id: 'kill', icon: 'lock', title: '3 · SIGKILL, if still running', sub: 'stopTimeout: 30 s after SIGTERM', stack: true, tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'seen', title: 'What drain.py saw', tone: 'ingest', columns: ['', 'event'], rows: [
        ['client', 'half a request sent'],
        ['client', 'SIGTERM sent to the app'],
        ['app', 'stopping: SIGTERM'],
        { cells: ['client', 'the request finished: 200 OK'], tone: 'ingest' },
        { cells: ['app', 'stopped cleanly, exit 0'], tone: 'ingest' },
      ],
    },
  ],
  edges: [
    { from: 'drain', to: 'term', label: 'deregistered' },
    { from: 'term', to: 'kill', label: '30 s', dashed: true },
  ],
})
