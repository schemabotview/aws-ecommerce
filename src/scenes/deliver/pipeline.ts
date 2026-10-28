import type { SceneModel } from '@graphlearning/graphl-flow'

// §9.3 — ◆ full scene: a delivery pipeline. The path every change to the shop takes from a commit to
// production, as .github/workflows/infra.yml (§9.5) declares it: checks, a plan against dev on the
// pull request, a person's review, apply to dev on merge, a second person's approval of the
// `production` environment, apply to prod. Each stage either proves something or blocks.
// source: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
const stage = (id: string, icon: string, title: string, sub: string, tone?: 'ingest' | 'consume' | 'serve') =>
  ({ type: 'item' as const, id, icon, title, sub, stack: true, tone })

export const deliverPipeline: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'pr', title: 'A pull request: nothing changes yet', tone: 'source', dir: 'row', children: [
        stage('commit', 'githubactions', 'a commit', 'on a branch'),
        stage('check', 'check', 'check', 'fmt -check, validate'),
        stage('plan', 'terraform', 'plan against dev', 'posted on the pull request'),
        stage('review', 'users', 'review', 'a person reads the plan'),
      ],
    },
    {
      type: 'group', id: 'main', title: 'A merge to main: dev, then prod', tone: 'ingest', dir: 'row', children: [
        stage('merge', 'githubactions', 'merge', 'the reviewed change'),
        stage('dev', 'terraform', 'apply to dev', '444455556666'),
        stage('approve', 'users', 'approve production', 'a second person'),
        stage('prod', 'terraform', 'apply to prod', '111122223333', 'serve'),
      ],
    },
    {
      type: 'table', id: 'proves', title: 'What each stage proves, or blocks', tone: 'source', columns: ['stage', 'proves', 'blocks the merge when'], rows: [
        ['check', 'the code is formatted and valid', 'fmt or validate fails'],
        ['plan against dev', 'what will change, before it does', 'the plan errors'],
        ['review', 'a person agrees with the plan', 'not approved'],
        ['apply to dev', 'the change works in a real account', 'apply fails: prod never runs'],
        { cells: ['approve production', 'someone chose to ship now', 'nobody approves: it waits'], tone: 'consume' },
      ],
    },
    { type: 'note', id: 'no-keys', tone: 'source', text: 'No job holds a stored key: each asks GitHub for a short-lived token and trades it for a role in that account (§9.4). Nobody applies from a laptop.' },
  ],
  edges: [
    { from: 'commit', to: 'check' },
    { from: 'check', to: 'plan' },
    { from: 'plan', to: 'review' },
    { from: 'review', to: 'merge' },
    { from: 'merge', to: 'dev' },
    { from: 'dev', to: 'approve' },
    { from: 'approve', to: 'prod' },
  ],
}
