const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = ({ config }) => {
  // css-modules.
  config.module.rules.find(
    (rule) => rule.test.toString() === '/\\.css$/'
  ).exclude = /\.module\.css$/
  config.module.rules.push({
    test: /\.module\.css$/,
    loaders: [
      require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1,
          modules: {
            localIdentName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    ]
  })

  // SVGR
  const assetRule = config.module.rules.find(({ test }) => test.test('.svg'))
  const assetLoader = {
    loader: assetRule.loader,
    options: assetRule.options || assetRule.query
  }
  config.module.rules.unshift({
    test: /\.svg$/,
    use: ['@svgr/webpack', assetLoader]
  })

  config.resolve.plugins.unshift(new TsconfigPathsPlugin())

  return config
}
