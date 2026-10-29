import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'
import { ADDS as OPERATE, OPERATE_BASE } from '../operate/files'

// The project through Course 12: what each step adds to what Course 11 left. Mirrors the spine's
// `changes` (spine/evolve/*/step.json).
export const EVOLVE_BASE = [...OPERATE_BASE, ...Object.values(OPERATE).flat()]
export const ADDS: Record<number, string[]> = {
  2: ['infra/cdn.tf'],
  5: ['infra/costs.tf', 'data/spend-october.csv', 'tools/spend.py'],
  6: ['docs/adr/001-order-platform.md', 'tools/score.py'],
}

/** The explorer after evolve step `n` (2 = CDN, 5 = costs, 6 = the decision record). */
export function evolveTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...EVOLVE_BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, '.venv/': 'boto3, pyarrow, duckdb',
    'build/': 'fulfil.zip, checkout.zip', 'lake/': 'a copy, for reports' }
  const open = [active, ...(fresh ?? [])].filter(Boolean) as string[]
  const closed = ['infra/bootstrap', 'data', 'infra', 'tools', 'tests', 'db', 'events', 'functions', 'workflows', 'book_shop',
    'infra/modules', 'infra/envs', '.github', 'jobs', 'reports', 'db/migrations', 'docs', 'docs/adr']
    .filter((d) => !open.some((f) => f.startsWith(d + '/')))
  return projectTree(paths, { active, fresh, made, closed, trim: ['infra', 'tools', 'book_shop', 'data', 'functions', 'jobs'] })
}
