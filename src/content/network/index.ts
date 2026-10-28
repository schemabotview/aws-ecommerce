import type { Course, Section } from '../types'

// Course 5 · Give it a network. In the pilot: its first section only, a ◆ full-scene detour.

const addressesAndCidr: Section = {
  id: 'addresses-and-cidr',
  title: 'Addresses and CIDR: carving the shop\'s network',
  scene: 'network-cidr',
  narration:
    "Before the book shop gets a network, it needs a plan for its addresses, and this frame is that plan. Start on the left with the notation. Ten dot twenty dot zero dot zero slash sixteen means: the first sixteen bits, ten dot twenty, are fixed, and the last sixteen are free for hosts. Two to the power of thirty two minus sixteen is sixty five thousand five hundred and thirty six addresses. A slash twenty four fixes twenty four bits, and leaves two hundred and fifty six. Under the table is the real output of a small Python program, the address plan run locally with Python's own I P address module. In the middle is that plan as a picture. The V P C, the shop's private network, takes the whole slash sixteen. It is carved into nine slash twenty fours: three tiers, each in three Availability Zones. The public tier, ten dot twenty dot zero to two, faces the internet: the load balancer and the N A T gateways will live there. The app tier, ten dot twenty dot ten to twelve, holds the shop's tasks. The data tier, ten dot twenty dot twenty to twenty two, holds the database. The gaps between ten and twenty leave room for each tier to grow, and below them, the rest of the range is free: room for two hundred and thirty three more subnets. Only three and a half percent is used. On the right, we open up one subnet, public c. Of its two hundred and fifty six addresses, A W S keeps five: the network address, the V P C router, the D N S resolver, one reserved for later, and the broadcast address. Two hundred and fifty one are left for the shop. Next, we build this V P C in Terraform.",
}

const aVpcAcrossThreeAzs: Section = {
  id: 'a-vpc-across-three-azs',
  title: 'A VPC across three AZs: the network appears on the map',
  scene: 'network-vpc',
  focus: 'vpc',
  narration:
    "Back on the map, the network appears. The V P C is the shop's private network in E U west two, and inside it, coloured in now, are its nine subnets: in each of the three Availability Zones, a public one, an app one and a data one. The code is on the right, in network dot t f, and it does not list nine subnets. A locals block builds them from the address plan of the last section: for each tier, public, app and data, and for each zone, a, b and c, a name like app dash b, its zone, and its slash twenty four, ten dot twenty dot eleven dot zero. Then one resource block, A W S subnet, with for each over that map, makes all nine, each tagged with its name and tier. Change the plan, and the subnets follow. Apply creates ten resources: the V P C and the nine subnets. The query under it reads them back from the account, filtered to this V P C by its id, which Terraform gives us as an output, because the account has a second V P C we did not make: every A W S account starts with a default V P C in each Region, ready for quick experiments. The shop does not use it. Notice what this network can do so far: nothing reaches it from outside, and nothing in it reaches out. Subnets are places to put things; where packets may go is decided by route tables, and that is next.",
}

const routeTables: Section = {
  id: 'route-tables',
  title: 'Route tables: the most specific match wins',
  scene: 'network-routes',
  narration:
    "Every subnet answers to exactly one route table, and routes dot t f creates two. The public table will serve the three public subnets; the private table serves the other six, the app and the data tiers. The association block at the bottom ties each subnet to its table, with the same for each over the subnets, choosing by tier. A new table already holds one route that nobody wrote: ten dot twenty dot zero dot zero slash sixteen to local. It means that inside the V P C, every subnet can reach every other. That is all the network can do right now. To see it, the project gains a small tool, which route dot p y. It reads the real route tables from the account, finds the table a subnet answers to, and picks a route the way the V P C router does: of all the routes whose destination contains the address, the most specific one, the longest prefix, wins. The router itself and the packets are not emulated, so the tool is how we look. From app a, the address ten dot twenty dot twenty dot fifteen, in data a, matches the local route, and goes there. From public a, one nine eight dot fifty one dot one hundred dot seven, a payments service on the internet, matches nothing at all: the packet is dropped. The side pane puts it together: nine subnets, two tables, each holding only local. A brand new V P C is an island. Every way in or out is a route that someone adds on purpose, and the first one is the way in.",
}

const theWayInAnInternetGateway: Section = {
  id: 'the-way-in-an-internet-gateway',
  title: 'The way in: an internet gateway makes a subnet public',
  scene: 'network-igw',
  narration:
    "The way in is an internet gateway, added at the bottom of routes dot t f. There is one per V P C, and A W S runs it across every zone, so it is not a single point of failure. On its own it does nothing. The second block is what matters: a route in the public table only, sending zero dot zero dot zero dot zero slash zero, which means every address, to the gateway. Because the local route is more specific, traffic inside the V P C still stays inside; everything else from a public subnet now goes out through the gateway, and replies come back the same way. The tool shows it. From public a, the payments address now matches two routes, local does not contain it, and zero slash zero does, so it goes to the internet gateway. From app a, nothing has changed: its private table still has only local, and the packet is dropped. The side pane draws the two tables side by side: the public one with a door, the private one with none. And this is the definition worth remembering. A subnet is public because its route table sends zero slash zero to an internet gateway. Nothing else makes it public: the word public in its name is only a label we chose. The load balancer will live in these subnets, reachable from the internet. The shop's tasks will not. But they still need to reach out, to call the payments service, and that needs a different kind of door.",
}

const theWayOutNat: Section = {
  id: 'the-way-out-nat',
  title: 'The way out: a NAT gateway, out but never in',
  scene: 'network-nat',
  focus: 'nat-a',
  narration:
    "On the map, a N A T gateway appears in the public subnet of zone a. N A T stands for network address translation. It is the way out for private subnets: the private route table now sends zero slash zero to it, and it forwards the traffic through the internet gateway, rewriting the source address to its own public one. In the terminal, the tool shows the new route: from app a, the payments address now goes to the N A T gateway. And from data b, an address in the app tier still goes local, because local is more specific than zero slash zero. The diagram under the terminal is the point of this section: who may start a connection. A task in app a may start one, out through the N A T, to the internet, and the reply comes back to it. Nothing on the internet can start a connection to the task: there is no route in, and the N A T only answers connections that came from inside. Out, but never in. One decision is worth saying aloud. Development runs one N A T gateway, in zone a, because each one costs money every hour it exists and for every gigabyte it processes. The price of saving is resilience: if zone a fails, the private subnets in all three zones lose the internet. Production will run one per zone. Routes decide where packets may go. Next, firewalls decide who may connect at all.",
}

const securityGroupsAndNetworkAcls: Section = {
  id: 'security-groups-and-network-acls',
  title: 'Security groups and network ACLs: who may connect to whom',
  scene: 'network-filters',
  narration:
    "Routes say where a packet can go; firewalls say whether it may arrive. Security dot t f creates three security groups, one per role: alb for the load balancer, app for the shop's tasks, and db for the orders database. A security group sits on each network interface, and its inbound rules say who may start a connection in. The highlighted rules are the chain. Anyone may connect to the alb group on four four three and eighty. The app group accepts port eighty eighty, but only from the alb group: not from an address range, from a group, so whatever is behind the load balancer, however many tasks, the rule never changes. The db group accepts five four three two, only from the app group. The tool reads the rules back from the account, by group name, and prints exactly that chain, drawn in the side pane: anyone to alb, alb to app, app to db. Nothing else can reach the database at all. Security groups are stateful: a reply to a connection that was allowed in is always let back out. The file ends with the other kind of firewall, a network A C L, on the three data subnets. The table compares them. A security group is on an interface and only allows. A network A C L is on a subnet, it can allow and deny, its rules are checked in order, and it is stateless: it sees every packet alone, so the reply needs its own rule, which is why it has an outbound rule for the app tier's high ports. Next, all of it together, in one request.",
}

const theLifeOfARequest: Section = {
  id: 'the-life-of-a-request',
  title: 'The life of a request: one page view, hop by hop',
  scene: 'network-request',
  narration:
    "Here is everything this course builds, used by one page view. A shopper's browser asks for book shop dot example dot com slash books slash b k one thousand and one. Step one is the name. The browser asks the D N S, and Route fifty three answers with the addresses of the load balancer. That is the first edge, a question and its answer. Step two, the browser connects to one of those addresses on port four four three. The packet arrives at the internet gateway, and the public route table carries it into the public subnet. Step three, it reaches the load balancer's network interface, where the alb security group decides: four four three, from anyone, allowed. Step four is T L S. The load balancer presents its certificate, which proves it really is book shop dot example dot com, and the encrypted request is decrypted here. Step five, the load balancer picks a task that its health checks say is healthy, and sends the request on, as plain H T T P, to port eighty eighty in an app subnet. Step six, the task's interface asks the app security group, which allows eighty eighty from the alb group. The task is greyed: it arrives in Course Six. Step seven, the reply goes back the same way, with no rule needed, because security groups are stateful. The table on the bottom names who decides at each hop, and the section that builds it. Two pieces are still missing: the load balancer, and the name and certificate. They come next.",
}

const aLoadBalancerAndItsHealthChecks: Section = {
  id: 'a-load-balancer-and-its-health-checks',
  title: 'A load balancer and its health checks',
  scene: 'network-alb',
  focus: 'alb',
  narration:
    "The load balancer appears on the map, spanning the three public subnets: one name, with a node in every zone, so losing a zone does not lose the front door. Its security group is alb. Behind it, a target group says where requests go: port eighty eighty, by I P address, which is how Fargate tasks will register in Course Six, and a listener on port eighty forwards to it for now. In the terminal, the account reports the load balancer: its D N S name, internet facing, and active. Then the target group's health: an empty list, because there are no targets yet. The diagram under the terminal is how the load balancer decides who gets traffic, using this shop's own settings. Every ten seconds it asks each target for slash health. A new target starts as initial. Three passes in a row, and it is healthy and gets requests. Two failures in a row, and it is unhealthy and gets none, so a broken task stops receiving shoppers within about twenty seconds, without anyone being paged. When a target is removed, say during a deploy, it drains for thirty seconds, finishing the requests it already has before it goes. The emulator records these settings but does not run checks, so the timings come from the A W S documentation, not from a run. The load balancer now answers plain H T T P on its own long name. Shoppers need the shop's name, and a padlock.",
}

const aNameAndACertificate: Section = {
  id: 'a-name-and-a-certificate',
  title: 'A name and a certificate: Route 53, ACM, and where TLS ends',
  scene: 'network-dns',
  narration:
    "D N S dot t f gives the shop its name. A Route fifty three hosted zone holds the records for book shop dot example dot com. Outside A W S, the domain's registrar points the domain at the zone's four name servers; that step is described, not emulated. Next, a certificate from A C M, the certificate manager, validated by D N S: A C M asks for one special record to prove we control the name, Terraform writes it into the zone, and the certificate is issued. The highlighted block is the name itself: an alias A record pointing at the load balancer. An alias, not a plain address, because the load balancer's addresses change; Route fifty three follows them. Alb dot t f changed too: an H T T P S listener on four four three, with the certificate and a modern T L S policy, and the port eighty listener now only answers: go to H T T P S. The plan shows it: six to add, one to change. Reading back, the zone holds the alias record and the validation record A C M asked for, beside the name server records every zone has; the listeners are eighty, redirect, and four four three, forward. The side pane draws both halves. Finding the name: the shopper's resolver walks from dot com to example dot com, which delegates to Route fifty three's name servers, and the hosted zone answers with the alias. And where encryption ends: H T T P S from the browser to the load balancer, then plain H T T P inside the V P C to the task. Encrypting that last hop too is a choice, and the next section saves money instead.",
}

const privatePathsToAwsServices: Section = {
  id: 'private-paths-to-aws-services',
  title: 'Private paths to AWS services: an S3 gateway endpoint',
  scene: 'network-endpoint',
  focus: 'rt.pl',
  narration:
    "The shop's tasks will read every book page from the catalog bucket in S three. Right now, that traffic would leave the private subnet through the N A T gateway and the internet gateway, and the N A T gateway charges for every gigabyte it processes. Endpoint dot t f fixes that with a gateway endpoint for S three. It adds one route to the private table: S three's address ranges, held by A W S as a prefix list, to the endpoint. The terminal reads the prefix list from the account, and the tool picks a route for one of its addresses from app a. Two routes match now: zero slash zero to the N A T, and the prefix list to the endpoint. The prefix list is more specific, so it wins, and the request never touches the N A T gateway. The side pane draws both paths: before, task to N A T to internet gateway to S three, dashed; now, task to the endpoint to S three. A gateway endpoint for S three has no hourly charge and no per gigabyte charge, and the traffic stays on A W S's network. The route table at the bottom shows the new row, ringed. That completes the shop's network: an address plan, nine subnets in three zones, doors in and out, firewalls in a chain, a load balancer with health checks, a name with a certificate, and a private path to S three. All of it is still empty. In the next course, the shop's own code moves in.",
}

export const network: Course = {
  id: 'network',
  title: 'Give it a network',
  sections: [addressesAndCidr, aVpcAcrossThreeAzs, routeTables, theWayInAnInternetGateway, theWayOutNat, securityGroupsAndNetworkAcls,
    theLifeOfARequest, aLoadBalancerAndItsHealthChecks, aNameAndACertificate, privatePathsToAwsServices],
}
