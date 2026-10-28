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

Courses 3–11 complete (scenes, narration, recorded spine, checks green, shots looked at): 76 sections
render cleanly. See CLAUDE.md for the facts and the patches each course needed.

## Course 12 `evolve` — in progress

Recorded: `evolve/02-cdn` (CloudFront in front of the ALB: pages cached ≤ 5 min, checkout never),
labs `02-latency` (CDN model), `03-knee` (queue simulation), `04-bill` (HYPOTHETICAL rates). Still to
write: `05-costs` (cost allocation tags + a spend anomaly from a made-up month), `06-adr`
(docs/adr/001-order-platform.md + a scoring tool), the six scenes, narration, docs.

## Courses 1, 2 — not started

## Machine changes made this session (all committed)

- `scripts/spine.py`: a typed `sleep N` advances the frozen clock (no real wait); the clock carries
  between steps via `state/clock`; restore starts PostgreSQL before dropping/creating `book_shop`.
- `scripts/moto_server.py` patches: `no-poller`, `visible-at`, `events-test-pattern`, `accounts`,
  `sqs-keep-policy`; OrganizationAccountAccessRole sessions not evaluated; `_Pickler` handles
  WeakValueDictionary and `defaultdict(lambda: …)`.
