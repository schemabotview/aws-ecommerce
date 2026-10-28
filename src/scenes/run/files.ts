import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'
import { SECURE_FILES } from '../secure/files'
import { ADDS as NETWORK } from '../network/files'

// The project through Course 6: what each step adds to what Course 5 left. Mirrors the spine's
// `changes` (spine/run/*/step.json); check-render would not notice a drift here, so keep both.
const BASE = [...SECURE_FILES, ...Object.values(NETWORK).flat()]
const ADDS: Record<number, string[]> = {
  1: ['pyproject.toml', 'book_shop/__init__.py', 'book_shop/catalog.py', 'book_shop/web.py'],
  2: ['tests/conftest.py', 'tests/test_catalog.py', 'tests/test_web.py'],
  4: ['Dockerfile', '.dockerignore', 'requirements.txt', 'infra/ecr.tf', 'tools/push_image.py'],
  5: ['infra/task.tf'],
  6: ['infra/service.tf'],
  7: ['infra/scaling.tf'],
  8: ['tools/drain.py'],
}

/** The explorer after run step `n` (1 = the app … 8 = graceful). */
export function runTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, 'infra/terraform.tfstate': 'moved to S3', 'infra/tfplan': undefined,
    '.venv/': 'boto3, pytest' }
  if (n >= 1) made['app.log'] = undefined
  if (n >= 2) made['.pytest_cache/'] = undefined
  // The infrastructure and tools are Course 5's story: closed, unless a file in them is open or new.
  const open = [active, ...(fresh ?? [])].filter(Boolean) as string[]
  const closed = ['infra/bootstrap', 'data', 'infra', 'tools'].filter((d) => !open.some((f) => f.startsWith(d + '/')))
  return projectTree(paths, { active, fresh, made, closed, trim: ['infra', 'tools'] })
}
