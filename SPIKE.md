# Spike: can the course run on Terraform + moto? (2026-10-28)

Build order step 2 of `COURSE-PLAN.md`. No course content: only the machine the content will be
replayed on, and the engine features its diagrams need. **Verdict: yes.** 30 of the 31 resource
families the plan names apply, re-plan with **No changes** and destroy on the emulator; the 31st,
ElastiCache, makes one section (7.9) `planned`. Ten moto gaps are closed by a documented patch layer;
`terraform init` prints exactly what a learner's prints, offline; and a four-step cumulative chain
replays identically run after run, with mutations of it caught.

## 1. The toolchain (`scripts/toolchain.py`)

Pinned, fetched once into `.spine-cache/`, each archive checked against its publisher's SHA256SUMS:

| tool | pin |
| --- | --- |
| Terraform | 1.17.0 |
| hashicorp/aws | 6.70.0 |
| AWS CLI v2 | 2.38.4 |
| moto (server) | 5.2.5 (5.2.4 → 5.2.5 changed none of the results) |
| boto3 / botocore | 1.43.117 |

**The registry stand-in (`scripts/registry.py`).** This environment cannot reach
`registry.terraform.io` (the agent proxy refuses it), and even where it can, `~> 6.70` would resolve
to whatever 6.x is newest on the day — every transcript would change with HashiCorp's next release.
A filesystem mirror was tried first and rejected: `init` then prints `(unauthenticated)` and a
"Incomplete lock file information" warning, and writes a lock file with one platform's hash — none
of which a learner sees. So the replay's HTTPS proxy answers CONNECT for exactly
`registry.terraform.io` and `releases.hashicorp.com` (local CA, trusted through `SSL_CERT_FILE` for
the replay's processes only), and serves the provider registry protocol for the ONE pinned version
from HashiCorp's own published SHA256SUMS, its signature and HashiCorp's public key. Terraform
verifies the real signature. Result, offline and byte-for-byte a learner's:

```
- Finding hashicorp/aws versions matching "~> 6.70"...
- Installing hashicorp/aws v6.70.0...
- Installed hashicorp/aws v6.70.0 (signed by HashiCorp)
```

and a `.terraform.lock.hcl` with the `h1:` hash plus 15 `zh:` hashes, one per platform.

**Reaching the emulator.** `env.sh` (on screen) sets `AWS_ENDPOINT_URL`. That is not enough for the
Go SDK: S3 is addressed virtual-host style (`<bucket>.localhost:5000`) and S3 Control by account
(`<account>.localhost:5000`), which do not resolve. The replay (off screen, "about the machine")
sets `HTTP_PROXY` to moto itself — moto routes on the Host header, so every name lands. No
`s3_use_path_style` or `endpoints {}` block ever appears in the learner's Terraform.

## 2. The support matrix (`spike/terraform-on-moto/`)

31 cases, one per resource family the plan uses, each: fresh moto → `init` → `apply` → a second
`plan` that must say **No changes** (or moto is not returning what the provider wrote — the failure
mode that would make every later section show a phantom diff) → `destroy`. Full table:
`spike/terraform-on-moto/MATRIX.md` (generated). Run it with
`python3 spike/terraform-on-moto/matrix.py [case-prefix …]`.

| result | cases |
| --- | --- |
| apply ok, re-plan **clean**, destroy ok | **30** |
| fails: ElastiCache replication group | 1 |

Before the patch layer (§3), the same run gave 22 clean, 2 perpetual diffs, 4 failures and 5 hangs.

**What decides each section's level:**

| plan section(s) | resource | level |
| --- | --- | --- |
| 7.9 cache for book pages | ElastiCache replication group | **`planned`** — moto lists one member cluster whatever `num_cache_clusters` says, drops the security groups, and has no default engine version; patching it would mean writing the service. The plan is shown; the stale-window behaviour is a lab (it always was) |
| everything else in the plan | see MATRIX.md | `emulated` (applied, re-planned clean, destroyed) |

## 3. The moto patch layer (`scripts/moto_server.py`)

moto's server, started through a wrapper that closes the gaps the pinned provider meets (and gives
ids that do not depend on request order — §4). Each fix
makes moto answer the way AWS's API reference says AWS answers (never what a frame wants), each is
named and explained in the file's docstring, and each is written so it can go upstream; when a
pinned moto release has one, delete it here — the matrix is the test.

| fix | gap | found by |
| --- | --- | --- |
| `cbor` | **CloudWatch now speaks Smithy RPC v2 CBOR** to the Go SDK; moto speaks only query. A WSGI bridge decodes CBOR, re-encodes the call with botocore's own query serializer (the service model lists both protocols), and turns moto's XML answer back into CBOR with botocore's own CBOR serializer | 11-logs-alarms: `decode argument: unexpected minor value 28` |
| `s3-create-tags` | provider 6.x sends tags inside `CreateBucket`; moto dropped them → perpetual diff on every tagged bucket | 03-s3-bucket-tags |
| `sqs-redrive` | `RedrivePolicy` returned as spaced JSON; AWS returns it compact → perpetual "whitespace changes" | 08-sqs-dlq |
| `athena-tags` | untagged workgroup: AWS returns no tags, moto returned 400 | 10-glue-athena-kinesis |
| `aas-tags` | Application Auto Scaling tag operations missing (ECS service scaling) | 06-ecr-ecs-fargate |
| `budgets-subs` | Budgets `DescribeSubscribersForNotification`, tag operations | 03-budget |
| `sfn-validate` | Step Functions `ValidateStateMachineDefinition` (answers OK without validating — `check:aws` validates the ASL), `ListStateMachineVersions` | 08-step-functions |
| `backup-sel` | AWS Backup selections | 11-backup |
| `ce-tags` | Cost Explorer cost-allocation tag status | 12-cost-allocation-tag |
| `cf-cache` | CloudFront cache policies (no route at all), and a distribution reporting `ForwardedValues` / `SSLSupportMethod` it was never given | 12-cloudfront |

A missing operation does not fail fast: the provider retries a 500 for minutes, so the matrix
times an apply out at 240 s and reports `HANG`; `MATRIX_DEBUG=1` logs every SDK call, which is how
each gap above was named.

## 4. The spine (`scripts/spine.py`) — proven on a three-step chain

`scripts/spine.py` is python-expense-tracker's cumulative spine (`first` / `from` + `changes` /
`lab`, every undeclared difference fails) merged with aws-ct's emulator machinery (fresh moto per
step, frozen clock, endpoint rewrite, pane-width wrapping, IAM enforcement), plus what Terraform
needs. The proof chain is `spike/spine-chain/start/` (run it with
`SPINE_ROOT=spike/spine-chain python3 scripts/spine.py`):

| step | changes | the session shows |
| --- | --- | --- |
| 01-first-bucket (`first`) | — | `terraform init` (signed by HashiCorp), `apply`: one bucket |
| 02-versioning | `infra/s3.tf` | `plan` showing ONLY the versioning resource — the bucket already exists, because the replay applied 01's code first, silently; `apply`; the CLI reading it back |
| 03-destroy | `infra/s3.tf` | `force_destroy`, then `destroy` of a bucket holding an object (put by `setup`) |
| 04-network | `infra/network.tf` | a VPC and 9 subnets applied; `terraform output` of their ids |

**Derived state works.** No step lists how to rebuild the cloud it starts from: `apply_parent`
applies the parent step's Terraform (each `roots` entry, in order) to the fresh emulator and hands
its state to the step. 33 hand-written setup lists in aws-ct become zero.

**The lock file belongs to the step whose `init` wrote it.** 01 captures
`infra/.terraform.lock.hcl`; a child may then hold that file undeclared, byte for byte (anything
else in it would still have to be declared).

**Determinism — one real problem found and fixed.** With the CLI and Python the frozen clock and
moto's seeded random stream are enough. With Terraform they are not: even at `-parallelism=1`
Terraform walks independent resources in a different order on each run, so the seeded stream gave
each of the 9 subnets a different subnet's id every replay. Fix: moto's random stream is re-seeded
before each request from the request's own content (minus client-invented idempotency tokens) and
its repeat count (`ids` in `scripts/moto_server.py`), so an id is a function of its resource's
declaration. Three timing-dependent things remain in an apply and are compared accordingly
(`masked()`): elapsed-time counters (masked), whether a "Still creating… [10s elapsed]" line
appears (dropped), and the order of concurrent progress lines (compared as a set). Every id, plan
line and summary is compared exactly; the frame shows the recorded run's real order.

**Proven by:** three consecutive check runs of the chain, 0 problems; and mutations, each caught —
an undeclared edit to `providers.tf` (fails 02 and 03's lineage), a tampered output value
(`"Enabled"` → `"Suspended"`), and one subnet id replaced in 04's transcript. A changed elapsed time
("after 7s") is, correctly, not a failure.

**Not yet exercised** (the pilot will): `roots` with the S3 backend (the matrix proves the backend
and its lock file; the chain does not yet move state into it), `enforce_iam`, `venv`, and IDE-pane
widths.

## 5. The engine (`graphl-flow` 0.6.0, branch `claude/pensive-johnson-ixdglh`)

- **17 more AWS service tiles** (ecs, fargate, ecr, elb, route53, cloudfront, waf, cloudtrail, acm,
  backup, organizations, ssm, budgets, costexplorer, identitycenter, xray), **AWS's group marks**
  (region, account, publicsubnet, privatesubnet, autoscaling) and a new **`AWS_RESOURCE`** set of
  single-colour glyphs for the parts inside a service (alb, natgateway, igw, vpcendpoint, router,
  sts, iamrole, permissions, ecstask, ecsservice, container, bucket, queue, message, topic,
  hostedzone).
- **`dashed: true` on a group** — a boundary that is a place (a Region, an AZ), drawn the way AWS
  draws it. Border style only, so dashing moves nothing.
- Fixtures `group-dashed` (Region → VPC → three dashed AZs → public/app subnets) and
  `icons-aws-resource`; `npm run check` passes (every fixture, both themes, 4K); build and
  `tsc` clean. **Not published**: the release steps (tarball smoke test, `npm publish`) are the
  owner's call.

## 6. What changes in the plan

- Stack pins as in §1; `planned` is needed for ONE section (7.9), not the many the plan feared.
- The replay rules in "The spine" are now facts, not hopes: the registry stand-in, `HTTP_PROXY`,
  content-seeded ids, the progress-line comparison, derived state.
- A Terraform apply is long on screen (a one-bucket apply is ~50 lines at 84 columns). Frames
  will mostly show `plan` (sorted, deterministic, the teaching moment) and fold an apply to its
  summary — a scene choice, not a replay one.

## 7. Open for the owner

1. **Publish graphl-flow 0.6.0** (tarball smoke test, then `npm publish`) — the repo scaffold
   needs it from npm.
2. **Upstream the moto fixes.** Ten PRs to getmoto/moto would let the patch layer shrink to nothing.
   I have not opened any: that is an outward-facing action for you to approve.
