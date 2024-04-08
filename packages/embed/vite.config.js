import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import process from 'process/browser'
import { defineConfig, loadEnv } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const port = parseInt(env.VITE_PORT ?? '3000')

  const base = command === 'build' ? '/embed/' : '/'
  return {
    base,
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
      })
    ],
    resolve: {
      alias: {
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
