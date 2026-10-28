import type { TreeEntry } from '@graphlearning/graphl-flow'

// The explorer through Course 3, step by step: what the project holds after each section, the open
// file `active`, what this section added `new`. Generated files (.terraform/, local state, the saved
// plan) show muted, as an editor greys out what .gitignore covers.

type Mark = 'active' | 'new' | undefined
const f = (name: string, state?: Mark | 'muted', note?: string): TreeEntry => ({ name, state, note })

export interface Files {
  /** The path of the open file. */
  active: string
  /** Paths added in this section. */
  fresh?: string[]
}

const mark = (path: string, { active, fresh = [] }: Files): Mark =>
  path === active ? 'active' : fresh.includes(path) ? 'new' : undefined

/** The project after step `n` of Course 3 (2 = the profile … 8 = the budget). */
export function startTree(n: number, files: Files): TreeEntry[] {
  const m = (path: string) => mark(path, files)
  const infra: TreeEntry[] = []
  if (n >= 7) infra.push({ name: 'bootstrap', state: m('infra/bootstrap/main.tf'), children: [({ name: '.terraform', folder: true, state: 'muted' } as TreeEntry), f('.terraform.lock.hcl'), f('main.tf', m('infra/bootstrap/main.tf')), f('terraform.tfstate', 'muted', 'local')] })
  if (n >= 5) infra.push(({ name: '.terraform', folder: true, state: 'muted' } as TreeEntry))
  if (n >= 5) infra.push(f('.terraform.lock.hcl', n === 5 ? 'new' : undefined))
  if (n >= 7) infra.push(f('backend.tf', m('infra/backend.tf')))
  if (n >= 8) infra.push(f('budget.tf', m('infra/budget.tf')))
  if (n >= 5) infra.push(f('providers.tf', m('infra/providers.tf')), f('s3.tf', m('infra/s3.tf')))
  if (n >= 5) infra.push(f('terraform.tfstate', 'muted', n >= 7 ? 'moved to S3' : 'local'))
  if (n >= 5) infra.push(f('tfplan', 'muted'))
  const out: TreeEntry[] = []
  if (n >= 5) out.push({ name: 'infra', state: m('infra') ?? (n === 5 ? 'new' : undefined), children: infra })
  if (n === 4) out.push({ name: 'scripts', state: 'new', children: [f('make-bucket.sh', m('scripts/make-bucket.sh'))] })
  if (n >= 5) out.push(f('.gitignore', m('.gitignore')))
  out.push(f('aws-config', m('aws-config')))
  if (n >= 3) out.push(f('env.sh', m('env.sh')))
  return out
}
