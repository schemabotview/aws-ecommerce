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

Courses 3–10 complete (scenes, narration, recorded spine, checks green, shots looked at): 67 sections
render cleanly. Course 9: deliver/06–07 re-recorded after `sqs-keep-policy`; 07's subscription and
queue policy are `create_before_destroy` and the subscription `depends_on` the policy. Course 10: the
lake (Parquet with a FIXED schema), Glue with partition projection, Athena recorded + DuckDB run
(`files read: 1/30`), Kinesis (596 / 404), the lag lab. pyarrow and duckdb pinned in
`spine/requirements.txt`.

## Course 11 `operate` — in progress

Spine `operate/02-logs` … `08-incident` written (02–04 recorded). New machine patches:
`kinesis-tags`, `token-issue-time` (§11.8 revokes sessions issued before 21:15 — check the
transcript: the leaked session refused, the fresh one allowed). The emulator does NOT run metric
filters, evaluate alarms, or record CloudTrail events (`lookup-events` is not implemented): the
tools `count_errors.py` and `burn.py` do what CloudWatch would, and say so. §11.1 and §11.9 are
concept scenes. Scenes, narration and docs for Course 11 still to write.

## Courses 12, 1, 2 — not started

## Machine changes made this session (all committed)

- `scripts/spine.py`: a typed `sleep N` advances the frozen clock (no real wait); the clock carries
  between steps via `state/clock`; restore starts PostgreSQL before dropping/creating `book_shop`.
- `scripts/moto_server.py` patches: `no-poller`, `visible-at`, `events-test-pattern`, `accounts`,
  `sqs-keep-policy`; OrganizationAccountAccessRole sessions not evaluated; `_Pickler` handles
  WeakValueDictionary and `defaultdict(lambda: …)`.
