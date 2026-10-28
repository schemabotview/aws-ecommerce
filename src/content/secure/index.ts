import type { Course, Section } from '../types'

// Course 4 · Lock it down (COURSE-PLAN.md). Narration is written for the speech engine: acronyms
// spelled ("A W S", "I A M", "S T S"), account ids digit by digit in groups, prices as words.

const principalsAndAuthentication: Section = {
  id: 'principals-and-authentication',
  title: 'Principals and authentication: who is asking, and how they prove it',
  scene: 'secure-principals',
  narration:
    "Every request A W S receives was made by someone, and before it does anything, A W S has to know who. That someone is called a principal, and the left of the frame lists the kinds. The root user, which we locked away in the last course. An I A M user, a long lived identity with a password or an access key. A person like alex, who signs in through Identity Center and works inside a role. And a service acting for us, like the container service E C S running the shop's code, which also works inside a role. In the middle is what each one signs its requests with. An I A M user's access key starts with A K I A and lasts until someone deletes it. A role session's credentials start with A S I A, come with a session token, and expire, after an hour by default. On the right is what A W S does with a request. Every request is signed with the secret half of a key. First comes authentication: is the signature right, and is the key real? Only then comes authorization: do the policies allow this principal to take this action on this resource? The table makes the case for roles. If a long term key leaks, it works until someone notices. If temporary credentials leak, they stop working on their own. So the book shop uses no long term keys at all: alex works through a role, the app will work through a role, and later so will the delivery pipeline. Next, the app gets its role.",
}

const aRoleForTheApp: Section = {
  id: 'a-role-for-the-app',
  title: 'A role for the app: who may become it, and what it may do',
  scene: 'secure-role',
  narration:
    "The project gains a file, i a m dot t f, open in the editor. It declares the app's identity: a role called Book Shop App. A role has no password and no key of its own; it is a set of permissions that a trusted principal can step into for a while. The highlighted lines are its trust policy, and they answer one question: who may become this role? Here, one principal: the service E C S tasks dot amazonaws dot com, which is how the container service runs the shop's code in Course 6. In the terminal, plan and apply create the role. Then we read it back from the emulator. Get role shows the trust policy as A W S stored it: allow, the service E C S tasks, the action S T S assume role. List role policies shows the other half, and it is empty. The side pane draws the two questions a role answers. The arrow from E C S into the role is trust: who may assume it. The arrow out of the role is permissions: what it may do, and it is dashed, because so far the answer is nothing. The table keeps them apart. A trust policy names a principal, and a role has exactly one. A permissions policy names actions and resources, and a role can have any number. With none at all, a role is allowed to do nothing, so Book Shop App is denied everything. Next, we become the role, and see that for ourselves.",
}

const assumingTheRole: Section = {
  id: 'assuming-the-role',
  title: 'Assuming the role: temporary credentials, and a first denial',
  scene: 'secure-assume',
  narration:
    "From this section on, the emulator checks every request against I A M, with one exception it says out loud: alex's own requests stand for alex's developer role, which may do anything in development. Alex starts by uploading the shop's first book page, bk one zero zero one, into the catalog bucket. Then alex asks S T S, the security token service, to assume the app's role. On A W S, only E C S could do this, because the trust policy names only E C S. The emulator does not hold alex to the trust policy, so here alex stands in for E C S, and the frame says so. The answer is a set of temporary credentials: a key starting with A S I A, a secret, a session token, and an expiry one hour from now. The editor shows the small tool that does this for us: as app dot s h asks for those credentials, puts them in the environment, and runs one command with them. Asked who it is, the tool's command answers: the assumed role Book Shop App, session task one. Then, as the app, it tries to read the very book alex just uploaded, and S three says no: forbidden, a four oh three, on its very first request, which asks for the object's details. The side pane follows the steps: the caller asks S T S for the role, gets credentials, and signs the request with them, and that request is refused. The table shows the point: the same read, alex allowed, the app refused. A role with no permissions policy can do nothing, and that is the right place to start. Next, we give it exactly one thing it may do.",
}

const policyStatements: Section = {
  id: 'policy-statements',
  title: 'Policy statements: allow exactly what the app needs',
  scene: 'secure-statements',
  narration:
    "The editor shows the role's first permissions policy, written with a Terraform data source that builds the J S O N for us. It has one statement, highlighted, and every statement has the same parts. A statement I D, read books, so we can talk about it. The effect, allow. The action, S three get object, written as service colon operation. And the resource it applies to, as an A R N: the catalog bucket's A R N, slash books, slash star. The star matches any key under books, and nothing else. The side pane takes the statement apart: effect, action, resource, and a fourth, optional part, a condition, which this statement does not use. In the terminal, plan shows the policy being added to the role, inline, and apply adds it. Then the app tries three things. Reading bk one zero zero one now works, and the book's J S O N comes back. Reading orders dot c s v is refused with a four oh three: the action matches, but the resource is not under books. And writing a new book is refused: the resource matches, but the action is put object, not get object. The table lines the three up. A statement allows a request only when every one of its parts matches, and anything nothing allowed is denied. That is the whole idea of least privilege: start from nothing, and allow exactly what the shop needs. Next, the full picture of how A W S reaches a decision.",
}

const howIamDecides: Section = {
  id: 'how-iam-decides',
  title: 'How IAM decides: one request through the evaluation logic',
  scene: 'secure-decide',
  narration:
    "This is the chart A W S uses to decide every request inside one account, and it is worth knowing by heart. A request starts denied. First, A W S reads every policy that applies, looking for an explicit deny. If any statement anywhere says deny and matches, the answer is deny, and nothing can override it. Otherwise, if the account belongs to an organization, its guardrails must allow the request, or it is denied. Then, if a resource policy, like a bucket policy, allows it, the request is allowed. If not, an identity policy, like the role's own, must allow it, and if one is set, a permissions boundary and the session's policy must agree. If nothing allowed it, that is an implicit deny. On the right is a small lab, run against the emulator with I A M checks on. The role's policy has two statements: read books allows get object on books, and no drafts denies get object on books slash drafts. The lab then makes three requests as the role. Reading bk one zero zero one is allowed. Reading a draft is denied, even though read books matches it too, because no drafts is an explicit deny, and an explicit deny always wins. Writing bk one zero zero two is denied too, but for a different reason: no statement allows put object, so it falls all the way through to an implicit deny. The outcomes are the emulator's; the table reads, from the policy, where on the chart each request stopped. Next, we meet an implicit deny in the shop itself, and fix it.",
}

const aRequestDeniedAndFixed: Section = {
  id: 'a-request-denied-and-fixed',
  title: 'A request denied, and fixed: an action on the bucket, not its objects',
  scene: 'secure-denied',
  narration:
    "The shop's home page will list every book, so the app needs to list the catalog. In the terminal, the app lists books slash in the bucket, and is refused: access denied, when calling list objects. Why, when the role may read every book? The side pane shows what I A M compared. Listing is the action S three list bucket, and its resource is the bucket itself, not the objects inside it. Read books names objects, books slash star, so it does not match, nothing else allows the request, and that is an implicit deny. This is the most common mistake in S three policies: putting slash star on list bucket, which then matches nothing. The fix is already in the editor, highlighted: a second statement, list books, allowing list bucket, with the bucket's own A R N as its resource. The table at the bottom of the side pane is the rule to remember: get object and put object act on a bucket slash a key; list bucket acts on the bucket. Terraform plan shows the change as an update in place to the role's inline policy, with the new statement added to its J S O N. Apply makes it. The app lists books slash again, and this time the bucket answers: one book, bk one zero zero one dot json. A denial is not a failure of I A M; it is I A M working. Read which action was refused, find its resource, and allow exactly that. Next, a policy of a different kind, attached to the bucket, and a second account.",
}

const resourcePoliciesAndASecondAccount: Section = {
  id: 'resource-policies-and-a-second-account',
  title: 'Resource policies and a second account: both sides must allow',
  scene: 'secure-resource-policy',
  narration:
    "So far every policy has been attached to the one asking, the role. This section attaches one to the thing being asked for: the catalog bucket. That is a resource policy, and the editor shows it, in s three dot t f. The highlighted lines are what makes it different: a principal. A resource policy always says who it is talking to. This one lets the Auditor role, in the company's audit account, seven seven seven seven, eight eight eight eight, nine nine nine nine, get objects from the catalog and list it. In the terminal, plan and apply put the policy on the bucket, and get bucket policy reads it back, exactly as stored. The side pane shows the two accounts. On the right, the shop's development account, with the bucket and its new policy. On the left, the audit account, with the Auditor role and its own identity policy. That identity policy is not ours to write; the audit account's administrators own it. The rule the arrow carries is the one to remember: across accounts, both sides must allow. The bucket policy alone is not enough, and neither is the auditor's own policy. Within one account, as the table shows, either one allowing is enough. One honest note, in red: the emulator stores and returns this policy, but it does not evaluate resource policies or a second account, so that rule comes from A W S's documentation, not from a run. Next, the accounts themselves, and the guardrails above them.",
}

const anOrganizationAndItsGuardrails: Section = {
  id: 'an-organization-and-its-guardrails',
  title: 'An organization and its guardrails: limits no role can exceed',
  scene: 'secure-org',
  narration:
    "The book shop now has several accounts: development, production, and the auditors' account. A W S Organizations ties them into one tree, managed from one more account, the management account, one two three four five six seven eight nine zero one two, which pays the bills and runs the organization, and runs nothing else. On the left is the tree. Under the root are organizational units, folders for accounts. Security holds the audit account. Workloads holds two more: Prod, with the production account, and Dev, with the development account where the shop is built. The terminal on the right is a lab: a separate Terraform root, applied to the emulator from the management account, that creates exactly these units and a policy. Listing the root's units prints Security and Workloads. Listing the policies on Workloads prints two: Full A W S Access, which A W S attaches everywhere by default and which allows everything, and London Only. London Only is a service control policy. It denies every action outside E U west two, except for global services like I A M, and it is attached to Workloads, so it reaches Prod and Dev, but not Security. The table spells that out, including the management account, which service control policies never restrict. The diagram underneath is the misconception to avoid. A service control policy grants nothing. It is a ceiling: the most any role in those accounts may do. What a role can actually do is only what both its own policies and the ceiling allow. The emulator creates these units and stores the policy, but does not enforce it, and the frame says so. That completes the shop's identities and guardrails. Next course, it gets a network."
}

export const secure: Course = {
  id: 'secure',
  title: 'Lock it down',
  sections: [principalsAndAuthentication, aRoleForTheApp, assumingTheRole, policyStatements, howIamDecides, aRequestDeniedAndFixed,
    resourcePoliciesAndASecondAccount, anOrganizationAndItsGuardrails],
}
