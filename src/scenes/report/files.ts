import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'
import { ADDS as DELIVER, DELIVER_BASE, REMOVED as DELIVER_REMOVED } from '../deliver/files'

// The project through Course 10: what each step adds to what Course 9 left. Mirrors the spine's
// `changes` (spine/report/*/step.json).
const gone = Object.values(DELIVER_REMOVED).flat()
export const REPORT_BASE = [...DELIVER_BASE, ...Object.values(DELIVER).flat()].filter((p) => !gone.includes(p))
export const ADDS: Record<number, string[]> = {
  2: ['infra/lake.tf', 'db/migrations/002_placed.sql', 'jobs/__init__.py', 'jobs/seed_september.py', 'jobs/export_orders.py'],
  3: ['infra/catalog.tf'],
  4: ['infra/athena.tf', 'reports/yesterday.sql', 'tools/sales.py'],
  5: ['infra/clicks.tf', 'tools/clicks.py'],
}

/** The explorer after report step `n` (2 = export … 5 = clicks). */
export function reportTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...REPORT_BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, '.venv/': 'boto3, pyarrow, duckdb',
    'build/': 'fulfil.zip, checkout.zip', ...(n >= 4 ? { 'lake/': 'a copy, for reports' } : {}) }
  const open = [active, ...(fresh ?? [])].filter(Boolean) as string[]
  const closed = ['infra/bootstrap', 'data', 'infra', 'tools', 'tests', 'db', 'events', 'functions', 'workflows', 'book_shop',
    'infra/modules', 'infra/envs', '.github', 'jobs', 'reports', 'db/migrations']
    .filter((d) => !open.some((f) => f.startsWith(d + '/')))
  return projectTree(paths, { active, fresh, made, closed, trim: ['infra', 'tools', 'book_shop', 'data', 'functions', 'jobs', 'db/migrations'] })
}
