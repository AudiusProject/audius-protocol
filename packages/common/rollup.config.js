import dts from 'rollup-plugin-dts'
import rollupTypescript from 'rollup-plugin-typescript2'

import pkg from './package.json'
import tsconfig from './tsconfig.json'

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
    plugins: [rollupTypescript()]
  },
  {
    input: './dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      dts({
        compilerOptions: tsconfig.compilerOptions
      })
    ]
  }
]
