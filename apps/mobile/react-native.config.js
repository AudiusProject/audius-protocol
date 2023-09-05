module.exports = {
  dependencies: {
    'react-native-video': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-video/android-exoplayer'
        }
      }
    },
    'react-native-threads': {
      platforms: {
        android: null // disable Android platform, other platforms will still autolink if provided
      }
    }
  },
  assets: ['./src/assets/fonts']
}
