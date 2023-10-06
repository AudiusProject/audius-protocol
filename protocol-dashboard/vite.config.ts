import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

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
      // To exclude specific polyfills, add them to this list
      exclude: [
        'fs', // Excludes the polyfill for `fs` and `node:fs`
      ],
      // Whether to polyfill specific globals
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports
      protocolImports: true,
    }),
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

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
