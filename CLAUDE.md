# CLAUDE.md — aws-ecommerce

> Workspace invariants live in the workspace `CLAUDE.md`. This file is only what is true here.

## What this repo is

A GraphL concept app: **learn AWS by building a book shop, declared in Terraform**. A **section** is
`(scene, narration)`: one full-screen 16:9 frame, one chapter of the video. It replaces `aws-ct`
(re-authored from scratch; nothing carried over but its method).

- **`COURSE-PLAN.md` is the source of truth**: courses, sections, frames, the spine. Change it first.
- **`SPIKE.md`** is why the machine is built the way it is (Terraform on moto, the registry stand-in,
  the moto patch layer, determinism). Read it before touching `scripts/`.

Engine `@graphlearning/graphl-flow` ^0.6.0, shell `@graphlearning/shell` ^1.0.4.

## Status

Authored 2026-10-28/29, awaiting owner review: ALL 12 courses, 92 sections — Course 1 `intro` (3),
Course 2 `how-aws-runs` (7), 3 `start` (8), 4 `secure` (8), 5 `network` (10), 6 `run` (9), 7 `data`
(9), 8 `decouple` (9), 9 `deliver` (8), 10 `report` (6), 11 `operate` (9), 12 `evolve` (6). One chain:
`start/02` → … → `secure/07` → `network/02` → … → `run/08` → `data/02` → … → `data/08` →
`decouple/02` → … → `decouple/08` → `deliver/02` → … → `deliver/07` → `report/02` → … → `report/05`
→ `operate/02` → … → `operate/08` → `evolve/02-cdn` → `05-costs` → `06-adr` → `intro/01-order` (§1.1
is recorded LAST: it shows the finished shop). Labs stand alone: `how-aws-runs/*`, `intro/02-demand`,
`deliver/08`, `report/05-lag`, `evolve/02-latency`, `03-knee`, `04-bill` and the earlier ones. No
narration audio yet.

**graphl-flow 0.6.0 is on graphl-flow's `main` but not yet on npm** (AWS icons, `dashed` groups,
`muted` items, `hcl`, folded terminals). Until it is published: build it (`npm pack` there), install that tarball into `node_modules` here without saving, and do not commit
a lockfile (`package-lock.json` is gitignored for exactly this reason — remove that line when
0.6.0 is published, and commit the lockfile).

## Commands

```sh
npm run dev                      # the app, :5173
npx tsc --noEmit && npm run build
npm run check                    # check-content + check-render (every section at 3840×2160)
npm run check:spine              # every step recorded, current, untouched — runs NOTHING (< 1 s)
python3 scripts/spine.py --record network/06   # record a step: runs ONLY it, from its parent's state
python3 scripts/spine.py --replay  # deliberate, after a tool upgrade: the whole chain from the start
npm run shots -- <slug-prefix>   # 4K PNGs in out/shots/ — then LOOK
python3 spike/terraform-on-moto/matrix.py [case…]   # Terraform × moto support matrix
```

Checks are a floor, not proof. Every frame of the pilot passed a check at some point while reading
badly (tangled arrows, a half-empty side pane): capture and look.

## The spine — each section builds on the one before

`spine/<course>/<NN-step>/` = `project/` + `session.txt` + `step.json` (`first` / `from` + `changes` /
`lab`; see `scripts/spine.py`'s docstring for every key).

- **One emulator, one working copy, the whole chain.** A step's files are laid over the working copy
  and its session runs where the previous one left off. No hidden re-apply, no setup lists that
  rebuild earlier state. If a section needs something, an earlier section's commands made it.
- **`setup` is only for what happens off screen between two sections** (sam's console click in
  §3.6) — never the shop's own state.
- **The chain is a line.** A failure and its fix are two consecutive steps.
- **`changes` is the section's diff**, checked both ways; `[]` is a section that only looks. A file a
  step's session writes and captures (the lock file) may appear in the next step undeclared.
- **Recorded once, never replayed.** `--record` runs a step ONCE, from its parent's recorded state,
  and commits the machine's state after it in `state/` (home.tar.gz: working copy and Terraform's
  files; emulator.pickle.gz: everything moto holds; recorded.json: the step's key and the hash of the
  transcript it wrote). The check runs nothing: a key that no longer matches means the step or one
  before it was edited (re-record it and everything after it, in order); a transcript that no longer
  matches its hash was edited by hand. The key hashes the steps (step.json, files, typed commands),
  NOT `scripts/`, so improving the machine forces no re-record. A re-record that differs from the
  file only where `masked()` allows leaves the file alone. `--replay` re-runs everything from scratch
  and compares: use it after upgrading moto, Terraform, the CLI or the patch layer, not to author.
  One recording at a time (port 5000, a machine lock).
- Every terminal is 80 columns: `spine.py` wraps at 80, `ide.ts` draws 80.

## The machine (all in `scripts/`, all in SPIKE.md)

- `toolchain.py` pins Terraform, the AWS provider, AWS CLI, moto/boto3; checksums verified.
- `registry.py` answers `registry.terraform.io` locally from HashiCorp's signed files: `init` prints
  "signed by HashiCorp", the lock file is a learner's, nothing changes when HashiCorp releases.
- `moto_server.py` is moto with the gaps the course meets closed (CloudWatch's CBOR protocol, tags
  sent on create, …) and ids seeded from each request's CONTENT (Terraform's walk order varies run to
  run). Each fix answers as AWS's API reference says AWS answers — never what a frame wants.
  When a fix is needed, find the call with `MATRIX_DEBUG=1`, patch, and prove it with the matrix.
- moto's clock is frozen, so anything it does "after N seconds" never happens: the replay sets
  `MOTO_ACM_VALIDATION_WAIT=-1` (a DNS-validated certificate is issued at once). A typed `sleep N`
  moves the shared clock N seconds on instead of waiting (an SQS visibility timeout then really
  ends, §8.2); the clock goes on from where a step left it (`state/clock`).
- **moto runs no Lambda and no Step Functions task here.** It records functions, event source mappings
  and state machines; `no-poller` stops moto invoking a function (in Docker) inside SendMessage.
  `tools/poll.py` plays the SQS poller and `tools/run_workflow.py` walks the ASL, each with the real
  handler code, and every frame that uses them says so.
- Course 9's patches (all in moto_server.py's docstring): `accounts` (a role session acts in its
  role's account, as on AWS — before it, §9.2's production still acted in development),
  `sqs-keep-policy` (SetQueueAttributes changes only the attributes it names; moto cleared the
  queue's Policy, so sam's console click in §9.6 removed the topic's permission to send); sessions of
  OrganizationAccountAccessRole are not evaluated, like the developer key.
- Courses 10–11's patches: `kinesis-tags` and `backup-tags` (tags sent on create, and Backup's
  ListTags without a trailing slash — both showed as a perpetual diff), `aws-managed` (an AWS-managed
  IAM policy exists when first named), `token-issue-time` (role sessions are evaluated with
  aws:TokenIssueTime; DateLessThan/DateGreaterThan). The emulator does NOT run metric filters,
  evaluate alarms, record CloudTrail events, run Athena queries, inspect WAF requests or take
  backups: the tools that stand in say so, and so does every frame.
- **A fresh machine's plugin cache is filled from the verified provider zip** (`toolchain.terraform()`):
  a restored working copy's `.terraform/providers` links into the cache, and an empty cache made every
  Terraform command in a restored step fail ("Required plugins are not installed") while the step
  still recorded. Read a fresh recording before trusting it.
- `TF_IN_AUTOMATION` is never set: it rewords Terraform's hints, and a learner's terminal lacks it.
- Ids are seeded from a request's CANONICAL content: idempotency tokens dropped and tags sorted by
  key, because the provider sends a tag map in Go's random order (a seed that saw the order gave
  the same subnet two ids on two runs).
- **`FAKETIME_SHARED` must never survive between commands.** libfaketime exports it pointing at a
  per-process semaphore; the replay's `export -p` state carried it into the next command, whose
  tools then failed SILENTLY (an `aws` call printing nothing, about one run in three). Every command
  and `setup` now unsets it, and any `libfaketime:` line in output fails the replay.
- A typed line exactly 80 wide is refused (it reads as wrapped): reword or split it with `\`.
- **IAM is enforced from `secure/03-assume` on**, for every principal but one: env.sh's key is
  alex's, standing for BookShopDeveloper, and is never evaluated (`developer-key` in
  moto_server.py — the replay's machinery, not a fix). So the app's role sessions are really refused
  and allowed; alex is not held to a trust policy (§4.3 says so). moto evaluates identity policies
  only: resource policies, conditions, SCPs and other accounts are doc-cited, and the frame says so.
- **Docker** (`"docker": true` in step.json; `toolchain.docker()`): the daemon pulls Docker Hub's
  official images through `mirror.gcr.io` (Docker Hub rate-limits this machine), and a relay on the
  bridge gateway (`scripts/relay.py`) lets a build step reach the proxy — none of it on screen. Before
  a Docker step the replay removes containers, the shop's images and the build cache: what an
  earlier RECORDING left is not on the learner's machine. Images live in the daemon, not in `state/`,
  so a section that needs an image builds it itself (§6.4 builds and pushes; §6.8 builds 1.1.0).
- **PostgreSQL** (`"postgres": true`; `toolchain.postgres()`): the local PostgreSQL 16 stands in for
  the database RDS would run (the emulator runs none). Its `book_shop` database is machine state:
  dumped into `state/postgres.sql` with every step after it exists, restored with the step.
- **A result that depends on a race** (§7.8: which checkout wins) is read from the transcript by the
  scene, and the narration never names it; the demo is built so the NUMBERS do not depend on it.
- Each typed command is its own shell process: `$!` and a background job do not survive to the next
  line — `cmd & APP=$!` on one line. A quoted string cannot span typed lines either.
- A recorded state pickles every moto backend in one go; what cannot travel (locks, `cryptography`
  keys and certificates) has a reducer in `_Pickler`. A new service that will not pickle fails the
  save with its traceback.
- **A Terraform "hang" is usually moto answering 500**, which the provider retries 25 times with
  back-off. Find the call with `TF_LOG=DEBUG`, moto's traceback by sending its stderr to a file, and
  check the CONFIG first: the org lab's policy had no dependency on the organization, a race that
  fails on AWS too (`org-not-in-use` now answers as AWS does). A stopped recording kills what it left
  running (`leftovers()`); orphaned providers once made runs 3–4× slower.

## Frames

- **IDE frame** (`src/scenes/ide.ts`): python-expense-tracker's template. Fixed columns; the
  terminal shows ≤ `TERMINAL_ROWS` rows — fold with `keep` (lines found by TEXT, never numbers).
  **Every side pane is a diagram** (an edge, plot or table; check-content fails a list) and fills
  ≥ 2/3 of its height (check-render).
- **Map frame** (`src/scenes/map.ts`): the shop's WHOLE final architecture, drawn the AWS way
  (Region dashed, VPC, three dashed AZs, subnets, services, the account's controls). A part not
  built yet is `muted` in place; `BUILT[course]` is what exists; what a section adds is ringed by
  the section's `focus`. Never rename a part. Every map frame shares one fit (check-render).
- **◆ full scene**: a canonical big picture that cannot fit a side pane at ≥ 24px; it carries real
  output (a lab) inside it.
- **Canonical diagrams, not list boxes.** Flows run one direction, centred (`stack: true` items),
  arrows do not cross, a group's heading is never crossed (check-render), an edge label never sits on
  a node. Tables only where rows of data are the point.

## Facts (frozen: frames quote them)

| fact | value |
| --- | --- |
| app | `book-shop` (package `book_shop`), `book-shop.example.com`, books `GET /books/bk-1001` |
| Region | `eu-west-2` (London), AZs a/b/c |
| accounts | development **444455556666** (the course builds here until Course 9), production **111122223333**, audit **777788889999** (role `Auditor`), management **123456789012** |
| organization | root → OU Security (audit), OU Workloads (SCP `LondonOnly`: deny outside eu-west-2 except iam/organizations/sts) → OU Prod (prod), OU Dev (dev) |
| app role | **BookShopApp**, trusted by `ecs-tasks.amazonaws.com`; inline policy `book-shop-app`: ReadBooks (s3:GetObject `books/*`), ListBooks (s3:ListBucket on the bucket); session `task-1` via `tools/as-app.sh` |
| app | `book_shop` (standard library HTTP + boto3), port 8080, `/health`, `/books/<id>`; image `book-shop` 1.0.0 → 1.1.0 (graceful SIGTERM), python:3.13-slim pinned by digest, `requirements.txt` locked; ECR `book-shop` (immutable tags) |
| ECS | cluster `book-shop`, service `book-shop` (Fargate, desired 3, app subnets, sg app, target group book-shop-app), task definition `book-shop` 0.5 vCPU / 1 GiB X86_64, execution role BookShopExecution, task role BookShopApp, log group `/book-shop/app` (30 d), stopTimeout 30; scaling 3–12 at 60% CPU, cooldowns 60/300 |
| data | catalog versioned (old versions 30 d), HttpsOnly; bk-1001 price 12.99 → 10.99; uploads bucket `book-shop-uploads-444455556666` (private, CORS from book-shop.example.com, presigned PUT 300 s, `reviews/bk-1001/r-77.jpg`, 676 bytes); RDS `book-shop-orders` PostgreSQL 16.9 db.t4g.micro Multi-AZ (2a primary, 2b standby), user `shop`, managed secret; secret `book-shop/payments-api-key` (value by hand); DynamoDB `book-shop-carts` (customer + book, TTL `expires`), `book-shop-stock` (book); local orders: books bk-1001 (40) and bk-1002 (1, "A Field Guide to Rain", 8.50) |
| peak model | one task = 100 req/s at full CPU, 2 min to start, alarm after 3 min above target; 120 → 420 req/s 17:45–18:00: CPU peaks 87%, settles at 7 tasks |
| catalog | `books/bk-1001.json`: "Night Trains of Europe", Ana Lima, 12.99 GBP, stock 40; bucket policy AuditorReads (GetObject, ListBucket for the Auditor role) |
| people | **alex** (developer), **sam** (teammate); Identity Center session `book-shop`, portal `https://book-shop-example.awsapps.com/start`; roles BookShopDeveloper (dev), BookShopReadOnly (prod) |
| buckets | `book-shop-catalog-444455556666`; state `book-shop-tfstate-444455556666`, key `book-shop/terraform.tfstate`, `use_lockfile` |
| tags | default: `app = book-shop`, `env = dev`, `managed-by = terraform` |
| budget | `book-shop-dev-monthly`, 20 USD, 80% forecast → alex@book-shop.example.com |
| VPC | `book-shop` 10.20.0.0/16; public 10.20.0–2.0/24, app 10.20.10–12.0/24, data 10.20.20–22.0/24; the account's default VPC 172.31.0.0/16 is not used |
| routes | tables `public` (local, 0.0.0.0/0 → igw) and `private` (local, 0.0.0.0/0 → nat-a, S3 prefix list → gateway endpoint) |
| NAT | ONE, `nat-a` in public-a (dev: a cost trade; production one per AZ) |
| security groups | `alb` 443, 80 from anywhere → `app` 8080 from alb → `db` 5432 from app; NACL `data`: 5432 in from 10.20.8.0/21, 1024–65535 out |
| load balancer | `book-shop`, internet-facing, 3 public subnets; target group `book-shop-app` HTTP 8080 ip, /health every 10 s, 3 in / 2 out, 30 s draining; 80 → 301 HTTPS, 443 TLS13-1-2-2021-06 |
| DNS / TLS | zone book-shop.example.com, alias A → the ALB; ACM certificate, DNS-validated |
| payments API | 198.51.100.7 (documentation range) |
| checkout events | queue `book-shop-fulfilment` (visibility 30 s, 4 d) → DLQ `book-shop-fulfilment-dlq` after 3 receives (14 d); order 999 has no books; function `book-shop-fulfil` (python3.13 arm64, 256 MB, 20 s, role BookShopFulfil), mapping batch 10 / 5 s, ReportBatchItemFailures |
| fan-out | SNS `book-shop-orders` → fulfilment, `book-shop-loyalty`, `book-shop-fraud-check` (body filter total ≥ 500), raw delivery; orders 6 (c-20, 21.98) and 7 (c-21, 50 × bk-1001, 549.50) |
| event bus | `book-shop`; rules `uk-vat` (book-shop.checkout, OrderPlaced, country GB) → `book-shop-vat`, `refunds` (book-shop.returns, RefundRequested) → `book-shop-refunds`; samples: order 8 GB, order 9 FR, refund for order 4 |
| workflow | `book-shop-checkout`: ReserveStock → ChargePayment (retry PaymentTimeout 2 s × 2.0, max 2; catch all → ReleaseStock → OrderFailed) → ShipOrder; functions book-shop-reserve/charge/ship/release (role BookShopCheckoutSteps), state machine role BookShopCheckoutFlow; order 10 times out twice then pays at 6 s, order 11 declined |
| idempotency | table `book-shop-idempotency` (key, TTL `expires` 7 d), key `fulfil#<order>`; order 12 sent twice |
| clock | 2026-11-02 09:30:00 UTC (the spine's default) |
| modules | `infra/modules/network` (inputs `name`, `cidr`; 27 resources moved, plan 0 / 0 / 0), `infra/modules/pipeline` |
| production | account 111122223333, root `infra/envs/prod`, VPC 10.40.0.0/16, state `book-shop-tfstate-111122223333` (made by `infra/envs/prod/state`, local state), reached through OrganizationAccountAccessRole (profile `book-shop-prod-admin`; sessions not evaluated) |
| pipeline | repository `book-shop-example/book-shop`; GitHub OIDC provider `token.actions.githubusercontent.com` (audience `sts.amazonaws.com`) and role **BookShopPipeline** in both accounts: dev trusts `main` and pull requests, prod only `environment:production`; permissions: the shop's services and roles named `BookShop*`; `.github/workflows/infra.yml` jobs check, plan-dev, apply-dev, apply-prod (environment `production`); not run on GitHub |
| drift | sam (off screen): fulfilment visibility 30 → 60 s, `book-shop-returns` made by hand (4 d); the plan puts 30 back and imports returns (max size 1 MiB → 256 KiB) |
| replacement | `book-shop-loyalty` → `book-shop-points`: queue, queue policy and subscription `create_before_destroy`, the subscription `depends_on` the policy; orders DB `prevent_destroy` (`plan -replace` refused) |
| release model | 1.2.0 fails 2% of requests, alarm after 2 min, 420 req/s: failed requests all at once 1008, rolling (1 task of 7 a minute) 216, canary (10%) 101 — a model, labelled |
| lake | bucket `book-shop-lake-444455556666` (private); `order_history/dt=<day>/orders.parquet`, schema order_id int32, customer, book, quantity int32, price decimal(8,2), placed timestamp UTC, zstd; orders get `placed` (migration 002) |
| September | MADE UP, seeded 12: 30,000 orders (1,000 a day, 400 customers, books bk-2001 … bk-2020, 1–3 lines), 2,048,716.45 GBP, 60,179 order lines, 30 files, 588 KiB |
| catalog | Glue database `book_shop_lake`, table `order_history` (EXTERNAL, Parquet, partition key `dt`, projection `date` yyyy-MM-dd from 2026-09-01) |
| Athena | workgroup `book-shop-reports` (results `athena-results/`, 1 GiB scan cutoff); the emulator records queries, never runs them; DuckDB runs `reports/yesterday.sql` over a copy (`lake/`): top bk-2018 199 copies 5,104.35 GBP, files read 1/30 |
| clicks | Kinesis `book-shop-clicks`, 2 shards, 24 h; 1,000 made-up clicks from 50 sessions (seed 10): 596 / 404, none split; lag model: 600 clicks/s per consumer, peak 1,600/s at 18:30, 2 shards up to 400 s behind, 4 shards none |
| evening | MADE UP, seeded 11: 1 November 18:00–18:59, 200 requests a minute, payments down 18:20–18:34 → 12,000 requests, 396 errors, worst 18:22 (33 of 200); metrics `BookShop/Requests`, `BookShop/Errors5xx` |
| SLO | 99.5% of requests over 30 days; alarms `book-shop-burn-fast` (0.072, 5 min, 14.4×) and `book-shop-burn-slow` (0.03, 1 h, 6×) → SNS `book-shop-alerts` → alex@book-shop.example.com; last night: fast ALARM 18:20, 18:25, 18:30; the hour 3.3%, 6.6× |
| trail | `book-shop-audit`, multi-Region, global events, log file validation → `book-shop-trail-444455556666` |
| key | KMS `alias/book-shop-data` (rotation, 30-day deletion window; the account administers, BookShopApp uses); lake SSE-KMS with a bucket key; envelope: 256-bit data key, 67 bytes of data, 96 bytes of encrypted key |
| WAF | web ACL `book-shop` (REGIONAL) on the ALB: `aws-common` (AWSManagedRulesCommonRuleSet, priority 0), `per-address` (1,000 / 5 min per IP, block, priority 1) |
| backup | vault `book-shop` (our key); plan `book-shop-nightly` (cron 0 3 * * ? *, 35 d) + copy to `arn:aws:backup:eu-west-2:777788889999:backup-vault:book-shop-copies` (90 d); selection DB, carts, stock; role BookShopBackup (AWSBackupServiceRolePolicyForBackup) |
| incident | 2 November 21:14 (step clock): leaked BookShopApp session `task-1`; inline `AWSRevokeOlderSessions` Deny * if aws:TokenIssueTime < 21:15; applied 21:16 |
| CDN | CloudFront `book-shop` → the ALB (https-only, TLSv1.2), default certificate; `book-shop-pages` (0 / 60 / 300 s), `/checkout*` → `book-shop-never` (all methods); latency model: Sydney 280 ms to London, 15 ms to an edge, 310 ms without a CDN |
| knee | one task, 10 ms mean service, seeded 7, 20,000 requests a load: p99 105 ms at 60% busy, 215 at 80%, 670 at 95% |
| bill | HYPOTHETICAL rates, production, 730 h: 234.19 USD a month (Fargate 73.00, NAT 42.50, RDS 26.28 …); a 1-year commitment on Fargate and RDS saves 22.48 (10%) |
| October | MADE UP, seeded 21: prod 213.15 USD, dev 99.32; dev passed its 20 USD budget on 7 October; dev NAT 3.22 (4.5×) on 21 and 2.73 (3.8×) on 22 October; cost allocation tags `app`, `env` active |
| decision | `docs/adr/001-order-platform.md`: stay on RDS PostgreSQL (35 of 40), Aurora Serverless v2 30, DynamoDB only out (reports' SQL); revisit at 10× the orders |

Extend this table; never change a value a frame already quotes.

## Narration

Flowing prose, 90–120 s, walking the frame; ends with a one-line bridge. Written for the speech
engine: acronyms spelled ("A W S", "S three", "I A M", "V P C", "C L I", "S D K", "A P I"), account ids
digit by digit in groups, prices as words. Never reads code aloud character by character.

## Invariants

- Never write `x`/`y`; scenes are declarative.
- Stylesheets in order: graphl-flow, shell, `./theme.css` last.
- No `file:` installs committed.
- Narration: `.tts` → `.wav` via Colab + Chatterbox only. Audio at `public/audio/<course>/<id>.wav`.
- Every emulated pane says so; nothing emulated is presented as AWS's own output.
