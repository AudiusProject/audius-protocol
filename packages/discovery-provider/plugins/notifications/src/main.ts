import { Knex } from 'knex'
import moment from 'moment-timezone'
import { config } from './config'
import { Listener } from './listener'
import { logger } from './logger'
import { setupTriggers } from './setup'
import { getDB } from './conn'

import { AppNotificationsProcessor } from './processNotifications/indexAppNotifications'
import { sendDMNotifications } from './tasks/dmNotifications'
import { processEmailNotifications } from './email/notifications/index'
import { sendAppNotifications } from './tasks/appNotifications'
import {
  BrowserPluginMappings,
  BrowserPushPlugin,
  EmailPluginMappings,
  NotificationsEmailPlugin,
  RemoteConfig
} from './remoteConfig'
import { Server } from './server'
import { configureWebPush } from './web'
import { configureAnnouncement } from './processNotifications/mappers/announcement'
import { logMemStats } from './utils/memStats'

export class Processor {
  discoveryDB: Knex
  identityDB: Knex
  appNotificationsProcessor: AppNotificationsProcessor
  isRunning: boolean
  listener: Listener
  lastDailyEmailSent: moment.Moment | null
  lastWeeklyEmailSent: moment.Moment | null
  remoteConfig: RemoteConfig
  server: Server

  constructor() {
    this.isRunning = false
    this.lastDailyEmailSent = null
    this.lastWeeklyEmailSent = null
    this.remoteConfig = new RemoteConfig()
    this.server = new Server()
  }

  init = async ({
    discoveryDBUrl,
    identityDBUrl
  }: {
    discoveryDBUrl?: string
    identityDBUrl?: string
  } = {}) => {
    await this.remoteConfig.init()

    logger.info('starting up!!!')

    // setup postgres listener
    await this.setupDB({ discoveryDBUrl, identityDBUrl })

    // setup browser push
    configureWebPush()

    // setup announcements
    configureAnnouncement()

    // log memory stats on startup
    logMemStats()

    // Comment out to prevent app notifications until complete
    this.listener = new Listener()
    await this.listener.start(discoveryDBUrl || process.env.DN_DB_URL)
    await setupTriggers(this.discoveryDB)
    this.appNotificationsProcessor = new AppNotificationsProcessor(
      this.discoveryDB,
      this.identityDB,
      this.remoteConfig
    )
    await this.server.init()
  }

  setupDB = async ({
    discoveryDBUrl,
    identityDBUrl
  }: {
    discoveryDBUrl?: string
    identityDBUrl?: string
  } = {}) => {
    const discoveryDBConnection = discoveryDBUrl || process.env.DN_DB_URL
    const identityDBConnection = identityDBUrl || process.env.IDENTITY_DB_URL
    this.discoveryDB = await getDB(discoveryDBConnection)
    this.identityDB = await getDB(identityDBConnection)
  }

  getIsScheduledEmailEnabled() {
    const isEnabled = this.remoteConfig.getFeatureVariableEnabled(
      NotificationsEmailPlugin,
      EmailPluginMappings.Scheduled
    )
    // If the feature does not exist in remote config, then it returns null
    // In that case, set to false bc we want to explicitly set to true
    return Boolean(isEnabled)
  }

  getIsBrowserPushEnabled(): boolean {
    const isEnabled = this.remoteConfig.getFeatureVariableEnabled(
      BrowserPushPlugin,
      BrowserPluginMappings.Enabled
    )
    return Boolean(isEnabled)
  }

  /**
   * Starts the app push notifications
   */
  start = async () => {
    // process events
    logger.info('processing events')
    this.isRunning = true
    while (this.isRunning) {
      logger.info('Processing app notifications (new)')
      await sendAppNotifications(this.listener, this.appNotificationsProcessor)
      logger.info('Processing app notifications (needs reprocessing)')
      await this.appNotificationsProcessor.reprocess()

      logger.info('Processing DM notifications')
      await sendDMNotifications(
        this.discoveryDB,
        this.identityDB,
        this.getIsBrowserPushEnabled()
      )

      if (
        this.getIsScheduledEmailEnabled() &&
        (!this.lastDailyEmailSent ||
          this.lastDailyEmailSent < moment.utc().subtract(1, 'days'))
      ) {
        logger.info('Processing daily emails...')
        processEmailNotifications(
          this.discoveryDB,
          this.identityDB,
          'daily',
          this.remoteConfig
        )
        this.lastDailyEmailSent = moment.utc()
      }

      if (
        this.getIsScheduledEmailEnabled() &&
        (!this.lastWeeklyEmailSent ||
          this.lastWeeklyEmailSent < moment.utc().subtract(7, 'days'))
      ) {
        logger.info('Processing weekly emails')
        // fire and forget so other notifs can process
        processEmailNotifications(
          this.discoveryDB,
          this.identityDB,
          'weekly',
          this.remoteConfig
        )
        this.lastWeeklyEmailSent = moment.utc()
      }
      // free up event loop + batch queries to postgres
      await new Promise((r) => setTimeout(r, config.pollInterval))
    }
  }

  stop = () => {
    logger.info('stopping notification processor')
    this.isRunning = false
  }

  close = async () => {
    this.remoteConfig.close()
    await this.listener?.close()
    await this.discoveryDB?.destroy()
    await this.identityDB?.destroy()
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
