import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { runTree } from './files'
import code from '../../../spine/run/01-app/project/book_shop/web.py?raw'
import session from '../../../spine/run/01-app/session.txt?raw'

// §6.1 — the app, locally. book_shop is a standard-library HTTP API: /health for the load balancer,
// /books/<id> from the catalog bucket (the emulated one, through env.sh), 404 for anything else, one
// JSON log line per request on stdout. Run in the background, asked three times, stopped.
export const runApp: SceneModel = ideFrame({
  tree: runTree(1, { active: 'book_shop/web.py', fresh: ['pyproject.toml', 'book_shop/__init__.py', 'book_shop/catalog.py', 'book_shop/web.py'] }),
  editor: { file: 'book_shop/web.py', code, show: [[1, 5], [lineOf(code, 'class Shop'), lineOf(code, 'def reply') - 1]], highlight: linesFrom(code, 'def do_GET', 'self.reply(404, {"error": "not found"})') },
  session,
  side: [
    {
      type: 'group', id: 'path', title: 'GET /books/bk-1001, through the code', tone: 'source', children: [
        { type: 'item', id: 'curl', icon: 'terminal', title: 'curl', sub: '127.0.0.1:8080', stack: true },
        { type: 'item', id: 'handler', icon: 'python', title: 'web.py: Shop.do_GET', sub: 'matches /books/<id>', stack: true },
        { type: 'item', id: 'catalog', icon: 'python', title: 'catalog.py: get_book', sub: 'boto3 S3 client', stack: true },
        { type: 'item', id: 's3', icon: 's3', title: 'books/bk-1001.json', sub: 'the catalog bucket · emulated', stack: true },
      ],
    },
    {
      type: 'table', id: 'answers', title: 'Three requests, three answers', tone: 'ingest', columns: ['request', 'status', 'answer'], rows: [
        { cells: ['/health', '200', 'status ok'], tone: 'ingest' },
        { cells: ['/books/bk-1001', '200', 'the book\'s page'], tone: 'ingest' },
        { cells: ['/books/bk-9999', '404', 'no such book'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'curl', to: 'handler', label: 'HTTP' },
    { from: 'handler', to: 'catalog' },
    { from: 'catalog', to: 's3', label: 'GetObject' },
  ],
})
