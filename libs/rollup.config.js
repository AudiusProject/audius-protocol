import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

import pkg from './package.json'

const extensions = ['.js', '.ts']

const commonConfig = {
  plugins: [
    commonjs({
      extensions,
      dynamicRequireTargets: [
        'data-contracts/ABIs/*.json',
        'eth-contracts/ABIs/*.json'
      ]
    }),
    babel({ babelHelpers: 'bundled', extensions }),
    json(),
    resolve({ extensions, preferBuiltins: true }),
    typescript()
  ],
  external: [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies),
    'ethereumjs-util',
    'ethereumjs-wallet',
    'ethers/lib/utils',
    'ethers/lib/index',
    'hashids/cjs',
  ]
}

const commonTypeConfig = {
  plugins: [dts()]
}

export default [{
  input: 'src/index.js',
  output: [
    { file: pkg.main, format: 'cjs', exports: 'auto', sourcemap: true }
  ],
  ...commonConfig
},
{
  input: './src/types.ts',
  output: [{ file: pkg.types, format: 'cjs' }],
  ...commonTypeConfig
},
{
  input: 'src/core.ts',
  output: [
    { file: pkg.core, format: 'cjs', exports: 'auto', sourcemap: true }
  ],
  ...commonConfig
},
{
  input: './src/core.ts',
  output: [{ file: pkg.coreTypes, format: 'cjs' }],
  ...commonTypeConfig
},
]
