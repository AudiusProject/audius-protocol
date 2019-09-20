'use strict'

const ON_DEATH = require('death')

const initializeApp = require('./app')
const config = require('./config')
const txRelay = require('./txRelay')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')

const initAudiusLibs = require('./audiusLibsInstance')

let appInfo

// run all migrations
// this is a stupid solution to a timing bug, because migrations attempt to get run when
// the db port is exposed, not when it's ready to accept incoming connections. the timeout
// attempts to wait until the db is accepting connections
setTimeout(async () => {
  logger.info('Executing database migrations...')
  runMigrations().then(async () => {
    logger.info('Migrations completed successfully')

    let audiusInstance = await initAudiusLibs()

    appInfo = initializeApp(config.get('port'), audiusInstance)
  }).error((err) => {
    logger.error('Error in migrations: ', err)
    process.exit(1)
  })

  await txRelay.fundRelayerIfEmpty()

  // when app terminates, close down any open DB connections gracefully
  ON_DEATH((signal, error) => {
    // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
    // default in `npm start` command). To see messages emitted after a kill signal, do not
    // use the bunyan CLI.
    logger.info('Shutting down db and express app...')
    sequelize.close()
    appInfo.server.close()
  })
}, 2000)
