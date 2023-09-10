import image from '@rollup/plugin-image'
import rollupTypescript from 'rollup-plugin-typescript2'

import pkg from './package.json'

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.module,
        format: 'es',
        exports: 'named',
        sourcemap: true
      },
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: [
      rollupTypescript({
        typescript: require('ttypescript'),
        tsconfigDefaults: {
          compilerOptions: {
            plugins: [
              { transform: 'typescript-transform-paths' },
              {
                transform: 'typescript-transform-paths',
                afterDeclarations: true
              }
            ]
          }
        }
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
