import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import glslify from 'vite-plugin-glslify'
import svgr from 'vite-plugin-svgr'

const analyze = process.env.BUNDLE_ANALYZE === 'true'

export default defineConfig({
  build: {
    outDir: 'build',
    sourcemap: true,
    commonjsOptions: {
      include: [/libs\/dist\/web-libs/, /node_modules/]
    }
  },
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ['@audius/sdk/dist/web-libs'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        })
      ]
    }
  },
  plugins: [
    // TODO: Enable once https://github.com/aleclarson/vite-tsconfig-paths/issues/110
    // is resolved
    // tsconfigPaths({
    //   root: './packages'
    // }),
    glslify(),
    svgr({
      include: '**/*.svg'
    }),
    react(),
    ...((analyze
      ? [
          visualizer({
            template: 'treemap',
            open: true,
            gzipSize: true,
            filename: 'analyse.html'
          })
        ]
      : []) as any)
  ],
  resolve: {
    alias: {
      // Should be able to use vite-tsconfig-paths instead
      assets: '/src/assets',
      common: '/src/common',
      components: '/src/components',
      hooks: '/src/hooks',
      pages: '/src/pages',
      services: '/src/services',
      store: '/src/store',
      workers: '/src/workers',
      utils: '/src/utils',

      os: require.resolve('os-browserify'),
      path: require.resolve('path-browserify'),
      url: require.resolve('url'),
      zlib: require.resolve('browserify-zlib'),
      crypto: require.resolve('crypto-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      stream: require.resolve('stream-browserify'),
      // Resolve to lodash-es to support tree-shaking
      lodash: 'lodash-es'
    }
  },
  server: {
    port: parseInt(process.env.PORT ?? '3000')
  }
})
