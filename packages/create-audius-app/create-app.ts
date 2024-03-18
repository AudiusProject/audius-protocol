import { red, green, cyan } from 'picocolors'
import fs from 'fs'
import path from 'path'
import { ExampleType, exampleExists, installExample } from './helpers/examples'
import { tryGitInit } from './helpers/git'
import { install } from './helpers/install'
import { isFolderEmpty } from './helpers/is-folder-empty'
import { isWriteable } from './helpers/is-writeable'
import { getOnline } from './helpers/is-online'

export class DownloadError extends Error {}

export async function createApp({
  appPath,
  example
}: {
  appPath: string
  example: ExampleType
}): Promise<void> {
  if (example) {
    const found = await exampleExists(example)

    if (!found) {
      console.error(
        `Could not locate an example named ${red(
          `"${example}"`
        )}. It could be due to the following:\n`,
        `1. Your spelling of example ${red(
          `"${example}"`
        )} might be incorrect. \n\n Double check that the example exists in https://github.com/AudiusProject/audius-protocol/tree/main/packages/create-audius-app/examples\n`
      )
      process.exit(1)
    }
  }

  const root = path.resolve(appPath)

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      'The application path is not writable, please check folder permissions and try again.'
    )
    console.error(
      'It is likely you do not have write permissions for this folder.'
    )
    process.exit(1)
  }

  const appName = path.basename(root)

  fs.mkdirSync(root, { recursive: true })
  if (!isFolderEmpty(root, appName)) {
    process.exit(1)
  }

  const isOnline = await getOnline()
  const originalDirectory = process.cwd()

  console.log(`Creating a new Audius app in ${green(root)}.`)
  console.log()

  process.chdir(root)

  try {
    console.log(
      `Copying files for example ${cyan(example)}. This might take a moment.`
    )
    console.log()
    installExample({ appName, root, isOnline, example })
  } catch (reason) {
    function isErrorLike(err: unknown): err is { message: string } {
      return (
        typeof err === 'object' &&
        err !== null &&
        typeof (err as { message?: unknown }).message === 'string'
      )
    }
    throw new DownloadError(isErrorLike(reason) ? reason.message : reason + '')
  }
  console.log('Installing packages. This might take a couple of minutes.')
  console.log()

  await install(isOnline)
  console.log()

  if (tryGitInit(root)) {
    console.log('Initialized a git repository.')
    console.log()
  }

  let cdpath: string
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName
  } else {
    cdpath = appPath
  }

  console.log(`${green('Success!')} Created ${appName} at ${appPath}`)

  console.log('Inside that directory, you can run several commands:')
  console.log()
  console.log(cyan('  npm run dev'))
  console.log('    Starts the development server.')
  console.log()
  console.log(cyan('  npm run build'))
  console.log('    Builds the app for production.')
  console.log()
  console.log(cyan('  npm run start'))
  console.log('    Runs the built app in production mode.')
  console.log()
  console.log('We suggest that you begin by typing:')
  console.log()
  console.log(cyan('  cd'), cdpath)
  console.log(`  ${cyan('npm run dev')}`)
  console.log()
}
