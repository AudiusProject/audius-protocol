module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    // https://github.com/react-native-community/cli/blob/0e63e750a235062cd9bc43ed6a4a2beb8f14385a/docs/autolinking.md#how-can-i-disable-autolinking-for-new-architecture-fabric-turbomodules
    '@react-native-community/datetimepicker': {
      platforms: {
        android: {
          libraryName: null,
          componentDescriptors: null,
          androidMkPath: null,
          cmakeListsPath: null
        }
      }
    },
    ...(process.env.NO_FLIPPER
      ? { 'react-native-flipper': { platforms: { ios: null } } }
      : {})
  }
}
