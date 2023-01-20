import { Listener } from './listener'
import { run } from 'graphile-worker'
import { logger } from './logger'
import { setupTriggers } from './setup'
import { getDB } from './conn'
import { program } from 'commander'
import { Knex } from 'knex'
import { AppNotifications } from './appNotifications'

export class Processor {

  discoveryDB: Knex
  identityDB: Knex
  appNotifications: AppNotifications
  isRunning: boolean
  listener: Listener

  init = async () => {
    logger.info('starting!')
    // setup postgres listener
    await this.setupDB()
    await setupTriggers(this.discoveryDB)

    this.listener = new Listener()
    await this.listener.start(this.discoveryDB)

    this.appNotifications = new AppNotifications(this.discoveryDB, this.identityDB)
  }

  setupDB = async () => {
    const discoveryDBConnection = process.env.DN_DB_URL
    const identityDBConnection = process.env.IDENTITY_DB_URL

    this.discoveryDB = await getDB(discoveryDBConnection)
    this.identityDB = await getDB(identityDBConnection)

  }

  start = async () => {
    // process events
    logger.info('processing events')
    const runner = await run({
      connectionString: process.env.DN_DB_URL,
      noHandleSignals: false,
      pollInterval: 2000,
      taskDirectory: `${__dirname}/../tasks`
    })

    while (true) {
      await runner.addJob("appNotifications", {
        appNotifications: this.appNotifications,
      })
      await runner.addJob("dmNotifications")
      await runner.promise // TODO remove
    }
  }

}

async function main() {
  try {
    const processor = new Processor()
    await processor.init()
    await processor.start()
  } catch (e) {
    logger.fatal(e, 'save me pm2')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

process
  .on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'unhandledRejection')
  })
  .on('uncaughtException', (err) => {
    logger.fatal(err, 'uncaughtException')
    process.exit(1)
  })
