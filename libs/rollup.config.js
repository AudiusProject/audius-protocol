import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import alias from '@rollup/plugin-alias'
import ignore from 'rollup-plugin-ignore'

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

// These need to be internal because they either:
// * contain deps that need to be polyfilled via `nodePolyfills`
// * are ignored via `ignore`
const internal = [
  '@audius/hedgehog',
  'cipher-base',
  'ethereumjs-wallet',
  'ethereumjs-util',
  'ethereumjs-tx',
  'eth-sig-util',
  'graceful-fs',
  'node-localstorage',
  'web3'
]

// Previously ignored via the `browser` field
//
// "browser": {
//   "fs": false,
//   "node-localstorage": false,
//   "crypto": false,
//   "web3": false,
//   "esm": false,
//   "ipfs-unixfs-importer": false,
//   "stream": false,
//   "interface-blockstore": false,
//   "interface-store": false,
//   "multiformats/cid": false
// },

const browserConfig = {
  plugins: [
    ignore(['web3', 'graceful-fs', 'node-localstorage']),
    resolve({ browser: false, extensions, preferBuiltins: false }),
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
  /**
   * SDK
   */
  {
    input: 'src/sdk/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', exports: 'auto', sourcemap: true }
    ],
    ...commonConfig
  },

  {
    input: './src/sdk/index.ts',
    output: [{ file: pkg.types, format: 'cjs' }],
    ...commonTypeConfig
  },

  /**
   * Bundle for a browser environment
   */
  {
    input: 'src/sdk/index.ts',
    output: [
      { file: pkg.browser, format: 'cjs', exports: 'auto', sourcemap: true }
    ],
    ...browserConfig
  },

  /**
   * core (used for eager requests)
   */
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
