const path = require('path')

const { getDefaultConfig } = require('@react-native/metro-config')

const clientPath = path.resolve(__dirname, '../web')
const commonPath = path.resolve(__dirname, '../../packages/common')
const harmonyPath = path.resolve(__dirname, '../../packages/harmony')
const splPath = path.resolve(__dirname, '../../packages/spl')
const sdkPath = path.resolve(__dirname, '../../packages/libs')
const emptyPolyfill = path.resolve(__dirname, 'src/mocks/empty.ts')
const fixedDecimalPath = path.resolve(__dirname, '../../packages/fixed-decimal')

const resolveModule = (module) =>
  path.resolve(__dirname, '../../node_modules', module)

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
    resolver: { sourceExts, assetExts, resolverMainFields }
  } = await getDefaultConfig()

  const config = {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: true,
          inlineRequires: true
        }
      }),
      babelTransformerPath: require.resolve('react-native-svg-transformer')
    },
    watchFolders: [
      path.resolve(__dirname, '../../node_modules'),
      clientPath,
      commonPath,
      harmonyPath,
      sdkPath,
      fixedDecimalPath,
      splPath
    ],
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg', 'cjs', 'workerscript'],
      extraNodeModules: {
        ...require('node-libs-react-native'),
        // Alias for 'src' to allow for absolute paths
        app: path.resolve(__dirname, 'src'),
        '@audius/harmony-native': path.resolve(__dirname, 'src/harmony-native'),

        // The following imports are needed for @audius/common
        // and audius-client to compile correctly
        'react-redux': resolveModule('react-redux'),
        'react-native-svg': resolveModule('react-native-svg'),
        'react-native': resolveModule('react-native'),
        react: resolveModule('react'),

        // Aliases for 'audius-client' to allow for absolute paths
        ...getClientAliases(),

        // Various polyfills to enable @audius/sdk to run in react-native
        child_process: emptyPolyfill,
        fs: resolveModule('react-native-fs'),
        net: emptyPolyfill,
        tls: resolveModule('tls-browserify')
      },
      resolveRequest: (context, moduleName, platform) => {
        if (moduleName === 'react') {
          return {
            filePath: `${resolveModule('react')}/index.js`,
            type: 'sourceFile'
          }
        }

        if (moduleName === 'react-redux') {
          return {
            filePath: `${resolveModule('react-redux')}/lib/index.js`,
            type: 'sourceFile'
          }
        }
        return context.resolveRequest(context, moduleName, platform)
      }
    },
    maxWorkers: 2
  }

  if (process.env.RN_STORYBOOK) {
    resolverMainFields.unshift('sbmodern')
    config.resolver.resolverMainFields = resolverMainFields
  }

  if (process.env.RN_E2E)
    config.resolver.sourceExts = ['e2e.ts', ...config.resolver.sourceExts]

  return config
})()
