const ServiceCommands = require('../src/index')
const { program } = require('commander')
const {
  Seed
} = ServiceCommands
const { parseMetadataIntoObject } = require('../src/commands/utils')

console.warn('WARNING: `A seed` must be run from the service-commands directory. This is because of the way relative paths for node-localstorage work.')

const CLI_TO_COMMAND_MAP = {
    'upload-track': {
        api: 'Track',
        method: 'uploadTrack',
        options: [ // all of these accept user id
        'trackFile',
        'coverArtFile',
        'metadata',
        'onProgress' // pass in onProgress from wrapper?
        ]
    },
    'follow-user': {
        api: 'User',
        method: 'addUserFollow',
        options: [
        'followeeUserId'
        ]
    },
    'add-track-repost': {
        api: 'Track',
        method: 'addTrackRepost',
        options: [
         'trackId'
        ]
    }
}

program
    .command('create-user')
    .description('Create a user and set them to the new active user. If no options are provided, seed will generate values and write them to file.')
    .option(
      '-a, --user-alias <alias>',
      'alias by which to reference user for this seed session. If you do not specify an alias, alias used will be user entropy key.',
      null
    )
    .option(
      '-e, --email <email>',
      'email for user account creation',
      ''
    )
    .option(
      '-p, --password <password>',
      'password for user account',
      ''
    )
    .option(
      '-m, --metadata <metadata-object>',
      'metadata to associate with user. Write this as a series of comma-separated key-values e.g. -m email=test@audius.co,password=2343,handle=christinus,is_verified=true',
      parseMetadataIntoObject
    )
    .action(async (opts) => {
      const { userAlias: alias, ...options } = opts.opts()
      const seed = new Seed()
      await seed.init()
      await seed.createUser(alias, options)
      process.exit(0)
    })

program
    .command('clear')
    .description('Clears seed session and all locally cached data.')
    .action(async (opts) => {
      // TODO add reset state
      const seed = new Seed()
      await seed.clearSession()
      process.exit(0)
    })

program
    .command('set-user')
    .description('Set user as active for all following seed actions. Reference a user by either user ID or alias.')
    .option(
      '-a, --user-alias <alias>',
      'alias of user to set as active',
      null
    )
    .option(
      '-id, --user-id <number>',
      'ID of user to set as active',
      null
    )
    .action(async (opts) => {
      const { userAlias: alias, userId } = opts.opts()
      console.log(alias, userId, 'asdsadsdsd')
      if (!alias && !userId) {
        throw new Error('Seed CLI: to set-user you must provide either a user ID or user alias of user to set as active.')
      } else {
        const seed = new Seed()
        await seed.setUser({ alias, userId })
      }
    })

// entrypoint
program.parse(process.argv)

