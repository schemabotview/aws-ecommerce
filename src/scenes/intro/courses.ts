import type { SceneModel } from '@graphlearning/graphl-flow'
import { BUILT, mapFrame } from '../map'

// §1.3 — what we'll build, course by course (map frame). The finished map, and what each course adds
// to it — the outcome column of COURSE-PLAN.md's course table, one row per course. Courses 1 and 2
// build nothing: they are the why and the how of AWS itself.
export const introCourses: SceneModel = mapFrame({
  built: BUILT.evolve,
  side: [
    {
      type: 'table', id: 'courses', title: 'Twelve courses: after each one, the shop…', tone: 'source', columns: ['', 'course', 'the shop…'], rows: [
        ['1–2', 'AWS itself', 'is an idea: Regions, requests, costs'],
        ['3', 'Start', 'has an account, a profile, state'],
        ['4', 'Secure', 'has a role, proven to deny'],
        ['5', 'Network', 'has a VPC, a load balancer, a name'],
        ['6', 'Run', 'serves pages from Fargate, scaled'],
        ['7', 'Data', 'keeps carts, orders and photos'],
        ['8', 'Decouple', 'takes orders asynchronously'],
        ['9', 'Deliver', 'ships through a pipeline'],
        ['10', 'Report', 'answers "what did we sell?"'],
        ['11', 'Operate', 'is observed, audited, recoverable'],
        { cells: ['12', 'Evolve', 'is cached, priced and reviewed'], tone: 'ingest' },
      ],
    },
    { type: 'note', id: 'terraform', tone: 'source', text: 'From Course 3 on, every part is declared in Terraform and every section builds on the one before: one shop, one account, start to finish.' },
  ],
})
