import type { TreeEntry } from '@graphlearning/graphl-flow'
import { projectTree, type TreeOptions } from '../tree'
import { ADDS as DATA, DATA_BASE } from '../data/files'

// The project through Course 8: what each step adds to what Course 7 left. Mirrors the spine's
// `changes` (spine/decouple/*/step.json); check-render would not notice a drift here, so keep both.
export const DECOUPLE_BASE = [...DATA_BASE, ...Object.values(DATA).flat()]
export const ADDS: Record<number, string[]> = {
  2: ['infra/queues.tf', 'book_shop/checkout.py', 'tools/checkout.py', 'tools/consume.py'],
  4: ['functions/__init__.py', 'functions/fulfil/__init__.py', 'functions/fulfil/handler.py', 'infra/function.tf', 'tools/poll.py'],
  5: ['infra/topic.tf', 'tools/listeners.py'],
  6: ['infra/events.tf', 'events/samples.json', 'events/fr-order.json', 'tools/routed.py'],
  7: ['workflows/checkout.asl.json', 'functions/checkout/__init__.py', 'functions/checkout/steps.py', 'infra/workflow.tf',
    'tools/run_workflow.py'],
  8: ['events/order-12.json'],
}

/** The explorer after decouple step `n` (2 = the queue … 8 = exactly once). */
export function decoupleTree(n: number, { active, fresh }: Pick<TreeOptions, 'active' | 'fresh'>): TreeEntry[] {
  const paths = [...DECOUPLE_BASE, ...Object.entries(ADDS).filter(([k]) => +k <= n).flatMap(([, v]) => v)]
  const made: Record<string, string | undefined> = { 'infra/.terraform/': undefined, '.venv/': 'boto3, pytest, psycopg' }
  if (n >= 4) made['build/'] = n >= 7 ? 'fulfil.zip, checkout.zip' : 'fulfil.zip'
  const open = [active, ...(fresh ?? [])].filter(Boolean) as string[]
  const closed = ['infra/bootstrap', 'data', 'infra', 'tools', 'tests', 'db', 'events', 'functions', 'workflows', 'book_shop']
    .filter((d) => !open.some((f) => f.startsWith(d + '/')))
  return projectTree(paths, { active, fresh, made, closed, trim: ['infra', 'tools', 'book_shop', 'data', 'functions'] })
}
