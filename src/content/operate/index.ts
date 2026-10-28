import type { Course, Section } from '../types'

// Course 11 · Operate it (COURSE-PLAN.md). Narration is written for the speech engine: acronyms
// spelled ("A W S", "K M S", "W A F", "S L O"), account ids digit by digit in groups, prices as words.

const oneSlowEvening: Section = {
  id: 'one-slow-evening',
  title: 'One slow evening: a metric, a log line and a trace',
  scene: 'operate-evening',
  narration:
    "Last night, between twenty past six and twenty five to seven, some shoppers could not pay. Nobody noticed until the morning. This course is about noticing, and about what to do next, and it starts with the three kinds of evidence a running system leaves. On the left, a metric: the share of requests that failed, five minutes at a time. It says something was wrong, and when, and how much: around one request in eight, for fifteen minutes. It does not say which requests. Top right, a log line, exactly as the app writes one: a post to checkout, answered with five oh three. Logs say which requests failed, one by one, but there are thousands of them. Below it, a trace of one checkout, and this one is an example, because the shop does not collect traces yet. It breaks one request into the steps it took: the load balancer, two milliseconds; the database, four; and the payments A P I, three seconds, until it timed out. That is where the time went. The table joins them. The metric answers whether something is wrong and since when; the log answers which requests; the trace answers where. Together, they point at the payments A P I. The rest of this course builds the shop's version of each: metrics made from its logs, an alarm that wakes someone for the right reasons, a record of who changed what, keys, a firewall, backups, and one incident handled from start to finish.",
}

const logsAndMetrics: Section = {
  id: 'logs-and-metrics',
  title: 'Logs and metrics: numbers from the lines the app already writes',
  scene: 'operate-logs',
  narration:
    "The app already writes one line of J S O N for every request, and E C S already sends every line to the log group book shop slash app, kept for thirty days. Turning those lines into numbers needs no change to the app: a metric filter. The editor declares two. Requests counts every line with a status. Errors five x x counts the lines whose status is five hundred or more, highlighted: failures that are the shop's fault, not the shopper's. Each filter watches the app's log group, and publishes a metric in the book shop namespace, also highlighted, a count each minute. In the terminal, a tool writes last night into the real log group: an hour of requests, made up for the course and seeded, two hundred a minute, with the payments A P I down for fifteen minutes. Then an honest step. The emulator stores metric filters but never runs them, so a second tool reads the events back, applies the same two rules, and publishes the counts, as CloudWatch would. Twelve thousand requests, three hundred and ninety six errors, the worst minute at eighteen twenty two, with thirty three failures in two hundred. Last, the metric is read back from CloudWatch, ten minutes at a time. The side pane follows one line, from the app to the log group, through a filter, to a number, and the plot shows those ten minute sums: nothing, then two hundred and sixty four, then a hundred and thirty two, then nothing. A metric is something an alarm can watch. Next, deciding when it should.",
}

const objectivesAndAlarms: Section = {
  id: 'objectives-and-alarms',
  title: 'Objectives and alarms: how fast is the budget burning?',
  scene: 'operate-alarms',
  narration:
    "An alarm on the raw error count would wake someone for every bad minute, and teach them to ignore it. A better question starts from an objective. The shop's is that ninety nine and a half percent of requests succeed, measured over thirty days. What is left, half a percent, is the error budget: the failures the shop can afford. The useful question is how fast that budget is burning. A burn rate of one spends it in exactly thirty days. The editor sets two alarms on the same ratio, errors divided by requests, highlighted. The fast one fires when five minutes burn at fourteen point four times the rate, which is an error rate above seven point two percent: at that pace, two percent of the month's budget goes in an hour, and someone should look now. The slow one watches the whole hour, at six times: a quieter problem that would empty the budget in five days. Both notify the topic book shop alerts, highlighted, which emails alex. In the terminal, the two alarms are read back with their thresholds. The emulator stores alarms but does not evaluate them, so a tool applies the same thresholds to last night's metrics. From eighteen twenty to eighteen thirty five, the burn rate was between twenty four and twenty nine: the fast alarm would have fired three times. Over the hour, three point three percent of requests failed, six point six times the budget's pace: the slow alarm too. The plot shows each five minutes against the fast threshold. Next, finding out who changed what.",
}

const whoChangedWhat: Section = {
  id: 'who-changed-what',
  title: 'Who changed what: a trail of every A P I call',
  scene: 'operate-trail',
  narration:
    "In Course 9, sam changed a queue in the console, and the plan found the drift. It did not say who did it, or when. CloudTrail does: it records every call made to A W S in the account, by a person, a pipeline or a service, and delivers the records to a bucket. The editor shows the trail. It covers every Region, highlighted, because an attacker would choose the one nobody watches, and it includes global services such as I A M. Log file validation, also highlighted, adds a signed digest every hour, so a record that was edited or deleted afterwards can be proved to have been. Above it, a bucket of its own, whose policy lets CloudTrail, and only CloudTrail, write into it. In the terminal, the trail is read back: multi Region, validation on, and logging. The side pane follows one call, from sam's console to the trail to the bucket, and the table below is one record. Here is the honest part: the emulator records no events, so this record is the shape A W S documents, filled in with sam's change from Course 9. The event time; the service, S Q S; the action, set queue attributes; who, a developer session named sam; from which address; and what was asked: a visibility timeout of sixty seconds on the fulfilment queue. Every one of those fields is searchable, so who changed this is a question with an answer. Next, protecting the data itself.",
}

const keysAndEncryption: Section = {
  id: 'keys-and-encryption',
  title: 'Keys and encryption: envelope encryption with K M S',
  scene: 'operate-keys',
  narration:
    "The lake holds every order the shop has taken. If its files were copied, encryption at rest is what keeps them unreadable, and the question is who holds the key. Here, the shop does: a key in K M S, the Key Management Service, created by the editor. Its key policy, above this view, lets the account administer it and lets the app's role use it, and nobody else. Rotation is on, highlighted: new key material every year, with old data still readable. Below, the lake bucket's default encryption names that key, highlighted, so every new object is encrypted with it. How that works is called envelope encryption, and the side pane draws it. The key itself never leaves K M S. To write, a service asks K M S for a data key, and gets it twice: in plain, and encrypted under the key. It encrypts the data with the plain copy, drops it, and stores the encrypted copy beside the data. To read, it sends that encrypted data key back to K M S, which first checks the key policy, and only then returns the plain key. In the terminal, a small tool does exactly that by hand. A two hundred and fifty six bit data key. An order encrypted into sixty seven bytes, stored with ninety six bytes of encrypted data key; the plain key, dropped. Then K M S decrypts the data key, and the order reads back. Revoke the role's access in the key policy, and every object it protects becomes unreadable to it at once. Next, the front door.",
}

const protectingTheEdge: Section = {
  id: 'protecting-the-edge',
  title: 'Protecting the edge: a web application firewall',
  scene: 'operate-waf',
  narration:
    "Every request to the shop arrives at the load balancer from the internet, and some are not shoppers. A W S W A F, a web application firewall, reads each request before the shop does, and the editor gives it two rules. The first, highlighted, is a rule group A W S maintains: the common rule set, which recognises well known attacks, such as S Q L injection in a query string, requests with no user agent, and oversized bodies. A W S updates it as new attacks appear; the shop only chooses to use it. The second is the shop's own: no single address may send more than a thousand requests in five minutes, highlighted. Beyond that, its requests are blocked until it slows down. An association, below the view, attaches the rules to the load balancer. In the terminal, the rules are read back from the load balancer itself, in order: the common rules first, then the rate rule. The emulator stores the rules and their association; it inspects no requests. The side pane is the point of this section: W A F is one layer of four, and each stops something different. W A F stops attack patterns and floods. The load balancer accepts only H T T P S, with modern T L S. The app's security group accepts only the load balancer. And the app checks every input itself, because only it knows what a valid order looks like. No layer is enough alone. Next, being able to get the data back.",
}

const backupsThatRestore: Section = {
  id: 'backups-that-restore',
  title: 'Backups that restore: a plan, a vault, a copy elsewhere',
  scene: 'operate-backup',
  narration:
    "Multi A Z protects the orders database from a failed machine. It does not protect it from a bad migration, a deleted table, or an attacker with the right credentials, because those changes are copied to the standby at once. That needs backups, and A W S Backup takes them on a plan, as the editor declares. Every night at three, the quietest hour, highlighted, it backs up what the selection names: the orders database, and the carts and stock tables. Each backup goes into a vault encrypted with the shop's own key, and is kept for thirty five days, highlighted. Then a copy action, also highlighted, sends a copy to a vault in the audit account, seven seven seven seven, eight eight eight eight, nine nine nine nine, kept for ninety days. Someone who takes over the development account can delete its backups; they cannot reach the audit account's. In the terminal, the plan's rule is read back, nightly at three, and so is the selection: the database and both tables. The emulator stores the plan and takes no backups, and the frame says so. Now the most important line on screen, at the bottom of the side pane: a backup is only proved by a restore. Every quarter, the drill restores last night's recovery point as a new instance, runs the app's checks against it, and writes down how long it took. That time, measured, is the shop's real recovery time. Next, an incident, from start to finish.",
}

const anIncident: Section = {
  id: 'an-incident',
  title: 'An incident: revoking a leaked session',
  scene: 'operate-incident',
  narration:
    "Fourteen minutes past nine, on a Monday evening. Credentials for a session of the app's role turn up in a public chat. The terminal plays both sides. First, the leaked session is created and used: it lists the catalog. Deleting the role would stop it, and stop the shop too, because every running task uses the same role. Rotating nothing helps either: a role session is valid until it expires, up to an hour. A W S's answer is the policy in the editor. A deny, highlighted, on everything, for any session of this role whose token was issued before twenty one fifteen, also highlighted. Sessions issued after it are not affected, and each running task simply fetches a fresh one. Two minutes later, Terraform applies it. Then the leaked credentials try again, and are refused: access denied. And a fresh session, the kind a task would get, lists the catalog as before. This is real I A M evaluation in the emulator, the token's issue time against the policy's date. The side pane names the four phases every incident goes through. Detect: someone noticed. Contain: stop the damage without stopping the shop, which is what this policy did. Eradicate: find how the credentials leaked, and the trail from section four is where to look. Recover: confirm the shop works, then write down what happened and what will change, without blame. The table is the evening as the terminal showed it. Next, the biggest failure of all.",
}

const disasterRecovery: Section = {
  id: 'disaster-recovery',
  title: 'Disaster recovery: what if the Region is gone?',
  scene: 'operate-recovery',
  narration:
    "Everything so far survives a failed machine, or even a failed availability zone. The last question is the rarest and the largest: what if a whole Region is unavailable for a day? A W S's disaster recovery guidance names four strategies, and the frame orders them from left to right, by how fast they recover, which is also what each keeps running in a second Region. Backup and restore keeps only backups there, and rebuilds everything when needed: recovery in hours. Pilot light copies the data continuously, but keeps the servers off until they are needed: tens of minutes. Warm standby runs a small but complete copy of the shop all the time, ready to grow: minutes. And active active runs two full shops, both serving shoppers, so losing one loses almost nothing. The table puts numbers on the trade: how long recovery takes, how much data can be lost, and what keeps running, and costing, in the second Region. Those times are the guidance's orders of magnitude, not measurements. The last row is honest about the shop today. It is at backup and restore, with copies in another account, but not yet in another Region. For a small shop, hours of downtime once in many years may be an acceptable price. The point is that it is a decision, made in advance, with its cost and its recovery time written down. That completes Course 11: the shop is observed, audited, encrypted, backed up and recoverable. Next course: measuring, tuning, and deciding what comes next.",
}

export const operate: Course = {
  id: 'operate',
  title: 'Operate it',
  sections: [oneSlowEvening, logsAndMetrics, objectivesAndAlarms, whoChangedWhat, keysAndEncryption, protectingTheEdge,
    backupsThatRestore, anIncident, disasterRecovery],
}
