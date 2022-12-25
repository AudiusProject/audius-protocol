import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
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

const pluginTypescript = typescript({ tsconfig: './tsconfig.json' })

/**
 * For the browser bundle, these need to be internal because they either:
 * - contain deps that need to be polyfilled via `nodePolyfills`
 * - are ignored via `ignore`
 */
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

export const outputConfigs = {
  /**
   * SDK Node Package
   * Includes libs without any polyfills or deps
   */
  sdkConfig: {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    plugins: [
      resolve({ extensions, preferBuiltins: true }),
      commonjs({ extensions }),
      babel({ babelHelpers: 'bundled', extensions }),
      json(),
      pluginTypescript
    ],
    external
  },

  /**
   * SDK React Native Package
   * Includes some modules inline for polyfills
   */
  sdkConfigReactNative: {
    input: 'src/sdk/index.ts',
    output: [{ file: 'dist/index.native.js', format: 'es', sourcemap: true }],
    plugins: [
      ignore(['web3', 'graceful-fs', 'node-localstorage']),
      resolve({ extensions, preferBuiltins: true }),
      commonjs({ extensions }),
      babel({ babelHelpers: 'bundled', extensions, plugins: [] }),
      json(),
      pluginTypescript
    ],
    external
  },

  /**
   * SDK Browser Package
   * Includes polyfills for node libraries
   */
  sdkBrowserConfig: {
    input: 'src/sdk/index.ts',
    output: [
      { file: 'dist/index.browser.cjs.js', format: 'cjs', sourcemap: true },
      { file: 'dist/index.browser.esm.js', format: 'es', sourcemap: true }
    ],
    plugins: [
      ignore(['web3', 'graceful-fs', 'node-localstorage']),
      resolve({ extensions, preferBuiltins: false }),
      commonjs({
        extensions,
        transformMixedEsModules: true
      }),
      alias({
        entries: [{ find: 'stream', replacement: 'stream-browserify' }]
      }),
      nodePolyfills(),
      babel({ babelHelpers: 'bundled', extensions }),
      json(),
      pluginTypescript
    ],
    external: external.filter((dep) => !browserInternal.includes(dep))
  },

  /**
   * SDK Browser Distributable
   * Meant to be used directly in the browser without any module resolver
   * Includes polyfills and all deps/dev deps
   */
  sdkBrowserDistConfig: {
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
    plugins: [
      ignore(['web3', 'graceful-fs', 'node-localstorage']),
      resolve({ extensions, preferBuiltins: false, browser: true }),
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
      json(),
      pluginTypescript
    ],
    external: ['web3']
  },

  /**
   * Libs Legacy Browser Package
   * Includes libs but does not include polyfills
   */
  legacyBrowserConfig: {
    input: 'src/legacy.ts',
    output: [{ file: 'dist/legacy.js', format: 'cjs', sourcemap: true }],
    plugins: [
      ignore(['web3', 'graceful-fs', 'node-localstorage']),
      resolve({ extensions, preferBuiltins: true }),
      commonjs({ extensions }),
      alias({
        entries: [{ find: 'stream', replacement: 'stream-browserify' }]
      }),
      babel({ babelHelpers: 'bundled', extensions }),
      json(),
      pluginTypescript
    ],
    external
  },

  /**
   * Libs Legacy React Native Package
   * Includes a modified version of AudiusLibs with solana dependencies removed
   */
  legacyReactNativeConfig: {
    input: 'src/native-libs.ts',
    output: [{ file: 'dist/native-libs.js', format: 'es', sourcemap: true }],
    plugins: [
      ignore(['web3', 'graceful-fs', 'node-localstorage']),
      resolve({ extensions, preferBuiltins: true }),
      commonjs({ extensions }),
      alias({
        entries: [{ find: 'stream', replacement: 'stream-browserify' }]
      }),
      babel({ babelHelpers: 'bundled', extensions }),
      json(),
      pluginTypescript
    ],
    external
  },

  /**
   * Core Package
   * Used for eager requests and other libs items that we don't want to load all the deps for
   */
  coreConfig: {
    input: 'src/core.ts',
    output: [{ file: 'dist/core.js', format: 'es', sourcemap: true }],
    plugins: [
      resolve({ extensions, preferBuiltins: true }),
      commonjs({ extensions }),
      babel({ babelHelpers: 'bundled', extensions }),
      json(),
      pluginTypescript
    ],
    external
  }
}

export default Object.values(outputConfigs)
