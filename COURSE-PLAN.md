# Learn AWS by building a book shop with Terraform — plan

**Status: v1 plan, reviewed by the owner (2026-10-28); spike done (`SPIKE.md`).** Authored: Courses 3–10 (see `CLAUDE.md`, Status).

This repo replaces `aws-ct`. It is re-authored from scratch, not migrated: no scene, spine step
or wav is carried over. What is kept from `aws-ct` is its *method* — the fixed facts, the
verification levels, the emulator's determinism — and the lessons recorded in its `CLAUDE.md`.

## The idea

One application, `book-shop`, an online book shop on AWS. It grows from an empty account to a tested,
containerised web service with an asynchronous checkout, a reporting lake and the controls a
production system needs — **declared in Terraform from its first resource**. Every AWS service is
taught **when the shop first needs it**. Background (how a Region is built, how IAM evaluates a
request, how a packet reaches a container) appears as a ◆ detour at the moment it answers a
question on screen, never front-loaded.

Why a shop:

- **Everyone understands it.** Browse, cart, checkout, delivery, a sales report.
- **Each need pulls in a service.** Product pages need object storage; carts need a key-value
  table; orders need transactions; checkout spikes need a queue; payments need retries and a
  workflow; the finance team needs a lake; the owner needs a bill they understand.
- **It grows the way real AWS systems grow**: one bucket → a networked service → an event-driven
  checkout → a delivery pipeline across two accounts.

### What changes from `aws-ct`

| `aws-ct` | here |
| --- | --- |
| 28 `infra/NN-*.sh` CLI scripts; 4 CloudFormation templates in Course 7 only, then scripts again | **Terraform for every resource, from Course 3.** The CLI reads state and calls the data plane; it never creates infrastructure (except once, in Course 2/3, to show why not) |
| 75 independent snapshots; 33 hidden hand-written `setup` lists | **A cumulative spine**: every step is its parent plus declared `changes`, checked. A step's starting cloud state is `terraform apply` of its parent's code, never a hand list |
| `server.py`: one GET and `/health`; ~44 calculator files in the project | **A real app** (catalog, cart, checkout, orders, worker, report job) with tests. Models and simulations are **labs**, outside the project |
| side panes of list boxes and tables | **canonical diagrams**: AWS architecture maps, packet paths, policy-evaluation charts, state machines, sequences drawn as flows. Tables only where the data is the point |
| `@graphlearning/flow` 2.2 / shell 0.14 | `@graphlearning/graphl-flow` ^0.5 / `@graphlearning/shell` ^1.0 |

## Packaging for YouTube

**One video: "Learn AWS by building a book shop: full course, beginner to professional"** —
12 courses, 92 sections, ~2 h 30 min, one continuous story. A course is a YouTube chapter group and
the owner's review unit; a section (90–120 s) is one chapter, titled *concept: what the shop gets*
("Security groups: only the load balancer reaches the app"). The video opens with the finished
shop taking an order (payoff first). Each section can also go out as a Short (`record-reels`).

## The stack (pinned by the spike, `SPIKE.md`)

| tool | role |
| --- | --- |
| Terraform 1.17.0 + `hashicorp/aws` 6.70.0 | every resource. `.terraform.lock.hcl` is committed in the project |
| moto 5.2.5 (server mode, through `scripts/moto_server.py`) | the emulated account, fresh per step; ten gaps closed and ids made order-independent (`SPIKE.md` §3) |
| AWS CLI v2 2.38.4 and boto3 1.43 | reading state, the data plane, the app's SDK |
| Python 3.13 | the app and Lambda handlers (3.13 is a Lambda runtime; the course is not a Python course) |
| PostgreSQL 16 | the orders database's SQL, really run |
| DuckDB | the lake query, labelled "DuckDB, not Athena" |
| pytest + moto `mock_aws` | the app's tests |
| tflint, `terraform validate`, actionlint | static checks of what cannot run here |

**No AWS account** is behind the course. Every pane that talks to AWS talks to moto and is
labelled **emulated**; nothing emulated is presented as AWS's own output.

## The app: `book-shop`

One name everywhere: the folder, the project in `pyproject.toml`, the service and the ECS cluster are
`book-shop`; the importable package is `book_shop` (a Python name cannot contain `-`).
`book-shop.example.com` in `eu-west-2` (London), production account **111122223333**, development
**444455556666** (AWS documentation placeholders); public IPs from `203.0.113.0/24` /
`198.51.100.0/24`. A fixed facts table (prices, traffic, ids) is written into `CLAUDE.md` when
Course 1 is authored and only ever extended.

```
book-shop/
  pyproject.toml          the app, its deps, pytest                                    (6)
  book_shop/              the app, Python
    web.py                HTTP API: books, cart, checkout, /health                     (6 → 8)
    catalog.py            book pages from S3                                            (6)
    cart.py               carts in DynamoDB                                             (7)
    orders.py             orders in PostgreSQL, one transaction                         (7)
    checkout.py           publishes OrderPlaced                                         (8)
  functions/              Lambda handlers: fulfil, reserve-stock, charge-payment        (8)
  workflows/checkout.asl.json   the payment workflow                                    (8)
  db/migrations/          schema and place-order SQL                                    (7)
  jobs/daily_sales.py     export and the sales report                                   (10)
  tests/                  pytest, AWS calls under moto                                  (6 →)
  Dockerfile              the app as an image                                           (6)
  infra/                  Terraform
    bootstrap/            the state bucket                                              (3)
    *.tf                  one root, a file per concern: s3, iam, network, service …     (3 → 8)
    modules/              network, service, data, checkout, lake, ops                   (9 →)
    envs/dev, envs/prod   one root per account, same modules, different tfvars          (9 →)
  .github/workflows/      plan on PR, apply on merge, OIDC                              (9)
  ops/runbooks/           incident and restore                                          (11)
  docs/adr/               decision records                                              (12)
```

Courses 3–8 deliberately keep **one root with a file per concern**. Course 9 refactors it into
modules and two environments with `moved` blocks and a plan that shows **0 to change** — the
refactor is itself a lesson, and only possible because the spine is cumulative.

| After course | The shop… |
| --- | --- |
| 3 Start | has an account, a profile, a state bucket and its first tagged bucket, in Terraform |
| 4 Secure | has a role for the app, policies that are proven to deny, two accounts |
| 5 Network | has a VPC across three AZs, a load balancer, a name and a certificate |
| 6 Run | serves book pages from a container on Fargate, scaled and tested |
| 7 Data | keeps carts, orders and photos; sells the last unit only once |
| 8 Decouple | takes orders asynchronously: queue, fan-out, a payment workflow |
| 9 Deliver | ships through a pipeline, dev then prod, with no click in either account |
| 10 Report | answers "what did we sell yesterday" from a lake |
| 11 Operate | is observed, audited, encrypted, backed up and recoverable |
| 12 Evolve | is cached at the edge, right-sized, priced and reviewed |

## Frames

Every section is one full-screen 16:9 frame and one narration, no slide. Four kinds:

1. **Map frame** — the shop's **architecture map**, drawn the canonical AWS way: the account,
   the Region, the VPC, three AZ columns, public / app / data subnet bands, service icons, the
   request path as edges. ONE fixed layout from the course a part appears in to the end; what a
   section adds is `NEW`, what it changes is in `focus`, a part not built yet is a grey outline.
   The map sits beside a side pane (a terminal, a plan, a policy). Every map frame is one
   `SAME_FIT` group, so the map never moves between sections — enforced by `check`, the way the
   IDE frames are.
2. **IDE frame** — python-expense-tracker's template, ported unchanged: explorer | editor over
   terminal | fixed side pane. **Every IDE side pane carries a diagram** of the thing on screen.
3. **◆ full scene** — a canonical big picture that needs the whole frame (Regions and AZs, IAM
   policy evaluation, the life of a request, DR strategies). Its own section; it carries real
   output inside it (a lab's run, or a plan) so it stays proof, then the next section returns.
4. **Concept frame** — the few places with no command and no detour (Course 1).

Detours (◆) come in the same two kinds as python-expense-tracker:

- **◆ side pane:** a small picture of the code on screen (the trust arrow of a role, a route
  table's longest-prefix match, a visibility timeout). It stays in the IDE or map frame, so the
  proof stays visible beside it.
- **◆ full scene:** a canonical big picture. **Rule: if it cannot fit the side pane at ≥ 24px
  body text in the 4K frame, it is a full scene. When in doubt, full scene.**

What counts as a *diagram*: an architecture map, a packet or request path, a flowchart with one
path lit, a state machine, a sequence drawn as a flow of numbered steps, a tree (org, partitions),
a plot. A box holding a bulleted list is not a diagram. A table is used only where rows of data are
the point (a plan's resource list, a route table, a bill).

## The courses

Columns: **Step** is what the section changes in `book-shop/` (or the lab it runs). **Picture** is the
side-pane diagram, or the full scene's subject.

**1. `intro` · AWS, and what we'll build · 3**

| # | Section | Frame | Picture |
| --- | --- | --- | --- |
| 1 | The finished shop takes an order | map + terminal | the finished map, one order's path lit end to end; the real `curl` and its 201 |
| 2 | Owning against renting | concept + lab | the demand day (60 / 240 / 560 req/s) against fixed and elastic capacity, a plot |
| 3 | What we'll build, course by course | concept | the map growing in 12 stages, each course's addition in its colour |

**2. `how-aws-runs` · How AWS runs a request · 7**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | ◆ full scene: Regions, AZs and the edge | concept + lab (`describe-availability-zones`) | eu-west-2 → three AZs → data centres; edge locations outside; what fails together |
| 2 | ◆ full scene: global, Regional and zonal services | concept | IAM / S3 / EC2 placed at their scope on the same Region picture |
| 3 | Every action is an API call | lab: one `ListBuckets` from the CLI and from boto3 | console, CLI, SDK, Terraform → one HTTPS endpoint → the service |
| 4 | Anatomy of a request | lab: `--debug` cut to the request | method, endpoint, SigV4 header, body → response; which part each layer adds |
| 5 | ARNs: every resource has a name | lab: three ARNs printed | the ARN's six fields, one per segment |
| 6 | ◆ full scene: shared responsibility | concept | the stack from facility to data; the line moves for EC2 / Fargate / Lambda / S3 |
| 7 | What costs money | lab: the hypothetical rate card applied | meters: time, storage, requests, data out; what keeps charging when "stopped" |

**3. `start` · Start the project · 8**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | The account and its root user | concept | people → Identity Center → a role in each account; each account's own root user, locked away |
| 2 | A profile and a first session | `aws-config` (two profiles, one sso-session); `get-caller-identity` refused: no token | CLI → profile → sso-session → portal → token (none yet) → role credentials |
| 3 | The emulator beside AWS | `env.sh`; `sts get-caller-identity` (emulated); an empty account | CLI / boto3 / Terraform → AWS_ENDPOINT_URL → moto or AWS; what the emulator can show |
| 4 | Why not a script | `scripts/make-bucket.sh` run twice: `BucketAlreadyOwnedByYou`; the bucket removed | two runs, one bucket; a script says what to DO |
| 5 | Terraform: init, plan, apply | `infra/s3.tf`; `init`, `plan -out`, `apply tfplan` | ◆ side pane: code + state + account → plan → apply → account and state |
| 6 | State | sam tags the bucket in the console (off screen); `state list`, the tags, `plan` finds the drift | sam → code / state / bucket → refresh → the plan puts it back |
| 7 | State in S3, locked | `infra/bootstrap/`; `backend.tf` with `use_lockfile`; `init -migrate-state` | two runs, one lock; who keeps whose state |
| 8 | Destroy, tags and a budget (map frame) | `default_tags`, a $20 budget, the drift removed; `plan -destroy` | the shop's map, first time; a budget is an alarm, not a cap |

**4. `secure` · Lock it down · 8**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | Principals and authentication | concept | principals → what each signs with (long-term AKIA / temporary ASIA + token) → authentication → authorization; long-term against temporary |
| 2 | A role for the app | `infra/iam.tf`: role `BookShopApp`, trust `ecs-tasks.amazonaws.com`; `get-role`, no permissions | trust policy (who may assume) vs permissions policy (what it may do): two arrows |
| 3 | Assuming the role | IAM enforced from here; `data/books/bk-1001.json` uploaded; `sts assume-role`; `tools/as-app.sh`: GetObject → AccessDenied | caller → STS → temporary credentials → S3, refused; same read, two principals |
| 4 | Policy statements | `aws_iam_policy_document` ReadBooks (GetObject `books/*`); the read works, a read outside books/ and a write are refused | a statement: effect, action, resource, condition; does it match? |
| 5 | ◆ full scene: how IAM decides | lab `decide.py` under enforcement: allowed / explicit deny (NoDrafts) / implicit deny (PutObject) | the canonical evaluation flowchart; where each request stopped |
| 6 | A request denied, and fixed | `s3 ls books/` → AccessDenied; + ListBooks (ListBucket on the BUCKET's ARN); plan, apply, listed | what IAM compared: ReadBooks no match, ListBooks match; what each S3 action acts on |
| 7 | Resource policies and a second account | bucket policy AuditorReads for `Auditor` in 777788889999 (stored, not evaluated: doc-cited) | two accounts; both sides must allow |
| 8 | ◆ full scene: an organization and its guardrails | lab: `org/main.tf` applied from the management account: OUs, SCP LondonOnly on Workloads (stored, not enforced) | the org tree, the SCP's reach; an SCP is a ceiling, not a grant |

**5. `network` · Give it a network · 10**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | ◆ full scene: addresses and CIDR | lab: `cidr_plan.py` (Python's `ipaddress`, runs locally) | the /16 carved into nine /24s by tier and AZ; one /24 opened: the 5 addresses AWS keeps |
| 2 | A VPC across three AZs (map frame) | `network.tf`: VPC + 9 subnets from one `for_each`; the default VPC filtered out | the map: the VPC and nine subnets appear |
| 3 | Route tables | `routes.tf`: two tables + associations; `tools/which_route.py` reads the real tables | nine subnets → two tables (local only); the most specific match wins |
| 4 | The way in: an internet gateway | IGW + 0.0.0.0/0 in the public table | internet ↔ IGW ↔ the public table's row; the private table has no door |
| 5 | The way out: NAT (map frame) | `nat.tf`: ONE NAT in public-a for dev (cost trade, said) | who may START a connection: task → NAT → internet, never in |
| 6 | Security groups and network ACLs | `security.tf`: alb → app → db by GROUP; a stateless NACL on data; `tools/sg_rules.py` | the chain anyone → alb → app → db; SG vs NACL |
| 7 | ◆ full scene: the life of a request | concept | browser → Route 53 → IGW → ALB (sg, TLS) → task (sg) → back; a hop-by-hop table |
| 8 | A load balancer and its health checks (map frame) | `alb.tf`: ALB in 3 public subnets, target group, HTTP listener; no targets yet | health state machine with the shop's settings (doc-cited) |
| 9 | A name and a certificate | `dns.tf`: zone, DNS-validated ACM cert, alias A; HTTPS listener, 80 → redirect | resolving the name; where encryption ends |
| 10 | Private paths to AWS services | `endpoint.tf`: S3 gateway endpoint; the prefix list beats 0.0.0.0/0 | task → NAT → S3 vs task → endpoint → S3 |

**6. `run` · Run the app · 9**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | The app, locally | `book_shop/web.py`, `catalog.py` (standard library + boto3): `GET /health`, `GET /books/bk-1001` from the emulated bucket, a 404 | request → handler → catalog → S3; three requests, three answers |
| 2 | Tests that do not need AWS | `tests/` under moto's `mock_aws`, no endpoint and fake keys: 5 pass | test → app → boto3 → in-process mock (emulator unreachable); emulator vs mock |
| 3 | ◆ full scene: choosing compute | concept | EC2 / ECS on Fargate / Lambda / EKS: five layers, you or AWS; fits when |
| 4 | An image, and a registry for it | `Dockerfile` (base pinned by digest), `requirements.txt` (every package locked), `ecr.tf`; real `docker build`, `docker run` against the emulator; the manifest registered in ECR (emulated: no layers) | the image's layers, read from `docker history` → container / ECR; what the image freezes |
| 5 | A task definition and its two roles | `task.tf`: log group, execution role BookShopExecution, task role BookShopApp, revision 1 | task definition → execution role (pull, logs) / task role (read books); which role, when |
| 6 | A service on Fargate (map frame) | `service.tf`: cluster + service, desired 3, behind the target group; the emulator runs no tasks (running 0, said) | map: three app tasks; service → tasks → target group |
| 7 | Scaling | `scaling.tf`: 3–12 tasks, target 60% CPU, cooldowns 60/300; lab `peak.py` (a model) | the loop: CPU → alarm (3 min) → desired; CPU and tasks through the evening, plotted from the lab |
| 8 | Stateless and graceful | SIGTERM handling in `web.py`; `tools/drain.py`: a request caught halfway still gets 200, exit 0; 1.1.0 built, pushed, revision 2 | removing a task: drain → SIGTERM → SIGKILL after 30 s |
| 9 | ◆ full scene: the same app on EC2 | lab: `ec2/main.tf` (AMI from SSM, launch template, ASG) planned, not applied | Fargate service beside ASG + template + AMI; what moves to you |

**7. `data` · Keep its data · 9**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | ◆ full scene: choosing where data lives | concept | files (S3 / EBS / EFS) or records (RDS / DynamoDB / ElastiCache); each shop need at its leaf |
| 2 | The catalog bucket | versioning, old versions expire after 30 days, HttpsOnly Deny; a price change makes a second version | one key, two versions (read from the listing), the older one expiring |
| 3 | Uploads without credentials | `uploads.tf` (private, CORS), `uploads.py` signs a PUT URL (300 s); curl, with no credentials, uploads r-77.jpg | browser → app (signs) → browser PUTs → S3 checks; what the URL allows |
| 4 | An orders database (map frame) | `database.tf`: RDS PostgreSQL 16.9, Multi-AZ instance, password managed by RDS; zones read back (2a / 2b) | map: Orders DB + Standby; primary → standby, synchronous |
| 5 | Placing an order | `db/migrations/001_orders.sql` (stock CHECK ≥ 0), `orders.py`: one transaction, in real PostgreSQL 16; the out-of-stock order writes nothing | BEGIN → rows → CHECK fails → ROLLBACK; stock 38, not 37 |
| 6 | Credentials from Secrets Manager | `orders.connect()` reads the RDS-managed secret; the role reads that one secret (user shop, 28 characters) and is refused the payments key | code → role → secret → database |
| 7 | Carts in DynamoDB | `tables.tf` carts (customer + book, on demand, TTL), `cart.py` | the table as item collections (read from the scan); key → partition → Query |
| 8 | The last unit in stock | stock table; checkout as one TransactWriteItems with conditions; two identical carts race for one copy | two buyers → transaction → one committed, one cancelled (the winner read from the run) |
| 9 | ◆ full scene: a cache for book pages | lab: ElastiCache (Valkey) planned, not applied; cache-aside simulated | read path / write path; the stale window: TTL only 10–59 s, delete on write none |

**8. `decouple` · Decouple the checkout · 9**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | ◆ full scene: synchronous against asynchronous | concept | one checkout as a request chain vs as events; what each fails like |
| 2 | A queue for fulfilment | `queues.tf` (visibility 30 s); `checkout.py` records the order then sends OrderPlaced; a worker crashes before the delete, `sleep 31`, receive count 2 | producer → queue → consumer; the message by the clock |
| 3 | When a message keeps failing | redrive policy (maxReceiveCount 3) → `book-shop-fulfilment-dlq`; order 999 (no books) received 3 times, then moved | receive 1 → 2 → 3 → DLQ |
| 4 | A consumer as a function | `functions/fulfil` (ReportBatchItemFailures), event source mapping (10, 5 s); recorded, not run: `tools/poll.py` plays the poller | queue → poller → function → deleted / left |
| 5 | Fan-out (map frame) | SNS `book-shop-orders` → fulfilment, loyalty, fraud-check (body filter total ≥ 500); checkout publishes | one OrderPlaced → three copies, one filtered (read from the queues) |
| 6 | Routing events | EventBridge bus `book-shop`, rules `uk-vat` (country GB) and `refunds` → queues; test-event-pattern on an FR order | events → bus → rules → targets |
| 7 | The payment workflow | `workflows/checkout.asl.json`, four Lambda steps; recorded, not run: `tools/run_workflow.py` walks it with stand-in payment answers | reserve → charge (retry 2 s, 4 s; catch) → ship / release → OrderFailed |
| 8 | Doing it exactly once | `book-shop-idempotency` table; the function claims `fulfil#<order>` first; order 12 sent twice | two deliveries → one key → packed / skipped |
| 9 | ◆ full scene: choosing the mechanism | concept | queue / topic / bus / workflow, each placed on the checkout |

**9. `deliver` · Ship it safely · 8**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | Modules | Course 5's network → `modules/network` (inputs name, cidr); a `moved` block per resource; plan 0 / 0 / 0, 27 moved | the root → module graph; addresses before and after |
| 2 | Two environments, two accounts | `envs/prod/state` (prod's state bucket, local state), `envs/prod` calls the same module with 10.40.0.0/16 in 111122223333 through OrganizationAccountAccessRole; each account's VPC read back | one module → two roots, two accounts, two states |
| 3 | ◆ full scene: a delivery pipeline | concept | pull request (commit → check → plan → review) → merge (apply dev → approve → apply prod); what each stage proves or blocks |
| 4 | A role for the pipeline | `modules/pipeline`: GitHub's OIDC provider + `BookShopPipeline` in both accounts; prod trusts only `environment:production`; trust read back (stored, tokens not checked: doc-cited) | job → OIDC token → STS → role, no stored key |
| 5 | Checks before apply | `.github/workflows/infra.yml` (check, plan-dev, apply-dev, apply-prod behind the `production` environment), `tools/jobs.py`; fmt / validate / plan -detailed-exitcode run locally; a scratch file fails fmt (exit 3). Not run on GitHub | the gate as the workflow declares it; what each check answered |
| 6 | Drift and import | sam (off screen) sets fulfilment's visibility to 60 s and makes `book-shop-returns` by hand; plan puts 60 → 30 back; `import` block adopts the queue (max size 1 MiB → 256 KiB, the provider's default, narrated) | account → refresh → state → compare → code → apply; what was found |
| 7 | Replacement and protecting state | loyalty → `book-shop-points`: queue, policy and subscription replaced with `create_before_destroy` (+ `depends_on` the policy); `prevent_destroy` on the orders DB refuses `plan -replace` | -/+ against +/-; the order the apply really ran in |
| 8 | ◆ full scene: releasing a new version | lab `release_model.py` (2% failures, 2 min alarm, 420 req/s): all at once 1008, rolling 216, canary 101 | the four strategies; failed requests on one time axis |

**10. `report` · Report on sales · 6**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | ◆ full scene: state against history | concept | orders DB (now) → export → lake (history) → catalog → query; which question goes where |
| 2 | Exporting orders to a lake | `infra/lake.tf` (private bucket); migration 002 (`placed`); `jobs/seed_september.py` (30,000 MADE-UP orders, seeded 12, said on screen); `jobs/export_orders.py`: one Parquet file per day, fixed schema, zstd, `order_history/dt=<day>/` | db → job → the bucket's `dt=` layout; the month's numbers |
| 3 | A catalog for the lake | `infra/catalog.tf`: Glue database `book_shop_lake`, table `order_history` (partition key `dt`, partition projection); columns read back | filter → table → projected folder; catalog types against the files' |
| 4 | Querying it | `infra/athena.tf` (workgroup `book-shop-reports`, 1 GiB scan cutoff); `reports/yesterday.sql` handed to Athena (recorded, not run) and run by DuckDB over a copy (`tools/sales.py`): top five books on 30 September, files read 1/30 | 30 day folders, 29 skipped; the answer |
| 5 | A stream of clicks | `infra/clicks.tf`: Kinesis `book-shop-clicks`, 2 shards, 24 h; `tools/clicks.py`: 1,000 made-up clicks keyed by session, 596 / 404 by shard, none split; lab `05-lag` (a model): lag with 2 against 4 shards | pages → key → shards → consumer; lag on a plot |
| 6 | ◆ full scene: lake, warehouse or cluster | concept | one lake → Athena / Redshift / EMR; which fits the shop |

**11. `operate` · Operate it · 9**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | ◆ full scene: one slow evening | concept + lab | the same incident as a metric, a log line and a trace, joined |
| 2 | Logs and metrics | log group, retention, metric filter | app → log group → filter → metric |
| 3 | Objectives and alarms | an SLO, a burn-rate alarm → SNS | error budget burning at 20× and 100×, a plot |
| 4 | Who changed what | CloudTrail trail | API call → trail → bucket; one event read |
| 5 | Keys and encryption | KMS key, key policy | ◆ side pane: envelope encryption, data key under a KMS key |
| 6 | Protecting the edge | WAF web ACL on the ALB | layers: WAF → ALB → SG → app, what each stops |
| 7 | Backups that restore | AWS Backup plan, a copy to another account | plan → vault → copy; the restore drill on a timeline |
| 8 | An incident | revoke sessions for a leaked role | detect → contain → eradicate → recover, timestamped |
| 9 | ◆ full scene: disaster recovery | concept | backup & restore / pilot light / warm standby / active-active on a cost × RTO chart |

**12. `evolve` · Measure, tune and evolve · 6**

| # | Section | Step | Picture |
| --- | --- | --- | --- |
| 1 | A CDN in front | CloudFront distribution, cache policy | shopper → edge (hit) / → origin (miss); latency plot |
| 2 | ◆ full scene: measuring before tuning | lab (saturation simulation) | the latency knee as utilisation rises, a plot |
| 3 | The month's bill | lab: hypothetical rate card over the finished infra | where the money goes; what a commitment saves |
| 4 | Allocating cost | cost tags, budgets per environment | spend by tag; an anomaly found |
| 5 | A decision record | `docs/adr/001-order-platform.md` | options scored against musts and wants |
| 6 | ◆ full scene: a Well-Architected review | concept | the finished map judged by the six pillars; where next |

**Totals:** 3 + 7 + 8 + 8 + 10 + 9 + 9 + 9 + 8 + 6 + 9 + 6 = **92 sections**, 19 of them ◆ full scenes.

## How a section teaches

Objective → mental model (the picture) → the change and its real result → a failure or
alternative → bridge. One step per section; a failure is its own step with real output (the
`AccessDenied`, the plan that replaces a database). Narration explains and never reads code aloud;
acronyms are spelled for the speech engine ("A W S", "V P C", "I A M"…). A ◆ detour is ≤ 120 s
and returns to the shop.

## The spine

`spine/<course>/<NN-step>/` = `project/` + `session.txt` + `step.json`, as in
python-expense-tracker, with its rules: every step has exactly one of `first`, `from` + `changes`
(the section's real diff, checked: an undeclared change or a declared non-change fails), or `lab`.

`scripts/spine.py` merges the two existing ones:

- **from python-expense-tracker**: the cumulative chain, `lab`, `volatile`, highlights found by
  text, never typed line numbers.
- **from aws-ct**: seeded moto, the frozen clock for Python and the CLI, the endpoint rewrite
  (`localhost:5000` → the regional endpoint in output), wrapping at the pane's width, IAM
  enforcement.
- **new — each section builds on the one before, nothing is replayed to get there.** The whole
  chain runs against ONE emulator and ONE working copy of the project: a step's files are laid over
  the working copy, and its session runs where the previous session left off — the same buckets,
  state, `.terraform/` and lock file. No hidden re-apply, no setup lists. The chain is a line (a
  failure and its fix are two consecutive steps). `setup` is only for what happens off screen
  between two sections (a colleague's console click). Labs run alone.
- **new — recorded once, never replayed.** A step runs once, when it is authored, from its
  parent's recorded state; the machine's state after it is committed beside it (`state/`), so the
  next section starts from it without re-running anything before it. The check runs nothing: it
  proves each record still belongs to its step and each transcript is the recording's.

Terraform-specific replay rules, proven by the spike (`SPIKE.md` §1, §4):

- **`terraform init` is a learner's**: a local stand-in for `registry.terraform.io` serves the ONE
  pinned provider from HashiCorp's own signed release files, so init says "signed by HashiCorp",
  writes the full lock file, needs no network, and HashiCorp's next release changes nothing.
- **Ids do not depend on Terraform's walk order**: moto's random stream is re-seeded from each
  request's content.
- **Timing-dependent apply lines** (elapsed counters, "Still creating…", the order of concurrent
  progress lines) are compared as a set; ids, plans and summaries exactly.
- **Frames mostly show the plan** (sorted, deterministic, the teaching moment) and fold an apply
  to its summary line.

## Verification levels

Carried from `aws-ct` (`check:aws`), with Terraform replacing CloudFormation:

| level | means | checked by |
| --- | --- | --- |
| `runs locally` | real Python or SQL, really run | the replay; SQL in PostgreSQL 16 |
| `emulated` | applied to moto, not AWS | the replay (`terraform apply` + the CLI reading it back) |
| `planned` | declared, validated, planned against moto, **not applied** (moto lacks the resource) | `terraform validate`, tflint, `plan` in the replay; the frame says "planned, not applied" |
| `model-checked` | a request or policy checked against AWS's models | botocore ParamValidator, parliament, actionlint |
| `doc-cited` | AWS documentation says so | `// source:` URL in the scene |
| `illustrative` | made up, realistic, unchecked | counted, so it stays visible |

Hidden verifications (`verify/<course>/*.py`, moto with IAM enforcement) assert what a picture
claims and no card shows. Mutate a row and watch it fail before trusting it.

## Build order

1. **Owner review of this plan.**
2. **Spike (no content)** — done 2026-10-28, see `SPIKE.md`:
   - Terraform + provider mirror; `terraform apply` on moto for **every resource type this plan
     names** → a support matrix (`applied` / `planned only`) that fixes each section's level.
   - The merged `spine.py`, proven on a three-step chain (bucket → tag change → destroy).
   - Engine work in `graphl-flow` (a minor release): the missing AWS icon keys (ECS / Fargate,
     ECR, ELB, Route 53, CloudFront, WAF, CloudTrail, ACM, Backup, Organizations, internet and
     NAT gateway, Systems Manager, Terraform's mark) and a **dashed group border** (AWS draws AZs
     and subnets dashed), each with a fixture.
3. **Repo scaffold:** vite + graphl-flow + shell, the IDE frame ported, the map frame on one fit,
   `check-content` / `check-render` / `check:spine`, `CLAUDE.md`. Done 2026-10-28; `check:aws`
   (verification levels of code cards) comes with the first course that needs it.
4. **Pilot: Course 3 (`start`) plus one ◆ full scene from Course 5 (addresses and CIDR)** → owner
   review of both frame kinds and both detour kinds on rendered 4K routes. Authored 2026-10-28.
5. Courses 1–2, 4–12 one at a time, each reviewed on its rendered routes, then narrated.
6. Record all 12 → assemble and publish the one video.

## Decisions (resolved with the owner, 2026-10-28)

1. **A new repo, `aws-ecommerce`, re-authored from scratch.** `aws-ct`'s 105 wavs are discarded.
2. **Terraform** for all infrastructure, from the first resource.
3. **12 courses.**
4. **No AWS account.** moto is the account; what it cannot do is `planned` or `doc-cited`, said
   on screen.
5. Canonical diagrams, not list boxes; ◆ detours as side pane or full scene, by the 24px rule.

6. **The app is `book-shop`** (package `book_shop`), an online book shop at
   `book-shop.example.com`; books are its products (`GET /books/bk-1001`).
7. **Fargate is the main compute**; EC2 (6.9) and Lambda (8.4) are side-by-side comparisons,
   drawn beside the map, never inside it.
8. **92 sections** are kept.

## Open for the owner

Nothing open. The spike's findings are in `SPIKE.md`.
