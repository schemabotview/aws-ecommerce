import type { Course, Section } from '../types'

// Course 12 · Measure, tune and evolve (COURSE-PLAN.md). Narration is written for the speech engine:
// acronyms spelled ("A W S", "C D N", "N A T", "A D R"), account ids digit by digit, prices as words.

const aCdnInFront: Section = {
  id: 'a-cdn-in-front',
  title: 'A CDN in front: book pages from near the shopper',
  scene: 'evolve-cdn',
  narration:
    "The shop lives in London, and so far every request has travelled there. For a shopper in Sydney, that is about two hundred and eighty milliseconds for the round trip alone, before the app does anything. A C D N, a content delivery network, keeps copies of pages at edge locations near the shoppers. On the map, CloudFront joins the edge, in front of everything. In the terminal, Terraform adds three things: a distribution whose origin is the load balancer, reached only over H T T P S, and two cache policies. Book pages, the default, are cached for up to five minutes, so a price change shows within five minutes. Anything under slash checkout is never cached and accepts every method, because an order must always reach London. The distribution reads back as deployed, with its own cloudfront dot net name, and the one special path is listed: slash checkout. The plot is a model, labelled as one, of a book page seen from Sydney. Without a C D N, three hundred and ten milliseconds. With one, it depends on how often the edge already has the page. With no hits it is slightly slower than going direct, because of the extra hop; at ninety percent hits, under fifty milliseconds. So the setting that matters is how long a page may be cached, and that is a business decision: how stale may a price be? Five minutes, here. The emulator stores the distribution and serves nothing, and the terminal is labelled so. Next, measuring before changing anything else.",
}

const measuringBeforeTuning: Section = {
  id: 'measuring-before-tuning',
  title: 'Measuring before tuning: the knee',
  scene: 'evolve-measure',
  narration:
    "Course 6 told the shop to add tasks when they are sixty percent busy. Why not ninety, and save money? The answer is a curve, and this frame draws it from a simulation, labelled as one, of a single task. Each request takes ten milliseconds of work on average, which is Course 6's hundred requests a second, and requests arrive at random, as shoppers do. The terminal shows the simulation's output, from ten percent busy to ninety five. The plot shows two lines. The median, the typical request, rises gently. The ninety ninth percentile, the slowest request in a hundred, is the one that matters, because at the shop's traffic that is thousands of shoppers an hour. It is about a hundred milliseconds at sixty percent busy. At eighty percent, it has doubled, to over two hundred. At ninety five, it is near seven hundred: the shopper notices. Latency does not grow in proportion to load. It bends, sharply, somewhere past seventy percent, because requests start to queue behind each other, and the queue grows faster than the load. That bend is the knee, and the dashed line at sixty percent is where the shop scales out, before it. The table turns it into a habit: before tuning anything, measure the ninety ninth percentile at peak; change one thing; measure again. A change that makes the average better and the tail worse has made the shop slower for the shoppers who notice. Next, what all of this costs.",
}

const theMonthsBill: Section = {
  id: 'the-months-bill',
  title: "The month's bill: where the money goes",
  scene: 'evolve-bill',
  narration:
    "What does the finished shop cost to run? The lab on screen answers with the shop's own quantities, for a month in production: four tasks on average, a Multi A Z database, one N A T gateway, two shards, and the rest. The rates, though, are hypothetical: round numbers of about the right size, chosen for the course and labelled so. A W S's real prices change and differ by Region, so check the pricing pages before deciding anything. The total comes to about two hundred and thirty four dollars a month. The bar chart shows the six largest lines. Compute, the Fargate tasks, comes first, as it usually does. The surprise is second: the N A T gateway, almost a fifth of the bill, because it charges by the hour and again for every gigabyte it carries. Then the database and the load balancer, which run all day whether anyone shops or not. The table below names the levers. Committing to a year of compute and database use, through a Savings Plan or reserved instances, saves about twenty two dollars a month here. Sending S three and image traffic through V P C endpoints instead of the N A T gateway cuts that line. Right sizing comes after measuring, as the last section said, never before. And development does not need to run at night or at weekends, which is two thirds of its hours. Next, telling development's costs from production's.",
}

const allocatingCost: Section = {
  id: 'allocating-cost',
  title: 'Allocating cost: the bill, split by tag',
  scene: 'evolve-costs',
  narration:
    "Since Course 3, every resource has carried the same default tags, including app and env. Tags are not part of the bill until they are activated as cost allocation tags, and the editor does that for both, highlighted. In the terminal, they read back as active. From then on, the bill can be split by them, and a small tool reads a month of it. October's figures are made up for the course, in the shape a Cost Explorer export has: a cost per day, per service, per environment. Production, two hundred and thirteen dollars, two thirds of the total. Development, ninety nine. And two findings the tags made visible. First, development passed its twenty dollar budget, the one from Course 3, on the seventh of October. That is what a budget is for: not a cap, an alarm, and it emailed alex. Second, a rule that flags any day costing more than twice its usual: on the twenty first and twenty second, development's N A T gateway cost four and a half, then nearly four times its normal day. Something in development pulled a lot of data through the N A T gateway, perhaps images or packages downloaded over and over. Without tags, it would have been a small bump in one total; with them, it has a service, an environment and a date, which is enough to ask the right person. The emulator keeps no bill, and the note says so. Next, writing down a decision so nobody has to guess it later.",
}

const aDecisionRecord: Section = {
  id: 'a-decision-record',
  title: 'A decision record: why the orders stay where they are',
  scene: 'evolve-adr',
  narration:
    "Someone will ask, sooner or later, why the orders are in RDS PostgreSQL rather than Aurora or DynamoDB. An architecture decision record answers once, in a short file kept beside the code: docs slash A D R, zero zero one. The editor shows its heart: two tables. Musts first. An option that fails one is out, however good it is otherwise. All three can commit an order and its lines together, keep stock from going below zero, and restore to any second of the last thirty five days. But DynamoDB alone fails the last must, highlighted: the reports' S Q L would not run unchanged. Then wants, each with a weight from one to three, and each option scored from one to five. Monthly cost at today's load weighs most, highlighted. The terminal shows a small tool that reads the two tables from the record itself and does the arithmetic: RDS PostgreSQL, thirty five of forty; Aurora Serverless, thirty; DynamoDB, out. The scores are the team's judgement, not facts, and that is the point of writing them down: the next person can disagree with a number instead of a vague memory. The decision, highlighted, is to stay on RDS PostgreSQL, with a condition for revisiting it: ten times today's orders. The side pane is the method, which works for any choice: musts filter, weighted wants rank, and the record is kept. Next, the whole shop, judged.",
}

const aWellArchitectedReview: Section = {
  id: 'a-well-architected-review',
  title: 'A Well-Architected review: the finished shop, judged',
  scene: 'evolve-review',
  narration:
    "Here is the finished shop, on the map that has followed it since Course 3: every part the course built in colour, and what it chose not to build, greyed in place. A W S's Well Architected Framework reviews a system against six pillars, and the table judges this one. Operational excellence: everything is declared in Terraform and shipped through a pipeline, with alarms on what matters; next, a short runbook for each alarm. Security: roles with only what they need, keys the shop controls, a firewall and an audit trail; next, threat detection with GuardDuty and Security Hub. Reliability: three availability zones, a queue that absorbs failures, and backups copied to another account; next, a N A T gateway in every zone, and a restore drill on the calendar. Performance: scaling before the knee, a C D N, and a lake that keeps reports off the database; next, measuring the ninety ninth percentile at peak, regularly. Cost: tags, a budget and a bill that is understood; next, a commitment, and development switched off at night. Sustainability: the functions already run on Graviton; the tasks could too. Below the table, an order for the next steps: a restore drill first, because until one is done the backups are a hope; then a N A T gateway in every zone; then a commitment, once a month of real bills says how much. The note matters most: what is greyed on the map is not a list of failures. A cache, more N A T gateways, a second Region: each is a decision for the shop to make with its own numbers. That completes Course 12, and the shop: built, secured, observed, and understood.",
}

export const evolve: Course = {
  id: 'evolve',
  title: 'Measure, tune and evolve',
  sections: [aCdnInFront, measuringBeforeTuning, theMonthsBill, allocatingCost, aDecisionRecord, aWellArchitectedReview],
}
