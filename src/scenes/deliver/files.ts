import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'
import { ADDS as DECOUPLE, DECOUPLE_BASE } from '../decouple/files'

// The project through Course 9: what each step adds to (and, for the module refactor, removes from)
// what Course 8 left. Mirrors the spine's `changes` (spine/deliver/*/step.json).
export const DELIVER_BASE = [...DECOUPLE_BASE, ...Object.values(DECOUPLE).flat()]
export const ADDS: Record<number, string[]> = {
  2: ['infra/modules/network/main.tf', 'infra/modules/network/variables.tf', 'infra/modules/network/outputs.tf'],
  3: ['infra/envs/prod/state/main.tf', 'infra/envs/prod/main.tf'],
  4: ['infra/modules/pipeline/main.tf', 'infra/pipeline.tf'],
  5: ['.github/workflows/infra.yml', 'tools/jobs.py'],
  6: ['infra/returns.tf'],
}
export const REMOVED: Record<number, string[]> = { 2: ['infra/routes.tf', 'infra/nat.tf', 'infra/endpoint.tf'] }

/** The explorer after deliver step `n` (2 = modules … 7 = replacement). */
export function deliverTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const gone = Object.entries(REMOVED).filter(([k]) => +k <= n).flatMap(([, v]) => v)
  const paths = [...DELIVER_BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
    .filter((p) => !gone.includes(p))
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, '.venv/': 'boto3, pytest, psycopg',
    'build/': 'fulfil.zip, checkout.zip' }
  const open = [active, ...(fresh ?? [])].filter(Boolean) as string[]
  const closed = ['infra/bootstrap', 'data', 'infra', 'tools', 'tests', 'db', 'events', 'functions', 'workflows', 'book_shop',
    'infra/modules', 'infra/envs', '.github']
    .filter((d) => !open.some((f) => f.startsWith(d + '/')))
  return projectTree(paths, { active, fresh, made, closed, trim: ['infra', 'tools', 'book_shop', 'data', 'functions'] })
}
