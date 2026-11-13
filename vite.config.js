import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// LaunchBuilder v44 — modern output (smaller, faster), each screen in its own file
export default defineConfig({
  plugins: [react()],
  build: { target: 'es2020', cssCodeSplit: true, chunkSizeWarningLimit: 900, reportCompressedSize: false },
})
