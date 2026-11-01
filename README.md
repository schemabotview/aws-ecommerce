# aws-ecommerce

**Learn AWS by building a book shop, declared in Terraform** — a GraphL concept app
(graphl.in/aws-ecommerce). One project, `book-shop`, grows from an empty account to a networked,
containerised shop with an asynchronous checkout, a reporting lake and the controls production
needs. Every terminal on screen is a real run: the real AWS CLI, boto3 and Terraform against a local
AWS emulator (moto), replayed and checked by `npm run check:spine`. There is no AWS account behind
the course, and every emulated pane says so. Published as one film: **"Learn AWS by building a book
shop: full course, beginner to professional"** (12 courses, 92 sections, 2:16:37).

**Status:** all 12 courses authored, narrated, recorded at 4K and cut into the film; awaiting the
owner's review. Plan: [`COURSE-PLAN.md`](COURSE-PLAN.md) · Rules and status: [`CLAUDE.md`](CLAUDE.md) ·
How the machine is built: [`SPIKE.md`](SPIKE.md) · Workspace pipeline: `../CLAUDE.md`.

## Run

```sh
npm ci                                     # the committed lockfile pins graphl-flow 0.6.0, shell 1.0.4
npm run dev                                # http://localhost:5173
npm run check                              # every section at 3840×2160
npm run check:spine                        # every step recorded and current (runs nothing)
```

## Layout

```
src/content/<course>/    one file per section + the course index
src/scenes/<course>/     declarative scenes; ide.ts (IDE frame), map.ts (the architecture map)
spine/<course>/<step>/   project/, session.txt, step.json, state/ (the recorded machine state)
scripts/                 spine.py, toolchain.py, moto_server.py, registry.py, relay.py, checks, film
spike/                   the Terraform × moto support matrix
```
