# Session handoff — aws-ecommerce (2026-10-28)

Read `CLAUDE.md`, `COURSE-PLAN.md` and `SPIKE.md` first. This file says only where the work stands and
what to do next. Branch: **`claude/pensive-johnson-ixdglh`** (same name in `graphl-flow`).

## The owner's standing request

"Continue course by course, complete all courses. Am stepping away, will review at the end." Author
Courses **9, 10, 11, 12, then 1 and 2**, autonomously. For each course: spine steps recorded once,
scenes, narration, map `BUILT` update, COURSE-PLAN table, CLAUDE.md status and facts, the checks,
shots that you LOOK at, then commit and push. Report at the end: what was built, verified, left out.

Constraints: do not publish graphl-flow 0.6.0, open moto PRs or create PRs without the owner's
approval. No model names in commits. Commit trailer used so far:
`Co-Authored-By: Claude …` plus the session link. Push: `git push -q origin claude/pensive-johnson-ixdglh`.
Downloading new external binaries (actionlint) was refused by the permission classifier: do not
add tools that fetch binaries; pip packages from `spine/requirements.txt` are the only route.

## Setting up a fresh machine

- graphl-flow 0.6.0 is not on npm: in `../graphl-flow` (same branch) `npm pack`, then install that
  tarball into `node_modules` here **without saving**; no lockfile committed (see CLAUDE.md).
- `scripts/toolchain.py` fetches the CLI, Terraform, provider and the Python tools into
  `.spine-cache/` (gitignored) on first use. Docker and PostgreSQL 16 are started by the toolchain.
- Never `pkill -f` (it matches its own shell). Kill recorder PIDs by
  `ps -eo pid,args | awk '$2 ~ /python3/ && $3=="scripts/spine.py" {print $1}' | xargs -r kill`,
  then `python3 -c "import sys;sys.path.insert(0,'scripts');import spine;spine.leftovers()"`.
- Recording is slow (Terraform refreshes ~120 resources): run `--record` in the background, several
  steps in ONE invocation (`--record deliver/06 deliver/07`), and do other work meanwhile.

## Done and pushed

Courses 3–8 complete (scenes, narration, recorded spine, checks green, shots looked at).
Course 8 commit: `249d961`. Checks at that point: 53 sections render cleanly.

## Course 9 `deliver` — in progress

Spine (`spine/deliver/`), all from `decouple/08-once`:

| step | state |
| --- | --- |
| 02-modules | recorded ✓ (network → `infra/modules/network`, `moved` blocks, plan 0/0/0) |
| 03-envs | recorded ✓ (`infra/envs/prod` + `envs/prod/state`, prod VPC 10.40 in 111122223333) |
| 04-pipeline-role | recorded ✓ (`modules/pipeline`: GitHub OIDC + BookShopPipeline in both accounts) |
| 05-checks | recorded ✓ (`.github/workflows/infra.yml`, `tools/jobs.py`, fmt/validate/plan locally) |
| 06-drift | **re-record** — session.txt holds typed lines only; old `state/` is stale |
| 07-replace | **re-record** — same |
| 08-release | recorded ✓ (lab: `release_model.py`, 1008 / 216 / 101 failed requests) |

Why 06/07 must be re-recorded: the first recording showed a moto defect — `SetQueueAttributes`
(sam's off-screen visibility change in 06's `setup`) wiped the queue's Policy. Fixed by the new
`sqs-keep-policy` patch in `scripts/moto_server.py` (uncommitted before this handoff; now committed).
Next: `python3 scripts/spine.py --record deliver/06 deliver/07` and check:
- 06 plan should show: fulfilment `visibility_timeout_seconds 60 -> 30`, returns queue imported
  (+ `max_message_size 1048576 -> 262144`: the CLI's default differs from Terraform's — keep it,
  narrate it), and NO `aws_sqs_queue_policy.from_topic["fulfilment"] will be created`.
- 07: loyalty queue renamed `book-shop-points` with `create_before_destroy` (+/-), then
  `terraform plan -replace=aws_db_instance.orders` → `Error: Instance cannot be destroyed`.

Scenes (`src/scenes/deliver/`) written: `files.ts`, `modules.ts`, `envs.ts`, `pipeline.ts` (◆),
`pipeline-role.ts`, `checks.ts`, `release.ts` (◆). **Still to write:** `drift.ts` (§9.6: config ≠
state ≠ real, reconciled; editor `infra/returns.tf`), `replace.ts` (§9.7: both replace orders on a
timeline; editor `infra/topic.tf` lifecycle), `index.ts` registry (ids `deliver-modules`,
`deliver-envs`, `deliver-pipeline`, `deliver-pipeline-role`, `deliver-checks`, `deliver-drift`,
`deliver-replace`, `deliver-release`), then register `deliverScenes` in `src/scenes/index.ts`.

Narration (`src/content/deliver/index.ts`): sections 1–5 and 8 written; add 6 (drift and import) and
7 (replacement and protecting state), put them in order in `sections`, register `deliver` in
`src/content/index.ts`. Section order: modules, two-environments-two-accounts, a-delivery-pipeline,
a-role-for-the-pipeline, checks-before-apply, drift-and-import, replacement-and-protecting-state,
releasing-a-new-version.

Then: `BUILT.deliver` in `src/scenes/map.ts` (= decouple's; Course 9 adds nothing to the dev map —
or add nothing), COURSE-PLAN Course 9 table updated to what was built, CLAUDE.md status + facts
(prod VPC 10.40.0.0/16, prod state bucket `book-shop-tfstate-111122223333`, roles
`BookShopPipeline` in both accounts with their subjects, repo `book-shop-example/book-shop`,
returns queue, loyalty → `book-shop-points`, prevent_destroy on the DB, release model numbers),
plus the new moto patches (`accounts`, `sqs-keep-policy`, OrganizationAccountAccessRole sessions
not evaluated — already in the moto_server.py docstring).

Checks: `npx tsc --noEmit && node scripts/check-content.mjs && node scripts/check-render.mjs`
(~2 min), `python3 scripts/spine.py` (check:spine), `npm run build`, `npm run shots -- deliver`
then look (downscale PNGs with PIL to ~1600 px to view). Typical fixes: editor > 23 rows → `show`;
terminal > 13 rows → `keep`; "edge label sits on a node" → drop the label; side pane < 2/3 full →
add a table row or a note.

## Course 10 `report` — drafted, not recorded

`spine/report/02-export/project/` copied from `deliver/07-replace` with: `db/migrations/002_placed.sql`
(orders get `placed`), `jobs/seed_september.py` (30,000 made-up orders, seed 12 — say so on screen),
`jobs/export_orders.py` (Parquet per day to `book-shop-lake-444455556666/order_history/dt=…/`),
`infra/lake.tf`. **No step.json/session.txt yet**, and it must be re-copied over 07-replace's final
project if 07 changes. It needs **pyarrow** (and duckdb for §10.4): add pinned versions to
`spine/requirements.txt` (this rebuilds the tools venv — never while a recording runs).
Plan for the rest of Course 10 (from `spike/terraform-on-moto/cases/10-glue-athena-kinesis.tf`):
§10.3 Glue database/table with partition projection; §10.4 Athena workgroup (moto records, does not
run queries) + the same SQL in DuckDB, labelled; §10.5 Kinesis `book-shop-clicks`, 2 shards, records
→ shard by key, a lag model plot; §10.1 and §10.6 concept scenes.

## Courses 11, 12, 1, 2 — not started

Every resource they need applies on moto (`spike/terraform-on-moto/MATRIX.md`; only ElastiCache
fails). Ideas noted: §11 KMS envelope encryption is real in moto; CloudTrail records nothing in moto
(use an example record, labelled); Backup selections via the `backup-sel` patch. Course 1 §1 "the
finished shop takes an order" can be a step at the END of the chain (from the last evolve step).

## Machine changes made this session (all committed)

- `scripts/spine.py`: a typed `sleep N` advances the frozen clock (no real wait); the clock carries
  between steps via `state/clock`; restore starts PostgreSQL before dropping/creating `book_shop`.
- `scripts/moto_server.py` patches: `no-poller`, `visible-at`, `events-test-pattern`, `accounts`,
  `sqs-keep-policy`; OrganizationAccountAccessRole sessions not evaluated; `_Pickler` handles
  WeakValueDictionary and `defaultdict(lambda: …)`.
