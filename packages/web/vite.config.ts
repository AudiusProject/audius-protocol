/// <reference types="vitest" />

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import process from 'process/browser'
import { visualizer } from 'rollup-plugin-visualizer'
import vike from 'vike/plugin'
import { defineConfig, loadEnv } from 'vite'
import glslify from 'vite-plugin-glslify'
import svgr from 'vite-plugin-svgr'

const fixAcceptHeader404 = () => ({
  // Fix issue with vite dev server and `wait-on`
  // https://github.com/vitejs/vite/issues/9520
  // Can be removed when upgrading to vite5.
  name: 'fix-accept-header-404',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.headers.accept === 'application/json, text/plain, */*') {
        req.headers.accept = '*/*'
      }
      next()
    })
  }
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const port = parseInt(env.VITE_PORT ?? '3000')
  const analyze = env.VITE_BUNDLE_ANALYZE === 'true'
  const ssr = env.VITE_SSR === 'true'
  env.VITE_PUBLIC_URL = env.VITE_PUBLIC_URL ?? ''

  return {
    base: env.VITE_PUBLIC_URL || '/',
    build: {
      outDir: ssr ? 'build-ssr' : 'build',
      sourcemap: false,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },
    define: {
      // Using `process.env` to support mobile,
      // This can be removed once the common migration is complete
      'process.env': env
    },
    optimizeDeps: {
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
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin']
        }
      }),
      ...(ssr ? [vike()] : []),
      ...((analyze
        ? [
            visualizer({
              template: 'treemap',
              open: true,
              gzipSize: true,
              filename: 'analyse.html'
            })
          ]
        : []) as any),
      fixAcceptHeader404()
    ],
    resolve: {
      alias: {
        // Should be able to use vite-tsconfig-paths instead
        app: '/src/app',
        assets: '/src/assets',
        common: '/src/common',
        components: '/src/components',
        hooks: '/src/hooks',
        pages: '/src/pages',
        'public-site': '/src/public-site',
        services: '/src/services',
        store: '/src/store',
        workers: '/src/workers',
        utils: '/src/utils',
        ssr: '/src/ssr',

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
      host: '0.0.0.0',
      port
    },
    test: {
      environment: 'jsdom'
    }
  }
})
