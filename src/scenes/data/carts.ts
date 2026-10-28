import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { dataTree } from './files'
import code from '../../../spine/data/07-carts/project/book_shop/cart.py?raw'
import session from '../../../spine/data/07-carts/session.txt?raw'

// §7.7 — carts in DynamoDB. Partition key customer, sort key book: a cart is ONE item collection, read
// by one Query; adding a book twice updates one item (ADD). The partitions and items drawn are the
// emulator's scan, read from the transcript. How DynamoDB hashes keys to partitions is its documentation.
// source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html
const items = session.split('\n').filter((l) => /^c-\d+\tbk-/.test(l)).map((l) => l.split('\t'))
const customers = [...new Set(items.map(([c]) => c))]

export const dataCarts: SceneModel = ideFrame({
  tree: dataTree(7, { active: 'book_shop/cart.py', fresh: ['infra/tables.tf', 'book_shop/cart.py', 'tools/carts.py'] }),
  editor: { file: 'book_shop/cart.py', code, show: [[lineOf(code, 'def add'), code.trimEnd().split('\n').length]] },
  session,
  keep: ['Apply complete!', ['$ python -m tools.carts', 'c-18 {'], ['$ aws dynamodb scan', 'c-18\tbk-1002']],
  side: [
    {
      type: 'group', id: 'table', icon: 'dynamodb', title: 'book-shop-carts', tone: 'source', children: customers.map((customer) => ({
        type: 'group' as const, id: `p-${customer}`, title: `customer = ${customer}`, sub: 'one item collection', dir: 'row' as const, children: items
          .filter(([c]) => c === customer).map(([, book, quantity]) => ({
            type: 'item' as const, id: `i-${customer}-${book}`, icon: 'file', title: `book = ${book}`, sub: `quantity ${quantity}` })),
      })),
    },
    {
      type: 'group', id: 'how', title: 'Reading a cart', tone: 'ingest', children: [
        { type: 'item', id: 'key', icon: 'key', title: 'customer = c-17', sub: 'the partition key', stack: true },
        { type: 'item', id: 'hash', icon: 'layers', title: 'one partition', sub: 'chosen by hashing the key', stack: true },
        { type: 'item', id: 'query', icon: 'search', title: 'one Query', sub: 'every book, sorted', stack: true },
      ],
    },
    {
      type: 'table', id: 'ops', title: 'What each call costs', tone: 'source', columns: ['call', 'reads', 'used for'], rows: [
        { cells: ['Query c-17', 'one cart', 'contents()'], tone: 'ingest' },
        ['UpdateItem', 'one item', 'add()'],
        { cells: ['Scan', 'the whole table', 'only to look'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'key', to: 'hash' },
    { from: 'hash', to: 'query' },
  ],
})
