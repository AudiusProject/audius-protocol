import { createRequire } from 'node:module'

import alias from '@rollup/plugin-alias'
import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'
import json from 'rollup-plugin-json'
import postcss from 'rollup-plugin-postcss'
import rollupTypescript from 'rollup-plugin-typescript2'

import pkg from './package.json' assert { type: 'json' }

const cjsRequire = createRequire(import.meta.url)
const tspCompiler = cjsRequire('ts-patch/compiler')

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  '@emotion/react/jsx-runtime',
  '@emotion/cache',
  '@emotion/is-prop-valid',
  '@emotion/css',
  'bn.js'
]

export default {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'es',
      exports: 'named',
      sourcemap: true,
      preserveModules: true
    }
  ],
  plugins: [
    json(),
    alias({
      // Properly resolve json files from assets folder
      entries: [{ find: /^assets\/(.*)/, replacement: 'src/assets/$1' }]
    }),
    postcss({
      minimize: true,
      extract: 'harmony.css',
      modules: true
    }),
    svgr(),
    rollupTypescript({
      typescript: tspCompiler,
      clean: true
    }),
    url({
      include: ['**/*.png', '**/*.jpg'], // Specify file extensions to handle
      limit: 8192, // Inline files smaller than 8kb as base64 URLs
      emitFiles: true, // Copy larger files to the output directory
      fileName: '[name][extname]' // Customize the output file name
    })
  ],
  external
}
