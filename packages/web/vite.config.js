import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'
import svgr from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'

const analyze = import.meta.env.BUNDLE_ANALYZE === 'true'

export default defineConfig(async () => {
  const glsl = (await import('vite-plugin-glsl')).default
  return {
    build: {
      outDir: 'build',
      sourcemap: true
    },
    optimizeDeps: {
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
      glsl(),
      svgr({
        include: '**/*.svg'
      }),
      react(),
      eslint(),
      analyze
        ? visualizer({
            template: 'treemap', // or sunburst
            open: true,
            gzipSize: true,
            filename: 'analyse.html' // will be saved in project's root
          })
        : undefined
    ],
    resolve: {
      alias: {
        // Should be able to use the ts resolve paths plugin instead
        assets: '/src/assets',
        common: '/src/common',
        components: '/src/components',
        hooks: '/src/hooks',
        pages: '/src/pages',
        services: '/src/services',
        store: '/src/store',
        workers: '/src/workers',
        utils: '/src/utils',
        stream: require.resolve('stream-browserify'),
        lodash: 'lodash-es'
      },
      preserveSymlinks: true
    },
    server: {
      port: 3000
    }
  }
})
