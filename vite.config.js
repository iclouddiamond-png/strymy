import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'strymy'

  return {
    plugins: [react()],
    base: mode === 'production' ? `/${repoName}/` : '/',
    build: {
      outDir: 'docs',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
