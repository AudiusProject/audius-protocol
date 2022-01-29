import { addBeforeLoader, loaderByName, when } from '@craco/craco'
import { Configuration } from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

export default {
  babel: {
    plugins: ['lodash']
  },
  webpack: {
    plugins: when(process.env.BUNDLE_ANALYZE === 'true', () => [
      new BundleAnalyzerPlugin()
    ]),
    configure: (webpackConfig: Configuration) => {
      const wasmExtensionRegExp = /\.wasm$/
      webpackConfig.resolve?.extensions?.push('.wasm')

      webpackConfig.module?.rules.forEach(rule => {
        rule.oneOf?.forEach(oneOf => {
          if (
            typeof oneOf.loader === 'string' &&
            oneOf.loader.indexOf('file-loader') >= 0
          ) {
            if (Array.isArray(oneOf.exclude)) {
              oneOf.exclude.push(wasmExtensionRegExp)
            }
          }
        })
      })

      const wasmLoader = {
        test: /\.wasm$/,
        include: /node_modules\/(bridge|token-bridge)/,
        loaders: ['wasm-loader']
      }

      addBeforeLoader(webpackConfig, loaderByName('file-loader'), wasmLoader)

      return webpackConfig
    }
  },
  // Disabling for now while we upgrade eslint and improve our config
  eslint: {
    enable: false
  }
}
