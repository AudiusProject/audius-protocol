import { Configuration, ProvidePlugin } from 'webpack'

const cracoConfig = {
  webpack: {
    configure: (config: Configuration) => {
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
  }
}

export default cracoConfig
