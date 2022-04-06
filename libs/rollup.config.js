import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

import pkg from './package.json'

const extensions = ['.js', '.ts']

export default [{
  input: 'src/index.js',
  output: [
    { file: pkg.main, format: 'cjs', exports: 'auto', sourcemap: true }
  ],
  plugins: [
    commonjs({
      extensions,
      dynamicRequireTargets: [
        'data-contracts/ABIs/*.json',
        'eth-contracts/ABIs/*.json'
      ]
    }),
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
},
{
  input: './src/types.ts',
  output: [{file: pkg.types, format: 'cjs'}],
  plugins: [dts()]
}]
