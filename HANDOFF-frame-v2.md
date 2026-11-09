# Handoff: frame v2 with the explorer restored (2026-11-09)

Read this first in a new session. Branch everywhere: `claude/friendly-sagan-ptl0lo`.

## Where things stand

| repo | state |
|---|---|
| linux-admin, data-science-house-prices | frame v2, merged to `main` earlier. Not affected by this change |
| **azure-trade-finance** | **DONE on the branch, not merged.** IDE frame v2 WITH the explorer (175 \| 715 \| 434) on all 62 IDE frames; maps unchanged. tsc, build, `npm run check` (88 sections), `check:spine` (72 steps) all green; every frame looked at. Docs: COURSE-PLAN Decision 6, CLAUDE.md "Frames". Waiting on the owner's review, then merge to `main` |
| **aws-ecommerce** | **TO DO.** `main` = this branch = frame v2 WITHOUT an explorer (760 \| 574), merged on 2026-11-09. The owner reviewed it and wants the explorer back (option A below), same as azure |

## The decision (owner, 2026-11-09): option A

Compact explorer **175** | editor over terminal **715** | strict side pane **434**, on the shared
1344 × 756 grid at `padding: 0.01`. These are python-expense-tracker's columns (its `src/scenes/frame.ts`).
Reason: the explorer is where a viewer sees the project's Terraform files and which one a section adds.

## How azure did it: port these to aws

Reference commit in azure-trade-finance: `4a2bcbb` ("IDE frame v2: restore the explorer").

1. **`src/scenes/grid.ts`**: copy azure's (`SIDE_W 434`, `WORK_W 715`, `EXPLORER_W` derived, `SIDE_PLOT_W`).
2. **`src/scenes/ide.ts`**: keep aws's own `terminal()` and `langOf`, and apply azure's changes:
   - import `Tree`, `EXPLORER_W`; add `export const COLS = 72`; `EDITOR_WRAP = 70`.
   - In `ideFrame`, `keep` resolves against the RECORDED (80-column) rows. Every row is then cut into
     72-column pieces, with the `! ` error mark repeated on each piece. `at[]` maps each recorded line
     to its first drawn row, and the keep ranges become `[at[a-1], at[b]-1]`.
   - Add back `explorer: Tree = { type: 'tree', id: 'explorer', title: PROJECT, entries: tree,
     compact: true, fill: true, w: EXPLORER_W, minH: FRAME_H }` as the first node, and destructure `tree`.
3. **`src/scenes/tree.ts`**: aws's copy is identical to azure's old one. Copy azure's new one:
   - **name clipping**: `NAME_ROOM = 19` characters, minus 2 per level of depth, minus a note's length + 2; a longer name ends in `…`.
   - **auto-trim**: `MAX_ROWS = 23`. When the tree would be taller, the biggest open folder shows only its active and new files, then `… N more files`.
   - Check first that no `focus` names an `explorer.<path>` entry (`grep -rn "explorer\." src`). Clipping changes an entry's id. Azure had none.
4. **`scripts/check-render.mjs`**:
   - compare panes `['explorer', 'workbench', 'side']`;
   - port azure's improved "side pane runs outside its column" message, which names the parts that stick out and by how many px. It makes every fix quick.
5. Then run `node scripts/check-content.mjs` and `node scripts/check-render.mjs`, and fit every side pane to 434.

## Fitting side panes to 434: what worked

- Table cells are `nowrap`, with 10px padding each side. A column is as wide as its WIDEST cell, so the
  budget is max(col 1) + max(col 2) + …: **~43 monospace characters for 2 columns, 41 for 3, 39 for 4**.
- Shorten literal cells. Drop a column and carry its fact in the title (`${value}` computed). Never
  edit a value read from the spine. If a quoted value cannot fit, give that one table tighter padding in
  `theme.css`: `.gf-table[data-id='<id>'] td { padding-inline: 4px; }` (azure §4.7's role matrix).
- A side-by-side grid of two groups that is too wide: stack the groups. An edge into an item inside a
  group then crosses the group's heading, so aim the edge at the group id.
- A row of 3 items: use `stack: true` items with short captions.
- A one-word name too long for an item (`AutoResolveIntegrationRuntime`): add `​` break points.
- A side `code` part: `wrap: true`, and fold more with `show`.
- Before dropping or choosing between parts, check what the narration names ("the table in the side
  pane…", "at the bottom…"). Keep what it walks. No narration was edited in any repo.
- The editor's FRAME_PROBLEMS (check-content) appear when wrapped terminal rows leave too few editor
  rows. Fold a docstring in `show`, or keep fewer terminal lines.
- A dump of every overflowing side table (rendered cells plus px over) made the edits fast. The script
  was `node scripts/.tables.mjs <slugs…>`, a throwaway: start vite on its own port, open each slug
  with `?capture=1`, read `[data-id="side"] table` rows. It was not committed; rewrite it if useful.

## aws specifics to keep

- **Every emulated pane says so** (CLAUDE.md invariant). The 10 "Emulated:" / "Walked locally:" notes
  sit INSIDE the side pane's diagram group. Keep them when refitting.
- Maps are unchanged (owner: "leave maps for now"). Concept (◆) scenes are unchanged.
  `secure-how-iam-decides` is wide with small text; this was flagged to the owner earlier and is not fixed.
- §11.8's ARN list draws a tab as one space when a row would overflow (`terminal()`). Keep that.

## Checks before handing over (aws)

```sh
npx tsc --noEmit && npm run build
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm run check
npm run check:spine
npm run shots -- <course>      # then LOOK; tile into contact sheets (PIL) and read them
```

Commit one per course and push to `claude/friendly-sagan-ptl0lo`. Merge to `main` only when the owner
asks. End each commit with the Co-Authored-By / Claude-Session lines. Shallow clones: if a stop hook
reports "no remote branch", run
`git config --add remote.origin.fetch '+refs/heads/claude/friendly-sagan-ptl0lo:refs/remotes/origin/claude/friendly-sagan-ptl0lo' && git fetch origin claude/friendly-sagan-ptl0lo && git branch -u origin/claude/friendly-sagan-ptl0lo`.

## After aws

Tell the owner both repos are ready for review: azure's routes, then aws's. Every course in both needs
re-recording, because the frame changed (the wavs are unaffected: no narration edits).
