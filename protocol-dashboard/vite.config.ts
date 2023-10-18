import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// Custom plugin to replace dashboard path in index.html
function htmlReplacementsPlugin() {
  return {
    name: 'html-replacements',
    transformIndexHtml(html: string) {
      return html.replace(/%VITE_DASHBOARD_BASE_URL%/g, process.env.VITE_DASHBOARD_BASE_URL || '/')
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    tsconfigPaths({
      root: 'protocol-dashboard'
    }),
    svgr(),
    
    nodePolyfills({
      exclude: ['fs'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    htmlReplacementsPlugin(),
  ],

  resolve: {
    alias: {
      components: "/src/components",
      containers: "/src/containers",
      services: "/src/services",
      utils: "/src/utils",
      store: "/src/store",
      hooks: "/src/hooks",
      models: "/src/models",
      types: "/src/types",
      assets: "/src/assets",
    },
  },

  server: {
    host: "0.0.0.0",
  },
  // Base URL. Set to /dashboard/ in Dockerfile.
  // When deploying: leave DASHBOARD_BASE_URL unset
  base: process.env.DASHBOARD_BASE_URL || '/',
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
