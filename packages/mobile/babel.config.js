module.exports = (api) => {
  const babelEnv = api.env()
  const plugins = [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
  ]

  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }])
  }

  plugins.push('react-native-reanimated/plugin')

  return {
    presets: [
      [
        'module:metro-react-native-babel-preset',
        { useTransformReactJSXExperimental: true }
      ]
    ],
    plugins
  }
}
