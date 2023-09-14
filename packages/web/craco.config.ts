import path from 'path'

import {
  Configuration,
  ProvidePlugin,
  ResolvePluginInstance,
  SourceMapDevToolPlugin
} from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

const isProd = process.env.NODE_ENV === 'production'
const analyze = process.env.BUNDLE_ANALYZE === 'true'

const SOURCEMAP_URL = 'https://s3.us-west-1.amazonaws.com/sourcemaps.audius.co/'

type ModuleScopePlugin = ResolvePluginInstance & {
  allowedPaths: string[]
}

function resolveModule(moduleName: string) {
  return path.resolve(`../../node_modules/${moduleName}`)
}

/**
 * List of modules to resolve to a single instance, which improves performance
 * and is a requirement for some packages that expect to be singletons.
 */
const moduleResolutions = [
  // modules that require single instances:
  'react',
  'react-dom',
  'react-redux',
  'react-router',
  'react-router-dom',
  // packages that are large and are highly duplicated:
  '@solana/web3.js',
  'bn.js',
  'moment',
  'lodash',
  '@audius/sdk'
]

// These should match modules defined in resolve.alias, and need to be hotwired
// into CRA's module-scope-plugin to take effect.
function injectModulesToModuleScopePlugin(plugin: ModuleScopePlugin) {
  const modulePaths = moduleResolutions.map(resolveModule)
  plugin.allowedPaths = [...plugin.allowedPaths, ...modulePaths]
}

export default {
  webpack: {
    configure: (config: Configuration) => {
      if (config.resolve?.plugins) {
        const [moduleScopePlugin] = config.resolve?.plugins
        injectModulesToModuleScopePlugin(moduleScopePlugin as ModuleScopePlugin)
      }

      return {
        ...config,
        module: {
          ...config.module,
          rules: [
            ...(config.module?.rules ?? []),
            {
              test: /\.js$/,
              enforce: 'pre',
              use: ['source-map-loader']
            },
            {
              test: /\.wasm$/,
              type: 'webassembly/async'
            },
            {
              test: /\.(glsl|vs|fs|vert|frag)$/,
              exclude: /node_modules/,
              use: ['raw-loader', 'glslify-loader'],
              type: 'javascript/auto'
            },
            {
              test: /\.m?js$/,
              resolve: {
                fullySpecified: false // disable the behavior
              }
            }
          ]
        },
        plugins: [
          ...(config.plugins ?? []),
          // Can't get ProvidePlugin to work even with a fully
          // specified path. Defining `process` and `Buffer` in
          // in index.tsx manually
          new ProvidePlugin({
            // process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
          }),
          ...(isProd
            ? [
                new SourceMapDevToolPlugin({
                  publicPath: SOURCEMAP_URL,
                  filename: '[file].map'
                })
              ]
            : []),

          ...(analyze ? [new BundleAnalyzerPlugin()] : [])
        ],
        experiments: {
          ...config.experiments,
          asyncWebAssembly: true
        },
        resolve: {
          ...config.resolve,
          fallback: {
            ...config.resolve?.fallback,
            assert: require.resolve('assert'),
            constants: require.resolve('constants-browserify'),
            child_process: false,
            crypto: require.resolve('crypto-browserify'),
            fs: false,
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            net: false,
            os: require.resolve('os-browserify'),
            path: require.resolve('path-browserify'),
            stream: require.resolve('stream-browserify'),
            url: require.resolve('url'),
            zlib: require.resolve('browserify-zlib')
          },
          alias: {
            ...config.resolve?.alias,
            ...moduleResolutions.reduce(
              (aliases, moduleName) => ({
                ...aliases,
                [moduleName]: resolveModule(moduleName)
              }),
              {}
            )
          }
        },
        ignoreWarnings: [
          function ignoreSourcemapsloaderWarnings(warning: any) {
            return (
              warning.module &&
              warning.module.resource.includes('node_modules') &&
              warning.details &&
              warning.details.includes('source-map-loader')
            )
          }
        ]
      }
    }
  },
  eslint: {
    enable: false
  },
  typescript: {
    enableTypeChecking: false
  },
  devServer: {
    client: { overlay: { errors: true, warnings: false, runtimeErrors: false } }
  }
}
