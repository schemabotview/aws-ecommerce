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

Pilot authored 2026-10-28, awaiting owner review: Course 3 `start` (8 sections) and Course 5's first
section (`network-addresses-and-cidr`, a ◆ full scene). No narration audio yet.

**graphl-flow 0.6.0 is not on npm yet** (branch `claude/pensive-johnson-ixdglh` of graphl-flow: AWS
icons, `dashed` groups, `muted` items, `hcl`, folded terminals). Until it is published: build it
(`npm pack` there), install that tarball into `node_modules` here without saving, and do not commit
a lockfile (`package-lock.json` is gitignored for exactly this reason — remove that line when
0.6.0 is published, and commit the lockfile).

## Commands

```sh
npm run dev                      # the app, :5173
npx tsc --noEmit && npm run build
npm run check                    # check-content + check-render (every section at 3840×2160)
npm run check:spine              # replay the chain and the labs; --write to rewrite transcripts
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
- Checking one step replays the chain up to it. One replay at a time (port 5000, a machine lock).
- Every terminal is 80 columns: `spine.py` wraps at 80, `ide.ts` draws 80.

## The machine (all in `scripts/`, all in SPIKE.md)

- `toolchain.py` pins Terraform, the AWS provider, AWS CLI, moto/boto3; checksums verified.
- `registry.py` answers `registry.terraform.io` locally from HashiCorp's signed files: `init` prints
  "signed by HashiCorp", the lock file is a learner's, nothing changes when HashiCorp releases.
- `moto_server.py` is moto with the gaps the course meets closed (CloudWatch's CBOR protocol, tags
  sent on create, …) and ids seeded from each request's CONTENT (Terraform's walk order varies run to
  run). Each fix answers as AWS's API reference says AWS answers — never what a frame wants.
  When a fix is needed, find the call with `MATRIX_DEBUG=1`, patch, and prove it with the matrix.
- `TF_IN_AUTOMATION` is never set: it rewords Terraform's hints, and a learner's terminal lacks it.

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
| accounts | development **444455556666** (the course builds here until Course 9), production **111122223333** |
| people | **alex** (developer), **sam** (teammate); Identity Center session `book-shop`, portal `https://book-shop-example.awsapps.com/start`; roles BookShopDeveloper (dev), BookShopReadOnly (prod) |
| buckets | `book-shop-catalog-444455556666`; state `book-shop-tfstate-444455556666`, key `book-shop/terraform.tfstate`, `use_lockfile` |
| tags | default: `app = book-shop`, `env = dev`, `managed-by = terraform` |
| budget | `book-shop-dev-monthly`, 20 USD, 80% forecast → alex@book-shop.example.com |
| VPC | 10.20.0.0/16; public 10.20.0–2.0/24, app 10.20.10–12.0/24, data 10.20.20–22.0/24 |
| clock | 2026-11-02 09:30:00 UTC (the spine's default) |

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
