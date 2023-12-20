import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import {nodePolyfills} from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  // Set to /ddex/ in Dockerfile. Leave unset ('/') if deploying standalone in the future (e.g., to Cloudflare Pages).
  base: process.env.DDEX_BASE_URL || '/',
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
