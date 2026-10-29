#!/usr/bin/env node
// One cover per course video, from the shell's `graphl-thumb` — the house template, so the series
// looks like one series. (The FILM's cover is scripts/thumb-film.mjs; see
// output/thumbnails/README.md for why that one cannot use this template.)
//
// Two things this wrapper exists for:
//
//   1. The HEADERS. scripts/titles.json holds the search-first YouTube titles, which are long on
//      purpose — the template sets its title at a fixed 9.4vh with overflow:hidden and no
//      shrink-to-fit, so one of those is clipped mid-sentence ("… Security Groups against" and
//      then nothing). The description is read; the cover is glanced at. Two jobs, two strings.
//   2. ONE dev server for all twelve. graphl-thumb starts its own unless APP_URL is set, and
//      twelve cold vite boots is most of the runtime.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const repoDir = process.cwd()

// Short enough to be read at a glance at ~168px, and true to what the course teaches.
const HEADERS = {
  intro: "What We'll Build",
  'how-aws-runs': 'How AWS Works',
  start: 'Terraform: Plan and Apply',
  secure: 'IAM, Explained',
  network: 'VPC, Explained',
  run: 'Containers on Fargate',
  data: 'S3, RDS, DynamoDB',
  decouple: 'Queues and Events',
  deliver: 'Ship It Safely',
  report: 'A Data Lake',
  operate: 'Operate It',
  evolve: 'Cost and Speed',
}

const only = process.argv.slice(2)
const bad = only.filter((c) => !HEADERS[c])
if (bad.length) {
  console.error(`unknown course(s): ${bad.join(', ')}\nknown: ${Object.keys(HEADERS).join(', ')}`)
  process.exit(2)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pad2 = (n) => String(n).padStart(2, '0')
const THUMB = join(repoDir, 'node_modules', '.bin', 'graphl-thumb')
if (!existsSync(THUMB)) throw new Error(`no graphl-thumb at ${THUMB} — npm ci first`)

/** The app, once, for every cover — unless the caller already has one running. */
async function openApp() {
  if (process.env.APP_URL) return { url: process.env.APP_URL.replace(/\/?$/, '/'), child: null }
  const child = spawn('npm', ['run', 'dev'], { cwd: repoDir, env: process.env })
  const url = await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('dev server did not print a URL within 60s')), 60000)
    child.stdout.on('data', (b) => {
      const m = String(b).match(/https?:\/\/localhost:\d+\/?/)
      if (m) { clearTimeout(to); res(m[0].replace(/\/?$/, '/')) }
    })
    child.on('exit', (code) => rej(new Error(`dev server exited early (code ${code})`)))
  })
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    await sleep(250)
  }
  console.log(`  dev server at ${url}\n`)
  return { url, child }
}

const one = (course, args, env) => new Promise((done) => {
  const child = spawn(THUMB, [course, ...args], { cwd: repoDir, stdio: 'inherit', env })
  child.on('exit', (code) => done(code ?? 1))
  child.on('error', () => done(1))
})

const app = await openApp()
const env = { ...process.env, APP_URL: app.url }
const courses = Object.keys(HEADERS)
const targets = only.length ? only : courses
let failed = 0
try {
  for (const course of targets) {
    const n = pad2(courses.indexOf(course) + 1)
    const out = `output/thumbnails/${n}-${course}.png`
    const code = await one(course, ['--title', HEADERS[course], '--number', n, '--out', out], env)
    if (code !== 0) { console.error(`✗ ${course} — graphl-thumb exited ${code}`); failed++ }
  }
} finally {
  app.child?.kill('SIGTERM')
}
console.log(`\n${failed ? `✗ ${failed} failed` : `✅ ${targets.length} cover(s) in output/thumbnails/`}`)
process.exit(failed ? 1 : 0)
