# CLAUDE.md — aws-ecommerce

> Workspace rules, pipeline and standard commands: `../CLAUDE.md`. Source of truth:
> `COURSE-PLAN.md` (courses, sections, frames, the spine, and the frozen **Facts** table that frames
> quote). This file is only what is true HERE.

## Identity

| | |
|---|---|
| teaches | AWS, by building a book shop, `book-shop`, declared in Terraform: an empty account → a networked, containerised shop with an asynchronous checkout, a reporting lake and production controls |
| cast | alex (developer), sam (teammate) — see COURSE-PLAN, "Facts" |
| reference repo | **python-expense-tracker** (IDE frame, checks). Replaces `aws-ct` (re-authored from scratch; nothing carried over but its method) |
| engine / shell | graphl-flow 0.11.0, shell 1.1.0, pinned exactly (frame v2, COURSE-PLAN "Decided (2026-11-08)"). **`package-lock.json` is committed**: use `npm ci`. |
| toolchain | `scripts/toolchain.py` pins Terraform, the AWS provider, AWS CLI, moto/boto3 (checksums verified) and fetches them into `.spine-cache/` (gitignored) on first use; Docker and PostgreSQL 16 are started by the toolchain. **`SPIKE.md`** is why the machine is built this way (Terraform on moto, the registry stand-in, the moto patch layer, determinism): read it before touching `scripts/` |
| frames | IDE (`src/scenes/ide.ts`), map (`src/scenes/map.ts`), ◆ full scenes |

## Status

Authored 2026-10-28/29, awaiting owner review: ALL 12 courses, 92 sections — Course 1 `intro` (3),
Course 2 `how-aws-runs` (7), 3 `start` (8), 4 `secure` (8), 5 `network` (10), 6 `run` (9), 7 `data`
(9), 8 `decouple` (9), 9 `deliver` (8), 10 `report` (6), 11 `operate` (9), 12 `evolve` (6). One chain:
`start/02` → … → `secure/07` → `network/02` → … → `run/08` → `data/02` → … → `data/08` →
`decouple/02` → … → `decouple/08` → `deliver/02` → … → `deliver/07` → `report/02` → … → `report/05`
→ `operate/02` → … → `operate/08` → `evolve/02-cdn` → `05-costs` → `06-adr` → `intro/01-order` (§1.1
is recorded LAST: it shows the finished shop). Labs stand alone: `how-aws-runs/*`, `intro/02-demand`,
`deliver/08`, `report/05-lag`, `evolve/02-latency`, `03-knee`, `04-bill` and the earlier ones.
The audio manifest `scripts/audio-manifest.json` lists all 92 for the Colab pass: run
`npm run gen:audio` again after ANY narration edit, or the audio and the text drift apart.

**Recorded and packaged 2026-10-29.** All 92 wavs are in `public/audio/` (Colab + Chatterbox,
pushed to `main` as it generated them) and all 92 sections are captured at 3840×2160: twelve course
videos in `scripts/out/<course>.mp4` (2 h 17 min in total) and the single film,
`scripts/out/film.mp4`, 2:16:37. Covers and descriptions are in `output/`. The segment cache
`scripts/segments/` is what makes re-recording ONE section cheap - keep it; `scripts/.tmp/` is
intermediates and can be deleted.

| # | course | sections | status |
|---|---|---|---|
| 1 | `intro` | 3 | authored, narrated, recorded 4K (§1.1 recorded last) |
| 2 | `how-aws-runs` | 7 | authored, narrated, recorded 4K |
| 3 | `start` | 8 | authored, narrated, recorded 4K (pilot) |
| 4 | `secure` | 8 | authored, narrated, recorded 4K |
| 5 | `network` | 10 | authored, narrated, recorded 4K |
| 6 | `run` | 9 | authored, narrated, recorded 4K |
| 7 | `data` | 9 | authored, narrated, recorded 4K |
| 8 | `decouple` | 9 | authored, narrated, recorded 4K |
| 9 | `deliver` | 8 | authored, narrated, recorded 4K |
| 10 | `report` | 6 | authored, narrated, recorded 4K |
| 11 | `operate` | 9 | authored, narrated, recorded 4K |
| 12 | `evolve` | 6 | authored, narrated, recorded 4K |

## Commands

```sh
npm run check:spine              # every step recorded, current, untouched — runs NOTHING (< 1 s)
python3 scripts/spine.py --record network/06   # record a step: runs ONLY it, from its parent's state
python3 scripts/spine.py --replay  # deliberate, after a tool upgrade: the whole chain from the start
npm run shots -- <slug-prefix>   # 4K PNGs in out/shots/ — then LOOK

npm run thumb:courses            # one cover per course → output/thumbnails/NN-<course>.png
python3 spike/terraform-on-moto/matrix.py [case…]   # Terraform × moto support matrix
```

## Spine — each section builds on the one before

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
- The spine records 80 columns (`spine.py` wraps there); every frame's terminal draws 72: `ide.ts`
  `terminalRows` joins each row the spine wrapped and wraps the line again at 72, so the spine is untouched.

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
  keys and certificates) has a reducer in `_Pickler` (it also handles `WeakValueDictionary` and
  `defaultdict(lambda: …)`). A new service that will not pickle fails the save with its traceback.
- **A Terraform "hang" is usually moto answering 500**, which the provider retries 25 times with
  back-off. Find the call with `TF_LOG=DEBUG`, moto's traceback by sending its stderr to a file, and
  check the CONFIG first: the org lab's policy had no dependency on the organization, a race that
  fails on AWS too (`org-not-in-use` now answers as AWS does). A stopped recording kills what it left
  running (`leftovers()`); orphaned providers once made runs 3–4× slower.
- A replay's restore starts PostgreSQL before dropping/creating `book_shop`. moto_server.py's
  patch list (its docstring) also has `visible-at` and `events-test-pattern`.

## Frames

- **2026-11-08/09: frame v2 on every IDE section** (Course 5 `network` piloted, the rest ported), and
  **map frame v2 on all 11 map sections** (piloted on Course 5, approved, rolled out 2026-11-09).
  `node scripts/check-render.mjs <course>`. The recordings are v1.
- **IDE frame v2** (`src/scenes/ide.ts`, `grid.ts`): compact explorer 175 | editor over a 72-column
  terminal 715 | side pane 434, on the shared 1344 × 756 grid (python-expense-tracker's columns; the
  explorer restored 2026-11-09, owner's option A). Side pane STRICT (≤ 2 parts; with two, one a group or
  plot). The explorer (`tree.ts`) clips a name past its row with `…`, drops a note that does not fit
  beside the name, and trims its biggest open folder (`… N more files`) past 23 rows. Fitting a side
  pane to 434: a table column is as wide as its widest cell (~43 monospace characters for 2 columns,
  41 for 3); one long edge label widens EVERY gap in its row; a table that quotes values as recorded
  takes tighter padding in `theme.css` instead. Fixed columns; the
  terminal shows ≤ `TERMINAL_ROWS` rows — fold with `keep` (lines found by TEXT, never numbers).
  **Every side pane is a diagram** (an edge, plot or table; check-content fails a list), its parts
  in ONE group, and stays inside its column (check-render). An emulated pane's note sits INSIDE the
  diagram group, so the strict rule never costs the disclaimer.
- **Map frame v2** (`map.ts` `mapFrame2`, every map section): map 619 | side 715
  on the IDE grid (1344 × 756, padding 0.01), so a map frame has the IDE frames' zoom (median text 42 px
  at 4K, was 28). The side column is the IDE workbench's width: its terminal is `terminalRows` (72
  columns), and its first part takes the height its diagram leaves (`theme.css`). The map stands
  upright: the edge and the account (folded: "3 of 10 built") on the left, the Region with the VPC (AZs
  side by side) over the Regional services. AREAS (`vpc`, `books`, `checkout`, `reports`, `controls`)
  are OPEN (every part) or FOLDED (one line, "1 of 3 built"); a frame opens the areas holding a part it
  adds, else the VPC once it exists (`open` overrides: §3.8 and §8.4 open the three service areas, the
  VPC being folded). The controls never open whole: the part a section adds stands over the folded
  line. The open VPC plus one service area is the most that fits; with the VPC folded, all three
  service areas fit. Inside a subnet a part's title is short (NAT, Task, Orders). The edge's arrow
  reaches the load balancer, or the folded VPC. The map is the shop's WHOLE final architecture, drawn
  the AWS way; a part not built yet is `muted` in place; `BUILT[course]` is what exists; what a section
  adds is ringed by its `focus`. Never rename a part (ids). The side pane holds the terminal and ONE
  diagram (an emulated note inside it). check-render holds every map frame to the IDE fit and fails a
  part outside either column.
- **◆ full scene**: a canonical big picture that cannot fit a side pane at ≥ 24px; it carries real
  output (a lab) inside it.
- **Canonical diagrams, not list boxes.** Flows run one direction, centred (`stack: true` items),
  arrows do not cross, a group's heading is never crossed (check-render), an edge label never sits on
  a node. Tables only where rows of data are the point.

## Narration

Flowing prose, 90–120 s, walking the frame; ends with a one-line bridge. Written for the speech
engine: acronyms spelled ("A W S", "S three", "I A M", "V P C", "C L I", "S D K", "A P I"), account ids
digit by digit in groups, prices as words. Never reads code aloud character by character.

## Invariants

- Every emulated pane says so; nothing emulated is presented as AWS's own output.
- Do not publish engine releases, open moto PRs or create PRs without the owner's approval. No model
  names in commits.
- Do not add tools that fetch binaries (downloading actionlint was refused by the permission
  classifier); pip packages from `spine/requirements.txt` are the only route.

## Gotchas

- Never `pkill -f` (it matches its own shell). Kill recorder PIDs by
  `ps -eo pid,args | awk '$2 ~ /python3/ && $3=="scripts/spine.py" {print $1}' | xargs -r kill`,
  then `python3 -c "import sys;sys.path.insert(0,'scripts');import spine;spine.leftovers()"`.
- Recording is slow (Terraform refreshes ~120 resources): run `--record` in the background, several
  steps in ONE invocation (`--record deliver/06 deliver/07`), and do other work meanwhile.
- Checks are a floor: every frame of the pilot passed a check at some point while reading badly
  (tangled arrows, a half-empty side pane).
