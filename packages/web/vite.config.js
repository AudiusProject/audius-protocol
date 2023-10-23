import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build'
    },
    plugins: [react(), eslint()],
    resolve: {
      alias: {
        // Should be able to use the ts resolve paths plugin instead
        assets: '/src/assets',
        common: '/src/common',
        components: '/src/components',
        hooks: '/src/hooks',
        pages: '/src/pages',
        services: '/src/services',
        store: '/src/store',
        workers: '/src/workers',
        utils: '/src/utils'
      },
      preserveSymlinks: true
    },
    server: {
      port: 3000
    }
  }
})
