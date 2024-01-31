module.exports = (api) => {
  const babelEnv = api.env()
  const plugins = [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        root: ['.'],
        alias: {
          '@audius/common/messages': '../common/src/messages',
          '@audius/common/hooks': '../common/src/hooks',
          '@audius/common/context': '../common/src/context',
          '@audius/common/api': '../common/src/api',
          '@audius/common/models': '../common/src/models',
          '@audius/common/utils': '../common/src/utils',
          '@audius/common/schemas': '../common/src/schemas'
        }
      }
    ]
  ]

  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }])
  }

  plugins.push('react-native-reanimated/plugin')

  return {
    presets: [
      [
        'module:@react-native/babel-preset',
        { useTransformReactJSXExperimental: true }
      ]
    ],
    plugins
  }
}
