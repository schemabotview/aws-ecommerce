import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { dataTree } from './files'
import code from '../../../spine/data/05-orders/project/book_shop/orders.py?raw'
import session from '../../../spine/data/05-orders/session.txt?raw'

// §7.5 — placing an order, in real PostgreSQL 16 (locally: the emulator runs no database). One
// transaction: the order, its lines, the stock taken. c-18's second line asks for 2 of bk-1002 with
// 1 in stock, the CHECK (stock >= 0) fails, and the whole transaction rolls back — including the
// bk-1001 copy taken a statement earlier (38 left, not 37). Real output, not emulated.
// source: https://www.postgresql.org/docs/16/tutorial-transactions.html
export const dataOrders: SceneModel = ideFrame({
  tree: dataTree(5, { active: 'book_shop/orders.py', fresh: ['db/migrations/001_orders.sql', 'book_shop/orders.py', 'tools/place_orders.py'] }),
  editor: { file: 'book_shop/orders.py', code, show: [[lineOf(code, 'def place_order'), code.trimEnd().split('\n').length]],
    highlight: linesFrom(code, 'with conn.transaction():', 'return order') },
  session,
  keep: ['$ createdb book_shop', '$ psql -q -f', ['$ python -m tools.place_orders', 'nothing was written'],
    ['$ psql -c \'SELECT id, stock', '(2 rows)']],
  side: [
    {
      type: 'group', id: 'tx', title: 'c-18\'s order: one transaction', tone: 'source', children: [
        { type: 'item', id: 'begin', icon: 'database', title: 'BEGIN', sub: 'nothing is visible to others yet', stack: true },
        { type: 'item', id: 'rows', icon: 'table', title: 'the order and its first line', sub: '1 copy of bk-1001 taken: all pending', stack: true },
        { type: 'item', id: 'fail', icon: 'lock', title: '2 × bk-1002: 1 in stock', sub: 'CHECK (stock >= 0) fails', stack: true, tone: 'consume' },
        { type: 'item', id: 'rollback', icon: 'clock', title: 'ROLLBACK', sub: 'every pending change undone', stack: true },
      ],
    },
    {
      type: 'table', id: 'after', title: 'After both orders', tone: 'ingest', columns: ['', 'c-17', 'c-18'], rows: [
        ['asked for', '2 × bk-1001', '1 × bk-1001, 2 × bk-1002'],
        { cells: ['result', 'order 1, 21.98', 'out of stock'], tone: 'ingest' },
        ['bk-1001 stock', '40 → 38', 'still 38'],
      ],
    },
  ],
  edges: [
    { from: 'begin', to: 'rows' },
    { from: 'rows', to: 'fail' },
    { from: 'fail', to: 'rollback', label: 'the error' },
  ],
})
