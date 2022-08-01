import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
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

const pluginTypescript = typescript({
  tsconfigOverride: {
    compilerOptions: {
      module: 'ESNext'
    }
  }
})

const commonConfig = {
  plugins: [
    resolve({ extensions, preferBuiltins: true }),
    pluginTypescript,
    commonjs({ extensions }),
    babel({ babelHelpers: 'bundled', extensions }),
    json()
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
  'web3',
  'xmlhttprequest'
]

const browserConfig = {
  plugins: [
    ignore(['web3', 'graceful-fs', 'node-localstorage']),
    resolve({ extensions, preferBuiltins: false }),
    pluginTypescript,
    commonjs({
      extensions,
      transformMixedEsModules: true
    }),
    alias({
      entries: [{ find: 'stream', replacement: 'stream-browserify' }]
    }),
    nodePolyfills(),
    babel({ babelHelpers: 'bundled', extensions }),
    json()
  ],
  external: external.filter((dep) => !browserInternal.includes(dep))
}

const browserDistFileConfig = {
  plugins: [
    ignore(['web3', 'graceful-fs', 'node-localstorage']),
    resolve({ extensions, preferBuiltins: false, browser: true }),
    pluginTypescript,
    commonjs({
      extensions,
      transformMixedEsModules: true
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
    json()
  ],
  external: ['web3']
}

const browserLegacyConfig = {
  plugins: [
    ignore(['web3', 'graceful-fs', 'node-localstorage']),
    resolve({ extensions, preferBuiltins: true }),
    pluginTypescript,
    commonjs({ extensions }),
    alias({
      entries: [{ find: 'stream', replacement: 'stream-browserify' }]
    }),
    babel({ babelHelpers: 'bundled', extensions }),
    json()
  ],
  external
}

export default [
  /**
   * SDK
   */
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    ...commonConfig
  },

  /**
   * SDK bundled for a browser environment (includes polyfills for node libraries)
   * Does not include libs but does include polyfills
   */
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.browser.cjs.js', format: 'es', sourcemap: true },
      { file: 'dist/index.browser.esm.js', format: 'es', sourcemap: true }
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
        file: 'dist/sdk.js',
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
    input: 'src/legacy.ts',
    output: [{ file: 'dist/legacy.js', format: 'cjs', sourcemap: true }],
    ...browserLegacyConfig
  },

  /**
   * core (used for eager requests)
   */
  {
    input: 'src/core.ts',
    output: [
      { file: 'dist/core.cjs.js', format: 'cjs', sourcemap: true },
      { file: 'dist/core.esm.js', format: 'es', sourcemap: true }
    ],
    ...commonConfig
  }
]
