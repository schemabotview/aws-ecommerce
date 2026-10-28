import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame, lineOf } from '../ide'
import { deliverTree } from './files'
import code from '../../../spine/deliver/05-checks/project/.github/workflows/infra.yml?raw'
import session from '../../../spine/deliver/05-checks/session.txt?raw'

// §9.5 — checks before apply. .github/workflows/infra.yml: check (fmt -check, validate) on every pull
// request and push; plan against dev on a pull request; apply dev on main; apply prod after the
// `production` environment's approval. The terminal runs the workflow's own checks locally (and a
// badly formatted scratch file, to see fmt -check fail); tools/jobs.py reads the jobs from the YAML.
// The workflow has not run on GitHub: this repository is the course's, not the shop's.
// source: https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions
export const deliverChecks: SceneModel = ideFrame({
  tree: deliverTree(5, { active: '.github/workflows/infra.yml', fresh: ['.github/workflows/infra.yml', 'tools/jobs.py'] }),
  editor: { file: '.github/workflows/infra.yml', code, show: [[lineOf(code, 'jobs:'), lineOf(code, 'plan-dev:') + 1],
    [lineOf(code, 'apply-prod:'), lineOf(code, 'environment: production')]],
    highlight: [lineOf(code, 'run: terraform fmt -check -recursive'), lineOf(code, 'environment: production')] },
  session,
  keep: [['$ cd infra', 'plan exit code'], ['$ terraform fmt -check -recursive; echo', 'fmt exit code']],
  side: [
    {
      type: 'group', id: 'gate', title: 'The gate, as the workflow declares it', tone: 'source', children: [
        { type: 'item', id: 'pr', icon: 'githubactions', title: 'pull request', sub: 'check, then plan-dev', stack: true },
        { type: 'item', id: 'review', icon: 'users', title: 'review and merge', sub: 'a person reads the plan', stack: true },
        { type: 'item', id: 'dev', icon: 'terraform', title: 'apply-dev', sub: 'on main, after check', stack: true },
        { type: 'item', id: 'prod', icon: 'terraform', title: 'apply-prod', sub: 'after apply-dev, and an approval', stack: true, tone: 'serve' },
      ],
    },
    {
      type: 'table', id: 'checks', title: 'What each check answered here', tone: 'ingest', columns: ['check', 'result'], rows: [
        ['fmt -check', 'formatted (exit 0)'],
        ['validate', 'the configuration is valid'],
        ['plan -detailed-exitcode', '0: no changes pending'],
        { cells: ['fmt -check, scratch.tf', 'exit 3: blocks the merge'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'pr', to: 'review' },
    { from: 'review', to: 'dev' },
    { from: 'dev', to: 'prod' },
  ],
})
