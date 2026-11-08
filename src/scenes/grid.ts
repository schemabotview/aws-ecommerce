// The ONE grid every GraphL frame shares since graphl-flow 0.10: 1344 × 756 at a 1% margin, ≈ 2.8× at
// 4K. Columns differ from python-expense-tracker's 175 | 715 | 434 in one place: the spine's terminals
// are RECORDED at 80 columns (scripts/spine.py wraps there), so the work column is linux-admin's
// 80-column console width, 760 (80 × 9 + 30 padding + 2 borders = 752). No explorer: the 130px left
// would not hold `.terraform.lock.hcl`, no narration points at it, and the editor's tab names the file;
// the side pane takes the column (data-science-house-prices' notebook frame does the same).
export const GAP = 10
export const FULL_W = 1344
export const FRAME_H = Math.round(FULL_W / (16 / 9))
export const WORK_W = 760
export const SIDE_W = FULL_W - WORK_W - GAP
export const SIDE_PLOT_W = SIDE_W - 34
