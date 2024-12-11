import { Client, Notification } from 'pg'
import { Knex } from 'knex'
import { logger } from './logger'
import { PushNotificationBadgeCountRow } from './types/identity'

export class NotificationSeenListener {
  connectionString: string
  client: Client
  identityDB: Knex

  constructor(identityDB: Knex) {
    this.identityDB = identityDB
  }

  start = async (connectionString: string) => {
    this.connectionString = connectionString

    this.client = new Client({
      connectionString,
      application_name: 'notification_seen'
    })
    logger.info('made client')
    await this.client.connect()
    logger.info('did connect')

    this.client.on('notification', async (msg: Notification) => {
      // Only process events from notification_seen table
      if (msg.channel !== 'notification_seen') return

      const { user_id }: { user_id: number } = JSON.parse(msg.payload)
      await this.updateBadgeCount(user_id)
    })

    const sql = 'LISTEN notification_seen;'
    await this.client.query(sql)
    logger.info('LISTENER Started')
  }

  updateBadgeCount = async (userId: number) => {
    try {
      const now = new Date()
      await this.identityDB<PushNotificationBadgeCountRow>(
        'PushNotificationBadgeCounts'
      )
        .insert({
          userId,
          iosBadgeCount: 0,
          createdAt: now,
          updatedAt: now
        })
        .onConflict('userId')
        .merge({
          iosBadgeCount: 0,
          updatedAt: now
        })
      logger.info(`Updated badge count to 0 for user ${userId}`)
    } catch (e) {
      logger.error(`Failed to update badge count for user ${userId}: ${e}`)
    }
  }

  close = async () => {
    await this.client?.end()
    this.client = null
  }
}
