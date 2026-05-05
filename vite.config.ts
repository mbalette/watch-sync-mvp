import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use relative asset URLs so the built static app works from subpath hosts
// such as GitHub Pages (e.g. /watch-sync-mvp/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
