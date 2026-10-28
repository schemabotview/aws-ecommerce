import type { Course, Section } from '../types'

// Course 8 · Decouple the checkout (COURSE-PLAN.md). Narration is written for the speech engine:
// acronyms spelled ("A W S", "S Q S", "S N S"), account ids digit by digit in groups, prices as words.

const synchronousAgainstAsynchronous: Section = {
  id: 'synchronous-against-asynchronous',
  title: 'Synchronous against asynchronous: what a checkout waits for',
  scene: 'decouple-sync-async',
  narration:
    "So far, everything the shop does happens while the shopper waits. This course changes that, and the frame shows why, with the same checkout drawn twice. Above, as one request. Checkout records the order, then calls the payment provider, then the warehouse, then the loyalty service, one after another, and the shopper waits for all of it. The wait is the sum of every step. Worse, if the warehouse is down, the checkout fails, although the order itself was fine. And on a busy evening, every one of those services has to take the peak at the same moment. Below, the same checkout as events. Checkout records the order, which is the one thing it must wait for, and then publishes one event: order placed. The shopper is answered. The event is copied into a queue for each listener: fulfilment packs the order when it can, loyalty adds the points later, and large orders go to a fraud check. If the warehouse is down, its orders wait in its queue, and are packed when it comes back. The table says what each one fails like, row by row. The last row is the price. Asynchronous is eventual: the order is packed a little later, and, as we will see, perhaps delivered twice, so the code must be ready for that. Over this course we build the lower half, one piece at a time: a queue, what to do with a message that keeps failing, a function that consumes it, a topic that fans it out, a bus that routes events, a workflow for the payment, and doing each job exactly once. First, the queue.",
}

const aQueueForFulfilment: Section = {
  id: 'a-queue-for-fulfilment',
  title: 'A queue for fulfilment: send, receive, delete',
  scene: 'decouple-queue',
  narration:
    "The first piece is a queue, in S Q S, called book shop fulfilment. The editor shows checkout dot p y. Place records the order in the orders database, in one transaction, as in Course 7. Then, highlighted, it finds the queue and sends one message, order placed, with the order's number, the customer, the books and the total. And that is all: packing and posting are no longer the checkout's business. The role may only send to this queue, never read from it or delete. In the terminal, Terraform makes the queue, and customer c eighteen checks out: order three, nineteen pounds forty nine, and the message is sent. Now a worker, which we play by hand with consume dot p y. A worker receives a message, does the work, and then deletes it, and the delete is how it says it is done. Here the worker crashes before the delete. The side pane follows that message by the clock. At zero seconds, it was received, with a receive count of one. Receiving does not remove it; it hides it, for the queue's visibility timeout of thirty seconds, so no other worker takes the same order while this one works. A receive in that window finds nothing. When the thirty seconds are up, the message is visible again: the next receive gets it with a receive count of two, packs it, and deletes it. One note on the clock: this machine's clock is frozen, so that every run prints the same times. Sleep moves it on, and the timeout then ends in the emulator because its time has passed. The table keeps the queue's promises: at least once, hidden while worked on, done only when deleted. Next, a message that never succeeds.",
}

const whenAMessageKeepsFailing: Section = {
  id: 'when-a-message-keeps-failing',
  title: 'When a message keeps failing: a dead-letter queue',
  scene: 'decouple-dead-letters',
  narration:
    "A message that fails comes back, and is tried again. That is right for a crash, but some messages can never succeed, and without a limit they would come back forever, taking a worker's time on every try. So the editor adds two things to queues dot t f. A second queue, the dead-letter queue, which keeps a message for fourteen days, the longest S Q S allows. And, highlighted, a redrive policy on the fulfilment queue: after a message has been received three times without being deleted, it moves to the dead-letter queue. In the terminal, after the apply, we send a broken order by hand: order nine nine nine, with no books in it. The worker receives it, cannot pack it, and leaves it. Thirty one seconds later it is back, receive count two, and fails again; then receive count three, and fails again. On the fourth receive, the worker finds nothing at all: the queue moved the message to the dead-letter queue instead of handing it out, and reading the dead-letter queue shows order nine nine nine, exactly as it was sent. The side pane follows its three tries and the move. The table is the policy, and what happens next. A person reads the dead-letter queue, because a message there means something the code did not expect. Once the cause is fixed, S Q S can move the messages back to the queue they came from, to be worked again. And the count of messages in a dead-letter queue is one of the first alarms worth having, in Course 11. Next, a worker that A W S runs for us.",
}

const aConsumerAsAFunction: Section = {
  id: 'a-consumer-as-a-function',
  title: 'A consumer as a function: Lambda polls the queue',
  scene: 'decouple-function',
  narration:
    "Running our own worker means running a loop, somewhere, all the time. Lambda can do it instead. The editor shows the function, handler dot p y in functions slash fulfil. Lambda calls it with a batch of messages. For each one, it packs the order; a message it cannot pack is added to batch item failures, highlighted, and the function returns that list. Lambda then deletes every message in the batch except the ones reported, which go back to the queue to be retried, and in the end, to the dead-letter queue. In function dot t f, Terraform builds the function, Python three point one three on arm sixty four, with its own role, allowed to read and delete from this queue and write its logs, and an event source mapping. The mapping is Lambda's own poller: it reads the queue for us and calls the function with up to ten messages, or whatever arrived in five seconds. In the terminal, the mapping is listed, enabled, batch size ten. Two orders are placed, orders four and five, and a third, broken message is sent by hand. The side pane shows what the poller does with them. Now, the honest part, in red. The emulator records the function and the mapping, but it runs neither. So poll dot p y plays the poller: it receives the batch from the queue, builds the event exactly as Lambda builds it, calls the real handler, and deletes what it was not told to keep. The function packs orders four and five; two messages are deleted, and one is left in the queue to retry. The table compares the two consumers. Next, more than one listener for every order.",
}

const fanOut: Section = {
  id: 'fan-out',
  title: 'Fan-out: one event, every listener',
  scene: 'decouple-fanout',
  focus: 'topic',
  narration:
    "Back on the shop's map. The checkout column now has its queue and its function, and this section adds the topic, ringed. Fulfilment is not the only part of the shop that cares about an order. Loyalty adds points for every one, and the fraud team wants to look at large ones. Checkout could send three messages, but then every new listener would mean changing checkout. Instead, checkout publishes once, to an S N S topic called book shop orders, and every queue subscribed to the topic gets its own copy. In the terminal, Terraform creates the topic, two new queues, a policy on each queue that lets the topic, and only the topic, write to it, and three subscriptions. One of them has a filter policy: the fraud check receives an order only when its total is five hundred or more. Checkout now publishes instead of sending, and the role's permission changes to match. Then two customers check out. Order six, twenty one pounds ninety eight. And order seven, fifty copies of one book, five hundred and forty nine pounds fifty. Listing what each queue holds, without taking anything, shows the fan out. Fulfilment has both orders. Loyalty has both orders. And the fraud check has only order seven, because order six did not pass its filter. The side pane draws it: one publish, three copies, one filtered. Each listener now works through its own queue, at its own pace, and a slow fraud check never holds up a parcel. Next, events that come from more than one place.",
}

const routingEvents: Section = {
  id: 'routing-events',
  title: 'Routing events: a bus and its rules',
  scene: 'decouple-events',
  narration:
    "A topic is good when one producer has several listeners. But a shop has many producers. Checkout says an order was placed; the returns desk says a refund was asked for. And listeners care about particular events: the V A T ledger wants orders from the United Kingdom, and nothing else. That is an event bus, in EventBridge. The editor shows events dot t f. A bus called book shop, and two rules, each a pattern. The highlighted rule, U K V A T, matches events from checkout, of type order placed, whose detail says country G B: a pattern can look at any field inside the event. The second rule, refunds, matches refund requested events from the returns desk. Each rule has a target, a queue, and a policy that lets that rule, and only it, write there. In the terminal, three sample events are put on the bus: an order from Great Britain, an order from France, and a refund. The bus accepts all three, with no failures. Looking in the targets: the V A T queue holds the British order, and the refunds queue holds the refund. The French order matched no rule, so it went nowhere, which is exactly what the V A T ledger wants. Then we ask the U K V A T rule directly, with test event pattern, whether it matches the French order, and it answers false. The side pane draws the three events, the bus, the rules and their targets. The table sets the topic and the bus side by side. Next, a job with several steps that must happen in order.",
}

const thePaymentWorkflow: Section = {
  id: 'the-payment-workflow',
  title: 'The payment workflow: steps, retries and an undo',
  scene: 'decouple-workflow',
  narration:
    "Taking a payment is several steps in order. Reserve the copies. Charge the card. If that worked, ship. If it did not, give the copies back. Coding that order, with its retries and its undo, inside one function would hide it; Step Functions makes it a state machine instead, a definition we can read. The editor shows the payment step in checkout dot a s l dot j s o n. It is a task, a Lambda function. Highlighted, its retry: when the provider times out, try again after two seconds, then after four, at most twice. And its catch: any other failure, or a timeout after the retries, goes to release stock, and then to order failed. Each step is its own small function, in steps dot p y, and Terraform makes the four functions and the state machine, which the emulator reports as active. Now the honest part. The emulator records the state machine but runs none of its steps, so a small tool walks the definition: each task calls the step's real code, and the stock changes are real, in the emulator's table. Only the payment provider's answers are stand-ins, written in the tool. For order ten, the provider times out twice. The terminal shows the retries, at two seconds and at four, the charge succeeding at six seconds, the order shipped, and the execution succeeded. For order eleven, the card is declined. Retrying cannot help, so the catch sends it to release stock, which gives the two copies back, and the execution fails, on purpose, with order failed. The side pane draws the machine, and the table is order eleven's path. Next, the problem every asynchronous system meets: doing a job exactly once.",
}

const doingItExactlyOnce: Section = {
  id: 'doing-it-exactly-once',
  title: 'Doing it exactly once: an idempotency key',
  scene: 'decouple-once',
  narration:
    "A standard S Q S queue delivers every message at least once, and once in a while, twice. A producer that times out and sends again does the same. For fulfilment, twice means two parcels. The fix is to make the work idempotent: doing it twice has the same effect as doing it once. The editor shows how, in the fulfil function. Before it packs an order, it claims it, highlighted: it writes a key, fulfil hash the order's number, into a DynamoDB table, on the condition that the key does not exist yet. The first delivery writes the key and packs. A second delivery finds the key taken, the write is refused, and the function skips the order, and reports success, so the duplicate is deleted rather than retried. Terraform adds the table, with a seven day time to live on its keys, longer than any message can be redelivered, and allows the function's role to write to it. In the terminal, the function is rebuilt and applied. Then we send order twelve twice, exactly the same message, as a duplicate delivery would. The poller picks up the batch, with the two orders still waiting from the fan out, and the two copies of order twelve. Orders six, seven and twelve are packed, and the second copy of order twelve is skipped as a duplicate. Scanning the table shows one key per order packed. The side pane draws the two deliveries meeting at the key. The condition is checked and written in one step, so even two copies arriving at the same moment cannot both win. Next, choosing between all of these.",
}

const choosingTheMechanism: Section = {
  id: 'choosing-the-mechanism',
  title: 'Choosing the mechanism: queue, topic, bus or workflow',
  scene: 'decouple-choose',
  narration:
    "This course built four ways for the parts of the shop to talk without waiting, and the frame places each one on the finished checkout. Checkout records the order directly, because it needs that answer now: a direct call is still right when the caller needs the result. The payment is a workflow, in Step Functions, because its steps must happen in order, with retries, and with an undo when the card is declined; in this course we started it by hand. The order placed event goes to a topic, in S N S, because several listeners must all hear it, and adding one is a subscription, not a change to checkout. Each listener reads its own queue, in S Q S: fulfilment, through its function, which claims every order once; loyalty; and the fraud check, which sees only large orders. Below, the bus, in EventBridge: events from checkout and the returns desk, routed by what they say, to the V A T and refunds queues. The table is the rule of thumb. A queue, when one consumer works through jobs at its own pace and must retry. A topic, when one event has several listeners. A bus, when there are many sources and the routing depends on the content. A workflow, when steps must run in order with retries and an undo. And a plain call, when the answer is needed now. That completes Course 8: the checkout no longer waits for anything but its own order. Next course, the shop ships through a pipeline, into two accounts.",
}

export const decouple: Course = {
  id: 'decouple',
  title: 'Decouple the checkout',
  sections: [synchronousAgainstAsynchronous, aQueueForFulfilment, whenAMessageKeepsFailing, aConsumerAsAFunction, fanOut,
    routingEvents, thePaymentWorkflow, doingItExactlyOnce, choosingTheMechanism],
}
