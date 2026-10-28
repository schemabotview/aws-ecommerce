import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// As in every GraphL content repo: `dedupe` keeps ONE react / react-dom across this app and both
// @graphlearning packages (they declare them as peers), and `base` is `/<repo-slug>/` for the
// production build only — the app deploys under graphl.in/aws-ecommerce/; dev and the recorders stay
// at `/`. 5173 is every content repo's dev port (graphl-flow's gallery is 5175, the shell's 5176).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/aws-ecommerce/' : '/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: { port: 5173 },
}))
