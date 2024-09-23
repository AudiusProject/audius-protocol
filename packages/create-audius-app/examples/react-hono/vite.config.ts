import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import { UserConfig, defineConfig } from 'vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'


function replaceNodeImports(): Plugin {
  return {
    name: 'replace-node-imports',
    generateBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk') {
          chunk.code = chunk.code
            .replace(/from\s*['"]fs['"]/g, 'from"browserify-fs"')
            .replace(/from\s*['"]crypto['"]/g, 'from"node:crypto"')
            .replace(/from\s*['"]stream['"]/g, 'from"node:stream"')
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [
        react(),
        nodePolyfills({
          globals: {
            process: true,
          },
        }),
      ],
      optimizeDeps: {
        esbuildOptions: {
          define: {
            global: 'globalThis'
          },
          plugins: [
            NodeGlobalsPolyfillPlugin({
              buffer: true,
              process: true
            })
          ]
        }
      },
      build: {
        rollupOptions: {
          input: './src/client/main.tsx',
          output: {
            entryFileNames: 'static/client/main.js',
          },
        },
      }
    } as UserConfig
  }

  return {
    plugins: [
      react(),
      pages({
        entry: 'src/index.tsx'
      }),
      devServer({
        entry: 'src/index.tsx'
      }),
      nodePolyfills({
        protocolImports: true,
        exclude: ['process']
      }),
      replaceNodeImports(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        },
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true
          })
        ]
      }
    },
    ssr: {
      external: ['react', 'react-dom', 'process']
    },
    define: {
      'process.env': {}
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  } as UserConfig
})
