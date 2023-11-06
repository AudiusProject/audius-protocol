import { resolve } from 'path'

import preactSVGLoader from 'preact-cli-svg-loader'

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const RefreshPlugin = require('@prefresh/webpack')
const webpack = require('webpack')

export default function (config, env, helpers) {
  // config.plugins.pop()
  // console.log(config.plugins[config.plugins.length - 1].matcher.name)
  config.plugins.push(new NodePolyfillPlugin())
  // config.plugins.push(new webpack.HotModuleReplacementPlugin())
  // config.plugins.push(new RefreshPlugin())
  // config.plugins.push(new RefreshPlugin())
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
    fs: resolve(__dirname, './src/util/empty.js'),
  }

  // Use any `index` file, not just index.js
  config.resolve.alias['preact-cli-entrypoint'] = resolve(
    process.cwd(),
    'src',
    'index'
  )
  config.resolve.alias = {
    ...config.resolve.alias,
    fs: resolve(__dirname, './src/util/empty.js'),
  }

  // Vendored SVG fix
  // https://github.com/pmcalmeida/preact-cli-svg-loader/blob/master/src/index.js
  // Combined with fix for OTF fonts: https://github.com/preactjs/preact-cli/issues/774
  const urlLoader = helpers.getLoadersByName(config, 'url-loader')
  urlLoader.map(
    (entry) =>
    (entry.rule.test =
      /\.(woff2?|ttf|otf|eot|jpe?g|png|gif|mp4|mov|ogg|webm)(\?.*)?$/i)
  )
  const fileLoader = helpers.getLoadersByName(config, 'file-loader')
  fileLoader.map(
    (entry) =>
    (entry.rule.test =
      /\.(woff2?|ttf|otf|eot|jpe?g|png|gif|mp4|mov|ogg|webm)(\?.*)?$/i)
  )
  const rawLoader = helpers.getLoadersByName(config, 'raw-loader')
  rawLoader.map((entry) => (entry.rule.test = /\.(xml|html|txt|md)$/))
  config.module.rules.push({
    test: /\.svg$/,
    use: ['preact-svg-loader']
  })

  if (env.isProd) {
    // In the production env, we serve the embed player at a path audius.co/embed.
    // Set prefix in the public path so assets can load properly
    config.output.publicPath = '/embed/'
  } else {
    // In the dev environment, we're just running at localhost:<port>, so we can
    // use absolute paths for the public assets
    config.output.publicPath = ''
  }

  return config
}
