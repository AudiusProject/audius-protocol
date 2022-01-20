process.env.NODE_ENV = 'production'

const webpackConfigProd = require('react-scripts/config/webpack.config')(
  'production'
)
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin

webpackConfigProd.plugins.push(new BundleAnalyzerPlugin())
webpackConfigProd.output.filename = 'static/js/[name].js'
webpackConfigProd.output.chunkFilename = 'static/js/[name].chunk.js'

webpack(webpackConfigProd, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err)
  }
})
