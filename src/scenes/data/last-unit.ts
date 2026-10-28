import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf, linesFrom } from '../ide'
import { dataTree } from './files'
import code from '../../../spine/data/08-last-unit/project/book_shop/stock.py?raw'
import session from '../../../spine/data/08-last-unit/session.txt?raw'

// §7.8 — the last unit in stock. Checkout is one TransactWriteItems: each stock update is
// conditional (stock >= n) and the cart's items are deleted, all or none. Two shoppers check out at
// once for the one copy of bk-1002; WHICH one wins is the thread scheduler's, so it is read from the
// transcript, never typed. Emulated: moto applies the conditions and the transaction.
// source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html
const outcome = Object.fromEntries(session.split('\n').filter((l) => /^c-\d+ (bought|sold out)/.test(l))
  .map((l) => [l.split(' ')[0], l.slice(5)]))
const winner = Object.keys(outcome).find((c) => outcome[c].startsWith('bought')) ?? '?'
const loser = Object.keys(outcome).find((c) => c !== winner) ?? '?'
const stockLeft = session.split('\n').filter((l) => /^bk-\d+\t\d+$/.test(l)).map((l) => l.split('\t'))
const cartLeft = session.split('\n').filter((l) => /^c-\d+\tbk-/.test(l)).map((l) => l.split('\t'))

export const dataLastUnit: SceneModel = ideFrame({
  tree: dataTree(8, { active: 'book_shop/stock.py', fresh: ['book_shop/stock.py', 'tools/last_unit.py'] }),
  editor: { file: 'book_shop/stock.py', code, show: [[lineOf(code, 'def checkout'), code.trimEnd().split('\n').length]],
    highlight: linesFrom(code, '"ConditionExpression"', '"ConditionExpression"') },
  session,
  keep: [['$ python -m tools.last_unit', 'c-18 '], ['$ aws dynamodb scan --table-name book-shop-stock', 'bk-1002\t0'],
    ['$ aws dynamodb scan --table-name book-shop-carts', 'bk-1002\t1']],
  side: [
    {
      type: 'group', id: 'race', title: 'Two checkouts, one copy of bk-1002', tone: 'source', children: [
        {
          type: 'group', id: 'buyers', bare: true, dir: 'row', children: [
            { type: 'item', id: 'b1', icon: 'user', title: winner, sub: '3 × bk-1001, 1 × bk-1002', stack: true },
            { type: 'item', id: 'b2', icon: 'user', title: loser, sub: 'the same cart, the same moment', stack: true },
          ],
        },
        { type: 'item', id: 'tx', icon: 'dynamodb', title: 'TransactWriteItems, twice', sub: 'each: stock >= n per book, delete the cart', stack: true },
        {
          type: 'group', id: 'results', bare: true, dir: 'row', children: [
            { type: 'item', id: 'won', icon: 'check', title: 'transaction committed', sub: 'stock 1 → 0, cart emptied', stack: true, tone: 'ingest' },
            { type: 'item', id: 'lost', icon: 'lock', title: 'TransactionCanceled', sub: 'stock >= 1 is false: nothing taken, cart kept', stack: true, tone: 'consume' },
          ],
        },
      ],
    },
    {
      type: 'group', id: 'after', bare: true, dir: 'row', children: [
        { type: 'table', id: 'stock-left', title: 'Stock after', tone: 'ingest', columns: ['book', 'copies'], rows: stockLeft },
        { type: 'table', id: 'cart-left', title: 'Carts after', tone: 'ingest', columns: ['customer', 'book', 'qty'], rows: cartLeft },
      ],
    },
    {
      type: 'table', id: 'why', title: 'Why only one wins', tone: 'ingest', columns: ['', ''], rows: [
        ['the condition', 'checked and written in one step, per item'],
        ['the transaction', 'every item of a checkout, or none'],
        ['no lock held', 'the loser fails at once, and can try again'],
      ],
    },
    { type: 'note', id: 'winner', tone: 'source', text: `Who won is the race's: this run, ${winner}. Run it again and it may be ${loser}; the numbers come out the same.` },
  ],
  edges: [
    { from: 'b1', to: 'tx' },
    { from: 'b2', to: 'tx' },
    { from: 'tx', to: 'won' },
    { from: 'tx', to: 'lost' },
  ],
})
