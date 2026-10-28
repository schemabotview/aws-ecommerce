import { start } from './start'
import { network } from './network'
import type { Course, Section } from './types'

// Course registry, in syllabus order (COURSE-PLAN.md). A course is registered once it is authored.
// The pilot: Course 3 (`start`) whole, and Course 5's first section (`network`), a full-scene detour.
export const COURSES: Record<string, Course> = {
  [start.id]: start,
  [network.id]: network,
}

export type { Course, Section }

// slugOf / allSections are the shell's — the slug rule (`<courseId>-<sectionId>`) is part of the
// route contract every recorder drives.
export { slugOf, allSections } from '@graphlearning/shell'

export function getCourse(id: string): Course | undefined {
  return COURSES[id]
}
