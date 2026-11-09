// The ONE grid every GraphL IDE frame shares since graphl-flow 0.10: 1344 × 756 at a 1% margin, ≈ 2.8×
// at 4K, in python-expense-tracker's columns: compact explorer 175 | editor over terminal 715 | side 434.
// The spine's terminals are RECORDED at 80 columns (scripts/spine.py wraps there); ide.ts wraps them to
// 72 at draw time, as a 72-column terminal would, so the spine is untouched. The explorer is kept: it is
// where a viewer sees the project's Terraform files and which one a section adds.
export const GAP = 10
export const FULL_W = 1344
export const FRAME_H = Math.round(FULL_W / (16 / 9))
export const SIDE_W = 434
export const WORK_W = 715
export const EXPLORER_W = FULL_W - (WORK_W + GAP + SIDE_W) - GAP
export const SIDE_PLOT_W = SIDE_W - 34
