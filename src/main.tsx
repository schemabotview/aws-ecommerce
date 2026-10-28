import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Three stylesheets, in cascade order — the last one wins, and it is the only one this repo owns:
//   engine — @graphlearning/graphl-flow's node styles and the IBM Plex faces (Mono: code and tables)
//   shell  — the concept-app layout and surface (it paints --bg, the canvas the engine's theme matches)
//   theme  — this repo's brand token
import '@graphlearning/graphl-flow/styles.css'
import '@graphlearning/shell/styles.css'
import './theme.css'
import { ConceptApp } from '@graphlearning/shell'
import { COURSES } from './content'
import { getScene } from './scenes'

// The whole app: router, section view, catalog and narration are @graphlearning/shell's; this repo
// supplies its two registries and its name. audioBase comes from here because import.meta.env is
// replaced at THIS app's build time (README of @graphlearning/shell, contract 3).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConceptApp subject="AWS" courses={COURSES} getScene={getScene} audioBase={import.meta.env.BASE_URL} />
  </StrictMode>,
)
