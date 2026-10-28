import type { SceneModel } from '@graphlearning/graphl-flow'

// §3.1 — the account and its root user (concept). An AWS account is the boundary everything else
// sits in; its root user can do anything and is locked away; people sign in through IAM Identity
// Center and act through ROLES, one per account, with short-lived credentials.
// source: https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-tasks.html (root-only tasks)
// source: https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html (Identity Center)
export const startAccount: SceneModel = {
  nodes: [
    {
      type: 'group', id: 'top', bare: true, dir: 'row', children: [
        {
          type: 'group', id: 'people', title: 'Who signs in', tone: 'source', spread: true, children: [
            { type: 'item', id: 'alex', icon: 'user', title: 'alex', sub: 'developer, every day' },
            { type: 'item', id: 'owner', icon: 'admin', title: 'the owner', sub: 'opened the accounts' },
          ],
        },
        { type: 'item', id: 'sso', icon: 'identitycenter', title: 'IAM Identity Center', sub: 'one sign-in, then a role in an account', tone: 'ingest' },
        {
          type: 'group', id: 'accounts', bare: true, children: [
            {
              type: 'group', id: 'dev', icon: 'account', title: 'Account 444455556666', sub: 'development', children: [
                { type: 'item', id: 'dev-role', icon: 'iamrole', title: 'BookShopDeveloper', sub: 'role: build and break things' },
                { type: 'item', id: 'dev-root', icon: 'lock', title: 'its root user', sub: 'email + password + MFA, locked away', tone: 'consume' },
              ],
            },
            {
              type: 'group', id: 'prod', icon: 'account', title: 'Account 111122223333', sub: 'production', children: [
                { type: 'item', id: 'prod-role', icon: 'iamrole', title: 'BookShopReadOnly', sub: 'role: look, never touch' },
                { type: 'item', id: 'prod-root', icon: 'lock', title: 'its root user', sub: 'email + password + MFA, locked away', tone: 'consume' },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'table', id: 'root-only', title: 'Only a root user can…', tone: 'consume', columns: ['task', 'how often'], rows: [
        ['close the account', 'once'],
        ['change the account\'s email or name', 'rarely'],
        ['restore an IAM admin who is locked out', 'an emergency'],
        ['change the support plan', 'rarely'],
      ],
    },
  ],
  edges: [
    { from: 'alex', to: 'sso', label: 'every day' },
    { from: 'sso', to: 'dev-role' },
    { from: 'sso', to: 'prod-role' },
    { from: 'owner', to: 'prod-root', label: 'break glass', dashed: true },
  ],
}
