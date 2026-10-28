import type { Course, Section } from '../types'

// Course 3 · Start the project (COURSE-PLAN.md). Narration is written for the speech engine:
// acronyms spelled ("A W S", "S three"), account ids digit by digit in groups, prices as words.

const theAccountAndItsRootUser: Section = {
  id: 'the-account-and-its-root-user',
  title: 'The account and its root user: who may sign in, and how',
  scene: 'start-account',
  narration:
    "Everything the book shop will ever run lives inside an A W S account, so before we build anything we need to know who can get into one, and how. On the left are the two kinds of people who sign in. Alex is the developer and signs in every day. The owner opened the account, once, with an email address and a password. That email and password are the root user, in red in the middle: the one identity that can do anything at all in the account, and that nothing inside the account can restrict. So the root user is locked away. It gets a strong password and multi factor authentication, it gets no access keys, and it is used only for the handful of jobs in the table on the right that nothing else is allowed to do: closing the account, changing its email or name, rescuing an administrator who has locked themselves out, and changing the support plan. Everyday work goes through the other door, I A M Identity Center. Alex signs in to one portal, and from it picks an account and a role. A role is a set of permissions that someone can step into for a while. In the development account, four four four four, five five five five, six six six six, the role is Book Shop Developer, and it may build and break things. In production, one one one one, two two two two, three three three three, the role is Book Shop Read Only: alex can look, and never touch. Two accounts, so that a mistake in development cannot reach the shop customers use. Next, we give the command line a way through that portal.",
}

const aProfileAndAFirstSession: Section = {
  id: 'a-profile-and-a-first-session',
  title: 'A profile and a first session: the command line meets the portal',
  scene: 'start-profile',
  narration:
    "The project starts as a single file, a w s dash config, open in the editor. It holds the shop's profiles. A profile is a name the command line, the S D Ks and Terraform all understand. The highlighted one, book shop dev, says: sign in through the session called book shop, then use account four four four four, five five five five, six six six six, with the role Book Shop Developer, in the London Region, E U west two. Below it, book shop prod points at the production account with the read only role, and the last block describes the session both profiles share: the address of the access portal and the Region it lives in. In the terminal, we point the command line at this file with the variable A W S config file, and list profiles prints both names back. Then we ask A W S who we are with get caller identity, using the dev profile, and the command line refuses. The side pane shows why. The command line read the profile, found the session, and looked for a token from the portal, and there is none, because alex has never signed in. A token comes from a browser: alex signs in at the portal, the command line caches a token for some hours, and trades it for short lived credentials for the role. Without it, nothing was sent to A W S at all: this was not a denial, it was a request that never left the laptop. Signing in needs a real browser and a real A W S account. This course has neither, so next we put an emulator beside A W S.",
}

const theEmulatorBesideAws: Section = {
  id: 'the-emulator-beside-aws',
  title: 'The emulator beside AWS: the real tools, a local endpoint',
  scene: 'start-emulator',
  narration:
    "The project gains a second file, env dot sh, open in the editor. Its first lines point every tool at the shop's profiles and at the London Region. The three highlighted lines are the emulator. A W S endpoint U R L sends every request to a server on this machine, port five thousand, instead of to A W S, and the two key lines are example credentials the emulator accepts. Nothing else changes: it is the real A W S command line, the real Python S D K, and later the real Terraform, just pointed somewhere else. The side pane shows the one choice that line makes. With the endpoint set, a request goes to localhost, to moto, the emulator. Without it, the same request goes to the S T S endpoint in E U west two, which is A W S itself. In the terminal we source the file and ask again who we are, and this time there is an answer: account four four four four, five five five five, six six six six, the development account, as a user the emulator calls moto. Then list buckets returns an empty list: a brand new account, with nothing in it yet. The table says what the emulator can and cannot show. It answers every A P I call, it keeps state, so what we create stays created, and when we switch it on, it evaluates I A M policies. It moves no packets, it cannot lose an Availability Zone, and it sends no bill: for those, the course uses small models and a rate card, and says so. Every terminal that talks to the emulator is labelled. Now, let's make the shop's first bucket.",
}

const whyNotAScript: Section = {
  id: 'why-not-a-script',
  title: 'Why not a script: run it twice and it fails on its own work',
  scene: 'start-script',
  narration:
    "The obvious way to make a bucket is a script, and the editor shows one: make bucket dot sh. Two highlighted commands, one A P I call each. Create bucket makes the catalog bucket, book shop catalog, followed by the account number, in London. Put bucket tagging labels it with app equals book shop. The line set dash e at the top stops the script at the first command that fails. In the terminal, the first run works: create bucket prints where the bucket is, and the script says it made it. Now run exactly the same script again, as anyone would, to be sure, or on a second laptop. Create bucket fails: bucket already owned by you. The side pane shows both runs. Run one made the bucket and tagged it. Run two failed on the bucket the first run made, and the tagging never ran at all. Nothing is broken, but the script cannot tell. It records what to do, one call after another, and has no idea what already exists. The table lists what that costs. Run it twice, and it fails on its own work. Let someone change the bucket in the console, and the script never knows. Want the bucket gone? That is another script. Review a change, and you are reading commands, not the result they will have. What we want instead is a file that says what should exist, and a tool that works out the calls. The last command removes the bucket, because in the next section Terraform makes it, and from then on Terraform owns it.",
}

const terraformInitPlanApply: Section = {
  id: 'terraform-init-plan-apply',
  title: 'Terraform: init, plan, apply — the loop every section runs',
  scene: 'start-terraform',
  narration:
    "The script is gone. In its place is a folder called infra, and in the editor its first file, s three dot t f. It does not say create anything. It declares that a resource of type A W S S three bucket, called catalog, should exist, with this bucket name and the app tag. Beside it, providers dot t f pins Terraform and its A W S provider, the plugin that knows every A W S A P I. The terminal runs the three commands every later section runs. Terraform init downloads that provider, signed by HashiCorp, and writes a lock file that records exactly which version was used, so a teammate gets the same one. Terraform plan is the heart of it, and the side pane draws it. Plan compares three things: what the code says should exist, what Terraform's state says it made, and what is really in the account right now. The difference is the plan, here plus one bucket, and dash out saves exactly that plan to a file. Terraform apply, given the saved plan, can do nothing the plan did not show. It makes the create bucket call and writes the result into the state. Run plan again, and it would find nothing to do: the code, the state and the account agree. That is the difference from the script. Running it twice is safe, because Terraform starts from what exists. Init downloads and locks, plan compares and saves, apply makes it so and records it. But where exactly is that state, and what happens when someone changes the bucket behind Terraform's back?",
}

const state: Section = {
  id: 'state',
  title: 'State: what Terraform made, and drift',
  scene: 'start-state',
  narration:
    "Between the last section and this one, something happened that the project did not do. Sam, a teammate, opened the bucket in the A W S console and added a tag of their own: owner equals sam. The code in the editor did not change. In the terminal, terraform state list shows what Terraform believes it manages: one resource, the catalog bucket. Its state holds the bucket exactly as Terraform made it, with one tag. Then we ask the bucket itself for its tags, and it has two: app, and owner sam. The side pane lines up the three places a tag can be. The code says app equals book shop. The state says the same, because that is what Terraform made. The bucket has one more, and nobody told Terraform. This is drift: the real resource has moved away from the code. Terraform plan finds it. Before it compares anything, plan refreshes, reading every resource it manages from the account, and the refreshed bucket no longer matches the code. So the plan is an update in place, removing the owner tag. The table sums it up. Sam made the drift in the console. A plan noticed it, not the state on its own. And there are two cures: change the code to include the tag, if it belongs, or let apply put the bucket back. We will leave the plan unapplied for now. First, a bigger problem: that state is a file on alex's laptop, and sam has no way to see it.",
}

const stateInS3Locked: Section = {
  id: 'state-in-s3-locked',
  title: 'State in S3, locked: one state for everyone',
  scene: 'start-remote-state',
  narration:
    "A state file on one laptop is a problem the moment a second person, or a pipeline, runs Terraform. Each would plan against their own copy, and the second apply would overwrite the first. So the state moves into S three. That needs a bucket, and here is the chicken and the egg: the bucket that holds the state cannot keep its own state. So a separate root, infra slash bootstrap, makes it once, with local state: the bucket book shop t f state, versioning, so every write of the state is kept and a bad one can be rolled back, and a block on all public access. In the terminal, the bootstrap apply adds those three resources. Then the editor shows backend dot t f. It tells the main project to keep its state in that bucket, under the key book shop slash terraform dot t f state, and use lock file is the line that matters. Terraform init with migrate state copies the existing state up, and the backend is configured. Listing the bucket shows the state object, in the cloud now. The side pane shows what the lock file buys. Alex and the pipeline both run apply. Alex's run starts first and writes a lock object beside the state; the pipeline sees it and waits, instead of writing over alex's work. When alex's run finishes, the lock is removed and the pipeline goes ahead. The table at the bottom keeps the two roots straight: bootstrap's state is a local file, and everything else lives in the bucket bootstrap made. One more thing before the shop grows: knowing what it costs.",
}

const destroyTagsAndABudget: Section = {
  id: 'destroy-tags-and-a-budget',
  title: 'Destroy, tags and a budget: what the shop costs, and how to stop it',
  scene: 'start-budget',
  focus: 'budget',
  narration:
    "This is the book shop's map, the first time we see it. It is the whole finished shop, drawn the way A W S draws architecture: the Region, the network in the middle with its three Availability Zones, the services beside it, the account's controls along the bottom, and shoppers on the left. Almost everything is still greyed out, because the shop does not have it yet, but every part is already in the place it will have. What exists is in colour: the catalog bucket, the Terraform state bucket, and, new in this section and ringed, a budget. In the terminal, the plan does three things. It creates the budget: twenty U S dollars a month for development. It adds default tags to everything: app, the environment dev, and managed by terraform, so any resource in the bill can be traced back to this project. And it removes sam's owner tag, the drift from two sections ago, because the code still does not have it. Apply makes all three changes. The diagram under the terminal is the misconception to avoid. A budget is an alarm, not a cap. When the forecast spend for the month passes eighty percent of twenty dollars, alex gets an email, and that is all. A W S keeps serving, and keeps billing. The real way to stop paying is to remove what you no longer need, and terraform plan dash destroy shows exactly what that would be: the budget and the catalog bucket, two to destroy. The state bucket is not in the list, because bootstrap owns it. Cleaning up is one command, from the first resource on. Next course, the shop gets its first role, and we find out what a denied request looks like.",
}

export const start: Course = {
  id: 'start',
  title: 'Start the project',
  sections: [theAccountAndItsRootUser, aProfileAndAFirstSession, theEmulatorBesideAws, whyNotAScript, terraformInitPlanApply, state, stateInS3Locked, destroyTagsAndABudget],
}
