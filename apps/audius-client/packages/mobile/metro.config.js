const path = require('path')

const { getDefaultConfig } = require('metro-config')

const clientPath = path.resolve(__dirname, '../web')
const commonPath = path.resolve(__dirname, '../common')
const emptyPolyfill = path.resolve(__dirname, 'src/mocks/empty.ts')

const resolveModule = (module) =>
  path.resolve(__dirname, 'node_modules', module)

const getClientAliases = () => {
  const clientAbsolutePaths = [
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
  ]

  return clientAbsolutePaths.reduce(
    (clientPaths, currentPath) => ({
      [currentPath]: path.resolve(clientPath, 'src', currentPath),
      ...clientPaths
    }),
    {}
  )
}

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
        ...require('node-libs-react-native'),
        // Alias for 'src' to allow for absolute paths
        app: path.resolve(__dirname, 'src'),
        'react-native': resolveModule('react-native'),
        // Aliases for 'audius-client' to allow for absolute paths
        ...getClientAliases(),

        // Various polyfills to enable @audius/sdk to run in react-native
        child_process: emptyPolyfill,
        fs: resolveModule('react-native-fs'),
        net: emptyPolyfill,
        tls: resolveModule('tls-browserify')
      }
    },
    maxWorkers: 2
  }
})()
