import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import alias from '@rollup/plugin-alias'

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
    'hashids/cjs'
  ]
}

// These need to be internal so they are polyfilled via `nodePolyfills`
const internal = [
  'ethereumjs-wallet',
  'ethereumjs-util',
  'ethereumjs-tx',
  'eth-sig-util'
]

const browserSdkConfig = {
  plugins: [
    resolve({ extensions, preferBuiltins: false }),
    commonjs({
      extensions,
      transformMixedEsModules: true,
      dynamicRequireTargets: [
        'data-contracts/ABIs/*.json',
        'eth-contracts/ABIs/*.json'
      ]
    }),
    alias({
      entries: [{ find: 'stream', replacement: 'stream-browserify' }]
    }),
    nodePolyfills(),
    babel({ babelHelpers: 'bundled', extensions }),
    json(),
    typescript()
  ],
  external: [
    ...Object.keys(pkg.dependencies).filter((dep) => !internal.includes(dep)),
    ...Object.keys(pkg.devDependencies),
    'ethers/lib/utils',
    'ethers/lib/index',
    'hashids/cjs'
  ]
}

const commonTypeConfig = {
  plugins: [dts()]
}

export default [
  {
    input: 'src/libs.js',
    output: [
      { file: pkg.libs, format: 'cjs', exports: 'auto', sourcemap: true }
    ],
    ...commonConfig
  },
  {
    input: './src/types.ts',
    output: [{ file: pkg.libsTypes, format: 'cjs' }],
    ...commonTypeConfig
  },
  {
    input: 'src/sdk/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', exports: 'auto', sourcemap: true }
    ],
    ...browserSdkConfig
  },
  {
    input: 'src/sdk/index.ts',
    output: [
      { file: pkg.browser, format: 'cjs', exports: 'auto', sourcemap: true }
    ],
    ...commonConfig
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
  }
]
