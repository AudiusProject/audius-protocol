import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      root: './packages/ddex'
    }),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      components: "/src/components",
      pages: "/src/pages",
      providers: "/src/providers",
      utils: "/src/utils",
      hooks: "/src/hooks",
      assets: "/src/assets",
    },
  },
  // Set to /ddex/ in Dockerfile. Leave unset ('/') if deploying standalone in the future (e.g., to Cloudflare Pages).
  base: process.env.DDEX_BASE_URL || '/',
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
