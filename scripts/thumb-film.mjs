#!/usr/bin/env node
// The YouTube thumbnail for the single full-course film (scripts/out/film.mp4).
//
// Not the shell's `graphl-thumb`: that template is a PER-COURSE poster (a scene plus a panel), and
// a cropped 16:9 scene turns to mush at the ~168px the mobile feed actually renders. A film cover
// needs poster grammar — few elements, enormous type, one focal object. Every change here was
// checked by downscaling to 168px, not by looking at 1280.
//
// The terminal card is REAL: every row is cut out of a spine session.txt, the same recorded output
// the scenes quote, so the cover cannot promise a shop the course does not build. And it carries
// the same label the frames do — a card showing moto's answers says EMULATED on it (CLAUDE.md:
// nothing emulated is presented as AWS's own output). The `shop` card does not, because the app
// and that curl really run on the machine; only AWS is emulated.

import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, isAbsolute } from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const repoDir = process.cwd()
const FFMPEG = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg'].find(existsSync) ?? 'ffmpeg'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SCALE = 2
const W = 1280 * SCALE
const H = 720 * SCALE

const PLAN_SESSION = join(repoDir, 'spine', 'network', '02-vpc', 'session.txt')
const SHOP_SESSION = join(repoDir, 'spine', 'run', '01-app', 'session.txt')

/**
 * Every terminal in this repo is 80 columns and spine.py wraps at exactly 80, so a line of exactly
 * 80 characters is a line that continued. Join it back before anything is matched against it — the
 * book's JSON is split mid-word ("pric" / "e": 12.99) and would never match otherwise.
 */
function unwrapped(file) {
  const raw = readFileSync(file, 'utf8').split('\n').map((l) => l.trimEnd())
  const out = []
  let continuing = false
  for (const line of raw) {
    // The flag reads the line AS IT WAS WRITTEN, never the accumulated one: once two lines are
    // joined the result is over 80 itself, and testing that glues the whole rest of the file on.
    if (continuing && out.length && !line.startsWith('$ ')) out[out.length - 1] += line
    else out.push(line)
    continuing = line.length === 80
  }
  return out
}

/**
 * Cut the plan and its apply out of §5.2 — the loop every section of the course runs. `terraform
 * plan` lists what will be created, `apply` says what was. The resource ADDRESSES come from the
 * plan's own "# <addr> will be created" headers, so the card lists the shop's real network.
 */
function realPlan() {
  const lines = unwrapped(PLAN_SESSION)
  const done = lines.find((l) => /^Apply complete! Resources: /.test(l))
  if (!done) throw new Error(`no "Apply complete!" in ${PLAN_SESSION}`)
  const counts = done.match(/(\d+) added, (\d+) changed, (\d+) destroyed/)
  if (!counts) throw new Error(`unparsed apply summary: "${done}"`)

  const plan = lines.find((l) => /^Plan: \d+ to add/.test(l))
  if (!plan) throw new Error(`no "Plan: N to add" in ${PLAN_SESSION}`)

  const cmd = lines.find((l) => /^\$ terraform apply/.test(l))?.replace(/^\$ /, '')
  if (!cmd) throw new Error(`no "terraform apply" command in ${PLAN_SESSION}`)

  const created = lines
    .map((l) => l.match(/^\s*# (\S+(?:\[[^\]]*\])?) will be created$/)?.[1])
    .filter(Boolean)
  if (!created.length) throw new Error(`no "will be created" headers in ${PLAN_SESSION}`)
  if (created.length !== +counts[1]) {
    throw new Error(`plan lists ${created.length} resources but apply says ${counts[1]} added`)
  }

  // "one VPC and nine subnets" — counted off the real addresses, never typed.
  const byType = new Map()
  for (const addr of created) {
    const type = addr.split('.')[0].replace(/^aws_/, '').replace(/_/g, ' ')
    byType.set(type, (byType.get(type) ?? 0) + 1)
  }
  const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  const foot = [...byType.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([type, n]) => `${WORD[n] ?? n} ${type}${n > 1 ? 's' : ''}`)
    .join(' and ') + ' — one apply'

  return { cmd, hero: 'Apply complete!', sub: done.replace(/^Apply complete! /, ''), plan, created, foot }
}

/**
 * Cut the shop answering out of §6.1: the app really running on this machine, and the book it
 * returns. Nothing here is emulated — no AWS call is made — which is exactly why it can carry a
 * card with no EMULATED label.
 */
function realShop() {
  const lines = unwrapped(SHOP_SESSION)
  const i = lines.findIndex((l) => /^\$ curl .*\/books\/bk-1001$/.test(l))
  if (i < 0) throw new Error(`no "curl /books/bk-1001" in ${SHOP_SESSION}`)
  const cmd = lines[i].replace(/^\$ /, '')
  let book
  try {
    book = JSON.parse(lines[i + 1])
  } catch {
    throw new Error(`the line after the curl is not JSON: "${lines[i + 1]}"`)
  }
  for (const k of ['title', 'author', 'price', 'currency', 'stock']) {
    if (!(k in book)) throw new Error(`the book has no "${k}": ${lines[i + 1]}`)
  }
  const health = lines.find((l) => /^\$ curl .*\/health$/.test(l))
  if (!health) throw new Error(`no "/health" call in ${SHOP_SESSION}`)
  return {
    cmd,
    hero: book.title,
    sub: `${book.author} · ${book.price} ${book.currency}`,
    rows: Object.entries(book).map(([k, v]) => [k, typeof v === 'string' ? `"${v}"` : String(v)]),
    foot: 'the shop, answering — really run',
  }
}

/**
 * The shop's whole architecture, cropped to the diagram itself.
 *
 * It is taken LIVE from the app, not from a recorded frame: `[data-id="map"]` is the map group's
 * own box (graphl-flow puts every node's id in the DOM), so the crop is exactly the diagram —
 * no sliver of the section's side pane at the edge, no guessed pixel rectangle to re-measure
 * whenever the scene is re-laid out.
 *
 * §1.1 is the section to take it from: it is the only frame where every part of the shop is
 * built, so nothing in the picture is greyed out as "not yet".
 */
async function realMap(page, appBase) {
  await page.goto(`${appBase}?capture=1#/intro`, { waitUntil: 'networkidle2' })
  await page.waitForFunction(() => !!window.__scene, { timeout: 20000 })
  const plan = await page.evaluate(() => window.__scene.plan())
  const sec = plan?.[0]
  if (!sec) throw new Error('course "intro" has no sections')

  await page.goto(`${appBase}?capture=1#/${sec.slug}`, { waitUntil: 'networkidle2' })
  await page.waitForSelector('.gf-scene[data-fit="ready"]', { timeout: 15000 })
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
  await sleep(700)

  const node = await page.$('[data-id="map"]')
  if (!node) throw new Error('no [data-id="map"] in the frame — has src/scenes/map.ts changed?')
  const box = await node.boundingBox()
  if (!box || box.width < 200) throw new Error(`the map box is ${JSON.stringify(box)} — not laid out`)
  const b64 = await node.screenshot({ encoding: 'base64' })
  return { uri: `data:image/png;base64,${b64}`, from: sec.id, box }
}

async function openApp() {
  if (process.env.APP_URL) return { url: process.env.APP_URL.replace(/\/?$/, '/'), child: null }
  console.log('Starting dev server …')
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
  return { url, child }
}

// graphl-flow's own tone palette, its dark row: the card is painted the way the scenes are.
const TONE = {
  add:     '#37b877', // store — a created resource, and Terraform's own green +
  change:  '#f0902f', // infra
  destroy: '#f0656f', // consume
  dim:     'rgba(255,255,255,.58)',
}

const THEMES = {
  dark:  { badgeInk: '#231a0c', bg: '#0c1118', card: '#141c2a', ink: '#ffffff', accent: '#ff9900',
           rule: 'rgba(255,255,255,.14)',
           glow: 'radial-gradient(118% 110% at 8% 8%, #1a2740 0%, #0c1118 62%)' },
  navy:  { badgeInk: '#231a0c', bg: '#131a24', card: '#1d2838', ink: '#ffffff', accent: '#ff9900',
           rule: 'rgba(255,255,255,.12)',
           glow: 'radial-gradient(130% 110% at 86% 12%, #24405e 0%, #131a24 64%)' },
  light: { badgeInk: '#231a0c', bg: '#f4f6fa', card: '#141c2a', ink: '#0d1220', accent: '#d97800',
           rule: 'rgba(0,0,0,.12)',
           glow: 'radial-gradient(120% 120% at 10% 8%, #ffffff 0%, #e8edf5 70%)' },
}

/**
 * The repo's own marks — NOT an AWS one. Amazon's trademark guidelines reserve the AWS logo and
 * the smile for AWS; naming the service in TEXT is nominative use and is what this cover does.
 * See output/thumbnails/README.md.
 *
 *   book — public/favicon.svg, this repo's own mark, the shop itself.
 *   plan — Terraform's plan gutter, `+ ~ -`. Output syntax, not a logo; the most recognisable
 *          three characters on any Terraform screen, and the loop this whole course runs.
 *   aws  — the official AWS mark, read from public/vendor/aws-logo.svg. That file is NOT in this
 *          repo and is not generated by this script: an official brand asset is supplied, never
 *          redrawn, so what ships is the real mark unaltered rather than an approximation of it.
 *          Vendor the asset there with a NOTICE beside it saying where it came from and under what
 *          permission — the sister Python repo's public/vendor/ is the pattern — and read
 *          output/thumbnails/README.md on why the default is `book`.
 */
const AWS_LOGO = ['aws-logo.svg', 'aws-logo.png']
  .map((f) => join(repoDir, 'public', 'vendor', f)).find(existsSync)

function markSvg(mark) {
  if (mark === 'aws') {
    if (!AWS_LOGO) {
      throw new Error(
        `--mark aws needs the official asset at public/vendor/aws-logo.svg (or .png), which is\n`
        + `  not there. This script will not draw the AWS mark itself — vendor the real file,\n`
        + `  unaltered, with a public/vendor/NOTICE-aws-logo.txt saying where it came from and\n`
        + `  under what permission. See output/thumbnails/README.md.`,
      )
    }
    // The asset is placed AS SUPPLIED — embedded, never recoloured, re-traced or re-proportioned.
    // Altering a mark is the one thing every trademark policy refuses outright, and a redrawn
    // "close enough" mark is worse than none.
    if (AWS_LOGO.endsWith('.png')) {
      const b64 = readFileSync(AWS_LOGO).toString('base64')
      return `<img class="logo logo--wide" src="data:image/png;base64,${b64}" alt="AWS">`
    }
    const raw = readFileSync(AWS_LOGO, 'utf8')
    const body = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'))
    const vb = raw.match(/viewBox="([^"]+)"/)?.[1]
    if (!vb) throw new Error(`${AWS_LOGO} has no viewBox — cannot place it without distorting it`)
    // `.logo--wide` keeps the mark's own aspect: a wordmark is not a square and must not be squashed.
    return `<svg class="logo logo--wide" viewBox="${vb}" role="img" aria-label="AWS"
      xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${body}</svg>`
  }
  if (mark === 'plan') {
    const row = (y, glyph, colour) =>
      `<text x="8" y="${y}" font-family="IBM Plex Mono, monospace" font-size="21" font-weight="600"
        fill="${colour}">${glyph}</text>`
    return `<svg class="logo" viewBox="0 0 64 64" role="img" aria-label="terraform plan"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="12" fill="#141c2a" stroke="rgba(255,255,255,.16)"/>
      ${row(26, '+', TONE.add)}${row(44, '~', TONE.change)}${row(62, '-', TONE.destroy)}</svg>`
  }
  const raw = readFileSync(join(repoDir, 'public', 'favicon.svg'), 'utf8')
  const body = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'))
  const vb = raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 32 32'
  return `<svg class="logo" viewBox="${vb}" role="img" aria-label="book-shop"
    xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}

function pageHtml({ plan, shop, map, theme, head1, head2, badge, mark }) {
  const t = THEMES[theme]
  const fontFace = (fam, weight, file) => {
    const b64 = readFileSync(join(repoDir, 'node_modules', '@fontsource', fam, 'files', file)).toString('base64')
    return `@font-face{font-family:'${fam === 'ibm-plex-mono' ? 'IBM Plex Mono' : 'IBM Plex Sans'}';`
      + `font-weight:${weight};font-style:normal;font-display:block;`
      + `src:url(data:font/woff2;base64,${b64}) format('woff2')}`
  }
  const fonts = [
    fontFace('ibm-plex-sans', 700, 'ibm-plex-sans-latin-700-normal.woff2'),
    fontFace('ibm-plex-sans', 600, 'ibm-plex-sans-latin-600-normal.woff2'),
    fontFace('ibm-plex-mono', 600, 'ibm-plex-mono-latin-600-normal.woff2'),
    fontFace('ibm-plex-mono', 400, 'ibm-plex-mono-latin-400-normal.woff2'),
  ].join('')

  const src = plan ?? shop ?? {}
  const body = plan
    ? `<div class="rows">${plan.created
        .map((a) => `<div class="line"><span class="sig">+</span>${esc(a)}</div>`).join('')}</div>`
    : shop
    ? `<div class="rows">${shop.rows
        .map(([k, v]) => `<div class="line"><span class="key">${esc(k)}</span>${esc(v)}</div>`).join('')}</div>`
    : ''

  return `<style>
  ${fonts}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{background:${t.bg};background-image:${t.glow};
       font-family:'IBM Plex Sans',system-ui,sans-serif;color:${t.ink};
       display:flex;align-items:stretch;gap:${40 * SCALE}px;padding:${46 * SCALE}px ${50 * SCALE}px}

  .left{flex:0 0 auto;max-width:${(map ? 450 : 500) * SCALE}px;display:flex;flex-direction:column;
        justify-content:center}
  .logo{width:${104 * SCALE}px;height:${104 * SCALE}px;display:block;margin-bottom:${18 * SCALE}px;
        align-self:flex-start}
  /* A wordmark is not a square: give it width and let the height follow, or it comes out squashed. */
  .logo--wide{width:${188 * SCALE}px;height:auto;max-height:${104 * SCALE}px}
  .h{font-weight:700;line-height:.85;letter-spacing:-.05em;font-size:${118 * SCALE}px;white-space:nowrap}
  .h2{color:${t.accent}}
  .tf{margin-top:${22 * SCALE}px;font-family:'IBM Plex Mono',monospace;font-weight:600;
      font-size:${30 * SCALE}px;color:${theme === 'light' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.62)'};
      white-space:nowrap;letter-spacing:-.01em}
  .badge{align-self:flex-start;margin-top:${22 * SCALE}px;padding:${11 * SCALE}px ${24 * SCALE}px;
         background:${t.accent};border-radius:${12 * SCALE}px;
         font-weight:700;font-size:${34 * SCALE}px;letter-spacing:.06em;color:${t.badgeInk}}

  .card{flex:1;min-width:0;background:${t.card};border:${1 * SCALE}px solid ${t.rule};
        border-radius:${18 * SCALE}px;padding:${26 * SCALE}px ${30 * SCALE}px ${24 * SCALE}px;
        display:flex;flex-direction:column;box-shadow:0 ${22 * SCALE}px ${64 * SCALE}px rgba(0,0,0,.5)}
  .head{display:flex;align-items:center;gap:${14 * SCALE}px;margin-bottom:${16 * SCALE}px}
  .dots{display:flex;gap:${9 * SCALE}px}
  .dots i{width:${13 * SCALE}px;height:${13 * SCALE}px;border-radius:50%}
  .tag{font-family:'IBM Plex Mono',monospace;font-size:${19 * SCALE}px;font-weight:600;
       letter-spacing:.1em;color:rgba(255,255,255,.42)}
  .cmd{font-family:'IBM Plex Mono',monospace;font-size:${26 * SCALE}px;font-weight:400;
       color:rgba(255,255,255,.66);margin-bottom:${12 * SCALE}px;white-space:nowrap}
  .cmd b{color:${TONE.add};font-weight:400}
  .stat{font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:700;font-size:${54 * SCALE}px;
        color:${TONE.add};letter-spacing:-.03em;white-space:nowrap;line-height:1}
  .statsub{font-family:'IBM Plex Mono',monospace;font-size:${25 * SCALE}px;color:${TONE.dim};
           margin-top:${8 * SCALE}px;white-space:nowrap}
  /* The plan's ten resources are TEXTURE at feed size — the hero carries the read — so they are
     set small enough that the whole real plan fits rather than showing a chosen few of it. */
  .rows{flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;
        gap:${6 * SCALE}px;font-family:'IBM Plex Mono',monospace;font-size:${21 * SCALE}px;
        line-height:1.2;white-space:nowrap}
  .line{color:rgba(255,255,255,.92);font-weight:600}
  .sig{color:${TONE.add};font-weight:600;margin-right:${12 * SCALE}px}
  .key{color:${TONE.dim};font-weight:400;display:inline-block;min-width:${118 * SCALE}px}
  .foot{margin-top:${18 * SCALE}px;white-space:nowrap;font-family:'IBM Plex Mono',monospace;
        font-size:${23 * SCALE}px;color:rgba(255,255,255,.4);letter-spacing:.03em}
  /* The diagram fills the card and keeps its aspect — it is a drawing, not a background. */
  .card--map{padding:${16 * SCALE}px;align-items:center;justify-content:center}
  .card--map img{max-width:100%;max-height:100%;object-fit:contain;border-radius:${8 * SCALE}px}
</style>
<div class="left">
  ${markSvg(mark)}
  <div class="h">${esc(head1)}</div>
  ${head2.split(/\s+/).map((w) => `<div class="h h2">${esc(w)}</div>`).join('')}
  <div class="tf">built in Terraform</div>
  <div class="badge">${esc(badge)}</div>
</div>
${map ? `<div class="card card--map"><img src="${map.uri}" alt="the book shop's architecture"></div>`
: `<div class="card">
  <div class="head">
    <div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
    <div class="tag">${plan ? 'BOOK-SHOP · EMULATED' : 'BOOK-SHOP'}</div>
  </div>
  <div class="cmd">$ <b>${esc(src.cmd)}</b></div>
  <div class="stat">${esc(src.hero)}</div>
  <div class="statsub">${esc(src.sub)}</div>
  ${body}
  <div class="foot">${esc(src.foot)}</div>
</div>`}`
}

async function main() {
  const argv = process.argv.slice(2)
  const opt = { theme: 'dark', out: 'output/thumbnails/film.png', source: 'plan', mark: 'book',
                head1: 'LEARN', head2: 'AWS', badge: 'FULL COURSE' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--theme') opt.theme = argv[++i]
    else if (a === '--out') opt.out = argv[++i]
    else if (a === '--head1') opt.head1 = argv[++i]
    else if (a === '--head2') opt.head2 = argv[++i]
    else if (a === '--badge') opt.badge = argv[++i]
    else if (a === '--source') opt.source = argv[++i]
    else if (a === '--mark') opt.mark = argv[++i]
    else { console.error(`unknown argument: ${a}`); process.exit(2) }
  }
  if (!THEMES[opt.theme]) { console.error(`unknown theme: ${opt.theme} (have: ${Object.keys(THEMES).join(', ')})`); process.exit(2) }
  if (!['plan', 'shop', 'map'].includes(opt.source)) { console.error(`unknown source: ${opt.source} (have: plan, shop, map)`); process.exit(2) }
  if (!['book', 'plan', 'aws'].includes(opt.mark)) { console.error(`unknown mark: ${opt.mark} (have: book, plan, aws)`); process.exit(2) }

  const plan = opt.source === 'plan' ? realPlan() : null
  const shop = opt.source === 'shop' ? realShop() : null
  if (plan) {
    console.log(`Real plan from spine/network/02-vpc: $ ${plan.cmd}`)
    console.log(`  ${plan.plan}`)
    for (const a of plan.created) console.log(`  + ${a}`)
    console.log(`  ${plan.hero} ${plan.sub}`)
  } else if (shop) {
    console.log(`Real session from spine/run/01-app: $ ${shop.cmd}`)
    for (const [k, v] of shop.rows) console.log(`  ${k.padEnd(10)} ${v}`)
  }

  const requireFromRepo = createRequire(join(repoDir, 'package.json'))
  const { default: puppeteer } = await import(pathToFileURL(requireFromRepo.resolve('puppeteer')).href)

  const browser = await puppeteer.launch({ headless: true,
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, args: [`--window-size=${W},${H}`] })
  // The map source needs the app running; the other two are pure setContent and never start one.
  const app = opt.source === 'map' ? await openApp() : { url: null, child: null }
  try {
    const page = await browser.newPage()
    const map = opt.source === 'map' ? await realMap(page, app.url) : null
    if (map) console.log(`Real map from the app: §1.1 ${map.from}, ${Math.round(map.box.width)}×${Math.round(map.box.height)}`)
    await page.setContent(pageHtml({ plan, shop, map, ...opt }), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await sleep(250)

    // A clipped label ships a broken cover, so it fails the build instead.
    const overflow = await page.evaluate(() => {
      const bad = []
      for (const sel of ['.rows', '.card', '.left', 'body']) {
        const el = document.querySelector(sel)
        if (el && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
          bad.push(`${sel} ${el.scrollWidth}x${el.scrollHeight} > ${el.clientWidth}x${el.clientHeight}`)
        }
      }
      for (const el of document.querySelectorAll('.h,.badge,.tf,.cmd,.stat,.statsub,.line,.foot,.tag,.card--map img')) {
        const r = el.getBoundingClientRect()
        if (r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1) {
          bad.push(`clipped: "${el.textContent.trim().slice(0, 22)}" right=${Math.round(r.right)} bottom=${Math.round(r.bottom)}`)
        }
      }
      return bad
    })
    if (overflow.length) throw new Error(`layout overflows:\n  ${overflow.join('\n  ')}`)

    const out = isAbsolute(opt.out) ? opt.out : join(repoDir, opt.out)
    mkdirSync(dirname(out), { recursive: true })
    const big = join(tmpdir(), `thumb-film-${Date.now()}.png`)
    await page.screenshot({ path: big })
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', big, '-vf', 'scale=1280:720:flags=lanczos', out])
    rmSync(big, { force: true })
    console.log(`\n✅ ${out}  (${opt.theme}, ${opt.source}, mark ${opt.mark})`)
  } finally {
    await browser.close()
    app.child?.kill('SIGTERM')
  }
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1) })
