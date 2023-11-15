/// <reference types="vitest" />

import fs from 'fs'
import path, { resolve } from 'path'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import process from 'process/browser'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import EntryShakingPlugin from 'vite-plugin-entry-shaking'
import glslify from 'vite-plugin-glslify'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const port = parseInt(env.VITE_PORT ?? '3000')
  const analyze = env.VITE_BUNDLE_ANALYZE === 'true'

  const indexPaths = await findFoldersWithIndexTs(
    resolve(__dirname, '../common/src')
  )

  const targets = [
    resolve(__dirname, '../common/src'),
    ...indexPaths
      .map((path) => {
        const p = resolve(
          __dirname,
          '../common/src/',
          path.split('common/src/').pop() ?? ''
        )
        return p
      })
      .filter((path): path is string => !!path)
  ]

  // console.log(targets)
  return {
    base: env.VITE_PUBLIC_URL ?? '/',
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
      EntryShakingPlugin({
        targets
      }),
      // EntryShakingPlugin({
      //   targets: [resolve(__dirname, '../common/src')]
      // }),
      tsconfigPaths({
        projects: ['.', '../common']
      }),
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
        // '@audius/common': resolve(__dirname, '../common/src')
        // ...Object.fromEntries(
        //   indexPaths.map((path) => {
        //     return [`${path}/index.ts`, path]
        //   })
        // )
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

async function findFoldersWithIndexTs(folderPath: string): Promise<string[]> {
  const result: string[] = []

  async function crawl(directory: string): Promise<void> {
    const entries = await fs.promises.readdir(directory, {
      withFileTypes: true
    })

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        const folderFiles = await fs.promises.readdir(fullPath)
        if (folderFiles.includes('index.ts')) {
          result.push(fullPath)
        }
        await crawl(fullPath)
      }
    }
  }

  await crawl(folderPath)
  return result
}
