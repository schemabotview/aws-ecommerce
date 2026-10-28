import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'

// The project through Course 5: what each step adds to what Course 3 left. Mirrors the spine's
// `changes` (spine/network/*/step.json); check-render would not notice a drift here, so keep both.
const BASE = ['.gitignore', 'aws-config', 'env.sh', 'infra/.terraform.lock.hcl', 'infra/backend.tf', 'infra/bootstrap/',
  'infra/budget.tf', 'infra/providers.tf', 'infra/s3.tf']
const ADDS: Record<number, string[]> = {
  2: ['infra/network.tf'],
  3: ['infra/routes.tf', 'tools/which_route.py'],
  5: ['infra/nat.tf'],
  6: ['infra/security.tf', 'tools/sg_rules.py'],
  8: ['infra/alb.tf'],
  9: ['infra/dns.tf'],
  10: ['infra/endpoint.tf'],
}

/** The explorer after network step `n` (2 = the VPC … 10 = the S3 endpoint). */
export function netTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, 'infra/terraform.tfstate': 'moved to S3', 'infra/tfplan': undefined }
  if (n >= 3) made['.venv/'] = 'boto3, for tools/'
  return projectTree(paths, { active, fresh, made, closed: ['infra/bootstrap'] })
}
