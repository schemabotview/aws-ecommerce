import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'
import { ADDS as RUN, RUN_BASE } from '../run/files'

// The project through Course 7: what each step adds to what Course 6 left. Mirrors the spine's
// `changes` (spine/data/*/step.json); check-render would not notice a drift here, so keep both.
export const DATA_BASE = [...RUN_BASE, ...Object.values(RUN).flat()]
export const ADDS: Record<number, string[]> = {
  3: ['infra/uploads.tf', 'book_shop/uploads.py', 'data/photos/r-77.jpg'],
  4: ['infra/database.tf'],
  5: ['db/migrations/001_orders.sql', 'book_shop/orders.py', 'tools/place_orders.py'],
  6: ['infra/secrets.tf'],
  7: ['infra/tables.tf', 'book_shop/cart.py', 'tools/carts.py'],
  8: ['book_shop/stock.py', 'tools/last_unit.py'],
}

/** The explorer after data step `n` (2 = the catalog bucket … 8 = the last unit). */
export function dataTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...DATA_BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, 'infra/terraform.tfstate': 'moved to S3',
    'infra/tfplan': undefined, '.venv/': 'boto3, pytest, psycopg', 'app.log': undefined, '.pytest_cache/': undefined }
  if (n >= 3) made['signed.json'] = undefined
  const open = [active, ...(fresh ?? [])].filter(Boolean) as string[]
  const closed = ['infra/bootstrap', 'data', 'infra', 'tools', 'tests', 'db'].filter((d) => !open.some((f) => f.startsWith(d + '/')))
  return projectTree(paths, { active, fresh, made, closed, trim: ['infra', 'tools', 'book_shop', 'data'] })
}
