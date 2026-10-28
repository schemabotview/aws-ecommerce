# aws-ecommerce

**Learn AWS by building a book shop, declared in Terraform** — a GraphL concept app (graphl.in).
One project, `book-shop`, grows from an empty account to a networked, containerised shop with an
asynchronous checkout, a reporting lake and the controls production needs. Twelve courses, one
video. See `COURSE-PLAN.md`.

Every terminal on screen is a real run: the real AWS CLI, boto3 and Terraform against a local AWS
emulator (moto), replayed and checked by `npm run check:spine`. There is no AWS account behind the
course, and every emulated pane says so. `SPIKE.md` explains how that machine is built.

```sh
npm install        # see CLAUDE.md, Status: graphl-flow 0.6.0 is not published yet
npm run dev        # http://localhost:5173
npm run check      # every section at 3840×2160
npm run check:spine
```

Scenes render with `@graphlearning/graphl-flow`; the app shell is `@graphlearning/shell`.
