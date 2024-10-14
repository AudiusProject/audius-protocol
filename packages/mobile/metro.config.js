const path = require('path')

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const defaultConfig = getDefaultConfig(__dirname)
const {
  resolver: { sourceExts, assetExts }
} = defaultConfig

const clientPath = path.resolve(__dirname, '../web')
const commonPath = path.resolve(__dirname, '../../packages/common')
const harmonyPath = path.resolve(__dirname, '../../packages/harmony')
const splPath = path.resolve(__dirname, '../../packages/spl')
const libsPath = path.resolve(__dirname, '../../packages/libs')
const sdkPath = path.resolve(__dirname, '../../packages/sdk')
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

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
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
    libsPath,
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
      '~': path.resolve(__dirname, '../common/src'),

      // The following imports are needed for @audius/common
      // and @audius/web to compile correctly
      'react-redux': resolveModule('react-redux'),
      'react-native-svg': resolveModule('react-native-svg'),
      'react-native': resolveModule('react-native'),
      react: resolveModule('react'),

      // Aliases for '@audius/web' to allow for absolute paths
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

      if (moduleName === '@metaplex-foundation/umi/serializers') {
        return {
          filePath: `${resolveModule(
            '@metaplex-foundation/umi'
          )}/dist/cjs/serializers.cjs`,
          type: 'sourceFile'
        }
      }

      return context.resolveRequest(context, moduleName, platform)
    }
  },
  maxWorkers: 2
}

const mergedConfig = mergeConfig(defaultConfig, config)

if (process.env.RN_STORYBOOK) {
  mergedConfig.resolver.resolverMainFields.unshift('sbmodern')
}

if (process.env.RN_E2E)
  mergedConfig.resolver.sourceExts = ['e2e.ts', ...config.resolver.sourceExts]

module.exports = mergedConfig
