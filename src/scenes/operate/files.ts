import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'
import { ADDS as REPORT, REPORT_BASE } from '../report/files'

// The project through Course 11: what each step adds to what Course 10 left. Mirrors the spine's
// `changes` (spine/operate/*/step.json).
export const OPERATE_BASE = [...REPORT_BASE, ...Object.values(REPORT).flat()]
export const ADDS: Record<number, string[]> = {
  2: ['infra/observe.tf', 'tools/evening.py', 'tools/count_errors.py'],
  3: ['infra/alerts.tf', 'tools/burn.py'],
  4: ['infra/trail.tf'],
  5: ['infra/keys.tf', 'tools/envelope.py'],
  6: ['infra/waf.tf'],
  7: ['infra/backup.tf'],
  8: ['infra/incident.tf'],
}

/** The explorer after operate step `n` (2 = logs … 8 = incident). */
export function operateTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...OPERATE_BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, '.venv/': 'boto3, pyarrow, duckdb',
    'build/': 'fulfil.zip, checkout.zip', 'lake/': 'a copy, for reports' }
  const open = [active, ...(fresh ?? [])].filter(Boolean) as string[]
  const closed = ['infra/bootstrap', 'data', 'infra', 'tools', 'tests', 'db', 'events', 'functions', 'workflows', 'book_shop',
    'infra/modules', 'infra/envs', '.github', 'jobs', 'reports', 'db/migrations']
    .filter((d) => !open.some((f) => f.startsWith(d + '/')))
  return projectTree(paths, { active, fresh, made, closed, trim: ['infra', 'tools', 'book_shop', 'data', 'functions', 'jobs'] })
}
