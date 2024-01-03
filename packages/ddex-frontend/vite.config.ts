import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const isDevelopment = process.env.NODE_ENV !== 'production';

export default defineConfig({
  server: {
    proxy: isDevelopment ? {
      '/api': 'http://localhost:8926' // Assuming port for ../backend Express server is unchanged
    } : {}
  },
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
  base: '/ddex/',
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
