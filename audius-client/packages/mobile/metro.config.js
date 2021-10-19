const { getDefaultConfig } = require('metro-config')

// If developing locally and using yalc
// to manage local audius-client dependency,
// change this to '.yalc'
const AUDIUS_CLIENT_LOCATION = 'node_modules'
const clientPath = path =>
  `${__dirname}/${AUDIUS_CLIENT_LOCATION}/audius-client/src/${path}`

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts }
  } = await getDefaultConfig()
  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: false
        }
      }),
      babelTransformerPath: require.resolve('react-native-svg-transformer')
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg', 'cjs'],

      extraNodeModules: {
        // This is used to resolve the absolute paths found in audius-client.
        // Eventually all shared state logic will live in @audius/client-common
        // and this can be removed
        ...[
          'assets',
          'audio',
          'common',
          'containers',
          'models',
          'schemas',
          'services',
          'store',
          'utils',
          'workers'
        ].reduce(
          (result, current) => ({ ...result, [current]: clientPath(current) }),
          {}
        ),

        // Some modules import native node modules without necessarily using them.
        // This mocks them out so the app can build
        crypto: `${__dirname}/node_modules/expo-crypto`,
        fs: `${__dirname}/node_modules/react-native-fs`,
        child_process: `${__dirname}/src/mocks/empty.ts`,
        http: `${__dirname}/src/mocks/empty.ts`,
        https: `${__dirname}/src/mocks/empty.ts`,
        stream: `${__dirname}/src/mocks/empty.ts`
      }
    },
    maxWorkers: 2
  }
})()
