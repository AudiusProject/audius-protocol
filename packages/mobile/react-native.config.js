module.exports = {
  dependencies: {
    'react-native-threads': {
      platforms: {
        android: null // disable Android platform, other platforms will still autolink if provided
      }
    }
  },
  assets: ['./src/assets/fonts']
}
