import type { SceneModel } from '@graphlearning/graphl-flow'
import { keepLines, terminal } from '../ide'
import session from '../../../spine/secure/08-org/session.txt?raw'

// §4.8 — ◆ full scene: an organization and its guardrails. The tree AWS draws: the root, OUs
// Security and Workloads, Prod and Dev under Workloads, an account in each, and the LondonOnly SCP on
// Workloads, so it reaches Prod and Dev but not Security. The OUs, the policy and the attachment are
// the lab's (spine/secure/08-org: Terraform applied to the emulator from the management account);
// which account sits in which OU is the course's plan, not the lab's (moto invents account ids). The
// emulator stores SCPs; it does not enforce them, so what an SCP does is AWS's documentation.
// source: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
// source: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_evaluation.html (management account unaffected)
const rows = terminal(session)

export const secureOrg: SceneModel = {
  dir: 'row',
  nodes: [
    {
      type: 'group', id: 'tree', title: 'The organization', tone: 'source', children: [
        { type: 'item', id: 'root', icon: 'organizations', title: 'Root', sub: 'management account 123456789012: billing, the org itself', stack: true },
        {
          type: 'group', id: 'ous', bare: true, dir: 'row', children: [
            {
              type: 'group', id: 'security', icon: 'account', title: 'OU Security', children: [
                { type: 'item', id: 'audit', icon: 'account', title: '777788889999', sub: 'audit: the Auditor role (§4.7)', stack: true },
              ],
            },
            {
              type: 'group', id: 'workloads', icon: 'account', title: 'OU Workloads', sub: 'SCP LondonOnly attached here', tone: 'consume', children: [
                {
                  type: 'group', id: 'envs', bare: true, dir: 'row', children: [
                    {
                      type: 'group', id: 'prod', icon: 'account', title: 'OU Prod', children: [
                        { type: 'item', id: 'prod-acct', icon: 'account', title: '111122223333', sub: 'production', stack: true },
                      ],
                    },
                    {
                      type: 'group', id: 'dev', icon: 'account', title: 'OU Dev', children: [
                        { type: 'item', id: 'dev-acct', icon: 'account', title: '444455556666', sub: 'development: the shop so far', stack: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'table', id: 'reach', title: 'Where LondonOnly applies', tone: 'consume', columns: ['account', 'outside eu-west-2'], rows: [
            ['111122223333 · Prod', 'denied, whatever its roles allow'],
            ['444455556666 · Dev', 'denied, whatever its roles allow'],
            ['777788889999 · Security', 'not attached: allowed'],
            ['123456789012 · management', 'SCPs never apply to it'],
          ],
        },
      ],
    },
    {
      type: 'group', id: 'right', bare: true, children: [
        {
          type: 'code', id: 'lab', terminal: true, filename: 'terminal — org · emulated', code: rows,
          show: keepLines(rows, ['$ terraform apply tfplan', 'Apply complete!', ['$ ROOT=', '"Workloads"'], ['$ WORKLOADS=', '"LondonOnly"']]),
        },
        {
          type: 'group', id: 'scp', title: 'An SCP is a ceiling, not a grant', tone: 'ingest', dir: 'row', children: [
            { type: 'item', id: 'ceiling', icon: 'organizations', title: 'the SCP', sub: 'the most any role here may do', stack: true },
            { type: 'item', id: 'result', icon: 'check', title: 'what it can do', sub: 'only what BOTH allow', stack: true },
            { type: 'item', id: 'grant', icon: 'permissions', title: 'the role\'s policies', sub: 'what it is actually given', stack: true },
          ],
        },
        { type: 'note', id: 'emulated', tone: 'consume', text: 'Emulated: the emulator made the OUs and stored the SCP, but does not enforce SCPs. Their effect is AWS\'s documented logic; the account ids are the course\'s plan.' },
      ],
    },
  ],
  edges: [
    { from: 'root', to: 'security' },
    { from: 'root', to: 'workloads' },
    { from: 'ceiling', to: 'result' },
    { from: 'grant', to: 'result' },
  ],
}
