import { config } from './config'
import { Listener } from './listener'
import { logger } from './logger'
import { setupTriggers } from './setup'
import { getDB } from './conn'
import { program } from 'commander'
import { Knex } from 'knex'
import { AppNotificationsProcessor } from './processNotifications/indexAppNotifications'
import { sendDMNotifications } from './tasks/dmNotifications'
import { sendAppNotifications } from './tasks/appNotifications'

export class Processor {

  discoveryDB: Knex
  identityDB: Knex
  appNotificationsProcessor: AppNotificationsProcessor
  isRunning: boolean
  listener: Listener

  constructor() {
    this.isRunning = false
  }

  init = async () => {
    logger.info('starting!')
    // setup postgres listener
    await this.setupDB()
    await setupTriggers(this.discoveryDB)

    this.listener = new Listener()
    await this.listener.start(this.discoveryDB)

    this.appNotificationsProcessor = new AppNotificationsProcessor(this.discoveryDB, this.identityDB)
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
    this.isRunning = true
    while (this.isRunning) {
      await sendAppNotifications(this.listener, this.appNotificationsProcessor)
      await sendDMNotifications(this.discoveryDB, this.identityDB)

      // free up event loop + batch queries to postgres
      await new Promise((r) => setTimeout(r, config.pollInterval))
    }
  }

  stop = () => {
    logger.info('stopping notification processor')
    this.isRunning = false
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
