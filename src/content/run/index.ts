import type { Course, Section } from '../types'

// Course 6 · Run the app (COURSE-PLAN.md). Narration is written for the speech engine: acronyms
// spelled ("A W S", "E C S", "E C R"), account ids digit by digit in groups, prices as words.

const theAppLocally: Section = {
  id: 'the-app-locally',
  title: 'The app, locally: an API over the catalog',
  scene: 'run-app',
  narration:
    "The shop has a network, a role and a catalog, but nothing serves a page yet. This section adds the app itself, a small Python package called book shop. The editor shows web dot p y. It is an H T T P server from Python's own standard library, so the app needs only one package beyond Python, boto three, to talk to A W S. The highlighted handler answers two paths. Slash health answers status ok: that is what the load balancer will check. Slash books slash an I D asks catalog dot p y for the book, and catalog dot p y reads the page from the catalog bucket with one S three get object call. Anything else is a four oh four. In the terminal we start the app in the background, on port eight zero eight zero, and ask it three things. Health says ok. Book one zero zero one comes back as the J S O N page we uploaded in Course 4, read from the emulated bucket. And a book that does not exist answers no such book, with a four oh four. Then we stop the app and read its log: one line of J S O N per request, with the path and the status, written to standard output. The side pane follows one request through the code: curl, the handler, the catalog module, the bucket. The app keeps nothing of its own: the books live in S three, so any number of copies of it can answer the same way. Next, tests that check all this without A W S, and without the emulator.",
}

const testsThatDoNotNeedAws: Section = {
  id: 'tests-that-do-not-need-aws',
  title: 'Tests that do not need AWS: the same code, a mock inside the test',
  scene: 'run-tests',
  narration:
    "The project gains a tests folder, and the editor shows its shared fixture, conftest dot p y. Every test that needs A W S asks for this fixture, and the highlighted lines are the point. It removes the emulator's endpoint, and it sets fake keys. Then mock A W S, from the moto library, takes over boto three inside the test process itself, and the fixture creates the catalog bucket and one book in it. If a call ever escaped the mock, it would have nowhere to go and fake keys to sign with, so it would fail, never reach a real account. The side pane draws the path. A test calls the app's code, unchanged; the code calls boto three, the real client; and boto three's request is intercepted in memory, before it leaves the process. In the terminal, pytest runs five tests. Two call the catalog module directly: one reads a book, one asks for a missing book and expects not found. Three start the real H T T P server on a free port and ask it for health, a book, and an unknown book. All five pass, in a couple of seconds. The table keeps the two tools apart. The emulator is a server that keeps its state between commands, which is what this course's terminal needs. The mock lives inside one test and starts empty every time, which is what tests need: no order between them, nothing left behind. Next, before we package the app, a step back: which of A W S's ways to run code should run it?",
}

const choosingCompute: Section = {
  id: 'choosing-compute',
  title: 'Choosing compute: who runs which layer',
  scene: 'run-compute',
  narration:
    "A W S runs code in many ways, and the four that matter for a web service are on screen. Each column is the same stack of five layers: your code, its packaging, how many copies run and where, the operating system and its patches, and the hardware. Orange is yours, blue is A W S's. On E C two, you rent a virtual server: the hardware is A W S's, and everything above it is yours, including patching the operating system and deciding how many servers to run. On E C S with Fargate, you hand A W S a container image and say how many copies you want; the servers, their operating system and their capacity are A W S's. On Lambda, you hand over only your code, and A W S runs it when an event arrives, as many copies as the events need. And E K S is managed Kubernetes: the Kubernetes control plane is A W S's, but the nodes it runs on, and their operating system, are yours unless you add Fargate there too. The table says when each one fits. E C two, when you need the server itself. Fargate, for a long running web service in containers with no servers to look after: that is the book shop, and it is the course's choice. Lambda, for short pieces of work triggered by events: the shop will use one for fulfilment in Course 8. And E K S, when a team already runs Kubernetes and many services on it. In section nine we will plan the same app on E C two, to see exactly what Fargate takes off our hands. First, the app needs to become an image.",
}

const anImage: Section = {
  id: 'an-image',
  title: 'An image, and a registry for it: the app, frozen',
  scene: 'run-image',
  narration:
    "Fargate runs containers, so the app becomes a container image. The editor shows the Dockerfile. It starts from the official Python three point one three slim image, pinned by its digest, so every build starts from exactly the same bytes. It copies requirements dot t x t and installs it: a lock file that pins boto three and every package boto three pulls in, so nothing floats between two builds. Only then does it copy the app's code, so a change to the code rebuilds one small layer, not the dependencies. It runs as the user nobody, and its command starts the web server. In the terminal, Terraform first makes the registry: an E C R repository called book shop, whose tags can never move, so one point zero point zero always means the same image. Then a real docker build, and docker history lists what the side pane draws: the image is a stack of layers, Debian, Python, the locked packages, and on top, the app itself, a few kilobytes. We run the image as a container against the emulator, and it serves book one zero zero one, exactly as the app did on its own. The image freezes the operating system, Python, every package and the code. What it does not freeze is configuration: which bucket comes from an environment variable, credentials come from the role, and the data stays in S three. Last, the push. The emulator speaks E C R's A P I but not the registry protocol, so the tool registers the image's manifest, the document docker push sends last, and E C R now lists one point zero point zero, with the same digest the build printed. The frame says so. Next, a definition of how to run it.",
}

const aTaskDefinitionAndItsTwoRoles: Section = {
  id: 'a-task-definition-and-its-two-roles',
  title: 'A task definition and its two roles',
  scene: 'run-task',
  narration:
    "A task definition is the recipe for running one copy of the shop, and the editor shows it, in task dot t f. It names the image in E C R, half a virtual C P U and one gigabyte of memory, port eight zero eight zero, the catalog bucket as an environment variable, and a log group for the container's output. The highlighted lines are the part people mix up: two roles. The execution role belongs to E C S, not to the app. E C S uses it before and around the app: to pull the image from E C R and to send the container's output to the log group. Its policy, above in the same file, allows exactly that: pull from this repository, write to this log group. The task role is the app's own, Book Shop App, from Course 4. The app's code signs its requests with it, so reading a book from the catalog uses the task role and nothing else. In the terminal, plan and apply create the log group, the execution role and its policy, and the task definition, revision one. Reading it back from the emulator shows both roles, by A R N. The side pane draws the split, and the table goes moment by moment: pulling the image, E C S with the execution role; creating the log stream, E C S with the execution role; reading book one zero zero one, the app with the task role. Keep them apart, and a leaked app credential can never pull images or write other logs. Next, something that runs this definition, and keeps it running.",
}

const aServiceOnFargate: Section = {
  id: 'a-service-on-fargate',
  title: 'A service on Fargate: three tasks behind the load balancer',
  scene: 'run-service',
  focus: 'app-b',
  narration:
    "Back on the shop's map. In this section the three app tasks appear, one in each app subnet, ringed, and with them, now in colour, the image registry and the logs along the bottom. The terminal shows the plan for two resources. A cluster, called book shop, which is just a name to group services under. And a service: run the task definition with a desired count of three, on Fargate, in the three app subnets, behind the app security group, and register every task in the load balancer's target group on port eight zero eight zero. The diagram under the terminal says what a service is for: it keeps three tasks alive. If a task stops, or fails its health checks, E C S starts another one to get back to three, and every new task registers itself with the target group, where the health checks from Course 5 decide when it gets traffic. Now the honest part, in red. The emulator records the service exactly as declared, desired three, launch type Fargate, but it runs no containers: running count zero, and no tasks. On A W S, E C S would now start three tasks from the image in E C R, one per Availability Zone, so losing a zone loses a third of the shop, not all of it. What we can check here is the declaration, and it is right. Next, how three becomes more when the evening comes.",
}

const scaling: Section = {
  id: 'scaling',
  title: 'Scaling: following the evening peak',
  scene: 'run-scaling',
  narration:
    "Three tasks is a floor, not a plan for the evening. The editor shows scaling dot t f. A scalable target lets the service's desired count move between three and twelve: three so there is always one per Availability Zone, twelve as a ceiling on cost. And a target tracking policy, highlighted: keep the service's average C P U at sixty percent. Add tasks quickly, at most once a minute; remove them slowly, five minutes apart, so a short dip does not throw away capacity the next minute needs. The terminal reads both back from the emulator: minimum three, maximum twelve, target sixty, and the two cooldowns. The side pane is what the policy does, from a small model, labelled as one. Once a minute, CloudWatch measures the average C P U. When it stays above sixty for three minutes, an alarm fires, and the policy sets the desired count in proportion: tasks times C P U, divided by sixty. In the model, traffic climbs from one hundred and twenty to four hundred and twenty requests a second between quarter to six and six. With three tasks, C P U passes sixty and keeps climbing, up to eighty seven percent, because the alarm needs three minutes and a new task needs two more to start. Then the service catches up, four, five, six, seven tasks, and C P U settles back on its target. The lesson is the lag: scaling reacts in minutes, so the target leaves headroom for the minutes it takes. Next, what happens to a task when the evening ends and it is taken away.",
}

const statelessAndGraceful: Section = {
  id: 'stateless-and-graceful',
  title: 'Stateless and graceful: stopping a task without losing a request',
  scene: 'run-graceful',
  narration:
    "Tasks are removed all the time: when the evening ends, on every deploy, when one fails a health check. So a task must keep nothing it needs, and the shop's tasks keep nothing: the catalog is in S three. And it must stop cleanly. The side pane shows the order in which E C S removes a task. First the load balancer drains it: no new requests, and thirty seconds for those in flight. Then E C S sends the container the signal SIGTERM. If it is still running thirty seconds later, the stop timeout, SIGKILL ends it. By default, Python dies the moment SIGTERM arrives, and a request in progress dies with it. The editor shows the fix in web dot p y, highlighted: on SIGTERM, log it, stop accepting new connections, let the requests already accepted finish, and exit. The terminal proves it with a small tool, drain dot p y. It starts the app, sends half a request, sends SIGTERM, then sends the rest. The request still finishes with two hundred, O K, and the app exits with zero; its own output shows stopping, the request, and stopped cleanly. Then the new version ships the way every change will. Build book shop one point one point zero, push it, change the task definition to the new tag, and apply: a new revision, revision two, and the service now runs it. On A W S, E C S would replace the tasks one by one, each one draining before it stops. Next, the same app on E C two, to see what Fargate has been doing for us.",
}

const theSameAppOnEc2: Section = {
  id: 'the-same-app-on-ec2',
  title: 'The same app on EC2: what Fargate takes off your hands',
  scene: 'run-ec2',
  narration:
    "To see what Fargate does for the shop, here is the same app on E C two, side by side. On the left, the shop as it is: one service keeping three tasks, half a virtual C P U each, and the servers, their operating system and their patches belong to A W S. On the right, what E C two would need, written as Terraform in a separate root and planned against the emulator, never applied to the shop. An Auto Scaling group, three to twelve servers across the three Availability Zones. A launch template that every server starts from: an instance type, t three small, and user data, a start up script that installs Docker and runs the very same image. And an Amazon machine image, Amazon Linux, which A W S publishes but which is now ours to keep current. The terminal shows the plan: two resources to add, the group and the template. The table lists what moves to you. The operating system and its patches: on Fargate, A W S's; on E C two, yours, by building a new image and rolling it through the group. Size: Fargate sizes each task, E C two sizes whole servers, and packing tasks onto them is your job. Scaling: tasks on Fargate; on E C two, servers and the tasks on them. And the bill: Fargate charges for what tasks ask for, E C two for whole servers, busy or idle. E C two still wins when you need the server itself. For a web shop, Fargate is less to run. That completes Course 6: the shop runs. Next course, it keeps its data.",
}

export const run: Course = {
  id: 'run',
  title: 'Run the app',
  sections: [theAppLocally, testsThatDoNotNeedAws, choosingCompute, anImage, aTaskDefinitionAndItsTwoRoles, aServiceOnFargate, scaling,
    statelessAndGraceful, theSameAppOnEc2],
}
