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

export function projectTree(paths: string[], { active, fresh = [], made = {}, closed = [], trim = [] }: TreeOptions): TreeEntry[] {
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
  const walk = (node: Node, prefix: string): TreeEntry[] => {
    const entries = [...node.children.entries()]
    const trimmed = trim.includes(prefix.replace(/\/$/, ''))
    const kept = trimmed ? entries.filter(([name]) => shown(prefix + name)) : entries
    const out: TreeEntry[] = kept
      .sort(([a, x], [b, y]) => Number(x.file) - Number(y.file) || a.localeCompare(b))
      .map(([name, child]) => {
        const path = prefix + name
        const isMade = path in made || path + '/' in made
        const state = path === active ? 'active' : fresh.includes(path) ? 'new' : isMade ? 'muted' : undefined
        const note = made[path] ?? made[path + '/']
        if (child.file) return { name, state, note }
        const open = !closed.includes(path) && !isMade
        return { name, state, note, folder: true, children: open ? walk(child, path + '/') : undefined }
      })
    if (trimmed && entries.length > kept.length) out.push({ name: `… ${entries.length - kept.length} more files`, state: 'muted' })
    return out
  }
  return walk(root, '')
}
