import { start } from './start'
import { secure } from './secure'
import { network } from './network'
import { run } from './run'
import { data } from './data'
import { decouple } from './decouple'
import { deliver } from './deliver'
import type { Course, Section } from './types'

// Course registry, in syllabus order (COURSE-PLAN.md). A course is registered once it is authored.
export const COURSES: Record<string, Course> = {
  [start.id]: start,
  [secure.id]: secure,
  [network.id]: network,
  [run.id]: run,
  [data.id]: data,
  [decouple.id]: decouple,
  [deliver.id]: deliver,
}

export type { Course, Section }

// slugOf / allSections are the shell's — the slug rule (`<courseId>-<sectionId>`) is part of the
// route contract every recorder drives.
export { slugOf, allSections } from '@graphlearning/shell'

export function getCourse(id: string): Course | undefined {
  return COURSES[id]
}
