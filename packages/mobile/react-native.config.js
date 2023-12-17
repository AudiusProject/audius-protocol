module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    ...(process.env.NO_FLIPPER
      ? { 'react-native-flipper': { platforms: { ios: null } } }
      : {})
  }
}
