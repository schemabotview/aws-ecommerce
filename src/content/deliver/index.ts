import type { Course, Section } from '../types'

// Course 9 · Ship it safely (COURSE-PLAN.md). Narration is written for the speech engine: acronyms
// spelled ("A W S", "O I D C", "S T S"), account ids digit by digit in groups, prices as words.

const modules: Section = {
  id: 'modules',
  title: 'Modules: the same resources, written once',
  scene: 'deliver-modules',
  narration:
    "Production is coming, and it needs the same network as development. Copying four files and editing them would leave two versions to keep in step forever. A module is the answer: a folder of Terraform that takes inputs, so one piece of code can be used many times. The network from Course 5, the V P C, nine subnets, two route tables, the gateways and the S three endpoint, moves into modules slash network, with two inputs: a name, and the V P C's range, from which each subnet's range is now worked out. The editor shows what the root keeps, network dot t f. A module block, highlighted, calls the module with development's values. But this changes every resource's address. The V P C was aws V P C dot shop; now it is module dot network, aws V P C dot this. To Terraform, a new address means a new resource: without help, the plan would destroy the network and build another, with the tasks and the database inside it. So each resource gets a moved block, highlighted: from the old address, to the new one. It says the thing is the same; only its name in the code changed. In the terminal, init installs the module. The plan lists every resource as moved, the V P C first, and ends with zero to add, zero to change, zero to destroy. The side pane draws the root calling the module, and the table shows three addresses before and after. Nothing in the account changed. Next, the same module, in a second account.",
}

const twoEnvironmentsTwoAccounts: Section = {
  id: 'two-environments-two-accounts',
  title: 'Two environments, two accounts: one module, two states',
  scene: 'deliver-envs',
  narration:
    "Production gets its own account, one one one one, two two two two, three three three three, so that a mistake in development can never reach it. The editor shows its root, envs slash prod slash main dot t f. Two parts are highlighted. Its state lives in a bucket in production's own account, not in development's. And it calls the very same network module, with one input changed: production's range is ten dot forty, not ten dot twenty, so the two could be connected one day. Its provider reaches production through a role: for now, the administrator role that A W S Organizations creates in every account it makes, reached from the developer's own sign in. In section four, the pipeline gets a narrower role of its own. In the terminal, a tiny root makes production's state bucket first, with local state, the way Course 3 made development's. Then production's root is initialised and applied: twenty seven resources, the whole network. Last, the same question asked of each account: which V P Cs are called book shop? Development answers with its account and ten dot twenty. Production, asked through its profile, answers with its own account and ten dot forty. The side pane draws one module feeding two roots, each with its own account and its own state. The table says what differs and what does not: the code is identical, the inputs differ, and a mistake stays where it was made. Next, the path every change will take to get there.",
}

const aDeliveryPipeline: Section = {
  id: 'a-delivery-pipeline',
  title: 'A delivery pipeline: from a commit to production',
  scene: 'deliver-pipeline',
  narration:
    "Until now, every change to the shop was applied from a laptop. That works for one person; it does not work for a team, and it should never be how production changes. A delivery pipeline gives every change the same path, and the frame draws it in two rows. Above, a pull request, where nothing changes yet. A commit on a branch is checked: is the Terraform formatted, and is it valid? Then it is planned against development, and the plan is posted on the pull request, so a reviewer reads exactly what will change, before anything does. Below, what happens on merge. The reviewed change is applied to development, in a real account. Only if that works does the pipeline go on, and then it waits: a second person must approve the production environment. Then it applies to production. The table goes stage by stage: what each one proves, and what blocks it. Formatting and validation catch mistakes in seconds. The plan shows the change. The review puts a person in front of it. Applying to development proves it works before production sees it, and the approval means someone chose to ship now. The note at the bottom is the security point: no job holds a stored key. Each asks GitHub for a token that lasts minutes, and trades it for a role in its account. The next two sections build those roles, and the workflow file itself.",
}

const aRoleForThePipeline: Section = {
  id: 'a-role-for-the-pipeline',
  title: 'A role for the pipeline: credentials with no stored key',
  scene: 'deliver-pipeline-role',
  narration:
    "A pipeline that changes two accounts needs credentials for both, and the worst place to keep them is in the pipeline, as long lived keys, where one leak gives everything away. Instead, each job proves who it is, and gets credentials for an hour. The side pane follows one job. It asks GitHub for a token: a signed statement that says which repository it comes from and which branch or environment it runs in. It hands the token to S T S, with assume role with web identity. S T S checks GitHub's signature, and that the token is meant for it, and that its subject matches the role's trust policy, and only then returns credentials for the role. The editor shows that trust policy, in the new pipeline module. It trusts GitHub's O I D C provider, which the module registers in the account, and, highlighted, only the subjects passed in. Development's role trusts runs on main, and pull requests, which only plan. Production's trusts a single subject: a run in GitHub's production environment, the one a reviewer must approve. Its permissions are the shop's own services, and I A M changes only to roles whose names start with book shop: never a person, and never another team's role. In the terminal, the module is applied in development, then in production, and production's trust policy is read back: the web identity action, the audience, the subject that ends in environment production, and the provider. The table sums up who may assume which. The red note is the honest part: the emulator stores the provider and the trust, but does not check tokens; the exchange is GitHub's and A W S's documentation. Next, the workflow that uses these roles.",
}

const checksBeforeApply: Section = {
  id: 'checks-before-apply',
  title: 'Checks before apply: the workflow, and what blocks a merge',
  scene: 'deliver-checks',
  narration:
    "Now the pipeline itself, as a file in the repository: dot github slash workflows slash infra dot y m l. The editor shows its jobs. Check runs on every pull request and every push: terraform format, check, highlighted, which fails if any file is not formatted the standard way, and validate, which fails if the configuration does not make sense. Plan dev runs on a pull request, after check, assumes development's pipeline role, and plans. Apply dev runs on main and applies to development. And apply prod waits for apply dev, and then for the production environment, highlighted: GitHub holds the job until a reviewer approves it, and that environment's name is exactly what production's role trusts. In the terminal, a small tool reads the jobs out of the file, and then we run the same checks locally, before ever pushing. The code is formatted. It is valid. A plan with detailed exit code returns zero, which means nothing would change: what is in the code is what is in development. To see the gate close, we write a badly aligned scratch file. Format check now lists it, and exits with three: in the pipeline, that is a red check, and the pull request cannot merge until it is fixed. The side pane is the gate as the file declares it, and the table is what each check answered. One honest note: this workflow has not run on GitHub; it is the shop's file, run here by hand. Next, what to do when the account and the code disagree.",
}

const releasingANewVersion: Section = {
  id: 'releasing-a-new-version',
  title: 'Releasing a new version: how much of a bad release shoppers see',
  scene: 'deliver-release',
  narration:
    "Infrastructure goes through the pipeline; so does the app. And sooner or later a release is bad. Here, version one point two point zero fails two requests in every hundred. The error alarm notices after two minutes, and the release is rolled back. The question is how many shoppers see an error before then, and that depends on how the new version was put in front of them. The left of the frame names four ways. All at once: every task is replaced together. Rolling: one task of seven is replaced each minute. Blue green: a whole new set of tasks is started, and traffic switches to it; going back is one switch, but everyone was on the new version. And canary: one tenth of the traffic goes to the new version first, and the rest only after it has proved itself. The plot comes from a small model, labelled as one, at the evening peak of four hundred and twenty requests a second. All at once climbs fastest: about a thousand failed requests before the alarm. Rolling grows as more tasks are replaced: about two hundred. The canary stays flat and low: about a hundred, because only a tenth of shoppers ever met the bad version. The terminal shows the model's own output. The table is the trade. All at once costs nothing and exposes everyone. Rolling needs room for one more task. Blue green needs twice the tasks for a while, and makes going back instant. A canary needs traffic splitting and an alarm you trust. That completes Course 9: the shop ships through a pipeline, and a bad release reaches few people. Next course, it reports on what it sold.",
}

export const deliver: Course = {
  id: 'deliver',
  title: 'Ship it safely',
  sections: [modules, twoEnvironmentsTwoAccounts, aDeliveryPipeline, releasingANewVersion],
}
