import type { TreeEntry } from '@graphlearning/graphl-flow'

// The explorer from a list of paths — the step's files, as `spine/<course>/<step>/project/` holds
// them, plus what a run made there (`.terraform/`, local state, a saved plan, `.venv/`), drawn muted
// as an editor greys out what .gitignore covers. Folders first, then files, each alphabetical, as
// VS Code sorts them.

export interface TreeOptions {
  /** The open file. */
  active?: string
  /** Paths this section added (a folder's path marks the folder). */
  fresh?: string[]
  /** Paths a run made, drawn muted; `path: note` adds a note (`local`, `moved to S3`). */
  made?: Record<string, string | undefined>
  /** Folders drawn closed (their children not listed). */
  closed?: string[]
  /** Folders drawn open but TRIMMED: only their open and new files (and sub-folders holding one),
   *  then a muted `… N more files` — a long infra/ that would push the explorer past its pane. */
  trim?: string[]
}

type Node = { children: Map<string, Node>; file: boolean }

// The compact explorer is 175px (grid.ts): at 13px a row holds about NAME_ROOM characters at the top
// level, two fewer per level of nesting. A longer name ends in `…`, as VS Code's explorer clips it; the
// editor's tab still names the open file in full. The name comes first: a note (`local`, what a muted
// folder holds) is drawn only when name and note fit the row together, and dropped otherwise.
const NAME_ROOM = 21 // measured: `.terraform.lock.hcl` (19) fits inside infra/ with room to spare
/** The entry's name and note as the compact explorer can draw them. */
export const fitEntry = (name: string, depth: number, note?: string): { name: string; note?: string } => {
  const room = NAME_ROOM - 2 * depth
  const label = name.length <= room ? name : name.slice(0, Math.max(4, room - 1)) + '…'
  return { name: label, note: note && label.length + note.length + 2 <= room ? note : undefined }
}

/** Rows the compact explorer holds in frame v2 (756px tall, ~30px a row, its title included). */
const MAX_ROWS = 23
const rowsOf = (entries: TreeEntry[]): number => entries.reduce((n, e) => n + 1 + (e.children ? rowsOf(e.children) : 0), 0)

/**
 * The explorer, fitted to the frame: when the tree would outgrow MAX_ROWS rows, the open folder with the
 * most entries is TRIMMED (its active and new files kept, then `… N more files`), and so on until it fits.
 */
export function projectTree(paths: string[], options: TreeOptions): TreeEntry[] {
  const trim = [...(options.trim ?? [])]
  for (;;) {
    const tree = buildTree(paths, { ...options, trim })
    if (rowsOf(tree) <= MAX_ROWS) return tree
    const open: [string, number][] = []
    const walk = (entries: TreeEntry[], prefix: string) => entries.forEach((e) => {
      if (!e.children) return
      const path = prefix + e.name
      if (!trim.includes(path)) open.push([path, e.children.length])
      walk(e.children, path + '/')
    })
    walk(tree, '')
    const [largest] = open.sort((x, y) => y[1] - x[1])
    if (!largest || largest[1] < 3) return tree
    trim.push(largest[0])
  }
}

function buildTree(paths: string[], { active, fresh = [], made = {}, closed = [], trim = [] }: TreeOptions): TreeEntry[] {
  const root: Node = { children: new Map(), file: false }
  for (const path of [...paths, ...Object.keys(made)]) {
    let at = root
    const parts = path.split('/')
    parts.forEach((part, i) => {
      if (!at.children.has(part)) at.children.set(part, { children: new Map(), file: i === parts.length - 1 && !path.endsWith('/') })
      at = at.children.get(part)!
    })
  }
  const shown = (path: string) => path === active || fresh.includes(path)
    || [active, ...fresh].some((p) => p?.startsWith(path + '/'))
  const walk = (node: Node, prefix: string, depth = 0): TreeEntry[] => {
    const entries = [...node.children.entries()]
    const trimmed = trim.includes(prefix.replace(/\/$/, ''))
    const kept = trimmed ? entries.filter(([name]) => shown(prefix + name)) : entries
    const out: TreeEntry[] = kept
      .sort(([a, x], [b, y]) => Number(x.file) - Number(y.file) || a.localeCompare(b))
      .map(([name, child]) => {
        const path = prefix + name
        const isMade = path in made || path + '/' in made
        const state = path === active ? 'active' : fresh.includes(path) ? 'new' : isMade ? 'muted' : undefined
        const note = made[path] || made[path + '/'] || undefined
        const label = fitEntry(name, depth, note)
        if (child.file) return { ...label, state }
        const open = !closed.includes(path) && !isMade
        return { ...label, state, folder: true, children: open ? walk(child, path + '/', depth + 1) : undefined }
      })
    if (trimmed && entries.length > kept.length) out.push({ name: `… ${entries.length - kept.length} more files`, state: 'muted' })
    return out
  }
  return walk(root, '')
}
