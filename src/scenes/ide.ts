import type { Code, Edge, Group, SceneModel, SceneNode, Tree, TreeEntry } from '@graphlearning/graphl-flow'
import { EXPLORER_W, FRAME_H, GAP, SIDE_W, WORK_W } from './grid'

// IDE frame v2 (python-expense-tracker's frame v2 on graphl-flow 0.10's shared grid, grid.ts):
//
//   explorer 175 | editor (the rows the terminal leaves)   | side pane 434 (STRICT: one diagram,
//                | terminal docked under it (its rows)     |   at most one table)
//
// 1344 × 756 at a 1% margin, python-expense-tracker's columns. The editor and terminal share ROWS rows:
// the terminal takes exactly the rows it shows (kept lines, their wrapped pieces, one row per fold, at
// least MIN_TERMINAL), the editor the rest, so only the divider moves. The spine records 80 columns; the
// terminal draws 72, wrapping each longer row as a 72-column terminal would (`keep` still names the
// recorded lines). The editor soft-wraps past ~70. A terminal or a shown range that does not fit is RECORDED in FRAME_PROBLEMS (check-content fails
// it, naming the file) and drawn anyway: a throw would take the whole app down with one section.

const ROW = 24
const CHROME = 51
export { EXPLORER_W, FRAME_H, SIDE_W, WORK_W }
/** The width the spine records at (scripts/spine.py), and the width the terminal draws. */
export const EDITOR_COLS = 80
export const COLS = 72
const EDITOR_WRAP = 70 // 715 − borders, gutter and padding: ~70 columns of 9px
export const ROWS = Math.floor((FRAME_H - GAP - 2 * CHROME) / ROW)
export const MIN_TERMINAL = 6
export const MIN_EDITOR = 8
const editorH = (rows: number) => rows * ROW + CHROME

export const trim = (text: string) => text.replace(/\n+$/, '')

/**
 * A spine session.txt as terminal rows. graphl-flow draws `$ cmd` as a command and `! text` as an
 * error. The replay writes plain output (already wrapped at 80 columns), so errors are marked here:
 * the AWS CLI's `aws: [ERROR]: …`, `An error occurred …` and `fatal error:` / `upload failed:` … (the high-level `aws s3`
 * commands), each with the rows it wrapped onto; Terraform's `Error: …` block (to
 * the next command), and a Python traceback (its header through the exception line).
 */
export function terminal(session: string): string {
  const out: string[] = []
  let mode: 'none' | 'aws' | 'terraform' | 'python' = 'none'
  let previous = ''
  for (const line of trim(session).split('\n')) {
    if (line.startsWith('$ ') || line.startsWith('> ')) mode = 'none'
    else if (line.startsWith('aws: [ERROR]') || line.startsWith('An error occurred') || /^(fatal error|upload failed|download failed): /.test(line)) mode = 'aws'
    else if (/^(│ )?Error: /.test(line)) mode = 'terraform'
    else if (line === 'Traceback (most recent call last):') mode = 'python'
    // an AWS CLI error is one line, wrapped: it goes on while the row before it filled the pane
    else if (mode === 'aws' && previous.length !== EDITOR_COLS) mode = 'none'
    // spine.py wraps at 80 counting a tab as ONE column, and the pane draws it 8 wide: a row with tabs
    // that would overflow draws each tab as the one space the wrap assumed (§11.8's ARN list).
    const width = line.replace(/\t/g, '        ').length
    const drawn = width > EDITOR_COLS ? line.replace(/\t/g, ' ') : line
    out.push(mode === 'none' ? drawn : `! ${drawn}`)
    if (mode === 'python' && /^[A-Za-z_][\w.]*(Error|Exception)\b/.test(line)) mode = 'none'
    previous = line
  }
  return out.join('\n')
}

/** A line to keep, found by TEXT (the first line containing it, searching on from the last match),
 *  or a [from, to] range of two such lines. */
export type Keep = string | [string, string]

/**
 * The `show` ranges that keep only `keep` of `text`'s lines — every other run folds to one
 * `··· N lines` row. Found by text, never by number: a transcript grows a line when a provider or a
 * CLI does, and a typed number would silently keep the wrong one. A missing text throws (check-render
 * reports it as a page error naming the scene).
 */
export function keepLines(text: string, keep: Keep[]): [number, number][] {
  const lines = trim(text).split('\n')
  let from = 0
  const find = (needle: string) => {
    for (let i = from; i < lines.length; i++) if (lines[i].includes(needle)) return (from = i + 1)
    throw new Error(`ide.ts: no line containing ${JSON.stringify(needle)} after line ${from}`)
  }
  return keep.map((k) => (typeof k === 'string' ? ((n) => [n, n] as [number, number])(find(k)) : [find(k[0]), find(k[1])]))
}

export interface Editor {
  /** The tab label — the file's path in the project. */
  file: string
  /** The file's text, imported from the spine with `?raw`. */
  code: string
  show?: [number, number][]
  highlight?: number[]
  lang?: Code['lang']
}

/** A file's language by its name: Terraform, shell (env.sh, the profile file), Python, JSON. */
export function langOf(file: string): Code['lang'] {
  if (file.endsWith('.tf')) return 'hcl'
  if (file.endsWith('.py')) return 'python'
  if (file.endsWith('.json')) return 'js'
  if (file.endsWith('.sh') || file === 'aws-config' || file.endsWith('.gitignore') || file === 'Dockerfile' || file === '.dockerignore') return 'shell'
  return 'text'
}

export interface IdeFrame {
  tree: TreeEntry[]
  editor: Editor
  /** The step's session.txt, raw. */
  session: string
  /** Which of the session's lines the terminal shows; the rest fold. Default: all of them. */
  keep?: Keep[]
  /** The side pane: a diagram (check-content fails a side pane with no edge, plot or table). */
  side: SceneNode[]
  /** Edges between nodes INSIDE the side pane. An edge between panes would widen a gap and move them. */
  edges?: Edge[]
}

// Fixed ids: a section's `focus` can name `editor.L12`, `terminal`, or any id in the side pane.
export const IDE_IDS = { explorer: 'explorer', editor: 'editor', terminal: 'terminal', side: 'side' } as const
export const PROJECT = 'book-shop'

/** Rows one line takes in the editor: graphl-flow soft-wraps with CSS `pre-wrap`, which breaks at the
 *  last space that fits (a word longer than the row breaks anywhere), so count it the same way. */
function wrappedRows(line: string, cols = EDITOR_WRAP): number {
  let rows = 1, rest = line
  while (rest.length > cols) {
    const at = rest.lastIndexOf(' ', cols)
    rest = rest.slice(at > 0 ? at + 1 : cols)
    rows++
  }
  return rows
}
const rowsOf = (lines: string[], a: number, b: number) => lines.slice(a - 1, b).reduce((n, l) => n + wrappedRows(l), 0)

/** Rows a set of shown ranges takes: each line (wrapped at `wrap`), plus one fold row per skipped run. */
function rowsShown(lines: string[], ranges: [number, number][], rows = rowsOf): number {
  let n = 0, next = 1
  for (const [a, b] of ranges) { if (a > next) n++; n += rows(lines, a, b); next = b + 1 }
  return n + (next <= lines.length ? 1 : 0)
}

const merge = (rs: [number, number][]) => [...rs].sort((x, y) => x[0] - y[0]).reduce<[number, number][]>((out, [a, b]) => {
  const last = out[out.length - 1]
  if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b); else out.push([a, b])
  return out
}, [])

/** Ranges grown, a line at a time, until the editor is full; throws if they do not fit to begin with. */
function grow(code: string, ranges: [number, number][], room: number): [number, number][] | undefined {
  const lines = trim(code).split('\n')
  if (rowsOf(lines, 1, lines.length) <= room) return undefined
  let r = merge(ranges.map(([a, b]) => [a, b] as [number, number]))
  if (rowsShown(lines, r) > room) throw new Error(`the shown ranges take ${rowsShown(lines, r)} rows; the editor holds ${room}`)
  for (let grew = true; grew;) {
    grew = false
    for (let i = 0; i < r.length && !grew; i++) for (const side of [1, 0] as const) {
      const t = r.map(([a, b]) => [a, b] as [number, number])
      if (side === 1 && t[i][1] < lines.length) t[i][1]++
      else if (side === 0 && t[i][0] > 1) t[i][0]--
      else continue
      const m = merge(t)
      if (rowsShown(lines, m) <= room) { r = m; grew = true; break }
    }
  }
  return r
}

/** Frames that could not hold their content; check-content reports every one. */
export const FRAME_PROBLEMS: string[] = []

/**
 * A session as the frame's 72-column terminal draws it: `keep` names RECORDED lines; each row the spine
 * wrapped at 80 is joined back, and the whole line wrapped at COLS. Shared by the IDE and map frames.
 */
export function terminalRows(session: string, keep?: Keep[]): { rows: string; tlines: string[]; tshow?: [number, number][] } {
  // keep names RECORDED lines; each recorded line becomes one or more 72-column rows
  const recorded = terminal(session).split('\n')
  const at: number[] = [] // at[i]: the first drawn row (1-based) of recorded line i + 1
  const drawn: string[] = []
  const markOf = (line: string) => (line.startsWith('! ') ? '! ' : '')
  const bodyOf = (line: string) => line.slice(markOf(line).length)
  for (let i = 0; i < recorded.length;) {
    // a row exactly EDITOR_COLS wide is one the spine wrapped: join it with the rows it ran on to, then
    // wrap the whole line at COLS (cutting each recorded row in two would split words twice)
    const mark = markOf(recorded[i])
    let text = bodyOf(recorded[i])
    let j = i
    // (a row that starts with two spaces is a new line that happens to follow an 80-wide one: columnar
    // output; a row the spine wrapped almost never continues with two spaces)
    while (bodyOf(recorded[j]).length === EDITOR_COLS && j + 1 < recorded.length && markOf(recorded[j + 1]) === mark
      && !recorded[j + 1].startsWith('$ ') && !bodyOf(recorded[j + 1]).startsWith('  ')) text += bodyOf(recorded[++j])
    // a tab the pane draws 8 wide would push a row past COLS: draw it as one space, as terminal() does at 80
    if (text.replace(/\t/g, '        ').length > COLS) text = text.replace(/\t/g, ' ')
    const start = drawn.length + 1
    for (let k = i; k <= j; k++) at.push(start + Math.floor(((k - i) * EDITOR_COLS) / COLS))
    drawn.push(...(text.match(new RegExp(`.{1,${COLS}}`, 'g')) ?? ['']).map((piece) => mark + piece))
    i = j + 1
  }
  at.push(drawn.length + 1)
  const rows = drawn.join('\n')
  const tlines = drawn
  const tshow = keep && keepLines(recorded.join('\n'), keep).map(([a, b]) => [at[a - 1], at[b] - 1] as [number, number])
  return { rows, tlines, tshow }
}

export function ideFrame({ tree, editor, session, keep, side, edges = [] }: IdeFrame): SceneModel {
  const file = editor.file
  const { rows, tlines, tshow } = terminalRows(session, keep)
  const flat = (_: string[], a: number, b: number) => b - a + 1
  const termRows = tshow ? rowsShown(tlines, tshow, flat) : tlines.length
  if (termRows > ROWS - MIN_EDITOR) FRAME_PROBLEMS.push(`${file}: the terminal shows ${termRows} rows; it holds at most ${ROWS - MIN_EDITOR} — keep fewer lines`)
  const editorRows = ROWS - Math.min(ROWS - MIN_EDITOR, Math.max(MIN_TERMINAL, termRows))
  const code = trim(editor.code)
  const hl = editor.highlight ?? []
  const want: [number, number][] = editor.show ?? (hl.length ? [[Math.min(...hl), Math.max(...hl)]] : [[1, 1]])
  let show: [number, number][] | undefined
  try { show = grow(code, want, editorRows) } catch (e) {
    // v1's hand-picked ranges were sized for a 23-row editor: when they do not fit, fall back to a window
    // around the highlighted lines (the part the section is about); report only if even that cannot fit.
    const runs = hl.length ? [...hl].sort((x, y) => x - y).reduce<[number, number][]>((out, n) => {
      const last = out[out.length - 1]
      if (last && n === last[1] + 1) last[1] = n; else out.push([n, n])
      return out
    }, []) : []
    try { show = hl.length ? grow(code, [[Math.min(...hl), Math.max(...hl)]], editorRows) : grow(code, [want[0]], editorRows) }
    catch {
    // the highlighted lines alone, folds between their runs
    try { if (runs.length < 2) throw 0; show = grow(code, runs, editorRows) }
    catch { FRAME_PROBLEMS.push(`${file} (highlight ${hl.length ? `${Math.min(...hl)}–${Math.max(...hl)}` : 'none'}): ${(e as Error).message}`); show = want }
  } }
  const ed: Code = {
    type: 'code', id: IDE_IDS.editor, filename: file, lang: editor.lang ?? langOf(file), code, highlight: hl, wrap: true,
    tone: 'ingest', fill: true, w: WORK_W, minH: editorH(editorRows), ...(show && { show }),
  }
  const term: Code = {
    type: 'code', id: IDE_IDS.terminal, terminal: true, filename: `terminal — ${PROJECT}`, code: rows,
    show: tshow, fill: true, w: WORK_W, minH: FRAME_H - GAP - editorH(editorRows),
  }
  const explorer: Tree = { type: 'tree', id: IDE_IDS.explorer, title: PROJECT, entries: tree, compact: true, fill: true, w: EXPLORER_W, minH: FRAME_H }
  const pane: Group = { type: 'group', id: IDE_IDS.side, bare: true, spread: true, w: SIDE_W, h: FRAME_H, children: side }
  return { dir: 'row', padding: 0.01, nodes: [explorer, { type: 'group', id: 'workbench', bare: true, children: [ed, term] }, pane], edges }
}

/** The 1-based number of the first line of `code` containing `text`, searching from line `from`. */
export function lineOf(code: string, text: string, from = 1): number {
  const lines = code.split('\n')
  for (let i = from - 1; i < lines.length; i++) if (lines[i].includes(text)) return i + 1
  throw new Error(`ide.ts: no line containing ${JSON.stringify(text)} from line ${from}`)
}

/** Every line number from the line containing `first` through the next line containing `last`. */
export function linesFrom(code: string, first: string, last = first): number[] {
  const a = lineOf(code, first), b = lineOf(code, last, a)
  return Array.from({ length: b - a + 1 }, (_, i) => a + i)
}
