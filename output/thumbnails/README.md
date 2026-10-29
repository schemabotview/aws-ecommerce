# Thumbnails

`film.png` — the cover for the single full-course video (`scripts/out/film.mp4`, 2:16:37).
Currently the **architecture** card with the **AWS mark**. Rebuild it, or any variant, with:

```sh
npm run thumb:film -- --theme dark --source map --mark aws --out output/thumbnails/film.png
```

`--source` is `map` | `plan` | `shop`, `--mark` is `aws` | `book` | `plan`, `--theme` is
`dark` | `navy` | `light`. Read the two sections below before changing `--mark`.

`01-intro.png` … `12-evolve.png` — one cover per course video, from the shell's `graphl-thumb`.
All twelve, or just some, over one dev server:

```sh
npm run thumb:courses             # all twelve
npm run thumb:courses -- network  # just this one
```

Variants kept for comparison: `film-awsmark.png` (identical to the shipped `film.png`),
`film-map.png` (the same cover with this repo's own mark), `film-dark.png` (the terminal
card, shipped until 2026-10-29 and the strongest of these at feed size), `film-navy.png` (all but
identical to dark once downscaled), `film-light.png` (stands out in a dark feed, but the orange
accent and badge lose force on white), `film-shop.png` (the third source, below) and
`film-planmark.png` (the other mark, below).

## The mark: this repo's own, not an AWS one

The cover now carries the vendored AWS mark (`--mark aws`, below). `--mark book` is the
permission-free alternative and stays the default in the script: **`public/favicon.svg`**, the
book-shop mark drawn for this repo, naming AWS only in **text**.

That default is deliberate. Amazon's trademark guidelines reserve the AWS logo, the smile and the service
icons for AWS's own use and for uses they have agreed to; accurately *naming* the service your
content is about is the kind of nominative use that is normally fine, and it is all this cover
does. A cover that wore the AWS logo would be making a different claim — that AWS produced or
endorsed the course — which is not true. **If this ever gets published under a logo, read
Amazon's current trademark guidelines first and get permission; do not infer one from this file,
which is a design note and not legal advice.**

`--mark plan` is the alternative: Terraform's plan gutter, `+ ~ -`. That is CLI *output syntax*,
not HashiCorp's logo (their mark is reserved the same way AWS's is), and it is the loop every
section of this course runs. It is kept ready as `film-planmark.png`, but at 168px the three
small glyphs collapse into a grey block where the book mark still reads — so the book ships.

`--mark aws` (**shipped since 2026-10-29**) puts an AWS mark on the cover, read from
`public/vendor/aws-logo.svg` or `.png`. The script never draws one: it places the vendored file
**as supplied** — not recoloured, re-traced or re-proportioned — and fails with instructions if no
asset is there. So what ships is either a real mark unaltered or no mark at all, never an
approximation of someone's logo.

The file in use is a 2000×1125 PNG. It lands legibly on the dark card because it carries its own
white fill: measured over the logo's 150×110 box on the finished cover, luminance runs 15 → 255,
so the dark wordmark sits on white rather than on the near-black background.

**Two things are still open, and `public/vendor/NOTICE-aws-logo.txt` is where they get answered:**

1. **The asset's origin and licence are not recorded.** It was supplied by the owner; the source
   URL, terms and permission are blanks in the NOTICE waiting to be filled in.
2. **It is probably not Amazon's own lockup.** Amazon publishes the "aws" wordmark with the smile
   beneath it; the orange cloud ring around it here is a third-party decoration, common on stock
   and icon sites. A stylised presentation of someone's mark is *harder* to justify than the
   unaltered official one — so if an AWS mark is going on the cover, the official asset from
   Amazon's own brand resources is the better file to vendor at that path. The script needs no
   change for it: drop the file in and re-run.

Amazon reserves the AWS logo, and a cover that wears it makes a claim about who produced the
course. **Get that permission in writing before publishing under it.** This file is a design note,
not legal advice. `--mark book` (this repo's own mark, `film-map.png`) needs none of it and is one
command away.

Note that the sibling repos answer this question differently and correctly so: the Python repo
carries the real PSF logo with its ™ and a written warning about monetisation, the data-science
repo carries the pandas logo outright because pandas publishes it under BSD-3, and the Spark repo
carries no project mark at all. Copyright and trademark are different questions and every project
answers for itself. Do not copy any of those decisions here, or this one there.

## The card is real, and says what is emulated

Everything inside the terminal card is cut out of a spine `session.txt` — the same recorded
output the scenes quote — and parsed, never typed:

- `--source plan` (default, shipped) reads `spine/network/02-vpc/session.txt`: the real
  `terraform apply tfplan`, the ten resource addresses the plan listed under
  `# <addr> will be created`, and the `Apply complete! Resources: 10 added, …` it ended with. The
  foot line ("one vpc and nine subnets — one apply") is **counted off those addresses**, so it
  cannot drift from them. If the plan's count and the apply's count ever disagree, the render
  fails rather than shipping a cover that overstates.

- `--source shop` reads `spine/run/01-app/session.txt`: `curl /books/bk-1001` and the JSON the
  app really answered with. A stronger *image* at feed size — "Night Trains of Europe" in large
  type — but it reads as a video about a book shop rather than one about AWS, so it is a spare.

- `--source map` (shipped) is not a session at all: it is the shop's whole architecture, taken
  **live from the running app** rather than from a recorded video frame. It opens §1.1 — the one
  section where every part is built, so nothing in the picture is greyed as "not yet" — and
  screenshots `[data-id="map"]`, the map group's own box. Cropping to the node rather than to a
  measured pixel rectangle is what keeps a sliver of the section's side pane out of the frame
  edge, and means a re-laid-out scene needs no new numbers here.

  **Know what this one trades.** At the ~168px the feed renders, the whole diagram collapses into
  coloured confetti: not one label survives, not "Region eu-west-2" and not a single service name.
  The terminal card keeps a readable focal line ("Apply complete!") at that size and this does
  not. It was shipped as a deliberate call — the architecture is what the course is *about*, and
  the AWS-style diagram is the most distinctive thing it owns — with `film-dark.png` kept beside
  it to switch back to in one command if the click-through says otherwise.

The plan card carries the label **`BOOK-SHOP · EMULATED`**, exactly as the frames do: those
`apply` lines came from moto, not from an AWS account, and CLAUDE.md's standing invariant is that
nothing emulated is presented as AWS's own output — a thumbnail is not an exception. The shop
card has no such label and must not grow one: that app and that `curl` really ran on the machine,
and no AWS call is involved.

## Why the film cover is not `graphl-thumb`

The shell's template is a **per-course** poster: a scene plus a text panel. A scene is a 16:9
video frame, and cropped into that panel it turns to unreadable mush at the ~168px the YouTube
mobile feed actually renders — which is the only size that decides a thumbnail. `thumb-film.mjs`
uses poster grammar instead: few elements, enormous type, one focal object. Every change was
checked by downscaling to 168px and looking, not by looking at 1280px. At feed size the shipped
cover keeps the mark, LEARN / AWS, the FULL COURSE badge and "Apply complete!"; the ten plan rows
below become texture, which is what they are for.

The per-course covers do use `graphl-thumb`, because that is the house template across the whole
workspace and the series should look like one series.

## Short headers, not the publish titles

`scripts/titles.json` holds the **search-first YouTube titles** — long, keyword-heavy, written
for the search box ("AWS VPC Explained: CIDR and Subnets, Route Tables, …"). The thumb template
sets its title at a fixed `9.4vh` with `overflow: hidden` and no shrink-to-fit, so a title that
long is simply **clipped mid-sentence**. The first render of `05-network.png` ended at
"Security", losing the rest.

So each per-course cover is rendered with an explicit short `--title`. The twelve headers live
in `HEADERS` in `scripts/thumb-courses.mjs`, beside the loop that uses them, while `titles.json`
keeps the long one for the description. Two different jobs, two different strings: the
description is read, the cover is glanced at.

## The colours are the engine's

The card's green `+`, the amber and red of the `plan` mark, and the dimmed output text take
graphl-flow's own tone palette — `store` `#37b877`, `infra` `#f0902f`, `consume` `#f0656f` —
copied into `TONE` in `scripts/thumb-film.mjs`, so the cover is painted the way the scenes are.
The accent is `--brand` from `src/theme.css`, AWS's orange `#ff9900`, which is also what the
`light` theme has to darken to `#d97800` to stay legible on white.

## The guard

`thumb-film.mjs` asserts that nothing overflows its box — `.rows`, `.card`, `.left`, `body`, and
every text element against the viewport — and fails the build if anything is clipped. That is how
the ten-row plan was caught overflowing the card by 41px on the first render; the rows were set
smaller so the **whole** real plan fits, rather than showing a chosen few of it.
