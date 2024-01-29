import { createRequire } from 'node:module'

import image from '@rollup/plugin-image'
import rollupTypescript from 'rollup-plugin-typescript2'

import pkg from './package.json'

const cjsRequire = createRequire(import.meta.url)
const tspCompiler = cjsRequire('ts-patch/compiler')

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist',
        format: 'es',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: [
      rollupTypescript({
        typescript: tspCompiler
      }),
      image()
    ],

    external: [
      ...Object.keys(pkg.dependencies),
      ...Object.keys(pkg.devDependencies),
      ...Object.keys(pkg.peerDependencies),
      'redux-saga/effects',
      'events',
      '@audius/sdk/dist/core',
      'dayjs/plugin/timezone',
      'dayjs/plugin/utc'
    ]
  }
]
