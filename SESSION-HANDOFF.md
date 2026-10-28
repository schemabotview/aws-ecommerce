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

- graphl-flow 0.6.0 is on graphl-flow's `main`, not yet on npm: in `../graphl-flow` `npm pack`, then install that
  tarball into `node_modules` here **without saving**; no lockfile committed (see CLAUDE.md).
- `scripts/toolchain.py` fetches the CLI, Terraform, provider and the Python tools into
  `.spine-cache/` (gitignored) on first use. Docker and PostgreSQL 16 are started by the toolchain.
- Never `pkill -f` (it matches its own shell). Kill recorder PIDs by
  `ps -eo pid,args | awk '$2 ~ /python3/ && $3=="scripts/spine.py" {print $1}' | xargs -r kill`,
  then `python3 -c "import sys;sys.path.insert(0,'scripts');import spine;spine.leftovers()"`.
- Recording is slow (Terraform refreshes ~120 resources): run `--record` in the background, several
  steps in ONE invocation (`--record deliver/06 deliver/07`), and do other work meanwhile.

## Done and pushed

Courses 3–9 complete (scenes, narration, recorded spine, checks green, shots looked at): 61 sections
render cleanly. Course 9 notes: deliver/06–07 re-recorded after `sqs-keep-policy`; 07's topic.tf
gained `create_before_destroy` on the subscription and queue policy and `depends_on` the policy (the
first recording showed the old subscription destroyed before the new one existed). A fresh machine's
empty Terraform plugin cache broke every restored step — fixed in `toolchain.terraform()`.

## Course 10 `report` — drafted, not recorded

`spine/report/02-export/project/` copied from `deliver/07-replace` (RE-COPY: 07's topic.tf changed) with: `db/migrations/002_placed.sql`
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
