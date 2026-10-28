import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'

// The project through Course 4: what each step adds to what Course 3 left. Mirrors the spine's
// `changes` (spine/secure/*/step.json); check-render would not notice a drift here, so keep both.
export const START_FILES = ['.gitignore', 'aws-config', 'env.sh', 'infra/.terraform.lock.hcl', 'infra/backend.tf', 'infra/bootstrap/',
  'infra/budget.tf', 'infra/providers.tf', 'infra/s3.tf']
const ADDS: Record<number, string[]> = {
  2: ['infra/iam.tf'],
  3: ['tools/as-app.sh', 'data/books/bk-1001.json'],
}
/** Everything Course 4 adds — the base Course 5 builds on. */
export const SECURE_FILES = [...START_FILES, ...Object.values(ADDS).flat()]

/** The explorer after secure step `n` (2 = the role … 7 = the bucket policy). */
export function secureTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...START_FILES, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, 'infra/terraform.tfstate': 'moved to S3', 'infra/tfplan': undefined }
  return projectTree(paths, { active, fresh, made, closed: ['infra/bootstrap'] })
}
