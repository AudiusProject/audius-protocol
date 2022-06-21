import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import dts from 'rollup-plugin-dts'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import alias from '@rollup/plugin-alias'
import ignore from 'rollup-plugin-ignore'

import pkg from './package.json'

const extensions = ['.js', '.ts']

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.devDependencies),
  'ethers/lib/utils',
  'ethers/lib/index',
  'hashids/cjs'
]

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
  external
}

// For the browser bundle, these need to be internal because they either:
// * contain deps that need to be polyfilled via `nodePolyfills`
// * are ignored via `ignore`
const browserInternal = [
  'eth-sig-util',
  'ethereumjs-tx',
  'ethereumjs-util',
  'ethereumjs-wallet',
  'graceful-fs',
  'node-localstorage',
  'abi-decoder',
  'web3'
]

const browserConfig = {
  plugins: [
    ignore(['web3', 'graceful-fs', 'node-localstorage']),
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
  external: external.filter((dep) => !browserInternal.includes(dep))
}

const browserDistFileConfig = {
  plugins: [
    ignore(['web3', 'graceful-fs', 'node-localstorage']),
    resolve({ extensions, preferBuiltins: false, browser: true }),
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
    babel({
      babelHelpers: 'runtime',
      extensions,
      plugins: ['@babel/plugin-transform-runtime']
    }),
    json(),
    typescript()
  ],
  external: ['web3']
}

const browserLegacyConfig = {
  plugins: [
    ignore(['web3', 'graceful-fs', 'node-localstorage']),
    resolve({ extensions, preferBuiltins: true }),
    commonjs({
      extensions,
      dynamicRequireTargets: [
        'data-contracts/ABIs/*.json',
        'eth-contracts/ABIs/*.json'
      ]
    }),
    alias({
      entries: [{ find: 'stream', replacement: 'stream-browserify' }]
    }),
    babel({ babelHelpers: 'bundled', extensions }),
    json(),
    typescript()
  ],
  external
}

const commonTypeConfig = {
  plugins: [dts()]
}

export default [
  /**
   * SDK
   */
  {
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

  /**
   * SDK bundled for a browser environment (includes polyfills for node libraries)
   * Does not include libs but does include polyfills
   */
  {
    input: 'src/sdk/index.ts',
    output: [
      { file: pkg.browser, format: 'cjs', exports: 'auto', sourcemap: true }
    ],
    ...browserConfig
  },

  /**
   * SDK bundled for prebuilt package file to be used in browser
   * Does not include libs but does include polyfills and all deps/dev deps
   */
  {
    input: 'src/sdk/sdkBrowserDist.ts',
    output: [
      {
        file: pkg.sdkBrowserDistFile,
        globals: {
          web3: 'window.Web3'
        },
        format: 'iife',
        esModule: false,
        sourcemap: true,
        plugins: [terser()]
      }
    ],
    ...browserDistFileConfig
  },

  /**
   * Legacy bundle for a browser environment
   * Includes libs but does not include polyfills
   */
  {
    input: 'src/index.js',
    output: [
      { file: pkg.legacy, format: 'cjs', exports: 'auto', sourcemap: true }
    ],
    ...browserLegacyConfig
  },

  {
    input: './src/types.ts',
    output: [{ file: pkg.legacyTypes, format: 'cjs' }],
    ...commonTypeConfig
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
