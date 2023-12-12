import image from '@rollup/plugin-image'
import rollupTypescript from 'rollup-plugin-typescript2'
import ttypescript from 'ttypescript'

import pkg from './package.json'

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
        typescript: ttypescript
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
