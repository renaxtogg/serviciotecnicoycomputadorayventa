import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  build: {
    ssr: true,
    outDir: 'smoke/out',
    emptyOutDir: true,
    rollupOptions: {
      input: { smoke: 'smoke/smoke.ts', render: 'smoke/render.tsx' },
      output: { entryFileNames: '[name].mjs' },
    },
  },
})
