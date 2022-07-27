const path = require('path')

const { getDefaultConfig } = require('metro-config')

const clientPath = path.resolve(__dirname, '../web')
const commonPath = path.resolve(__dirname, '../common')

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts }
  } = await getDefaultConfig()
  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: true,
          inlineRequires: true
        }
      }),
      babelTransformerPath: require.resolve('react-native-svg-transformer')
    },
    watchFolders: [clientPath, commonPath],
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg', 'cjs'],
      nodeModulesPaths: [path.resolve(clientPath, 'node_modules')],
      extraNodeModules: {
        // Alias for 'src' to allow for absolute paths
        app: path.resolve(__dirname, 'src'),
        // This is used to resolve the absolute paths found in audius-client.
        // Eventually all shared state logic will live in @audius/client-common
        // and this can be removed
        ...[
          'assets',
          'audio',
          'common',
          'pages',
          'models',
          'schemas',
          'services',
          'store',
          'utils',
          'workers'
        ].reduce(
          (result, current) => ({
            ...result,
            [current]: path.resolve(clientPath, 'src', current)
          }),
          {}
        ),

        // Some modules import native node modules without necessarily using them.
        // This mocks them out so the app can build
        'react-native': path.resolve(__dirname, 'node_modules/react-native'),
        crypto: path.resolve(__dirname, 'node_modules/expo-crypto'),
        fs: path.resolve(__dirname, 'node_modules/react-native-fs'),
        child_process: path.resolve(__dirname, 'src/mocks/empty.ts'),
        http: path.resolve(__dirname, 'src/mocks/empty.ts'),
        https: path.resolve(__dirname, 'src/mocks/empty.ts'),
        stream: path.resolve(__dirname, 'src/mocks/empty.t')
      }
    },
    maxWorkers: 2
  }
})()
