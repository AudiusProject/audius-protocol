module.exports = api => {
  const babelEnv = api.env()
  const plugins = [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
  ]

  if (babelEnv !== 'development') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }])
  }

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
