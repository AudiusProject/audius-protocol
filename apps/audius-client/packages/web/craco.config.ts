import path from 'path'
import { Configuration, ProvidePlugin, ResolvePluginInstance } from 'webpack'

const isNative = process.env.REACT_APP_NATIVE_NAVIGATION_ENABLED === 'true'

type ModuleScopePlugin = ResolvePluginInstance & {
  allowedPaths: string[]
}

// This ensures we can use the resolve.alias for react/react-dom
function addReactToModuleScopePlugin(plugin: ModuleScopePlugin) {
  const reactLibs = ['react', 'react-dom']
  const reactPaths = reactLibs.map(reactLib =>
    path.resolve(__dirname, 'node_modules', reactLib)
  )
  plugin.allowedPaths = [...plugin.allowedPaths, ...reactPaths]
}

export default {
  webpack: {
    configure: (config: Configuration) => {
      if (config.resolve?.plugins) {
        const [moduleScopePlugin] = config.resolve?.plugins
        addReactToModuleScopePlugin(moduleScopePlugin as ModuleScopePlugin)
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
            }
          ]
        },
        plugins: [
          ...(config.plugins ?? []),
          new ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
          })
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
            ...(isNative
              ? { react: 'react16' }
              : {
                  react: path.resolve('./node_modules/react'),
                  'react-dom': path.resolve('./node_modules/react-dom')
                })
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
  }
}
