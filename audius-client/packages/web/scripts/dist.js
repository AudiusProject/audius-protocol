/**
 * Builds distributable desktop applications.
 * Mac:
 *  - Must be run on OSX.
 *  - Codesigns and notarizes the binary
 */

const builder = require('electron-builder')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const notarize = require('electron-notarize').notarize
const program = require('commander')

const PRODUCTION_APP_ID = 'co.audius.app'
const PRODUCTION_NAME = 'Audius'
const PRODUCTION_BUCKET = 'download.audius.co'
const PRODUCTION_ICNS = 'resources/icons/AudiusIcon.icns'
const PRODUCTION_DMG_ICNS = 'resources/icons/AudiusDmgIcon.icns'
const PRODUCTION_ICON = 'resources/icons/AudiusIcon.png'

const STAGING_APP_ID = 'co.audius.bounce.app'
const STAGING_NAME = 'Audius Bounce'
const STAGING_BUCKET = 'download-internal.audius.co'
const STAGING_ICNS = 'resources/icons/BounceIcon.icns'
const STAGING_DMG_ICNS = 'resources/icons/BounceDmgIcon.icns'
const STAGING_ICON = 'resources/icons/BounceIcon.png'

const SCHEME = 'audius'

program
  .option('-m, --mac', 'Build for mac')
  .option('-w, --win', 'Build for windows')
  .option('-l, --linux', 'Build for linux')
  .option('-p, --publish [rule]', 'Add publish rule', '')
  .option(
    '-e, --env [mode]',
    'Selected environment to deploy',
    /^(staging|production)$/i
  )
  .parse(process.argv)

const notarizeFn = async (appId, params) => {
  // Only notarize the app on Mac OS.
  if (process.platform !== 'darwin') {
    return
  }
  const appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`
  )
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`)
  }

  console.log(`Notarizing ${appId} at ${appPath}`)
  try {
    await notarize({
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      ascProvider: process.env.ASC_PROVIDER
    })
  } catch (error) {
    console.error(error)
    // Propagate the error back up.
    throw new Error(error)
  }
  console.log(`Finished notarizing ${appId}`)
}

/**
 * Copy the build directory in to /build so that the electron main.js can be invoked
 * on the correct build.
 * There is currently no easy to way to pass env vars or CLI args to the invocation
 * of the electron.js entry-point or this wouldn't be needed.
 * @param {boolean} isProduction
 */
const copyBuildDir = isProduction => {
  if (isProduction) {
    return fse.copy('build-production', 'build')
  }
  return fse.copy('build-staging', 'build')
}

/**
 * Generates the correct application info/build config based on the environment
 * @param {boolean} isProduction
 */
const makeBuildParams = isProduction => {
  const appId = isProduction ? PRODUCTION_APP_ID : STAGING_APP_ID
  const productName = isProduction ? PRODUCTION_NAME : STAGING_NAME

  const bucket = isProduction ? PRODUCTION_BUCKET : STAGING_BUCKET
  const icns = isProduction ? PRODUCTION_ICNS : STAGING_ICNS
  const dmgIcns = isProduction ? PRODUCTION_DMG_ICNS : STAGING_DMG_ICNS
  const icon = isProduction ? PRODUCTION_ICON : STAGING_ICON

  return {
    config: {
      appId: appId,
      npmRebuild: false,
      productName: productName,
      extends: null,
      directories: {
        buildResources: 'build'
      },
      files: ['build/**/*', 'src/electron.js'],
      protocols: {
        name: 'audius-app',
        schemes: [SCHEME]
      },
      mac: {
        category: 'public.app-category.music',
        icon: icns,
        hardenedRuntime: true,
        entitlements: 'resources/entitlements.mac.plist',
        entitlementsInherit: 'resources/entitlements.mac.plist'
      },
      dmg: {
        icon: dmgIcns,
        background: 'resources/macInstaller@2x.jpg',
        iconSize: 100,
        iconTextSize: 14,
        window: {
          height: 400,
          width: 600
        },
        contents: [
          {
            x: 94,
            y: 198,
            type: 'file'
          },
          {
            x: 492,
            y: 198,
            type: 'link',
            path: '/Applications'
          }
        ]
      },
      win: {
        target: 'nsis',
        icon: icon,
        publisherName: 'Audius, Inc.'
      },
      linux: {
        target: 'AppImage',
        icon: icns,
        category: 'Audio'
      },
      afterSign: async params => notarizeFn(appId, params),
      publish: {
        provider: 's3',
        bucket: bucket,
        region: 'us-west-1'
      }
    }
  }
}

const buildParams = makeBuildParams(program.env === 'production')

if (program.mac) {
  buildParams.mac = ['default']
}
if (program.win) {
  buildParams.win = ['default']
}
if (program.linux) {
  buildParams.linux = ['default']
}

if (program.publish) {
  buildParams.publish = program.publish
}

console.log('Creating distribution with the following build params:')
console.log(buildParams)

copyBuildDir(program.env === 'production').then(() => {
  builder.build(buildParams).catch(e => {
    console.error(e)
    process.exit(1)
  })
})
