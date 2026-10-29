import type { Course, Section } from '../types'

// Course 2 · How AWS runs a request (COURSE-PLAN.md). Narration is written for the speech engine:
// acronyms spelled ("A W S", "A P I", "A R N", "S D K"), account ids digit by digit, prices as words.

const regionsAndZones: Section = {
  id: 'regions-azs-and-the-edge',
  title: 'Regions, availability zones and the edge',
  scene: 'how-regions',
  narration:
    "A W S is not one place. It is Regions, and the shop will live in one of them: E U West 2, London. The frame draws it as A W S draws a Region, with a dashed border, because a Region is a place, not a thing you create. Inside it are three availability zones, A, B and C. Each zone is one or more data centres, with its own power, cooling and network, far enough from the others that a flood or a fire in one does not reach the next, and close enough for fast links between them. The terminal asks the Region for its zones, and gets the three names, each with a zone I D. The names are per account; the I D names the same physical zone for everyone. This answer comes from the emulator, which answers the way the A P I does. To the right, outside any Region, are edge locations: hundreds of smaller sites around the world, close to shoppers, which serve cached content and answer name lookups. The table is the reason for all of this: what fails together, and what survives it. A server fails, and anything keeping two copies carries on. A data centre fails, and its zone's other buildings carry on. A whole zone fails, and only a system running in two or three zones carries on, which is why the shop will run in all three. A whole Region is the largest failure, and Course 11 comes back to it. Next, which services live where.",
}

const globalRegionalZonal: Section = {
  id: 'global-regional-and-zonal-services',
  title: 'Global, Regional and zonal services',
  scene: 'how-scopes',
  narration:
    "Every A W S service has a scope, and the scope decides what it fails with. The frame places the services the shop will use on the same Region picture. At the top, global: I A M, which holds users, roles and policies; Route fifty three, for names; and CloudFront, the edge. There is one of each for the whole account, everywhere. Inside the Region, Regional services: an S three bucket, an S Q S queue, a Lambda function, a DynamoDB table. Each lives in E U West 2, and A W S spreads it across the Region's zones for you, so losing one zone does not lose your bucket. At the bottom, zonal: an E C two instance and a subnet each live in exactly one zone, and so do a disk and a database instance. If that zone fails, they fail with it. The table draws the consequence. Global services almost never fail, but a change to them can take a while to spread, so the shop creates its roles once and leaves them. Regional services need nothing more from the shop inside the Region. Zonal things are the shop's job: if it wants to survive a zone, it must run one in each zone, which is why it will have a subnet, a task and a N A T gateway in each of three zones. Next, how every one of these services is actually asked to do anything.",
}

const everyActionIsAnApiCall: Section = {
  id: 'every-action-is-an-api-call',
  title: 'Every action is an A P I call',
  scene: 'how-call',
  narration:
    "Whatever you do in A W S, you do by calling an A P I. The console in a browser is a web page that calls it. The command line is a program that calls it. An S D K, such as boto three for Python, is a library that calls it. And Terraform, which builds the shop from Course 3 on, calls it through the S D K for Go. The frame draws four ways to ask, and one place they all go: a single H T T P S endpoint for the service in the Region, here S three in E U West 2, which then does the work. The terminal asks the same question two ways. First, the A W S C L I lists the account's buckets. Then three lines of Python ask exactly the same thing, through boto three. Both get the same answer: an empty list. This is a fresh account, in the emulator, and nothing has been made yet. The table says why this matters for everything that follows. Anything the console can do, code can do, because the console is code. And code can be read, reviewed, repeated and put in version control, which is how this course will build the shop: never by clicking. Next, what one of those requests actually looks like on the wire.",
}

const anatomyOfARequest: Section = {
  id: 'anatomy-of-a-request',
  title: 'Anatomy of a request',
  scene: 'how-anatomy',
  narration:
    "Here is the list buckets request from the last section, taken apart. A small script asks boto three to show the request just before it is sent, exactly as signed. It is an H T T P S get, to the S three endpoint in London. Then come the headers that matter. The date and time, because a signed request is only valid for fifteen minutes, so a captured one cannot be replayed tomorrow. A hash of the body, which is empty here, so the body cannot be swapped on the way. And the authorisation header, signature version four, in three parts. The credential names whose key signed it, and for which day, Region and service. Signed headers lists what the signature covers. And the signature itself: a value computed from all of that and the secret key. The secret key is never sent. The answer comes back: two hundred, and no buckets. The table goes part by part, and the row of steps below says what A W S does on arrival. T L S first, so you know you are talking to A W S. Then the signature is recomputed from the same parts with the same secret: if it matches, the request really came from the key's owner, unchanged. Then I A M decides whether that principal may list buckets. Only then does S three answer. The clock in this course is fixed, so the signature is the same on every run. Next, the names every one of these requests uses.",
}

const arns: Section = {
  id: 'arns-every-resource-has-a-name',
  title: 'A R Ns: every resource has a name',
  scene: 'how-arns',
  narration:
    "Every resource in A W S has a name that is unique across all of A W S: an Amazon Resource Name, or A R N. The top of the frame is its shape, using the queue the shop will make in Course 8: six fields, separated by colons. The word A R N. The partition, which is A W S almost everywhere. The service that owns the name. The Region. The account. And the resource itself, often a type and a name. A small script splits three real ones. The first is the caller, as the emulator names it: a user called moto, in the development account. No Region, because I A M and S T S identities are global. On A W S, alex's session would read assumed role, book shop developer, alex, and the note says so. The second is a policy that A W S itself maintains, read only access. Its account field says A W S, because it belongs to no customer. The third is the bucket Course 3 will make, book shop catalog. Its Region and account are both empty: a bucket's name is already unique across every account in the world, so it needs neither. Those empty fields are worth reading, because they tell you the scope of the thing, the same scopes as two sections ago. A R Ns are what policies are written in: allow this principal, this action, on this A R N. Course 4 writes them. Next, who is responsible for which part of all this.",
}

const sharedResponsibility: Section = {
  id: 'shared-responsibility',
  title: 'Shared responsibility',
  scene: 'how-shared',
  narration:
    "When the shop runs on A W S, who is responsible for what? The answer is shared, and where the line falls depends on the service. The table is the stack, from the bottom up, for the four kinds of service the shop uses. The bottom row is always A W S: the buildings, the hardware and the network. The top row is always yours: the data, and who may read it. A W S will never decide who may read your bucket; that is your policy. In between, the line moves. With an E C two instance, a server you rent, almost everything is yours: the operating system and its patches, the runtime, your code, and how many servers to run. With containers on Fargate, A W S runs the operating system and places the containers; you bring the container, and choose how many. With Lambda, A W S runs nearly everything, including the runtime you pick; you bring a function. And with S three, you bring only data and its policy. The row of services below draws the same line moving: from E C two to S three, there is less to run. Less to run is less to patch at three in the morning. It is also less control, which is the same trade as owning against renting, one level up. The shop uses all four, each where it fits. Next, the last thing to understand before building: what costs money.",
}

const whatCostsMoney: Section = {
  id: 'what-costs-money',
  title: 'What costs money',
  scene: 'how-meters',
  narration:
    "A W S charges by meters, and the surprise is usually which ones keep running. The lab takes one small server through a month, in three states, at hypothetical rates: round numbers chosen for the course, not A W S's prices, which you should always check. Running all month, it costs about twenty five dollars: the instance's time, its disk, its public address, and the data it sends out to the internet. Now stop it. Most people expect zero. It is about five dollars and sixty five cents, because two meters are still running: the disk still exists, and the public address is still held. Only terminating it, and letting the disk and the address go, brings it to zero. The bar chart shows the three months, and the table lists the meters and when each one runs. Instance time, only while it runs. Disk, while the volume exists, stopped or not. A public I P address, while you hold it. Data out to the internet, by the gigabyte. And requests, for services such as S three, each one counted. Two habits follow from this, and the course keeps both. Every resource carries tags saying what it belongs to, so the bill can be split. And a budget sends an alarm before the month surprises anyone. Course 3 sets both up on the very first day. That completes Course 2. Next course: starting the project.",
}

export const howAwsRuns: Course = {
  id: 'how-aws-runs',
  title: 'How AWS runs a request',
  sections: [regionsAndZones, globalRegionalZonal, everyActionIsAnApiCall, anatomyOfARequest, arns, sharedResponsibility, whatCostsMoney],
}
