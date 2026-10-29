import type { Course, Section } from '../types'

// Course 1 · AWS, and what we'll build (COURSE-PLAN.md). Narration is written for the speech engine:
// acronyms spelled ("A W S", "S Q S"), account ids digit by digit, prices as words.

const theFinishedShop: Section = {
  id: 'the-finished-shop-takes-an-order',
  title: 'The finished shop takes an order',
  scene: 'intro-order',
  narration:
    "This is where the course ends: book shop, an online shop for books, running on A W S, and taking an order. The map on the left is the whole thing, drawn the way A W S draws its own diagrams: a Region in London, a network spread across three availability zones, the app running in containers, a database, queues, a lake for reports, and the controls an account needs. Every part of it is declared in code, and every part is built, one section at a time, in the courses that follow. The terminal on the right is the finished shop at work. The app answers a request for a book's page: Night Trains of Europe, by Ana Lima, ten ninety nine, forty in stock. Then a shopper checks out. The order is recorded in the database, in one transaction, and a single event is published: order placed. The last command asks who heard it. The fulfilment queue did, so the book will be packed. The points queue did, so the shopper earns loyalty points. The fraud check did not: it only listens for orders of five hundred pounds or more, and this one was ten ninety nine. The side pane draws that path. One honest note, which applies to the whole course: A W S here is an emulator running on this machine, while the app and the database are real. Every frame that shows emulated output says so. The commands, the code and the Terraform are exactly what you would run against a real account. Next, why anyone would rent all of this instead of owning it.",
}

const owningAgainstRenting: Section = {
  id: 'owning-against-renting',
  title: 'Owning against renting',
  scene: 'intro-renting',
  narration:
    "Before A W S, a shop like this bought its servers. The question was always how many, and the answer was always: enough for the busiest hour. The plot is a model of one day of the shop's traffic, labelled as one. Sixty requests a second overnight, two hundred and forty through the day, and a peak of five hundred and sixty at six in the evening. Bought for that peak, the shop owns six servers, each handling a hundred requests a second, and all six run all day, busy or not. That is the flat line. Renting, the other line follows the day: one server overnight, more through the day, ten at the peak, because rented servers are kept about sixty percent busy, the rule Course 6 will explain. The terminal is the model's own output, hour by hour. The table sums it up. Owned: a hundred and forty four server hours a day, paid for whether used or not, for years. Rented: eighty four, paid for by the hour. And when a day is busier than planned, owned capacity turns shoppers away, while rented capacity adds servers in minutes. The trade is real, and the last row says it: renting gives up control of the hardware itself. You choose the size and the place, never the machine. For a shop whose busiest hour is ten times its quietest, renting wins by a long way. Next, what we will build, course by course.",
}

const whatWellBuild: Section = {
  id: 'what-well-build',
  title: "What we'll build, course by course",
  scene: 'intro-courses',
  narration:
    "Here is the map again, and beside it the plan. Twelve courses, and after each one the shop can do something it could not do before. The next course stays with A W S itself: what a Region is, what happens when you make a request, what an A R N names, who is responsible for what, and what costs money. Course 3 starts the project: an account, a profile, and Terraform, with its state kept safely in a bucket. Course 4 secures it: a role for the app, and policies proven to deny what they should. Course 5 builds the network: a V P C across three zones, a load balancer, a name and a certificate. Course 6 runs the app in containers on Fargate, tested and scaled. Course 7 gives it data: carts, orders and photos, and the last book in stock sold only once. Course 8 decouples the checkout with queues, events and a payment workflow. Course 9 ships every change through a pipeline, to development and then to production. Course 10 answers what the shop sold yesterday, from a lake. Course 11 operates it: metrics, alarms, an audit trail, keys, a firewall, backups and an incident. And Course 12 measures it, prices it, and reviews it. The note is the rule that holds all of it together: from Course 3 on, every part is declared in Terraform, and every section builds on the one before. One shop, from an empty account to this map. Next course: how A W S runs a request.",
}

export const intro: Course = {
  id: 'intro',
  title: "AWS, and what we'll build",
  sections: [theFinishedShop, owningAgainstRenting, whatWellBuild],
}
