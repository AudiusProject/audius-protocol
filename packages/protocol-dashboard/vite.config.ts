import path from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
    wasm(),
    svgr({
      include: '**/*.svg'
    }),

    nodePolyfills({
      exclude: ['fs'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ],

  resolve: {
    alias: {
      components: '/src/components',
      containers: '/src/containers',
      services: '/src/services',
      utils: '/src/utils',
      store: '/src/store',
      hooks: '/src/hooks',
      models: '/src/models',
      types: '/src/types',
      assets: '/src/assets',
      '@audius/common/src': path.resolve(__dirname, '../common/src'),
      '~': path.resolve(__dirname, '../../packages/common/src')
      // '@audius/harmony/dist': path.resolve(__dirname, '../harmony/dist')
      // '@audius/harmony': path.resolve(__dirname, '../harmony/src')
    }
  },

  server: {
    host: '0.0.0.0'
  },
  // Base URL. Set DASHBOARD_BASE_URL to /dashboard/ in Dockerfile.
  // When deploying: leave DASHBOARD_BASE_URL unset (or set to './')
  base: process.env.VITE_DASHBOARD_BASE_URL || './',
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
})
