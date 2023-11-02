/// <reference types="vitest" />

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import process from 'process/browser'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import glslify from 'vite-plugin-glslify'
import svgr from 'vite-plugin-svgr'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const port = parseInt(env.VITE_PORT ?? '3000')
  const analyze = env.VITE_BUNDLE_ANALYZE === 'true'

  return {
    build: {
      outDir: 'build',
      sourcemap: true,
      commonjsOptions: {
        include: [/libs\/dist\/web-libs/, /node_modules/]
      }
    },
    define: {
      // Using `process.env` to support mobile,
      // This can be removed once the common migration is complete
      'process.env': env
    },
    optimizeDeps: {
      include: ['@audius/sdk/dist/web-libs'],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        },
        plugins: [
          NodeGlobalsPolyfillPlugin({
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
      // Import workerscript as raw string
      // Could use ?raw suffix but it breaks on mobile
      {
        transform(code, id) {
          if (/\.workerscript$/.test(id)) {
            const str = JSON.stringify(code)

            return {
              code: `export default ${str}`
            }
          }
        }
      },
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
      port
    },
    test: {
      environment: 'jsdom'
    }
  }
})
