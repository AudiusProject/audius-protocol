const fs = require('fs')
const { program, option } = require('commander')
const ServiceCommands = require('../src/index')
const _ = require('lodash')
const colors = require('colors')

const {
    SeedSession,
    RandomUtils,
    SeedUtils,
    Constants
} = ServiceCommands

const {
  parseMetadataIntoObject,
  camelToKebabCase,
  getProgressCallback,
  parseSeedActionRepeatCount,
  getUserProvidedOrRandomTrackFile,
  getUserProvidedOrRandomImageFile,
  getUserProvidedOrRandomTrackMetadata,
  getRandomUserIdFromCurrentSeedSessionCache,
  getRandomTrackIdFromCurrentSeedSessionCache,
  passThroughUserInput
} = SeedUtils

const {
  SERVICE_COMMANDS_PATH
} = Constants

// Setting pretty print colors
colors.setTheme({
  happy: 'rainbow',
  success: 'green',
  info: 'magenta',
  error: 'red'
})

const checkExecutedFromCorrectDirectory = () => {
  if (process.cwd() !== SERVICE_COMMANDS_PATH) {
    throw new Error(
      '`A seed` must be run from the service-commands directory. This is because of the way relative paths for node-localstorage work.'.error
    )
  }
}

// This is the entrypoint for adding new methods.

// params must be in order of original params in fn signature of libs API method
// all commands accept -id or --user-id param to set user that is performing the action.

// each param has an optional defaultHandler which combines/handles user-provided value asynchronously/
// provides randomized or default value for option when user-provided value is unavailable.
const CLI_TO_COMMAND_MAP = {
  'upload-track': {
    api: 'Track',
    description: 'upload track with dummy audio and cover art file',
    method: 'uploadTrack',
    params: [
      {
        name: 'trackFile',
        description: 'path to track file on local FS',
        userInputHandler: fs.ensureFileSync,
        defaultHandler: getUserProvidedOrRandomTrackFile,
        // successHandler:
      },
      {
        name: 'coverArtFile',
        description: 'path to cover art file on local FS',
        userInputHandler: fs.ensureFileSync,
        defaultHandler: getUserProvidedOrRandomImageFile,
      },
      {
        name: 'metadata',
        description: 'metadata for track in comma-separated string',
        userInputHandler: parseMetadataIntoObject,
        defaultHandler: getUserProvidedOrRandomTrackMetadata,
      },
      {
        name: 'onProgress',
        description: 'non-configurable; this is hardcoded to log out upload progress to console',
        defaultHandler: getProgressCallback
      }
    ]
  },
  'follow-user': {
    api: 'User',
    description: 'follow user',
    method: 'addUserFollow',
    params: [
      {
        name: 'followeeUserId',
        description: 'user ID of user receiving the follow',
        defaultHandler: getRandomUserIdFromCurrentSeedSessionCache
      }
    ]
  },
  'repost-track': {
    api: 'Track',
    description: 'add track repost by user',
    method: 'addTrackRepost',
    params: [
      {
        name: 'trackId',
        description: 'track ID of track receiving the repost',
        defaultHandler: getRandomTrackIdFromCurrentSeedSessionCache
      }
    ]
  }
}

program
  .command('create-user')
  .description(
    'Create a user and set them to the new active user. If no options are provided, seed will generate values and write them to file.'
  )
  .option(
    '-a, --user-alias <alias>',
    'alias by which to reference user for this seed session. If you do not specify an alias, alias used will be user entropy key.',
    null
  )
  .option('-e, --email <email>', 'email for user account creation', '')
  .option('-p, --password <password>', 'password for user account', '')
  .option('-n, --count <count>', 'number of random users to create', parseSeedActionRepeatCount, 1)
  .option(
    '-m, --metadata <metadata-object>',
    'metadata to associate with user. Write this as a series of comma-separated key-values e.g. -m email=test@audius.co,password=2343,handle=christinus,is_verified=true',
    parseMetadataIntoObject
  )
  .action(async opts => {
    const { userAlias: alias, count, ...options } = opts.opts()
    const createSingleUser = async (alias, options) => {
      console.log(`Creating user with alias ${alias} and options: ${JSON.stringify(options)}`.info)
      const seed = new SeedSession()
      await seed.init()
      await seed.createUser(alias, options)
      console.log('Created user!'.success)
    }
    console.log(`Creating ${count} user(s)...`.info)
    for (const n of _.range(1, count + 1)) {
      const createdUserAlias = n > 1 ? `${alias}-${n}` : alias
      await createSingleUser(createdUserAlias, options)
    }
    console.log(`Created ${count} user(s) successfully!`.happy)
    process.exit(0)
  })

program
  .command('clear')
  .description('Clears seed session and all locally cached data.')
  .option('-f, --reset-state', 'whether to reset state on local DB', false)
  .action(async opts => {
    // TODO add reset state
    console.log('Clearing seed session...'.info)
    const seed = new SeedSession()
    await seed.clearSession()
    console.log('Seed session cleared.'.happy)
    process.exit(0)
  })

program
  .command('set-user')
  .description(
    'Set user as active for all following seed actions. Reference a user by either user ID or alias.'
  )
  .option('-a, --user-alias <alias>', 'alias of user to set as active', null)
  .option('-id, --user-id <number>', 'ID of user to set as active', null)
  .action(async opts => {
    const { userAlias: alias, userId } = opts.opts()
    if (!alias && !userId) {
      throw new Error(
        'Seed CLI: to set-user you must provide either a user ID or user alias of user to set as active.'
      )
    } else {
      console.log(
        `Setting active user for seed session to userId ${userId} / alias ${alias}.`.info
      )
      const seed = new SeedSession()
      await seed.setUser({ alias, userId })
      console.log(
        `Active user for seed session set to userId ${userId} / alias ${alias}.`.success
      )
      process.exit(0)
    }
  })

Object.entries(CLI_TO_COMMAND_MAP).forEach(
  ([cliCommand, { api, description, method, params }]) => {
    let configuredProgram = program
      .command(cliCommand)
      .description(description)
      .option(
        '-id, --user-id <number>',
        'ID of user to set as active when performing action',
        null
      )

    params.forEach(param => {
      let { name, description, userInputHandler } = param
      if (!userInputHandler) {
        userInputHandler = passThroughUserInput
      }
      const cliOption = camelToKebabCase(name)
      const shortOption = cliOption.charAt(0)
      configuredProgram = configuredProgram.option(
        `-${shortOption} --${cliOption} <value>`,
        description,
        userInputHandler,
        ''
      )
    })

    configuredProgram.action(async opts => {
      const { userId, ...options } = opts.opts()
      const seed = new SeedSession()
      console.log(`Running seed ${cliCommand} with options: ${JSON.stringify(options)}`)
      let userIdToSet = userId
      if (!userIdToSet) {
        // try to set from cache
        console.log(
          'No user ID for action specified; trying to get active user from seed local cache...'.info
        )
        const activeUser = seed.cache.getActiveUser()
        if (!activeUser.hedgehogEntropyKey) {
          throw new Error(
            `There is no active user in seed local cache. Please rerun the 'seed ${cliCommand}' command with --user-id or -id flag or run 'seed set-user' with alias or id flag first to set active user.`.error
          )
        }
        userIdToSet = activeUser.userId
      }
      await seed.setUser({ userId: userIdToSet })
      console.log(`Calling libs.${api}.${method} to seed...`.info)
      // TODO pass through current seed session so that helper methods to handle options can pull from cache
      for (const option of Object.entries(options)) {
        let [optionName, userProvidedValue] = option
        const defaultHandler = params.find(param => param.name === optionName).defaultHandler || passThroughUserInput
        options[optionName] = await defaultHandler(userProvidedValue)
      }
      await seed.libs[api][method](...Object.values(options))
      // TODO record in cache somehow?
    })
  }
)
// entrypoint
checkExecutedFromCorrectDirectory()
program.parse(process.argv)
